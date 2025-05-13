<?php
/**
 * BJT Frontend Redirect functions and definitions
 *
 * @package BJT_Frontend_Redirect
 */

// 禁止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 重定向到前端应用
 */
function bjt_redirect_to_frontend() {
    // 不要重定向管理员区域、登录页面、API请求和REST API请求
    if (is_admin() || 
        strpos($_SERVER['REQUEST_URI'], '/wp-login.php') !== false ||
        strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false ||
        strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
        return;
    }
    
    // 设置重定向到React前端应用
    $frontend_url = 'http://localhost:5173';
    
    // 执行重定向
    wp_redirect($frontend_url);
    exit;
}

// 添加到WordPress的init钩子
add_action('template_redirect', 'bjt_redirect_to_frontend');

/**
 * 允许跨域请求，使前端可以访问WordPress API
 */
function bjt_theme_add_cors_headers() {
    // 允许从前端访问
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 如果是预检请求，直接返回
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }
}

// 添加到WordPress的send_headers钩子
add_action('send_headers', 'bjt_add_cors_headers'); 