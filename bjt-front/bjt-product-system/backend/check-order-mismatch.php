<?php
/**
 * 检查订单号不匹配问题
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wp-load.php');

echo "=== 订单号不匹配问题分析 ===\n\n";

global $wpdb;

// 1. 检查数据库中的所有订单
echo "1. 数据库中的所有订单:\n";
$orders = $wpdb->get_results("SELECT id, order_number, created_at, status FROM {$wpdb->prefix}bjt_orders ORDER BY created_at DESC LIMIT 10");

if (empty($orders)) {
    echo "❌ 数据库中没有找到任何订单\n";
} else {
    foreach ($orders as $order) {
        echo "  - ID: {$order->id}, 订单号: {$order->order_number}, 创建时间: {$order->created_at}, 状态: {$order->status}\n";
    }
}

echo "\n2. 查找包含 '20250623' 的订单:\n";
$date_orders = $wpdb->get_results("SELECT id, order_number, created_at FROM {$wpdb->prefix}bjt_orders WHERE order_number LIKE '%20250623%'");

if (empty($date_orders)) {
    echo "❌ 没有找到包含 '20250623' 的订单\n";
} else {
    foreach ($date_orders as $order) {
        echo "  - ID: {$order->id}, 订单号: {$order->order_number}, 创建时间: {$order->created_at}\n";
    }
}

echo "\n3. 查找 PO-20250623-009B70 相关订单:\n";
// 尝试不同的查询方式
$po_patterns = [
    'PO-20250623-009B70',
    'ORD-20250623-009B70', 
    '%009B70%',
    '%20250623%'
];

foreach ($po_patterns as $pattern) {
    echo "  查询模式: {$pattern}\n";
    $results = $wpdb->get_results($wpdb->prepare("SELECT id, order_number, created_at FROM {$wpdb->prefix}bjt_orders WHERE order_number LIKE %s", $pattern));
    
    if (empty($results)) {
        echo "    ❌ 没有找到匹配的订单\n";
    } else {
        foreach ($results as $order) {
            echo "    ✅ 找到: ID={$order->id}, 订单号={$order->order_number}, 创建时间={$order->created_at}\n";
        }
    }
}

echo "\n4. 分析订单号生成逻辑:\n";

// 模拟后端订单号生成
function generate_backend_order_number() {
    $date_part = date('Ymd');
    $random_part = strtoupper(substr(md5(uniqid(rand(), true)), 0, 6)); 
    return 'ORD-' . $date_part . '-' . $random_part;
}

// 模拟前端PO号生成
function generate_frontend_po_number() {
    $date = new DateTime();
    $year = $date->format('Y');
    $month = str_pad($date->format('n'), 2, '0', STR_PAD_LEFT);
    $day = str_pad($date->format('j'), 2, '0', STR_PAD_LEFT);
    $random = str_pad(strtoupper(dechex(mt_rand(0, 1048575))), 6, '0', STR_PAD_LEFT);
    return "PO-{$year}{$month}{$day}-{$random}";
}

echo "  后端订单号示例: " . generate_backend_order_number() . "\n";
echo "  前端PO号示例: " . generate_frontend_po_number() . "\n";

echo "\n5. 检查今天的订单创建情况:\n";
$today = date('Y-m-d');
$today_orders = $wpdb->get_results($wpdb->prepare(
    "SELECT id, order_number, created_at, user_id FROM {$wpdb->prefix}bjt_orders WHERE DATE(created_at) = %s ORDER BY created_at DESC",
    $today
));

if (empty($today_orders)) {
    echo "❌ 今天没有创建任何订单\n";
} else {
    echo "✅ 今天创建的订单:\n";
    foreach ($today_orders as $order) {
        echo "  - ID: {$order->id}, 订单号: {$order->order_number}, 用户: {$order->user_id}, 时间: {$order->created_at}\n";
    }
}

echo "\n=== 分析完成 ===\n"; 