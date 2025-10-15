#!/bin/bash

# 生产环境Docker空间清理脚本
# 请在生产服务器上执行此脚本

echo "🌐 生产环境Docker空间清理脚本"
echo "=================================="

# 检查Docker服务状态
echo "📊 检查Docker状态..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装或不在PATH中"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker服务未运行或权限不足"
    exit 1
fi

echo "✅ Docker服务运行正常"
echo

# 显示当前磁盘使用情况
echo "💾 当前磁盘使用情况:"
df -h
echo

# 显示Docker空间使用情况
echo "🐳 当前Docker空间使用:"
docker system df
echo

# 确认清理操作
echo "⚠️  即将执行以下清理操作:"
echo "1. 停止所有运行中的容器"
echo "2. 删除停止的容器"
echo "3. 删除未使用的镜像"
echo "4. 删除未使用的网络"
echo "5. 删除未使用的卷"
echo "6. 清理构建缓存"
echo

read -p "确认执行清理？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 清理已取消"
    exit 1
fi

echo "🧹 开始清理Docker空间..."

# 1. 停止所有运行中的容器（保留重要服务）
echo "1️⃣  停止非必要容器..."
# 获取所有运行中的容器ID，排除可能的重要服务
RUNNING_CONTAINERS=$(docker ps -q --filter "name=bjt" 2>/dev/null || true)
if [ ! -z "$RUNNING_CONTAINERS" ]; then
    echo "停止BJT相关容器: $RUNNING_CONTAINERS"
    docker stop $RUNNING_CONTAINERS
else
    echo "没有找到BJT相关的运行容器"
fi

# 2. 删除停止的容器
echo "2️⃣  删除停止的容器..."
docker container prune -f

# 3. 删除未使用的镜像
echo "3️⃣  删除未使用的镜像..."
docker image prune -a -f

# 4. 删除未使用的网络
echo "4️⃣  删除未使用的网络..."
docker network prune -f

# 5. 删除未使用的卷
echo "5️⃣  删除未使用的卷..."
# ❌ DISABLED: 这会删除数据库数据！
# docker volume prune -f
echo "⚠️  Volume 清理已禁用以保护生产数据"

# 6. 清理构建缓存
echo "6️⃣  清理构建缓存..."
docker builder prune -a -f

echo "✅ Docker清理完成！"
echo

# 显示清理后的空间使用情况
echo "📊 清理后Docker空间使用:"
docker system df
echo

echo "💾 清理后磁盘使用情况:"
df -h
echo

echo "�� 空间清理完成，可以开始部署了！" 