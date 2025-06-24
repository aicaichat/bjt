#!/bin/bash

# BJT前端快速重启脚本
# 使用Docker容器管理，不影响后端服务

echo "🔄 重启前端服务..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker Desktop"
    exit 1
fi

# 重启前端容器
cd docker/dev
if docker-compose -f docker-compose.nginx.yml ps frontend | grep -q "Up"; then
    echo "📦 重启前端容器..."
    docker-compose -f docker-compose.nginx.yml restart frontend
else
    echo "📦 启动前端容器..."
    docker-compose -f docker-compose.nginx.yml up -d frontend
fi

echo "✅ 前端服务重启完成"
echo "🌐 访问地址: http://localhost:5173" 