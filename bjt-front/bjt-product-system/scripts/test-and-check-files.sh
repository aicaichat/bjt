#!/bin/bash
# 测试源站并检查容器内文件

set -e

SERVER_IP="47.90.251.35"

# 自动查找项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

# 检查.env.production文件
if [ -f ".env.production" ]; then
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
else
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
fi

echo "=== 1. 测试源站访问（跟随重定向）==="
echo ""

TEST_URL="/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
echo "测试: http://$SERVER_IP$TEST_URL (跟随重定向)"
response=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://$SERVER_IP$TEST_URL" 2>/dev/null || echo "000")
final_url=$(curl -s -o /dev/null -w "%{url_effective}" -L --max-time 10 "http://$SERVER_IP$TEST_URL" 2>/dev/null || echo "")

echo "  最终状态码: $response"
if [ -n "$final_url" ]; then
    echo "  最终URL: $final_url"
fi

if [ "$response" = "200" ]; then
    echo "  ✅ 文件可访问"
elif [ "$response" = "404" ]; then
    echo "  ❌ 文件不存在"
else
    echo "  ⚠️  状态码: $response"
fi

echo ""
echo "=== 2. 检查容器内文件位置 ==="
echo ""

echo "2.1 WordPress容器 - 检查所有可能的路径"
echo "----------------------------------------"

# 检查旧路径
echo "  路径1: /var/www/html/frontend/public/uploads/product_lines/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/ 2>/dev/null | head -5 || echo "    ❌ 目录不存在"

# 检查新路径
echo ""
echo "  路径2: /var/www/html/frontend/public/uploads/product-lines/images/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -5 || echo "    ❌ 目录不存在"

# 查找包含Paper的文件
echo ""
echo "2.2 查找包含'Paper'或'Cushioning'的文件"
echo "----------------------------------------"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -iname "*paper*" -o -iname "*cushioning*" 2>/dev/null | head -10 || echo "  ❌ 未找到文件"

echo ""
echo "2.3 列出所有uploads目录"
echo "----------------------------------------"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -type d 2>/dev/null | head -20 || echo "  ❌ uploads目录不存在"

echo ""
echo "=== 3. 检查Nginx容器 ==="
echo ""

echo "3.1 Nginx容器内的uploads目录"
echo "----------------------------------------"
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | head -10 || echo "  ❌ uploads目录不存在或为空"

echo ""
echo "3.2 查找文件"
echo "----------------------------------------"
$COMPOSE exec nginx find /usr/share/nginx/html/uploads -iname "*paper*" -o -iname "*cushioning*" 2>/dev/null | head -10 || echo "  ❌ 未找到文件"

echo ""
echo "=== 4. 测试Nginx代理到WordPress ==="
echo ""

echo "4.1 测试Nginx到WordPress的网络"
echo "----------------------------------------"
if $COMPOSE exec nginx ping -c 1 wordpress &>/dev/null; then
    echo "  ✅ Nginx可以访问WordPress"
else
    echo "  ❌ Nginx无法访问WordPress"
fi

echo ""
echo "4.2 测试WordPress直接访问文件路径"
echo "----------------------------------------"
echo "  测试: http://wordpress:80/frontend/public/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg"
wp_response=$($COMPOSE exec nginx curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://wordpress:80/frontend/public/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg" 2>/dev/null || echo "000")
echo "  状态码: $wp_response"

echo ""
echo "=== 5. 检查Nginx配置 ==="
echo ""

echo "5.1 检查/uploads/ location配置"
echo "----------------------------------------"
$COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null | grep -A 20 "location /uploads/" | head -25

echo ""
echo "=== 总结 ==="
echo ""
if [ "$response" = "404" ]; then
    echo "❌ 源站返回404，文件不存在"
    echo ""
    echo "可能的原因："
    echo "1. 文件确实不存在于容器中"
    echo "2. 文件路径不匹配（product_lines vs product-lines/images）"
    echo "3. Nginx配置的路径映射不正确"
    echo ""
    echo "建议："
    echo "1. 检查文件是否在WordPress容器的frontend/public/uploads/目录中"
    echo "2. 确认文件路径（下划线 vs 连字符，是否有images子目录）"
    echo "3. 如果文件存在但路径不对，需要迁移文件或修复路径映射"
else
    echo "✅ 源站可以访问文件"
    echo ""
    echo "如果CDN仍然返回404，需要刷新CDN缓存"
fi
