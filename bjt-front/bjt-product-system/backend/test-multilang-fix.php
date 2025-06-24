<?php
/**
 * 测试多语言产品名称修复效果
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';
require_once __DIR__ . '/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

global $wpdb;

echo "🌐 测试：多语言产品名称修复效果\n";
echo "==================================\n\n";

// 测试产品列表
$test_products = [
    ['part_number' => '09A0101107', 'type' => 'spare_part'],
    ['part_number' => '1231313131313', 'type' => 'machine'],
    ['part_number' => '60A10005', 'type' => 'accessory'],
    ['part_number' => '90R01258', 'type' => 'consumable'],
];

foreach ($test_products as $test_product) {
    echo "🔍 测试产品: {$test_product['part_number']} (类型: {$test_product['type']})\n";
    echo "---------------------------------------------\n";
    
    // 使用产品信息解析器获取产品详情
    $product_details = BJT_Product_Info_Resolver::get_product_details(
        $test_product['part_number'], 
        $test_product['type']
    );
    
    if ($product_details) {
        echo "✅ 成功获取产品信息:\n";
        echo "   • Model: " . ($product_details['model'] ?? 'N/A') . "\n";
        echo "   • Brand: " . ($product_details['brand'] ?? 'N/A') . "\n";
        echo "   • Spec: " . ($product_details['spec'] ?? 'N/A') . "\n";
        echo "   • Description: " . ($product_details['description'] ?? 'N/A') . "\n";
        echo "   • 中文名称 (name_zh): " . ($product_details['name_zh'] ?? 'N/A') . "\n";
        echo "   • 英文名称 (name_en): " . ($product_details['name_en'] ?? 'N/A') . "\n";
        
        // 检查多语言字段是否正确
        if (isset($product_details['name_zh']) && isset($product_details['name_en'])) {
            if (!empty($product_details['name_zh']) && !empty($product_details['name_en'])) {
                echo "   ✅ 多语言字段完整\n";
            } else {
                echo "   ⚠️ 多语言字段不完整\n";
            }
        } else {
            echo "   ❌ 缺少多语言字段\n";
        }
    } else {
        echo "❌ 未找到产品信息\n";
    }
    
    echo "\n";
}

// 直接查询数据库验证数据是否存在
echo "📊 数据库验证:\n";
echo "-------------\n";

foreach ($test_products as $test_product) {
    $table_map = [
        'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
        'accessory' => $wpdb->prefix . 'bjt_accessories', 
        'consumable' => $wpdb->prefix . 'bjt_consumables',
        'machine' => $wpdb->prefix . 'bjt_parts'
    ];
    
    $table_name = $table_map[$test_product['type']];
    
    $result = $wpdb->get_row($wpdb->prepare(
        "SELECT part_number, name_zh, name_en, model FROM {$table_name} WHERE part_number = %s LIMIT 1",
        $test_product['part_number']
    ));
    
    if ($result) {
        echo "✅ {$test_product['part_number']}: 中文='{$result->name_zh}', 英文='{$result->name_en}', Model='{$result->model}'\n";
    } else {
        echo "❌ {$test_product['part_number']}: 数据库中不存在\n";
    }
}

echo "\n🎯 测试完成！\n";
?> 