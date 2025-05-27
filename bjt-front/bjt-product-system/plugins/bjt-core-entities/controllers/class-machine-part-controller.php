<?php
/**
 * Machine Parts Controller
 */
class BJT_Machine_Part_Controller extends BJT_API_Controller {
    public $resource_name = 'machineparts'; // As per requirements
    protected $table_name;

    // Define all columns from wp_bjt_parts table that can be directly filled or updated
    protected $fillable_fields = [
        'product_line_id',
        'model', // This is the host model code
        'voltage',
        'image_url',
        'part_number',
        'name_zh',
        'name_en',
        'brand',
        'spec',
        'spec_imperial',
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
        // created_at and updated_at are handled by DB
    ];

    // API fields required for creating a new machine part
    protected $required_api_fields_for_create = [
        'product_line_id',
        'model', // Host model code
        'part_number',
        'name_zh',
        'name_en',
        'unit'
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_parts'; // Correct table name
        $this->rest_base = $this->resource_name; 
        parent::__construct();
    }

    /**
     * Register the routes for the objects of the controller.
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'], // 'edit_posts' or custom
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'context' => $this->get_context_param(['default' => 'view']),
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'], // 'edit_posts' or custom
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_delete_permission'], // 'delete_posts' or custom
                'args' => [
                    'force' => [
                        'default' => false,
                        'description' => __('Whether to bypass trash and force deletion.', 'bjt'),
                        'type' => 'boolean',
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);
    }

    /**
     * Retrieves a list of machine parts.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function get_items($request) {
        global $wpdb;

        $page = absint($request->get_param('page') ?: 1);
        $per_page = absint($request->get_param('per_page') ?: 10);
        $offset = ($page - 1) * $per_page;

        $product_line_id = $request->get_param('product_line_id');
        $model = $request->get_param('model'); // Host model code
        $part_number_filter = $request->get_param('part_number');
        $name_search = $request->get_param('name_search');
        $brand = $request->get_param('brand');
        $voltage = $request->get_param('voltage');
        $status_filter = $request->get_param('status');
        $orderby = $request->get_param('orderby') ?: 'id';
        $order = $request->get_param('order') ?: 'DESC';
        
        // Validate orderby and order parameters
        $allowed_orderby = array_merge($this->fillable_fields, ['id', 'created_at', 'updated_at']);
        if (!in_array($orderby, $allowed_orderby)) {
            $orderby = 'id';
        }
        if (!in_array(strtoupper($order), ['ASC', 'DESC'])) {
            $order = 'DESC';
        }

        $base_query = "FROM {$this->table_name}";
        $where_clauses = ["1=1"];
        $query_params = [];

        if (!empty($product_line_id)) {
            $where_clauses[] = "product_line_id = %d";
            $query_params[] = absint($product_line_id);
        }
        if (!empty($model)) {
            $where_clauses[] = "model = %s";
            $query_params[] = sanitize_text_field($model);
        }
        if (!empty($part_number_filter)) {
            $where_clauses[] = "part_number = %s";
            $query_params[] = sanitize_text_field($part_number_filter);
        }
        if (!empty($name_search)) {
            $search_term = '%' . $wpdb->esc_like($name_search) . '%';
            $where_clauses[] = "(name_zh LIKE %s OR name_en LIKE %s)";
            $query_params[] = $search_term;
            $query_params[] = $search_term;
        }
        if (!empty($brand)) {
            $where_clauses[] = "brand = %s";
            $query_params[] = sanitize_text_field($brand);
        }
        if (!empty($voltage)) {
            $where_clauses[] = "voltage = %s";
            $query_params[] = sanitize_text_field($voltage);
        }
        if (!empty($status_filter)) {
            $where_clauses[] = "status = %s";
            $query_params[] = sanitize_text_field($status_filter);
        }

        $where_sql = implode(" AND ", $where_clauses);

        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        if (!empty($query_params)) {
            $total_items = $wpdb->get_var($wpdb->prepare($total_items_query, $query_params));
        } else {
            $total_items = $wpdb->get_var($total_items_query);
        }
        

        $items_query = "SELECT * {$base_query} WHERE {$where_sql} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d";
        $full_query_params = array_merge($query_params, [$per_page, $offset]);
        $items_db = $wpdb->get_results($wpdb->prepare($items_query, $full_query_params));

        $formatted_items = [];
        foreach ($items_db as $item_db) {
            $formatted_items[] = $this->format_item_for_response($item_db, $request);
        }
        
        $total_pages = ceil($total_items / $per_page);

        $response_data = [
            'items' => $formatted_items,
            'total' => (int)$total_items,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => $total_pages
        ];
        
        return new WP_REST_Response(['success' => true, 'data' => $response_data], 200);
    }

    /**
     * Retrieves a single machine part.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return new WP_Error('INVALID_ID', 'Invalid machine part ID.', ['status' => 400, 'success' => false]);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db) {
            return new WP_Error('NOT_FOUND', "Machine part with ID {$id} not found.", ['status' => 404, 'success' => false]);
        }

        $formatted_item = $this->format_item_for_response($item_db, $request);
        return new WP_REST_Response(['success' => true, 'data' => $formatted_item], 200);
    }

    /**
     * Creates a single machine part.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function create_item($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params(); // Fallback for form data
        }

        $required_fields = [
            'product_line_id' => 'Product Line ID',
            'model'           => 'Model',
            'part_number'     => 'Part Number',
            'name_zh'         => 'Name (Chinese)',
            'name_en'         => 'Name (English)',
            'unit'            => 'Unit',
        ];

        foreach ( $required_fields as $field => $label ) {
            if ( empty( $params[ $field ] ) ) {
                return new WP_Error(
                    'MISSING_REQUIRED_FIELD',
                    sprintf( 'Missing required field: %s', $label ),
                    [ 'status' => 400, 'success' => false ]
                );
            }
        }

        // Check for duplicate part_number within the same product_line_id
        $existing_item = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d",
            $params['part_number'],
            $params['product_line_id']
        ));
        if ($existing_item) {
            return new WP_Error(
                'DUPLICATE_ENTRY', 
                'Machine part with this part_number and product_line_id already exists.', 
                ['status' => 409, 'success' => false]
            );
        }

        $data_to_insert = $this->map_request_to_db($params);
        
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish'; // Default status
        }
        $data_to_insert['created_at'] = current_time('mysql', 1);
        $data_to_insert['updated_at'] = current_time('mysql', 1);

        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log("BJT Machine Part DB Insert Error: " . $wpdb->last_error);
            return new WP_Error(
                'DB_ERROR', 
                'Failed to create machine part. Database error.', 
                ['status' => 500, 'success' => false]
            );
        }

        $new_id = $wpdb->insert_id;
        $new_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_id));
        if (!$new_item_db) {
            return new WP_Error(
                'FETCH_AFTER_CREATE_FAILED', 
                'Could not fetch the machine part after creation.', 
                ['status' => 500, 'success' => false]
            );
        }
        
        $formatted_item = $this->format_item_for_response($new_item_db, $request);

        $response_payload = ['success' => true, 'data' => $formatted_item];
        $response = new WP_REST_Response($response_payload, 201);
        $response->header('X-Status-Message', "Machine part created successfully.");
        return $response;
    }

    /**
     * Updates a single machine part.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return new WP_Error('INVALID_ID', 'Invalid machine part ID for update.', ['status' => 400, 'success' => false]);
        }

        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return new WP_Error('NOT_FOUND', "Machine part with ID {$id} not found.", ['status' => 404, 'success' => false]);
        }
        
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params();
        }

        if (empty($params)) {
            return new WP_Error('NO_DATA_PROVIDED', 'No data provided for update.', ['status' => 400, 'success' => false]);
        }

        // Check for part_number conflict if it's being changed
        $check_part_number = isset($params['part_number']) ? $params['part_number'] : $existing_item_db->part_number;
        $check_product_line_id = isset($params['product_line_id']) ? $params['product_line_id'] : $existing_item_db->product_line_id;

        if ( (isset($params['part_number']) || isset($params['product_line_id'])) ) {
            $conflicting_item = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s AND product_line_id = %d AND id != %d",
                $check_part_number,
                $check_product_line_id,
                $id
            ));
            if ($conflicting_item) {
                return new WP_Error(
                    'DUPLICATE_ENTRY', 
                    'Machine part with this part_number and product_line_id already exists.', 
                    ['status' => 409, 'success' => false]
                );
            }
        }
        
        $data_to_update = $this->map_request_to_db($params, true);

        if (empty($data_to_update)) {
             return new WP_Error(
                'NO_UPDATABLE_DATA', 
                'No updatable data provided or data matches existing values.', 
                ['status' => 400, 'success' => false]
            );
        }
        
        $data_to_update['updated_at'] = current_time('mysql');

        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $id]);

        if ($result === false) {
            error_log("BJT Machine Part DB Update Error: " . $wpdb->last_error);
            return new WP_Error(
                'DB_ERROR', 
                'Failed to update machine part. Database error.', 
                ['status' => 500, 'success' => false]
            );
        }
        
        // If $result is 0, it means no rows were affected (data might be the same as existing)
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
         if (!$updated_item_db) {
            return new WP_Error(
                'FETCH_AFTER_UPDATE_FAILED', 
                'Could not fetch the machine part after update.', 
                ['status' => 500, 'success' => false]
            );
        }
        $formatted_item = $this->format_item_for_response($updated_item_db, $request);

        $response_payload = ['success' => true, 'data' => $formatted_item];
        $response = new WP_REST_Response($response_payload, 200);
        $response->header('X-Status-Message', "Machine part updated successfully.");
        return $response;
    }

    /**
     * Deletes a single machine part.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
     */
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return new WP_Error('INVALID_ID', 'Invalid machine part ID for deletion.', ['status' => 400, 'success' => false]);
        }

        $item_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_exists) {
            return new WP_Error('NOT_FOUND', "Machine part with ID {$id} not found.", ['status' => 404, 'success' => false]);
        }

        $result = $wpdb->delete($this->table_name, ['id' => $id], ['%d']);

        if ($result === false) {
            error_log("BJT Machine Part DB Delete Error: " . $wpdb->last_error);
            return new WP_Error(
                'DB_ERROR', 
                "Failed to delete machine part with ID {$id}. Database error.", 
                ['status' => 500, 'success' => false]
            );
        }
        
        $response_data = ['id' => $id, 'message' => "Machine part with ID {$id} deleted successfully."];
        return new WP_REST_Response(['success' => true, 'data' => $response_data], 200);
    }

    /**
     * Maps incoming API request fields to database column names.
     * Also sanitizes data.
     *
     * @param array $params Request parameters.
     * @param boolean $is_update True if this is for an update operation.
     * @return array Mapped and sanitized data.
     */
    protected function map_request_to_db(array $params, $is_update = false) {
        $mapped_data = [];
        $numeric_fields = ['net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs', 'pallet_height_cm', 'pallet_height_inch', 'pallet_gross_weight_kg', 'pallet_gross_weight_lbs'];
        $integer_fields = ['product_line_id', 'pcs_per_box', 'pcs_per_pallet'];

        foreach ($this->fillable_fields as $db_field) {
            if (isset($params[$db_field])) {
                $value = $params[$db_field];
                if (in_array($db_field, $numeric_fields)) {
                    $mapped_data[$db_field] = !empty($value) ? floatval($value) : null;
                } elseif (in_array($db_field, $integer_fields)) {
                     $mapped_data[$db_field] = !empty($value) ? absint($value) : null;
                } else {
                    // For other fields, sanitize as text
                    $mapped_data[$db_field] = sanitize_text_field($value);
                }
            } elseif ($is_update && array_key_exists($db_field, $params) && $params[$db_field] === null) {
                 // Allow explicitly setting fields to null on update
                $mapped_data[$db_field] = null;
            }
        }
        return $mapped_data;
    }
    
    /**
     * Formats a database object for the API response.
     *
     * @param object $item_db_object The database object.
     * @param WP_REST_Request $request The request object.
     * @return array The formatted data.
     */
    protected function format_item_for_response($item_db_object, $request) {
        if (!$item_db_object) {
            return null;
        }
        $data = [];
        $schema = $this->get_item_schema($request); // Get schema for properties
        
        foreach ($schema['properties'] as $field_name => $field_schema) {
            if (property_exists($item_db_object, $field_name)) {
                $value = $item_db_object->$field_name;
                // Cast to correct type based on schema (simple casting)
                if (isset($field_schema['type'])) {
                    if ($field_schema['type'] === 'integer') {
                        $value = (int) $value;
                    } elseif ($field_schema['type'] === 'number') {
                        $value = (float) $value;
                    } elseif ($field_schema['type'] === 'boolean') {
                        $value = (bool) $value;
                    }
                }
                $data[$field_name] = $value;
            }
        }
        return $data;
    }

    /**
     * Get the query params for collections
     *
     * @return array
     */
    public function get_collection_params() {
        $params = parent::get_collection_params(); // Gets 'page', 'per_page', 'search', 'context'
        
        $params['product_line_id'] = [
            'description' => __('Filter by Product Line ID.', 'bjt'),
            'type' => 'integer',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['model'] = [
            'description' => __('Filter by Host Model code.', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['part_number'] = [
            'description' => __('Filter by exact Part Number.', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['name_search'] = [
            'description' => __('Search in Chinese or English name.', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['brand'] = [
            'description' => __('Filter by Brand.', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['voltage'] = [
            'description' => __('Filter by Voltage.', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['status'] = [
            'description' => __('Filter by Status (e.g., publish, draft).', 'bjt'),
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
         $params['orderby'] = [
            'description' => __('Sort collection by object attribute.', 'bjt'),
            'type'        => 'string',
            'default'     => 'id',
            'enum'        => array_merge($this->fillable_fields, ['id', 'created_at', 'updated_at']),
        ];
        $params['order'] = [
            'description' => __('Order sort attribute ascending or descending.', 'bjt'),
            'type'        => 'string',
            'default'     => 'desc',
            'enum'        => ['asc', 'desc'],
        ];
        return $params;
    }

    /**
     * Get the item schema, conforming to JSON Schema.
     *
     * @return array
     */
    public function get_item_schema() { // Renamed to match parent, but WP calls get_public_item_schema
         $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => $this->resource_name,
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __('Unique identifier for the machine part.', 'bjt'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'product_line_id' => [
                    'description' => __('Product Line ID this part belongs to.', 'bjt'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'model' => [ // Host model code
                    'description' => __('Host model code this part is associated with.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'voltage' => [
                    'description' => __('Voltage specification.', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'image_url' => [
                    'description' => __('URL of the part image.', 'bjt'),
                    'type'        => ['string', 'null'],
                    'format'      => 'uri',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'part_number' => [
                    'description' => __('Unique part number.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'name_zh' => [
                    'description' => __('Chinese name of the part.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'name_en' => [
                    'description' => __('English name of the part.', 'bjt'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'brand' => [
                    'description' => __('Brand of the part.', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'spec' => [
                    'description' => __('Metric specifications.', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'spec_imperial' => [
                    'description' => __('Imperial specifications.', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'package_size_cm' => [
                    'description' => __('Package size (cm).', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'package_size_inch' => [
                    'description' => __('Package size (inch).', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'net_weight_kg' => [
                    'description' => __('Net weight (kg).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'net_weight_lbs' => [
                    'description' => __('Net weight (lbs).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'gross_weight_kg' => [
                    'description' => __('Gross weight (kg).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'gross_weight_lbs' => [
                    'description' => __('Gross weight (lbs).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pcs_per_box' => [
                    'description' => __('Pieces per box.', 'bjt'),
                    'type'        => ['integer', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_size_cm' => [
                    'description' => __('Pallet size (cm).', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_size_inch' => [
                    'description' => __('Pallet size (inch).', 'bjt'),
                    'type'        => ['string', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pcs_per_pallet' => [
                    'description' => __('Pieces per pallet.', 'bjt'),
                    'type'        => ['integer', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_height_cm' => [
                    'description' => __('Pallet height (cm).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_height_inch' => [
                    'description' => __('Pallet height (inch).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_gross_weight_kg' => [
                    'description' => __('Pallet gross weight (kg).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'pallet_gross_weight_lbs' => [
                    'description' => __('Pallet gross weight (lbs).', 'bjt'),
                    'type'        => ['number', 'null'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'status' => [
                    'description' => __('Status of the part.', 'bjt'),
                    'type'        => 'string',
                    'enum'        => ['publish', 'draft', 'trash', 'pending', 'private'],
                    'default'     => 'publish',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'unit' => [
                    'description' => __('Unit of measure (e.g., pcs, roll, box).', 'bjt'),
                    'type'        => 'string',
                    'default'     => 'pcs',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'created_at' => [
                    'description' => __('The date the item was created, in the site\'s timezone.', 'bjt'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'updated_at' => [
                    'description' => __('The date the item was last updated, in the site\'s timezone.', 'bjt'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
            ],
        ];
        return $this->add_additional_fields_schema($schema);
    }

    /**
     * Check permissions for reading items.
     *
     * @param WP_REST_Request $request Current request.
     */
    public function check_read_permission($request) {
        error_log('[BJT_Machine_Part_Controller] Checking read permission');
        
        // Allow if the user can read posts in general, or adjust to a more specific capability.
        if (!class_exists('BJT_Auth_Controller')) {
            // Attempt to include the BJT_Auth_Controller file if it's not found.
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Machine_Part_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Machine_Part_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Machine_Part_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Machine_Part_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 检查用户是否有权限查看机器部件
        // 这里我们使用一个更具体的权限检查，而不是通用的 'read' 权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Machine_Part_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Machine_Part_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色
        $has_permission = false;
        if (isset($user->role)) {
            $allowed_roles = [ 'admin','sales', 'partner','customer'];
            $has_permission = in_array($user->role, $allowed_roles);
        }

        if (!$has_permission) {
            error_log('[BJT_Machine_Part_Controller] User does not have required role: ' . $user->username);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to view machine parts.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Machine_Part_Controller] Read permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Check if a given request has permission to create an item.
     * For machine parts, this might be restricted to users who can 'edit_products' or a custom capability.
     */
    public function check_write_permission($request) {
        // Using 'edit_posts' as a general capability for creating/editing content.
        // Replace with a more specific capability if defined, e.g., 'edit_bjt_machine_parts'.
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
             return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        if (!current_user_can('edit_posts')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update machine parts.', 'bjt'),
                ['status' => rest_authorization_required_code(), 'success' => false]
            );
        }
        return true;
    }
    
    /**
     * Check if a given request has permission to delete an item.
     * For machine parts, this might be restricted to users who can 'delete_products' or a custom capability.
     */
    public function check_delete_permission($request) {
        // Using 'delete_posts' as a general capability.
        // Replace with a more specific capability if defined, e.g., 'delete_bjt_machine_parts'.
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        if (!current_user_can('delete_posts')) {
             return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete machine parts.', 'bjt'),
                ['status' => rest_authorization_required_code(), 'success' => false]
            );
        }
        return true;
    }
} 