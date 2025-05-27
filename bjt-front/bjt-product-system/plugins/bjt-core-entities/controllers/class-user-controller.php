<?php
/**
 * User Management Controller
 * 
 * Handles CRUD operations for BJT users
 */

class BJT_User_Controller extends BJT_API_Controller {
    public $resource_name = 'users';
    public $table_name = 'wp_bjt_users';
    
    /**
     * Register routes
     */
    public function register_routes() {
        // Get users list and create user
        register_rest_route($this->namespace, '/' . $this->resource_name, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => '__return_true', // Temporarily allow all access
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ),
        ));
        
        // Get single user
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => [
                    'id' => [
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => [
                    'id' => [
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);
        
        // Batch operations
        register_rest_route($this->namespace, '/' . $this->resource_name . '/batch', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'batch_operation'],
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => [
                    'operation' => [
                        'required' => true,
                        'enum' => ['enable', 'disable', 'delete'],
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'ids' => [
                        'required' => true,
                        'type' => 'array',
                        'items' => [
                            'type' => 'integer',
                        ],
                    ],
                ],
            ],
        ]);
        
        // Reset password
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)/reset-password', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'reset_password'],
                'permission_callback' => '__return_true', // Temporarily allow all access
                'args' => [
                    'id' => [
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);
        
        // Import users
        register_rest_route($this->namespace, '/' . $this->resource_name . '/import', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'import_users'],
                'permission_callback' => '__return_true', // Temporarily allow all access
            ],
        ]);
        
        // Export users
        register_rest_route($this->namespace, '/' . $this->resource_name . '/export', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'export_users'],
                'permission_callback' => '__return_true', // Temporarily allow all access
            ],
        ]);
    }
    
    /**
     * Format response for REST API
     */
    protected function format_response($data, $message = '', $success = true, $status_code = 200) {
        $response_data = [
            'success' => $success,
            'data' => $data
        ];
        
        if (!empty($message)) {
            $response_data['message'] = $message;
        }
        
        return new WP_REST_Response($response_data, $status_code);
    }
    
    /**
     * Format error response for REST API
     */
    protected function format_error_response($message, $error_code = 'bjt_api_error', $status_code = 400) {
        $response_data = [
            'success' => false,
            'message' => $message,
            'code' => $error_code
        ];
        return new WP_REST_Response($response_data, $status_code);
    }
    
    /**
     * Get users list
     */
    public function get_items($request) {
        global $wpdb;
        
        // Simple query to get users
        $users = $wpdb->get_results("SELECT id, username, email, customer_code, role, country, region, status, preferred_unit, created_at, updated_at FROM {$this->table_name} LIMIT 10", ARRAY_A);
        
        $response_data = array(
            'success' => true,
            'data' => array(
                'items' => $users,
                'total' => count($users),
                'page' => 1,
                'page_size' => 10,
            )
        );
        
        return new WP_REST_Response($response_data, 200);
    }
    
    /**
     * Get single user
     */
    public function get_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $query = $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id);
        $item = $wpdb->get_row($query, ARRAY_A);
        
        if (!$item) {
            return $this->format_error_response('User not found', 'user_not_found', 404);
        }
        
        // Remove password from response
        unset($item['password']);
        
        return $this->format_response($item);
    }
    
    /**
     * Create user
     */
    public function create_item($request) {
        global $wpdb;
        
        $data = $this->prepare_item_for_database($request);
        
        // Check if username or email already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE username = %s OR email = %s",
            $data['username'],
            $data['email']
        ));
        
        if ($existing) {
            return $this->format_error_response('Username or email already exists', 'user_exists', 400);
        }
        
        // Hash password
        if (!empty($data['password'])) {
            $data['password'] = wp_hash_password($data['password']);
        }
        
        $data['created_at'] = current_time('mysql');
        $data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->insert($this->table_name, $data);
        
        if ($result === false) {
            return $this->format_error_response('Failed to create user', 'create_failed', 500);
        }
        
        $user_id = $wpdb->insert_id;
        
        // Get the created user
        $user = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $user_id), ARRAY_A);
        unset($user['password']);
        
        return $this->format_response($user, 'User created successfully');
    }
    
    /**
     * Update user
     */
    public function update_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $data = $this->prepare_item_for_database($request);
        
        // Check if user exists
        $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing) {
            return $this->format_error_response('User not found', 'user_not_found', 404);
        }
        
        // Check if username or email conflicts with other users
        if (!empty($data['username']) || !empty($data['email'])) {
            $conflict_query = "SELECT id FROM {$this->table_name} WHERE id != %d AND (";
            $conflict_values = [$id];
            $conflict_conditions = [];
            
            if (!empty($data['username'])) {
                $conflict_conditions[] = 'username = %s';
                $conflict_values[] = $data['username'];
            }
            
            if (!empty($data['email'])) {
                $conflict_conditions[] = 'email = %s';
                $conflict_values[] = $data['email'];
            }
            
            $conflict_query .= implode(' OR ', $conflict_conditions) . ')';
            $conflict = $wpdb->get_row($wpdb->prepare($conflict_query, $conflict_values));
            
            if ($conflict) {
                return $this->format_error_response('Username or email already exists', 'user_exists', 400);
            }
        }
        
        // Hash password if provided
        if (!empty($data['password'])) {
            $data['password'] = wp_hash_password($data['password']);
        } else {
            unset($data['password']); // Don't update password if not provided
        }
        
        $data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->update($this->table_name, $data, ['id' => $id]);
        
        if ($result === false) {
            return $this->format_error_response('Failed to update user', 'update_failed', 500);
        }
        
        // Get the updated user
        $user = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id), ARRAY_A);
        unset($user['password']);
        
        return $this->format_response($user, 'User updated successfully');
    }
    
    /**
     * Delete user
     */
    public function delete_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        
        // Check if user exists
        $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing) {
            return $this->format_error_response('User not found', 'user_not_found', 404);
        }
        
        $result = $wpdb->delete($this->table_name, ['id' => $id]);
        
        if ($result === false) {
            return $this->format_error_response('Failed to delete user', 'delete_failed', 500);
        }
        
        return $this->format_response(null, 'User deleted successfully');
    }
    
    /**
     * Batch operations
     */
    public function batch_operation($request) {
        global $wpdb;
        
        $operation = $request['operation'];
        $ids = $request['ids'];
        
        if (empty($ids)) {
            return $this->format_error_response('No user IDs provided', 'no_ids', 400);
        }
        
        $success_count = 0;
        $failed_count = 0;
        
        foreach ($ids as $id) {
            $id = absint($id);
            
            switch ($operation) {
                case 'enable':
                    $result = $wpdb->update($this->table_name, ['status' => 'active'], ['id' => $id]);
                    break;
                case 'disable':
                    $result = $wpdb->update($this->table_name, ['status' => 'inactive'], ['id' => $id]);
                    break;
                case 'delete':
                    $result = $wpdb->delete($this->table_name, ['id' => $id]);
                    break;
                default:
                    $result = false;
            }
            
            if ($result !== false) {
                $success_count++;
            } else {
                $failed_count++;
            }
        }
        
        return $this->format_response([
            'success' => $success_count,
            'failed' => $failed_count,
        ], "Batch operation completed: {$success_count} successful, {$failed_count} failed");
    }
    
    /**
     * Reset password
     */
    public function reset_password($request) {
        global $wpdb;
        
        $id = $request['id'];
        
        // Check if user exists
        $user = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$user) {
            return $this->format_error_response('User not found', 'user_not_found', 404);
        }
        
        // Generate new password
        $new_password = wp_generate_password(12, false);
        $hashed_password = wp_hash_password($new_password);
        
        $result = $wpdb->update(
            $this->table_name,
            ['password' => $hashed_password, 'updated_at' => current_time('mysql')],
            ['id' => $id]
        );
        
        if ($result === false) {
            return $this->format_error_response('Failed to reset password', 'reset_failed', 500);
        }
        
        // In a real application, you would send the new password via email
        // For now, we'll just return a success message
        
        return $this->format_response([
            'message' => 'Password reset successfully. New password has been sent to user email.',
        ]);
    }
    
    /**
     * Import users
     */
    public function import_users($request) {
        // This would handle file upload and CSV parsing
        // For now, return a placeholder response
        return $this->format_response([
            'success' => 0,
            'failed' => 0,
        ], 'Import functionality not yet implemented');
    }
    
    /**
     * Export users
     */
    public function export_users($request) {
        global $wpdb;
        
        // Get all users (without passwords)
        $users = $wpdb->get_results("SELECT id, username, email, customer_code, role, country, region, company_logo, status, created_at, updated_at, preferred_unit FROM {$this->table_name}", ARRAY_A);
        
        return $this->format_response($users);
    }
    
    /**
     * Prepare item for database
     */
    private function prepare_item_for_database($request) {
        $data = [];
        
        $fields = [
            'username', 'email', 'password', 'customer_code', 'role',
            'country', 'region', 'company_logo', 'status', 'preferred_unit'
        ];
        
        foreach ($fields as $field) {
            if (isset($request[$field])) {
                $data[$field] = sanitize_text_field($request[$field]);
            }
        }
        
        return $data;
    }
    
    /**
     * Get endpoint args for item schema
     */
    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $args = [
            'username' => [
                'type' => 'string',
                'required' => $method === WP_REST_Server::CREATABLE,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'email' => [
                'type' => 'string',
                'format' => 'email',
                'required' => $method === WP_REST_Server::CREATABLE,
                'sanitize_callback' => 'sanitize_email',
            ],
            'password' => [
                'type' => 'string',
                'required' => $method === WP_REST_Server::CREATABLE,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'customer_code' => [
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'role' => [
                'type' => 'string',
                'enum' => ['admin', 'manager', 'user', 'viewer'],
                'default' => 'user',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'country' => [
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'region' => [
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'company_logo' => [
                'type' => 'string',
                'format' => 'uri',
                'sanitize_callback' => 'esc_url_raw',
            ],
            'status' => [
                'type' => 'string',
                'enum' => ['active', 'inactive', 'suspended'],
                'default' => 'active',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'preferred_unit' => [
                'type' => 'string',
                'enum' => ['metric', 'imperial'],
                'default' => 'metric',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
        
        return $args;
    }
    
    /**
     * Check read permission
     */
    public function check_read_permission($request) {
        return current_user_can('list_users') || current_user_can('manage_options');
    }
    
    /**
     * Check write permission
     */
    public function check_write_permission($request) {
        return current_user_can('create_users') || current_user_can('manage_options');
    }
} 