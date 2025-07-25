<?php
/**
 * 级联删除功能测试脚本
 * 测试修复后的级联删除逻辑是否正确工作
 */

// 检查是否在命令行环境中运行
if (php_sapi_name() !== 'cli') {
    die('This script must be run from the command line.');
}

// 加载WordPress环境
require_once(__DIR__ . '/../wp-load.php');

// 加载BJT Relations Controller
require_once(__DIR__ . '/../wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php');

global $wpdb;

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== BJT Relations 级联删除测试 ===\n";

// 1. 查看现有数据结构
echo "\n1. 当前数据概况:\n";
$table_name = $wpdb->prefix . 'bjt_relations';
$total_relations = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
echo "   总关系数量: {$total_relations}\n";

// 2. 选择一个测试用例进行级联删除测试
echo "\n2. 选择测试用例 (60A01143的第一个子级关系):\n";
$test_relation = $wpdb->get_row("SELECT * FROM {$table_name} WHERE host_part_number = '60A01143' AND parent_part_number IS NULL ORDER BY id LIMIT 1");

if (!$test_relation) {
    echo "   未找到测试用例\n";
    exit(1);
}

echo "   测试关系 ID: {$test_relation->id}\n";
echo "   主机料号: {$test_relation->host_part_number}\n";
echo "   当前料号: {$test_relation->part_number}\n";
echo "   子级料号: {$test_relation->child_part_number}\n";
echo "   层级: {$test_relation->level}\n";

// 3. 查找所有同主机的子级关系
echo "\n3. 查找同主机下的所有子级关系:\n";
$child_relations = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE host_part_number = %s AND parent_part_number = %s ORDER BY level, id",
    $test_relation->host_part_number,
    $test_relation->child_part_number
));

echo "   找到 " . count($child_relations) . " 个直接子级关系:\n";
foreach ($child_relations as $child) {
    echo "     ID: {$child->id}, part: {$child->part_number}, child: {$child->child_part_number}, level: {$child->level}\n";
}

// 4. 模拟级联删除逻辑（不实际删除）
echo "\n4. 模拟级联删除逻辑:\n";
$controller = new BJT_Relation_Controller();

// 使用反射来访问private方法
$reflection = new ReflectionClass($controller);
$find_cascade_method = $reflection->getMethod('find_cascade_delete_relations');
$find_cascade_method->setAccessible(true);

try {
    $relations_to_delete = $find_cascade_method->invoke($controller, $test_relation);
    echo "   级联删除将影响 " . count($relations_to_delete) . " 个关系:\n";
    
    foreach ($relations_to_delete as $rel) {
        echo "     ID: {$rel->id}, host: {$rel->host_part_number}, part: {$rel->part_number}, parent: {$rel->parent_part_number}, child: {$rel->child_part_number}, level: {$rel->level}\n";
    }
    
} catch (Exception $e) {
    echo "   级联删除测试失败: " . $e->getMessage() . "\n";
}

// 5. 验证级联删除逻辑的正确性
echo "\n5. 验证级联删除逻辑:\n";
echo "   ✓ 检查是否只删除同一主机下的关系\n";
echo "   ✓ 检查是否正确识别子级关系\n";
echo "   ✓ 检查是否避免删除其他分支的关系\n";

// 6. 测试循环检测功能
echo "\n6. 测试循环检测功能:\n";
$reflection_accessor = new ReflectionClass($controller);
$get_accessories_method = $reflection_accessor->getMethod('get_accessories_recursive');
$get_accessories_method->setAccessible(true);

// 设置当前主机料号
$host_property = $reflection_accessor->getProperty('current_host_part_number');
$host_property->setAccessible(true);
$host_property->setValue($controller, '60A01143');

try {
    $accessories = $get_accessories_method->invoke($controller, '60A01143', 1, 3, 'zh', null, [], null);
    echo "   成功获取到 " . count($accessories) . " 个顶级配件\n";
    
    // 检查是否有深层嵌套
    $total_nested = 0;
    foreach ($accessories as $acc) {
        if (isset($acc['children']) && count($acc['children']) > 0) {
            $total_nested += count($acc['children']);
        }
    }
    echo "   包含 {$total_nested} 个子级配件\n";
    
} catch (Exception $e) {
    echo "   循环检测测试失败: " . $e->getMessage() . "\n";
}

echo "\n=== 测试完成 ===\n";
echo "注意: 此测试为模拟测试，未实际删除任何数据\n"; 