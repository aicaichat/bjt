<?php
/**
 * 测试关系表级联删除功能
 * 
 * 使用方法：
 * php scripts/test-cascade-delete.php
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../backend/wp-load.php');

function test_cascade_delete() {
    global $wpdb;
    
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    echo "=== 级联删除功能测试 ===\n\n";
    
    // 查看主机 421343214123412343212142141 的关系结构
    $host_part_number = '421343214123412343212142141';
    
    echo "1. 测试前的数据结构:\n";
    echo "主机: {$host_part_number}\n";
    
    $relations = $wpdb->get_results($wpdb->prepare(
        "SELECT id, host_part_number, part_number, parent_part_number, child_part_number, child_type, level 
         FROM {$relations_table} 
         WHERE host_part_number = %s 
         ORDER BY level ASC, id ASC",
        $host_part_number
    ));
    
    if (empty($relations)) {
        echo "❌ 没有找到测试数据\n";
        return;
    }
    
    foreach ($relations as $relation) {
        $level_prefix = str_repeat('  ', $relation->level);
        echo "{$level_prefix}[ID:{$relation->id}] {$relation->part_number} → {$relation->child_part_number} (Level: {$relation->level}, Type: {$relation->child_type})\n";
    }
    
    echo "\n2. 测试级联删除功能:\n";
    
    // 找到一个有子级的关系进行测试
    $parent_relation = $wpdb->get_row($wpdb->prepare(
        "SELECT r1.* FROM {$relations_table} r1 
         WHERE r1.host_part_number = %s 
         AND EXISTS (
             SELECT 1 FROM {$relations_table} r2 
             WHERE r2.part_number = r1.child_part_number 
             AND r2.product_line_id = r1.product_line_id
         )
         LIMIT 1",
        $host_part_number
    ));
    
    if (!$parent_relation) {
        echo "❌ 没有找到有子级的关系记录用于测试\n";
        return;
    }
    
    echo "选择测试关系: [ID:{$parent_relation->id}] {$parent_relation->part_number} → {$parent_relation->child_part_number}\n";
    
    // 找到所有会被级联删除的关系
    $child_relations = $wpdb->get_results($wpdb->prepare(
        "SELECT id, part_number, child_part_number, level 
         FROM {$relations_table} 
         WHERE part_number = %s AND product_line_id = %d",
        $parent_relation->child_part_number,
        $parent_relation->product_line_id
    ));
    
    echo "预期被级联删除的子关系:\n";
    foreach ($child_relations as $child) {
        echo "  [ID:{$child->id}] {$child->part_number} → {$child->child_part_number}\n";
    }
    
    $total_expected_deletions = 1 + count($child_relations);
    echo "预期删除总数: {$total_expected_deletions}\n\n";
    
    // 模拟API调用进行级联删除
    echo "3. 执行级联删除测试:\n";
    
    // 创建API请求对象（模拟）
    if (!class_exists('BJT_Relation_Controller')) {
        require_once __DIR__ . '/../plugins/bjt-core-entities/controllers/class-relation-controller.php';
    }
    
    $controller = new BJT_Relation_Controller();
    
    // 模拟删除请求
    $request = new WP_REST_Request('DELETE', '/wp-json/bjt/v1/relations/' . $parent_relation->id);
    $request->set_param('id', $parent_relation->id);
    $request->set_param('cascade', true);
    
    // 执行删除
    $response = $controller->delete_item($request);
    
    if (is_wp_error($response)) {
        echo "❌ 删除失败: " . $response->get_error_message() . "\n";
        return;
    }
    
    $data = $response->get_data();
    echo "✅ 删除成功!\n";
    echo "级联删除: " . ($data['cascade'] ? '是' : '否') . "\n";
    echo "实际删除数量: {$data['deleted_count']}\n";
    echo "删除的关系记录:\n";
    
    foreach ($data['deleted_relations'] as $deleted) {
        echo "  [ID:{$deleted['id']}] {$deleted['part_number']} → {$deleted['child_part_number']}\n";
    }
    
    // 验证删除结果
    echo "\n4. 验证删除结果:\n";
    
    $remaining_relations = $wpdb->get_results($wpdb->prepare(
        "SELECT id, part_number, child_part_number, level 
         FROM {$relations_table} 
         WHERE host_part_number = %s 
         ORDER BY level ASC, id ASC",
        $host_part_number
    ));
    
    echo "剩余关系记录:\n";
    if (empty($remaining_relations)) {
        echo "  (无)\n";
    } else {
        foreach ($remaining_relations as $relation) {
            echo "  [ID:{$relation->id}] {$relation->part_number} → {$relation->child_part_number}\n";
        }
    }
    
    // 检查是否有孤立记录
    $orphaned_relations = $wpdb->get_results($wpdb->prepare(
        "SELECT id, part_number, child_part_number 
         FROM {$relations_table} 
         WHERE part_number = %s AND product_line_id = %d",
        $parent_relation->child_part_number,
        $parent_relation->product_line_id
    ));
    
    if (!empty($orphaned_relations)) {
        echo "\n❌ 发现孤立关系记录:\n";
        foreach ($orphaned_relations as $orphaned) {
            echo "  [ID:{$orphaned->id}] {$orphaned->part_number} → {$orphaned->child_part_number}\n";
        }
    } else {
        echo "\n✅ 没有发现孤立关系记录\n";
    }
    
    echo "\n=== 测试完成 ===\n";
}

// 运行测试
try {
    test_cascade_delete();
} catch (Exception $e) {
    echo "❌ 测试异常: " . $e->getMessage() . "\n";
    echo "异常追踪:\n" . $e->getTraceAsString() . "\n";
} 