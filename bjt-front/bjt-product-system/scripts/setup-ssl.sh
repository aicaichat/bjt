#!/bin/bash
# SSL证书自动申请和配置脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用sudo运行此脚本"
        exit 1
    fi
}

# 检查域名参数
check_domain() {
    if [ -z "$1" ]; then
        print_error "请提供域名参数"
        echo "用法: sudo ./setup-ssl.sh your-domain.com"
        exit 1
    fi
    
    DOMAIN=$1
    print_message "配置域名: $DOMAIN"
}

# 安装Certbot
install_certbot() {
    print_message "安装Certbot..."
    
    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt update
        apt install -y certbot
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot
    else
        print_error "不支持的操作系统"
        exit 1
    fi
    
    print_message "Certbot安装完成"
}

# 停止占用80端口的服务
stop_services() {
    print_message "停止可能占用80端口的服务..."
    
    # 停止常见的Web服务
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
    systemctl stop httpd 2>/dev/null || true
    
    # 停止Docker容器中的服务
    if command -v docker-compose &> /dev/null; then
        if [ -f "docker/prod/docker-compose.prod.yml" ]; then
            docker-compose -f docker/prod/docker-compose.prod.yml down 2>/dev/null || true
        fi
    fi
    
    print_message "服务已停止"
}

# 申请SSL证书
request_certificate() {
    print_message "申请SSL证书..."
    
    # 使用standalone模式申请证书
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        -d ${DOMAIN} \
        -d www.${DOMAIN}
    
    if [ $? -eq 0 ]; then
        print_message "SSL证书申请成功"
    else
        print_error "SSL证书申请失败"
        exit 1
    fi
}

# 复制证书到项目目录
copy_certificates() {
    print_message "复制证书到项目目录..."
    
    # 创建SSL目录
    mkdir -p nginx/ssl
    
    # 复制证书文件
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/private.key
    
    # 设置正确的权限
    chown -R $SUDO_USER:$SUDO_USER nginx/ssl/
    chmod 644 nginx/ssl/cert.pem
    chmod 600 nginx/ssl/private.key
    
    print_message "证书复制完成"
}

# 设置自动续期
setup_auto_renewal() {
    print_message "设置证书自动续期..."
    
    # 创建续期脚本
    cat > /etc/cron.d/certbot-renewal << EOF
# 每天凌晨2点检查证书续期
0 2 * * * root certbot renew --quiet --post-hook "systemctl reload nginx || docker-compose -f /opt/bjt-product-system/docker/prod/docker-compose.prod.yml restart nginx"
EOF
    
    # 创建续期后的钩子脚本
    cat > /etc/letsencrypt/renewal-hooks/post/copy-certs.sh << 'EOF'
#!/bin/bash
# 证书续期后复制到项目目录

PROJECT_DIR="/opt/bjt-product-system"
DOMAIN=$(basename /etc/letsencrypt/live/*/)

if [ -d "$PROJECT_DIR" ]; then
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROJECT_DIR/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROJECT_DIR/nginx/ssl/private.key
    chown -R $(stat -c '%U:%G' $PROJECT_DIR) $PROJECT_DIR/nginx/ssl/
    chmod 644 $PROJECT_DIR/nginx/ssl/cert.pem
    chmod 600 $PROJECT_DIR/nginx/ssl/private.key
fi
EOF
    
    chmod +x /etc/letsencrypt/renewal-hooks/post/copy-certs.sh
    
    print_message "自动续期设置完成"
}

# 验证证书
verify_certificate() {
    print_message "验证SSL证书..."
    
    # 检查证书文件
    if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/private.key" ]; then
        print_message "证书文件存在"
        
        # 检查证书有效期
        EXPIRY=$(openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After" | cut -d: -f2-)
        print_message "证书有效期: $EXPIRY"
        
        # 验证证书和私钥匹配
        CERT_HASH=$(openssl x509 -in nginx/ssl/cert.pem -pubkey -noout -outform pem | sha256sum)
        KEY_HASH=$(openssl pkey -in nginx/ssl/private.key -pubout -outform pem | sha256sum)
        
        if [ "$CERT_HASH" = "$KEY_HASH" ]; then
            print_message "证书和私钥匹配"
        else
            print_error "证书和私钥不匹配"
            exit 1
        fi
    else
        print_error "证书文件不存在"
        exit 1
    fi
}

# 显示完成信息
show_completion_info() {
    print_message "SSL证书配置完成！"
    echo ""
    echo "证书信息："
    echo "  域名: ${DOMAIN}"
    echo "  证书文件: nginx/ssl/cert.pem"
    echo "  私钥文件: nginx/ssl/private.key"
    echo ""
    echo "下一步："
    echo "  1. 确保 .env.production 中的域名配置正确"
    echo "  2. 运行部署脚本: ./deploy.sh"
    echo "  3. 访问 https://${DOMAIN} 验证部署"
    echo ""
    echo "证书续期："
    echo "  - 已设置自动续期（每天检查）"
    echo "  - 手动续期: sudo certbot renew"
    echo ""
}

# 主函数
main() {
    print_message "开始SSL证书配置..."
    
    check_root
    check_domain $1
    install_certbot
    stop_services
    request_certificate
    copy_certificates
    setup_auto_renewal
    verify_certificate
    show_completion_info
}

# 执行主函数
main "$@" 