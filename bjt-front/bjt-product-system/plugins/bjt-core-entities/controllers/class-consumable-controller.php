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
        'status',
        // 🔥 新增：包装信息字段 (Packaging Information)
        'package_size_cm',
        'package_size_inch', 
        'net_weight_kg',
        'net_weight_lbs',
        'gross_weight_kg',
        'gross_weight_lbs',
        'pcs_per_box',
        'package_image_url',
        // 🔥 新增：托盘信息字段 (Pallet Information)
        'pallet_size_cm',
        'pallet_size_inch',
        'pcs_per_pallet_a',
        'pallet_gross_weight_a_kg',
        'pallet_gross_weight_a_lbs',
        'pallet_height_a_cm',
        'pallet_height_a_inch',
        'pcs_per_pallet_b',
        'pallet_gross_weight_b_kg',
        'pallet_gross_weight_b_lbs',
        'pallet_height_b_cm',
        'pallet_height_b_inch',
        'pcs_per_pallet_c',
        'pallet_gross_weight_c_kg',
        'pallet_gross_weight_c_lbs',
        'pallet_height_c_cm',
        'pallet_height_c_inch',
        // 🔥 新增：管径信息字段 (Tube Diameter)
        'tube_inner_diameter_cm',
        'tube_inner_diameter_inch',
        // 🔥 新增：单位字段 (Unit)
        'unit',
        // 🆕 名称字段（中英）
        'name_zh',
        'name_en'
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
                'permission_callback' => [$this, 'check_delete_permission'],
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

        // === 新增：耗材筛选选项API ===
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
                    ],
                    'product_line_id' => [
                        'type' => 'integer',
                        'description' => '产品线ID'
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
                'name_zh' => ['type' => 'string', 'description' => 'Chinese display name of the consumable.'],
                'name_en' => ['type' => 'string', 'description' => 'English display name of the consumable.'],
            ],
        ];
         // Required fields for CREATABLE are enforced by create_item method based on $required_api_fields_for_create
        return $schema;
    }

    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];
        
        // 🔥 添加调试日志
        if ($is_update) {
            error_log('[BJT_Consumable] Update operation - received params count: ' . count($params));
            error_log('[BJT_Consumable] Packaging/Pallet fields in request: ' . json_encode([
                'package_type' => isset($params['package_type']) ? $params['package_type'] : 'NOT_SET',
                'package_size_cm' => isset($params['package_size_cm']) ? $params['package_size_cm'] : 'NOT_SET',
                'net_weight_kg' => isset($params['net_weight_kg']) ? $params['net_weight_kg'] : 'NOT_SET',
                'pallet_size_cm' => isset($params['pallet_size_cm']) ? $params['pallet_size_cm'] : 'NOT_SET',
                'pcs_per_pallet_a' => isset($params['pcs_per_pallet_a']) ? $params['pcs_per_pallet_a'] : 'NOT_SET',
            ]));
        }
        
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
            'total_length_met', 'total_length_imp',
            // 🔥 新增：包装信息字段 (Packaging Information)
            'package_size_cm', 'package_size_inch', 'package_image_url',
            'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs', 'pcs_per_box',
            // 🔥 新增：托盘信息字段 (Pallet Information)  
            'pallet_size_cm', 'pallet_size_inch',
            'pcs_per_pallet_a', 'pallet_gross_weight_a_kg', 'pallet_gross_weight_a_lbs',
            'pallet_height_a_cm', 'pallet_height_a_inch',
            'pcs_per_pallet_b', 'pallet_gross_weight_b_kg', 'pallet_gross_weight_b_lbs',
            'pallet_height_b_cm', 'pallet_height_b_inch',
            'pcs_per_pallet_c', 'pallet_gross_weight_c_kg', 'pallet_gross_weight_c_lbs',
            'pallet_height_c_cm', 'pallet_height_c_inch',
            // 🔥 新增：数值型管径字段 (Numeric Tube Fields)
            'tube_inner_diameter_cm', 'tube_inner_diameter_inch',
            // 🔥 新增：单位字段 (Unit)
            'unit',
            // 🆕 名称字段（中英）
            'name_zh', 'name_en'
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
                    // 🔥 新增：数值型包装字段 (Numeric Packaging Fields)
                    case 'net_weight_kg': case 'net_weight_lbs':
                    case 'gross_weight_kg': case 'gross_weight_lbs':
                    case 'pcs_per_box':
                    // 🔥 新增：数值型托盘字段 (Numeric Pallet Fields)
                    case 'pcs_per_pallet_a': case 'pallet_gross_weight_a_kg': case 'pallet_gross_weight_a_lbs':
                    case 'pallet_height_a_cm': case 'pallet_height_a_inch':
                    case 'pcs_per_pallet_b': case 'pallet_gross_weight_b_kg': case 'pallet_gross_weight_b_lbs':
                    case 'pallet_height_b_cm': case 'pallet_height_b_inch':
                    case 'pcs_per_pallet_c': case 'pallet_gross_weight_c_kg': case 'pallet_gross_weight_c_lbs':
                    case 'pallet_height_c_cm': case 'pallet_height_c_inch':
                    // 🔥 新增：数值型管径字段 (Numeric Tube Fields)
                    case 'tube_inner_diameter_cm': case 'tube_inner_diameter_inch':
                        // 🔥 修复：正确处理数字字段，允许0值，跳过undefined值
                        if (is_numeric($value)) {
                            $data[$db_column] = floatval($value);
                        } elseif ($is_update && ($value === null || $value === '')) {
                            // 只有在明确传递null或空字符串时才设置为null
                            $data[$db_column] = null;
                        }
                        // 🔥 修复：如果值是undefined或其他非数字类型，不进行任何更新（保持原值）
                        break;
                    case 'image_url':
                    case 'package_image_url': // 🔥 新增：包装图片URL
                        $data[$db_column] = esc_url_raw($value);
                        break;
                    default: // For text fields like model_imperial, spec, brand, app_model, bag_type, material, status, package_type, unit, package_size_cm, package_size_inch, pallet_size_cm, pallet_size_inch
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            } elseif ($is_update && array_key_exists($db_column, $params) && $params[$db_column] === null) {
                 // Allow explicit nulls on update for nullable fields (ensure DB column allows NULL)
                 $data[$db_column] = null;
            }
        }
        
        // 🔥 添加详细的调试日志，特别关注包装和托盘字段
        if ($is_update) {
            error_log('[BJT_Consumable] Final data to update: ' . json_encode([
                'total_fields' => count($data),
                'packaging_fields' => [
                    'package_type' => isset($data['package_type']) ? $data['package_type'] : 'NOT_IN_UPDATE',
                    'package_size_cm' => isset($data['package_size_cm']) ? $data['package_size_cm'] : 'NOT_IN_UPDATE',
                    'package_size_inch' => isset($data['package_size_inch']) ? $data['package_size_inch'] : 'NOT_IN_UPDATE',
                    'net_weight_kg' => isset($data['net_weight_kg']) ? $data['net_weight_kg'] : 'NOT_IN_UPDATE',
                    'net_weight_lbs' => isset($data['net_weight_lbs']) ? $data['net_weight_lbs'] : 'NOT_IN_UPDATE',
                    'gross_weight_kg' => isset($data['gross_weight_kg']) ? $data['gross_weight_kg'] : 'NOT_IN_UPDATE',
                    'gross_weight_lbs' => isset($data['gross_weight_lbs']) ? $data['gross_weight_lbs'] : 'NOT_IN_UPDATE',
                    'pcs_per_box' => isset($data['pcs_per_box']) ? $data['pcs_per_box'] : 'NOT_IN_UPDATE',
                ],
                'pallet_fields' => [
                    'pallet_size_cm' => isset($data['pallet_size_cm']) ? $data['pallet_size_cm'] : 'NOT_IN_UPDATE',
                    'pallet_size_inch' => isset($data['pallet_size_inch']) ? $data['pallet_size_inch'] : 'NOT_IN_UPDATE',
                    'pcs_per_pallet_a' => isset($data['pcs_per_pallet_a']) ? $data['pcs_per_pallet_a'] : 'NOT_IN_UPDATE',
                    'pallet_gross_weight_a_kg' => isset($data['pallet_gross_weight_a_kg']) ? $data['pallet_gross_weight_a_kg'] : 'NOT_IN_UPDATE',
                    'pallet_gross_weight_a_lbs' => isset($data['pallet_gross_weight_a_lbs']) ? $data['pallet_gross_weight_a_lbs'] : 'NOT_IN_UPDATE',
                    'pallet_height_a_cm' => isset($data['pallet_height_a_cm']) ? $data['pallet_height_a_cm'] : 'NOT_IN_UPDATE',
                    'pallet_height_a_inch' => isset($data['pallet_height_a_inch']) ? $data['pallet_height_a_inch'] : 'NOT_IN_UPDATE',
                ]
            ]));
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
                $range_str .= '+';
                 if($tier_data['min_quantity'] > 1 && $tier_data['max_quantity'] === null ) $range_str = '>' . ($tier_data['min_quantity'] -1) ;
                 else if ($tier_data['max_quantity'] === null) $range_str = (string)$tier_data['min_quantity'];
                 else $range_str = (string)$tier_data['min_quantity'];

            } else if ($tier_data['max_quantity'] == $tier_data['min_quantity']) {
                $range_str = (string)$tier_data['min_quantity'];
            } else {
                $range_str .= '-' . $tier_data['max_quantity'];
            }
            
            $regional_prices_map = [];
            $default_region_price = 0.00;

            foreach ($tier_data['regional_prices_raw'] as $rp_row) {
                $region_code_lower = strtolower($rp_row->region);
                $regional_prices_map[$region_code_lower] = (float)$rp_row->base_price;
                if (strtoupper($rp_row->region) === 'CN') {
                    $default_region_price = (float)$rp_row->base_price;
                }
            }
            if ($default_region_price == 0.00 && !empty($regional_prices_map)) {
                $default_region_price = reset($regional_prices_map); 
            }

            $pricing_tiers[] = [
                'range' => $range_str,
                'price' => $default_region_price,
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
         GROUP BY region",
        $item_db_object->part_number,
        $product_line_id_for_join
    ));
    
    // TEMPORARY DEBUGGING
    error_log("[BJT_DEBUG] Raw inventory count for Consumable ID " . $consumable_id . ": " . count($raw_inventory));

    $inventory_map = new stdClass();
    if (!empty($raw_inventory)) {
        foreach ($raw_inventory as $inv_row) {
            $inventory_map->{strtoupper($inv_row->region)} = (int)$inv_row->total_quantity;
        }
    }

    $response_data = [
        'id' => $consumable_id,
        'product_line_id' => $product_line_id_for_join === 0 ? null : $product_line_id_for_join,
        
        // === 向后兼容字段（保持现有逻辑） ===
        'code' => $item_db_object->part_number ?? null, 
        'name' => $item_db_object->model ?? null,       
        'model' => $item_db_object->model ?? null,      
        // 🆕 统一名称字段，提供中文/英文名称（若不存在则回落到模型或代码）
        'name_zh' => !empty($item_db_object->name_zh) ? $item_db_object->name_zh : (!empty($item_db_object->title_zh) ? $item_db_object->title_zh : (!empty($item_db_object->model) ? $item_db_object->model : ($item_db_object->part_number ?? null))),
        'name_en' => !empty($item_db_object->name_en) ? $item_db_object->name_en : (!empty($item_db_object->title_en) ? $item_db_object->title_en : ($item_db_object->part_number ?? null)),
        'model_imperial' => $item_db_object->model_imperial ?? null,
        'brand' => $item_db_object->brand ?? null,
        'sales_unit' => $item_db_object->package_type ?? null, 
        'image_url' => $item_db_object->image_url ?? null,
        'status' => $item_db_object->status ?? 'draft',
        
        // === 新增：前端期望的直接字段映射 ===
        // 筛选功能关键字段
        'part_number' => $item_db_object->part_number ?? null,
        'app_model' => $item_db_object->app_model ?? null,
        'shape' => $item_db_object->bag_type ?? null,  // 关键映射！
        'bag_type' => $item_db_object->bag_type ?? null,  // 前端service层期待的字段！
        'material' => $item_db_object->material ?? null,
        
        // 规格数值字段（纯数值，不加单位）
        'thickness_met' => $item_db_object->thickness_met ?? null,
        'thickness_imp' => $item_db_object->thickness_imp ?? null,
        'width_met' => $item_db_object->width_met ?? null,
        'width_imp' => $item_db_object->width_imp ?? null,
        'length_met' => $item_db_object->length_met ?? null,
        'length_imp' => $item_db_object->length_imp ?? null,
        
        // 列表展示字段
        'bubble_diameter_met' => $item_db_object->bubble_diameter_met ?? null,
        'bubble_diameter_imp' => $item_db_object->bubble_diameter_imp ?? null,
        'pcs_per_box' => $item_db_object->pcs_per_box ?? null,
        'spec' => $item_db_object->spec ?? null,
        'spec_imperial' => $item_db_object->spec_imperial ?? null,
        
        // 详细信息字段
        'package_type' => $item_db_object->package_type ?? null,
        'package_size_cm' => $item_db_object->package_size_cm ?? null,
        'package_size_inch' => $item_db_object->package_size_inch ?? null,
        'net_weight_kg' => $item_db_object->net_weight_kg ?? null,
        'net_weight_lbs' => $item_db_object->net_weight_lbs ?? null,
        'gross_weight_kg' => $item_db_object->gross_weight_kg ?? null,
        'gross_weight_lbs' => $item_db_object->gross_weight_lbs ?? null,
        'package_image_url' => $item_db_object->package_image_url ?? null,
        'total_length_met' => $item_db_object->total_length_met ?? null,
        'total_length_imp' => $item_db_object->total_length_imp ?? null,
        
        // 托盘信息字段
        'pallet_size_cm' => $item_db_object->pallet_size_cm ?? null,
        'pallet_size_inch' => $item_db_object->pallet_size_inch ?? null,
        
        // A方案托盘字段
        'pcs_per_pallet_a' => $item_db_object->pcs_per_pallet_a ?? null,
        'pallet_gross_weight_a_kg' => $item_db_object->pallet_gross_weight_a_kg ?? null,
        'pallet_gross_weight_a_lbs' => $item_db_object->pallet_gross_weight_a_lbs ?? null,
        'pallet_height_a_cm' => $item_db_object->pallet_height_a_cm ?? null,
        'pallet_height_a_inch' => $item_db_object->pallet_height_a_inch ?? null,
        
        // B方案托盘字段
        'pcs_per_pallet_b' => $item_db_object->pcs_per_pallet_b ?? null,
        'pallet_gross_weight_b_kg' => $item_db_object->pallet_gross_weight_b_kg ?? null,
        'pallet_gross_weight_b_lbs' => $item_db_object->pallet_gross_weight_b_lbs ?? null,
        'pallet_height_b_cm' => $item_db_object->pallet_height_b_cm ?? null,
        'pallet_height_b_inch' => $item_db_object->pallet_height_b_inch ?? null,
        
        // C方案托盘字段
        'pcs_per_pallet_c' => $item_db_object->pcs_per_pallet_c ?? null,
        'pallet_gross_weight_c_kg' => $item_db_object->pallet_gross_weight_c_kg ?? null,
        'pallet_gross_weight_c_lbs' => $item_db_object->pallet_gross_weight_c_lbs ?? null,
        'pallet_height_c_cm' => $item_db_object->pallet_height_c_cm ?? null,
        'pallet_height_c_inch' => $item_db_object->pallet_height_c_inch ?? null,
        
        // 纸筒字段
        'tube_inner_diameter_cm' => $item_db_object->tube_inner_diameter_cm ?? null,
        'tube_inner_diameter_inch' => $item_db_object->tube_inner_diameter_inch ?? null,
        
        // 🔥 新增：单位字段
        'unit' => $item_db_object->unit ?? 'roll',
        
        // === 保持现有specs结构（向后兼容） ===
        'specs' => [
            'material' => $item_db_object->material ?? null,
            'shape' => $item_db_object->bag_type ?? null, 
            'thickness' => isset($item_db_object->thickness_met) ? $item_db_object->thickness_met . ' um' : null,
            'width' => isset($item_db_object->width_met) ? $item_db_object->width_met . ' mm' : null, 
            'length' => isset($item_db_object->length_met) ? $item_db_object->length_met . ' m' : null, 
            'rollLength' => isset($item_db_object->total_length_met) ? $item_db_object->total_length_met . ' m' : null,
            'compatibility' => $item_db_object->app_model ?? null, 
            'package_image_url' => $item_db_object->package_image_url ?? null,
        ],
        
        'pricing' => $pricing_tiers,
        'inventory' => $inventory_map,
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

        // 🔥 记录更新前的关键字段值
        $before_update_log = [
            'id' => $id,
            'package_type' => $existing_item_db->package_type ?? 'NULL',
            'package_size_cm' => $existing_item_db->package_size_cm ?? 'NULL',
            'net_weight_kg' => $existing_item_db->net_weight_kg ?? 'NULL',
            'gross_weight_kg' => $existing_item_db->gross_weight_kg ?? 'NULL',
            'pcs_per_box' => $existing_item_db->pcs_per_box ?? 'NULL',
            'pallet_size_cm' => $existing_item_db->pallet_size_cm ?? 'NULL',
            'pcs_per_pallet_a' => $existing_item_db->pcs_per_pallet_a ?? 'NULL',
            'pallet_gross_weight_a_kg' => $existing_item_db->pallet_gross_weight_a_kg ?? 'NULL',
            'pallet_height_a_cm' => $existing_item_db->pallet_height_a_cm ?? 'NULL',
        ];
        error_log('[BJT_Consumable] BEFORE UPDATE - ID ' . $id . ': ' . json_encode($before_update_log));

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
            // 🔥 新增：数据保护机制 - 防止有值字段被错误清零
            $protected_fields = [
                'package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs',
                'gross_weight_kg', 'gross_weight_lbs', 'pcs_per_box',
                'pallet_size_cm', 'pallet_size_inch',
                'pcs_per_pallet_a', 'pallet_gross_weight_a_kg', 'pallet_gross_weight_a_lbs',
                'pallet_height_a_cm', 'pallet_height_a_inch',
                'pcs_per_pallet_b', 'pallet_gross_weight_b_kg', 'pallet_gross_weight_b_lbs',
                'pallet_height_b_cm', 'pallet_height_b_inch',
                'pcs_per_pallet_c', 'pallet_gross_weight_c_kg', 'pallet_gross_weight_c_lbs',
                'pallet_height_c_cm', 'pallet_height_c_inch'
            ];
            
            foreach ($protected_fields as $field) {
                if (isset($data_to_update[$field])) {
                    $new_value = $data_to_update[$field];
                    $old_value = $existing_item_db->$field ?? null;
                    
                    // 如果原值不为空且不为0，但新值为0或空，则发出警告并跳过更新
                    if (!empty($old_value) && $old_value != 0 && ($new_value === 0 || $new_value === '0' || empty($new_value))) {
                        error_log("[BJT_Consumable] ⚠️  PROTECTION: Preventing field '{$field}' from being cleared. Old value: '{$old_value}', attempted new value: '{$new_value}' for ID {$id}");
                        unset($data_to_update[$field]); // 移除这个字段的更新
                    }
                }
            }
            
            $data_to_update['updated_at'] = current_time('mysql', 1);
            $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));

            if ($result === false) {
                error_log($this->resource_name . ' DB Update Error: ' . $wpdb->last_error);
                return $this->error_response('Failed to update consumable. DB Error: ' . $wpdb->last_error, 'db_error', 500);
            }
            
            // 🔥 记录实际执行的更新操作
            error_log('[BJT_Consumable] Database update executed for ID ' . $id . ' with ' . count($data_to_update) . ' fields');
            error_log('[BJT_Consumable] Updated fields: ' . json_encode($data_to_update));
        }
        
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve consumable after update.', 'retrieve_after_update_error', 500);
        }

        // 🔥 记录更新后的关键字段值并与更新前对比
        $after_update_log = [
            'id' => $id,
            'package_type' => $updated_item_db->package_type ?? 'NULL',
            'package_size_cm' => $updated_item_db->package_size_cm ?? 'NULL',
            'net_weight_kg' => $updated_item_db->net_weight_kg ?? 'NULL',
            'gross_weight_kg' => $updated_item_db->gross_weight_kg ?? 'NULL',
            'pcs_per_box' => $updated_item_db->pcs_per_box ?? 'NULL',
            'pallet_size_cm' => $updated_item_db->pallet_size_cm ?? 'NULL',
            'pcs_per_pallet_a' => $updated_item_db->pcs_per_pallet_a ?? 'NULL',
            'pallet_gross_weight_a_kg' => $updated_item_db->pallet_gross_weight_a_kg ?? 'NULL',
            'pallet_height_a_cm' => $updated_item_db->pallet_height_a_cm ?? 'NULL',
        ];
        error_log('[BJT_Consumable] AFTER UPDATE - ID ' . $id . ': ' . json_encode($after_update_log));
        
        // 🔥 检测哪些字段发生了意外变化（从非零值变为零）
        $unexpected_changes = [];
        foreach ($before_update_log as $field => $before_value) {
            if ($field === 'id') continue;
            $after_value = $after_update_log[$field];
            
            // 检测从有值变为NULL或0的情况
            if ($before_value !== 'NULL' && $before_value !== '0' && $before_value !== 0 && 
                ($after_value === 'NULL' || $after_value === '0' || $after_value === 0)) {
                $unexpected_changes[$field] = [
                    'before' => $before_value,
                    'after' => $after_value,
                    'was_in_update_data' => isset($data_to_update[$field])
                ];
            }
        }
        
        if (!empty($unexpected_changes)) {
            error_log('[BJT_Consumable] ⚠️  DETECTED UNEXPECTED DATA LOSS for ID ' . $id . ': ' . json_encode($unexpected_changes));
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

        // Ensure BJT_Dictionary_Controller is available
        if (!class_exists('BJT_Dictionary_Controller')) {
            // Attempt to include it - path might need adjustment based on actual file structure
            $dictionary_controller_path = dirname(__FILE__) . '/class-dictionary-controller.php';
            if (file_exists($dictionary_controller_path)) {
                require_once $dictionary_controller_path;
            } else {
                // Log error or handle missing controller
                error_log('BJT_Dictionary_Controller class not found and could not be included.');
            }
        }

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
        
        // 🔥 修复：正确处理category_id参数
        $category_id = $request->get_param('category_id');
        if (!empty($category_id) && is_numeric($category_id)) {
            $where_clauses[] = $wpdb->prepare("product_line_id = %d", absint($category_id));
        }
        
        // Frontend specific filters (map to DB columns)
        // Model (maps to DB 'app_model' or 'model' depending on frontend intent)
        // For now, let's assume frontend 'model' filter maps to DB 'app_model' (compatible host machines)
        $filter_model = $request->get_param('model'); // machine model filter from frontend
        $filter_app_model = $request->get_param('app_model'); // 🔥 新增：支持app_model参数
        $model_filter_value = !empty($filter_app_model) ? $filter_app_model : $filter_model;
        
        if (!empty($model_filter_value) && $model_filter_value !== 'all') {
             // 🔥 修复：精确匹配app_model字段中的机型，处理复杂格式
             $where_clauses[] = $this->build_app_model_where_clause($wpdb, $model_filter_value);
        }
        $filter_shape = $request->get_param('shape'); // maps to 'bag_type'
        $filter_bag_type = $request->get_param('bag_type'); // 🔥 新增：支持bag_type参数
        $shape_filter_value = !empty($filter_bag_type) ? $filter_bag_type : $filter_shape;
        
        if (!empty($shape_filter_value) && $shape_filter_value !== 'all') {
             // 🔥 修复：正确映射shape到bag_type，处理不同的形状值
             $where_clauses[] = $wpdb->prepare("bag_type = %s", $shape_filter_value);
        }
        $filter_material = $request->get_param('material');
        if (!empty($filter_material) && $filter_material !== 'all') {
             // 🔥 修复：处理材质匹配，包括部分匹配情况
             $where_clauses[] = $wpdb->prepare("(material = %s OR material LIKE %s)", 
                $filter_material, '%' . $wpdb->esc_like($filter_material) . '%');
        }
        // Thickness, Weight, Width, Length filters are more complex as they might be ranges or specific values
        // and need to map to thickness_met, width_met, length_met.
        // For Iteration 1, we'll keep these simple or omit until frontend request format is clearer.
        // Example for thickness (exact match on thickness_met for now if param is numeric)
        $filter_thickness = $request->get_param('thickness');
        if (!empty($filter_thickness) && is_numeric($filter_thickness)) {
            // 🔥 修复：使用近似匹配，允许小幅度差异
            $thickness_val = floatval($filter_thickness);
            $where_clauses[] = $wpdb->prepare("ABS(thickness_met - %f) < 0.1", $thickness_val);
        }
        $filter_width = $request->get_param('width');
        if (!empty($filter_width) && is_numeric($filter_width)) {
            // 🔥 修复：使用近似匹配，允许小幅度差异
            $width_val = floatval($filter_width);
            $where_clauses[] = $wpdb->prepare("ABS(width_met - %f) < 0.1", $width_val);
        }
        $filter_length = $request->get_param('length');
        if (!empty($filter_length) && is_numeric($filter_length)) {
            // 🔥 修复：使用近似匹配，允许小幅度差异
            $length_val = floatval($filter_length);
            $where_clauses[] = $wpdb->prepare("ABS(length_met - %f) < 0.1", $length_val);
        }
        // Note: 'weight' filter from frontend not directly mapped yet.
        
        // 🔥 新增：添加调试日志
        error_log('[BJT Consumables API] Applied filters: ' . json_encode([
            'model' => $filter_model,
            'app_model' => $filter_app_model,
            'model_filter_value' => $model_filter_value,
            'shape' => $filter_shape, 
            'bag_type' => $filter_bag_type,
            'shape_filter_value' => $shape_filter_value,
            'material' => $filter_material,
            'thickness' => $filter_thickness,
            'width' => $filter_width,
            'length' => $filter_length,
            'where_clauses_count' => count($where_clauses)
        ]));

        $where_sql = implode(" AND ", $where_clauses);
        
        // 🔥 新增：调试完整的SQL查询
        error_log('[BJT Consumables API] Final WHERE clause: ' . $where_sql);
        
        // 🔥 关键修复：确保where clause不为空时才添加WHERE关键词
        if (empty($where_clauses)) {
            $where_sql = "1=1"; // 默认条件，返回所有记录
            error_log('[BJT Consumables API] WARNING: No filter conditions applied, showing all records');
        }

        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        
        // 🔥 增强调试：记录完整查询语句
        error_log('[BJT Consumables API] Complete Query: ' . $total_items_query);
        
        $total_items = $wpdb->get_var($total_items_query);
        
        // 🔥 记录查询结果
        error_log('[BJT Consumables API] Total items found: ' . $total_items);

        $items_query = "SELECT * {$base_query} WHERE {$where_sql} ORDER BY id DESC LIMIT %d OFFSET %d";
        $items_db = $wpdb->get_results($wpdb->prepare($items_query, $per_page, $offset));

        $formatted_items = array_map(array($this, 'format_item_for_response'), $items_db);
        
        // --- 🔥 修复：动态生成筛选项（从实际数据） ---
        $filter_options = $this->generate_dynamic_filter_options($wpdb);
        
        $total_pages = ceil($total_items / $per_page);

        return $this->format_response([
            'items' => $formatted_items,
            'total' => intval($total_items),
            'total_pages' => intval($total_pages),
            'current_page' => intval($page),
            'filterOptions' => $filter_options
        ]);
    }
    
    /**
     * 🔥 新增方法：映射bag_type到字典code
     * 解决consumables表的bag_type字段与字典表code字段不一致的问题
     */
    private function map_bag_type_to_dictionary_code($bag_type) {
        // 🔥 修复：基于数据库实际数据的正确映射关系
        // 数据库分析结果：
        // - wp_bjt_shapes: MFC→"Tube888", MFF→"Bubble999", MEX→"Pillow666666", MEY→"Precut Air Pillow"
        // - wp_bjt_consumables: bag_type有"Tube"(5个), "MFC"(2个), "MFF"(1个), "Bubble"(21个)
        
        $mapping = [
            // 标准映射（bag_type直接对应shapes表的code）
            'MFC' => 'MFC',    // bag_type="MFC" → MFC配置 ("Tube888")
            'MFF' => 'MFF',    // bag_type="MFF" → MFF配置 ("Bubble999") 
            'MEX' => 'MEX',    // bag_type="MEX" → MEX配置 ("Pillow666666")
            'MEY' => 'MEY',    // bag_type="MEY" → MEY配置 ("Precut Air Pillow")
            'MFB' => 'MFB',    // bag_type="MFB" → MFB配置 ("Bubble")
            
            // 兼容性映射（英文名称到code）
            'Pillow' => 'MEX',
            'Precut Air Pillow' => 'MEY',
            'paper Bubble' => 'MFB',
            'paper air Pillow' => 'MEX_PAPER',
            
            // 🔥 关键修复：避免重复映射
            // 为bag_type="Tube"和"Bubble"创建独立的形状配置
            // 方案：直接使用bag_type作为配置ID，让系统回退到硬编码显示
            'Tube' => 'Tube',     // 让系统使用硬编码显示名称
            'Bubble' => 'Bubble'  // 让系统使用硬编码显示名称
        ];
        
        return isset($mapping[$bag_type]) ? $mapping[$bag_type] : $bag_type;
    }

    /**
     * 🔥 新增方法：动态生成筛选项（从实际数据）
     * 解决静态字典配置与实际数据不匹配的问题
     */
    private function generate_dynamic_filter_options($wpdb) {
        // 🔥 改进：先从 wp_bjt_shapes 表获取所有shape配置
        $shapes_table = $wpdb->prefix . 'bjt_shapes';
        $shapes_configs_raw = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT code, name_zh, name_en, image_url, image_url2, sort_order 
                 FROM {$shapes_table} 
                 WHERE product_line_id = %d AND status = 'publish' 
                 ORDER BY sort_order ASC",
                1 // 假设product_line_id = 1
            )
        );
        
        // 转换为以code为key的关联数组
        $shapes_configs = [];
        if ($shapes_configs_raw) {
            foreach ($shapes_configs_raw as $config) {
                $shapes_configs[$config->code] = $config;
            }
        }
        
        // 获取所有已发布的耗材数据用于生成筛选项
        $all_items_query = "SELECT bag_type, material, app_model, thickness_met, width_met, length_met, bubble_diameter_met FROM {$this->table_name} WHERE status = 'publish'";
        $all_items = $wpdb->get_results($all_items_query);
        
        $filter_options = [
            'shapes' => [],
            'materials' => [],
            'models' => [],
                'thicknesses' => [],
                'widths' => [],
                'lengths' => [],
            'weights' => []
        ];
        
        // 用于去重的Set
        $shapes_set = [];
        $materials_set = [];
        $models_set = [];
        $thickness_set = [];
        $width_set = [];
        $length_set = [];
        
        foreach ($all_items as $item) {
            // 1. 🔥 改进：处理形状（bag_type）- 从数据库配置中获取信息
            if (!empty($item->bag_type) && !isset($shapes_set[$item->bag_type])) {
                $shapes_set[$item->bag_type] = true;
                
                // 🔥 映射bag_type到字典code
                $dictionary_code = $this->map_bag_type_to_dictionary_code($item->bag_type);
                $shape_config = null;
                if (isset($shapes_configs[$dictionary_code])) {
                    $shape_config = $shapes_configs[$dictionary_code];
                }
                
                if ($shape_config) {
                    // 从数据库配置中获取
                    $filter_options['shapes'][] = [
                        'id' => $item->bag_type,
                        'code' => $item->bag_type,
                        'name' => $shape_config->name_zh ?: $shape_config->name_en, // 保持向后兼容
                        'name_zh' => $shape_config->name_zh,
                        'name_en' => $shape_config->name_en,
                        'image_url' => $shape_config->image_url ?: $this->get_shape_image_url($item->bag_type),
                        'image_url2' => $shape_config->image_url2 ?: $this->get_shape_demo_image_url($item->bag_type),
                        'sort_order' => $shape_config->sort_order ?: count($filter_options['shapes']) * 10
                    ];
                } else {
                    // 回退到硬编码映射（用于向后兼容）
                    $display_name = $this->get_shape_display_name($item->bag_type);
                    $filter_options['shapes'][] = [
                        'id' => $item->bag_type,
                        'code' => $item->bag_type,
                        'name' => $display_name, // 保持向后兼容
                        'name_zh' => $display_name,
                        'name_en' => $item->bag_type,
                        'image_url' => $this->get_shape_image_url($item->bag_type),
                        'image_url2' => $this->get_shape_demo_image_url($item->bag_type),
                        'sort_order' => count($filter_options['shapes']) * 10
                    ];
                }
            }
            
            // 2. 处理材质 - 使用词典API获取准确翻译
            if (!empty($item->material) && !isset($materials_set[$item->material])) {
                $materials_set[$item->material] = true;
                
                // 从词典API获取材料信息
                $material_info = $this->get_material_from_dictionary($item->material);
                
                $filter_options['materials'][] = [
                    'id' => $item->material,
                    'code' => $item->material,
                    'name' => $material_info['name_zh'], // 使用词典中文名称
                    'name_zh' => $material_info['name_zh'],
                    'name_en' => $material_info['name_en'],
                    'sort_order' => $material_info['sort_order'] ?: (count($filter_options['materials']) * 10)
                ];
            }
            
            // 3. 处理适用机型（app_model）- 解析逗号分隔的值
            if (!empty($item->app_model)) {
                // 处理复杂的app_model字段：LA-E4C,"LA-E4S V2.0",LA-F2
                $app_models = $this->parse_app_model_field($item->app_model);
                foreach ($app_models as $model) {
                    $model = trim($model);
                    if (!empty($model) && !isset($models_set[$model])) {
                        $models_set[$model] = true;
                        $model_display_name = $this->get_model_display_name($model);
                        $filter_options['models'][] = [
                            'id' => $model,
                            'code' => $model,
                            'name' => $model_display_name, // 保持向后兼容
                            'name_zh' => $model_display_name,
                            'name_en' => $model,
                            'sort_order' => count($filter_options['models']) * 10
                        ];
                    }
                }
            }
            
            // 4. 处理厚度
            if (!empty($item->thickness_met) && $item->thickness_met > 0) {
                $thickness_val = floatval($item->thickness_met);
                $thickness_key = number_format($thickness_val, 0) . 'um';
                if (!isset($thickness_set[$thickness_key])) {
                    $thickness_set[$thickness_key] = true;
                    $filter_options['thicknesses'][] = [
                        'code' => $thickness_key,
                        'name' => number_format($thickness_val, 0) . ' um',
                        'value' => $thickness_val
                    ];
                }
            }
            
            // 5. 处理膜宽
            if (!empty($item->width_met) && $item->width_met > 0) {
                $width_val = floatval($item->width_met);
                $width_key = number_format($width_val, 0) . 'cm';
                if (!isset($width_set[$width_key])) {
                    $width_set[$width_key] = true;
                    $filter_options['widths'][] = [
                        'code' => $width_key,
                        'name' => number_format($width_val, 0) . ' cm',
                        'value' => $width_val
                    ];
                }
            }
            
            // 6. 处理袋长
            if (!empty($item->length_met) && $item->length_met > 0) {
                $length_val = floatval($item->length_met);
                $length_key = number_format($length_val, 1) . 'cm';
                if (!isset($length_set[$length_key])) {
                    $length_set[$length_key] = true;
                    $filter_options['lengths'][] = [
                        'code' => $length_key,
                        'name' => number_format($length_val, 1) . ' cm',
                        'value' => $length_val
                    ];
                }
            }
        }
        
        // 排序筛选项
        usort($filter_options['shapes'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['materials'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['models'], function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
        usort($filter_options['thicknesses'], function($a, $b) { return $a['value'] - $b['value']; });
        usort($filter_options['widths'], function($a, $b) { return $a['value'] - $b['value']; });
        usort($filter_options['lengths'], function($a, $b) { return $a['value'] - $b['value']; });
        
        // 添加调试信息
        error_log('[BJT Consumables] Dynamic filter options generated: ' . json_encode([
            'shapes_count' => count($filter_options['shapes']),
            'materials_count' => count($filter_options['materials']),
            'models_count' => count($filter_options['models']),
            'thicknesses_count' => count($filter_options['thicknesses']),
            'widths_count' => count($filter_options['widths']),
            'lengths_count' => count($filter_options['lengths'])
        ]));
        
        return $filter_options;
    }
    
    /**
     * 🔥 新增方法：解析app_model字段（处理逗号分隔和引号）
     */
    private function parse_app_model_field($app_model_str) {
        // 处理格式：LA-E4C,"LA-E4S V2.0",LA-F2
        // 分解步骤：
        // 1. 先按逗号分隔
        // 2. 去除每个部分的引号
        // 3. 清理空白字符
        
        $models = [];
        $parts = explode(',', $app_model_str);
        
        foreach ($parts as $part) {
            $part = trim($part);
            // 移除前后的引号
            $part = trim($part, '"\'');
            if (!empty($part)) {
                $models[] = $part;
            }
        }
        
        return $models;
    }
    
    /**
     * 🔥 新增方法：获取形状显示名称
     */
    private function get_shape_display_name($shape) {
        $shape_names = [
            'Bubble' => '气泡膜',
            'Tube' => '气枕膜', 
            'paper Bubble' => '纸质气泡膜',
            'paper air Pillow' => '纸质气垫枕'
        ];
        
        return isset($shape_names[$shape]) ? $shape_names[$shape] : $shape;
    }
    
    /**
     * 🔥 修复方法：获取形状图片URL
     */
    private function get_shape_image_url($shape) {
        $shape_images = [
            // 🔥 新增：Pillow和Precut Air Pillow的正确映射
            'Pillow' => '/images/MEX/values/MEX.png',
            'Precut Air Pillow' => '/images/MEX/values/MEX.png',
            
            // 现有映射
            'Bubble' => '/images/MFF/values/MFF.png',
            'Tube' => '/images/MFC/values/MFC.png',
            'paper Bubble' => '/images/MFB/values/MFB.png',
            'paper air Pillow' => '/images/MEX/values/MEX.png'
        ];
        
        return isset($shape_images[$shape]) ? $shape_images[$shape] : '/images/default/shape.png';
    }
    
    /**
     * 🔥 新增方法：获取形状示意图片URL (image_url2)
     */
    private function get_shape_demo_image_url($shape) {
        $shape_demo_images = [
            'Pillow' => '/images/MEX/values/MEX-2.png',
            'Precut Air Pillow' => '/images/MEX/values/MEX-2.png',
            'Bubble' => '/images/MFF/values/MFF-2.png',
            'Tube' => '/images/MFC/values/MFC-2.png',
            'paper Bubble' => '/images/MFB/values/MFB-2.png',
            'paper air Pillow' => '/images/MEX/values/MEX-2.png'
        ];
        
        return isset($shape_demo_images[$shape]) ? $shape_demo_images[$shape] : '/images/default/shape-demo.png';
    }
    
    /**
     * 🔥 新增方法：从词典API获取材料信息
     */
    private function get_material_from_dictionary($material_code) {
        global $wpdb;
        
        // 查询材料词典表
        $material_info = $wpdb->get_row($wpdb->prepare(
            "SELECT code, name_zh, name_en, sort_order 
             FROM {$wpdb->prefix}bjt_materials 
             WHERE code = %s AND status = 'publish'",
            $material_code
        ));
        
        if ($material_info) {
            return [
                'name_zh' => $material_info->name_zh,
                'name_en' => trim($material_info->name_en, '"\''), // 清理引号
                'sort_order' => intval($material_info->sort_order)
            ];
        }
        
        // 如果词典中没有找到，使用回退值
        error_log("[BJT Consumables] Material '{$material_code}' not found in dictionary, using fallback");
        return [
            'name_zh' => $material_code,
            'name_en' => $material_code,
            'sort_order' => 999
        ];
    }
    
    /**
     * 🔥 保留方法：获取材质显示名称（作为回退）
     */
    private function get_material_display_name($material) {
        $material_names = [
            'HDPE' => 'HDPE',
            '50% HDPE' => '50%回料HDPE',
            'PAPE' => 'PAPE共挤膜',
            'PAPER' => '纸塑膜',
            'LDPE' => 'LDPE'
        ];
        
        return isset($material_names[$material]) ? $material_names[$material] : $material;
    }
    
    /**
     * 🔥 新增方法：获取机型显示名称
     */
    private function get_model_display_name($model) {
        $model_names = [
            'LA-E4S V2.0' => 'LA-E4S V2.0 商用型缓冲气垫机',
            'LA-E4S(paper)' => 'LA-E4S(paper)商用型缓冲气垫机',
            'LA-E4C' => 'LA-E4C 商用型缓冲气垫机',
            'LA-F2' => 'LA-F2 便携式缓冲气垫机'
        ];
        
        return isset($model_names[$model]) ? $model_names[$model] : $model;
    }

    /**
     * Check if a specific consumable is compatible with a machine model
     */
    public function check_compatibility($request) {
        $consumable_id = $request->get_param('consumable_id');
        $machine_model = $request->get_param('machine_model');
        
        if (empty($consumable_id) || empty($machine_model)) {
            return new WP_Error('missing_params', 'Missing consumable_id or machine_model parameter', ['status' => 400]);
        }

        global $wpdb;
        
        // Get consumable info
        $consumable = $wpdb->get_row($wpdb->prepare(
            "SELECT app_model FROM {$this->table_name} WHERE id = %d AND status = 'publish'",
            $consumable_id
        ));
        
        if (!$consumable) {
            return new WP_Error('consumable_not_found', 'Consumable not found', ['status' => 404]);
        }
        
        // Check compatibility
        $app_models = $this->parse_app_model_field($consumable->app_model);
        $is_compatible = in_array($machine_model, $app_models);
        
        return $this->format_response([
            'consumable_id' => $consumable_id,
            'machine_model' => $machine_model,
            'compatible' => $is_compatible,
            'message' => $is_compatible ? '完全兼容' : '不兼容或未知兼容性'
        ]);
    }

    /**
     * Checks if the current user has permission to write (create/update) consumables.
     * Requires authentication and proper BJT permissions.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        error_log('[BJT_Consumable_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Consumable_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Consumable_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Consumable_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Consumable_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Consumable_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Consumable_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以创建/更新consumables
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
            error_log('[BJT_Consumable_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update consumables.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Consumable_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Checks if the current user has permission to delete consumables.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has delete access, WP_Error object otherwise.
     */
    public function check_delete_permission($request) {
        error_log('[BJT_Consumable_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Consumable_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Consumable_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Consumable_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Consumable_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Consumable_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Consumable_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以删除consumables
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
            error_log('[BJT_Consumable_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete consumables.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Consumable_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * 🔥 新增方法：构建app_model字段的精确匹配WHERE子句
     * 处理复杂格式：LA-E4C,"LA-E4S V2.0",LA-F2
     */
    private function build_app_model_where_clause($wpdb, $model_filter_value) {
        // 清理引号
        $clean_model = str_replace('"', '', $model_filter_value);
        
        // 构建多种匹配模式来覆盖所有可能的情况
        $conditions = [
            // 1. 完全匹配（单独的机型）
            $wpdb->prepare("app_model = %s", $model_filter_value),
            $wpdb->prepare("app_model = %s", $clean_model),
            
            // 2. 在引号内的匹配（带引号的机型）
            $wpdb->prepare("app_model LIKE %s", '%"' . $wpdb->esc_like($model_filter_value) . '"%'),
            
            // 3. 在逗号分隔中的匹配（没有引号的机型）
            $wpdb->prepare("app_model LIKE %s", $wpdb->esc_like($clean_model) . ',%'),  // 开头
            $wpdb->prepare("app_model LIKE %s", '%,' . $wpdb->esc_like($clean_model) . ',%'),  // 中间
            $wpdb->prepare("app_model LIKE %s", '%,' . $wpdb->esc_like($clean_model)),  // 结尾
            
            // 4. 单独存在（整个字段就是这个值）
            $wpdb->prepare("app_model = %s", $model_filter_value),
        ];
        
        return '(' . implode(' OR ', $conditions) . ')';
    }

    /**
     * 获取耗材筛选选项
     * 返回所有可用的主机型号、配件型号等筛选选项
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response 筛选选项响应
     */
    public function get_filter_options($request) {
        global $wpdb;
        
        // 获取请求参数
        $lang = $request->get_param('lang') ?: 'zh';
        $product_line_id = $request->get_param('product_line_id');
        
        // 查询所有已发布的耗材，获取适用型号信息
        $where_clause = "status = 'publish' AND app_model IS NOT NULL AND app_model != ''";
        $where_params = [];
        
        if ($product_line_id) {
            $where_clause .= " AND product_line_id = %d";
            $where_params[] = $product_line_id;
        }
        
        $consumables = $wpdb->get_results($wpdb->prepare(
            "SELECT DISTINCT app_model 
             FROM {$this->table_name} 
             WHERE {$where_clause}",
            ...$where_params
        ));
        
        // 获取主机型号和配件型号
        $host_models_table = $wpdb->prefix . 'bjt_host_models';
        $accessory_models_table = $wpdb->prefix . 'bjt_accessory_models';
        $title_column = $lang === 'en' ? 'title_en' : 'title_zh';
        
        // 查询主机型号
        $host_query = "SELECT model, {$title_column} as title 
                       FROM {$host_models_table} 
                       WHERE status = 'publish'";
        $host_params = [];
        
        if ($product_line_id) {
            $host_query .= " AND product_line_id = %d";
            $host_params[] = $product_line_id;
        }
        
        $host_query .= " ORDER BY sort_order ASC, model ASC";
        
        $host_models_raw = $wpdb->get_results($wpdb->prepare($host_query, ...$host_params));
        
        // 查询配件型号
        $accessory_query = "SELECT model, {$title_column} as title 
                            FROM {$accessory_models_table} 
                            WHERE status = 'publish'";
        $accessory_params = [];
        
        if ($product_line_id) {
            $accessory_query .= " AND product_line_id = %d";
            $accessory_params[] = $product_line_id;
        }
        
        $accessory_query .= " ORDER BY sort_order ASC, model ASC";
        
        $accessory_models_raw = $wpdb->get_results($wpdb->prepare($accessory_query, ...$accessory_params));
        
        // 构建主机型号列表（返回字符串数组）
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
        
        // 如果没有从专门的型号表获取到数据，从耗材的app_model字段中提取
        if (empty($host_models) && empty($accessory_models) && $consumables) {
            $all_models = [];
            foreach ($consumables as $consumable) {
                if (!empty($consumable->app_model)) {
                    // 清理并分割模型字符串
                    $clean_models = str_replace(['"', "'"], '', $consumable->app_model); // 移除引号
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
        
        // 构建响应数据（与备件格式保持一致）
        $response_data = [
            'hostModels' => $host_models,
            'accessoryModels' => $accessory_models
        ];
        
        return $this->format_response($response_data, '筛选选项获取成功');
    }
} 