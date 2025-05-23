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
    public $resource_name = 'product-lines';
    
    protected $table_name;

    protected $fillable_fields = [
        'code',
        'title_zh', 
        'title_en',
        'description_zh', 
        'description_en',
        'subitem1_zh',
        'subitem1_en',
        'subitem2_zh',
        'subitem2_en',
        'subitem3_zh',
        'subitem3_en',
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
        parent::__construct(); 
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
        
        $total_pages = ceil($total_items / $per_page);
        
        $response_data = [
            'success' => true,
            'data' => $formatted_items,
            'total' => (int)$total_items,
            'page' => (int)$page,
            'per_page' => (int)$per_page,
            'total_pages' => (int)$total_pages
        ];
        
        $response = new WP_REST_Response($response_data, 200);

        $response->header('X-WP-Total', $total_items);
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
            return $this->error_response('Failed to create product line. Database error.', 'db_error_create', 500);
        }

        $new_id = $wpdb->insert_id;
        $created_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_id));
        $formatted_item = $this->format_item_for_response($created_item);

        return new WP_REST_Response(['success' => true, 'data' => $formatted_item], 201);
    }

    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid product line ID.', 'invalid_id', 400);
        }

        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return $this->error_response("Product line with ID {$id} not found for update.", 'not_found_update', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true); // is_update = true

        if (empty($data_to_update)) {
            return $this->error_response('No valid fields provided for update.', 'no_fields_update', 400);
        }

        // If code is being updated, check for duplicates excluding the current item
        if (isset($data_to_update['code'])) {
            $existing_item_with_code = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE code = %s AND id != %d",
                $data_to_update['code'],
                $id
            ));
            if ($existing_item_with_code) {
                return $this->error_response('Another product line with this code already exists.', 'duplicate_code_update', 409);
            }
        }
        
        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $id]);

        if ($result === false) { // Could be an error or 0 rows affected if data is the same
            // Check if it was a real error or just no change
            if ($wpdb->last_error) {
                 return $this->error_response('Failed to update product line. Database error: ' . $wpdb->last_error, 'db_error_update', 500);
            }
            // If no error but 0 rows affected, it means data was the same. Treat as success.
        }
        
        $updated_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        $formatted_item = $this->format_item_for_response($updated_item);

        return new WP_REST_Response(['success' => true, 'data' => $formatted_item], 200);
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid product line ID.', 'invalid_id', 400);
        }

        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return $this->error_response("Product line with ID {$id} not found for deletion.", 'not_found_delete', 404);
        }

        // Optionally, implement soft delete by changing status to 'trash' instead of deleting
        // For now, we will hard delete
        $result = $wpdb->delete($this->table_name, ['id' => $id]);

        if ($result === false) {
            return $this->error_response('Failed to delete product line. Database error.', 'db_error_delete', 500);
        }
        
        if ($result === 0) { // Should not happen if item_exists check passed, but as a safeguard
            return $this->error_response("Product line with ID {$id} could not be deleted (already deleted or other issue).", 'delete_failed_no_rows', 404);
        }

        return new WP_REST_Response(['success' => true, 'message' => "Product line with ID {$id} deleted successfully."], 200);
    }

    /**
     * Defines the schema for a product line item.
     * Used for validating create/update requests and for documentation.
     *
     * @return array
     */
    public function get_item_schema() { // Ensure this is public
        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => $this->resource_name,
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __('Unique identifier for the product line.', 'bjt'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'code' => [
                    'description' => __('Unique code for the product line.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true, 
                ],
                'title_zh' => [
                    'description' => __('Chinese title for the product line.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'title_en' => [
                    'description' => __('English title for the product line.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'description_zh' => [
                    'description' => __('Chinese description for the product line.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'description_en' => [
                    'description' => __('English description for the product line.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'subitem1_zh' => [
                    'description' => __('Subitem 1 Chinese name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'subitem1_en' => [
                    'description' => __('Subitem 1 English name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'subitem2_zh' => [
                    'description' => __('Subitem 2 Chinese name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'subitem2_en' => [
                    'description' => __('Subitem 2 English name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'subitem3_zh' => [
                    'description' => __('Subitem 3 Chinese name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'subitem3_en' => [
                    'description' => __('Subitem 3 English name.', 'bjt'),
                    'type' => 'string',
                    'context' => ['view', 'edit', 'embed'],
                ],
                'image_url' => [
                    'description' => __('URL of the product line image.', 'bjt'),
                    'type'        => 'string',
                    'format'      => 'uri',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'status' => [
                    'description' => __('Status of the product line.', 'bjt'),
                    'type'        => 'string',
                    'enum'        => ['publish', 'draft', 'trash'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'sort_order' => [
                    'description' => __('Sort order for the product line.', 'bjt'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'created_at' => [
                    'description' => __('The date the product line was created, in the site\'s timezone.', 'bjt'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'updated_at' => [
                    'description' => __('The date the product line was last updated, in the site\'s timezone.', 'bjt'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
            ],
        ];
        return $schema;
    }

    /**
     * Maps incoming API request fields to database column names.
     * This also handles renaming fields if API names differ from DB names.
     *
     * @param WP_REST_Request $request
     * @param boolean $is_update True if this is for an update operation (to skip some fields)
     * @return array
     */
    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params();
        }
        
        $mapped_data = [];

        $field_map = [
            'name_cn' => 'title_zh',
            'name_en' => 'title_en',
            'description_cn' => 'description_zh',
            'description_en' => 'description_en',
            'subitem1_zh' => 'subitem1_zh',
            'subitem1_en' => 'subitem1_en',
            'subitem2_zh' => 'subitem2_zh',
            'subitem2_en' => 'subitem2_en',
            'subitem3_zh' => 'subitem3_zh',
            'subitem3_en' => 'subitem3_en',
            'code' => 'code',
            'image_url' => 'image_url',
            'status' => 'status',
            'sort_order' => 'sort_order'
        ];

        foreach ($field_map as $api_field => $db_field) {
            if (isset($params[$api_field]) && in_array($db_field, $this->fillable_fields)) {
                $value = $params[$api_field];
                if (in_array($db_field, ['title_zh', 'title_en', 'description_zh', 'description_en', 'subitem1_zh', 'subitem1_en', 'subitem2_zh', 'subitem2_en', 'subitem3_zh', 'subitem3_en', 'image_url', 'status', 'code'])) {
                    $mapped_data[$db_field] = sanitize_text_field($value);
                } elseif ($db_field === 'sort_order') {
                    $mapped_data[$db_field] = absint($value);
                } else {
                    $mapped_data[$db_field] = sanitize_text_field($value);
                }
            }
        }
        return $mapped_data;
    }
    
    /**
     * Formats a database object for the API response.
     *
     * @param object $item_db_object The database object for a product line.
     * @return array The formatted product line data.
     */
    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }

        $response_data = [];
        $product_line_actual_fields = [
            'code',
            'title_zh',
            'title_en',
            'description_zh',
            'description_en',
            'subitem1_zh',
            'subitem1_en',
            'subitem2_zh',
            'subitem2_en',
            'subitem3_zh',
            'subitem3_en',
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
                $response_data[$field] = null;
            }
        }
        $response_data['id'] = (int) $item_db_object->id;
        $response_data['created_at'] = $item_db_object->created_at;
        $response_data['updated_at'] = $item_db_object->updated_at;
        
        return $response_data;
    }

     /**
     * Checks if the current user has permission to read product lines.
     * Publicly accessible for now.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
     */
    public function check_read_permission($request) {
        // For now, allow public read access. Implement specific checks if needed.
        // Example: return current_user_can('read_product_lines');
        return true; 
    }

    /**
     * Checks if the current user has permission to write (create/update/delete) product lines.
     * Requires authentication.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        // This is a placeholder. Actual permission check should be more robust.
        // It should verify JWT token and user capabilities.
        // if (BJT_Auth::is_user_authenticated_and_authorized($request, 'administrator')) { // Or a more specific capability
        //     return true;
        // }
        // return new WP_Error('rest_forbidden', __('You do not have permission to perform this action.'), ['status' => 403]);

        // Attempt to use BJT_Auth_Controller for authentication
        if (!class_exists('BJT_Auth_Controller')) {
            // Try to include it if it's not found. This path is a guess based on prior search.
            $auth_controller_path = WP_PLUGIN_DIR . '/bjt-product-admin/includes/api/class-bjt-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT DEBUG ProductCtrl] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_forbidden', __('Authentication controller not found.'), ['status' => 500]);
            }
        }

        if (!class_exists('BJT_Auth_Controller')) {
             error_log('[BJT DEBUG ProductCtrl] BJT_Auth_Controller class still not found after include attempt.');
             return new WP_Error('rest_forbidden', __('Authentication controller class not loadable.'), ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if ($is_authenticated && current_user_can('administrator')) {
            return true;
        }

        return new WP_Error('rest_forbidden', __('You do not have permission to perform this action.'), ['status' => 403]);
    }
}