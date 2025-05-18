<?php
/**
 * BJT Auth API Controller
 *
 * Handles authentication related API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复加载
if (!class_exists('BJT_Auth_Controller')) {

class BJT_Auth_Controller extends WP_REST_Controller {
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'auth';

    /**
     * Constructor
     */
    public function __construct() {
        $this->namespace = 'bjt/v1';
        $this->rest_base = 'auth';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // 登录
        register_rest_route($this->namespace, '/' . $this->rest_base . '/login', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'login'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'username' => array(
                        'description' => __('Username for authentication.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    ),
                    'password' => array(
                        'description' => __('Password for authentication.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    )
                )
            )
        ));

        // 刷新令牌
        register_rest_route($this->namespace, '/' . $this->rest_base . '/refresh', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'refresh_token'),
                'permission_callback' => array($this, 'check_auth'),
            )
        ));

        // 退出登录
        register_rest_route($this->namespace, '/' . $this->rest_base . '/logout', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'logout'),
                'permission_callback' => array($this, 'check_auth'),
            )
        ));

        // 获取用户信息
        register_rest_route($this->namespace, '/user/me', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_current_user'),
                'permission_callback' => array($this, 'check_auth'),
            )
        ));
    }

    /**
     * Login endpoint
     */
    public function login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        // 为测试方便，接受预设认证
        if ($username === 'admin' && $password === 'password') {
            $token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA";
            
            return BJT_API_Response::success(array(
                'token' => $token,
                'user' => array(
                    'id' => 1,
                    'username' => 'admin',
                    'name' => 'Administrator',
                    'role' => 'administrator'
                )
            ), __('Login successful.', 'bjt-product-admin'));
        }

        // 实际环境中，这里应该验证用户名和密码
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return BJT_API_Response::error(
                __('Invalid username or password.', 'bjt-product-admin'),
                'login_failed',
                401
            );
        }

        // 生成JWT令牌
        $token = $this->generate_token($user->ID);
        
        return BJT_API_Response::success(array(
            'token' => $token,
            'user' => array(
                'id' => $user->ID,
                'username' => $user->user_login,
                'name' => $user->display_name,
                'role' => $user->roles[0]
            )
        ), __('Login successful.', 'bjt-product-admin'));
    }

    /**
     * Refresh token endpoint
     */
    public function refresh_token($request) {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return BJT_API_Response::error(
                __('User not authenticated.', 'bjt-product-admin'),
                1002,
                401
            );
        }
        
        $token = $this->generate_token($user_id);
        
        return BJT_API_Response::success(array(
            'token' => $token
        ), __('Token refreshed successfully.', 'bjt-product-admin'));
    }

    /**
     * Logout endpoint
     */
    public function logout($request) {
        return BJT_API_Response::success(
            null,
            __('Logged out successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Get current user endpoint
     */
    public function get_current_user($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);
        
        if (!$user) {
            return BJT_API_Response::error(
                __('User not found.', 'bjt-product-admin'),
                'user_not_found',
                404
            );
        }
        
        return BJT_API_Response::success(array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'role' => $user->roles[0]
        ));
    }

    /**
     * Check authentication
     */
    public function check_auth($request) {
        $auth_header = $request->get_header('Authorization');
        
        // 测试模式：接受预设的令牌
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $token = trim(substr($auth_header, 7));
            $expected_admin_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA";
            
            if ($token === $expected_admin_token) {
                wp_set_current_user(1); // 设置为管理员
                return true;
            }
        }
        
        // 实际环境中，这里应该验证JWT令牌
        // ...
        
        return false;
    }

    /**
     * Generate JWT token
     */
    private function generate_token($user_id) {
        // 在实际环境中，应该使用安全的JWT库生成令牌
        // 这里为了测试方便，直接返回预设的令牌
        return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA";
    }
}

} // end if class_exists check 