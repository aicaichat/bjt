<?php
/**
 * BJT API Controller Class
 *
 * Handles all API requests and responses.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_API_Controller {
    protected $wpdb;
    protected $namespace = 'bjt/v1';
    protected $rest_base;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    /**
     * Register routes for API endpoints
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args' => $this->get_collection_params(),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => array($this, 'create_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ),
        ));

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the object.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ),
                    'lang' => array(
                        'description' => __('Language code for the response.', 'bjt-product-admin'),
                        'type' => 'string',
                        'enum' => array('zh', 'en'),
                        'default' => 'zh',
                    ),
                    'region' => array(
                        'description' => __('Region code for prices and inventory.', 'bjt-product-admin'),
                        'type' => 'string',
                        'default' => 'CN',
                    ),
                    'context' => array(
                        'description' => __('Scope under which the request is made; determines fields present in response.', 'bjt-product-admin'),
                        'type' => 'string',
                        'default' => 'view'
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_item'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_item'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the object.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ),
                    'force' => array(
                        'type' => 'boolean',
                        'default' => false,
                        'description' => __('Whether to bypass trash and force deletion.', 'bjt-product-admin'),
                    ),
                ),
            ),
        ));
    }

    /**
     * Format API response
     */
    protected function format_response($data, $status = true, $code = 200, $message = '') {
        return new WP_REST_Response(array(
            'success' => $status,
            'data' => $data,
            'message' => $message,
            'code' => $code
        ), $code);
    }

    /**
     * Format error response
     */
    protected function format_error($message, $code = 400, $data = null) {
        return new WP_Error(
            'bjt_api_error',
            $message,
            array(
                'status' => $code,
                'data' => $data
            )
        );
    }

    /**
     * Check if a given request has access to get items
     */
    public function get_items_permissions_check($request) {
        return true; // Public access for read operations
    }

    /**
     * Check if a given request has access to get a specific item
     */
    public function get_item_permissions_check($request) {
        return true; // Public access for read operations
    }

    /**
     * Check if a given request has access to create items
     */
    public function create_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    /**
     * Check if a given request has access to update a specific item
     */
    public function update_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    /**
     * Check if a given request has access to delete a specific item
     */
    public function delete_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    /**
     * Get collection parameters
     */
    protected function get_collection_params() {
        return array(
            'page' => array(
                'description' => __('Current page of the collection.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'description' => __('Maximum number of items to be returned in result set.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
                'sanitize_callback' => 'absint',
            ),
            'lang' => array(
                'description' => __('Language code for the response.', 'bjt-product-admin'),
                'type' => 'string',
                'default' => 'zh',
                'enum' => array('zh', 'en'),
            ),
            'region' => array(
                'description' => __('Region code for prices and inventory.', 'bjt-product-admin'),
                'type' => 'string',
                'default' => 'CN',
            ),
        );
    }

    /**
     * Get the query params for collections of attachments.
     */
    protected function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $params = array();
        
        if ($method === WP_REST_Server::CREATABLE || $method === WP_REST_Server::EDITABLE) {
            $params['name_cn'] = array(
                'description' => __('Chinese name for the object.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true,
            );
            $params['name_en'] = array(
                'description' => __('English name for the object.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true,
            );
            $params['description_cn'] = array(
                'description' => __('Chinese description for the object.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['description_en'] = array(
                'description' => __('English description for the object.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['status'] = array(
                'description' => __('Status of the object.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('publish', 'draft', 'private'),
                'default' => 'publish',
            );
        }

        return $params;
    }

    /**
     * Prepare a response for inserting into a collection.
     */
    protected function prepare_item_for_response($item, $request) {
        $lang = $request->get_param('lang') ?: 'zh';
        $data = array(
            'id' => (int) $item['id'],
            'name' => $item['name_' . $lang],
            'description' => $item['description_' . $lang],
            'status' => $item['status'],
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at'],
        );

        return $data;
    }

    /**
     * Prepare links for the request.
     */
    protected function prepare_links($item) {
        $base = sprintf('/%s/%s', $this->namespace, $this->rest_base);

        $links = array(
            'self' => array(
                'href' => rest_url(trailingslashit($base) . $item['id']),
            ),
            'collection' => array(
                'href' => rest_url($base),
            ),
        );

        return $links;
    }
} 