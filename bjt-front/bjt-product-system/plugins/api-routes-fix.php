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

// 确保引入了必要的文件
require_once(ABSPATH . 'wp-content/plugins/bjt-product-admin/includes/class-bjt-api-routes.php');

// 注册API路由
add_action('rest_api_init', function() {
    // 获取BJT_API_Routes实例并注册路由
    $api_routes = BJT_API_Routes::get_instance();
    $api_routes->register_routes();
    
    // 记录日志
    error_log('BJT API Routes registered successfully');
}); 