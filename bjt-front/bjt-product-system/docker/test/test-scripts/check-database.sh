#!/bin/bash

# 检查数据库和测试数据脚本

set -e

DB_HOST="mysql-test"
DB_USER="wordpress"
DB_PASS="bjt_test_password123"
DB_NAME="bjt_test"

echo "🔍 检查数据库连接..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SELECT 1" $DB_NAME

echo "🔍 检查关键表是否存在..."
TABLES=("wp_bjt_relations" "wp_bjt_parts" "wp_bjt_accessories" "wp_bjt_spare_parts")
for table in "${TABLES[@]}"; do
  count=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -se "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table'" $DB_NAME)
  if [ "$count" -eq 1 ]; then
    echo "✅ 表 $table 存在"
  else
    echo "❌ 表 $table 不存在"
    exit 1
  fi
done

echo "🔍 检查真实测试数据..."
# 检查主机数据
host_count=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -se "SELECT COUNT(*) FROM wp_bjt_relations WHERE host_part_number='60A01143'" $DB_NAME)
echo "📊 主机 60A01143 的关系记录数: $host_count"

test_host_count=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -se "SELECT COUNT(*) FROM wp_bjt_relations WHERE host_part_number='TEST001'" $DB_NAME)
echo "📊 测试主机 TEST001 的关系记录数: $test_host_count"

# 检查层级分布
echo "🔍 检查层级分布..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "
SELECT 
  level,
  COUNT(*) as count,
  host_part_number
FROM wp_bjt_relations 
WHERE host_part_number IN ('60A01143', 'TEST001', 'TEST002')
GROUP BY level, host_part_number 
ORDER BY host_part_number, level
" $DB_NAME

# 检查数据质量问题
echo "🔍 检查数据质量问题..."
orphan_count=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -se "
SELECT COUNT(*) FROM wp_bjt_relations r1 
WHERE r1.parent_part_number IS NOT NULL 
AND r1.parent_part_number != r1.host_part_number
AND NOT EXISTS (
  SELECT 1 FROM wp_bjt_relations r2 
  WHERE r2.child_part_number = r1.parent_part_number 
  AND r2.host_part_number = r1.host_part_number
)
" $DB_NAME)
echo "⚠️  孤儿关系数量: $orphan_count"

duplicate_count=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -se "
SELECT COUNT(*) - COUNT(DISTINCT CONCAT(host_part_number, '-', IFNULL(parent_part_number, 'NULL'), '-', part_number, '-', child_part_number)) as duplicates
FROM wp_bjt_relations
" $DB_NAME)
echo "⚠️  重复关系数量: $duplicate_count"

echo "✅ 数据库检查完成" 