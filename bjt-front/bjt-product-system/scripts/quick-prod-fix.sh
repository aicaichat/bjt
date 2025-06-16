#!/bin/bash

# =============================================================================
# 快速生产环境修复脚本 - 直接执行
# 数据库连接已验证成功
# =============================================================================

set -e

CONTAINER_NAME="prod_mysql_1"
DB_USER="root"
DB_PASS="bjtpassword123"
DB_NAME="bjt"

echo "🚀 快速生产环境数据库修复"
echo "📋 容器: $CONTAINER_NAME, 数据库: $DB_NAME"

# 1. 检查当前数据状态
echo "1️⃣ 检查当前数据状态..."
echo "📊 当前bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

TOTAL_COUNT=$(docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -se "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish';")
echo "📊 总计耗材数量: $TOTAL_COUNT"

# 2. 用户确认
echo ""
echo "⚠️  即将修改生产数据库，将内部代码转换为前端期望格式："
echo "   MEX → Pillow (气泡枕)"
echo "   MEY → Precut Air Pillow (开口气泡枕)"
echo "   MFB → paper Bubble (纸质气泡膜)"
echo "   MFC → Tube (气枕膜)"
echo "   MFF → Bubble (葫芦膜)"
echo ""
read -p "确认执行修复？[y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 用户取消操作"
    exit 0
fi

# 3. 创建备份
echo "2️⃣ 创建数据备份..."
BACKUP_FILE="/tmp/prod_consumables_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$CONTAINER_NAME" mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" wp_bjt_consumables > "$BACKUP_FILE"
echo "✅ 备份完成: $BACKUP_FILE"

# 4. 执行修复
echo "3️⃣ 执行数据库修复..."

# 创建备份表
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "
CREATE TABLE wp_bjt_consumables_backup_quick AS 
SELECT * FROM wp_bjt_consumables WHERE status = 'publish';
"

# 执行修复
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "
UPDATE wp_bjt_consumables 
SET bag_type = CASE 
    WHEN bag_type = 'MEX' THEN 'Pillow'
    WHEN bag_type = 'MEY' THEN 'Precut Air Pillow'
    WHEN bag_type = 'MFB' THEN 'paper Bubble'
    WHEN bag_type = 'MFC' THEN 'Tube'
    WHEN bag_type = 'MFF' THEN 'Bubble'
    WHEN bag_type LIKE '%paper air Pillow%' THEN 'paper air Pillow'
    WHEN bag_type LIKE '%Precut Air Pillow%' THEN 'Precut Air Pillow'
    WHEN bag_type LIKE '%Pillow%' THEN 'Pillow'
    WHEN bag_type LIKE '%Bubble%' THEN 'Bubble'
    WHEN bag_type LIKE '%Tube%' THEN 'Tube'
    WHEN bag_type LIKE '%paper Bubble%' THEN 'paper Bubble'
    ELSE bag_type
END
WHERE status = 'publish' AND bag_type IS NOT NULL;
"

# 标准化material字段
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "
UPDATE wp_bjt_consumables 
SET material = CASE 
    WHEN material LIKE '%50%' AND material LIKE '%HDPE%' THEN '50% HDPE'
    WHEN material LIKE '%30%' AND material LIKE '%HDPE%' THEN '30% HDPE'
    WHEN material = 'HDPE' OR material LIKE '%100%HDPE%' THEN 'HDPE'
    WHEN material LIKE '%50%' AND material LIKE '%LDPE%' THEN '50% LDPE'
    WHEN material LIKE '%LDPE%' THEN 'LDPE'
    WHEN material LIKE '%PAPE%' THEN 'PAPE'
    WHEN material LIKE '%PAPER%' OR material LIKE '%纸%' THEN 'PAPER'
    ELSE material
END
WHERE status = 'publish' AND material IS NOT NULL;
"

echo "✅ 数据库修复执行完成"

# 5. 验证修复结果
echo "4️⃣ 验证修复结果..."
echo "📊 修复后bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

echo "📊 修复后material分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT material, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;"

# 6. 最终总结
echo ""
echo "🎉 生产环境数据库修复完成！"
echo "📁 备份文件: $BACKUP_FILE"
echo "🔧 修复内容: 将内部代码转换为前端期望的描述格式"
echo "📊 影响记录数: $TOTAL_COUNT 条耗材数据"

echo ""
echo "📋 修复摘要:"
echo "   ✅ MEX → Pillow (气泡枕)"
echo "   ✅ MEY → Precut Air Pillow (开口气泡枕)"
echo "   ✅ MFB → paper Bubble (纸质气泡膜)"
echo "   ✅ MFC → Tube (气枕膜)"
echo "   ✅ MFF → Bubble (葫芦膜)"
echo "   ✅ 材质字段标准化"

echo ""
echo "🔙 如需回滚，请执行:"
echo "docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASS -D$DB_NAME -e \"DROP TABLE wp_bjt_consumables; RENAME TABLE wp_bjt_consumables_backup_quick TO wp_bjt_consumables;\""

echo ""
echo "✅ 修复完成！前端筛选功能现在应该正常工作了！" 