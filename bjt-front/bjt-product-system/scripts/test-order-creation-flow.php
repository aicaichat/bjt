<?php
// 测试订单创建流程的数据保存
require_once '/Users/mac/bjt/bjt-front/bjt-product-system/backend/wp-config.php';

echo "🔍 测试订单创建流程的数据保存\n";
echo "===================================\n";

global $wpdb;

// 1. 检查最近的订单创建记录
echo "1. 检查最近订单的创建时间和数据...\n";
$recent_orders = $wpdb->get_results("
    SELECT id, order_number, shipping_address, billing_address, 
           total_amount, created_at, updated_at, user_id
    FROM wp_bjt_orders 
    ORDER BY created_at DESC 
    LIMIT 5
");

foreach ($recent_orders as $order) {
    echo "订单 {$order->id} ({$order->order_number})\n";
    echo "  用户ID: {$order->user_id}\n";
    echo "  创建时间: {$order->created_at}\n";
    echo "  更新时间: {$order->updated_at}\n";
    echo "  总金额: ¥{$order->total_amount}\n";
    
    // 解析收货地址
    $shipping = json_decode($order->shipping_address, true);
    if ($shipping) {
        echo "  收货信息 (JSON解析成功):\n";
        foreach ($shipping as $key => $value) {
            echo "    {$key}: {$value}\n";
        }
    } else {
        echo "  收货信息 (原始数据): {$order->shipping_address}\n";
    }
    
    // 检查订单项
    $items = $wpdb->get_results($wpdb->prepare("
        SELECT * FROM wp_bjt_order_items 
        WHERE order_id = %d
    ", $order->id));
    
    echo "  订单项数量: " . count($items) . "\n";
    if (!empty($items)) {
        foreach ($items as $i => $item) {
            echo "    项目 " . ($i + 1) . ": {$item->item_name} (料号: {$item->item_id}, 数量: {$item->quantity})\n";
        }
    }
    echo "\n";
}

// 2. 检查订单创建的完整性
echo "2. 检查订单数据完整性...\n";
$integrity_check = $wpdb->get_results("
    SELECT 
        o.id,
        o.order_number,
        o.shipping_address,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity * oi.price) as calculated_total,
        o.total_amount as stored_total
    FROM wp_bjt_orders o
    LEFT JOIN wp_bjt_order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
");

foreach ($integrity_check as $check) {
    $shipping_valid = !empty($check->shipping_address) && $check->shipping_address !== 'null';
    $items_valid = $check->item_count > 0;
    $total_match = abs($check->calculated_total - $check->stored_total) < 0.01;
    
    echo "订单 {$check->id} ({$check->order_number}):\n";
    echo "  收货信息: " . ($shipping_valid ? "✅ 有效" : "❌ 无效/空") . "\n";
    echo "  订单项: " . ($items_valid ? "✅ {$check->item_count}个项目" : "❌ 无项目") . "\n";
    echo "  金额一致性: " . ($total_match ? "✅ 一致" : "❌ 不一致") . " (计算: ¥{$check->calculated_total}, 存储: ¥{$check->stored_total})\n";
    echo "\n";
}

// 3. 检查用户ID和认证状态
echo "3. 检查用户认证和ID分配...\n";
$user_orders = $wpdb->get_results("
    SELECT user_id, COUNT(*) as order_count, 
           MIN(created_at) as first_order, 
           MAX(created_at) as last_order
    FROM wp_bjt_orders 
    GROUP BY user_id
    ORDER BY user_id
");

foreach ($user_orders as $user_stat) {
    echo "用户ID {$user_stat->user_id}: {$user_stat->order_count}个订单\n";
    echo "  首次订单: {$user_stat->first_order}\n";
    echo "  最新订单: {$user_stat->last_order}\n";
    
    // 检查用户是否存在
    $user_exists = $wpdb->get_var($wpdb->prepare("
        SELECT COUNT(*) FROM wp_users WHERE ID = %d
    ", $user_stat->user_id));
    
    echo "  用户存在: " . ($user_exists ? "✅ 是" : "❌ 否") . "\n\n";
}

// 4. 检查最近的购物车清空记录
echo "4. 检查购物车状态...\n";
$cart_items = $wpdb->get_results("
    SELECT user_id, COUNT(*) as item_count, 
           MAX(created_at) as last_activity
    FROM wp_bjt_cart_items 
    GROUP BY user_id
    ORDER BY last_activity DESC
");

if (empty($cart_items)) {
    echo "✅ 购物车已清空 - 订单创建后正确清理\n";
} else {
    echo "购物车状态:\n";
    foreach ($cart_items as $cart) {
        echo "  用户 {$cart->user_id}: {$cart->item_count}个项目 (最后活动: {$cart->last_activity})\n";
    }
}

echo "\n";

// 5. 测试数据保存流程
echo "5. 模拟订单创建数据流...\n";
echo "检查关键字段的JSON编码/解码...\n";

$test_shipping = [
    'name' => 'Test Customer',
    'phone' => '+86 138 0000 0000',
    'address' => 'Test Address for Validation'
];

$encoded = wp_json_encode($test_shipping);
$decoded = json_decode($encoded, true);

echo "JSON编码测试:\n";
echo "  原始数据: " . print_r($test_shipping, true);
echo "  编码后: {$encoded}\n";
echo "  解码后: " . print_r($decoded, true);
echo "  编码/解码一致性: " . ($test_shipping === $decoded ? "✅ 一致" : "❌ 不一致") . "\n";

echo "\n✅ 订单创建流程数据保存测试完成\n";
?> 