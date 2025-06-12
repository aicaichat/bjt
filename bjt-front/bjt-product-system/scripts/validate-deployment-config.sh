#!/bin/bash

# BJT Product System - 部署配置验证工具
# 使用方法: ./scripts/validate-deployment-config.sh

set -e

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

# 检查环境文件
check_env_file() {
    local env_file=".env.production"
    
    print_message "检查环境配置文件..."
    
    if [ ! -f "$env_file" ]; then
        print_error "环境文件不存在: $env_file"
        return 1
    fi
    
    # 检查必要的环境变量
    local required_vars=(
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
    
    # 读取环境文件
    while IFS= read -r line; do
        # 跳过空行和注释
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # 匹配键值对
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # 去除引号
            if [[ "$value" =~ ^\'(.*)\'$ ]] || [[ "$value" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            
            export "$key=$value"
        fi
    done < "$env_file"
    
    # 检查缺失的变量
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "环境文件中缺少以下变量："
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    print_message "✅ 环境配置检查通过"
    print_info "目标域名: $DOMAIN_NAME"
    
    return 0
}

# 检查nginx配置文件
check_nginx_config() {
    print_message "检查nginx配置文件..."
    
    local config_files=(
        "nginx/conf.d/production.conf"
        "nginx/conf.d/default.conf"
    )
    
    local production_config=""
    local found_production=false
    
    # 检查生产环境配置文件
    for config in "${config_files[@]}"; do
        if [ -f "$config" ]; then
            print_info "发现配置文件: $config"
            
            if [[ "$config" == *"production"* ]]; then
                production_config="$config"
                found_production=true
            fi
        fi
    done
    
    if [ "$found_production" = false ]; then
        print_error "未找到生产环境nginx配置文件 (production.conf)"
        return 1
    fi
    
    print_info "使用配置文件: $production_config"
    
    # 检查配置文件内容
    if [ ! -z "$DOMAIN_NAME" ]; then
        if ! grep -q "$DOMAIN_NAME" "$production_config"; then
            print_error "nginx配置文件中未找到域名: $DOMAIN_NAME"
            print_info "请确保配置文件的server_name包含正确的域名"
            return 1
        fi
    fi
    
    # 检查SSL配置
    if ! grep -q "ssl_certificate" "$production_config"; then
        print_error "nginx配置文件缺少SSL配置"
        return 1
    fi
    
    # 检查HTTPS重定向
    if ! grep -q "return 301 https" "$production_config"; then
        print_warning "nginx配置文件可能缺少HTTP到HTTPS重定向"
    fi
    
    # 检查是否包含WordPress代理配置
    if ! grep -q "wp-admin\|wp-json" "$production_config"; then
        print_warning "nginx配置文件可能缺少WordPress路由配置"
    fi
    
    print_message "✅ nginx配置检查通过"
    return 0
}

# 检查Docker配置
check_docker_config() {
    print_message "检查Docker配置文件..."
    
    local docker_file="docker/prod/docker-compose.prod.yml"
    
    if [ ! -f "$docker_file" ]; then
        print_error "Docker Compose文件不存在: $docker_file"
        return 1
    fi
    
    # 检查nginx配置文件引用
    if ! grep -q "nginx/conf.d/production.conf" "$docker_file"; then
        print_warning "Docker配置可能未使用正确的nginx配置文件"
        
        # 检查Dockerfile中的配置
        local dockerfile="docker/nginx/Dockerfile.prod"
        if [ -f "$dockerfile" ]; then
            if grep -q "nginx/conf.d/production.conf" "$dockerfile"; then
                print_info "Dockerfile中使用了正确的生产配置"
            else
                print_error "Dockerfile中未使用生产环境配置文件"
                return 1
            fi
        fi
    fi
    
    # 检查SSL证书挂载
    if ! grep -q "nginx/ssl" "$docker_file"; then
        print_error "Docker配置文件缺少SSL证书挂载"
        return 1
    fi
    
    # 检查环境变量引用
    if ! grep -q ".env.production" "$docker_file"; then
        print_warning "Docker配置文件可能未引用环境文件"
    fi
    
    print_message "✅ Docker配置检查通过"
    return 0
}

# 检查SSL证书
check_ssl_certificate() {
    print_message "检查SSL证书配置..."
    
    local ssl_dir="nginx/ssl"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/private.key"
    
    if [ ! -d "$ssl_dir" ]; then
        print_warning "SSL证书目录不存在: $ssl_dir"
        print_info "将在部署时使用默认证书"
        return 0
    fi
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        print_warning "SSL证书文件不完整"
        print_info "证书文件: $cert_file"
        print_info "私钥文件: $key_file"
        return 0
    fi
    
    # 检查证书有效性
    if ! openssl x509 -in "$cert_file" -noout -text &>/dev/null; then
        print_error "SSL证书文件格式错误"
        return 1
    fi
    
    # 检查私钥有效性
    if ! openssl rsa -in "$key_file" -check -noout &>/dev/null; then
        print_error "SSL私钥文件格式错误"
        return 1
    fi
    
    # 检查证书和私钥匹配
    local cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" 2>/dev/null | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        print_error "SSL证书和私钥不匹配"
        return 1
    fi
    
    # 检查证书有效期
    local expiry=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
    local current_timestamp=$(date +%s)
    
    if [ "$expiry_timestamp" -lt "$current_timestamp" ]; then
        print_error "SSL证书已过期: $expiry"
        return 1
    fi
    
    local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ "$days_left" -lt 30 ]; then
        print_warning "SSL证书即将过期 (剩余 $days_left 天): $expiry"
    else
        print_info "SSL证书有效期至: $expiry (剩余 $days_left 天)"
    fi
    
    # 检查证书颁发者
    local issuer=$(openssl x509 -in "$cert_file" -noout -issuer 2>/dev/null | cut -d= -f4-)
    if [[ "$issuer" == *"Let's Encrypt"* ]]; then
        print_message "✅ 使用Let's Encrypt正式证书"
    else
        print_warning "使用自签名证书，浏览器会显示安全警告"
    fi
    
    print_message "✅ SSL证书检查通过"
    return 0
}

# 检查前端配置
check_frontend_config() {
    print_message "检查前端配置..."
    
    local package_file="frontend/package.json"
    
    if [ ! -f "$package_file" ]; then
        print_error "前端package.json文件不存在"
        return 1
    fi
    
    # 检查构建脚本
    if ! grep -q "build" "$package_file"; then
        print_error "前端package.json缺少构建脚本"
        return 1
    fi
    
    # 检查是否有跳过检查的构建脚本
    if ! grep -q "build:skip-check" "$package_file"; then
        print_warning "建议添加build:skip-check脚本以跳过TypeScript检查"
    fi
    
    print_message "✅ 前端配置检查通过"
    return 0
}

# 检查Let's Encrypt证书
check_letsencrypt_certificate() {
    print_message "检查Let's Encrypt证书..."
    
    if [ -z "$DOMAIN_NAME" ]; then
        print_warning "域名未设置，跳过Let's Encrypt检查"
        return 0
    fi
    
    local letsencrypt_cert="/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"
    local letsencrypt_key="/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem"
    
    if [ -f "$letsencrypt_cert" ] && [ -f "$letsencrypt_key" ]; then
        print_info "发现Let's Encrypt证书"
        
        # 检查证书有效期
        local expiry=$(openssl x509 -in "$letsencrypt_cert" -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
        local current_timestamp=$(date +%s)
        local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_left" -lt 30 ]; then
            print_warning "Let's Encrypt证书即将过期 (剩余 $days_left 天)"
            print_info "建议运行: sudo certbot renew"
        else
            print_message "Let's Encrypt证书有效 (剩余 $days_left 天)"
        fi
        
        # 检查是否需要同步到项目
        local project_cert="nginx/ssl/cert.pem"
        if [ -f "$project_cert" ]; then
            if [ "$letsencrypt_cert" -nt "$project_cert" ]; then
                print_warning "Let's Encrypt证书比项目证书更新，建议同步"
                print_info "同步命令: cp $letsencrypt_cert nginx/ssl/cert.pem"
                print_info "同步命令: cp $letsencrypt_key nginx/ssl/private.key"
            else
                print_info "项目证书是最新的"
            fi
        fi
        
    else
        print_info "未发现Let's Encrypt证书"
        print_info "如需申请证书，运行: sudo ./scripts/setup-ssl.sh $DOMAIN_NAME"
    fi
    
    return 0
}

# 生成配置报告
generate_report() {
    print_message "生成配置验证报告..."
    
    local report_file="config-validation-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "BJT产品管理系统 - 配置验证报告"
        echo "生成时间: $(date)"
        echo "======================================"
        echo ""
        
        echo "环境配置:"
        echo "  域名: ${DOMAIN_NAME:-未设置}"
        echo "  数据库: ${MYSQL_DATABASE:-未设置}"
        echo "  用户: ${MYSQL_USER:-未设置}"
        echo ""
        
        echo "文件检查:"
        echo "  .env.production: $([ -f ".env.production" ] && echo "✅" || echo "❌")"
        echo "  nginx/conf.d/production.conf: $([ -f "nginx/conf.d/production.conf" ] && echo "✅" || echo "❌")"
        echo "  docker/prod/docker-compose.prod.yml: $([ -f "docker/prod/docker-compose.prod.yml" ] && echo "✅" || echo "❌")"
        echo "  nginx/ssl/cert.pem: $([ -f "nginx/ssl/cert.pem" ] && echo "✅" || echo "❌")"
        echo "  nginx/ssl/private.key: $([ -f "nginx/ssl/private.key" ] && echo "✅" || echo "❌")"
        echo ""
        
        if [ -f "nginx/ssl/cert.pem" ]; then
            echo "SSL证书信息:"
            local issuer=$(openssl x509 -in nginx/ssl/cert.pem -noout -issuer 2>/dev/null | cut -d= -f4-)
            local expiry=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
            echo "  颁发者: $issuer"
            echo "  有效期: $expiry"
            echo ""
        fi
        
        if [ ! -z "$DOMAIN_NAME" ] && [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
            echo "Let's Encrypt证书:"
            local le_expiry=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
            echo "  有效期: $le_expiry"
            echo ""
        fi
        
    } > "$report_file"
    
    print_message "配置报告已生成: $report_file"
}

# 主函数
main() {
    print_message "🔍 BJT产品管理系统 - 部署配置验证"
    echo ""
    
    local check_failed=false
    
    # 执行各项检查
    check_env_file || check_failed=true
    check_nginx_config || check_failed=true
    check_docker_config || check_failed=true
    check_ssl_certificate || check_failed=true
    check_frontend_config || check_failed=true
    check_letsencrypt_certificate || check_failed=true
    
    echo ""
    generate_report
    
    if [ "$check_failed" = true ]; then
        print_error "❌ 配置验证失败，请修复上述问题后重新部署"
        exit 1
    else
        print_message "✅ 所有配置验证通过，可以安全部署！"
        echo ""
        print_info "建议的部署流程："
        echo "  1. ./deploy-production-improved.sh"
        echo "  2. ./scripts/health-monitor.sh --report"
        exit 0
    fi
}

# 执行主函数
main "$@" 