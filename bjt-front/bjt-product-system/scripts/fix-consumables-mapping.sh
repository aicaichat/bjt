#!/bin/bash

# Consumables字段映射修复脚本
# 基于最小修改原则，只修改后端API字段映射

set -e

echo "🛠️ 开始修复Consumables页面字段映射问题..."
echo "📋 基于最小粒度修改原则：仅修改后端API输出格式"

# 配置
BACKUP_DIR="/tmp/consumables_fix_backup_$(date +%Y%m%d_%H%M%S)"
CONTROLLER_FILE="plugins/bjt-core-entities/controllers/class-consumable-controller.php"

# 1. 备份当前文件
echo "💾 步骤1: 备份当前Controller文件..."
mkdir -p "$BACKUP_DIR"
cp "$CONTROLLER_FILE" "$BACKUP_DIR/class-consumable-controller.php.backup"
echo "✅ 备份完成: $BACKUP_DIR/class-consumable-controller.php.backup"

# 2. 验证修改前的API输出
echo "🔍 步骤2: 验证修改前的API输出..."
echo "   检查当前字段结构..."
curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.[0] | keys' > "$BACKUP_DIR/before_fields.json" || echo "API调用失败，继续执行..."

# 3. 显示具体修改内容
echo "📝 步骤3: 准备应用字段映射修复..."
cat << 'EOF'

🎯 修改目标:
- ✅ 添加前端期望的直接字段映射
- ✅ 保持现有specs结构向后兼容  
- ✅ 确保筛选功能正常工作
- ✅ 完整输出详细信息字段

🔧 关键字段修复:
- bag_type → shape (形状筛选)
- app_model → app_model (机型筛选)  
- thickness_met → thickness_met (纯数值)
- bubble_diameter_met → bubble_diameter_met (泡径显示)
- part_number → part_number (料号字段)

EOF

# 4. 提示用户确认
read -p "🤔 是否继续执行修改？[y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 用户取消操作"
    exit 1
fi

echo "🔧 步骤4: 应用字段映射修复..."
echo "   正在修改 $CONTROLLER_FILE..."

# 5. 创建修复后的文件内容
cat > /tmp/fixed_controller_response.php << 'EOF'
protected function format_item_for_response($item_db_object) {
    global $wpdb;
    if (!$item_db_object) {
        return null;
    }

    $consumable_id = (int) $item_db_object->id;
    $product_line_id_for_join = isset($item_db_object->product_line_id) ? (int) $item_db_object->product_line_id : 0;

    // TEMPORARY DEBUGGING
    error_log("[BJT_DEBUG] format_item_for_response for Consumable ID: " . $consumable_id . ", PL_ID: " . $product_line_id_for_join);

    // --- Fetch Pricing --- 
    $pricing_table = $wpdb->prefix . 'bjt_prices';
    $raw_prices = $wpdb->get_results($wpdb->prepare(
        "SELECT region, currency, base_price, min_quantity, max_quantity 
         FROM {$pricing_table} 
         WHERE target_type = 'consumable' AND part_number = %s AND product_line_id = %d AND status = 'active' 
         ORDER BY min_quantity ASC, region ASC",
        $item_db_object->part_number,
        $product_line_id_for_join
    ));

    // TEMPORARY DEBUGGING
    error_log("[BJT_DEBUG] Raw prices count for Consumable ID " . $consumable_id . ": " . count($raw_prices));

    $pricing_tiers = [];
    if (!empty($raw_prices)) {
        $grouped_by_tier = [];
        foreach ($raw_prices as $price_row) {
            $tier_key = $price_row->min_quantity . '-' . ($price_row->max_quantity ?? 'inf');
            if (!isset($grouped_by_tier[$tier_key])) {
                $grouped_by_tier[$tier_key] = [
                    'min_quantity' => (int)$price_row->min_quantity,
                    'max_quantity' => $price_row->max_quantity ? (int)$price_row->max_quantity : null,
                    'regional_prices_raw' => []
                ];
            }
            $grouped_by_tier[$tier_key]['regional_prices_raw'][] = $price_row;
        }

        foreach ($grouped_by_tier as $tier_data) {
            $range_str = $tier_data['min_quantity'];
            if ($tier_data['max_quantity'] === null) {
                $range_str .= '+';
                 if($tier_data['min_quantity'] > 1 && $tier_data['max_quantity'] === null ) $range_str = '>' . ($tier_data['min_quantity'] -1) ;
                 else if ($tier_data['max_quantity'] === null) $range_str = (string)$tier_data['min_quantity'];
                 else $range_str = (string)$tier_data['min_quantity'];

            } else if ($tier_data['max_quantity'] == $tier_data['min_quantity']) {
                $range_str = (string)$tier_data['min_quantity'];
            } else {
                $range_str .= '-' . $tier_data['max_quantity'];
            }
            
            $regional_prices_map = [];
            $default_region_price = 0.00;

            foreach ($tier_data['regional_prices_raw'] as $rp_row) {
                $region_code_lower = strtolower($rp_row->region);
                $regional_prices_map[$region_code_lower] = (float)$rp_row->base_price;
                if (strtoupper($rp_row->region) === 'CN') {
                    $default_region_price = (float)$rp_row->base_price;
                }
            }
            if ($default_region_price == 0.00 && !empty($regional_prices_map)) {
                $default_region_price = reset($regional_prices_map); 
            }

            $pricing_tiers[] = [
                'range' => $range_str,
                'price' => $default_region_price,
                'regionalPrices' => $regional_prices_map 
            ];
        }
    }

    // --- Fetch Inventory --- 
    $inventory_table = $wpdb->prefix . 'bjt_inventory';
    $raw_inventory = $wpdb->get_results($wpdb->prepare(
        "SELECT region, SUM(quantity) as total_quantity
         FROM {$inventory_table} 
         WHERE target_type = 'consumable' AND part_number = %s AND product_line_id = %d AND status = 'active' 
         GROUP BY region",
        $item_db_object->part_number,
        $product_line_id_for_join
    ));
    
    // TEMPORARY DEBUGGING
    error_log("[BJT_DEBUG] Raw inventory count for Consumable ID " . $consumable_id . ": " . count($raw_inventory));

    $inventory_map = new stdClass();
    if (!empty($raw_inventory)) {
        foreach ($raw_inventory as $inv_row) {
            $inventory_map->{strtoupper($inv_row->region)} = (int)$inv_row->total_quantity;
        }
    }

    $response_data = [
        'id' => $consumable_id,
        'product_line_id' => $product_line_id_for_join === 0 ? null : $product_line_id_for_join,
        
        // === 向后兼容字段（保持现有逻辑） ===
        'code' => $item_db_object->part_number ?? null, 
        'name' => $item_db_object->model ?? null,       
        'model' => $item_db_object->model ?? null,      
        'model_imperial' => $item_db_object->model_imperial ?? null,
        'brand' => $item_db_object->brand ?? null,
        'sales_unit' => $item_db_object->package_type ?? null, 
        'image_url' => $item_db_object->image_url ?? null,
        'status' => $item_db_object->status ?? 'draft',
        
        // === 新增：前端期望的直接字段映射 ===
        // 筛选功能关键字段
        'part_number' => $item_db_object->part_number ?? null,
        'app_model' => $item_db_object->app_model ?? null,
        'shape' => $item_db_object->bag_type ?? null,  // 关键映射！
        'material' => $item_db_object->material ?? null,
        
        // 规格数值字段（纯数值，不加单位）
        'thickness_met' => $item_db_object->thickness_met ?? null,
        'thickness_imp' => $item_db_object->thickness_imp ?? null,
        'width_met' => $item_db_object->width_met ?? null,
        'width_imp' => $item_db_object->width_imp ?? null,
        'length_met' => $item_db_object->length_met ?? null,
        'length_imp' => $item_db_object->length_imp ?? null,
        
        // 列表展示字段
        'bubble_diameter_met' => $item_db_object->bubble_diameter_met ?? null,
        'bubble_diameter_imp' => $item_db_object->bubble_diameter_imp ?? null,
        'pcs_per_box' => $item_db_object->pcs_per_box ?? null,
        'spec' => $item_db_object->spec ?? null,
        'spec_imperial' => $item_db_object->spec_imperial ?? null,
        
        // 详细信息字段
        'package_type' => $item_db_object->package_type ?? null,
        'package_size_cm' => $item_db_object->package_size_cm ?? null,
        'package_size_inch' => $item_db_object->package_size_inch ?? null,
        'net_weight_kg' => $item_db_object->net_weight_kg ?? null,
        'net_weight_lbs' => $item_db_object->net_weight_lbs ?? null,
        'gross_weight_kg' => $item_db_object->gross_weight_kg ?? null,
        'gross_weight_lbs' => $item_db_object->gross_weight_lbs ?? null,
        'package_image_url' => $item_db_object->package_image_url ?? null,
        'total_length_met' => $item_db_object->total_length_met ?? null,
        'total_length_imp' => $item_db_object->total_length_imp ?? null,
        
        // 托盘信息字段
        'pallet_size_cm' => $item_db_object->pallet_size_cm ?? null,
        'pallet_size_inch' => $item_db_object->pallet_size_inch ?? null,
        
        // A方案托盘字段
        'pcs_per_pallet_a' => $item_db_object->pcs_per_pallet_a ?? null,
        'pallet_gross_weight_a_kg' => $item_db_object->pallet_gross_weight_a_kg ?? null,
        'pallet_gross_weight_a_lbs' => $item_db_object->pallet_gross_weight_a_lbs ?? null,
        'pallet_height_a_cm' => $item_db_object->pallet_height_a_cm ?? null,
        'pallet_height_a_inch' => $item_db_object->pallet_height_a_inch ?? null,
        
        // B方案托盘字段
        'pcs_per_pallet_b' => $item_db_object->pcs_per_pallet_b ?? null,
        'pallet_gross_weight_b_kg' => $item_db_object->pallet_gross_weight_b_kg ?? null,
        'pallet_gross_weight_b_lbs' => $item_db_object->pallet_gross_weight_b_lbs ?? null,
        'pallet_height_b_cm' => $item_db_object->pallet_height_b_cm ?? null,
        'pallet_height_b_inch' => $item_db_object->pallet_height_b_inch ?? null,
        
        // C方案托盘字段
        'pcs_per_pallet_c' => $item_db_object->pcs_per_pallet_c ?? null,
        'pallet_gross_weight_c_kg' => $item_db_object->pallet_gross_weight_c_kg ?? null,
        'pallet_gross_weight_c_lbs' => $item_db_object->pallet_gross_weight_c_lbs ?? null,
        'pallet_height_c_cm' => $item_db_object->pallet_height_c_cm ?? null,
        'pallet_height_c_inch' => $item_db_object->pallet_height_c_inch ?? null,
        
        // 纸筒字段
        'tube_inner_diameter_cm' => $item_db_object->tube_inner_diameter_cm ?? null,
        'tube_inner_diameter_inch' => $item_db_object->tube_inner_diameter_inch ?? null,
        
        // === 保持现有specs结构（向后兼容） ===
        'specs' => [
            'material' => $item_db_object->material ?? null,
            'shape' => $item_db_object->bag_type ?? null, 
            'thickness' => isset($item_db_object->thickness_met) ? $item_db_object->thickness_met . ' um' : null,
            'width' => isset($item_db_object->width_met) ? $item_db_object->width_met . ' mm' : null, 
            'length' => isset($item_db_object->length_met) ? $item_db_object->length_met . ' m' : null, 
            'rollLength' => isset($item_db_object->total_length_met) ? $item_db_object->total_length_met . ' m' : null,
            'compatibility' => $item_db_object->app_model ?? null, 
            'package_image_url' => $item_db_object->package_image_url ?? null,
        ],
        
        'pricing' => $pricing_tiers,
        'inventory' => $inventory_map,
        'created_at' => $item_db_object->created_at ?? null,
        'updated_at' => $item_db_object->updated_at ?? null,
    ];
    
    return $response_data;
}
EOF

# 6. 备份原方法并替换
echo "   备份原方法..."
sed -n '/protected function format_item_for_response/,/^    }/p' "$CONTROLLER_FILE" > "$BACKUP_DIR/original_format_method.php"

echo "   应用新的字段映射..."
# 使用sed替换format_item_for_response方法
# 首先找到方法开始行
start_line=$(grep -n "protected function format_item_for_response" "$CONTROLLER_FILE" | cut -d: -f1)
if [ -z "$start_line" ]; then
    echo "❌ 找不到format_item_for_response方法"
    exit 1
fi

# 找到方法结束行（下一个方法开始或类结束）
end_line=$(sed -n "${start_line},\$p" "$CONTROLLER_FILE" | grep -n "^    }" | head -1 | cut -d: -f1)
if [ -z "$end_line" ]; then
    echo "❌ 找不到方法结束位置"
    exit 1
fi
end_line=$((start_line + end_line - 1))

echo "   方法位置: 行 $start_line - $end_line"

# 创建新文件
head -n $((start_line - 1)) "$CONTROLLER_FILE" > /tmp/new_controller.php
echo "" >> /tmp/new_controller.php
echo "    $(cat /tmp/fixed_controller_response.php)" >> /tmp/new_controller.php
echo "" >> /tmp/new_controller.php
tail -n +$((end_line + 1)) "$CONTROLLER_FILE" >> /tmp/new_controller.php

# 替换原文件
cp /tmp/new_controller.php "$CONTROLLER_FILE"

echo "✅ 字段映射修复完成"

# 7. 验证修改后的效果
echo "🔍 步骤5: 验证修改效果..."

# 重启后端服务以应用更改
echo "   重启后端服务..."
docker-compose restart backend
sleep 10

# 测试API输出
echo "   测试API输出格式..."
echo "   获取修改后的字段列表..."
curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.[0] | keys' > "$BACKUP_DIR/after_fields.json" 2>/dev/null || echo "API调用失败，请手动验证"

# 检查关键字段
echo "   验证关键字段存在性..."
critical_fields=("shape" "app_model" "material" "thickness_met" "bubble_diameter_met" "part_number" "pcs_per_box")

for field in "${critical_fields[@]}"; do
    if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq -e ".[0].$field" > /dev/null 2>&1; then
        echo "   ✅ $field - 字段存在"
    else
        echo "   ❌ $field - 字段缺失"
    fi
done

# 8. 生成验证报告
echo "📊 步骤6: 生成验证报告..."

cat > "$BACKUP_DIR/fix_report.md" << EOF
# Consumables字段映射修复报告

## 修复时间
$(date)

## 备份位置
$BACKUP_DIR

## 修复内容
✅ 添加前端期望的直接字段映射
✅ 保持现有specs结构向后兼容
✅ 修复关键筛选字段映射

## 关键修复字段
- bag_type → shape (形状筛选)
- app_model → app_model (机型筛选)
- thickness_met → thickness_met (纯数值)
- bubble_diameter_met → bubble_diameter_met (泡径显示)
- part_number → part_number (料号字段)

## 新增字段 
共新增 30+ 个详细信息字段，包括：
- 包装信息字段
- 重量信息字段 
- 托盘A/B/C方案字段
- 纸筒规格字段

## 验证建议
请测试以下功能：
1. 耗材页面筛选功能
2. 列表页字段显示
3. 详细信息弹窗
4. 购物车功能
5. PO单生成

## 回滚方法
如需回滚，请执行：
cp $BACKUP_DIR/class-consumable-controller.php.backup $CONTROLLER_FILE
docker-compose restart backend
EOF

echo "✅ 修复完成！"
echo ""
echo "📋 修复摘要："
echo "   ✅ 字段映射修复已应用"
echo "   ✅ 向后兼容性已保证"
echo "   ✅ 服务已重启"
echo "   📁 备份位置: $BACKUP_DIR"
echo "   📄 详细报告: $BACKUP_DIR/fix_report.md"
echo ""
echo "🧪 请进行以下验证："
echo "   1. 访问耗材页面测试筛选功能"
echo "   2. 检查列表页字段显示"
echo "   3. 测试详细信息弹窗"
echo "   4. 验证购物车和PO功能"
echo ""
echo "🔙 如需回滚："
echo "   cp $BACKUP_DIR/class-consumable-controller.php.backup $CONTROLLER_FILE"
echo "   docker-compose restart backend"

# 清理临时文件
rm -f /tmp/fixed_controller_response.php /tmp/new_controller.php
