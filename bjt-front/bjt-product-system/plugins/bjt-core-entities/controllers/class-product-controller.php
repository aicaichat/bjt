<?php
/**
 * 产品线控制器
 */
class BJT_Product_Controller extends BJT_API_Controller {
    /**
     * 资源名称 (Resource Name for Product Lines)
     * This is the primary identifier used for routing and messages.
     *
     * @var string
     */
    protected $resource_name = 'product-lines';
    
    protected $table_name;

    protected $fillable_fields = [
        'code',
        'title_zh', 
        'title_en',
        'description_zh', 
        'description_en',
        'image_url',
        'status', 
        'sort_order'
    ];

    protected $required_api_fields_for_create = [
        'code',
        'name_cn', 
        'name_en'
    ];

    public function __construct() {
        // Define controller-specific properties first
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_product_lines';
        $this->resource_name = 'product-lines'; 
        $this->rest_base = $this->resource_name; // Explicitly set rest_base
        
        // Call the parent constructor (BJT_API_Controller)
        parent::__construct(); // Restored
    }
    
    /**
     * 注册路由
     */
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
     * 获取产品线列表
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_items($request) {
        global $wpdb;

        // Pagination parameters
        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 10;
        $offset = ($page - 1) * $per_page;

        // Base query
        $base_query = "FROM {$this->table_name}";
        $where_clauses = array("1=1"); // Start with a tautology

        // Search parameter (optional)
        $search = $request->get_param('search');
        if (!empty($search)) {
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $where_clauses[] = $wpdb->prepare(
                "(code LIKE %s OR title_zh LIKE %s OR title_en LIKE %s OR description_zh LIKE %s OR description_en LIKE %s)",
                $search_term, $search_term, $search_term, $search_term, $search_term
            );
        }
        
        // Status parameter (optional)
        $status = $request->get_param('status');
        if (!empty($status)) {
             // Basic validation for status, can be expanded if needed
            if (in_array($status, array('publish', 'draft', 'trash'))) {
                 $where_clauses[] = $wpdb->prepare("status = %s", $status);
            } else {
                // Optionally return an error for invalid status, or just ignore it
            }
        }

        $where_sql = implode(" AND ", $where_clauses);

        // Get total items for pagination headers
        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        $total_items = $wpdb->get_var($total_items_query);

        // Get paginated items
        $items_query = "SELECT * {$base_query} WHERE {$where_sql} ORDER BY sort_order ASC, id DESC LIMIT %d OFFSET %d";
        $items_db = $wpdb->get_results($wpdb->prepare($items_query, $per_page, $offset));

        $formatted_items = array_map(array($this, 'format_item_for_response'), $items_db);
        
        $response = new WP_REST_Response($formatted_items, 200);

        $response->header('X-WP-Total', $total_items);
        $total_pages = ceil($total_items / $per_page);
        $response->header('X-WP-TotalPages', $total_pages);

        // Add Link headers for pagination
        $base_url = rest_url(sprintf('%s/%s', $this->namespace, $this->rest_base));
        $query_params = $request->get_query_params();

        if ($page > 1) {
            $prev_page_params = array_merge($query_params, ['page' => $page - 1, 'per_page' => $per_page]);
            $response->link_header('prev', add_query_arg($prev_page_params, $base_url));
        }
        if ($page < $total_pages) {
            $next_page_params = array_merge($query_params, ['page' => $page + 1, 'per_page' => $per_page]);
            $response->link_header('next', add_query_arg($next_page_params, $base_url));
        }

        return $response;
    }
    
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid product line ID.', 'invalid_id', 400);
        }

        $item_db_object = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db_object) {
            return $this->error_response("Product line with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db_object);
        return new WP_REST_Response(['success' => true, 'data' => $formatted_item], 200);
    }
    
    public function create_item($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params();
        }

        foreach ($this->required_api_fields_for_create as $field) {
            // Note: $field here refers to API field names
            if (empty($params[$field])) {
                return $this->error_response("Missing required API field for product line: {$field}", 'missing_api_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Ensure DB-level required fields are present after mapping
        if (empty($data_to_insert['code'])) {
             return $this->error_response("Missing mapped field: code", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['title_zh'])) { // This checks the DB field name
             return $this->error_response("Missing mapped field: title_zh (from name_cn)", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['title_en'])) { // This checks the DB field name
             return $this->error_response("Missing mapped field: title_en (from name_en)", 'missing_mapped_field', 400);
        }
        
        if (empty($data_to_insert['status']) && in_array('status', $this->fillable_fields)) {
            $data_to_insert['status'] = 'publish';
        }

        // Check for duplicate: UNIQUE KEY `uk_code` (`code`)
        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE code = %s",
            $data_to_insert['code']
        ));
        if ($existing_item) {
            return $this->error_response('Product line with this code already exists.', 'duplicate_code', 409); 
        }

        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log($this->resource_name . ' DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create product line. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created product line.', 'retrieve_error', 500);
        }
        
        $formatted_item = $this->format_item_for_response($created_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Product line created successfully.', 'data' => $formatted_item], 201);
    }
    
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid product line ID.', 'invalid_id', 400);
        }

        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Product line with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true /* is_update */);

        if (empty($data_to_update)) {
            return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
        }

        // Check for duplicate code if code is being changed
        if (isset($data_to_update['code']) && $data_to_update['code'] !== $existing_item_db->code) {
            $item_with_new_code = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE code = %s AND id != %d",
                $data_to_update['code'],
                $id
            ));
            if ($item_with_new_code) {
                return $this->error_response('Another product line with this code already exists.', 'duplicate_code_on_update', 409);
            }
        }
        
        // Add current timestamp for updated_at
        $data_to_update['updated_at'] = current_time('mysql', 1); // GMT

        $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));

        if ($result === false) {
            error_log($this->resource_name . ' DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update product line. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        // $wpdb->update returns the number of rows affected. 
        // If 0 rows were affected, it could mean the data was the same or the item wasn't found (though we check above).
        // We'll fetch the item again to return the current state regardless.
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            // This should ideally not happen if the initial check passed and update didn't error out
            return $this->error_response('Failed to retrieve product line after update.', 'retrieve_after_update_error', 500);
        }

        $formatted_item = $this->format_item_for_response($updated_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Product line updated successfully.', 'data' => $formatted_item], 200);
    }
    
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid product line ID.', 'invalid_id', 400);
        }

        // Check if the item exists before trying to delete
        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return $this->error_response("Product line with ID {$id} not found to delete.", 'not_found', 404);
        }

        $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));

        if ($result === false) {
            error_log($this->resource_name . ' DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete product line. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        // $wpdb->delete returns the number of rows affected.
        if ($result === 0) {
            // This case should be rare given the existence check above, but good to handle.
            return $this->error_response("Product line with ID {$id} could not be deleted (it may have been deleted by another process).", 'delete_failed_not_found', 404);
        }

        return new WP_REST_Response(['success' => true, 'message' => "Product line with ID {$id} deleted successfully."], 200);
    }

    public function get_item_schema() { // Ensure this is public
        return [
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer', 'readonly' => true, 'context' => ['view', 'edit', 'embed']],
                'code' => ['type' => 'string', 'required' => true, 'description' => 'Unique code for the product line.'],
                'name_cn' => ['type' => 'string', 'required' => true, 'description' => 'Chinese name of the product line. Maps to title_zh.'],
                'name_en' => ['type' => 'string', 'required' => true, 'description' => 'English name of the product line. Maps to title_en.'],
                'description_zh' => ['type' => 'string', 'description' => 'Chinese description.'],
                'description_en' => ['type' => 'string', 'description' => 'English description.'],
                'image_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Image URL.'],
                'status' => ['type' => 'string', 'default' => 'publish', 'enum' => ['publish', 'draft', 'trash']],
                'sort_order' => ['type' => 'integer', 'default' => 0, 'description' => 'Sort order.'],
                // Add other fields from $fillable_fields as needed
            ],
        ];
    }

    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];

        // Map name_cn to title_zh and name_en to title_en
        if (isset($params['name_cn'])) {
            $data['title_zh'] = sanitize_text_field($params['name_cn']);
        }
        if (isset($params['name_en'])) {
            $data['title_en'] = sanitize_text_field($params['name_en']);
        }

        // Process other fillable fields
        $direct_map_fields = ['code', 'description_zh', 'description_en', 'image_url', 'status', 'sort_order'];
        foreach ($direct_map_fields as $field) {
            if (isset($params[$field])) {
                if ($field === 'sort_order') {
                    $data[$field] = absint($params[$field]);
                } elseif ($field === 'image_url') {
                    $data[$field] = esc_url_raw($params[$field]);
                } else {
                    $data[$field] = sanitize_text_field($params[$field]);
                }
            } elseif ($is_update && array_key_exists($field, $params) && $params[$field] === null) {
                $data[$field] = null;
            }
        }
        return $data;
    }

    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }
        $response_data = [];
        // Use a clean list of fields actually in the DB for product lines
        $product_line_actual_fields = [
            'code',
            'title_zh',
            'title_en',
            'description_zh',
            'description_en',
            'image_url',
            'status',
            'sort_order'
        ];

        foreach ($product_line_actual_fields as $field) {
            if (property_exists($item_db_object, $field)) {
                 if (in_array($field, ['sort_order'])) {
                    $response_data[$field] = (int) $item_db_object->$field;
                 } else {
                    $response_data[$field] = $item_db_object->$field;
                 }
            } else {
                // Ensure all defined fields are present in the response, even if null
                $response_data[$field] = null;
            }
        }
        $response_data['id'] = (int) $item_db_object->id;
        $response_data['created_at'] = $item_db_object->created_at;
        $response_data['updated_at'] = $item_db_object->updated_at;
        
        return $response_data;
    }
}