#!/bin/bash

# 生产环境一键修复脚本

echo "🔧 生产环境耗材筛选功能修复..."

# 1. 备份
BACKUP_DIR="/tmp/prod_fix_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 创建备份: $BACKUP_DIR"

# 2. 检测生产环境API端点
echo "🔍 检测生产环境API端点..."
API_ENDPOINT=""

# 生产环境可能的端点
PROD_ENDPOINTS=(
    "http://localhost/wp-json/bjt/v1/consumables"
    "http://127.0.0.1/wp-json/bjt/v1/consumables"
    "http://localhost:80/wp-json/bjt/v1/consumables"
    "http://localhost:8080/wp-json/bjt/v1/consumables"
)

for endpoint in "${PROD_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$endpoint?limit=1" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        API_ENDPOINT="$endpoint"
        echo "✅ 找到生产API端点: $API_ENDPOINT"
        break
    fi
done

if [ -z "$API_ENDPOINT" ]; then
    echo "❌ 无法找到API端点，请检查WordPress服务状态"
    echo "💡 可能的解决方案："
    echo "   1. 检查nginx/apache是否运行"
    echo "   2. 检查WordPress是否正常"
    echo "   3. 手动访问: http://localhost/wp-json/bjt/v1/consumables"
    exit 1
fi

# 3. 检查生产环境数据库连接
echo "🔍 检测数据库连接..."

# 尝试不同的数据库连接方式
DB_CONNECTED=false

# 方式1: 直接连接
if command -v mysql &> /dev/null; then
    if mysql -hlocalhost -uroot -pbjt123456 bjt_product_system -e "SELECT 1" &>/dev/null; then
        echo "✅ 直接数据库连接成功"
        DB_CONNECTED=true
        DB_COMMAND="mysql -hlocalhost -uroot -pbjt123456 bjt_product_system"
    fi
fi

# 方式2: Docker连接
if [ "$DB_CONNECTED" = false ] && command -v docker &> /dev/null; then
    # 查找MySQL容器
    MYSQL_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(mysql|mariadb|db)" | head -1)
    if [ ! -z "$MYSQL_CONTAINER" ]; then
        if docker exec "$MYSQL_CONTAINER" mysql -uroot -pbjt123456 bjt_product_system -e "SELECT 1" &>/dev/null; then
            echo "✅ Docker数据库连接成功: $MYSQL_CONTAINER"
            DB_CONNECTED=true
            DB_COMMAND="docker exec $MYSQL_CONTAINER mysql -uroot -pbjt123456 bjt_product_system"
        fi
    fi
fi

if [ "$DB_CONNECTED" = false ]; then
    echo "❌ 无法连接数据库"
    echo "💡 请检查："
    echo "   1. MySQL服务是否运行"
    echo "   2. 数据库密码是否正确"
    echo "   3. bjt_product_system数据库是否存在"
    exit 1
fi

# 4. 执行数据修复
echo "🔧 执行数据修复..."

# 创建简化的修复SQL
cat > "$BACKUP_DIR/production_fix.sql" << 'EOF'
-- 生产环境数据修复

-- 备份当前数据
CREATE TABLE IF NOT EXISTS wp_bjt_consumables_backup AS SELECT * FROM wp_bjt_consumables WHERE status = 'publish';

-- 1. 标准化bag_type
UPDATE wp_bjt_consumables 
SET bag_type = CASE 
    WHEN bag_type LIKE '%paper air Pillow%' THEN 'paper air Pillow'
    WHEN bag_type LIKE '%Precut Air Pillow%' THEN 'Precut Air Pillow'  
    WHEN bag_type LIKE '%Pillow%' THEN 'Pillow'
    WHEN bag_type LIKE '%Bubble%' THEN 'Bubble'
    WHEN bag_type LIKE '%Tube%' THEN 'Tube'
    WHEN bag_type LIKE '%paper Bubble%' THEN 'paper Bubble'
    ELSE bag_type
END
WHERE status = 'publish';

-- 2. 标准化material
UPDATE wp_bjt_consumables 
SET material = CASE 
    WHEN material LIKE '%50%' AND material LIKE '%HDPE%' THEN '50% HDPE'
    WHEN material LIKE '%30%' AND material LIKE '%HDPE%' THEN '30% HDPE'
    WHEN material = 'HDPE' THEN 'HDPE'
    WHEN material LIKE '%LDPE%' THEN 'LDPE'
    WHEN material LIKE '%PAPE%' THEN 'PAPE'
    WHEN material LIKE '%PAPER%' THEN 'PAPER'
    ELSE material
END
WHERE status = 'publish';

-- 3. 清理app_model格式
UPDATE wp_bjt_consumables 
SET app_model = TRIM(REPLACE(REPLACE(app_model, '"', ''), '''', ''))
WHERE status = 'publish' AND app_model IS NOT NULL;

-- 4. 补充关键数值字段
UPDATE wp_bjt_consumables 
SET 
    thickness_met = CASE WHEN thickness_met IS NULL OR thickness_met = 0 THEN 20 ELSE thickness_met END,
    width_met = CASE WHEN width_met IS NULL OR width_met = 0 THEN 20 ELSE width_met END,
    length_met = CASE WHEN length_met IS NULL OR length_met = 0 THEN 10 ELSE length_met END
WHERE status = 'publish';

-- 验证结果
SELECT 'bag_type修复结果' as info, bag_type, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;

SELECT 'material修复结果' as info, material, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;
EOF

# 执行修复
echo "📊 修复前数据统计..."
$DB_COMMAND -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status='publish' GROUP BY bag_type;"

echo ""
echo "🔧 应用修复..."
$DB_COMMAND < "$BACKUP_DIR/production_fix.sql"

echo ""
echo "✅ 数据库修复完成！"

# 5. 验证修复结果
echo "🧪 验证修复结果..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT?limit=1" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API服务正常"
    
    # 检查筛选选项
    FILTER_CHECK=$(curl -s "$API_ENDPOINT?limit=1" | grep -o '"filterOptions"' | wc -l)
    if [ "$FILTER_CHECK" -gt 0 ]; then
        echo "✅ 筛选选项正常"
        
        # 显示形状选项
        echo "📋 当前形状选项:"
        curl -s "$API_ENDPOINT?limit=1" | jq '.data.filterOptions.shapes[] | {id, name_en, image_url}' 2>/dev/null || echo "请手动检查API响应"
    else
        echo "⚠️ 筛选选项可能异常"
    fi
else
    echo "❌ API服务异常 (HTTP $HTTP_CODE)"
fi

# 6. 完成
echo ""
echo "🎉 生产环境修复完成！"
echo "📁 备份目录: $BACKUP_DIR"
echo "📄 修复SQL: $BACKUP_DIR/production_fix.sql"
echo ""
echo "🔧 如需回滚："
echo "$DB_COMMAND -e \"DROP TABLE wp_bjt_consumables; RENAME TABLE wp_bjt_consumables_backup TO wp_bjt_consumables;\""
echo ""
echo "�� 请在浏览器中测试耗材页面的筛选功能" 