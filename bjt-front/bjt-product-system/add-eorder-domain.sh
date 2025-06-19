#!/bin/bash

# 添加 eorder.lockedair.com 域名的一键执行脚本

set -e

# 颜色输出
print_step() {
    echo -e "\033[1;34m🔷 $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠️  $1\033[0m"
}

echo "🌐 开始为 eorder.lockedair.com 配置SSL证书和重启服务"
echo "=================================================="

# 第1步：检查DNS解析
print_step "第1步：检查DNS解析"
EXPECTED_IP="47.90.251.35"
CURRENT_IP=$(nslookup eorder.lockedair.com 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}' || echo "")

if [ -n "$CURRENT_IP" ]; then
    if [ "$CURRENT_IP" = "$EXPECTED_IP" ]; then
        print_success "DNS解析正确: $CURRENT_IP"
    else
        print_warning "DNS解析到错误的IP: $CURRENT_IP (期望: $EXPECTED_IP)"
        echo "请在域名管理面板更新DNS记录："
        echo "记录类型: A"
        echo "主机记录: eorder"
        echo "记录值: $EXPECTED_IP"
        echo ""
        print_warning "是否继续执行？DNS更新可能需要时间生效 (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "已取消执行，请更新DNS记录后重试"
            exit 1
        fi
    fi
else
    print_error "DNS解析失败，请先配置DNS记录："
    echo "记录类型: A"
    echo "主机记录: eorder"
    echo "记录值: $EXPECTED_IP"
    exit 1
fi

# 第2步：停止现有服务
print_step "第2步：停止现有服务以释放80端口"
if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
    docker-compose -f docker/prod/docker-compose.prod.yml down
    print_success "服务已停止"
else
    print_success "服务未运行，跳过停止步骤"
fi

# 第3步：申请SSL证书
print_step "第3步：申请SSL证书"
if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/private.key" ]; then
    print_warning "SSL证书已存在，是否重新申请？(y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        apply_cert=true
    else
        apply_cert=false
        print_success "使用现有SSL证书"
    fi
else
    apply_cert=true
fi

if [ "$apply_cert" = true ]; then
    print_step "正在申请Let's Encrypt证书..."
    
    # 检查certbot是否安装
    if ! command -v certbot &> /dev/null; then
        print_step "安装certbot..."
        sudo apt update
        sudo apt install certbot -y
    fi
    
    # 申请证书
    sudo certbot certonly --standalone -d eorder.lockedair.com --agree-tos --non-interactive --email admin@eorder.lockedair.com
    
    # 复制证书
    sudo cp /etc/letsencrypt/live/eorder.lockedair.com/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/eorder.lockedair.com/privkey.pem nginx/ssl/private.key
    sudo chown $USER:$USER nginx/ssl/*
    
    print_success "SSL证书申请完成"
fi

# 第4步：验证nginx配置
print_step "第4步：验证nginx配置"
if grep -q "eorder.lockedair.com" nginx/conf.d/production.conf; then
    print_success "nginx配置包含新域名"
else
    print_error "nginx配置缺少新域名，请检查配置文件"
    exit 1
fi

# 第5步：启动服务
print_step "第5步：启动服务"
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 等待服务启动
print_step "等待服务启动..."
sleep 10

# 第6步：验证部署
print_step "第6步：验证部署"
echo "检查服务状态..."
docker-compose -f docker/prod/docker-compose.prod.yml ps

echo ""
print_step "测试新域名访问..."
if curl -I -k https://eorder.lockedair.com 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    print_success "新域名访问正常！"
else
    print_warning "新域名可能还需要几分钟才能完全生效"
fi

echo ""
print_success "🎉 域名配置完成！"
echo "=================================================="
echo "✅ 可以通过以下地址访问："
echo "   • 前端应用: https://eorder.lockedair.com"
echo "   • 管理后台: https://eorder.lockedair.com/wp-admin"
echo "   • API接口: https://eorder.lockedair.com/wp-json/bjt/v1"
echo ""
echo "🔍 如果访问有问题，可以运行："
echo "   ./scripts/health-monitor.sh --report" 