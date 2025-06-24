<?php
/**
 * 检查90R01258产品为什么显示Not Found
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';
require_once __DIR__ . '/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

global $wpdb;

echo "🔍 检查产品 90R01258 为什么显示 Not Found\n";
echo "===========================================\n\n";

$part_number = '90R01258';

// 1. 在所有产品表中搜索
$tables = [
    'consumables' => $wpdb->prefix . 'bjt_consumables',
    'spare_parts' => $wpdb->prefix . 'bjt_spare_parts', 
    'accessories' => $wpdb->prefix . 'bjt_accessories',
    'parts' => $wpdb->prefix . 'bjt_parts'
];

echo "📊 步骤1: 在所有表中搜索料号 {$part_number}\n";
echo "------------------------------------------------\n";

$found_in_tables = [];
foreach ($tables as $type => $table_name) {
    $result = $wpdb->get_row($wpdb->prepare(
        "SELECT part_number, name_zh, name_en, model, brand, spec FROM {$table_name} WHERE part_number = %s LIMIT 1",
        $part_number
    ));
    
    if ($result) {
        $found_in_tables[] = $type;
        echo "✅ 在 {$type} 表中找到:\n";
        echo "   • 料号: {$result->part_number}\n";
        echo "   • 中文名: " . ($result->name_zh ?: 'N/A') . "\n";
        echo "   • 英文名: " . ($result->name_en ?: 'N/A') . "\n";
        echo "   • 型号: " . ($result->model ?: 'N/A') . "\n";
        echo "   • 品牌: " . ($result->brand ?: 'N/A') . "\n";
        echo "   • 规格: " . ($result->spec ?: 'N/A') . "\n";
    } else {
        echo "❌ 在 {$type} 表中未找到\n";
    }
}

if (empty($found_in_tables)) {
    echo "\n❌ 在所有产品表中都未找到该料号！\n";
    
    // 2. 模糊搜索相似料号
    echo "\n📊 步骤2: 模糊搜索相似料号\n";
    echo "----------------------------\n";
    
    foreach ($tables as $type => $table_name) {
        $similar = $wpdb->get_results($wpdb->prepare(
            "SELECT part_number, name_zh, name_en FROM {$table_name} WHERE part_number LIKE %s LIMIT 5",
            '%90R%'
        ));
        
        if ($similar) {
            echo "🔍 在 {$type} 表中找到相似料号:\n";
            foreach ($similar as $item) {
                echo "   • {$item->part_number}: {$item->name_zh} / {$item->name_en}\n";
            }
        }
    }
} else {
    echo "\n✅ 找到产品，位于表: " . implode(', ', $found_in_tables) . "\n";
    
    // 3. 测试产品信息解析器
    echo "\n📊 步骤3: 测试产品信息解析器\n";
    echo "------------------------------\n";
    
    foreach ($found_in_tables as $type) {
        $product_details = BJT_Product_Info_Resolver::get_product_details($part_number, $type);
        
        if ($product_details) {
            echo "✅ 解析器在 {$type} 类型下成功获取产品信息:\n";
            echo "   • Model: " . ($product_details['model'] ?? 'N/A') . "\n";
            echo "   • Brand: " . ($product_details['brand'] ?? 'N/A') . "\n";
            echo "   • Spec: " . ($product_details['spec'] ?? 'N/A') . "\n";
            echo "   • 中文名: " . ($product_details['name_zh'] ?? 'N/A') . "\n";
            echo "   • 英文名: " . ($product_details['name_en'] ?? 'N/A') . "\n";
        } else {
            echo "❌ 解析器在 {$type} 类型下未能获取产品信息\n";
        }
    }
}

// 4. 检查订单项中的类型标识
echo "\n📊 步骤4: 检查订单项中的类型标识\n";
echo "--------------------------------\n";

$order_items = $wpdb->get_results($wpdb->prepare(
    "SELECT item_id, item_name, item_type, target_type, target_id FROM {$wpdb->prefix}bjt_order_items WHERE item_id = %s",
    $part_number
));

if ($order_items) {
    foreach ($order_items as $item) {
        echo "✅ 在订单项中找到:\n";
        echo "   • item_id: {$item->item_id}\n";
        echo "   • item_name: {$item->item_name}\n";
        echo "   • item_type: {$item->item_type}\n";
        echo "   • target_type: {$item->target_type}\n";
        echo "   • target_id: {$item->target_id}\n";
        
        // 使用订单项中的类型信息测试解析器
        if ($item->item_type) {
            echo "\n🔧 使用订单项类型 '{$item->item_type}' 测试解析器:\n";
            $product_details = BJT_Product_Info_Resolver::get_product_details($part_number, $item->item_type, $item->target_id);
            
            if ($product_details) {
                echo "✅ 成功获取产品信息!\n";
                echo "   • Model: " . ($product_details['model'] ?? 'N/A') . "\n";
                echo "   • 中文名: " . ($product_details['name_zh'] ?? 'N/A') . "\n";
                echo "   • 英文名: " . ($product_details['name_en'] ?? 'N/A') . "\n";
            } else {
                echo "❌ 仍然无法获取产品信息\n";
            }
        }
    }
} else {
    echo "❌ 在订单项中未找到该料号\n";
}

echo "\n🎯 检查完成！\n";
?> 