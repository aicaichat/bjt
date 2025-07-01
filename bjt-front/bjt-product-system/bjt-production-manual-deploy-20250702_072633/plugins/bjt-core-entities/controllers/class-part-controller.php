<?php
/**
 * Part Controller
 */
class BJT_Part_Controller extends BJT_API_Controller {
    
    protected $table_name;
    public $resource_name = 'parts'; // The slug for the API endpoint

    // Aligned with init.sql fields in wp_bjt_parts
    protected $fillable_fields = [
        'product_line_id',
        'model',            // Host model
        'voltage',
        'image_url',
        'part_number',      // Unique part number
        'name_zh',          // Chinese name
        'name_en',          // English name
        'brand',
        'spec',             // Metric specifications
        'spec_imperial',    // Imperial specifications
        'package_size_cm',
        'package_size_inch',
        'net_weight_kg',
        'net_weight_lbs',
        'gross_weight_kg',
        'gross_weight_lbs',
        'pcs_per_box',
        'pallet_size_cm',
        'pallet_size_inch',
        'pcs_per_pallet',
        'pallet_height_cm',
        'pallet_height_inch',
        'pallet_gross_weight_kg',
        'pallet_gross_weight_lbs',
        'status',
        'unit'
    ];

    // Fields required when creating an item via API
    protected $required_api_fields_for_create = [
        'product_line_id',
        'model',
        'part_number',
        'name_zh',
        'name_en'
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_parts';
        parent::__construct();
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_pagination_arg_definitions(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema(),
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the part.', 'bjt-core-entities'),
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema(),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the part.', 'bjt-core-entities'),
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
        ]);

        // Batch get prices
        register_rest_route($this->namespace, '/' . $this->resource_name . '/prices/batch', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'batch_get_prices'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'ids' => [
                        'description' => __('Array of part IDs.', 'bjt-core-entities'),
                        'type' => 'array',
                        'required' => true,
                        'items' => [
                            'type' => 'integer',
                        ],
                    ],
                    'region' => [
                        'description' => __('Region code.', 'bjt-core-entities'),
                        'type' => 'string',
                        'default' => 'CN',
                    ],
                    'quantity' => [
                        'description' => __('Quantity for price calculation.', 'bjt-core-entities'),
                        'type' => 'integer',
                        'default' => 1,
                    ],
                ],
            ],
        ]);

        // Batch get inventory
        register_rest_route($this->namespace, '/' . $this->resource_name . '/inventory/batch', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'batch_get_inventory'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'ids' => [
                        'description' => __('Array of part IDs.', 'bjt-core-entities'),
                        'type' => 'array',
                        'required' => true,
                        'items' => [
                            'type' => 'integer',
                        ],
                    ],
                    'region' => [
                        'description' => __('Region code.', 'bjt-core-entities'),
                        'type' => 'string',
                        'default' => 'CN',
                    ],
                ],
            ],
        ]);

        // 🆕 获取主机必选备件详情端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)/required-parts', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_required_parts'],
            'permission_callback' => [$this, 'check_read_permission'],
            'args' => [
                'id' => [
                    'description' => 'Unique identifier for the part.',
                    'type' => 'integer',
                    'required' => true,
                    'sanitize_callback' => 'absint',
                ],
                'lang' => [
                    'description' => 'Language for response (zh/en).',
                    'type' => 'string',
                    'default' => 'zh',
                    'enum' => ['zh', 'en'],
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    public function get_item_schema() {
        $schema = [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer', 'readonly' => true, 'context' => ['view', 'edit', 'embed']],
                'product_line_id' => ['type' => 'integer', 'description' => 'Associated Product Line ID.', 'required' => true],
                'model' => ['type' => 'string', 'description' => 'Model of the part.', 'required' => true],
                'voltage' => ['type' => 'string', 'description' => 'Voltage specification.'],
                'image_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'URL to the part image.'],
                'part_number' => ['type' => 'string', 'description' => 'Unique part number.', 'required' => true],
                'name_zh' => ['type' => 'string', 'description' => 'Chinese name of the part.', 'required' => true],
                'name_en' => ['type' => 'string', 'description' => 'English name of the part.', 'required' => true],
                'brand' => ['type' => 'string', 'description' => 'Brand of the part.'],
                'spec' => ['type' => 'string', 'description' => 'Metric specifications.'],
                'spec_imperial' => ['type' => 'string', 'description' => 'Imperial specifications.'],
                'package_size_cm' => ['type' => 'string', 'description' => 'Package size in centimeters.'],
                'package_size_inch' => ['type' => 'string', 'description' => 'Package size in inches.'],
                'net_weight_kg' => ['type' => 'number', 'description' => 'Net weight in kilograms.'],
                'net_weight_lbs' => ['type' => 'number', 'description' => 'Net weight in pounds.'],
                'gross_weight_kg' => ['type' => 'number', 'description' => 'Gross weight in kilograms.'],
                'gross_weight_lbs' => ['type' => 'number', 'description' => 'Gross weight in pounds.'],
                'pcs_per_box' => ['type' => 'integer', 'description' => 'Number of pieces per box.'],
                'pallet_size_cm' => ['type' => 'string', 'description' => 'Pallet size in centimeters.'],
                'pallet_size_inch' => ['type' => 'string', 'description' => 'Pallet size in inches.'],
                'pcs_per_pallet' => ['type' => 'integer', 'description' => 'Number of pieces per pallet.'],
                'pallet_height_cm' => ['type' => 'number', 'description' => 'Pallet height in centimeters.'],
                'pallet_height_inch' => ['type' => 'number', 'description' => 'Pallet height in inches.'],
                'pallet_gross_weight_kg' => ['type' => 'number', 'description' => 'Pallet gross weight in kilograms.'],
                'pallet_gross_weight_lbs' => ['type' => 'number', 'description' => 'Pallet gross weight in pounds.'],
                'status' => ['type' => 'string', 'description' => 'Status of the part.', 'default' => 'publish'],
                'unit' => ['type' => 'string', 'description' => 'Unit of measurement.', 'default' => 'pcs']
            ],
            'required' => ['product_line_id', 'model', 'part_number', 'name_zh', 'name_en']
        ];
        return $schema;
    }

    protected function format_item_for_response($item_db_object) {
        global $wpdb;
        if (!$item_db_object) {
            return null;
        }

        $part_id = (int) $item_db_object->id;
        $product_line_id_for_join = isset($item_db_object->product_line_id) ? (int) $item_db_object->product_line_id : 0;

        // --- Fetch Pricing --- 
        $pricing_table = $wpdb->prefix . 'bjt_prices';
        $raw_prices = $wpdb->get_results($wpdb->prepare(
            "SELECT region, currency, base_price, min_quantity, max_quantity 
             FROM {$pricing_table} 
             WHERE target_type = 'part' AND part_number = %s AND product_line_id = %d AND status = 'active' 
             ORDER BY min_quantity ASC, region ASC",
            $item_db_object->part_number,
            $product_line_id_for_join
        ));

        $pricing_tiers = [];
        if (!empty($raw_prices)) {
            $grouped_by_tier = [];
            foreach ($raw_prices as $price_row) {
                $tier_key = $price_row->min_quantity . '-' . ($price_row->max_quantity ?? 'inf');
                if (!isset($grouped_by_tier[$tier_key])) {
                    $grouped_by_tier[$tier_key] = [
                        'min_quantity' => (int)$price_row->min_quantity,
                        'max_quantity' => $price_row->max_quantity ? (int)$price_row->max_quantity : null,
                        'regional_prices_raw' => []
                    ];
                }
                $grouped_by_tier[$tier_key]['regional_prices_raw'][] = $price_row;
            }

            foreach ($grouped_by_tier as $tier_data) {
                $range_str = $tier_data['min_quantity'];
                if ($tier_data['max_quantity'] === null) {
                    $range_str .= '+';
                    if($tier_data['min_quantity'] > 1 && $tier_data['max_quantity'] === null ) {
                        $range_str = '>' . ($tier_data['min_quantity'] - 1);
                    } else if ($tier_data['max_quantity'] === null) {
                        $range_str = (string)$tier_data['min_quantity'];
                    } else {
                        $range_str = (string)$tier_data['min_quantity'];
                    }
                } else if ($tier_data['max_quantity'] == $tier_data['min_quantity']) {
                    $range_str = (string)$tier_data['min_quantity'];
                } else {
                    $range_str .= '-' . $tier_data['max_quantity'];
                }
                
                $regional_prices_map = [];
                $default_region_price = 0.00; // Fallback

                foreach ($tier_data['regional_prices_raw'] as $rp_row) {
                    $region_code_lower = strtolower($rp_row->region); // e.g. cn, eu
                    $regional_prices_map[$region_code_lower] = (float)$rp_row->base_price;
                    if (strtoupper($rp_row->region) === 'CN') { // Assuming CN is default for tier.price
                        $default_region_price = (float)$rp_row->base_price;
                    }
                }
                // If CN price was not found, pick first available as default, or keep 0.00
                if ($default_region_price == 0.00 && !empty($regional_prices_map)) {
                    $default_region_price = reset($regional_prices_map); 
                }

                $pricing_tiers[] = [
                    'range' => $range_str,
                    'price' => $default_region_price, // Default region price
                    'regionalPrices' => $regional_prices_map 
                ];
            }
        }

        // --- Fetch Inventory --- 
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
        $raw_inventory = $wpdb->get_results($wpdb->prepare(
            "SELECT region, SUM(quantity) as total_quantity
             FROM {$inventory_table} 
             WHERE target_type = 'part' AND part_number = %s AND product_line_id = %d AND status = 'active' 
             GROUP BY region",
            $item_db_object->part_number,
            $product_line_id_for_join
        ));

        $inventory_map = new stdClass();
        if (!empty($raw_inventory)) {
            foreach ($raw_inventory as $inv_row) {
                $inventory_map->{strtoupper($inv_row->region)} = (int)$inv_row->total_quantity;
            }
        }

        // Convert DB fields to appropriate types
        $formatted = [
            'id' => $part_id,
            'product_line_id' => $product_line_id_for_join,
            'model' => $item_db_object->model,
            'voltage' => $item_db_object->voltage,
            'image_url' => $item_db_object->image_url,
            'part_number' => $item_db_object->part_number,
            'name_zh' => $item_db_object->name_zh,
            'name_en' => $item_db_object->name_en,
            'brand' => $item_db_object->brand,
            'spec' => $item_db_object->spec,
            'spec_imperial' => $item_db_object->spec_imperial,
            'package_size_cm' => $item_db_object->package_size_cm,
            'package_size_inch' => $item_db_object->package_size_inch,
            'net_weight_kg' => $item_db_object->net_weight_kg,
            'net_weight_lbs' => $item_db_object->net_weight_lbs,
            'gross_weight_kg' => $item_db_object->gross_weight_kg,
            'gross_weight_lbs' => $item_db_object->gross_weight_lbs,
            'pcs_per_box' => $item_db_object->pcs_per_box,
            'pallet_size_cm' => $item_db_object->pallet_size_cm,
            'pallet_size_inch' => $item_db_object->pallet_size_inch,
            'pcs_per_pallet' => $item_db_object->pcs_per_pallet,
            'pallet_height_cm' => $item_db_object->pallet_height_cm,
            'pallet_height_inch' => $item_db_object->pallet_height_inch,
            'pallet_gross_weight_kg' => $item_db_object->pallet_gross_weight_kg,
            'pallet_gross_weight_lbs' => $item_db_object->pallet_gross_weight_lbs,
            'status' => $item_db_object->status,
            'unit' => $item_db_object->unit,
            'pricing' => $pricing_tiers,
            'inventory' => $inventory_map,
            'required_parts' => [], // 主机没有必选备件
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at
        ];

        return $formatted;
    }

    public function create_item($request) {
        global $wpdb;
        $params = $request->get_params();

        // Validate required fields
        foreach ($this->required_api_fields_for_create as $field) {
            if (empty($params[$field])) {
                return $this->error_response("Missing required field: {$field}", 'missing_required_field', 400);
            }
        }

        $data_to_insert = [];
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_insert[$field] = $params[$field];
            }
        }

        // Default status if not provided
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish';
        }

        // Default unit if not provided
        if (empty($data_to_insert['unit'])) {
            $data_to_insert['unit'] = 'pcs';
        }
        
        // Set created_at and updated_at
        $current_time_gmt = current_time('mysql', 1);
        $data_to_insert['created_at'] = $current_time_gmt;
        $data_to_insert['updated_at'] = $current_time_gmt;

        // Check for duplicate part_number in the same product_line
        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d",
            $data_to_insert['part_number'],
            $data_to_insert['product_line_id']
        ));
        if ($existing_item) {
            return $this->error_response('Part with this part_number already exists in this product line.', 'duplicate_part_number', 409);
        }

        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log('Part DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        
        $formatted_item = $this->format_item_for_response($created_item_db);
        return $this->format_response($formatted_item, '主机料号创建成功', true, 201);
    }

    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid part ID.', 'invalid_id', 400);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db) {
            return $this->error_response("Part with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db);
        return $this->format_response($formatted_item, '获取主机料号详情成功');
    }

    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        $params = $request->get_params();

        if ($id <= 0) {
            return $this->error_response('Invalid part ID.', 'invalid_id', 400);
        }

        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item) {
            return $this->error_response("Part with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = [];
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_update[$field] = $params[$field];
            }
        }

        if (empty($data_to_update)) {
            return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
        }

        // Check for part_number uniqueness if it's being changed
        if (isset($data_to_update['part_number']) && isset($data_to_update['product_line_id'])) {
            $clash_check = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d AND id != %d",
                $data_to_update['part_number'],
                $data_to_update['product_line_id'],
                $id
            ));
            if ($clash_check) {
                return $this->error_response('Another part with this part_number already exists in this product line.', 'duplicate_part_number', 409);
            }
        } else if (isset($data_to_update['part_number'])) {
            $clash_check = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d AND id != %d",
                $data_to_update['part_number'],
                $existing_item->product_line_id,
                $id
            ));
            if ($clash_check) {
                return $this->error_response('Another part with this part_number already exists in this product line.', 'duplicate_part_number', 409);
            }
        }

        // Set updated_at
        $data_to_update['updated_at'] = current_time('mysql', 1);

        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $id]);

        if ($result === false) {
            error_log('Part DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        $formatted_item = $this->format_item_for_response($updated_item_db);
        
        return $this->format_response($formatted_item, '主机料号更新成功');
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid part ID.', 'invalid_id', 400);
        }

        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return $this->error_response("Part with ID {$id} not found to delete.", 'not_found', 404);
        }

        $result = $wpdb->delete($this->table_name, ['id' => $id]);

        if ($result === false) {
            error_log('Part DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        if ($result === 0) {
            return $this->error_response("Part with ID {$id} could not be deleted (it may have been deleted by another process).", 'delete_failed_not_found', 404);
        }

        return $this->format_response(null, "主机料号 (ID: {$id}) 删除成功");
    }

    public function get_items($request) {
        global $wpdb;

        $pagination_params = $this->extract_pagination_params_from_request($request);
        $per_page = $pagination_params['per_page'];
        $offset = $pagination_params['offset'];
        
        $where_clauses = ["status = 'publish'"]; // Default to published items
        $where_values = [];

        // Add filters
        if ($request->get_param('product_line_id')) {
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = absint($request->get_param('product_line_id'));
        }

        if ($request->get_param('model')) {
            $where_clauses[] = "model = %s";
            $where_values[] = sanitize_text_field($request->get_param('model'));
        }

        if ($request->get_param('part_number')) {
            $where_clauses[] = "part_number = %s";
            $where_values[] = sanitize_text_field($request->get_param('part_number'));
        }

        if ($request->get_param('search')) {
            $search_term = '%' . $wpdb->esc_like(sanitize_text_field($request->get_param('search'))) . '%';
            $where_clauses[] = "(model LIKE %s OR part_number LIKE %s OR name_zh LIKE %s OR name_en LIKE %s)";
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }

        $where_sql = implode(" AND ", $where_clauses);
        
        // Count total items
        $count_query = "SELECT COUNT(id) FROM {$this->table_name} WHERE {$where_sql}";
        $total_items = (int) $wpdb->get_var($wpdb->prepare($count_query, ...$where_values));
        $total_pages = ceil($total_items / $per_page);

        // Get items
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE {$where_sql} ORDER BY id DESC LIMIT %d OFFSET %d",
            array_merge($where_values, [$per_page, $offset])
        );
        $items = $wpdb->get_results($query);

        $formatted_items = [];
        if ($items) {
            foreach ($items as $item) {
                $formatted_items[] = $this->format_item_for_response($item);
            }
        }

        // 返回带有分页信息的响应
        $response_data = [
            'items' => $formatted_items,
            'page' => $pagination_params['page'],
            'per_page' => $per_page,
            'total_items' => $total_items,
            'total_pages' => $total_pages
        ];

        // 使用格式化响应
        return $this->format_response($response_data, '获取主机料号列表成功');
    }

    public function batch_get_prices($request) {
        global $wpdb;
        $part_ids = $request->get_param('ids');
        $region = sanitize_text_field($request->get_param('region') ?: 'CN');
        $quantity = absint($request->get_param('quantity') ?: 1);

        if (empty($part_ids) || !is_array($part_ids)) {
            return $this->format_response([
                'region' => $region,
                'quantity' => $quantity,
                'items' => []
            ], 'No valid part IDs provided.');
        }

        $result = [
            'region' => $region,
            'quantity' => $quantity,
            'items' => []
        ];

        foreach ($part_ids as $part_id) {
            $part_id = absint($part_id);
            
            // Get part info
            $part = $wpdb->get_row($wpdb->prepare(
                "SELECT id, part_number, model, product_line_id FROM {$this->table_name} WHERE id = %d",
                $part_id
            ));

            if (!$part) {
                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => null,
                    'model' => null,
                    'found' => false,
                    'price' => null,
                    'currency' => null,
                    'discount_rate' => null,
                    'final_price' => null
                ];
                continue;
            }

            // Get price info
            $price_query = $wpdb->prepare(
                "SELECT base_price, currency, discount_rate
                 FROM {$wpdb->prefix}bjt_prices
                 WHERE target_type = 'part'
                 AND part_number = %s
                 AND product_line_id = %d
                 AND region = %s
                 AND %d BETWEEN min_quantity AND IFNULL(max_quantity, %d)
                 AND status = 'active'
                 LIMIT 1",
                $part->part_number,
                $part->product_line_id,
                $region,
                $quantity,
                $quantity
            );

            $price_info = $wpdb->get_row($price_query);

            if ($price_info) {
                $base_price = (float) $price_info->base_price;
                $discount_rate = $price_info->discount_rate ? (float) $price_info->discount_rate : 0;
                $final_price = $base_price * (1 - $discount_rate);

                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => $part->part_number,
                    'model' => $part->model,
                    'found' => true,
                    'price' => $base_price,
                    'currency' => $price_info->currency,
                    'discount_rate' => $discount_rate,
                    'final_price' => $final_price
                ];
            } else {
                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => $part->part_number,
                    'model' => $part->model,
                    'found' => false,
                    'price' => null,
                    'currency' => null,
                    'discount_rate' => null,
                    'final_price' => null
                ];
            }
        }

        return $this->format_response($result, '获取价格成功');
    }

    public function batch_get_inventory($request) {
        global $wpdb;
        $part_ids = $request->get_param('ids');
        $region = sanitize_text_field($request->get_param('region') ?: 'CN');

        if (empty($part_ids) || !is_array($part_ids)) {
            return $this->format_response([
                'items' => []
            ], 'No valid part IDs provided.');
        }

        $result = [
            'items' => []
        ];

        foreach ($part_ids as $part_id) {
            $part_id = absint($part_id);
            
            // Get part info
            $part = $wpdb->get_row($wpdb->prepare(
                "SELECT id, part_number, model, product_line_id FROM {$this->table_name} WHERE id = %d",
                $part_id
            ));

            if (!$part) {
                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => null,
                    'model' => null,
                    'found' => false,
                    'total_quantity' => 0,
                    'total_available' => 0,
                    'inventory' => []
                ];
                continue;
            }

            // Get inventory info
            $inventory_query = $wpdb->prepare(
                "SELECT region, warehouse, quantity, reserved
                 FROM {$wpdb->prefix}bjt_inventory
                 WHERE target_type = 'part'
                 AND part_number = %s
                 AND product_line_id = %d
                 AND region = %s
                 AND status = 'active'",
                $part->part_number,
                $part->product_line_id,
                $region
            );

            $inventory_items = $wpdb->get_results($inventory_query);

            if ($inventory_items) {
                $total_quantity = 0;
                $total_reserved = 0;
                $inventory_data = [];

                foreach ($inventory_items as $item) {
                    $quantity = (int) $item->quantity;
                    $reserved = (int) $item->reserved;
                    $available = $quantity - $reserved;

                    $total_quantity += $quantity;
                    $total_reserved += $reserved;

                    $inventory_data[] = [
                        'region' => $item->region,
                        'warehouse' => $item->warehouse,
                        'quantity' => $quantity,
                        'reserved' => $reserved,
                        'available' => $available
                    ];
                }

                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => $part->part_number,
                    'model' => $part->model,
                    'found' => true,
                    'total_quantity' => $total_quantity,
                    'total_available' => $total_quantity - $total_reserved,
                    'inventory' => $inventory_data
                ];
            } else {
                $result['items'][] = [
                    'id' => $part_id,
                    'part_number' => $part->part_number,
                    'model' => $part->model,
                    'found' => false,
                    'total_quantity' => 0,
                    'total_available' => 0,
                    'inventory' => []
                ];
            }
        }

        return $this->format_response($result, '获取库存成功');
    }

    protected function extract_pagination_params_from_request($request) {
        $page = absint($request->get_param('page') ?: 1);
        $per_page = absint($request->get_param('per_page') ?: 10);
        
        // Ensure reasonable limits
        $per_page = min(max($per_page, 1), 100);
        $page = max($page, 1);
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => ($page - 1) * $per_page
        ];
    }

    protected function get_pagination_arg_definitions() {
        return [
            'page' => [
                'description' => __('Current page of the collection.', 'bjt-core-entities'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
            ],
            'per_page' => [
                'description' => __('Maximum number of items to be returned in result set.', 'bjt-core-entities'),
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
            ],
            'search' => [
                'description' => __('Search term.', 'bjt-core-entities'),
                'type' => 'string',
            ],
            'product_line_id' => [
                'description' => __('Filter by product line ID.', 'bjt-core-entities'),
                'type' => 'integer',
            ],
            'model' => [
                'description' => __('Filter by model.', 'bjt-core-entities'),
                'type' => 'string',
            ],
            'part_number' => [
                'description' => __('Filter by part number.', 'bjt-core-entities'),
                'type' => 'string',
            ]
        ];
    }

    public function get_required_parts($request) {
        global $wpdb;
        $id = absint($request['id']);
        $lang = sanitize_text_field($request['lang'] ?: 'zh');

        if ($id <= 0) {
            return $this->error_response('Invalid part ID.', 'invalid_id', 400);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db) {
            return $this->error_response("Part with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_info = [
            'required_parts' => [], // 主机没有必选备件
            'created_at' => $item_db->created_at,
            'updated_at' => $item_db->updated_at
        ];

        if ($lang === 'en') {
            $formatted_info['name_en'] = $item_db->name_en;
            $formatted_info['name_zh'] = $item_db->name_zh;
        } else {
            $formatted_info['name_zh'] = $item_db->name_zh;
            $formatted_info['name_en'] = $item_db->name_en;
        }

        return $this->format_response($formatted_info, '获取主机必选备件详情成功');
    }

    /**
     * Check read permission
     */
    public function check_read_permission($request) {
        return true; // 允许所有用户读取
    }

    /**
     * Check write permission
     */
    public function check_write_permission($request) {
        return current_user_can('manage_options'); // 只有管理员可以写入
    }

    /**
     * Check delete permission
     */
    public function check_delete_permission($request) {
        return current_user_can('manage_options'); // 只有管理员可以删除
    }
} 