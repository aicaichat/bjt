<?php
/**
 * 清除各种缓存的脚本
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once('wordpress/wp-load.php');

echo "=== 清除缓存脚本 ===\n\n";

// 1. 清除OpCache
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "✅ OpCache 已清除\n";
    } else {
        echo "❌ OpCache 清除失败\n";
    }
} else {
    echo "ℹ️ OpCache 未启用\n";
}

// 2. 清除WordPress对象缓存
if (function_exists('wp_cache_flush')) {
    if (wp_cache_flush()) {
        echo "✅ WordPress 对象缓存已清除\n";
    } else {
        echo "❌ WordPress 对象缓存清除失败\n";
    }
} else {
    echo "ℹ️ WordPress 对象缓存未启用\n";
}

// 3. 清除WordPress transients
global $wpdb;
$deleted = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
echo "✅ 清除了 {$deleted} 个 WordPress transients\n";

// 4. 强制重新加载插件
if (function_exists('deactivate_plugins') && function_exists('activate_plugins')) {
    $plugin_file = 'bjt-core-entities/bjt-product-api.php';
    
    // 检查插件是否激活
    if (is_plugin_active($plugin_file)) {
        echo "🔄 重新加载 BJT Core Entities 插件...\n";
        
        // 停用插件
        deactivate_plugins($plugin_file, true);
        echo "✅ 插件已停用\n";
        
        // 重新激活插件
        activate_plugins($plugin_file);
        echo "✅ 插件已重新激活\n";
    } else {
        echo "ℹ️ BJT Core Entities 插件未激活\n";
    }
}

// 5. 测试当前的订单号生成
echo "\n🧪 测试当前订单号生成:\n";

// 加载订单控制器
require_once('plugins/bjt-core-entities/controllers/class-order-controller.php');

try {
    $order_controller = new BJT_Order_Controller();
    
    // 使用反射来访问protected方法
    $reflection = new ReflectionClass($order_controller);
    $generate_method = $reflection->getMethod('generate_order_number');
    $generate_method->setAccessible(true);
    
    // 生成测试订单号
    $test_order_number = $generate_method->invoke($order_controller);
    echo "📝 生成的订单号: {$test_order_number}\n";
    
    // 验证格式
    $po_pattern = '/^PO-\d{12}-[A-Z0-9]{6}$/';
    $ord_pattern = '/^ORD-\d{8}-[A-Z0-9]{6}$/';
    
    if (preg_match($po_pattern, $test_order_number)) {
        echo "✅ 订单号符合PO格式 (正确)\n";
    } elseif (preg_match($ord_pattern, $test_order_number)) {
        echo "❌ 订单号仍使用ORD格式 (缓存未清除)\n";
    } else {
        echo "⚠️ 订单号格式未知\n";
    }
    
} catch (Exception $e) {
    echo "❌ 测试订单号生成失败: " . $e->getMessage() . "\n";
}

echo "\n=== 缓存清除完成 ===\n";
echo "💡 建议:\n";
echo "1. 重启Web服务器 (Apache/Nginx)\n";
echo "2. 重启PHP-FPM (如果使用)\n";
echo "3. 清除浏览器缓存\n";
echo "4. 测试API端点\n";
?> 