<?php
/**
 * BJT管理界面类
 * 
 * 用于创建和管理WordPress管理界面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
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
        add_action('admin_menu', array($this, 'add_admin_menus'));
        
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
    public function add_admin_menus() {
        // 主菜单
        add_menu_page(
            __('BJT产品管理系统', 'bjt-product-admin'),
            __('BJT产品管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-admin',
            array($this, 'render_dashboard_page'),
            'dashicons-products',
            30
        );
        
        // 仪表盘子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('仪表盘', 'bjt-product-admin'),
            __('仪表盘', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-admin',
            array($this, 'render_dashboard_page')
        );
        
        // 产品线管理子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('产品线管理', 'bjt-product-admin'),
            __('产品线管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-lines',
            array($this, 'render_product_lines_page')
        );
        
        // 主机管理子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('主机管理', 'bjt-product-admin'),
            __('主机管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-host-models',
            array($this, 'render_host_models_page')
        );
        
        // 配件管理子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('配件管理', 'bjt-product-admin'),
            __('配件管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-accessories',
            array($this, 'render_accessories_page')
        );
        
        // 关系管理子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('关系管理', 'bjt-product-admin'),
            __('关系管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-relationships',
            array($this, 'render_relationships_page')
        );
        
        // 组件测试子菜单（开发环境中使用）
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_submenu_page(
                'bjt-product-admin',
                __('组件测试', 'bjt-product-admin'),
                __('组件测试', 'bjt-product-admin'),
                'manage_options',
                'bjt-component-test',
                array($this, 'render_component_test_page')
            );
        }
        
        // 设置子菜单
        add_submenu_page(
            'bjt-product-admin',
            __('设置', 'bjt-product-admin'),
            __('设置', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-settings',
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
     * 渲染仪表盘页面
     */
    public function render_dashboard_page() {
        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('BJT产品管理系统仪表盘', 'bjt-product-admin') . '</h1>';
        echo '<p>' . esc_html__('欢迎使用BJT产品管理系统。', 'bjt-product-admin') . '</p>';
        
        // 仪表盘内容
        echo '<div class="bjt-dashboard-widgets">';
        
        // 统计信息
        echo '<div class="bjt-dashboard-widget">';
        echo '<h2>' . esc_html__('统计信息', 'bjt-product-admin') . '</h2>';
        echo '<div class="bjt-dashboard-stats">';
        echo '<div class="bjt-stat-item"><span class="bjt-stat-value">0</span><span class="bjt-stat-label">' . esc_html__('产品线', 'bjt-product-admin') . '</span></div>';
        echo '<div class="bjt-stat-item"><span class="bjt-stat-value">0</span><span class="bjt-stat-label">' . esc_html__('主机型号', 'bjt-product-admin') . '</span></div>';
        echo '<div class="bjt-stat-item"><span class="bjt-stat-value">0</span><span class="bjt-stat-label">' . esc_html__('配件', 'bjt-product-admin') . '</span></div>';
        echo '<div class="bjt-stat-item"><span class="bjt-stat-value">0</span><span class="bjt-stat-label">' . esc_html__('关系', 'bjt-product-admin') . '</span></div>';
        echo '</div>';
        echo '</div>';
        
        // 快速链接
        echo '<div class="bjt-dashboard-widget">';
        echo '<h2>' . esc_html__('快速操作', 'bjt-product-admin') . '</h2>';
        echo '<div class="bjt-dashboard-actions">';
        echo '<a href="' . admin_url('admin.php?page=bjt-product-lines') . '" class="button">' . esc_html__('管理产品线', 'bjt-product-admin') . '</a>';
        echo '<a href="' . admin_url('admin.php?page=bjt-host-models') . '" class="button">' . esc_html__('管理主机型号', 'bjt-product-admin') . '</a>';
        echo '<a href="' . admin_url('admin.php?page=bjt-accessories') . '" class="button">' . esc_html__('管理配件', 'bjt-product-admin') . '</a>';
        echo '<a href="' . admin_url('admin.php?page=bjt-relationships') . '" class="button">' . esc_html__('管理关系', 'bjt-product-admin') . '</a>';
        echo '</div>';
        echo '</div>';
        
        echo '</div>'; // .bjt-dashboard-widgets
        
        echo '</div>'; // .wrap
    }

    /**
     * 渲染产品线管理页面
     */
    public function render_product_lines_page() {
        // 获取当前操作
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        
        // 根据操作加载相应的模板
        switch ($action) {
            case 'edit':
            case 'add':
                // 加载编辑/添加模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/edit.php');
                break;
            
            default:
                // 加载列表模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/list.php');
                break;
        }
    }

    /**
     * 渲染主机型号管理页面
     */
    public function render_host_models_page() {
        // 获取当前操作
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        
        // 根据操作加载相应的模板
        switch ($action) {
            case 'edit':
            case 'add':
                // 加载主机型号编辑/添加模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/host-models/edit.php');
                break;
            
            case 'edit-part':
            case 'add-part':
                // 加载料号编辑/添加模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/host-models/part-edit.php');
                break;
            
            default:
                // 加载列表模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/host-models/list.php');
                break;
        }
    }

    /**
     * 渲染配件管理页面
     */
    public function render_accessories_page() {
        // 获取当前操作
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        
        // 根据操作加载相应的模板
        switch ($action) {
            case 'edit':
            case 'add':
                // 加载编辑/添加模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/accessories/edit.php');
                break;
            
            default:
                // 加载列表模板
                include(BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/accessories/list.php');
                break;
        }
    }

    /**
     * 渲染关系管理页面
     */
    public function render_relationships_page() {
        // 获取action参数，默认为list
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        
        // 根据action加载相应的模板
        switch ($action) {
            case 'edit':
            case 'add':
                // 加载编辑模板
                include_once plugin_dir_path(dirname(__FILE__)) . 'templates/admin/relationships/edit.php';
                break;
            
            default:
                // 加载列表模板
                include_once plugin_dir_path(dirname(__FILE__)) . 'templates/admin/relationships/list.php';
                break;
        }
    }

    /**
     * 渲染组件测试页面
     */
    public function render_component_test_page() {
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/pages/test-page.php';
        bjt_product_admin_render_test_page();
    }

    /**
     * 渲染设置页面
     */
    public function render_settings_page() {
        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('BJT产品管理系统设置', 'bjt-product-admin') . '</h1>';
        
        // 检查设置页面是否已加载
        if (!class_exists('BJT_Settings_Page')) {
            require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-settings.php';
            $settings_page = new BJT_Settings_Page();
            $settings_page->render();
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html__('无法加载设置页面。', 'bjt-product-admin') . '</p></div>';
        }
        
        echo '</div>'; // .wrap
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