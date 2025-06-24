<?php
/**
 * 调试备件查询问题
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 调试备件查询问题: 09A0101107\n";
echo "=================================\n\n";

$part_number = '09A0101107';
$table_name = $wpdb->prefix . 'bjt_spare_parts';

// 1. 检查表是否存在
echo "📋 步骤1: 检查表是否存在\n";
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_name}'");
if ($table_exists) {
    echo "✅ 表 {$table_name} 存在\n";
} else {
    echo "❌ 表 {$table_name} 不存在\n";
    exit;
}

// 2. 检查记录是否存在
echo "\n📋 步骤2: 检查记录是否存在\n";
$count = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$table_name} WHERE part_number = %s",
    $part_number
));
echo "记录数量: {$count}\n";

if ($count == 0) {
    echo "❌ 记录不存在\n";
    
    // 查看所有备件料号
    echo "\n📋 查看前10个备件料号:\n";
    $parts = $wpdb->get_results("SELECT part_number FROM {$table_name} LIMIT 10");
    foreach ($parts as $part) {
        echo "  • {$part->part_number}\n";
    }
    exit;
}

// 3. 获取完整记录
echo "\n📋 步骤3: 获取完整记录\n";
$record = $wpdb->get_row($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE part_number = %s",
    $part_number
));

if ($record) {
    echo "✅ 找到记录:\n";
    foreach ($record as $key => $value) {
        echo "  • {$key}: " . ($value ?: 'NULL') . "\n";
    }
} else {
    echo "❌ 未找到记录\n";
}

// 4. 测试产品信息解析器的查询
echo "\n📋 步骤4: 测试产品信息解析器的查询\n";
$query = $wpdb->prepare(
    "SELECT COALESCE(NULLIF(model, ''), app_model, '') as model, COALESCE(brand, '') as brand, 
            COALESCE(spec, description_zh, '') as spec, '' as properties, 
            description_zh as description, product_line_id as category 
     FROM {$table_name} WHERE part_number = %s LIMIT 1",
    $part_number
);

echo "执行查询: " . str_replace('%s', "'{$part_number}'", $query) . "\n";

$result = $wpdb->get_row($query);

if ($result) {
    echo "✅ 查询成功:\n";
    foreach ($result as $key => $value) {
        echo "  • {$key}: " . ($value ?: 'NULL') . "\n";
    }
} else {
    echo "❌ 查询失败\n";
    echo "最后的错误: " . $wpdb->last_error . "\n";
}

echo "\n🎯 调试完成！\n";
?> 