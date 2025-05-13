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
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

// 插件版本
define('BJT_PRODUCT_ADMIN_VERSION', '1.0.0');

// 插件路径
define('BJT_PRODUCT_ADMIN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BJT_PRODUCT_ADMIN_PLUGIN_URL', plugin_dir_url(__FILE__));

// 自动加载类
spl_autoload_register(function ($class) {
    // 检查类名前缀
    $prefix = 'BJT_';
    $base_dir = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/';

    // 如果类名不是以我们的前缀开头，则跳过
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // 获取相对类名
    $relative_class = substr($class, $len);

    // 替换命名空间分隔符为目录分隔符，添加.php
    $file = $base_dir . str_replace('_', '/', $relative_class) . '.php';

    // 如果文件存在，则加载
    if (file_exists($file)) {
        require $file;
    }
});

// 初始化插件
function bjt_product_admin_init() {
    // 加载文本域
    load_plugin_textdomain('bjt-product-admin', false, dirname(plugin_basename(__FILE__)) . '/languages');

    // 初始化管理界面
    if (is_admin()) {
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-admin.php';
        new BJT_Admin();
    }

    // 初始化 REST API - 确保文件存在后再加载
    $api_file = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-api.php';
    if (file_exists($api_file)) {
        require_once $api_file;
        BJT_API::get_instance();
    } else {
        // 记录缺失文件但不终止程序
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('BJT Product Admin: API file not found: ' . $api_file);
        }
    }
}
add_action('plugins_loaded', 'bjt_product_admin_init');

// 添加插件设置链接
function bjt_product_admin_plugin_action_links($links) {
    $settings_link = '<a href="' . admin_url('admin.php?page=bjt-product-admin') . '">' . __('Settings', 'bjt-product-admin') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'bjt_product_admin_plugin_action_links');

// 安全函数
function bjt_safe_text($text) {
    return wp_kses_post(wp_unslash($text));
}

function bjt_verify_nonce($nonce, $action) {
    if (!wp_verify_nonce($nonce, $action)) {
        wp_die(__('Security check failed', 'bjt-product-admin'));
    }
}

function bjt_check_admin_referer($action) {
    check_admin_referer($action);
}

function bjt_current_user_can_manage() {
    return current_user_can('manage_options');
}

// 错误处理
function bjt_handle_error($wp_error) {
    if (is_wp_error($wp_error)) {
        error_log($wp_error->get_error_message());
        return array(
            'success' => false,
            'message' => $wp_error->get_error_message()
        );
    }
    return false;
}

// Debug日志
function bjt_log($message) {
    if (WP_DEBUG === true) {
        if (is_array($message) || is_object($message)) {
            error_log(print_r($message, true));
        } else {
            error_log($message);
        }
    }
}

// Custom error logging
if (!function_exists('bjt_log_error')) {
    function bjt_log_error($message, $data = null) {
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            $log_message = date('[Y-m-d H:i:s] ') . $message;
            if ($data !== null) {
                $log_message .= ' Data: ' . print_r($data, true);
            }
            error_log($log_message);
        }
    }
}

// Include required files
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/functions.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-database-upgrader.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-data-migrator.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-install.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-product-admin.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-admin-pages.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-product-line-management.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-host-management.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-part-management.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-air-cushion-management.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-ajax.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-product.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/class-bjt-admin.php';

// Include API controllers
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-api-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-auth-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-product-lines-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-host-models-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-accessory-models-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-consumables-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-spare-parts-controller.php';
require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/api/class-bjt-batch-controller.php';

// Create database tables on activation
register_activation_hook(__FILE__, 'bjt_product_admin_activate');
function bjt_product_admin_activate() {
    global $wpdb;
    
    // 确保在发送任何输出之前处理所有错误
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    try {
        // 1. 检查PHP版本
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            throw new Exception('BJT Product Admin requires PHP 7.4 or higher.');
        }

        // 2. 检查WordPress版本
        if (version_compare($GLOBALS['wp_version'], '5.0', '<')) {
            throw new Exception('BJT Product Admin requires WordPress 5.0 or higher.');
        }

        // 3. 检查MySQL版本和权限
        $mysql_version = $wpdb->db_version();
        if (version_compare($mysql_version, '5.6', '<')) {
            throw new Exception('BJT Product Admin requires MySQL 5.6 or higher.');
        }

        // 表已通过Docker中的init.sql创建，不再需要检查CREATE TABLE权限
        /*
        // 检查是否有创建表的权限
        $has_create_privilege = $wpdb->get_var("SHOW GRANTS FOR CURRENT_USER() LIKE '%CREATE%'");
        if (!$has_create_privilege) {
            throw new Exception('Database user does not have sufficient privileges (CREATE TABLE permission required).');
        }
        */

        // 4. 检查必要的常量是否已定义
        if (!defined('BJT_PRODUCT_ADMIN_PLUGIN_DIR')) {
            throw new Exception('Plugin constants not defined.');
        }

        // 5. 检查必要的文件是否存在
        $required_files = array(
            'includes/class-bjt-install.php',
            'includes/class-bjt-database-upgrader.php',
            'includes/class-bjt-data-migrator.php',
            'includes/functions.php',
            'includes/class-bjt-product-admin.php',
            'includes/admin/class-bjt-admin-pages.php'
        );

        foreach ($required_files as $file) {
            $file_path = BJT_PRODUCT_ADMIN_PLUGIN_DIR . $file;
            if (!file_exists($file_path)) {
                throw new Exception("Required file not found: {$file}");
            }
        }

        // 6. 加载必要的文件
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/functions.php';
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-install.php';
        
        // 7. 运行安装 - 使用单例实例调用
        BJT_Install::get_instance()->install();
        
        // 8. 刷新重写规则
        flush_rewrite_rules();

        // 9. 记录成功激活
        update_option('bjt_product_admin_activated', true);
        update_option('bjt_product_admin_version', BJT_PRODUCT_ADMIN_VERSION);

    } catch (Exception $e) {
        // 记录错误
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('BJT Product Admin activation failed: ' . $e->getMessage());
            if (isset($wpdb) && $wpdb->last_error) {
                error_log('Database error: ' . $wpdb->last_error);
            }
        }

        // 停用插件
        deactivate_plugins(plugin_basename(__FILE__));

        // 显示错误消息
        wp_die(
            'Plugin activation failed: ' . esc_html($e->getMessage()) . 
            '<br><br>Please check the error log for more details.' .
            '<br><br><a href="' . admin_url('plugins.php') . '">&laquo; Return to Plugins</a>',
            'Plugin Activation Error',
            array('back_link' => true)
        );
    }
}

// Clean up on deactivation
register_deactivation_hook(__FILE__, 'bjt_product_admin_deactivate');
function bjt_product_admin_deactivate() {
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    try {
        // 1. 清理插件数据（如果需要）
        // delete_option('bjt_product_admin_version');
        
        // 2. 刷新重写规则
        flush_rewrite_rules();
    } catch (Exception $e) {
        error_log('BJT Product Admin: Plugin deactivation failed - ' . $e->getMessage());
    }
}

// Register and enqueue admin scripts and styles
function bjt_product_admin_enqueue_scripts($hook) {
    // 在所有WordPress管理页面加载基本样式
    if (is_admin()) {
    // Register styles
    wp_register_style(
        'bjt-product-admin-style',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/css/admin.css',
        array(),
            BJT_PRODUCT_ADMIN_VERSION
    );
        wp_enqueue_style('bjt-product-admin-style');
    }

    // 只在我们的插件页面加载脚本
    if (strpos($hook, 'bjt-product-admin') !== false || strpos($hook, 'page_bjt-product-admin') !== false) {
    // Register scripts
    wp_register_script(
        'bjt-product-admin-script',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-util'),
            BJT_PRODUCT_ADMIN_VERSION,
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
            'plugin_url' => BJT_PRODUCT_ADMIN_PLUGIN_URL
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
        $template = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/frontend/product-home.php';
    }
    return $template;
}
add_filter('template_include', 'bjt_product_admin_template_include');

// Update notice
function bjt_product_admin_update_notice() {
    if (version_compare(get_option('bjt_product_admin_version', '0'), BJT_PRODUCT_ADMIN_VERSION, '<')) {
        echo '<div class="notice notice-info is-dismissible"><p>' . 
             sprintf(__('BJT Product Management System has been updated to version %s.', 'bjt-product-admin'), BJT_PRODUCT_ADMIN_VERSION) . 
             '</p></div>';
        update_option('bjt_product_admin_version', BJT_PRODUCT_ADMIN_VERSION);
    }
}
add_action('admin_notices', 'bjt_product_admin_update_notice');

/**
 * Enqueue frontend scripts and styles
 */
function bjt_frontend_scripts() {
    wp_enqueue_style(
        'bjt-product-styles',
        BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/css/product-detail.css',
        array(),
        BJT_PRODUCT_ADMIN_VERSION
    );

    wp_enqueue_script(
        'bjt-product-scripts',
        BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/product-detail.js',
        array('jquery'),
        BJT_PRODUCT_ADMIN_VERSION,
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
        $product_template = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/frontend/product-detail.php';
        
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
            $file_path = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'public-frontend/' . $path;
            
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
        $main_file = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'public-frontend/index.html';
        if (file_exists($main_file)) {
            header('Content-Type: text/html');
            readfile($main_file);
            exit;
        }
    }
}
add_action('template_redirect', 'bjt_handle_frontend_request');

// Register REST API routes
function bjt_product_admin_rest_api_init() {
    // Auth API
    $auth_controller = new BJT_Auth_Controller();
    $auth_controller->register_routes();

    // Product Lines API
    $product_lines_controller = new BJT_Product_Lines_Controller();
    $product_lines_controller->register_routes();

    // Host Models API
    $host_models_controller = new BJT_Host_Models_Controller();
    $host_models_controller->register_routes();

    // Accessory Models API
    $accessory_models_controller = new BJT_Accessory_Models_Controller();
    $accessory_models_controller->register_routes();

    // Consumables API
    $consumables_controller = new BJT_Consumables_Controller();
    $consumables_controller->register_routes();

    // Spare Parts API
    $spare_parts_controller = new BJT_Spare_Parts_Controller();
    $spare_parts_controller->register_routes();

    // Batch Operations API
    $batch_controller = new BJT_Batch_Controller();
    $batch_controller->register_routes();
}
add_action('rest_api_init', 'bjt_product_admin_rest_api_init');

// 注册管理菜单
function bjt_product_admin_menu() {
    add_menu_page(
        __('Product Management', 'bjt-product-admin'),
        __('Product Management', 'bjt-product-admin'),
        'manage_options',
        'bjt-product-lines',
        'bjt_product_lines_page',
        'dashicons-products',
        30
    );
    
    add_submenu_page(
        'bjt-product-lines',
        __('Product Lines', 'bjt-product-admin'),
        __('Product Lines', 'bjt-product-admin'),
        'manage_options',
        'bjt-product-lines',
        'bjt_product_lines_page'
    );
}
add_action('admin_menu', 'bjt_product_admin_menu');

// 产品线列表页面
function bjt_product_lines_page() {
    $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
    
    switch ($action) {
        case 'new':
        case 'edit':
            include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/edit.php';
            break;
        default:
            include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/list.php';
            break;
    }
}