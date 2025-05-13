<?php
/**
 * 测试REST API
 */

// 设置API URL
$api_url = 'http://127.0.0.1/wp-json';

// 显示测试信息
echo "================================================================================\n";
echo "== BJT产品管理系统 API 测试 (通过PHP直接请求)\n";
echo "================================================================================\n";

// 测试基础API
echo "================================================================================\n";
echo "== 0. 检查WordPress基础API\n";
echo "================================================================================\n";
echo "尝试访问WordPress REST API\n";

// 直接使用PHP的内置函数
$response = file_get_contents($api_url);
if ($response !== false) {
    $data = json_decode($response, true);
    echo "成功! 返回数据类型: " . gettype($data) . "\n";
    if (is_array($data)) {
        echo "数据包含 " . count($data) . " 项\n";
        echo "返回数据（前100字符）: " . substr(json_encode($data, JSON_PRETTY_PRINT), 0, 100) . "...\n";
    }
} else {
    echo "错误: 无法连接到WordPress REST API\n";
    echo "错误信息: " . error_get_last()['message'] . "\n";
}

// 检查BJT API
echo "\n================================================================================\n";
echo "== 1. 检查BJT API 路由\n";
echo "================================================================================\n";
echo "尝试访问BJT API 路由\n";

$bjt_api_url = $api_url . '/bjt/v1';
$response = @file_get_contents($bjt_api_url);
if ($response !== false) {
    $data = json_decode($response, true);
    echo "成功! 返回数据类型: " . gettype($data) . "\n";
    if (is_array($data) || is_object($data)) {
        echo "返回数据: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
} else {
    echo "错误: 无法连接到BJT API\n";
    echo "错误信息: " . error_get_last()['message'] . "\n";
}

echo "\n================================================================================\n";
echo "== 测试完成\n";
echo "================================================================================\n"; 