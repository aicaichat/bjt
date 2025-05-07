<?php
/**
 * BJT Consumables API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Consumables_Controller extends BJT_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'consumables';
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
        $sql = "SELECT c.*, pl.code as product_line_code, pl.name_cn as product_line_name_cn, pl.name_en as product_line_name_en,
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_consumables c
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON c.product_line_id = pl.id
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'consumable' AND p.target_id = c.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'consumable' AND i.target_id = c.id AND i.region = %s
                WHERE {$where_sql}
                ORDER BY c.menu_order ASC, c.id ASC 
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
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_consumables WHERE {$where_sql}";
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

        $sql = "SELECT c.*, pl.code as product_line_code, pl.name_cn as product_line_name_cn, pl.name_en as product_line_name_en,
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_consumables c
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON c.product_line_id = pl.id
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'consumable' AND p.target_id = c.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'consumable' AND i.target_id = c.id AND i.region = %s
                WHERE c.id = %d AND c.status = 'publish'";

        $item = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $region, $region, $id),
            ARRAY_A
        );

        if (empty($item)) {
            return $this->format_error(__('Consumable not found.', 'bjt-product-admin'), 404);
        }

        $data = $this->prepare_item_for_response($item, $request);

        // Get compatible host models
        $compatible_models = json_decode($item['compatible_models'], true);
        if (!empty($compatible_models)) {
            $placeholders = implode(',', array_fill(0, count($compatible_models), '%s'));
            $models_sql = "SELECT id, model, name_cn, name_en 
                          FROM {$this->wpdb->prefix}bjt_host_models 
                          WHERE model IN ($placeholders) AND status = 'publish'";

            $models = $this->wpdb->get_results(
                $this->wpdb->prepare($models_sql, ...$compatible_models),
                ARRAY_A
            );

            if (!empty($models)) {
                $data['compatible_models'] = array_map(function($model) use ($request) {
                    return array(
                        'id' => (int) $model['id'],
                        'model' => $model['model'],
                        'name' => $model['name_' . ($request->get_param('lang') ?: 'zh')]
                    );
                }, $models);
            }
        }

        return $this->format_response($data);
    }

    /**
     * Create one item from the collection
     */
    public function create_item($request) {
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->insert(
            $this->wpdb->prefix . 'bjt_consumables',
            $item,
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );

        if (!$result) {
            return $this->format_error(__('Failed to create consumable.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $this->wpdb->insert_id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 201, __('Consumable created successfully.', 'bjt-product-admin'));
    }

    /**
     * Update one item from the collection
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_consumables',
            $item,
            array('id' => $id),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to update consumable.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 200, __('Consumable updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one item from the collection
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_consumables',
            array('status' => 'trash'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to delete consumable.', 'bjt-product-admin'), 500);
        }

        return $this->format_response(
            array('id' => $id),
            true,
            200,
            __('Consumable deleted successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Prepare item for database operation
     */
    protected function prepare_item_for_database($request) {
        $specifications = array(
            'material' => $request->get_param('material'),
            'thickness_met' => $request->get_param('thickness_met'),
            'thickness_imp' => $request->get_param('thickness_imp'),
            'gram_met' => $request->get_param('gram_met'),
            'gram_imp' => $request->get_param('gram_imp')
        );

        $compatible_models = $request->get_param('compatible_models') ?: array();

        $item = array(
            'product_line_id' => (int) $request->get_param('product_line_id'),
            'model' => sanitize_text_field($request->get_param('model')),
            'name_cn' => sanitize_text_field($request->get_param('name_cn')),
            'name_en' => sanitize_text_field($request->get_param('name_en')),
            'description_cn' => sanitize_textarea_field($request->get_param('description_cn')),
            'description_en' => sanitize_textarea_field($request->get_param('description_en')),
            'specifications' => wp_json_encode($specifications),
            'image_url' => esc_url_raw($request->get_param('image_url')),
            'compatible_models' => wp_json_encode($compatible_models),
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
     * Override prepare_item_for_response to add consumable specific fields
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
            'image_url' => $item['image_url'],
            'compatible_models' => json_decode($item['compatible_models'], true),
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
            $params['material'] = array(
                'description' => __('Material specification.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['thickness_met'] = array(
                'description' => __('Thickness in metric units.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['thickness_imp'] = array(
                'description' => __('Thickness in imperial units.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['gram_met'] = array(
                'description' => __('Weight in grams per square meter.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['gram_imp'] = array(
                'description' => __('Weight in ounces per square yard.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['compatible_models'] = array(
                'description' => __('Compatible host model numbers.', 'bjt-product-admin'),
                'type' => 'array',
                'items' => array(
                    'type' => 'string',
                    'pattern' => '^[A-Za-z0-9-]+$',
                ),
            );
            $params['image_url'] = array(
                'description' => __('URL for the consumable image.', 'bjt-product-admin'),
                'type' => 'string',
                'format' => 'uri',
            );
            $params['menu_order'] = array(
                'description' => __('Order of the consumable in lists.', 'bjt-product-admin'),
                'type' => 'integer',
                'default' => 0,
            );
        }

        return $params;
    }

    public function register_routes() {
        parent::register_routes();

        // Register compatibility check endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>\d+)/compatibility-check', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'check_compatibility'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_compatibility_args()
            )
        ));

        // Register batch prices endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/prices/batch', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'get_batch_prices'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_batch_prices_args()
            )
        ));

        // Register batch inventory endpoint
        register_rest_route($this->namespace, '/' . $this->rest_base . '/inventory/batch', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'get_batch_inventory'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_batch_inventory_args()
            )
        ));
    }

    /**
     * Check compatibility with a machine model
     */
    public function check_compatibility($request) {
        $consumable_id = (int) $request->get_param('id');
        $model = sanitize_text_field($request->get_param('model'));

        // First check if consumable exists
        $consumable = $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->wpdb->prefix}bjt_consumables WHERE id = %d AND status = 'publish'",
                $consumable_id
            )
        );

        if (!$consumable) {
            return $this->format_error(__('Consumable not found.', 'bjt-product-admin'), 404);
        }

        // Check compatibility
        $sql = $this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_consumable_compatibility 
            WHERE consumable_id = %d AND machine_model = %s",
            $consumable_id,
            $model
        );

        $is_compatible = (bool) $this->wpdb->get_var($sql);

        return $this->format_response(array(
            'compatible' => $is_compatible,
            'message' => $is_compatible ? __('Fully compatible', 'bjt-product-admin') : __('Not compatible', 'bjt-product-admin')
        ));
    }

    /**
     * Get batch prices for consumables
     */
    public function get_batch_prices($request) {
        $consumable_ids = $request->get_param('consumableIds');
        $region = $request->get_param('region') ?: 'CN';
        $quantity = (int) $request->get_param('quantity');

        $prices = array();
        foreach ($consumable_ids as $id) {
            $sql = $this->wpdb->prepare(
                "SELECT c.id, c.part_number, 
                    p.base_price, p.min_quantity, p.max_quantity, p.discount_rate
                FROM {$this->wpdb->prefix}bjt_consumables c
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p 
                    ON p.target_type = 'consumable' 
                    AND p.target_id = c.id 
                    AND p.region = %s
                WHERE c.id = %d AND c.status = 'publish'",
                $region,
                (int) $id
            );

            $price_data = $this->wpdb->get_row($sql, ARRAY_A);
            
            if ($price_data) {
                $price = array(
                    'consumable_id' => (int) $price_data['id'],
                    'price' => (float) $price_data['base_price'],
                    'original_price' => (float) $price_data['base_price'],
                    'currency' => $this->get_currency_for_region($region),
                    'currency_code' => $this->get_currency_code_for_region($region),
                    'quantity' => $quantity,
                    'tier' => $price_data['min_quantity'] . '-' . ($price_data['max_quantity'] ?: '∞'),
                    'discount_applied' => false
                );

                // Apply discount if available and quantity meets requirements
                if (!empty($price_data['discount_rate']) 
                    && $quantity >= $price_data['min_quantity'] 
                    && (!$price_data['max_quantity'] || $quantity <= $price_data['max_quantity'])) {
                    $price['price'] = $price['original_price'] * (1 - (float) $price_data['discount_rate']);
                    $price['discount_applied'] = true;
                    $price['discount_rate'] = (float) $price_data['discount_rate'];
                }

                $prices[] = $price;
            }
        }

        return $this->format_response(array(
            'prices' => $prices
        ));
    }

    /**
     * Get batch inventory for consumables
     */
    public function get_batch_inventory($request) {
        $consumable_ids = $request->get_param('consumableIds');
        $region = $request->get_param('region') ?: 'CN';

        $inventory = array();
        foreach ($consumable_ids as $id) {
            $sql = $this->wpdb->prepare(
                "SELECT c.id, c.part_number,
                    i.quantity, i.reserved,
                    n.expected_date as next_restock
                FROM {$this->wpdb->prefix}bjt_consumables c
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i 
                    ON i.target_type = 'consumable' 
                    AND i.target_id = c.id 
                    AND i.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory_next_arrival n
                    ON n.target_type = 'consumable'
                    AND n.target_id = c.id
                    AND n.region = i.region
                WHERE c.id = %d AND c.status = 'publish'",
                $region,
                (int) $id
            );

            $inventory_data = $this->wpdb->get_row($sql, ARRAY_A);
            
            if ($inventory_data) {
                $available = (int) $inventory_data['quantity'] - (int) $inventory_data['reserved'];
                $inventory[] = array(
                    'consumable_id' => (int) $inventory_data['id'],
                    'region' => $region,
                    'available' => $available,
                    'reserved' => (int) $inventory_data['reserved'],
                    'status' => $this->get_inventory_status($available),
                    'next_restock' => $inventory_data['next_restock']
                );
            }
        }

        return $this->format_response(array(
            'inventory' => $inventory
        ));
    }

    /**
     * Get compatibility check endpoint arguments
     */
    private function get_compatibility_args() {
        return array(
            'model' => array(
                'description' => __('Machine model to check compatibility with.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true
            )
        );
    }

    /**
     * Get batch prices endpoint arguments
     */
    private function get_batch_prices_args() {
        return array(
            'consumableIds' => array(
                'description' => __('Array of consumable IDs.', 'bjt-product-admin'),
                'type' => 'array',
                'required' => true,
                'items' => array(
                    'type' => 'integer'
                )
            ),
            'region' => array(
                'description' => __('Region code.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('CN', 'EU', 'NA', 'AU')
            ),
            'quantity' => array(
                'description' => __('Quantity for price calculation.', 'bjt-product-admin'),
                'type' => 'integer',
                'minimum' => 1,
                'default' => 1
            )
        );
    }

    /**
     * Get batch inventory endpoint arguments
     */
    private function get_batch_inventory_args() {
        return array(
            'consumableIds' => array(
                'description' => __('Array of consumable IDs.', 'bjt-product-admin'),
                'type' => 'array',
                'required' => true,
                'items' => array(
                    'type' => 'integer'
                )
            ),
            'region' => array(
                'description' => __('Region code.', 'bjt-product-admin'),
                'type' => 'string',
                'enum' => array('CN', 'EU', 'NA', 'AU')
            )
        );
    }

    /**
     * Get inventory status based on available quantity
     */
    private function get_inventory_status($available) {
        if ($available <= 0) {
            return 'out_of_stock';
        } elseif ($available <= 10) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
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