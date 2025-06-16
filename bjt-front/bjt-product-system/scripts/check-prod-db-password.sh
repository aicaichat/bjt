#!/bin/bash

# =============================================================================
# 生产环境数据库密码检测脚本
# =============================================================================

set -e

CONTAINER_NAME="prod_mysql_1"

echo "🔍 检测生产环境数据库密码..."
echo "📋 目标容器: $CONTAINER_NAME"

# 检查容器是否运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ 容器 $CONTAINER_NAME 未运行"
    exit 1
fi

echo "✅ 容器运行正常"

# 常见密码列表
PASSWORDS=(
    "root"
    "password" 
    "mysql"
    "123456"
    "admin"
    "bjt123"
    "bjt2024"
    ""
)

echo ""
echo "🔐 测试常见密码..."

for pwd in "${PASSWORDS[@]}"; do
    if [ -z "$pwd" ]; then
        echo -n "测试空密码... "
        if docker exec "$CONTAINER_NAME" mysql -uroot -e "SELECT 1;" &> /dev/null; then
            echo "✅ 成功！密码为空"
            echo "export DB_PASS=\"\"" > /tmp/db_password.env
            exit 0
        else
            echo "❌ 失败"
        fi
    else
        echo -n "测试密码 '$pwd'... "
        if docker exec "$CONTAINER_NAME" mysql -uroot -p"$pwd" -e "SELECT 1;" &> /dev/null; then
            echo "✅ 成功！"
            echo "export DB_PASS=\"$pwd\"" > /tmp/db_password.env
            echo ""
            echo "🎉 找到正确密码: $pwd"
            echo "📝 已保存到 /tmp/db_password.env"
            echo ""
            echo "🔧 您可以使用以下命令修复数据库："
            echo "source /tmp/db_password.env"
            echo "docker exec $CONTAINER_NAME mysql -uroot -p\$DB_PASS -Dbjt_product -e \"SELECT bag_type, COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type;\""
            exit 0
        else
            echo "❌ 失败"
        fi
    fi
done

echo ""
echo "❌ 未找到正确密码"
echo "🔧 请尝试以下方法："
echo ""
echo "1. 检查Docker Compose配置文件："
echo "   grep -r MYSQL_ROOT_PASSWORD docker/"
echo ""
echo "2. 查看容器环境变量："
echo "   docker exec $CONTAINER_NAME env | grep MYSQL"
echo ""
echo "3. 手动输入密码测试："
echo "   docker exec -it $CONTAINER_NAME mysql -uroot -p"
echo ""
echo "4. 查看容器启动日志："
echo "   docker logs $CONTAINER_NAME | grep -i password" 