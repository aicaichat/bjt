<?php
/**
 * BJT Auth Controller
 * 
 * 处理认证相关的API请求
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT认证控制器类
 */
class BJT_Auth_Controller extends BJT_API_Controller {
    /**
     * 资源基础
     */
    protected $rest_base = 'auth';
    
    /**
     * 注册路由
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
                        'required' => true,
                        'type' => 'string',
                        'description' => '用户名',
                    ),
                    'password' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '密码',
                    ),
                ),
            ),
        ));
        
        // 获取当前用户信息
        register_rest_route($this->namespace, '/' . $this->rest_base . '/me', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_current_user'),
                'permission_callback' => array($this, 'check_authentication'),
            ),
        ));
        
        // 刷新令牌
        register_rest_route($this->namespace, '/' . $this->rest_base . '/refresh', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'refresh_token'),
                'permission_callback' => array($this, 'check_refresh_permission'),
            ),
        ));
        
        // 退出登录
        register_rest_route($this->namespace, '/' . $this->rest_base . '/logout', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'logout'),
                'permission_callback' => array($this, 'check_authentication'),
            ),
        ));
    }
    
    /**
     * 登录
     */
    public function login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');
        
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return $this->error_response('用户名或密码错误', 1001, 401);
        }
        
        // 生成JWT令牌
        $token = $this->generate_token($user);
        
        return $this->success_response(array(
            'token' => $token,
            'expires_in' => 86400, // 24小时过期
            'user' => $this->get_user_data($user),
        ));
    }
    
    /**
     * 获取当前用户
     */
    public function get_current_user($request) {
        $user = wp_get_current_user();
        if (!$user || !$user->ID) {
            return $this->error_response('未授权访问', 1002, 401);
        }
        
        return $this->success_response($this->get_user_data($user));
    }
    
    /**
     * 刷新令牌
     */
    public function refresh_token($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return $this->error_response('未授权访问', 1002, 401);
        }
        
        $token = substr($auth_header, 7);
        
        try {
            // 解析（但不验证过期时间）JWT令牌
            $decoded = $this->decode_token_without_expiration($token);
            
            // 获取用户
            if (!isset($decoded->user) || !isset($decoded->user->id)) {
                return $this->error_response('无效的刷新令牌', 1003, 401);
            }
            
            $user = get_user_by('id', $decoded->user->id);
            if (!$user) {
                return $this->error_response('无效的刷新令牌', 1003, 401);
            }
            
            // 生成新令牌
            $new_token = $this->generate_token($user);
            
            return $this->success_response(array(
                'token' => $new_token,
                'expires_in' => 86400, // 24小时过期
            ));
        } catch (Exception $e) {
            return $this->error_response('无效的刷新令牌', 1003, 401);
        }
    }
    
    /**
     * 退出登录
     */
    public function logout($request) {
        // 实际上，我们无法使JWT令牌失效，因为它是无状态的
        // 客户端应该丢弃令牌
        
        return $this->success_response(null, '已成功退出');
    }
    
    /**
     * 刷新令牌的权限检查
     * (允许过期的令牌)
     */
    public function check_refresh_permission($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return false;
        }
        
        $token = substr($auth_header, 7);
        
        try {
            // 解析（但不验证过期时间）JWT令牌
            $decoded = $this->decode_token_without_expiration($token);
            
            // 验证用户
            if (isset($decoded->user) && isset($decoded->user->id)) {
                $user = get_user_by('id', $decoded->user->id);
                if ($user) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * 生成JWT令牌
     */
    private function generate_token($user) {
        $issued_at = time();
        $expiration = $issued_at + 86400; // 24小时过期
        
        $payload = array(
            'iss' => get_site_url(),
            'iat' => $issued_at,
            'exp' => $expiration,
            'user' => array(
                'id' => $user->ID,
                'email' => $user->user_email,
            ),
        );
        
        return JWT::encode($payload, get_option('bjt_jwt_secret'));
    }
    
    /**
     * 解析JWT令牌但不验证过期时间
     * (用于刷新令牌)
     */
    private function decode_token_without_expiration($token) {
        $tks = explode('.', $token);
        if (count($tks) != 3) {
            throw new Exception('错误的JWT格式');
        }
        
        list($headb64, $bodyb64, $cryptob64) = $tks;
        
        $header = json_decode(JWT::urlsafeB64Decode($headb64));
        if (null === $header) {
            throw new Exception('无效的JWT头部');
        }
        
        $payload = json_decode(JWT::urlsafeB64Decode($bodyb64));
        if (null === $payload) {
            throw new Exception('无效的JWT负载');
        }
        
        $sig = JWT::urlsafeB64Decode($cryptob64);
        
        // 验证签名
        if (!JWT::verify("$headb64.$bodyb64", $sig, get_option('bjt_jwt_secret'), $header->alg)) {
            throw new Exception('JWT签名验证失败');
        }
        
        return $payload;
    }
    
    /**
     * 获取用户数据
     */
    private function get_user_data($user) {
        // 获取用户角色
        $role = '';
        if (!empty($user->roles) && is_array($user->roles)) {
            $role = reset($user->roles);
        }
        
        // 获取自定义用户数据
        $region = get_user_meta($user->ID, 'region', true) ?: 'CN';
        $vip_level = (int) get_user_meta($user->ID, 'vip_level', true) ?: 0;
        $user_type = get_user_meta($user->ID, 'user_type', true) ?: 'normal';
        
        // 获取用户权限
        $permissions = $this->get_user_permissions($user);
        
        return array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => $role,
            'region' => $region,
            'vipLevel' => $vip_level,
            'type' => $user_type,
            'permissions' => $permissions,
        );
    }
    
    /**
     * 获取用户权限
     */
    private function get_user_permissions($user) {
        $permissions = array();
        
        // 基本权限，所有登录用户都有
        $permissions[] = 'read';
        
        // 管理员权限
        if (user_can($user, 'manage_options')) {
            $permissions[] = 'admin';
            $permissions[] = 'view_prices';
            $permissions[] = 'view_inventory';
            $permissions[] = 'add_to_cart';
            $permissions[] = 'place_order';
        } else {
            // 一般用户根据角色和VIP级别获取权限
            $vip_level = (int) get_user_meta($user->ID, 'vip_level', true) ?: 0;
            
            if ($vip_level > 0) {
                $permissions[] = 'view_prices';
            }
            
            if ($vip_level > 1) {
                $permissions[] = 'view_inventory';
            }
            
            $permissions[] = 'add_to_cart';
            $permissions[] = 'place_order';
        }
        
        return $permissions;
    }
} 