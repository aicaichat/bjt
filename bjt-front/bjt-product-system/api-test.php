<?php
/**
 * BJT API测试脚本
 * 
 * 这个脚本不需要加载WordPress，直接通过HTTP请求测试API
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 设置内容类型为JSON
header('Content-Type: application/json');

// 定义API端点
$api_url = 'http://127.0.0.1:80/wp-json';

// 测试基本端点
$basic_test = test_api_endpoint($api_url);

// 测试BJT测试端点
$bjt_test = test_api_endpoint($api_url . '/bjt-test/v1/test');

// 测试BJT修复端点
$bjt_fix_test = test_api_endpoint($api_url . '/bjt-fix/test');

// 输出结果
echo json_encode([
    'timestamp' => date('Y-m-d H:i:s'),
    'basic_api_test' => $basic_test,
    'bjt_test_api' => $bjt_test,
    'bjt_fix_api' => $bjt_fix_test,
    'server_info' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
    ]
], JSON_PRETTY_PRINT);

/**
 * 测试API端点
 * 
 * @param string $url API URL
 * @return array 测试结果
 */
function test_api_endpoint($url) {
    $start_time = microtime(true);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    $error = curl_error($ch);
    
    $end_time = microtime(true);
    
    // 分离头部和正文
    $header_size = $info['header_size'];
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    
    // 解析头部
    $headers = [];
    foreach (explode("\n", $header) as $line) {
        $line = trim($line);
        if (strpos($line, ':') !== false) {
            list($key, $value) = explode(':', $line, 2);
            $headers[trim($key)] = trim($value);
        }
    }
    
    // 检查是否是有效的JSON
    $is_json = false;
    $json_data = null;
    
    if (!empty($body)) {
        $json_data = json_decode($body, true);
        $is_json = (json_last_error() === JSON_ERROR_NONE);
    }
    
    curl_close($ch);
    
    return [
        'url' => $url,
        'status_code' => $info['http_code'],
        'content_type' => $info['content_type'] ?? 'Unknown',
        'response_time' => round(($end_time - $start_time) * 1000, 2) . 'ms',
        'is_json' => $is_json,
        'error' => $error ?: null,
        'headers' => $headers,
        'body_preview' => substr($body, 0, 500) . (strlen($body) > 500 ? '...' : ''),
        'parsed_json' => $is_json ? $json_data : null,
    ];
} 