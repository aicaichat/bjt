<?php
/**
 * 检查数据库中订单的运输信息
 */

// 加载WordPress环境
require_once __DIR__ . '/wordpress/wp-config.php';

global $wpdb;

echo "🔍 检查数据库中的订单运输信息\n";
echo "=====================================\n\n";

// 检查订单表结构
$table_name = $wpdb->prefix . 'bjt_orders';
echo "📋 订单表名: {$table_name}\n";

// 检查表是否存在
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_name}'");
if (!$table_exists) {
    echo "❌ 错误：订单表不存在！\n";
    exit(1);
}

echo "✅ 订单表存在\n\n";

// 检查表结构中的运输信息字段
echo "🔍 检查表结构中的运输信息字段:\n";
$columns = $wpdb->get_results("DESCRIBE {$table_name}");
$shipping_fields = [];
foreach ($columns as $column) {
    if (strpos($column->Field, 'shipping') !== false || strpos($column->Field, 'billing') !== false) {
        $shipping_fields[] = $column;
        echo "  - {$column->Field}: {$column->Type} (允许NULL: {$column->Null})\n";
    }
}

if (empty($shipping_fields)) {
    echo "❌ 表结构中没有运输信息字段！\n";
    exit(1);
}

echo "\n";

// 检查订单数据
echo "📊 检查订单数据:\n";
$total_orders = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
echo "总订单数: {$total_orders}\n";

if ($total_orders == 0) {
    echo "❌ 数据库中没有订单数据！\n";
    exit(1);
}

// 检查有运输信息的订单
$orders_with_shipping = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name} WHERE shipping_address IS NOT NULL AND shipping_address != ''");
echo "有运输信息的订单数: {$orders_with_shipping}\n";

$orders_with_billing = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name} WHERE billing_address IS NOT NULL AND billing_address != ''");
echo "有账单信息的订单数: {$orders_with_billing}\n\n";

// 显示前几个订单的详细信息
echo "🔍 前5个订单的运输信息详情:\n";
echo "=====================================\n";

$orders = $wpdb->get_results("SELECT id, order_number, shipping_address, billing_address FROM {$table_name} ORDER BY id DESC LIMIT 5");

foreach ($orders as $order) {
    echo "订单 #{$order->id} ({$order->order_number}):\n";
    echo "  - shipping_address: " . ($order->shipping_address ? "有数据 (" . strlen($order->shipping_address) . " 字符)" : "❌ 空") . "\n";
    echo "  - billing_address: " . ($order->billing_address ? "有数据 (" . strlen($order->billing_address) . " 字符)" : "❌ 空") . "\n";
    
    if ($order->shipping_address) {
        echo "  - shipping_address 内容预览: " . substr($order->shipping_address, 0, 100) . "...\n";
        
        // 尝试解析JSON
        $shipping_data = json_decode($order->shipping_address, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "  ✅ shipping_address 是有效的JSON格式\n";
            echo "  - JSON字段: " . implode(', ', array_keys($shipping_data)) . "\n";
        } else {
            echo "  ⚠️ shipping_address 不是JSON格式\n";
        }
    }
    
    echo "\n";
}

// 检查API能否正确返回数据
echo "🧪 测试API数据获取:\n";
echo "=====================================\n";

// 模拟API控制器的数据获取逻辑
$test_order = $wpdb->get_row("SELECT * FROM {$table_name} ORDER BY id DESC LIMIT 1");
if ($test_order) {
    echo "测试订单 #{$test_order->id}:\n";
    echo "  - 原始 shipping_address: " . ($test_order->shipping_address ?: '❌ 空') . "\n";
    
    // 模拟prepare_item_for_response的逻辑
    if (!empty($test_order->shipping_address) && is_string($test_order->shipping_address)) {
        $decoded = json_decode($test_order->shipping_address, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "  ✅ JSON解析成功\n";
            echo "  - 解析后的数据: " . json_encode($decoded, JSON_UNESCAPED_UNICODE) . "\n";
        } else {
            echo "  ❌ JSON解析失败: " . json_last_error_msg() . "\n";
        }
    } else {
        echo "  ❌ 运输信息为空，API不会返回此字段\n";
    }
} else {
    echo "❌ 无法获取测试订单\n";
}

echo "\n📝 结论:\n";
echo "=====================================\n";
if ($orders_with_shipping > 0) {
    echo "✅ 数据库中有运输信息，问题可能在API处理逻辑\n";
} else {
    echo "❌ 数据库中没有运输信息，需要检查订单创建逻辑\n";
    echo "建议检查:\n";
    echo "1. 订单创建时是否正确保存运输信息\n";
    echo "2. 前端提交的数据格式是否正确\n";
    echo "3. 后端接收和处理逻辑是否有问题\n";
} 