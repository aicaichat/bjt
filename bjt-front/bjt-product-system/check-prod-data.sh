#!/bin/bash

echo "=== 检查生产环境数据库中的料号 ==="

# 创建检查脚本
cat > /tmp/check-prod-data.php << 'EOF'
<?php
define('ABSPATH', '/var/www/html/');
require_once('/var/www/html/wp-config.php');

global $wpdb;

// 生产环境订单中的料号
$part_numbers = [
    ['92R01006', 'consumable'],
    ['92A01007', 'consumable'], 
    ['08A0105127', 'spare_part'],
    ['09A0101107', 'spare_part'],
    ['60A01149', 'machine'],
    ['60A04038', 'accessory']
];

echo "=== 生产环境料号检查 ===\n";

foreach ($part_numbers as $item) {
    list($part_number, $type) = $item;
    echo "\n检查料号: $part_number ($type)\n";
    
    $table_map = [
        'consumable' => $wpdb->prefix . 'bjt_consumables',
        'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
        'machine' => $wpdb->prefix . 'bjt_parts',
        'accessory' => $wpdb->prefix . 'bjt_accessories'
    ];
    
    $table = $table_map[$type];
    
    // 精确查询
    $product = $wpdb->get_row($wpdb->prepare(
        "SELECT id, part_number, model, spec, name_zh, name_en FROM $table WHERE part_number = %s",
        $part_number
    ));
    
    if ($product) {
        echo "✅ 精确匹配: ID={$product->id}\n";
        echo "   Model: {$product->model}\n";
        echo "   Spec: " . substr($product->spec, 0, 50) . "...\n";
        echo "   Name ZH: {$product->name_zh}\n";
        echo "   Name EN: {$product->name_en}\n";
    } else {
        echo "❌ 精确匹配失败\n";
        
        // 模糊搜索
        $like_results = $wpdb->get_results($wpdb->prepare(
            "SELECT id, part_number, model FROM $table WHERE part_number LIKE %s LIMIT 5",
            '%' . $wpdb->esc_like($part_number) . '%'
        ));
        
        if ($like_results) {
            echo "   相似料号:\n";
            foreach ($like_results as $r) {
                echo "     - {$r->part_number} (ID: {$r->id}, Model: {$r->model})\n";
            }
        } else {
            echo "   无相似料号\n";
        }
        
        // 反向搜索：看哪些料号包含这个作为子串
        $reverse_results = $wpdb->get_results($wpdb->prepare(
            "SELECT id, part_number, model FROM $table WHERE %s LIKE CONCAT('%', part_number, '%') LIMIT 5",
            $part_number
        ));
        
        if ($reverse_results) {
            echo "   反向匹配（订单料号包含数据库料号）:\n";
            foreach ($reverse_results as $r) {
                echo "     - {$r->part_number} (ID: {$r->id}, Model: {$r->model})\n";
            }
        }
    }
}

echo "\n=== 检查完成 ===\n";
?>
EOF

# 执行检查
if docker ps | grep -q "wordpress"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep wordpress | head -1)
    echo "使用容器: $CONTAINER_NAME"
    
    docker cp /tmp/check-prod-data.php $CONTAINER_NAME:/tmp/check-prod-data.php
    docker exec $CONTAINER_NAME php /tmp/check-prod-data.php
    docker exec $CONTAINER_NAME rm -f /tmp/check-prod-data.php
    rm -f /tmp/check-prod-data.php
else
    echo "❌ 未找到 WordPress 容器"
fi 