<?php
/**
 * Plugin Name: API Routes Loader
 * Description: 加载API路由修复
 * Version: 1.0.0
 * Author: System Admin
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

// 加载API路由修复
$api_routes_fix_file = ABSPATH . 'wp-content/plugins/api-routes-fix.php';
if (file_exists($api_routes_fix_file)) {
    require_once($api_routes_fix_file);
} else {
    error_log('API Routes Fix file not found: ' . $api_routes_fix_file);
} 