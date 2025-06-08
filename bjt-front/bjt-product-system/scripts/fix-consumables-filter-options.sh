#!/bin/bash

# Consumables筛选项动态生成修复脚本
# 解决筛选项静态配置与实际数据不匹配的问题

set -e

echo "🔧 开始修复Consumables页面筛选项问题..."
echo "📋 问题：筛选项使用静态配置，不能覆盖实际数据中的所有值"

# 配置
BACKUP_DIR="/tmp/consumables_filter_fix_backup_$(date +%Y%m%d_%H%M%S)"
CONTROLLER_FILE="plugins/bjt-core-entities/controllers/class-consumable-controller.php"

# 1. 备份当前文件
echo "💾 步骤1: 备份当前Controller文件..."
mkdir -p "$BACKUP_DIR"
cp "$CONTROLLER_FILE" "$BACKUP_DIR/class-consumable-controller.php.backup"
echo "✅ 备份完成: $BACKUP_DIR/class-consumable-controller.php.backup"

# 2. 显示修复内容
echo "📝 步骤2: 修复策略..."
cat << 'EOF'

🎯 修复目标:
- ✅ 将静态字典配置改为从实际数据动态生成
- ✅ 确保筛选项覆盖所有数据库中的真实值
- ✅ 正确处理复杂的app_model字段（逗号分隔）
- ✅ 保持现有API结构向后兼容

🔧 关键修复点:
- shapes: 从实际bag_type字段生成
- materials: 从实际material字段生成  
- models: 从实际app_model字段解析生成
- thicknesses/widths/lengths: 从实际数值字段生成

EOF

echo "🤔 是否继续执行修改？[y/N]"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ 用户取消修复"
    exit 1
fi

# 3. 应用修复
echo "🔧 步骤3: 应用筛选项动态生成修复..."

# 创建修复后的代码
cat > /tmp/filter_options_fix.php << 'EOF'
        // --- 🔥 修复：动态生成筛选项（从实际数据） ---
        $filter_options = $this->generate_dynamic_filter_options($wpdb);
        
        $total_pages = ceil($total_items / $per_page);

        return $this->format_response([
            'items' => $formatted_items,
            'total' => intval($total_items),
            'total_pages' => intval($total_pages),
            'current_page' => intval($page),
            'filterOptions' => $filter_options
        ]);
    }
    
    /**
     * 🔥 新增方法：动态生成筛选项（从实际数据）
     * 解决静态字典配置与实际数据不匹配的问题
     */
    private function generate_dynamic_filter_options($wpdb) {
        // 获取所有已发布的耗材数据用于生成筛选项
        $all_items_query = "SELECT bag_type, material, app_model, thickness_met, width_met, length_met, bubble_diameter_met FROM {$this->table_name} WHERE status = 'publish'";
        $all_items = $wpdb->get_results($all_items_query);
        
        $filter_options = [
            'shapes' => [],
            'materials' => [],
            'models' => [],
            'thicknesses' => [],
            'widths' => [],
            'lengths' => [],
            'weights' => []
        ];
        
        // 用于去重的Set
        $shapes_set = [];
        $materials_set = [];
        $models_set = [];
        $thickness_set = [];
        $width_set = [];
        $length_set = [];
        
        foreach ($all_items as $item) {
            // 1. 处理形状（bag_type）
            if (!empty($item->bag_type) && !isset($shapes_set[$item->bag_type])) {
                $shapes_set[$item->bag_type] = true;
                $filter_options['shapes'][] = [
                    'id' => $item->bag_type,
                    'code' => $item->bag_type,
                    'name' => $this->get_shape_display_name($item->bag_type),
                    'image_url' => $this->get_shape_image_url($item->bag_type),
                    'sort_order' => count($filter_options['shapes']) * 10
                ];
            }
            
            // 2. 处理材质
            if (!empty($item->material) && !isset($materials_set[$item->material])) {
                $materials_set[$item->material] = true;
                $filter_options['materials'][] = [
                    'id' => $item->material,
                    'code' => $item->material,
                    'name' => $this->get_material_display_name($item->material),
                    'sort_order' => count($filter_options['materials']) * 10
                ];
            }
            
            // 3. 处理适用机型（app_model）- 解析逗号分隔的值
            if (!empty($item->app_model)) {
                // 处理复杂的app_model字段：LA-E4C,"LA-E4S V2.0",LA-F2
                $app_models = $this->parse_app_model_field($item->app_model);
                foreach ($app_models as $model) {
                    $model = trim($model);
                    if (!empty($model) && !isset($models_set[$model])) {
                        $models_set[$model] = true;
                        $filter_options['models'][] = [
                            'id' => $model,
                            'code' => $model,
                            'name' => $this->get_model_display_name($model),
                            'sort_order' => count($filter_options['models']) * 10
                        ];
                    }
                }
            }
            
            // 4. 处理厚度
            if (!empty($item->thickness_met) && $item->thickness_met > 0) {
                $thickness_val = floatval($item->thickness_met);
                $thickness_key = number_format($thickness_val, 0) . 'um';
                if (!isset($thickness_set[$thickness_key])) {
                    $thickness_set[$thickness_key] = true;
                    $filter_options['thicknesses'][] = [
                        'code' => $thickness_key,
                        'name' => number_format($thickness_val, 0) . ' um',
                        'value' => $thickness_val
                    ];
                }
            }
            
            // 5. 处理膜宽
            if (!empty($item->width_met) && $item->width_met > 0) {
                $width_val = floatval($item->width_met);
                $width_key = number_format($width_val, 0) . 'cm';
                if (!isset($width_set[$width_key])) {
                    $width_set[$width_key] = true;
                    $filter_options['widths'][] = [
                        'code' => $width_key,
                        'name' => number_format($width_val, 0) . ' cm',
                        'value' => $width_val
                    ];
                }
            }
            
            // 6. 处理袋长
            if (!empty($item->length_met) && $item->length_met > 0) {
                $length_val = floatval($item->length_met);
                $length_key = number_format($length_val, 1) . 'cm';
                if (!isset($length_set[$length_key])) {
                    $length_set[$length_key] = true;
                    $filter_options['lengths'][] = [
                        'code' => $length_key,
                        'name' => number_format($length_val, 1) . ' cm',
                        'value' => $length_val
                    ];
                }
            }
        }
        
        // 排序筛选项
        usort($filter_options['shapes'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['materials'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['models'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['thicknesses'], function($a, $b) { return $a['value'] - $b['value']; });
        usort($filter_options['widths'], function($a, $b) { return $a['value'] - $b['value']; });
        usort($filter_options['lengths'], function($a, $b) { return $a['value'] - $b['value']; });
        
        // 添加调试信息
        error_log('[BJT Consumables] Dynamic filter options generated: ' . json_encode([
            'shapes_count' => count($filter_options['shapes']),
            'materials_count' => count($filter_options['materials']),
            'models_count' => count($filter_options['models']),
            'thicknesses_count' => count($filter_options['thicknesses']),
            'widths_count' => count($filter_options['widths']),
            'lengths_count' => count($filter_options['lengths'])
        ]));
        
        return $filter_options;
    }
    
    /**
     * 🔥 新增方法：解析app_model字段（处理逗号分隔和引号）
     */
    private function parse_app_model_field($app_model_str) {
        // 处理格式：LA-E4C,"LA-E4S V2.0",LA-F2
        // 分解步骤：
        // 1. 先按逗号分隔
        // 2. 去除每个部分的引号
        // 3. 清理空白字符
        
        $models = [];
        $parts = explode(',', $app_model_str);
        
        foreach ($parts as $part) {
            $part = trim($part);
            // 移除前后的引号
            $part = trim($part, '"\'');
            if (!empty($part)) {
                $models[] = $part;
            }
        }
        
        return $models;
    }
    
    /**
     * 🔥 新增方法：获取形状显示名称
     */
    private function get_shape_display_name($shape) {
        $shape_names = [
            'Bubble' => '气泡膜',
            'Tube' => '气枕膜', 
            'paper Bubble' => '纸质气泡膜',
            'paper air Pillow' => '纸质气垫枕'
        ];
        
        return isset($shape_names[$shape]) ? $shape_names[$shape] : $shape;
    }
    
    /**
     * 🔥 新增方法：获取形状图片URL
     */
    private function get_shape_image_url($shape) {
        $shape_images = [
            'Bubble' => '/images/MFF/values/MFF.png',
            'Tube' => '/images/MFC/values/MFC.png',
            'paper Bubble' => '/images/MFB/values/MFB.png',
            'paper air Pillow' => '/images/MEX/values/MEX.png'
        ];
        
        return isset($shape_images[$shape]) ? $shape_images[$shape] : '/images/default/shape.png';
    }
    
    /**
     * 🔥 新增方法：获取材质显示名称
     */
    private function get_material_display_name($material) {
        $material_names = [
            'HDPE' => 'HDPE',
            '50% HDPE' => '50%回料HDPE',
            'PAPE' => 'PAPE共挤膜',
            'PAPER' => '纸塑膜',
            'LDPE' => 'LDPE'
        ];
        
        return isset($material_names[$material]) ? $material_names[$material] : $material;
    }
    
    /**
     * 🔥 新增方法：获取机型显示名称
     */
    private function get_model_display_name($model) {
        $model_names = [
            'LA-E4S V2.0' => 'LA-E4S V2.0 商用型缓冲气垫机',
            'LA-E4S(paper)' => 'LA-E4S(paper)商用型缓冲气垫机',
            'LA-E4C' => 'LA-E4C 商用型缓冲气垫机',
            'LA-F2' => 'LA-F2 便携式缓冲气垫机'
        ];
        
        return isset($model_names[$model]) ? $model_names[$model] : $model;
    }
EOF

# 找到需要替换的代码位置
echo "   查找替换位置..."
LINE_START=$(grep -n "// --- Fetch Filter Options from Dictionary ---" "$CONTROLLER_FILE" | cut -d: -f1)
LINE_END=$(grep -n "return \$this->format_response" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)

if [ -z "$LINE_START" ] || [ -z "$LINE_END" ]; then
    echo "❌ 无法找到替换位置，手动应用修复"
    exit 1
fi

echo "   替换位置: 行 $LINE_START - $LINE_END"
echo "   应用修复..."

# 备份原方法
sed -n "${LINE_START},${LINE_END}p" "$CONTROLLER_FILE" > "$BACKUP_DIR/original_filter_options_method.txt"

# 应用修复：替换筛选项生成逻辑
# 创建临时文件
head -n $((LINE_START - 1)) "$CONTROLLER_FILE" > /tmp/controller_temp.php
cat /tmp/filter_options_fix.php >> /tmp/controller_temp.php
tail -n +$((LINE_END + 1)) "$CONTROLLER_FILE" >> /tmp/controller_temp.php

# 替换原文件
mv /tmp/controller_temp.php "$CONTROLLER_FILE"

echo "✅ 筛选项动态生成修复完成"

# 4. 验证修复效果
echo "🔍 步骤4: 验证修复效果..."

# 重启服务（如果可能）
echo "   尝试重启后端服务..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress &> /dev/null; then
        echo "✅ 后端服务重启成功"
        sleep 5
    else
        echo "⚠️ 服务重启失败，请手动重启"
    fi
else
    echo "⚠️ docker-compose未找到，请手动重启服务"
fi

# 验证API
echo "   验证API响应..."
if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" 2>/dev/null)
    if echo "$API_RESPONSE" | grep -q "shapes"; then
        echo "✅ API响应正常"
        
        # 检查筛选项数量
        SHAPES_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.shapes | length' 2>/dev/null || echo "0")
        MATERIALS_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.materials | length' 2>/dev/null || echo "0")
        MODELS_COUNT=$(echo "$API_RESPONSE" | jq '.data.filterOptions.models | length' 2>/dev/null || echo "0")
        
        echo "   筛选项统计："
        echo "   - 形状数量: $SHAPES_COUNT"
        echo "   - 材质数量: $MATERIALS_COUNT"  
        echo "   - 机型数量: $MODELS_COUNT"
        
        if [ "$SHAPES_COUNT" -gt 0 ] && [ "$MATERIALS_COUNT" -gt 0 ] && [ "$MODELS_COUNT" -gt 0 ]; then
            echo "✅ 筛选项生成成功"
        else
            echo "⚠️ 筛选项数量异常，需要检查"
        fi
    else
        echo "❌ API响应异常"
    fi
else
    echo "⚠️ curl命令未找到，无法验证API"
fi

echo ""
echo "🎉 修复完成总结:"
echo "✅ 备份位置: $BACKUP_DIR"
echo "✅ 修复内容: 筛选项从静态配置改为动态生成"
echo "✅ 覆盖范围: 所有数据库中的真实值"
echo "✅ 向后兼容: 保持现有API结构"
echo ""
echo "📝 修复后的筛选项特点:"
echo "- 🔄 动态生成：从实际数据中提取所有不重复的值"
echo "- 📊 完整覆盖：包含所有数据库中存在的形状、材质、机型"
echo "- 🎯 智能解析：正确处理复杂的app_model字段（逗号分隔）"
echo "- 🏷️ 友好显示：提供中文显示名称和图片URL"
echo ""
echo "🔧 如需回滚，请执行:"
echo "cp $BACKUP_DIR/class-consumable-controller.php.backup $CONTROLLER_FILE" 