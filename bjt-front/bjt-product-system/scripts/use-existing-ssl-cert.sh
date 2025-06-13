#!/bin/bash
# 使用现有SSL证书配置脚本
# 适用于已经申请好的有效SSL证书

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_banner() {
    echo -e "${PURPLE}"
    echo "════════════════════════════════════════════════════════════════"
    echo "  BJT产品管理系统 - 现有SSL证书配置工具"
    echo "  版本: v1.0"
    echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "使用现有SSL证书配置脚本"
    echo ""
    echo "用法: $0 <domain-name> <cert-file> <key-file> [chain-file]"
    echo ""
    echo "参数:"
    echo "  domain-name    域名 (如: bjt.example.com)"
    echo "  cert-file      证书文件路径 (如: /path/to/cert.pem)"
    echo "  key-file       私钥文件路径 (如: /path/to/private.key)"
    echo "  chain-file     证书链文件路径 (可选，如: /path/to/chain.pem)"
    echo ""
    echo "示例:"
    echo "  $0 bjt.example.com /etc/ssl/certs/bjt.crt /etc/ssl/private/bjt.key"
    echo "  $0 bjt.example.com ./ssl/cert.pem ./ssl/key.pem ./ssl/chain.pem"
    echo ""
    echo "支持的证书格式:"
    echo "  - PEM格式 (.pem, .crt, .cer)"
    echo "  - 标准私钥格式 (.key)"
    echo ""
    echo "注意事项:"
    echo "  - 证书文件必须是有效的SSL证书"
    echo "  - 私钥文件不能有密码保护"
    echo "  - 证书必须包含完整的证书链"
}

# 检查参数
check_parameters() {
    if [ $# -lt 3 ]; then
        print_error "参数不足"
        show_help
        exit 1
    fi
    
    DOMAIN_NAME="$1"
    CERT_FILE="$2"
    KEY_FILE="$3"
    CHAIN_FILE="$4"
    
    print_info "配置参数:"
    echo "  域名: $DOMAIN_NAME"
    echo "  证书文件: $CERT_FILE"
    echo "  私钥文件: $KEY_FILE"
    if [ ! -z "$CHAIN_FILE" ]; then
        echo "  证书链文件: $CHAIN_FILE"
    fi
}

# 验证文件存在性
check_files_exist() {
    print_step "检查证书文件..."
    
    if [ ! -f "$CERT_FILE" ]; then
        print_error "证书文件不存在: $CERT_FILE"
        exit 1
    fi
    print_success "证书文件存在: $CERT_FILE"
    
    if [ ! -f "$KEY_FILE" ]; then
        print_error "私钥文件不存在: $KEY_FILE"
        exit 1
    fi
    print_success "私钥文件存在: $KEY_FILE"
    
    if [ ! -z "$CHAIN_FILE" ] && [ ! -f "$CHAIN_FILE" ]; then
        print_error "证书链文件不存在: $CHAIN_FILE"
        exit 1
    fi
    
    if [ ! -z "$CHAIN_FILE" ]; then
        print_success "证书链文件存在: $CHAIN_FILE"
    fi
}

# 验证证书格式和有效性
validate_certificates() {
    print_step "验证证书格式和有效性..."
    
    # 验证证书格式
    if ! openssl x509 -in "$CERT_FILE" -noout -text &>/dev/null; then
        print_error "证书文件格式无效: $CERT_FILE"
        exit 1
    fi
    print_success "证书格式有效"
    
    # 验证私钥格式
    if ! openssl rsa -in "$KEY_FILE" -check -noout &>/dev/null 2>&1; then
        # 尝试其他私钥格式
        if ! openssl ec -in "$KEY_FILE" -check -noout &>/dev/null 2>&1; then
            print_error "私钥文件格式无效或有密码保护: $KEY_FILE"
            print_info "如果私钥有密码，请先移除密码:"
            echo "  openssl rsa -in $KEY_FILE -out ${KEY_FILE}.nopass"
            exit 1
        fi
    fi
    print_success "私钥格式有效"
    
    # 验证证书和私钥匹配
    cert_modulus=$(openssl x509 -noout -modulus -in "$CERT_FILE" 2>/dev/null | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "$KEY_FILE" 2>/dev/null | openssl md5 2>/dev/null || openssl ec -noout -pubout -in "$KEY_FILE" 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        print_error "证书和私钥不匹配"
        print_info "请确保证书和私钥是配对的"
        exit 1
    fi
    print_success "证书和私钥匹配"
    
    # 检查证书有效期
    if ! openssl x509 -in "$CERT_FILE" -noout -checkend 86400 &>/dev/null; then
        print_warning "证书将在24小时内过期"
    else
        print_success "证书有效期正常"
    fi
    
    # 验证证书链（如果提供）
    if [ ! -z "$CHAIN_FILE" ]; then
        if ! openssl x509 -in "$CHAIN_FILE" -noout -text &>/dev/null; then
            print_error "证书链文件格式无效: $CHAIN_FILE"
            exit 1
        fi
        print_success "证书链格式有效"
    fi
}

# 显示证书信息
show_certificate_info() {
    print_step "证书信息:"
    
    # 证书基本信息
    local subject=$(openssl x509 -in "$CERT_FILE" -noout -subject | sed 's/subject=//')
    local issuer=$(openssl x509 -in "$CERT_FILE" -noout -issuer | sed 's/issuer=//')
    local start_date=$(openssl x509 -in "$CERT_FILE" -noout -startdate | cut -d= -f2)
    local end_date=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
    
    echo "  主题: $subject"
    echo "  颁发者: $issuer"
    echo "  生效时间: $start_date"
    echo "  过期时间: $end_date"
    
    # 检查域名匹配
    local cert_domains=$(openssl x509 -in "$CERT_FILE" -noout -text | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g' | sed 's/,//g' || echo "")
    local cert_cn=$(openssl x509 -in "$CERT_FILE" -noout -subject | sed -n 's/.*CN=\\([^,]*\\).*/\\1/p')
    
    echo "  证书域名: $cert_cn"
    if [ ! -z "$cert_domains" ]; then
        echo "  备用域名: $cert_domains"
    fi
    
    # 检查域名是否匹配
    if [[ "$cert_cn" == "$DOMAIN_NAME" ]] || [[ "$cert_domains" == *"$DOMAIN_NAME"* ]]; then
        print_success "证书域名匹配"
    else
        print_warning "证书域名可能不匹配当前配置的域名: $DOMAIN_NAME"
        print_info "证书支持的域名: $cert_cn $cert_domains"
    fi
}

# 备份现有证书
backup_existing_certificates() {
    print_step "备份现有证书..."
    
    if [ -f "nginx/ssl/cert.pem" ] || [ -f "nginx/ssl/private.key" ]; then
        local backup_dir="nginx/ssl/backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        if [ -f "nginx/ssl/cert.pem" ]; then
            cp "nginx/ssl/cert.pem" "$backup_dir/"
            print_info "已备份现有证书: $backup_dir/cert.pem"
        fi
        
        if [ -f "nginx/ssl/private.key" ]; then
            cp "nginx/ssl/private.key" "$backup_dir/"
            print_info "已备份现有私钥: $backup_dir/private.key"
        fi
        
        print_success "证书备份完成: $backup_dir"
    else
        print_info "没有现有证书需要备份"
    fi
}

# 复制证书文件
copy_certificates() {
    print_step "复制证书文件到项目目录..."
    
    # 创建SSL目录
    mkdir -p nginx/ssl
    
    # 复制证书文件
    if [ ! -z "$CHAIN_FILE" ]; then
        # 如果有证书链，合并证书和证书链
        cat "$CERT_FILE" "$CHAIN_FILE" > nginx/ssl/cert.pem
        print_info "已合并证书和证书链"
    else
        cp "$CERT_FILE" nginx/ssl/cert.pem
        print_info "已复制证书文件"
    fi
    
    # 复制私钥文件
    cp "$KEY_FILE" nginx/ssl/private.key
    print_info "已复制私钥文件"
    
    # 设置正确的权限
    chmod 644 nginx/ssl/cert.pem
    chmod 600 nginx/ssl/private.key
    
    print_success "证书文件复制完成"
    echo "  证书文件: nginx/ssl/cert.pem"
    echo "  私钥文件: nginx/ssl/private.key"
}

# 验证最终配置
verify_final_configuration() {
    print_step "验证最终配置..."
    
    # 验证复制后的文件
    if ! openssl x509 -in nginx/ssl/cert.pem -noout -text &>/dev/null; then
        print_error "复制后的证书文件无效"
        exit 1
    fi
    
    if ! openssl rsa -in nginx/ssl/private.key -check -noout &>/dev/null 2>&1; then
        if ! openssl ec -in nginx/ssl/private.key -check -noout &>/dev/null 2>&1; then
            print_error "复制后的私钥文件无效"
            exit 1
        fi
    fi
    
    # 再次验证匹配性
    local cert_modulus=$(openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5)
    local key_modulus=$(openssl rsa -noout -modulus -in nginx/ssl/private.key 2>/dev/null | openssl md5 2>/dev/null || openssl ec -noout -pubout -in nginx/ssl/private.key 2>/dev/null | openssl md5)
    
    if [ "$cert_modulus" != "$key_modulus" ]; then
        print_error "复制后证书和私钥不匹配"
        exit 1
    fi
    
    print_success "最终配置验证通过"
}

# 更新环境变量
update_environment_config() {
    print_step "更新环境变量配置..."
    
    local env_file=".env.production"
    
    if [ ! -f "$env_file" ]; then
        print_warning "环境变量文件不存在: $env_file"
        print_info "请手动创建并配置域名: DOMAIN_NAME=$DOMAIN_NAME"
        return
    fi
    
    # 检查是否已有DOMAIN_NAME配置
    if grep -q "^DOMAIN_NAME=" "$env_file"; then
        # 更新现有配置
        sed -i.bak "s/^DOMAIN_NAME=.*/DOMAIN_NAME=$DOMAIN_NAME/" "$env_file"
        print_info "已更新域名配置: DOMAIN_NAME=$DOMAIN_NAME"
    else
        # 添加新配置
        echo "DOMAIN_NAME=$DOMAIN_NAME" >> "$env_file"
        print_info "已添加域名配置: DOMAIN_NAME=$DOMAIN_NAME"
    fi
    
    print_success "环境变量配置完成"
}

# 生成部署指令
generate_deployment_instructions() {
    print_step "生成部署指令..."
    
    echo ""
    echo -e "${GREEN}✅ SSL证书配置完成！${NC}"
    echo ""
    echo "📋 下一步操作:"
    echo ""
    echo "1. 验证环境变量配置:"
    echo "   cat .env.production | grep DOMAIN_NAME"
    echo ""
    echo "2. 执行部署:"
    echo "   ./deploy-production-safe.sh"
    echo ""
    echo "3. 验证SSL证书:"
    echo "   curl -I https://$DOMAIN_NAME"
    echo "   openssl s_client -connect $DOMAIN_NAME:443 -servername $DOMAIN_NAME"
    echo ""
    echo "4. 访问网站:"
    echo "   https://$DOMAIN_NAME"
    echo ""
    
    # 证书到期提醒
    local days_until_expiry=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
    local current_time=$(date +%s)
    local days_left=$(( (days_until_expiry - current_time) / 86400 ))
    
    if [ $days_left -lt 30 ]; then
        echo -e "${YELLOW}⚠️  证书到期提醒:${NC}"
        echo "   证书将在 $days_left 天后过期"
        echo "   请及时续期证书"
        echo ""
    fi
    
    echo "📁 证书文件位置:"
    echo "   nginx/ssl/cert.pem    (证书文件)"
    echo "   nginx/ssl/private.key (私钥文件)"
    echo ""
    
    if [ -d "nginx/ssl/backup-"* ]; then
        echo "💾 备份文件位置:"
        ls -la nginx/ssl/backup-* | tail -1 | awk '{print "   " $9}'
        echo ""
    fi
}

# 主函数
main() {
    print_banner
    
    # 检查参数
    check_parameters "$@"
    
    # 检查文件存在性
    check_files_exist
    
    # 验证证书
    validate_certificates
    
    # 显示证书信息
    show_certificate_info
    
    # 备份现有证书
    backup_existing_certificates
    
    # 复制证书文件
    copy_certificates
    
    # 验证最终配置
    verify_final_configuration
    
    # 更新环境变量
    update_environment_config
    
    # 生成部署指令
    generate_deployment_instructions
}

# 检查是否需要显示帮助
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# 执行主函数
main "$@" 