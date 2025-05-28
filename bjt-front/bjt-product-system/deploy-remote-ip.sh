#!/bin/bash
# deploy-remote-ip.sh - 远程IP地址部署脚本（开发版本）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 获取服务器IP地址
get_server_ip() {
    print_step "检测服务器IP地址..."
    
    # 尝试获取公网IP
    PUBLIC_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || echo "")
    
    # 获取内网IP
    PRIVATE_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1 | awk '{print $7}' 2>/dev/null || echo "")
    
    echo ""
    echo "检测到的IP地址："
    if [ ! -z "$PUBLIC_IP" ]; then
        echo "  1) 公网IP: $PUBLIC_IP"
    fi
    if [ ! -z "$PRIVATE_IP" ]; then
        echo "  2) 内网IP: $PRIVATE_IP"
    fi
    echo "  3) 手动输入IP地址"
    echo ""
    
    read -p "请选择要使用的IP地址 (1-3): " choice
    
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
            if [ -z "$SERVER_IP" ]; then
                print_error "IP地址不能为空"
                exit 1
            fi
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    print_message "使用IP地址: $SERVER_IP"
}

# 创建环境配置文件
create_env_config() {
    print_step "创建环境配置文件..."
    
    if [ ! -f ".env.remote-ip" ]; then
        if [ -f "env.remote-ip.example" ]; then
            cp env.remote-ip.example .env.remote-ip
            print_message "已从示例文件创建 .env.remote-ip"
        else
            print_error "找不到 env.remote-ip.example 文件"
            exit 1
        fi
    else
        print_warning ".env.remote-ip 文件已存在，将更新IP地址配置"
    fi
    
    # 更新配置文件中的IP地址
    sed -i.bak "s/SERVER_IP=.*/SERVER_IP=$SERVER_IP/" .env.remote-ip
    
    # 生成随机密码（如果还是默认值）
    if grep -q "your_secure_root_password_here" .env.remote-ip; then
        ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i.bak "s/your_secure_root_password_here/$ROOT_PASSWORD/g" .env.remote-ip
        print_message "已生成随机数据库密码"
    fi
    
    if grep -q "your_secure_wp_password_here" .env.remote-ip; then
        WP_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i.bak "s/your_secure_wp_password_here/$WP_PASSWORD/g" .env.remote-ip
        print_message "已生成随机WordPress密码"
    fi
    
    if grep -q "your_jwt_secret_key_here" .env.remote-ip; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        sed -i.bak "s/your_jwt_secret_key_here/$JWT_SECRET/" .env.remote-ip
        print_message "已生成JWT密钥"
    fi
    
    # 清理备份文件
    rm -f .env.remote-ip.bak
    
    print_message "环境配置文件已更新"
}

# 检查必要工具
check_requirements() {
    print_step "检查系统要求..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        echo "安装命令："
        echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install docker.io"
        echo "  CentOS/RHEL: sudo yum install docker"
        echo "  macOS: brew install docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        echo "安装命令："
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行，请启动 Docker 服务"
        echo "启动命令："
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        exit 1
    fi
    
    print_message "系统要求检查通过"
}

# 检查端口占用
check_ports() {
    print_step "检查端口占用情况..."
    
    PORTS=(80 3306)
    OCCUPIED_PORTS=()
    
    for port in "${PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            OCCUPIED_PORTS+=($port)
        fi
    done
    
    if [ ${#OCCUPIED_PORTS[@]} -gt 0 ]; then
        print_warning "以下端口已被占用: ${OCCUPIED_PORTS[*]}"
        read -p "是否继续部署？(y/N): " continue_deploy
        if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
            print_message "部署已取消"
            exit 0
        fi
    else
        print_message "端口检查通过"
    fi
}

# 停止现有服务
stop_services() {
    print_step "停止现有服务..."
    
    if docker-compose -f docker/dev/docker-compose.remote-ip.yml ps | grep -q "Up"; then
        docker-compose -f docker/dev/docker-compose.remote-ip.yml down
        print_message "已停止现有服务"
    else
        print_message "没有运行中的服务"
    fi
}

# 构建和启动服务
start_services() {
    print_step "构建并启动服务..."
    
    # 设置环境变量
    export $(cat .env.remote-ip | grep -v '^#' | xargs)
    
    # 构建服务
    print_message "构建Docker镜像..."
    docker-compose -f docker/dev/docker-compose.remote-ip.yml build --no-cache
    
    # 启动服务
    print_message "启动服务..."
    docker-compose -f docker/dev/docker-compose.remote-ip.yml up -d
    
    print_message "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_step "等待服务就绪..."
    
    # 等待MySQL就绪
    print_message "等待MySQL数据库启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/dev/docker-compose.remote-ip.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -p$(grep MYSQL_ROOT_PASSWORD .env.remote-ip | cut -d'=' -f2) &> /dev/null; then
            print_message "MySQL数据库已就绪"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
        echo -n "."
    done
    echo ""
    
    if [ $timeout -le 0 ]; then
        print_error "MySQL数据库启动超时"
        exit 1
    fi
    
    # 等待WordPress就绪
    print_message "等待WordPress启动..."
    timeout=180
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8080/wp-admin/admin-ajax.php &> /dev/null; then
            print_message "WordPress已就绪"
            break
        fi
        sleep 5
        timeout=$((timeout-5))
        echo -n "."
    done
    echo ""
    
    if [ $timeout -le 0 ]; then
        print_error "WordPress启动超时"
        exit 1
    fi
    
    # 等待前端就绪
    print_message "等待前端应用启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5173 &> /dev/null; then
            print_message "前端应用已就绪"
            break
        fi
        sleep 3
        timeout=$((timeout-3))
        echo -n "."
    done
    echo ""
    
    if [ $timeout -le 0 ]; then
        print_error "前端应用启动超时"
        exit 1
    fi
    
    print_message "所有服务已就绪"
}

# 显示部署信息
show_deployment_info() {
    print_step "部署完成！"
    echo ""
    echo "🎉 BJT产品管理系统已成功部署到远程服务器"
    echo ""
    echo "📱 访问地址："
    echo "  前端应用:        http://$SERVER_IP"
    echo "  WordPress后台:   http://$SERVER_IP/wp-admin"
    echo "  API接口:         http://$SERVER_IP/wp-json/bjt/v1"
    echo "  前端开发服务器:   http://$SERVER_IP:5173"
    echo "  WordPress直接:   http://$SERVER_IP:8080"
    echo ""
    echo "🔧 管理信息："
    echo "  MySQL端口:       $SERVER_IP:3306"
    echo "  数据库名:        bjt_product"
    echo "  数据库用户:      wordpress"
    echo ""
    echo "⚠️  注意事项："
    echo "  - 使用HTTP协议（无SSL加密）"
    echo "  - 确保防火墙开放80、3306、5173、8080端口"
    echo "  - 如果是云服务器，检查安全组设置"
    echo "  - 开发环境启用了调试模式"
    echo ""
    echo "📊 服务状态："
    docker-compose -f docker/dev/docker-compose.remote-ip.yml ps
    echo ""
    echo "📝 常用命令："
    echo "  查看日志: docker-compose -f docker/dev/docker-compose.remote-ip.yml logs -f"
    echo "  重启服务: docker-compose -f docker/dev/docker-compose.remote-ip.yml restart"
    echo "  停止服务: docker-compose -f docker/dev/docker-compose.remote-ip.yml down"
    echo "  备份数据: chmod +x scripts/backup-remote.sh && ./scripts/backup-remote.sh"
    echo ""
    
    # 询问是否安装开发工具
    echo "🛠️  开发工具（可选）："
    echo "  - phpMyAdmin: 数据库管理界面"
    echo "  - Adminer: 轻量级数据库工具"
    echo ""
    read -p "是否安装开发工具？(y/N): " install_dev_tools
    
    if [[ $install_dev_tools =~ ^[Yy]$ ]]; then
        install_development_tools
    fi
}

# 安装开发工具
install_development_tools() {
    print_step "安装开发工具..."
    
    # 设置环境变量
    export $(cat .env.remote-ip | grep -v '^#' | xargs)
    
    # 启动开发工具
    docker-compose -f docker-compose.dev-tools.yml up -d
    
    # 等待服务启动
    sleep 10
    
    print_message "开发工具安装完成！"
    echo ""
    echo "🛠️  开发工具访问地址："
    echo "  phpMyAdmin:      http://$SERVER_IP:8081"
    echo "  Adminer:         http://$SERVER_IP:8082"
    echo ""
    echo "📝 开发工具管理命令："
    echo "  停止开发工具: docker-compose -f docker-compose.dev-tools.yml down"
    echo "  重启开发工具: docker-compose -f docker-compose.dev-tools.yml restart"
    echo ""
    print_warning "请确保防火墙开放8081、8082端口"
}

# 主函数
main() {
    echo ""
    echo "🚀 BJT产品管理系统 - 远程IP部署脚本（开发版本）"
    echo "=================================================="
    echo ""
    
    check_requirements
    get_server_ip
    create_env_config
    check_ports
    stop_services
    start_services
    wait_for_services
    show_deployment_info
    
    echo ""
    print_message "部署完成！您现在可以通过 http://$SERVER_IP 访问系统"
}

# 执行主函数
main "$@" 