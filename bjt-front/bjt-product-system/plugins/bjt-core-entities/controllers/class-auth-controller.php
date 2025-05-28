<?php
/**
 * 认证控制器
 * 
 * 实现认证相关的API端点，支持wp_bjt_users表认证
 */

class BJT_Auth_Controller extends BJT_API_Controller {
    public $resource_name = 'auth';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name . '/login', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'login'],
                'permission_callback' => '__return_true',
                'args' => [
                    'username' => [
                        'required' => true,
                        'type' => 'string',
                        'description' => '用户名或邮箱',
                    ],
                    'password' => [
                        'required' => true,
                        'type' => 'string',
                        'description' => '密码',
                    ],
                    'remember_me' => [
                        'required' => false,
                        'type' => 'boolean',
                        'default' => false,
                        'description' => '是否记住登录状态',
                    ],
                ],
            ],
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/refresh', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'refresh_token'],
                'permission_callback' => '__return_true',
            ],
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/logout', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'logout'],
                'permission_callback' => [$this, 'check_auth'],
            ],
        ]);
        
        register_rest_route($this->namespace, '/user/me', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_current_user'],
                'permission_callback' => [$this, 'check_auth'],
            ],
        ]);

        // 新增：更新用户资料接口
        register_rest_route($this->namespace, '/user/profile', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_profile'],
                'permission_callback' => [$this, 'check_auth'],
                'args' => [
                    'email' => [
                        'type' => 'string',
                        'format' => 'email',
                        'description' => '邮箱地址',
                    ],
                    'first_name' => [
                        'type' => 'string',
                        'description' => '名字',
                    ],
                    'last_name' => [
                        'type' => 'string',
                        'description' => '姓氏',
                    ],
                    'preferred_unit' => [
                        'type' => 'string',
                        'enum' => ['metric', 'imperial'],
                        'description' => '偏好单位制',
                    ],
                    'customer_code' => [
                        'type' => 'string',
                        'description' => '客户代码',
                    ],
                    'country' => [
                        'type' => 'string',
                        'description' => '国家',
                    ],
                    'region' => [
                        'type' => 'string',
                        'description' => '区域',
                    ],
                    'company_logo' => [
                        'type' => 'string',
                        'description' => '公司Logo URL',
                    ],
                ],
            ],
        ]);
    }
    
    /**
     * 用户登录 - 使用wp_bjt_users表进行认证
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function login($request) {
        global $wpdb;
        
        error_log('[BJT_Auth_Controller] Entered login method.');
        $username = sanitize_text_field($request['username']);
        $password = $request['password'];
        $remember_me = $request->get_param('remember_me') ?: false;
        
        error_log('[BJT_Auth_Controller] Attempting BJT user authentication with username: ' . $username);
        
        // 查询wp_bjt_users表
        $table_name = $wpdb->prefix . 'bjt_users';
        
        // 支持用户名或邮箱登录
        $user_query = $wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE (username = %s OR email = %s) AND status = 'active'",
            $username,
            $username
        );
        
        $user = $wpdb->get_row($user_query);
        
        if (!$user) {
            error_log('[BJT_Auth_Controller] User not found in wp_bjt_users table: ' . $username);
            return $this->error_response('用户名或密码不正确', 'invalid_credentials', 401);
        }
        
        // 验证密码
        error_log('[BJT_Auth_Controller] About to verify password for user: ' . $username);
        error_log('[BJT_Auth_Controller] Password from request: ' . $password);
        error_log('[BJT_Auth_Controller] Stored hash: ' . $user->password);
        
        $password_valid = password_verify($password, $user->password);
        error_log('[BJT_Auth_Controller] Password verification result: ' . ($password_valid ? 'TRUE' : 'FALSE'));
        
        if (!$password_valid) {
            error_log('[BJT_Auth_Controller] Password verification failed for user: ' . $username);
            return $this->error_response('用户名或密码不正确', 'invalid_credentials', 401);
        }
        
        error_log('[BJT_Auth_Controller] BJT user authentication successful for user ID: ' . $user->id);
        
        // 生成令牌
        $jwt_handler = new BJT_JWT_Handler();
        error_log('[BJT_Auth_Controller] About to generate token for BJT user ID: ' . $user->id);
        
        // 令牌过期时间
        $expires_in = $remember_me ? (7 * DAY_IN_SECONDS) : DAY_IN_SECONDS; // 记住登录状态7天，否则24小时
        
        // 创建JWT payload
        $payload = [
            'iss' => get_site_url(),
            'iat' => time(),
            'exp' => time() + $expires_in,
            'data' => [
                'user_id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ];
        
        $token = $jwt_handler->generate_token_with_payload($payload);
        error_log('[BJT_Auth_Controller] Token generated: ' . substr($token, 0, 20) . '...');
        
        // 获取用户权限
        $permissions = $this->get_bjt_user_permissions($user);
        
        // 准备用户数据
        $user_data = [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'name' => $user->username, // 可以后续扩展为first_name + last_name
            'display_name' => $user->username,
            'role' => $this->normalize_user_role($user->role),
            'region' => $user->region ?: 'CN',
            'country' => $user->country,
            'customer_code' => $user->customer_code,
            'company_logo' => $user->company_logo,
            'preferred_unit' => $user->preferred_unit ?: 'metric',
            'status' => $user->status,
            'permissions' => $permissions,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
        
        // 更新最后登录时间
        $wpdb->update(
            $table_name,
            ['updated_at' => current_time('mysql')],
            ['id' => $user->id],
            ['%s'],
            ['%d']
        );
        
        // 返回令牌和用户信息
        $response_data = [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $expires_in,
            'user' => $user_data,
        ];
        
        error_log('[BJT_Auth_Controller] Preparing successful login response for BJT user: ' . $user->username);
        return $this->format_response($response_data);
    }
    
    /**
     * 刷新令牌
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function refresh_token($request) {
        // 从请求头获取Bearer Token
        $authorization_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if (empty($authorization_header) || !preg_match('/Bearer\s+(.*)$/i', $authorization_header, $matches)) {
            return $this->error_response('未提供授权令牌', 'rest_not_logged_in', 401);
        }
        
        $token = $matches[1];
        
        // 尝试使用JWT Handler验证令牌
        $jwt_handler = new BJT_JWT_Handler();
        $payload = $jwt_handler->validate_token($token);
        
        if (!$payload) {
            return $this->error_response('无效的令牌', 'invalid_token', 401);
        }
        
        // 获取用户ID
        $user_id = null;
        
        // 尝试从不同的payload格式中获取用户ID
        if (isset($payload->data->user_id)) {
            $user_id = $payload->data->user_id;
        } else if (isset($payload->user) && isset($payload->user->id)) {
            $user_id = $payload->user->id;
        } else {
            return $this->error_response('令牌不包含有效的用户信息', 'invalid_token', 401);
        }
        
        // 从wp_bjt_users表获取用户
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_users';
        $user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE id = %d AND status = 'active'",
            $user_id
        ));
        
        if (!$user) {
            return $this->error_response('用户不存在或已被禁用', 'user_not_found', 401);
        }
        
        // 生成新令牌
        $expires_in = DAY_IN_SECONDS;
        $new_payload = [
            'iss' => get_site_url(),
            'iat' => time(),
            'exp' => time() + $expires_in,
            'data' => [
                'user_id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ];
        
        $new_token = $jwt_handler->generate_token_with_payload($new_payload);
        
        // 返回新令牌
        return $this->format_response([
            'token' => $new_token,
            'token_type' => 'Bearer',
            'expires_in' => $expires_in,
        ]);
    }
    
    /**
     * 退出登录
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function logout($request) {
        // JWT是无状态的，实际的退出操作由客户端删除存储的令牌完成
        // 这里可以记录退出日志或执行其他清理操作
        
        $current_user = $this->get_current_bjt_user();
        if ($current_user) {
            error_log('[BJT_Auth_Controller] User logout: ' . $current_user->username);
        }
        
        return $this->format_response(null, '退出登录成功');
    }
    
    /**
     * 获取当前用户信息
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_current_user($request) {
        $user = $this->get_current_bjt_user();
        
        if (!$user) {
            return $this->error_response('未授权访问', 'rest_forbidden', 401);
        }
        
        // 获取用户权限
        $permissions = $this->get_bjt_user_permissions($user);
        
        // 准备用户数据
        $user_data = [
            'id' => $user->id,
            'username' => $user->username,
            'email' => $user->email,
            'name' => $user->username,
            'display_name' => $user->username,
            'role' => $this->normalize_user_role($user->role),
            'region' => $user->region ?: 'CN',
            'country' => $user->country,
            'customer_code' => $user->customer_code,
            'company_logo' => $user->company_logo,
            'preferred_unit' => $user->preferred_unit ?: 'metric',
            'status' => $user->status,
            'permissions' => $permissions,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
        
        return $this->format_response($user_data);
    }

    /**
     * 更新用户资料
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function update_profile($request) {
        global $wpdb;
        
        $user = $this->get_current_bjt_user();
        if (!$user) {
            return $this->error_response('未授权访问', 'rest_forbidden', 401);
        }
        
        $table_name = $wpdb->prefix . 'bjt_users';
        $update_data = [];
        $update_format = [];
        
        // 处理可更新的字段
        $allowed_fields = [
            'email' => '%s',
            'preferred_unit' => '%s',
            'customer_code' => '%s',
            'country' => '%s',
            'region' => '%s',
            'company_logo' => '%s',
        ];
        
        foreach ($allowed_fields as $field => $format) {
            if ($request->has_param($field)) {
                $value = $request->get_param($field);
                
                // 特殊验证
                if ($field === 'email' && !is_email($value)) {
                    return $this->error_response('邮箱格式不正确', 'invalid_email', 400);
                }
                
                if ($field === 'preferred_unit' && !in_array($value, ['metric', 'imperial'])) {
                    return $this->error_response('单位制参数无效', 'invalid_unit', 400);
                }
                
                $update_data[$field] = sanitize_text_field($value);
                $update_format[] = $format;
            }
        }
        
        if (empty($update_data)) {
            return $this->error_response('没有提供有效的更新字段', 'no_update_data', 400);
        }
        
        // 添加更新时间
        $update_data['updated_at'] = current_time('mysql');
        $update_format[] = '%s';
        
        // 执行更新
        $result = $wpdb->update(
            $table_name,
            $update_data,
            ['id' => $user->id],
            $update_format,
            ['%d']
        );
        
        if ($result === false) {
            return $this->error_response('更新失败', 'update_failed', 500);
        }
        
        // 获取更新后的用户信息
        $updated_user = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$table_name} WHERE id = %d",
            $user->id
        ));
        
        // 获取用户权限
        $permissions = $this->get_bjt_user_permissions($updated_user);
        
        // 准备返回数据
        $user_data = [
            'id' => $updated_user->id,
            'username' => $updated_user->username,
            'email' => $updated_user->email,
            'name' => $updated_user->username,
            'display_name' => $updated_user->username,
            'role' => $this->normalize_user_role($updated_user->role),
            'region' => $updated_user->region ?: 'CN',
            'country' => $updated_user->country,
            'customer_code' => $updated_user->customer_code,
            'company_logo' => $updated_user->company_logo,
            'preferred_unit' => $updated_user->preferred_unit ?: 'metric',
            'status' => $updated_user->status,
            'permissions' => $permissions,
            'updated_at' => $updated_user->updated_at,
        ];
        
        return $this->format_response($user_data, '用户资料更新成功');
    }
    
    /**
     * 检查是否已认证
     *
     * @param WP_REST_Request $request 请求对象
     * @return bool|WP_Error 是否已认证
     */
    public function check_auth($request = null) {
        // 从请求头获取Bearer Token
        $authorization_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if (empty($authorization_header) || !preg_match('/Bearer\s+(.*)$/i', $authorization_header, $matches)) {
            error_log('[BJT_Auth_Controller] No valid Authorization header found');
            return $this->error_response('未提供授权令牌', 'rest_not_logged_in', 401);
        }
        
        $token = $matches[1];
        error_log('[BJT_Auth_Controller] Validating token: ' . substr($token, 0, 20) . '...');
        
        try {
            // 使用JWT Handler验证令牌
            $jwt_handler = new BJT_JWT_Handler();
            $payload = $jwt_handler->validate_token($token);
            
            if (!$payload) {
                error_log('[BJT_Auth_Controller] Token validation failed - no payload returned');
                return $this->error_response('无效的令牌', 'invalid_token', 401);
            }
            
            error_log('[BJT_Auth_Controller] Token payload: ' . print_r($payload, true));
            
            // 尝试从不同的payload格式中获取用户ID
            $user_id = null;
            if (isset($payload->data->user_id)) {
                $user_id = $payload->data->user_id;
            } else if (isset($payload->user) && isset($payload->user->id)) {
                $user_id = $payload->user->id;
            } else if (isset($payload->user_id)) {
                $user_id = $payload->user_id;
            }
            
            if (!$user_id) {
                error_log('[BJT_Auth_Controller] No user ID found in token payload');
                return $this->error_response('令牌不包含有效的用户信息', 'invalid_token', 401);
            }
            
            error_log('[BJT_Auth_Controller] Found user ID in token: ' . $user_id);
            
            // 从wp_bjt_users表获取用户
            global $wpdb;
            $table_name = $wpdb->prefix . 'bjt_users';
            $user = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table_name} WHERE id = %d AND status = 'active'",
                $user_id
            ));
            
            if (!$user) {
                error_log('[BJT_Auth_Controller] User not found or inactive: ' . $user_id);
                return $this->error_response('用户不存在或已被禁用', 'user_not_found', 401);
            }
            
            // 验证用户角色
            $allowed_roles = ['admin', 'sales', 'partner', 'customer'];
            if (!in_array(strtolower($user->role), $allowed_roles)) {
                error_log('[BJT_Auth_Controller] User has invalid role: ' . $user->role);
                return $this->error_response('用户角色无效', 'invalid_role', 403);
            }
            
            error_log('[BJT_Auth_Controller] User authenticated successfully: ' . $user->username . ' (Role: ' . $user->role . ')');
            
            // 将用户信息存储到全局变量中，供其他方法使用
            $GLOBALS['bjt_current_user'] = $user;
            
            return true;
        } catch (Exception $e) {
            error_log('[BJT_Auth_Controller] Token validation exception: ' . $e->getMessage());
            return $this->error_response('令牌验证失败: ' . $e->getMessage(), 'token_validation_failed', 401);
        }
    }
    
    /**
     * 获取当前BJT用户
     *
     * @return object|null 用户对象
     */
    private function get_current_bjt_user() {
        return isset($GLOBALS['bjt_current_user']) ? $GLOBALS['bjt_current_user'] : null;
    }
    
    /**
     * 标准化用户角色
     *
     * @param string $role 原始角色
     * @return string 标准化后的角色
     */
    private function normalize_user_role($role) {
        $role_map = [
            'admin' => 'admin',
            'sales' => 'sales', 
            'partner' => 'partner',
            'customer' => 'customer',
        ];
        
        return isset($role_map[strtolower($role)]) ? $role_map[strtolower($role)] : 'customer';
    }
    
    /**
     * 获取BJT用户的权限
     *
     * @param object $user BJT用户对象
     * @return array 权限列表
     */
    private function get_bjt_user_permissions($user) {
        $permissions = [];
        
        // 基于角色的权限
        switch (strtolower($user->role)) {
            case 'admin':
                $permissions = [
                    'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
                    'view_admin', 'edit_products', 'delete_products', 'manage_users', 'manage_orders',
                ];
                break;
                
            case 'sales':
                $permissions = [
                    'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
                    'edit_products', 'manage_orders',
                ];
                break;
                
            case 'partner':
                $permissions = [
                    'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
                ];
                break;
                
            case 'customer':
            default:
                $permissions = [
                    'view_prices', 'add_to_cart', 'place_order',
                ];
                break;
        }
        
        return array_unique($permissions);
    }
    
    /**
     * 格式化响应
     *
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param bool $success 是否成功
     * @param int $code HTTP状态码
     * @return WP_REST_Response 格式化的响应
     */
    protected function format_response($data = null, $message = '', $success = true, $code = 200) {
        $response = [
            'success' => $success,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        return new WP_REST_Response($response, $code);
    }
    
    /**
     * 错误响应
     *
     * @param string $message 错误消息
     * @param int|string $code 错误代码
     * @param int $status 状态码
     * @return WP_REST_Response 错误响应
     */
    protected function error_response($message, $code = 'bjt_api_error', $status = 400, $data = null) {
        $response = [
            'success' => false,
            'message' => $message,
            'code' => $code
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        return new WP_REST_Response($response, $status);
    }
} 