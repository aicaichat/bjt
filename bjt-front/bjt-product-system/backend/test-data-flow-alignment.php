<?php
/**
 * 测试数据流对齐
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wp-load.php');

echo "=== 数据流对齐测试 ===\n\n";

global $wpdb;

// 1. 获取最新的订单
echo "1. 获取最新的订单数据:\n";
$latest_order = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}bjt_orders ORDER BY created_at DESC LIMIT 1");

if (!$latest_order) {
    echo "❌ 没有找到订单\n";
    exit;
}

echo "✅ 最新订单:\n";
echo "  - ID: {$latest_order->id}\n";
echo "  - 订单号: {$latest_order->order_number}\n";
echo "  - 创建时间: {$latest_order->created_at}\n";
echo "  - 状态: {$latest_order->status}\n";
echo "  - 总金额: {$latest_order->total_amount}\n";

// 2. 模拟订单号生成逻辑对比
echo "\n2. 订单号生成逻辑对比:\n";

// 后端逻辑（现有）
function backend_generate_order_number() {
    $date_part = date('Ymd');
    $random_part = strtoupper(substr(md5(uniqid(rand(), true)), 0, 6)); 
    return 'ORD-' . $date_part . '-' . $random_part;
}

// 前端逻辑（修复前）
function frontend_old_generate_po_number() {
    $date = new DateTime();
    $year = $date->format('Y');
    $month = str_pad($date->format('n'), 2, '0', STR_PAD_LEFT);
    $day = str_pad($date->format('j'), 2, '0', STR_PAD_LEFT);
    $random = str_pad(strtoupper(dechex(mt_rand(0, 1048575))), 6, '0', STR_PAD_LEFT);
    return "PO-{$year}{$month}{$day}-{$random}";
}

// 前端逻辑（修复后）
function frontend_new_generate_order_number() {
    $date = new DateTime();
    $year = $date->format('Y');
    $month = str_pad($date->format('n'), 2, '0', STR_PAD_LEFT);
    $day = str_pad($date->format('j'), 2, '0', STR_PAD_LEFT);
    $randomString = strtoupper(substr(str_shuffle('0123456789ABCDEF'), 0, 6));
    return "ORD-{$year}{$month}{$day}-{$randomString}";
}

echo "  后端生成示例: " . backend_generate_order_number() . "\n";
echo "  前端旧逻辑: " . frontend_old_generate_po_number() . "\n";
echo "  前端新逻辑: " . frontend_new_generate_order_number() . "\n";

// 3. 验证订单号格式匹配
echo "\n3. 验证订单号格式:\n";
$pattern = '/^ORD-\d{8}-[A-F0-9]{6}$/';
$test_numbers = [
    $latest_order->order_number,
    backend_generate_order_number(),
    frontend_new_generate_order_number()
];

foreach ($test_numbers as $number) {
    $matches = preg_match($pattern, $number);
    $status = $matches ? '✅' : '❌';
    echo "  {$status} {$number} - " . ($matches ? '格式正确' : '格式错误') . "\n";
}

// 4. 模拟PO页面数据传递
echo "\n4. 模拟PO页面数据传递:\n";

// 模拟从订单列表页面传递给PO页面的数据
$po_data = [
    'orderId' => $latest_order->id,
    'orderNumber' => $latest_order->order_number, // 🔧 关键修复：传递真实订单号
    'orderItems' => [], // 简化，实际会包含订单项
    'customerInfo' => [
        'companyName' => 'Test Company',
        'contactName' => 'Test Contact',
        'address' => 'Test Address',
        'phone' => 'Test Phone',
        'email' => 'test@example.com'
    ],
    'shippingInfo' => [
        'address' => 'Shipping Address',
        'contactName' => 'Shipping Contact',
        'phone' => 'Shipping Phone',
        'notes' => 'Test Notes'
    ],
    'summary' => [
        'subtotal' => floatval($latest_order->total_amount),
        'shipping' => 0,
        'tax' => 0,
        'total' => floatval($latest_order->total_amount)
    ]
];

echo "✅ PO数据结构:\n";
echo "  - 订单ID: {$po_data['orderId']}\n";
echo "  - 订单号: {$po_data['orderNumber']}\n";
echo "  - 总金额: {$po_data['summary']['total']}\n";

// 5. 验证数据流完整性
echo "\n5. 数据流完整性验证:\n";

$flow_checks = [
    '数据库订单存在' => !empty($latest_order),
    '订单号格式正确' => preg_match($pattern, $latest_order->order_number),
    'PO数据包含订单号' => !empty($po_data['orderNumber']),
    '订单号匹配' => $po_data['orderNumber'] === $latest_order->order_number
];

foreach ($flow_checks as $check => $result) {
    $status = $result ? '✅' : '❌';
    echo "  {$status} {$check}\n";
}

echo "\n=== 测试完成 ===\n"; 