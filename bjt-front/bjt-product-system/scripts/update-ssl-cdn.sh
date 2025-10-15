#!/bin/bash

# =============================================================================
# BJT 生产系统 SSL 证书更新脚本 (CDN 环境)
# =============================================================================

set -e

# 配置变量
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
SSL_DIR="${PROJECT_ROOT}/nginx/ssl"
BACKUP_DIR="${SSL_DIR}/backup-$(date +%Y%m%d_%H%M%S)"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
DOMAIN="eorder.lockedair.com"
EMAIL="admin@lockedair.com"

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

# 检查现有证书
check_existing_cert() {
    log_info "检查现有证书..."
    
    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
        local expiry_date=$(sudo openssl x509 -in "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        log_info "现有证书还有 $days_until_expiry 天过期"
        
        if [[ $days_until_expiry -gt 30 ]]; then
            log_success "证书还有效，无需更新"
            return 0
        else
            log_warning "证书即将过期，需要更新"
            return 1
        fi
    else
        log_warning "未找到现有证书"
        return 1
    fi
}

# 备份现有证书
backup_certificates() {
    log_info "备份现有证书..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份 Let's Encrypt 证书
    if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
        sudo cp -r "/etc/letsencrypt/live/${DOMAIN}" "$BACKUP_DIR/letsencrypt-${DOMAIN}"
    fi
    
    # 备份项目证书
    if [[ -d "$SSL_DIR" ]]; then
        cp -r "$SSL_DIR" "$BACKUP_DIR/project-ssl"
    fi
    
    log_success "证书已备份到: $BACKUP_DIR"
}

# 更新 Let's Encrypt 证书
update_letsencrypt_cert() {
    log_info "更新 Let's Encrypt 证书..."
    
    # 停止 nginx 容器
    log_info "停止 Nginx 容器..."
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" stop nginx
    
    # 等待端口释放
    sleep 5
    
    # 强制更新证书
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal
    
    if [[ $? -eq 0 ]]; then
        log_success "Let's Encrypt 证书更新成功"
    else
        log_error "Let's Encrypt 证书更新失败"
        return 1
    fi
}

# 更新项目证书
update_project_cert() {
    log_info "更新项目证书文件..."
    
    # 创建 SSL 目录
    mkdir -p "$SSL_DIR"
    
    # 复制新证书
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "$SSL_DIR/private.key"
    
    # 设置权限
    sudo chmod 644 "$SSL_DIR/cert.pem"
    sudo chmod 600 "$SSL_DIR/private.key"
    sudo chown root:root "$SSL_DIR"/*
    
    log_success "项目证书文件已更新"
}

# 生成阿里云 CDN 证书文件
generate_aliyun_cert() {
    log_info "生成阿里云 CDN 证书文件..."
    
    # 创建阿里云证书文件
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${PROJECT_ROOT}/aliyun_cert.pem"
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${PROJECT_ROOT}/aliyun_private.key"
    
    # 设置权限
    sudo chmod 644 "${PROJECT_ROOT}/aliyun_cert.pem"
    sudo chmod 600 "${PROJECT_ROOT}/aliyun_private.key"
    
    log_success "阿里云证书文件已生成"
    log_info "证书文件位置:"
    log_info "  证书: ${PROJECT_ROOT}/aliyun_cert.pem"
    log_info "  私钥: ${PROJECT_ROOT}/aliyun_private.key"
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
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -checkend 86400; then
        log_success "本地证书验证通过"
    else
        log_error "本地证书验证失败"
        return 1
    fi
    
    # 验证 HTTPS 连接
    log_info "测试 HTTPS 连接..."
    if curl -s --max-time 10 "https://${DOMAIN}" > /dev/null; then
        log_success "HTTPS 连接正常"
    else
        log_warning "HTTPS 连接测试失败（可能是 CDN 配置问题）"
    fi
    
    # 显示证书信息
    log_info "证书信息:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates -subject
}

# 显示阿里云配置说明
show_aliyun_config() {
    log_info "=== 阿里云 CDN 配置说明 ==="
    echo ""
    echo "1. 登录阿里云控制台"
    echo "2. 进入 CDN 管理 → 域名管理"
    echo "3. 找到 ${DOMAIN} → 管理 → HTTPS 配置"
    echo "4. 上传证书文件："
    echo "   证书内容: $(cat ${PROJECT_ROOT}/aliyun_cert.pem)"
    echo "   私钥内容: $(cat ${PROJECT_ROOT}/aliyun_private.key)"
    echo "5. 开启强制 HTTPS 跳转"
    echo "6. 等待配置生效（5-10分钟）"
    echo ""
    echo "证书文件已准备好，请复制上述内容到阿里云控制台"
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置自动续期..."
    
    # 创建续期脚本
    sudo tee /etc/cron.d/bjt-ssl-renewal << EOF
# BJT SSL 证书自动续期
0 2 1 * * root ${PROJECT_ROOT}/scripts/update-ssl-cdn.sh auto-renew
EOF
    
    # 创建自动续期脚本
    sudo tee "${PROJECT_ROOT}/scripts/auto-renew-ssl.sh" << 'SCRIPT'
#!/bin/bash
cd /var/bjt/www/bjt/bjt-front/bjt-product-system
./scripts/update-ssl-cdn.sh auto-renew
SCRIPT
    
    sudo chmod +x "${PROJECT_ROOT}/scripts/auto-renew-ssl.sh"
    
    log_success "自动续期已设置"
}

# 主函数
main() {
    local mode="$1"
    
    echo "========================================"
    echo "BJT 生产系统 SSL 证书更新 (CDN 环境)"
    echo "========================================"
    
    case "$mode" in
        "auto-renew")
            log_info "自动续期模式"
            ;;
        "force")
            log_info "强制更新模式"
            ;;
        "")
            log_info "标准更新模式"
            ;;
        *)
            echo "用法: $0 [auto-renew|force]"
            echo "  auto-renew: 自动续期模式"
            echo "  force: 强制更新模式"
            exit 1
            ;;
    esac
    
    # 检查现有证书
    if [[ "$mode" != "force" ]] && check_existing_cert; then
        log_info "证书还有效，跳过更新"
        exit 0
    fi
    
    # 执行更新流程
    backup_certificates
    update_letsencrypt_cert
    update_project_cert
    generate_aliyun_cert
    restart_services
    verify_certificates
    show_aliyun_config
    
    log_success "证书更新完成！"
    log_info "请按照上述说明在阿里云控制台配置 CDN SSL"
}

# 运行主函数
main "$@"


