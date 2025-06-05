#!/bin/bash

# BJT Product System - 前端专用部署脚本（带回滚功能）
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

# 全局变量
BACKUP_DIR=""
DEPLOYMENT_STARTED=false
NGINX_STOPPED=false

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

# 错误处理和清理函数
cleanup_on_error() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ "$DEPLOYMENT_STARTED" = true ]; then
        print_error "部署过程中发生错误，开始自动回滚..."
        rollback_deployment
    fi
}

# 设置错误处理
trap cleanup_on_error EXIT

# 安全加载环境变量
load_env_file() {
    local env_file="$1"
    
    if [ ! -f "$env_file" ]; then
        print_error "环境文件 $env_file 不存在"
        return 1
    fi
    
    print_info "加载环境变量文件: $env_file"
    
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
        fi
    done < "$env_file"
    
    print_info "环境变量加载完成"
}

# 检查必要文件
check_prerequisites() {
    print_message "检查前置条件..."
    
    # 检查是否在项目根目录
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 加载生产环境变量
    if [ -f ".env.production" ]; then
        if load_env_file ".env.production"; then
            print_message "生产环境变量加载成功"
        else
            print_error "生产环境变量加载失败"
            exit 1
        fi
    else
        print_warning ".env.production 文件不存在，将使用默认值"
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
    
    # 检查当前服务状态
    print_info "检查当前容器状态..."
    if ! docker-compose -f docker/prod/docker-compose.prod.yml ps | grep nginx | grep -q "Up"; then
        print_warning "Nginx容器未运行，请检查服务状态"
    fi
    
    print_message "前置条件检查通过"
}

# 备份当前前端构建
backup_frontend() {
    print_message "备份当前前端构建..."
    
    BACKUP_DIR="backups/frontend_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # 备份前端构建文件
    if [ -d "frontend/build" ]; then
        cp -r frontend/build "$BACKUP_DIR/"
        print_message "前端build目录备份完成"
    fi
    
    if [ -d "frontend/dist" ]; then
        cp -r frontend/dist "$BACKUP_DIR/"
        print_message "前端dist目录备份完成"
    fi
    
    # 备份Dockerfile以防万一
    if [ -f "docker/nginx/Dockerfile.prod" ]; then
        cp "docker/nginx/Dockerfile.prod" "$BACKUP_DIR/"
        print_message "Nginx Dockerfile备份完成"
    fi
    
    # 记录当前Docker镜像ID
    docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep "prod_nginx" > "$BACKUP_DIR/nginx_image_info.txt" 2>/dev/null || true
    
    print_message "备份完成: $BACKUP_DIR"
}

# 构建前端应用
build_frontend() {
    print_message "开始构建前端应用..."
    DEPLOYMENT_STARTED=true
    
    cd frontend
    
    # 检查Node.js版本
    if ! node --version >/dev/null 2>&1; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    print_info "Node.js版本: $(node --version)"
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
    if ! npm ci; then
        print_error "依赖安装失败"
        exit 1
    fi
    
    # 构建生产版本
    print_message "构建前端生产版本..."
    if ! VITE_API_URL="$VITE_API_URL" npm run build:skip-check; then
        print_error "前端构建失败"
        exit 1
    fi
    
    # 检查构建结果
    if [ -d "build" ] || [ -d "dist" ]; then
        print_message "前端构建成功"
    else
        print_error "前端构建失败：未找到输出目录"
        exit 1
    fi
    
    cd ..
}

# 更新Nginx容器
update_nginx_container() {
    print_message "更新Nginx容器（包含前端）..."
    
    # 停止nginx容器
    print_info "停止Nginx容器..."
    if docker-compose -f docker/prod/docker-compose.prod.yml stop nginx; then
        NGINX_STOPPED=true
        print_info "Nginx容器已停止"
    else
        print_error "停止Nginx容器失败"
        exit 1
    fi
    
    # 重新构建nginx镜像（包含新的前端文件）
    print_info "重新构建Nginx镜像..."
    if ! docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache nginx; then
        print_error "Nginx镜像构建失败"
        exit 1
    fi
    
    # 启动nginx容器
    print_info "启动Nginx容器..."
    if docker-compose -f docker/prod/docker-compose.prod.yml up -d nginx; then
        NGINX_STOPPED=false
        print_message "Nginx容器启动成功"
    else
        print_error "启动Nginx容器失败"
        exit 1
    fi
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 等待服务启动
    print_info "等待Nginx服务启动..."
    sleep 10
    
    # 检查容器状态
    if ! docker-compose -f docker/prod/docker-compose.prod.yml ps nginx | grep -q "Up"; then
        print_error "Nginx容器未正常运行"
        return 1
    fi
    
    # 检查前端是否可访问
    for i in {1..5}; do
        print_info "检查前端服务 (尝试 $i/5)..."
        if curl -f -s -k --connect-timeout 10 "https://${DOMAIN_NAME}" > /dev/null; then
            print_message "前端服务正常访问"
            return 0
        fi
        sleep 3
    done
    
    print_error "前端服务健康检查失败"
    return 1
}

# 回滚部署
rollback_deployment() {
    print_warning "================================================="
    print_warning "         开始回滚部署"
    print_warning "================================================="
    
    if [ -z "$BACKUP_DIR" ] || [ ! -d "$BACKUP_DIR" ]; then
        print_error "无法回滚：备份目录不存在"
        return 1
    fi
    
    # 如果nginx容器被停止了，先确保它运行
    if [ "$NGINX_STOPPED" = true ]; then
        print_info "重新启动Nginx容器..."
        docker-compose -f docker/prod/docker-compose.prod.yml up -d nginx || true
    fi
    
    # 恢复前端构建文件
    print_info "恢复前端构建文件..."
    
    if [ -d "$BACKUP_DIR/build" ]; then
        rm -rf frontend/build 2>/dev/null || true
        cp -r "$BACKUP_DIR/build" frontend/
        print_info "前端build目录已恢复"
    fi
    
    if [ -d "$BACKUP_DIR/dist" ]; then
        rm -rf frontend/dist 2>/dev/null || true
        cp -r "$BACKUP_DIR/dist" frontend/
        print_info "前端dist目录已恢复"
    fi
    
    # 重新构建nginx镜像使用旧的前端文件
    print_info "使用备份的前端文件重新构建Nginx..."
    if docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache nginx; then
        print_info "Nginx镜像回滚构建成功"
    else
        print_error "Nginx镜像回滚构建失败"
    fi
    
    # 重启nginx容器
    print_info "重启Nginx容器..."
    if docker-compose -f docker/prod/docker-compose.prod.yml up -d nginx; then
        print_info "Nginx容器重启成功"
    else
        print_error "Nginx容器重启失败"
    fi
    
    # 验证回滚
    print_info "验证回滚结果..."
    sleep 5
    
    if curl -f -s -k --connect-timeout 10 "https://${DOMAIN_NAME}" > /dev/null; then
        print_message "✅ 回滚成功！服务已恢复正常"
    else
        print_error "❌ 回滚验证失败，请手动检查服务状态"
    fi
    
    print_warning "================================================="
    print_warning "回滚完成。备份位置: $BACKUP_DIR"
    print_warning "================================================="
}

# 显示部署结果
show_deployment_result() {
    print_message "================================================="
    print_message "         前端部署完成！"
    print_message "================================================="
    print_info "域名: https://${DOMAIN_NAME}"
    print_info "API: https://${DOMAIN_NAME}/wp-json/bjt/v1"
    print_info "备份位置: $BACKUP_DIR"
    print_message "================================================="
    
    # 显示容器状态
    print_info "当前容器状态："
    docker-compose -f docker/prod/docker-compose.prod.yml ps nginx
}

# 主函数
main() {
    print_message "开始 BJT 前端专用部署（带回滚功能）"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "API URL: $VITE_API_URL"
    echo
    
    # 禁用自动错误退出，手动处理错误
    set +e
    
    # 执行部署步骤
    check_prerequisites || exit 1
    backup_frontend || exit 1
    build_frontend || exit 1
    update_nginx_container || exit 1
    
    # 健康检查
    if health_check; then
        # 部署成功，禁用回滚
        DEPLOYMENT_STARTED=false
        show_deployment_result
        print_message "✅ 前端部署成功完成！"
        
        # 清理旧的备份（保留最近5个）
        print_info "清理旧备份..."
        find backups -name "frontend_*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
        
    else
        print_error "❌ 健康检查失败，开始回滚..."
        rollback_deployment
        exit 1
    fi
}

# 运行主函数
main "$@" 