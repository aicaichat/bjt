#!/bin/bash

# BJT Product System - 零停机前端部署脚本
# 通过volume挂载实现零停机更新
# 使用方法: ./deploy-frontend-zero-downtime.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 域名配置
DOMAIN_NAME="bjt.nh.cool"
VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1"

# 全局变量
BACKUP_DIR=""
FRONTEND_VOLUME_PATH="/var/www/frontend"

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

# 检查当前模式
check_current_setup() {
    print_message "检查当前部署模式..."
    
    # 先加载环境变量
    if [ -f ".env.production" ]; then
        if load_env_file ".env.production"; then
            print_info "生产环境变量加载成功"
        else
            print_warning ".env.production 加载失败，使用默认值"
        fi
    fi
    
    # 检查是否已经使用volume挂载前端文件
    if docker-compose -f docker/prod/docker-compose.prod.yml config | grep -q "frontend/build:/usr/share/nginx/html"; then
        print_message "✅ 已配置volume挂载模式，可以零停机更新"
        return 0
    else
        print_warning "⚠️  当前使用镜像内部文件模式，需要先切换到volume模式"
        return 1
    fi
}

# 切换到volume挂载模式
switch_to_volume_mode() {
    print_message "切换到volume挂载模式..."
    
    # 确保环境变量已加载
    if [ -f ".env.production" ]; then
        load_env_file ".env.production" || true
    fi
    
    # 备份原始docker-compose文件
    BACKUP_DIR="backups/docker_config_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    cp docker/prod/docker-compose.prod.yml "$BACKUP_DIR/"
    print_info "docker-compose配置已备份到: $BACKUP_DIR"
    
    # 创建修改后的docker-compose配置
    print_info "修改docker-compose配置，添加前端volume挂载..."
    
    # 使用更可靠的方法添加volume挂载
    awk '
    /^    volumes:/ { 
        print $0
        in_nginx_volumes = 1
        next 
    }
    /^      - \.\.\/\.\.\/backend:\/var\/www\/html:ro/ && in_nginx_volumes {
        print $0
        print "      - ../../frontend/build:/usr/share/nginx/html:ro"
        next
    }
    /^    [a-z]/ && in_nginx_volumes {
        in_nginx_volumes = 0
    }
    { print }
    ' docker/prod/docker-compose.prod.yml > docker/prod/docker-compose.prod.yml.tmp
    
    # 检查修改是否成功
    if grep -q "frontend/build:/usr/share/nginx/html:ro" docker/prod/docker-compose.prod.yml.tmp; then
        mv docker/prod/docker-compose.prod.yml.tmp docker/prod/docker-compose.prod.yml
        print_info "✅ docker-compose配置修改成功"
    else
        print_error "❌ docker-compose配置修改失败"
        rm docker/prod/docker-compose.prod.yml.tmp
        exit 1
    fi
    
    # 确保前端build目录存在
    if [ ! -d "frontend/build" ]; then
        print_info "前端build目录不存在，先构建前端..."
        cd frontend
        npm ci
        VITE_API_URL="$VITE_API_URL" npm run build:skip-check
        cd ..
    fi
    
    print_info "重启nginx容器以应用新配置..."
    
    # 重启nginx使配置生效
    if docker-compose -f docker/prod/docker-compose.prod.yml up -d nginx; then
        print_message "✅ 已切换到volume挂载模式"
        
        # 等待nginx启动
        sleep 5
        
        # 验证nginx正常运行
        if curl -f -s -k --connect-timeout 10 "https://${DOMAIN_NAME}" > /dev/null; then
            print_message "✅ Nginx重启成功，网站正常访问"
        else
            print_warning "⚠️  Nginx重启后网站访问异常，请检查"
        fi
    else
        print_error "❌ Nginx重启失败"
        exit 1
    fi
}

# 零停机更新前端
zero_downtime_update() {
    print_message "开始零停机前端更新..."
    
    # 备份当前前端文件
    BACKUP_DIR="backups/frontend_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "frontend/build" ]; then
        cp -r frontend/build "$BACKUP_DIR/"
        print_info "前端文件已备份到: $BACKUP_DIR"
    fi
    
    # 构建新的前端
    print_message "构建新的前端应用..."
    cd frontend
    
    # 清理旧构建
    rm -rf build dist 2>/dev/null || true
    
    # 安装依赖并构建
    npm ci
    VITE_API_URL="$VITE_API_URL" npm run build:skip-check
    
    if [ ! -d "build" ] && [ ! -d "dist" ]; then
        print_error "前端构建失败"
        exit 1
    fi
    
    cd ..
    
    # 原子性替换：先构建到临时目录，再快速替换
    print_info "准备原子性文件替换..."
    
    temp_dir="frontend/build_new_$(date +'%s')"
    if [ -d "frontend/build" ]; then
        mv frontend/build "$temp_dir"
    elif [ -d "frontend/dist" ]; then
        mv frontend/dist "$temp_dir"
    fi
    
    # 快速替换（几毫秒内完成）
    if [ -d "frontend/build" ]; then
        rm -rf frontend/build_old 2>/dev/null || true
        mv frontend/build frontend/build_old 2>/dev/null || true
    fi
    
    mv "$temp_dir" frontend/build
    
    print_message "✅ 前端文件已更新（零停机）"
    
    # 验证更新
    sleep 2
    if curl -f -s -k --connect-timeout 5 "https://${DOMAIN_NAME}" > /dev/null; then
        print_message "✅ 更新成功！网站正常访问"
        
        # 清理旧文件
        rm -rf frontend/build_old 2>/dev/null || true
        
    else
        print_error "更新后网站无法访问，开始回滚..."
        
        # 快速回滚
        mv frontend/build frontend/build_failed
        mv frontend/build_old frontend/build 2>/dev/null || cp -r "$BACKUP_DIR/build" frontend/
        
        sleep 2
        if curl -f -s -k --connect-timeout 5 "https://${DOMAIN_NAME}" > /dev/null; then
            print_message "✅ 回滚成功"
        else
            print_error "❌ 回滚失败，请手动检查"
        fi
        exit 1
    fi
}

# 主函数
main() {
    print_message "开始 BJT 零停机前端部署"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "API URL: $VITE_API_URL"
    echo
    
    # 检查当前设置
    if check_current_setup; then
        # 已经是volume模式，直接更新
        zero_downtime_update
    else
        # 需要先切换到volume模式
        print_warning "需要先切换到volume挂载模式（这次会重启nginx）"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            switch_to_volume_mode
            print_message "下次可以直接零停机更新！"
            echo
            zero_downtime_update
        else
            print_warning "取消部署"
            exit 0
        fi
    fi
    
    print_message "================================================="
    print_message "✅ 零停机前端部署完成！"
    print_message "================================================="
    print_info "网站地址: https://${DOMAIN_NAME}"
    print_info "备份位置: $BACKUP_DIR"
    print_message "================================================="
}

# 运行主函数
main "$@" 