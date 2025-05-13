<?php
/**
 * The API functionality of the plugin.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * The API functionality of the plugin.
 *
 * Defines the plugin name, version, and registers the REST API routes.
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api
 * @author     BJT Team
 */
class BJT_Product_System_API {

    /**
     * The namespace of the API.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $namespace    The namespace of the API.
     */
    private $namespace = 'bjt/v1';

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     */
    public function __construct() {
        // Load API endpoint classes
        $this->load_endpoints();
    }

    /**
     * Load API endpoint classes
     *
     * @since    1.0.0
     */
    private function load_endpoints() {
        // Include API endpoint classes
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-product-lines-endpoint.php';
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-host-models-endpoint.php';
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-accessories-endpoint.php';
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-consumables-endpoint.php';
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-spare-parts-endpoint.php';
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/endpoints/class-bjt-auth-endpoint.php';
    }

    /**
     * Register the REST API routes.
     *
     * @since    1.0.0
     */
    public function register_routes() {
        error_log('BJT API: Starting to register routes with namespace ' . $this->namespace);
        
        // Register product lines routes
        $product_lines_endpoint = new BJT_Product_Lines_Endpoint($this->namespace);
        $product_lines_endpoint->register_routes();
        error_log('BJT API: Product lines routes registered');

        // Register host models routes
        $host_models_endpoint = new BJT_Host_Models_Endpoint($this->namespace);
        $host_models_endpoint->register_routes();
        error_log('BJT API: Host models routes registered');

        // Register accessories routes
        $accessories_endpoint = new BJT_Accessories_Endpoint($this->namespace);
        $accessories_endpoint->register_routes();
        error_log('BJT API: Accessories routes registered');

        // Register consumables routes
        $consumables_endpoint = new BJT_Consumables_Endpoint($this->namespace);
        $consumables_endpoint->register_routes();
        error_log('BJT API: Consumables routes registered');

        // Register spare parts routes
        $spare_parts_endpoint = new BJT_Spare_Parts_Endpoint($this->namespace);
        $spare_parts_endpoint->register_routes();
        error_log('BJT API: Spare parts routes registered');

        // Register authentication routes
        $auth_endpoint = new BJT_Auth_Endpoint($this->namespace);
        $auth_endpoint->register_routes();
        error_log('BJT API: Auth routes registered');
        
        error_log('BJT API: All routes registered successfully');
    }
} 