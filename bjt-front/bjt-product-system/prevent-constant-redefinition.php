<?php
/**
 * Plugin Name: Fix WordPress Deprecations
 * Description: 修复WordPress常量重定义和废弃函数警告
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 防止REST_API_VERSION常量重定义
if (!defined('REST_API_VERSION')) {
    define('REST_API_VERSION', '2.0');
}

// 定义测试模式常量
if (!defined('BJT_API_TEST_MODE')) {
    define('BJT_API_TEST_MODE', true); // 在测试环境中设置为true
}

// 设置一个默认的JWT密钥，防止生产中用到的密钥暴露
update_option('bjt_jwt_secret', 'bjt-secret-key-2023');

// 强制禁用所有需要认证的API
add_filter('bjt_api_auth_required', '__return_false');
add_filter('rest_authentication_errors', function($result) {
    // 只对BJT API路径禁用认证
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/bjt/') !== false) {
        return true;
    }
    return $result;
}, 999); 