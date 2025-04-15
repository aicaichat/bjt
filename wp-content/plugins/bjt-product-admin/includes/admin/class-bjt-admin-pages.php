<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Admin_Pages {
    private static $instance = null;
    private $page_hook = null;
    private $plugin_path;
    private $plugin_url;
    private $product_lines;
    private $sections;

    private function __construct() {
        $this->plugin_path = BJT_PRODUCT_ADMIN_PATH;
        $this->plugin_url = BJT_PRODUCT_ADMIN_URL;
        
        $this->product_lines = array(
            'air-cushion' => '气垫机',
            'paper-machine' => '纸机',
            'tape-machine' => '胶带机',
            'air-column' => '气柱袋'
        );
        
        $this->sections = array(
            'hosts' => '主机',
            'accessories' => '配件',
            'consumables' => '耗材',
            'parts' => '备件'
        );

        add_action('admin_menu', array($this, 'register_admin_pages'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'bjt') === false) {
            return;
        }

        // Enqueue WordPress dashicons
        wp_enqueue_style('dashicons');

        // Enqueue admin styles
        wp_enqueue_style(
            'bjt-product-admin-style',
            BJT_PRODUCT_ADMIN_URL . 'assets/css/admin.css',
            array(),
            BJT_PRODUCT_ADMIN_VERSION
        );

        // Enqueue admin scripts
        wp_enqueue_script(
            'bjt-product-admin-script',
            BJT_PRODUCT_ADMIN_URL . 'assets/js/admin.js',
            array('jquery'),
            BJT_PRODUCT_ADMIN_VERSION,
            true
        );

        // Localize script
        wp_localize_script('bjt-product-admin-script', 'bjtAdmin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt_admin_nonce')
        ));
    }

    public function render_admin_page() {
        // Include the main template
        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/main.php';
    }

    public function register_admin_pages() {
        // 只注册主菜单项，子菜单项由自定义侧边栏导航处理
        add_menu_page(
            '产品管理系统',
            '产品管理系统',
            'manage_options',
            'bjt-product-admin',
            array($this, 'render_admin_page'),
            'dashicons-products',
            30
        );
        
        // 添加一个隐藏的页面用于页面访问（不会显示在WordPress菜单中）
        foreach ($this->product_lines as $slug => $title) {
            // 为产品线添加页面
            $this->register_hidden_page('bjt-' . $slug);
            
            // 为每个分类添加页面
            foreach ($this->sections as $section_slug => $section_title) {
                $menu_slug = 'bjt-' . $slug . '-' . $section_slug;
                $this->register_hidden_page($menu_slug);
                
                // 为管理页面添加子页面
                $management_pages = array(
                    'management', 'part-numbers', 'add', 'add-part-number', 'relations'
                );
                
                foreach ($management_pages as $page_slug) {
                    $this->register_hidden_page('bjt-' . $slug . '-' . $section_slug . '-' . $page_slug);
                }
            }
        }
        
        // 添加其他页面
        $this->register_hidden_page('bjt-page-edit');
        $this->register_hidden_page('bjt-user-management');
        $this->register_hidden_page('bjt-system-settings');
    }
    
    // 注册隐藏页面（不在菜单中显示，但可以通过URL访问）
    private function register_hidden_page($menu_slug) {
        add_submenu_page(
            null, // 父菜单为null表示不会在菜单中显示此子页面
            '产品管理系统',
            '产品管理系统',
            'manage_options',
            $menu_slug,
            array($this, 'render_admin_page')
        );
    }

    private function add_section_management_pages($product_line_slug, $section_slug) {
        // 此方法不再需要，由自定义侧边栏导航处理
    }

    public function get_template_path($page) {
        $template_map = array(
            'bjt-page-edit' => 'page-edit.php',
            'bjt-user-management' => 'user-management.php',
            'bjt-system-settings' => 'system-settings.php'
        );

        // Add product line templates
        foreach ($this->product_lines as $slug => $title) {
            $template_map['bjt-' . $slug] = 'product-lines/' . $slug . '/index.php';
            
            foreach ($this->sections as $section_slug => $section_title) {
                $base_path = 'product-lines/' . $slug . '/' . $section_slug . '/';
                $template_map['bjt-' . $slug . '-' . $section_slug] = $base_path . 'index.php';
                $template_map['bjt-' . $slug . '-' . $section_slug . '-management'] = $base_path . 'management.php';
                $template_map['bjt-' . $slug . '-' . $section_slug . '-part-numbers'] = $base_path . 'part-numbers.php';
                $template_map['bjt-' . $slug . '-' . $section_slug . '-add'] = $base_path . 'add.php';
                $template_map['bjt-' . $slug . '-' . $section_slug . '-add-part-number'] = $base_path . 'add-part-number.php';
                
                if ($section_slug === 'hosts') {
                    $template_map['bjt-' . $slug . '-' . $section_slug . '-relations'] = $base_path . 'relations.php';
                }
            }
        }

        if (isset($template_map[$page])) {
            $template_path = $this->plugin_path . 'templates/admin/' . $template_map[$page];
            if (file_exists($template_path)) {
                return $template_path;
            }
        }

        return false;
    }
} 