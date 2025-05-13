<?php
/**
 * 认证控制器
 * 
 * 实现认证相关的API端点
 */

class BJT_Auth_Controller extends BJT_API_Controller {
    protected $resource_name = 'auth';
    
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
        $auth = new BJT_Auth();
        $user = $auth->validate_user($username, $password);
        
        if (is_wp_error($user)) {
            return $this->error_response($user->get_error_message(), 1001, 401);
        }
        
        // 生成令牌
        $token_data = $this->generate_token_for_user($user);
        
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
        
        // 返回令牌和用户信息
        return rest_ensure_response($this->response([
            'token' => $token_data['token'],
            'expires_in' => $token_data['expires_in'],
            'user' => $user_data,
        ]));
    }
    
    /**
     * 刷新令牌
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function refresh_token($request) {
        $token = bjt_get_current_token();
        
        if (!$token) {
            return $this->error_response('未提供令牌', 1002, 401);
        }
        
        $auth = new BJT_Auth();
        $payload = $auth->validate_token($token);
        
        if (is_wp_error($payload)) {
            return $this->error_response($payload->get_error_message(), 1003, 401);
        }
        
        // 检查是否有用户信息
        if (!isset($payload['user']) || !isset($payload['user']['id'])) {
            return $this->error_response('令牌不包含有效的用户信息', 1004, 401);
        }
        
        // 获取用户
        $user = get_user_by('id', $payload['user']['id']);
        
        if (!$user) {
            return $this->error_response('用户不存在', 1005, 401);
        }
        
        // 生成新令牌
        $token_data = $this->generate_token_for_user($user);
        
        // 返回新令牌
        return rest_ensure_response($this->response([
            'token' => $token_data['token'],
            'expires_in' => $token_data['expires_in'],
        ]));
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
        
        return rest_ensure_response($this->response(null, '退出登录成功'));
    }
    
    /**
     * 获取当前用户信息
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_current_user($request) {
        $user = bjt_get_current_user();
        
        if (!$user) {
            return $this->error_response('未授权访问', 1002, 401);
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
        
        return rest_ensure_response($this->response($user_data));
    }
    
    /**
     * 检查是否已认证
     *
     * @return bool 是否已认证
     */
    public function check_auth() {
        return bjt_get_current_user() !== null;
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
                'view_prices', 'view_inventory', 'add_to_cart', 'place_order',
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
} 