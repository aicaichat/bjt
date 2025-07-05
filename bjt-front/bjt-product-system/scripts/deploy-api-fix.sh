#!/bin/bash

# 部署API修复到Docker容器
echo "🚀 部署关联关系API过滤修复..."

# 配置
CONTAINER_NAME="dev-wordpress-1"
SOURCE_FILE="plugins/bjt-core-entities/controllers/class-relation-controller.php"
TARGET_PATH="/var/www/html/wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php"

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ 源文件不存在: $SOURCE_FILE"
    exit 1
fi

# 检查Docker容器是否运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Docker容器未运行: $CONTAINER_NAME"
    echo "请先启动Docker容器: docker-compose up -d"
    exit 1
fi

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

# 重启Apache以确保修改生效
echo "🔄 重启Apache服务..."
docker exec "$CONTAINER_NAME" service apache2 reload

# 测试API修复效果
echo "🧪 测试API修复效果..."
echo "测试URL: http://localhost:8080/wp-json/bjt/v1/relations?host_part_number=60A01113&product_line_id=1&per_page=5"

# 等待服务重启
sleep 2

# 测试API响应
echo "📡 发送测试请求..."
curl -s -X GET "http://localhost:8080/wp-json/bjt/v1/relations?host_part_number=60A01113&product_line_id=1&per_page=5" \
  -H "Content-Type: application/json" \
  | jq '.items[] | {id, host_part_number, child_part_number}' | head -10

echo ""
echo "✅ API修复部署完成！"
echo "💡 请检查上面的测试结果，确认只返回指定主机的数据"
echo ""
echo "🔧 如果还有问题，请检查："
echo "   1. 数据库中是否存在重复记录"
echo "   2. 前端缓存是否已清除"
echo "   3. CDN缓存是否已更新" 