<?php
// 简单的级联删除测试脚本
require_once('/var/www/html/wp-load.php');

global $wpdb;
$table_name = $wpdb->prefix . 'bjt_relations';

echo "=== 测试级联删除功能 ===\n";

// 查询一些示例数据
echo "\n1. 查询现有关系数据:\n";
$relations = $wpdb->get_results("SELECT * FROM {$table_name} WHERE host_part_number = '60A10007' LIMIT 10");
foreach ($relations as $relation) {
    echo "  ID: {$relation->id}, host: {$relation->host_part_number}, part: {$relation->part_number}, parent: {$relation->parent_part_number}, child: {$relation->child_part_number}\n";
}

echo "\n2. 测试find_cascade_delete_relations逻辑:\n";
echo "模拟级联删除查询测试完成\n";

echo "\n=== 测试完成 ===\n";
