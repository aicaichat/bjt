<?php
/**
 * 认证控制器
 * 
 * 实现认证相关的API端点
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
                    ],
                    'password' => [
                        'required' => true,
                        'type' => 'string',
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
    }
    
    /**
     * 用户登录
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function login($request) {
        $username = $request['username'];
        $password = $request['password'];
        
        // 验证凭据
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return $this->error_response('用户名或密码不正确', 'rest_forbidden', 401);
        }
        
        // 生成令牌
        $jwt_handler = new BJT_JWT_Handler();
        $token = $jwt_handler->generate_token($user->ID);
        
        // 令牌过期时间，默认24小时
        $expires_in = DAY_IN_SECONDS;
        
        // 准备用户数据
        $user_data = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => $this->get_user_role($user),
            'region' => get_user_meta($user->ID, 'bjt_user_region', true) ?: 'CN',
            'vipLevel' => (int) get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'bjt_user_type', true) ?: 'regular',
        ];
        
        // 设置当前用户
        wp_set_current_user($user->ID);
        
        // 返回令牌和用户信息
        $response_data = [
            'token' => $token,
            'expires_in' => $expires_in,
            'user' => $user_data,
        ];
        
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
            return $this->error_response('无效的令牌', 'rest_forbidden', 401);
        }
        
        // 获取用户ID
        $user_id = null;
        
        // 尝试从不同的payload格式中获取用户ID
        if (isset($payload->data->user_id)) {
            $user_id = $payload->data->user_id;
        } else if (isset($payload->user) && isset($payload->user->id)) {
            $user_id = $payload->user->id;
        } else {
            return $this->error_response('令牌不包含有效的用户信息', 'rest_forbidden', 401);
        }
        
        // 获取用户
        $user = get_user_by('id', $user_id);
        
        if (!$user) {
            return $this->error_response('用户不存在', 'rest_forbidden', 401);
        }
        
        // 生成新令牌
        $token = $jwt_handler->generate_token($user->ID);
        $expires_in = DAY_IN_SECONDS;
        
        // 返回新令牌
        return $this->format_response([
            'token' => $token,
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
        // 目前没有实际的退出操作，因为JWT是无状态的
        // 通常由客户端删除存储的令牌
        
        return $this->format_response(null, '退出登录成功');
    }
    
    /**
     * 获取当前用户信息
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_current_user($request) {
        $user = wp_get_current_user();
        
        if (!$user || $user->ID === 0) {
            return $this->error_response('未授权访问', 'rest_forbidden', 401);
        }
        
        // 获取用户权限
        $permissions = $this->get_user_permissions($user);
        
        // 准备用户数据
        $user_data = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => $this->get_user_role($user),
            'region' => get_user_meta($user->ID, 'bjt_user_region', true) ?: 'CN',
            'vipLevel' => (int) get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'bjt_user_type', true) ?: 'regular',
            'permissions' => $permissions,
        ];
        
        return $this->format_response($user_data);
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
            return $this->error_response('未提供授权令牌', 'rest_not_logged_in', 401);
        }
        
        $token = $matches[1];
        
        // 尝试使用两种方式验证令牌
        try {
            // 首先尝试使用JWT Handler
            $jwt_handler = new BJT_JWT_Handler();
            $payload = $jwt_handler->validate_token($token);
            
            if ($payload && isset($payload->data->user_id)) {
                $user_id = $payload->data->user_id;
                $user = get_user_by('id', $user_id);
                
                if (!$user) {
                    return $this->error_response('用户不存在', 'rest_forbidden', 401);
                }
                
                // 设置当前用户
                wp_set_current_user($user_id);
                return true;
            } 
            // 如果JWT Handler没有成功，尝试使用BJT Auth
            else if (class_exists('BJT_Auth')) {
                $auth = new BJT_Auth();
                $auth_payload = $auth->validate_token($token);
                
                if (is_wp_error($auth_payload)) {
                    return $this->error_response($auth_payload->get_error_message(), 'rest_forbidden', 401);
                }
                
                // 提取用户信息并设置当前用户
                if (isset($auth_payload['user']) && isset($auth_payload['user']['id'])) {
                    $user_id = $auth_payload['user']['id'];
                    $user = get_user_by('id', $user_id);
                    
                    if (!$user) {
                        return $this->error_response('用户不存在', 'rest_forbidden', 401);
                    }
                    
                    // 设置当前用户
                    wp_set_current_user($user_id);
                    return true;
                }
            }
            
            return $this->error_response('令牌不包含有效的用户信息', 'rest_forbidden', 401);
        } catch (Exception $e) {
            return $this->error_response('令牌验证失败: ' . $e->getMessage(), 'rest_forbidden', 401);
        }
    }
    
    /**
     * 为用户生成令牌
     *
     * @param WP_User $user 用户对象
     * @return array 令牌数据
     */
    private function generate_token_for_user($user) {
        $auth = new BJT_Auth();
        
        // 令牌过期时间，默认24小时
        $expires_in = apply_filters('bjt_token_expires_in', 24 * 60 * 60);
        
        // 令牌负载
        $payload = [
            'iss' => get_site_url(),
            'iat' => time(),
            'exp' => time() + $expires_in,
            'user' => [
                'id' => $user->ID,
            ],
        ];
        
        // 生成令牌
        $token = $auth->generate_token($payload);
        
        return [
            'token' => $token,
            'expires_in' => $expires_in,
        ];
    }
    
    /**
     * 获取用户的角色
     *
     * @param WP_User $user 用户对象
     * @return string 用户角色
     */
    private function get_user_role($user) {
        $roles = (array) $user->roles;
        
        // 角色映射
        $role_map = [
            'administrator' => 'ADMIN',
            'editor' => 'EDITOR',
            'author' => 'AUTHOR',
            'contributor' => 'CONTRIBUTOR',
            'subscriber' => 'SUBSCRIBER',
            'bjt_sales' => 'SALES',
            'bjt_customer' => 'CUSTOMER',
        ];
        
        foreach ($roles as $role) {
            if (isset($role_map[$role])) {
                return $role_map[$role];
            }
        }
        
        return 'SUBSCRIBER';
    }
    
    /**
     * 获取用户的权限
     *
     * @param WP_User $user 用户对象
     * @return array 权限列表
     */
    private function get_user_permissions($user) {
        $permissions = [];
        
        // 基于角色的权限
        if (user_can($user, 'administrator')) {
            $permissions = [
                'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
                'view_admin', 'edit_products', 'delete_products', 'manage_users',
            ];
        } elseif (user_can($user, 'editor') || user_can($user, 'bjt_sales')) {
            $permissions = [
                'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
                'edit_products',
            ];
        } elseif (user_can($user, 'bjt_customer')) {
            $permissions = [
                'view_prices', 'add_to_cart', 'place_order',
            ];
        } else {
            $permissions = [
                'view_prices', 'add_to_cart',
            ];
        }
        
        // 额外的自定义权限
        $custom_permissions = get_user_meta($user->ID, 'bjt_user_permissions', true);
        if ($custom_permissions) {
            $custom_permissions = explode(',', $custom_permissions);
            $permissions = array_merge($permissions, $custom_permissions);
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