#!/bin/bash
# 同步uploads文件到服务器的脚本

set -e

# 配置
SSH_KEY="bjt.pem"
SERVER="root@bjt.nh.cool"
REMOTE_PATH="/var/bjt/bjt/bjt-front/bjt-product-system"
LOCAL_PATH="/Users/mac/bjt/bjt-front/bjt-product-system"

echo "=== 同步uploads文件到服务器 ==="
echo ""

# 1. 检查本地文件
echo "1. 检查本地文件"
echo "----------------------------------------"
if [ -d "$LOCAL_PATH/frontend/dist/uploads" ]; then
    echo "  ✅ dist/uploads目录存在"
    ls -lh "$LOCAL_PATH/frontend/dist/uploads/" | head -10
else
    echo "  ❌ dist/uploads目录不存在"
    exit 1
fi

# 2. 在服务器上创建目录
echo ""
echo "2. 在服务器上创建目录"
echo "----------------------------------------"
ssh -i "$SSH_KEY" "$SERVER" "mkdir -p $REMOTE_PATH/frontend/public/uploads"

# 3. 同步文件（使用rsync，更可靠）
echo ""
echo "3. 同步文件到服务器..."
echo "----------------------------------------"
rsync -avz -e "ssh -i $SSH_KEY" \
    --progress \
    "$LOCAL_PATH/frontend/dist/uploads/" \
    "$SERVER:$REMOTE_PATH/frontend/public/uploads/"

# 4. 验证
echo ""
echo "4. 验证服务器上的文件"
echo "----------------------------------------"
ssh -i "$SSH_KEY" "$SERVER" "ls -la $REMOTE_PATH/frontend/public/uploads/product_lines/ 2>/dev/null | head -10 || echo '目录不存在'"

echo ""
echo "✅ 同步完成！"
echo ""
echo "下一步："
echo "1. 在服务器上验证容器内文件："
echo "   docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/"
echo ""
echo "2. 测试访问："
echo "   curl -I http://localhost/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
