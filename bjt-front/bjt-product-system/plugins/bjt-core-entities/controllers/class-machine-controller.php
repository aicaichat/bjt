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
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)/accessories', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ],
                    'level' => [
                        'default' => 1,
                        'validate_callback' => function($value) {
                            return is_numeric($value) && $value >= 1 && $value <= 5;
                        }
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
                'args' => $this->get_pagination_arg_definitions(),
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

        // Fetch items
        $items_query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE status = %s ORDER BY id ASC LIMIT %d OFFSET %d", // Use $this->table_name
            'publish',
            $per_page,
            $offset
        );
        $items = $wpdb->get_results($items_query);

        // Fetch total count
        $total_items_query = $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE status = %s", 'publish'); // Use $this->table_name
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
        $machine_id = absint($request['id']);

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

        // 3. Handle potential unique constraint violation for 'model' and 'product_line_id'
        $check_model = isset($data_to_update['model']) ? $data_to_update['model'] : $existing_item->model;
        $check_product_line_id = isset($data_to_update['product_line_id']) ? $data_to_update['product_line_id'] : $existing_item->product_line_id;

        if ( (isset($data_to_update['model']) || isset($data_to_update['product_line_id'])) ) {
            $duplicate_query = $wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE product_line_id = %d AND model = %s AND id != %d",
                $check_product_line_id,
                $check_model,
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
        $machine_id = absint($request['id']);

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
    public function get_accessories($request) {
        $response = new WP_REST_Response();
        // $machine_id = $request['id'];
        // $level = isset($request['level']) ? (int) $request['level'] : 1;
        
        // // 示例数据
        // $response_data = [
        //     'success' => true,
        //     'data' => [
        //         'items' => [
        //             [
        //                 'id' => 'FS-001',
        //                 'model' => 'Floor Stand',
        //                 'title' => '地面支架组件',
        //                 'level' => $level,
        //                 'image_url' => '/images/shop/FS-001.jpg',
        //                 'parts' => [
        //                     [
        //                         'id' => 'BJT-FS-V2-2024',
        //                         'part_number' => 'BJT-FS-V2-2024',
        //                         'title' => '标准地面支架',
        //                         'specs' => [
        //                             '电压' => 'N/A',
        //                             '频率' => 'N/A',
        //                             '托盘尺寸' => '90×70×120cm',
        //                             '一托数量' => '16件'
        //                         ],
        //                         'spec' => '90×70×120cm, 7.8kg',
        //                         'spec_imperial' => '35.4×27.6×47.2inch, 17.2lbs'
        //                     ]
        //                 ]
        //             ]
        //         ],
        //         'total' => 1
        //     ]
        // ];
        
        $response_data = ['success' => true, 'message' => 'Accessories temporarily unavailable.'];
        
        $response->set_data($response_data);
        return $response;
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
            'code' => $item_db_object->model,
            'title_zh' => $item_db_object->title_zh,
            'title_en' => $item_db_object->title_en,
            'description_zh' => $item_db_object->description_zh,
            'description_en' => $item_db_object->description_en,
            'product_line_id' => (int) $item_db_object->product_line_id,
            'type' => $item_db_object->type,
            'image_url' => $item_db_object->image1_url, // Corresponds to image1_url in DB
            'image2_url' => $item_db_object->image2_url,
            'explosion_diagram_pdf' => $item_db_object->explosion_diagram_pdf,
            'status' => $item_db_object->status,
            'sort_order' => isset($item_db_object->sort_order) ? (int) $item_db_object->sort_order : 0,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at,
        ];
    }

    protected function map_request_to_db(WP_REST_Request $request) {
        $params = $request->get_params();
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
            'image1_url', 'image2_url', 'explosion_diagram_pdf', 
            'status', 'sort_order'
        ];

        foreach ($direct_map_fields as $db_column) {
            if (isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'product_line_id':
                    case 'sort_order':
                        $data[$db_column] = absint($value);
                        break;
                    case 'image1_url':
                    case 'image2_url':
                    case 'explosion_diagram_pdf':
                        $data[$db_column] = esc_url_raw($value);
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
            // We might want to allow explicit null setting on update later
        }
        
        return $data;
    }
} 