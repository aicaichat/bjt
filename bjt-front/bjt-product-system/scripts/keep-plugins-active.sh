#!/bin/bash
# 脚本：keep-plugins-active.sh
# 描述：确保 BJT 核心插件在 WordPress 生产环境中保持激活状态。

set -e

# 项目根目录
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
# Docker Compose 文件路径
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
# WordPress 服务名称
WORDPRESS_SERVICE="wordpress"
# 关键插件列表
CRITICAL_PLUGINS=(
    "bjt-core-entities/bjt-product-api.php"
    "bjt-cors/bjt-cors.php"
    # 添加其他需要保持激活的插件路径
)

echo "=== 确保 BJT 核心插件激活 ==="

# 检查 Docker Compose 文件是否存在
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "❌ 错误: Docker Compose 文件未找到: $DOCKER_COMPOSE_FILE"
    exit 1
fi

# 检查 WordPress 容器是否运行
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$WORDPRESS_SERVICE" > /dev/null; then
    echo "⚠️ 警告: WordPress 容器未运行。尝试启动..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d "$WORDPRESS_SERVICE"
    sleep 10 # 等待容器启动
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$WORDPRESS_SERVICE" > /dev/null; then
        echo "❌ 错误: 无法启动 WordPress 容器。请手动检查。"
        exit 1
    fi
    echo "✅ WordPress 容器已启动。"
fi

# 激活关键插件
for plugin in "${CRITICAL_PLUGINS[@]}"; do
    echo "-> 检查并激活插件: $plugin"
    # 使用 wp-cli 检查插件状态并激活
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp plugin is-active "$plugin" --allow-root &> /dev/null; then
        echo "   激活插件: $plugin"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp plugin activate "$plugin" --allow-root
        if [ $? -eq 0 ]; then
            echo "   ✅ 插件 $plugin 已激活。"
        else
            echo "   ❌ 错误: 无法激活插件 $plugin。请手动检查 WordPress 日志。"
        fi
    else
        echo "   ✅ 插件 $plugin 已处于激活状态。"
    fi
done

# 刷新 WordPress 重写规则
echo "-> 刷新 WordPress 重写规则..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp rewrite flush --allow-root
if [ $? -eq 0 ]; then
    echo "✅ WordPress 重写规则已刷新。"
else
    echo "❌ 错误: 无法刷新 WordPress 重写规则。请手动检查。"
fi

echo "=== 插件激活检查和修复完成 ==="
echo ""
