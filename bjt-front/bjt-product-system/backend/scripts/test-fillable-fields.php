<?php
/**
 * fillable_fields修复测试脚本
 * 验证host_part_number字段已正确添加到fillable_fields数组中
 */

// 检查是否在命令行环境中运行
if (php_sapi_name() !== 'cli') {
    die('This script must be run from the command line.');
}

// 加载WordPress环境
require_once(__DIR__ . '/../wp-load.php');

// 加载BJT Relations Controller
require_once(__DIR__ . '/../wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php');

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== fillable_fields修复测试 ===\n";

// 1. 检查fillable_fields定义
echo "\n1. 检查fillable_fields定义:\n";

$controller = new BJT_Relation_Controller();
$reflection = new ReflectionClass($controller);

// 获取fillable_fields属性
$fillable_fields_property = $reflection->getProperty('fillable_fields');
$fillable_fields_property->setAccessible(true);
$fillable_fields = $fillable_fields_property->getValue($controller);

echo "   fillable_fields数组内容:\n";
foreach ($fillable_fields as $field) {
    echo "     - {$field}\n";
}

// 检查host_part_number是否在数组中
$has_host_part_number = in_array('host_part_number', $fillable_fields);
echo "   host_part_number是否在fillable_fields中: " . ($has_host_part_number ? 'YES' : 'NO') . "\n";

// 2. 测试map_request_to_db方法是否正确处理host_part_number
echo "\n2. 测试map_request_to_db方法:\n";

// 创建模拟请求
$request_data = [
    'product_line_id' => 1,
    'host_part_number' => 'TEST_HOST_123',
    'part_number' => 'TEST_PART_123',
    'parent_part_number' => 'TEST_PARENT_123',
    'child_part_number' => 'TEST_CHILD_123',
    'level' => 1,
    'quantity' => 1,
    'child_type' => 'accessory',
    'status' => 'publish'
];

$request_mock = new WP_REST_Request('POST', '/wp-json/bjt/v1/relations');
foreach ($request_data as $key => $value) {
    $request_mock->set_param($key, $value);
}

// 使用反射调用private方法
$map_method = $reflection->getMethod('map_request_to_db');
$map_method->setAccessible(true);

$mapped_data = $map_method->invoke($controller, $request_mock);

echo "   map_request_to_db结果:\n";
foreach ($mapped_data as $key => $value) {
    echo "     {$key}: {$value}\n";
}

// 检查host_part_number是否被正确映射
$mapped_host_part_number = isset($mapped_data['host_part_number']) ? $mapped_data['host_part_number'] : null;
echo "   mapped host_part_number: " . ($mapped_host_part_number ? $mapped_host_part_number : 'NULL') . "\n";
echo "   是否正确映射: " . ($mapped_host_part_number === 'TEST_HOST_123' ? 'YES' : 'NO') . "\n";

// 3. 测试字段验证
echo "\n3. 测试字段验证:\n";

// 验证所有必需字段都存在
$required_fields = ['product_line_id', 'part_number', 'level', 'quantity'];
echo "   检查必需字段:\n";
foreach ($required_fields as $field) {
    $exists = isset($mapped_data[$field]);
    echo "     {$field}: " . ($exists ? 'EXISTS' : 'MISSING') . "\n";
}

// 验证host_part_number被正确处理
echo "   host_part_number处理验证:\n";
if ($mapped_host_part_number) {
    echo "     ✓ host_part_number被正确映射\n";
    echo "     ✓ 值为大写: " . (ctype_upper($mapped_host_part_number) ? 'YES' : 'NO') . "\n";
} else {
    echo "     ❌ host_part_number未被映射\n";
}

// 4. 测试完整性
echo "\n4. 测试完整性:\n";

// 检查所有fillable_fields是否都有对应的处理逻辑
$map_method_source = $reflection->getMethod('map_request_to_db');
$map_method_source->setAccessible(true);

echo "   fillable_fields完整性检查:\n";
$critical_fields = ['host_part_number', 'part_number', 'parent_part_number', 'child_part_number'];
foreach ($critical_fields as $field) {
    $in_fillable = in_array($field, $fillable_fields);
    echo "     {$field}: " . ($in_fillable ? 'OK' : 'MISSING') . "\n";
}

// 检查是否有遗漏的字段
$all_expected_fields = [
    'product_line_id', 'host_part_number', 'part_number', 'parent_part_number', 
    'child_part_number', 'child_type', 'level', 'quantity', 'required_parts', 
    'required_quantity', 'sort_order', 'status'
];

$missing_fields = array_diff($all_expected_fields, $fillable_fields);
if (empty($missing_fields)) {
    echo "   ✓ 所有预期字段都在fillable_fields中\n";
} else {
    echo "   ❌ 缺少字段: " . implode(', ', $missing_fields) . "\n";
}

echo "\n=== 测试完成 ===\n";
if ($has_host_part_number && $mapped_host_part_number === 'TEST_HOST_123') {
    echo "✅ fillable_fields修复成功！host_part_number字段已正确添加并可以正常使用。\n";
} else {
    echo "❌ fillable_fields修复可能存在问题，需要进一步检查。\n";
} 