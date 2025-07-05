#!/bin/bash

# 部署API修复到生产环境
echo "🚀 部署关联关系API过滤修复..."

# 可能的容器名称
CONTAINER_NAMES=(
    "dev-wordpress-1"
    "prod-wordpress-1"
    "bjt-wordpress-1"
    "wordpress-1"
    "bjt-product-system-wordpress-1"
    "bjt-product-system_wordpress_1"
)

# 可能的Docker Compose文件
COMPOSE_FILES=(
    "docker/prod/docker-compose.prod.yml"
    "docker/prod/docker-compose.local.yml"
    "docker/dev/docker-compose.nginx.yml"
    "docker-compose.yml"
)

# 源文件配置
SOURCE_FILE="plugins/bjt-core-entities/controllers/class-relation-controller.php"

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ 源文件不存在: $SOURCE_FILE"
    exit 1
fi

# 查找运行中的WordPress容器
CONTAINER_NAME=""
for name in "${CONTAINER_NAMES[@]}"; do
    if docker ps | grep -q "$name"; then
        CONTAINER_NAME="$name"
        echo "✅ 找到运行中的容器: $CONTAINER_NAME"
        break
    fi
done

# 如果没有找到运行中的容器，尝试启动
if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ 没有找到运行中的WordPress容器"
    echo "🔍 尝试启动容器..."
    
    # 查找可用的Docker Compose文件
    COMPOSE_FILE=""
    for file in "${COMPOSE_FILES[@]}"; do
        if [ -f "$file" ]; then
            COMPOSE_FILE="$file"
            echo "✅ 找到Compose文件: $COMPOSE_FILE"
            break
        fi
    done
    
    if [ -z "$COMPOSE_FILE" ]; then
        echo "❌ 没有找到Docker Compose文件"
        echo "💡 请手动启动WordPress容器，或者在正确的目录中运行此脚本"
        exit 1
    fi
    
    # 启动容器
    echo "🚀 启动Docker容器..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # 等待容器启动
    echo "⏳ 等待容器启动..."
    sleep 10
    
    # 再次检查容器
    for name in "${CONTAINER_NAMES[@]}"; do
        if docker ps | grep -q "$name"; then
            CONTAINER_NAME="$name"
            echo "✅ 容器启动成功: $CONTAINER_NAME"
            break
        fi
    done
    
    if [ -z "$CONTAINER_NAME" ]; then
        echo "❌ 容器启动失败"
        echo "💡 请手动检查Docker状态: docker ps -a"
        exit 1
    fi
fi

# 确定目标路径
TARGET_PATH="/var/www/html/wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php"

# 复制修复后的文件到容器
echo "📁 复制修复后的API控制器到容器..."
docker cp "$SOURCE_FILE" "$CONTAINER_NAME:$TARGET_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 文件复制成功"
else
    echo "❌ 文件复制失败"
    exit 1
fi

# 验证文件是否正确复制
echo "🔍 验证文件内容..."
docker exec "$CONTAINER_NAME" grep -n "host_part_number" "$TARGET_PATH" | head -5

# 重启服务以确保修改生效
echo "🔄 重启服务..."
if docker exec "$CONTAINER_NAME" service apache2 reload 2>/dev/null; then
    echo "✅ Apache重启成功"
elif docker exec "$CONTAINER_NAME" service nginx reload 2>/dev/null; then
    echo "✅ Nginx重启成功"
else
    echo "⚠️ 无法重启Web服务器，但文件已更新"
fi

# 获取容器端口
PORT=$(docker port "$CONTAINER_NAME" 80 2>/dev/null | cut -d':' -f2)
if [ -z "$PORT" ]; then
    PORT="80"
fi

# 测试API修复效果
echo "🧪 测试API修复效果..."
TEST_URL="http://localhost:${PORT}/wp-json/bjt/v1/relations?host_part_number=60A01113&per_page=5"
echo "测试URL: $TEST_URL"

# 等待服务重启
sleep 2

# 测试API响应
echo "📡 发送测试请求..."
if command -v curl >/dev/null 2>&1; then
    curl -s -X GET "$TEST_URL" -H "Content-Type: application/json" | head -c 500
    echo ""
else
    echo "⚠️ curl命令不可用，请手动测试API"
fi

echo ""
echo "✅ API修复部署完成！"
echo "💡 请检查上面的测试结果，确认只返回指定主机的数据"
echo ""
echo "🔧 如果还有问题，请检查："
echo "   1. 数据库中是否存在重复记录"
echo "   2. 前端缓存是否已清除"
echo "   3. CDN缓存是否已更新"
echo "   4. 容器名称: $CONTAINER_NAME"
echo "   5. 端口: $PORT" 