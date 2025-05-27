#!/bin/bash
# BJT产品管理系统生产环境部署脚本（包含数据库自动初始化）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示脚本介绍
show_intro() {
    echo "=================================================="
    echo "  BJT产品管理系统 - 数据库自动初始化部署脚本"
    echo "=================================================="
    echo ""
    echo "此脚本将："
    echo "  ✅ 自动检查系统要求和配置"
    echo "  ✅ 自动初始化数据库结构"
    echo "  ✅ 自动导入设备和耗材数据"
    echo "  ✅ 启动完整的生产环境"
    echo "  ✅ 验证部署结果"
    echo ""
}

# 检查必要的工具
check_requirements() {
    print_step "检查系统要求..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "系统要求检查通过"
}

# 检查环境配置文件
check_env_file() {
    print_step "检查环境配置文件..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_message "请复制 env.production.example 为 .env.production 并配置相应的值"
        
        if [ -f "env.production.example" ]; then
            print_message "正在复制示例配置文件..."
            cp env.production.example .env.production
            print_warning "请编辑 .env.production 文件，设置正确的域名和密码"
            print_warning "按 Enter 键继续，或 Ctrl+C 退出去编辑配置文件"
            read -p ""
        else
            exit 1
        fi
    fi
    
    # 检查必要的环境变量
    source .env.production
    
    if [ -z "$MYSQL_ROOT_PASSWORD" ] || [ "$MYSQL_ROOT_PASSWORD" = "your_secure_root_password_here" ]; then
        print_error "请在 .env.production 中设置安全的 MYSQL_ROOT_PASSWORD"
        exit 1
    fi
    
    if [ -z "$DOMAIN_NAME" ] || [ "$DOMAIN_NAME" = "your-domain.com" ]; then
        print_error "请在 .env.production 中设置正确的 DOMAIN_NAME"
        exit 1
    fi
    
    print_message "环境配置文件检查通过"
}

# 检查数据库初始化文件
check_db_files() {
    print_step "检查数据库初始化文件..."
    
    # 检查必要的SQL文件
    if [ ! -f "docker/dev/mysql/init.sql" ]; then
        print_warning "init.sql 文件不存在，数据库结构可能无法正确初始化"
    else
        print_message "✅ 数据库结构文件存在"
    fi
    
    if [ ! -f "generated_sql_imports/_设备.sql" ]; then
        print_warning "⚠️ _设备.sql 文件不存在，设备数据将不会被导入"
    else
        print_message "✅ 设备数据文件存在"
    fi
    
    if [ ! -f "generated_sql_imports/_耗材.sql" ]; then
        print_warning "⚠️ _耗材.sql 文件不存在，耗材数据将不会被导入"
    else
        print_message "✅ 耗材数据文件存在"
    fi
    
    # 检查初始化脚本
    if [ ! -f "docker/mysql/init-db.sh" ]; then
        print_error "数据库初始化脚本不存在"
        exit 1
    else
        print_message "✅ 数据库初始化脚本存在"
    fi
    
    print_message "数据库文件检查完成"
}

# 检查SSL证书
check_ssl_certificates() {
    print_step "检查SSL证书..."
    
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
        print_warning "SSL证书文件不存在，将创建自签名证书用于测试"
        
        # 创建SSL目录
        mkdir -p nginx/ssl
        
        # 生成自签名证书
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/private.key \
            -out nginx/ssl/cert.pem \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=${DOMAIN_NAME}"
        
        print_warning "已生成自签名证书，生产环境请使用正式的SSL证书"
    else
        print_message "✅ SSL证书文件存在"
    fi
}

# 停止现有服务
stop_services() {
    print_step "停止现有服务..."
    
    if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
        docker-compose -f docker/prod/docker-compose.prod.yml down
        print_message "现有服务已停止"
    else
        print_message "没有运行中的服务"
    fi
}

# 备份数据库
backup_database() {
    print_step "检查是否需要备份数据库..."
    
    if docker-compose -f docker/prod/docker-compose.prod.yml ps mysql 2>/dev/null | grep -q "Up"; then
        print_message "发现运行中的数据库，正在备份..."
        
        # 创建备份目录
        mkdir -p backups
        
        # 执行备份
        docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
            mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} \
            > backups/backup_before_deploy_$(date +%Y%m%d_%H%M%S).sql
        
        print_message "✅ 数据库备份完成"
    else
        print_message "没有运行中的数据库，跳过备份"
    fi
}

# 启动服务
start_services() {
    print_step "启动生产环境服务（包含数据库自动初始化）..."
    
    # 拉取最新镜像
    print_message "拉取最新镜像..."
    docker-compose -f docker/prod/docker-compose.prod.yml pull
    
    # 构建自定义镜像
    print_message "构建自定义镜像..."
    docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
    
    # 启动服务
    print_message "启动所有服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml up -d
    
    print_message "✅ 服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_step "等待服务就绪..."
    
    # 等待MySQL就绪
    print_message "等待MySQL服务启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            print_message "✅ MySQL服务已启动"
            break
        fi
        echo -n "."
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待数据库初始化完成
    print_message "等待数据库初始化完成..."
    timeout=180  # 增加超时时间到3分钟
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.prod.yml ps db-init | grep -q "Exit 0"; then
            print_message "✅ 数据库初始化完成"
            break
        elif docker-compose -f docker/prod/docker-compose.prod.yml ps db-init | grep -q "Exit"; then
            print_warning "数据库初始化可能失败，请检查日志"
            docker-compose -f docker/prod/docker-compose.prod.yml logs db-init
            break
        fi
        echo -n "."
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "数据库初始化超时，请检查日志"
        docker-compose -f docker/prod/docker-compose.prod.yml logs db-init
    fi
    
    # 等待WordPress就绪
    print_message "等待WordPress服务启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/wp-admin/admin-ajax.php &> /dev/null; then
            print_message "✅ WordPress服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "WordPress服务启动超时"
        exit 1
    fi
    
    print_message "✅ 所有服务已就绪"
}

# 验证数据库初始化
verify_database() {
    print_step "验证数据库初始化结果..."
    
    # 检查BJT表是否存在
    TABLE_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
        mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = '${MYSQL_DATABASE}' 
            AND table_name LIKE 'wp_bjt_%';" 2>/dev/null | tail -n 1)
    
    print_message "BJT相关表数量: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt "0" ]; then
        print_message "✅ 数据库初始化验证成功"
        
        # 显示关键表的记录数
        print_message "关键表记录数："
        docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
            mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
                USE ${MYSQL_DATABASE};
                SELECT 'wp_bjt_product_lines' as table_name, COUNT(*) as count FROM wp_bjt_product_lines
                UNION ALL
                SELECT 'wp_bjt_parts' as table_name, COUNT(*) as count FROM wp_bjt_parts
                UNION ALL
                SELECT 'wp_bjt_accessories' as table_name, COUNT(*) as count FROM wp_bjt_accessories
                UNION ALL
                SELECT 'wp_bjt_spare_parts' as table_name, COUNT(*) as count FROM wp_bjt_spare_parts;" 2>/dev/null || true
    else
        print_warning "⚠️ 数据库初始化可能不完整，请检查日志"
        docker-compose -f docker/prod/docker-compose.prod.yml logs db-init
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "=================================================="
    echo "           🎉 部署完成！"
    echo "=================================================="
    echo ""
    echo "📱 访问信息："
    echo "  前端应用: https://${DOMAIN_NAME}"
    echo "  WordPress管理后台: https://${DOMAIN_NAME}/wp-admin"
    echo "  API接口: https://${DOMAIN_NAME}/wp-json/bjt/v1"
    echo ""
    echo "🗄️ 数据库信息："
    echo "  ✅ 数据库已自动初始化"
    echo "  ✅ 包含BJT产品管理系统的完整数据结构"
    echo "  ✅ 已导入设备和耗材数据（如果文件存在）"
    echo ""
    echo "🔧 服务状态："
    docker-compose -f docker/prod/docker-compose.prod.yml ps
    echo ""
    echo "📋 常用命令："
    echo "  查看日志: docker-compose -f docker/prod/docker-compose.prod.yml logs -f"
    echo "  停止服务: docker-compose -f docker/prod/docker-compose.prod.yml down"
    echo "  重启服务: docker-compose -f docker/prod/docker-compose.prod.yml restart"
    echo "  数据库初始化日志: docker-compose -f docker/prod/docker-compose.prod.yml logs db-init"
    echo ""
    echo "🔍 故障排除："
    echo "  如果遇到问题，请查看相关日志文件"
    echo "  详细文档: DATABASE_AUTO_INIT.md"
    echo ""
}

# 主函数
main() {
    # 显示介绍
    show_intro
    
    # 检查系统要求
    check_requirements
    
    # 检查环境配置
    check_env_file
    
    # 检查数据库文件
    check_db_files
    
    # 检查SSL证书
    check_ssl_certificates
    
    # 备份现有数据库
    backup_database
    
    # 停止现有服务
    stop_services
    
    # 启动服务
    start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 验证数据库初始化
    verify_database
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main "$@" 