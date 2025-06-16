#!/bin/bash

# 一键执行数据库修复脚本

echo "🔧 开始修复数据库数据..."

# 检查Docker容器
if ! docker ps | grep -q "dev-wordpress-1"; then
    echo "❌ WordPress容器未运行，请先启动Docker服务"
    echo "运行: docker-compose -f docker/dev/docker-compose.nginx.yml up -d"
    exit 1
fi

# 获取数据库连接信息
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="bjt_product_system"
DB_USER="root"
DB_PASS="bjt123456"

echo "📊 修复前数据统计..."
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS $DB_NAME -e "
SELECT 'bag_type分布' as info, bag_type, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status='publish' GROUP BY bag_type;
"

echo ""
echo "🔧 执行数据修复..."

# 执行修复SQL
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS $DB_NAME < scripts/fix-database-direct.sql

echo ""
echo "✅ 数据库修复完成！"
echo ""
echo "🧪 验证修复结果..."

# 测试API
sleep 2
curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.data.filterOptions.shapes[] | {id, name_en, image_url}' 2>/dev/null || echo "请手动测试API"

echo ""
echo "�� 修复完成！请刷新浏览器测试筛选功能" 