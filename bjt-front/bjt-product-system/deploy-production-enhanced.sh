#!/bin/bash

# BJT Product System - 增强版生产环境部署脚本
# 解决构建缓存、版本同步和部署问题
# 使用方法: ./deploy-production-enhanced.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 部署配置
DEPLOYMENT_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_VERSION=$(date +%s)
FORCE_CLEAN_BUILD=false
SKIP_BACKUP=false
SKIP_HEALTH_CHECK=false

# 统一的 Docker Compose 命令
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

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

# 显示帮助信息
show_help() {
    echo "BJT Product System - 增强版生产环境部署脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -f, --force-clean    强制清理所有缓存和依赖"
    echo "  -s, --skip-backup    跳过备份步骤"
    echo "  -n, --skip-health    跳过健康检查"
    echo "  -h, --help          显示帮助信息"
    echo
    echo "示例:"
    echo "  $0                   # 标准部署"
    echo "  $0 -f               # 强制清理所有缓存后部署"
    echo "  $0 -s -n            # 快速部署（跳过备份和健康检查）"
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force-clean)
                FORCE_CLEAN_BUILD=true
                shift
                ;;
            -s|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -n|--skip-health)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
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
            if [[ "$value" =~ ^\'(.*)\'$ ]]; then
                value="${BASH_REMATCH[1]}"
            elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            
            # 导出环境变量
            export "$key=$value"
        fi
    done < "$env_file"
}

# 检查必要的环境变量
check_env_vars() {
    print_message "🔍 检查环境变量..."
    
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
    
    print_info "✅ 环境变量检查通过"
}

# 检查代码版本
check_code_version() {
    print_message "🔍 检查代码版本..."
    
    # 显示当前Git状态
    print_info "当前Git状态："
    git log --oneline -3
    
    # 检查是否有未提交的更改
    if ! git diff --quiet; then
        print_warning "存在未提交的更改"
        git diff --stat
    fi
    
    # 检查是否有未推送的提交
    if ! git diff --quiet @{u}..HEAD 2>/dev/null; then
        print_warning "存在未推送的提交"
    fi
    
    print_info "✅ 代码版本检查完成"
}

# 增强版备份
backup_current_deployment() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "⏭️  跳过备份步骤"
        return 0
    fi
    
    print_message "💾 备份当前部署..."
    
    backup_dir="backups/deployment_${DEPLOYMENT_TIMESTAMP}"
    mkdir -p "$backup_dir"
    
    # 备份前端构建文件
    if [ -d "frontend/dist" ]; then
        print_info "备份前端构建文件..."
        cp -r frontend/dist "$backup_dir/frontend_dist"
    fi
    
    # 备份环境配置
    if [ -f ".env.production" ]; then
        cp .env.production "$backup_dir/"
    fi
    
    # 备份数据库
    if $COMPOSE exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$backup_dir/database_${DEPLOYMENT_TIMESTAMP}.sql" 2>/dev/null; then
        print_info "✅ 数据库备份完成"
    else
        print_warning "❌ 数据库备份失败，但继续部署..."
    fi
    
    print_info "✅ 备份完成，保存位置: $backup_dir"
}

# 增强版前端构建
build_frontend() {
    print_message "🔨 构建前端应用..."
    
    cd frontend
    
    # 显示构建环境信息
    print_info "Node.js版本: $(node --version)"
    print_info "npm版本: $(npm --version)"
    print_info "构建时间: $(date)"
    print_info "部署版本: $DEPLOYMENT_VERSION"
    
    # 强制清理（如果启用）
    if [ "$FORCE_CLEAN_BUILD" = true ]; then
        print_info "🧹 强制清理所有缓存和依赖..."
        rm -rf node_modules package-lock.json
        rm -rf .vite node_modules/.vite node_modules/.cache
        rm -rf dist build
        npm cache clean --force 2>/dev/null || true
        print_info "✅ 强制清理完成"
    else
        print_info "🧹 清理构建缓存..."
        rm -rf dist build
        rm -rf .vite node_modules/.vite node_modules/.cache 2>/dev/null || true
        print_info "✅ 缓存清理完成"
    fi
    
    # 安装/更新依赖
    if [ "$FORCE_CLEAN_BUILD" = true ] || [ ! -d "node_modules" ]; then
        print_info "📦 重新安装依赖..."
        npm install
    else
        print_info "📦 确保依赖是最新的..."
        npm ci
    fi
    
    # 🔧 设置生产环境变量
    print_info "🔧 设置生产环境变量..."
    
    # 备份现有的.env.production文件
    if [ -f ".env.production" ]; then
        cp .env.production .env.production.backup.$(date +%s)
    fi
    
    # 创建前端生产环境配置
    cat > .env.production << EOF
# 前端生产环境配置 - 自动生成于 $(date)
NODE_ENV=production
VITE_BUILD_TIMESTAMP=${DEPLOYMENT_VERSION}
VITE_BUILD_DATE=$(date)
VITE_GIT_COMMIT=$(git rev-parse HEAD)
EOF
    
    # 从根目录.env.production提取VITE_开头的变量
    if [ -f "../.env.production" ]; then
        print_info "📥 从根目录提取前端配置..."
        grep -E "^VITE_" ../.env.production >> .env.production || true
    else
        print_warning "根目录.env.production不存在，使用默认配置"
        cat >> .env.production << EOF
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
VITE_DEBUG=false
VITE_LOG_LEVEL=error
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_MULTILANG=true
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true
VITE_USE_MOCK_CART=false
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_CACHE=true
EOF
    fi
    
    # 显示构建配置
    print_info "🔧 构建配置："
    echo "===================="
    cat .env.production
    echo "===================="
    
    # 加载环境变量
    export NODE_ENV=production
    while IFS= read -r line; do
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            export "$key=$value"
        fi
    done < .env.production
    
    # 构建生产版本
    print_info "🚀 开始构建生产版本..."
    if npm run build:skip-check; then
        print_info "✅ 构建成功"
    else
        print_error "❌ 构建失败"
        exit 1
    fi
    
    # 验证构建结果
    if [ -f "dist/index.html" ]; then
        print_info "✅ 构建文件验证通过"
        print_info "📊 构建统计："
        echo "   - 构建时间: $(date)"
        echo "   - 主文件: $(ls -la dist/index.html)"
        echo "   - 构建大小: $(du -sh dist/)"
        echo "   - 文件数量: $(find dist/ -type f | wc -l) 个文件"
    else
        print_error "❌ 构建验证失败：dist/index.html 不存在"
        exit 1
    fi
    
    # 🔥 增强版缓存破坏
    print_info "🔥 添加强化缓存破坏机制..."
    
    # 添加多重缓存破坏标记
    sed -i.bak "s|<head>|<head>
    <meta name=\"build-timestamp\" content=\"${DEPLOYMENT_VERSION}\">
    <meta name=\"build-date\" content=\"$(date)\">
    <meta name=\"git-commit\" content=\"$(git rev-parse HEAD)\">
    <meta name=\"cache-buster\" content=\"v${DEPLOYMENT_VERSION}\">
    <meta name=\"cache-control\" content=\"no-cache, no-store, must-revalidate\">
    <meta name=\"pragma\" content=\"no-cache\">
    <meta name=\"expires\" content=\"0\">
    <!-- 强制刷新版本: ${DEPLOYMENT_VERSION} -->|" dist/index.html
    
    # 验证缓存破坏标记是否添加成功
    if grep -q "build-timestamp" dist/index.html; then
        print_info "✅ 缓存破坏机制添加成功"
    else
        print_warning "❌ 缓存破坏机制添加失败"
    fi
    
    # 创建版本信息文件
    cat > dist/version.json << EOF
{
  "buildTimestamp": "${DEPLOYMENT_VERSION}",
  "buildDate": "$(date)",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git branch --show-current)",
  "deploymentId": "${DEPLOYMENT_TIMESTAMP}",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF
    
    print_info "✅ 版本信息文件已创建"
    
    cd ..
    print_info "✅ 前端构建完成"
}

# 设置upload目录权限
setup_upload_permissions() {
    print_message "📁 设置upload目录权限..."
    
    # 创建upload目录结构
    upload_dirs=(
        "frontend/public/uploads/machines/pdfs"
        "frontend/public/uploads/machines/images"
        "frontend/public/uploads/host"
        "frontend/public/uploads/accessory"
        "frontend/public/uploads/spare_parts"
        "frontend/public/uploads/consumables"
        "frontend/public/uploads/documents"
    )
    
    for dir in "${upload_dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    # 设置权限
    find frontend/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true
    find frontend/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    print_info "✅ upload目录权限设置完成"
}

# 更新Docker镜像
update_docker_images() {
    print_message "🐳 更新Docker镜像..."
    
    # 拉取最新镜像
    docker pull nginx:alpine
    docker pull mysql:8.0
    docker pull wordpress:latest
    docker pull node:18-alpine
    
    print_info "✅ Docker镜像更新完成"
}

# 数据库迁移
run_db_migration() {
    print_message "📊 执行数据库迁移..."
    
    local migration_sql="
-- 耗材表：添加中英文名称字段
ALTER TABLE wp_bjt_consumables
  ADD COLUMN IF NOT EXISTS name_zh VARCHAR(255) NOT NULL DEFAULT '' COMMENT '中文名称' AFTER part_number,
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NOT NULL DEFAULT '' COMMENT '英文名称' AFTER name_zh;

-- 更新现有数据
UPDATE wp_bjt_consumables
   SET name_zh = IF(name_zh='', title_zh, name_zh),
       name_en = IF(name_en='', title_en, name_en);

-- 配件表：添加标题字段
ALTER TABLE wp_bjt_accessories
  ADD COLUMN IF NOT EXISTS title_zh VARCHAR(255) NOT NULL DEFAULT '' COMMENT '中文标题' AFTER name_en,
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) NOT NULL DEFAULT '' COMMENT '英文标题' AFTER title_zh;

-- 订单表：添加货币和地址字段
ALTER TABLE wp_bjt_orders
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '货币代码' AFTER total_amount,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL COMMENT '发货地址(JSON)' AFTER status,
  ADD COLUMN IF NOT EXISTS billing_address TEXT NULL COMMENT '账单地址(JSON)' AFTER shipping_address,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL COMMENT '支付方式' AFTER billing_address;

-- 订单项表：添加详细字段
ALTER TABLE wp_bjt_order_items
  ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) NOT NULL DEFAULT 'product' COMMENT '条目类型' AFTER price,
  ADD COLUMN IF NOT EXISTS item_id VARCHAR(100) NOT NULL COMMENT '料号或ID' AFTER item_type,
  ADD COLUMN IF NOT EXISTS item_name VARCHAR(255) NULL COMMENT '显示名称' AFTER item_id,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '货币' AFTER item_name;
"
    
    if echo "$migration_sql" | $COMPOSE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}; then
        print_info "✅ 数据库迁移完成"
    else
        print_warning "❌ 数据库迁移失败，请手动检查"
    fi
}

# 部署服务
deploy_services() {
    print_message "🚀 部署服务..."
    
    # 停止当前服务
    print_info "⏹️  停止当前服务..."
    $COMPOSE down
    
    # 构建新镜像
    print_info "🔨 构建Docker镜像..."
    $COMPOSE build --no-cache
    
    # 启动服务
    print_info "▶️  启动服务..."
    $COMPOSE up -d
    
    # 等待服务启动
    print_info "⏱️  等待服务启动..."
    sleep 30
    
    # 显示服务状态
    print_info "📊 服务状态："
    $COMPOSE ps
    
    print_info "✅ 服务部署完成"
}

# 增强版健康检查
health_check() {
    if [ "$SKIP_HEALTH_CHECK" = true ]; then
        print_warning "⏭️  跳过健康检查"
        return 0
    fi
    
    print_message "🏥 执行健康检查..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_info "🔍 健康检查 (${attempt}/${max_attempts})..."
        
        # 检查前端服务
        if curl -f -s --connect-timeout 10 "https://${DOMAIN_NAME}" > /dev/null; then
            print_info "✅ 前端服务正常"
            
            # 检查API服务
            if curl -f -s --connect-timeout 10 "https://${DOMAIN_NAME}/wp-json/bjt/v1" > /dev/null; then
                print_info "✅ API服务正常"
                
                # 检查版本信息
                if curl -f -s --connect-timeout 10 "https://${DOMAIN_NAME}/version.json" > /dev/null; then
                    print_info "✅ 版本信息可访问"
                    
                    # 获取并显示版本信息
                    local version_info=$(curl -s "https://${DOMAIN_NAME}/version.json" | jq -r '.buildTimestamp // "unknown"' 2>/dev/null || echo "unknown")
                    if [ "$version_info" = "$DEPLOYMENT_VERSION" ]; then
                        print_info "✅ 版本验证通过: $version_info"
                        print_info "🎉 健康检查完全通过"
                        return 0
                    else
                        print_warning "⚠️  版本不匹配: 期望 $DEPLOYMENT_VERSION, 实际 $version_info"
                    fi
                else
                    print_warning "⚠️  版本信息不可访问"
                fi
            else
                print_warning "⚠️  API服务异常"
            fi
        else
            print_warning "⚠️  前端服务异常"
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            print_info "⏳ 等待 10 秒后重试..."
            sleep 10
        fi
        
        ((attempt++))
    done
    
    print_error "❌ 健康检查失败"
    return 1
}

# 清理旧资源
cleanup() {
    print_message "🧹 清理旧资源..."
    
    # 清理Docker镜像
    docker image prune -f
    
    # 清理旧的备份文件（保留最近5个）
    if [ -d "backups" ]; then
        find backups -type d -name "deployment_*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
    fi
    
    print_info "✅ 清理完成"
}

# 显示部署结果
show_deployment_result() {
    print_message "📊 部署结果摘要"
    echo "===================="
    echo "🕐 部署时间: $(date)"
    echo "🏷️  部署版本: $DEPLOYMENT_VERSION"
    echo "🆔 部署ID: $DEPLOYMENT_TIMESTAMP"
    echo "🌐 访问地址: https://${DOMAIN_NAME}"
    echo "📊 版本信息: https://${DOMAIN_NAME}/version.json"
    echo "🔍 带版本号的访问链接："
    echo "   - 主页: https://${DOMAIN_NAME}/?v=${DEPLOYMENT_VERSION}"
    echo "   - 管理后台: https://${DOMAIN_NAME}/admin?v=${DEPLOYMENT_VERSION}"
    echo "===================="
    echo
    print_info "💡 验证部署："
    echo "1. 硬刷新浏览器: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)"
    echo "2. 使用无痕模式访问网站"
    echo "3. 检查开发者工具中的网络请求，确认加载的是新版本"
    echo "4. 验证购物车和耗材筛选功能是否正常"
    echo
    print_info "🛠️  管理命令："
    echo "   - 查看日志: $COMPOSE logs -f"
    echo "   - 查看状态: $COMPOSE ps"
    echo "   - 重启服务: $COMPOSE restart"
}

# 主函数
main() {
    print_message "🚀 BJT Product System - 增强版生产环境部署"
    print_info "部署ID: $DEPLOYMENT_TIMESTAMP"
    print_info "部署版本: $DEPLOYMENT_VERSION"
    echo
    
    # 检查是否在项目根目录
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 加载环境变量
    if [ -f ".env.production" ]; then
        print_info "📥 加载环境变量..."
        if load_env_file ".env.production"; then
            print_info "✅ 环境变量加载成功"
        else
            print_error "❌ 环境变量加载失败"
            exit 1
        fi
    else
        print_error "❌ .env.production 文件不存在"
        print_info "请从 env.production.example 复制并配置："
        print_info "  cp env.production.example .env.production"
        exit 1
    fi
    
    # 执行部署步骤
    check_env_vars
    check_code_version
    backup_current_deployment
    build_frontend
    setup_upload_permissions
    update_docker_images
    deploy_services
    
    # 等待服务稳定
    print_info "⏱️  等待服务稳定..."
    sleep 15
    
    # 执行健康检查
    if health_check; then
        run_db_migration
        cleanup
        show_deployment_result
        print_message "🎉 部署成功完成！"
    else
        print_error "❌ 部署完成但健康检查失败"
        print_info "查看日志: $COMPOSE logs --tail=50"
        show_deployment_result
        exit 1
    fi
}

# 解析命令行参数
parse_arguments "$@"

# 运行主函数
main 