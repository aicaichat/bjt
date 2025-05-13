<?php
/**
 * Plugin Name: BJT Product API
 * Description: REST API for BJT Product Management System
 * Version: 1.0.0
 * Author: BJT Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_API {
    private static $instance = null;
    
    // Singleton pattern
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Register REST API routes when WordPress initializes the REST API
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    /**
     * Register all API routes
     */
    public function register_routes() {
        $namespace = 'bjt/v1';
        
        // Product Lines
        register_rest_route($namespace, '/product-lines', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_product_lines'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_product_line'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
        ]);
        
        register_rest_route($namespace, '/product-lines/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_product_line'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_product_line'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_product_line'],
                'permission_callback' => [$this, 'check_delete_permission'],
            ],
        ]);
        
        // Host Models
        register_rest_route($namespace, '/host-models', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_host_models'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_host_model'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
        ]);
        
        register_rest_route($namespace, '/host-models/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_host_model'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_host_model'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_host_model'],
                'permission_callback' => [$this, 'check_delete_permission'],
            ],
        ]);
        
        // Get host models by product line
        register_rest_route($namespace, '/product-lines/(?P<id>[\d]+)/host-models', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_product_line_host_models'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Accessory Models
        register_rest_route($namespace, '/accessory-models', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_accessory_models'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Parts
        register_rest_route($namespace, '/parts', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_parts'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Accessories
        register_rest_route($namespace, '/accessories', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Consumables
        register_rest_route($namespace, '/consumables', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_consumables'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Spare Parts
        register_rest_route($namespace, '/spare-parts', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_spare_parts'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
        
        // Add more endpoints as needed...
        
        // API Documentation
        register_rest_route($namespace, '/docs', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_api_docs'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
        ]);
    }
    
    /**
     * Product Lines API Methods
     */
    public function get_product_lines($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        $products = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish' ORDER BY sort_order ASC");
        
        return rest_ensure_response($products);
    }
    
    public function get_product_line($request) {
        global $wpdb;
        
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        
        if (!$product) {
            return new WP_Error('not_found', 'Product line not found', ['status' => 404]);
        }
        
        return rest_ensure_response($product);
    }
    
    public function create_product_line($request) {
        global $wpdb;
        
        $params = $request->get_params();
        
        // Validate required fields
        if (empty($params['title_zh']) || empty($params['title_en']) || empty($params['code'])) {
            return new WP_Error('missing_fields', 'Missing required fields', ['status' => 400]);
        }
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // Check if code already exists
        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s", $params['code']));
        if ($existing) {
            return new WP_Error('duplicate_code', 'A product line with this code already exists', ['status' => 400]);
        }
        
        // Prepare data for insertion
        $data = [
            'title_zh' => sanitize_text_field($params['title_zh']),
            'title_en' => sanitize_text_field($params['title_en']),
            'description_zh' => isset($params['description_zh']) ? sanitize_textarea_field($params['description_zh']) : '',
            'description_en' => isset($params['description_en']) ? sanitize_textarea_field($params['description_en']) : '',
            'subitem1_zh' => isset($params['subitem1_zh']) ? sanitize_text_field($params['subitem1_zh']) : '',
            'subitem1_en' => isset($params['subitem1_en']) ? sanitize_text_field($params['subitem1_en']) : '',
            'subitem2_zh' => isset($params['subitem2_zh']) ? sanitize_text_field($params['subitem2_zh']) : '',
            'subitem2_en' => isset($params['subitem2_en']) ? sanitize_text_field($params['subitem2_en']) : '',
            'subitem3_zh' => isset($params['subitem3_zh']) ? sanitize_text_field($params['subitem3_zh']) : '',
            'subitem3_en' => isset($params['subitem3_en']) ? sanitize_text_field($params['subitem3_en']) : '',
            'image_url' => isset($params['image_url']) ? esc_url_raw($params['image_url']) : '',
            'code' => sanitize_text_field($params['code']),
            'status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'publish',
            'sort_order' => isset($params['sort_order']) ? intval($params['sort_order']) : 0,
        ];
        
        // Insert data
        $result = $wpdb->insert($table_name, $data);
        
        if (false === $result) {
            return new WP_Error('db_error', 'Could not insert product line', ['status' => 500]);
        }
        
        $product_id = $wpdb->insert_id;
        
        // Return the created product
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $product_id));
        
        return rest_ensure_response($product);
    }
    
    public function update_product_line($request) {
        global $wpdb;
        
        $id = $request['id'];
        $params = $request->get_params();
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // Check if product exists
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        if (!$product) {
            return new WP_Error('not_found', 'Product line not found', ['status' => 404]);
        }
        
        // Prepare data for update
        $data = [];
        $fields = [
            'title_zh', 'title_en', 'description_zh', 'description_en', 
            'subitem1_zh', 'subitem1_en', 'subitem2_zh', 'subitem2_en', 
            'subitem3_zh', 'subitem3_en', 'image_url', 'code', 
            'status', 'sort_order'
        ];
        
        foreach ($fields as $field) {
            if (isset($params[$field])) {
                if ($field === 'image_url') {
                    $data[$field] = esc_url_raw($params[$field]);
                } elseif ($field === 'sort_order') {
                    $data[$field] = intval($params[$field]);
                } elseif (in_array($field, ['description_zh', 'description_en'])) {
                    $data[$field] = sanitize_textarea_field($params[$field]);
                } else {
                    $data[$field] = sanitize_text_field($params[$field]);
                }
            }
        }
        
        // If code is being updated, check for duplicates
        if (isset($data['code']) && $data['code'] !== $product->code) {
            $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s AND id != %d", $data['code'], $id));
            if ($existing) {
                return new WP_Error('duplicate_code', 'A product line with this code already exists', ['status' => 400]);
            }
        }
        
        // Update data
        $result = $wpdb->update($table_name, $data, ['id' => $id]);
        
        if (false === $result) {
            return new WP_Error('db_error', 'Could not update product line', ['status' => 500]);
        }
        
        // Return the updated product
        $updated_product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        
        return rest_ensure_response($updated_product);
    }
    
    public function delete_product_line($request) {
        global $wpdb;
        
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // Check if product exists
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        if (!$product) {
            return new WP_Error('not_found', 'Product line not found', ['status' => 404]);
        }
        
        // Delete product
        $result = $wpdb->delete($table_name, ['id' => $id]);
        
        if (false === $result) {
            return new WP_Error('db_error', 'Could not delete product line', ['status' => 500]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Product line deleted successfully',
        ]);
    }
    
    /**
     * Host Models API Methods
     */
    public function get_host_models($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_host_models';
        $models = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish' ORDER BY sort_order ASC");
        
        return rest_ensure_response($models);
    }
    
    public function get_host_model($request) {
        global $wpdb;
        
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'bjt_host_models';
        $model = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        
        if (!$model) {
            return new WP_Error('not_found', 'Host model not found', ['status' => 404]);
        }
        
        return rest_ensure_response($model);
    }
    
    public function get_product_line_host_models($request) {
        global $wpdb;
        
        $product_line_id = $request['id'];
        $table_name = $wpdb->prefix . 'bjt_host_models';
        $models = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE product_line_id = %d AND status = 'publish' ORDER BY sort_order ASC",
            $product_line_id
        ));
        
        return rest_ensure_response($models);
    }
    
    // Implement other host model methods (create, update, delete) similarly to product lines
    
    /**
     * Accessory Models API Methods
     */
    public function get_accessory_models($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_accessory_models';
        $models = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish' ORDER BY sort_order ASC");
        
        return rest_ensure_response($models);
    }
    
    /**
     * Parts API Methods
     */
    public function get_parts($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_parts';
        $parts = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish'");
        
        return rest_ensure_response($parts);
    }
    
    /**
     * Accessories API Methods
     */
    public function get_accessories($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_accessories';
        $accessories = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish'");
        
        return rest_ensure_response($accessories);
    }
    
    /**
     * Consumables API Methods
     */
    public function get_consumables($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_consumables';
        $consumables = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish'");
        
        return rest_ensure_response($consumables);
    }
    
    /**
     * Spare Parts API Methods
     */
    public function get_spare_parts($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_spare_parts';
        $spare_parts = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish'");
        
        return rest_ensure_response($spare_parts);
    }
    
    /**
     * API Documentation
     */
    public function get_api_docs($request) {
        $docs = [
            'title' => 'BJT Product API Documentation',
            'version' => '1.0.0',
            'description' => 'API for BJT Product Management System',
            'endpoints' => [
                [
                    'path' => '/bjt/v1/product-lines',
                    'methods' => ['GET', 'POST'],
                    'description' => 'Get all product lines or create a new one',
                ],
                [
                    'path' => '/bjt/v1/product-lines/{id}',
                    'methods' => ['GET', 'PUT', 'DELETE'],
                    'description' => 'Get, update or delete a specific product line',
                ],
                [
                    'path' => '/bjt/v1/host-models',
                    'methods' => ['GET', 'POST'],
                    'description' => 'Get all host models or create a new one',
                ],
                [
                    'path' => '/bjt/v1/host-models/{id}',
                    'methods' => ['GET', 'PUT', 'DELETE'],
                    'description' => 'Get, update or delete a specific host model',
                ],
                [
                    'path' => '/bjt/v1/product-lines/{id}/host-models',
                    'methods' => ['GET'],
                    'description' => 'Get host models for a specific product line',
                ],
                // Add documentation for other endpoints...
            ],
        ];
        
        return rest_ensure_response($docs);
    }
    
    /**
     * Permission Callbacks
     */
    public function check_read_permission() {
        return true; // Public read access
    }
    
    public function check_write_permission() {
        return current_user_can('edit_posts'); // Require edit capability
    }
    
    public function check_delete_permission() {
        return current_user_can('delete_posts'); // Require delete capability
    }
}

// Initialize the plugin
BJT_Product_API::get_instance(); 