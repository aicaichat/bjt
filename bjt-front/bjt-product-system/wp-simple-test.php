<?php
/**
 * WordPress REST API 简化测试脚本
 * 
 * 最小化依赖的API测试
 */

// 显示所有错误
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 加载WordPress配置
require_once(dirname(__FILE__) . '/wp-config.php');

// 确保是JSON响应
header('Content-Type: application/json; charset=utf-8');

// 定义REST请求常量
if (!defined('REST_REQUEST')) {
    define('REST_REQUEST', true);
}

// 添加CORS头
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');

// 如果是OPTIONS请求，直接返回200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 测试数据
$response = array(
    'success' => true,
    'message' => 'WordPress API测试成功',
    'time' => date('Y-m-d H:i:s'),
    'wordpress_info' => array(
        'db_name' => DB_NAME,
        'db_user' => DB_USER,
        'table_prefix' => isset($table_prefix) ? $table_prefix : 'wp_',
        'wp_debug' => defined('WP_DEBUG') ? WP_DEBUG : false
    ),
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'php_version' => phpversion(),
    'request_uri' => $_SERVER['REQUEST_URI'],
    'request_method' => $_SERVER['REQUEST_METHOD']
);

// 检查是否有问题
try {
    // 尝试连接数据库
    $dbh = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME,
        DB_USER,
        DB_PASSWORD
    );
    $response['database_connection'] = 'success';
    
    // 检查关键表
    $prefix = isset($table_prefix) ? $table_prefix : 'wp_';
    $tables = array(
        'options' => $prefix . 'options',
        'posts' => $prefix . 'posts',
        'users' => $prefix . 'users',
        'bjt_product_lines' => $prefix . 'bjt_product_lines',
        'bjt_host_models' => $prefix . 'bjt_host_models'
    );
    
    $table_status = array();
    foreach ($tables as $name => $table) {
        $stmt = $dbh->query("SHOW TABLES LIKE '{$table}'");
        $exists = ($stmt->rowCount() > 0);
        $table_status[$name] = $exists ? 'exists' : 'missing';
    }
    $response['tables'] = $table_status;
    
} catch (PDOException $e) {
    $response['success'] = false;
    $response['message'] = 'Database connection failed';
    $response['error'] = $e->getMessage();
}

// 输出JSON响应
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); 