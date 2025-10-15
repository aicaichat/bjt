#!/bin/bash
# 生产环境启动脚本
# 确保使用正确的环境变量文件

set -e

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"
ENV_FILE="${PROJECT_ROOT}/.env.production"

cd "$PROJECT_ROOT" || exit 1

echo "=== 启动 BJT 生产环境 ==="
echo ""

# 检查环境文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: 环境文件不存在: $ENV_FILE"
    exit 1
fi

echo "✅ 环境文件: $ENV_FILE"
echo ""

# 启动所有服务（使用环境文件）
echo "🚀 启动所有服务..."
docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo ""
echo "⏳ 等待服务启动（30秒）..."
sleep 30

echo ""
echo "📊 检查服务状态:"
docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "🔍 验证 API 端点:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>/dev/null | head -1 || echo "API 未响应"

echo ""
echo "=== 启动完成 ==="
echo ""
echo "🔧 常用命令:"
echo "  查看日志: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE logs -f"
echo "  重启服务: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE restart"
echo "  停止服务: docker-compose -f $DOCKER_COMPOSE_FILE --env-file $ENV_FILE down"
echo ""

