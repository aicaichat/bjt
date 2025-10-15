#!/bin/bash

# =============================================================================
# CDN 环境下 SSL 证书更新脚本
# 解决阿里云 CDN 导致的证书更新失败问题
# =============================================================================

set -e

# 配置变量
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
DOMAIN="eorder.lockedair.com"
EMAIL="admin@lockedair.com"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 CDN 状态
check_cdn_status() {
    log_info "检查 CDN 状态..."
    
    # 检查域名解析
    local resolved_ip=$(ping -c 1 $DOMAIN | head -1 | grep -oP '\([^)]+\)' | tr -d '()')
    local server_ip=$(curl -s ifconfig.me)
    
    log_info "域名解析: $DOMAIN → $resolved_ip"
    log_info "服务器 IP: $server_ip"
    
    if [[ "$resolved_ip" == "$server_ip" ]]; then
        log_success "域名已指向源站，可以更新证书"
        return 0
    else
        log_warning "域名指向 CDN ($resolved_ip)，需要处理"
        return 1
    fi
}

# 方案1：临时关闭 CDN
method_disable_cdn() {
    log_info "=== 方案1：临时关闭 CDN ==="
    echo ""
    echo "请在阿里云控制台执行以下操作："
    echo "1. 登录阿里云控制台"
    echo "2. 进入 CDN 管理 → 域名管理"
    echo "3. 找到 $DOMAIN → 管理"
    echo "4. 点击 '停用' 或 '暂停'"
    echo "5. 等待 DNS 生效（通常 5-10 分钟）"
    echo ""
    echo "执行完成后，按任意键继续..."
    read -p "按 Enter 键继续..."
    
    # 等待 DNS 生效
    log_info "等待 DNS 生效..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if check_cdn_status; then
            log_success "DNS 已生效，可以继续更新证书"
            return 0
        fi
        
        log_info "等待中... ($((attempt+1))/$max_attempts)"
        sleep 20
        ((attempt++))
    done
    
    log_error "DNS 生效超时，请检查 CDN 是否已关闭"
    return 1
}

# 方案2：使用 DNS 验证
method_dns_validation() {
    log_info "=== 方案2：使用 DNS 验证 ==="
    echo ""
    echo "使用 DNS 验证模式，无需关闭 CDN"
    echo ""
    
    # 使用 DNS 验证
    sudo certbot certonly --manual \
        --preferred-challenges dns \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos
    
    if [[ $? -eq 0 ]]; then
        log_success "DNS 验证成功，证书已更新"
        return 0
    else
        log_error "DNS 验证失败"
        return 1
    fi
}

# 方案3：使用 webroot 模式
method_webroot() {
    log_info "=== 方案3：使用 webroot 模式 ==="
    echo ""
    echo "使用 webroot 模式，需要配置 CDN 回源"
    echo ""
    
    # 创建 webroot 目录
    sudo mkdir -p /var/www/html/.well-known/acme-challenge
    sudo chown -R www-data:www-data /var/www/html/.well-known
    
    # 启动 nginx
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" start nginx
    sleep 5
    
    # 使用 webroot 模式
    sudo certbot certonly --webroot \
        -w /var/www/html \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
    
    if [[ $? -eq 0 ]]; then
        log_success "webroot 模式成功，证书已更新"
        return 0
    else
        log_error "webroot 模式失败"
        return 1
    fi
}

# 更新项目证书
update_project_cert() {
    log_info "更新项目证书文件..."
    
    # 创建 SSL 目录
    sudo mkdir -p "${PROJECT_ROOT}/nginx/ssl"
    
    # 复制证书
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${PROJECT_ROOT}/nginx/ssl/cert.pem"
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${PROJECT_ROOT}/nginx/ssl/private.key"
    
    # 设置权限
    sudo chmod 644 "${PROJECT_ROOT}/nginx/ssl/cert.pem"
    sudo chmod 600 "${PROJECT_ROOT}/nginx/ssl/private.key"
    sudo chown root:root "${PROJECT_ROOT}/nginx/ssl"/*
    
    log_success "项目证书文件已更新"
}

# 生成阿里云 CDN 证书
generate_aliyun_cert() {
    log_info "生成阿里云 CDN 证书文件..."
    
    # 生成 CDN 证书文件
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${PROJECT_ROOT}/aliyun_cert.pem"
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${PROJECT_ROOT}/aliyun_private.key"
    
    # 设置权限
    sudo chmod 644 "${PROJECT_ROOT}/aliyun_cert.pem"
    sudo chmod 600 "${PROJECT_ROOT}/aliyun_private.key"
    
    log_success "阿里云证书文件已生成"
    
    # 显示证书内容
    echo ""
    log_info "=== 证书内容（复制到阿里云 CDN） ==="
    echo "证书内容："
    cat "${PROJECT_ROOT}/aliyun_cert.pem"
    echo ""
    echo "私钥内容："
    cat "${PROJECT_ROOT}/aliyun_private.key"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 启动 nginx
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" start nginx
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" ps nginx | grep -q "Up"; then
        log_success "Nginx 服务启动成功"
    else
        log_error "Nginx 服务启动失败"
        return 1
    fi
}

# 验证证书
verify_certificates() {
    log_info "验证证书..."
    
    # 验证本地证书
    if openssl x509 -in "${PROJECT_ROOT}/nginx/ssl/cert.pem" -noout -checkend 86400; then
        log_success "本地证书验证通过"
    else
        log_error "本地证书验证失败"
        return 1
    fi
    
    # 显示证书信息
    log_info "证书信息:"
    openssl x509 -in "${PROJECT_ROOT}/nginx/ssl/cert.pem" -noout -dates -subject
}

# 显示阿里云配置说明
show_aliyun_config() {
    log_info "=== 阿里云 CDN 配置说明 ==="
    echo ""
    echo "证书更新完成后，需要在阿里云控制台配置 CDN SSL："
    echo ""
    echo "1. 登录阿里云控制台"
    echo "2. 进入 CDN 管理 → 域名管理"
    echo "3. 找到 $DOMAIN → 管理 → HTTPS 配置"
    echo "4. 选择 '自定义上传'"
    echo "5. 证书内容：复制上面显示的证书内容"
    echo "6. 私钥内容：复制上面显示的私钥内容"
    echo "7. 点击 '确定'"
    echo "8. 开启 '强制 HTTPS 跳转'"
    echo "9. 等待配置生效（5-10分钟）"
    echo ""
    echo "如果使用了方案1（关闭CDN），记得重新启用 CDN"
}

# 主函数
main() {
    local method="$1"
    
    echo "========================================"
    echo "CDN 环境下 SSL 证书更新脚本"
    echo "========================================"
    
    # 检查当前状态
    if check_cdn_status; then
        log_info "域名已指向源站，可以直接更新证书"
        method="direct"
    else
        log_warning "域名指向 CDN，需要选择更新方法"
    fi
    
    # 选择更新方法
    case "$method" in
        "disable-cdn")
            method_disable_cdn
            ;;
        "dns")
            method_dns_validation
            ;;
        "webroot")
            method_webroot
            ;;
        "direct")
            log_info "直接更新证书..."
            sudo certbot certonly --standalone \
                -d "$DOMAIN" \
                --email "$EMAIL" \
                --agree-tos \
                --non-interactive \
                --force-renewal
            ;;
        *)
            echo "请选择更新方法："
            echo "1. disable-cdn - 临时关闭 CDN（推荐）"
            echo "2. dns - 使用 DNS 验证"
            echo "3. webroot - 使用 webroot 模式"
            echo ""
            echo "用法: $0 [disable-cdn|dns|webroot]"
            exit 1
            ;;
    esac
    
    if [[ $? -eq 0 ]]; then
        # 更新项目证书
        update_project_cert
        generate_aliyun_cert
        restart_services
        verify_certificates
        show_aliyun_config
        
        log_success "证书更新完成！"
    else
        log_error "证书更新失败"
        exit 1
    fi
}

# 运行主函数
main "$@"


