<?php
/**
 * 递归深度限制测试脚本
 * 测试find_root_host_part_number方法的递归深度限制功能
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

echo "=== 递归深度限制测试 ===\n";

// 1. 测试正常情况
echo "\n1. 测试正常情况（无循环，浅层级）:\n";

$controller = new BJT_Relation_Controller();
$reflection = new ReflectionClass($controller);

// 获取private方法
$find_root_method = $reflection->getMethod('find_root_host_part_number');
$find_root_method->setAccessible(true);

// 测试正常的主机料号查找
$relations_table = $wpdb->prefix . 'bjt_relations';
$sample_relation = $wpdb->get_row(
    "SELECT * FROM {$relations_table} 
     WHERE parent_part_number IS NOT NULL 
     AND child_part_number IS NOT NULL 
     LIMIT 1"
);

if ($sample_relation) {
    echo "   测试关系 ID: {$sample_relation->id}\n";
    echo "   主机料号: {$sample_relation->host_part_number}\n";
    echo "   子料号: {$sample_relation->child_part_number}\n";
    
    $start_time = microtime(true);
    $found_host = $find_root_method->invoke($controller, $sample_relation->child_part_number, $sample_relation->product_line_id);
    $end_time = microtime(true);
    
    echo "   查找耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
    echo "   找到的主机料号: {$found_host}\n";
    echo "   是否与预期一致: " . ($found_host === $sample_relation->host_part_number ? 'YES' : 'NO') . "\n";
} else {
    echo "   未找到合适的测试数据\n";
}

// 2. 测试递归深度限制（模拟深层级查找）
echo "\n2. 测试递归深度限制:\n";

// 创建临时测试数据（模拟深层级关系）
$test_data = [
    ['part_number' => 'TEST_HOST', 'parent_part_number' => null, 'child_part_number' => 'TEST_L1'],
    ['part_number' => 'TEST_L1', 'parent_part_number' => 'TEST_HOST', 'child_part_number' => 'TEST_L2'],
    ['part_number' => 'TEST_L2', 'parent_part_number' => 'TEST_L1', 'child_part_number' => 'TEST_L3'],
    ['part_number' => 'TEST_L3', 'parent_part_number' => 'TEST_L2', 'child_part_number' => 'TEST_L4'],
    ['part_number' => 'TEST_L4', 'parent_part_number' => 'TEST_L3', 'child_part_number' => 'TEST_L5'],
];

echo "   插入测试数据...\n";
$inserted_ids = [];
foreach ($test_data as $data) {
    $result = $wpdb->insert(
        $relations_table,
        [
            'product_line_id' => 1,
            'host_part_number' => 'TEST_HOST',
            'part_number' => $data['part_number'],
            'parent_part_number' => $data['parent_part_number'],
            'child_part_number' => $data['child_part_number'],
            'level' => 1,
            'quantity' => 1,
            'status' => 'publish',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]
    );
    
    if ($result) {
        $inserted_ids[] = $wpdb->insert_id;
        echo "     插入: {$data['part_number']} -> {$data['child_part_number']}\n";
    }
}

// 测试从最深层级开始查找
if (!empty($inserted_ids)) {
    echo "   从最深层级TEST_L5开始查找主机料号...\n";
    
    $start_time = microtime(true);
    $found_host = $find_root_method->invoke($controller, 'TEST_L5', 1);
    $end_time = microtime(true);
    
    echo "   查找耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
    echo "   找到的主机料号: {$found_host}\n";
    echo "   是否正确: " . ($found_host === 'TEST_HOST' ? 'YES' : 'NO') . "\n";
    
    // 测试递归深度限制（设置很小的深度限制）
    echo "   测试递归深度限制（最大深度=3）...\n";
    $limited_host = $find_root_method->invoke($controller, 'TEST_L5', 1, [], 0, 3);
    echo "   限制深度后的结果: {$limited_host}\n";
    echo "   是否触发深度限制: " . ($limited_host !== 'TEST_HOST' ? 'YES' : 'NO') . "\n";
}

// 3. 测试循环引用检测
echo "\n3. 测试循环引用检测:\n";

// 创建循环引用的测试数据
$cycle_data = [
    ['part_number' => 'CYCLE_A', 'parent_part_number' => 'CYCLE_C', 'child_part_number' => 'CYCLE_B'],
    ['part_number' => 'CYCLE_B', 'parent_part_number' => 'CYCLE_A', 'child_part_number' => 'CYCLE_C'],
    ['part_number' => 'CYCLE_C', 'parent_part_number' => 'CYCLE_B', 'child_part_number' => 'CYCLE_A'],
];

echo "   插入循环引用测试数据...\n";
foreach ($cycle_data as $data) {
    $result = $wpdb->insert(
        $relations_table,
        [
            'product_line_id' => 1,
            'host_part_number' => 'CYCLE_A',
            'part_number' => $data['part_number'],
            'parent_part_number' => $data['parent_part_number'],
            'child_part_number' => $data['child_part_number'],
            'level' => 1,
            'quantity' => 1,
            'status' => 'publish',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]
    );
    
    if ($result) {
        $inserted_ids[] = $wpdb->insert_id;
        echo "     插入循环: {$data['part_number']} -> {$data['child_part_number']}\n";
    }
}

// 测试循环引用检测
echo "   测试循环引用检测...\n";
$start_time = microtime(true);
$cycle_result = $find_root_method->invoke($controller, 'CYCLE_A', 1);
$end_time = microtime(true);

echo "   查找耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
echo "   循环检测结果: {$cycle_result}\n";
echo "   是否正确检测循环: " . ($cycle_result === 'CYCLE_A' ? 'YES' : 'NO') . "\n";

// 4. 清理测试数据
echo "\n4. 清理测试数据:\n";
if (!empty($inserted_ids)) {
    $ids_placeholder = implode(',', array_fill(0, count($inserted_ids), '%d'));
    $delete_result = $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$relations_table} WHERE id IN ({$ids_placeholder})",
            $inserted_ids
        )
    );
    
    echo "   删除了 {$delete_result} 条测试记录\n";
}

echo "\n=== 测试完成 ===\n";
echo "递归深度限制功能已添加，可以防止栈溢出问题\n"; 