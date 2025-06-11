<?php
// 检查数据库中的关系记录
require_once('/Users/mac/bjt/bjt-front/bjt-product-system/wordpress/wp-config.php');

global $wpdb;

echo "=== 检查主机 60A01149 的最新关系记录 ===\n";

$query = "SELECT id, product_line_id, host_part_number, parent_part_number, part_number, child_part_number, child_type, level, status, created_at 
         FROM wp_bjt_relations 
         WHERE host_part_number = '60A01149' 
         ORDER BY id DESC 
         LIMIT 15";

$results = $wpdb->get_results($query);

if (empty($results)) {
    echo "❌ 没有找到任何记录\n";
} else {
    echo "✅ 找到 " . count($results) . " 条记录:\n\n";
    
    foreach ($results as $row) {
        echo "ID: {$row->id}\n";
        echo "  产品线: {$row->product_line_id}\n";
        echo "  主机: {$row->host_part_number}\n";
        echo "  父级: " . ($row->parent_part_number ?: 'NULL') . "\n";
        echo "  当前: {$row->part_number}\n";
        echo "  子级: {$row->child_part_number}\n";
        echo "  类型: {$row->child_type}\n";
        echo "  层级: {$row->level}\n";
        echo "  状态: {$row->status}\n";
        echo "  创建时间: {$row->created_at}\n";
        echo "  关系: {$row->part_number} → {$row->child_part_number}\n";
        echo "  --------------------------------\n";
    }
}

echo "\n=== 检查是否有ID为192的记录 ===\n";
$record_192 = $wpdb->get_row("SELECT * FROM wp_bjt_relations WHERE id = 192");
if ($record_192) {
    echo "✅ 找到ID 192的记录:\n";
    print_r($record_192);
} else {
    echo "❌ 没有找到ID 192的记录\n";
}

echo "\n=== 检查60A04024相关的所有记录 ===\n";
$query_60A04024 = "SELECT id, host_part_number, parent_part_number, part_number, child_part_number, level 
                  FROM wp_bjt_relations 
                  WHERE (part_number = '60A04024' OR child_part_number = '60A04024') 
                  AND host_part_number = '60A01149'
                  ORDER BY id";

$results_60A04024 = $wpdb->get_results($query_60A04024);
echo "找到 " . count($results_60A04024) . " 条与60A04024相关的记录:\n";
foreach ($results_60A04024 as $row) {
    echo "ID {$row->id}: {$row->parent_part_number} → {$row->part_number} → {$row->child_part_number} (Level: {$row->level})\n";
}
?> 