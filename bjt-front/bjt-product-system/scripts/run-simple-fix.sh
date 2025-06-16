#!/bin/bash

# 只修复 wp_bjt_consumables 表数据

echo "🔧 只修复 wp_bjt_consumables 表的数据..."

# 数据库连接信息
DB_HOST="localhost"
DB_PORT="3306" 
DB_NAME="bjt_product_system"
DB_USER="root"
DB_PASS="bjt123456"

echo "📊 开始修复..."

# 执行修复SQL
mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS $DB_NAME < scripts/fix-consumables-table-only.sql

echo ""
echo "✅ wp_bjt_consumables 表修复完成！"
echo ""
echo "🧪 测试API..."
sleep 2
curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > /dev/null && echo "✅ API正常" || echo "⚠️ 请检查API"

echo ""
echo "�� 修复完成！请刷新浏览器测试筛选功能" 