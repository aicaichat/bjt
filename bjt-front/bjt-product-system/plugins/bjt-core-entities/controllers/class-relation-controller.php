<?php
/**
 * 关系控制器
 */
class BJT_Relation_Controller extends BJT_API_Controller {
    /**
     * 资源名称
     *
     * @var string
     */
    protected $resource_name = 'relations';
    protected $table_name;

    protected $fillable_fields = [
        'parent_part_number',
        'child_part_number',
        'level',
        'quantity',
        'description',
        'sort_order',
        'is_required',
        'entity_type' // e.g., 'accessory', 'spare_part' to distinguish child type if needed
    ];

    // API fields needed for creation
    protected $required_api_fields_for_create = [
        'parent_part_number',
        'child_part_number',
        'level',
        'quantity'
    ];

    /**
     * 构造函数
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_relations';
        $this->resource_name = 'relations'; // Route name
        $this->rest_base = $this->resource_name;
        parent::__construct();
        error_log("BJT_Relation_Controller initialized.");
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
                'args' => $this->get_collection_params(), // Use WP standard
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the relation.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'context' => $this->get_context_param(['default' => 'view']),
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the relation.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'force' => [
                        'type'        => 'boolean',
                        'default'     => false,
                        'description' => __('Whether to bypass trash and force deletion.'),
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'], // Define schema for single item endpoint
        ]);
    }

    /**
     * Retrieves the query params for collections.
     * Extends standard WP collection params.
     *
     * @since 4.7.0
     *
     * @return array Collection parameters.
     */
    public function get_collection_params() {
        $params = parent::get_collection_params(); // Includes context, page, per_page, search, order, orderby

        $params['parent_part_number'] = [
            'description'       => __('Filter relations by parent part number.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['child_part_number'] = [
            'description'       => __('Filter relations by child part number.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
         $params['level'] = [
            'description'       => __('Filter relations by hierarchy level.'),
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'validate_callback' => 'rest_validate_request_arg',
        ];
         $params['is_required'] = [
            'description'       => __('Filter relations by whether the child is required.'),
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'validate_callback' => 'rest_validate_request_arg',
        ];
         $params['entity_type'] = [
            'description'       => __('Filter relations by the type of the child entity (e.g., accessory, spare_part).'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key', // Use sanitize_key for simple type strings
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['parent_part_number', 'child_part_number', 'level', 'sort_order']); // Add specific orderby fields

        return $params;
    }

    /**
     * 获取关系列表 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_items($request) {
        global $wpdb;

        // 1. Prepare Query Args (using WP standard method)
        $prepared_args = $this->prepare_items_query($request);
        
        // 2. Build WHERE Clauses
        $where_clauses = ["1=1"]; // Start with a tautology

        // Custom Filters
        if (!empty($prepared_args['parent_part_number'])) {
            $where_clauses[] = $wpdb->prepare("parent_part_number = %s", $prepared_args['parent_part_number']);
        }
        if (!empty($prepared_args['child_part_number'])) {
            $where_clauses[] = $wpdb->prepare("child_part_number = %s", $prepared_args['child_part_number']);
        }
        if (isset($prepared_args['level']) && is_numeric($prepared_args['level'])) {
            $where_clauses[] = $wpdb->prepare("level = %d", $prepared_args['level']);
        }
        if (isset($prepared_args['is_required'])) { // Check boolean explicitly
            $where_clauses[] = $wpdb->prepare("is_required = %d", $prepared_args['is_required'] ? 1 : 0);
        }
         if (!empty($prepared_args['entity_type'])) {
            $where_clauses[] = $wpdb->prepare("entity_type = %s", $prepared_args['entity_type']);
        }

        // Search filter (if applicable - searches description perhaps?)
        if (!empty($prepared_args['search'])) {
            $search_term = '%' . $wpdb->esc_like($prepared_args['search']) . '%';
            // Adjust which fields to search
            $where_clauses[] = $wpdb->prepare("(description LIKE %s OR parent_part_number LIKE %s OR child_part_number LIKE %s)", $search_term, $search_term, $search_term);
        }

        $where_sql = implode(" AND ", $where_clauses);
        $base_query = "FROM {$this->table_name}";

        // 3. Get Total Count
        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        $total_items = (int) $wpdb->get_var($total_items_query);

        // 4. Get Paginated Items
        $fields = $this->get_fields_for_response($request); // Get fields based on context
        $select_fields = empty($fields) ? '*' : implode(', ', $fields);
        
        $items_query = $wpdb->prepare(
            "SELECT {$select_fields} {$base_query} WHERE {$where_sql} ORDER BY {$prepared_args['orderby']} {$prepared_args['order']} LIMIT %d OFFSET %d",
            $prepared_args['posts_per_page'],
            $prepared_args['offset']
        );
        $items_db = $wpdb->get_results($items_query);

        // 5. Format Items
        $formatted_items = [];
        if ($items_db) {
            foreach ($items_db as $item_db) {
                $formatted_items[] = $this->format_item_for_response($item_db);
            }
        }

        // 6. Prepare Response with Pagination Headers
        $response = new WP_REST_Response($formatted_items, 200);
        $response = $this->add_pagination_headers($response, $request, $total_items, $prepared_args['posts_per_page']);
        
        return $response;
    }

    /**
     * 获取单个关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        $item_db_object = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db_object) {
            return $this->error_response("Relation with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db_object);
        // Add checks for permissions based on context if needed
        // ... 

        // Prepare response
        $response = new WP_REST_Response($formatted_item, 200);
        // Add any relevant headers like ETag if implementing caching
        // $response->header( 'ETag', wp_hash( serialize( $formatted_item ) ) );
        
        return $response;
    }

    /**
     * 创建关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function create_item($request) {
        global $wpdb;

        $params = $request->get_json_params();
        if (null === $params) {
            $params = $request->get_body_params(); // Fallback for form-data
        }

        // Validate required API fields
        foreach ($this->required_api_fields_for_create as $field) {
            if (!isset($params[$field]) || ($params[$field] === '' && $field !== 'description')) { // Allow empty description
                return $this->error_response("Missing required API field for relation: {$field}", 'missing_api_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Additional DB-level validation if needed (e.g. if part numbers must exist in other tables)
        // For now, we'll assume part numbers are validated elsewhere or are just strings.

        // Check for duplicate relation (parent_part_number AND child_part_number)
        $existing_relation = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE parent_part_number = %s AND child_part_number = %s",
            $data_to_insert['parent_part_number'],
            $data_to_insert['child_part_number']
        ));

        if ($existing_relation) {
            return $this->error_response(
                'This relation (parent_part_number and child_part_number combination) already exists.',
                'duplicate_relation',
                409 // Conflict
            );
        }
        
        // Add created_at and updated_at timestamps
        $current_time = current_time('mysql', 1); // GMT
        $data_to_insert['created_at'] = $current_time;
        $data_to_insert['updated_at'] = $current_time;


        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log('BJT_Relation_Controller DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create relation. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));

        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created relation.', 'retrieve_error', 500);
        }

        $formatted_item = $this->format_item_for_response($created_item_db);
        // Standard WP REST API practice is to return the full object and a 201 status
        $response = new WP_REST_Response($formatted_item, 201);
        // Add location header
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $new_item_id)));
        return $response;
    }

    /**
     * 更新关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        // Check if the relation exists
        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Relation with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true /* is_update */);

        // Prevent changing parent/child part numbers via update for simplicity
        // If this needs to be allowed, more complex validation (checking for resulting duplicates) is needed.
        if (isset($data_to_update['parent_part_number']) || isset($data_to_update['child_part_number'])) {
            // Unset them to prevent update, or return an error
             unset($data_to_update['parent_part_number']);
             unset($data_to_update['child_part_number']);
             // Alternatively: return $this->error_response('Updating parent/child part numbers is not allowed. Delete and recreate the relation instead.', 'update_not_allowed', 400);
        }

        if (empty($data_to_update)) {
            // No valid fields provided for update that are allowed to be changed
            $formatted_existing = $this->format_item_for_response($existing_item_db);
             return new WP_REST_Response($formatted_existing, 200); // Return existing data
            // Or: return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
        }
        
        // Add current timestamp for updated_at
        $data_to_update['updated_at'] = current_time('mysql', 1); // GMT

        $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));

        if ($result === false) {
            error_log('BJT_Relation_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update relation. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        // Fetch the updated item to return it
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve relation after update.', 'retrieve_after_update_error', 500);
        }

        $formatted_item = $this->format_item_for_response($updated_item_db);
        return new WP_REST_Response($formatted_item, 200);
    }

    /**
     * 删除关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        // Check if the item exists before trying to delete
        $item_to_delete = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_to_delete) {
            return $this->error_response("Relation with ID {$id} not found to delete.", 'not_found', 404);
        }

        // Format the item for response *before* deleting it, as per WP REST API practice for DELETE
        $previous = $this->format_item_for_response($item_to_delete);

        $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));

        if ($result === false) {
            error_log('BJT_Relation_Controller DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete relation. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        
        // $wpdb->delete returns the number of rows affected.
        if ($result === 0) {
            // This case should be rare given the existence check above, but good to handle.
            return $this->error_response("Relation with ID {$id} could not be deleted (it may have been deleted by another process).", 'delete_failed_not_found', 404);
        }
        
        // Prepare response data with the deleted item
        $response_data = [
            'deleted'  => true,
            'previous' => $previous,
        ];

        return new WP_REST_Response($response_data, 200);
    }

    /**
     * 获取项目的 Schema (结构定义)
     * Defines the structure and types for a relation item.
     *
     * @return array
     */
    public function get_item_schema() {
         if ($this->schema) {
            return $this->add_additional_fields_schema($this->schema);
        }

        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => $this->resource_name, // Use resource name for title
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __('Unique identifier for the relation.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'parent_part_number' => [
                    'description' => __('Part number of the parent item.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true, // Required for creation
                ],
                'child_part_number' => [
                    'description' => __('Part number of the child item.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true, // Required for creation
                ],
                'level' => [
                    'description' => __('Hierarchy level of the child relative to the ultimate parent (e.g., host model).'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true, // Required for creation
                ],
                'quantity' => [
                    'description' => __('Quantity of the child item required by the parent.'),
                    'type'        => 'integer',
                    'default'     => 1,
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true, // Required for creation
                ],
                 'description' => [
                    'description' => __('Optional description for this relation.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                 ],
                 'sort_order' => [
                    'description' => __('Order in which child items should be displayed.'),
                    'type'        => 'integer',
                    'default'     => 0,
                    'context'     => ['view', 'edit', 'embed'],
                 ],
                 'is_required' => [
                    'description' => __('Indicates if the child part is mandatory for the parent.'),
                    'type'        => 'boolean',
                    'default'     => false,
                    'context'     => ['view', 'edit', 'embed'],
                 ],
                'entity_type' => [
                    'description' => __('Type of the child entity (e.g., accessory, spare_part). Helps interpret the child_part_number.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    // 'enum'     => ['accessory', 'spare_part', 'consumable'], // Define possible types if known
                ],
                 // Timestamps (read-only)
                 'created_at' => [
                     'description' => __( 'The date the relation was created, in the site\'s timezone.' ),
                     'type'        => 'string',
                     'format'      => 'date-time',
                     'context'     => ['view', 'edit', 'embed'],
                     'readonly'    => true,
                 ],
                 'updated_at' => [
                     'description' => __( 'The date the relation was last updated, in the site\'s timezone.' ),
                     'type'        => 'string',
                     'format'      => 'date-time',
                     'context'     => ['view', 'edit', 'embed'],
                     'readonly'    => true,
                 ],
            ],
        ];
        
        $this->schema = $schema; // Cache the schema

        return $this->add_additional_fields_schema($this->schema);
    }

    // Placeholder for mapping/formatting functions if needed
    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];

        foreach ($this->fillable_fields as $db_column) {
            if (isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'level':
                    case 'quantity':
                    case 'sort_order':
                        $data[$db_column] = absint($value);
                        break;
                    case 'is_required':
                        $data[$db_column] = rest_sanitize_boolean($value);
                        break;
                    case 'parent_part_number':
                    case 'child_part_number':
                        // Assuming part numbers are critical and should be handled carefully
                        // Basic sanitization for now, might need more complex validation
                        // (e.g., check if part number exists in respective entity tables)
                        $data[$db_column] = sanitize_text_field(strtoupper(trim($value)));
                        break;
                    case 'entity_type':
                        $data[$db_column] = sanitize_key($value);
                        break;
                    case 'description':
                        $data[$db_column] = sanitize_textarea_field($value);
                        break;
                    default:
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            }
        }
        return $data;
    }

    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }

        $response_data = [];
        // Convert stdClass object to array to easily iterate
        $item_array = (array) $item_db_object;

        // Populate response based on schema properties for consistency
        $schema = $this->get_item_schema();
        foreach ($schema['properties'] as $field_name => $field_props) {
            if (isset($item_array[$field_name])) {
                // Cast to correct type based on schema if necessary (WPDB returns strings mostly)
                switch ($field_props['type']) {
                    case 'integer':
                        $response_data[$field_name] = (int) $item_array[$field_name];
                        break;
                    case 'boolean':
                        $response_data[$field_name] = (bool) $item_array[$field_name];
                        break;
                    default:
                        $response_data[$field_name] = $item_array[$field_name];
                        break;
                }
            } elseif ($field_name === 'id' && isset($item_array['id'])) {
                 $response_data[$field_name] = (int) $item_array['id']; // Ensure ID is always present and int
            }
        }
        
        // Ensure all schema fields are present in the response, even if null
        // (unless explicitly excluded by context, which we are not handling deeply here)
        foreach (array_keys($schema['properties']) as $field_name) {
            if (!array_key_exists($field_name, $response_data)) {
                $response_data[$field_name] = null;
            }
        }

        return $response_data;
    }

} 