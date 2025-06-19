#!/bin/bash

# 域名配置权限设置脚本
# 用于为新域名 eorder.lockedair.com 配置权限和SSL证书

set -e  # 遇到错误时立即退出

# 颜色输出函数
print_message() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "检测到root用户，将直接执行权限操作"
        return 0
    else
        print_info "检测到非root用户，某些操作可能需要sudo权限"
        return 1
    fi
}

# 创建SSL证书目录并设置权限
setup_ssl_directory() {
    print_message "设置SSL证书目录..."
    
    # 创建SSL目录
    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
        print_info "创建SSL目录: nginx/ssl"
    fi
    
    # 设置SSL目录权限
    chmod 755 nginx/ssl
    print_info "设置SSL目录权限: 755"
    
    # 检查SSL证书文件
    if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/private.key" ]; then
        print_message "SSL证书文件已存在"
        # 设置证书文件权限
        chmod 644 nginx/ssl/cert.pem
        chmod 600 nginx/ssl/private.key
        print_info "设置证书文件权限: cert.pem(644), private.key(600)"
    else
        print_warning "SSL证书文件不存在，请按照下面的说明配置SSL证书"
    fi
}

# 设置配置文件权限
setup_config_permissions() {
    print_message "设置配置文件权限..."
    
    # nginx配置文件权限
    if [ -f "nginx/conf.d/production.conf" ]; then
        chmod 644 nginx/conf.d/production.conf
        print_info "设置nginx配置文件权限: 644"
    fi
    
    # 环境变量文件权限（如果存在）
    if [ -f ".env.production" ]; then
        chmod 600 .env.production
        print_info "设置环境变量文件权限: 600"
    fi
    
    # 部署脚本权限
    for script in deploy-production.sh deploy-production-improved.sh; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            print_info "设置脚本执行权限: $script"
        fi
    done
}

# 设置上传目录权限
setup_upload_permissions() {
    print_message "设置上传目录权限..."
    
    # 创建上传目录结构
    upload_dirs=(
        "frontend/public/uploads"
        "frontend/public/uploads/machines"
        "frontend/public/uploads/machines/pdfs"
        "frontend/public/uploads/machines/images"
        "frontend/public/uploads/accessories"
        "frontend/public/uploads/consumables"
        "frontend/public/uploads/spare_parts"
    )
    
    for dir in "${upload_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "创建目录: $dir"
        fi
        chmod 755 "$dir"
    done
    
    print_message "上传目录权限设置完成"
}

# 验证nginx配置
validate_nginx_config() {
    print_message "验证nginx配置..."
    
    local config_file="nginx/conf.d/production.conf"
    
    # 检查新域名是否已添加
    if grep -q "eorder.lockedair.com" "$config_file"; then
        print_message "✅ 新域名 eorder.lockedair.com 已添加到nginx配置"
    else
        print_error "❌ 新域名未在nginx配置中找到"
        return 1
    fi
    
    # 检查SSL配置
    if grep -q "ssl_certificate" "$config_file"; then
        print_message "✅ SSL配置已存在"
    else
        print_error "❌ SSL配置缺失"
        return 1
    fi
    
    print_message "nginx配置验证通过"
}

# SSL证书配置指导
show_ssl_guide() {
    print_message "=== SSL证书配置指导 ==="
    echo
    print_info "为新域名 eorder.lockedair.com 配置SSL证书，您有以下选项："
    echo
    print_info "选项1: 使用Let's Encrypt自动申请证书（推荐）"
    echo "sudo certbot certonly --standalone -d eorder.lockedair.com"
    echo "sudo cp /etc/letsencrypt/live/eorder.lockedair.com/fullchain.pem nginx/ssl/cert.pem"
    echo "sudo cp /etc/letsencrypt/live/eorder.lockedair.com/privkey.pem nginx/ssl/private.key"
    echo "sudo chown \$USER:\$USER nginx/ssl/*"
    echo
    print_info "选项2: 使用现有证书（如果您已有通配符证书）"
    echo "# 如果您有 *.lockedair.com 的通配符证书，可以直接使用"
    echo "cp /path/to/your/cert.pem nginx/ssl/cert.pem"
    echo "cp /path/to/your/private.key nginx/ssl/private.key"
    echo
    print_info "选项3: 生成自签名证书（仅测试用）"
    echo "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    echo "    -keyout nginx/ssl/private.key \\"
    echo "    -out nginx/ssl/cert.pem \\"
    echo "    -subj \"/C=CN/ST=State/L=City/O=Company/CN=eorder.lockedair.com\""
    echo
}

# 显示DNS配置指导
show_dns_guide() {
    print_message "=== DNS配置指导 ==="
    echo
    print_info "请在域名管理面板中添加以下DNS记录："
    echo
    echo "记录类型: A"
    echo "主机记录: eorder"
    echo "记录值: $(curl -s ifconfig.me || echo "您的服务器IP地址")"
    echo
    print_info "DNS配置生效后，可以通过以下命令验证："
    echo "nslookup eorder.lockedair.com"
    echo
}

# 显示部署指导
show_deployment_guide() {
    print_message "=== 部署指导 ==="
    echo
    print_info "完成SSL证书配置后，执行以下命令部署："
    echo
    echo "# 方法1: 使用改进版部署脚本（推荐）"
    echo "./deploy-production-improved.sh"
    echo
    echo "# 方法2: 使用标准部署脚本"
    echo "./deploy-production.sh"
    echo
    print_info "部署完成后，访问以下地址验证："
    echo "https://eorder.lockedair.com"
    echo
}

# 主函数
main() {
    print_message "开始配置新域名 eorder.lockedair.com..."
    echo
    
    # 检查当前目录
    if [ ! -f "nginx/conf.d/production.conf" ]; then
        print_error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    # 检查用户权限（仅提示，不影响执行）
    check_root || true
    
    # 执行配置步骤
    setup_ssl_directory
    setup_config_permissions
    setup_upload_permissions
    
    # 验证配置
    validate_nginx_config
    
    # 显示配置指导
    show_ssl_guide
    show_dns_guide
    show_deployment_guide
    
    print_message "域名配置权限设置完成！"
    print_info "请按照上述指导完成SSL证书和DNS配置，然后执行部署。"
}

# 执行主函数
main "$@" 