#!/bin/bash

# BJT Product System - 改进版生产环境部署脚本
# 使用方法: ./deploy-production-improved.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
        else
            print_warning "跳过无效的行: $line"
        fi
    done < "$env_file"
    
    print_message "环境变量加载完成"
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
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "以下环境变量未设置："
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_message "环境变量检查通过"
    print_info "目标域名: $DOMAIN_NAME"
}

# 验证nginx配置文件
validate_nginx_config() {
    print_message "验证nginx配置..."
    
    local config_file="nginx/conf.d/production.conf"
    
    # 检查配置文件是否存在
    if [ ! -f "$config_file" ]; then
        print_error "生产环境nginx配置文件不存在: $config_file"
        exit 1
    fi
    
    # 检查配置文件中的域名
    if ! grep -q "$DOMAIN_NAME" "$config_file"; then
        print_error "nginx配置文件中未找到域名: $DOMAIN_NAME"
        print_info "请确保配置文件包含正确的server_name"
        exit 1
    fi
    
    # 检查是否包含SSL配置
    if ! grep -q "ssl_certificate" "$config_file"; then
        print_error "nginx配置文件缺少SSL配置"
        exit 1
    fi
    
    # 检查是否配置了HTTPS重定向
    if ! grep -q "return 301 https" "$config_file"; then
        print_warning "nginx配置文件可能缺少HTTP到HTTPS重定向"
    fi
    
    print_message "nginx配置验证通过"
}

# 检查SSL证书状态
check_ssl_certificate() {
    print_message "检查SSL证书状态..."
    
    local ssl_cert="nginx/ssl/cert.pem"
    local ssl_key="nginx/ssl/private.key"
    
    # 检查证书文件是否存在
    if [ ! -f "$ssl_cert" ] || [ ! -f "$ssl_key" ]; then
        print_warning "SSL证书文件不存在，将使用默认自签名证书"
        return 0
    fi
    
    # 检查Let's Encrypt证书是否存在且更新
    local letsencrypt_cert="/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
    local letsencrypt_key="/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
    
    if [ -f "$letsencrypt_cert" ] && [ -f "$letsencrypt_key" ]; then
        print_info "发现Let's Encrypt证书，检查是否需要同步..."
        
        # 比较证书的修改时间
        if [ "$letsencrypt_cert" -nt "$ssl_cert" ]; then
            print_warning "Let's Encrypt证书比项目中的证书更新，建议同步"
            read -p "是否同步Let's Encrypt证书到项目？(y/n): " sync_cert
            
            if [ "$sync_cert" = "y" ] || [ "$sync_cert" = "Y" ]; then
                sync_letsencrypt_certificate
            fi
        else
            print_message "项目中的证书是最新的"
        fi
        
        # 检查证书颁发者
        local issuer=$(openssl x509 -in "$ssl_cert" -noout -issuer 2>/dev/null || echo "unknown")
        if [[ "$issuer" == *"Let's Encrypt"* ]]; then
            print_message "使用Let's Encrypt正式证书"
        else
            print_warning "使用自签名证书，浏览器会显示安全警告"
        fi
        
        # 检查证书有效期
        local expiry=$(openssl x509 -in "$ssl_cert" -noout -enddate 2>/dev/null | cut -d= -f2)
        print_info "证书有效期至: $expiry"
        
    else
        print_warning "未发现Let's Encrypt证书，使用项目中的证书"
    fi
}

# 同步Let's Encrypt证书
sync_letsencrypt_certificate() {
    print_message "同步Let's Encrypt证书..."
    
    local letsencrypt_cert="/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
    local letsencrypt_key="/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
    
    if [ -f "$letsencrypt_cert" ] && [ -f "$letsencrypt_key" ]; then
        # 备份当前证书
        if [ -f "nginx/ssl/cert.pem" ]; then
            cp nginx/ssl/cert.pem nginx/ssl/cert.pem.backup.$(date +%Y%m%d_%H%M%S)
            cp nginx/ssl/private.key nginx/ssl/private.key.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # 复制新证书
        cp "$letsencrypt_cert" nginx/ssl/cert.pem
        cp "$letsencrypt_key" nginx/ssl/private.key
        
        # 设置权限
        chmod 644 nginx/ssl/cert.pem
        chmod 600 nginx/ssl/private.key
        
        print_message "Let's Encrypt证书同步完成"
    else
        print_error "Let's Encrypt证书文件不存在"
        exit 1
    fi
}

# 预部署检查
pre_deploy_check() {
    print_message "执行部署前检查..."
    
    # 检查Docker和Docker Compose
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装"
        exit 1
    fi
    
    # 检查必要的文件和目录
    local required_files=(
        "docker/prod/docker-compose.prod.yml"
        "nginx/conf.d/production.conf"
        "frontend/package.json"
        ".env.production"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "必要文件不存在: $file"
            exit 1
        fi
    done
    
    # 检查端口占用
    if netstat -tlnp | grep -q ":80 "; then
        print_warning "端口80已被占用，部署过程中会停止现有服务"
    fi
    
    if netstat -tlnp | grep -q ":443 "; then
        print_warning "端口443已被占用，部署过程中会停止现有服务"
    fi
    
    print_message "部署前检查通过"
}

# 备份当前部署
backup_current_deployment() {
    print_message "备份当前部署..."
    
    backup_dir="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$backup_dir"
    
    # 备份环境配置
    if [ -f ".env.production" ]; then
        cp .env.production "$backup_dir/"
    fi
    
    # 备份nginx配置
    if [ -d "nginx/conf.d" ]; then
        cp -r nginx/conf.d "$backup_dir/"
    fi
    
    # 备份SSL证书
    if [ -d "nginx/ssl" ]; then
        cp -r nginx/ssl "$backup_dir/"
    fi
    
    # 备份数据库（如果服务正在运行）
    if docker-compose -f docker/prod/docker-compose.prod.yml ps mysql | grep -q "Up"; then
        print_info "备份数据库..."
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$backup_dir/database.sql" 2>/dev/null; then
            print_message "数据库备份完成"
        else
            print_warning "数据库备份失败，继续部署..."
        fi
    fi
    
    print_message "备份完成，保存在: $backup_dir"
}

# 构建前端应用
build_frontend() {
    print_message "构建前端应用..."
    
    cd frontend
    
    # 清理之前的构建
    if [ -d "build" ]; then
        rm -rf build
    fi
    
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 安装依赖
    print_info "安装前端依赖..."
    npm ci
    
    # 构建生产版本
    print_info "构建前端生产版本..."
    VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1" npm run build:skip-check
    
    # 验证构建结果
    if [ ! -f "build/index.html" ] && [ ! -f "dist/index.html" ]; then
        print_error "前端构建失败，未生成index.html"
        exit 1
    fi
    
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
    
    print_info "uploads目录结构已创建"
    
    # 设置正确的权限
    print_info "设置目录权限..."
    
    # 设置目录权限为755，文件权限为644
    find frontend/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true
    find frontend/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    # 确保上传目录可写
    chmod -R 755 frontend/public/uploads 2>/dev/null || true
    
    print_message "upload目录权限设置完成"
    
    # 测试文件创建权限
    local test_file="frontend/public/uploads/test-$(date +%s).txt"
    if echo "Test file created at $(date)" > "$test_file" 2>/dev/null; then
        print_message "✅ 文件权限测试成功"
        rm "$test_file" 2>/dev/null || true
    else
        print_warning "⚠️ 文件权限测试失败，但继续部署..."
    fi
}

# 部署服务
deploy_services() {
    print_message "部署服务..."
    
    # 停止当前服务
    print_info "停止当前服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml down || true
    
    # 构建新镜像
    print_info "构建 Docker 镜像..."
    docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache
    
    # 启动服务
    print_info "启动服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 30
}

# 验证数据库初始化状态
verify_database_initialization() {
    print_message "验证数据库初始化状态..."
    
    # 等待数据库完全启动
    local max_wait=60
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; SHOW TABLES;" &>/dev/null; then
            print_message "✅ 数据库连接正常"
            break
        fi
        print_info "等待数据库启动... (${wait_time}s/${max_wait}s)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        print_error "数据库启动超时"
        return 1
    fi
    
    # 检查关键表是否存在
    local tables=(
        "wp_bjt_products"
        "wp_bjt_accessories" 
        "wp_bjt_consumables"
        "wp_bjt_spare_parts"
        "wp_users"
    )
    
    for table in "${tables[@]}"; do
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; DESCRIBE $table;" &>/dev/null; then
            print_message "✅ 表 $table 存在"
        else
            print_warning "⚠️ 表 $table 不存在或未初始化"
        fi
    done
    
    # 检查是否有初始数据
    local product_count=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; SELECT COUNT(*) FROM wp_bjt_products;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$product_count" -gt 0 ] 2>/dev/null; then
        print_message "✅ 数据库包含 $product_count 个产品数据"
    else
        print_warning "⚠️ 产品数据表为空，可能需要数据导入"
    fi
    
    # 检查用户账号
    local user_count=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; SELECT COUNT(*) FROM wp_users;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$user_count" -gt 0 ] 2>/dev/null; then
        print_message "✅ 数据库包含 $user_count 个用户账号"
    else
        print_warning "⚠️ 用户账号表为空，可能需要初始化账号"
    fi
    
    print_message "数据库初始化验证完成"
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_info "健康检查 (第$attempt次)..."
        
        # 检查HTTP重定向
        local http_status=$(curl -o /dev/null -s -w "%{http_code}" "http://$DOMAIN_NAME/" || echo "000")
        if [ "$http_status" = "301" ]; then
            print_message "✅ HTTP重定向正常 (301)"
        else
            print_warning "⚠️  HTTP状态异常: $http_status"
        fi
        
        # 检查HTTPS访问
        local https_status=$(curl -k -o /dev/null -s -w "%{http_code}" "https://$DOMAIN_NAME/" || echo "000")
        if [ "$https_status" = "200" ]; then
            print_message "✅ HTTPS访问正常 (200)"
            
            # 检查前端内容
            if curl -k -s "https://$DOMAIN_NAME/" | grep -q "BJT\|产品\|管理"; then
                print_message "✅ 前端内容正常"
            else
                print_warning "⚠️  前端内容检查失败"
            fi
        else
            print_warning "⚠️  HTTPS状态异常: $https_status"
        fi
        
        # 检查API
        local api_status=$(curl -k -o /dev/null -s -w "%{http_code}" "https://$DOMAIN_NAME/wp-json/bjt/v1/health" || echo "000")
        if [ "$api_status" = "200" ]; then
            print_message "✅ API接口正常 (200)"
        else
            print_warning "⚠️  API状态异常: $api_status"
        fi
        
        # 检查uploads目录访问
        local uploads_status=$(curl -k -o /dev/null -s -w "%{http_code}" "https://$DOMAIN_NAME/uploads/" || echo "000")
        if [ "$uploads_status" = "200" ] || [ "$uploads_status" = "404" ] || [ "$uploads_status" = "403" ]; then
            print_message "✅ uploads目录路由正常"
        else
            print_warning "⚠️  uploads目录访问异常: $uploads_status"
        fi
        
        # 检查WordPress管理后台
        local wp_admin_status=$(curl -k -o /dev/null -s -w "%{http_code}" "https://$DOMAIN_NAME/wp-admin/" || echo "000")
        if [ "$wp_admin_status" = "200" ] || [ "$wp_admin_status" = "302" ]; then
            print_message "✅ WordPress后台正常"
        else
            print_warning "⚠️  WordPress后台异常: $wp_admin_status"
        fi
        
        if [ "$https_status" = "200" ] && curl -k -s "https://$DOMAIN_NAME/" | grep -q "BJT\|产品\|管理"; then
            print_message "🎉 健康检查通过！"
            return 0
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -le $max_attempts ]; then
            print_info "等待10秒后重试..."
            sleep 10
        fi
    done
    
    print_error "健康检查失败"
    return 1
}

# 显示部署结果
show_deployment_result() {
    print_message "=== 部署完成 ==="
    echo ""
    echo "🌐 网站地址: https://$DOMAIN_NAME"
    echo "🔐 WordPress后台: https://$DOMAIN_NAME/wp-admin"
    echo "🔌 API接口: https://$DOMAIN_NAME/wp-json/bjt/v1"
    echo "📁 文件上传: https://$DOMAIN_NAME/uploads/"
    echo ""
    
    # 显示证书信息
    if [ -f "nginx/ssl/cert.pem" ]; then
        local issuer=$(openssl x509 -in nginx/ssl/cert.pem -noout -issuer 2>/dev/null | cut -d= -f4-)
        local expiry=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        echo "🔒 SSL证书颁发者: $issuer"
        echo "📅 证书有效期至: $expiry"
        
        if [[ "$issuer" == *"Let's Encrypt"* ]]; then
            echo "✅ 使用Let's Encrypt正式证书"
        else
            echo "⚠️  使用自签名证书，浏览器会显示安全警告"
            echo "   建议运行: sudo ./scripts/setup-ssl.sh $DOMAIN_NAME"
        fi
    fi
    
    echo ""
    echo "📊 服务状态:"
    docker-compose -f docker/prod/docker-compose.prod.yml ps
    
    echo ""
    echo "🗄️ 数据库状态:"
    local product_count=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; SELECT COUNT(*) FROM wp_bjt_products;" 2>/dev/null | tail -1 || echo "0")
    local user_count=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "USE ${MYSQL_DATABASE}; SELECT COUNT(*) FROM wp_users;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$product_count" -gt 0 ] 2>/dev/null; then
        echo "   ✅ 产品数据: $product_count 条记录"
    else
        echo "   ⚠️  产品数据: 未初始化"
    fi
    
    if [ "$user_count" -gt 0 ] 2>/dev/null; then
        echo "   ✅ 用户账号: $user_count 个用户"
    else
        echo "   ⚠️  用户账号: 未初始化"
    fi
    
    echo ""
    echo "📁 文件上传系统:"
    if [ -d "frontend/public/uploads" ]; then
        local upload_dirs=$(find frontend/public/uploads -type d | wc -l)
        echo "   ✅ 上传目录: $upload_dirs 个目录已创建"
        echo "   ✅ 权限设置: 已配置"
    else
        echo "   ⚠️  上传目录: 未找到"
    fi
    
    echo ""
    echo "🔄 维护命令:"
    echo "   SSL证书续期: sudo certbot renew"
    echo "   健康监控: ./scripts/health-monitor.sh"
    echo "   配置验证: ./scripts/validate-deployment-config.sh"
    echo "   零停机前端更新: ./deploy-frontend-zero-downtime.sh"
    
    echo ""
    echo "📖 快速访问链接:"
    echo "   前端系统: https://$DOMAIN_NAME"
    echo "   管理后台: https://$DOMAIN_NAME/wp-admin"
    echo "   API文档: https://$DOMAIN_NAME/wp-json/bjt/v1"
}

# 错误处理
handle_error() {
    local exit_code=$?
    print_error "部署过程中出现错误 (退出码: $exit_code)"
    
    # 显示最近的日志
    if [ -f "docker/prod/docker-compose.prod.yml" ]; then
        print_info "显示最近的服务日志:"
        docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=20
    fi
    
    exit $exit_code
}

# 主函数
main() {
    trap handle_error ERR
    
    print_message "🚀 BJT产品管理系统 - 改进版生产环境部署"
    echo ""
    
    # 加载环境变量
    load_env_file ".env.production"
    
    # 执行各个步骤
    check_env_vars
    validate_nginx_config
    check_ssl_certificate
    pre_deploy_check
    backup_current_deployment
    build_frontend
    setup_upload_permissions
    deploy_services
    
    # 验证数据库初始化状态
    verify_database_initialization
    
    # 执行健康检查
    if health_check; then
        show_deployment_result
        print_message "🎉 部署成功完成！"
    else
        print_error "部署完成但健康检查失败，请检查日志"
        show_deployment_result
        exit 1
    fi
}

# 执行主函数
main "$@" 