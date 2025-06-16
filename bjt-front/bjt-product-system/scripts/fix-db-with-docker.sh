#!/bin/bash

# 使用Docker执行数据库修复

echo "🔧 使用Docker修复数据库数据..."

# 检查Docker容器
if ! docker ps | grep -q "dev-wordpress-1"; then
    echo "❌ WordPress容器未运行，启动服务..."
    docker-compose -f docker/dev/docker-compose.nginx.yml up -d
    sleep 15
fi

echo "📊 修复前数据统计..."
docker exec dev-wordpress-1 mysql -uroot -pbjt123456 bjt_product_system -e "
SELECT 'bag_type分布' as info, bag_type, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status='publish' GROUP BY bag_type;
"

echo ""
echo "🔧 执行数据修复..."

# 将SQL文件复制到容器中并执行
docker cp scripts/fix-database-direct.sql dev-wordpress-1:/tmp/fix.sql
docker exec dev-wordpress-1 mysql -uroot -pbjt123456 bjt_product_system -e "source /tmp/fix.sql"

echo ""
echo "✅ 数据库修复完成！"

echo ""
echo "🧪 验证修复结果..."
sleep 2
curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.data.filterOptions.shapes[] | {id, name_en, image_url}' 2>/dev/null || echo "请手动测试API"

echo ""
echo "�� 修复完成！请刷新浏览器测试筛选功能" 