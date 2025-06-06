<?php
/**
 * 区域控制器
 */
class BJT_Region_Controller extends BJT_API_Controller {
    public $resource_name = 'regions';
    protected $table_name;

    // Database fields
    protected $fillable_fields = [
        'code',
        'name_zh',
        'name_en',
        'currency', // Default currency for the region
        'status'    // e.g., 'active', 'inactive'
    ];

    // API fields needed for creation
    protected $required_api_fields_for_create = [
        'code',
        'name_zh',
        'name_en',
        'currency'
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_regions';
        $this->resource_name = 'regions';
        $this->rest_base = $this->resource_name;
        parent::__construct();
        error_log("BJT_Region_Controller initialized.");
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

        // Use code as the identifier in the route
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<code>[a-zA-Z0-9_-]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'code' => [
                        'description' => __('Unique code for the region (e.g., CN, US).'),
                        'type' => 'string',
                        'required' => true,
                        'sanitize_callback' => 'sanitize_key',
                        'validate_callback' => function($param, $request, $key) {
                            return is_string($param) && !empty($param);
                         }
                    ],
                    'context' => $this->get_context_param(['default' => 'view']),
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                 // Args are defined in get_endpoint_args_for_item_schema, but route param 'code' needs context here too.
                'args' => array_merge([
                     'code' => [
                        'description' => __('Unique code for the region to update.'),
                        'type' => 'string',
                        'required' => true,
                        'sanitize_callback' => 'sanitize_key',
                         'validate_callback' => function($param, $request, $key) {
                            return is_string($param) && !empty($param);
                         }
                    ]],
                    $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE)
                ),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                     'code' => [
                        'description' => __('Unique code for the region.'),
                        'type' => 'string',
                        'required' => true,
                        'sanitize_callback' => 'sanitize_key',
                         'validate_callback' => function($param, $request, $key) {
                            return is_string($param) && !empty($param);
                         }
                    ],
                    'force' => [
                        'type'        => 'boolean',
                        'default'     => false,
                        'description' => __('Whether to force deletion or just deactivate.'),
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);
    }

    public function get_collection_params() {
        $params = parent::get_collection_params();
        $params['currency'] = [
            'description'       => __('Filter regions by currency code.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['status'] = [
            'description'       => __('Filter regions by status.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
            'enum'              => ['active', 'inactive']
        ];
        $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['code', 'name_zh', 'name_en', 'currency', 'status']);

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
                 'code' => [
                    'description' => __('Unique code for the region (e.g., CN, US).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true, // Code is usually immutable once created
                    'required'    => true,
                 ],
                 'name_zh' => [
                    'description' => __('Chinese name for the region.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                 ],
                 'name_en' => [
                    'description' => __('English name for the region.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                     'required'    => true,
                 ],
                 'currency' => [
                    'description' => __('Default currency code for the region (e.g., CNY, USD).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                     'required'    => true,
                 ],
                 'status' => [
                    'description' => __('Region status.'),
                    'type'        => 'string',
                    'default'     => 'active',
                    'enum'        => ['active', 'inactive'],
                    'context'     => ['view', 'edit', 'embed'],
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

        if (!empty($prepared_args['currency'])) {
            $where_clauses[] = $wpdb->prepare("currency = %s", $prepared_args['currency']);
        }
        if (!empty($prepared_args['status'])) {
            $where_clauses[] = $wpdb->prepare("status = %s", $prepared_args['status']);
        }
        if (!empty($prepared_args['search'])) {
            $search_term = '%' . $wpdb->esc_like($prepared_args['search']) . '%';
            $where_clauses[] = $wpdb->prepare("(code LIKE %s OR name_zh LIKE %s OR name_en LIKE %s OR currency LIKE %s)", 
                                            $search_term, $search_term, $search_term, $search_term);
        }

        $where_sql = implode(" AND ", $where_clauses);
        $base_query = "FROM {$this->table_name}";

        $total_items_query = "SELECT COUNT(code) {$base_query} WHERE {$where_sql}"; // Count by code (PK)
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
                $data = $this->prepare_item_for_response($item_db, $request);
                $formatted_items[] = $this->prepare_response_for_collection($data);
            }
        }

        $response = new WP_REST_Response($formatted_items, 200);
        $response = $this->add_pagination_headers($response, $request, $total_items, $prepared_args['posts_per_page']);
        
        return $response;
    }

    public function get_item($request) {
        global $wpdb;
        $code = sanitize_key($request['code']);
        if (empty($code)) {
            return $this->error_response('Invalid region code.', 'invalid_code', 400);
        }
        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $code));
        if (!$item_db) {
            return $this->error_response("Region with code '{$code}' not found.", 'not_found', 404);
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

        // Ensure code is present after mapping (should be guaranteed by required check)
        if (empty($data_to_insert['code'])) {
             return $this->error_response("Region code cannot be empty.", 'invalid_code', 400);
        }
        
        // Check if region code already exists
        $existing_item = $wpdb->get_var($wpdb->prepare("SELECT code FROM {$this->table_name} WHERE code = %s", $data_to_insert['code']));
        if ($existing_item) {
            return $this->error_response('Region with this code already exists.', 'duplicate_region_code', 409);
        }

        $current_time = current_time('mysql', 1);
        $data_to_insert['created_at'] = $current_time;
        $data_to_insert['updated_at'] = $current_time;

        $result = $wpdb->insert($this->table_name, $data_to_insert);
        if ($result === false) {
            error_log('BJT_Region_Controller DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create region. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        // Fetch by code since insert_id is not relevant when PK is not auto-increment
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $data_to_insert['code']));
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created region.', 'retrieve_error', 500);
        }

        $data = $this->prepare_item_for_response($created_item_db, $request);
        $response = rest_ensure_response($data);
        $response->set_status(201);
        $response->header('Location', rest_url(sprintf('%s/%s/%s', $this->namespace, $this->rest_base, $data_to_insert['code'])));
        return $response;
    }

    public function update_item($request) {
        global $wpdb;
        $code = sanitize_key($request['code']);
         if (empty($code)) {
            return $this->error_response('Invalid region code for update.', 'invalid_code', 400);
        }
        
        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $code));
        if (!$existing_item_db) {
            return $this->error_response("Region with code '{$code}' not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true); // is_update = true

        if (empty($data_to_update)) {
            $data = $this->prepare_item_for_response($existing_item_db, $request);
            return rest_ensure_response($data); // Return existing if no valid fields
        }

        $data_to_update['updated_at'] = current_time('mysql', 1);

        // WHERE clause uses the code (PK)
        $result = $wpdb->update($this->table_name, $data_to_update, array('code' => $code)); 
        if ($result === false) {
            error_log('BJT_Region_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update region. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $code));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve region after update.', 'retrieve_after_update_error', 500);
        }
        $data = $this->prepare_item_for_response($updated_item_db, $request);
        return rest_ensure_response($data);
    }

    public function delete_item($request) {
        global $wpdb;
        $code = sanitize_key($request['code']);
         if (empty($code)) {
            return $this->error_response('Invalid region code for delete.', 'invalid_code', 400);
        }
        
        $force = isset($request['force']) ? (bool) $request['force'] : false;

        $item_to_delete = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $code));
        if (!$item_to_delete) {
            return $this->error_response("Region with code '{$code}' not found to delete.", 'not_found', 404);
        }

        // Check dependencies (e.g., are there prices/inventory using this region?)
        // If dependencies exist and not forcing, maybe deactivate instead or return error.
        // Simplified: We proceed based on force flag.

        $previous = $this->prepare_item_for_response($item_to_delete, $request);

        if ($force) {
            // Hard delete
            $result = $wpdb->delete($this->table_name, array('code' => $code), array('%s'));
             if ($result === false) {
                 error_log('BJT_Region_Controller DB Delete Error: ' . $wpdb->last_error);
                 return $this->error_response('Failed to delete region. DB Error: ' . $wpdb->last_error, 'db_error', 500);
             }
             if ($result === 0) {
                 return $this->error_response("Region with code '{$code}' could not be deleted.", 'delete_failed', 404);
             }
             $response_data = [
                'deleted'  => true,
                'previous' => $previous->get_data(),
             ];
             $status = 200;

        } else {
            // Soft delete (set status to inactive)
            if ($item_to_delete->status === 'inactive') {
                 return $this->error_response("Region with code '{$code}' is already inactive.", 'already_inactive', 400);
            }
            $update_data = ['status' => 'inactive', 'updated_at' => current_time('mysql', 1)];
            $result = $wpdb->update($this->table_name, $update_data, array('code' => $code));
             if ($result === false) {
                 error_log('BJT_Region_Controller DB Deactivation Error: ' . $wpdb->last_error);
                 return $this->error_response('Failed to deactivate region. DB Error: ' . $wpdb->last_error, 'db_error', 500);
             }
             // Fetch the updated (deactivated) item
             $deactivated_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE code = %s", $code));
             $response_data = $this->prepare_item_for_response($deactivated_item, $request)->get_data();
             $status = 200;
        }

        return new WP_REST_Response($response_data, $status);
    }

    // --- Helper Methods ---
    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        $params = $request->get_params();
        $data = [];
         foreach ($this->fillable_fields as $db_column) {
             if ($db_column === 'code' && $is_update) {
                 continue; 
             }
             if (isset($params[$db_column])) {
                 $value = $params[$db_column];
                 switch ($db_column) {
                     case 'code':
                     case 'currency':
                     case 'status':
                          $data[$db_column] = sanitize_key($value);
                          break;
                     case 'name_zh':
                     case 'name_en':
                          $data[$db_column] = sanitize_text_field($value);
                          break;
                     default:
                          $data[$db_column] = sanitize_text_field($value);
                         break;
                 }
             }
         }
         if (!$is_update && !array_key_exists('status', $data)) {
             $data['status'] = 'active';
         }
         return $data;
    }

    protected function format_item_for_response($item_db_object) {
         if (!$item_db_object) return null;
         $item_array = (array) $item_db_object;
         $response_data = [];
         $schema = $this->get_item_schema();
         foreach (array_keys($schema['properties']) as $field_name) {
             if (isset($item_array[$field_name])) {
                 $response_data[$field_name] = $item_array[$field_name];
             } else {
                // Let prepare_item handle missing fields based on context
             }
         }
         // Ensure PK is always present
         if (isset($item_array['code'])) $response_data['code'] = $item_array['code'];

         return $response_data;
    }
    
     /**
	 * Prepares a single region output for response.
	 */
	public function prepare_item_for_response( $item, $request ) {
        $data = $this->format_item_for_response($item);
        $context = ! empty( $request['context'] ) ? $request['context'] : 'view';
        $data    = $this->add_additional_fields_to_object( $data, $request );
        $data    = $this->filter_response_by_context( $data, $context );
        $response = rest_ensure_response( $data );
        $response->add_links( $this->prepare_links( $item->code ) ); 
        return $response;
	}

    protected function prepare_links($code) {
        $base = sprintf( '/%s/%s', $this->namespace, $this->rest_base );
        return array(
            'self' => array(
                'href' => rest_url( trailingslashit( $base ) . $code ),
            ),
            'collection' => array(
                'href' => rest_url( $base ),
            ),
        );
    }

    /**
     * Check read permission
     */
    public function check_read_permission($request) {
        return true; // 允许所有用户读取区域信息
    }

    /**
     * Check write permission
     */
    public function check_write_permission($request) {
        error_log('[BJT_Region_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Region_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Region_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Region_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Region_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Region_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Region_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以管理区域
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('manage_regions', $user->permissions) || 
                                    in_array('manage_system', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_Region_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to manage regions.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Region_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }
} 