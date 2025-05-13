<?php
/**
 * 简单的WordPress REST API测试脚本
 * 
 * 使用方式:
 * 1. 将此文件复制到WordPress根目录
 * 2. 通过浏览器访问 http://localhost:8080/simple-test.php
 */

// 定义Constants
define('ABSPATH', __DIR__ . '/');

// 显示所有错误
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 输出HTML头
?>
<!DOCTYPE html>
<html>
<head>
    <title>WordPress REST API 测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0073aa; }
        h2 { color: #23282d; margin-top: 30px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        .success { color: green; }
        .error { color: red; }
        .container { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WordPress REST API 测试</h1>
        
        <?php
        // 测试REST API是否可用
        echo '<h2>REST API 可用性测试</h2>';
        $rest_url = 'http://localhost:8080/wp-json/';
        echo '<p>测试URL: ' . $rest_url . '</p>';
        
        $response = @file_get_contents($rest_url);
        if ($response !== false) {
            echo '<p class="success">成功: REST API可用</p>';
            echo '<pre>' . htmlspecialchars(substr($response, 0, 500)) . '...</pre>';
        } else {
            echo '<p class="error">错误: 无法访问REST API</p>';
            echo '<pre>错误信息: ' . htmlspecialchars(error_get_last()['message']) . '</pre>';
        }
        
        // 测试BJT调试API
        echo '<h2>BJT Debug API 测试</h2>';
        $debug_url = 'http://localhost:8080/wp-json/bjt-debug/v1/test';
        echo '<p>测试URL: ' . $debug_url . '</p>';
        
        $context = stream_context_create([
            'http' => [
                'header' => 'Accept: application/json'
            ]
        ]);
        
        $debug_response = @file_get_contents($debug_url, false, $context);
        if ($debug_response !== false) {
            echo '<p class="success">成功: BJT Debug API可用</p>';
            echo '<pre>' . htmlspecialchars($debug_response) . '</pre>';
        } else {
            echo '<p class="error">错误: 无法访问BJT Debug API</p>';
            echo '<pre>错误信息: ' . htmlspecialchars(error_get_last()['message']) . '</pre>';
        }
        
        // 尝试获取BJT名称空间中的端点
        echo '<h2>BJT API 端点列表</h2>';
        $routes_url = 'http://localhost:8080/wp-json/wp/v2/';
        echo '<p>尝试列出所有BJT相关端点</p>';
        
        // 手动列出预期的BJT端点
        $expected_endpoints = [
            '/wp-json/bjt/v1/machines',
            '/wp-json/bjt/v1/accessories',
            '/wp-json/bjt/v1/consumables',
            '/wp-json/bjt/v1/spare-parts',
            '/wp-json/bjt/v1/auth/login',
            '/wp-json/bjt-debug/v1/test',
            '/wp-json/bjt-debug/v1/info',
            '/wp-json/bjt-debug/v1/auth/login'
        ];
        
        echo '<p>预期的端点:</p>';
        echo '<ul>';
        foreach ($expected_endpoints as $endpoint) {
            echo '<li>' . htmlspecialchars($endpoint) . '</li>';
        }
        echo '</ul>';
        
        // 测试BJT Debug登录API
        echo '<h2>BJT Debug 登录API测试</h2>';
        $login_url = 'http://localhost:8080/wp-json/bjt-debug/v1/auth/login';
        echo '<p>测试URL: ' . $login_url . '</p>';
        
        $login_data = json_encode([
            'username' => 'admin',
            'password' => 'password'
        ]);
        
        $login_context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json' . "\r\n" .
                            'Accept: application/json' . "\r\n" .
                            'Content-Length: ' . strlen($login_data) . "\r\n",
                'content' => $login_data
            ]
        ]);
        
        $login_response = @file_get_contents($login_url, false, $login_context);
        if ($login_response !== false) {
            echo '<p class="success">成功: 登录API可用</p>';
            echo '<pre>' . htmlspecialchars($login_response) . '</pre>';
            
            // 解析JWT令牌
            $login_result = json_decode($login_response, true);
            if (isset($login_result['data']['token'])) {
                $token = $login_result['data']['token'];
                echo '<p class="success">成功获取JWT令牌: ' . substr($token, 0, 20) . '...</p>';
                
                // 使用令牌测试设备API
                echo '<h2>使用JWT令牌测试设备API</h2>';
                $machines_url = 'http://localhost:8080/wp-json/bjt/v1/machines';
                echo '<p>测试URL: ' . $machines_url . '</p>';
                
                $auth_context = stream_context_create([
                    'http' => [
                        'header' => 'Authorization: Bearer ' . $token . "\r\n" .
                                    'Accept: application/json' . "\r\n"
                    ]
                ]);
                
                $machines_response = @file_get_contents($machines_url, false, $auth_context);
                if ($machines_response !== false) {
                    echo '<p class="success">成功: 设备API可用</p>';
                    echo '<pre>' . htmlspecialchars($machines_response) . '</pre>';
                } else {
                    echo '<p class="error">错误: 无法访问设备API</p>';
                    echo '<pre>错误信息: ' . htmlspecialchars(error_get_last()['message']) . '</pre>';
                }
            } else {
                echo '<p class="error">错误: 无法从登录响应中提取JWT令牌</p>';
            }
        } else {
            echo '<p class="error">错误: 无法访问登录API</p>';
            echo '<pre>错误信息: ' . htmlspecialchars(error_get_last()['message']) . '</pre>';
        }
        ?>
        
        <h2>测试报告总结</h2>
        <p>以上测试完成于: <?php echo date('Y-m-d H:i:s'); ?></p>
        <p>如果某些API返回错误，这可能是因为:</p>
        <ol>
            <li>WordPress REST API未正确配置</li>
            <li>相关插件未激活或存在问题</li>
            <li>服务器权限或网络问题</li>
            <li>API实现与文档不匹配</li>
        </ol>
        
        <h2>环境信息</h2>
        <pre>
PHP版本: <?php echo PHP_VERSION; ?>
服务器信息: <?php echo isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : 'Unknown'; ?>
请求时间: <?php echo date('Y-m-d H:i:s'); ?>
        </pre>
    </div>
</body>
</html> 