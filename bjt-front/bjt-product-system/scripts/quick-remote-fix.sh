#!/bin/bash

# =============================================================================
# 快速远程数据库修复脚本
# 适用于已知Docker环境的快速执行
# =============================================================================

set -e

# 配置（请根据实际环境修改）
CONTAINER_NAME="dev-mysql-1"    # MySQL容器名
DB_USER="root"                  # 数据库用户
DB_PASS="root"                  # 数据库密码
DB_NAME="bjt_product"           # 数据库名

echo "🚀 开始快速远程数据库修复..."
echo "📋 目标：修复耗材筛选功能数据格式"

# 1. 检查Docker环境
echo "1️⃣ 检查Docker环境..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ 容器 $CONTAINER_NAME 未运行"
    echo "当前运行的容器："
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi
echo "✅ 找到MySQL容器: $CONTAINER_NAME"

# 2. 测试数据库连接
echo "2️⃣ 测试数据库连接..."
if ! docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &> /dev/null; then
    echo "❌ 数据库连接失败，请检查用户名密码"
    exit 1
fi
echo "✅ 数据库连接成功"

# 3. 检查当前数据
echo "3️⃣ 检查当前数据状态..."
TOTAL_COUNT=$(docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -se "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish';")
echo "📊 当前发布状态的耗材数量: $TOTAL_COUNT"

echo "📊 当前bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

# 4. 用户确认
echo ""
echo "⚠️  即将修改数据库，将内部代码转换为前端期望格式："
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

# 5. 创建备份
echo "4️⃣ 创建数据备份..."
BACKUP_FILE="/tmp/consumables_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$CONTAINER_NAME" mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" wp_bjt_consumables > "$BACKUP_FILE"
echo "✅ 备份完成: $BACKUP_FILE"

# 6. 执行修复SQL（直接在脚本中定义，避免文件依赖）
echo "5️⃣ 执行数据库修复..."

# 创建临时SQL文件
cat > /tmp/quick_fix.sql << 'EOF'
-- 创建备份表
CREATE TABLE wp_bjt_consumables_backup_quick AS 
SELECT * FROM wp_bjt_consumables WHERE status = 'publish';

-- 修复bag_type字段：从代码格式转换为描述格式
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

-- 标准化material字段
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

-- 清理app_model格式
UPDATE wp_bjt_consumables 
SET app_model = TRIM(REPLACE(REPLACE(REPLACE(app_model, '"', ''), '''', ''), '  ', ' '))
WHERE status = 'publish' AND app_model IS NOT NULL;
EOF

# 将SQL文件复制到容器并执行
docker cp /tmp/quick_fix.sql "$CONTAINER_NAME:/tmp/quick_fix.sql"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "source /tmp/quick_fix.sql"

# 清理临时文件
rm -f /tmp/quick_fix.sql
docker exec "$CONTAINER_NAME" rm -f /tmp/quick_fix.sql

echo "✅ 数据库修复执行完成"

# 7. 验证修复结果
echo "6️⃣ 验证修复结果..."
echo "📊 修复后bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

echo "📊 修复后material分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT material, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;"

# 8. 最终总结
echo ""
echo "🎉 快速远程数据库修复完成！"
echo "📁 备份文件: $BACKUP_FILE"
echo "🔧 修复内容: 将内部代码转换为前端期望的描述格式"
echo ""
echo "🔙 如需回滚，请执行:"
echo "docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASS -D$DB_NAME -e \"DROP TABLE wp_bjt_consumables; RENAME TABLE wp_bjt_consumables_backup_quick TO wp_bjt_consumables;\""
echo ""
echo "✅ 现在前端的筛选功能应该能正常工作了！" 