#!/bin/bash
# 在服务器上检查容器内文件的脚本

set -e

cd /var/bjt/bjt/bjt-front/bjt-product-system

COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

echo "=== 检查WordPress容器内的文件 ==="
echo ""

echo "1. 检查旧路径: /var/www/html/frontend/public/uploads/product_lines/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/ 2>/dev/null | head -10 || echo "  ❌ 目录不存在或为空"

echo ""
echo "2. 检查新路径: /var/www/html/frontend/public/uploads/product-lines/images/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -10 || echo "  ❌ 目录不存在或为空"

echo ""
echo "3. 查找包含'Paper'的文件"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -iname "*paper*" -type f 2>/dev/null | head -10 || echo "  ❌ 未找到"

echo ""
echo "4. 检查挂载点"
$COMPOSE exec wordpress mount | grep frontend | head -3

echo ""
echo "=== 检查Nginx容器 ==="
echo ""

echo "5. Nginx容器内的uploads目录"
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | head -10 || echo "  ❌ 目录不存在或为空"

echo ""
echo "6. 测试Nginx到WordPress的连接"
$COMPOSE exec nginx ping -c 1 wordpress &>/dev/null && echo "  ✅ 可以连接" || echo "  ❌ 无法连接"

echo ""
echo "7. 测试WordPress内部访问文件"
$COMPOSE exec nginx curl -I "http://wordpress:80/frontend/public/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -3 || echo "  ❌ 无法访问"

echo ""
echo "8. 检查本地文件（服务器上）"
echo "  本地路径: /var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/"
ls -la /var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/ 2>/dev/null | head -5 || echo "  ❌ 本地文件不存在"

echo ""
echo "=== 总结 ==="
echo ""
echo "如果本地文件存在但容器内没有："
echo "1. 检查docker-compose.prod.yml中的挂载配置"
echo "2. 确认挂载路径是否正确"
echo "3. 可能需要重启容器使挂载生效"
