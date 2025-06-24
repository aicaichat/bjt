<?php
/**
 * 检查Order是否在数据库中创建成功
 * 运行方式: php scripts/check-order-creation.php
 */

// 检查当前目录是否包含WordPress核心文件
if (file_exists('./backend/wp-config.php')) {
    // 从backend目录加载WordPress
    define('WP_USE_THEMES', false);
    require_once('./backend/wp-config.php');
    require_once('./backend/wp-load.php');
} elseif (file_exists('./wp-config.php')) {
    // 从当前目录加载WordPress
    define('WP_USE_THEMES', false);
    require_once('./wp-config.php');
    require_once('./wp-load.php');
} else {
    echo "错误: 找不到WordPress配置文件\n";
    echo "请确保在项目根目录下运行此脚本\n";
    exit(1);
}

echo "=== BJT订单数据库检查工具 ===\n\n";

global $wpdb;

// 1. 检查订单表是否存在
$order_table = $wpdb->prefix . 'bjt_orders';
$order_items_table = $wpdb->prefix . 'bjt_order_items';

echo "1. 检查数据库表结构...\n";

$tables_exist = [];
$tables_to_check = [
    'bjt_orders' => $order_table,
    'bjt_order_items' => $order_items_table
];

foreach ($tables_to_check as $table_name => $full_table_name) {
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$full_table_name'");
    $tables_exist[$table_name] = $table_exists === $full_table_name;
    
    if ($tables_exist[$table_name]) {
        echo "   ✓ 表 {$full_table_name} 存在\n";
    } else {
        echo "   ✗ 表 {$full_table_name} 不存在\n";
    }
}

// 2. 检查订单数据
if ($tables_exist['bjt_orders']) {
    echo "\n2. 检查订单数据...\n";
    
    // 获取订单总数
    $total_orders = $wpdb->get_var("SELECT COUNT(*) FROM {$order_table}");
    echo "   订单总数: {$total_orders}\n";
    
    if ($total_orders > 0) {
        // 获取最近的10个订单
        $recent_orders = $wpdb->get_results("
            SELECT id, order_number, user_id, status, total_amount, currency, created_at 
            FROM {$order_table} 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        
        echo "\n   最近的订单:\n";
        printf("   %-5s %-20s %-8s %-15s %-12s %-8s %-20s\n", 
               'ID', '订单号', '用户ID', '状态', '总金额', '货币', '创建时间');
        echo "   " . str_repeat('-', 90) . "\n";
        
        foreach ($recent_orders as $order) {
            printf("   %-5s %-20s %-8s %-15s %-12s %-8s %-20s\n",
                   $order->id,
                   $order->order_number,
                   $order->user_id,
                   $order->status,
                   $order->total_amount,
                   $order->currency,
                   $order->created_at
            );
        }
        
        // 检查订单状态分布
        echo "\n   订单状态分布:\n";
        $status_counts = $wpdb->get_results("
            SELECT status, COUNT(*) as count 
            FROM {$order_table} 
            GROUP BY status 
            ORDER BY count DESC
        ");
        
        foreach ($status_counts as $status) {
            echo "   - {$status->status}: {$status->count} 个订单\n";
        }
    }
}

// 3. 检查订单项数据
if ($tables_exist['bjt_order_items']) {
    echo "\n3. 检查订单项数据...\n";
    
    $total_items = $wpdb->get_var("SELECT COUNT(*) FROM {$order_items_table}");
    echo "   订单项总数: {$total_items}\n";
    
    if ($total_items > 0) {
        // 获取最近的订单项
        $recent_items = $wpdb->get_results("
            SELECT oi.id, oi.order_id, oi.item_name, oi.item_id, oi.quantity, oi.price, oi.currency, o.order_number
            FROM {$order_items_table} oi
            LEFT JOIN {$order_table} o ON oi.order_id = o.id
            ORDER BY oi.created_at DESC 
            LIMIT 10
        ");
        
        echo "\n   最近的订单项:\n";
        printf("   %-5s %-8s %-20s %-30s %-15s %-8s %-10s %-8s\n", 
               'ID', '订单ID', '订单号', '商品名称', '商品编号', '数量', '单价', '货币');
        echo "   " . str_repeat('-', 120) . "\n";
        
        foreach ($recent_items as $item) {
            printf("   %-5s %-8s %-20s %-30s %-15s %-8s %-10s %-8s\n",
                   $item->id,
                   $item->order_id,
                   $item->order_number ?: 'N/A',
                   substr($item->item_name ?: 'N/A', 0, 30),
                   $item->item_id ?: 'N/A',
                   $item->quantity,
                   $item->price,
                   $item->currency
            );
        }
    }
}

// 4. 检查API端点是否可用
echo "\n4. 检查API端点...\n";

// 检查REST API是否启用
if (function_exists('rest_get_url_prefix')) {
    $rest_prefix = rest_get_url_prefix();
    echo "   ✓ WordPress REST API 已启用 (前缀: {$rest_prefix})\n";
    
    // 检查BJT API路由是否注册
    $routes = rest_get_server()->get_routes();
    $bjt_routes = array_filter(array_keys($routes), function($route) {
        return strpos($route, '/bjt/v1/orders') !== false;
    });
    
    if (!empty($bjt_routes)) {
        echo "   ✓ BJT订单API路由已注册:\n";
        foreach ($bjt_routes as $route) {
            echo "     - {$route}\n";
        }
    } else {
        echo "   ✗ BJT订单API路由未找到\n";
        echo "   请确保BJT插件已激活\n";
    }
} else {
    echo "   ✗ WordPress REST API 未启用\n";
}

// 5. 检查最新的错误日志
echo "\n5. 检查PHP错误日志...\n";

$error_log_paths = [
    ini_get('error_log'),
    '/var/log/php_errors.log',
    './backend/wp-content/debug.log',
    './wp-content/debug.log'
];

$found_log = false;
foreach ($error_log_paths as $log_path) {
    if ($log_path && file_exists($log_path) && is_readable($log_path)) {
        $found_log = true;
        echo "   检查日志文件: {$log_path}\n";
        
        // 获取最后50行
        $lines = file($log_path);
        if ($lines) {
            $recent_lines = array_slice($lines, -50);
            $order_related = array_filter($recent_lines, function($line) {
                return stripos($line, 'order') !== false || stripos($line, 'bjt') !== false;
            });
            
            if (!empty($order_related)) {
                echo "   最近的订单相关日志:\n";
                foreach (array_slice($order_related, -10) as $line) {
                    echo "   " . trim($line) . "\n";
                }
            } else {
                echo "   未找到最近的订单相关错误日志\n";
            }
        }
        break;
    }
}

if (!$found_log) {
    echo "   未找到可读的错误日志文件\n";
}

// 6. 数据库连接测试
echo "\n6. 数据库连接测试...\n";

$db_test = $wpdb->get_var("SELECT 1");
if ($db_test == 1) {
    echo "   ✓ 数据库连接正常\n";
    echo "   数据库: " . $wpdb->dbname . "\n";
    echo "   前缀: " . $wpdb->prefix . "\n";
} else {
    echo "   ✗ 数据库连接异常\n";
    if ($wpdb->last_error) {
        echo "   错误: " . $wpdb->last_error . "\n";
    }
}

echo "\n=== 检查完成 ===\n";

// 如果是命令行运行，提供一些建议
if (php_sapi_name() === 'cli') {
    echo "\n建议的下一步操作:\n";
    
    if (!$tables_exist['bjt_orders']) {
        echo "1. 运行数据库迁移脚本创建订单表\n";
        echo "2. 确保BJT插件已正确激活\n";
    }
    
    if ($total_orders == 0) {
        echo "3. 测试订单创建API:\n";
        echo "   curl -X POST http://localhost/wp-json/bjt/v1/orders \\\n";
        echo "        -H 'Content-Type: application/json' \\\n";
        echo "        -d '{\"items\":[{\"part_number\":\"TEST-001\",\"quantity\":1,\"product_type\":\"accessory\"}]}'\n";
    }
    
    echo "4. 查看实时日志: tail -f " . (ini_get('error_log') ?: '/var/log/php_errors.log') . "\n";
}
?> 