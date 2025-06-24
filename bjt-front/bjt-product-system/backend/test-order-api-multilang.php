<?php
/**
 * 测试订单API多语言字段返回
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wp-load.php');

// 加载必要的类
require_once('wp-content/plugins/bjt-core-entities/controllers/class-order-controller.php');

echo "=== 订单API多语言字段测试 ===\n\n";

// 创建订单控制器实例
$controller = new BJT_Order_Controller();

// 模拟获取订单数据 (使用反射访问私有方法)
$reflection = new ReflectionClass($controller);
$method = $reflection->getMethod('get_order_object');
$method->setAccessible(true);

// 测试订单ID (根据实际情况调整)
$test_order_ids = [1, 2, 3]; // 测试多个订单

foreach ($test_order_ids as $order_id) {
    echo "--- 测试订单 ID: {$order_id} ---\n";
    
    try {
        $order = $method->invoke($controller, $order_id);
        
        if (is_object($order) && isset($order->items)) {
            echo "✅ 订单找到，包含 " . count($order->items) . " 个商品\n";
            
            foreach ($order->items as $index => $item) {
                echo "  商品 " . ($index + 1) . ":\n";
                echo "    - 料号: " . ($item->item_id ?? 'N/A') . "\n";
                echo "    - 类型: " . ($item->item_type ?? 'N/A') . "\n";
                echo "    - 名称: " . ($item->item_name ?? 'N/A') . "\n";
                echo "    - 中文名: " . ($item->name_zh ?? 'N/A') . "\n";
                echo "    - 英文名: " . ($item->name_en ?? 'N/A') . "\n";
                echo "    - 型号: " . ($item->model ?? 'N/A') . "\n";
                echo "    - 品牌: " . ($item->brand ?? 'N/A') . "\n";
                echo "    - 规格: " . ($item->spec ?? 'N/A') . "\n";
                echo "\n";
            }
        } else {
            echo "❌ 订单未找到或格式错误\n";
        }
    } catch (Exception $e) {
        echo "❌ 错误: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

echo "=== 测试完成 ===\n";
?> 