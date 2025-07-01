<?php
/**
 * 标签控制器
 */
class BJT_Tag_Controller extends BJT_API_Controller {
    public $resource_name = 'tags';
    protected $table_name;

    protected $fillable_fields = [
        'name',
        'slug',
        'description'
    ];

    protected $required_api_fields_for_create = [
        'name' // Slug can be auto-generated if not provided
    ];

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_tags'; // Assuming table is wp_bjt_tags
        $this->resource_name = 'tags';
        $this->rest_base = $this->resource_name;
        parent::__construct();
        error_log("BJT_Tag_Controller initialized.");
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
                        'description' => __('Unique identifier for the tag.'),
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
                        'description' => __('Unique identifier for the tag.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'force' => [
                        'type'        => 'boolean',
                        'default'     => true, // Tags usually hard deleted
                        'description' => __('Whether to force deletion.'),
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);
    }

    public function get_collection_params() {
        $params = parent::get_collection_params();
        $params['slug'] = [
            'description'       => __('Filter tags by slug.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['name', 'slug']);
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
                    'description' => __('Unique identifier for the tag.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'name' => [
                    'description' => __('The name of the tag.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                 ],
                 'slug' => [
                    'description' => __('An alphanumeric identifier for the tag.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    // Slug might be readonly if auto-generated from name
                 ],
                 'description' => [
                    'description' => __('A description for the tag.'),
                    'type'        => 'string',
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

        if (!empty($prepared_args['slug'])) {
            $where_clauses[] = $wpdb->prepare("slug = %s", $prepared_args['slug']);
        }
        if (!empty($prepared_args['search'])) {
            $search_term = '%' . $wpdb->esc_like($prepared_args['search']) . '%';
            $where_clauses[] = $wpdb->prepare("(name LIKE %s OR slug LIKE %s OR description LIKE %s)", 
                                            $search_term, $search_term, $search_term);
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
        $id = absint($request['id']);
        if ($id <= 0) {
            return $this->error_response('Invalid tag ID.', 'invalid_id', 400);
        }
        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_db) {
            return $this->error_response("Tag with ID {$id} not found.", 'not_found', 404);
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
        
        if (empty($data_to_insert['slug'])) {
            $data_to_insert['slug'] = sanitize_title($data_to_insert['name']);
        }
        
        // Check for duplicate slug
        $existing_item = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE slug = %s", $data_to_insert['slug']));
        if ($existing_item) {
            return $this->error_response('Tag with this slug already exists.', 'duplicate_slug', 409);
        }

        $current_time = current_time('mysql', 1);
        $data_to_insert['created_at'] = $current_time;
        $data_to_insert['updated_at'] = $current_time;

        $result = $wpdb->insert($this->table_name, $data_to_insert);
        if ($result === false) {
            error_log('BJT_Tag_Controller DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create tag. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created tag.', 'retrieve_error', 500);
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
            return $this->error_response('Invalid tag ID.', 'invalid_id', 400);
        }
        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Tag with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true);

        // Check for duplicate slug if slug is being changed
        if (isset($data_to_update['slug']) && $data_to_update['slug'] !== $existing_item_db->slug) {
            $item_with_new_slug = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE slug = %s AND id != %d",
                $data_to_update['slug'], $id
            ));
            if ($item_with_new_slug) {
                return $this->error_response('Another tag with this slug already exists.', 'duplicate_slug_on_update', 409);
            }
        }

        if (empty($data_to_update)) {
            $data = $this->prepare_item_for_response($existing_item_db, $request);
            return rest_ensure_response($data);
        }

        $data_to_update['updated_at'] = current_time('mysql', 1);

        $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));
        if ($result === false) {
            error_log('BJT_Tag_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update tag. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve tag after update.', 'retrieve_after_update_error', 500);
        }
        $data = $this->prepare_item_for_response($updated_item_db, $request);
        return rest_ensure_response($data);
    }

    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        if ($id <= 0) {
            return $this->error_response('Invalid tag ID.', 'invalid_id', 400);
        }
        $item_to_delete = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_to_delete) {
            return $this->error_response("Tag with ID {$id} not found to delete.", 'not_found', 404);
        }

        $previous = $this->prepare_item_for_response($item_to_delete, $request);

        // TODO: Before deleting a tag, we should remove associations from wp_bjt_item_tags table.
        // $wpdb->delete($wpdb->prefix . 'bjt_item_tags', array('tag_id' => $id), array('%d'));

        $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));
        if ($result === false) {
            error_log('BJT_Tag_Controller DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete tag. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }
        if ($result === 0) {
            return $this->error_response("Tag with ID {$id} could not be deleted.", 'delete_failed', 404);
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
            if (isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'name':
                        $data[$db_column] = sanitize_text_field($value);
                        if (empty($params['slug'])) { // Auto-generate/update slug if slug is empty
                            $data['slug'] = sanitize_title($value);
                        }
                        break;
                    case 'slug':
                        $data[$db_column] = sanitize_title($value);
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
        // If creating and slug is still not set (e.g. name wasn't in params, or slug was explicitly empty)
        if (!$is_update && empty($data['slug']) && isset($data['name'])){
             $data['slug'] = sanitize_title($data['name']);
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
                // Let prepare_item_for_response handle this
             }
         }
         if(isset($item_array['id'])) $response_data['id'] = (int) $item_array['id'];

         return $response_data;
    }
    
    public function prepare_item_for_response( $item, $request ) {
        $data = $this->format_item_for_response($item);
        $context = ! empty( $request['context'] ) ? $request['context'] : 'view';
        $data    = $this->add_additional_fields_to_object( $data, $request );
        $data    = $this->filter_response_by_context( $data, $context );
        $response = rest_ensure_response( $data );
        $response->add_links( $this->prepare_links( $item->id ) );
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
        );
    }

    /**
     * Check read permission
     */
    public function check_read_permission($request) {
        return true; // 允许所有用户读取标签
    }

    /**
     * Check write permission
     */
    public function check_write_permission($request) {
        error_log('[BJT_Tag_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Tag_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Tag_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Tag_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Tag_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Tag_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Tag_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以管理标签
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin', 'manager'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('manage_tags', $user->permissions) || 
                                    in_array('manage_products', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_Tag_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to manage tags.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Tag_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }
} 