<?php
/**
 * BJT Product Admin Main Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Admin {
    /**
     * The single instance of the class
     */
    private static $instance = null;

    /**
     * Main BJT_Product_Admin Instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    public function __construct() {
        // 加载必要的文件
        $this->includes();
        
        // 初始化管理页面
        add_action('admin_menu', array($this, 'admin_menu'));
        
        // 加载样式和脚本
        add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
    }

    /**
     * Initialize the plugin
     */
    public function init() {
        // 加载文本域
        load_plugin_textdomain('bjt-product-admin', false, dirname(plugin_basename(BJT_PLUGIN_FILE)) . '/languages');
        
        // 初始化各个管理类
        $this->init_managers();

        // 注册 REST API 路由
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Add initialization code here
        add_action('admin_init', array($this, 'admin_init'));
    }

    /**
     * Initialize admin
     */
    public function admin_init() {
        // Register settings
        register_setting('bjt_product_admin_options', 'bjt_product_admin_options');
    }

    private function includes() {
        // 加载函数文件
        require_once BJT_PLUGIN_DIR . 'includes/functions.php';
        
        // 加载管理类文件
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-admin-pages.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-host-management.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-product-line-management.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-part-management.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-air-cushion-management.php';
    }

    private function init_managers() {
        // 初始化各个管理类
        BJT_Host_Management::get_instance();
        BJT_Product_Line_Management::get_instance();
        BJT_Part_Management::get_instance();
        BJT_Air_Cushion_Management::get_instance();
    }

    /**
     * Add menu items
     */
    public function admin_menu() {
        // Menu items are now handled by BJT_Admin_Pages class
    }

    public function render_admin_page() {
        // 渲染主管理页面
        include BJT_PLUGIN_DIR . 'includes/templates/admin/main.php';
    }

    public function admin_scripts($hook) {
        // 只在插件页面加载资源
        if (strpos($hook, 'bjt-product-admin') === false) {
            return;
        }

        // 注册和加载样式
        wp_enqueue_style(
            'bjt-product-admin-style',
            BJT_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            BJT_PLUGIN_VERSION
        );

        // 注册和加载脚本
        wp_enqueue_script(
            'bjt-product-admin-script',
            BJT_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            BJT_PLUGIN_VERSION,
            true
        );

        // 本地化脚本
        wp_localize_script(
            'bjt-product-admin-script',
            'bjtProductAdmin',
            array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('bjt-product-admin-nonce'),
                'i18n' => array(
                    'confirm_delete' => __('确定要删除吗？此操作无法撤销。', 'bjt-product-admin'),
                    'success' => __('操作成功', 'bjt-product-admin'),
                    'error' => __('操作失败', 'bjt-product-admin')
                )
            )
        );
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        // 产品线路由
        register_rest_route('bjt/v1', '/product-lines', array(
            'methods' => 'GET',
            'callback' => array(BJT_Product_Line_Management::get_instance(), 'get_product_lines'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        register_rest_route('bjt/v1', '/product-lines/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array(BJT_Product_Line_Management::get_instance(), 'get_product_line'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        // 设备路由
        register_rest_route('bjt/v1', '/machines', array(
            'methods' => 'GET',
            'callback' => array(BJT_Host_Management::get_instance(), 'get_machines'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        register_rest_route('bjt/v1', '/machines/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array(BJT_Host_Management::get_instance(), 'get_machine'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        // 配件路由
        register_rest_route('bjt/v1', '/accessories', array(
            'methods' => 'GET',
            'callback' => array(BJT_Air_Cushion_Management::get_instance(), 'get_accessories'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        register_rest_route('bjt/v1', '/accessories/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array(BJT_Air_Cushion_Management::get_instance(), 'get_accessory'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        // 耗材路由
        register_rest_route('bjt/v1', '/consumables', array(
            'methods' => 'GET',
            'callback' => array(BJT_Part_Management::get_instance(), 'get_consumables'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        register_rest_route('bjt/v1', '/consumables/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array(BJT_Part_Management::get_instance(), 'get_consumable'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        // 价格路由
        register_rest_route('bjt/v1', '/prices/batch', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_batch_prices'),
            'permission_callback' => array($this, 'check_api_permission')
        ));

        // 库存路由
        register_rest_route('bjt/v1', '/inventory/batch', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_batch_inventory'),
            'permission_callback' => array($this, 'check_api_permission')
        ));
    }

    /**
     * Check API permission
     */
    public function check_api_permission() {
        // 检查 JWT token
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (empty($auth_header) || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return new WP_Error(
                'rest_forbidden',
                'Authentication required.',
                array('status' => 401)
            );
        }

        $token = $matches[1];
        // TODO: 实现 JWT 验证
        return true;
    }

    /**
     * Get batch prices
     */
    public function get_batch_prices($request) {
        $params = $request->get_json_params();
        $items = $params['items'] ?? array();
        $region = $params['region'] ?? 'CN';

        $result = array(
            'items' => array(),
            'total' => array(
                'amount' => 0,
                'currency' => 'CNY'
            )
        );

        foreach ($items as $item) {
            // TODO: 实现批量价格查询
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $result
        ));
    }

    /**
     * Get batch inventory
     */
    public function get_batch_inventory($request) {
        $params = $request->get_json_params();
        $items = $params['items'] ?? array();
        $region = $params['region'] ?? 'CN';
        $warehouse = $params['warehouse'] ?? 'MAIN';

        $result = array(
            'items' => array()
        );

        foreach ($items as $item) {
            // TODO: 实现批量库存查询
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $result
        ));
    }}
