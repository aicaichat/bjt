<?php
/**
 * BJT Authentication API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Auth_Controller extends BJT_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'auth';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // 添加登录路由
        register_rest_route($this->namespace, '/' . $this->rest_base . '/login', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'login'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'username' => array(
                        'required' => true,
                        'type' => 'string',
                    ),
                    'password' => array(
                        'required' => true,
                        'type' => 'string',
                    ),
                ),
            )
        ));
        
        // 添加获取当前用户信息的路由
        register_rest_route($this->namespace, '/' . $this->rest_base . '/me', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_current_user'),
                'permission_callback' => array($this, 'check_permission'),
            )
        ));

        register_rest_route($this->namespace, '/' . $this->rest_base . '/refresh', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'refresh_token'),
                'permission_callback' => array($this, 'check_expired_token_permission'),
            )
        ));

        register_rest_route($this->namespace, '/' . $this->rest_base . '/logout', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'logout'),
                'permission_callback' => array($this, 'check_permission'),
            )
        ));
    }

    /**
     * 用户登录
     */
    public function login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        // 验证用户
        $user = wp_authenticate($username, $password);

        // BJT DEBUG: Log the result of wp_authenticate
        error_log('[BJT_Auth_Controller] wp_authenticate result for user \'' . $username . '\': ' . print_r($user, true));

        if (is_wp_error($user)) {
            return $this->format_error(
                __('用户名或密码错误', 'bjt-product-admin'),
                401,
                array('code' => 1001)
            );
        }

        // 生成简单的token (实际环境下应使用JWT)
        $token = md5($user->ID . time() . wp_generate_password(32, true, true));
        $expires_in = 86400; // 24小时

        // 存储token (简化版实现)
        update_user_meta($user->ID, 'bjt_auth_token', array(
            'token' => $token,
            'expires' => time() + $expires_in
        ));

        // 准备用户数据
        $user_data = array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => !empty($user->roles) ? $user->roles[0] : '',
            'region' => get_user_meta($user->ID, 'bjt_user_region', true) ?: 'CN',
            'vipLevel' => (int)get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'bjt_user_type', true) ?: 'standard'
        );

        // 返回响应
        return $this->format_response(array(
            'token' => $token,
            'expires_in' => $expires_in,
            'user' => $user_data
        ));
    }

    /**
     * 获取当前用户信息
     */
    public function get_current_user($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user) {
            return $this->format_error(
                __('用户未找到', 'bjt-product-admin'),
                404
            );
        }

        // 获取用户权限
        $permissions = array();
        if (current_user_can('manage_options')) {
            $permissions[] = 'admin';
            $permissions[] = 'view_prices';
            $permissions[] = 'view_inventory';
            $permissions[] = 'add_to_cart';
            $permissions[] = 'manage_products';
        } else {
            if (current_user_can('read')) {
                $permissions[] = 'view_prices';
                $permissions[] = 'view_inventory';
                $permissions[] = 'add_to_cart';
            }
        }

        // 准备用户数据
        $user_data = array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => !empty($user->roles) ? $user->roles[0] : '',
            'region' => get_user_meta($user->ID, 'bjt_user_region', true) ?: 'CN',
            'vipLevel' => (int)get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'bjt_user_type', true) ?: 'standard',
            'permissions' => $permissions
        );

        return $this->format_response($user_data);
    }

    /**
     * Refresh JWT token
     */
    public function refresh_token($request) {
        $old_token = $this->get_token_from_request($request);
        if (is_wp_error($old_token)) {
            return $old_token;
        }

        // 简化版实现，实际应该检查token的有效性和过期时间
        global $wpdb;
        $user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = 'bjt_auth_token' AND meta_value LIKE %s",
            '%' . $wpdb->esc_like($old_token) . '%'
        ));

        if (!$user_id) {
            return $this->format_error(
                __('无效的刷新令牌', 'bjt-product-admin'),
                401,
                array('code' => 1003)
            );
        }

        // 生成新token
        $token = md5($user_id . time() . wp_generate_password(32, true, true));
        $expires_in = 86400; // 24小时

        // 更新token
        update_user_meta($user_id, 'bjt_auth_token', array(
            'token' => $token,
            'expires' => time() + $expires_in
        ));

        return $this->format_response(array(
            'token' => $token,
            'expires_in' => $expires_in
        ));
    }

    /**
     * Logout user
     */
    public function logout($request) {
        $token = $this->get_token_from_request($request);
        if (is_wp_error($token)) {
            return $token;
        }

        // 简化版实现，实际应该将token加入黑名单
        $user_id = get_current_user_id();
        delete_user_meta($user_id, 'bjt_auth_token');

        return $this->format_response(
            array(),
            true,
            200,
            __('已成功退出', 'bjt-product-admin')
        );
    }

    /**
     * Check permissions for API access
     */
    public function check_permission($request) {
        $token = $this->get_token_from_request($request);
        if (is_wp_error($token)) {
            return false;
        }

        // 简化版实现，实际应该检查token的有效性和过期时间
        global $wpdb;
        $user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = 'bjt_auth_token' AND meta_value LIKE %s",
            '%' . $wpdb->esc_like($token) . '%'
        ));

        if (!$user_id) {
            return false;
        }

        // 设置当前用户
        wp_set_current_user($user_id);
        return true;
    }

    /**
     * Check if expired token is valid for refresh
     */
    public function check_expired_token_permission($request) {
        $token = $this->get_token_from_request($request);
        if (is_wp_error($token)) {
            return false;
        }

        // 简化版实现，实际应该检查token是否在刷新窗口内
        global $wpdb;
        $result = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} WHERE meta_key = 'bjt_auth_token' AND meta_value LIKE %s",
            '%' . $wpdb->esc_like($token) . '%'
        ));

        return $result > 0;
    }

    /**
     * Get token from request
     */
    private function get_token_from_request($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error(
                'invalid_token',
                __('Authorization header not found or invalid.', 'bjt-product-admin'),
                array('status' => 401)
            );
        }

        return trim(substr($auth_header, 7));
    }
} 