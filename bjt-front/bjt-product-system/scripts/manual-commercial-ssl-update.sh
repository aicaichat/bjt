#!/bin/bash

# =============================================================================
# 商业证书手动更新指南
# =============================================================================

echo "🔐 商业证书更新指南 (阿里云 CDN + 源站)"
echo "======================================="

# 配置
DOMAIN="eorder.lockedair.com"
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"

echo ""
echo "📋 步骤1: 准备证书文件"
echo "-------------------"
cat << 'EOF'
# 1. 将新证书文件上传到服务器
scp /local/path/to/cert.pem root@your-server:/tmp/
scp /local/path/to/private.key root@your-server:/tmp/

# 2. 验证证书文件
openssl x509 -in /tmp/cert.pem -text -noout
openssl rsa -in /tmp/private.key -check -noout

# 3. 验证证书和私钥是否匹配
openssl x509 -noout -modulus -in /tmp/cert.pem | openssl md5
openssl rsa -noout -modulus -in /tmp/private.key | openssl md5
# 两个 MD5 值应该相同
EOF

echo ""
echo "📋 步骤2: 备份现有证书"
echo "-------------------"
cat << 'EOF'
# 创建备份目录
cd /var/bjt/www/bjt/bjt-front/bjt-product-system
BACKUP_DIR="nginx/ssl/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份现有证书
if [ -d "nginx/ssl" ]; then
    cp -r nginx/ssl/* "$BACKUP_DIR/"
    echo "现有证书已备份到: $BACKUP_DIR"
fi

# 备份阿里云证书
if [ -f "aliyun_cert.pem" ]; then
    cp aliyun_cert.pem "$BACKUP_DIR/"
    cp aliyun_private.key "$BACKUP_DIR/"
    echo "阿里云证书已备份"
fi
EOF

echo ""
echo "📋 步骤3: 更新源站证书"
echo "-------------------"
cat << 'EOF'
# 1. 创建 SSL 目录
sudo mkdir -p nginx/ssl

# 2. 复制新证书到项目目录
sudo cp /tmp/cert.pem nginx/ssl/cert.pem
sudo cp /tmp/private.key nginx/ssl/private.key

# 3. 设置正确权限
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/private.key
sudo chown root:root nginx/ssl/*

# 4. 测试 Nginx 配置
sudo docker-compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -t

# 5. 重启 Nginx 服务
sudo docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 6. 验证服务状态
sudo docker-compose -f docker/prod/docker-compose.prod.yml ps nginx
EOF

echo ""
echo "📋 步骤4: 生成阿里云 CDN 证书"
echo "-------------------------"
cat << 'EOF'
# 1. 复制证书文件供阿里云使用
cp /tmp/cert.pem aliyun_cert.pem
cp /tmp/private.key aliyun_private.key

# 2. 设置权限
chmod 644 aliyun_cert.pem
chmod 600 aliyun_private.key

# 3. 显示证书内容（用于复制到阿里云控制台）
echo "=== 证书内容（复制到阿里云 CDN） ==="
echo "证书内容："
cat aliyun_cert.pem
echo ""
echo "私钥内容："
cat aliyun_private.key
EOF

echo ""
echo "📋 步骤5: 阿里云 CDN 控制台配置"
echo "---------------------------"
cat << 'EOF'
1. 登录阿里云控制台
2. 进入 CDN 管理 → 域名管理
3. 找到 eorder.lockedair.com → 管理
4. 点击 HTTPS 配置
5. 选择 "自定义上传"
6. 证书内容：粘贴步骤4中的证书内容
7. 私钥内容：粘贴步骤4中的私钥内容
8. 点击 "确定"
9. 开启 "强制 HTTPS 跳转"
10. 等待配置生效（5-10分钟）
EOF

echo ""
echo "📋 步骤6: 验证配置"
echo "---------------"
cat << 'EOF'
# 1. 验证本地 HTTPS 连接
curl -I https://localhost

# 2. 验证 CDN HTTPS 连接
curl -I https://eorder.lockedair.com

# 3. 检查证书信息
openssl x509 -in nginx/ssl/cert.pem -noout -dates -subject

# 4. 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 5. 验证证书链
openssl s_client -connect eorder.lockedair.com:443 -servername eorder.lockedair.com
EOF

echo ""
echo "📋 步骤7: 清理临时文件"
echo "-------------------"
cat << 'EOF'
# 清理临时证书文件
sudo rm /tmp/cert.pem /tmp/private.key

# 可选：清理旧证书文件
# sudo rm -rf nginx/ssl/backup-*
EOF

echo ""
echo "📋 故障排除"
echo "----------"
cat << 'EOF'
# 如果更新失败，回滚到备份
sudo cp nginx/ssl/backup-*/cert.pem nginx/ssl/cert.pem
sudo cp nginx/ssl/backup-*/private.key nginx/ssl/private.key
sudo docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 检查证书匹配性
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/private.key | openssl md5

# 检查服务状态
sudo docker-compose -f docker/prod/docker-compose.prod.yml logs nginx --tail=50

# 检查端口占用
sudo netstat -tlnp | grep :443
sudo lsof -i :443
EOF

echo ""
echo "📋 自动化脚本使用"
echo "---------------"
cat << 'EOF'
# 使用自动化脚本（推荐）
sudo /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-commercial-ssl.sh \
  /path/to/cert.pem \
  /path/to/private.key

# 回滚到之前版本
sudo /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-commercial-ssl.sh rollback
EOF

echo ""
echo "✅ 商业证书更新指南已生成完成！"
echo ""
echo "💡 建议使用自动化脚本: /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-commercial-ssl.sh"


