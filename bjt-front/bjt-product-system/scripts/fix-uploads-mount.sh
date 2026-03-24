#!/bin/bash
# 修复uploads文件挂载问题

set -e

cd /var/bjt/bjt/bjt-front/bjt-product-system

COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

echo "=== 诊断uploads文件问题 ==="
echo ""

# 1. 检查本地文件
echo "1. 检查本地文件"
echo "----------------------------------------"
if [ -f "frontend/public/uploads/product_lines/Paper Cushioning Machine.jpg" ]; then
    echo "  ✅ 本地文件存在"
    ls -lh "frontend/public/uploads/product_lines/" | head -5
else
    echo "  ❌ 本地文件不存在"
    echo "  检查其他可能的位置..."
    find frontend/public/uploads -name "*Paper*" -o -name "*Cushioning*" 2>/dev/null | head -5
fi

echo ""
echo "2. 检查挂载配置"
echo "----------------------------------------"
echo "docker-compose.prod.yml中的挂载配置："
grep -A 5 "wordpress:" docker/prod/docker-compose.prod.yml | grep -A 5 "volumes:" | grep frontend

echo ""
echo "3. 检查容器内的挂载"
echo "----------------------------------------"
echo "WordPress容器内的挂载点："
$COMPOSE exec wordpress mount | grep frontend || echo "  ⚠️  未找到frontend挂载"

echo ""
echo "4. 检查容器内的目录结构"
echo "----------------------------------------"
echo "检查 /var/www/html/frontend/ 是否存在："
$COMPOSE exec wordpress ls -la /var/www/html/frontend/ 2>/dev/null | head -5 || echo "  ❌ frontend目录不存在"

echo ""
echo "检查 /var/www/html/frontend/public/ 是否存在："
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/ 2>/dev/null | head -5 || echo "  ❌ public目录不存在"

echo ""
echo "检查 /var/www/html/frontend/public/uploads/ 是否存在："
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/ 2>/dev/null | head -5 || echo "  ❌ uploads目录不存在"

echo ""
echo "=== 修复方案 ==="
echo ""

# 检查是否需要创建目录
if [ -f "frontend/public/uploads/product_lines/Paper Cushioning Machine.jpg" ]; then
    echo "✅ 本地文件存在，但容器内没有"
    echo ""
    echo "可能的原因："
    echo "1. 挂载路径不正确"
    echo "2. 容器内的目录结构不匹配"
    echo "3. 权限问题"
    echo ""
    echo "修复步骤："
    echo ""
    echo "1. 确认挂载配置正确"
    echo "   docker-compose.prod.yml中应该有："
    echo "   volumes:"
    echo "     - ../../frontend:/var/www/html/frontend"
    echo ""
    echo "2. 重启WordPress容器使挂载生效"
    echo "   $COMPOSE restart wordpress"
    echo ""
    echo "3. 如果仍然不行，检查本地路径"
    echo "   本地路径应该是：/var/bjt/bjt/bjt-front/bjt-product-system/frontend"
    echo "   容器内路径：/var/www/html/frontend"
    echo ""
    echo "4. 验证挂载"
    echo "   $COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/"
else
    echo "❌ 本地文件也不存在"
    echo ""
    echo "需要："
    echo "1. 确认文件是否在其他位置"
    echo "2. 或者需要重新上传文件"
fi
