#!/bin/bash

# 本地开发环境启动脚本
# 启动后端服务（Docker）+ 前端开发服务器（npm dev）

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

print_info "启动BJT产品管理系统本地开发环境..."

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

if ! command -v npm &> /dev/null; then
    print_error "npm 未安装"
    exit 1
fi

print_message "前置条件检查通过"

# 设置上传目录
print_info "设置上传目录..."
mkdir -p frontend/public/uploads/specifications
chmod -R 755 frontend/public/uploads
print_message "上传目录设置完成"

# 启动后端服务（WordPress + MySQL）
print_info "启动后端服务（WordPress + MySQL）..."
docker-compose -f docker/dev/docker-compose.backend-only.yml up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 10

# 检查服务状态
print_info "检查后端服务状态..."
if curl -f -s http://localhost:8080 > /dev/null; then
    print_message "WordPress 服务已启动 (http://localhost:8080)"
else
    print_warning "WordPress 服务启动中..."
    sleep 10
fi

# 安装前端依赖（如果需要）
if [ ! -d "frontend/node_modules" ]; then
    print_info "安装前端依赖..."
    cd frontend
    npm install
    cd ..
    print_message "前端依赖安装完成"
fi

print_message "=================================="
print_message "🚀 开发环境启动完成！"
print_message "=================================="
print_info "后端服务:"
print_info "  • WordPress: http://localhost:8080"
print_info "  • WordPress Admin: http://localhost:8080/wp-admin"
print_info "  • API: http://localhost:8080/wp-json/bjt/v1"
print_info "  • MySQL: localhost:3307"
print_info ""
print_info "启动前端开发服务器:"
print_info "  cd frontend && npm run dev"
print_info ""
print_info "前端服务将运行在: http://localhost:5173"
print_message "=================================="

# 询问是否立即启动前端
echo
read -p "是否立即启动前端开发服务器? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "启动前端开发服务器..."
    cd frontend
    npm run dev
fi 