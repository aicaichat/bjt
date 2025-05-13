<?php
/**
 * Plugin Name: BJT REST API Fix
 * Description: 修复WordPress REST API
 * Version: 1.0.0
 * Author: BJT Team
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 修复REST API
 */
function bjt_fix_rest_api() {
    // 检查是否是REST API请求
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
        // 这是REST API请求，强制设置适当的内容类型
        header('Content-Type: application/json; charset=utf-8');
        
        // 移除所有可能的输出缓冲
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        // 移除所有可能导致重定向的动作
        remove_all_actions('template_redirect');
    }
}

// 尽早添加钩子，以确保我们的函数最先运行
add_action('init', 'bjt_fix_rest_api', 1);

/**
 * 允许跨域请求，使前端可以访问WordPress API
 */
function bjt_add_cors_headers() {
    // 允许从前端访问
    header('Access-Control-Allow-Origin: *');
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