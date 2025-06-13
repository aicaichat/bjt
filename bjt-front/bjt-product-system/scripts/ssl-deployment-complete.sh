#!/bin/bash
# SSL证书完整部署解决方案
# 一次性解决SSL证书问题，支持多种获取方式

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否提供域名参数
if [ -z "$1" ]; then
    print_error "请提供域名参数"
    echo "用法: $0 <domain-name> [method]"
    echo "方法选项: letsencrypt | cloudflare | manual | selfsigned"
    echo "示例: $0 bjt.example.com letsencrypt"
    exit 1
fi

DOMAIN=$1
METHOD=${2:-"letsencrypt"}  # 默认使用Let's Encrypt

print_step "开始为域名 $DOMAIN 配置SSL证书 (方法: $METHOD)"

# 创建SSL目录
mkdir -p nginx/ssl

# 备份现有证书
if [ -f "nginx/ssl/cert.pem" ]; then
    backup_dir="nginx/ssl/backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    cp nginx/ssl/* "$backup_dir/" 2>/dev/null || true
    print_step "已备份现有证书到 $backup_dir"
fi

case $METHOD in
    "letsencrypt")
        print_step "使用Let's Encrypt申请SSL证书..."
        
        # 检查并安装certbot
        if ! command -v certbot &> /dev/null; then
            print_step "安装Certbot..."
            if [ -f /etc/debian_version ]; then
                sudo apt update && sudo apt install -y certbot
            elif [ -f /etc/redhat-release ]; then
                sudo yum install -y epel-release && sudo yum install -y certbot
            else
                print_error "不支持的操作系统，请手动安装certbot"
                exit 1
            fi
        fi
        
        # 停止可能占用80端口的服务
        print_step "临时停止占用80端口的服务..."
        sudo systemctl stop nginx 2>/dev/null || true
        sudo systemctl stop apache2 2>/dev/null || true
        docker-compose -f docker/prod/docker-compose.prod.yml down 2>/dev/null || true
        
        # 申请证书
        print_step "申请Let's Encrypt证书..."
        if sudo certbot certonly --standalone --non-interactive --agree-tos \
            --email admin@${DOMAIN} -d ${DOMAIN} -d www.${DOMAIN}; then
            
            # 复制证书到项目目录
            sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/cert.pem
            sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/private.key
            sudo chown $USER:$USER nginx/ssl/cert.pem nginx/ssl/private.key
            chmod 644 nginx/ssl/cert.pem
            chmod 600 nginx/ssl/private.key
            
            print_success "Let's Encrypt证书申请成功"
        else
            print_warning "Let's Encrypt证书申请失败，切换到自签名证书"
            METHOD="selfsigned"
        fi
        ;;
        
    "cloudflare")
        print_step "使用Cloudflare Origin证书..."
        
        if [ ! -f "cloudflare-origin.pem" ] || [ ! -f "cloudflare-origin.key" ]; then
            print_error "请先将Cloudflare Origin证书文件放在项目根目录："
            echo "  - cloudflare-origin.pem (证书文件)"
            echo "  - cloudflare-origin.key (私钥文件)"
            echo ""
            echo "获取方法："
            echo "1. 登录Cloudflare控制台"
            echo "2. 选择域名 > SSL/TLS > Origin Server"
            echo "3. 创建证书并下载"
            exit 1
        fi
        
        cp cloudflare-origin.pem nginx/ssl/cert.pem
        cp cloudflare-origin.key nginx/ssl/private.key
        chmod 644 nginx/ssl/cert.pem
        chmod 600 nginx/ssl/private.key
        
        print_success "Cloudflare Origin证书配置完成"
        ;;
        
    "manual")
        print_step "手动配置SSL证书..."
        
        if [ ! -f "ssl-cert.pem" ] || [ ! -f "ssl-private.key" ]; then
            print_error "请先将SSL证书文件放在项目根目录："
            echo "  - ssl-cert.pem (证书文件)"
            echo "  - ssl-private.key (私钥文件)"
            exit 1
        fi
        
        cp ssl-cert.pem nginx/ssl/cert.pem
        cp ssl-private.key nginx/ssl/private.key
        chmod 644 nginx/ssl/cert.pem
        chmod 600 nginx/ssl/private.key
        
        print_success "手动SSL证书配置完成"
        ;;
        
    "selfsigned")
        print_step "生成自签名SSL证书..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/private.key \
            -out nginx/ssl/cert.pem \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=BJT/CN=${DOMAIN}" \
            -config <(
                echo '[dn]'
                echo "CN=${DOMAIN}"
                echo '[req]'
                echo 'distinguished_name = dn'
                echo '[v3_ca]'
                echo 'basicConstraints = CA:FALSE'
                echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
                echo "subjectAltName = @alt_names"
                echo '[alt_names]'
                echo "DNS.1 = ${DOMAIN}"
                echo "DNS.2 = www.${DOMAIN}"
            ) -extensions v3_ca
        
        chmod 644 nginx/ssl/cert.pem
        chmod 600 nginx/ssl/private.key
        
        print_success "自签名SSL证书生成完成"
        print_warning "注意：浏览器会显示安全警告，这是正常的"
        ;;
        
    *)
        print_error "不支持的证书获取方法: $METHOD"
        echo "支持的方法: letsencrypt | cloudflare | manual | selfsigned"
        exit 1
        ;;
esac

# 验证证书
print_step "验证SSL证书..."

if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
    print_error "SSL证书文件不存在"
    exit 1
fi

# 检查证书格式
if ! openssl x509 -in nginx/ssl/cert.pem -noout -text &>/dev/null; then
    print_error "SSL证书格式错误"
    exit 1
fi

if ! openssl rsa -in nginx/ssl/private.key -check -noout &>/dev/null; then
    print_error "SSL私钥格式错误"
    exit 1
fi

# 验证证书和私钥匹配
cert_modulus=$(openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5)
key_modulus=$(openssl rsa -noout -modulus -in nginx/ssl/private.key | openssl md5)

if [ "$cert_modulus" != "$key_modulus" ]; then
    print_error "SSL证书和私钥不匹配"
    exit 1
fi

# 显示证书信息
expiry=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2)
issuer=$(openssl x509 -in nginx/ssl/cert.pem -noout -issuer | cut -d= -f2-)

print_success "SSL证书验证成功"
echo "证书信息："
echo "  颁发者: $issuer"
echo "  有效期至: $expiry"
echo "  证书文件: nginx/ssl/cert.pem"
echo "  私钥文件: nginx/ssl/private.key"

# 设置自动续期（仅对Let's Encrypt）
if [ "$METHOD" = "letsencrypt" ]; then
    print_step "设置证书自动续期..."
    
    # 创建续期脚本
    sudo tee /etc/cron.d/bjt-ssl-renewal > /dev/null << EOF
# BJT项目SSL证书自动续期
0 2 * * * root certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem $(pwd)/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem $(pwd)/nginx/ssl/private.key && docker-compose -f $(pwd)/docker/prod/docker-compose.prod.yml restart nginx"
EOF
    
    print_success "已设置证书自动续期"
fi

print_success "SSL证书配置完成！"
echo ""
echo "下一步操作："
echo "1. 确保 .env.production 中域名配置正确: DOMAIN_NAME=${DOMAIN}"
echo "2. 运行部署脚本: ./deploy-production-safe.sh"
echo "3. 访问 https://${DOMAIN} 验证部署"

if [ "$METHOD" = "selfsigned" ]; then
    echo ""
    echo "重要提醒："
    echo "- 当前使用自签名证书，浏览器会显示安全警告"
    echo "- 生产环境建议使用正式证书:"
    echo "  $0 $DOMAIN letsencrypt"
fi 