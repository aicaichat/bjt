<?php
/**
 * Plugin Name: BJT Core Entities
 * Description: Manages core BJT product entities and exposes them via REST API.
 * Version: 1.1
 * Author: ZD
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Include the Firebase JWT autoloader
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// Include the BJT_JWT_Handler class
require_once __DIR__ . '/includes/class-bjt-jwt-handler.php';

// Include the plugin auto-activation protection
require_once __DIR__ . '/prevent-auto-deactivate.php';

// Define a constant for the plugin directory path
if ( ! defined( 'BJT_CORE_ENTITIES_PLUGIN_DIR' ) ) {
    define( 'BJT_CORE_ENTITIES_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Adds CORS headers to allow cross-origin requests from the frontend.
 */
function bjt_add_cors_headers() {
    error_log('[BJT DEBUG] bjt_add_cors_headers CALLED'); // Test error logging
    // Allow requests from your frontend development server
    header("Access-Control-Allow-Origin: *");
    // Allow common methods
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Allow common headers, including Authorization for tokens
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    // Allow credentials (cookies, authorization headers)
    header("Access-Control-Allow-Credentials: true");
    // Set UTF-8 encoding for all API responses to fix Chinese character issues - 修正连字符
    header("Content-Type: application/json; charset=utf-8");

    // For OPTIONS pre-flight requests, send a 200 OK and exit early.
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
}
// 确保优先级更高
add_action('rest_api_init', 'bjt_add_cors_headers', 0);

/**
 * 设置数据库连接的字符集为 utf8mb4，确保正确处理中文字符
 */
function bjt_set_db_charset() {
    global $wpdb;
    if ($wpdb->dbh) {
        $wpdb->query("SET NAMES utf8mb4");
        $wpdb->query("SET CHARACTER SET utf8mb4");
        $wpdb->query("SET collation_connection = utf8mb4_unicode_ci");
        // Add these to ensure connections in PHP 7+ with mysqli maintain proper encoding
        if (method_exists($wpdb->dbh, 'set_charset')) {
            $wpdb->dbh->set_charset('utf8mb4');
        }
        error_log("BJT API: 已设置数据库连接字符集为 utf8mb4");
    }
}
// 确保在所有API请求之前设置数据库字符集，移到更早的钩子
add_action('plugins_loaded', 'bjt_set_db_charset', 1);
add_action('rest_api_init', 'bjt_set_db_charset', 1); // 保留原有钩子作为双重保障

// Include necessary files
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-database.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-bjt-api-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-auth.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/functions.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/upload-handler.php';

// Controller Includes
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-auth-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-product-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-machine-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-accessory-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-accessory-model-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-spare-part-model-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-consumable-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-spare-part-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-part-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-cart-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-order-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-rma-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-contact-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-price-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-inventory-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-dictionary-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-machine-part-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-relation-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-user-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-settings-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-upload-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-import-controller.php';

// Helper function to get current token from request
if (!function_exists('bjt_get_current_token')) {
    function bjt_get_current_token() {
        error_log("🔍 [TOKEN DEBUG] HTTP_AUTHORIZATION: " . (isset($_SERVER["HTTP_AUTHORIZATION"]) ? $_SERVER["HTTP_AUTHORIZATION"] : "not set"));
        if (function_exists("getallheaders")) {
            $headers = getallheaders();
            error_log("🔍 [TOKEN DEBUG] Authorization header: " . (isset($headers["Authorization"]) ? $headers["Authorization"] : "not set"));
        }
        $authorization_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null;
        if (!$authorization_header && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authorization_header = isset($headers['Authorization']) ? $headers['Authorization'] : null;
        }

        if ($authorization_header) {
            list($type, $token) = explode(' ', $authorization_header, 2);
            if (strcasecmp($type, 'Bearer') == 0 && !empty($token)) {
                return $token;
            }
        }
        return null;
    }
}

/**
 * Activation hook: This is where you can create database tables or perform other setup tasks.
 */
function bjt_api_activate() {
    BJT_Database::check_tables();
}
register_activation_hook(__FILE__, 'bjt_api_activate');


/**
 * Registers all REST API routes for BJT entities.
 */
function bjt_api_register_routes() {
    $controllers = array(
        'BJT_Auth_Controller',
        'BJT_Product_Controller',
        'BJT_Machine_Controller',
        'BJT_Accessory_Controller',
        'BJT_Accessory_Model_Controller',
        'BJT_Spare_Part_Model_Controller',
        'BJT_Consumable_Controller',
        'BJT_Spare_Part_Controller',
        'BJT_Part_Controller',
        'BJT_Cart_Controller',
        'BJT_Order_Controller',
        'BJT_RMA_Controller',
        'BJT_Contact_Controller',
        'BJT_Price_Controller',
        'BJT_Inventory_Controller',
        'BJT_Dictionary_Controller',
        'BJT_Machine_Part_Controller',
        'BJT_Relation_Controller',
        'BJT_User_Controller',
        'BJT_Settings_Controller',
        'BJT_Upload_Controller',
        'BJT_Import_Controller'
    );

    foreach ($controllers as $controller_name) {
        $controller = new $controller_name();
        $controller->register_routes();
    }

    // TEST CHARSET ROUTE
    register_rest_route('bjt/v1', '/test-charset', [
        'methods' => WP_REST_Server::READABLE, // Or 'GET'
        'callback' => function() {
            global $wpdb;
            // IMPORTANT: Replace with an actual ID from your wp_bjt_host_models table
            $test_machine_id = 1; 
            $test_data = $wpdb->get_var( $wpdb->prepare("SELECT title_zh FROM {$wpdb->prefix}bjt_host_models WHERE id = %d LIMIT 1", $test_machine_id) );

            if ($test_data === null) {
                return new WP_REST_Response(['success' => false, 'message' => 'Test data not found. Make sure a host model with ID ' . $test_machine_id . ' exists and has a title_zh.'], 404);
            }

            error_log("Raw test data from DB for /test-charset: " . $test_data);

            $response_data = ['success' => true, 'test_string' => $test_data];
            
            return new WP_REST_Response($response_data, 200);
        },
        'permission_callback' => '__return_true',
    ]);

    // DIAGNOSTIC ROUTE for remote debugging
    register_rest_route('bjt/v1', '/diagnostic', array(
        'methods' => 'GET',
        'callback' => 'bjt_diagnostic_endpoint',
        'permission_callback' => '__return_true', // 公开访问以便远程诊断
    ));
}
add_action('rest_api_init', 'bjt_api_register_routes');

/**
 * Customize REST API error responses to include a 'success' field
 */
function bjt_customize_rest_error_responses($response, $handler, $request) {
    // Skip if not a WP_Error
    if (!is_wp_error($response)) {
        return $response;
    }

    // Get the original error data
    $error_code = $response->get_error_code();
    $error_message = $response->get_error_message();
    $error_data = $response->get_error_data();
    
    // Extract status code from error data
    $status = isset($error_data['status']) ? $error_data['status'] : 400;
    
    // Create a standardized error response structure with success=false
    $error_response = [
        'success' => false,
        'code' => $error_code,
        'message' => $error_message,
        'data' => $error_data,
    ];
    
    // Create and return a proper response object with the appropriate status
    return new WP_REST_Response($error_response, $status);
}
add_filter('rest_request_before_callbacks', 'bjt_customize_rest_error_responses', 10, 3);

/**
 * Ensure successful responses include a success field
 */
function bjt_prepare_success_response($response, $handler, $request) {
    // Skip error responses - they're handled by our other filter
    if (is_wp_error($response)) {
        return $response;
    }
    
    // Skip if not a WP_REST_Response
    if (!($response instanceof WP_REST_Response)) {
        return $response;
    }
    
    // The controllers now consistently add 'success' => true.
    // This filter's primary role for adding 'success' is now redundant.
    // We will rely on bjt_rest_api_headers for Content-Type.
    
    // $data = $response->get_data(); // No longer needed here for modification
    
    // Set the Content-Type header to ensure proper charset
    // This is also handled by bjt_rest_api_headers, but leaving it here won't hurt as a fallback.
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    
    return $response;
}
add_filter('rest_request_after_callbacks', 'bjt_prepare_success_response', 10, 3);

/**
 * Debug function to log encoding information about Chinese strings
 * Only logs when WP_DEBUG is true
 */
function bjt_debug_encoding($string, $label = '') {
    if (!defined('WP_DEBUG') || !WP_DEBUG) {
        return;
    }
    
    // Skip non-string values
    if (!is_string($string)) {
        return;
    }
    
    $info = array(
        'length' => strlen($string),
        'mb_length' => function_exists('mb_strlen') ? mb_strlen($string, 'UTF-8') : 'n/a',
        'detected_encoding' => function_exists('mb_detect_encoding') ? mb_detect_encoding($string, 'UTF-8,ISO-8859-1,GBK,GB2312,BIG5', true) : 'n/a',
        'is_utf8' => function_exists('mb_check_encoding') ? mb_check_encoding($string, 'UTF-8') : 'n/a',
        'has_chinese' => preg_match('/[\x{4e00}-\x{9fa5}]/u', $string) ? 'yes' : 'no',
        'first_bytes' => bin2hex(substr($string, 0, 10)) . (strlen($string) > 10 ? '...' : ''),
        'string_snippet' => substr($string, 0, 30) . (strlen($string) > 30 ? '...' : '')
    );
    
    $label = empty($label) ? 'String encoding debug' : $label;
    error_log("[$label] " . json_encode($info, JSON_UNESCAPED_UNICODE));
}

/**
 * Deactivation hook: Clean up if necessary.
 */
function bjt_api_deactivate() {
    // e.g., remove scheduled cron jobs if any
}
register_deactivation_hook(__FILE__, 'bjt_api_deactivate'); 

/**
 * Register a debug endpoint to help diagnose API routing issues
 */
function bjt_register_debug_endpoint() {
    // Simple health check endpoint 
    register_rest_route('bjt/v1', '/healthcheck', array(
        'methods' => 'GET',
        'callback' => function() {
            return new WP_REST_Response(array(
                'success' => true,
                'status' => 'ok',
                'message' => 'API is functioning correctly',
                'timestamp' => current_time('mysql')
            ), 200);
        },
        'permission_callback' => '__return_true'
    ));

    register_rest_route('bjt/v1', '/__debug_test_endpoint__', array(
        'methods' => 'GET',
        'callback' => function() {
            global $wp_rest_server;
            
            // Get all registered routes
            $routes = $wp_rest_server->get_routes();
            $bjt_routes = [];
            
            // Filter for BJT routes only
            foreach ($routes as $route => $handlers) {
                if (strpos($route, 'bjt/v1') === 0) {
                    $methods = [];
                    foreach ($handlers as $handler) {
                        if (isset($handler['methods'])) {
                            $methods = array_merge($methods, array_keys($handler['methods']));
                        }
                    }
                    $bjt_routes[$route] = array(
                        'url' => rest_url($route),
                        'methods' => array_unique($methods)
                    );
                }
            }
            
            // Get all registered controller instances
            $controllers = [
                'product_lines' => new BJT_Product_Controller(),
                'host_models' => new BJT_Machine_Controller(),
                'machines' => new BJT_Machine_Controller(),
                'accessories' => new BJT_Accessory_Controller(),
                'consumables' => new BJT_Consumable_Controller(),
                'spare_parts' => new BJT_Spare_Part_Controller(),
                'cart' => new BJT_Cart_Controller(),
                'product_lookup' => new BJT_Product_Lookup_Controller(),
            ];
            
            // Manual route registration for debug purposes
            $manual_routes = [];
            foreach ($controllers as $name => $controller) {
                // Convert underscores to hyphens for all route names
                $route_name = str_replace('_', '-', $name);
                
                $manual_routes[$name] = [
                    'url' => rest_url('bjt/v1/' . $route_name),
                    'controller_class' => get_class($controller),
                    'resource_name' => isset($controller->resource_name) ? $controller->resource_name : 'unknown'
                ];
            }
            
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Debug endpoint is working',
                'registered_routes' => array(
                    'product_lines' => rest_url('bjt/v1/product-lines'),
                    'host_models' => rest_url('bjt/v1/host-models'),
                    'machines' => rest_url('bjt/v1/machines')
                ),
                'all_bjt_routes' => $bjt_routes,
                'manual_routes' => $manual_routes
            ), 200);
        },
        'permission_callback' => function() {
            return true;
        }
    ));
}

/**
 * Register an error handler to catch PHP errors and format them as API responses
 */
function bjt_register_api_error_handler() {
    // Only register on REST API requests
    if (defined('REST_REQUEST') && REST_REQUEST) {
        // set_error_handler('bjt_rest_error_handler');
        // register_shutdown_function('bjt_rest_shutdown_handler');
    }
}
add_action('rest_api_init', 'bjt_register_api_error_handler', 1);

/**
 * Custom error handler for REST API requests
 */
function bjt_rest_error_handler($errno, $errstr, $errfile, $errline) {
    // Only handle errors in BJT plugin files
    if (strpos($errfile, 'bjt-') === false) {
        return false; // Let WordPress handle other errors
    }
    
    // Clear any existing output buffers
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Set appropriate headers
    if (!headers_sent()) {
        header('Content-Type: application/json');
        status_header(500);
    } else {
        // If headers already sent, we can't reliably send a JSON error.
        // Log it and let the existing output (likely a WP error page) continue.
        error_log("[BJT REST Error Handler] Headers already sent. Original error: $errstr in $errfile:$errline");
        return false; // Allow default PHP error handling to continue if it can.
    }
    
    $error_response = [
        'success' => false,
        'code' => 'php_error',
        'message' => 'Internal server error occurred.',
        'data' => [
            'status' => 500,
            'details' => "Error in $errfile:$errline - $errstr"
        ]
    ];
    
    echo json_encode($error_response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Shutdown handler to catch fatal errors
 */
function bjt_rest_shutdown_handler() {
    $error = error_get_last();
    
    // Only handle fatal errors in BJT endpoints
    if ($error !== null && 
        in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR]) && 
        isset($_SERVER['REQUEST_URI']) && 
        strpos($_SERVER['REQUEST_URI'], '/bjt/v1/') !== false) {
        
        if (!headers_sent()) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            header('Content-Type: application/json');
            status_header(500);
        } else {
            error_log('[BJT DEBUG Shutdown] Headers already sent. Original fatal error: ' . $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']);
            return; 
        }
        
        $error_response = [
            'success' => false,
            'code' => 'php_fatal_error',
            'message' => 'A critical error occurred while processing your request.',
            'data' => [
                'status' => 500,
                'details' => $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']
            ]
        ];
        
        echo json_encode($error_response, JSON_UNESCAPED_UNICODE);
    }
}
// Register the debug endpoint with a lower priority than the main routes
// to ensure it can see all registered routes
add_action('rest_api_init', 'bjt_register_debug_endpoint', 20);

/**
 * Ensure REST API responses use UTF-8 encoding
 */
function bjt_rest_api_headers() {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
}
add_action('rest_pre_serve_request', 'bjt_rest_api_headers', 0); // 提高优先级

/**
 * Modify WordPress's JSON_ENCODE to force unescaped Unicode characters
 */
add_filter('wp_json_encode', function($result, $data, $options) {
    // Always include JSON_UNESCAPED_UNICODE in options
    $options = $options | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    return json_encode($data, $options);
}, 999, 3);

/**
 * Diagnostic endpoint callback function
 */
function bjt_diagnostic_endpoint($request) {
    global $wpdb;
    
    $diagnostic_data = array(
        'timestamp' => current_time('mysql'),
        'environment' => array(
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'site_url' => get_site_url(),
            'home_url' => get_home_url(),
        ),
        'plugin_info' => array(
            'bjt_product_api_version' => '1.1',
            'plugin_path' => BJT_CORE_ENTITIES_PLUGIN_DIR,
            'plugin_url' => plugin_dir_url(__FILE__),
            'is_active' => is_plugin_active('bjt-core-entities/bjt-product-api.php'),
        ),
        'database_info' => array(
            'mysql_version' => $wpdb->get_var("SELECT VERSION()"),
            'database_name' => DB_NAME,
            'table_prefix' => $wpdb->prefix,
        ),
        'file_checksums' => array(),
        'class_status' => array(),
        'sample_data' => array(),
        'debug_info' => array(),
    );
    
    // 检查关键文件的存在性和最后修改时间
    $critical_files = array(
        'order_controller' => BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-order-controller.php',
        'product_info_resolver' => BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-product-info-resolver.php',
        'database_class' => BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-database.php',
    );
    
    foreach ($critical_files as $key => $file_path) {
        if (file_exists($file_path)) {
            $diagnostic_data['file_checksums'][$key] = array(
                'exists' => true,
                'size' => filesize($file_path),
                'modified' => date('Y-m-d H:i:s', filemtime($file_path)),
                'md5' => md5_file($file_path),
            );
        } else {
            $diagnostic_data['file_checksums'][$key] = array(
                'exists' => false,
            );
        }
    }
    
    // 检查类的加载状态
    $critical_classes = array(
        'BJT_Order_Controller',
        'BJT_Product_Info_Resolver',
        'BJT_Database',
        'BJT_Product_Controller',
    );
    
    foreach ($critical_classes as $class_name) {
        $diagnostic_data['class_status'][$class_name] = array(
            'exists' => class_exists($class_name),
            'methods' => class_exists($class_name) ? get_class_methods($class_name) : array(),
        );
    }
    
    // 检查数据库表和示例数据
    try {
        // 检查订单表
        $order_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}orders");
        $diagnostic_data['sample_data']['orders'] = array(
            'count' => intval($order_count),
            'sample' => $wpdb->get_results("SELECT id, po_number, created_at FROM {$wpdb->prefix}orders LIMIT 3", ARRAY_A),
        );
        
        // 检查订单详情表
        $order_detail_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}order_details");
        $diagnostic_data['sample_data']['order_details'] = array(
            'count' => intval($order_detail_count),
            'sample' => $wpdb->get_results("SELECT id, order_id, item_id, item_name FROM {$wpdb->prefix}order_details LIMIT 3", ARRAY_A),
        );
        
        // 检查产品表
        $product_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}products");
        $diagnostic_data['sample_data']['products'] = array(
            'count' => intval($product_count),
            'sample' => $wpdb->get_results("SELECT id, part_number, model, spec FROM {$wpdb->prefix}products LIMIT 3", ARRAY_A),
        );
        
        // 检查耗材表
        $consumable_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}consumables");
        $diagnostic_data['sample_data']['consumables'] = array(
            'count' => intval($consumable_count),
            'sample' => $wpdb->get_results("SELECT id, part_number, model, spec FROM {$wpdb->prefix}consumables LIMIT 3", ARRAY_A),
        );
        
        // 测试产品信息解析器
        if (class_exists('BJT_Product_Info_Resolver')) {
            $resolver = new BJT_Product_Info_Resolver();
            $test_part_number = '92R01006'; // 使用已知的测试部件号
            $resolved_info = $resolver->resolve_product_info($test_part_number);
            $diagnostic_data['debug_info']['product_resolver_test'] = array(
                'test_part_number' => $test_part_number,
                'resolved_info' => $resolved_info,
            );
        }
        
    } catch (Exception $e) {
        $diagnostic_data['debug_info']['database_error'] = $e->getMessage();
    }
    
    // 检查PHP缓存状态
    $diagnostic_data['debug_info']['php_cache'] = array(
        'opcache_enabled' => function_exists('opcache_get_status') ? opcache_get_status() : 'Not available',
        'apc_enabled' => function_exists('apc_cache_info') ? 'Available' : 'Not available',
    );
    
    // 检查WordPress缓存
    $diagnostic_data['debug_info']['wp_cache'] = array(
        'object_cache' => wp_using_ext_object_cache(),
        'cache_plugins' => array(), // 可以扩展检查具体的缓存插件
    );
    
    return new WP_REST_Response($diagnostic_data, 200);
}

/**
 * Add a dashboard widget to the WordPress dashboard
 */
function bjt_add_dashboard_widget() {
    if (current_user_can('manage_options')) {
        wp_add_dashboard_widget(
            'bjt_product_api_status',
            'BJT Product API Status',
            'bjt_dashboard_widget_content'
        );
    }
}

function bjt_dashboard_widget_content() {
    echo '<p>BJT Product API Version: 1.1</p>';
    echo '<p>Plugin Path: ' . BJT_CORE_ENTITIES_PLUGIN_DIR . '</p>';
    echo '<p><a href="' . rest_url('bjt/v1/diagnostic') . '" target="_blank">View Diagnostic Info</a></p>';
}

// 添加仪表板小部件
add_action('wp_dashboard_setup', 'bjt_add_dashboard_widget');