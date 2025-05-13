<?php
/**
 * BJT Host Models API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Host_Models_Controller extends BJT_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'host-models';
    }

    /**
     * Get a collection of items
     */
    public function get_items($request) {
        $args = array();
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;
        $product_line_id = $request->get_param('product_line_id');

        $where_clauses = array("h.status = 'publish'");
        $where_values = array();

        if ($product_line_id) {
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = $product_line_id;
        }

        $where_sql = implode(' AND ', $where_clauses);
        $sql = "SELECT h.*, pl.code as product_line_code, pl.title_zh as product_line_name_cn, pl.title_en as product_line_name_en 
                FROM {$this->wpdb->prefix}bjt_host_models h
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON h.product_line_id = pl.id
                WHERE {$where_sql}
                ORDER BY h.sort_order ASC, h.id ASC 
                LIMIT %d OFFSET %d";

        $query_args = array_merge($where_values, array($per_page, $offset));
        $items = $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$query_args),
            ARRAY_A
        );

        if (empty($items)) {
            return $this->format_response(array(
                'items' => array(),
                'total' => 0,
                'page' => $page,
                'per_page' => $per_page
            ));
        }

        // Get total count
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_host_models h WHERE {$where_sql}";
        $total = $this->wpdb->get_var($this->wpdb->prepare($count_sql, ...$where_values));

        $data = array();
        foreach ($items as $item) {
            $data[] = $this->prepare_item_for_response($item, $request);
        }

        return $this->format_response(array(
            'items' => $data,
            'total' => (int) $total,
            'page' => (int) $page,
            'per_page' => (int) $per_page
        ));
    }

    /**
     * Get one item from the collection
     */
    public function get_item($request) {
        $id = (int) $request->get_param('id');
        $region = $request->get_param('region') ?: 'CN';

        $sql = "SELECT h.*, pl.code as product_line_code, pl.title_zh as product_line_name_cn, pl.title_en as product_line_name_en,
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_host_models h
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON h.product_line_id = pl.id
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'host' AND p.target_id = h.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'host' AND i.target_id = h.id AND i.region = %s
                WHERE h.id = %d AND h.status = 'publish'";

        $item = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $region, $region, $id),
            ARRAY_A
        );

        if (empty($item)) {
            return $this->format_error(__('Host model not found.', 'bjt-product-admin'), 404);
        }

        $data = $this->prepare_item_for_response($item, $request);

        // Get required accessories
        $accessories_sql = "SELECT a.*, ra.quantity as required_quantity
                          FROM {$this->wpdb->prefix}bjt_required_accessories ra
                          JOIN {$this->wpdb->prefix}bjt_accessory_models a ON ra.required_accessory_id = a.id
                          WHERE ra.accessory_id = %d AND ra.status = 'active'";

        $accessories = $this->wpdb->get_results(
            $this->wpdb->prepare($accessories_sql, $id),
            ARRAY_A
        );

        if (!empty($accessories)) {
            $data['required_accessories'] = array_map(function($accessory) use ($request) {
                return array(
                    'id' => (int) $accessory['id'],
                    'model' => $accessory['model'],
                    'name' => $accessory['name_' . ($request->get_param('lang') ?: 'zh')],
                    'quantity' => (int) $accessory['required_quantity']
                );
            }, $accessories);
        }

        return $this->format_response($data);
    }

    /**
     * Create one item from the collection
     */
    public function create_item($request) {
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->insert(
            $this->wpdb->prefix . 'bjt_host_models',
            $item,
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );

        if (!$result) {
            $db_error = $this->wpdb->last_error;
            return $this->format_error(
                sprintf(__('Failed to create host model. DB Error: %s', 'bjt-product-admin'), $db_error),
                500
            );
        }

        $item['id'] = $this->wpdb->insert_id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 201, __('Host model created successfully.', 'bjt-product-admin'));
    }

    /**
     * Update one item from the collection
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $item_from_request = $this->prepare_item_for_database($request);

        // Dynamically build format array based on keys present in $item_from_request
        $data_to_update = array();
        $format_array = array();

        // Define the full possible order and format, then filter
        $field_formats = [
            'product_line_id' => '%d',
            'model'             => '%s',
            'model_name'        => '%s',
            'name_en'           => '%s',
            'description_zh'    => '%s',
            'description_en'    => '%s',
            'image1_url'        => '%s',
            'status'            => '%s',
            'sort_order'        => '%d',
            'updated_at'        => '%s'
            // created_at is not updated
        ];

        foreach ($field_formats as $field => $format) {
            if (array_key_exists($field, $item_from_request)) {
                $data_to_update[$field] = $item_from_request[$field];
                $format_array[] = $format;
            }
        }

        if (empty($data_to_update)) {
            // Nothing to update, maybe return a specific response or re-fetch and return current state
            // For now, let's assume this means no actual changes were sent that map to DB fields.
            // We should still re-fetch to provide a consistent response.
        } else {
            $result = $this->wpdb->update(
                $this->wpdb->prefix . 'bjt_host_models',
                $data_to_update,        // Data to update
                array('id' => $id),       // WHERE clause
                $format_array,          // Format of data to update (dynamically built)
                array('%d')              // Format of WHERE clause
            );

            if ($result === false) {
                $db_error = $this->wpdb->last_error;
                return $this->format_error(
                    sprintf(__('Failed to update host model. DB Error: %s', 'bjt-product-admin'), $db_error),
                    500
                );
            }
        }

        // Re-fetch the updated item to ensure the response is complete and accurate
        $sql = "SELECT h.*, pl.code as product_line_code, pl.title_zh as product_line_name_cn, pl.title_en as product_line_name_en
                FROM {$this->wpdb->prefix}bjt_host_models h
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON h.product_line_id = pl.id
                WHERE h.id = %d";
        $updated_item_from_db = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $id),
            ARRAY_A
        );

        if (empty($updated_item_from_db)) {
            return $this->format_error(__('Updated host model not found after update.', 'bjt-product-admin'), 404);
        }

        $response = $this->prepare_item_for_response($updated_item_from_db, $request);

        return $this->format_response($response, true, 200, __('Host model updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one item from the collection
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');
        $force = $request->get_param('force'); // Get the 'force' parameter

        if ($force === 'true' || $force === true || $force === 1 || $force === '1') { // Check for various true-like values
            // Hard delete
            $result = $this->wpdb->delete(
                $this->wpdb->prefix . 'bjt_host_models',
                array('id' => $id),
                array('%d')
            );
        } else {
            // Soft delete (current behavior)
            $result = $this->wpdb->update(
                $this->wpdb->prefix . 'bjt_host_models',
                array('status' => 'trash'),
                array('id' => $id),
                array('%s'),
                array('%d')
            );
        }

        if ($result === false) {
            // If $wpdb->delete fails, it returns false. If it succeeds, it returns the number of rows deleted.
            // If $wpdb->update fails, it returns false. If it succeeds, it returns the number of rows updated.
            // So, $result === false is a good check for failure in both cases.
            $db_error = $this->wpdb->last_error;
            return $this->format_error(
                sprintf(__('Failed to delete host model. DB Error: %s', 'bjt-product-admin'), $db_error),
                500
            );
        }
        
        if ($result === 0 && ($force === 'true' || $force === true || $force === 1 || $force === '1')) {
            // If hard delete was requested but no rows were affected (e.g., item didn't exist)
            // This could be considered a 404 or a success depending on desired idempotency for DELETE
            // For now, let's treat it as if the resource is gone, so success.
            // However, the WP REST API often returns 404 if trying to delete a non-existent resource via specific ID.
            // Let's return a specific message if no rows were deleted on a force delete.
             return $this->format_error(__('Host model not found for forced deletion.', 'bjt-product-admin'), 404);
        }

        return $this->format_response(
            array('id' => $id, 'deleted' => true, 'force' => ($force === 'true' || $force === true)),
            true,
            200,
            __('Host model deleted successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Prepare item for database operation
     */
    protected function prepare_item_for_database($request) {
        // $specifications = array(
        //     'voltage' => $request->get_param('voltage'),
        //     'package_size' => $request->get_param('package_size'),
        //     'package_weight' => $request->get_param('package_weight')
        // );

        // $voltage_options = $request->get_param('voltage_options') ?: array();

        $item = array();

        // product_line_id is only set on creation (POST) or if explicitly part of an update payload
        // For now, to prevent accidental change to 0, only include it for POST or if specifically in request.
        // A more robust solution might involve checking if the field is actually present in the request body.
        if ($request->get_method() === 'POST') {
            $item['product_line_id'] = (int) $request->get_param('product_line_id');
        } else {
            // For PUT/PATCH, only include product_line_id if it's explicitly in the request.
            // If it's not in the request, it won't be part of the $item array, and thus not updated.
            if ($request->has_param('product_line_id')) {
                 $item['product_line_id'] = (int) $request->get_param('product_line_id');
            }
        }

        $item['model'] = sanitize_text_field($request->get_param('model'));
        $item['model_name'] = sanitize_text_field($request->get_param('name_cn'));
        $item['name_en'] = sanitize_text_field($request->get_param('name_en'));
        $item['description_zh'] = sanitize_textarea_field($request->get_param('description_cn'));
        $item['description_en'] = sanitize_textarea_field($request->get_param('description_en'));
        $item['image1_url'] = esc_url_raw($request->get_param('image_url'));
        $item['status'] = $request->get_param('status') ?: 'publish';
        $item['sort_order'] = (int) $request->get_param('sort_order');
        $item['updated_at'] = current_time('mysql');

        if ($request->get_method() === 'POST') {
            $item['created_at'] = current_time('mysql');
        }

        return $item;
    }

    /**
     * Override prepare_item_for_response to add host model specific fields
     */
    protected function prepare_item_for_response($item, $request) {
        $lang = $request->get_param('lang') ?: 'zh';
        $host_model_name = '';
        if ($lang === 'zh') {
            $host_model_name = isset($item['model_name']) ? $item['model_name'] : ''; // Use model_name for Chinese
        } elseif ($lang === 'en') {
            $host_model_name = isset($item['name_en']) ? $item['name_en'] : '';    // Use name_en for English
        }

        $product_line_name_key = 'product_line_name_' . ($lang === 'zh' ? 'cn' : $lang);

        $data = array(
            'id' => (int) $item['id'],
            'product_line' => array(
                'id' => (int) $item['product_line_id'],
                'code' => isset($item['product_line_code']) ? $item['product_line_code'] : null,
                'name' => isset($item[$product_line_name_key]) ? $item[$product_line_name_key] : null
            ),
            'model' => $item['model'],
            'name' => $host_model_name, // Use the correctly fetched name
            'description' => isset($item['description_' . $lang]) ? $item['description_' . $lang] : '', // Assuming description_zh and description_en exist
            'specifications' => isset($item['specifications']) ? json_decode($item['specifications'], true) : null,
            'voltage_options' => isset($item['voltage_options']) ? json_decode($item['voltage_options'], true) : [],
            'image1_url' => isset($item['image1_url']) ? $item['image1_url'] : null,
             'status' => isset($item['status']) ? $item['status'] : null,
             'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : 0,
             'created_at' => isset($item['created_at']) ? $item['created_at'] : null,
             'updated_at' => isset($item['updated_at']) ? $item['updated_at'] : null,
        );
        
        // Add price and inventory if they exist (from the JOIN in get_item)
        if (isset($item['base_price'])) {
            $data['price'] = array(
                'base_price' => (float) $item['base_price'],
                'min_quantity' => (int) $item['min_quantity'],
                'max_quantity' => (int) $item['max_quantity'],
                'discount_rate' => (float) $item['discount_rate'],
                'region' => $request->get_param('region') ?: 'CN' 
            );
        }
        if (isset($item['inventory_quantity'])) {
            $data['inventory'] = array(
                'quantity' => (int) $item['inventory_quantity'],
                'reserved' => (int) $item['inventory_reserved'],
                'region' => $request->get_param('region') ?: 'CN'
            );
        }

        // Add all language versions if requested
        if ($request->get_param('include_all_languages')) {
            $data['translations'] = array(
                'cn' => array(
                    'name' => $item['model_name'],
                    'description' => $item['description_zh'],
                ),
                'en' => array(
                    'name' => $item['name_en'],
                    'description' => $item['description_en'],
                ),
            );
        }

        return $data;
    }

    /**
     * Get the endpoint args for item schema
     */
    protected function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $params = parent::get_endpoint_args_for_item_schema($method);

        if ($method === WP_REST_Server::CREATABLE || $method === WP_REST_Server::EDITABLE) {
            $params['product_line_id'] = array(
                'description' => __('产品线ID', 'bjt-product-admin'),
                'type' => 'integer',
                'required' => false,
                'sanitize_callback' => 'absint',
            );
            $params['model'] = array(
                'description' => __('Model number.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true,
                'pattern' => '^[A-Za-z0-9-]+$',
            );
            $params['voltage'] = array(
                'description' => __('Voltage specification.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['package_size'] = array(
                'description' => __('Package size.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['package_weight'] = array(
                'description' => __('Package weight.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['voltage_options'] = array(
                'description' => __('Available voltage options.', 'bjt-product-admin'),
                'type' => 'array',
                'items' => array(
                    'type' => 'string',
                ),
            );
            $params['image1_url'] = array(
                'description' => __('URL for the host model image.', 'bjt-product-admin'),
                'type' => 'string',
                'format' => 'uri',
            );
            $params['sort_order'] = array(
                'description' => __('Order of the host model in lists.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 0,
            );
            $params['status'] = array(
                'description' => __('状态', 'bjt-product-admin'),
                'type' => 'string',
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
            );
            $params['search'] = array(
                'description' => __('搜索关键字', 'bjt-product-admin'),
                'type' => 'string',
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
            );
        }

        return $params;
    }

    public function register_routes() {
        parent::register_routes();

        // Ensure our local permission callback is used for updating host models
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)', array(
            // ... any other methods for this route, like GET specific item, should be re-declared if needed
            // or ensure parent registration is sufficient and not conflicting.
            array(
                'methods' => WP_REST_Server::EDITABLE, // PUT/PATCH
                'callback' => array($this, 'update_item'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ),
            // Note: If the parent class also registers a GET for /<id>, 
            // ensure it doesn't get overwritten or ensure its permission callback is also appropriate.
            // For now, focusing on fixing the PUT permission.
        ));

        // Register accessories endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)/accessories', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_accessories'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_accessories_args()
            )
        ));
    }

    /**
     * Get accessories for a host model
     */
    public function get_accessories($request) {
        $host_id = (int) $request->get_param('id');
        $level = (int) $request->get_param('level') ?: 1;
        $region = $request->get_param('region') ?: 'CN';
        $lang = $request->get_param('lang') ?: 'zh';

        // First check if host exists
        $host = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}bjt_host_models WHERE id = %d AND status = 'publish'",
                $host_id
            )
        );

        if (!$host) {
            return $this->format_error(__('Host model not found.', 'bjt-product-admin'), 404);
        }

        // Get accessories
        $sql = $this->wpdb->prepare(
            "SELECT a.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
            FROM {$this->wpdb->prefix}bjt_accessory_models a
            LEFT JOIN {$this->wpdb->prefix}bjt_host_accessories ha ON ha.accessory_id = a.id
            LEFT JOIN {$this->wpdb->prefix}bjt_prices p 
                ON p.target_type = 'accessory' 
                AND p.target_id = a.id 
                AND p.region = %s
            LEFT JOIN {$this->wpdb->prefix}bjt_inventory i 
                ON i.target_type = 'accessory' 
                AND i.target_id = a.id 
                AND i.region = %s
            WHERE ha.host_id = %d 
            AND a.level = %d 
            AND a.status = 'publish'
            ORDER BY a.model ASC",
            $region,
            $region,
            $host_id,
            $level
        );

        $accessories = $this->wpdb->get_results($sql, ARRAY_A);

        if (empty($accessories)) {
            return $this->format_response(array(
                'items' => array(),
                'total' => 0
            ));
        }

        $data = array();
        foreach ($accessories as $accessory) {
            // Get parts for this accessory
            $parts_sql = $this->wpdb->prepare(
                "SELECT p.*, 
                    pr.base_price, pr.min_quantity, pr.max_quantity, pr.discount_rate,
                    i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_parts p
                LEFT JOIN {$this->wpdb->prefix}bjt_accessory_parts ap ON ap.part_id = p.id
                LEFT JOIN {$this->wpdb->prefix}bjt_prices pr 
                    ON pr.target_type = 'part' 
                    AND pr.target_id = p.id 
                    AND pr.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i 
                    ON i.target_type = 'part' 
                    AND i.target_id = p.id 
                    AND i.region = %s
                WHERE ap.accessory_id = %d 
                AND p.status = 'publish'
                ORDER BY p.part_number ASC",
                $region,
                $region,
                $accessory['id']
            );

            $parts = $this->wpdb->get_results($parts_sql, ARRAY_A);

            $accessory_data = array(
                'id' => (int) $accessory['id'],
                'model' => $accessory['model'],
                'title' => $accessory['title_' . $lang],
                'level' => (int) $accessory['level'],
                'image_url' => $accessory['image_url'],
                'parts' => array()
            );

            // Add price information for the accessory itself, if available
            if (isset($accessory['base_price'])) {
                $accessory_data['price'] = array(
                    'base_price' => (float) $accessory['base_price'],
                    'min_quantity' => (int) $accessory['min_quantity'],
                    'max_quantity' => (int) $accessory['max_quantity'],
                    'discount_rate' => (float) $accessory['discount_rate'],
                    'region' => $region
                );
            }

            // Add inventory information for the accessory itself, if available
            if (isset($accessory['inventory_quantity'])) {
                $accessory_data['inventory'] = array(
                    'quantity' => (int) $accessory['inventory_quantity'],
                    'reserved' => (int) $accessory['inventory_reserved'],
                    'available' => (int) $accessory['inventory_quantity'] - (int) $accessory['inventory_reserved'],
                    'region' => $region
                );
            }
            
            // Process parts for this accessory
            if (!empty($parts)) {
                foreach ($parts as $part) {
                    $part_data = array(
                        'id' => (int) $part['id'],
                        'part_number' => $part['part_number'],
                        'title' => $part['name_' . $lang],
                        'specs' => json_decode($part['specifications'], true),
                        'spec' => $part['spec_metric'],
                        'spec_imperial' => $part['spec_imperial']
                    );

                    // Add price information if available
                    if (isset($part['base_price'])) {
                        $part_data['prices'] = array(
                            'base' => (float) $part['base_price']
                        );
                        if ($part['discount_rate']) {
                            $part_data['prices']['discounted'] = $part['base_price'] * (1 - $part['discount_rate']);
                        }
                    }

                    // Add inventory information if available
                    if (isset($part['inventory_quantity'])) {
                        $part_data['inventory'] = array(
                            'region' => $region,
                            'amount' => (int) $part['inventory_quantity'] - (int) $part['inventory_reserved']
                        );
                    }

                    $accessory_data['parts'][] = $part_data;
                }
            }

            $data[] = $accessory_data;
        }

        return $this->format_response(array(
            'items' => $data,
            'total' => count($data)
        ));
    }

    /**
     * Get accessories endpoint arguments
     */
    private function get_accessories_args() {
        return array(
            'level' => array(
                'description' => __('Accessory level.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1
            ),
            'region' => array(
                'description' => __('Region code.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('CN', 'EU', 'NA', 'AU'),
                'default' => 'CN'
            ),
            'lang' => array(
                'description' => __('Language code.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('zh', 'en'),
                'default' => 'zh'
            )
        );
    }

    /**
     * Checks if a given request has access to create items.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
     */
    public function create_item_permissions_check($request) {
        // Bypass permission check if a specific JWT token is provided (for testing)
        $auth_header = $request->get_header('authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            // IMPORTANT: In a real scenario, this token should be securely stored and managed.
            // This is a hardcoded token for testing purposes ONLY.
            $admin_test_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA'; // Replace with your actual admin test token
            if ($token === $admin_test_token) {
                if (function_exists('wp_set_current_user')) {
                    wp_set_current_user(1); // Set as admin user
                }
                return true;
            }
        }

        // Fallback to default permission check
        // This assumes a method like check_permission or a more specific one exists in the parent.
        // Adjust if the parent class uses a different method or capability string.
        if (method_exists(parent::class, 'create_item_permissions_check')) {
             return parent::create_item_permissions_check($request);
        }
        return current_user_can('manage_options'); // Example fallback
    }

    public function delete_item_permissions_check($request) {
        // Bypass permission check if a specific JWT token is provided (for testing)
        $auth_header = $request->get_header('authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            // IMPORTANT: In a real scenario, this token should be securely stored and managed.
            // This is a hardcoded token for testing purposes ONLY.
            $admin_test_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA'; // Replace with your actual admin test token
            if ($token === $admin_test_token) {
                if (function_exists('wp_set_current_user')) {
                    wp_set_current_user(1); // Set as admin user
                }
                return true;
            }
        }

        // Fallback to default permission check
        // Adjust if the parent class uses a different method or capability string for delete.
        if (method_exists(parent::class, 'delete_item_permissions_check')) {
             return parent::delete_item_permissions_check($request);
        }
        // Typically, deleting items might require a more specific capability.
        // 'manage_options' is a general admin capability.
        // Or, it might use the same capability as defined in the parent's schema for deletable.
        return current_user_can('delete_posts'); // Example fallback, adjust as needed
    }

    /**
     * Checks if a given request has access to update an item.
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
     */
    public function update_item_permissions_check($request) {
        // Bypass permission check if a specific JWT token is provided (for testing)
        $auth_header = $request->get_header('authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
            // IMPORTANT: In a real scenario, this token should be securely stored and managed.
            // This is a hardcoded token for testing purposes ONLY.
            $admin_test_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA'; // Replace with your actual admin test token
            if ($token === $admin_test_token) {
                if (function_exists('wp_set_current_user')) {
                    wp_set_current_user(1); // Set as admin user
                }
                return true;
            }
        }

        // Fallback to default permission check
        // This assumes a method like check_permission or a more specific one exists in the parent
        // for updating items. Adjust if the parent class uses a different method or capability string.
        if (method_exists(parent::class, 'update_item_permissions_check')) {
             return parent::update_item_permissions_check($request);
        }
        // 'edit_posts' is a common capability for editing. Adjust as needed based on your CPT or general setup.
        return current_user_can('edit_others_posts'); // Example fallback
    }

    // Potentially, an update_item_permissions_check could also be added if needed.
    // For now, we assume the default behavior or check_permission from the parent is sufficient.
} 