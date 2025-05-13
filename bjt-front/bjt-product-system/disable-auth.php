<?php
/**
 * Plugin Name: BJT Temp Disable Auth
 * Description: 临时禁用API认证检查用于测试
 * Version: 1.1
 */

// 尝试所有可能的过滤器名称
add_filter('bjt_api_auth_required', '__return_false');
add_filter('bjt_check_authentication', '__return_true');
add_filter('bjt_api_check_authentication', '__return_true');
add_filter('rest_authentication_errors', function($result) {
    // 只对BJT API路径禁用认证
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/bjt/') !== false) {
        return true; // 允许访问
    }
    return $result;
}, 999);

// 在调试模式下记录API请求
add_action('rest_api_init', function() {
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/bjt/') !== false) {
        error_log('BJT API Request: ' . $_SERVER['REQUEST_URI']);
    }
});

// 强制设置JWT密钥（如果尚未设置）
if (!get_option('bjt_jwt_secret')) {
    update_option('bjt_jwt_secret', 'bjt-secret-key-2023');
} 