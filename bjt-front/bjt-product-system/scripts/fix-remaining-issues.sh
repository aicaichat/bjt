#!/bin/bash
# 修复剩余的数据问题

echo "=== 修复剩余数据问题 ==="
echo ""

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_ROOT" || exit 1

echo "步骤 1: 检查当前数据状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='bjt' AND table_name='wp_bjt_product_lines') THEN '✅ 存在'
        ELSE '❌ 不存在'
    END as '产品线表',
    COALESCE((SELECT COUNT(*) FROM wp_bjt_product_lines), 0) as '产品线数据',
    COALESCE((SELECT COUNT(*) FROM wp_bjt_machines), 0) as '主机数据',
    COALESCE((SELECT COUNT(*) FROM wp_bjt_consumables), 0) as '耗材数据',
    COALESCE((SELECT COUNT(*) FROM wp_bjt_accessories), 0) as '配件数据';
" 2>&1

echo ""
echo ""
echo "步骤 2: 检查备份文件中的产品线和主机数据..."
echo "----------------------------"
BACKUP_SQL="/var/bjt/backups/recovery-20251015_135529/database-backup.sql"

echo "产品线表的INSERT语句:"
grep -c "INSERT INTO.*wp_bjt_product_lines" "$BACKUP_SQL" || echo "0 条"

echo "主机表的INSERT语句:"
grep -c "INSERT INTO.*wp_bjt_machines" "$BACKUP_SQL" || echo "0 条"

echo ""
echo "备份文件中实际包含的表:"
grep "CREATE TABLE" "$BACKUP_SQL" | sed 's/CREATE TABLE /  - /'

echo ""
echo ""
echo "步骤 3: 直接查询当前所有表..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;
SELECT 
    table_name as 表名,
    table_rows as 数据行数
FROM information_schema.tables 
WHERE table_schema = 'bjt' 
  AND table_name LIKE 'wp_bjt%'
ORDER BY table_name;
" 2>&1

echo ""
echo ""
echo "步骤 4: 测试 API 端点..."
echo "----------------------------"

echo "4.1) 产品线 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/product-lines/" | jq '.data | length, .[0].name_zh?' 2>/dev/null

echo ""
echo "4.2) 主机 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/machines/?per_page=5" | jq '.data | length' 2>/dev/null

echo ""
echo "4.3) 耗材 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/consumables/?per_page=5" | jq '.data | length, .[0].name_zh?' 2>/dev/null

echo ""
echo "4.4) 配件 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/accessories/?per_page=5" | jq '.data | length, .[0].name_zh?' 2>/dev/null

echo ""
echo ""
echo "步骤 5: 分析备份内容..."
echo "----------------------------"

echo "检查备份是否包含产品线数据:"
if grep -q "INSERT INTO.*wp_bjt_product_lines" "$BACKUP_SQL"; then
    echo "✅ 备份包含产品线数据"
    echo "具体内容:"
    grep "INSERT INTO.*wp_bjt_product_lines" "$BACKUP_SQL" | head -3
else
    echo "❌ 备份不包含产品线INSERT语句"
    echo ""
    echo "备份可能只包含表结构，没有数据"
fi

echo ""
echo "检查备份是否包含主机数据:"
if grep -q "INSERT INTO.*wp_bjt_machines" "$BACKUP_SQL"; then
    echo "✅ 备份包含主机数据"
else
    echo "❌ 备份不包含主机INSERT语句"
fi

echo ""
echo ""
echo "=== 分析完成 ==="
echo ""

echo "💡 总结:"
echo "----------------------------"
echo "当前已恢复的数据:"
echo "  ✅ 耗材: 48 条"
echo "  ✅ 配件: 应该有数据（需要验证）"
echo "  ❌ 产品线: 0 条"
echo "  ❌ 主机: 0 条"
echo ""

echo "可能的原因:"
echo "1. 备份文件创建时，产品线和主机表为空"
echo "2. 需要从其他来源恢复产品线和主机数据"
echo "3. 或者这些数据需要在后台管理界面手动创建"
echo ""

echo "建议操作:"
echo "1. 登录后台管理界面，查看是否可以创建产品线"
echo "2. 检查是否有更完整的备份"
echo "3. 或者重新导入原始业务数据"






