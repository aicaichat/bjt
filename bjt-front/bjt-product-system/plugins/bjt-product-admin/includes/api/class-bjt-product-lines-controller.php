<?php
/**
 * BJT Product Lines API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复加载
if (!class_exists('BJT_Product_Lines_Controller')) {

class BJT_Product_Lines_Controller extends WP_REST_Controller {
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'product-lines';

    /**
     * Constructor
     */
    public function __construct() {
        $this->namespace = 'bjt/v1';
        $this->rest_base = 'product-lines';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // 获取产品线列表
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args' => $this->get_collection_params()
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => array($this, 'create_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE)
            )
        ));

        // 获取单个产品线
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the product line.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true
                    )
                )
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_item'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE)
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_item'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args' => array(
                    'force' => array(
                        'type' => 'boolean',
                        'default' => false,
                        'description' => __('Whether to bypass trash and force deletion.', 'bjt-product-admin')
                    )
                )
            )
        ));

        // 批量操作
        register_rest_route($this->namespace, '/' . $this->rest_base . '/batch', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'batch_items'),
                'permission_callback' => array($this, 'batch_items_permissions_check'),
                'args' => array(
                    'ids' => array(
                        'required' => true,
                        'type' => 'array',
                        'items' => array(
                            'type' => 'integer'
                        ),
                        'description' => __('Array of product line IDs.', 'bjt-product-admin')
                    ),
                    'action' => array(
                        'required' => true,
                        'type' => 'string',
                        'enum' => array('delete', 'trash', 'restore', 'publish', 'draft'),
                        'description' => __('Action to perform.', 'bjt-product-admin')
                    )
                )
            )
        ));
    }

    public function get_items($request) {
        $args = array(
            'page' => $request->get_param('page') ?: 1,
            'page_size' => $request->get_param('page_size') ?: 10,
            'status' => $request->get_param('status'),
            'search' => $request->get_param('search'),
            'lang' => $request->get_param('lang') ?: 'en'
        );

        $product_lines = BJT_Product_Line_Management::get_instance()->get_product_lines($args);

        if (is_wp_error($product_lines)) {
            return new WP_Error(
                'rest_product_lines_error',
                $product_lines->get_error_message(),
                array('status' => 500)
            );
        }

        return rest_ensure_response($product_lines);
    }

    public function get_item($request) {
        $id = $request->get_param('id');
        $lang = $request->get_param('lang') ?: 'en';

        $product_line = BJT_Product_Line_Management::get_instance()->get_product_line($id, $lang);

        if (is_wp_error($product_line)) {
            return new WP_Error(
                'rest_product_line_not_found',
                __('Product line not found.', 'bjt-product-admin'),
                array('status' => 404)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $product_line
        ));
    }

    public function create_item($request) {
        $data = $this->prepare_item_for_database($request);

        $result = BJT_Product_Line_Management::get_instance()->create_product_line($data);

        if (is_wp_error($result)) {
            return new WP_Error(
                'rest_product_line_creation_error',
                $result->get_error_message(),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $result,
            'message' => __('Product line created successfully.', 'bjt-product-admin')
        ));
    }

    public function update_item($request) {
        $id = $request->get_param('id');
        $data = $this->prepare_item_for_database($request);

        $result = BJT_Product_Line_Management::get_instance()->update_product_line($id, $data);

        if (is_wp_error($result)) {
            return new WP_Error(
                'rest_product_line_update_error',
                $result->get_error_message(),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $result,
            'message' => __('Product line updated successfully.', 'bjt-product-admin')
        ));
    }

    public function delete_item($request) {
        $id = $request->get_param('id');
        $force = $request->get_param('force');

        $result = BJT_Product_Line_Management::get_instance()->delete_product_line($id, $force);

        if (is_wp_error($result)) {
            return new WP_Error(
                'rest_product_line_deletion_error',
                $result->get_error_message(),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Product line deleted successfully.', 'bjt-product-admin')
        ));
    }

    public function batch_items($request) {
        $ids = $request->get_param('ids');
        $action = $request->get_param('action');

        $result = BJT_Product_Line_Management::get_instance()->batch_update_product_lines($ids, $action);

        if (is_wp_error($result)) {
            return new WP_Error(
                'rest_product_line_batch_error',
                $result->get_error_message(),
                array('status' => 500)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $result,
            'message' => __('Batch operation completed successfully.', 'bjt-product-admin')
        ));
    }

    public function get_items_permissions_check($request) {
        return current_user_can('manage_options');
    }

    public function get_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    public function create_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    public function update_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    public function delete_item_permissions_check($request) {
        return current_user_can('manage_options');
    }

    public function batch_items_permissions_check($request) {
        return current_user_can('manage_options');
    }

    protected function prepare_item_for_database($request) {
        return array(
            'code' => $request->get_param('code'),
            'name_cn' => $request->get_param('name_cn'),
            'name_en' => $request->get_param('name_en'),
            'description_cn' => $request->get_param('description_cn'),
            'description_en' => $request->get_param('description_en'),
            'image_url' => $request->get_param('image_url'),
            'status' => $request->get_param('status'),
            'menu_order' => $request->get_param('menu_order')
        );
    }

    public function get_collection_params() {
        return array(
            'page' => array(
                'description' => __('Current page of the collection.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
                'sanitize_callback' => 'absint'
            ),
            'page_size' => array(
                'description' => __('Maximum number of items to be returned in result set.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
                'sanitize_callback' => 'absint'
            ),
            'status' => array(
                'description' => __('Limit result set to items with specific status.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('publish', 'draft', 'trash'),
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'search' => array(
                'description' => __('Limit result set to items with specific search terms.', 'bjt-product-admin'),
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'lang' => array(
                'description' => __('Language for the response.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('en', 'zh'),
                'default' => 'en',
                'sanitize_callback' => 'sanitize_text_field'
            )
        );
    }

    /**
     * Get the endpoint args for item schema.
     *
     * @param string $method Optional. HTTP method of the request.
     * @return array Endpoint arguments.
     */
    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $schema = $this->get_item_schema();
        $args = array();

        foreach ($schema['properties'] as $key => $options) {
            $args[$key] = array(
                'type' => isset($options['type']) ? $options['type'] : 'string',
                'description' => isset($options['description']) ? $options['description'] : '',
                'required' => isset($options['required']) && $options['required'],
            );

            if (isset($options['enum'])) {
                $args[$key]['enum'] = $options['enum'];
            }

            if (isset($options['default'])) {
                $args[$key]['default'] = $options['default'];
            }
        }

        if ($method === WP_REST_Server::CREATABLE || $method === WP_REST_Server::EDITABLE) {
            // Add additional validation for create/update operations
            if (isset($args['code'])) {
                $args['code']['pattern'] = '^[a-z0-9-_]+$';
            }
            if (isset($args['image_url'])) {
                $args['image_url']['format'] = 'uri';
            }
        }

        return $args;
    }

    /**
     * Get the item schema
     */
    public function get_item_schema() {
        $schema = array(
            '$schema' => 'http://json-schema.org/draft-04/schema#',
            'title' => 'product_line',
            'type' => 'object',
            'properties' => array(
                'id' => array(
                    'description' => __('Unique identifier for the product line.', 'bjt-product-admin'),
                    'type' => 'integer',
                    'readonly' => true,
                ),
                'code' => array(
                    'description' => __('Unique code for the product line.', 'bjt-product-admin'),
                    'type' => 'string',
                    'required' => true,
                ),
                'name_cn' => array(
                    'description' => __('Product line name in Chinese.', 'bjt-product-admin'),
                    'type' => 'string',
                    'required' => true,
                ),
                'name_en' => array(
                    'description' => __('Product line name in English.', 'bjt-product-admin'),
                    'type' => 'string',
                    'required' => true,
                ),
                'description_cn' => array(
                    'description' => __('Product line description in Chinese.', 'bjt-product-admin'),
                    'type' => 'string',
                ),
                'description_en' => array(
                    'description' => __('Product line description in English.', 'bjt-product-admin'),
                    'type' => 'string',
                ),
                'image_url' => array(
                    'description' => __('URL for the product line image.', 'bjt-product-admin'),
                    'type' => 'string',
                ),
                'status' => array(
                    'description' => __('Status of the product line.', 'bjt-product-admin'),
                    'type' => 'string',
                    'enum' => array('publish', 'draft', 'trash'),
                    'default' => 'draft',
                ),
                'menu_order' => array(
                    'description' => __('Order of the product line in lists.', 'bjt-product-admin'),
                    'type' => 'integer',
                    'default' => 0,
                ),
                'created_at' => array(
                    'description' => __('Creation date of the product line.', 'bjt-product-admin'),
                    'type' => 'string',
                    'readonly' => true,
                ),
                'updated_at' => array(
                    'description' => __('Last update date of the product line.', 'bjt-product-admin'),
                    'type' => 'string',
                    'readonly' => true,
                ),
            ),
        );

        return $schema;
    }
}

} // class_exists 检查的结尾 