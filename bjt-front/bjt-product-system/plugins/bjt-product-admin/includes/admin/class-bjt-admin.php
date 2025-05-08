<?php
namespace BJT\ProductAdmin;

/**
 * 产品管理系统管理类
 */
class BJTProductAdmin {
    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * The layout to use for the admin page (e.g., 'default' or 'mockup').
     *
     * @since    1.0.0
     * @access   protected
     * @var      string|null    $layout    The layout identifier.
     */
    protected $layout = null;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct() {
        $this->plugin_name = 'bjt-product-admin';
        $this->version = BJT_PRODUCT_ADMIN_VERSION;

        $this->set_locale();
        $this->define_admin_hooks();
        $this->init();

        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Add toast notification container to admin footer
        add_action('admin_footer', array($this, 'add_toast_container'));

        // 添加AJAX处理钩子
        add_action('wp_ajax_bjt_toggle_status', array($this, 'handle_toggle_status'));
        add_action('wp_ajax_bjt_switch_language', array($this, 'handle_switch_language'));
        add_action('wp_ajax_bjt_save_product_line', array($this, 'handle_save_product_line'));
    }

    /**
     * Define the locale for this plugin for internationalization.
     *
     * Uses the i18n class in order to set the domain and to register the hook
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function set_locale() {
        $plugin_i18n = new i18n();
        $plugin_i18n->set_domain($this->plugin_name);
        $plugin_i18n->load_plugin_textdomain();
    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks() {
        // 注册菜单钩子
        add_action('admin_menu', array($this, 'register_admin_menu'));
        
        // 注册管理脚本和样式钩子
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // 添加自定义 body class
        add_filter('admin_body_class', array($this, 'add_admin_body_class'));
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        // The run method is now empty as the loader is no longer used
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }

    /**
     * 注册管理菜单
     */
    public function register_admin_menu() {
        // 主菜单
        add_menu_page(
            __('北京天硕产品管理系统', 'bjt-product-admin'),
            __('产品管理系统', 'bjt-product-admin'),
            'manage_options',
            'bjt-dashboard',
            array($this, 'render_dashboard'),
            'dashicons-archive',
            3
        );
        
        // 页面编辑菜单
        add_submenu_page(
            'bjt-dashboard',
            __('页面编辑', 'bjt-product-admin'),
            __('页面编辑', 'bjt-product-admin'),
            'manage_options',
            'bjt-page-edit',
            array($this, 'render_page_edit')
        );
        
        // 子菜单
        add_submenu_page(
            'bjt-dashboard',
            __('主机型号', 'bjt-product-admin'),
            __('主机型号', 'bjt-product-admin'),
            'manage_options',
            'bjt-host-models',
            array($this, 'render_host_models')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('配件管理', 'bjt-product-admin'),
            __('配件管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-accessories',
            array($this, 'render_accessories')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('耗材管理', 'bjt-product-admin'),
            __('耗材管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-consumables',
            array($this, 'render_consumables')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('备件管理', 'bjt-product-admin'),
            __('备件管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-parts',
            array($this, 'render_parts')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('产品线管理', 'bjt-product-admin'),
            __('产品线管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-product-lines',
            array($this, 'render_product_lines')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('用户管理', 'bjt-product-admin'),
            __('用户管理', 'bjt-product-admin'),
            'manage_options',
            'bjt-users',
            array($this, 'render_users')
        );
        
        add_submenu_page(
            'bjt-dashboard',
            __('系统设置', 'bjt-product-admin'),
            __('系统设置', 'bjt-product-admin'),
            'manage_options',
            'bjt-settings',
            array($this, 'render_settings')
        );
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_assets() {
        $screen = get_current_screen();
        
        // 如果在插件页面上
        if ($screen && strpos($screen->id, 'bjt-') !== false) {
            // 加载 Mockup 样式 (确保这是主要的样式表)
            wp_enqueue_style('bjt-mockup-style', BJT_PRODUCT_ADMIN_URL . 'assets/css/bjt-mockup-style.css', array(), BJT_PRODUCT_ADMIN_VERSION);
            
            // 加载 Dashicons (如果 Mockup 样式需要)
            wp_enqueue_style('dashicons');
            
            // 加载媒体上传脚本
            wp_enqueue_media();
            
            // 加载管理脚本 (依赖 jQuery)
            wp_enqueue_script('bjt-admin-script', BJT_PRODUCT_ADMIN_URL . 'assets/js/bjt-admin.js', array('jquery'), BJT_PRODUCT_ADMIN_VERSION, true);
            
            // 为Ajax请求和JS逻辑本地化脚本 (使用统一的变量名)
            wp_localize_script('bjt-admin-script', 'bjt_admin_vars', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('bjt_admin_nonce'),
                'plugin_url' => BJT_PRODUCT_ADMIN_URL, // JS 可能需要插件 URL
                'current_language' => get_locale(),
                'success_message' => __('操作成功', 'bjt-product-admin'),
                'error_message' => __('操作失败', 'bjt-product-admin'),
                'messages' => array(
                    'confirm_delete' => __('确定要删除此项吗？此操作无法撤销。', 'bjt-product-admin'),
                    'save_success' => __('保存成功', 'bjt-product-admin'),
                    'save_error' => __('保存失败', 'bjt-product-admin'),
                    'delete_success' => __('删除成功', 'bjt-product-admin'),
                    'delete_error' => __('删除失败', 'bjt-product-admin')
                ) // 保留旧的 messages 结构以防万一
            ));
        }
    }
    
    /**
     * Add toast container to admin footer
     */
    public function add_toast_container() {
        // 只在插件页面添加
        $screen = get_current_screen();
        if (!strpos($screen->id, 'bjt-')) {
            return;
        }
        
        echo '<div id="bjt-toast-container"></div>';
    }

    /**
     * 处理状态切换的AJAX请求
     */
    public function handle_toggle_status() {
        // 安全检查
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'bjt_admin_nonce')) {
            wp_send_json_error(array('message' => '安全验证失败'));
            exit;
        }
        
        // 获取参数
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $status = isset($_POST['status']) ? sanitize_text_field($_POST['status']) : '';
        $table = isset($_POST['table']) ? sanitize_text_field($_POST['table']) : 'bjt_host_models';
        
        if ($id <= 0 || !in_array($status, array('active', 'inactive'))) {
            wp_send_json_error(array('message' => '参数错误'));
            exit;
        }
        
        // 表名安全处理
        global $wpdb;
        $allowed_tables = array(
            'bjt_host_models', 
            'bjt_accessories', 
            'bjt_consumables', 
            'bjt_parts'
        );
        
        if (!in_array($table, $allowed_tables)) {
            wp_send_json_error(array('message' => '无效的表名'));
            exit;
        }
        
        $table_name = $wpdb->prefix . $table;
        
        // 更新状态
        $result = $wpdb->update(
            $table_name,
            array('status' => $status),
            array('id' => $id),
            array('%s'),
            array('%d')
        );
        
        if ($result === false) {
            wp_send_json_error(array('message' => '数据库更新失败'));
            exit;
        }
        
        wp_send_json_success(array('message' => '状态已更新'));
    }
    
    /**
     * 处理语言切换的AJAX请求
     */
    public function handle_switch_language() {
        // 安全检查
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'bjt_admin_nonce')) {
            wp_send_json_error(array('message' => '安全验证失败'));
            exit;
        }
        
        // 获取语言参数
        $lang = isset($_POST['lang']) ? sanitize_text_field($_POST['lang']) : 'zh_CN';
        
        // 保存用户的语言偏好
        update_user_meta(get_current_user_id(), 'bjt_user_language', $lang);
        
        wp_send_json_success(array('message' => '语言已切换'));
    }

    /**
     * Helper method to render a page within the mockup layout.
     *
     * @param string $content_template_path Absolute path to the content template file.
     */
    protected function render_mockup_page($content_template_path) {
        // Ensure the file path is valid
        if (!file_exists($content_template_path)) {
            echo 'Error: Content template file not found: ' . esc_html($content_template_path);
            return;
        }
        
        // Set the layout type for enqueueing assets
        $this->layout = 'mockup'; 
        
        // Pass the content template path to the wrapper
        $content_template = $content_template_path; 
        
        // Include the main wrapper which will include the sidebar and the content template
        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/layout/mockup-page-wrapper.php';
    }

    /**
     * 渲染仪表盘页面
     */
    public function render_dashboard() {
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/dashboard/index.php');
    }

    /**
     * 渲染主机型号页面
     */
    public function render_host_models() {
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $template_file = 'index.php'; // Default to list
        switch ($action) {
            case 'new':
                $template_file = 'new.php';
                break;
            case 'edit':
                $template_file = 'edit.php';
                break;
            case 'add-part':
                $template_file = 'part-add.php';
                break;
            case 'edit-part':
                $template_file = 'part-edit.php';
                break;
        }
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/host-models/' . $template_file);
    }

    /**
     * 渲染配件管理页面
     */
    public function render_accessories() {
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $template_file = 'index.php';
        switch ($action) {
            case 'new':
                $template_file = 'new.php';
                break;
            case 'edit':
                $template_file = 'edit.php';
                break;
        }
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/accessories/' . $template_file);
    }

    /**
     * 渲染耗材管理页面
     */
    public function render_consumables() {
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $template_file = 'index.php';
        switch ($action) {
            case 'new':
                $template_file = 'new.php';
                break;
            case 'edit':
                $template_file = 'edit.php';
                break;
        }
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/consumables/' . $template_file);
    }

    /**
     * 渲染备件管理页面
     */
    public function render_parts() {
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $template_file = 'index.php';
        switch ($action) {
            case 'new':
                $template_file = 'new.php';
                break;
            case 'edit':
                $template_file = 'edit.php';
                break;
        }
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/parts/' . $template_file);
    }

    /**
     * 渲染产品线管理页面
     */
    public function render_product_lines() {
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $template_file = 'index.php';
        switch ($action) {
            case 'new':
                $template_file = 'new.php';
                break;
            case 'edit':
                $template_file = 'edit.php';
                break;
        }
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/product-lines/' . $template_file);
    }

    /**
     * 渲染用户管理页面
     */
    public function render_users() {
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/users/index.php');
    }

    /**
     * 渲染系统设置页面
     */
    public function render_settings() {
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/settings/index.php');
    }

    /**
     * 渲染产品线页面编辑
     */
    public function render_page_edit() {
        // 页面编辑现在使用单独的模板，直接包含
        $this->render_mockup_page(BJT_PRODUCT_ADMIN_PATH . 'templates/admin/page-edit.php');
    }

    /**
     * Insert demo data for testing
     */
    public function insert_demo_data() {
        global $wpdb;
        
        // Host models table
        $host_table = $wpdb->prefix . 'bjt_host_models';
        
        // Check if the table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$host_table'") != $host_table) {
            return;
        }
        
        // Check if demo data already exists
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $host_table");
        if ($count > 0) {
            return;
        }
        
        // Sample host models
        $sample_hosts = array(
            array(
                'model_name' => 'AC-2000',
                'category' => 'air-cushion',
                'status' => 'active'
            ),
            array(
                'model_name' => 'AC-1500',
                'category' => 'air-cushion',
                'status' => 'active'
            ),
            array(
                'model_name' => 'PM-100',
                'category' => 'paper',
                'status' => 'active'
            ),
            array(
                'model_name' => 'PM-200',
                'category' => 'paper',
                'status' => 'inactive'
            ),
            array(
                'model_name' => 'TM-50',
                'category' => 'tape',
                'status' => 'active'
            )
        );
        
        // Insert sample host models
        foreach ($sample_hosts as $host) {
            $wpdb->insert(
                $host_table,
                array(
                    'model_name' => $host['model_name'],
                    'category' => $host['category'],
                    'status' => $host['status']
                ),
                array(
                    '%s',
                    '%s',
                    '%s'
                )
            );
        }
        
        // 配件表
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        
        // Check if the table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$accessories_table'") != $accessories_table) {
            return;
        }
        
        // Check if demo data already exists
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $accessories_table");
        if ($count == 0) {
            // 插入示例配件数据
            $sample_accessories = array(
                array(
                    'name' => '气垫膜',
                    'model' => 'ACC001',
                    'description' => '适用于AC-2000型号的标准气垫膜',
                    'status' => 'active'
                ),
                array(
                    'name' => '密封环',
                    'model' => 'ACC002',
                    'description' => '适用于多款气垫机型号的密封环',
                    'status' => 'active'
                ),
                array(
                    'name' => '加热组件',
                    'model' => 'ACC003',
                    'description' => '通用型加热组件，适用于大部分机型',
                    'status' => 'active'
                )
            );
            
            // 插入示例配件
            foreach ($sample_accessories as $accessory) {
                $wpdb->insert(
                    $accessories_table,
                    array(
                        'name' => $accessory['name'],
                        'model' => $accessory['model'],
                        'description' => $accessory['description'],
                        'status' => $accessory['status']
                    ),
                    array(
                        '%s',
                        '%s',
                        '%s',
                        '%s'
                    )
                );
            }
        }
        
        // 配件料号表
        $parts_table = $wpdb->prefix . 'bjt_accessory_parts';
        
        // Check if the table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$parts_table'") != $parts_table) {
            return;
        }
        
        // Check if demo data already exists
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $parts_table");
        if ($count == 0) {
            // 获取插入的配件ID
            $accessories = $wpdb->get_results("SELECT id, model FROM $accessories_table");
            if ($accessories) {
                $accessory_ids = array();
                foreach ($accessories as $acc) {
                    $accessory_ids[$acc->model] = $acc->id;
                }
                
                // 插入示例料号数据
                if (isset($accessory_ids['ACC001'])) {
                    $wpdb->insert(
                        $parts_table,
                        array(
                            'accessory_id' => $accessory_ids['ACC001'],
                            'part_number' => 'P-ACC001-A',
                            'description' => '标准型气垫膜',
                            'price' => 120.00,
                            'status' => 'active'
                        ),
                        array(
                            '%d',
                            '%s',
                            '%s',
                            '%f',
                            '%s'
                        )
                    );
                    
                    $wpdb->insert(
                        $parts_table,
                        array(
                            'accessory_id' => $accessory_ids['ACC001'],
                            'part_number' => 'P-ACC001-B',
                            'description' => '高密度气垫膜',
                            'price' => 150.00,
                            'status' => 'active'
                        ),
                        array(
                            '%d',
                            '%s',
                            '%s',
                            '%f',
                            '%s'
                        )
                    );
                }
                
                if (isset($accessory_ids['ACC002'])) {
                    $wpdb->insert(
                        $parts_table,
                        array(
                            'accessory_id' => $accessory_ids['ACC002'],
                            'part_number' => 'P-ACC002-A',
                            'description' => '橡胶密封环',
                            'price' => 30.00,
                            'status' => 'active'
                        ),
                        array(
                            '%d',
                            '%s',
                            '%s',
                            '%f',
                            '%s'
                        )
                    );
                }
                
                if (isset($accessory_ids['ACC003'])) {
                    $wpdb->insert(
                        $parts_table,
                        array(
                            'accessory_id' => $accessory_ids['ACC003'],
                            'part_number' => 'P-ACC003-A',
                            'description' => '标准加热组件',
                            'price' => 200.00,
                            'status' => 'active'
                        ),
                        array(
                            '%d',
                            '%s',
                            '%s',
                            '%f',
                            '%s'
                        )
                    );
                }
            }
        }
    }

    /**
     * Initialize the admin
     */
    public function init() {
        // Add admin menu
        add_action('admin_menu', array($this, 'register_admin_menu'));
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        // ... existing code ...
        
        // Add our mockup styles to match design requirements
        wp_enqueue_style( 'bjt-product-admin-mockup', plugin_dir_url( __FILE__ ) . '../../assets/css/bjt-mockup-style.css', array(), $this->version, 'all' );
        
        // ... existing code ...
    }

    /**
     * 处理保存产品线数据的AJAX请求
     */
    public function handle_save_product_line() {
        // 安全检查
        if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'bjt_product_admin_nonce')) {
            wp_send_json_error(array('message' => '安全验证失败'));
            exit;
        }
        
        // 获取产品线ID
        $product_line_id = isset($_POST['product_line_id']) ? intval($_POST['product_line_id']) : 0;
        
        // 验证产品线ID
        if ($product_line_id < 1 || $product_line_id > 4) {
            wp_send_json_error(array('message' => '无效的产品线ID'));
            exit;
        }
        
        // 准备数据
        $data = array(
            'title_en' => isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '',
            'title_zh' => isset($_POST['title_cn']) ? sanitize_text_field($_POST['title_cn']) : '',
            'description_en' => isset($_POST['description_en']) ? wp_kses_post($_POST['description_en']) : '',
            'description_zh' => isset($_POST['description_cn']) ? wp_kses_post($_POST['description_cn']) : '',
            'image_url' => isset($_POST['image_url']) ? esc_url_raw($_POST['image_url']) : '',
            'updated_at' => current_time('mysql'),
            'updated_by' => get_current_user_id()
        );
        
        // 更新数据库
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // 检查产品线记录是否存在
        $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $product_line_id));
        
        if ($exists) {
            // 更新已有记录
            $result = $wpdb->update(
                $table_name,
                $data,
                array('id' => $product_line_id),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%d'),
                array('%d')
            );
        } else {
            // 插入新纪录
            $data['id'] = $product_line_id;
            $data['status'] = 'active';
            $data['created_at'] = current_time('mysql');
            $data['created_by'] = get_current_user_id();
            
            $result = $wpdb->insert(
                $table_name,
                $data,
                array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d')
            );
        }
        
        // 检查操作结果
        if ($result === false) {
            wp_send_json_error(array('message' => '数据库操作失败: ' . $wpdb->last_error));
            exit;
        }
        
        wp_send_json_success(array(
            'message' => '产品线数据已保存',
            'product_line_id' => $product_line_id
        ));
    }

    /**
     * Add a custom body class for BJT admin pages.
     *
     * @param string $classes Existing body classes.
     * @return string Modified body classes.
     */
    public function add_admin_body_class($classes) {
        $screen = get_current_screen();
        if ($screen && strpos($screen->id, 'bjt-') !== false) {
            $classes .= ' bjt-mockup-active'; // Add our custom class
        }
        return $classes;
    }
} 