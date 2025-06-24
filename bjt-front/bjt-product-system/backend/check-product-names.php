<?php
/**
 * 检查产品名称字段存储情况
 * 分析60A01149和13A02026两个产品在不同表中的名称字段
 */

// WordPress环境
require_once dirname(__FILE__) . '/wp-config.php';
require_once dirname(__FILE__) . '/wp-includes/wp-db.php';

// 数据库连接
global $wpdb;

echo "=== BJT产品名称字段检查 ===\n\n";

// 要检查的产品
$products = ['60A01149', '13A02026'];

// 要检查的表和字段映射
$tables_to_check = [
    'bjt_parts' => [
        'name_fields' => ['name_zh', 'name_en'],
        'identifier' => 'part_number',
        'description' => '主机表'
    ],
    'bjt_spare_parts' => [
        'name_fields' => ['name_zh', 'name_en'],
        'identifier' => 'part_number',
        'description' => '备件表'
    ],
    'bjt_accessories' => [
        'name_fields' => ['name_zh', 'name_en'],
        'identifier' => 'part_number',
        'description' => '配件表'
    ],
    'bjt_consumables' => [
        'name_fields' => ['title_zh', 'title_en'],
        'identifier' => 'part_number',
        'description' => '耗材表'
    ],
    'bjt_host_models' => [
        'name_fields' => ['title_zh', 'title_en', 'model_name', 'name_en'],
        'identifier' => 'model',
        'description' => '主机型号表'
    ]
];

foreach ($products as $product_code) {
    echo "🔍 检查产品: {$product_code}\n";
    echo str_repeat("=", 50) . "\n";
    
    foreach ($tables_to_check as $table_name => $config) {
        $full_table_name = $wpdb->prefix . $table_name;
        $identifier_field = $config['identifier'];
        $name_fields = $config['name_fields'];
        
        echo "\n📋 表: {$config['description']} ({$table_name})\n";
        
        // 构建查询字段
        $select_fields = array_merge(
            ['id', $identifier_field],
            $name_fields,
            ['model', 'brand', 'spec', 'description_zh', 'description_en']
        );
        
        // 过滤存在的字段
        $existing_fields = [];
        foreach ($select_fields as $field) {
            $check_field = $wpdb->get_var("SHOW COLUMNS FROM {$full_table_name} LIKE '{$field}'");
            if ($check_field) {
                $existing_fields[] = $field;
            }
        }
        
        if (empty($existing_fields)) {
            echo "   ❌ 表不存在或无可查询字段\n";
            continue;
        }
        
        $fields_str = implode(', ', $existing_fields);
        
        // 查询产品
        $query = $wpdb->prepare(
            "SELECT {$fields_str} FROM {$full_table_name} WHERE {$identifier_field} = %s LIMIT 1",
            $product_code
        );
        
        $result = $wpdb->get_row($query, ARRAY_A);
        
        if ($result) {
            echo "   ✅ 找到记录 (ID: {$result['id']})\n";
            
            // 检查名称字段
            foreach ($name_fields as $name_field) {
                if (isset($result[$name_field])) {
                    $value = $result[$name_field];
                    $status = empty($value) ? "❌ 空值" : "✅ 有值";
                    echo "   - {$name_field}: {$status} = '{$value}'\n";
                }
            }
            
            // 检查其他相关字段
            $other_fields = ['model', 'brand', 'spec'];
            foreach ($other_fields as $field) {
                if (isset($result[$field])) {
                    $value = $result[$field];
                    echo "   - {$field}: '{$value}'\n";
                }
            }
            
        } else {
            echo "   ❌ 未找到记录\n";
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n\n";
}

echo "🔍 分析总结:\n";
echo "1. 检查哪些表中存储了这两个产品\n";
echo "2. 检查name_zh/name_en或title_zh/title_en字段是否有值\n";
echo "3. 如果名称字段为空，查看model、brand等字段是否可以作为名称来源\n";
echo "\n";

// 额外检查：查看这两个产品在API响应中的完整结构
echo "🔍 API响应结构检查:\n";
echo str_repeat("=", 50) . "\n";

// 模拟API查询逻辑
require_once dirname(__FILE__) . '/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

foreach ($products as $product_code) {
    echo "\n📋 产品 {$product_code} 的API响应结构:\n";
    
    // 尝试不同的产品类型
    $product_types = ['machine', 'spare_part', 'accessory', 'consumable'];
    
    foreach ($product_types as $type) {
        echo "  尝试类型: {$type}\n";
        
        try {
            $product_info = BJT_Product_Info_Resolver::get_product_info_by_part_number($product_code, $type);
            
            if ($product_info) {
                echo "    ✅ 找到产品信息:\n";
                echo "    - name_zh: " . ($product_info['name_zh'] ?? 'NULL') . "\n";
                echo "    - name_en: " . ($product_info['name_en'] ?? 'NULL') . "\n";
                echo "    - model: " . ($product_info['model'] ?? 'NULL') . "\n";
                echo "    - brand: " . ($product_info['brand'] ?? 'NULL') . "\n";
                echo "    - spec: " . ($product_info['spec'] ?? 'NULL') . "\n";
                break; // 找到了就不继续尝试其他类型
            }
        } catch (Exception $e) {
            echo "    ❌ 错误: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n✅ 检查完成！\n";
?> 