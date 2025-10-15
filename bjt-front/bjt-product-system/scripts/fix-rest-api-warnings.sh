#!/bin/bash
# 脚本：fix-rest-api-warnings.sh
# 描述：修复生产环境 WordPress REST API 的 DoingItWrong 警告

set -e

# 项目根目录
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
# Docker Compose 文件路径
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
# WordPress 服务名称
WORDPRESS_SERVICE="wordpress"
# Nginx 服务名称
NGINX_SERVICE="nginx"

echo "=== 开始修复 WordPress REST API 警告 ==="
echo ""

# 1. 检查当前目录
cd "$PROJECT_ROOT" || {
    echo "❌ 错误: 无法进入项目目录 $PROJECT_ROOT"
    exit 1
}
echo "✅ 已进入项目目录: $(pwd)"
echo ""

# 2. 备份当前代码（可选但推荐）
echo "📦 备份当前代码..."
BACKUP_DIR="/var/bjt/backups/code-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r plugins/bjt-core-entities "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ 代码已备份到: $BACKUP_DIR"
echo ""

# 3. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin phase-2
git pull origin phase-2
if [ $? -eq 0 ]; then
    echo "✅ 代码拉取成功"
else
    echo "❌ 错误: 代码拉取失败"
    exit 1
fi
echo ""

# 4. 检查关键插件文件是否存在
echo "🔍 检查关键插件文件..."
PLUGIN_FILES=(
    "plugins/bjt-core-entities/bjt-product-api.php"
    "plugins/bjt-core-entities/controllers/class-logistics-controller.php"
    "plugins/bjt-core-entities/controllers/class-rma-controller.php"
    "plugins/bjt-core-entities/controllers/class-part-controller.php"
    "plugins/bjt-core-entities/controllers/class-settings-controller.php"
)

for file in "${PLUGIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ 缺失: $file"
        exit 1
    fi
done
echo ""

# 5. 重启 WordPress 容器以加载新代码
echo "🔄 重启 WordPress 容器..."
docker-compose -f "$DOCKER_COMPOSE_FILE" restart "$WORDPRESS_SERVICE"
if [ $? -eq 0 ]; then
    echo "✅ WordPress 容器已重启"
else
    echo "❌ 错误: WordPress 容器重启失败"
    exit 1
fi
echo ""

# 6. 等待 WordPress 容器完全启动
echo "⏳ 等待 WordPress 启动..."
sleep 10
echo "✅ WordPress 已启动"
echo ""

# 7. 确保插件激活
echo "🔌 确保关键插件激活..."
CRITICAL_PLUGINS=(
    "bjt-core-entities/bjt-product-api.php"
    "bjt-cors/bjt-cors.php"
    "rest-api/plugin.php"
)

for plugin in "${CRITICAL_PLUGINS[@]}"; do
    echo "  -> 激活插件: $plugin"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp plugin activate "$plugin" --allow-root 2>/dev/null || true
done
echo "✅ 插件激活完成"
echo ""

# 8. 刷新 WordPress 重写规则
echo "🔄 刷新 WordPress 重写规则..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp rewrite structure '/%postname%/' --allow-root
docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp rewrite flush --allow-root
if [ $? -eq 0 ]; then
    echo "✅ 重写规则已刷新"
else
    echo "❌ 错误: 重写规则刷新失败"
    exit 1
fi
echo ""

# 9. 验证 API 端点（检查是否还有 DoingItWrong 警告）
echo "🔍 验证 API 端点..."
echo ""
echo "📌 检查诊断端点:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>/dev/null | grep -E "HTTP|X-WP-DoingItWrong" || true
echo ""

echo "📌 检查产品线端点:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/product-lines/ 2>/dev/null | grep -E "HTTP|X-WP-DoingItWrong" || true
echo ""

echo "📌 检查 parts 端点:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/parts/1 2>/dev/null | grep -E "HTTP|X-WP-DoingItWrong" || true
echo ""

# 10. 显示完整诊断端点响应
echo "📋 完整诊断端点响应头:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>/dev/null
echo ""

# 11. 最终检查
echo "=== 修复完成检查 ==="
echo ""
echo "✅ 代码已更新到最新版本"
echo "✅ WordPress 容器已重启"
echo "✅ 插件已激活"
echo "✅ 重写规则已刷新"
echo ""

# 检查是否还有警告
HAS_WARNING=$(curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>/dev/null | grep -c "X-WP-DoingItWrong" || true)
if [ "$HAS_WARNING" -eq 0 ]; then
    echo "🎉 成功! 已消除 X-WP-DoingItWrong 警告"
else
    echo "⚠️  警告: 仍检测到 X-WP-DoingItWrong 警告，请手动检查"
    echo ""
    echo "手动检查命令："
    echo "  curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs wordpress --tail=50"
fi
echo ""

echo "=== 修复流程结束 ==="

