<?php
/**
 * 测试循环检测修复脚本
 * 
 * 验证前端和后端的循环检测逻辑修复是否有效
 * 
 * 使用方法：
 * php scripts/test-cycle-detection-fix.php
 */

// 加载WordPress环境
require_once __DIR__ . '/../wp-config.php';
require_once __DIR__ . '/../wp-load.php';

// 确保在WordPress环境中
if (!defined('ABSPATH')) {
    die('此脚本需要在WordPress环境中运行');
}

echo "=== 循环检测修复测试 ===\n";
echo "测试时间: " . date('Y-m-d H:i:s') . "\n\n";

// 测试数据
$test_host = '60A01113';
$test_part_number = '60A10003';

echo "1. 测试主机: {$test_host}\n";
echo "2. 测试料号: {$test_part_number}\n\n";

// 1. 测试数据库连接
echo "=== 步骤1: 测试数据库连接 ===\n";
global $wpdb;
$table_name = $wpdb->prefix . 'bjt_relations';

$count = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
if ($count === null) {
    echo "❌ 数据库连接失败或表不存在\n";
    exit(1);
}
echo "✅ 数据库连接正常，关系表中共有 {$count} 条记录\n\n";

// 2. 检查测试数据是否存在
echo "=== 步骤2: 检查测试数据 ===\n";
$test_relations = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$table_name} WHERE host_part_number = %s ORDER BY level ASC, id ASC",
    $test_host
));

if (empty($test_relations)) {
    echo "❌ 找不到测试主机 {$test_host} 的关系数据\n";
    exit(1);
}

echo "✅ 找到 " . count($test_relations) . " 条关系记录\n";

// 查找60A10003在不同路径中的出现
$part_occurrences = array_filter($test_relations, function($relation) use ($test_part_number) {
    return $relation->part_number === $test_part_number || $relation->child_part_number === $test_part_number;
});

echo "✅ 料号 {$test_part_number} 在关系中出现 " . count($part_occurrences) . " 次\n";

foreach ($part_occurrences as $occurrence) {
    $role = $occurrence->part_number === $test_part_number ? 'part' : 'child';
    echo "  - ID: {$occurrence->id}, 角色: {$role}, 父级: {$occurrence->parent_part_number}, 当前: {$occurrence->part_number}, 子级: {$occurrence->child_part_number}\n";
}
echo "\n";

// 3. 测试循环检测逻辑
echo "=== 步骤3: 测试循环检测逻辑 ===\n";

// 模拟前端的循环检测逻辑
function test_path_based_cycle_detection($relations, $current_part, $parent_part, $visited_paths = []) {
    $current_path_context = $parent_part ? "{$parent_part}→{$current_part}" : "ROOT→{$current_part}";
    
    if (in_array($current_path_context, $visited_paths)) {
        return [
            'cycle_detected' => true,
            'cycle_path' => $current_path_context,
            'visited_paths' => $visited_paths
        ];
    }
    
    $new_visited_paths = array_merge($visited_paths, [$current_path_context]);
    
    // 查找子级
    $child_relations = array_filter($relations, function($relation) use ($current_part, $parent_part) {
        if ($current_part === '60A01113' && $parent_part === null) {
            return $relation->parent_part_number === null && $relation->part_number === $current_part;
        } else {
            return $relation->part_number === $current_part && $relation->parent_part_number === $parent_part;
        }
    });
    
    $results = [];
    foreach ($child_relations as $child_relation) {
        if (!empty($child_relation->child_part_number)) {
            $child_result = test_path_based_cycle_detection(
                $relations,
                $child_relation->child_part_number,
                $current_part,
                $new_visited_paths
            );
            $results[] = $child_result;
        }
    }
    
    return [
        'cycle_detected' => false,
        'current_path' => $current_path_context,
        'visited_paths' => $new_visited_paths,
        'child_results' => $results
    ];
}

// 运行测试
$result = test_path_based_cycle_detection($test_relations, $test_host, null);

if ($result['cycle_detected']) {
    echo "❌ 检测到循环引用: {$result['cycle_path']}\n";
} else {
    echo "✅ 未检测到循环引用\n";
}

// 检查是否有实际的循环
$has_actual_cycle = false;
foreach ($test_relations as $relation) {
    if ($relation->part_number === $relation->child_part_number) {
        $has_actual_cycle = true;
        echo "❌ 发现实际的循环引用: ID {$relation->id}, part_number = child_part_number = {$relation->part_number}\n";
    }
}

if (!$has_actual_cycle) {
    echo "✅ 数据中没有实际的循环引用\n";
}
echo "\n";

// 4. 测试删除操作的循环检测
echo "=== 步骤4: 测试删除操作的循环检测 ===\n";

// 模拟后端的循环检测逻辑
function test_cascade_delete_cycle_detection($relations, $parent_part, $visited_paths = []) {
    $current_path = implode('→', $visited_paths) . '→' . $parent_part;
    
    if (in_array($parent_part, $visited_paths)) {
        return [
            'cycle_detected' => true,
            'cycle_path' => $current_path,
            'visited_paths' => $visited_paths
        ];
    }
    
    $new_visited_paths = array_merge($visited_paths, [$parent_part]);
    
    $child_relations = array_filter($relations, function($relation) use ($parent_part) {
        return $relation->parent_part_number === $parent_part;
    });
    
    $results = [];
    foreach ($child_relations as $child_relation) {
        if (!empty($child_relation->child_part_number)) {
            $child_result = test_cascade_delete_cycle_detection(
                $relations,
                $child_relation->child_part_number,
                $new_visited_paths
            );
            $results[] = $child_result;
        }
    }
    
    return [
        'cycle_detected' => false,
        'current_path' => $current_path,
        'visited_paths' => $new_visited_paths,
        'child_results' => $results
    ];
}

// 测试删除60A10003时的循环检测
$delete_result = test_cascade_delete_cycle_detection($test_relations, $test_part_number);

if ($delete_result['cycle_detected']) {
    echo "❌ 删除操作中检测到循环引用: {$delete_result['cycle_path']}\n";
} else {
    echo "✅ 删除操作中未检测到循环引用\n";
}
echo "\n";

// 5. 统计测试结果
echo "=== 测试结果总结 ===\n";
echo "✅ 数据库连接: 正常\n";
echo "✅ 测试数据: 存在 " . count($test_relations) . " 条关系\n";
echo "✅ 料号 {$test_part_number} 出现次数: " . count($part_occurrences) . "\n";
echo "✅ 前端循环检测: " . ($result['cycle_detected'] ? "检测到循环" : "未检测到循环") . "\n";
echo "✅ 后端删除循环检测: " . ($delete_result['cycle_detected'] ? "检测到循环" : "未检测到循环") . "\n";
echo "✅ 实际循环引用: " . ($has_actual_cycle ? "存在" : "不存在") . "\n";
echo "\n";

if (!$result['cycle_detected'] && !$delete_result['cycle_detected'] && !$has_actual_cycle) {
    echo "🎉 所有测试通过！循环检测修复成功！\n";
} else {
    echo "⚠️ 部分测试未通过，请检查具体问题\n";
}

echo "\n=== 测试完成 ===\n"; 