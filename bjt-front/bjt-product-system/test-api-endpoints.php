<?php
/**
 * 测试API端点
 * 
 * 一个独立的脚本，用于测试WordPress REST API端点
 */

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 基础URL
$base_url = 'http://127.0.0.1:80/wp-json';

// API端点定义
$api_endpoints = [
    [
        'name' => 'WordPress核心API',
        'endpoint' => '/wp/v2',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'WordPress站点信息',
        'endpoint' => '/',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'BJT测试API',
        'endpoint' => '/bjt-test/v1/test',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => '产品线API',
        'endpoint' => '/wp/v2/bjt_product_lines',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
];

// 测试结果
$total_tests = 0;
$passed_tests = 0;
$failed_tests = 0;

/**
 * 发送API请求
 */
function make_api_request($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // 获取内容类型
    $content_type = '';
    if (preg_match('/Content-Type: (.*?)(\r\n|\n)/i', $header, $matches)) {
        $content_type = trim($matches[1]);
    }
    
    curl_close($ch);
    
    return [
        'status_code' => $status_code,
        'content_type' => $content_type,
        'header' => $header,
        'body' => $body
    ];
}

/**
 * 运行API测试
 */
function run_api_test($base_url, $endpoint_data) {
    global $total_tests, $passed_tests, $failed_tests;
    
    $total_tests++;
    
    $name = $endpoint_data['name'];
    $endpoint = $endpoint_data['endpoint'];
    $method = $endpoint_data['method'];
    $expected_status = $endpoint_data['expected_status'];
    $expected_content_type = $endpoint_data['expected_content_type'];
    
    $url = $base_url . $endpoint;
    
    echo "测试 {$name}...\n";
    echo "  URL: {$url}\n";
    
    $response = make_api_request($url, $method);
    
    $status_match = $response['status_code'] === $expected_status;
    $content_type_match = strpos($response['content_type'], $expected_content_type) !== false;
    
    $success = $status_match && $content_type_match;
    
    if ($success) {
        $passed_tests++;
        echo "  结果: 成功 ✅\n";
    } else {
        $failed_tests++;
        echo "  结果: 失败 ❌\n";
        echo "    状态码: {$response['status_code']} (预期: {$expected_status})\n";
        echo "    内容类型: {$response['content_type']} (预期包含: {$expected_content_type})\n";
    }
    
    echo "  响应: " . (strlen($response['body']) > 100 ? substr($response['body'], 0, 100) . "..." : $response['body']) . "\n\n";
    
    return [
        'name' => $name,
        'url' => $url,
        'success' => $success,
        'status' => $response['status_code'],
        'expected_status' => $expected_status,
        'content_type' => $response['content_type'],
        'expected_content_type' => $expected_content_type,
        'response' => $response['body']
    ];
}

// 打印测试标题
echo "==================================================\n";
echo "WordPress REST API 测试\n";
echo "开始时间: " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n\n";

// 运行所有测试
$results = [];

foreach ($api_endpoints as $endpoint_data) {
    $results[] = run_api_test($base_url, $endpoint_data);
}

// 打印测试总结
echo "==================================================\n";
echo "测试结果总结\n";
echo "==================================================\n";
echo "总测试数: {$total_tests}\n";
echo "通过测试: {$passed_tests}\n";
echo "失败测试: {$failed_tests}\n";
echo "成功率: " . round(($passed_tests / $total_tests) * 100, 1) . "%\n";
echo "完成时间: " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n"; 