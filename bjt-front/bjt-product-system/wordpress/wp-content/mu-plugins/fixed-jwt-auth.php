<?php
/**
 * BJT JWT Auth Plugin - JWT认证插件
 * 
 * 提供完整的JWT认证功能，修复了之前的问题
 * 
 * @package     BJT_Product_Management
 * @author      BJT Development Team
 * @copyright   2025 BJT Corporation
 */

// 如果直接访问此文件则退出
if (!defined('ABSPATH')) {
    die('不允许直接访问此文件');
}

/**
 * 初始化JWT密钥
 */
function bjt_init_jwt_secret() {
    // 检查是否已经设置了JWT密钥
    $secret = get_option('bjt_jwt_secret', '');
    
    // 如果没有密钥，生成一个默认密钥
    if (empty($secret)) {
        $secret = 'bjt-secret-key-2023';
        update_option('bjt_jwt_secret', $secret);
    }
    
    // 定义用于JWT的常量，以便在其他地方使用
    if (!defined('BJT_JWT_SECRET')) {
        define('BJT_JWT_SECRET', $secret);
    }
}

// 在WordPress初始化时设置JWT密钥
add_action('init', 'bjt_init_jwt_secret');

/**
 * JWT令牌生成函数
 *
 * @param int $user_id 用户ID
 * @return string 生成的JWT令牌
 */
function bjt_generate_jwt_token($user_id) {
    // 确保已初始化JWT密钥
    if (!defined('BJT_JWT_SECRET')) {
        bjt_init_jwt_secret();
    }
    
    $issued_at = time();
    $expiration = $issued_at + (DAY_IN_SECONDS); // 令牌有效期24小时
    
    // 获取用户信息
    $user = get_userdata($user_id);
    
    // 令牌头部
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];
    
    // 令牌载荷
    $payload = [
        'iss' => get_site_url(), // 发行者
        'iat' => $issued_at,     // 发行时间
        'exp' => $expiration,    // 过期时间
        'user' => [
            'id' => $user_id,
            'login' => $user->user_login,
            'email' => $user->user_email,
            'roles' => $user->roles
        ]
    ];
    
    // 编码头部和载荷
    $header_encoded = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    
    // 签名
    $signature = hash_hmac('sha256', "{$header_encoded}.{$payload_encoded}", BJT_JWT_SECRET, true);
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    // 组合JWT令牌
    $token = "{$header_encoded}.{$payload_encoded}.{$signature_encoded}";
    
    return $token;
}

/**
 * 验证JWT令牌
 *
 * @param string $token 需要验证的JWT令牌
 * @return array|WP_Error 验证成功返回解码后的载荷数据，失败返回错误
 */
function bjt_validate_jwt_token($token) {
    // 确保已初始化JWT密钥
    if (!defined('BJT_JWT_SECRET')) {
        bjt_init_jwt_secret();
    }
    
    // 分解令牌
    $token_parts = explode('.', $token);
    
    // 验证令牌格式
    if (count($token_parts) !== 3) {
        return new WP_Error('invalid_token', '无效的令牌格式', ['status' => 401]);
    }
    
    list($header_encoded, $payload_encoded, $signature_encoded) = $token_parts;
    
    // 验证签名
    $signature = hash_hmac('sha256', "{$header_encoded}.{$payload_encoded}", BJT_JWT_SECRET, true);
    $signature_check = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    if ($signature_encoded !== $signature_check) {
        return new WP_Error('invalid_signature', '无效的令牌签名', ['status' => 401]);
    }
    
    // 解码载荷
    $payload = json_decode(base64_decode(strtr($payload_encoded, '-_', '+/')), true);
    
    // 验证令牌是否过期
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return new WP_Error('expired_token', '令牌已过期', ['status' => 401]);
    }
    
    return $payload;
}

// 添加API路由
add_action('rest_api_init', 'bjt_register_jwt_routes');

/**
 * 注册JWT API路由
 */
function bjt_register_jwt_routes() {
    // 登录接口
    register_rest_route('bjt/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => 'bjt_api_login',
        'permission_callback' => '__return_true',
    ]);
    
    // 验证令牌接口
    register_rest_route('bjt/v1', '/auth/validate', [
        'methods' => 'POST',
        'callback' => 'bjt_api_validate_token',
        'permission_callback' => '__return_true',
    ]);
    
    // 刷新令牌接口
    register_rest_route('bjt/v1', '/auth/refresh', [
        'methods' => 'POST',
        'callback' => 'bjt_api_refresh_token',
        'permission_callback' => '__return_true',
    ]);
    
    // 用户信息接口
    register_rest_route('bjt/v1', '/user/me', [
        'methods' => 'GET',
        'callback' => 'bjt_api_get_user_info',
        'permission_callback' => '__return_true',
    ]);
    
    // 生成测试令牌接口
    register_rest_route('bjt/v1', '/auth/generate-test-token', [
        'methods' => 'GET',
        'callback' => 'bjt_api_generate_test_token',
        'permission_callback' => '__return_true',
    ]);
}

/**
 * 用户登录API回调
 *
 * @param WP_REST_Request $request API请求对象
 * @return WP_REST_Response|WP_Error 登录成功返回令牌，失败返回错误
 */
function bjt_api_login($request) {
    $username = $request->get_param('username');
    $password = $request->get_param('password');
    
    // 验证用户名和密码
    $user = wp_authenticate($username, $password);
    
    // 验证失败
    if (is_wp_error($user)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '用户名或密码错误',
            'data' => null
        ], 401);
    }
    
    // 生成令牌
    $token = bjt_generate_jwt_token($user->ID);
    
    // 返回令牌和用户信息
    return new WP_REST_Response([
        'success' => true,
        'message' => '登录成功',
        'data' => [
            'token' => $token,
            'expires_in' => DAY_IN_SECONDS,
            'user' => [
                'id' => $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'roles' => $user->roles
            ]
        ]
    ], 200);
}

/**
 * 验证令牌API回调
 *
 * @param WP_REST_Request $request API请求对象
 * @return WP_REST_Response|WP_Error 验证成功返回用户信息，失败返回错误
 */
function bjt_api_validate_token($request) {
    $token = $request->get_param('token');
    
    // 如果没有提供令牌，尝试从请求头获取
    if (empty($token)) {
        $auth_header = $request->get_header('authorization');
        if (!empty($auth_header) && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
        }
    }
    
    // 验证令牌
    $payload = bjt_validate_jwt_token($token);
    
    if (is_wp_error($payload)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $payload->get_error_message(),
            'data' => null
        ], 401);
    }
    
    // 返回成功响应
    return new WP_REST_Response([
        'success' => true,
        'message' => '令牌有效',
        'data' => [
            'user' => $payload['user']
        ]
    ], 200);
}

/**
 * 刷新令牌API回调
 *
 * @param WP_REST_Request $request API请求对象
 * @return WP_REST_Response|WP_Error 刷新成功返回新令牌，失败返回错误
 */
function bjt_api_refresh_token($request) {
    $token = $request->get_param('token');
    
    // 如果没有提供令牌，尝试从请求头获取
    if (empty($token)) {
        $auth_header = $request->get_header('authorization');
        if (!empty($auth_header) && strpos($auth_header, 'Bearer ') === 0) {
            $token = substr($auth_header, 7);
        }
    }
    
    // 验证令牌
    $payload = bjt_validate_jwt_token($token);
    
    if (is_wp_error($payload)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $payload->get_error_message(),
            'data' => null
        ], 401);
    }
    
    // 生成新令牌
    $new_token = bjt_generate_jwt_token($payload['user']['id']);
    
    // 返回新令牌
    return new WP_REST_Response([
        'success' => true,
        'message' => '令牌已刷新',
        'data' => [
            'token' => $new_token,
            'expires_in' => DAY_IN_SECONDS,
            'user' => $payload['user']
        ]
    ], 200);
}

/**
 * 获取用户信息API回调
 *
 * @param WP_REST_Request $request API请求对象
 * @return WP_REST_Response|WP_Error 获取成功返回用户信息，失败返回错误
 */
function bjt_api_get_user_info($request) {
    // 从请求头获取令牌
    $auth_header = $request->get_header('authorization');
    if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '未提供授权令牌',
            'data' => null
        ], 401);
    }
    
    $token = substr($auth_header, 7);
    
    // 验证令牌
    $payload = bjt_validate_jwt_token($token);
    
    if (is_wp_error($payload)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $payload->get_error_message(),
            'data' => null
        ], 401);
    }
    
    // 获取用户信息
    $user_id = $payload['user']['id'];
    $user = get_userdata($user_id);
    
    if (!$user) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '用户不存在',
            'data' => null
        ], 404);
    }
    
    // 返回用户信息
    return new WP_REST_Response([
        'success' => true,
        'message' => '获取用户信息成功',
        'data' => [
            'user' => [
                'id' => $user->ID,
                'username' => $user->user_login,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'roles' => $user->roles,
                'created_at' => $user->user_registered
            ]
        ]
    ], 200);
}

/**
 * 生成测试令牌API回调
 * 
 * @param WP_REST_Request $request API请求对象
 * @return WP_REST_Response 返回测试令牌
 */
function bjt_api_generate_test_token($request) {
    // 确保已设置JWT密钥
    $secret = get_option('bjt_jwt_secret', '');
    if (empty($secret)) {
        $secret = 'bjt-secret-key-2023';
        update_option('bjt_jwt_secret', $secret);
    }
    
    if (!defined('BJT_JWT_SECRET')) {
        define('BJT_JWT_SECRET', $secret);
    }
    
    // 定义测试令牌内容
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];
    
    $payload = [
        'iss' => get_site_url(),
        'iat' => 1683000000,  // 2023年5月2日的时间戳
        'exp' => 1999999999,  // 2033年5月18日的时间戳
        'user' => [
            'id' => 1,  // 管理员用户ID
            'login' => 'admin',
            'email' => 'admin@example.com',
            'roles' => ['administrator']
        ]
    ];
    
    // 编码头部和载荷
    $header_encoded = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $payload_encoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    
    // 签名
    $signature = hash_hmac('sha256', "{$header_encoded}.{$payload_encoded}", BJT_JWT_SECRET, true);
    $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    // 组合JWT令牌
    $token = "{$header_encoded}.{$payload_encoded}.{$signature_encoded}";
    
    return new WP_REST_Response([
        'success' => true,
        'message' => '生成测试令牌成功',
        'data' => [
            'token' => $token,
            'expires_in' => 1999999999 - 1683000000,
            'header' => $header,
            'payload' => $payload,
            'key' => $secret
        ]
    ], 200);
} 