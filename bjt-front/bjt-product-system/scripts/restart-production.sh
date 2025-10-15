#!/bin/bash
# 生产环境重启脚本

set -e

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
ENV_FILE="${PROJECT_ROOT}/.env.production"

cd "$PROJECT_ROOT" || exit 1

echo "=== 重启 BJT 生产环境 ==="
echo ""

docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" restart

echo ""
echo "⏳ 等待服务重启（15秒）..."
sleep 15

echo ""
echo "🔍 验证 API:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>/dev/null | head -1

echo ""
echo "=== 重启完成 ==="

