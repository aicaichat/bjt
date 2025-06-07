#!/bin/bash

# 完全隔离的开发环境启动脚本
# 使用独立的端口、网络、容器名称，避免与生产环境冲突

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
PROJECT_NAME="bjt-dev"
COMPOSE_FILE="docker/dev/docker-compose.dev.yml"

print_info "启动完全隔离的BJT开发环境..."
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

if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "配置文件 $COMPOSE_FILE 不存在"
    exit 1
fi

print_message "前置条件检查通过"

# 检查端口占用
print_info "检查端口占用情况..."

check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        print_warning "端口 $port 被占用"
        lsof -i :$port
        return 1
    else
        print_info "端口 $port 可用"
        return 0
    fi
}

# 检查开发环境所需端口
PORTS=(5173 8081 8082 3308)
PORT_CONFLICTS=false

for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        PORT_CONFLICTS=true
    fi
done

if [ "$PORT_CONFLICTS" = true ]; then
    print_warning "检测到端口冲突，但将继续启动（Docker会处理端口映射）"
fi

# 设置上传目录
print_info "设置上传目录..."
mkdir -p frontend/public/uploads/specifications
chmod -R 755 frontend/public/uploads
print_message "上传目录设置完成"

# 停止可能冲突的服务（但保留生产环境）
print_info "停止现有开发环境（如果有）..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# 启动开发环境
print_info "启动隔离的开发环境..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 20

# 检查服务状态
print_info "检查服务状态..."
COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE ps

# 健康检查
print_info "执行健康检查..."
sleep 5

# 检查前端服务
if curl -f -s "http://localhost:5173" > /dev/null; then
    print_message "前端开发服务正常 (http://localhost:5173)"
else
    print_warning "前端服务检查失败，可能还在启动中"
fi

# 检查WordPress服务
if curl -f -s "http://localhost:8081" > /dev/null; then
    print_message "WordPress服务正常 (http://localhost:8081)"
else
    print_warning "WordPress服务检查失败，可能还在启动中"
fi

# 检查API服务
if curl -f -s "http://localhost:8081/wp-json/bjt/v1" > /dev/null; then
    print_message "API服务正常 (http://localhost:8081/wp-json/bjt/v1)"
else
    print_warning "API服务检查失败，请稍后再试"
fi

print_message "=========================================="
print_message "🚀 隔离的开发环境启动完成！"
print_message "=========================================="
print_info "开发环境访问地址:"
print_info "  🌐 前端开发服务器: http://localhost:5173"
print_info "  🌐 WordPress后台: http://localhost:8081/wp-admin"
print_info "  🌐 API接口: http://localhost:8081/wp-json/bjt/v1"
print_info "  🌐 Nginx代理: http://localhost:8082"
print_info "  🗄️ MySQL数据库: localhost:3308"
print_info ""
print_info "容器命名规则:"
print_info "  📦 前缀: $PROJECT_NAME"
print_info "  📦 网络: bjt_dev_network"
print_info "  📦 数据卷: bjt_dev_mysql_data"
print_info ""
print_info "测试用户："
print_info "  👤 用户名: admin"
print_info "  🔑 密码: password123"
print_message "=========================================="

# 管理选项
echo
print_info "管理选项:"
print_info "  停止开发环境: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE down"
print_info "  查看日志: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE logs -f"
print_info "  重启服务: COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE restart"

# 询问是否查看日志
echo
read -p "是否查看启动日志? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    COMPOSE_PROJECT_NAME=$PROJECT_NAME docker-compose -f $COMPOSE_FILE logs --tail=30
fi 