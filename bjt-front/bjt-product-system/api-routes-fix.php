<?php
/**
 * BJT API Routes Fix
 * 
 * 注册必要的API路由
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

// 函数检查类是否已加载
function bjt_check_api_routes_class() {
    if (!class_exists('BJT_API_Routes')) {
        // 确保引入了必要的文件
        $class_file = ABSPATH . 'wp-content/plugins/bjt-product-admin/includes/class-bjt-api-routes.php';
        if (file_exists($class_file)) {
            require_once($class_file);
        } else {
            error_log('BJT API Routes class file not found: ' . $class_file);
            return false;
        }
    }
    return true;
}

// 注册API路由
add_action('rest_api_init', function() {
    if (bjt_check_api_routes_class()) {
        // 获取BJT_API_Routes实例并注册路由
        $api_routes = BJT_API_Routes::get_instance();
        $api_routes->register_routes();
        
        // 记录日志
        error_log('BJT API Routes registered successfully');
    }
}); 