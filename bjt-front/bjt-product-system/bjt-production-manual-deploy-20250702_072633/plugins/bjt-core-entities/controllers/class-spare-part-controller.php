<?php
/**
 * Spare Part Controller
 */
class BJT_Spare_Part_Controller extends BJT_API_Controller {
    
    protected $table_name;
    public $resource_name = 'spare-parts';

    // Fields from wp_bjt_spare_parts table
    protected $fillable_fields = [
        'product_line_id',
        'app_model',        // Applicable host models (comma-separated string)
        'model',            // Spare part model/type - 添加缺失的model字段
        'is_consumable',    // Integer (1=易损，2=非易损，3=隐藏)
        'image_url',
        'part_number',      // Unique part number for the spare part
        'name_zh',
        'name_en',
        'spec',             // Metric specifications
        'spec_imperial',    // Imperial specifications
        'app_sn',           // Applicable serial numbers (comma-separated string)
        'package_size_cm',
        'package_size_inch',
        'net_weight_kg',
        'net_weight_lbs',
        'gross_weight_kg',
        'gross_weight_lbs',
        'pcs_per_box',
        'required_parts',   // Comma-separated part numbers of required related parts
        'required_quantity',// Comma-separated quantities for required_parts
        'status'
    ];

    // API request fields required for creating a spare part
    // These are the names the API client will send.
    protected $required_api_fields_for_create = [
        'product_line_id',
        'part_number', 
        'name_zh',
        'name_en'
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_spare_parts';
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
        
        // 备件筛选选项API
        register_rest_route($this->namespace, '/' . $this->resource_name . '/filter-options', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_filter_options'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'lang' => [
                        'type' => 'string',
                        'enum' => ['zh', 'en'],
                        'default' => 'zh',
                        'description' => '语言代码'
                    ]
                ]
            ]
        ]);
        
        // 修正后的路由注册格式
        $id_arg = [
            'id' => [
                'required' => true,
                'validate_callback' => function($value) { return is_numeric($value) && (int)$value > 0; },
                'sanitize_callback' => 'absint'
            ]
        ];
        $editable_args = array_merge(
            $id_arg,
            $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE)
        );
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $id_arg
            ],
            [
                'methods' => WP_REST_Server::EDITABLE, // PUT/PATCH
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $editable_args
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $id_arg
            ]
        ]);
        
        // 备件兼容性查询API
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)/compatibility', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_compatibility'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) { return is_numeric($value) && (int)$value > 0; },
                        'sanitize_callback' => 'absint'
                    ],
                    'lang' => [
                        'type' => 'string',
                        'enum' => ['zh', 'en'],
                        'default' => 'zh',
                        'description' => '语言代码'
                    ]
                ]
            ]
        ]);
    }

    public function get_item_schema() {
        $schema = [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer', 'readonly' => true, 'context' => ['view', 'edit', 'embed']],
                'product_line_id' => ['type' => 'integer', 'description' => 'Associated Product Line ID.'],
                'part_number' => ['type' => 'string', 'description' => 'Unique part number for the spare part.'],
                'model' => ['type' => 'string', 'description' => 'Spare part model/type.'],
                'name_zh' => ['type' => 'string', 'description' => 'Chinese name of the spare part.'],
                'name_en' => ['type' => 'string', 'description' => 'English name of the spare part.'],
                'app_model' => ['type' => 'string', 'description' => 'Applicable host models (comma-separated).'],
                'is_consumable' => [
                    'type' => 'integer', 
                    'enum' => [1, 2, 3],
                    'description' => 'Consumable status: 1=Consumable, 2=Non-consumable, 3=Hidden from display'
                ],
                'image_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Image URL.'],
                'spec' => ['type' => 'string', 'description' => 'Metric specifications.'],
                'spec_imperial' => ['type' => 'string', 'description' => 'Imperial specifications.'],
                'app_sn' => ['type' => 'string', 'description' => 'Applicable serial numbers (comma-separated).'],
                'package_size_cm' => ['type' => 'string', 'description' => 'Package size in cm.'],
                'package_size_inch' => ['type' => 'string', 'description' => 'Package size in inches.'],
                'net_weight_kg' => ['type' => 'number', 'format' => 'float', 'description' => 'Net weight in kg.'],
                'net_weight_lbs' => ['type' => 'number', 'format' => 'float', 'description' => 'Net weight in lbs.'],
                'gross_weight_kg' => ['type' => 'number', 'format' => 'float', 'description' => 'Gross weight in kg.'],
                'gross_weight_lbs' => ['type' => 'number', 'format' => 'float', 'description' => 'Gross weight in lbs.'],
                'pcs_per_box' => ['type' => 'integer', 'description' => 'Pieces per box.'],
                'required_parts' => ['type' => 'string', 'description' => 'Comma-separated part numbers of required related parts.'],
                'required_quantity' => ['type' => 'string', 'description' => 'Comma-separated quantities for required parts.'],
                'status' => ['type' => 'string', 'default' => 'publish', 'enum' => ['publish', 'draft', 'trash']],
            ],
        ];
        return $schema;
    }

    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];

        foreach ($this->fillable_fields as $db_column) {
            if (isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'product_line_id':
                    case 'pcs_per_box':
                        $data[$db_column] = absint($value);
                        break;
                    case 'is_consumable':
                        $value = (int) $value;
                        if (in_array($value, [0, 1, 2], true)) {
                            $data[$db_column] = $value;
                        } else {
                            // 如果值不在0/1/2范围内，默认为2（非易损）
                            // 0=不展示，1=易损，2=非易损
                            $data[$db_column] = 2;
                        }
                        break;
                    case 'net_weight_kg':
                    case 'net_weight_lbs':
                    case 'gross_weight_kg':
                    case 'gross_weight_lbs':
                         if (is_numeric($value)) {
                            $data[$db_column] = floatval($value);
                        } elseif ($is_update && ($value === null || $value === '')) {
                             $data[$db_column] = null; // Allow unsetting if DB column is nullable
                        }
                        break;
                    case 'image_url':
                        $data[$db_column] = esc_url_raw($value);
                        break;
                    case 'description_zh': // Example if we add description fields
                    case 'description_en':
                        $data[$db_column] = sanitize_textarea_field($value);
                        break;
                    default: // For text fields
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            } elseif ($is_update && array_key_exists($db_column, $params) && $params[$db_column] === null) {
                 // Allow explicit nulls on update for nullable fields
                 $data[$db_column] = null;
            }
        }
        return $data;
    }

    protected function format_item_for_response($item_db_object) {
        global $wpdb;
        if (!$item_db_object) {
            return null;
        }

        $spare_part_id = (int) $item_db_object->id;
        // Assuming product_line_id is always present for a valid spare part used in pricing/inventory joins
        $product_line_id_for_join = isset($item_db_object->product_line_id) ? (int) $item_db_object->product_line_id : 0;

        $formatted = [];
        foreach (array_keys(get_object_vars($item_db_object)) as $key) {
            if ($key === 'is_consumable') {
                $formatted[$key] = (int) $item_db_object->$key; // 确保作为整数返回：0=不展示，1=易耗，2=非易耗
            } elseif (in_array($key, ['net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs'])) {
                 $formatted[$key] = $item_db_object->$key !== null ? floatval($item_db_object->$key) : null;
            } elseif (in_array($key, ['id', 'product_line_id', 'pcs_per_box'])) {
                 $formatted[$key] = $item_db_object->$key !== null ? (int) $item_db_object->$key : null;
            }
            else {
                $formatted[$key] = $item_db_object->$key;
            }
        }
        
        // --- 🆕 获取必选备件数据 ---
        $relations_table = $wpdb->prefix . 'bjt_relations';
        $required_parts_data = $wpdb->get_row($wpdb->prepare(
            "SELECT required_parts, required_quantity 
             FROM {$relations_table} 
             WHERE child_part_number = %s AND required_parts IS NOT NULL AND required_parts != '' 
             ORDER BY id ASC LIMIT 1",
            $item_db_object->part_number
        ));
        
        $required_parts_info = [];
        if ($required_parts_data) {
            $part_numbers = explode(',', $required_parts_data->required_parts);
            $quantities = explode(',', $required_parts_data->required_quantity ?: '1');
            
            foreach ($part_numbers as $index => $part_number) {
                $part_number = trim($part_number);
                $quantity = isset($quantities[$index]) ? (int) trim($quantities[$index]) : 1;
                
                if (!empty($part_number)) {
                    $required_parts_info[] = [
                        'part_number' => $part_number,
                        'quantity' => $quantity
                    ];
                }
            }
            
            // 添加调试日志
            error_log("🔍 [BJT_Spare_Part_Controller] Found required parts for {$item_db_object->part_number}: " . 
                     $required_parts_data->required_parts . " (qty: " . $required_parts_data->required_quantity . ")");
        }
        
        // --- Fetch Pricing --- 
        $pricing_table = $wpdb->prefix . 'bjt_prices';
        $raw_prices = $wpdb->get_results($wpdb->prepare(
            "SELECT region, currency, base_price, min_quantity, max_quantity 
             FROM {$pricing_table} 
             WHERE target_type = 'spare_part' AND target_id = %d AND product_line_id = %d AND status = 'active' 
             ORDER BY min_quantity ASC, region ASC",
            $spare_part_id,
            $product_line_id_for_join
        ));

        $pricing_tiers_response = [];
        if (!empty($raw_prices)) {
            $grouped_by_tier_key = []; // e.g., "1-10", "11-inf"
            foreach ($raw_prices as $price_row) {
                $tier_key = $price_row->min_quantity . '-' . ($price_row->max_quantity ?? 'inf');
                if (!isset($grouped_by_tier_key[$tier_key])) {
                    $grouped_by_tier_key[$tier_key] = [
                        'min_quantity' => (int)$price_row->min_quantity,
                        'max_quantity' => $price_row->max_quantity ? (int)$price_row->max_quantity : null,
                        'regional_prices_raw' => [] // Store raw prices per region for this tier
                    ];
                }
                $grouped_by_tier_key[$tier_key]['regional_prices_raw'][] = $price_row;
            }

            foreach ($grouped_by_tier_key as $tier_data) {
                $range_str = ($tier_data['min_quantity'] ?? '0') . '-' . ($tier_data['max_quantity'] ?? '*');
                if ($tier_data['min_quantity'] == 1 && $tier_data['max_quantity'] === null) { // Single price, no tiers
                    $range_str = 'base'; // Or keep numeric if preferred for consistency
                } elseif ($tier_data['max_quantity'] === null) {
                    $range_str = '>' . ($tier_data['min_quantity'] -1) ;
                }

                $tier_response_item = [
                    'range' => $range_str,
                    'price' => null, // Default/Primary price for the tier (e.g., from a default region or specific logic)
                    'regionalPrices' => (object)[] // Use object for regionalPrices
                ];

                $default_price_set = false;
                foreach ($tier_data['regional_prices_raw'] as $price_row) {
                    $region_code = strtolower($price_row->region); // cn, eu, us
                    $tier_response_item['regionalPrices']->$region_code = floatval($price_row->base_price);
                    // Set the default tier price (e.g., from 'CN' or the first one encountered)
                    if (!$default_price_set || strtoupper($price_row->region) === 'CN') {
                        $tier_response_item['price'] = floatval($price_row->base_price);
                        $default_price_set = true;
                    }
                }
                $pricing_tiers_response[] = $tier_response_item;
            }
        }
        $formatted['pricing'] = $pricing_tiers_response;

        // --- Fetch Inventory --- 
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
        $raw_inventory = $wpdb->get_results($wpdb->prepare(
            "SELECT region, SUM(quantity) as total_quantity 
             FROM {$inventory_table} 
             WHERE target_type = 'spare_part' AND target_id = %d AND product_line_id = %d AND status = 'active' 
             GROUP BY region",
            $spare_part_id,
            $product_line_id_for_join
        ));
        
        $inventory_response = (object)[]; // Initialize as an empty object
        if (!empty($raw_inventory)) {
            foreach ($raw_inventory as $inv_row) {
                $inventory_response->{strtoupper($inv_row->region)} = (int)$inv_row->total_quantity;
            }
        }
        $formatted['inventory'] = $inventory_response;
        
        // 添加必选备件信息到响应中
        $formatted['required_parts'] = $required_parts_info;

        // 添加统一名称字段，直接使用name_zh/name_en字段
        $formatted['name_zh'] = $item_db_object->name_zh ?? '';
        $formatted['name_en'] = $item_db_object->name_en ?? '';

        return $formatted;
    }

    /**
     * 格式化API响应
     *
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param bool $success 是否成功
     * @param int $code HTTP状态码
     * @return WP_REST_Response 格式化的响应
     */
    protected function format_response($data = null, $message = '', $success = true, $code = 200) {
        $response = [
            'success' => $success
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        if (!empty($message)) {
            $response['message'] = $message;
        }

        return new WP_REST_Response($response, $code);
    }

    /**
     * 格式化错误响应
     * 
     * @param string $message 错误消息
     * @param string $error_code 错误代码
     * @param int $status_code HTTP状态码
     * @param array $data 错误数据
     * @return WP_REST_Response
     */
    protected function error_response($message, $error_code = 'error', $status_code = 400, $data = null) {
        $error_data = array('status' => $status_code);
        if ($data !== null) {
            $error_data = array_merge($error_data, $data);
        }
        return new WP_Error($error_code, $message, $error_data);
    }

    // Basic CRUD Methods (adapted from BJT_Consumable_Controller)

    public function create_item($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params(); // Fallback for form-data
        }

        // Validate required API fields
        foreach ($this->required_api_fields_for_create as $field_key) {
            if (empty($params[$field_key])) {
                return $this->error_response("Missing required field: {$field_key}", 'missing_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Additional DB-level validation (e.g., part_number uniqueness within product_line_id)
        if (isset($data_to_insert['part_number']) && isset($data_to_insert['product_line_id'])) {
            $existing_item = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d",
                $data_to_insert['part_number'],
                $data_to_insert['product_line_id']
            ));
            if ($existing_item) {
                return $this->error_response('Spare part with this part_number already exists in this product line.', 'duplicate_spare_part', 409);
            }
        } else {
            if (empty($data_to_insert['part_number'])) return $this->error_response("Part number is required.", 'missing_part_number', 400);
            if (empty($data_to_insert['product_line_id'])) return $this->error_response("Product line ID is required.", 'missing_product_line_id', 400);
        }
        
        // Default status if not provided
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish';
        }

        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log($this->resource_name . ' DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create spare part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created spare part.', 'retrieve_error', 500);
        }
        
        $formatted_item = $this->format_item_for_response($created_item_db);
        return $this->format_response($formatted_item, 'Spare part created successfully.', true, 201);
    }

    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        $item_db_object = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db_object) {
            return $this->error_response($this->resource_name . " with ID {$id} not found.", 'not_found', 404);
        }
        
        $formatted_item = $this->format_item_for_response($item_db_object);
        return $this->format_response($formatted_item);
    }

    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        // Check if item exists
        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item) {
            return $this->error_response($this->resource_name . " with ID {$id} not found.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true);

        if (empty($data_to_update)) {
            return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
        }

        // Check for part_number uniqueness if it's being changed
        if (isset($data_to_update['part_number'])) {
            $product_line_id_for_check = isset($data_to_update['product_line_id']) ? $data_to_update['product_line_id'] : $existing_item->product_line_id;
            $clash_check = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d AND id != %d",
                $data_to_update['part_number'],
                $product_line_id_for_check,
                $id
            ));
            if ($clash_check) {
                return $this->error_response('Another spare part with this part_number already exists in this product line.', 'duplicate_spare_part_on_update', 409);
            }
        }

        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $id]);

        if ($result === false) {
            error_log($this->resource_name . ' DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update spare part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        // If $result is 0, it means no rows were changed (data might be the same), but not an error.
        // Fetch the updated item to return the current state.
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        $formatted_item = $this->format_item_for_response($updated_item_db);
        
        return $this->format_response($formatted_item, 'Spare part updated successfully.');
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        // Check if item exists
        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item) {
            return $this->error_response($this->resource_name . " with ID {$id} not found.", 'not_found', 404);
        }

        // Consider soft delete if 'status' field is used for it, e.g., set to 'trash'
        // For now, a hard delete:
        $result = $wpdb->delete($this->table_name, ['id' => $id]);

        if ($result === false) {
            error_log($this->resource_name . ' DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete spare part. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        if ($result === 0) { // Should not happen if item existed unless delete failed silently
            return $this->error_response('Spare part could not be deleted or was already deleted.', 'delete_failed', 500);
        }

        return $this->format_response(null, 'Spare part deleted successfully.');
    }
    
    public function get_items($request) {
        global $wpdb;

        $pagination_params = $this->extract_pagination_params_from_request($request);
        $per_page = $pagination_params['per_page'];
        $offset = $pagination_params['offset'];
        
        $base_query = "FROM {$this->table_name}";
        $where_clauses = [
            "status = 'publish'"
        ];

        // 🔧 可选择性排除隐藏备件（is_consumable = 0）
        $exclude_hidden = $request->get_param('exclude_hidden');
        if ($exclude_hidden === null || $exclude_hidden === 'true' || $exclude_hidden === true) {
            // 默认排除隐藏备件，保持向后兼容
            $where_clauses[] = "is_consumable != 0";
        }
        // 如果明确设置 exclude_hidden=false，则显示所有备件包括隐藏的

        // Example filter: by product_line_id
        if ($request->get_param('product_line_id')) {
            $where_clauses[] = $wpdb->prepare("product_line_id = %d", absint($request->get_param('product_line_id')));
        }
        // Example filter: by model
        if ($request->get_param('model')) {
            $where_clauses[] = $wpdb->prepare("model = %s", sanitize_text_field($request->get_param('model')));
        }
        // Example filter: by part_number (exact match)
        if ($request->get_param('part_number')) {
            $where_clauses[] = $wpdb->prepare("part_number = %s", sanitize_text_field($request->get_param('part_number')));
        }
        // 添加配件型号筛选逻辑
        if ($request->get_param('app_model')) {
            $selected_model = sanitize_text_field($request->get_param('app_model'));
            // 使用LIKE查询支持逗号分隔的模型列表匹配
            $where_clauses[] = $wpdb->prepare(
                "(app_model LIKE %s OR app_model LIKE %s OR app_model LIKE %s OR app_model = %s)",
                '%' . $wpdb->esc_like($selected_model) . ',%',  // 模型在开头：ET1005,其他
                '%,' . $wpdb->esc_like($selected_model) . ',%', // 模型在中间：其他,ET1005,其他
                '%,' . $wpdb->esc_like($selected_model),        // 模型在结尾：其他,ET1005
                $selected_model                                 // 完全匹配：ET1005
            );
        }
        // Example filter: is_consumable - 支持1=易耗，2=非易耗
        if ($request->get_param('is_consumable') !== null) {
            $consumable_filter = (int)$request->get_param('is_consumable');
            if (in_array($consumable_filter, [1, 2])) { // 只允许1或2
                $where_clauses[] = $wpdb->prepare("is_consumable = %d", $consumable_filter);
            }
        }

        $where_sql = implode(" AND ", $where_clauses);

        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        $total_items = (int) $wpdb->get_var($total_items_query);
        $total_pages = ceil($total_items / $per_page);

        $items_query = $wpdb->prepare(
            "SELECT * {$base_query} WHERE {$where_sql} ORDER BY id DESC LIMIT %d OFFSET %d",
            $per_page,
            $offset
        );
        $items_db = $wpdb->get_results($items_query);

        $formatted_items = [];
        if ($items_db) {
            foreach ($items_db as $item_db_object) {
                $formatted_items[] = $this->format_item_for_response($item_db_object);
            }
        }
        
        $response_data = [
            'items' => $formatted_items,
            'total' => $total_items,
            'page' => $pagination_params['page'],
            'per_page' => $per_page,
            'total_pages' => $total_pages,
        ];
        
        $response = $this->format_response($response_data);
        // Add Link headers for pagination (from BJT_API_Controller or implement here if needed)
        $this->add_pagination_headers($response, $request, $total_items, $per_page);

        return $response;
    }

    /**
     * 获取备件兼容性信息
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response 备件兼容性响应
     */
    public function get_compatibility($request) {
        global $wpdb;
        $spare_parts_table = $this->table_name;
        $host_models_table = $wpdb->prefix . 'bjt_host_models';
        
        // 获取请求参数
        $id = (int)$request['id'];
        $lang = $request->get_param('lang') ?: 'zh';
        
        // 确定使用的语言字段
        $title_column = $lang === 'en' ? 'title_en' : 'title_zh';
        $name_column = $lang === 'en' ? 'name_en' : 'name_zh';
        
        // 查询备件信息
        $spare_part = $wpdb->get_row($wpdb->prepare(
            "SELECT id, product_line_id, part_number, {$name_column} as name, app_model, app_sn 
             FROM {$spare_parts_table} 
             WHERE id = %d AND status = 'publish'",
            $id
        ));
        
        if (!$spare_part) {
            return $this->error_response('未找到指定的备件', 'spare_part_not_found', 404);
        }
        
        // 获取兼容的主机型号信息
        $compatible_models = [];
        
        // 如果备件有app_model字段（逗号分隔的主机型号列表）
        if (!empty($spare_part->app_model)) {
            $models = array_map('trim', explode(',', $spare_part->app_model));
            
            if (!empty($models)) {
                $placeholders = implode(',', array_fill(0, count($models), '%s'));
                $query_args = array_merge([$spare_part->product_line_id], $models);
                
                $host_models = $wpdb->get_results($wpdb->prepare(
                    "SELECT id, model, {$title_column} as title, type, image1_url
                     FROM {$host_models_table}
                     WHERE product_line_id = %d AND model IN ({$placeholders}) AND status = 'publish'
                     ORDER BY sort_order ASC, model ASC",
                    $query_args
                ));
                
                if ($host_models) {
                    foreach ($host_models as $model) {
                        $compatible_models[] = [
                            'id' => (int)$model->id,
                            'model' => $model->model,
                            'title' => $model->title,
                            'type' => $model->type,
                            'image_url' => $model->image1_url
                        ];
                    }
                }
            }
        }
        
        // 构建适用序列号信息（如果有）
        $serial_number_info = null;
        if (!empty($spare_part->app_sn)) {
            $serial_number_info = [
                'raw' => $spare_part->app_sn,
                'formatted' => $this->format_serial_number_info($spare_part->app_sn)
            ];
        }
        
        // 构建响应数据
        $response_data = [
            'id' => (int)$spare_part->id,
            'part_number' => $spare_part->part_number,
            'name' => $spare_part->name,
            'compatible_models' => $compatible_models,
            'serial_number_info' => $serial_number_info
        ];
        
        return $this->format_response($response_data);
    }

    /**
     * 格式化序列号信息
     * 将原始序列号信息格式化为更易读的格式
     *
     * @param string $raw_sn_info 原始序列号信息
     * @return array 格式化后的序列号信息
     */
    private function format_serial_number_info($raw_sn_info) {
        if (empty($raw_sn_info)) {
            return [];
        }
        
        $formatted = [];
        
        // 一些常见的序列号格式：
        // 1. 范围格式 "SN10000-SN20000"
        // 2. 前缀格式 "SN10* (2018及以后)"
        // 3. 列表格式 "SN10001, SN10002, SN10003"
        
        // 简单分割逗号分隔的项
        $items = array_map('trim', explode(',', $raw_sn_info));
        
        foreach ($items as $item) {
            // 检测范围格式
            if (preg_match('/^(.+?)-(.+?)$/', $item, $matches)) {
                $formatted[] = [
                    'type' => 'range',
                    'start' => $matches[1],
                    'end' => $matches[2],
                    'display' => $item
                ];
            }
            // 检测前缀带星号格式
            elseif (strpos($item, '*') !== false) {
                $parts = explode('*', $item, 2);
                $prefix = trim($parts[0]);
                $note = !empty($parts[1]) ? trim($parts[1]) : '';
                
                $formatted[] = [
                    'type' => 'prefix',
                    'prefix' => $prefix,
                    'note' => $note,
                    'display' => $item
                ];
            }
            // 否则当作具体序列号处理
            else {
                $formatted[] = [
                    'type' => 'exact',
                    'value' => $item,
                    'display' => $item
                ];
            }
        }
        
        return $formatted;
    }
    
    /**
     * Extracts and processes pagination parameters from an incoming WP_REST_Request object.
     *
     * @param WP_REST_Request $request Request object.
     * @return array Associative array containing 'page', 'per_page', and 'offset'.
     */
    protected function extract_pagination_params_from_request($request) {
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        $per_page = isset($request['per_page']) ? (int) $request['per_page'] : 10;
        
        $page = max(1, $page);
        $per_page = max(1, min($per_page, 100)); // Cap per_page
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => ($page - 1) * $per_page,
        ];
    }

    /**
     * Adds pagination headers to a REST response.
     *
     * @param WP_REST_Response $response Response object.
     * @param WP_REST_Request $request Request object.
     * @param int $total_items Total number of items.
     * @param int $per_page Number of items per page.
     * @return WP_REST_Response Modified response object.
     */
    protected function add_pagination_headers($response, $request, $total_items, $per_page) {
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        
        $max_pages = ceil($total_items / $per_page);
        
        if ($page > 1) {
            $prev_page = $page - 1;
            $prev_link = add_query_arg('page', $prev_page, rest_url(sprintf('%s/%s', $this->namespace, $this->resource_name)));
            $response->link_header('prev', $prev_link);
        }
        
        if ($max_pages > $page) {
            $next_page = $page + 1;
            $next_link = add_query_arg('page', $next_page, rest_url(sprintf('%s/%s', $this->namespace, $this->resource_name)));
            $response->link_header('next', $next_link);
        }
        
        return $response;
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
        error_log('[BJT_Spare_Part_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Spare_Part_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Spare_Part_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Spare_Part_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Spare_Part_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Spare_Part_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Spare_Part_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以管理备件
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin', 'manager'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('edit_products', $user->permissions) || 
                                    in_array('manage_products', $user->permissions) ||
                                    in_array('manage_spare_parts', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_Spare_Part_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to manage spare parts.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Spare_Part_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Check delete permission
     */
    public function check_delete_permission($request) {
        error_log('[BJT_Spare_Part_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Spare_Part_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Spare_Part_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Spare_Part_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Spare_Part_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Spare_Part_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Spare_Part_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以删除备件
        $has_delete_permission = false;
        if (isset($user->role)) {
            $allowed_delete_roles = ['admin', 'manager'];
            $has_delete_permission = in_array($user->role, $allowed_delete_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_delete_permission = $has_delete_permission || 
                                     in_array('delete_products', $user->permissions) || 
                                     in_array('manage_products', $user->permissions) ||
                                     in_array('manage_spare_parts', $user->permissions);
        }

        if (!$has_delete_permission) {
            error_log('[BJT_Spare_Part_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete spare parts.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Spare_Part_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * 获取备件筛选选项
     * 返回所有可用的产品类型、型号、品牌等筛选选项
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response 筛选选项响应
     */
    public function get_filter_options($request) {
        global $wpdb;
        
        // 获取请求参数
        $lang = $request->get_param('lang') ?: 'zh';
        
        // 查询所有已发布的备件，获取适用型号信息
        $spare_parts = $wpdb->get_results($wpdb->prepare(
            "SELECT DISTINCT app_model, is_consumable 
             FROM {$this->table_name} 
             WHERE status = 'publish' AND app_model IS NOT NULL AND app_model != ''"
        ));
        
        // 获取主机型号和配件型号
        $host_models_table = $wpdb->prefix . 'bjt_host_models';
        $accessory_models_table = $wpdb->prefix . 'bjt_accessory_models';
        $title_column = $lang === 'en' ? 'title_en' : 'title_zh';
        
        // 查询主机型号
        $host_models_raw = $wpdb->get_results($wpdb->prepare(
            "SELECT model, {$title_column} as title 
             FROM {$host_models_table} 
             WHERE status = 'publish' 
             ORDER BY sort_order ASC, model ASC"
        ));
        
        // 查询配件型号  
        $accessory_models_raw = $wpdb->get_results($wpdb->prepare(
            "SELECT model, {$title_column} as title 
             FROM {$accessory_models_table} 
             WHERE status = 'publish' 
             ORDER BY sort_order ASC, model ASC"
        ));
        
        // 构建主机型号列表（返回字符串数组，符合文档格式）
        $host_models = [];
        if ($host_models_raw) {
            foreach ($host_models_raw as $model) {
                $host_models[] = $model->model;
            }
        }
        
        // 构建配件型号列表
        $accessory_models = [];
        if ($accessory_models_raw) {
            foreach ($accessory_models_raw as $model) {
                $accessory_models[] = $model->model;
            }
        }
        
        // 如果没有从专门的型号表获取到数据，从备件的app_model字段中提取
        if (empty($host_models) && empty($accessory_models) && $spare_parts) {
            $all_models = [];
            foreach ($spare_parts as $part) {
                if (!empty($part->app_model)) {
                    // 清理并分割模型字符串
                    $clean_models = str_replace(['"', "'"], '', $part->app_model); // 移除引号
                    $models_array = array_map('trim', explode(',', $clean_models));
                    foreach ($models_array as $model) {
                        $model = trim($model);
                        if (!empty($model) && !in_array($model, $all_models)) {
                            $all_models[] = $model;
                        }
                    }
                }
            }
            
            // 简单分类：LA-开头的归为主机型号，其他归为配件型号
            sort($all_models);
            foreach ($all_models as $model) {
                // 检查是否为主机型号（以LA-开头）
                if (preg_match('/^LA-/i', $model)) {
                    $host_models[] = $model;
                } else {
                    $accessory_models[] = $model;
                }
            }
        }
        
        // 对模型列表进行去重和排序
        $host_models = array_unique($host_models);
        $accessory_models = array_unique($accessory_models);
        sort($host_models);
        sort($accessory_models);
        
        // 构建备件类型选项（符合文档格式）
        $part_types = [
            [
                'id' => 'consumable',
                'name' => $lang === 'zh' ? '耗材' : 'Consumable'
            ],
            [
                'id' => 'component', 
                'name' => $lang === 'zh' ? '组件' : 'Component'
            ]
        ];
        
        // 构建响应数据（严格按照API文档格式）
        $response_data = [
            'hostModels' => $host_models,
            'accessoryModels' => $accessory_models,
            'partTypes' => $part_types
        ];
        
        return $this->format_response($response_data, '筛选选项获取成功');
    }
} 