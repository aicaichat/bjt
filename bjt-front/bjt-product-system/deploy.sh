#!/bin/bash
# BJT产品管理系统生产环境部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查必要的工具
check_requirements() {
    print_message "检查系统要求..."
    
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
    print_message "检查环境配置文件..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_message "请复制 env.production.example 为 .env.production 并配置相应的值"
        exit 1
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

# 检查SSL证书
check_ssl_certificates() {
    print_message "检查SSL证书..."
    
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
        print_message "SSL证书文件存在"
    fi
}

# 停止现有服务
stop_services() {
    print_message "停止现有服务..."
    
    if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
        docker-compose -f docker/prod/docker-compose.prod.yml down
    fi
    
    print_message "现有服务已停止"
}

# 备份数据库
backup_database() {
    if docker-compose -f docker/prod/docker-compose.prod.yml ps mysql | grep -q "Up"; then
        print_message "备份现有数据库..."
        
        # 创建备份目录
        mkdir -p backups
        
        # 执行备份
        docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
            mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} \
            > backups/backup_before_deploy_$(date +%Y%m%d_%H%M%S).sql
        
        print_message "数据库备份完成"
    fi
}

# 启动服务
start_services() {
    print_message "启动生产环境服务..."
    
    # 拉取最新镜像
    docker-compose -f docker/prod/docker-compose.prod.yml pull
    
    # 构建自定义镜像
    docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
    
    # 启动服务
    docker-compose -f docker/prod/docker-compose.prod.yml up -d
    
    print_message "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message "等待服务就绪..."
    
    # 等待MySQL就绪
    print_message "等待MySQL服务..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待WordPress就绪
    print_message "等待WordPress服务..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/wp-admin/admin-ajax.php &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "WordPress服务启动超时"
        exit 1
    fi
    
    print_message "所有服务已就绪"
}

# 显示部署信息
show_deployment_info() {
    print_message "部署完成！"
    echo ""
    echo "访问信息："
    echo "  前端应用: https://${DOMAIN_NAME}"
    echo "  WordPress管理后台: https://${DOMAIN_NAME}/wp-admin"
    echo "  API接口: https://${DOMAIN_NAME}/wp-json/bjt/v1"
    echo ""
    echo "服务状态："
    docker-compose -f docker/prod/docker-compose.prod.yml ps
    echo ""
    echo "查看日志："
    echo "  docker-compose -f docker/prod/docker-compose.prod.yml logs -f"
    echo ""
    echo "停止服务："
    echo "  docker-compose -f docker/prod/docker-compose.prod.yml down"
}

# 主函数
main() {
    print_message "开始部署 BJT 产品管理系统..."
    
    # 检查系统要求
    check_requirements
    
    # 检查环境配置
    check_env_file
    
    # 检查SSL证书
    check_ssl_certificates
    
    # 备份数据库（如果存在）
    backup_database
    
    # 停止现有服务
    stop_services
    
    # 启动新服务
    start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main "$@"
