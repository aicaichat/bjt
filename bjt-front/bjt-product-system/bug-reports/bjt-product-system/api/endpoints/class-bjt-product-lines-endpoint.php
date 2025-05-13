<?php
/**
 * The product lines API endpoint.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * The product lines API endpoint.
 *
 * Handles the product lines REST API routes.
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 * @author     BJT Team
 */
class BJT_Product_Lines_Endpoint {

    /**
     * The namespace of the API.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $namespace    The namespace of the API.
     */
    private $namespace;

    /**
     * The database handler.
     *
     * @since    1.0.0
     * @access   private
     * @var      BJT_Product_System_DB    $db    The database handler.
     */
    private $db;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param    string    $namespace    The namespace of the API.
     */
    public function __construct($namespace) {
        $this->namespace = $namespace;
        $this->db = new BJT_Product_System_DB();
    }

    /**
     * Register the REST API routes.
     *
     * @since    1.0.0
     */
    public function register_routes() {
        // Add a simple test endpoint that directly outputs JSON
        register_rest_route($this->namespace, '/test', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => function($request) {
                    header('Content-Type: application/json');
                    echo json_encode(array(
                        'success' => true,
                        'message' => 'API工作正常',
                        'namespace' => $this->namespace,
                        'time' => current_time('mysql')
                    ));
                    exit;
                },
                'permission_callback' => '__return_true',
            ),
        ));
        
        // Get all product lines
        register_rest_route($this->namespace, '/product-lines', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_product_lines'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args'                => $this->get_collection_params(),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'create_product_line'),
                'permission_callback' => array($this, 'create_item_permissions_check'),
                'args'                => $this->get_endpoint_args_for_item_schema(true),
            ),
        ));

        // Get, update, delete a specific product line
        register_rest_route($this->namespace, '/product-lines/(?P<id>[\d]+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_product_line'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array($this, 'update_product_line'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args'                => $this->get_endpoint_args_for_item_schema(false),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array($this, 'delete_product_line'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
        ));

        // Get host models for a product line
        register_rest_route($this->namespace, '/product-lines/(?P<id>[\d]+)/host-models', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_product_line_host_models'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args'                => $this->get_collection_params(),
            ),
        ));
    }

    /**
     * Check if a given request has access to get items.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function get_items_permissions_check($request) {
        // 允许所有用户访问产品线列表
        return true;
    }

    /**
     * Check if a given request has access to get a specific item.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function get_item_permissions_check($request) {
        return $this->get_items_permissions_check($request);
    }

    /**
     * Check if a given request has access to create items.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function create_item_permissions_check($request) {
        return current_user_can('manage_bjt_products');
    }

    /**
     * Check if a given request has access to update a specific item.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function update_item_permissions_check($request) {
        return $this->create_item_permissions_check($request);
    }

    /**
     * Check if a given request has access to delete a specific item.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function delete_item_permissions_check($request) {
        return $this->create_item_permissions_check($request);
    }

    /**
     * Get a collection of items.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function get_product_lines($request) {
        $args = array(
            'page'     => $request['page'] ? $request['page'] : 1,
            'per_page' => $request['per_page'] ? $request['per_page'] : 10,
            'orderby'  => $request['orderby'] ? $request['orderby'] : 'sort_order',
            'order'    => $request['order'] ? $request['order'] : 'ASC',
            'status'   => $request['status'] ? $request['status'] : 'publish'
        );

        $product_lines = $this->db->get_product_lines($args);
        
        // Add debug information to the error log
        error_log("BJT API Debug: Product lines response: " . json_encode($product_lines));

        if (empty($product_lines['items'])) {
            return rest_ensure_response(array(
                'success' => true,
                'data'    => array(
                    'items'       => array(),
                    'total'       => 0,
                    'page'        => $args['page'],
                    'per_page'    => $args['per_page'],
                    'total_pages' => 0
                )
            ));
        }

        // Process language
        $lang = $request['lang'] ? $request['lang'] : 'zh';
        
        if ($lang === 'en') {
            foreach ($product_lines['items'] as &$product_line) {
                $product_line['title'] = $product_line['title_en'];
                $product_line['description'] = $product_line['description_en'];
                $product_line['subitem1'] = $product_line['subitem1_en'];
                $product_line['subitem2'] = $product_line['subitem2_en'];
                $product_line['subitem3'] = $product_line['subitem3_en'];
            }
        } else {
            foreach ($product_lines['items'] as &$product_line) {
                $product_line['title'] = $product_line['title_zh'];
                $product_line['description'] = $product_line['description_zh'];
                $product_line['subitem1'] = $product_line['subitem1_zh'];
                $product_line['subitem2'] = $product_line['subitem2_zh'];
                $product_line['subitem3'] = $product_line['subitem3_zh'];
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'data'    => $product_lines
        ));
    }

    /**
     * Get one item from the collection.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function get_product_line($request) {
        $id = (int) $request['id'];
        
        $product_line = $this->db->get_product_line($id);

        if (empty($product_line)) {
            return new WP_Error(
                'rest_product_line_not_found',
                __('Product line not found.', 'bjt-product-system'),
                array('status' => 404)
            );
        }

        // Process language
        $lang = $request['lang'] ? $request['lang'] : 'zh';
        
        if ($lang === 'en') {
            $product_line['title'] = $product_line['title_en'];
            $product_line['description'] = $product_line['description_en'];
            $product_line['subitem1'] = $product_line['subitem1_en'];
            $product_line['subitem2'] = $product_line['subitem2_en'];
            $product_line['subitem3'] = $product_line['subitem3_en'];
        } else {
            $product_line['title'] = $product_line['title_zh'];
            $product_line['description'] = $product_line['description_zh'];
            $product_line['subitem1'] = $product_line['subitem1_zh'];
            $product_line['subitem2'] = $product_line['subitem2_zh'];
            $product_line['subitem3'] = $product_line['subitem3_zh'];
        }

        return rest_ensure_response(array(
            'success' => true,
            'data'    => $product_line
        ));
    }

    /**
     * Create one item from the collection.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function create_product_line($request) {
        $data = $this->prepare_item_for_database($request);

        $id = $this->db->add_product_line($data);

        if (!$id) {
            return new WP_Error(
                'rest_product_line_creation_failed',
                __('Failed to create the product line.', 'bjt-product-system'),
                array('status' => 500)
            );
        }

        $product_line = $this->db->get_product_line($id);

        return rest_ensure_response(array(
            'success' => true,
            'data'    => $product_line,
            'message' => __('Product line created successfully.', 'bjt-product-system')
        ));
    }

    /**
     * Update one item from the collection.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function update_product_line($request) {
        $id = (int) $request['id'];
        
        $product_line = $this->db->get_product_line($id);

        if (empty($product_line)) {
            return new WP_Error(
                'rest_product_line_not_found',
                __('Product line not found.', 'bjt-product-system'),
                array('status' => 404)
            );
        }

        $data = $this->prepare_item_for_database($request);

        $result = $this->db->update_product_line($id, $data);

        if (!$result) {
            return new WP_Error(
                'rest_product_line_update_failed',
                __('Failed to update the product line.', 'bjt-product-system'),
                array('status' => 500)
            );
        }

        $product_line = $this->db->get_product_line($id);

        return rest_ensure_response(array(
            'success' => true,
            'data'    => $product_line,
            'message' => __('Product line updated successfully.', 'bjt-product-system')
        ));
    }

    /**
     * Delete one item from the collection.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function delete_product_line($request) {
        $id = (int) $request['id'];
        
        $product_line = $this->db->get_product_line($id);

        if (empty($product_line)) {
            return new WP_Error(
                'rest_product_line_not_found',
                __('Product line not found.', 'bjt-product-system'),
                array('status' => 404)
            );
        }

        $result = $this->db->delete_product_line($id);

        if (!$result) {
            return new WP_Error(
                'rest_product_line_delete_failed',
                __('Failed to delete the product line.', 'bjt-product-system'),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Product line deleted successfully.', 'bjt-product-system')
        ));
    }

    /**
     * Get host models for a product line.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   WP_REST_Response
     */
    public function get_product_line_host_models($request) {
        $id = (int) $request['id'];
        
        $product_line = $this->db->get_product_line($id);

        if (empty($product_line)) {
            return new WP_Error(
                'rest_product_line_not_found',
                __('Product line not found.', 'bjt-product-system'),
                array('status' => 404)
            );
        }

        $args = array(
            'product_line_id' => $id,
            'page'     => $request['page'] ? $request['page'] : 1,
            'per_page' => $request['per_page'] ? $request['per_page'] : 10,
            'orderby'  => $request['orderby'] ? $request['orderby'] : 'sort_order',
            'order'    => $request['order'] ? $request['order'] : 'ASC',
            'status'   => $request['status'] ? $request['status'] : 'publish'
        );

        $host_models = $this->db->get_host_models($args);

        // Process language
        $lang = $request['lang'] ? $request['lang'] : 'zh';
        
        if ($lang === 'en') {
            foreach ($host_models['items'] as &$host_model) {
                $host_model['name'] = $host_model['name_en'];
                $host_model['description'] = $host_model['description_en'];
            }
        } else {
            foreach ($host_models['items'] as &$host_model) {
                $host_model['name'] = $host_model['model_name'];
                $host_model['description'] = $host_model['description_zh'];
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'data'    => $host_models
        ));
    }

    /**
     * Prepare the item for create or update operation.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Request object.
     * @return   array $prepared_item
     */
    protected function prepare_item_for_database($request) {
        $prepared_item = array();

        // Title (required)
        if (isset($request['title_zh'])) {
            $prepared_item['title_zh'] = sanitize_text_field($request['title_zh']);
        }
        if (isset($request['title_en'])) {
            $prepared_item['title_en'] = sanitize_text_field($request['title_en']);
        }

        // Description
        if (isset($request['description_zh'])) {
            $prepared_item['description_zh'] = sanitize_textarea_field($request['description_zh']);
        }
        if (isset($request['description_en'])) {
            $prepared_item['description_en'] = sanitize_textarea_field($request['description_en']);
        }

        // Sub items
        if (isset($request['subitem1_zh'])) {
            $prepared_item['subitem1_zh'] = sanitize_text_field($request['subitem1_zh']);
        }
        if (isset($request['subitem1_en'])) {
            $prepared_item['subitem1_en'] = sanitize_text_field($request['subitem1_en']);
        }
        if (isset($request['subitem2_zh'])) {
            $prepared_item['subitem2_zh'] = sanitize_text_field($request['subitem2_zh']);
        }
        if (isset($request['subitem2_en'])) {
            $prepared_item['subitem2_en'] = sanitize_text_field($request['subitem2_en']);
        }
        if (isset($request['subitem3_zh'])) {
            $prepared_item['subitem3_zh'] = sanitize_text_field($request['subitem3_zh']);
        }
        if (isset($request['subitem3_en'])) {
            $prepared_item['subitem3_en'] = sanitize_text_field($request['subitem3_en']);
        }

        // Image URL
        if (isset($request['image_url'])) {
            $prepared_item['image_url'] = esc_url_raw($request['image_url']);
        }

        // Code (required)
        if (isset($request['code'])) {
            $prepared_item['code'] = sanitize_key($request['code']);
        }

        // Status
        if (isset($request['status'])) {
            $prepared_item['status'] = sanitize_text_field($request['status']);
        }

        // Sort order
        if (isset($request['sort_order'])) {
            $prepared_item['sort_order'] = (int) $request['sort_order'];
        }

        return $prepared_item;
    }

    /**
     * Get the query params for collections.
     *
     * @since    1.0.0
     * @return   array
     */
    public function get_collection_params() {
        return array(
            'page' => array(
                'description'       => __('Current page of the collection.', 'bjt-product-system'),
                'type'              => 'integer',
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'description'       => __('Maximum number of items to be returned in result set.', 'bjt-product-system'),
                'type'              => 'integer',
                'default'           => 10,
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'description'       => __('Sort collection by object attribute.', 'bjt-product-system'),
                'type'              => 'string',
                'default'           => 'sort_order',
                'enum'              => array('id', 'title_zh', 'title_en', 'code', 'sort_order', 'created_at', 'updated_at'),
            ),
            'order' => array(
                'description'       => __('Order sort attribute ascending or descending.', 'bjt-product-system'),
                'type'              => 'string',
                'default'           => 'ASC',
                'enum'              => array('ASC', 'DESC'),
            ),
            'status' => array(
                'description'       => __('Status of the item.', 'bjt-product-system'),
                'type'              => 'string',
                'default'           => 'publish',
                'enum'              => array('publish', 'draft', 'trash'),
            ),
            'lang' => array(
                'description'       => __('Language for the response.', 'bjt-product-system'),
                'type'              => 'string',
                'default'           => 'zh',
                'enum'              => array('zh', 'en'),
            ),
        );
    }

    /**
     * Get the item schema for the endpoint.
     *
     * @since    1.0.0
     * @return   array
     */
    public function get_endpoint_args_for_item_schema($for_create = false) {
        $schema = array(
            'title_zh' => array(
                'description'       => __('Chinese title for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => $for_create,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'title_en' => array(
                'description'       => __('English title for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => $for_create,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'description_zh' => array(
                'description'       => __('Chinese description for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'description_en' => array(
                'description'       => __('English description for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'subitem1_zh' => array(
                'description'       => __('Chinese subitem 1 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'subitem1_en' => array(
                'description'       => __('English subitem 1 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'subitem2_zh' => array(
                'description'       => __('Chinese subitem 2 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'subitem2_en' => array(
                'description'       => __('English subitem 2 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'subitem3_zh' => array(
                'description'       => __('Chinese subitem 3 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'subitem3_en' => array(
                'description'       => __('English subitem 3 for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'image_url' => array(
                'description'       => __('Image URL for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'esc_url_raw',
            ),
            'code' => array(
                'description'       => __('Code for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => $for_create,
                'sanitize_callback' => 'sanitize_key',
            ),
            'status' => array(
                'description'       => __('Status for the product line.', 'bjt-product-system'),
                'type'              => 'string',
                'required'          => false,
                'default'           => 'publish',
                'enum'              => array('publish', 'draft', 'trash'),
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'sort_order' => array(
                'description'       => __('Sort order for the product line.', 'bjt-product-system'),
                'type'              => 'integer',
                'required'          => false,
                'default'           => 0,
                'sanitize_callback' => 'absint',
            ),
        );

        return $schema;
    }
} 