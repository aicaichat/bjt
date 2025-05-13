<?php
/**
 * Plugin Name: BJT API Implementation
 * Description: 实现BJT产品管理系统API
 * Version: 1.0.0
 * Author: System
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

// 定义常量
define('BJT_API_DIR', plugin_dir_path(__FILE__));
define('BJT_API_URL', plugin_dir_url(__FILE__));
define('BJT_API_VERSION', '1.0.0');

// 加载必要文件
require_once BJT_API_DIR . 'class-jwt.php';
require_once BJT_API_DIR . 'controllers/class-bjt-api-controller.php';
require_once BJT_API_DIR . 'controllers/class-bjt-auth-controller.php';
require_once BJT_API_DIR . 'controllers/class-bjt-machines-controller.php';
require_once BJT_API_DIR . 'controllers/class-bjt-product-lines-controller.php';
require_once BJT_API_DIR . 'controllers/class-bjt-accessories-controller.php';
require_once BJT_API_DIR . 'controllers/class-bjt-consumables-controller.php';

/**
 * 主插件类
 */
class BJT_API_Plugin {
    /**
     * 插件单例实例
     */
    private static $instance = null;
    
    /**
     * 获取插件单例实例
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 私有构造函数
     */
    private function __construct() {
        // 在初始化时添加钩子
        add_action('plugins_loaded', array($this, 'init'));
        
        // 添加激活钩子
        register_activation_hook(__FILE__, array($this, 'activate'));
        
        // 添加停用钩子
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * 初始化插件
     */
    public function init() {
        // 加载控制器
        $this->load_controllers();
        
        // 确保我们有JWT密钥
        $this->ensure_jwt_secret();
        
        // 添加API前缀
        add_filter('rest_url_prefix', array($this, 'rest_url_prefix'));
    }
    
    /**
     * 加载控制器
     */
    private function load_controllers() {
        // 加载控制器并注册路由
        add_action('rest_api_init', function() {
            // 认证控制器
            $auth_controller = new BJT_Auth_Controller();
            $auth_controller->register_routes();
            
            // 设备控制器
            $machines_controller = new BJT_Machines_Controller();
            $machines_controller->register_routes();
            
            // 产品线控制器
            $product_lines_controller = new BJT_Product_Lines_Controller();
            $product_lines_controller->register_routes();
            
            // 配件控制器
            $accessories_controller = new BJT_Accessories_Controller();
            $accessories_controller->register_routes();
            
            // 耗材控制器
            $consumables_controller = new BJT_Consumables_Controller();
            $consumables_controller->register_routes();
        });
    }
    
    /**
     * 确保我们有JWT密钥
     */
    private function ensure_jwt_secret() {
        $secret = get_option('bjt_jwt_secret');
        if (!$secret) {
            // 生成一个随机的密钥
            $secret = bin2hex(random_bytes(32));
            update_option('bjt_jwt_secret', $secret);
        }
    }
    
    /**
     * 自定义REST API URL前缀
     */
    public function rest_url_prefix($prefix) {
        // 保持默认的wp-json前缀
        return $prefix;
    }
    
    /**
     * 插件激活时触发
     */
    public function activate() {
        // 设置JWT密钥
        $this->ensure_jwt_secret();
        
        // 刷新重写规则
        flush_rewrite_rules();
    }
    
    /**
     * 插件停用时触发
     */
    public function deactivate() {
        // 刷新重写规则
        flush_rewrite_rules();
    }
}

// 初始化插件
BJT_API_Plugin::get_instance(); 