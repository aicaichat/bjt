#!/bin/bash

# BJT Product System - 生产环境部署脚本
# 使用方法: ./deploy-production.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 安全加载环境变量
load_env_file() {
    local env_file="$1"
    
    if [ ! -f "$env_file" ]; then
        print_error "环境文件 $env_file 不存在"
        return 1
    fi
    
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
            # 处理单引号
            if [[ "$value" =~ ^\'(.*)\'$ ]]; then
                value="${BASH_REMATCH[1]}"
            # 处理双引号
            elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            
            # 导出环境变量
            export "$key=$value"
        else
            print_warning "跳过无效的行: $line"
        fi
    done < "$env_file"
}

# 检查必要的环境变量
check_env_vars() {
    print_message "检查环境变量..."
    
    required_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_AUTH_SECRET_KEY"
        "WP_HOME"
        "WP_SITEURL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "环境变量 $var 未设置"
            exit 1
        fi
    done
    
    print_message "环境变量检查通过"
}

# 备份当前部署
backup_current_deployment() {
    print_message "备份当前部署..."
    
    backup_dir="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$backup_dir"
    
    # 备份数据库
    if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$backup_dir/database.sql"; then
        print_message "数据库备份完成"
    else
        print_warning "数据库备份失败，继续部署..."
    fi
    
    # 备份上传文件
    if [ -d "wordpress_uploads" ]; then
        cp -r wordpress_uploads "$backup_dir/"
        print_message "上传文件备份完成"
    fi
}

# 构建前端应用
build_frontend() {
    print_message "构建前端应用..."
    
    cd frontend
    
    # 安装依赖
    print_message "安装前端依赖..."
    npm ci
    
    # 构建生产版本（跳过TypeScript检查）
    print_message "构建前端生产版本..."
    VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1" npm run build:skip-check
    
    cd ..
    
    print_message "前端构建完成"
}

# 设置upload目录权限
setup_upload_permissions() {
    print_message "设置upload目录权限..."
    
    # 确保uploads目录存在
    mkdir -p frontend/public/uploads/machines/pdfs
    mkdir -p frontend/public/uploads/machines/images
    mkdir -p frontend/public/uploads/host
    mkdir -p frontend/public/uploads/accessory
    mkdir -p frontend/public/uploads/spare_parts
    mkdir -p frontend/public/uploads/consumables
    mkdir -p frontend/public/uploads/documents
    
    print_message "uploads目录结构已创建"
    
    # 设置正确的权限
    print_message "设置目录权限..."
    
    # 设置目录权限为755，文件权限为644
    find frontend/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true
    find frontend/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    # 确保上传目录可写
    chmod -R 755 frontend/public/uploads 2>/dev/null || true
    
    print_message "upload目录权限设置完成"
    
    # 测试文件创建权限
    local test_file="frontend/public/uploads/test-$(date +%s).txt"
    if echo "Test file created at $(date)" > "$test_file" 2>/dev/null; then
        print_message "文件权限测试成功"
        rm "$test_file" 2>/dev/null || true
    else
        print_warning "文件权限测试失败，但继续部署..."
    fi
}

# 更新 Docker 镜像
update_docker_images() {
    print_message "更新 Docker 镜像..."
    
    # 拉取最新的基础镜像
    docker pull nginx:alpine
    docker pull mysql:8.0
    docker pull wordpress:latest
    docker pull node:18-alpine
    
    print_message "Docker 镜像更新完成"
}

# 数据库 schema 升级（耗材表增加 name_zh/name_en）
run_db_migration() {
    print_message "执行数据库 schema 升级 (wp_bjt_consumables & wp_bjt_accessories)..."

    local sql="\n-- Consumables: add name_zh/name_en\nALTER TABLE wp_bjt_consumables\n  ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255) NOT NULL DEFAULT '' COMMENT '中文名称' AFTER part_number,\n  ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NOT NULL DEFAULT '' COMMENT '英文名称' AFTER name_zh;\n\nUPDATE wp_bjt_consumables\n   SET name_zh = IF(name_zh='', title_zh, name_zh),\n       name_en = IF(name_en='', title_en, name_en);\n\n-- Accessories: add title_zh/title_en (back-compat columns)\nALTER TABLE wp_bjt_accessories\n  ADD COLUMN IF NOT EXISTS title_zh VARCHAR(255) NOT NULL DEFAULT '' COMMENT '中文标题' AFTER name_en,\n  ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) NOT NULL DEFAULT '' COMMENT '英文标题' AFTER title_zh;\n\nUPDATE wp_bjt_accessories\n   SET title_zh = IF(title_zh='', name_zh, title_zh),\n       title_en = IF(title_en='', name_en, title_en);\n"

    if echo -e "$sql" | docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}; then
        print_message "数据库 schema 升级完成"
    else
        print_warning "数据库 schema 升级失败，请手动检查"
    fi
}

# 构建和部署
deploy() {
    print_message "开始部署..."
    
    # 停止当前服务
    print_message "停止当前服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml down
    
    # 构建新镜像
    print_message "构建 Docker 镜像..."
    docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
    
    # 启动服务
    print_message "启动服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml up -d
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    print_message "检查服务状态..."
    docker-compose -f docker/prod/docker-compose.prod.yml ps
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    # 检查前端
    if curl -f -s "https://${DOMAIN_NAME}" > /dev/null; then
        print_message "前端服务正常"
    else
        print_error "前端服务异常"
        return 1
    fi
    
    # 检查API
    if curl -f -s "https://${DOMAIN_NAME}/wp-json/bjt/v1" > /dev/null; then
        print_message "API服务正常"
    else
        print_error "API服务异常"
        return 1
    fi
    
    # 检查uploads目录访问
    if curl -f -s "https://${DOMAIN_NAME}/uploads/" > /dev/null 2>&1; then
        print_message "uploads目录访问正常"
    else
        print_warning "uploads目录可能无法通过HTTP访问，但不影响部署"
    fi
    
    print_message "健康检查通过"
}

# 清理旧镜像
cleanup() {
    print_message "清理旧镜像..."
    docker image prune -f
    print_message "清理完成"
}

# 主函数
main() {
    print_message "开始 BJT Product System 生产环境部署"
    
    # 检查是否在项目根目录
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 加载环境变量
    if [ -f ".env.production" ]; then
        print_message "加载环境变量..."
        if load_env_file ".env.production"; then
            print_message "环境变量加载成功"
        else
            print_error "环境变量加载失败"
            exit 1
        fi
    else
        print_error ".env.production 文件不存在"
        print_message "请从 env.production.example 复制并配置："
        print_message "  cp env.production.example .env.production"
        print_message "  然后编辑 .env.production 填写实际配置"
        exit 1
    fi
    
    # 执行部署步骤
    check_env_vars
    backup_current_deployment
    build_frontend
    setup_upload_permissions
    update_docker_images
    deploy
    
    # 等待服务完全启动
    sleep 10
    
    # 健康检查
    if health_check; then
        run_db_migration
        cleanup
        print_message "部署成功完成！"
        print_message "访问地址: https://${DOMAIN_NAME}"
    else
        print_error "部署完成但健康检查失败，请检查日志"
        docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50
        exit 1
    fi
}

# 运行主函数
main "$@" 