<?php
/**
 * 最终API测试脚本
 * 测试BJT业务API
 */

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 基础URL
$base_url = 'http://127.0.0.1:80/wp-json';

// API端点定义
$api_endpoints = [
    [
        'name' => 'WordPress站点信息',
        'endpoint' => '/',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'WordPress核心API',
        'endpoint' => '/wp/v2',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'BJT API自定义测试',
        'endpoint' => '/bjt-api-test/v1/hello',
        'method' => 'GET',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'BJT认证API登录',
        'endpoint' => '/bjt/v1/auth/login',
        'method' => 'POST',
        'data' => [
            'username' => 'admin',
            'password' => 'password'
        ],
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'BJT设备API列表',
        'endpoint' => '/bjt/v1/machines',
        'method' => 'GET',
        'auth_token_from' => 'BJT认证API登录',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
    [
        'name' => 'BJT设备API详情',
        'endpoint' => '/bjt/v1/machines/machine1',
        'method' => 'GET',
        'auth_token_from' => 'BJT认证API登录',
        'expected_status' => 200,
        'expected_content_type' => 'application/json'
    ],
];

// 测试结果
$total_tests = 0;
$passed_tests = 0;
$failed_tests = 0;
$auth_tokens = [];

/**
 * 发送API请求
 */
function make_api_request($url, $method = 'GET', $data = null, $headers = []) {
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
    
    $default_headers = [
        'Accept: application/json',
        'Content-Type: application/json'
    ];
    
    $all_headers = array_merge($default_headers, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $all_headers);
    
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
        'body' => $body,
        'json' => json_decode($body, true)
    ];
}

/**
 * 运行API测试
 */
function run_api_test($base_url, $endpoint_data) {
    global $total_tests, $passed_tests, $failed_tests, $auth_tokens;
    
    $total_tests++;
    
    $name = $endpoint_data['name'];
    $endpoint = $endpoint_data['endpoint'];
    $method = $endpoint_data['method'];
    $data = isset($endpoint_data['data']) ? $endpoint_data['data'] : null;
    $expected_status = $endpoint_data['expected_status'];
    $expected_content_type = $endpoint_data['expected_content_type'];
    
    // 检查是否需要鉴权
    $headers = [];
    if (isset($endpoint_data['auth_token_from']) && isset($auth_tokens[$endpoint_data['auth_token_from']])) {
        $headers[] = 'Authorization: Bearer ' . $auth_tokens[$endpoint_data['auth_token_from']];
    }
    
    $url = $base_url . $endpoint;
    
    echo "测试 {$name}...\n";
    echo "  URL: {$url}\n";
    if ($method === 'POST' && $data) {
        echo "  数据: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    $response = make_api_request($url, $method, $data, $headers);
    
    $status_match = $response['status_code'] === $expected_status;
    $content_type_match = strpos($response['content_type'], $expected_content_type) !== false;
    
    $success = $status_match && $content_type_match;
    
    // 如果这是认证API，并且成功，保存token
    if ($success && $name === 'BJT认证API登录' && !empty($response['json']['data']['token'])) {
        $auth_tokens[$name] = $response['json']['data']['token'];
        echo "  获取到认证令牌\n";
    }
    
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
        'method' => $method,
        'data' => $data,
        'success' => $success,
        'status' => $response['status_code'],
        'expected_status' => $expected_status,
        'content_type' => $response['content_type'],
        'expected_content_type' => $expected_content_type,
        'response' => $response['body'],
        'json' => $response['json']
    ];
}

// 打印测试标题
echo "==================================================\n";
echo "BJT业务API测试\n";
echo "开始时间: " . date('Y-m-d H:i:s') . "\n";
echo "==================================================\n\n";

// 运行所有测试
$results = [];

foreach ($api_endpoints as $endpoint_data) {
    $results[] = run_api_test($base_url, $endpoint_data);
}

// 打印测试详情
echo "==================================================\n";
echo "测试详情\n";
echo "==================================================\n\n";

foreach ($results as $result) {
    echo "测试: {$result['name']}\n";
    echo "URL: {$result['url']}\n";
    echo "方法: {$result['method']}\n";
    
    if (!empty($result['data'])) {
        echo "数据: " . json_encode($result['data'], JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    echo "状态码: {$result['status']}\n";
    echo "内容类型: {$result['content_type']}\n";
    echo "成功: " . ($result['success'] ? "是" : "否") . "\n";
    
    if (isset($result['json']) && is_array($result['json'])) {
        echo "JSON响应: " . json_encode($result['json'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "响应: {$result['response']}\n";
    }
    
    echo "\n-----------------------------------------------------\n\n";
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