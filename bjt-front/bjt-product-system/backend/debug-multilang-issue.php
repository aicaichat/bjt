<?php
/**
 * 调试多语言字段问题
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wp-load.php');

echo "=== 多语言字段问题调试 ===\n\n";

// 加载产品信息解析器
require_once('wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php');

// 测试产品信息解析器
$test_cases = [
    ['part_number' => '09A0101107', 'type' => 'spare_part', 'target_id' => 16],
    ['part_number' => '90R01258', 'type' => 'consumable', 'target_id' => 1],
];

foreach ($test_cases as $case) {
    echo "--- 测试: {$case['part_number']} ({$case['type']}) ---\n";
    
    $details = BJT_Product_Info_Resolver::get_product_details(
        $case['part_number'], 
        $case['type'], 
        $case['target_id']
    );
    
    if ($details) {
        echo "✅ 找到产品详情:\n";
        echo "  - spec: " . ($details['spec'] ?? 'N/A') . "\n";
        echo "  - model: " . ($details['model'] ?? 'N/A') . "\n";
        echo "  - brand: " . ($details['brand'] ?? 'N/A') . "\n";
        echo "  - name_zh: " . ($details['name_zh'] ?? '❌ 缺失') . "\n";
        echo "  - name_en: " . ($details['name_en'] ?? '❌ 缺失') . "\n";
        echo "  - 所有字段: " . implode(', ', array_keys($details)) . "\n";
    } else {
        echo "❌ 未找到产品详情\n";
    }
    echo "\n";
}

echo "=== 调试完成 ===\n"; 