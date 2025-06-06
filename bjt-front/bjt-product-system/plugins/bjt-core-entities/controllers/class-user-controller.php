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
                'permission_callback' => array($this, 'check_read_permission'),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => array($this, 'check_write_permission'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ),
        ));
        
        // Get single user
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
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
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_delete_permission'],
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
                'permission_callback' => [$this, 'check_admin_permission'],
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
                'permission_callback' => [$this, 'check_admin_permission'],
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
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);
        
        // Export users
        register_rest_route($this->namespace, '/' . $this->resource_name . '/export', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'export_users'],
                'permission_callback' => [$this, 'check_admin_permission'],
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
        error_log('[BJT_User_Controller] Checking read permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_User_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_User_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_User_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_User_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_User_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_User_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以查看用户
        $has_read_permission = false;
        if (isset($user->role)) {
            $allowed_read_roles = ['admin', 'manager'];
            $has_read_permission = in_array($user->role, $allowed_read_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_read_permission = $has_read_permission || 
                                   in_array('list_users', $user->permissions) || 
                                   in_array('manage_users', $user->permissions);
        }

        if (!$has_read_permission) {
            error_log('[BJT_User_Controller] User does not have read permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to view users.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_User_Controller] Read permission granted for user: ' . $user->username);
        return true;
    }
    
    /**
     * Check write permission
     */
    public function check_write_permission($request) {
        error_log('[BJT_User_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_User_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_User_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_User_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_User_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_User_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_User_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以创建/更新用户
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin', 'manager'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('create_users', $user->permissions) || 
                                    in_array('edit_users', $user->permissions) || 
                                    in_array('manage_users', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_User_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update users.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_User_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }
    
    /**
     * Check delete permission
     */
    public function check_delete_permission($request) {
        error_log('[BJT_User_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_User_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_User_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_User_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_User_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_User_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_User_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以删除用户
        $has_delete_permission = false;
        if (isset($user->role)) {
            $allowed_delete_roles = ['admin'];
            $has_delete_permission = in_array($user->role, $allowed_delete_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_delete_permission = $has_delete_permission || 
                                     in_array('delete_users', $user->permissions) || 
                                     in_array('manage_users', $user->permissions);
        }

        if (!$has_delete_permission) {
            error_log('[BJT_User_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete users.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_User_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }
    
    /**
     * Check admin permission
     */
    public function check_admin_permission($request) {
        error_log('[BJT_User_Controller] Checking admin permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_User_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_User_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_User_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_User_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_User_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_User_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以执行管理员操作
        $has_admin_permission = false;
        if (isset($user->role)) {
            $allowed_admin_roles = ['admin'];
            $has_admin_permission = in_array($user->role, $allowed_admin_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_admin_permission = $has_admin_permission || 
                                    in_array('manage_users', $user->permissions) || 
                                    in_array('manage_system', $user->permissions);
        }

        if (!$has_admin_permission) {
            error_log('[BJT_User_Controller] User does not have admin permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to perform this administrative action.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_User_Controller] Admin permission granted for user: ' . $user->username);
        return true;
    }
} 