<?php
/**
 * 认证 API 端点
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * 认证 API 端点类
 *
 * 处理用户认证相关的API请求
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 * @author     BJT Team
 */
class BJT_Auth_Endpoint {

    /**
     * API命名空间
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $namespace    API命名空间
     */
    private $namespace;

    /**
     * JWT密钥
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $jwt_key    JWT密钥
     */
    private $jwt_key;

    /**
     * 令牌过期时间（秒）
     *
     * @since    1.0.0
     * @access   private
     * @var      int    $token_expiry    令牌过期时间
     */
    private $token_expiry;

    /**
     * 构造函数
     *
     * @since    1.0.0
     * @param    string    $namespace    API命名空间
     */
    public function __construct($namespace) {
        $this->namespace = $namespace;
        // 从WordPress配置获取JWT密钥，如果未定义则使用WordPress密钥
        $this->jwt_key = defined('BJT_JWT_KEY') ? BJT_JWT_KEY : SECURE_AUTH_KEY;
        // 设置令牌过期时间为24小时
        $this->token_expiry = 86400;
    }

    /**
     * 注册路由
     *
     * @since    1.0.0
     */
    public function register_routes() {
        // 用户登录
        register_rest_route($this->namespace, '/auth/login', array(
            array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'login'),
                'permission_callback' => '__return_true',
                'args'     => array(
                    'username' => array(
                        'description' => '用户名',
                        'type'        => 'string',
                        'required'    => true,
                    ),
                    'password' => array(
                        'description' => '密码',
                        'type'        => 'string',
                        'required'    => true,
                    ),
                ),
            ),
        ));

        // 获取当前用户信息
        register_rest_route($this->namespace, '/auth/me', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_current_user'),
                'permission_callback' => array($this, 'check_user_logged_in'),
            ),
        ));

        // 刷新令牌
        register_rest_route($this->namespace, '/auth/refresh', array(
            array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'refresh_token'),
                'permission_callback' => array($this, 'check_user_logged_in'),
            ),
        ));

        // 注销登录
        register_rest_route($this->namespace, '/auth/logout', array(
            array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'logout'),
                'permission_callback' => array($this, 'check_user_logged_in'),
            ),
        ));
    }

    /**
     * 用户登录
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        // 验证用户凭据
        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => '用户名或密码不正确',
                'code'    => 1001
            ), 401);
        }

        // 生成JWT令牌
        $token = $this->generate_token($user);

        // 获取用户信息
        $user_data = $this->get_user_data($user);

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => array(
                'token'      => $token,
                'expires_in' => $this->token_expiry,
                'user'       => $user_data,
            ),
        ), 200);
    }

    /**
     * 获取当前用户信息
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_current_user($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user) {
            return new WP_REST_Response(array(
                'success' => false,
                'code'    => 401,
                'message' => '未认证',
            ), 401);
        }

        $user_data = $this->get_user_data($user);

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => $user_data,
        ), 200);
    }

    /**
     * 刷新令牌
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function refresh_token($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);

        if (!$user) {
            return new WP_REST_Response(array(
                'success' => false,
                'code'    => 401,
                'message' => '未认证',
            ), 401);
        }

        // 生成新的JWT令牌
        $token = $this->generate_token($user);

        return new WP_REST_Response(array(
            'success' => true,
            'data'    => array(
                'token'      => $token,
                'expires_in' => $this->token_expiry,
            ),
        ), 200);
    }

    /**
     * 注销登录
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function logout($request) {
        // 在此处添加令牌黑名单逻辑（如果需要）

        return new WP_REST_Response(array(
            'success' => true,
            'message' => '已成功注销',
        ), 200);
    }

    /**
     * 检查用户是否已登录
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function check_user_logged_in($request) {
        $authorization = $request->get_header('authorization');

        if (empty($authorization)) {
            return new WP_Error(
                'rest_unauthorized',
                '未提供授权令牌',
                array('status' => 401)
            );
        }

        // 检查Authorization头格式
        if (strpos($authorization, 'Bearer ') !== 0) {
            return new WP_Error(
                'rest_unauthorized',
                '授权头格式不正确，应为"Bearer {token}"',
                array('status' => 401)
            );
        }

        // 提取令牌
        $token = substr($authorization, 7);

        try {
            // 验证令牌并获取负载
            $payload = $this->validate_token($token);

            // 设置当前用户
            wp_set_current_user($payload['user_id']);

            return true;
        } catch (Exception $e) {
            return new WP_Error(
                'rest_unauthorized',
                $e->getMessage(),
                array('status' => 401)
            );
        }
    }

    /**
     * 生成JWT令牌
     *
     * @since    1.0.0
     * @param    WP_User    $user    用户对象
     * @return   string     JWT令牌
     */
    private function generate_token($user) {
        $issued_at = time();
        $expiration = $issued_at + $this->token_expiry;

        $payload = array(
            'iss'  => get_bloginfo('url'),
            'iat'  => $issued_at,
            'exp'  => $expiration,
            'user_id' => $user->ID,
        );

        // 使用第三方JWT库（如需要）
        if (class_exists('Firebase\JWT\JWT')) {
            return \Firebase\JWT\JWT::encode($payload, $this->jwt_key, 'HS256');
        }

        // 简单的JWT实现（生产环境建议使用专业JWT库）
        $header = base64_encode(json_encode(array(
            'alg' => 'HS256',
            'typ' => 'JWT'
        )));

        $payload = base64_encode(json_encode($payload));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $this->jwt_key, true));

        return "$header.$payload.$signature";
    }

    /**
     * 验证JWT令牌
     *
     * @since    1.0.0
     * @param    string    $token    JWT令牌
     * @return   array     令牌负载
     * @throws   Exception 验证失败时抛出异常
     */
    private function validate_token($token) {
        // 使用第三方JWT库（如需要）
        if (class_exists('Firebase\JWT\JWT')) {
            try {
                $payload = \Firebase\JWT\JWT::decode($token, $this->jwt_key, array('HS256'));
                return (array) $payload;
            } catch (Exception $e) {
                throw new Exception('令牌无效');
            }
        }

        // 简单的JWT验证（生产环境建议使用专业JWT库）
        $token_parts = explode('.', $token);

        if (count($token_parts) !== 3) {
            throw new Exception('令牌格式不正确');
        }

        list($header, $payload, $signature) = $token_parts;

        $payload_data = json_decode(base64_decode($payload), true);

        if (!is_array($payload_data)) {
            throw new Exception('令牌负载无效');
        }

        // 检查令牌是否过期
        if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
            throw new Exception('令牌已过期');
        }

        // 验证签名
        $expected_signature = base64_encode(hash_hmac('sha256', "$header.$payload", $this->jwt_key, true));
        if (!hash_equals($signature, $expected_signature)) {
            throw new Exception('令牌签名无效');
        }

        return $payload_data;
    }

    /**
     * 获取用户数据
     *
     * @since    1.0.0
     * @param    WP_User    $user    用户对象
     * @return   array      用户数据
     */
    private function get_user_data($user) {
        // 获取用户角色和地区（可以从用户元数据中获取）
        $role = !empty($user->roles) ? $user->roles[0] : '';
        $region = get_user_meta($user->ID, 'bjt_region', true) ?: 'CN';
        $vip_level = (int) get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0;
        
        // 获取用户权限
        $permissions = $this->get_user_permissions($user);

        return array(
            'id'          => $user->ID,
            'username'    => $user->user_login,
            'email'       => $user->user_email,
            'name'        => $user->display_name,
            'role'        => $role,
            'region'      => $region,
            'vipLevel'    => $vip_level,
            'permissions' => $permissions,
        );
    }

    /**
     * 获取用户权限
     *
     * @since    1.0.0
     * @param    WP_User    $user    用户对象
     * @return   array      用户权限
     */
    private function get_user_permissions($user) {
        $permissions = array();

        // 产品查看权限
        if (user_can($user, 'read_bjt_product_lines') || user_can($user, 'edit_bjt_product_lines')) {
            $permissions[] = 'view_products';
        }

        // 价格查看权限
        if (user_can($user, 'read_bjt_prices') || user_can($user, 'edit_bjt_prices')) {
            $permissions[] = 'view_prices';
        }

        // 库存查看权限
        if (user_can($user, 'read_bjt_inventory') || user_can($user, 'edit_bjt_inventory')) {
            $permissions[] = 'view_inventory';
        }

        // 主机管理权限
        if (user_can($user, 'edit_bjt_host_models')) {
            $permissions[] = 'manage_host_models';
        }

        // 配件管理权限
        if (user_can($user, 'edit_bjt_accessories')) {
            $permissions[] = 'manage_accessories';
        }

        // 耗材管理权限
        if (user_can($user, 'edit_bjt_consumables')) {
            $permissions[] = 'manage_consumables';
        }

        // 备件管理权限
        if (user_can($user, 'edit_bjt_spare_parts')) {
            $permissions[] = 'manage_spare_parts';
        }

        // 管理员权限
        if (user_can($user, 'manage_options')) {
            $permissions[] = 'admin';
        }

        return $permissions;
    }
} 