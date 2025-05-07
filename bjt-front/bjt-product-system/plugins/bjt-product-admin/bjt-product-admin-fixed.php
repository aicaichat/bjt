<?php
/**
 * Plugin Name: BJT Product Admin (Fixed)
 * Plugin URI: https://www.bjt.com
 * Description: Product management system for BJT company - Fixed version
 * Version: 1.0.1
 * Author: BJT Team
 * Author URI: https://www.bjt.com
 * Text Domain: bjt-product-admin
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// 定义常量
define('BJT_PRODUCT_ADMIN_VERSION', '1.0.1');
define('BJT_PRODUCT_ADMIN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BJT_PRODUCT_ADMIN_PLUGIN_URL', plugin_dir_url(__FILE__));

// 核心文件
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-product-line-management.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-product-lines-controller.php';

/**
 * Plugin activation
 */
function bjt_product_admin_activate() {
    // 创建表
    $product_line_management = BJT_Product_Line_Management::get_instance();
    if ($product_line_management) {
        try {
            $product_line_management->create_tables();
            update_option('bjt_product_admin_db_version', BJT_PRODUCT_ADMIN_VERSION);
        } catch (Exception $e) {
            error_log('BJT Product Admin activation error: ' . $e->getMessage());
        }
    }
    
    // 刷新重写规则
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'bjt_product_admin_activate');

/**
 * Plugin deactivation
 */
function bjt_product_admin_deactivate() {
    // 清理
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'bjt_product_admin_deactivate');

/**
 * Initialize the plugin
 */
function bjt_product_admin_init() {
    // 加载文本域
    load_plugin_textdomain('bjt-product-admin', false, dirname(plugin_basename(__FILE__)) . '/languages');
    
    // 注册 REST API 路由
    add_action('rest_api_init', 'bjt_product_admin_register_rest_routes');
}
add_action('init', 'bjt_product_admin_init');

/**
 * Register REST API routes
 */
function bjt_product_admin_register_rest_routes() {
    $controller = new BJT_Product_Lines_Controller();
    $controller->register_routes();
}

/**
 * Add admin menu
 */
function bjt_product_admin_menu() {
    add_menu_page(
        __('BJT Product Admin', 'bjt-product-admin'),
        __('BJT Product', 'bjt-product-admin'),
        'manage_options',
        'bjt-product-admin',
        'bjt_product_admin_page',
        'dashicons-products',
        30
    );
    
    add_submenu_page(
        'bjt-product-admin',
        __('Product Lines', 'bjt-product-admin'),
        __('Product Lines', 'bjt-product-admin'),
        'manage_options',
        'bjt-product-lines',
        'bjt_product_lines_page'
    );
}
add_action('admin_menu', 'bjt_product_admin_menu');

/**
 * Render admin page
 */
function bjt_product_admin_page() {
    include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/main.php';
}

/**
 * Render product lines page
 */
function bjt_product_lines_page() {
    include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines.php';
}

/**
 * Enqueue admin scripts and styles
 */
function bjt_product_admin_enqueue_scripts($hook) {
    if (strpos($hook, 'bjt-product-admin') === false) {
        return;
    }
    
    wp_enqueue_style(
        'bjt-product-admin-style',
        BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/css/admin.css',
        array(),
        BJT_PRODUCT_ADMIN_VERSION
    );
    
    wp_enqueue_script(
        'bjt-product-admin-script',
        BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/admin.js',
        array('jquery'),
        BJT_PRODUCT_ADMIN_VERSION,
        true
    );
    
    wp_localize_script('bjt-product-admin-script', 'bjt_admin', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('bjt_product_line_nonce'),
        'rest_url' => rest_url('bjt/v1/'),
        'rest_nonce' => wp_create_nonce('wp_rest'),
        'i18n' => array(
            'confirm_delete' => __('Are you sure you want to delete this item?', 'bjt-product-admin'),
            'confirm_batch_delete' => __('Are you sure you want to delete the selected items?', 'bjt-product-admin'),
            'save_success' => __('Saved successfully', 'bjt-product-admin'),
            'error' => __('An error occurred', 'bjt-product-admin')
        )
    ));
}
add_action('admin_enqueue_scripts', 'bjt_product_admin_enqueue_scripts'); 