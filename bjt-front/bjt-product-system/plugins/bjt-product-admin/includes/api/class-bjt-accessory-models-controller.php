<?php
/**
 * BJT Accessory Models API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Accessory_Models_Controller extends BJT_Product_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'accessory-models';
    }

    /**
     * Get a collection of items
     */
    public function get_items($request) {
        $args = array();
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;
        $parent_id = $request->get_param('parent_id');

        $where_clauses = array("status = 'publish'");
        $where_values = array();

        if ($parent_id !== null) {
            if ($parent_id === '0') {
                $where_clauses[] = "parent_id IS NULL";
            } else {
                $where_clauses[] = "parent_id = %d";
                $where_values[] = $parent_id;
            }
        }

        $where_sql = implode(' AND ', $where_clauses);
        $sql = "SELECT a.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved,
                parent.model as parent_model, parent.name_cn as parent_name_cn, parent.name_en as parent_name_en
                FROM {$this->wpdb->prefix}bjt_accessory_models a
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'accessory' AND p.target_id = a.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'accessory' AND i.target_id = a.id AND i.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_accessory_models parent ON a.parent_id = parent.id
                WHERE {$where_sql}
                ORDER BY a.menu_order ASC, a.id ASC 
                LIMIT %d OFFSET %d";

        $region = $request->get_param('region') ?: 'CN';
        $query_args = array_merge(array($region, $region), $where_values, array($per_page, $offset));
        
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
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_accessory_models WHERE {$where_sql}";
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

        $sql = "SELECT a.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved,
                parent.model as parent_model, parent.name_cn as parent_name_cn, parent.name_en as parent_name_en
                FROM {$this->wpdb->prefix}bjt_accessory_models a
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'accessory' AND p.target_id = a.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'accessory' AND i.target_id = a.id AND i.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_accessory_models parent ON a.parent_id = parent.id
                WHERE a.id = %d AND a.status = 'publish'";

        $item = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $region, $region, $id),
            ARRAY_A
        );

        if (empty($item)) {
            return $this->format_error(__('Accessory model not found.', 'bjt-product-admin'), 404);
        }

        $data = $this->prepare_item_for_response($item, $request);

        // Get child accessories
        $children_sql = "SELECT * FROM {$this->wpdb->prefix}bjt_accessory_models 
                        WHERE parent_id = %d AND status = 'publish'
                        ORDER BY menu_order ASC, id ASC";

        $children = $this->wpdb->get_results(
            $this->wpdb->prepare($children_sql, $id),
            ARRAY_A
        );

        if (!empty($children)) {
            $data['children'] = array_map(function($child) use ($request) {
                return array(
                    'id' => (int) $child['id'],
                    'model' => $child['model'],
                    'name' => $child['name_' . ($request->get_param('lang') ?: 'zh')],
                    'level' => (int) $child['level']
                );
            }, $children);
        }

        // Get required accessories
        $required_sql = "SELECT a.*, ra.quantity as required_quantity
                        FROM {$this->wpdb->prefix}bjt_required_accessories ra
                        JOIN {$this->wpdb->prefix}bjt_accessory_models a ON ra.required_accessory_id = a.id
                        WHERE ra.accessory_id = %d AND ra.status = 'active'";

        $required = $this->wpdb->get_results(
            $this->wpdb->prepare($required_sql, $id),
            ARRAY_A
        );

        if (!empty($required)) {
            $data['required_accessories'] = array_map(function($accessory) use ($request) {
                return array(
                    'id' => (int) $accessory['id'],
                    'model' => $accessory['model'],
                    'name' => $accessory['name_' . ($request->get_param('lang') ?: 'zh')],
                    'quantity' => (int) $accessory['required_quantity']
                );
            }, $required);
        }

        return $this->format_response($data);
    }

    /**
     * Create one item from the collection
     */
    public function create_item($request) {
        $item = $this->prepare_item_for_database($request);

        // Calculate level
        if ($item['parent_id']) {
            $parent_level = $this->wpdb->get_var(
                $this->wpdb->prepare(
                    "SELECT level FROM {$this->wpdb->prefix}bjt_accessory_models WHERE id = %d",
                    $item['parent_id']
                )
            );
            $item['level'] = $parent_level + 1;
        } else {
            $item['level'] = 1;
        }

        $result = $this->wpdb->insert(
            $this->wpdb->prefix . 'bjt_accessory_models',
            $item,
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%d', '%s', '%s')
        );

        if (!$result) {
            return $this->format_error(__('Failed to create accessory model.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $this->wpdb->insert_id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 201, __('Accessory model created successfully.', 'bjt-product-admin'));
    }

    /**
     * Update one item from the collection
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $item = $this->prepare_item_for_database($request);

        // Check for circular reference
        if ($item['parent_id']) {
            $parent_id = $item['parent_id'];
            while ($parent_id) {
                if ($parent_id == $id) {
                    return $this->format_error(__('Circular reference detected.', 'bjt-product-admin'), 400);
                }
                $parent_id = $this->wpdb->get_var(
                    $this->wpdb->prepare(
                        "SELECT parent_id FROM {$this->wpdb->prefix}bjt_accessory_models WHERE id = %d",
                        $parent_id
                    )
                );
            }

            // Update level
            $parent_level = $this->wpdb->get_var(
                $this->wpdb->prepare(
                    "SELECT level FROM {$this->wpdb->prefix}bjt_accessory_models WHERE id = %d",
                    $item['parent_id']
                )
            );
            $item['level'] = $parent_level + 1;
        } else {
            $item['level'] = 1;
        }

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_accessory_models',
            $item,
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%d', '%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to update accessory model.', 'bjt-product-admin'), 500);
        }

        // Update children levels recursively
        $this->update_children_levels($id, $item['level']);

        $item['id'] = $id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 200, __('Accessory model updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one item from the collection
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');

        // Check if there are any children
        $children_count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_accessory_models WHERE parent_id = %d",
                $id
            )
        );

        if ($children_count > 0) {
            return $this->format_error(
                __('Cannot delete accessory model with child accessories.', 'bjt-product-admin'),
                400
            );
        }

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_accessory_models',
            array('status' => 'trash'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to delete accessory model.', 'bjt-product-admin'), 500);
        }

        return $this->format_response(
            array('id' => $id),
            true,
            200,
            __('Accessory model deleted successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Update children levels recursively
     */
    private function update_children_levels($parent_id, $parent_level) {
        $children = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT id FROM {$this->wpdb->prefix}bjt_accessory_models WHERE parent_id = %d",
                $parent_id
            ),
            ARRAY_A
        );

        if (!empty($children)) {
            foreach ($children as $child) {
                $new_level = $parent_level + 1;
                $this->wpdb->update(
                    $this->wpdb->prefix . 'bjt_accessory_models',
                    array('level' => $new_level),
                    array('id' => $child['id']),
                    array('%d'),
                    array('%d')
                );
                $this->update_children_levels($child['id'], $new_level);
            }
        }
    }

    /**
     * Prepare item for database operation
     */
    protected function prepare_item_for_database($request) {
        $specifications = array(
            'material' => $request->get_param('material'),
            'dimensions' => $request->get_param('dimensions'),
            'weight' => $request->get_param('weight')
        );

        $item = array(
            'model' => sanitize_text_field($request->get_param('model')),
            'name_cn' => sanitize_text_field($request->get_param('name_cn')),
            'name_en' => sanitize_text_field($request->get_param('name_en')),
            'description_cn' => sanitize_textarea_field($request->get_param('description_cn')),
            'description_en' => sanitize_textarea_field($request->get_param('description_en')),
            'specifications' => wp_json_encode($specifications),
            'image_url' => esc_url_raw($request->get_param('image_url')),
            'parent_id' => (int) $request->get_param('parent_id') ?: null,
            'level' => 1, // Will be calculated later
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
     * Override prepare_item_for_response to add accessory model specific fields
     */
    protected function prepare_item_for_response($item, $request) {
        $lang = $request->get_param('lang') ?: 'zh';
        $data = array(
            'id' => (int) $item['id'],
            'model' => $item['model'],
            'name' => $item['name_' . $lang],
            'description' => $item['description_' . $lang],
            'specifications' => json_decode($item['specifications'], true),
            'image_url' => $item['image_url'],
            'level' => (int) $item['level'],
            'status' => $item['status'],
            'menu_order' => (int) $item['menu_order'],
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        );

        // Add parent information if available
        if (!empty($item['parent_id'])) {
            $data['parent'] = array(
                'id' => (int) $item['parent_id'],
                'model' => $item['parent_model'],
                'name' => $item['parent_name_' . $lang]
            );
        }

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
            $params['model'] = array(
                'description' => __('Model number.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true,
                'pattern' => '^[A-Za-z0-9-]+$',
            );
            $params['parent_id'] = array(
                'description' => __('Parent accessory ID.', 'bjt-product-admin'),
                'type' => 'integer',
            );
            $params['material'] = array(
                'description' => __('Material specification.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['dimensions'] = array(
                'description' => __('Dimensions specification.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['weight'] = array(
                'description' => __('Weight specification.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['image_url'] = array(
                'description' => __('URL for the accessory model image.', 'bjt-product-admin'),
                'type' => 'string',
                'format' => 'uri',
            );
            $params['menu_order'] = array(
                'description' => __('Order of the accessory model in lists.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 0,
            );
        }

        return $params;
    }

    public function register_routes() {
        parent::register_routes();

        // Register children endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)/children', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_children'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_children_args()
            )
        ));

        // Register required accessories endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)/required', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_required'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_required_args()
            )
        ));
    }

    /**
     * Get child accessories
     */
    public function get_children($request) {
        $parent_id = (int) $request->get_param('id');
        $region = $request->get_param('region') ?: 'CN';
        $lang = $request->get_param('lang') ?: 'zh';

        // First check if parent exists
        $parent = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}bjt_accessory_models WHERE id = %d AND status = 'publish'",
                $parent_id
            )
        );

        if (!$parent) {
            return $this->format_error(__('Parent accessory not found.', 'bjt-product-admin'), 404);
        }

        // Get child accessories
        $sql = $this->wpdb->prepare(
            "SELECT a.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
            FROM {$this->wpdb->prefix}bjt_accessory_models a
            LEFT JOIN {$this->wpdb->prefix}bjt_accessory_relations ar ON ar.child_id = a.id
            LEFT JOIN {$this->wpdb->prefix}bjt_prices p 
                ON p.target_type = 'accessory' 
                AND p.target_id = a.id 
                AND p.region = %s
            LEFT JOIN {$this->wpdb->prefix}bjt_inventory i 
                ON i.target_type = 'accessory' 
                AND i.target_id = a.id 
                AND i.region = %s
            WHERE ar.parent_id = %d 
            AND a.status = 'publish'
            ORDER BY a.model ASC",
            $region,
            $region,
            $parent_id
        );

        $children = $this->wpdb->get_results($sql, ARRAY_A);

        if (empty($children)) {
            return $this->format_response(array(
                'items' => array(),
                'total' => 0
            ));
        }

        $data = array();
        foreach ($children as $child) {
            // Get parts for this child accessory
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
                $child['id']
            );

            $parts = $this->wpdb->get_results($parts_sql, ARRAY_A);

            $child_data = array(
                'id' => (int) $child['id'],
                'model' => $child['model'],
                'title' => $child['name_' . $lang],
                'level' => (int) $child['level'],
                'image_url' => $child['image_url'],
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

                    $child_data['parts'][] = $part_data;
                }
            }

            $data[] = $child_data;
        }

        return $this->format_response(array(
            'items' => $data,
            'total' => count($data)
        ));
    }

    /**
     * Get required accessories
     */
    public function get_required($request) {
        $accessory_id = (int) $request->get_param('id');
        $region = $request->get_param('region') ?: 'CN';
        $lang = $request->get_param('lang') ?: 'zh';

        // First check if accessory exists
        $accessory = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}bjt_accessory_models WHERE id = %d AND status = 'publish'",
                $accessory_id
            )
        );

        if (!$accessory) {
            return $this->format_error(__('Accessory not found.', 'bjt-product-admin'), 404);
        }

        // Get required accessories
        $sql = $this->wpdb->prepare(
            "SELECT a.*, ar.quantity as required_quantity,
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
            FROM {$this->wpdb->prefix}bjt_accessory_models a
            JOIN {$this->wpdb->prefix}bjt_required_accessories ar ON ar.required_id = a.id
            LEFT JOIN {$this->wpdb->prefix}bjt_prices p 
                ON p.target_type = 'accessory' 
                AND p.target_id = a.id 
                AND p.region = %s
            LEFT JOIN {$this->wpdb->prefix}bjt_inventory i 
                ON i.target_type = 'accessory' 
                AND i.target_id = a.id 
                AND i.region = %s
            WHERE ar.accessory_id = %d 
            AND a.status = 'publish'
            ORDER BY a.model ASC",
            $region,
            $region,
            $accessory_id
        );

        $required = $this->wpdb->get_results($sql, ARRAY_A);

        if (empty($required)) {
            return $this->format_response(array(
                'items' => array(),
                'total' => 0
            ));
        }

        $data = array();
        foreach ($required as $item) {
            $item_data = array(
                'id' => (int) $item['id'],
                'name' => $item['name_' . $lang],
                'quantity' => (int) $item['required_quantity'],
                'description' => $item['description_' . $lang],
                'specs' => json_decode($item['specifications'], true)
            );

            // Add price information
            if (isset($item['base_price'])) {
                $item_data['price'] = (float) $item['base_price'];
                $item_data['currency'] = $this->get_currency_for_region($region);
                $item_data['currency_code'] = $this->get_currency_code_for_region($region);
            }

            $data[] = $item_data;
        }

        return $this->format_response(array(
            'items' => $data
        ));
    }

    /**
     * Get children endpoint arguments
     */
    private function get_children_args() {
        return array(
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
     * Get required endpoint arguments
     */
    private function get_required_args() {
        return array(
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
     * Get currency symbol for region
     */
    private function get_currency_for_region($region) {
        $currencies = array(
            'CN' => '¥',
            'EU' => '€',
            'NA' => '$',
            'AU' => 'A$'
        );
        return isset($currencies[$region]) ? $currencies[$region] : '¥';
    }

    /**
     * Get currency code for region
     */
    private function get_currency_code_for_region($region) {
        $currencies = array(
            'CN' => 'CNY',
            'EU' => 'EUR',
            'NA' => 'USD',
            'AU' => 'AUD'
        );
        return isset($currencies[$region]) ? $currencies[$region] : 'CNY';
    }
} 