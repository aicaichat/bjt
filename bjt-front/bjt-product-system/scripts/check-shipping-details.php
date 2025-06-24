<?php
// 检查所有订单的收货信息详情
require_once '/Users/mac/bjt/bjt-front/bjt-product-system/backend/wp-config.php';

echo "🔍 检查数据库中所有订单的收货信息\n";
echo "=====================================\n";

global $wpdb;

// 查询所有订单
$orders = $wpdb->get_results("
    SELECT id, order_number, shipping_address, billing_address, created_at, total_amount 
    FROM wp_bjt_orders 
    ORDER BY created_at DESC
");

if (empty($orders)) {
    echo "❌ 没有找到任何订单\n";
    exit;
}

echo "总订单数: " . count($orders) . "\n\n";

foreach ($orders as $order) {
    echo "订单 {$order->id} ({$order->order_number})\n";
    echo "创建时间: {$order->created_at}\n";
    echo "总金额: ¥{$order->total_amount}\n";
    
    // 解析收货地址
    $shipping = json_decode($order->shipping_address, true);
    echo "收货信息:\n";
    if ($shipping) {
        foreach ($shipping as $key => $value) {
            echo "  {$key}: {$value}\n";
        }
    } else {
        echo "  原始数据: {$order->shipping_address}\n";
    }
    
    // 解析账单地址
    $billing = json_decode($order->billing_address, true);
    echo "账单信息:\n";
    if ($billing) {
        foreach ($billing as $key => $value) {
            echo "  {$key}: {$value}\n";
        }
    } else {
        echo "  原始数据: {$order->billing_address}\n";
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// 统计唯一收货信息
echo "📊 收货信息统计:\n";
$unique_shipping = [];
foreach ($orders as $order) {
    $shipping = json_decode($order->shipping_address, true);
    if ($shipping) {
        $key = $shipping['name'] . '|' . $shipping['address'] . '|' . $shipping['phone'];
        if (!in_array($key, $unique_shipping)) {
            $unique_shipping[] = $key;
        }
    }
}

echo "唯一收货信息数量: " . count($unique_shipping) . "\n";
foreach ($unique_shipping as $i => $info) {
    $parts = explode('|', $info);
    echo ($i + 1) . ". 姓名: {$parts[0]} | 地址: {$parts[1]} | 电话: {$parts[2]}\n";
}
?> 