#!/bin/bash
# 监控插件状态并自动修复

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"
LOG_FILE="/var/log/bjt-plugin-monitor.log"

cd "$PROJECT_DIR" || exit 1

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查插件是否激活
check_plugin_active() {
    local plugin=$1
    docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';" 2>/dev/null | grep -q "$plugin"
}

# 激活插件
activate_plugins() {
    log "检测到插件未激活，正在修复..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "UPDATE wp_options SET option_value = 'a:2:{i:0;s:37:\"bjt-core-entities/bjt-product-api.php\";i:1;s:22:\"bjt-cors/bjt-cors.php\";}' WHERE option_name = 'active_plugins';" 2>/dev/null
    
    # 重启 WordPress
    docker-compose -f "$COMPOSE_FILE" restart wordpress >/dev/null 2>&1
    
    log "✅ 插件已重新激活，WordPress 已重启"
    
    # 发送通知（可选）
    # curl -X POST "https://your-notification-service.com/alert" \
    #     -d "message=BJT插件自动重新激活" || true
}

# 测试 API
test_api() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/wp-json/bjt/v1/diagnostic 2>/dev/null)
    echo "$response"
}

# 主逻辑
if ! check_plugin_active "bjt-core-entities"; then
    log "❌ bjt-core-entities 插件未激活"
    activate_plugins
elif ! check_plugin_active "bjt-cors"; then
    log "❌ bjt-cors 插件未激活"
    activate_plugins
else
    # 测试 API 是否正常
    API_STATUS=$(test_api)
    if [ "$API_STATUS" != "200" ]; then
        log "⚠️  API 返回异常状态码: $API_STATUS，尝试重新激活插件"
        activate_plugins
    else
        log "✅ 插件状态正常，API 运行正常"
    fi
fi

