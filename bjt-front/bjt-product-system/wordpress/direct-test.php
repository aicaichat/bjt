<?php
/**
 * BJT WordPress直接测试脚本
 * 
 * 这个脚本直接加载WordPress核心文件并测试REST API
 */

// 包含WordPress配置文件
require_once(dirname(__FILE__) . '/wp-config.php');
require_once(ABSPATH . 'wp-load.php');

// 设置内容类型为JSON
header('Content-Type: application/json');

// 结果数组
$result = [
    'time' => current_time('mysql'),
    'rest_api' => [],
    'wordpress_info' => [],
    'database_info' => [],
    'test_api_endpoint' => []
];

// 收集WordPress信息
$result['wordpress_info'] = [
    'version' => get_bloginfo('version'),
    'url' => get_bloginfo('url'),
    'name' => get_bloginfo('name'),
    'rest_url' => rest_url(),
    'rest_prefix' => rest_get_url_prefix(),
    'environment_type' => wp_get_environment_type()
];

// 测试数据库连接
global $wpdb;

$result['database_info'] = [
    'db_name' => DB_NAME,
    'db_user' => DB_USER,
    'table_prefix' => $wpdb->prefix,
    'tables' => []
];

// 获取数据库表列表
$tables = $wpdb->get_results('SHOW TABLES', ARRAY_N);
if ($tables) {
    foreach ($tables as $table) {
        $result['database_info']['tables'][] = $table[0];
    }
}

// 在运行脚本中直接测试REST API
if (function_exists('register_rest_route')) {
    $result['rest_api']['route_function_exists'] = true;
} else {
    $result['rest_api']['route_function_exists'] = false;
}

// 测试注册一个新的路由
add_action('rest_api_init', function () use (&$result) {
    register_rest_route('bjt-direct-test/v1', '/ping', [
        'methods' => 'GET',
        'callback' => function () {
            return [
                'success' => true,
                'message' => 'Pong from BJT Direct Test',
                'time' => current_time('mysql')
            ];
        },
        'permission_callback' => function () {
            return true;
        }
    ]);
    
    $result['rest_api']['route_registered'] = true;
});

// 我们也可以通过WP_REST_Request直接测试REST API
$request = new WP_REST_Request('GET', '/bjt-direct-test/v1/ping');
$response = rest_do_request($request);

if (!is_wp_error($response)) {
    $result['test_api_endpoint'] = [
        'status' => $response->get_status(),
        'headers' => $response->get_headers(),
        'data' => $response->get_data()
    ];
} else {
    $result['test_api_endpoint'] = [
        'error' => $response->get_error_message()
    ];
}

// 输出结果
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES); 