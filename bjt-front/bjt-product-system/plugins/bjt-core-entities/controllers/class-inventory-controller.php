<?php
/**
 * 库存控制器
 */
class BJT_Inventory_Controller extends BJT_API_Controller {
    protected $resource_name = 'inventory';
    protected $table_name;

    // Database fields
    protected $fillable_fields = [
        'part_number',
        'region', // e.g., 'CN', 'US', 'EU'
        'quantity',
        'status'    // e.g., 'in_stock', 'out_of_stock', 'low_stock', 'discontinued'
    ];

    // API fields needed for creation
    protected $required_api_fields_for_create = [
        'part_number',
        'region',
        'quantity'
        // 'status' will default if not provided
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_inventory';
        $this->resource_name = 'inventory';
        $this->rest_base = $this->resource_name;
        parent::__construct();
        error_log("BJT_Inventory_Controller initialized.");
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_collection_params(),
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
                        'description' => __('Unique identifier for the inventory record.'),
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
                        'description' => __('Unique identifier for the inventory record.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'force' => [
                        'type'        => 'boolean',
                        'default'     => false,
                        'description' => __('Whether to bypass trash and force deletion.'), // Use true for hard delete
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);
    }

    public function get_collection_params() {
        $params = parent::get_collection_params();
        $params['part_number'] = [
            'description'       => __('Filter inventory by part number.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['region'] = [
            'description'       => __('Filter inventory by region code.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['status'] = [
            'description'       => __('Filter inventory by status.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
            'enum'           => ['in_stock', 'out_of_stock', 'low_stock', 'discontinued'] // Define allowed statuses
        ];
        $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['part_number', 'region', 'quantity', 'status']);

        return $params;
    }

    public function get_item_schema() {
         if ($this->schema) {
            return $this->add_additional_fields_schema($this->schema);
        }
        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => $this->resource_name,
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __('Unique identifier for the inventory record.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'part_number' => [
                    'description' => __('Part number of the item.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'region' => [
                    'description' => __('Region code (e.g., CN, US, EU).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'quantity' => [
                    'description' => __('Available quantity in stock.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'status' => [
                    'description' => __('Inventory status (e.g., in_stock, out_of_stock).'),
                    'type'        => 'string',
                    'default'     => 'in_stock', // Default status
                    'context'     => ['view', 'edit', 'embed'],
                    'enum'     => ['in_stock', 'out_of_stock', 'low_stock', 'discontinued'],
                ],
                'created_at' => [
                    'description' => __( 'The date the record was created.' ),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'updated_at' => [
                    'description' => __( 'The date the record was last updated.' ),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
            ],
        ];
        $this->schema = $schema;
        return $this->add_additional_fields_schema($this->schema);
    }

    // --- CRUD Methods Implementation ---
    public function get_items($request) {
        global $wpdb;
        $prepared_args = $this->prepare_items_query($request);
        $where_clauses = ["1=1"];

        if (!empty($prepared_args['part_number'])) {
            $where_clauses[] = $wpdb->prepare("part_number = %s", $prepared_args['part_number']);
        }
        if (!empty($prepared_args['region'])) {
            $where_clauses[] = $wpdb->prepare("region = %s", $prepared_args['region']);
        }
        if (!empty($prepared_args['status'])) {
            $where_clauses[] = $wpdb->prepare("status = %s", $prepared_args['status']);
        }
        if (!empty($prepared_args['search'])) {
            $search_term = '%' . $wpdb->esc_like($prepared_args['search']) . '%';
            $where_clauses[] = $wpdb->prepare("(part_number LIKE %s OR region LIKE %s)", $search_term, $search_term);
        }

        $where_sql = implode(" AND ", $where_clauses);
        $base_query = "FROM {$this->table_name}";

        $total_items_query = "SELECT COUNT(id) {$base_query} WHERE {$where_sql}";
        $total_items = (int) $wpdb->get_var($total_items_query);

        $fields = $this->get_fields_for_response($request);
        $select_fields = empty($fields) ? '*' : implode(', ', $fields);
        
        $items_query = $wpdb->prepare(
            "SELECT {$select_fields} {$base_query} WHERE {$where_sql} ORDER BY {$prepared_args['orderby']} {$prepared_args['order']} LIMIT %d OFFSET %d",
            $prepared_args['posts_per_page'],
            $prepared_args['offset']
        );
        $items_db = $wpdb->get_results($items_query);

        $formatted_items = [];
        if ($items_db) {
            foreach ($items_db as $item_db) {
                $data = $this->prepare_item_for_response($item_db, $request); // Use WP standard prepare method
                $formatted_items[] = $this->prepare_response_for_collection($data); // Use WP standard response prep
            }
        }

        $response = new WP_REST_Response($formatted_items, 200);
        $response = $this->add_pagination_headers($response, $request, $total_items, $prepared_args['posts_per_page']);
        
        return $response;
    }

    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        if ($id <= 0) {
            return $this->error_response('Invalid inventory ID.', 'invalid_id', 400);
        }
        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_db) {
            return $this->error_response("Inventory record with ID {$id} not found.", 'not_found', 404);
        }
        $data     = $this->prepare_item_for_response($item_db, $request);
        $response = rest_ensure_response($data);
        return $response;
    }

    public function create_item($request) {
        global $wpdb;
        $params = $request->get_json_params();
        if (null === $params) $params = $request->get_body_params();

        foreach ($this->required_api_fields_for_create as $field) {
            if (!isset($params[$field])) {
                return $this->error_response("Missing required field: {$field}", 'missing_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Check for duplicate part_number/region combination
        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE part_number = %s AND region = %s",
            $data_to_insert['part_number'],
            $data_to_insert['region']
        ));
        if ($existing_item) {
            return $this->error_response('Inventory record for this part number and region already exists.', 'duplicate_inventory', 409);
        }

        $current_time = current_time('mysql', 1);
        $data_to_insert['created_at'] = $current_time;
        $data_to_insert['updated_at'] = $current_time;

        $result = $wpdb->insert($this->table_name, $data_to_insert);
        if ($result === false) {
            error_log('BJT_Inventory_Controller DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create inventory record. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created inventory record.', 'retrieve_error', 500);
        }

        $data = $this->prepare_item_for_response($created_item_db, $request);
        $response = rest_ensure_response($data);
        $response->set_status(201);
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $new_item_id)));
        return $response;
    }

    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        if ($id <= 0) {
            return $this->error_response('Invalid inventory ID.', 'invalid_id', 400);
        }
        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Inventory record with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true);

        // Prevent changing part_number or region on update
        if (isset($data_to_update['part_number'])) unset($data_to_update['part_number']);
        if (isset($data_to_update['region'])) unset($data_to_update['region']);

        if (empty($data_to_update)) {
            $data = $this->prepare_item_for_response($existing_item_db, $request);
            return rest_ensure_response($data); // Return existing if no valid fields
        }

        $data_to_update['updated_at'] = current_time('mysql', 1);

        $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));
        if ($result === false) {
            error_log('BJT_Inventory_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update inventory record. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve inventory record after update.', 'retrieve_after_update_error', 500);
        }
        $data = $this->prepare_item_for_response($updated_item_db, $request);
        return rest_ensure_response($data);
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        if ($id <= 0) {
            return $this->error_response('Invalid inventory ID.', 'invalid_id', 400);
        }
        $item_to_delete = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_to_delete) {
            return $this->error_response("Inventory record with ID {$id} not found to delete.", 'not_found', 404);
        }

        $previous = $this->prepare_item_for_response($item_to_delete, $request);

        $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));
        if ($result === false) {
            error_log('BJT_Inventory_Controller DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete inventory record. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        if ($result === 0) {
            return $this->error_response("Inventory record with ID {$id} could not be deleted.", 'delete_failed', 404);
        }

        $response = new WP_REST_Response();
        $response->set_data(array(
            'deleted'  => true,
            'previous' => $previous->get_data(),
        ));
        return $response;
    }

    // --- Helper Methods ---
    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];
         foreach ($this->fillable_fields as $db_column) {
            // Only include fields explicitly set in the request
            if (isset($params[$db_column])) {
                 $value = $params[$db_column];
                switch ($db_column) {
                    case 'quantity':
                        $data[$db_column] = absint($value);
                        break;
                    case 'part_number':
                         $data[$db_column] = sanitize_text_field(strtoupper(trim($value)));
                         break;
                    case 'region':
                    case 'status':
                         $data[$db_column] = sanitize_key($value);
                         break;
                    default:
                         $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            }
         }
         // Set default status on create if not provided and not explicitly set to null
         if (!$is_update && !array_key_exists('status', $data)) {
             $data['status'] = 'in_stock';
         }
         return $data;
    }
    
    /**
	 * Prepares a single inventory output for response.
	 *
	 * @param stdClass $item Inventory object from database.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
        $data = $this->format_item_for_response($item); // Use our basic formatter
        $context = ! empty( $request['context'] ) ? $request['context'] : 'view';
        $data    = $this->add_additional_fields_to_object( $data, $request );
        $data    = $this->filter_response_by_context( $data, $context );

        // Wrap the data in a response object.
        $response = rest_ensure_response( $data );

        // Add links.
        $response->add_links( $this->prepare_links( $item->id ) ); // Assuming prepare_links method exists/is inherited

        return $response;
	}

    protected function prepare_links($id) {
        $base = sprintf( '/%s/%s', $this->namespace, $this->rest_base );
        return array(
            'self' => array(
                'href' => rest_url( trailingslashit( $base ) . $id ),
            ),
            'collection' => array(
                'href' => rest_url( $base ),
            ),
            // Add other links like associated part if needed
        );
    }

    protected function format_item_for_response($item_db_object) {
         if (!$item_db_object) return null;
         $item_array = (array) $item_db_object;
         $response_data = [];
         $schema = $this->get_item_schema();
         foreach (array_keys($schema['properties']) as $field_name) {
             if (isset($item_array[$field_name])) {
                 switch ($schema['properties'][$field_name]['type']) {
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
             } else {
                 // Don't set null by default, let prepare_item_for_response handle context filtering
             }
         }
         // Ensure required fields always present if they exist in DB object
          if (isset($item_array['id'])) $response_data['id'] = (int) $item_array['id'];
          if (isset($item_array['part_number'])) $response_data['part_number'] = $item_array['part_number'];
          if (isset($item_array['region'])) $response_data['region'] = $item_array['region'];
          if (isset($item_array['quantity'])) $response_data['quantity'] = (int) $item_array['quantity'];

         return $response_data;
    }
} 