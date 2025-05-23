<?php
/**
 * Consumable Controller
 */
class BJT_Consumable_Controller extends BJT_API_Controller {
    
    protected $table_name;
    public $resource_name = 'consumables'; // The slug for the CPT / API endpoint

    // Aligned with init.sql and frontend expectations (first pass)
    protected $fillable_fields = [
        'product_line_id',
        'part_number',      // Frontend: code
        'model',            // Frontend: name, model
        'model_imperial',
        'spec',             // Generic spec string, might be used or mapped
        'spec_imperial',    // Generic spec string, might be used or mapped
        'brand',
        'app_model',        // For specs.compatibility
        'bag_type',         // For specs.shape
        'material',         // For specs.material
        'thickness_met',    // For specs.thickness
        'thickness_imp',
        'width_met',        // For specs.width
        'width_imp',
        'length_met',       // For specs.length
        'length_imp',
        'bubble_diameter_met',
        'bubble_diameter_imp',
        'total_length_met', // For specs.rollLength
        'total_length_imp',
        'package_type',     // For sales_unit (e.g., pcs, roll, box)
        'image_url',
        'status'
        // Other fields like package_*, pallet_*, pcs_per_*, weights can be added later
    ];

    // Fields required when creating an item via API
    protected $required_api_fields_for_create = [
        'product_line_id', // Sent directly
        'code',            // This is what the API client will send, maps to part_number
        'name'             // This is what the API client will send for name, maps to model
                           // 'model' field from client can also map to DB 'model'
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_consumables';
        // $this->rest_base = $this->resource_name; // Handled by BJT_API_Controller if not extending WP_REST_Controller
        parent::__construct();
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_pagination_arg_definitions(), // from parent
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
                        'required' => true,
                        'validate_callback' => function($value) { return is_numeric($value) && (int)$value > 0; },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ],
            [
                'methods' => WP_REST_Server::EDITABLE, // Covers PUT and PATCH
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
                        'validate_callback' => function($value) { return is_numeric($value) && (int)$value > 0; },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ]
        ]);
        
        // 批量获取耗材价格
        register_rest_route($this->namespace, '/' . $this->resource_name . '/prices/batch', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'batch_get_prices'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'items' => [
                        'required' => false,
                        'type' => 'array',
                        'description' => '要查询价格的耗材ID数组'
                    ],
                    'region' => [
                        'required' => false,
                        'type' => 'string',
                        'enum' => ['CN', 'EU', 'NA', 'AU'],
                        'default' => 'CN',
                        'description' => '区域代码'
                    ],
                    'quantity' => [
                        'required' => false,
                        'type' => 'integer',
                        'default' => 1,
                        'description' => '查询的数量，影响价格等级'
                    ]
                ]
            ]
        ]);
        
        // 批量获取耗材库存
        register_rest_route($this->namespace, '/' . $this->resource_name . '/inventory/batch', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'batch_get_inventory'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'items' => [
                        'required' => false,
                        'type' => 'array',
                        'description' => '要查询库存的耗材ID数组'
                    ],
                    'region' => [
                        'required' => false,
                        'type' => 'string',
                        'enum' => ['CN', 'EU', 'NA', 'AU'],
                        'description' => '区域代码，如不提供则返回所有区域'
                    ],
                    'warehouse' => [
                        'required' => false,
                        'type' => 'string',
                        'description' => '仓库代码，如不提供则返回指定区域的所有仓库'
                    ]
                ]
            ]
        ]);
        
        // 检查耗材兼容性
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)/compatibility-check', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'check_compatibility'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) { return is_numeric($value) && (int)$value > 0; },
                        'sanitize_callback' => 'absint'
                    ],
                    'model' => [
                        'required' => true,
                        'type' => 'string',
                        'description' => '要检查兼容性的机器型号'
                    ]
                ]
            ]
        ]);
    }

    public function get_item_schema() {
        // Schema reflects what the API client sends/receives, mapping to DB fields.
        $schema = [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer', 'readonly' => true, 'context' => ['view', 'edit', 'embed']],
                'product_line_id' => ['type' => 'integer', 'description' => 'Associated Product Line ID.'],
                'code' => ['type' => 'string', 'description' => 'Unique part number for the consumable.'], // Maps to part_number
                'name' => ['type' => 'string', 'description' => 'Name/Model of the consumable.'], // Maps to model
                'model' => ['type' => 'string', 'description' => 'Model of the consumable (can be same as name).'], // Also maps to model
                'model_imperial' => ['type' => 'string', 'description' => 'Imperial model designation.'],
                'brand' => ['type' => 'string', 'description' => 'Brand of the consumable.'],
                'package_type' => ['type' => 'string', 'description' => 'Packaging type (e.g., roll, pcs, box). Used for sales_unit.'],
                'image_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Image URL.'],
                'status' => ['type' => 'string', 'default' => 'publish', 'enum' => ['publish', 'draft', 'trash']],
                // Representing specs as individual fields for clarity in API schema,
                // though frontend expects a nested 'specs' object in response.
                // format_item_for_response will build the nested 'specs' object.
                // For request (create/update), client might send these flat or we adapt map_request_to_db.
                // For simplicity, let's assume client sends these flat for now if they want to set them.
                'material' => ['type' => 'string', 'description' => 'Material of the consumable.'],
                'bag_type' => ['type' => 'string', 'description' => 'Bag type or shape.'], // For specs.shape
                'thickness_met_val' => ['type' => 'number', 'description' => 'Metric thickness value (e.g., 25 for 25um).'], // For specs.thickness
                'width_met_val' => ['type' => 'number', 'description' => 'Metric width value (e.g., 200 for 200mm).'], // For specs.width
                'length_met_val' => ['type' => 'number', 'description' => 'Metric length value (e.g., 500 for 500m).'], // For specs.length
                'total_length_met_val' => ['type' => 'number', 'description' => 'Metric total roll length value (e.g., 700 for 700m).'], // For specs.rollLength
                'app_model' => ['type' => 'string', 'description' => 'Compatible host models.'], // For specs.compatibility
                
                // Fields from init.sql that could be added to schema if needed for API create/update:
                // spec, spec_imperial, thickness_imp_val, width_imp_val, length_imp_val, total_length_imp_val etc.
            ],
        ];
         // Required fields for CREATABLE are enforced by create_item method based on $required_api_fields_for_create
        return $schema;
    }

    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];
        
        // Map API field 'code' to DB 'part_number'
        if (isset($params['code'])) {
            $data['part_number'] = sanitize_text_field($params['code']);
        }

        // Map API field 'name' or 'model' to DB 'model'
        // If 'name' is provided, it takes precedence for DB 'model'.
        // If only 'model' is provided (e.g. from frontend item.model), use that.
        if (isset($params['name'])) {
            $data['model'] = sanitize_text_field($params['name']);
        } elseif (isset($params['model']) && !isset($data['model'])) {
            $data['model'] = sanitize_text_field($params['model']);
        }
        
        // Direct mapping for other fields if they are in $fillable_fields
        $direct_map_fields = [
            'product_line_id', 'model_imperial', 'spec', 'spec_imperial', 'brand', 
            'app_model', 'bag_type', 'material', 'image_url', 'status',
            'package_type', // Added for sales_unit
            // Numerical fields for specs
            'thickness_met', 'thickness_imp', 'width_met', 'width_imp', 
            'length_met', 'length_imp', 'bubble_diameter_met', 'bubble_diameter_imp',
            'total_length_met', 'total_length_imp'
        ];

        // Check for alternative spec value keys from schema like 'thickness_met_val'
        $param_to_db_spec_map = [
            'thickness_met_val' => 'thickness_met',
            'width_met_val' => 'width_met',
            'length_met_val' => 'length_met',
            'total_length_met_val' => 'total_length_met',
            // Add imperial mappings if needed
        ];

        foreach ($param_to_db_spec_map as $param_key => $db_key) {
            if (isset($params[$param_key])) {
                 if (is_numeric($params[$param_key])) {
                    $data[$db_key] = floatval($params[$param_key]);
                } elseif ($is_update && ($params[$param_key] === null || $params[$param_key] === '')) {
                    $data[$db_key] = null;
                }
            }
        }
        
        foreach ($direct_map_fields as $db_column) {
            if (in_array($db_column, $this->fillable_fields) && isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'product_line_id':
                        $data[$db_column] = absint($value);
                        break;
                    case 'thickness_met': case 'thickness_imp':
                    case 'width_met':     case 'width_imp':
                    case 'length_met':    case 'length_imp':
                    case 'bubble_diameter_met': case 'bubble_diameter_imp':
                    case 'total_length_met': case 'total_length_imp':
                        if (is_numeric($value)) {
                            $data[$db_column] = floatval($value); // Or number_format if specific decimal places needed
                        } elseif ($is_update && ($value === null || $value === '')) {
                             $data[$db_column] = null;
                        }
                        break;
                    case 'image_url':
                        $data[$db_column] = esc_url_raw($value);
                        break;
                    default: // For text fields like model_imperial, spec, brand, app_model, bag_type, material, status, package_type
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            } elseif ($is_update && array_key_exists($db_column, $params) && $params[$db_column] === null) {
                 // Allow explicit nulls on update for nullable fields (ensure DB column allows NULL)
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

        $consumable_id = (int) $item_db_object->id;
        $product_line_id_for_join = isset($item_db_object->product_line_id) ? (int) $item_db_object->product_line_id : 0;

        // TEMPORARY DEBUGGING
        error_log("[BJT_DEBUG] format_item_for_response for Consumable ID: " . $consumable_id . ", PL_ID: " . $product_line_id_for_join);

        // --- Fetch Pricing --- 
        $pricing_table = $wpdb->prefix . 'bjt_prices';
        $raw_prices = $wpdb->get_results($wpdb->prepare(
            "SELECT region, currency, base_price, min_quantity, max_quantity 
             FROM {$pricing_table} 
             WHERE target_type = 'consumable' AND part_number = %s AND product_line_id = %d AND status = 'active' 
             ORDER BY min_quantity ASC, region ASC",
            $item_db_object->part_number,
            $product_line_id_for_join
        ));

        // TEMPORARY DEBUGGING
        error_log("[BJT_DEBUG] Raw prices count for Consumable ID " . $consumable_id . ": " . count($raw_prices));

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
                    $range_str .= '+'; // Or '>' as per frontend example e.g. '>10'
                                       // The frontend code parses for '-' or '>' so '11+' should be fine if min_quantity is 11
                                       // Let's use min_quantity for single quantity tier if max is not set or equal to min
                                       // For now: min-max or min+
                     if($tier_data['min_quantity'] > 1 && $tier_data['max_quantity'] === null ) $range_str = '>' . ($tier_data['min_quantity'] -1) ;
                     else if ($tier_data['max_quantity'] === null) $range_str = (string)$tier_data['min_quantity']; // single item tier if no max_quantity
                     else $range_str = (string)$tier_data['min_quantity'];

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
             WHERE target_type = 'consumable' AND part_number = %s AND product_line_id = %d AND status = 'active' 
             GROUP BY region", // Restored GROUP BY and SUM, status back to 'active'
            $item_db_object->part_number,
            $product_line_id_for_join
        ));
        
        // TEMPORARY DEBUGGING
        error_log("[BJT_DEBUG] Raw inventory count for Consumable ID " . $consumable_id . ": " . count($raw_inventory));

        $inventory_map = new stdClass(); // Restored to original logic
        if (!empty($raw_inventory)) {
            foreach ($raw_inventory as $inv_row) {
                $inventory_map->{strtoupper($inv_row->region)} = (int)$inv_row->total_quantity; // Restored
            }
        }

        $response_data = [
            'id' => $consumable_id,
            'product_line_id' => $product_line_id_for_join === 0 ? null : $product_line_id_for_join,
            'code' => $item_db_object->part_number ?? null, 
            'name' => $item_db_object->model ?? null,       
            'model' => $item_db_object->model ?? null,      
            'model_imperial' => $item_db_object->model_imperial ?? null,
            'brand' => $item_db_object->brand ?? null,
            'sales_unit' => $item_db_object->package_type ?? null, 
            'image_url' => $item_db_object->image_url ?? null,
            'status' => $item_db_object->status ?? 'draft',
            'specs' => [
                'material' => $item_db_object->material ?? null,
                'shape' => $item_db_object->bag_type ?? null, 
                'thickness' => isset($item_db_object->thickness_met) ? $item_db_object->thickness_met . ' um' : null,
                'width' => isset($item_db_object->width_met) ? $item_db_object->width_met . ' mm' : null, 
                'length' => isset($item_db_object->length_met) ? $item_db_object->length_met . ' m' : null, 
                'rollLength' => isset($item_db_object->total_length_met) ? $item_db_object->total_length_met . ' m' : null,
                'compatibility' => $item_db_object->app_model ?? null, 
            ],
            'pricing' => $pricing_tiers,
            'inventory' => $inventory_map, // Restored
            'created_at' => $item_db_object->created_at ?? null,
            'updated_at' => $item_db_object->updated_at ?? null,
        ];
        
        return $response_data;
    }

    // --- CRUD Methods ---

    public function create_item($request) {
        global $wpdb;
        $params = $request->get_params();

        // Validate based on API field names ('code', 'name')
        if (empty($params['product_line_id'])) {
            return $this->error_response("Missing required field for consumable: product_line_id", 'missing_api_field', 400);
        }
        if (empty($params['code'])) { // API 'code' is required
            return $this->error_response("Missing required field for consumable: code (part_number)", 'missing_api_field', 400);
        }
        if (empty($params['name']) && empty($params['model'])) { // API 'name' (or 'model') is required, maps to DB 'model'
            return $this->error_response("Missing required field for consumable: name (model)", 'missing_api_field', 400);
        }


        $data_to_insert = $this->map_request_to_db($request);

        // Default status if not provided and status is a fillable field
        if (empty($data_to_insert['status']) && in_array('status', $this->fillable_fields)) {
            $data_to_insert['status'] = 'publish';
        }
        
        $current_time_gmt = current_time('mysql', 1);
        if (!isset($data_to_insert['created_at'])) { // Only set if not already mapped (e.g. import)
           $data_to_insert['created_at'] = $current_time_gmt;
        }
        if (!isset($data_to_insert['updated_at'])) {
           $data_to_insert['updated_at'] = $current_time_gmt;
        }


        // Check for duplicate part_number for the same product_line_id
        if (empty($data_to_insert['part_number'])) {
             return $this->error_response('Part number (code) is a required field.', 'missing_part_number', 400);
        }
        if(empty($data_to_insert['model'])) {
            return $this->error_response('Model (name) is a required field.', 'missing_model', 400);
        }


        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d",
            $data_to_insert['part_number'],
            $data_to_insert['product_line_id']
        ));
        if ($existing_item) {
            return $this->error_response('Consumable with this part_number (code) already exists for this product line.', 'duplicate_part_number', 409);
        }
        
        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log($this->resource_name . ' DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create consumable. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created consumable.', 'retrieve_error', 500);
        }
        
        $formatted_item = $this->format_item_for_response($created_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Consumable created successfully.', 'data' => $formatted_item], 201);
    }

    public function get_item($request) {
        $item_id = (int) $request['id'];
        // error_log("[BJT_DEBUG] Consumable_Controller->get_item: Received ID: " . $item_id);

        if ($item_id <= 0) {
            // error_log("[BJT_DEBUG] Consumable_Controller->get_item: Invalid ID provided: " . $item_id);
            return new WP_Error('rest_invalid_id', __('Invalid item ID.'), array('status' => 400));
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_consumables';
        // error_log("[BJT_DEBUG] Consumable_Controller->get_item: Querying table: " . $table_name . " for ID: " . $item_id);

        // Fetch as an object so format_item_for_response can access properties like ->id
        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $item_id), OBJECT);

        if (!$item_db) {
            // error_log("[BJT_DEBUG] Consumable_Controller->get_item: No item found for ID: " . $item_id);
            return new WP_Error('rest_not_found', __('Item not found.'), array('status' => 404));
        }
        
        // error_log("[BJT_DEBUG] Consumable_Controller->get_item: Raw item_db for ID " . $item_id . ": " . print_r($item_db, true));

        // Ensure the consumable item exists.
        if ( ! $item_db ) {
            // error_log("[BJT_DEBUG] Consumable_Controller->get_item: Item not found after initial fetch for ID: " . $item_id);
            return new WP_Error( 'rest_not_found', __( 'Consumable not found.', 'bjt' ), array( 'status' => 404 ) );
        }

        error_log("[BJT_DEBUG] Consumable_Controller->get_item: Calling format_item_for_response for ID " . $item_id);
        // Format the item for the response, including pricing and inventory.
        $formatted_item = $this->format_item_for_response( $item_db, $request );
        error_log("[BJT_DEBUG] Consumable_Controller->get_item: Formatted item for ID " . $item_id . ": " . print_r($formatted_item, true));

        // Create the response object.
        $response = new WP_REST_Response(['success' => true, 'data' => $formatted_item], 200);
        
        if (is_wp_error($response)) {
            error_log("[BJT_DEBUG] Consumable_Controller->get_item: WP_Error after rest_ensure_response for ID " . $item_id . ": " . $response->get_error_message());
        }
        
        error_log("[BJT_DEBUG] Consumable_Controller->get_item: Final response for ID " . $item_id . ": " . print_r($response, true));
        return $response;
    }

    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid consumable ID.', 'invalid_id', 400);
        }

        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Consumable with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true /* is_update */);

        if (empty($data_to_update)) {
            $params = $request->get_params();
            $sent_fields = array_intersect_key($params, array_flip($this->fillable_fields));
             // Also check mapped fields like 'code' to 'part_number'
            if (isset($params['code'])) $sent_fields['code'] = true;
            if (isset($params['name'])) $sent_fields['name'] = true;

            if(empty($sent_fields)){
                 return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
            }
            // If fields were sent but resulted in empty $data_to_update, assume no actual change needed
            // or validation errors prevented mapping, which should ideally be caught earlier.
            // For now, proceed to fetch and return current item if $data_to_update is empty but fields were sent.
        }
        
        // Check for duplicate part_number if part_number is being changed
        $product_line_id_for_check = $existing_item_db->product_line_id;
        if (isset($data_to_update['product_line_id'])) {
            $product_line_id_for_check = $data_to_update['product_line_id'];
        }

        if (isset($data_to_update['part_number']) && $data_to_update['part_number'] !== $existing_item_db->part_number) {
            $item_with_new_part_number = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d AND id != %d",
                $data_to_update['part_number'],
                $product_line_id_for_check,
                $id
            ));
            if ($item_with_new_part_number) {
                return $this->error_response('Another consumable with this part_number (code) already exists for this product line.', 'duplicate_part_number_on_update', 409);
            }
        }
        
        if (!empty($data_to_update)) {
            $data_to_update['updated_at'] = current_time('mysql', 1);
            $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));

            if ($result === false) {
                error_log($this->resource_name . ' DB Update Error: ' . $wpdb->last_error);
                return $this->error_response('Failed to update consumable. DB Error: ' . $wpdb->last_error, 'db_error', 500);
            }
        }
        
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve consumable after update.', 'retrieve_after_update_error', 500);
        }

        $formatted_item = $this->format_item_for_response($updated_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Consumable updated successfully.', 'data' => $formatted_item], 200);
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid consumable ID.', 'invalid_id', 400);
        }

        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return $this->error_response("Consumable with ID {$id} not found to delete.", 'not_found', 404);
        }

        $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));

        if ($result === false) {
            error_log($this->resource_name . ' DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete consumable. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        if ($result === 0) { // Should not happen if item_exists check passed, but good for robustness
            return $this->error_response("Consumable with ID {$id} could not be deleted (it may have been deleted by another process).", 'delete_failed_not_found', 404);
        }

        return new WP_REST_Response(['success' => true, 'message' => "Consumable with ID {$id} deleted successfully."], 200);
    }

    public function get_items($request) {
        global $wpdb;

        // Note: This method will become more complex if we fetch all pricing/inventory 
        // for all items in the list in an optimized way (e.g. one query for all prices).
        // For now, format_item_for_response will do N+1 queries for price/inventory per item.
        // This is acceptable for moderate list sizes but can be optimized later.

        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 10; // Default to 10 as per frontend
        $offset = ($page - 1) * $per_page;

        $base_query = "FROM {$this->table_name}";
        $where_clauses = array("1=1"); // Start with a true condition

        // Search (maps to API 'search' param)
        $search = $request->get_param('search');
        if (!empty($search)) {
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            // Search in part_number (API code), model (API name/model), brand, app_model
            $search_fields = ['part_number', 'model', 'brand', 'app_model', 'material', 'bag_type'];
            $search_conditions = [];
            foreach($search_fields as $field) {
                $search_conditions[] = $wpdb->prepare("{$field} LIKE %s", $search_term);
            }
            if (!empty($search_conditions)) {
                 $where_clauses[] = "(" . implode(" OR ", $search_conditions) . ")";
            }
        }
        
        // Status filter
        $status = $request->get_param('status');
        if (!empty($status) && in_array($status, ['publish', 'draft', 'trash'])) {
            $where_clauses[] = $wpdb->prepare("status = %s", $status);
        }

        // Filter by product_line_id
        $product_line_id = $request->get_param('product_line_id');
        if (!empty($product_line_id) && is_numeric($product_line_id)) {
            $where_clauses[] = $wpdb->prepare("product_line_id = %d", absint($product_line_id));
        }
        
        // Frontend specific filters (map to DB columns)
        // Model (maps to DB 'app_model' or 'model' depending on frontend intent)
        // For now, let's assume frontend 'model' filter maps to DB 'app_model' (compatible host machines)
        $filter_model = $request->get_param('model'); // machine model filter from frontend
        if (!empty($filter_model) && $filter_model !== 'all') {
             $where_clauses[] = $wpdb->prepare("app_model LIKE %s", '%' . $wpdb->esc_like($filter_model) . '%');
        }
        $filter_shape = $request->get_param('shape'); // maps to 'bag_type'
        if (!empty($filter_shape) && $filter_shape !== 'all') {
             $where_clauses[] = $wpdb->prepare("bag_type = %s", $filter_shape);
        }
        $filter_material = $request->get_param('material');
        if (!empty($filter_material) && $filter_material !== 'all') {
             $where_clauses[] = $wpdb->prepare("material = %s", $filter_material);
        }
        // Thickness, Weight, Width, Length filters are more complex as they might be ranges or specific values
        // and need to map to thickness_met, width_met, length_met.
        // For Iteration 1, we'll keep these simple or omit until frontend request format is clearer.
        // Example for thickness (exact match on thickness_met for now if param is numeric)
        $filter_thickness = $request->get_param('thickness');
        if (!empty($filter_thickness) && is_numeric($filter_thickness)) {
            $where_clauses[] = $wpdb->prepare("thickness_met = %f", floatval($filter_thickness));
        }
        $filter_width = $request->get_param('width');
        if (!empty($filter_width) && is_numeric($filter_width)) {
            $where_clauses[] = $wpdb->prepare("width_met = %f", floatval($filter_width));
        }
        $filter_length = $request->get_param('length');
        if (!empty($filter_length) && is_numeric($filter_length)) {
            $where_clauses[] = $wpdb->prepare("length_met = %f", floatval($filter_length));
        }
        // Note: 'weight' filter from frontend not directly mapped yet.

        $where_sql = implode(" AND ", $where_clauses);

        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        $total_items = $wpdb->get_var($total_items_query);

        $items_query = "SELECT * {$base_query} WHERE {$where_sql} ORDER BY id DESC LIMIT %d OFFSET %d";
        $items_db = $wpdb->get_results($wpdb->prepare($items_query, $per_page, $offset));

        $formatted_items = array_map(array($this, 'format_item_for_response'), $items_db);
        
        // The frontend expects a specific structure for the list response
        $list_response_data = [
            'items' => $formatted_items,
            'total' => (int) $total_items,
            'total_pages' => ceil($total_items / $per_page),
            'current_page' => (int) $page,
        ];
        
        $response = new WP_REST_Response(['success' => true, 'data' => $list_response_data], 200);
        
        // WordPress REST API typically adds these headers, but BJT_API_Controller might not if not extending WP_REST_Controller fully.
        // For custom controller, we might need to add them if client relies on them.
        // $response->header('X-WP-Total', $total_items);
        // $response->header('X-WP-TotalPages', $total_pages);
        // Link headers also might be needed if client uses them for pagination.

        return $response;
    }

    /**
     * Format a successful response with the standard structure
     */
    protected function format_response($data = null, $message = '', $success = true, $code = 200) {
        $response = [
            'success' => $success
        ];
        
        if (!empty($data)) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        return new WP_REST_Response($response, $code);
    }
    
    /**
     * Format an error response
     */
    protected function error_response($message, $code = 'bjt_api_error', $status = 400, $data = null) {
        return new WP_Error(
            $code,
            $message,
            [
                'status' => $status,
                'data' => $data
            ]
        );
    }

    /**
     * 批量获取耗材价格
     *
     * @param WP_REST_Request $request 请求对象，包含耗材IDs、区域和数量
     * @return WP_REST_Response 耗材价格响应
     */
    public function batch_get_prices($request) {
        global $wpdb;
        $prices_table = $wpdb->prefix . 'bjt_prices';
        $consumables_table = $this->table_name;
        
        // 获取请求参数
        $params = $request->get_json_params();
        if (null === $params) {
            $params = $request->get_body_params();
        }
        
        // Support both formats: items array (new format) or ids array (old format)
        $ids = [];
        $region = $params['region'] ?? $request->get_param('region') ?? 'CN';
        $quantity = (int)($params['quantity'] ?? $request->get_param('quantity') ?? 1);
        
        // Check for items array (new format)
        if (isset($params['items']) && is_array($params['items'])) {
            foreach ($params['items'] as $item) {
                if (isset($item['item_id'])) {
                    $ids[] = intval($item['item_id']);
                }
            }
        } 
        // Fallback to ids array (old format)
        else {
            $ids = $request->get_param('ids');
        }
        
        // 验证IDs参数
        if (empty($ids) || !is_array($ids)) {
            return $this->error_response('无效的IDs参数，必须提供耗材ID数组', 'invalid_ids', 400);
        }
        
        // 安全处理ID数组
        $ids = array_map('intval', $ids);
        $ids_str = implode(',', $ids);
        
        // 查询耗材基本信息
        $consumables = $wpdb->get_results(
            "SELECT id, product_line_id, part_number, model 
             FROM {$consumables_table} 
             WHERE id IN ({$ids_str}) AND status = 'publish'"
        );
        
        if (!$consumables) {
            return $this->error_response('未找到有效的耗材', 'consumables_not_found', 404);
        }
        
        $response_data = [];
        
        foreach ($consumables as $consumable) {
            $consumable_id = (int)$consumable->id;
            $product_line_id = (int)$consumable->product_line_id;
            
            // 查询适用于指定数量的价格
            $price_data = $wpdb->get_row($wpdb->prepare(
                "SELECT base_price, currency, discount_rate 
                 FROM {$prices_table} 
                 WHERE target_type = 'consumable' 
                 AND target_id = %d 
                 AND product_line_id = %d 
                 AND region = %s 
                 AND min_quantity <= %d 
                 AND (max_quantity IS NULL OR max_quantity >= %d) 
                 AND status = 'active' 
                 ORDER BY min_quantity DESC 
                 LIMIT 1",
                $consumable_id,
                $product_line_id,
                $region,
                $quantity,
                $quantity
            ));
            
            $price_info = [
                'id' => $consumable_id,
                'part_number' => $consumable->part_number,
                'model' => $consumable->model,
                'found' => false,
                'price' => null,
                'currency' => null,
                'discount_rate' => null,
                'final_price' => null
            ];
            
            if ($price_data) {
                $base_price = (float)$price_data->base_price;
                $discount_rate = $price_data->discount_rate ? (float)$price_data->discount_rate : null;
                
                $price_info['found'] = true;
                $price_info['price'] = $base_price;
                $price_info['currency'] = $price_data->currency;
                $price_info['discount_rate'] = $discount_rate;
                
                // 计算最终价格（应用折扣）
                $final_price = $discount_rate ? $base_price * (1 - $discount_rate) : $base_price;
                $price_info['final_price'] = $final_price;
            }
            
            $response_data[] = $price_info;
        }
        
        return $this->format_response([
            'region' => $region,
            'quantity' => $quantity,
            'items' => $response_data
        ]);
    }

    /**
     * 批量获取耗材库存
     *
     * @param WP_REST_Request $request 请求对象，包含耗材IDs、区域和仓库
     * @return WP_REST_Response 耗材库存响应
     */
    public function batch_get_inventory($request) {
        global $wpdb;
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
        $consumables_table = $this->table_name;
        
        // 获取请求参数
        $params = $request->get_json_params();
        if (null === $params) {
            $params = $request->get_body_params();
        }
        
        // Support both formats: items array (new format) or ids array (old format)
        $ids = [];
        $region = $params['region'] ?? $request->get_param('region');
        $warehouse = $params['warehouse'] ?? $request->get_param('warehouse');
        
        // Check for items array (new format)
        if (isset($params['items']) && is_array($params['items'])) {
            foreach ($params['items'] as $item) {
                if (isset($item['item_id'])) {
                    $ids[] = intval($item['item_id']);
                }
            }
        } 
        // Fallback to ids array (old format)
        else {
            $ids = $request->get_param('ids');
        }
        
        // 验证IDs参数
        if (empty($ids) || !is_array($ids)) {
            return $this->error_response('无效的IDs参数，必须提供耗材ID数组', 'invalid_ids', 400);
        }
        
        // 安全处理ID数组
        $ids = array_map('intval', $ids);
        $ids_str = implode(',', $ids);
        
        // 查询耗材基本信息
        $consumables = $wpdb->get_results(
            "SELECT id, product_line_id, part_number, model 
             FROM {$consumables_table} 
             WHERE id IN ({$ids_str}) AND status = 'publish'"
        );
        
        if (!$consumables) {
            return $this->error_response('未找到有效的耗材', 'consumables_not_found', 404);
        }
        
        $response_data = [];
        
        foreach ($consumables as $consumable) {
            $consumable_id = (int)$consumable->id;
            $product_line_id = (int)$consumable->product_line_id;
            
            // 构建库存查询SQL
            $inventory_sql = "SELECT region, warehouse, quantity, reserved 
                              FROM {$inventory_table} 
                              WHERE target_type = 'consumable' 
                              AND target_id = %d 
                              AND product_line_id = %d";
            
            $sql_params = [$consumable_id, $product_line_id];
            
            // 添加区域过滤条件
            if (!empty($region)) {
                $inventory_sql .= " AND region = %s";
                $sql_params[] = $region;
            }
            
            // 添加仓库过滤条件
            if (!empty($warehouse)) {
                $inventory_sql .= " AND warehouse = %s";
                $sql_params[] = $warehouse;
            }
            
            $inventory_sql .= " AND status = 'active'";
            
            // 执行库存查询
            $inventory_data = $wpdb->get_results($wpdb->prepare($inventory_sql, $sql_params));
            
            $formatted_inventory = [];
            $total_quantity = 0;
            $total_available = 0;
            
            // 格式化库存数据
            foreach ($inventory_data as $inventory) {
                $quantity = (int)$inventory->quantity;
                $reserved = (int)$inventory->reserved;
                $available = $quantity - $reserved;
                
                $total_quantity += $quantity;
                $total_available += $available;
                
                $formatted_inventory[] = [
                    'region' => $inventory->region,
                    'warehouse' => $inventory->warehouse,
                    'quantity' => $quantity,
                    'reserved' => $reserved,
                    'available' => $available
                ];
            }
            
            $response_data[] = [
                'id' => $consumable_id,
                'part_number' => $consumable->part_number,
                'model' => $consumable->model,
                'found' => !empty($formatted_inventory),
                'total_quantity' => $total_quantity,
                'total_available' => $total_available,
                'inventory' => $formatted_inventory
            ];
        }
        
        return $this->format_response([
            'items' => $response_data
        ]);
    }

    /**
     * 检查耗材与机器的兼容性
     *
     * @param WP_REST_Request $request 请求对象，包含耗材ID和机器型号
     * @return WP_REST_Response|WP_Error 兼容性检查结果
     */
    public function check_compatibility($request) {
        global $wpdb;
        
        $consumable_id = (int)$request->get_param('id');
        $machine_model = sanitize_text_field($request->get_param('model'));
        
        if (empty($machine_model)) {
            return $this->error_response('必须提供要检查兼容性的机器型号', 'missing_model', 400);
        }
        
        // 检查耗材是否存在
        $consumable = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d AND status = 'publish'",
            $consumable_id
        ));
        
        if (!$consumable) {
            return $this->error_response('未找到指定的耗材', 'consumable_not_found', 404);
        }
        
        // 检查兼容性（直接从app_model字段获取）
        $is_compatible = false;
        
        if (!empty($consumable->app_model)) {
            // 兼容性字段可能是逗号分隔的型号列表
            $compatible_models = explode(',', $consumable->app_model);
            $compatible_models = array_map('trim', $compatible_models);
            
            $is_compatible = in_array($machine_model, $compatible_models);
        }
        
        // 返回兼容性结果
        return $this->format_response([
            'consumable_id' => $consumable_id,
            'machine_model' => $machine_model,
            'compatible' => $is_compatible,
            'message' => $is_compatible ? '完全兼容' : '不兼容或未知兼容性'
        ]);
    }
} 