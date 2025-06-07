#!/bin/bash

# 隔离的本地生产环境启动脚本
# 使用独立的项目名称，避免与开发环境冲突

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 环境配置
PROJECT_NAME="bjt-prod"
COMPOSE_FILE="docker/prod/docker-compose.local-ip.yml"

print_info "启动隔离的BJT本地生产环境..."
print_info "项目名称: $PROJECT_NAME"
print_info "配置文件: $COMPOSE_FILE"

# 检查前置条件
print_info "检查前置条件..."

if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose 未安装"
    exit 1
fi

if [ ! -f ".env.local-ip" ]; then
    print_error "环境配置文件 .env.local-ip 不存在"
    exit 1
fi

print_message "前置条件检查通过"

# 自动检测本机IP地址
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
print_info "检测到本机IP: $LOCAL_IP"

# 更新环境文件中的IP地址
sed -i '' "s/SERVER_IP=.*/SERVER_IP=$LOCAL_IP/" .env.local-ip
sed -i '' "s|WP_HOME=.*|WP_HOME=http://$LOCAL_IP|" .env.local-ip
sed -i '' "s|WP_SITEURL=.*|WP_SITEURL=http://$LOCAL_IP|" .env.local-ip

print_message "环境变量已更新为IP: $LOCAL_IP"

# 检查端口占用
print_info "检查生产环境端口占用..."

check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        print_warning "端口 $port 被占用"
        lsof -i :$port | head -5
        return 1
    else
        print_info "端口 $port 可用"
        return 0
    fi
}

# 检查生产环境所需端口
PROD_PORTS=(80)
PORT_CONFLICTS=false

for port in "${PROD_PORTS[@]}"; do
    if ! check_port $port; then
        PORT_CONFLICTS=true
    fi
done

if [ "$PORT_CONFLICTS" = true ]; then
    echo
    read -p "检测到端口冲突，是否强制继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "用户取消部署"
        exit 0
    fi
fi

# 设置上传目录
print_info "设置上传目录..."
mkdir -p frontend/public/uploads/specifications
chmod -R 755 frontend/public/uploads
print_message "上传目录设置完成"

# 停止可能冲突的服务（但保留开发环境）
print_info "停止现有生产环境（如果有）..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# 启动生产环境
print_info "启动隔离的生产环境..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 30

# 检查服务状态
print_info "检查服务状态..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE ps

# 健康检查
print_info "执行健康检查..."
sleep 10

if curl -f -s "http://$LOCAL_IP" > /dev/null; then
    print_message "前端服务正常 (http://$LOCAL_IP)"
else
    print_warning "前端服务检查失败"
fi

if curl -f -s "http://$LOCAL_IP/wp-json/bjt/v1" > /dev/null; then
    print_message "API服务正常 (http://$LOCAL_IP/wp-json/bjt/v1)"
else
    print_warning "API服务检查失败"
fi

print_message "================================================="
print_message "🚀 隔离的本地生产环境启动完成！"
print_message "================================================="
print_info "生产环境访问地址:"
print_info "  🌐 前端: http://$LOCAL_IP"
print_info "  🌐 WordPress管理: http://$LOCAL_IP/wp-admin"
print_info "  🌐 API: http://$LOCAL_IP/wp-json/bjt/v1"
print_info ""
print_info "容器命名规则:"
print_info "  📦 前缀: $PROJECT_NAME"
print_info "  📦 网络: ${PROJECT_NAME}_bjt_network"
print_info "  📦 数据卷: ${PROJECT_NAME}_mysql_data"
print_info ""
print_info "测试用户："
print_info "  👤 用户名: admin"
print_info "  🔑 密码: password123"
print_message "================================================="

# 管理选项
echo
print_info "管理选项:"
print_info "  停止生产环境: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE down"
print_info "  查看日志: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE logs -f"
print_info "  重启服务: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE restart"

# 显示日志选项
echo
read -p "是否查看启动日志? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE logs --tail=50
fi 