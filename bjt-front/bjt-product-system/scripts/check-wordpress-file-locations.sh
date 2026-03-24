#!/bin/bash
# 详细检查WordPress容器内的文件位置和Apache配置

set -e

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

echo "=== 1. 检查WordPress容器内所有uploads目录 ==="
echo ""
echo "1.1 frontend/public/uploads/product-lines/images/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -10 || echo "   ❌ 目录不存在"
echo ""

echo "1.2 frontend/public/uploads/product_lines/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/ 2>/dev/null | head -10 || echo "   ❌ 目录不存在"
echo ""

echo "1.3 wp-content/uploads/"
$COMPOSE exec wordpress ls -la /var/www/html/wp-content/uploads/ 2>/dev/null | head -10 || echo "   ❌ 目录不存在"
echo ""

echo "1.4 查找所有uploads目录"
$COMPOSE exec wordpress find /var/www/html -type d -name "uploads" 2>/dev/null
echo ""

echo "=== 2. 查找所有图片文件 ==="
echo ""
echo "2.1 在frontend/public/uploads中查找所有图片"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.gif" \) 2>/dev/null | head -20
echo ""

echo "2.2 在wp-content/uploads中查找所有图片"
$COMPOSE exec wordpress find /var/www/html/wp-content/uploads -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.gif" \) 2>/dev/null | head -20
echo ""

echo "=== 3. 检查Apache配置 ==="
echo ""
echo "3.1 DocumentRoot"
$COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "DocumentRoot" || echo "   ❌ 无法读取配置"
echo ""

echo "3.2 Alias配置"
$COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "Alias" || echo "   ⚠️  没有找到Alias配置"
echo ""

echo "3.3 Directory配置"
$COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -A 5 -i "Directory" | head -20 || echo "   ⚠️  无法读取"
echo ""

echo "=== 4. 检查Apache是否能访问frontend目录 ==="
echo ""
echo "4.1 检查frontend目录权限"
$COMPOSE exec wordpress ls -ld /var/www/html/frontend 2>/dev/null
echo ""

echo "4.2 检查Apache用户"
$COMPOSE exec wordpress ps aux | grep apache | head -1 || echo "   ⚠️  无法获取Apache进程信息"
echo ""

echo "=== 5. 测试Apache访问路径 ==="
echo ""
echo "5.1 测试 /uploads/ 路径"
$COMPOSE exec wordpress curl -I http://localhost/uploads/ 2>/dev/null | head -3 || echo "   ⚠️  无法测试"
echo ""

echo "5.2 测试 /frontend/public/uploads/ 路径"
$COMPOSE exec wordpress curl -I http://localhost/frontend/public/uploads/ 2>/dev/null | head -3 || echo "   ⚠️  无法测试"
echo ""

echo "=== 6. 检查请求的URL路径 ==="
echo ""
echo "请求URL: /uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
echo "解码后: /uploads/product_lines/Water Activated Tape Dispenser.jpg"
echo ""
echo "Apache会在以下路径查找:"
echo "  /var/www/html/uploads/product_lines/Water Activated Tape Dispenser.jpg"
echo ""
echo "但实际文件可能在:"
echo "  /var/www/html/frontend/public/uploads/product-lines/images/xxx.jpg"
echo "  或"
echo "  /var/www/html/frontend/public/uploads/product_lines/xxx.jpg"
echo ""
