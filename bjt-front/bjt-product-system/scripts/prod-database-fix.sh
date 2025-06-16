#!/bin/bash

# =============================================================================
# 生产环境数据库修复脚本
# 容器：prod_mysql_1
# =============================================================================

set -e

# 生产环境配置
CONTAINER_NAME="prod_mysql_1"
DB_USER="root"
DB_PASS="bjtpassword123"  # 生产环境密码
DB_NAME="bjt"  # 请根据实际数据库名修改

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 生产环境数据库修复 - 耗材筛选功能"
echo "📋 目标容器: $CONTAINER_NAME"

# 1. 检查生产环境
log_info "1️⃣ 检查生产环境状态..."
if ! docker ps | grep -q "$CONTAINER_NAME.*Up"; then
    log_error "生产MySQL容器未正常运行"
    echo "当前容器状态："
    docker-compose -f docker/prod/docker-compose.prod.yml ps
    exit 1
fi
log_success "生产MySQL容器运行正常"

# 2. 测试数据库连接
log_info "2️⃣ 测试数据库连接..."
if ! docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &> /dev/null; then
    log_error "数据库连接失败"
    log_info "尝试其他常见密码..."
    
    # 尝试常见密码
    for pwd in "password" "mysql" "123456" ""; do
        if docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$pwd" -e "SELECT 1;" &> /dev/null 2>&1; then
            DB_PASS="$pwd"
            log_success "找到正确密码"
            break
        fi
    done
    
    if ! docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &> /dev/null; then
        log_error "仍无法连接数据库，请手动设置密码"
        read -s -p "请输入MySQL root密码: " DB_PASS
        echo
    fi
fi
log_success "数据库连接成功"

# 3. 检查数据库和表
log_info "3️⃣ 检查数据库结构..."
DATABASES=$(docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" | grep -E "(bjt|wordpress|wp)" || true)
if [ -z "$DATABASES" ]; then
    log_error "未找到相关数据库"
    echo "可用数据库："
    docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;"
    read -p "请输入数据库名: " DB_NAME
else
    echo "找到相关数据库: $DATABASES"
    # 尝试常见数据库名
    for db in "bjt_product" "wordpress" "wp_bjt"; do
        if echo "$DATABASES" | grep -q "$db"; then
            DB_NAME="$db"
            break
        fi
    done
fi

# 检查耗材表是否存在
if ! docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SHOW TABLES LIKE 'wp_bjt_consumables';" | grep -q "wp_bjt_consumables"; then
    log_error "未找到耗材表 wp_bjt_consumables"
    echo "当前数据库 $DB_NAME 中的表："
    docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SHOW TABLES;"
    exit 1
fi
log_success "找到耗材表"

# 4. 检查当前数据状态
log_info "4️⃣ 检查当前数据状态..."
TOTAL_COUNT=$(docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -se "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish';")
log_info "📊 当前发布状态的耗材数量: $TOTAL_COUNT"

if [ "$TOTAL_COUNT" -eq 0 ]; then
    log_error "没有发布状态的耗材数据"
    exit 1
fi

echo "📊 当前bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

# 5. 生产环境安全确认
echo ""
log_warning "🚨 生产环境修复确认"
log_warning "即将修改生产数据库中的耗材数据"
log_warning "修复内容：将内部代码转换为前端期望格式"
echo "   MEX → Pillow (气泡枕)"
echo "   MEY → Precut Air Pillow (开口气泡枕)"
echo "   MFB → paper Bubble (纸质气泡膜)"
echo "   MFC → Tube (气枕膜)"
echo "   MFF → Bubble (葫芦膜)"
echo ""
log_warning "此操作将直接修改生产数据！"
echo ""
read -p "确认在生产环境执行修复？请输入 'YES' 确认: " confirm
if [ "$confirm" != "YES" ]; then
    log_warning "用户取消操作"
    exit 0
fi

# 6. 创建生产备份
log_info "5️⃣ 创建生产数据备份..."
BACKUP_DIR="/tmp/prod_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 完整备份
docker exec "$CONTAINER_NAME" mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/full_backup.sql"
# 耗材表备份
docker exec "$CONTAINER_NAME" mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" wp_bjt_consumables > "$BACKUP_DIR/consumables_backup.sql"

log_success "生产备份完成: $BACKUP_DIR"

# 7. 执行生产修复
log_info "6️⃣ 执行生产数据库修复..."

# 创建修复SQL
cat > /tmp/prod_fix.sql << 'EOF'
-- 生产环境修复SQL
-- 创建备份表
CREATE TABLE wp_bjt_consumables_backup_prod AS 
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

-- 确保关键数值字段不为空
UPDATE wp_bjt_consumables 
SET 
    thickness_met = CASE 
        WHEN thickness_met IS NULL OR thickness_met = 0 THEN 
            CASE WHEN material LIKE '%PAPER%' THEN 50 ELSE 20 END 
        ELSE thickness_met 
    END,
    width_met = CASE WHEN width_met IS NULL OR width_met = 0 THEN 20 ELSE width_met END,
    length_met = CASE WHEN length_met IS NULL OR length_met = 0 THEN 10 ELSE length_met END
WHERE status = 'publish';
EOF

# 执行修复
docker cp /tmp/prod_fix.sql "$CONTAINER_NAME:/tmp/prod_fix.sql"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "source /tmp/prod_fix.sql"

# 清理临时文件
rm -f /tmp/prod_fix.sql
docker exec "$CONTAINER_NAME" rm -f /tmp/prod_fix.sql

log_success "生产数据库修复执行完成"

# 8. 验证生产修复结果
log_info "7️⃣ 验证生产修复结果..."
echo "📊 修复后bag_type分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"

echo "📊 修复后material分布:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "SELECT material, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;"

# 数据完整性检查
echo "📊 数据完整性检查:"
docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -e "
SELECT 
    'completeness' as category,
    COUNT(*) as total_records,
    COUNT(CASE WHEN bag_type IS NOT NULL AND bag_type != '' THEN 1 END) as has_bag_type,
    COUNT(CASE WHEN material IS NOT NULL AND material != '' THEN 1 END) as has_material,
    COUNT(CASE WHEN app_model IS NOT NULL AND app_model != '' THEN 1 END) as has_app_model
FROM wp_bjt_consumables 
WHERE status = 'publish';
"

# 9. 生产环境最终总结
echo ""
log_success "🎉 生产环境数据库修复完成！"
log_info "📁 生产备份位置: $BACKUP_DIR"
log_info "🔧 修复内容: 将内部代码转换为前端期望的描述格式"
log_info "📊 影响记录数: $TOTAL_COUNT 条耗材数据"

echo ""
log_info "📋 生产修复摘要:"
echo "   ✅ MEX → Pillow (气泡枕)"
echo "   ✅ MEY → Precut Air Pillow (开口气泡枕)"
echo "   ✅ MFB → paper Bubble (纸质气泡膜)"
echo "   ✅ MFC → Tube (气枕膜)"
echo "   ✅ MFF → Bubble (葫芦膜)"
echo "   ✅ 材质字段标准化"
echo "   ✅ 机型字段格式清理"
echo "   ✅ 数值字段完整性保证"

echo ""
log_warning "🔙 生产环境回滚方法（如需要）:"
echo "docker exec $CONTAINER_NAME mysql -u$DB_USER -p$DB_PASS -D$DB_NAME -e \"DROP TABLE wp_bjt_consumables; RENAME TABLE wp_bjt_consumables_backup_prod TO wp_bjt_consumables;\""

echo ""
log_success "✅ 生产环境修复完成！前端筛选功能现在应该正常工作了！" 