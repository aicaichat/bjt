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

// Define a constant for the plugin directory path
if ( ! defined( 'BJT_CORE_ENTITIES_PLUGIN_DIR' ) ) {
    define( 'BJT_CORE_ENTITIES_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Adds CORS headers to allow cross-origin requests from the frontend.
 */
function bjt_add_cors_headers() {
    // Allow requests from your frontend development server
    header("Access-Control-Allow-Origin: *");
    // Allow common methods
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Allow common headers, including Authorization for tokens
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    // Allow credentials (cookies, authorization headers)
    header("Access-Control-Allow-Credentials: true");

    // For OPTIONS pre-flight requests, send a 200 OK and exit early.
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
}
// Hook into 'rest_api_init' with a high priority (e.g., 1) to ensure CORS headers are set early.
add_action('rest_api_init', 'bjt_add_cors_headers', 1);

// Include necessary files
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-database.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-bjt-api-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-auth.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/functions.php';

// Controller Includes
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-auth-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-product-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-machine-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-accessory-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-consumable-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-spare-part-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-cart-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-order-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-price-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-inventory-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-dictionary-controller.php';

// Helper function to get current token from request
if (!function_exists('bjt_get_current_token')) {
    function bjt_get_current_token() {
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
    // Auth Controller
    $auth_controller = new BJT_Auth_Controller();
    $auth_controller->register_routes();

    // Product Lines Controller
    $product_controller = new BJT_Product_Controller();
    $product_controller->register_routes();

    // Machines Controller
    $machine_controller = new BJT_Machine_Controller();
    $machine_controller->register_routes();

    // Accessory Models Controller
    $accessory_model_controller = new BJT_Accessory_Controller();
    $accessory_model_controller->register_routes();
    
    // Consumables Controller
    $consumable_controller = new BJT_Consumable_Controller();
    $consumable_controller->register_routes();

    // Spare Parts Controller
    $spare_part_controller = new BJT_Spare_Part_Controller();
    $spare_part_controller->register_routes();
    
    // Cart Controller
    $cart_controller = new BJT_Cart_Controller();
    $cart_controller->register_routes();
    
    // Order Controller
    $order_controller = new BJT_Order_Controller();
    $order_controller->register_routes();
    
    // Price Controller
    $price_controller = new BJT_Price_Controller();
    $price_controller->register_routes();
    
    // Inventory Controller
    $inventory_controller = new BJT_Inventory_Controller();
    $inventory_controller->register_routes();
    
    // Dictionary Controller
    $dictionary_controller = new BJT_Dictionary_Controller();
    $dictionary_controller->register_routes();
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
    
    // Get the response data
    $data = $response->get_data();
    
    // If data is an array and doesn't already have a success field, add it
    if (is_array($data) && !isset($data['success'])) {
        // If response already has a proper structured format, just add success field
        $data['success'] = true;
        $response->set_data($data);
    }
    // Otherwise, if data isn't an array or has another structure, wrap it
    else if (!isset($data['success'])) {
        $response->set_data([
            'success' => true,
            'data' => $data
        ]);
    }
    
    return $response;
}
add_filter('rest_request_after_callbacks', 'bjt_prepare_success_response', 10, 3);

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
        set_error_handler('bjt_rest_error_handler');
        register_shutdown_function('bjt_rest_shutdown_handler');
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
    header('Content-Type: application/json');
    status_header(500);
    
    $error_response = [
        'success' => false,
        'code' => 'php_error',
        'message' => 'Internal server error occurred.',
        'data' => [
            'status' => 500,
            'details' => "Error in $errfile:$errline - $errstr"
        ]
    ];
    
    echo json_encode($error_response);
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
        
        // Clear any existing output buffers
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        // Set appropriate headers
        header('Content-Type: application/json');
        status_header(500);
        
        $error_response = [
            'success' => false,
            'code' => 'php_fatal_error',
            'message' => 'A critical error occurred while processing your request.',
            'data' => [
                'status' => 500,
                'details' => $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line']
            ]
        ];
        
        echo json_encode($error_response);
    }
}
// Register the debug endpoint with a lower priority than the main routes
// to ensure it can see all registered routes
add_action('rest_api_init', 'bjt_register_debug_endpoint', 20);