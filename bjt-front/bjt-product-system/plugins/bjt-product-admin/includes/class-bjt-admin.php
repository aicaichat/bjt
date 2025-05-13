<?php
/**
 * BJT Product Admin Main Class
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复声明
if (!class_exists('BJT_Admin')) {

class BJT_Admin {
    /**
     * 构造函数
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * 初始化钩子
     */
    private function init_hooks() {
        // 添加菜单
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // 加载资源
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        
        // AJAX处理
        add_action('wp_ajax_bjt_save_product_line', array($this, 'ajax_save_product_line'));
        add_action('wp_ajax_bjt_delete_product_line', array($this, 'ajax_delete_product_line'));
        add_action('wp_ajax_bjt_save_host_model', array($this, 'ajax_save_host_model'));
        add_action('wp_ajax_bjt_delete_host_model', array($this, 'ajax_delete_host_model'));
        
        // 添加设置链接
        add_filter('plugin_action_links_' . plugin_basename(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'bjt-product-admin.php'),
            array($this, 'add_settings_link'));
    }

    /**
     * 添加管理菜单
     */
    public function add_admin_menu() {
        add_menu_page(
            __('BJT Products', 'bjt-product-admin'),
            __('BJT Products', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-admin',
            array($this, 'render_admin_page'),
            'dashicons-products',
            30
        );

        // 添加子菜单
        $this->add_submenu_pages();
    }

    /**
     * 添加子菜单页面
     */
    private function add_submenu_pages() {
        // 产品线管理
        add_submenu_page(
            'bjt-product-admin',
            __('Product Lines', 'bjt-product-admin'),
            __('Product Lines', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-lines',
            array($this, 'render_product_lines_page')
        );

        // 主机管理
        add_submenu_page(
            'bjt-product-admin',
            __('Host Models', 'bjt-product-admin'),
            __('Host Models', 'bjt-product-admin'),
            'manage_options',
            'bjt-host-models',
            array($this, 'render_host_models_page')
        );

        // 配件管理
        add_submenu_page(
            'bjt-product-admin',
            __('Accessories', 'bjt-product-admin'),
            __('Accessories', 'bjt-product-admin'),
            'manage_options',
            'bjt-accessories',
            array($this, 'render_accessories_page')
        );

        // 耗材管理
        add_submenu_page(
            'bjt-product-admin',
            __('Consumables', 'bjt-product-admin'),
            __('Consumables', 'bjt-product-admin'),
            'manage_options',
            'bjt-consumables',
            array($this, 'render_consumables_page')
        );

        // 备件管理
        add_submenu_page(
            'bjt-product-admin',
            __('Parts', 'bjt-product-admin'),
            __('Parts', 'bjt-product-admin'),
            'manage_options',
            'bjt-parts',
            array($this, 'render_parts_page')
        );

        // 设置页面
        add_submenu_page(
            'bjt-product-admin',
            __('Settings', 'bjt-product-admin'),
            __('Settings', 'bjt-product-admin'),
            'manage_options',
            'bjt-settings',
            array($this, 'render_settings_page')
        );
    }

    /**
     * 加载管理界面资源
     */
    public function enqueue_admin_scripts($hook) {
        // 只在插件页面加载
        if (strpos($hook, 'bjt-product-admin') === false) {
            return;
        }

        // CSS
        wp_enqueue_style(
            'bjt-admin-style',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            BJT_PRODUCT_ADMIN_VERSION
        );

        // JavaScript
        wp_enqueue_script(
            'bjt-admin-script',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            BJT_PRODUCT_ADMIN_VERSION,
            true
        );

        // 本地化脚本
        wp_localize_script('bjt-admin-script', 'bjtAdmin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt-admin-nonce'),
            'i18n' => array(
                'confirm_delete' => __('Are you sure you want to delete this item?', 'bjt-product-admin'),
                'success' => __('Operation successful', 'bjt-product-admin'),
                'error' => __('Operation failed', 'bjt-product-admin')
            )
        ));
    }

    /**
     * 渲染主页面
     */
    public function render_admin_page() {
        // 检查权限
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        // 加载主页面模板
        include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/main.php';
    }

    /**
     * 渲染产品线页面
     */
    public function render_product_lines_page() {
        // 检查权限
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        // 获取当前操作
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

        // 加载相应的模板
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

    /**
     * 渲染主机管理页面
     */
    public function render_host_models_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

        switch ($action) {
            case 'new':
            case 'edit':
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/machines/edit.php';
                break;
            default:
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/machines/list.php';
                break;
        }
    }

    /**
     * 渲染配件管理页面
     */
    public function render_accessories_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

        switch ($action) {
            case 'new':
            case 'edit':
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/accessories/edit.php';
                break;
            default:
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/accessories/list.php';
                break;
        }
    }

    /**
     * 渲染耗材管理页面
     */
    public function render_consumables_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

        switch ($action) {
            case 'new':
            case 'edit':
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/consumables/edit.php';
                break;
            default:
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/consumables/list.php';
                break;
        }
    }

    /**
     * 渲染备件管理页面
     */
    public function render_parts_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';

        switch ($action) {
            case 'new':
            case 'edit':
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/parts/edit.php';
                break;
            default:
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/parts/list.php';
                break;
        }
    }

    /**
     * 渲染设置页面
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'bjt-product-admin'));
        }

        include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/settings.php';
    }

    /**
     * AJAX处理：保存产品线
     */
    public function ajax_save_product_line() {
        check_ajax_referer('bjt-admin-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
        }

        $data = array(
            'title_en' => sanitize_text_field($_POST['title_en']),
            'title_zh' => sanitize_text_field($_POST['title_zh']),
            'description_en' => wp_kses_post($_POST['description_en']),
            'description_zh' => wp_kses_post($_POST['description_zh']),
            'consumables_en' => wp_kses_post($_POST['consumables_en']),
            'consumables_zh' => wp_kses_post($_POST['consumables_zh']),
            'parts_en' => wp_kses_post($_POST['parts_en']),
            'parts_zh' => wp_kses_post($_POST['parts_zh']),
            'status' => sanitize_text_field($_POST['status']),
            'sort_order' => intval($_POST['sort_order'])
        );

        global $wpdb;
        $table = $wpdb->prefix . 'bjt_product_lines';

        if (isset($_POST['id'])) {
            // 更新
            $result = $wpdb->update(
                $table,
                $data,
                array('id' => intval($_POST['id'])),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d'),
                array('%d')
            );
        } else {
            // 新增
            $result = $wpdb->insert(
                $table,
                $data,
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d')
            );
        }

        if ($result === false) {
            wp_send_json_error(array('message' => __('Database error', 'bjt-product-admin')));
        }

        wp_send_json_success(array('message' => __('Saved successfully', 'bjt-product-admin')));
    }

    /**
     * AJAX处理：删除产品线
     */
    public function ajax_delete_product_line() {
        check_ajax_referer('bjt-admin-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
        }

        $id = intval($_POST['id']);
        if (!$id) {
            wp_send_json_error(array('message' => __('Invalid ID', 'bjt-product-admin')));
        }

        global $wpdb;
        $result = $wpdb->delete(
            $wpdb->prefix . 'bjt_product_lines',
            array('id' => $id),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error(array('message' => __('Database error', 'bjt-product-admin')));
        }

        wp_send_json_success(array('message' => __('Deleted successfully', 'bjt-product-admin')));
    }

    /**
     * 添加设置链接
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=bjt-settings') . '">' . 
            __('Settings', 'bjt-product-admin') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
}

} // class_exists 检查的结尾 