#!/bin/bash

echo "🛑 停止本地生产环境..."

# 停止前端服务器
if [ -f logs/frontend-production.pid ]; then
    FRONTEND_PID=$(cat logs/frontend-production.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端开发服务器已停止"
    fi
    rm logs/frontend-production.pid
fi

# 停止其他可能的前端进程
if lsof -ti:5173 &>/dev/null; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# 停止Docker服务
docker-compose -f docker/dev/docker-compose.nginx.yml down

echo "✅ 本地生产环境已停止"
