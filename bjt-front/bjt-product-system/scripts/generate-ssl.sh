#!/bin/bash

# SSL 证书生成脚本
# 支持 Let's Encrypt 和自签名证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认值
CERT_TYPE="self-signed"
DOMAIN=""
EMAIL=""
SSL_DIR="nginx/ssl"

# 打印帮助信息
print_help() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --type TYPE      证书类型: letsencrypt 或 self-signed (默认: self-signed)"
    echo "  -d, --domain DOMAIN  域名 (必需)"
    echo "  -e, --email EMAIL    邮箱地址 (Let's Encrypt 需要)"
    echo "  -o, --output DIR     输出目录 (默认: nginx/ssl)"
    echo "  --help               显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  # 生成自签名证书"
    echo "  $0 -t self-signed -d bjt.nh.cool"
    echo ""
    echo "  # 生成 Let's Encrypt 证书"
    echo "  $0 -t letsencrypt -d bjt.nh.cool -e admin@example.com"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            CERT_TYPE="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -o|--output)
            SSL_DIR="$2"
            shift 2
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            print_help
            exit 1
            ;;
    esac
done

# 验证参数
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误: 必须指定域名${NC}"
    print_help
    exit 1
fi

if [ "$CERT_TYPE" = "letsencrypt" ] && [ -z "$EMAIL" ]; then
    echo -e "${RED}错误: Let's Encrypt 需要邮箱地址${NC}"
    print_help
    exit 1
fi

# 创建 SSL 目录
mkdir -p "$SSL_DIR"

# 生成自签名证书
generate_self_signed() {
    echo -e "${BLUE}生成自签名证书...${NC}"
    
    # 生成私钥
    openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # 生成证书签名请求
    openssl req -new -key "$SSL_DIR/private.key" \
        -out "$SSL_DIR/cert.csr" \
        -subj "/C=CN/ST=Beijing/L=Beijing/O=BJT/CN=$DOMAIN"
    
    # 生成自签名证书（有效期 365 天）
    openssl x509 -req -days 365 \
        -in "$SSL_DIR/cert.csr" \
        -signkey "$SSL_DIR/private.key" \
        -out "$SSL_DIR/cert.pem"
    
    # 删除 CSR 文件
    rm -f "$SSL_DIR/cert.csr"
    
    echo -e "${GREEN}自签名证书生成成功！${NC}"
    echo -e "${YELLOW}证书文件: $SSL_DIR/cert.pem${NC}"
    echo -e "${YELLOW}私钥文件: $SSL_DIR/private.key${NC}"
}

# 生成 Let's Encrypt 证书
generate_letsencrypt() {
    echo -e "${BLUE}生成 Let's Encrypt 证书...${NC}"
    
    # 检查是否安装了 certbot
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}正在安装 certbot...${NC}"
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot
            elif command -v yum &> /dev/null; then
                sudo yum install -y epel-release
                sudo yum install -y certbot
            else
                echo -e "${RED}错误: 无法自动安装 certbot，请手动安装${NC}"
                exit 1
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install certbot
            else
                echo -e "${RED}错误: 请先安装 Homebrew 或手动安装 certbot${NC}"
                exit 1
            fi
        else
            echo -e "${RED}错误: 不支持的操作系统${NC}"
            exit 1
        fi
    fi
    
    # 停止占用 80 端口的服务
    echo -e "${YELLOW}注意: 需要临时停止占用 80 端口的服务${NC}"
    echo -e "${YELLOW}请确保 80 端口可用，然后按 Enter 继续...${NC}"
    read
    
    # 生成证书
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
    
    # 复制证书到指定目录
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/private.key"
    
    # 设置权限
    sudo chmod 644 "$SSL_DIR/cert.pem"
    sudo chmod 600 "$SSL_DIR/private.key"
    
    echo -e "${GREEN}Let's Encrypt 证书生成成功！${NC}"
    echo -e "${YELLOW}证书文件: $SSL_DIR/cert.pem${NC}"
    echo -e "${YELLOW}私钥文件: $SSL_DIR/private.key${NC}"
    echo -e "${YELLOW}证书将在 90 天后过期，请设置自动续期${NC}"
}

# 主流程
echo -e "${BLUE}=== SSL 证书生成工具 ===${NC}"
echo -e "${BLUE}域名: $DOMAIN${NC}"
echo -e "${BLUE}证书类型: $CERT_TYPE${NC}"
echo ""

case $CERT_TYPE in
    self-signed)
        generate_self_signed
        ;;
    letsencrypt)
        generate_letsencrypt
        ;;
    *)
        echo -e "${RED}错误: 不支持的证书类型 $CERT_TYPE${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}证书生成完成！${NC}"
echo -e "${YELLOW}请确保在 docker-compose 中正确挂载证书目录${NC}" 