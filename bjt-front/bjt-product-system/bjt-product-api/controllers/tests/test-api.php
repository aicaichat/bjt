<?php
/**
 * BJT产品管理系统 API 测试脚本
 * 
 * 使用方法: php test-api.php
 */

// API基础URL
$api_base_url = 'http://localhost:8080/wp-json/bjt/v1';

// 测试结果计数器
$total_tests = 0;
$passed_tests = 0;
$failed_tests = 0;

// 颜色常量
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

// 单元测试函数
function run_test($name, $url, $method = 'GET', $data = null, $headers = []) {
    global $api_base_url, $total_tests, $passed_tests, $failed_tests;
    
    $total_tests++;
    
    echo COLOR_BLUE . "\n正在测试: $name" . COLOR_RESET . "\n";
    echo "URL: $api_base_url$url\n";
    echo "方法: $method\n";
    
    // 初始化cURL
    $curl = curl_init();
    
    // 设置cURL选项
    curl_setopt($curl, CURLOPT_URL, $api_base_url . $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
    
    // 如果有数据要发送
    if ($data !== null) {
        $data_string = json_encode($data);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data_string);
        echo "数据: " . $data_string . "\n";
        
        // 添加内容类型头
        $headers[] = 'Content-Type: application/json';
        $headers[] = 'Content-Length: ' . strlen($data_string);
    }
    
    // 设置请求头
    if (!empty($headers)) {
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }
    
    // 执行请求
    $start_time = microtime(true);
    $response = curl_exec($curl);
    $end_time = microtime(true);
    
    // 获取状态码
    $status_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    // 关闭cURL
    curl_close($curl);
    
    // 解析响应
    $response_data = json_decode($response, true);
    
    // 计算响应时间
    $response_time = round(($end_time - $start_time) * 1000); // 毫秒
    
    // 检查响应是否成功
    $test_passed = ($status_code >= 200 && $status_code < 300);
    if ($test_passed && isset($response_data['success'])) {
        $test_passed = $response_data['success'] === true;
    }
    
    if ($test_passed) {
        echo COLOR_GREEN . "✓ 测试通过 ($status_code)" . COLOR_RESET . "\n";
        $passed_tests++;
    } else {
        echo COLOR_RED . "✗ 测试失败 ($status_code)" . COLOR_RESET . "\n";
        echo COLOR_YELLOW . "响应: " . print_r($response_data, true) . COLOR_RESET . "\n";
        $failed_tests++;
    }
    
    echo "响应时间: {$response_time}ms\n";
    echo "----------------------------\n";
    
    return [
        'passed' => $test_passed,
        'status_code' => $status_code,
        'response' => $response_data,
        'response_time' => $response_time
    ];
}

// 获取认证令牌
function get_auth_token() {
    $login_result = run_test(
        '用户登录',
        '/auth/login',
        'POST',
        [
            'username' => 'admin',
            'password' => 'password'
        ]
    );
    
    if ($login_result['passed'] && isset($login_result['response']['data']['token'])) {
        return $login_result['response']['data']['token'];
    }
    
    echo COLOR_RED . "无法获取认证令牌，部分测试可能会失败" . COLOR_RESET . "\n";
    return null;
}

// 主函数
function main() {
    global $total_tests, $passed_tests, $failed_tests;
    
    echo COLOR_BLUE . "BJT产品管理系统 API 测试开始" . COLOR_RESET . "\n";
    echo "===========================\n";
    
    // 获取认证令牌
    $token = get_auth_token();
    $auth_headers = $token ? ['Authorization: Bearer ' . $token] : [];
    
    // 1. 测试认证API
    echo COLOR_BLUE . "\n## 认证API测试" . COLOR_RESET . "\n";
    
    // 1.1 获取当前用户信息
    if ($token) {
        run_test(
            '获取当前用户信息',
            '/user/me',
            'GET',
            null,
            $auth_headers
        );
    }
    
    // 1.2 刷新令牌
    if ($token) {
        run_test(
            '刷新令牌',
            '/auth/refresh',
            'POST',
            null,
            $auth_headers
        );
    }
    
    // 2. 测试产品线API
    echo COLOR_BLUE . "\n## 产品线API测试" . COLOR_RESET . "\n";
    
    // 2.1 获取产品线列表
    run_test(
        '获取产品线列表',
        '/product-lines?page=1&page_size=10&lang=zh',
        'GET',
        null,
        $auth_headers
    );
    
    // 2.2 创建产品线
    $product_line_result = run_test(
        '创建产品线',
        '/product-lines',
        'POST',
        [
            'title_zh' => '测试产品线' . time(),
            'title_en' => 'Test Product Line ' . time(),
            'code' => 'TEST-' . time(),
            'description_zh' => '这是一个测试产品线',
            'description_en' => 'This is a test product line'
        ],
        $auth_headers
    );
    
    // 获取新创建的产品线ID
    $product_line_id = null;
    if ($product_line_result['passed'] && isset($product_line_result['response']['data']['id'])) {
        $product_line_id = $product_line_result['response']['data']['id'];
        
        // 2.3 获取单个产品线详情
        run_test(
            '获取单个产品线详情',
            '/product-lines/' . $product_line_id,
            'GET',
            null,
            $auth_headers
        );
        
        // 2.4 更新产品线
        run_test(
            '更新产品线',
            '/product-lines/' . $product_line_id,
            'PUT',
            [
                'title_zh' => '更新的产品线' . time(),
                'title_en' => 'Updated Product Line ' . time()
            ],
            $auth_headers
        );
        
        // 2.5 删除产品线
        run_test(
            '删除产品线',
            '/product-lines/' . $product_line_id,
            'DELETE',
            null,
            $auth_headers
        );
    }
    
    // 3. 测试机器API
    echo COLOR_BLUE . "\n## 机器API测试" . COLOR_RESET . "\n";
    
    // 3.1 获取机器列表
    run_test(
        '获取机器列表',
        '/machines?page=1&page_size=10&lang=zh&region=CN',
        'GET',
        null,
        $auth_headers
    );
    
    // 3.2 创建机器
    $machine_result = run_test(
        '创建机器',
        '/machines',
        'POST',
        [
            'title_zh' => '测试机器' . time(),
            'title_en' => 'Test Machine ' . time(),
            'code' => 'TM-' . time(),
            'product_line_id' => 1,
            'price_cny' => 1000
        ],
        $auth_headers
    );
    
    // 获取新创建的机器ID
    $machine_id = null;
    if ($machine_result['passed'] && isset($machine_result['response']['data']['id'])) {
        $machine_id = $machine_result['response']['data']['id'];
        
        // 3.3 获取单个机器详情
        run_test(
            '获取单个机器详情',
            '/machines/' . $machine_id,
            'GET',
            null,
            $auth_headers
        );
        
        // 3.4 更新机器
        run_test(
            '更新机器',
            '/machines/' . $machine_id,
            'PUT',
            [
                'title_zh' => '更新的机器' . time(),
                'title_en' => 'Updated Machine ' . time(),
                'price_cny' => 1200
            ],
            $auth_headers
        );
        
        // 3.5 获取机器配件
        run_test(
            '获取机器配件',
            '/machines/' . $machine_id . '/accessories?level=1&lang=zh&region=CN',
            'GET',
            null,
            $auth_headers
        );
        
        // 3.6 删除机器
        run_test(
            '删除机器',
            '/machines/' . $machine_id,
            'DELETE',
            null,
            $auth_headers
        );
    }
    
    // 如果有token，测试退出登录
    if ($token) {
        run_test(
            '退出登录',
            '/auth/logout',
            'POST',
            null,
            $auth_headers
        );
    }
    
    // 打印测试统计信息
    echo COLOR_BLUE . "\n===========================\n" . COLOR_RESET;
    echo COLOR_BLUE . "测试统计" . COLOR_RESET . "\n";
    echo "总测试数: $total_tests\n";
    echo COLOR_GREEN . "通过测试: $passed_tests" . COLOR_RESET . "\n";
    echo COLOR_RED . "失败测试: $failed_tests" . COLOR_RESET . "\n";
    
    if ($failed_tests === 0) {
        echo COLOR_GREEN . "\n所有测试通过！" . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "\n有 $failed_tests 个测试失败。" . COLOR_RESET . "\n";
    }
}

// 执行主函数
main(); 