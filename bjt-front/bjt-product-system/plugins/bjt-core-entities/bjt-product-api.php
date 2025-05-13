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

// Define a constant for the plugin directory path
if ( ! defined( 'BJT_CORE_ENTITIES_PLUGIN_DIR' ) ) {
    define( 'BJT_CORE_ENTITIES_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Adds CORS headers to allow cross-origin requests from the frontend.
 */
function bjt_add_cors_headers() {
    // Allow requests from your frontend development server
    header("Access-Control-Allow-Origin: http://localhost:5173");
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

// Controller Includes
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-auth-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-product-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-machine-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-accessory-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-consumable-controller.php';
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'controllers/class-spare-part-controller.php';

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
}
add_action('rest_api_init', 'bjt_api_register_routes');

/**
 * Deactivation hook: Clean up if necessary.
 */
function bjt_api_deactivate() {
    // e.g., remove scheduled cron jobs if any
}
register_deactivation_hook(__FILE__, 'bjt_api_deactivate'); 