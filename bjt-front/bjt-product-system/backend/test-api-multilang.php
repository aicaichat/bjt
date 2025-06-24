<?php
/**
 * 测试API多语言字段返回
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wp-load.php');

echo "=== API多语言字段测试 ===\n\n";

// 模拟API请求
$request = new WP_REST_Request('GET', '/wp-json/bjt/v1/orders/');
$request->set_param('lang', 'en');

// 获取订单控制器
$controller = new BJT_Order_Controller();

// 获取订单列表
$response = $controller->get_items($request);

if (is_wp_error($response)) {
    echo "❌ API请求失败: " . $response->get_error_message() . "\n";
    exit;
}

$orders = $response->get_data();

if (empty($orders)) {
    echo "❌ 没有找到订单\n";
    exit;
}

echo "✅ 找到 " . count($orders) . " 个订单\n\n";

// 检查所有订单的商品
foreach ($orders as $order) {
    echo "检查订单 {$order['id']}, 商品数量: " . (isset($order['items']) ? count($order['items']) : '0') . "\n";
    
    if (!empty($order['items'])) {
        echo "--- 检查订单 {$order['id']} ---\n";
        
        foreach ($order['items'] as $idx => $item) {
            echo "商品 {$idx}:\n";
            echo "  - item_id: {$item['item_id']}\n";
            echo "  - item_name: {$item['item_name']}\n";
            echo "  - name_zh: " . (isset($item['name_zh']) ? $item['name_zh'] : '❌ 缺失') . "\n";
            echo "  - name_en: " . (isset($item['name_en']) ? $item['name_en'] : '❌ 缺失') . "\n";
            echo "  - item_type: {$item['item_type']}\n";
            echo "  - model: {$item['model']}\n";
            echo "  - 所有字段: " . implode(', ', array_keys($item)) . "\n";
            echo "\n";
        }
        
        break; // 只检查第一个有商品的订单
    }
}

echo "=== 测试完成 ===\n"; 