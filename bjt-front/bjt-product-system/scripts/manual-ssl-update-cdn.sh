#!/bin/bash

# =============================================================================
# CDN 环境下 SSL 证书手动更新指南
# =============================================================================

echo "🔄 CDN 环境下 SSL 证书更新指南"
echo "=================================="

# 配置
DOMAIN="eorder.lockedair.com"
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
EMAIL="admin@lockedair.com"

echo ""
echo "📋 步骤1: 更新源站证书"
echo "----------------------"
cat << 'EOF'
# 1. 停止 Nginx 容器
cd /var/bjt/www/bjt/bjt-front/bjt-product-system
sudo docker-compose -f docker/prod/docker-compose.prod.yml stop nginx

# 2. 强制更新 Let's Encrypt 证书
sudo certbot certonly --standalone \
  -d eorder.lockedair.com \
  --email admin@lockedair.com \
  --agree-tos \
  --non-interactive \
  --force-renewal

# 3. 复制证书到项目目录
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/privkey.pem nginx/ssl/private.key
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/private.key

# 4. 启动 Nginx
sudo docker-compose -f docker/prod/docker-compose.prod.yml start nginx
EOF

echo ""
echo "📋 步骤2: 生成阿里云 CDN 证书文件"
echo "--------------------------------"
cat << 'EOF'
# 生成阿里云 CDN 证书文件
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/fullchain.pem aliyun_cert.pem
sudo cp /etc/letsencrypt/live/eorder.lockedair.com/privkey.pem aliyun_private.key
sudo chmod 644 aliyun_cert.pem
sudo chmod 600 aliyun_private.key

# 显示证书内容（用于复制到阿里云控制台）
echo "=== 证书内容（复制到阿里云 CDN） ==="
echo "证书内容："
cat aliyun_cert.pem
echo ""
echo "私钥内容："
cat aliyun_private.key
EOF

echo ""
echo "📋 步骤3: 阿里云 CDN 控制台配置"
echo "------------------------------"
cat << 'EOF'
1. 登录阿里云控制台
2. 进入 CDN 管理 → 域名管理
3. 找到 eorder.lockedair.com → 管理
4. 点击 HTTPS 配置
5. 选择"自定义上传"
6. 证书内容：粘贴步骤2中的证书内容
7. 私钥内容：粘贴步骤2中的私钥内容
8. 点击"确定"
9. 开启"强制 HTTPS 跳转"
10. 等待配置生效（5-10分钟）
EOF

echo ""
echo "📋 步骤4: 验证配置"
echo "----------------"
cat << 'EOF'
# 验证 HTTPS 连接
curl -I https://eorder.lockedair.com

# 检查证书信息
echo | openssl s_client -servername eorder.lockedair.com -connect eorder.lockedair.com:443 2>/dev/null | openssl x509 -noout -dates

# 检查本地证书
openssl x509 -in nginx/ssl/cert.pem -noout -dates -subject
EOF

echo ""
echo "📋 自动续期设置"
echo "--------------"
cat << 'EOF'
# 创建自动续期脚本
sudo tee /etc/cron.d/bjt-ssl-renewal << 'CRON'
# BJT SSL 证书自动续期
0 2 1 * * root /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cdn.sh auto-renew
CRON

# 设置脚本权限
sudo chmod +x /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cdn.sh
EOF

echo ""
echo "📋 故障排除"
echo "----------"
cat << 'EOF'
# 如果更新失败，回滚到备份
sudo cp nginx/ssl/backup-*/cert.pem nginx/ssl/cert.pem
sudo cp nginx/ssl/backup-*/private.key nginx/ssl/private.key
sudo docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 检查服务状态
sudo docker-compose -f docker/prod/docker-compose.prod.yml ps nginx

# 查看日志
sudo docker-compose -f docker/prod/docker-compose.prod.yml logs nginx --tail=50
EOF

echo ""
echo "✅ 更新指南已生成完成！"
echo ""
echo "💡 建议使用自动化脚本: /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cdn.sh"


