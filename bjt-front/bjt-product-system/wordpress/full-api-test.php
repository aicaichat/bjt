<?php
/**
 * BJT API 测试套件
 * 测试WordPress核心API和BJT业务API
 */

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// API端点配置
$endpoints = [
    'core' => '/wp/v2',
    'bjt-fix' => '/bjt-fix/test',
    'bjt-test' => '/bjt-test/v1/test',
    'auth' => '/bjt/v1/auth/login',
    'product_lines' => '/bjt/v1/product-lines',
    'machines' => '/bjt/v1/machines'
];

// 测试结果存储
$results = [];
$passed_tests = 0;
$failed_tests = 0;
$total_tests = 0;

// 基础URL
$base_url = 'http://127.0.0.1:80/wp-json';

// 登录凭证
$credentials = [
    'username' => 'admin',
    'password' => 'password'
];

// 认证令牌
$auth_token = null;

/**
 * 进行API请求
 * 
 * @param string $endpoint API端点
 * @param string $method 请求方法 (GET, POST, etc.)
 * @param array $data 请求数据
 * @param array $headers 请求头
 * @return array 包含状态码, 内容类型和响应体的数组
 */
function make_api_request($base_url, $endpoint, $method = 'GET', $data = [], $headers = []) {
    $url = $base_url . $endpoint;
    
    // 设置cURL选项
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    // 设置请求方法
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } else if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if (!empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    // 设置默认的Content-Type
    $default_headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    // 合并用户提供的头部
    $request_headers = array_merge($default_headers, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
    
    // 执行请求
    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    
    // 获取内容类型
    $content_type = '';
    if (preg_match('/Content-Type: (.+)/', $headers, $matches)) {
        $content_type = trim($matches[1]);
    }
    
    curl_close($ch);
    
    return [
        'status_code' => $status_code,
        'content_type' => $content_type,
        'body' => $body
    ];
}

/**
 * 运行API测试
 * 
 * @param string $name 测试名称
 * @param string $endpoint 要测试的API端点
 * @param string $method 请求方法
 * @param array $data 请求数据
 * @param array $headers 请求头
 * @return array 测试结果
 */
function run_test($name, $base_url, $endpoint, $method = 'GET', $data = [], $headers = []) {
    global $total_tests, $passed_tests, $failed_tests;
    
    $total_tests++;
    
    echo "测试 $name API...\n";
    $start_time = microtime(true);
    
    $response = make_api_request($base_url, $endpoint, $method, $data, $headers);
    
    $end_time = microtime(true);
    $execution_time = round(($end_time - $start_time) * 1000, 2); // 毫秒
    
    // 解析JSON响应
    $json_response = @json_decode($response['body'], true);
    
    // 检查是否成功
    $success = false;
    
    if ($response['status_code'] >= 200 && $response['status_code'] < 300) {
        if (strpos($response['content_type'], 'application/json') !== false) {
            if ($json_response !== null) {
                $success = true;
            }
        }
    }
    
    // 获取错误消息
    $error_message = '';
    if (!$success && isset($json_response['message'])) {
        $error_message = $json_response['message'];
    }
    
    // 更新测试计数
    if ($success) {
        $passed_tests++;
    } else {
        $failed_tests++;
    }
    
    // 返回测试结果
    $result = [
        'name' => $name,
        'url' => $base_url . $endpoint,
        'method' => $method,
        'data' => $data,
        'status_code' => $response['status_code'],
        'content_type' => $response['content_type'],
        'execution_time' => $execution_time,
        'success' => $success,
        'error_message' => $error_message,
        'response_preview' => substr($response['body'], 0, 500) . (strlen($response['body']) > 500 ? '...' : '')
    ];
    
    echo "结果: " . ($success ? "成功" : "失败") . " (状态码: {$response['status_code']})\n";
    
    return $result;
}

// 打印测试开始信息
echo "=====================================================\n";
echo "BJT API 测试套件\n";
echo "开始时间: " . date('Y-m-d H:i:s') . "\n";
echo "=====================================================\n\n";

// 测试WordPress核心API
$results[] = run_test('WordPress核心API', $base_url, $endpoints['core']);

// 测试BJT-Fix API
$results[] = run_test('BJT-Fix API', $base_url, $endpoints['bjt-fix']);

// 测试BJT-Test API
$results[] = run_test('BJT-Test API', $base_url, $endpoints['bjt-test']);

// 测试认证API (登录)
$auth_result = run_test('认证API登录', $base_url, $endpoints['auth'], 'POST', $credentials);
$results[] = $auth_result;

// 如果认证成功，提取令牌
if ($auth_result['success']) {
    $auth_response = json_decode($auth_result['response_preview'], true);
    if (isset($auth_response['token'])) {
        $auth_token = $auth_response['token'];
        echo "成功获取认证令牌\n";
    }
}

// 认证头部
$auth_headers = [];
if ($auth_token) {
    $auth_headers[] = 'Authorization: Bearer ' . $auth_token;
}

// 测试产品线API
$results[] = run_test('产品线API', $base_url, $endpoints['product_lines'], 'GET', [], $auth_headers);

// 测试设备API
$results[] = run_test('设备API', $base_url, $endpoints['machines'], 'GET', [], $auth_headers);

// 打印测试结果
echo "\n=====================================================\n";
echo "测试结果详情\n";
echo "=====================================================\n\n";

foreach ($results as $result) {
    echo "测试: {$result['name']}\n";
    echo "URL: {$result['url']}\n";
    echo "方法: {$result['method']}\n";
    
    if (!empty($result['data'])) {
        echo "数据: " . json_encode($result['data'], JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    echo "状态码: {$result['status_code']}\n";
    echo "内容类型: {$result['content_type']}\n";
    echo "执行时间: {$result['execution_time']} 毫秒\n";
    echo "成功: " . ($result['success'] ? "是" : "否") . "\n";
    
    if (!empty($result['error_message'])) {
        echo "错误消息: {$result['error_message']}\n";
    }
    
    echo "响应预览: \n{$result['response_preview']}\n";
    echo "\n-----------------------------------------------------\n\n";
}

// 打印测试结果摘要
echo "=====================================================\n";
echo "测试结果摘要\n";
echo "=====================================================\n";
echo "总测试数: $total_tests\n";
echo "通过测试: $passed_tests\n";
echo "失败测试: $failed_tests\n";
echo "成功率: " . round(($passed_tests / $total_tests) * 100, 1) . "%\n";
echo "全部测试通过: " . ($failed_tests === 0 ? "是" : "否") . "\n";
echo "结束时间: " . date('Y-m-d H:i:s') . "\n";
echo "=====================================================\n"; 