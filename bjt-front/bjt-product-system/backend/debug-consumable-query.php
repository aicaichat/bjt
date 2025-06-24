<?php
/**
 * 调试耗材查询问题
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 调试耗材查询问题\n";
echo "==================\n\n";

$part_number = '90R01258';
$table_name = $wpdb->prefix . 'bjt_consumables';

// 1. 直接查询
echo "📊 步骤1: 直接查询料号\n";
echo "----------------------\n";

$direct_query = "SELECT * FROM {$table_name} WHERE part_number = '{$part_number}'";
echo "SQL: {$direct_query}\n";

$result = $wpdb->get_row($direct_query);
if ($result) {
    echo "✅ 直接查询成功:\n";
    echo "   • ID: {$result->id}\n";
    echo "   • 料号: {$result->part_number}\n";
    echo "   • 中文名: " . ($result->name_zh ?: 'N/A') . "\n";
    echo "   • 英文名: " . ($result->name_en ?: 'N/A') . "\n";
    echo "   • 型号: {$result->model}\n";
} else {
    echo "❌ 直接查询失败\n";
}

// 2. 使用prepare查询
echo "\n📊 步骤2: 使用prepare查询\n";
echo "------------------------\n";

$prepared_result = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE part_number = %s",
    $part_number
));

if ($prepared_result) {
    echo "✅ prepare查询成功:\n";
    echo "   • ID: {$prepared_result->id}\n";
    echo "   • 料号: {$prepared_result->part_number}\n";
    echo "   • 中文名: " . ($prepared_result->name_zh ?: 'N/A') . "\n";
    echo "   • 英文名: " . ($prepared_result->name_en ?: 'N/A') . "\n";
    echo "   • 型号: {$prepared_result->model}\n";
} else {
    echo "❌ prepare查询失败\n";
}

// 3. 查看所有料号
echo "\n📊 步骤3: 查看所有料号\n";
echo "--------------------\n";

$all_parts = $wpdb->get_results("SELECT id, part_number FROM {$table_name} ORDER BY id");
if ($all_parts) {
    echo "✅ 找到 " . count($all_parts) . " 个产品:\n";
    foreach ($all_parts as $part) {
        $match = ($part->part_number === $part_number) ? '✅' : '  ';
        echo "   {$match} ID:{$part->id} | 料号:'{$part->part_number}'\n";
    }
} else {
    echo "❌ 表中没有任何产品\n";
}

// 4. 检查字符编码和空格
echo "\n📊 步骤4: 检查字符编码和空格\n";
echo "----------------------------\n";

$all_matching = $wpdb->get_results($wpdb->prepare(
    "SELECT id, part_number, LENGTH(part_number) as len, HEX(part_number) as hex FROM {$table_name} WHERE id = 1"
));

if ($all_matching) {
    foreach ($all_matching as $item) {
        echo "• ID:{$item->id} | 料号:'{$item->part_number}' | 长度:{$item->len} | HEX:{$item->hex}\n";
        echo "• 目标料号: '{$part_number}' | 长度:" . strlen($part_number) . " | HEX:" . bin2hex($part_number) . "\n";
        echo "• 字符串比较: " . ($item->part_number === $part_number ? '相等' : '不相等') . "\n";
    }
}

// 5. 测试产品信息解析器（使用ID）
echo "\n📊 步骤5: 测试产品信息解析器（使用ID）\n";
echo "------------------------------------\n";

require_once __DIR__ . '/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

$product_details = BJT_Product_Info_Resolver::get_product_details($part_number, 'consumable', 1);

if ($product_details) {
    echo "✅ 解析器成功（使用ID=1）:\n";
    foreach ($product_details as $key => $value) {
        echo "   • {$key}: " . ($value ?: 'N/A') . "\n";
    }
} else {
    echo "❌ 解析器失败（使用ID=1）\n";
}

echo "\n🎯 调试完成！\n";
?> 