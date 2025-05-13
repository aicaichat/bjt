<?php
/**
 * WordPress Debug Helper
 * 
 * 将此文件放在WordPress的mu-plugins目录下以启用高级调试功能
 */

// 如果直接访问此文件则退出
if (!defined('ABSPATH')) {
    die('不允许直接访问此文件');
}

// 启用所有的PHP错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// 确保WordPress调试日志工作正常
if (!defined('WP_DEBUG')) {
    define('WP_DEBUG', true);
}
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}
if (!defined('WP_DEBUG_DISPLAY')) {
    define('WP_DEBUG_DISPLAY', false);
}

// 为REST API响应添加调试信息
function bjt_debug_rest_api_response($response, $handler, $request) {
    // 只在调试模式下修改响应
    if (defined('WP_DEBUG') && WP_DEBUG) {
        // 检查是否为JSON响应
        if ($response instanceof WP_REST_Response) {
            $data = $response->get_data();
            
            // 添加调试信息
            if (is_array($data)) {
                $data['debug_info'] = [
                    'request_uri' => $_SERVER['REQUEST_URI'],
                    'request_method' => $_SERVER['REQUEST_METHOD'],
                    'request_headers' => getallheaders(),
                    'wp_version' => $GLOBALS['wp_version'],
                    'php_version' => PHP_VERSION,
                    'memory_usage' => memory_get_usage(true),
                    'timestamp' => date('Y-m-d H:i:s'),
                    'current_user' => is_user_logged_in() ? wp_get_current_user()->user_login : 'not_logged_in',
                    'rest_route' => $request->get_route(),
                    'rest_params' => $request->get_params(),
                ];
                $response->set_data($data);
            }
        }
    }
    
    return $response;
}
add_filter('rest_post_dispatch', 'bjt_debug_rest_api_response', 10, 3);

// 记录所有API请求到日志
function bjt_log_rest_api_request($response, $handler, $request) {
    $route = $request->get_route();
    $method = $request->get_method();
    $params = $request->get_params();
    $headers = $request->get_headers();
    
    // 移除敏感信息
    if (isset($params['password'])) {
        $params['password'] = '***REDACTED***';
    }
    
    // 记录请求信息
    error_log("REST API 请求: $method $route");
    error_log("参数: " . json_encode($params, JSON_UNESCAPED_UNICODE));
    
    // 记录响应状态
    $status = $response->get_status();
    error_log("响应状态: $status");
    
    // 如果发生错误，记录详细信息
    if ($status >= 400) {
        $data = $response->get_data();
        error_log("错误响应: " . json_encode($data, JSON_UNESCAPED_UNICODE));
    }
    
    return $response;
}
add_filter('rest_post_dispatch', 'bjt_log_rest_api_request', 999, 3);

// 添加一个简单的API测试端点
function bjt_register_debug_endpoints() {
    register_rest_route('bjt-debug/v1', '/system-info', [
        'methods' => 'GET',
        'callback' => function() {
            return new WP_REST_Response([
                'success' => true,
                'system_info' => [
                    'wp_version' => $GLOBALS['wp_version'],
                    'php_version' => PHP_VERSION,
                    'server_software' => $_SERVER['SERVER_SOFTWARE'],
                    'database_version' => $GLOBALS['wpdb']->db_version(),
                    'active_plugins' => get_option('active_plugins'),
                    'active_theme' => wp_get_theme()->get('Name'),
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time'),
                    'upload_max_filesize' => ini_get('upload_max_filesize'),
                    'post_max_size' => ini_get('post_max_size'),
                    'jwt_secret_set' => (bool) get_option('bjt_jwt_secret'),
                    'jwt_constant_defined' => defined('BJT_JWT_SECRET')
                ]
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
    
    // 添加Echo测试API
    register_rest_route('bjt-debug/v1', '/echo', [
        'methods' => ['GET', 'POST'],
        'callback' => function(WP_REST_Request $request) {
            $params = $request->get_params();
            $headers = getallheaders();
            
            // 安全起见，移除敏感信息
            if (isset($params['password'])) {
                $params['password'] = '***REDACTED***';
            }
            if (isset($headers['Authorization'])) {
                $headers['Authorization'] = substr($headers['Authorization'], 0, 15) . '...';
            }
            
            return new WP_REST_Response([
                'success' => true,
                'message' => '这是回声测试API',
                'echo_data' => [
                    'method' => $request->get_method(),
                    'route' => $request->get_route(),
                    'params' => $params,
                    'headers' => $headers,
                    'time' => date('Y-m-d H:i:s'),
                ]
            ], 200);
        },
        'permission_callback' => '__return_true',
    ]);
}
add_action('rest_api_init', 'bjt_register_debug_endpoints');

// 防止REST API JSON消息被错误的PHP输出影响
function bjt_prevent_output_corruption() {
    // 仅适用于REST API请求
    if (defined('REST_REQUEST') && REST_REQUEST) {
        // 关闭之前的所有输出
        while (ob_get_level()) {
            ob_end_clean();
        }
        // 开始新的输出缓冲
        ob_start();
    }
}
add_action('init', 'bjt_prevent_output_corruption', 0);

// 确保REST API请求返回正确的内容类型
function bjt_ensure_proper_rest_headers($served, $result, $request, $server) {
    if ($served) {
        // REST API 已经处理了请求
        header_remove('X-Powered-By'); // 移除PHP版本信息
        header('Content-Type: application/json; charset=UTF-8');
        
        // 添加CORS头
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    return $served;
}
add_filter('rest_pre_serve_request', 'bjt_ensure_proper_rest_headers', 10, 4);

// 捕获并记录所有PHP错误
function bjt_handle_all_errors() {
    // 自定义错误处理函数
    function bjt_error_handler($errno, $errstr, $errfile, $errline) {
        $error_type = '';
        switch ($errno) {
            case E_ERROR:
            case E_USER_ERROR:
                $error_type = 'FATAL ERROR';
                break;
            case E_WARNING:
            case E_USER_WARNING:
                $error_type = 'WARNING';
                break;
            case E_NOTICE:
            case E_USER_NOTICE:
                $error_type = 'NOTICE';
                break;
            default:
                $error_type = 'UNKNOWN';
                break;
        }
        
        $error_message = "[$error_type] $errstr in $errfile on line $errline";
        error_log($error_message);
        
        // 对于REST API请求，返回JSON错误而不是HTML
        if (defined('REST_REQUEST') && REST_REQUEST) {
            if (in_array($errno, [E_ERROR, E_USER_ERROR])) {
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'code' => 'server_error',
                    'message' => strip_tags($errstr),
                    'data' => [
                        'status' => 500
                    ]
                ]);
                exit;
            }
        }
        
        // 继续使用PHP的内置错误处理
        return false;
    }
    
    // 自定义异常处理函数
    function bjt_exception_handler($exception) {
        $error_message = "[EXCEPTION] " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine();
        error_log($error_message);
        error_log("Stack trace: " . $exception->getTraceAsString());
        
        // 对于REST API请求，返回JSON错误而不是HTML
        if (defined('REST_REQUEST') && REST_REQUEST) {
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'code' => 'server_error',
                'message' => strip_tags($exception->getMessage()),
                'data' => [
                    'status' => 500
                ]
            ]);
            exit;
        }
        
        // 对于其他请求，显示友好的错误信息
        if (WP_DEBUG) {
            echo "<h1>系统错误</h1>";
            echo "<p>" . htmlspecialchars($exception->getMessage()) . "</p>";
            echo "<p>文件: " . htmlspecialchars($exception->getFile()) . " 行: " . $exception->getLine() . "</p>";
            echo "<h2>调用堆栈</h2>";
            echo "<pre>" . htmlspecialchars($exception->getTraceAsString()) . "</pre>";
        } else {
            echo "<h1>系统错误</h1>";
            echo "<p>发生了一个错误，请联系管理员。</p>";
        }
        exit;
    }
    
    // 自定义致命错误处理
    function bjt_shutdown_handler() {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            $error_message = "[FATAL ERROR] " . $error['message'] . " in " . $error['file'] . " on line " . $error['line'];
            error_log($error_message);
            
            // 对于REST API请求，返回JSON错误
            if (defined('REST_REQUEST') && REST_REQUEST) {
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'code' => 'server_error',
                    'message' => strip_tags($error['message']),
                    'data' => [
                        'status' => 500
                    ]
                ]);
                exit;
            }
            
            // 对于其他请求，显示友好的错误信息
            if (WP_DEBUG) {
                echo "<h1>致命错误</h1>";
                echo "<p>" . htmlspecialchars($error['message']) . "</p>";
                echo "<p>文件: " . htmlspecialchars($error['file']) . " 行: " . $error['line'] . "</p>";
            } else {
                echo "<h1>系统错误</h1>";
                echo "<p>发生了一个严重错误，请联系管理员。</p>";
            }
        }
    }
    
    // 设置自定义错误处理器
    set_error_handler('bjt_error_handler');
    set_exception_handler('bjt_exception_handler');
    register_shutdown_function('bjt_shutdown_handler');
}
bjt_handle_all_errors(); 