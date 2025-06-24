<?php
/**
 * 直接测试后端订单号生成逻辑
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wordpress/wp-load.php');

echo "=== 后端订单号生成测试 ===\n\n";

// 1. 直接测试订单控制器的生成方法
echo "1. 测试订单控制器的generate_order_number方法:\n";

// 加载订单控制器
require_once('plugins/bjt-core-entities/controllers/class-order-controller.php');

// 创建控制器实例
$order_controller = new BJT_Order_Controller();

// 使用反射来访问protected方法
$reflection = new ReflectionClass($order_controller);
$generate_method = $reflection->getMethod('generate_order_number');
$generate_method->setAccessible(true);

// 生成几个订单号进行测试
echo "生成的订单号:\n";
for ($i = 1; $i <= 5; $i++) {
    $order_number = $generate_method->invoke($order_controller);
    echo "  {$i}. {$order_number}\n";
    
    // 验证格式
    $po_pattern = '/^PO-\d{12}-[A-Z0-9]{6}$/';
    $ord_pattern = '/^ORD-\d{8}-[A-Z0-9]{6}$/';
    
    if (preg_match($po_pattern, $order_number)) {
        echo "     ✅ 符合PO格式 (正确)\n";
    } elseif (preg_match($ord_pattern, $order_number)) {
        echo "     ❌ 仍使用ORD格式 (需要修复)\n";
    } else {
        echo "     ⚠️ 格式不明 (未知)\n";
    }
    
    sleep(1); // 避免时间戳相同
}

echo "\n2. 检查数据库中最新的订单:\n";
global $wpdb;
$latest_orders = $wpdb->get_results(
    "SELECT id, order_number, created_at FROM {$wpdb->prefix}bjt_orders 
     ORDER BY created_at DESC LIMIT 3"
);

if (empty($latest_orders)) {
    echo "❌ 数据库中没有订单记录\n";
} else {
    echo "最新的订单记录:\n";
    foreach ($latest_orders as $order) {
        echo "  ID: {$order->id}, 订单号: {$order->order_number}, 创建时间: {$order->created_at}\n";
        
        // 验证格式
        $po_pattern = '/^PO-\d{12}-[A-Z0-9]{6}$/';
        $ord_pattern = '/^ORD-\d{8}-[A-Z0-9]{6}$/';
        
        if (preg_match($po_pattern, $order->order_number)) {
            echo "     ✅ 符合PO格式\n";
        } elseif (preg_match($ord_pattern, $order->order_number)) {
            echo "     ❌ 使用ORD格式\n";
        } else {
            echo "     ⚠️ 格式不明\n";
        }
    }
}

echo "\n3. 创建一个测试订单:\n";

// 准备测试数据
$test_data = [
    'customer_info' => [
        'name' => '测试用户',
        'email' => 'test@example.com',
        'phone' => '13800138000',
        'company' => '测试公司'
    ],
    'shipping_address' => [
        'country' => 'CN',
        'state' => '北京市',
        'city' => '北京市',
        'address' => '测试地址123号',
        'postal_code' => '100000'
    ],
    'billing_address' => [
        'country' => 'CN',
        'state' => '北京市',
        'city' => '北京市',
        'address' => '测试地址123号',
        'postal_code' => '100000'
    ],
    'payment_method' => 'bank_transfer',
    'items' => [
        [
            'item_id' => '90R01258',
            'item_type' => 'accessory',
            'quantity' => 1,
            'unit_price' => 100.00,
            'currency' => 'CNY',
            'name' => '测试配件',
            'target_id' => null
        ]
    ]
];

// 创建WP_REST_Request对象
$request = new WP_REST_Request('POST', '/wp-json/bjt/v1/orders');
$request->set_body(json_encode($test_data));
$request->set_header('Content-Type', 'application/json');

// 调用create_item方法
try {
    $response = $order_controller->create_item($request);
    
    if (is_wp_error($response)) {
        echo "❌ 创建订单失败: " . $response->get_error_message() . "\n";
    } else {
        $response_data = $response->get_data();
        $order_number = $response_data['data']['order_number'] ?? '未知';
        echo "✅ 测试订单创建成功！\n";
        echo "   订单号: {$order_number}\n";
        
        // 验证格式
        $po_pattern = '/^PO-\d{12}-[A-Z0-9]{6}$/';
        $ord_pattern = '/^ORD-\d{8}-[A-Z0-9]{6}$/';
        
        if (preg_match($po_pattern, $order_number)) {
            echo "   ✅ 符合PO格式 (正确)\n";
        } elseif (preg_match($ord_pattern, $order_number)) {
            echo "   ❌ 仍使用ORD格式 (需要修复)\n";
        } else {
            echo "   ⚠️ 格式不明\n";
        }
    }
} catch (Exception $e) {
    echo "❌ 创建订单异常: " . $e->getMessage() . "\n";
}

echo "\n=== 测试完成 ===\n";
?> 