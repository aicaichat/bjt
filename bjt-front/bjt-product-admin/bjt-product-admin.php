<?php
/**
 * Plugin Name: BJT Product Admin
 * Plugin URI: https://www.bjt.com
 * Description: BJT产品管理系统
 * Version: 1.0.0
 * Author: BJT Team
 * Author URI: https://www.bjt.com
 * Text Domain: bjt-product-admin
 * Domain Path: /languages
 * License: GPL2
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BJT_PLUGIN_FILE', __FILE__);
define('BJT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BJT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('BJT_PLUGIN_VERSION', '1.0.0');

// Enable debug mode if not already enabled
if (!defined('WP_DEBUG')) {
    define('WP_DEBUG', true);
}
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}
if (!defined('WP_DEBUG_DISPLAY')) {
    define('WP_DEBUG_DISPLAY', false);
}

// Custom error logging
if (!function_exists('bjt_log_error')) {
    function bjt_log_error($message, $data = null) {
        if (WP_DEBUG_LOG) {
            $log_message = date('[Y-m-d H:i:s] ') . $message;
            if ($data !== null) {
                $log_message .= ' Data: ' . print_r($data, true);
            }
            error_log($log_message);
        }
    }
}

// Include required files
require_once BJT_PLUGIN_DIR . 'includes/functions.php';
require_once BJT_PLUGIN_DIR . 'includes/class-bjt-product-admin.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-admin-pages.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-product-line-management.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-host-management.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-part-management.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-air-cushion-management.php';
require_once BJT_PLUGIN_DIR . 'includes/class-bjt-install.php';
require_once BJT_PLUGIN_DIR . 'includes/class-bjt-ajax.php';
require_once BJT_PLUGIN_DIR . 'includes/class-bjt-product.php';
require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-admin.php';

// Create database tables on activation
register_activation_hook(__FILE__, 'bjt_product_admin_activate');
function bjt_product_admin_activate() {
    // Load required files
    require_once BJT_PLUGIN_DIR . 'includes/admin/class-bjt-host-management.php';
    
    // Create database tables
    BJT_Host_Management::get_instance()->create_tables();
    
    // Set version
    update_option('bjt_product_admin_version', BJT_PLUGIN_VERSION);
    
    // Set flag to flush rewrite rules
    update_option('bjt_flush_rewrite_rules', true);
}

// Clean up on deactivation
register_deactivation_hook(__FILE__, 'bjt_product_admin_deactivate');
function bjt_product_admin_deactivate() {
    // Clean up plugin data (if needed)
    // delete_option('bjt_product_admin_version');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}

// Plugin initialization
function bjt_product_admin_init() {
    // Load text domain
    load_plugin_textdomain(
        'bjt-product-admin',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );

    // Initialize the main plugin
    $plugin = BJT_Product_Admin::get_instance();
    $plugin->init();

    // Initialize admin pages
    BJT_Admin_Pages::get_instance();
    
    // Initialize product line management
    BJT_Product_Line_Management::get_instance();
    
    // Initialize host management
    BJT_Host_Management::get_instance();
    
    // Initialize part management
    BJT_Part_Management::get_instance();
}
add_action('plugins_loaded', 'bjt_product_admin_init');

// Register and enqueue admin scripts and styles
function bjt_product_admin_enqueue_scripts($hook) {
    // 在所有WordPress管理页面加载基本样式
    if (is_admin()) {
    // Register styles
    wp_register_style(
        'bjt-product-admin-style',
            BJT_PLUGIN_URL . 'assets/css/admin.css',
        array(),
            BJT_PLUGIN_VERSION
    );
        wp_enqueue_style('bjt-product-admin-style');
    }

    // 只在我们的插件页面加载脚本
    if (strpos($hook, 'bjt-product-admin') !== false || strpos($hook, 'page_bjt-product-admin') !== false) {
    // Register scripts
    wp_register_script(
        'bjt-product-admin-script',
            BJT_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-util'),
            BJT_PLUGIN_VERSION,
        true
    );

        // Enqueue scripts
    wp_enqueue_script('bjt-product-admin-script');

        // 确保媒体上传功能可用
        wp_enqueue_media();

        // Localize script - 改用bjt_admin_vars作为变量名，避免冲突
        wp_localize_script('bjt-product-admin-script', 'bjt_admin_vars', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt_admin_nonce'),
            'plugin_url' => BJT_PLUGIN_URL
    ));
        
        // 记录调试信息
        bjt_log_error('Loading scripts for hook: ' . $hook);
    }
}
add_action('admin_enqueue_scripts', 'bjt_product_admin_enqueue_scripts');

// Register custom post types
function bjt_product_admin_register_post_types() {
    // Product Lines post type
    register_post_type('bjt_product_line', array(
        'labels' => array(
            'name' => __('Product Lines', 'bjt-product-admin'),
            'singular_name' => __('Product Line', 'bjt-product-admin')
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon' => 'dashicons-category',
        'rewrite' => array('slug' => 'product-lines')
    ));
    
    // Hosts post type
    register_post_type('bjt_host', array(
        'labels' => array(
            'name' => __('Hosts', 'bjt-product-admin'),
            'singular_name' => __('Host', 'bjt-product-admin')
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon' => 'dashicons-admin-generic',
        'rewrite' => array('slug' => 'hosts')
    ));
    
    // Parts post type
    register_post_type('bjt_part', array(
        'labels' => array(
            'name' => __('Parts', 'bjt-product-admin'),
            'singular_name' => __('Part', 'bjt-product-admin')
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'menu_icon' => 'dashicons-admin-tools',
        'rewrite' => array('slug' => 'parts')
    ));
    
    // Flush rewrite rules only on plugin activation
    if (get_option('bjt_flush_rewrite_rules', false)) {
        flush_rewrite_rules();
        delete_option('bjt_flush_rewrite_rules');
    }
}
add_action('init', 'bjt_product_admin_register_post_types');

// Ajax handlers
function bjt_product_admin_ajax_handlers() {
    // Product Line AJAX handlers
    add_action('wp_ajax_bjt_save_product_line', array(BJT_Product_Line_Management::get_instance(), 'ajax_save_product_line'));
    add_action('wp_ajax_bjt_get_product_line', array(BJT_Product_Line_Management::get_instance(), 'ajax_get_product_line'));
    add_action('wp_ajax_bjt_delete_product_line', array(BJT_Product_Line_Management::get_instance(), 'ajax_delete_product_line'));
    
    // Host AJAX handlers
    add_action('wp_ajax_bjt_save_host', array(BJT_Host_Management::get_instance(), 'ajax_save_host'));
    add_action('wp_ajax_bjt_get_host', array(BJT_Host_Management::get_instance(), 'ajax_get_host'));
    add_action('wp_ajax_bjt_delete_host', array(BJT_Host_Management::get_instance(), 'ajax_delete_host'));
    
    // Part AJAX handlers
    add_action('wp_ajax_bjt_save_part', array(BJT_Part_Management::get_instance(), 'ajax_save_part'));
    add_action('wp_ajax_bjt_get_part', array(BJT_Part_Management::get_instance(), 'ajax_get_part'));
    add_action('wp_ajax_bjt_delete_part', array(BJT_Part_Management::get_instance(), 'ajax_delete_part'));
    
    // Air Cushion AJAX handlers
    add_action('wp_ajax_bjt_get_accessory_relations', array(BJT_Air_Cushion_Management::get_instance(), 'ajax_get_accessory_relations'));
    add_action('wp_ajax_bjt_save_accessory_relations', array(BJT_Air_Cushion_Management::get_instance(), 'ajax_save_accessory_relations'));
}
add_action('admin_init', 'bjt_product_admin_ajax_handlers');

// Add custom template for product display
function bjt_product_admin_page_templates($templates) {
    $templates['product-home.php'] = __('BJT Product Home', 'bjt-product-admin');
    return $templates;
}
add_filter('theme_page_templates', 'bjt_product_admin_page_templates');

// Load custom template
function bjt_product_admin_template_include($template) {
    if (is_page_template('product-home.php')) {
        $template = BJT_PLUGIN_DIR . 'templates/frontend/product-home.php';
    }
    return $template;
}
add_filter('template_include', 'bjt_product_admin_template_include');

// Add plugin settings link
function bjt_product_admin_settings_link($links) {
    $settings_link = '<a href="admin.php?page=bjt-product-admin">' . __('Settings', 'bjt-product-admin') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . BJT_PLUGIN_FILE, 'bjt_product_admin_settings_link');

// Update notice
function bjt_product_admin_update_notice() {
    if (version_compare(get_option('bjt_product_admin_version', '0'), BJT_PLUGIN_VERSION, '<')) {
        echo '<div class="notice notice-info is-dismissible"><p>' . 
             sprintf(__('BJT Product Management System has been updated to version %s.', 'bjt-product-admin'), BJT_PLUGIN_VERSION) . 
             '</p></div>';
        update_option('bjt_product_admin_version', BJT_PLUGIN_VERSION);
    }
}
add_action('admin_notices', 'bjt_product_admin_update_notice');

/**
 * Enqueue frontend scripts and styles
 */
function bjt_frontend_scripts() {
    wp_enqueue_style(
        'bjt-product-styles',
        BJT_PLUGIN_URL . 'assets/css/product-detail.css',
        array(),
        BJT_PLUGIN_VERSION
    );

    wp_enqueue_script(
        'bjt-product-scripts',
        BJT_PLUGIN_URL . 'assets/js/product-detail.js',
        array('jquery'),
        BJT_PLUGIN_VERSION,
        true
    );

    // Check if Slick Carousel is needed for related products
    if (function_exists('is_product_detail_page') && is_product_detail_page()) {
        wp_enqueue_style(
            'slick-carousel-css',
            'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css',
            array(),
            '1.8.1'
        );
        
        wp_enqueue_style(
            'slick-carousel-theme',
            'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css',
            array('slick-carousel-css'),
            '1.8.1'
        );
        
        wp_enqueue_script(
            'slick-carousel-js',
            'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js',
            array('jquery'),
            '1.8.1',
            true
        );
    }

    // Add localized script data
    wp_localize_script(
        'bjt-product-scripts',
        'bjt_product_vars',
        array(
            'ajax_url'  => admin_url('admin-ajax.php'),
            'nonce'     => wp_create_nonce('bjt_product_inquiry_nonce'),
            'messages'  => array(
                'form_validation_error' => __('Please fill in all required fields correctly.', 'bjt-product-admin'),
                'submitting'            => __('Submitting...', 'bjt-product-admin'),
                'ajax_error'            => __('An error occurred while processing your request. Please try again.', 'bjt-product-admin'),
            ),
        )
    );
}
add_action('wp_enqueue_scripts', 'bjt_frontend_scripts');

/**
 * Check if current page is product detail page
 *
 * @return bool
 */
function is_product_detail_page() {
    global $wp_query;
    
    // Check if product_id query var exists and is a positive integer
    $product_id = get_query_var('product_id', 0);
    
    return $product_id > 0;
}

/**
 * Register query vars for product pages
 *
 * @param array $vars Existing query vars.
 * @return array Modified query vars.
 */
function bjt_register_query_vars($vars) {
    $vars[] = 'product_id';
    $vars[] = 'category_id';
    return $vars;
}
add_filter('query_vars', 'bjt_register_query_vars');

/**
 * Load product detail template when product_id is present
 *
 * @param string $template Original template path.
 * @return string Modified template path.
 */
function bjt_load_product_templates($template) {
    if (is_product_detail_page()) {
        $product_template = BJT_PLUGIN_DIR . 'templates/frontend/product-detail.php';
        
        if (file_exists($product_template)) {
            return $product_template;
        }
    }
    
    return $template;
}

add_filter('template_include', 'bjt_load_product_templates', 99); 


// 添加WordPress设置字段
function bjt_register_settings() {
    // 注册设置
    register_setting('reading', 'bjt_products_page_id', 'intval');
    
    // 添加设置字段
    add_settings_field(
        'bjt_products_page_id',           // 字段ID
        '产品展示页面',                     // 字段标题
        'bjt_products_page_callback',     // 回调函数
        'reading'                         // 设置页面
    );
}
add_action('admin_init', 'bjt_register_settings');

// 设置字段回调函数
function bjt_products_page_callback() {
    // 获取当前设置值
    $page_id = get_option('bjt_products_page_id');
    
    // 获取所有页面
    $pages = get_pages();
    
    // 创建下拉选择框
    echo '<select id="bjt_products_page_id" name="bjt_products_page_id">';
    echo '<option value="0">-- 选择页面 --</option>';
    
    foreach ($pages as $page) {
        $selected = ($page->ID == $page_id) ? 'selected="selected"' : '';
        echo '<option value="' . $page->ID . '" ' . $selected . '>' . $page->post_title . '</option>';
    }
    
    echo '</select>';
    echo '<p class="description">选择用于显示产品的页面。插件将自动处理此页面的内容显示。</p>';
}

// 添加重写规则，使前端页面可以通过 /product-frontend/ 访问
function bjt_add_frontend_rewrite_rules() {
    add_rewrite_rule(
        'product-frontend/?$',
        'index.php?bjt_product_frontend=1',
        'top'
    );
    
    add_rewrite_rule(
        'product-frontend/(.+)/?$',
        'index.php?bjt_product_frontend=1&bjt_product_frontend_path=$matches[1]',
        'top'
    );
}
add_action('init', 'bjt_add_frontend_rewrite_rules');

// 添加查询变量
function bjt_add_query_vars($vars) {
    $vars[] = 'bjt_product_frontend';
    $vars[] = 'bjt_product_frontend_path';
    return $vars;
}
add_filter('query_vars', 'bjt_add_query_vars');

// 处理前端请求
function bjt_handle_frontend_request() {
    global $wp_query;
    
    if (isset($wp_query->query_vars['bjt_product_frontend'])) {
        // 检查是否是对具体资源的请求
        if (isset($wp_query->query_vars['bjt_product_frontend_path'])) {
            $path = $wp_query->query_vars['bjt_product_frontend_path'];
            $file_path = BJT_PLUGIN_DIR . 'public-frontend/' . $path;
            
            if (file_exists($file_path)) {
                // 确定正确的MIME类型
                $extension = pathinfo($file_path, PATHINFO_EXTENSION);
                $mime_types = array(
                    'css' => 'text/css',
                    'js' => 'application/javascript',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'html' => 'text/html',
                    'htm' => 'text/html',
                );
                
                if (isset($mime_types[$extension])) {
                    header('Content-Type: ' . $mime_types[$extension]);
                }
                
                // 输出文件内容
                readfile($file_path);
                exit;
            }
        }
        
        // 默认情况下显示主HTML文件
        $main_file = BJT_PLUGIN_DIR . 'public-frontend/index.html';
        if (file_exists($main_file)) {
            header('Content-Type: text/html');
            readfile($main_file);
            exit;
        }
    }
}
add_action('template_redirect', 'bjt_handle_frontend_request');

// 添加REST API支持
function bjt_register_product_rest_routes() {
    register_rest_route('bjt-product/v1', '/products', array(
        'methods' => 'GET',
        'callback' => 'bjt_get_products',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products', array(
        'methods' => 'POST',
        'callback' => 'bjt_create_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'bjt_get_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'bjt_update_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'bjt_delete_product',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'bjt_register_product_rest_routes');

// API回调函数
function bjt_get_products() {
    // 在实际应用中从数据库获取数据
    // 这里返回示例数据
    $products = array(
        array(
            'id' => 1,
            'model' => 'BLP-001',
            'title' => '智能控制器',
            'description' => '高性能智能控制器，支持多种协议',
            'title_zh' => '智能控制器',
            'description_zh' => '高性能智能控制器，支持多种协议',
            'title_en' => 'Smart Controller',
            'description_en' => 'High-performance smart controller with multi-protocol support',
            'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
        ),
        array(
            'id' => 2,
            'model' => 'BLP-002',
            'title' => '数据采集器',
            'description' => '工业级数据采集器，稳定可靠',
            'title_zh' => '数据采集器',
            'description_zh' => '工业级数据采集器，稳定可靠',
            'title_en' => 'Data Collector',
            'description_en' => 'Industrial-grade data collector, stable and reliable',
            'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
        )
    );
    
    return new WP_REST_Response($products, 200);
}

function bjt_get_product($request) {
    $id = $request['id'];
    // 实际应用中从数据库获取特定ID的产品
    // 这里返回示例数据
    
    return new WP_REST_Response(array(
        'id' => $id,
        'model' => 'BLP-00' . $id,
        'title' => '智能控制器' . $id,
        'description' => '高性能智能控制器，支持多种协议',
        'title_zh' => '智能控制器' . $id,
        'description_zh' => '高性能智能控制器，支持多种协议',
        'title_en' => 'Smart Controller ' . $id,
        'description_en' => 'High-performance smart controller with multi-protocol support',
        'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
    ), 200);
}

function bjt_create_product($request) {
    $params = $request->get_params();
    
    // 实际应用中将数据保存到数据库
    // 这里简单返回提交的数据，并添加ID
    $params['id'] = time(); // 使用时间戳作为临时ID
    
    return new WP_REST_Response($params, 201);
}

function bjt_update_product($request) {
    $id = $request['id'];
    $params = $request->get_params();
    
    // 实际应用中更新数据库中的记录
    // 这里简单返回提交的数据
    $params['id'] = $id;
    
    return new WP_REST_Response($params, 200);
}

function bjt_delete_product($request) {
    $id = $request['id'];
    
    // 实际应用中从数据库删除记录
    // 这里简单返回成功消息
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => '产品已删除',
        'id' => $id
    ), 200);
}

// 添加前端页面的快捷方式到管理菜单
function bjt_add_frontend_menu_item($menu_items) {
    $menu_items[] = array(
        'title' => '产品前台页面',
        'capability' => 'manage_options',
        'url' => home_url('product-frontend/'),
        'icon' => 'dashicons-laptop'
    );
    
    return $menu_items;
}
add_filter('bjt_admin_menu_items', 'bjt_add_frontend_menu_item');