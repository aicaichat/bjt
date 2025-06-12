<?php
/**
 * 主机控制器
 */
class BJT_Machine_Controller extends BJT_API_Controller {
    /**
     * 构造函数
     */
    public function __construct() {
        // Define controller-specific properties first
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_host_models'; // Changed from bjt_machines
        $this->resource_name = 'machines'; // Explicitly set resource_name
        
        // Call the parent constructor
        parent::__construct();
        error_log("BJT_API_MACHINE: Constructor for BJT_Machine_Controller CALLED. Namespace: " . $this->namespace . ", Resource: " . $this->resource_name);
    }

    /**
     * 资源名称
     *
     * @var string
     */
    public $resource_name = 'machines';
    
    protected $fillable_fields = [
        'product_line_id', 
        'model', // Corresponds to 'code' in API request for uniqueness check
        'title_zh', // Maps from 'name_cn' in API request
        'title_en', // Maps from 'name_en' in API request
        'description_zh', 
        'description_en', 
        'type', 
        'image1_url', 
        'image2_url', 
        'explosion_diagram_pdf', 
        'status', 
        'sort_order'
    ];
    // For validating incoming request before mapping for create
    protected $required_api_fields_for_create = ['code', 'name_cn', 'name_en', 'product_line_id'];
    
    /**
     * 注册路由
     */
    public function register_routes() {
        error_log("BJT_API_MACHINE: BJT_Machine_Controller::register_routes() CALLED. Namespace: " . $this->namespace . ", Resource: " . $this->resource_name);
        
        // Register original 'machines' routes
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
            ]
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema()
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ]
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\\w-]+)/accessories', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'description' => 'Host Part Number.',
                        'required' => true,
                        'type' => 'string',
                        'validate_callback' => function($value, $request, $param) {
                            return is_string($value) && !empty($value);
                        },
                        'sanitize_callback' => 'sanitize_text_field'
                    ],
                    'lang' => [
                        'description' => 'Language code for localized data (e.g., zh, en).',
                        'type' => 'string',
                        'enum' => ['zh', 'en', 'system'], // 'system' could mean follow WordPress locale
                        'default' => 'system' 
                    ],
                    'region' => [
                        'description' => 'Region code for pricing/inventory (e.g., CN, US).',
                        'type' => 'string',
                        // Add enum if you have a fixed list of regions
                        'default' => 'CN' 
                    ]
                ]
            ]
        ]);
        
        // Add host-models routes that map to the same controller methods
        register_rest_route($this->namespace, '/host-models', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => array_merge(
                    $this->get_pagination_arg_definitions(),
                    [
                        'status' => [
                            'description' => 'Filter by status (publish/draft). If not specified, shows all non-deleted statuses.',
                            'type'        => 'string',
                            'enum'        => ['publish', 'draft'],
                        ],
                    ]
                ),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema(),
            ]
        ]);
        
        register_rest_route($this->namespace, '/host-models/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema()
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ]
        ]);
    }
    
    /**
     * 获取机器列表
     */
    public function get_items($request) {
        global $wpdb;
        // $table_name = $wpdb->prefix . 'bjt_machines'; // Removed: Use $this->table_name

        // Extract pagination parameters
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;

        // 添加状态过滤逻辑 - 支持传递status参数，默认为所有状态（管理后台需要）
        $status_filter = $request->get_param('status');
        $where_clause = '';
        $query_params = [];
        
        if ($status_filter) {
            $where_clause = "WHERE status = %s";
            $query_params[] = $status_filter;
        } else {
            // 如果没有指定状态，显示所有非删除状态的记录（包括publish和draft）
            $where_clause = "WHERE status IN ('publish', 'draft')";
        }

        // Fetch items
        $items_query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} {$where_clause} ORDER BY id ASC LIMIT %d OFFSET %d", // Use $this->table_name
            array_merge($query_params, [$per_page, $offset])
        );
        $items = $wpdb->get_results($items_query);

        // Fetch total count
        $total_items_query = $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} {$where_clause}", $query_params); // Use $this->table_name
        $total_items = (int) $wpdb->get_var($total_items_query);
        $total_pages = ceil($total_items / $per_page);

        $formatted_items = [];
        if ($items) {
            foreach ($items as $item) {
                $formatted_items[] = $this->format_item_for_response($item);
            }
        }

        $response_data = [
            'success' => true,
            'data' => [
                'items' => $formatted_items,
                'total' => $total_items,
                'page' => $page,
                'per_page' => $per_page, // Use per_page
                'total_pages' => $total_pages,
            ],
        ];
        
        // Using WP_REST_Response for consistency with WP REST API best practices
        return new WP_REST_Response($response_data, 200);
    }
    
    /**
     * 获取单个机器
     */
    public function get_item($request) {
        global $wpdb;
        // $table_name = $wpdb->prefix . 'bjt_machines'; // Removed: Use $this->table_name
        $machine_id = isset($request['id']) ? absint($request['id']) : 0;

        if ($machine_id <= 0) {
            return $this->error_response('Invalid machine ID', 'invalid_id', 400);
        }

        $item_query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d AND status = %s", // Use $this->table_name
            $machine_id,
            'publish'
        );
        $item = $wpdb->get_row($item_query);

        if (!$item) {
            return $this->error_response('Machine not found', 'machine_not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item);

        $response_data = [
            'success' => true,
            'data' => $formatted_item,
        ];

        return new WP_REST_Response($response_data, 200);
    }
    
    /**
     * 创建机器
     */
    public function create_item($request) {
        global $wpdb;
        // $table_name = $wpdb->prefix . 'bjt_machines'; // Removed: Use $this->table_name

        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params(); // Fallback for form-data or x-www-form-urlencoded
        }

        foreach ($this->required_api_fields_for_create as $field) {
            if (empty($params[$field])) {
                return $this->error_response("Missing required field: {$field}", 'missing_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request); // Use the mapping method

        // Ensure required DB fields (after mapping) are present 
        if (empty($data_to_insert['model'])) {
             return $this->error_response("Missing required field: code (which maps to model)", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['title_zh'])) { // Mapped from name_cn
             return $this->error_response("Missing required field: name_cn (which maps to title_zh)", 'missing_mapped_field', 400);
        }
         if (empty($data_to_insert['title_en'])) { // Mapped from name_en
             return $this->error_response("Missing required field: name_en (which maps to title_en)", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['product_line_id'])) {
             return $this->error_response("Missing required field: product_line_id", 'missing_mapped_field', 400);
        }
        // Add other DB-level required field checks if necessary, e.g. for status
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish'; // Default status if not provided
        }


        // Check for duplicate model within the same product_line_id
        // As per init.sql, UNIQUE KEY `uk_model` (`product_line_id`, `model`)
        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE product_line_id = %d AND model = %s",
            $data_to_insert['product_line_id'],
            $data_to_insert['model']
        ));
        if ($existing_item) {
            return $this->error_response('Host model already exists for this product line.', 'duplicate_model', 409); 
        }

        $result = $wpdb->insert($this->table_name, $data_to_insert); // Use $this->table_name

        if ($result === false) {
            error_log('BJT_Machine_Controller DB Insert Error: ' . $wpdb->last_error); 
            return $this->error_response('Failed to create machine. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;

        // Fetch the created item to return it
        $created_item_query = $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id); // Use $this->table_name
        $created_item_db = $wpdb->get_row($created_item_query);
        
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created machine.', 'retrieve_error', 500);
        }

        // Format for response (similar to get_item)
        $formatted_item = $this->format_item_for_response($created_item_db);
        
        $response_data = [
            'success' => true,
            'message' => 'Machine created successfully.',
            'data'    => $formatted_item,
        ];

        return new WP_REST_Response($response_data, 201); // 201 Created
    }
    
    /**
     * 更新机器
     */
    public function update_item($request) {
        global $wpdb;
        $machine_id = absint($request->get_param('id'));

        // 1. Check if the machine exists
        $existing_item_query = $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $machine_id);
        $existing_item = $wpdb->get_row($existing_item_query);

        if (!$existing_item) {
            return $this->error_response('Machine not found.', 'not_found', 404);
        }

        // 2. Get data to update using the mapping method
        $data_to_update = $this->map_request_to_db($request);

        if (empty($data_to_update)) {
            // No valid fields to update were provided, return the existing item or a specific message
             $formatted_existing_item = $this->format_item_for_response($existing_item);
            return new WP_REST_Response([
                'success' => true,
                'message' => 'No fields to update or no valid data provided.',
                'data'    => $formatted_existing_item
            ], 200);
        }

        // 3. Handle potential unique constraint violation for 'code' and 'product_line_id'
        $check_code = isset($data_to_update['code']) ? $data_to_update['code'] : $existing_item->model;
        $check_product_line_id = isset($data_to_update['product_line_id']) ? $data_to_update['product_line_id'] : $existing_item->product_line_id;

        if ( (isset($data_to_update['code']) || isset($data_to_update['product_line_id'])) ) {
            $duplicate_query = $wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE product_line_id = %d AND model = %s AND id != %d",
                $check_product_line_id,
                $check_code,
                $machine_id
            );
            $duplicate_exists = $wpdb->get_var($duplicate_query);
            if ($duplicate_exists) {
                return $this->error_response('Another machine with the same code (model) already exists in this product line.', 'duplicate_model_on_update', 409);
            }
        }
        
        // Add 'updated_at' timestamp if not automatically handled by DB (though our schema has ON UPDATE CURRENT_TIMESTAMP)
        // $data_to_update['updated_at'] = current_time('mysql', true);


        // 4. Perform the update
        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $machine_id]);

        if ($result === false) {
            error_log('BJT_Machine_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update machine. DB Error: ' . $wpdb->last_error, 'db_error_update', 500);
        }
        
        if ($result === 0) {
             // No rows affected, likely means data sent was the same as existing data
            $formatted_existing_item = $this->format_item_for_response($existing_item);
            return new WP_REST_Response([
                'success' => true,
                'message' => 'No changes detected or no rows updated.',
                'data'    => $formatted_existing_item 
            ], 200);
        }


        // 5. Fetch the updated item to return it
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $machine_id));
        if (!$updated_item_db) {
             return $this->error_response('Failed to retrieve updated machine.', 'retrieve_error_after_update', 500);
        }
        
        $formatted_item = $this->format_item_for_response($updated_item_db);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Machine updated successfully.',
            'data'    => $formatted_item
        ], 200);
    }
    
    /**
     * 删除机器
     */
    public function delete_item($request) {
        global $wpdb;
        $machine_id = absint($request->get_param('id'));

        // 1. Check if the machine exists to provide a more specific error if not found
        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $machine_id));
        if (!$existing_item) {
            return $this->error_response('Machine not found.', 'not_found_on_delete', 404);
        }

        // 2. Perform the delete operation
        $result = $wpdb->delete($this->table_name, ['id' => $machine_id], ['%d']); // Specify format for WHERE clause

        if ($result === false) {
            error_log('BJT_Machine_Controller DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete machine. DB Error: ' . $wpdb->last_error, 'db_error_delete', 500);
        }
        
        if ($result === 0) {
            // This case should ideally be caught by the check above, but as a safeguard:
            return $this->error_response('Machine not found or already deleted (no rows affected).', 'not_found_or_no_change', 404);
        }

        // 3. Return success response
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Machine deleted successfully.',
            'data'    => ['id' => $machine_id]
        ], 200);
    }
    
    /**
     * 获取机器配件
     */
    public function get_accessories(WP_REST_Request $request) {
        global $wpdb;
        $host_part_number = $request->get_param('id');
        $lang = $request->get_param('lang');
        $region = $request->get_param('region');
        
        if (empty($host_part_number)) {
            return $this->error_response('Host part number is required.', 'missing_host_part_number', 400);
        }

        // Determine effective language
        if ($lang === 'system') {
            $current_locale = get_locale(); // e.g., zh_CN, en_US
            if (strpos($current_locale, 'zh') === 0) {
                $effective_lang = 'zh';
            } else {
                $effective_lang = 'en'; // Default to English if not Chinese
            }
        } else {
            $effective_lang = $lang;
        }

        $relations_table = $wpdb->prefix . 'bjt_relations';
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $accessory_models_table = $wpdb->prefix . 'bjt_accessory_models';
        $prices_table = $wpdb->prefix . 'bjt_prices';
        $inventory_table = $wpdb->prefix . 'bjt_inventory';

        // Step 1: Find child part numbers (accessories) related to the part_number
        $child_part_numbers_query = $wpdb->prepare(
            "SELECT DISTINCT child_part_number FROM {$relations_table} WHERE part_number = %s",
            $host_part_number
        );
        $child_part_numbers_results = $wpdb->get_col($child_part_numbers_query);

        error_log("BJT_API_DEBUG: Found child part numbers: " . print_r($child_part_numbers_results, true));

        if (empty($child_part_numbers_results)) {
            return new WP_REST_Response([
                'success' => true,
                'data' => [
                    'items' => [],
                    'total' => 0,
                    'parent_part_number' => $host_part_number
                ]
            ], 200);
        }

        $placeholders = implode(',', array_fill(0, count($child_part_numbers_results), '%s'));

        // Step 2: Fetch accessory details for these part numbers, joining with accessory_models
        $accessories_query_args = $child_part_numbers_results; // Arguments for prepare
        $accessories_query = $wpdb->prepare(
            "SELECT 
                a.id AS accessory_id, a.part_number, a.model AS accessory_model_code, 
                a.name_zh AS accessory_name_zh, a.name_en AS accessory_name_en, 
                a.spec AS accessory_spec, a.spec_imperial AS accessory_spec_imperial,
                a.image_url AS accessory_image_url, a.status AS accessory_status, a.unit AS accessory_unit,
                am.id AS model_id, am.title_zh AS model_title_zh, am.title_en AS model_title_en,
                am.description_zh AS model_description_zh, am.description_en AS model_description_en,
                am.type AS model_type, am.image1_url AS model_image1_url, am.image2_url AS model_image2_url,
                am.explosion_diagram_pdf AS model_diagram_pdf, am.status AS model_status
            FROM {$accessories_table} a
            LEFT JOIN {$accessory_models_table} am ON a.model = am.model
            WHERE a.part_number IN ($placeholders) AND a.status = 'publish'",
            $accessories_query_args
        );
        $accessories_results = $wpdb->get_results($accessories_query, ARRAY_A);
        
        error_log("BJT_API_DEBUG: Found accessories: " . print_r($accessories_results, true));
        
        if (empty($accessories_results)) {
             return new WP_REST_Response([
                'success' => true,
                'data' => [
                    'items' => [],
                    'total' => 0,
                    'message' => 'No published accessory details found for related part numbers.',
                    'parent_part_number' => $host_part_number
                ]
            ], 200);
        }

        // Step 3: Fetch prices and inventory for the found accessory part numbers
        $part_numbers_for_pi = array_column($accessories_results, 'part_number');
        $prices_data = $this->fetch_batch_data($prices_table, $part_numbers_for_pi, $region, 'part_number', ['price', 'currency', 'unit_price', 'is_discount', 'original_price', 'discount_rate', 'valid_from', 'valid_to']);
        $inventory_data = $this->fetch_batch_data($inventory_table, $part_numbers_for_pi, $region, 'part_number', ['warehouse_code', 'quantity', 'available_quantity', 'location', 'last_checked_at']);

        // Group accessories by model and format the output
        $grouped_accessories = [];
        foreach ($accessories_results as $acc) {
            $model_code = $acc['accessory_model_code'];
            if (!isset($grouped_accessories[$model_code])) {
                $model_title_key = 'model_title_' . $effective_lang;
                $model_description_key = 'model_description_' . $effective_lang;

                $grouped_accessories[$model_code] = [
                    'id' => $acc['model_id'] ? (int)$acc['model_id'] : null,
                    'model_code' => $model_code,
                    'title' => isset($acc[$model_title_key]) ? $acc[$model_title_key] : ($acc['model_title_zh'] ?: $acc['model_title_en']),
                    'description' => isset($acc[$model_description_key]) ? $acc[$model_description_key] : ($acc['model_description_zh'] ?: $acc['model_description_en']),
                    'type' => $acc['model_type'],
                    'image_url' => $this->get_full_url($acc['model_image1_url']),
                    'image2_url' => $this->get_full_url($acc['model_image2_url']),
                    'diagram_pdf' => $this->get_full_url($acc['model_diagram_pdf']),
                    'status' => $acc['model_status'],
                    'parts' => []
                ];
            }

            $part_number = $acc['part_number'];
            $accessory_name_key = 'accessory_name_' . $effective_lang;
            $accessory_spec_key = ($effective_lang === 'en' && !empty($acc['accessory_spec_imperial'])) ? 'accessory_spec_imperial' : 'accessory_spec';


            $part_data = [
                'id' => (int)$acc['accessory_id'],
                'part_number' => $part_number,
                'name' => isset($acc[$accessory_name_key]) ? $acc[$accessory_name_key] : ($acc['accessory_name_zh'] ?: $acc['accessory_name_en']),
                'spec' => $acc[$accessory_spec_key],
                'spec_imperial' => $acc['accessory_spec_imperial'], // Always include if available
                'image_url' => $this->get_full_url($acc['accessory_image_url']),
                'status' => $acc['accessory_status'],
                'unit' => $acc['accessory_unit'],
                'pricing' => isset($prices_data[$part_number]) ? $prices_data[$part_number] : [],
                'inventory' => isset($inventory_data[$part_number]) ? $inventory_data[$part_number] : []
            ];
            $grouped_accessories[$model_code]['parts'][] = $part_data;
        }
        
        $final_items = array_values($grouped_accessories); // Convert map to list

        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'items' => $final_items,
                'total' => count($final_items),
                'parent_part_number' => $host_part_number
            ]
        ], 200);
    }
    
    /**
     * Helper function to fetch batch data (prices or inventory)
     */
    private function fetch_batch_data($table_name, $part_numbers, $region, $part_number_column = 'part_number', $select_columns = ['*']) {
        global $wpdb;
        if (empty($part_numbers)) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($part_numbers), '%s'));
        $columns_to_select = implode(', ', $select_columns);

        $query_args = $part_numbers;
        $sql = "SELECT {$part_number_column}, {$columns_to_select} FROM {$table_name} WHERE {$part_number_column} IN ({$placeholders})";
        
        if ($region) {
            $sql .= " AND region = %s";
            $query_args[] = $region;
        }
        
        $results = $wpdb->get_results($wpdb->prepare($sql, $query_args), ARRAY_A);
        
        $data_map = [];
        foreach ($results as $row) {
            $pn = $row[$part_number_column];
            unset($row[$part_number_column]); // Don't repeat part_number inside the data array for it
            if (!isset($data_map[$pn])) {
                $data_map[$pn] = [];
            }
            // If there can be multiple entries per part_number (e.g. multiple warehouses for inventory)
            // this will collect them into an array. Otherwise, it will be an array with one item.
            $data_map[$pn][] = $row;
        }
        // If only one entry is expected per part_number (e.g., for prices), simplify the structure.
        if ($table_name === $wpdb->prefix . 'bjt_prices') { // Assuming prices are unique per part_number+region
            foreach($data_map as $pn => $entries) {
                if (count($entries) === 1) {
                    $data_map[$pn] = $entries[0];
                } else if (empty($entries)) {
                     $data_map[$pn] = null; // or some default like [] or null
                }
                 // if multiple price entries for same part_number/region, it remains an array
            }
        }
        return $data_map;
    }
    
    /**
     * Helper function to convert relative URL to full URL if not already full.
     */
    protected function get_full_url($url) {
        if (empty($url) || filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }
        // Assuming $url is a path like /uploads/something.jpg
        return get_site_url() . $url;
    }

    /**
     * 定义 REST API 端点参数 (Schema)
     */
    public function get_item_schema() {
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer', 'readonly' => true, 'context' => ['view', 'edit', 'embed']],
                'product_line_id' => ['type' => 'integer', 'required' => true, 'description' => 'Associated Product Line ID.'],
                'code' => ['type' => 'string', 'required' => true, 'description' => 'Unique model code for the host. Maps to \'model\' in DB.'], 
                'name_cn' => ['type' => 'string', 'required' => true, 'description' => 'Chinese name/title. Maps to \'title_zh\' in DB.'],
                'name_en' => ['type' => 'string', 'required' => true, 'description' => 'English name/title. Maps to \'title_en\' in DB.'],
            'description_zh' => ['type' => 'string', 'description' => 'Optional. Chinese description.'],
            'description_en' => ['type' => 'string', 'description' => 'Optional. English description.'],
                'type' => ['type' => 'string', 'description' => 'Optional. Type of the host machine.'],
                'image1_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Primary image URL.'],
            'image2_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Secondary image URL.'],
                'explosion_diagram_pdf' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Explosion diagram PDF URL.'],
                'spec_pdf' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Specification PDF URL.'],
                'status' => ['type' => 'string', 'default' => 'publish', 'enum' => ['publish', 'draft', 'trash']],
                'sort_order' => ['type' => 'integer', 'default' => 0, 'description' => 'Optional. Sort order.'],
            ],
        ];
    }

    /**
     * Helper function to format a DB row item for API response.
     * This centralizes the formatting logic used by get_item, get_items, create_item, update_item.
     */
    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }
        return [
            'id' => (int) $item_db_object->id,
            'code' => trim($item_db_object->model, "'\""),
            'model' => trim($item_db_object->model, "'\""),
            'title_zh' => trim($item_db_object->title_zh, "'\""),
            'title_en' => trim($item_db_object->title_en, "'\""),
            'description_zh' => trim($item_db_object->description_zh, "'\""),
            'description_en' => trim($item_db_object->description_en, "'\""),
            'product_line_id' => (int) $item_db_object->product_line_id,
            'type' => trim($item_db_object->type, "'\""),
            'image1_url' => $item_db_object->image1_url ? trim($item_db_object->image1_url, "'\"") : null,
            'image2_url' => $item_db_object->image2_url ? trim($item_db_object->image2_url, "'\"") : null,
            'explosion_diagram_pdf' => $item_db_object->explosion_diagram_pdf ? trim($item_db_object->explosion_diagram_pdf, "'\"") : null,
            'spec_pdf' => $item_db_object->spec_pdf ? trim($item_db_object->spec_pdf, "'\"") : null,
            'status' => trim($item_db_object->status, "'\""),
            'sort_order' => isset($item_db_object->sort_order) ? (int) $item_db_object->sort_order : 0,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at,
        ];
    }

    protected function map_request_to_db(WP_REST_Request $request) {
        // 优先合并 JSON body 和 URL params，保证所有字段都能获取到
        $params = array_merge(
            is_array($request->get_json_params()) ? $request->get_json_params() : [],
            $request->get_params()
        );
        $data = [];
        
        // Map API 'code' to DB 'model'
        if (isset($params['code'])) {
            $data['model'] = sanitize_text_field($params['code']);
        }
        
        // Map API 'name_cn' to DB 'title_zh'
        if (isset($params['name_cn'])) {
            $data['title_zh'] = sanitize_text_field($params['name_cn']);
        }
        
        // Map API 'name_en' to DB 'title_en'
        if (isset($params['name_en'])) {
            $data['title_en'] = sanitize_text_field($params['name_en']);
        }
        
        // Handle other fillable fields directly
        $direct_map_fields = [
            'product_line_id', 'description_zh', 'description_en', 'type',
            'image1_url', 'image2_url', 'explosion_diagram_pdf', 'spec_pdf',
            'status', 'sort_order'
        ];
        
        foreach ($direct_map_fields as $db_column) {
            if (array_key_exists($db_column, $params)) {
                $value = $params[$db_column];
                
                // Handle empty values
                if ($value === '' || $value === null) {
                    $data[$db_column] = null;
                    continue;
                }
                
                switch ($db_column) {
                    case 'product_line_id':
                    case 'sort_order':
                        $data[$db_column] = absint($value);
                        break;
                    case 'image1_url':
                    case 'image2_url':
                    case 'explosion_diagram_pdf':
                    case 'spec_pdf':
                        // 处理 URL 字段
                        if (empty($value)) {
                            $data[$db_column] = null;
                        } else {
                            // 确保 URL 是相对路径
                            $site_url = get_site_url();
                            if (strpos($value, $site_url) === 0) {
                                $value = substr($value, strlen($site_url));
                            }
                            $data[$db_column] = esc_url_raw($value);
                        }
                        break;
                    case 'description_zh':
                    case 'description_en':
                        $data[$db_column] = sanitize_textarea_field($value);
                        break;
                    default: // For type, status, etc.
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            }
        }
        
        return $data;
    }

    /**
     * Checks if the current user has permission to write (create/update) machines.
     * Requires authentication and proper BJT permissions.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        error_log('[BJT_Machine_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Machine_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Machine_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Machine_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Machine_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Machine_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Machine_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以创建/更新machines
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin', 'manager'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('edit_products', $user->permissions) || 
                                    in_array('manage_products', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_Machine_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update machines.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Machine_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Checks if the current user has permission to delete machines.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has delete access, WP_Error object otherwise.
     */
    public function check_delete_permission($request) {
        error_log('[BJT_Machine_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Machine_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Machine_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Machine_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Machine_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Machine_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Machine_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以删除machines
        $has_delete_permission = false;
        if (isset($user->role)) {
            $allowed_delete_roles = ['admin'];
            $has_delete_permission = in_array($user->role, $allowed_delete_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_delete_permission = $has_delete_permission || 
                                     in_array('delete_products', $user->permissions) || 
                                     in_array('manage_products', $user->permissions);
        }

        if (!$has_delete_permission) {
            error_log('[BJT_Machine_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete machines.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Machine_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }
} 