#!/bin/bash

# 耗材筛选项数据统计脚本
# 生成各个筛选维度的详细数据分布报告

echo "📊 耗材筛选项数据统计报告"
echo "================================"
echo "生成时间: $(date)"
echo ""

# 基础统计
echo "📋 基础数据统计"
echo "--------------------------------"
TOTAL_CONSUMABLES=$(docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status='publish';" -s)
echo "总耗材数量: $TOTAL_CONSUMABLES"
echo ""

# 1. 形状分布统计
echo "🔸 形状(bag_type)分布统计"
echo "--------------------------------"
docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "
SELECT 
    CONCAT('  ', bag_type, ' (', COUNT(*), '条)') as '形状分布'
FROM wp_bjt_consumables 
WHERE status='publish' AND bag_type IS NOT NULL AND bag_type != '' 
GROUP BY bag_type 
ORDER BY COUNT(*) DESC;
" -s
echo ""

# 2. 材质分布统计
echo "🔸 材质(material)分布统计"
echo "--------------------------------"
docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "
SELECT 
    CONCAT('  ', material, ' (', COUNT(*), '条)') as '材质分布'
FROM wp_bjt_consumables 
WHERE status='publish' AND material IS NOT NULL AND material != '' 
GROUP BY material 
ORDER BY COUNT(*) DESC;
" -s
echo ""

# 3. 机型分布统计（原始数据）
echo "🔸 机型(app_model)原始分布统计"
echo "--------------------------------"
docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "
SELECT 
    CONCAT('  \"', app_model, '\" (', COUNT(*), '条)') as '机型原始分布'
FROM wp_bjt_consumables 
WHERE status='publish' AND app_model IS NOT NULL AND app_model != '' 
GROUP BY app_model 
ORDER BY COUNT(*) DESC;
" -s
echo ""

# 4. API筛选测试
echo "🔸 API筛选功能测试"
echo "--------------------------------"

# 测试各个机型的筛选结果
echo "机型筛选测试结果:"
for model in "LA-E4C" "LA-E4S V2.0" "LA-F2" "LA-E5P" "LA-E4S(paper)"; do
    encoded_model=$(echo "$model" | sed 's/ /%20/g')
    count=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?app_model=$encoded_model&limit=1" | jq -r '.data.total // 0')
    echo "  $model: $count 条"
done
echo ""

# 测试材质筛选
echo "材质筛选测试结果:"
for material in "HDPE" "50% HDPE" "PAPE" "LDPE" "PAPER" "30% HDPE" "50% LDPE"; do
    # 正确的URL编码：空格转换为%20，%转换为%25
    encoded_material=$(echo "$material" | sed 's/ /%20/g' | sed 's/%/%25/g')
    count=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?material=$encoded_material&limit=1" | jq -r '.data.total // 0')
    echo "  $material: $count 条"
done
echo ""

# 测试形状筛选
echo "形状筛选测试结果:"
for shape in "Bubble" "Pillow" "Tube" "Precut Air Pillow" "paper Bubble" "paper air Pillow"; do
    encoded_shape=$(echo "$shape" | sed 's/ /%20/g')
    count=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?bag_type=$encoded_shape&limit=1" | jq -r '.data.total // 0')
    echo "  $shape: $count 条"
done
echo ""

# 5. 筛选项完整性验证
echo "🔸 筛选项完整性验证"
echo "--------------------------------"
API_RESPONSE=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1")

SHAPES_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.shapes | length')
MATERIALS_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.materials | length')
MODELS_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.models | length')
THICKNESS_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.thicknesses | length')
WIDTH_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.widths | length')
LENGTH_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.lengths | length')

echo "API返回的筛选项数量:"
echo "  形状选项: $SHAPES_COUNT 个"
echo "  材质选项: $MATERIALS_COUNT 个"
echo "  机型选项: $MODELS_COUNT 个"
echo "  厚度选项: $THICKNESS_COUNT 个"
echo "  膜宽选项: $WIDTH_COUNT 个"
echo "  袋长选项: $LENGTH_COUNT 个"
echo ""

# 6. 数据质量检查
echo "🔸 数据质量检查"
echo "--------------------------------"

# 检查缺失关键字段的记录
MISSING_APP_MODEL=$(docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status='publish' AND (app_model IS NULL OR app_model = '');" -s)
MISSING_BAG_TYPE=$(docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status='publish' AND (bag_type IS NULL OR bag_type = '');" -s)
MISSING_MATERIAL=$(docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status='publish' AND (material IS NULL OR material = '');" -s)

echo "数据完整性检查:"
echo "  缺少app_model字段的记录: $MISSING_APP_MODEL 条"
echo "  缺少bag_type字段的记录: $MISSING_BAG_TYPE 条"
echo "  缺少material字段的记录: $MISSING_MATERIAL 条"
echo ""

# 7. 推荐优化建议
echo "🔸 优化建议"
echo "--------------------------------"

if [ "$MISSING_APP_MODEL" -gt 0 ]; then
    echo "⚠️  建议补充 $MISSING_APP_MODEL 条记录的app_model字段"
fi

if [ "$MISSING_BAG_TYPE" -gt 0 ]; then
    echo "⚠️  建议补充 $MISSING_BAG_TYPE 条记录的bag_type字段"
fi

if [ "$MISSING_MATERIAL" -gt 0 ]; then
    echo "⚠️  建议补充 $MISSING_MATERIAL 条记录的material字段"
fi

# 检查筛选覆盖率
TOTAL_MODELS_IN_DB=$(docker exec dev-mysql-1 mysql -u root -proot bjt_product -e "SELECT COUNT(DISTINCT app_model) FROM wp_bjt_consumables WHERE status='publish' AND app_model IS NOT NULL AND app_model != '';" -s)
if [ "$MODELS_COUNT" -ne "$TOTAL_MODELS_IN_DB" ]; then
    echo "⚠️  机型筛选项可能不完整: API返回$MODELS_COUNT个，数据库有$TOTAL_MODELS_IN_DB个不同的组合"
fi

echo ""
echo "✅ 统计报告生成完成"
echo "================================" 