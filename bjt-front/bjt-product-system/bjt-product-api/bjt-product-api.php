<?php
error_log("BJT_DEBUG: VERY TOP OF FILE"); exit; // FORCED EXIT DEBUG
/**
 * Plugin Name: BJT Product API
 * Description: 产品管理系统REST API
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}
error_log("BJT_API: bjt-product-api.php TOP LEVEL EXECUTED"); // DEBUG TOP

ob_start();

// 定义插件常量
define('BJT_API_VERSION', '1.0.0');
define('BJT_API_PATH', plugin_dir_path(__FILE__));
define('BJT_API_URL', plugin_dir_url(__FILE__));
define('BJT_API_NAMESPACE', 'bjt/v1');

// 加载必要的文件
require_once BJT_API_PATH . 'includes/functions.php';
error_log("BJT_DEBUG: BEFORE require_once class-product-api-controller.php. Path: " . BJT_API_PATH . 'includes/class-product-api-controller.php'); // DEBUG LINE
// 主产品/机器等API的父控制器 (bjt-product/v1 namespace)
require_once BJT_API_PATH . 'includes/class-product-api-controller.php'; 
error_log("BJT_DEBUG: AFTER require_once class-product-api-controller.php. Class exists? " . (class_exists('BJT_Product_API_Controller') ? 'YES' : 'NO')); // DEBUG LINE
// 通用API控制器 (bjt/v1 namespace, if still used for other things)
require_once BJT_API_PATH . 'includes/class-api-controller.php'; 
require_once BJT_API_PATH . 'includes/class-auth.php';
require_once BJT_API_PATH . 'includes/class-database.php';

// 加载控制器
bjt_load_controllers();

/**
 * 初始化插件
 */
function bjt_api_init() {
    error_log("BJT_API: bjt_api_init CALLED"); 
    // 注册激活钩子
    register_activation_hook(__FILE__, 'bjt_api_activate');
    
    // 添加REST API初始化钩子
    add_action('rest_api_init', 'bjt_register_routes');
    
    // 修改CORS支持: 使用 rest_pre_serve_request filter
    add_filter('rest_pre_serve_request', 'bjt_rest_pre_serve_request_cors', 10, 4);
}
add_action('plugins_loaded', 'bjt_api_init');

/**
 * 加载所有控制器
 */
function bjt_load_controllers() {
    error_log("BJT_API: bjt_load_controllers CALLED"); 
    foreach (glob(BJT_API_PATH . 'controllers/class-*.php') as $file) {
        error_log("BJT_API: Loading controller file: " . $file); 
        require_once $file;
    }
}

/**
 * 注册所有API路由
 */
function bjt_register_routes() {
    error_log("BJT_API: bjt_register_routes CALLED - Top"); 
    $controllers = [
        'BJT_Product_Controller',
        'BJT_Accessory_Controller',
        'BJT_Machine_Controller',
        'BJT_Consumable_Controller',
        'BJT_Sparepart_Controller',
        'BJT_Cart_Controller',
        'BJT_Order_Controller'
    ];
    
    foreach ($controllers as $controller_class_name) {
        error_log("BJT_API: Checking controller class: " . $controller_class_name); 
        if (class_exists($controller_class_name, false)) { 
            error_log("BJT_API: Class " . $controller_class_name . " EXISTS. Instantiating..."); 
            $instance = new $controller_class_name();
            if (method_exists($instance, 'register_routes')) {
                error_log("BJT_API: Calling register_routes() for " . $controller_class_name); 
                $instance->register_routes();
            } else {
                error_log("BJT_API: Method register_routes() DOES NOT EXIST for " . $controller_class_name); 
            }
        } else {
            error_log("BJT_API: Class " . $controller_class_name . " DOES NOT EXIST."); 
        }
    }
    error_log("BJT_API: bjt_register_routes FINISHED"); 
}

/**
 * 处理CORS和预检请求 for REST API
 */
function bjt_rest_pre_serve_request_cors($served, $result, $request, $server) {
    $server->send_header('Access-Control-Allow-Origin', '*');
    $server->send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    $server->send_header('Access-Control-Allow-Credentials', 'true');
    $server->send_header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if ($request->get_method() === 'OPTIONS') {
        return true; 
    }
    return $served;
}

/**
 * 插件激活时执行
 */
function bjt_api_activate() {
    BJT_Database::check_tables();
    if (!get_option('bjt_jwt_secret')) {
        update_option('bjt_jwt_secret', wp_generate_password(32, true, true));
    }
    flush_rewrite_rules();
}

register_shutdown_function(function() {
    if (defined('REST_REQUEST') && REST_REQUEST && ob_get_length() > 0) {
        $last_error = error_get_last();
        if ($last_error && in_array($last_error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
            // error_log("BJT API: Cleared output buffer due to error: " . print_r($last_error, true));
        } else if (http_response_code() == 200 ) {
            // error_log("BJT API: REST_REQUEST shutdown with unflushed buffer: " . ob_get_contents());
        }
    }
    if(ob_get_level() > 0) {
      //  ob_end_flush();
    }
}); 
?> 