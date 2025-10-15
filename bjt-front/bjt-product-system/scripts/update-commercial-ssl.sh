#!/bin/bash

# =============================================================================
# 商业证书更新脚本 (阿里云 CDN + 源站)
# =============================================================================

set -e

# 配置变量
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
SSL_DIR="${PROJECT_ROOT}/nginx/ssl"
BACKUP_DIR="${SSL_DIR}/backup-$(date +%Y%m%d_%H%M%S)"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
DOMAIN="eorder.lockedair.com"

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

# 检查证书文件
check_certificate_files() {
    local cert_file="$1"
    local key_file="$2"
    
    log_info "检查证书文件..."
    
    # 检查文件是否存在
    if [[ ! -f "$cert_file" ]]; then
        log_error "证书文件不存在: $cert_file"
        return 1
    fi
    
    if [[ ! -f "$key_file" ]]; then
        log_error "私钥文件不存在: $key_file"
        return 1
    fi
    
    # 验证证书格式
    if ! openssl x509 -in "$cert_file" -text -noout &>/dev/null; then
        log_error "证书文件格式无效: $cert_file"
        return 1
    fi
    
    # 验证私钥格式
    if ! openssl rsa -in "$key_file" -check -noout &>/dev/null; then
        log_error "私钥文件格式无效: $key_file"
        return 1
    fi
    
    # 验证证书和私钥是否匹配
    local cert_md5=$(openssl x509 -noout -modulus -in "$cert_file" | openssl md5)
    local key_md5=$(openssl rsa -noout -modulus -in "$key_file" | openssl md5)
    
    if [[ "$cert_md5" != "$key_md5" ]]; then
        log_error "证书和私钥不匹配"
        return 1
    fi
    
    # 检查证书有效期
    local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [[ $days_until_expiry -lt 0 ]]; then
        log_error "证书已过期"
        return 1
    elif [[ $days_until_expiry -lt 30 ]]; then
        log_warning "证书将在 $days_until_expiry 天后过期"
    else
        log_success "证书有效，还有 $days_until_expiry 天过期"
    fi
    
    # 显示证书信息
    log_info "证书信息:"
    openssl x509 -in "$cert_file" -text -noout | grep -E "(Subject:|DNS:|Not After)"
    
    log_success "证书验证通过"
    return 0
}

# 备份现有证书
backup_existing_certs() {
    log_info "备份现有证书..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份项目证书
    if [[ -d "$SSL_DIR" ]] && [[ -n "$(ls -A $SSL_DIR 2>/dev/null)" ]]; then
        cp -r "$SSL_DIR" "$BACKUP_DIR/project-ssl"
        log_success "项目证书已备份到: $BACKUP_DIR/project-ssl"
    else
        log_warning "未找到现有项目证书"
    fi
    
    # 备份阿里云证书
    if [[ -f "${PROJECT_ROOT}/aliyun_cert.pem" ]]; then
        cp "${PROJECT_ROOT}/aliyun_cert.pem" "$BACKUP_DIR/"
        cp "${PROJECT_ROOT}/aliyun_private.key" "$BACKUP_DIR/"
        log_success "阿里云证书已备份"
    fi
}

# 更新源站证书
update_source_cert() {
    local cert_file="$1"
    local key_file="$2"
    
    log_info "更新源站证书..."
    
    # 创建 SSL 目录
    sudo mkdir -p "$SSL_DIR"
    
    # 复制证书文件
    sudo cp "$cert_file" "$SSL_DIR/cert.pem"
    sudo cp "$key_file" "$SSL_DIR/private.key"
    
    # 设置权限
    sudo chmod 644 "$SSL_DIR/cert.pem"
    sudo chmod 600 "$SSL_DIR/private.key"
    sudo chown root:root "$SSL_DIR"/*
    
    log_success "源站证书已更新"
}

# 生成阿里云 CDN 证书
generate_aliyun_cert() {
    local cert_file="$1"
    local key_file="$2"
    
    log_info "生成阿里云 CDN 证书文件..."
    
    # 复制证书文件
    cp "$cert_file" "${PROJECT_ROOT}/aliyun_cert.pem"
    cp "$key_file" "${PROJECT_ROOT}/aliyun_private.key"
    
    # 设置权限
    chmod 644 "${PROJECT_ROOT}/aliyun_cert.pem"
    chmod 600 "${PROJECT_ROOT}/aliyun_private.key"
    
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

# 测试 Nginx 配置
test_nginx_config() {
    log_info "测试 Nginx 配置..."
    
    # 在容器中测试配置
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -t; then
        log_success "Nginx 配置测试通过"
        return 0
    else
        log_error "Nginx 配置测试失败"
        return 1
    fi
}

# 重启服务
restart_services() {
    log_info "重启 Nginx 服务..."
    
    # 重启 nginx 容器
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" restart nginx
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" ps nginx | grep -q "Up"; then
        log_success "Nginx 服务重启成功"
    else
        log_error "Nginx 服务重启失败"
        return 1
    fi
}

# 验证 HTTPS 连接
verify_https() {
    log_info "验证 HTTPS 连接..."
    
    # 测试本地 HTTPS 连接
    if curl -s --max-time 10 "https://localhost" > /dev/null; then
        log_success "✓ 本地 HTTPS 连接正常"
    else
        log_warning "✗ 本地 HTTPS 连接失败"
    fi
    
    # 检查证书信息
    log_info "证书信息:"
    openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates -subject
}

# 显示阿里云配置说明
show_aliyun_config() {
    log_info "=== 阿里云 CDN 配置说明 ==="
    echo ""
    echo "证书文件已准备好，请在阿里云控制台执行以下操作："
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
    echo "配置完成后，验证 HTTPS 连接："
    echo "curl -I https://$DOMAIN"
}

# 回滚函数
rollback() {
    log_warning "开始回滚到之前的证书..."
    
    if [[ -d "$BACKUP_DIR" ]] && [[ -n "$(ls -A $BACKUP_DIR 2>/dev/null)" ]]; then
        # 回滚项目证书
        if [[ -d "$BACKUP_DIR/project-ssl" ]]; then
            sudo cp -r "$BACKUP_DIR/project-ssl"/* "$SSL_DIR/"
        fi
        
        # 回滚阿里云证书
        if [[ -f "$BACKUP_DIR/aliyun_cert.pem" ]]; then
            cp "$BACKUP_DIR/aliyun_cert.pem" "${PROJECT_ROOT}/"
            cp "$BACKUP_DIR/aliyun_private.key" "${PROJECT_ROOT}/"
        fi
        
        restart_services
        log_success "已回滚到之前的证书"
    else
        log_error "未找到备份文件，无法回滚"
    fi
}

# 主函数
main() {
    local cert_file="$1"
    local key_file="$2"
    
    echo "========================================"
    echo "商业证书更新脚本 (阿里云 CDN + 源站)"
    echo "========================================"
    
    # 检查参数
    if [[ $# -ne 2 ]]; then
        echo "用法: $0 <证书文件路径> <私钥文件路径>"
        echo ""
        echo "示例:"
        echo "  $0 /path/to/cert.pem /path/to/private.key"
        echo "  $0 /tmp/new-cert.crt /tmp/new-private.key"
        exit 1
    fi
    
    # 设置错误处理
    trap 'log_error "脚本执行失败，正在回滚..."; rollback; exit 1' ERR
    trap 'echo "脚本执行完成"' EXIT
    
    # 执行更新流程
    check_certificate_files "$cert_file" "$key_file"
    backup_existing_certs
    update_source_cert "$cert_file" "$key_file"
    generate_aliyun_cert "$cert_file" "$key_file"
    test_nginx_config
    restart_services
    verify_https
    show_aliyun_config
    
    log_success "商业证书更新完成！"
    echo ""
    echo "备份位置: $BACKUP_DIR"
    echo "如需回滚，请运行: $0 rollback"
}

# 处理回滚命令
if [[ "$1" == "rollback" ]]; then
    # 找到最新的备份
    LATEST_BACKUP=$(ls -1t "$SSL_DIR"/backup-* 2>/dev/null | head -1)
    if [[ -n "$LATEST_BACKUP" ]]; then
        BACKUP_DIR="$LATEST_BACKUP"
        rollback
    else
        log_error "未找到备份文件"
        exit 1
    fi
    exit 0
fi

# 运行主函数
main "$@"


