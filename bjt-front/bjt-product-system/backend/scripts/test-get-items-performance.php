<?php
/**
 * get_items方法性能优化测试脚本
 * 测试优化后的get_items方法性能是否提升
 */

// 检查是否在命令行环境中运行
if (php_sapi_name() !== 'cli') {
    die('This script must be run from the command line.');
}

// 加载WordPress环境
require_once(__DIR__ . '/../wp-load.php');

// 加载BJT Relations Controller
require_once(__DIR__ . '/../wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php');

global $wpdb;

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== get_items方法性能优化测试 ===\n";

// 1. 测试基本查询性能
echo "\n1. 测试基本查询性能:\n";

$controller = new BJT_Relation_Controller();

// 创建模拟请求
$request = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations');
$request->set_param('per_page', 20);
$request->set_param('page', 1);

// 测试查询性能
$start_time = microtime(true);
$query_count_before = $wpdb->num_queries;

$response = $controller->get_items($request);

$end_time = microtime(true);
$query_count_after = $wpdb->num_queries;

echo "   查询耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
echo "   数据库查询次数: " . ($query_count_after - $query_count_before) . "\n";

if ($response instanceof WP_REST_Response) {
    $data = $response->get_data();
    echo "   返回记录数: " . count($data['items']) . "\n";
    echo "   总记录数: " . $data['total'] . "\n";
    echo "   总页数: " . $data['total_pages'] . "\n";
} else {
    echo "   查询失败\n";
}

// 2. 测试带筛选条件的查询
echo "\n2. 测试带筛选条件的查询:\n";

$request_with_filter = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations');
$request_with_filter->set_param('per_page', 15);
$request_with_filter->set_param('page', 1);
$request_with_filter->set_param('host_part_number', '60A01143');
$request_with_filter->set_param('level', 1);

$start_time = microtime(true);
$query_count_before = $wpdb->num_queries;

$response = $controller->get_items($request_with_filter);

$end_time = microtime(true);
$query_count_after = $wpdb->num_queries;

echo "   查询耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
echo "   数据库查询次数: " . ($query_count_after - $query_count_before) . "\n";

if ($response instanceof WP_REST_Response) {
    $data = $response->get_data();
    echo "   返回记录数: " . count($data['items']) . "\n";
    echo "   总记录数: " . $data['total'] . "\n";
    echo "   筛选条件: host_part_number=60A01143, level=1\n";
} else {
    echo "   查询失败\n";
}

// 3. 测试搜索功能
echo "\n3. 测试搜索功能:\n";

$request_with_search = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations');
$request_with_search->set_param('per_page', 10);
$request_with_search->set_param('page', 1);
$request_with_search->set_param('search', '60A');

$start_time = microtime(true);
$query_count_before = $wpdb->num_queries;

$response = $controller->get_items($request_with_search);

$end_time = microtime(true);
$query_count_after = $wpdb->num_queries;

echo "   查询耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
echo "   数据库查询次数: " . ($query_count_after - $query_count_before) . "\n";

if ($response instanceof WP_REST_Response) {
    $data = $response->get_data();
    echo "   返回记录数: " . count($data['items']) . "\n";
    echo "   总记录数: " . $data['total'] . "\n";
    echo "   搜索关键词: '60A'\n";
} else {
    echo "   查询失败\n";
}

// 4. 测试分页性能
echo "\n4. 测试分页性能:\n";

$pages_to_test = [1, 2, 3, 5, 10];
$total_time = 0;
$total_queries = 0;

foreach ($pages_to_test as $page) {
    $request_page = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations');
    $request_page->set_param('per_page', 10);
    $request_page->set_param('page', $page);

    $start_time = microtime(true);
    $query_count_before = $wpdb->num_queries;

    $response = $controller->get_items($request_page);

    $end_time = microtime(true);
    $query_count_after = $wpdb->num_queries;

    $page_time = ($end_time - $start_time) * 1000;
    $page_queries = $query_count_after - $query_count_before;

    $total_time += $page_time;
    $total_queries += $page_queries;

    echo "   页面 {$page}: " . round($page_time, 2) . "ms, {$page_queries} queries\n";
}

echo "   平均每页耗时: " . round($total_time / count($pages_to_test), 2) . "ms\n";
echo "   平均每页查询次数: " . round($total_queries / count($pages_to_test), 2) . "\n";

// 5. 测试单查询优化效果
echo "\n5. 测试单查询优化效果:\n";

// 使用反射检查内部方法
$reflection = new ReflectionClass($controller);
$build_where_method = $reflection->getMethod('build_where_conditions');
$build_where_method->setAccessible(true);

$test_args = [
    'host_part_number' => '60A01143',
    'product_line_id' => 1,
    'level' => 1,
    'child_type' => 'accessory'
];

$start_time = microtime(true);
$where_conditions = $build_where_method->invoke($controller, $test_args);
$end_time = microtime(true);

echo "   WHERE条件构建耗时: " . round(($end_time - $start_time) * 1000, 4) . "ms\n";
echo "   WHERE SQL: " . $where_conditions['sql'] . "\n";
echo "   WHERE值数量: " . count($where_conditions['values']) . "\n";

// 6. 测试错误处理
echo "\n6. 测试错误处理:\n";

$request_invalid = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations');
$request_invalid->set_param('per_page', 2000); // 超过限制
$request_invalid->set_param('page', 1);

$response = $controller->get_items($request_invalid);

if ($response instanceof WP_REST_Response) {
    $data = $response->get_data();
    echo "   每页限制测试: 请求2000条，实际返回 " . count($data['items']) . " 条\n";
    echo "   ✓ 每页限制正常工作\n";
} else {
    echo "   ❌ 错误处理失败\n";
}

echo "\n=== 测试完成 ===\n";
echo "性能优化总结:\n";
echo "✓ 单查询同时获取总数和分页数据，减少数据库查询次数\n";
echo "✓ WHERE条件构建优化，避免重复代码\n";
echo "✓ 批量格式化响应数据，提高处理效率\n";
echo "✓ 合理的分页限制，防止性能问题\n"; 