#!/bin/bash

# BJT Product System - 前端专用部署脚本
# 用于只更新前端应用，不影响其他服务
# 使用方法: ./deploy-frontend-only.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 域名配置
DOMAIN_NAME="bjt.nh.cool"
VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1"

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

# 检查必要文件
check_prerequisites() {
    print_message "检查前置条件..."
    
    # 检查是否在项目根目录
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查前端目录
    if [ ! -d "frontend" ]; then
        print_error "frontend 目录不存在"
        exit 1
    fi
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker 未运行或无权限访问"
        exit 1
    fi
    
    print_message "前置条件检查通过"
}

# 备份当前前端构建
backup_frontend() {
    print_message "备份当前前端构建..."
    
    backup_dir="backups/frontend_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$backup_dir"
    
    if [ -d "frontend/build" ]; then
        cp -r frontend/build "$backup_dir/"
        print_message "前端构建备份完成: $backup_dir"
    else
        print_warning "未找到现有的前端构建文件"
    fi
}

# 构建前端应用
build_frontend() {
    print_message "开始构建前端应用..."
    
    cd frontend
    
    # 检查Node.js版本
    if ! node --version >/dev/null 2>&1; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    print_info "使用 API URL: $VITE_API_URL"
    
    # 清理旧的构建文件
    if [ -d "build" ]; then
        print_info "清理旧的构建文件..."
        rm -rf build
    fi
    
    if [ -d "dist" ]; then
        print_info "清理旧的dist文件..."
        rm -rf dist
    fi
    
    # 安装依赖
    print_message "安装前端依赖..."
    npm ci
    
    # 构建生产版本
    print_message "构建前端生产版本..."
    VITE_API_URL="$VITE_API_URL" npm run build:skip-check
    
    # 检查构建结果
    if [ -d "build" ] || [ -d "dist" ]; then
        print_message "前端构建成功"
    else
        print_error "前端构建失败"
        exit 1
    fi
    
    cd ..
}

# 更新Nginx容器
update_nginx_container() {
    print_message "更新Nginx容器（包含前端）..."
    
    # 停止nginx容器
    print_info "停止Nginx容器..."
    docker-compose -f docker/prod/docker-compose.prod.yml stop nginx
    
    # 重新构建nginx镜像（包含新的前端文件）
    print_info "重新构建Nginx镜像..."
    docker-compose -f docker/prod/docker-compose.prod.yml build nginx --no-cache
    
    # 启动nginx容器
    print_info "启动Nginx容器..."
    docker-compose -f docker/prod/docker-compose.prod.yml up -d nginx
    
    print_message "Nginx容器更新完成"
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 等待服务启动
    print_info "等待Nginx服务启动..."
    sleep 5
    
    # 检查前端是否可访问
    for i in {1..5}; do
        print_info "检查前端服务 (尝试 $i/5)..."
        if curl -f -s -k "https://${DOMAIN_NAME}" > /dev/null; then
            print_message "前端服务正常访问"
            return 0
        fi
        sleep 2
    done
    
    print_warning "前端服务检查失败，请手动验证"
    return 1
}

# 显示部署结果
show_deployment_result() {
    print_message "================================================="
    print_message "         前端部署完成！"
    print_message "================================================="
    print_info "域名: https://${DOMAIN_NAME}"
    print_info "API: https://${DOMAIN_NAME}/wp-json/bjt/v1"
    print_message "================================================="
    
    # 显示容器状态
    print_info "当前容器状态："
    docker-compose -f docker/prod/docker-compose.prod.yml ps nginx
}

# 主函数
main() {
    print_message "开始 BJT 前端专用部署"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "API URL: $VITE_API_URL"
    echo
    
    # 执行部署步骤
    check_prerequisites
    backup_frontend
    build_frontend
    update_nginx_container
    
    # 健康检查
    if health_check; then
        show_deployment_result
        print_message "✅ 前端部署成功完成！"
    else
        print_warning "⚠️  前端部署完成，但健康检查有问题"
        print_info "请手动检查："
        print_info "1. 访问 https://${DOMAIN_NAME}"
        print_info "2. 查看容器日志："
        print_info "   docker-compose -f docker/prod/docker-compose.prod.yml logs nginx"
        show_deployment_result
    fi
}

# 运行主函数
main "$@" 