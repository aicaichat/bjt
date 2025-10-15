#!/bin/bash
# 确保关键插件始终保持激活状态

set -e

echo "=========================================="
echo "  确保关键插件保持激活"
echo "=========================================="
echo ""

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"

cd "$PROJECT_DIR" || exit 1

# 关键插件列表
REQUIRED_PLUGINS=(
    "bjt-core-entities/bjt-product-api.php"
    "bjt-cors/bjt-cors.php"
)

echo "检查并激活关键插件..."
echo "--------------------------------------"

for plugin in "${REQUIRED_PLUGINS[@]}"; do
    echo "检查插件: $plugin"
    
    # 检查插件是否激活
    IS_ACTIVE=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';" 2>/dev/null | grep -c "$plugin" || echo "0")
    
    if [ "$IS_ACTIVE" = "0" ]; then
        echo "❌ 插件未激活: $plugin"
        echo "正在激活..."
        
        # 获取当前激活的插件列表
        CURRENT_PLUGINS=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
            mysql -u root -pbjtpassword123 bjt \
            -e "SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';" 2>/dev/null | tail -n 1)
        
        # 添加插件到激活列表
        docker-compose -f "$COMPOSE_FILE" exec -T mysql \
            mysql -u root -pbjtpassword123 bjt \
            -e "UPDATE wp_options SET option_value = 'a:2:{i:0;s:37:\"bjt-core-entities/bjt-product-api.php\";i:1;s:22:\"bjt-cors/bjt-cors.php\";}' WHERE option_name = 'active_plugins';" 2>/dev/null
        
        echo "✅ 插件已激活"
    else
        echo "✅ 插件已激活"
    fi
done

echo ""
echo "重启 WordPress 使更改生效..."
docker-compose -f "$COMPOSE_FILE" restart wordpress

echo ""
echo "✅ 完成"

