<?php
/**
 * Accessories API Controller
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class BJT_Accessory_Controller extends BJT_API_Controller {
    
    public $resource_name = 'accessories';

    public function __construct() {
        parent::__construct();
    }

    /**
     * Register the routes for accessories.
     */
    public function register_routes() {
        
        // GET /accessories - List accessories
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'], // Use base controller permission for now
                'args'                => array_merge(
                    $this->get_pagination_arg_definitions(),
                    [
                        'lang' => [
                            'description' => 'Language code (zh/en).',
                            'type'        => 'string',
                            'enum'        => ['zh', 'en'],
                            'default'     => 'zh'
                        ],
                        'region' => [
                            'description' => 'Region code (CN/EU/NA/AU).',
                            'type'        => 'string',
                            'enum'        => ['CN', 'EU', 'NA', 'AU'],
                            // 'default'     => 'CN' // Default handled by user context ideally
                        ],
                        // Add filter args based on API doc / DB schema if needed
                        // 'model' => [ ... ],
                        'part_number' => [
                            'description' => 'Filter by part number.',
                            'type'        => 'string',
                        ],
                        'model' => [
                            'description' => 'Filter by model.',
                            'type'        => 'string',
                        ],
                        'product_line_id' => [
                            'description' => 'Filter by product line ID.',
                            'type'        => 'integer',
                        ],
                        'status' => [
                            'description' => 'Filter by status (publish/draft). If not specified, shows all non-deleted statuses.',
                            'type'        => 'string',
                            'enum'        => ['publish', 'draft'],
                        ],
                    ]
                ),
            ],
            'schema' => [$this, 'get_public_item_schema'], // Define schema later
        ]);

        // POST /accessories - Create an accessory
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'], // Use base controller permission
                'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

        // GET /accessories/{id} - Get a single accessory
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\\d+)', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args'                => [
                    'id' => [
                        'description' => 'Unique identifier for the accessory.',
                        'type'        => 'integer',
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ],
                    'lang' => [
                        'description' => 'Language code (zh/en).',
                        'type'        => 'string',
                        'enum'        => ['zh', 'en'],
                        'default'     => 'zh'
                    ],
                    'region' => [
                        'description' => 'Region code (CN/EU/NA/AU).',
                        'type'        => 'string',
                        'enum'        => ['CN', 'EU', 'NA', 'AU'],
                    ],
                    'context' => $this->get_context_param( [ 'default' => 'view' ] ),
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

        // PUT /accessories/{id} - Update an accessory
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\\d+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

        // DELETE /accessories/{id} - Delete an accessory
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\\d+)', [
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args'                => [
                    'id' => [
                        'description' => 'Unique identifier for the accessory.',
                        'type'        => 'integer',
                        'required'    => true,
                    ],
                    'force' => [
                        'type'        => 'boolean',
                        'default'     => false,
                        'description' => 'Whether to bypass trash and force deletion.',
                    ],
                ],
            ],
        ]);

        // GET /accessories/{id}/children - Get child accessories
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\w-]+)/children', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_children'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args'                => [
                     'id' => [
                        'description' => 'Part number of the parent accessory.',
                        'type'        => 'string',
                        'required'    => true,
                    ],
                    'lang' => [
                        'description' => 'Language code (zh/en).',
                        'type'        => 'string',
                        'enum'        => ['zh', 'en'],
                        'default'     => 'zh'
                    ],
                    'region' => [
                        'description' => 'Region code (CN/EU/NA/AU) for pricing and inventory.',
                        'type'        => 'string',
                        'enum'        => ['CN', 'EU', 'NA', 'AU'],
                    ],
                    'page' => $this->get_pagination_arg_definitions()['page'],
                    'per_page' => $this->get_pagination_arg_definitions()['per_page'],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'], // Consider a specific schema for children response
        ]);

        // GET /accessories/{id}/required - Get required spare parts for an accessory
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<accessoryId>\\d+)/required', [
             [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_required_spare_parts'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args'                => [
                     'accessoryId' => [
                        'description' => 'Unique identifier for the accessory.',
                        'type'        => 'integer',
                        'required'    => true,
                    ],
                     'lang' => [
                        'description' => 'Language code (zh/en).',
                        'type'        => 'string',
                        'enum'        => ['zh', 'en'],
                        'default'     => 'zh'
                    ],
                ],
            ],
             'schema' => [$this, 'get_public_item_schema'], // Schema likely needs to be for spare parts
        ]);

        // GET /accessories/machine/{model}/accessories - Get accessories for a specific machine model
        register_rest_route($this->namespace, '/' . $this->resource_name . '/machine/(?P<model>[a-zA-Z0-9-]+)/accessories', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_machine_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args'                => [
                    'model' => [
                        'description' => 'Machine model code.',
                        'type'        => 'string',
                        'required'    => true,
                    ],
                    'level' => [
                        'description' => 'Accessory level (1-5).',
                        'type'        => 'integer',
                        'default'     => 1,
                        'validate_callback' => function($param) {
                            return is_numeric($param) && $param >= 1 && $param <= 5;
                        }
                    ],
                    'lang' => [
                        'description' => 'Language code (zh/en).',
                        'type'        => 'string',
                        'enum'        => ['zh', 'en'],
                        'default'     => 'zh'
                    ],
                    'region' => [
                        'description' => 'Region code (CN/EU/NA/AU).',
                        'type'        => 'string',
                        'enum'        => ['CN', 'EU', 'NA', 'AU'],
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

    }

    // --- Callback Implementations (Placeholders) ---

    public function get_items($request) {
        // Placeholder: Implement logic to fetch and return list of accessories
        // Use $this->extract_pagination_params_from_request($request)
        // Query wp_bjt_accessories & potentially wp_bjt_accessory_models
        // Consider lang and region params
        // return new WP_REST_Response($this->response([], 'Accessories list endpoint not yet implemented.', false), 404);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_accessories';
        
        // Extract parameters
        $pagination_params = $this->extract_pagination_params_from_request($request);
        $lang = $request->get_param('lang') ?: 'zh';
        $region = $request->get_param('region'); // Region might be used for price/inventory later

        // Determine name column based on language
        $name_column = ($lang === 'en') ? 'name_en' : 'name_zh';
        
        // Build WHERE clauses - 修改状态过滤逻辑以支持管理后台查看所有状态
        $where_clauses = [];
        $params = [];

        // 添加状态过滤 - 支持传递status参数，默认为所有状态（管理后台需要）
        $status_filter = $request->get_param('status');
        if ($status_filter) {
            $where_clauses[] = "status = %s";
            $params[] = $status_filter;
        } else {
            // 如果没有指定状态，显示所有非删除状态的记录（包括publish和draft）
            $where_clauses[] = "status IN ('publish', 'draft')";
        }

        // Add part_number filter
        if ($request->get_param('part_number')) {
            $where_clauses[] = "part_number = %s";
            $params[] = $request->get_param('part_number');
        }

        // Add model filter
        if ($request->get_param('model')) {
            $where_clauses[] = "model = %s";
            $params[] = $request->get_param('model');
        }

        // Add product_line_id filter
        if ($request->get_param('product_line_id')) {
            $where_clauses[] = "product_line_id = %d";
            $params[] = intval($request->get_param('product_line_id'));
        }

        $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

        // Get total count for pagination
        $total_items_sql = "SELECT COUNT(id) FROM {$table_name} {$where_sql}";
        $total_items = $wpdb->get_var($wpdb->prepare($total_items_sql, $params));

        if ($total_items === null) {
            // Handle potential DB error for count
            return $this->error_response('Database error retrieving accessory count.', 'db_error', 500);
        }

        // Get paginated items
        $items_sql = $wpdb->prepare(
            "SELECT 
                id, 
                product_line_id, 
                model, 
                brand, 
                part_number, 
                name_zh,
                name_en,
                spec, 
                spec_imperial, 
                voltage, 
                frequency, 
                image_url, 
                status, 
                unit, 
                created_at, 
                updated_at 
             FROM {$table_name} 
             {$where_sql} 
             ORDER BY id ASC 
             LIMIT %d OFFSET %d",
            array_merge($params, [$pagination_params['per_page'], $pagination_params['offset']])
        );
        
        $items = $wpdb->get_results($items_sql);

        if ($wpdb->last_error) {
            // Handle potential DB error for items
            return $this->error_response('Database error retrieving accessories: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        $formatted_items = array_map([$this, 'format_item_for_response'], $items);
        
        // Prepare response data structure
        $data = [
            'items' => $formatted_items,
            'total' => (int) $total_items,
            'page' => $pagination_params['page'],
            'per_page' => $pagination_params['per_page'],
            'total_pages' => ($total_items > 0) ? ceil($total_items / $pagination_params['per_page']) : 0,
        ];

        // Return successful response using WP_REST_Response
        // The base class `response` method isn't ideal for WP_REST_Response success structure
        $response = new WP_REST_Response();
        $response->set_data($data); // Set the main data (items, total, etc.)
        $response->header( 'X-WP-Total', (int) $total_items );
		$response->header( 'X-WP-TotalPages', (int) $data['total_pages'] );

        // Add success flag and message if needed (though usually implicit for 200 OK)
        // $response_data = $response->get_data();
        // $response_data['success'] = true;
        // $response->set_data($response_data);

        return $response;
    }

    public function create_item($request) {
        // Placeholder: Implement logic to create an accessory
        // Validate input based on schema
        // Insert into wp_bjt_accessories
        // return new WP_REST_Response($this->response(null, 'Create accessory endpoint not yet implemented.', false), 404);

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_accessories';
        
        // Extract params from request
        $product_line_id = $request->get_param('product_line_id');
        $model = $request->get_param('model');
        $brand = $request->get_param('brand');
        $part_number = $request->get_param('part_number');
        $name_zh = $request->get_param('name_zh');
        $name_en = $request->get_param('name_en');
        $spec = $request->get_param('spec');
        $spec_imperial = $request->get_param('spec_imperial');
        $voltage = $request->get_param('voltage');
        $frequency = $request->get_param('frequency');
        $image_url = $request->get_param('image_url');
        $status = $request->get_param('status') ?: 'publish';
        $unit = $request->get_param('unit') ?: 'pcs';

        // Basic validation
        if (empty($product_line_id) || empty($model) || empty($part_number) || empty($name_zh)) {
            return $this->error_response(
                'Required fields missing. Must provide product_line_id, model, part_number, and name_zh.',
                'missing_required_fields', 
                400
            );
        }

        // Check for duplicate part_number
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table_name} WHERE product_line_id = %d AND part_number = %s",
                $product_line_id,
                $part_number
            )
        );

        if ($existing > 0) {
            return $this->error_response(
                'A part with this part_number already exists for this product line.',
                'duplicate_part_number',
                409
            );
        }

        // Prepare data for insertion
        $data = [
            'product_line_id' => $product_line_id,
            'model' => $model,
            'brand' => $brand,
            'part_number' => $part_number,
            'name_zh' => $name_zh,
            'name_en' => $name_en ?: $name_zh, // Default to zh if en not provided
            'spec' => $spec,
            'spec_imperial' => $spec_imperial,
            'voltage' => $voltage,
            'frequency' => $frequency,
            'image_url' => $image_url,
            'status' => $status,
            'unit' => $unit,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ];
        
        // Filter out null values
        $data = array_filter($data, function($value) {
            return $value !== null;
        });

        // Insert into database
        $result = $wpdb->insert($table_name, $data);

        if ($result === false) {
            return $this->error_response(
                'Failed to create accessory. Database error: ' . $wpdb->last_error,
                'db_insert_error',
                500
            );
        }

        // Get the inserted ID
        $accessory_id = $wpdb->insert_id;

        // Fetch the complete accessory record
        $accessory = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $accessory_id)
        );

        if (!$accessory) {
            return $this->error_response(
                'Accessory was created but could not be retrieved.',
                'retrieve_error',
                500
            );
        }

        // Return success response with the created accessory
        $response = new WP_REST_Response($accessory, 201);
        return $response;
    }

    public function get_item($request) {
        $id = (int) $request['id'];
        // Placeholder: Implement logic to fetch single accessory by ID
        // Query wp_bjt_accessories & potentially wp_bjt_accessory_models
        // Consider lang and region params
        // return new WP_REST_Response($this->response(null, "Get accessory $id endpoint not yet implemented.", false), 404);

        global $wpdb;
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $models_table = $wpdb->prefix . 'bjt_accessory_models';
        
        // Get language parameter
        $lang = $request->get_param('lang') ?: 'zh';
        
        // Fetch accessory data with join to accessory_models to get additional details
        $accessory = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    a.id, 
                    a.product_line_id,
                    a.model,
                    a.brand,
                    a.part_number,
                    a.name_zh,
                    a.name_en,
                    a.spec,
                    a.spec_imperial,
                    a.voltage,
                    a.frequency,
                    a.package_size_cm,
                    a.package_size_inch,
                    a.net_weight_kg,
                    a.net_weight_lbs,
                    a.gross_weight_kg,
                    a.gross_weight_lbs,
                    a.pcs_per_box,
                    a.pallet_size_cm,
                    a.pallet_size_inch,
                    a.pcs_per_pallet,
                    a.pallet_height_cm,
                    a.pallet_height_inch,
                    a.pallet_gross_weight_kg,
                    a.pallet_gross_weight_lbs,
                    a.image_url,
                    a.status,
                    a.unit,
                    a.created_at,
                    a.updated_at,
                    am.title_zh AS model_title_zh,
                    am.title_en AS model_title_en,
                    am.description_zh AS model_description_zh,
                    am.description_en AS model_description_en,
                    am.type AS model_type,
                    am.image1_url AS model_image1_url,
                    am.image2_url AS model_image2_url,
                    am.explosion_diagram_pdf AS model_diagram_pdf
                FROM 
                    {$accessories_table} a
                LEFT JOIN 
                    {$models_table} am ON a.product_line_id = am.product_line_id AND a.model = am.model
                WHERE 
                    a.id = %d",
                $id
            ),
            ARRAY_A
        );

        // Check if accessory exists
        if (!$accessory) {
            return $this->error_response(
                "Accessory with ID {$id} not found.",
                'accessory_not_found',
                404
            );
        }

        // Add a dynamic 'name' field for backward compatibility based on language preference
        $accessory['name'] = ($lang === 'en' && !empty($accessory['name_en'])) ? $accessory['name_en'] : $accessory['name_zh'];

        // Format model info based on language
        $model_title = ($lang === 'en') ? $accessory['model_title_en'] : $accessory['model_title_zh'];
        $model_description = ($lang === 'en') ? $accessory['model_description_en'] : $accessory['model_description_zh'];
        
        // Include model information in a nested structure
        $accessory['model_info'] = [
            'title' => $model_title,
            'description' => $model_description,
            'type' => $accessory['model_type'],
            'image1_url' => $accessory['model_image1_url'],
            'image2_url' => $accessory['model_image2_url'],
            'diagram_pdf' => $accessory['model_diagram_pdf'],
        ];
        
        // Remove the raw model fields
        unset($accessory['model_title_zh']);
        unset($accessory['model_title_en']);
        unset($accessory['model_description_zh']);
        unset($accessory['model_description_en']);
        unset($accessory['model_type']);
        unset($accessory['model_image1_url']);
        unset($accessory['model_image2_url']);
        unset($accessory['model_diagram_pdf']);
        
        // Fetch price information if region is specified
        $region = $request->get_param('region');
        if ($region) {
            $prices_table = $wpdb->prefix . 'bjt_prices';
            $price_data = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT 
                        base_price,
                        discount_rate,
                        currency
                    FROM 
                        {$prices_table}
                    WHERE 
                        product_line_id = %d AND
                        target_type = 'accessory' AND
                        target_id = %d AND
                        region = %s AND
                        min_quantity <= 1
                    ORDER BY 
                        min_quantity DESC
                    LIMIT 1",
                    $accessory['product_line_id'],
                    $id,
                    $region
                ),
                ARRAY_A
            );
            
            if ($price_data) {
                $accessory['pricing'] = $price_data;
            }
        }
        
        // Fetch inventory information if region is specified
        if ($region) {
            $inventory_table = $wpdb->prefix . 'bjt_inventory';
            $inventory_data = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT 
                        region,
                        warehouse,
                        quantity,
                        reserved,
                        status
                    FROM 
                        {$inventory_table}
                    WHERE 
                        product_line_id = %d AND
                        target_type = 'accessory' AND
                        target_id = %d AND
                        region = %s",
                    $accessory['product_line_id'],
                    $id,
                    $region
                ),
                ARRAY_A
            );
            
            if ($inventory_data) {
                $accessory['inventory'] = $inventory_data;
            }
        }

        // Return success response with the accessory data
        return new WP_REST_Response(
            $accessory,
            200
        );
    }

    public function update_item($request) {
        $id = (int) $request['id'];
        // Placeholder: Implement logic to update accessory by ID
        // Validate input
        // Update wp_bjt_accessories
        // return new WP_REST_Response($this->response(null, "Update accessory $id endpoint not yet implemented.", false), 404);

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_accessories';
        
        // Check if accessory exists
        $existing = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id)
        );
        
        if (!$existing) {
            return $this->error_response(
                "Accessory with ID {$id} not found.",
                'accessory_not_found',
                404
            );
        }
        
        // Define updatable fields
        $updatable_fields = [
            'model', 'brand', 'name_zh', 'name_en', 'spec', 'spec_imperial',
            'voltage', 'frequency', 'package_size_cm', 'package_size_inch',
            'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs',
            'pcs_per_box', 'pallet_size_cm', 'pallet_size_inch', 'pcs_per_pallet',
            'pallet_height_cm', 'pallet_height_inch', 'pallet_gross_weight_kg', 
            'pallet_gross_weight_lbs', 'image_url', 'status', 'unit'
        ];
        
        // Build update data from request params
        $update_data = [];
        foreach ($updatable_fields as $field) {
            $value = $request->get_param($field);
            if ($value !== null) {
                $update_data[$field] = $value;
            }
        }
        
        // If there's nothing to update
        if (empty($update_data)) {
            // Simply return the current state of the accessory
            return new WP_REST_Response($existing, 200);
        }
        
        // Check if part_number is being updated, which is generally not allowed
        // But we'll check if it's unique first if it is being updated
        if ($request->has_param('part_number')) {
            $new_part_number = $request->get_param('part_number');
            
            // Check if the part_number is actually changing
            if ($new_part_number !== $existing->part_number) {
                // Check if the new part_number is already used
                $part_number_exists = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT COUNT(*) FROM {$table_name} 
                         WHERE product_line_id = %d 
                         AND part_number = %s 
                         AND id != %d",
                        $existing->product_line_id,
                        $new_part_number,
                        $id
                    )
                );
                
                if ($part_number_exists > 0) {
                    return $this->error_response(
                        'A part with this part_number already exists for this product line.',
                        'duplicate_part_number',
                        409
                    );
                }
                
                $update_data['part_number'] = $new_part_number;
            }
        }
        
        // Don't allow updating product_line_id as it would break relations
        if ($request->has_param('product_line_id')) {
            $new_product_line_id = (int) $request->get_param('product_line_id');
            if ($new_product_line_id !== (int) $existing->product_line_id) {
                return $this->error_response(
                    'Changing product_line_id is not allowed.',
                    'product_line_change_not_allowed',
                    400
                );
            }
        }
        
        // Add updated_at timestamp
        $update_data['updated_at'] = current_time('mysql');
        
        // Update the database
        $result = $wpdb->update(
            $table_name,
            $update_data,
            ['id' => $id]
        );
        
        if ($result === false) {
            return $this->error_response(
                'Failed to update accessory. Database error: ' . $wpdb->last_error,
                'db_update_error',
                500
            );
        }
        
        // Fetch the updated accessory record
        $updated_accessory = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id)
        );
        
        return new WP_REST_Response($updated_accessory, 200);
    }

    public function delete_item($request) {
        $id = (int) $request['id'];
        $force = isset($request['force']) ? (bool) $request['force'] : false;
        // Placeholder: Implement logic to delete accessory by ID
        // Handle force deletion (vs. potentially moving to trash/changing status)
        // return new WP_REST_Response($this->response(null, "Delete accessory $id endpoint not yet implemented.", false), 404);
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_accessories';
        
        // Check if accessory exists
        $existing = $wpdb->get_row(
            $wpdb->prepare("SELECT id, part_number FROM {$table_name} WHERE id = %d", $id)
        );
        
        if (!$existing) {
            return $this->error_response(
                "Accessory with ID {$id} not found.",
                'accessory_not_found',
                404
            );
        }

        // Check if there are child items in relations table
        $relations_table = $wpdb->prefix . 'bjt_relations';
        $has_children = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$relations_table} 
                 WHERE parent_part_number = %s",
                $existing->part_number
            )
        );
        
        if ($has_children > 0 && !$force) {
            return $this->error_response(
                "Cannot delete accessory {$id} because it has child items. Use force=true to delete anyway.",
                'accessory_has_children',
                400
            );
        }
        
        if ($force) {
            // If force=true, perform actual deletion
            $result = $wpdb->delete(
                $table_name,
                ['id' => $id]
            );
            
            if ($result === false) {
                return $this->error_response(
                    'Failed to delete accessory. Database error: ' . $wpdb->last_error,
                    'db_delete_error',
                    500
                );
            }
            
            // Also delete any relations where this accessory is parent or child
            $wpdb->delete(
                $relations_table,
                ['parent_part_number' => $existing->part_number]
            );
            
            $wpdb->delete(
                $relations_table,
                ['child_part_number' => $existing->part_number]
            );
            
            // Delete any inventory records
            $inventory_table = $wpdb->prefix . 'bjt_inventory';
            $wpdb->delete(
                $inventory_table,
                [
                    'target_type' => 'accessory',
                    'target_id' => $id
                ]
            );
            
            // Delete any price records
            $prices_table = $wpdb->prefix . 'bjt_prices';
            $wpdb->delete(
                $prices_table,
                [
                    'target_type' => 'accessory',
                    'target_id' => $id
                ]
            );
            
            return new WP_REST_Response(null, 204); // No content
        } else {
            // If force=false, just mark as "trash" (change status)
            $result = $wpdb->update(
                $table_name,
                ['status' => 'trash'],
                ['id' => $id]
            );
            
            if ($result === false) {
                return $this->error_response(
                    'Failed to trash accessory. Database error: ' . $wpdb->last_error,
                    'db_update_error',
                    500
                );
            }
            
            // Fetch the updated accessory record
            $trashed_accessory = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id)
            );
            
            return new WP_REST_Response($trashed_accessory, 200);
        }
    }

    /**
     * Get child accessories for a given parent accessory part number.
     * Children are grouped by their model.
     * Includes pricing and inventory if region is provided.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_children($request) {
        global $wpdb;
        $parent_accessory_part_number = $request->get_param('id');
        $lang = $request->get_param('lang') ?: 'zh';
        $region = $request->get_param('region');
        $page = absint($request->get_param('page') ?: 1);
        $per_page = absint($request->get_param('per_page') ?: 10);

        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $relations_table = $wpdb->prefix . 'bjt_relations';
        $accessory_models_table = $wpdb->prefix . 'bjt_accessory_models';
        $prices_table = $wpdb->prefix . 'bjt_prices';
        $inventory_table = $wpdb->prefix . 'bjt_inventory';

        // Validate if the parent accessory part_number actually exists
        $parent_accessory_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$accessories_table} WHERE part_number = %s AND status = 'publish'",
            $parent_accessory_part_number
        ));
        if (!$parent_accessory_exists) {
            return $this->error_response('指定的父配件料号不存在 (Parent accessory part number not found)', 'parent_accessory_not_found', 404);
        }

        // Query to find direct child accessory part numbers linked to the parent_accessory_part_number
        // In wp_bjt_relations, 'part_number' is the parent for this query, 
        // and 'child_part_number' is the child. This was corrected based on user feedback.
        $child_accessory_pns_query = $wpdb->prepare(
            "SELECT DISTINCT r.child_part_number 
             FROM {$relations_table} r
             WHERE r.part_number = %s AND r.child_type = 'accessory' AND r.status = 'publish'",
            $parent_accessory_part_number
        );
        
        $child_accessory_pns_results = $wpdb->get_col($child_accessory_pns_query);

        if (empty($child_accessory_pns_results)) {
            return $this->success_response(['items' => [], 'total' => 0, 'page' => $page, 'per_page' => $per_page, 'total_pages' => 0, 'parent_part_number' => $parent_accessory_part_number]);
        }

        $grouped_child_accessories = [];

        foreach ($child_accessory_pns_results as $child_acc_pn) {
            $child_accessory_detail = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM {$accessories_table} WHERE part_number = %s AND status = 'publish'", $child_acc_pn),
                ARRAY_A
            );

            if ($child_accessory_detail) {
                $child_accessory_db_id = $child_accessory_detail['id'];
                $child_accessory_model_code = $child_accessory_detail['model'];

                $child_accessory_model_detail = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM {$accessory_models_table} WHERE model = %s AND status = 'publish'", $child_accessory_model_code),
                    ARRAY_A
                );

                if (!$child_accessory_model_detail) {
                    continue; // Skip if model not found or not published
                }

                // Initialize model group if not exists
                if (!isset($grouped_child_accessories[$child_accessory_model_code])) {
                    $model_title_key = $lang === 'en' ? 'title_en' : 'title_zh';
                    $model_fallback_title_key = $lang === 'en' ? 'title_zh' : 'title_en';
                    
                    $model_title = ''; 
                    if (isset($child_accessory_model_detail[$model_title_key]) && !empty($child_accessory_model_detail[$model_title_key])) {
                        $model_title = $child_accessory_model_detail[$model_title_key];
                    } elseif (isset($child_accessory_model_detail[$model_fallback_title_key]) && !empty($child_accessory_model_detail[$model_fallback_title_key])) {
                        $model_title = $child_accessory_model_detail[$model_fallback_title_key];
                    }

                    $grouped_child_accessories[$child_accessory_model_code] = [
                        'id' => $child_accessory_model_code, 
                        'model' => $model_title, 
                        'title' => $model_title, 
                        'image_url' => isset($child_accessory_model_detail['image1_url']) ? ($child_accessory_model_detail['image1_url'] ?: (isset($child_accessory_model_detail['image2_url']) ? $child_accessory_model_detail['image2_url'] : '')) : '',
                        'parts' => [],
                    ];
                }
                
                $part_name_key = ($lang === 'en' && isset($child_accessory_detail['name_en']) && !empty($child_accessory_detail['name_en'])) ? 'name_en' : 'name_zh';
                
                $part_data = [
                    'id' => $child_accessory_db_id, 
                    'part_number' => $child_acc_pn,
                    'name' => isset($child_accessory_detail[$part_name_key]) ? $child_accessory_detail[$part_name_key] : '',
                    'spec' => isset($child_accessory_detail['spec']) ? $child_accessory_detail['spec'] : '',
                    'spec_imperial' => isset($child_accessory_detail['spec_imperial']) ? $child_accessory_detail['spec_imperial'] : '',
                    'voltage' => isset($child_accessory_detail['voltage']) ? $child_accessory_detail['voltage'] : '',
                    'frequency' => isset($child_accessory_detail['frequency']) ? $child_accessory_detail['frequency'] : '',
                    'unit' => isset($child_accessory_detail['unit']) ? $child_accessory_detail['unit'] : '',
                ];

                if ($region) {
                    $price_data_raw = $wpdb->get_row(
                $wpdb->prepare(
                            "SELECT base_price, currency, discount_rate FROM {$prices_table} 
                             WHERE target_type = 'accessory' AND target_id = %d AND region = %s AND status = 'active' 
                             ORDER BY min_quantity ASC LIMIT 1",
                            $child_accessory_db_id, $region
                ),
                ARRAY_A
            );
                    if ($price_data_raw) {
                        $part_data['pricing'] = [
                            'base_price' => isset($price_data_raw['base_price']) ? (float)$price_data_raw['base_price'] : 0.0,
                            'currency' => isset($price_data_raw['currency']) ? $price_data_raw['currency'] : '',
                            'discount_rate' => isset($price_data_raw['discount_rate']) ? (float)$price_data_raw['discount_rate'] : null,
                        ];
                    } else {
                         $part_data['pricing'] = null; 
                    }
                }

                if ($region) {
                    $inventory_results = $wpdb->get_results(
                $wpdb->prepare(
                            "SELECT warehouse, quantity, reserved FROM {$inventory_table} 
                             WHERE target_type = 'accessory' AND target_id = %d AND region = %s AND status = 'active'",
                            $child_accessory_db_id, $region
                ),
                ARRAY_A
            );
                    $part_data['inventory'] = array_map(function($inv_item) {
                        return [
                            'warehouse' => isset($inv_item['warehouse']) ? $inv_item['warehouse'] : '',
                            'quantity' => isset($inv_item['quantity']) ? (int)$inv_item['quantity'] : 0,
                            'reserved' => isset($inv_item['reserved']) ? (int)$inv_item['reserved'] : 0,
                            'available' => (isset($inv_item['quantity']) ? (int)$inv_item['quantity'] : 0) - (isset($inv_item['reserved']) ? (int)$inv_item['reserved'] : 0),
                        ];
                    }, $inventory_results ?: []);
                }
                
                $grouped_child_accessories[$child_accessory_model_code]['parts'][] = $part_data;
            }
        }

        $response_items = array_values($grouped_child_accessories);
        $total_items = count($response_items); 
        
        $paginated_model_groups = array_slice($response_items, ($page - 1) * $per_page, $per_page);
        $total_pages = ($per_page > 0) ? ceil($total_items / $per_page) : 0;


        return $this->success_response([
            'items' => $paginated_model_groups,
            'total' => $total_items,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => $total_pages,
            'parent_part_number' => $parent_accessory_part_number,
        ]);
    }

    public function get_required_spare_parts($request) {
        $accessoryId = (int) $request['accessoryId'];
        // Placeholder: Implement logic based on API doc section 5.4
        // Query wp_bjt_relations for required_parts based on accessory part_number
        // Fetch details of required spare parts from wp_bjt_spare_parts
        // Consider lang param
        // return new WP_REST_Response($this->response([], "Get required spare parts for accessory $accessoryId endpoint not yet implemented.", false), 404);
        
        global $wpdb;
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $relations_table = $wpdb->prefix . 'bjt_relations';
        $spare_parts_table = $wpdb->prefix . 'bjt_spare_parts';
        
        // Get language parameter
        $lang = $request->get_param('lang') ?: 'zh';
        $name_column = ($lang === 'en') ? 'name_en' : 'name_zh';
        
        // Get accessory part_number
        $accessory = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, product_line_id, part_number FROM {$accessories_table} WHERE id = %d",
                $accessoryId
            )
        );
        
        if (!$accessory) {
            return $this->error_response(
                "Accessory with ID {$accessoryId} not found.",
                'accessory_not_found',
                404
            );
        }
        
        // Get relations that have required_parts for this accessory
        $relations = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    required_parts, 
                    required_quantity 
                 FROM {$relations_table} 
                 WHERE child_part_number = %s AND required_parts IS NOT NULL 
                 AND required_parts != ''",
                $accessory->part_number
            )
        );
        
        if ($wpdb->last_error) {
            return $this->error_response(
                'Database error retrieving relations: ' . $wpdb->last_error,
                'db_error',
                500
            );
        }
        
        // Early return if no required parts
        if (empty($relations)) {
            return new WP_REST_Response(['items' => []], 200);
        }
        
        // Collect all required part numbers and quantities
        $required_parts = [];
        foreach ($relations as $relation) {
            $part_numbers = explode(',', $relation->required_parts);
            $quantities = explode(',', $relation->required_quantity ?: '1');
            
            // Match part numbers with quantities
            foreach ($part_numbers as $index => $part_number) {
                $quantity = isset($quantities[$index]) ? (int) $quantities[$index] : 1;
                
                if (!isset($required_parts[$part_number])) {
                    $required_parts[$part_number] = $quantity;
                } else {
                    // If part is required multiple times, use the maximum quantity
                    $required_parts[$part_number] = max($required_parts[$part_number], $quantity);
                }
            }
        }
        
        if (empty($required_parts)) {
            return new WP_REST_Response(['items' => []], 200);
        }
        
        // Get part numbers as comma-separated string
        $part_numbers = "'" . implode("','", array_keys($required_parts)) . "'";
        
        // Fetch spare part details
        $spare_parts = $wpdb->get_results(
            "SELECT 
                id,
                product_line_id,
                app_model,
                model,
                is_consumable,
                image_url,
                part_number,
                {$name_column} AS name,
                spec,
                spec_imperial,
                app_sn,
                status,
                unit
             FROM {$spare_parts_table}
             WHERE part_number IN ({$part_numbers})
             AND status = 'publish'"
        );
        
        if ($wpdb->last_error) {
            return $this->error_response(
                'Database error retrieving spare parts: ' . $wpdb->last_error,
                'db_error',
                500
            );
        }
        
        // Add quantity to each spare part
        $items = [];
        foreach ($spare_parts as $part) {
            $part->quantity = $required_parts[$part->part_number] ?? 1;
            $items[] = $part;
        }
        
        return new WP_REST_Response(
            [
                'items' => $items,
                'accessory_id' => $accessoryId,
                'accessory_part_number' => $accessory->part_number
            ],
            200
        );
    }

    /**
     * Get accessories for a specific machine model
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_machine_accessories($request) {
        global $wpdb;
        
        $model = $request->get_param('model');
        $level = $request->get_param('level') ?: 1;
        $lang = $request->get_param('lang') ?: 'zh';
        
        // Determine name column based on language
        $name_column = ($lang === 'en') ? 'name_en' : 'name_zh';
        
        // Query to get accessories for the machine model
        $query = $wpdb->prepare(
            "SELECT a.*, am.{$name_column} as name
            FROM {$wpdb->prefix}bjt_accessories a
            JOIN {$wpdb->prefix}bjt_accessory_models am ON a.id = am.accessory_id
            WHERE am.model_code = %s
            AND a.level = %d
            AND a.status = 'publish'
            ORDER BY a.sort_order ASC",
            $model,
            $level
        );
        
        $accessories = $wpdb->get_results($query);
        
        if ($accessories === null) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to fetch accessories',
                'data' => []
            ], 500);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'data' => $accessories
        ]);
    }

    // --- Schema --- (Implement later)
    public function get_public_item_schema() {
        // Placeholder: Define the schema for an accessory item
        return []; 
    }

    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
         // Placeholder: Define args based on schema fields for create/update
        return [];
    }
    
    /**
     * Extract pagination parameters from request
     * 
     * @param WP_REST_Request $request The request object
     * @return array Pagination parameters (page, per_page, offset)
     */
    protected function extract_pagination_params_from_request($request) {
        $page = (int) $request->get_param('page');
        if ($page < 1) {
            $page = 1;
        }
        
        $per_page = (int) $request->get_param('per_page');
        if ($per_page < 1) {
            $per_page = 10; // Default items per page
        }
        if ($per_page > 100) {
            $per_page = 100; // Max items per page
        }
        
        $offset = ($page - 1) * $per_page;
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => $offset
        ];
    }
    
    /**
     * Get pagination argument definitions for route registration
     * 
     * @return array Pagination argument definitions
     */
    protected function get_pagination_arg_definitions() {
        return [
            'page' => [
                'description' => 'Current page of the collection.',
                'type'        => 'integer',
                'default'     => 1,
                'minimum'     => 1,
                'sanitize_callback' => 'absint',
            ],
            'per_page' => [
                'description' => 'Maximum number of items to be returned in result set.',
                'type'        => 'integer',
                'default'     => 10,
                'minimum'     => 1,
                'maximum'     => 100,
                'sanitize_callback' => 'absint',
            ],
        ];
    }
    
    public function get_context_param( $args = array() ) {
		$param_args = array(
			'description'       => 'Scope under which the request is made; determines fields present in response.',
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_key',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$param_args = wp_parse_args( $args, $param_args );
		$param_args['enum'] = array( 'view', 'embed', 'edit' );
		return $param_args;
	}

    /**
     * Helper to return a success WP_REST_Response for API responses.
     */
    protected function success_response(array $data, $status_code = 200) {
        return new WP_REST_Response([
            'success' => true,
            'data'    => $data,
        ], $status_code);
	}

    /**
     * Helper function to format a DB row item for API response.
     * This centralizes the formatting logic used by get_item, get_items, create_item, update_item.
     */
    protected function format_item_for_response($item_db_object) {
        global $wpdb;
        if (!$item_db_object) {
            return null;
        }
        
        // --- 🆕 获取必选备件信息 ---
        $relations_table = $wpdb->prefix . 'bjt_relations';
        $required_parts_relations = $wpdb->get_results($wpdb->prepare(
            "SELECT required_parts, required_quantity 
             FROM {$relations_table} 
             WHERE child_part_number = %s AND required_parts IS NOT NULL AND required_parts != '' 
             AND status = 'publish'",
            $item_db_object->part_number
        ));
        
        $required_parts_info = [];
        if (!empty($required_parts_relations)) {
            foreach ($required_parts_relations as $relation) {
                $part_numbers = explode(',', $relation->required_parts);
                $quantities = explode(',', $relation->required_quantity ?: '1');
                
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
            }
        }
        
        return [
            'id' => (int) $item_db_object->id,
            'product_line_id' => (int) $item_db_object->product_line_id,
            'model' => $item_db_object->model,
            'brand' => $item_db_object->brand,
            'part_number' => $item_db_object->part_number,
            'name_zh' => isset($item_db_object->name_zh) ? $item_db_object->name_zh : '',
            'name_en' => isset($item_db_object->name_en) ? $item_db_object->name_en : '',
            'name' => isset($item_db_object->name_zh) ? $item_db_object->name_zh : '', // 向后兼容的name字段，默认使用中文
            'spec' => $item_db_object->spec,
            'spec_imperial' => $item_db_object->spec_imperial,
            'voltage' => $item_db_object->voltage,
            'frequency' => $item_db_object->frequency,
            'image_url' => $item_db_object->image_url,
            'status' => $item_db_object->status,
            'unit' => $item_db_object->unit,
            'required_parts' => $required_parts_info,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at,
        ];
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
        error_log('[BJT_Accessory_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Accessory_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Accessory_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Accessory_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Accessory_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Accessory_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Accessory_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以创建/更新accessories
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
            error_log('[BJT_Accessory_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update accessories.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Accessory_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Check delete permission
     */
    public function check_delete_permission($request) {
        error_log('[BJT_Accessory_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Accessory_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Accessory_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Accessory_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Accessory_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Accessory_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Accessory_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以删除accessories
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
            error_log('[BJT_Accessory_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete accessories.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Accessory_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }
} 