#!/bin/bash

# 本地IP生产环境启动脚本
# 在本地运行生产级配置，通过IP访问（HTTP）

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

print_info "启动BJT产品管理系统本地IP生产环境..."

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
sed -i '' "s/SERVER_IP=localhost/SERVER_IP=$LOCAL_IP/" .env.local-ip
sed -i '' "s/WP_HOME=http:\/\/localhost/WP_HOME=http:\/\/$LOCAL_IP/" .env.local-ip
sed -i '' "s/WP_SITEURL=http:\/\/localhost/WP_SITEURL=http:\/\/$LOCAL_IP/" .env.local-ip

print_message "环境变量已更新为IP: $LOCAL_IP"

# 设置上传目录
print_info "设置上传目录..."
./scripts/setup-upload-directories.sh
print_message "上传目录设置完成"

# 停止可能冲突的服务
print_info "停止可能冲突的服务..."
docker-compose -f docker/dev/docker-compose.nginx.yml down 2>/dev/null || true

# 启动本地IP生产环境
print_info "启动本地IP生产环境..."
docker-compose -f docker/prod/docker-compose.local-ip.yml up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 30

# 检查服务状态
print_info "检查服务状态..."
docker-compose -f docker/prod/docker-compose.local-ip.yml ps

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

print_message "=================================="
print_message "🚀 本地IP生产环境启动完成！"
print_message "=================================="
print_info "访问地址:"
print_info "  • 前端: http://$LOCAL_IP"
print_info "  • WordPress管理: http://$LOCAL_IP/wp-admin"
print_info "  • API: http://$LOCAL_IP/wp-json/bjt/v1"
print_info ""
print_info "测试用户："
print_info "  • 用户名: admin"
print_info "  • 密码: password123"
print_message "=================================="

# 显示日志选项
echo
read -p "是否查看启动日志? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f docker/prod/docker-compose.local-ip.yml logs --tail=50
fi 