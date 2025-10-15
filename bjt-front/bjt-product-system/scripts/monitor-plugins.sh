#!/bin/bash
# 脚本：monitor-plugins.sh
# 描述：监控 WordPress 插件状态和 BJT API 可用性，并在发现问题时尝试自动修复。

set -e

# 项目根目录
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
# Docker Compose 文件路径
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
# WordPress 服务名称
WORDPRESS_SERVICE="wordpress"
# Nginx 服务名称
NGINX_SERVICE="nginx"
# 关键插件列表
CRITICAL_PLUGINS=(
    "bjt-core-entities/bjt-product-api.php"
    "bjt-cors/bjt-cors.php"
    # 添加其他需要监控的插件路径
)
# API 诊断端点
API_DIAGNOSTIC_URL="https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"
# 日志文件
LOG_FILE="/var/log/bjt-plugin-monitor.log"

# 函数：记录日志
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_message "=== 插件和 API 监控开始 ==="

# 1. 检查 WordPress 容器是否运行
log_message "1. 检查 WordPress 容器状态..."
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$WORDPRESS_SERVICE" > /dev/null; then
    log_message "❌ 错误: WordPress 容器未运行。尝试启动..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d "$WORDPRESS_SERVICE"
    sleep 10
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$WORDPRESS_SERVICE" > /dev/null; then
        log_message "❌ 严重错误: 无法启动 WordPress 容器。请手动检查！"
        exit 1
    fi
    log_message "✅ WordPress 容器已启动。"
else
    log_message "✅ WordPress 容器运行中。"
fi

# 2. 检查关键插件状态
log_message "2. 检查关键插件状态..."
PLUGINS_NEED_ACTIVATION=false
for plugin in "${CRITICAL_PLUGINS[@]}"; do
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp plugin is-active "$plugin" --allow-root &> /dev/null; then
        log_message "⚠️ 警告: 插件 $plugin 未激活。尝试激活..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp plugin activate "$plugin" --allow-root
        if [ $? -eq 0 ]; then
            log_message "✅ 插件 $plugin 已激活。"
            PLUGINS_NEED_ACTIVATION=true
        else
            log_message "❌ 错误: 无法激活插件 $plugin。请检查 WordPress 日志。"
        fi
    else
        log_message "✅ 插件 $plugin 处于激活状态。"
    fi
done

if [ "$PLUGINS_NEED_ACTIVATION" = true ]; then
    log_message "插件状态已更改，刷新 WordPress 重写规则..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$WORDPRESS_SERVICE" wp rewrite flush --allow-root
    if [ $? -eq 0 ]; then
        log_message "✅ WordPress 重写规则已刷新。"
    else
        log_message "❌ 错误: 无法刷新 WordPress 重写规则。"
    fi
fi

# 3. 检查 BJT API 可用性
log_message "3. 检查 BJT API 可用性: $API_DIAGNOSTIC_URL"
API_STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$API_DIAGNOSTIC_URL")

if [ "$API_STATUS" -eq 200 ]; then
    log_message "✅ BJT API 响应正常 (HTTP $API_STATUS)。"
else
    log_message "❌ 错误: BJT API 响应异常 (HTTP $API_STATUS)。尝试重启 WordPress 和 Nginx..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart "$WORDPRESS_SERVICE" "$NGINX_SERVICE"
    sleep 15 # 等待服务重启
    API_STATUS_AFTER_RESTART=$(curl -o /dev/null -s -w "%{http_code}\n" "$API_DIAGNOSTIC_URL")
    if [ "$API_STATUS_AFTER_RESTART" -eq 200 ]; then
        log_message "✅ 服务重启后 BJT API 恢复正常 (HTTP $API_STATUS_AFTER_RESTART)。"
    else
        log_message "❌ 严重错误: 服务重启后 BJT API 仍异常 (HTTP $API_STATUS_AFTER_RESTART)。请手动检查！"
    fi
fi

log_message "=== 插件和 API 监控结束 ==="
echo ""
