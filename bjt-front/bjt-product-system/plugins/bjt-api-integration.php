<?php
/**
 * Plugin Name: BJT API Integration
 * Description: 集成BJT API功能
 * Version: 1.0.0
 * Author: System Admin
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

// 引入BJT API Routes类
require_once ABSPATH . 'wp-content/plugins/bjt-product-admin/includes/class-bjt-api-routes.php';

/**
 * 初始化BJT API
 */
function bjt_api_integration_init() {
    // 注册REST API路由
    add_action('rest_api_init', 'bjt_api_integration_register_routes');
}
add_action('init', 'bjt_api_integration_init');

/**
 * 注册REST API路由
 */
function bjt_api_integration_register_routes() {
    // 获取BJT_API_Routes实例并注册路由
    if (class_exists('BJT_API_Routes')) {
        $api_routes = BJT_API_Routes::get_instance();
        $api_routes->register_routes();
        
        // 记录日志
        error_log('BJT API Routes registered successfully via integration plugin');
    } else {
        error_log('BJT_API_Routes class not found');
    }
} 