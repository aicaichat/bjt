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

        $where_clauses = array("status = 'publish'");
        $where_values = array();

        if ($product_line_id) {
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = $product_line_id;
        }

        $where_sql = implode(' AND ', $where_clauses);
        $sql = "SELECT h.*, pl.code as product_line_code, pl.name_cn as product_line_name_cn, pl.name_en as product_line_name_en 
                FROM {$this->wpdb->prefix}bjt_host_models h
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON h.product_line_id = pl.id
                WHERE {$where_sql}
                ORDER BY h.menu_order ASC, h.id ASC 
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
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_host_models WHERE {$where_sql}";
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

        $sql = "SELECT h.*, pl.code as product_line_code, pl.name_cn as product_line_name_cn, pl.name_en as product_line_name_en,
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
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );

        if (!$result) {
            return $this->format_error(__('Failed to create host model.', 'bjt-product-admin'), 500);
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
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_host_models',
            $item,
            array('id' => $id),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to update host model.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 200, __('Host model updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one item from the collection
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_host_models',
            array('status' => 'trash'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to delete host model.', 'bjt-product-admin'), 500);
        }

        return $this->format_response(
            array('id' => $id),
            true,
            200,
            __('Host model deleted successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Prepare item for database operation
     */
    protected function prepare_item_for_database($request) {
        $specifications = array(
            'voltage' => $request->get_param('voltage'),
            'package_size' => $request->get_param('package_size'),
            'package_weight' => $request->get_param('package_weight')
        );

        $voltage_options = $request->get_param('voltage_options') ?: array();

        $item = array(
            'product_line_id' => (int) $request->get_param('product_line_id'),
            'model' => sanitize_text_field($request->get_param('model')),
            'name_cn' => sanitize_text_field($request->get_param('name_cn')),
            'name_en' => sanitize_text_field($request->get_param('name_en')),
            'description_cn' => sanitize_textarea_field($request->get_param('description_cn')),
            'description_en' => sanitize_textarea_field($request->get_param('description_en')),
            'specifications' => wp_json_encode($specifications),
            'voltage_options' => wp_json_encode($voltage_options),
            'image_url' => esc_url_raw($request->get_param('image_url')),
            'status' => $request->get_param('status') ?: 'publish',
            'menu_order' => (int) $request->get_param('menu_order'),
            'updated_at' => current_time('mysql')
        );

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
        $data = array(
            'id' => (int) $item['id'],
            'product_line' => array(
                'id' => (int) $item['product_line_id'],
                'code' => $item['product_line_code'],
                'name' => $item['product_line_name_' . $lang]
            ),
            'model' => $item['model'],
            'name' => $item['name_' . $lang],
            'description' => $item['description_' . $lang],
            'specifications' => json_decode($item['specifications'], true),
            'voltage_options' => json_decode($item['voltage_options'], true),
            'image_url' => $item['image_url'],
            'status' => $item['status'],
            'menu_order' => (int) $item['menu_order'],
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        );

        // Add price and inventory information if available
        if (isset($item['base_price'])) {
            $data['price'] = array(
                'base_price' => (float) $item['base_price'],
                'min_quantity' => (int) $item['min_quantity'],
                'max_quantity' => $item['max_quantity'] ? (int) $item['max_quantity'] : null,
                'discount_rate' => $item['discount_rate'] ? (float) $item['discount_rate'] : null
            );
        }

        if (isset($item['inventory_quantity'])) {
            $data['inventory'] = array(
                'quantity' => (int) $item['inventory_quantity'],
                'reserved' => (int) $item['inventory_reserved'],
                'available' => (int) $item['inventory_quantity'] - (int) $item['inventory_reserved']
            );
        }

        // Add all language versions if requested
        if ($request->get_param('include_all_languages')) {
            $data['translations'] = array(
                'cn' => array(
                    'name' => $item['name_cn'],
                    'description' => $item['description_cn'],
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
                'description' => __('Product line ID.', 'bjt-product-admin'),
                'type' => 'integer',
                'required' => true,
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
            $params['image_url'] = array(
                'description' => __('URL for the host model image.', 'bjt-product-admin'),
                'type' => 'string',
                'format' => 'uri',
            );
            $params['menu_order'] = array(
                'description' => __('Order of the host model in lists.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 0,
            );
        }

        return $params;
    }

    public function register_routes() {
        parent::register_routes();

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
                'title' => $accessory['name_' . $lang],
                'level' => (int) $accessory['level'],
                'image_url' => $accessory['image_url'],
                'parts' => array()
            );

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
} 