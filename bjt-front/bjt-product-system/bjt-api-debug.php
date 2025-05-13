<?php
/**
 * Plugin Name: BJT API Debug
 * Description: 用于调试BJT产品管理系统API的插件
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 添加调试路由
add_action('rest_api_init', function() {
    register_rest_route('bjt-debug/v1', '/test', [
        'methods' => 'GET',
        'callback' => 'bjt_debug_test',
        'permission_callback' => '__return_true',
    ]);
    
    register_rest_route('bjt-debug/v1', '/info', [
        'methods' => 'GET',
        'callback' => 'bjt_debug_info',
        'permission_callback' => '__return_true',
    ]);
    
    // 模拟登录API
    register_rest_route('bjt-debug/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => 'bjt_debug_login',
        'permission_callback' => '__return_true',
    ]);
});

// 测试端点
function bjt_debug_test() {
    return [
        'status' => 'ok',
        'message' => 'BJT API Debug测试成功',
        'time' => current_time('mysql')
    ];
}

// 系统信息端点
function bjt_debug_info() {
    global $wp_version;
    
    return [
        'wordpress' => [
            'version' => $wp_version,
            'url' => get_site_url(),
            'admin_email' => get_option('admin_email'),
            'timezone' => get_option('timezone_string'),
        ],
        'php' => [
            'version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
        ],
        'plugins' => get_option('active_plugins'),
        'theme' => [
            'name' => wp_get_theme()->get('Name'),
            'version' => wp_get_theme()->get('Version'),
        ],
        'debug' => [
            'wp_debug' => defined('WP_DEBUG') && WP_DEBUG,
            'wp_debug_log' => defined('WP_DEBUG_LOG') && WP_DEBUG_LOG,
            'wp_debug_display' => defined('WP_DEBUG_DISPLAY') && WP_DEBUG_DISPLAY,
        ],
        'server' => [
            'os' => PHP_OS,
            'software' => $_SERVER['SERVER_SOFTWARE'],
            'request_time' => $_SERVER['REQUEST_TIME'],
        ],
        'rest_api' => [
            'namespace' => rest_get_url_prefix(),
            'endpoints' => _bjt_get_rest_endpoints()
        ]
    ];
}

// 辅助函数 - 获取所有REST API端点
function _bjt_get_rest_endpoints() {
    $endpoints = [];
    $server = rest_get_server();
    $routes = $server->get_routes();
    
    foreach ($routes as $route => $handlers) {
        $endpoints[] = $route;
    }
    
    return $endpoints;
}

// 模拟登录API
function bjt_debug_login($request) {
    $data = $request->get_json_params();
    $username = isset($data['username']) ? sanitize_text_field($data['username']) : '';
    $password = isset($data['password']) ? $data['password'] : '';
    
    // 记录请求数据到日志
    error_log('BJT Debug Login - 请求数据: ' . json_encode([
        'username' => $username,
        'password' => '(hidden for security)'
    ]));
    
    if (empty($username) || empty($password)) {
        return [
            'success' => false,
            'message' => '用户名和密码不能为空',
            'code' => 1001,
            'debug' => true
        ];
    }
    
    // 模拟用户验证
    if ($username == 'admin' && $password == 'password') {
        // 创建JWT token
        $issued_at = time();
        $expiration = $issued_at + 86400; // 24小时有效期
        
        $payload = [
            'iss' => get_site_url(),
            'iat' => $issued_at,
            'exp' => $expiration,
            'user' => [
                'id' => 1,
                'username' => $username,
                'role' => 'administrator'
            ]
        ];
        
        // 使用简单的JWT token生成
        $secret = get_option('bjt_jwt_secret', 'bjt_secret_key');
        $token = bjt_debug_generate_jwt($payload, $secret);
        
        return [
            'success' => true,
            'data' => [
                'token' => $token,
                'expires_in' => 86400,
                'user' => [
                    'id' => 1,
                    'username' => $username,
                    'email' => 'admin@example.com',
                    'name' => 'Admin User',
                    'role' => 'ADMIN',
                    'region' => 'CN',
                    'vipLevel' => 3,
                    'type' => 'admin'
                ]
            ],
            'debug' => true
        ];
    }
    
    return [
        'success' => false,
        'message' => '用户名或密码错误',
        'code' => 1001,
        'debug' => true
    ];
}

// 简单的JWT实现
function bjt_debug_generate_jwt($payload, $secret) {
    $header = [
        'typ' => 'JWT',
        'alg' => 'HS256'
    ];
    
    $header_encoded = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    
    $signature = hash_hmac('sha256', $header_encoded . '.' . $payload_encoded, $secret, true);
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    return $header_encoded . '.' . $payload_encoded . '.' . $signature_encoded;
}

// 添加设置接口JWT密钥的函数
add_action('admin_init', 'bjt_debug_set_jwt_secret');

function bjt_debug_set_jwt_secret() {
    if (!get_option('bjt_jwt_secret')) {
        update_option('bjt_jwt_secret', 'bjt_secret_key_' . time());
        error_log('BJT Debug - 已设置默认JWT密钥');
    }
}

// 添加管理菜单选项
add_action('admin_menu', 'bjt_debug_add_menu');

function bjt_debug_add_menu() {
    add_menu_page(
        'BJT API调试',
        'BJT API调试',
        'manage_options',
        'bjt-api-debug',
        'bjt_debug_menu_page',
        'dashicons-code-standards'
    );
}

// 管理菜单页面内容
function bjt_debug_menu_page() {
    ?>
    <div class="wrap">
        <h1>BJT API调试工具</h1>
        <p>这个页面提供了一些BJT API的调试功能。</p>
        
        <h2>REST API信息</h2>
        <p>现有API端点列表:</p>
        <pre><?php 
            $server = rest_get_server();
            $routes = $server->get_routes();
            
            foreach ($routes as $route => $handlers) {
                if (strpos($route, 'bjt') !== false) {
                    echo esc_html($route) . "\n";
                }
            }
        ?></pre>
        
        <h2>JWT设置</h2>
        <form method="post" action="options.php">
            <?php settings_fields('bjt-debug-settings'); ?>
            <?php do_settings_sections('bjt-debug-settings'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">JWT密钥</th>
                    <td>
                        <input type="text" name="bjt_jwt_secret" value="<?php echo esc_attr(get_option('bjt_jwt_secret', 'bjt_secret_key')); ?>" />
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <h2>测试登录</h2>
        <p>使用这个表单来测试JWT登录功能:</p>
        <form method="post" action="">
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">用户名</th>
                    <td><input type="text" name="test_username" value="admin" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">密码</th>
                    <td><input type="password" name="test_password" value="password" /></td>
                </tr>
            </table>
            <input type="hidden" name="bjt_debug_test_login" value="1" />
            <?php submit_button('测试登录'); ?>
        </form>
        
        <?php
        // 处理测试登录请求
        if (isset($_POST['bjt_debug_test_login'])) {
            $username = isset($_POST['test_username']) ? sanitize_text_field($_POST['test_username']) : '';
            $password = isset($_POST['test_password']) ? $_POST['test_password'] : '';
            
            $request = new WP_REST_Request('POST', '/bjt-debug/v1/auth/login');
            $request->set_body(json_encode([
                'username' => $username,
                'password' => $password
            ]));
            $request->set_header('Content-Type', 'application/json');
            
            $response = rest_do_request($request);
            $data = $response->get_data();
            
            echo '<h3>测试结果:</h3>';
            echo '<pre>' . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
        }
        ?>
    </div>
    <?php
}

// 注册设置
add_action('admin_init', 'bjt_debug_register_settings');

function bjt_debug_register_settings() {
    register_setting('bjt-debug-settings', 'bjt_jwt_secret');
}

// 添加错误日志记录钩子
add_action('rest_api_init', 'bjt_debug_log_api_errors', 1);

function bjt_debug_log_api_errors() {
    // 设置错误处理函数
    set_error_handler('bjt_debug_error_handler');
    
    // 设置异常处理函数
    set_exception_handler('bjt_debug_exception_handler');
    
    // 注册关闭时回调
    register_shutdown_function('bjt_debug_shutdown_handler');
}

// 错误处理函数
function bjt_debug_error_handler($errno, $errstr, $errfile, $errline) {
    error_log("BJT Debug Error [$errno] $errstr - $errfile:$errline");
    return false; // 继续执行PHP标准错误处理
}

// 异常处理函数
function bjt_debug_exception_handler($exception) {
    error_log("BJT Debug Exception: " . $exception->getMessage() . " - " . $exception->getFile() . ":" . $exception->getLine());
}

// 关闭时处理函数
function bjt_debug_shutdown_handler() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        error_log("BJT Debug Fatal Error: " . $error['message'] . " - " . $error['file'] . ":" . $error['line']);
    }
} 