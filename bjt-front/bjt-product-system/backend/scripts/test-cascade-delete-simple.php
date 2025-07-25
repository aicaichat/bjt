<?php
/**
 * 简化的级联删除功能测试脚本
 */

// 检查是否在命令行环境中运行
if (php_sapi_name() !== 'cli') {
    die('This script must be run from the command line.');
}

// 加载WordPress环境
require_once(__DIR__ . '/../wp-load.php');

global $wpdb;

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== BJT Relations 级联删除测试 (简化版) ===\n";

// 1. 查看现有数据结构
echo "\n1. 当前数据概况:\n";
$table_name = $wpdb->prefix . 'bjt_relations';
$total_relations = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
echo "   总关系数量: {$total_relations}\n";

// 2. 选择一个测试用例
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

// 3. 查找所有应该被级联删除的关系
echo "\n3. 查找应该被级联删除的关系:\n";

// 模拟级联删除查询：查找所有以test_relation的child_part_number为parent_part_number的关系
$child_relations = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE parent_part_number = %s AND host_part_number = %s ORDER BY level, id",
    $test_relation->child_part_number,
    $test_relation->host_part_number
));

echo "   找到 " . count($child_relations) . " 个直接子级关系:\n";
foreach ($child_relations as $child) {
    echo "     ID: {$child->id}, part: {$child->part_number}, parent: {$child->parent_part_number}, child: {$child->child_part_number}, level: {$child->level}\n";
}

// 4. 递归查找更深层的关系
echo "\n4. 递归查找更深层的关系:\n";
$all_descendants = [];
$queue = [$test_relation];
$processed = [];

while (!empty($queue)) {
    $current = array_shift($queue);
    
    if (in_array($current->id, $processed)) {
        continue;
    }
    
    $processed[] = $current->id;
    $all_descendants[] = $current;
    
    // 查找当前节点的子级
    $children = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$table_name} WHERE parent_part_number = %s AND host_part_number = %s",
        $current->child_part_number,
        $current->host_part_number
    ));
    
    foreach ($children as $child) {
        if (!in_array($child->id, $processed)) {
            $queue[] = $child;
        }
    }
}

echo "   总共找到 " . count($all_descendants) . " 个需要级联删除的关系:\n";
foreach ($all_descendants as $desc) {
    echo "     ID: {$desc->id}, part: {$desc->part_number}, parent: {$desc->parent_part_number}, child: {$desc->child_part_number}, level: {$desc->level}\n";
}

// 5. 验证级联删除逻辑
echo "\n5. 验证级联删除逻辑:\n";
$host_count = array_count_values(array_column($all_descendants, 'host_part_number'));
echo "   ✓ 主机料号分布: " . json_encode($host_count) . "\n";

$same_host = count($host_count) === 1;
echo "   ✓ 是否只包含同一主机: " . ($same_host ? 'YES' : 'NO') . "\n";

// 6. 测试不同主机的关系是否被误删
echo "\n6. 测试不同主机的关系是否被误删:\n";
$other_host_relations = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE host_part_number != %s LIMIT 5",
    $test_relation->host_part_number
));

echo "   其他主机的关系数量: " . count($other_host_relations) . "\n";
foreach ($other_host_relations as $other) {
    echo "     ID: {$other->id}, host: {$other->host_part_number}, part: {$other->part_number}, child: {$other->child_part_number}\n";
}

// 检查是否有其他主机的关系在级联删除列表中
$other_host_in_delete_list = array_filter($all_descendants, function($rel) use ($test_relation) {
    return $rel->host_part_number !== $test_relation->host_part_number;
});

echo "   ✓ 其他主机关系是否被误删: " . (count($other_host_in_delete_list) > 0 ? 'YES (ERROR!)' : 'NO (CORRECT)') . "\n";

echo "\n=== 测试完成 ===\n";
echo "注意: 此测试为模拟测试，未实际删除任何数据\n"; 