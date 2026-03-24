#!/bin/bash

# 修复并检查uploads目录
# 自动处理环境变量和目录查找

PROJECT_ROOT="/var/bjt/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_ROOT"

echo "=== 1. 检查环境变量文件 ==="
if [ -f ".env.production" ]; then
    echo "✅ .env.production 文件存在"
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
else
    echo "⚠️  .env.production 文件不存在，使用默认配置"
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
fi

echo ""
echo "=== 2. 检查容器状态 ==="
$COMPOSE ps | grep -E "(nginx|wordpress)" || echo "容器未运行"

echo ""
echo "=== 3. 检查uploads目录的所有可能位置 ==="

# 检查位置1: Nginx容器的标准位置
echo "3.1 检查 /usr/share/nginx/html/uploads/"
if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/uploads/" 2>/dev/null; then
    echo "✅ 目录存在"
    echo "   子目录:"
    $COMPOSE exec -T nginx ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | head -10
else
    echo "❌ 目录不存在"
fi

# 检查位置2: 查找所有uploads相关目录
echo ""
echo "3.2 查找所有uploads相关目录:"
$COMPOSE exec -T nginx find /usr/share/nginx/html -type d -name "*upload*" 2>/dev/null | head -10

# 检查位置3: 检查Docker volume
echo ""
echo "3.3 检查Docker volume挂载:"
$COMPOSE exec -T nginx mount | grep uploads || echo "未找到uploads挂载"

# 检查位置4: 检查WordPress容器
echo ""
echo "3.4 检查WordPress容器中的uploads:"
if $COMPOSE exec -T wordpress test -d "/var/www/html/wp-content/uploads/" 2>/dev/null; then
    echo "✅ WordPress uploads目录存在"
    $COMPOSE exec -T wordpress ls -la /var/www/html/wp-content/uploads/ 2>/dev/null | head -10
else
    echo "❌ WordPress uploads目录不存在"
fi

# 检查位置5: 检查前端目录
echo ""
echo "3.5 检查前端uploads目录:"
if $COMPOSE exec -T wordpress test -d "/var/www/html/frontend/public/uploads/" 2>/dev/null; then
    echo "✅ 前端uploads目录存在"
    $COMPOSE exec -T wordpress ls -la /var/www/html/frontend/public/uploads/ 2>/dev/null | head -10
else
    echo "❌ 前端uploads目录不存在"
fi

# 检查位置6: 检查dist目录
echo ""
echo "3.6 检查dist/uploads目录:"
if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/dist/uploads/" 2>/dev/null; then
    echo "✅ dist/uploads目录存在"
    $COMPOSE exec -T nginx ls -la /usr/share/nginx/html/dist/uploads/ 2>/dev/null | head -10
else
    echo "❌ dist/uploads目录不存在"
fi

echo ""
echo "=== 4. 查找product_lines相关文件 ==="
echo "4.1 在Nginx容器中查找:"
$COMPOSE exec -T nginx find /usr/share/nginx/html -type d -name "*product*" 2>/dev/null | head -10

echo ""
echo "4.2 查找所有jpg文件:"
$COMPOSE exec -T nginx find /usr/share/nginx/html -name "*.jpg" -type f 2>/dev/null | head -10

echo ""
echo "=== 5. 检查Docker volume ==="
docker volume ls | grep uploads || echo "未找到uploads相关的volume"

echo ""
echo "=== 6. 检查docker-compose配置中的挂载 ==="
grep -A 5 "uploads" docker/prod/docker-compose.prod.yml | head -20

echo ""
echo "=== 完成 ==="
