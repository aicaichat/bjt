#!/bin/bash
# deploy-ip.sh - IP地址部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取服务器IP地址
get_server_ip() {
    # 尝试获取公网IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
    
    # 获取内网IP
    PRIVATE_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1 | awk '{print $7}' 2>/dev/null || echo "")
    
    echo "检测到的IP地址："
    if [ ! -z "$PUBLIC_IP" ]; then
        echo "  公网IP: $PUBLIC_IP"
    fi
    if [ ! -z "$PRIVATE_IP" ]; then
        echo "  内网IP: $PRIVATE_IP"
    fi
    
    echo ""
    echo "请选择要使用的IP地址："
    echo "1) 公网IP: $PUBLIC_IP"
    echo "2) 内网IP: $PRIVATE_IP"
    echo "3) 手动输入IP地址"
    
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            if [ ! -z "$PUBLIC_IP" ]; then
                SERVER_IP=$PUBLIC_IP
            else
                print_error "无法获取公网IP"
                exit 1
            fi
            ;;
        2)
            if [ ! -z "$PRIVATE_IP" ]; then
                SERVER_IP=$PRIVATE_IP
            else
                print_error "无法获取内网IP"
                exit 1
            fi
            ;;
        3)
            read -p "请输入IP地址: " SERVER_IP
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    print_message "使用IP地址: $SERVER_IP"
}

# 创建IP配置文件
create_ip_config() {
    print_message "创建IP地址配置文件..."
    
    if [ ! -f ".env.production.ip" ]; then
        cp env.production.example .env.production.ip
    fi
    
    # 更新配置文件中的IP地址
    sed -i "s/DOMAIN_NAME=.*/DOMAIN_NAME=$SERVER_IP/" .env.production.ip
    sed -i "s|WP_HOME=.*|WP_HOME=http://$SERVER_IP|" .env.production.ip
    sed -i "s|WP_SITEURL=.*|WP_SITEURL=http://$SERVER_IP|" .env.production.ip
    sed -i "s/USE_SSL=.*/USE_SSL=false/" .env.production.ip
    
    print_message "配置文件已更新"
}

# 检查必要工具
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

# 停止现有服务
stop_services() {
    print_message "停止现有服务..."
    
    if docker-compose -f docker/prod/docker-compose.ip.yml ps | grep -q "Up"; then
        docker-compose -f docker/prod/docker-compose.ip.yml down
    fi
    
    print_message "现有服务已停止"
}

# 启动服务
start_services() {
    print_message "启动IP地址部署服务..."
    
    # 设置环境变量
    export $(cat .env.production.ip | xargs)
    
    # 构建并启动服务
    docker-compose -f docker/prod/docker-compose.ip.yml build --no-cache
    docker-compose -f docker/prod/docker-compose.ip.yml up -d
    
    print_message "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message "等待服务就绪..."
    
    # 等待MySQL就绪
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.ip.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    # 等待WordPress就绪
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/wp-admin/admin-ajax.php &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    print_message "所有服务已就绪"
}

# 显示部署信息
show_deployment_info() {
    print_message "部署完成！"
    echo ""
    echo "访问信息："
    echo "  前端应用: http://$SERVER_IP"
    echo "  WordPress管理后台: http://$SERVER_IP/wp-admin"
    echo "  API接口: http://$SERVER_IP/wp-json/bjt/v1"
    echo ""
    echo "注意事项："
    echo "  - 使用HTTP协议（无SSL加密）"
    echo "  - 确保防火墙开放80端口"
    echo "  - 如果是云服务器，检查安全组设置"
    echo ""
    echo "服务状态："
    docker-compose -f docker/prod/docker-compose.ip.yml ps
}

# 主函数
main() {
    print_message "开始IP地址部署 BJT 产品管理系统..."
    
    check_requirements
    get_server_ip
    create_ip_config
    stop_services
    start_services
    wait_for_services
    show_deployment_info
}

# 执行主函数
main "$@" 