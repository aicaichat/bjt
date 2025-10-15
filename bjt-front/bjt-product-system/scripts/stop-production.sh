#!/bin/bash
# 生产环境停止脚本

set -e

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
ENV_FILE="${PROJECT_ROOT}/.env.production"

cd "$PROJECT_ROOT" || exit 1

echo "=== 停止 BJT 生产环境 ==="
echo ""

docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "✅ 所有服务已停止"

