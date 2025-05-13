<?php
// 禁用PHP错误报告，以确保输出格式是干净的JSON
error_reporting(0);
ini_set('display_errors', 0);

// 设置内容类型为JSON
header('Content-Type: application/json');

// 创建一个包含测试数据的数组
$response = [
    'success' => true,
    'message' => 'Hello, world!',
    'timestamp' => date('Y-m-d H:i:s'),
    'data' => [
        'foo' => 'bar',
        'baz' => 123,
        'qux' => true,
    ],
];

// 输出JSON
echo json_encode($response, JSON_PRETTY_PRINT); 