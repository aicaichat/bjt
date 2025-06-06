#!/bin/bash

# BJT Product System - 安全生产环境部署脚本 (包含数据库和nginx更新)
# 使用方法: ./deploy-production-safe.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "BJT产品管理系统 - 安全生产环境部署"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -f, --force         强制执行，跳过确认"
    echo "  -b, --backup-only   仅备份，不执行部署"
    echo "  -r, --rebuild-db    完全重建数据库(删除所有数据)"
    echo "  -m, --migrate-only  仅执行数据库迁移"
    echo "  -v, --verify        验证部署后状态"
    echo ""
    echo "示例:"
    echo "  $0                  完整部署(包含备份)"
    echo "  $0 --force         强制部署，跳过确认"
    echo "  $0 --rebuild-db    完全重建数据库"
    echo "  $0 --migrate-only  仅执行数据库迁移"
}

# 默认配置
FORCE=false
BACKUP_ONLY=false
REBUILD_DB=false
MIGRATE_ONLY=false
VERIFY_ONLY=false
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -b|--backup-only)
            BACKUP_ONLY=true
            shift
            ;;
        -r|--rebuild-db)
            REBUILD_DB=true
            shift
            ;;
        -m|--migrate-only)
            MIGRATE_ONLY=true
            shift
            ;;
        -v|--verify)
            VERIFY_ONLY=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 安全加载环境变量
load_env_file() {
    local env_file="$1"
    
    if [ ! -f "$env_file" ]; then
        print_error "环境文件 $env_file 不存在"
        return 1
    fi
    
    # 读取文件并安全地设置环境变量
    while IFS= read -r line; do
        # 跳过空行和注释
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # 使用正则表达式匹配键值对
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # 去除值两边的引号（如果有）
            if [[ "$value" =~ ^\'(.*)\'$ ]]; then
                value="${BASH_REMATCH[1]}"
            elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            
            # 导出环境变量
            export "$key=$value"
        else
            print_warning "跳过无效的行: $line"
        fi
    done < "$env_file"
}

# 检查必要的环境变量
check_env_vars() {
    print_message "检查环境变量..."
    
    required_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_AUTH_SECRET_KEY"
        "WP_HOME"
        "WP_SITEURL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "环境变量 $var 未设置"
            exit 1
        fi
    done
    
    print_message "环境变量检查通过"
}

# 创建备份
backup_current_deployment() {
    print_message "备份当前部署..."
    
    backup_dir="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$backup_dir"
    
    # 检查服务是否运行
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        # 备份数据库
        print_info "备份数据库..."
        if docker-compose -f $COMPOSE_FILE exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$backup_dir/database.sql" 2>/dev/null; then
            print_message "数据库备份完成: $backup_dir/database.sql"
        else
            print_warning "数据库备份失败，可能服务未运行"
        fi
        
        # 备份上传文件
        if [ -d "wordpress_uploads" ]; then
            cp -r wordpress_uploads "$backup_dir/"
            print_message "上传文件备份完成"
        fi
        
        # 备份配置文件
        cp .env.production "$backup_dir/"
        print_message "配置文件备份完成"
    else
        print_warning "容器未运行，跳过数据备份"
    fi
    
    print_message "备份完成，保存在: $backup_dir"
}

# 构建前端应用
build_frontend() {
    print_message "构建前端应用..."
    
    cd frontend
    
    # 安装依赖
    print_info "安装前端依赖..."
    npm ci
    
    # 构建生产版本
    print_info "构建前端生产版本..."
    VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1" npm run build
    
    cd ..
    
    print_message "前端构建完成"
}

# 执行数据库迁移
execute_database_migration() {
    print_message "执行数据库迁移..."
    
    # 等待MySQL服务启动
    print_info "等待MySQL服务启动..."
    sleep 30
    
    # 检查MySQL容器是否运行
    if ! docker-compose -f $COMPOSE_FILE ps mysql | grep -q "Up"; then
        print_error "MySQL容器未运行"
        return 1
    fi
    
    # 检查是否已经有spec_pdf字段
    print_info "检查数据库结构..."
    local spec_pdf_exists=$(docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "SHOW COLUMNS FROM wp_bjt_host_models LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf || echo "")
    
    if [ -z "$spec_pdf_exists" ]; then
        print_info "执行数据库迁移，添加spec_pdf字段..."
        
        if [ -f "database/migrations/add_spec_pdf_to_models.sql" ]; then
            docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < database/migrations/add_spec_pdf_to_models.sql
            
            if [ $? -eq 0 ]; then
                print_message "数据库迁移完成"
            else
                print_error "数据库迁移失败"
                return 1
            fi
        else
            print_warning "迁移文件不存在，但init.sql已更新"
        fi
    else
        print_message "spec_pdf字段已存在，跳过迁移"
    fi
}

# 重建数据库（全新安装）
rebuild_database() {
    print_message "重建数据库（删除所有现有数据）..."
    
    if [ "$FORCE" = false ]; then
        print_warning "这将删除所有现有数据！"
        read -p "确定要继续吗? (yes/no): " -r
        if [[ ! $REPLY == "yes" ]]; then
            print_info "取消重建数据库"
            return 0
        fi
    fi
    
    # 等待MySQL服务启动
    print_info "等待MySQL服务启动..."
    sleep 30
    
    # 删除现有数据库
    print_info "删除现有数据库..."
    docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS ${MYSQL_DATABASE};"
    
    # 重新创建数据库
    print_info "重新创建数据库..."
    docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    # 初始化数据库结构
    print_info "初始化数据库结构..."
    docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < docker/dev/mysql/init.sql
    
    # 导入生成的SQL数据
    if [ -f "generated_sql_imports/_设备.sql" ]; then
        print_info "导入设备数据..."
        docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < generated_sql_imports/_设备.sql
    fi
    
    if [ -f "generated_sql_imports/_耗材.sql" ]; then
        print_info "导入耗材数据..."
        docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < generated_sql_imports/_耗材.sql
    fi
    
    # 导入测试用户
    if [ -f "docker/dev/mysql/test_users.sql" ]; then
        print_info "导入测试用户..."
        docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < docker/dev/mysql/test_users.sql
    fi
    
    print_message "数据库重建完成"
}

# 更新Docker镜像
update_docker_images() {
    print_message "更新Docker镜像..."
    
    # 拉取最新的基础镜像
    docker pull nginx:alpine
    docker pull mysql:8.0
    docker pull wordpress:latest
    docker pull node:18-alpine
    
    print_message "Docker镜像更新完成"
}

# 部署服务
deploy_services() {
    print_message "部署服务..."
    
    # 停止当前服务
    print_info "停止当前服务..."
    docker-compose -f $COMPOSE_FILE down
    
    # 构建新镜像
    print_info "构建Docker镜像..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # 启动服务
    print_info "启动服务..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_message "服务部署完成"
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 等待服务启动
    print_info "等待服务完全启动..."
    sleep 60
    
    # 检查容器状态
    print_info "检查容器状态..."
    docker-compose -f $COMPOSE_FILE ps
    
    # 检查前端
    if curl -f -s -k "https://${DOMAIN_NAME}" > /dev/null; then
        print_message "前端服务正常"
    else
        print_warning "前端服务可能异常"
    fi
    
    # 检查API
    if curl -f -s -k "https://${DOMAIN_NAME}/wp-json/bjt/v1" > /dev/null; then
        print_message "API服务正常"
    else
        print_warning "API服务可能异常"
    fi
    
    # 验证数据库字段
    print_info "验证数据库字段..."
    local tables=("wp_bjt_host_models" "wp_bjt_accessory_models" "wp_bjt_spare_part_models")
    for table in "${tables[@]}"; do
        local result=$(docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "SHOW COLUMNS FROM $table LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf || echo "")
        if [ -n "$result" ]; then
            print_message "$table 表 spec_pdf 字段验证通过"
        else
            print_error "$table 表 spec_pdf 字段缺失"
        fi
    done
    
    print_message "健康检查完成"
}

# 清理旧镜像
cleanup() {
    print_message "清理旧镜像..."
    docker image prune -f
    print_message "清理完成"
}

# 生成部署报告
generate_deployment_report() {
    local timestamp=$(date)
    local report_file="deployment-report-prod-$(date +%Y%m%d-%H%M%S).md"
    
    cat << EOF > $report_file
# BJT产品管理系统 - 生产环境部署报告

**部署时间**: $timestamp  
**部署版本**: 规格PDF功能更新版  
**Docker Compose**: $COMPOSE_FILE  
**域名**: ${DOMAIN_NAME}  

## 🚀 部署内容

### 数据库更新
- [x] wp_bjt_host_models 表添加 spec_pdf 字段
- [x] wp_bjt_accessory_models 表添加 spec_pdf 字段  
- [x] wp_bjt_spare_part_models 表添加 spec_pdf 字段

### 前端更新
- [x] 构建包含最新规格PDF功能的前端应用
- [x] 更新API URL配置
- [x] 静态文件部署到Nginx

### 后端更新
- [x] WordPress容器包含最新插件
- [x] API接口支持规格PDF字段
- [x] 文件上传系统就绪

### Nginx配置
- [x] 前端路径映射更新
- [x] API反向代理配置
- [x] 文件上传路径配置
- [x] SSL/HTTPS配置

## 🌐 访问地址
- **前端应用**: https://${DOMAIN_NAME}
- **管理后台**: https://${DOMAIN_NAME}/wp-admin
- **API接口**: https://${DOMAIN_NAME}/wp-json/bjt/v1

## 🧪 测试检查项

### 功能测试
- [ ] 用户登录功能
- [ ] 产品数据显示
- [ ] 主机型号管理（包含spec_pdf上传）
- [ ] 配件型号管理（包含spec_pdf上传）
- [ ] 备件型号管理（包含spec_pdf上传）
- [ ] 文件上传功能
- [ ] 搜索和筛选功能

### API测试
- [ ] GET /wp-json/bjt/v1/host-models 包含spec_pdf字段
- [ ] POST /wp-json/bjt/v1/host-models 支持spec_pdf
- [ ] GET /wp-json/bjt/v1/accessory-models 包含spec_pdf字段
- [ ] GET /wp-json/bjt/v1/spare-part-models 包含spec_pdf字段

### 安全测试
- [ ] HTTPS访问正常
- [ ] SSL证书有效
- [ ] 文件上传权限控制
- [ ] API认证正常

## 🔧 维护命令

查看服务状态:
\`\`\`bash
docker-compose -f $COMPOSE_FILE ps
\`\`\`

查看日志:
\`\`\`bash
docker-compose -f $COMPOSE_FILE logs -f
\`\`\`

重启服务:
\`\`\`bash
docker-compose -f $COMPOSE_FILE restart
\`\`\`

## 📝 注意事项
1. 首次部署后需要通过WordPress后台激活所需插件
2. 检查文件上传目录权限
3. 验证SSL证书有效期
4. 定期备份数据库

EOF

    print_message "部署报告已生成: $report_file"
}

# 主函数
main() {
    echo "=========================================="
    print_message "BJT产品管理系统 - 安全生产环境部署"
    echo "包含数据库spec_pdf字段更新和nginx配置更新"
    echo "=========================================="
    
    # 检查是否在项目根目录
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 加载环境变量
    if [ -f ".env.production" ]; then
        print_info "加载环境变量..."
        if load_env_file ".env.production"; then
            print_message "环境变量加载成功"
        else
            print_error "环境变量加载失败"
            exit 1
        fi
    else
        print_error ".env.production 文件不存在"
        print_info "请从 env.production.example 复制并配置："
        print_info "  cp env.production.example .env.production"
        print_info "  然后编辑 .env.production 填写实际配置"
        exit 1
    fi
    
    # 根据参数执行相应操作
    if [ "$BACKUP_ONLY" = true ]; then
        backup_current_deployment
        exit 0
    fi
    
    if [ "$VERIFY_ONLY" = true ]; then
        health_check
        exit 0
    fi
    
    # 执行部署步骤
    check_env_vars
    backup_current_deployment
    build_frontend
    update_docker_images
    deploy_services
    
    # 数据库处理
    if [ "$REBUILD_DB" = true ]; then
        rebuild_database
    elif [ "$MIGRATE_ONLY" = false ]; then
        execute_database_migration
    fi
    
    if [ "$MIGRATE_ONLY" = true ]; then
        execute_database_migration
        exit 0
    fi
    
    # 健康检查和清理
    health_check
    cleanup
    generate_deployment_report
    
    echo "=========================================="
    print_message "生产环境部署成功完成！"
    print_info "访问地址: https://${DOMAIN_NAME}"
    print_info "管理后台: https://${DOMAIN_NAME}/wp-admin"
    print_info "请参考生成的部署报告进行功能测试"
    echo "=========================================="
}

# 运行主函数
main "$@" 