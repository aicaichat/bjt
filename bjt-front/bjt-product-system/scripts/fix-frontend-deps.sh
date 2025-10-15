#!/bin/bash
# 修复前端依赖问题

set -e

echo "=========================================="
echo "  修复前端依赖问题"
echo "=========================================="
echo ""

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
FRONTEND_DIR="$PROJECT_DIR/frontend"

cd "$PROJECT_DIR" || exit 1

echo "1. 清理前端构建缓存..."
echo "--------------------------------------"
rm -rf "$FRONTEND_DIR/node_modules"
rm -f "$FRONTEND_DIR/package-lock.json"
echo "✅ 缓存已清理"
echo ""

echo "2. 清理 Docker 构建缓存..."
echo "--------------------------------------"
docker builder prune -f
echo "✅ Docker 构建缓存已清理"
echo ""

echo "3. 验证 package.json..."
echo "--------------------------------------"
if [ -f "$FRONTEND_DIR/package.json" ]; then
    echo "✅ package.json 存在"
    
    # 检查是否有问题的依赖
    if grep -q "@tailwindcss/postcss" "$FRONTEND_DIR/package.json"; then
        echo "⚠️  发现 @tailwindcss/postcss 依赖，正在移除..."
        sed -i.bak '/@tailwindcss\/postcss/d' "$FRONTEND_DIR/package.json"
        echo "✅ 已移除问题依赖"
    else
        echo "✅ 未发现问题依赖"
    fi
else
    echo "❌ package.json 不存在"
    exit 1
fi
echo ""

echo "4. 测试本地 npm install..."
echo "--------------------------------------"
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps || {
    echo "⚠️  npm install 失败，尝试使用 --force"
    npm install --force
}
echo "✅ 依赖安装成功"
echo ""

echo "5. 重新生成 package-lock.json..."
echo "--------------------------------------"
npm install --package-lock-only
echo "✅ package-lock.json 已更新"
echo ""

echo "=========================================="
echo "  修复完成"
echo "=========================================="
echo ""
echo "现在可以重新部署了"
echo "  cd $PROJECT_DIR"
echo "  docker-compose -f docker/prod/docker-compose.prod.yml up -d --build"

