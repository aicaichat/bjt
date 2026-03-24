#!/bin/bash

# 诊断uploads目录位置和挂载问题

PROJECT_ROOT="/var/bjt/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_ROOT"

echo "=== 诊断uploads目录位置 ==="
echo ""

# 检查环境变量文件
if [ -f ".env.production" ]; then
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
    echo "✅ 使用 .env.production"
else
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
    echo "⚠️  未找到 .env.production，使用默认配置"
fi

echo ""
echo "=== 1. 检查Docker volume ==="
docker volume ls | grep -E "(uploads|bjt)" || echo "未找到相关volume"

echo ""
echo "=== 2. 检查Nginx容器中的目录结构 ==="
echo "2.1 /usr/share/nginx/html/ 目录内容:"
$COMPOSE exec -T nginx ls -la /usr/share/nginx/html/ 2>/dev/null | head -15 || echo "无法访问"

echo ""
echo "2.2 检查uploads目录:"
if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/uploads" 2>/dev/null; then
    echo "✅ /usr/share/nginx/html/uploads 存在"
    $COMPOSE exec -T nginx ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | head -10
else
    echo "❌ /usr/share/nginx/html/uploads 不存在"
fi

echo ""
echo "2.3 检查dist目录:"
if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/dist" 2>/dev/null; then
    echo "✅ /usr/share/nginx/html/dist 存在"
    if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/dist/uploads" 2>/dev/null; then
        echo "✅ /usr/share/nginx/html/dist/uploads 存在"
        $COMPOSE exec -T nginx ls -la /usr/share/nginx/html/dist/uploads/ 2>/dev/null | head -10
    else
        echo "❌ /usr/share/nginx/html/dist/uploads 不存在"
    fi
else
    echo "❌ /usr/share/nginx/html/dist 不存在"
fi

echo ""
echo "=== 3. 检查挂载点 ==="
$COMPOSE exec -T nginx mount | grep -E "(uploads|html)" || echo "未找到相关挂载"

echo ""
echo "=== 4. 检查本地文件系统 ==="
echo "4.1 检查 frontend/dist/uploads:"
if [ -d "frontend/dist/uploads" ]; then
    echo "✅ 本地目录存在"
    ls -la frontend/dist/uploads/ | head -10
else
    echo "❌ 本地目录不存在"
fi

echo ""
echo "4.2 检查 frontend/public/uploads:"
if [ -d "frontend/public/uploads" ]; then
    echo "✅ 本地目录存在"
    ls -la frontend/public/uploads/ | head -10
else
    echo "❌ 本地目录不存在"
fi

echo ""
echo "=== 5. 查找product_lines相关文件 ==="
echo "5.1 在本地查找:"
find . -type d -name "product_lines" 2>/dev/null | head -10

echo ""
echo "5.2 在容器中查找:"
$COMPOSE exec -T nginx find /usr/share/nginx/html -type d -name "*product*" 2>/dev/null | head -10

echo ""
echo "=== 6. 检查docker-compose挂载配置 ==="
echo "Nginx volumes配置:"
grep -A 10 "nginx:" docker/prod/docker-compose.prod.yml | grep -A 10 "volumes:" | head -15

echo ""
echo "=== 建议 ==="
echo "根据docker-compose.prod.yml配置："
echo "  - frontend/dist 挂载到 /usr/share/nginx/html"
echo "  - uploads_data volume 挂载到 /usr/share/nginx/html/uploads"
echo ""
echo "如果uploads目录不存在，可能需要："
echo "  1. 创建本地目录: mkdir -p frontend/dist/uploads/product_lines"
echo "  2. 或者检查volume是否正确创建"
echo "  3. 或者文件实际在 frontend/public/uploads 中，需要同步到 dist/uploads"
