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
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-accessory-management.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-consumable-management.php';
        require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-spare-part-management.php';
    }

    private function init_managers() {
        // 初始化各个管理类
        BJT_Host_Management::get_instance();
        BJT_Accessory_Management::get_instance();
        BJT_Consumable_Management::get_instance();
        BJT_Spare_Part_Management::get_instance();
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
} 