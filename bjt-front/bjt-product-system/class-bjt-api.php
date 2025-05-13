<?php
/**
 * BJT API 类
 *
 * 该类提供了BJT API的主要功能和初始化方法
 *
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT API 类
 */
class BJT_API {
    
    /**
     * BJT API 单例
     *
     * @var BJT_API
     */
    private static $instance = null;
    
    /**
     * API 命名空间
     *
     * @var string
     */
    public $namespace = 'bjt/v1';
    
    /**
     * 获取单例实例
     *
     * @return BJT_API
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 构造函数
     */
    private function __construct() {
        // 初始化API
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * 注册API路由
     */
    public function register_routes() {
        // 基本上是一个钩子方法，允许其他控制器注册自己的路由
        do_action('bjt_api_register_routes', $this->namespace);
    }
    
    /**
     * 检查用户认证
     *
     * @return bool|WP_Error 如果用户已认证返回true，否则返回WP_Error
     */
    public function check_authentication() {
        // 检查认证是否被禁用（用于测试）
        if (apply_filters('bjt_api_auth_required', true) === false) {
            return true;
        }
        
        // 从请求头中获取JWT令牌
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        
        if (!$auth_header) {
            return new WP_Error(
                'unauthorized',
                '未授权访问',
                array('status' => 401)
            );
        }
        
        // 提取Bearer令牌
        if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
            $token = $matches[1];
            
            // 在这里验证令牌
            $is_valid = $this->validate_token($token);
            
            if ($is_valid === true) {
                return true;
            }
            
            return new WP_Error(
                'invalid_token',
                '无效的令牌',
                array('status' => 401)
            );
        }
        
        return new WP_Error(
            'unauthorized',
            '未授权访问',
            array('status' => 401)
        );
    }
    
    /**
     * 验证JWT令牌
     *
     * @param string $token JWT令牌
     * @return bool 令牌是否有效
     */
    private function validate_token($token) {
        // 简化的令牌验证，测试模式下总是返回true
        // 在生产环境中，应该实现完整的JWT验证逻辑
        if (defined('BJT_API_TEST_MODE') && BJT_API_TEST_MODE) {
            return true;
        }
        
        // 你可以在此添加完整的JWT验证逻辑
        
        return true; // 暂时返回true以便测试
    }
} 