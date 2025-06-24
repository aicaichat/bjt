<?php
/**
 * 测试具体产品的多语言数据
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 测试具体产品的多语言数据\n";
echo "==============================\n\n";

// 从截图中看到的产品
$test_products = [
    ['id' => '09A0101107', 'type' => 'spare_part'],
    ['id' => '60A01149', 'type' => 'spare_part'],
    ['id' => '60A04004', 'type' => 'spare_part'],
    ['id' => '90R01258', 'type' => 'consumable'],
    ['id' => '1231313131313', 'type' => 'unknown'] // 需要确定类型
];

// 包含产品信息解析器
require_once __DIR__ . '/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

$resolver = new BJT_Product_Info_Resolver();

foreach ($test_products as $product_info) {
    $product_id = $product_info['id'];
    $expected_type = $product_info['type'];
    
    echo "🎯 测试产品: {$product_id}\n";
    echo str_repeat('-', 40) . "\n";
    
    // 先尝试查找产品在哪个表中
    $tables = [
        'parts' => $wpdb->prefix . 'bjt_parts',
        'accessories' => $wpdb->prefix . 'bjt_accessories',
        'spare_parts' => $wpdb->prefix . 'bjt_spare_parts',
        'consumables' => $wpdb->prefix . 'bjt_consumables'
    ];
    
    $found_in = [];
    foreach ($tables as $type => $table) {
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE part_number = %s OR id = %s",
            $product_id, $product_id
        ));
        if ($count > 0) {
            $found_in[] = $type;
            
            // 获取详细数据
            $data = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table} WHERE part_number = %s OR id = %s LIMIT 1",
                $product_id, $product_id
            ));
            
            echo "✅ 找到在 {$type} 表中:\n";
            echo "   • ID: " . ($data->id ?? 'N/A') . "\n";
            echo "   • 料号: " . ($data->part_number ?? 'N/A') . "\n";
            echo "   • 型号: " . ($data->model ?? 'N/A') . "\n";
            
            // 检查名称字段
            if (isset($data->name_zh)) {
                echo "   • 中文名称: '" . ($data->name_zh ?: 'EMPTY') . "'\n";
            }
            if (isset($data->name_en)) {
                echo "   • 英文名称: '" . ($data->name_en ?: 'EMPTY') . "'\n";
            }
            if (isset($data->title_zh)) {
                echo "   • 中文标题: '" . ($data->title_zh ?: 'EMPTY') . "'\n";
            }
            if (isset($data->title_en)) {
                echo "   • 英文标题: '" . ($data->title_en ?: 'EMPTY') . "'\n";
            }
        }
    }
    
    if (empty($found_in)) {
        echo "❌ 未找到产品\n";
    }
    
    // 测试解析器
    echo "\n🔧 测试解析器结果:\n";
    $result = $resolver->get_product_info($product_id);
    if ($result) {
        echo "✅ 解析成功:\n";
        echo "   • 产品名称: '" . ($result->product_name ?? 'N/A') . "'\n";
        echo "   • 中文名称: '" . ($result->name_zh ?? 'N/A') . "'\n";
        echo "   • 英文名称: '" . ($result->name_en ?? 'N/A') . "'\n";
        echo "   • 型号: '" . ($result->model ?? 'N/A') . "'\n";
        echo "   • 品牌: '" . ($result->brand ?? 'N/A') . "'\n";
    } else {
        echo "❌ 解析失败\n";
    }
    
    echo "\n" . str_repeat('=', 50) . "\n\n";
}

echo "🎯 测试完成！\n";
?> 