#!/bin/bash
# 彻底清理并重新部署

set -e

echo "=========================================="
echo "  彻底清理并重新部署"
echo "=========================================="
echo ""

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_DIR" || exit 1

echo "1. 停止所有服务..."
echo "--------------------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml down
echo "✅ 服务已停止"
echo ""

echo "2. 清理前端缓存..."
echo "--------------------------------------"
rm -rf frontend/node_modules
rm -rf frontend/.vite
rm -rf frontend/dist
echo "✅ 前端缓存已清理"
echo ""

echo "3. 清理 Docker 所有缓存..."
echo "--------------------------------------"
docker system prune -a -f --volumes
docker builder prune -a -f
echo "✅ Docker 缓存已清理"
echo ""

echo "4. 拉取最新代码..."
echo "--------------------------------------"
git fetch origin phase-2
git reset --hard origin/phase-2
echo "✅ 代码已更新"
echo ""

echo "5. 确保 package-lock.json 是最新的..."
echo "--------------------------------------"
if [ -f frontend/package-lock.json ]; then
    echo "找到 package-lock.json"
    # 检查是否有错误的依赖
    if grep -q "@tailwindcss/postcss" frontend/package-lock.json; then
        echo "⚠️  发现错误的依赖，删除 package-lock.json"
        rm frontend/package-lock.json
    fi
fi
echo "✅ 依赖文件检查完成"
echo ""

echo "6. 重新构建并启动服务..."
echo "--------------------------------------"
echo "这可能需要 5-10 分钟..."
docker-compose -f docker/prod/docker-compose.prod.yml up -d --build
echo ""

echo "7. 等待服务启动..."
echo "--------------------------------------"
sleep 40
echo ""

echo "8. 检查服务状态..."
echo "--------------------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml ps
echo ""

echo "=========================================="
echo "  部署完成"
echo "=========================================="
echo ""

echo "验证服务："
echo "  curl -I https://eorder.lockedair.com"
echo "  curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"
echo ""

echo "查看日志："
echo "  docker-compose -f docker/prod/docker-compose.prod.yml logs -f"

