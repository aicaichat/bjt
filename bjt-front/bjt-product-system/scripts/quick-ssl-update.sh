#!/bin/bash

# =============================================================================
# BJT 生产系统 SSL 证书快速更新命令
# =============================================================================

# 配置
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
SSL_DIR="${PROJECT_ROOT}/nginx/ssl"

echo "🔐 BJT 生产系统 SSL 证书快速更新"
echo "=================================="

# 方法1: 使用 Let's Encrypt (推荐)
echo ""
echo "📋 方法1: 使用 Let's Encrypt 自动更新 (推荐)"
echo "--------------------------------------------"
cat << 'EOF'
# 1. 安装 certbot
sudo apt update && sudo apt install -y certbot

# 2. 停止 nginx 容器 (临时)
cd /var/bjt/www/bjt/bjt-front/bjt-product-system
sudo docker-compose -f docker/prod/docker-compose.prod.yml stop nginx

# 3. 获取/更新证书 (替换为你的域名)
sudo certbot certonly --standalone \
  -d bjt.nh.cool \
  -d eorder.lockedair.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# 4. 复制证书到项目目录
sudo mkdir -p /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl
sudo cp /etc/letsencrypt/live/bjt.nh.cool/fullchain.pem /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/bjt.nh.cool/privkey.pem /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/private.key

# 5. 设置权限
sudo chmod 644 /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/cert.pem
sudo chmod 600 /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/private.key

# 6. 重启服务
sudo docker-compose -f docker/prod/docker-compose.prod.yml start nginx

# 7. 验证
curl -I https://bjt.nh.cool
curl -I https://eorder.lockedair.com
EOF

# 方法2: 手动上传证书文件
echo ""
echo "📋 方法2: 手动上传证书文件"
echo "-------------------------"
cat << 'EOF'
# 1. 上传证书文件到服务器
scp /local/path/to/cert.pem root@your-server:/tmp/
scp /local/path/to/private.key root@your-server:/tmp/

# 2. 在服务器上运行更新脚本
sudo /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cert.sh /tmp/cert.pem /tmp/private.key

# 3. 清理临时文件
sudo rm /tmp/cert.pem /tmp/private.key
EOF

# 方法3: 一键命令 (如果证书已在服务器上)
echo ""
echo "📋 方法3: 一键更新命令 (证书已在服务器)"
echo "------------------------------------"
cat << 'EOF'
# 假设新证书文件已在 /tmp/ 目录
sudo /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cert.sh \
  /tmp/new-cert.pem \
  /tmp/new-private.key
EOF

# 验证命令
echo ""
echo "📋 验证和测试命令"
echo "----------------"
cat << 'EOF'
# 检查证书有效期
openssl x509 -in /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/cert.pem -noout -dates

# 测试 HTTPS 连接
curl -I https://bjt.nh.cool
curl -I https://eorder.lockedair.com

# 检查 SSL 评级
curl -s "https://api.ssllabs.com/api/v3/analyze?host=bjt.nh.cool&publish=off&startNew=on"

# 查看容器状态
sudo docker-compose -f /var/bjt/www/bjt/bjt-front/bjt-product-system/docker/prod/docker-compose.prod.yml ps

# 查看 nginx 日志
sudo docker-compose -f /var/bjt/www/bjt/bjt-front/bjt-product-system/docker/prod/docker-compose.prod.yml logs nginx --tail=50
EOF

# 回滚命令
echo ""
echo "📋 回滚命令 (如果更新失败)"
echo "------------------------"
cat << 'EOF'
# 回滚到之前的证书
sudo /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cert.sh rollback

# 或手动回滚
sudo cp /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/backup-*/cert.pem /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/
sudo cp /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/backup-*/private.key /var/bjt/www/bjt/bjt-front/bjt-product-system/nginx/ssl/
sudo docker-compose -f /var/bjt/www/bjt/bjt-front/bjt-product-system/docker/prod/docker-compose.prod.yml restart nginx
EOF

# 自动续期设置
echo ""
echo "📋 设置自动续期 (Let's Encrypt)"
echo "-----------------------------"
cat << 'EOF'
# 创建续期脚本
sudo tee /etc/cron.d/certbot-renew << 'CRON'
# 每月1号凌晨2点检查并续期证书
0 2 1 * * root /usr/bin/certbot renew --quiet --deploy-hook "/var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/ssl-deploy-hook.sh"
CRON

# 创建部署钩子脚本
sudo tee /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/ssl-deploy-hook.sh << 'HOOK'
#!/bin/bash
# SSL 证书更新后的部署钩子
cd /var/bjt/www/bjt/bjt-front/bjt-product-system
cp /etc/letsencrypt/live/bjt.nh.cool/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/bjt.nh.cool/privkey.pem nginx/ssl/private.key
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/private.key
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx
HOOK

sudo chmod +x /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/ssl-deploy-hook.sh
EOF

echo ""
echo "✅ 命令已生成完成！"
echo ""
echo "💡 建议使用方法1 (Let's Encrypt) 进行自动化证书管理"
echo "💡 如需帮助，请查看详细脚本: /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/update-ssl-cert.sh"


