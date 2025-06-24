#!/bin/bash

# BJT产品系统 - 前端服务重启脚本
# 使用Docker容器管理，避免杀死后端进程

set -e

echo "🔧 BJT前端服务重启脚本"
echo "========================"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker守护进程未运行，请先启动Docker Desktop"
    exit 1
fi

# 进入Docker开发环境目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DEV_DIR="$PROJECT_ROOT/docker/dev"

echo "📁 项目根目录: $PROJECT_ROOT"
echo "🐳 Docker配置目录: $DOCKER_DEV_DIR"

# 检查docker-compose文件是否存在
if [ ! -f "$DOCKER_DEV_DIR/docker-compose.nginx.yml" ]; then
    echo "❌ Docker Compose配置文件不存在: $DOCKER_DEV_DIR/docker-compose.nginx.yml"
    exit 1
fi

cd "$DOCKER_DEV_DIR"

echo ""
echo "🔍 检查当前容器状态..."
docker-compose -f docker-compose.nginx.yml ps

echo ""
echo "🔄 重启前端容器..."

# 方法1: 只重启前端容器
if docker-compose -f docker-compose.nginx.yml ps frontend | grep -q "Up"; then
    echo "📦 前端容器正在运行，执行重启..."
    docker-compose -f docker-compose.nginx.yml restart frontend
else
    echo "📦 前端容器未运行，启动前端容器..."
    docker-compose -f docker-compose.nginx.yml up -d frontend
fi

echo ""
echo "⏳ 等待前端服务启动..."
sleep 3

# 检查前端容器健康状态
echo "🏥 检查前端容器健康状态..."
for i in {1..10}; do
    if docker-compose -f docker-compose.nginx.yml ps frontend | grep -q "Up"; then
        echo "✅ 前端容器启动成功"
        break
    fi
    echo "⏳ 等待前端容器启动... ($i/10)"
    sleep 2
done

echo ""
echo "📋 当前服务状态:"
docker-compose -f docker-compose.nginx.yml ps

echo ""
echo "🌐 服务访问地址:"
echo "  - 前端开发服务器: http://localhost:5173"
echo "  - WordPress后端: http://localhost:8080"
echo "  - Nginx代理: http://localhost:80"

echo ""
echo "📝 查看前端容器日志:"
echo "  docker-compose -f $DOCKER_DEV_DIR/docker-compose.nginx.yml logs -f frontend"

echo ""
echo "✅ 前端服务重启完成！" 