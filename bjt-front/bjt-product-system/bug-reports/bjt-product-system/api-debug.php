<?php
/**
 * API调试文件
 * 
 * 直接访问: http://localhost:8080/wp-content/plugins/bjt-product-system/api-debug.php
 */

// 加载WordPress环境以访问其函数和数据
$wordpress_path = dirname(dirname(dirname(__FILE__)));
require_once($wordpress_path . '/wp-load.php');

// 允许跨域访问
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// 检查WP REST API是否启用
$rest_enabled = true;
$rest_url = get_rest_url();
$permalink_structure = get_option('permalink_structure');
$rewrite_rules = get_option('rewrite_rules');
$active_plugins = get_option('active_plugins');

// 测试数据库连接
global $wpdb;
$db_status = array(
    'connection' => false,
    'tables' => array(),
    'error' => ''
);

try {
    if ($wpdb->check_connection()) {
        $db_status['connection'] = true;
        
        // 检查插件表是否存在
        $tables = array(
            'product_lines' => $wpdb->prefix . 'bjt_product_lines',
            'host_models' => $wpdb->prefix . 'bjt_host_models',
            'accessories' => $wpdb->prefix . 'bjt_accessories',
        );
        
        foreach ($tables as $key => $table) {
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") == $table;
            $db_status['tables'][$key] = $exists;
        }
    }
} catch (Exception $e) {
    $db_status['error'] = $e->getMessage();
}

// 测试REST API路由注册
$all_rest_routes = array();
if (function_exists('rest_get_server')) {
    $wp_rest_server = rest_get_server();
    $all_routes = $wp_rest_server->get_routes();
    foreach ($all_routes as $route => $handlers) {
        if (strpos($route, 'bjt/v1') !== false) {
            $all_rest_routes[$route] = array(
                'methods' => array_keys((array)$handlers[0]['methods']),
                'permission_callback' => get_class($handlers[0]['permission_callback'][0]) . '::' . $handlers[0]['permission_callback'][1],
            );
        }
    }
}

// 基本环境信息
$info = array(
    'success' => true,
    'wordpress_version' => $GLOBALS['wp_version'] ?? get_bloginfo('version'),
    'php_version' => PHP_VERSION,
    'time' => date('Y-m-d H:i:s'),
    'api_base_url' => get_rest_url(null, 'bjt/v1'),
    'api_endpoints' => array(
        'auth' => '/auth/login',
        'product_lines' => '/product-lines',
        'test' => '/test',
        'host_models' => '/host-models',
        'accessories' => '/accessories',
        'consumables' => '/consumables',
        'spare_parts' => '/spare-parts'
    ),
    'rest_api_status' => array(
        'enabled' => $rest_enabled,
        'rest_url' => $rest_url,
        'permalink_structure' => $permalink_structure,
        'rewrite_rules_count' => is_array($rewrite_rules) ? count($rewrite_rules) : 0,
        'active_plugins' => $active_plugins,
        'registered_bjt_routes' => $all_rest_routes,
    ),
    'database_status' => $db_status,
    'message' => '如果您能看到此消息，说明PHP环境正常。请尝试直接访问API端点以测试REST API功能。',
    'server_info' => array(
        'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'unknown',
    )
);

// 测试特定REST API路由
$test_routes = array(
    'wordpress_root' => get_rest_url(),
    'bjt_test' => get_rest_url(null, 'bjt/v1/test'),
    'bjt_product_lines' => get_rest_url(null, 'bjt/v1/product-lines'),
);

$route_tests = array();
foreach ($test_routes as $name => $url) {
    $response = wp_remote_get($url, array('timeout' => 5));
    $route_tests[$name] = array(
        'url' => $url,
        'success' => !is_wp_error($response),
        'status_code' => is_wp_error($response) ? 0 : wp_remote_retrieve_response_code($response),
        'error' => is_wp_error($response) ? $response->get_error_message() : ''
    );
}

$info['route_tests'] = $route_tests;

echo json_encode($info, JSON_PRETTY_PRINT); 