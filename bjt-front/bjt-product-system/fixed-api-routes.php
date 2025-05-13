<?php
/**
 * BJT API Routes Class
 * 
 * 处理BJT API的路由注册和认证
 */

// 如果直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

class BJT_API_Routes {
    private static $instance = null;
    private $namespace = 'bjt/v1';

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/auth/login', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_login'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route($this->namespace, '/auth/me', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_current_user'),
            'permission_callback' => array($this, 'check_authentication')
        ));

        register_rest_route($this->namespace, '/machines', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_machines'),
            'permission_callback' => array($this, 'check_authentication')
        ));

        register_rest_route($this->namespace, '/machines/(?P<id>[\\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_machine'),
            'permission_callback' => array($this, 'check_authentication')
        ));
    }

    public function check_authentication($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('unauthorized', '未授权访问', array('status' => 401));
        }

        $token = substr($auth_header, 7);
        // 验证 JWT token
        try {
            $decoded = JWT::decode($token, get_option('bjt_jwt_secret'), array('HS256'));
            return true;
        } catch (Exception $e) {
            return new WP_Error('unauthorized', '无效的令牌', array('status' => 401));
        }
    }

    public function handle_login($request) {
        $params = $request->get_json_params();
        $username = isset($params['username']) ? sanitize_text_field($params['username']) : '';
        $password = isset($params['password']) ? sanitize_text_field($params['password']) : '';

        $user = wp_authenticate($username, $password);
        if (is_wp_error($user)) {
            return new WP_Error('login_failed', '用户名或密码错误', array('status' => 401));
        }

        // 生成 JWT token
        $token = $this->generate_jwt_token($user);

        return array(
            'success' => true,
            'data' => array(
                'token' => $token,
                'expires_in' => 86400,
                'user' => $this->get_user_data($user)
            )
        );
    }

    private function generate_jwt_token($user) {
        $issued_at = time();
        $expiration = $issued_at + 86400; // 24小时过期

        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expiration,
            'user' => array(
                'id' => $user->ID,
                'email' => $user->user_email
            )
        );

        return JWT::encode($payload, get_option('bjt_jwt_secret'));
    }

    private function get_user_data($user) {
        return array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => isset($user->roles[0]) ? $user->roles[0] : '',
            'region' => get_user_meta($user->ID, 'region', true) ?: 'CN',
            'vipLevel' => (int)get_user_meta($user->ID, 'vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'user_type', true) ?: 'normal'
        );
    }

    public function handle_get_current_user($request) {
        // 简单返回当前用户数据
        $user = wp_get_current_user();
        if (!$user->ID) {
            return new WP_Error('not_logged_in', '用户未登录', array('status' => 401));
        }

        return array(
            'success' => true,
            'data' => $this->get_user_data($user)
        );
    }

    public function handle_get_machines($request) {
        // 模拟返回设备列表数据
        return array(
            'success' => true,
            'data' => array(
                'machines' => array(
                    array(
                        'id' => 'machine1',
                        'name' => '设备1',
                        'status' => 'active',
                        'type' => 'BJT-M1000',
                        'location' => '北京'
                    ),
                    array(
                        'id' => 'machine2',
                        'name' => '设备2',
                        'status' => 'maintenance',
                        'type' => 'BJT-M2000',
                        'location' => '上海'
                    )
                ),
                'total' => 2
            )
        );
    }

    public function handle_get_machine($request) {
        $id = $request['id'];
        
        // 模拟返回单个设备数据
        return array(
            'success' => true,
            'data' => array(
                'id' => $id,
                'name' => '设备' . $id,
                'status' => 'active',
                'type' => 'BJT-M1000',
                'location' => '北京',
                'details' => array(
                    'serial' => 'SN' . rand(1000, 9999),
                    'manufacture_date' => '2024-01-15',
                    'last_maintenance' => '2025-03-10'
                )
            )
        );
    }
} 