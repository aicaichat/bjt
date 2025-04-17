<?php
/**
 * 管理页面类
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Admin_Pages {
    private static $instance = null;
    private $menu_slug = 'bjt-product-admin';
    private $option_group = 'bjt_product_admin_options';
    private $option_name = 'bjt_product_admin_settings';

    private function __construct() {
        $this->init();
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_head', array($this, 'add_admin_styles'));
        
        // 添加插件设置链接
        add_filter('plugin_action_links_bjt-product-admin/bjt-product-admin.php', array($this, 'add_settings_link'));
    }

    public function add_settings_link($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=' . $this->menu_slug . '-settings') . '">设置</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    public function register_settings() {
        // 注册设置
        register_setting(
            $this->option_group,
            $this->option_name,
            array(
                'type' => 'array',
                'description' => '产品管理系统设置',
                'sanitize_callback' => array($this, 'sanitize_settings')
            )
        );

        // 添加设置区块
        add_settings_section(
            'general_settings',
            '基本设置',
            array($this, 'render_section_description'),
            $this->menu_slug . '-settings'
        );

        // 添加设置字段
        add_settings_field(
            'enable_crm_integration',
            'CRM集成',
            array($this, 'render_crm_integration_field'),
            $this->menu_slug . '-settings',
            'general_settings'
        );

        add_settings_field(
            'crm_api_url',
            'CRM API地址',
            array($this, 'render_crm_api_url_field'),
            $this->menu_slug . '-settings',
            'general_settings'
        );

        add_settings_field(
            'crm_api_key',
            'CRM API密钥',
            array($this, 'render_crm_api_key_field'),
            $this->menu_slug . '-settings',
            'general_settings'
        );

        add_settings_field(
            'items_per_page',
            '每页显示数量',
            array($this, 'render_items_per_page_field'),
            $this->menu_slug . '-settings',
            'general_settings'
        );
    }

    public function render_section_description() {
        echo '<p>配置产品管理系统的基本设置。</p>';
    }

    public function render_crm_integration_field() {
        $options = get_option($this->option_name);
        $value = isset($options['enable_crm_integration']) ? $options['enable_crm_integration'] : '0';
        ?>
        <label>
            <input type="checkbox" name="<?php echo $this->option_name; ?>[enable_crm_integration]" value="1" <?php checked('1', $value); ?>>
            启用CRM集成
        </label>
        <p class="description">启用后可以从CRM系统同步数据</p>
        <?php
    }

    public function render_crm_api_url_field() {
        $options = get_option($this->option_name);
        $value = isset($options['crm_api_url']) ? $options['crm_api_url'] : '';
        ?>
        <input type="url" name="<?php echo $this->option_name; ?>[crm_api_url]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description">输入CRM系统的API地址</p>
        <?php
    }

    public function render_crm_api_key_field() {
        $options = get_option($this->option_name);
        $value = isset($options['crm_api_key']) ? $options['crm_api_key'] : '';
        ?>
        <input type="password" name="<?php echo $this->option_name; ?>[crm_api_key]" value="<?php echo esc_attr($value); ?>" class="regular-text">
        <p class="description">输入CRM系统的API密钥</p>
        <?php
    }

    public function render_items_per_page_field() {
        $options = get_option($this->option_name);
        $value = isset($options['items_per_page']) ? $options['items_per_page'] : '20';
        ?>
        <input type="number" name="<?php echo $this->option_name; ?>[items_per_page]" value="<?php echo esc_attr($value); ?>" class="small-text" min="1" max="100">
        <p class="description">设置列表页面每页显示的记录数量（1-100）</p>
        <?php
    }

    public function sanitize_settings($input) {
        $sanitized = array();
        
        // CRM集成开关
        $sanitized['enable_crm_integration'] = isset($input['enable_crm_integration']) ? '1' : '0';
        
        // CRM API地址
        if (isset($input['crm_api_url'])) {
            $sanitized['crm_api_url'] = esc_url_raw($input['crm_api_url']);
        }
        
        // CRM API密钥
        if (isset($input['crm_api_key'])) {
            $sanitized['crm_api_key'] = sanitize_text_field($input['crm_api_key']);
        }
        
        // 每页显示数量
        if (isset($input['items_per_page'])) {
            $items_per_page = absint($input['items_per_page']);
            $sanitized['items_per_page'] = ($items_per_page >= 1 && $items_per_page <= 100) ? $items_per_page : 20;
        }
        
        return $sanitized;
    }

    public function add_admin_styles() {
        ?>
        <style>
            /* 隐藏WordPress默认菜单 */
            #adminmenuback, #adminmenuwrap, #adminmenu {
                display: none !important;
            }

            /* 调整内容区域 */
            #wpcontent, #wpbody {
                margin-left: 0 !important;
                padding-left: 0 !important;
            }

            /* 容器样式 */
            .container {
                display: flex;
                flex: 1;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }

            /* 侧边栏样式 */
            .bjt-admin-menu-container {
                width: 220px;
                background-color: #1a3c70;
                color: #fff;
                padding: 15px 0;
                overflow-y: auto;
                position: fixed;
                left: 0;
                top: 32px;
                height: calc(100vh - 32px);
            }

            /* 菜单项样式 */
            .bjt-admin-menu {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .menu-item {
                padding: 12px 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                color: rgba(255,255,255,0.8);
                text-decoration: none;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                font-size: 14px;
            }
            
            .menu-item:hover {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            
            .menu-item.active {
                background-color: rgba(255,255,255,0.15);
                color: #fff;
                border-left-color: #4dabf7;
            }
            
            /* 子菜单样式 */
            .submenu {
                margin-left: 0;
                display: none;
                background-color: rgba(0,0,0,0.15);
            }
            
            .submenu.active {
                display: block;
            }
            
            .submenu .menu-item {
                padding-left: 40px;
                font-size: 13px;
            }
            
            /* 可展开菜单项样式 */
            .expandable::after {
                content: "▶";
                font-size: 10px;
                margin-left: auto;
                transition: transform 0.2s;
            }
            
            .expandable.active::after {
                content: "▼";
            }
            
            /* 菜单图标 */
            .menu-icon {
                margin-right: 10px;
                opacity: 0.8;
                font-size: 16px;
            }

            /* 内容区域 */
            .bjt-admin-content {
                flex: 1;
                padding: 30px;
                background-color: #fff;
                border-radius: 8px;
                margin: 20px;
                margin-left: 240px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }

            /* 设置页面样式 */
            .bjt-settings-page {
                max-width: 800px;
                margin: 0;
                padding: 0;
            }

            /* 响应式调整 */
            @media screen and (max-width: 782px) {
                .bjt-admin-menu-container {
                    position: relative;
                    width: 100%;
                    height: auto;
                    top: 0;
                }

                .bjt-admin-content {
                    margin-left: 20px;
                }
            }
        </style>
        <?php
    }

    public function add_admin_menu() {
        // 添加主菜单
        add_menu_page(
            '产品管理', 
            '产品管理', 
            'edit_posts', 
            $this->menu_slug, 
            array($this, 'render_settings_page'),
            'dashicons-admin-generic',
            30
        );
        
        // 添加子菜单
        add_submenu_page(
            $this->menu_slug,
            '设置',
            '设置',
            'edit_posts',
            $this->menu_slug . '-settings',
            array($this, 'render_settings_page')
        );
        
        // 添加主机管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '主机管理',
            '主机管理',
            'edit_posts',
            $this->menu_slug . '-hosts',
            array($this, 'render_admin_page')
        );
        
        // 添加料号管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '料号管理',
            '料号管理',
            'edit_posts',
            $this->menu_slug . '-parts',
            array($this, 'render_parts_page')
        );
    }

    public function render_settings_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-settings', 'settings');
        
        ?>
        <div class="bjt-admin-content">
            <div class="bjt-settings-page">
                <h1>产品管理系统设置</h1>
                <form method="post" action="options.php">
                    <?php
                    settings_fields($this->option_group);
                    do_settings_sections($this->menu_slug . '-settings');
                    submit_button();
                    ?>
                </form>
            </div>
        </div>
        <?php
    }

    public function render_hosts_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-hosts', 'host');
        
        // 加载模板文件
        require_once plugin_dir_path(dirname(dirname(__FILE__))) . 'templates/admin/hosts/list.php';
    }

    public function render_parts_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        require_once BJT_PLUGIN_DIR . 'templates/admin/parts/list.php';
    }

    public function render_admin_page() {
        // 检查用户权限
        if (!current_user_can('edit_posts')) {
            wp_die(
                '<h1>' . __('您没有权限访问此页面') . '</h1>' .
                '<p>' . __('抱歉，您需要编辑权限才能访问此页面。') . '</p>',
                403
            );
        }

        // 获取当前页面和操作
        $current_page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : $this->menu_slug;
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        
        // 根据页面确定section
        $section = 'host'; // 默认为主机管理
        if ($current_page !== $this->menu_slug) {
            $section = str_replace($this->menu_slug . '-', '', $current_page);
        }

        // 构建自定义导航
        $this->render_custom_navigation($current_page, $section);

        // 构建模板路径
        $base_path = plugin_dir_path(dirname(dirname(__FILE__))) . 'templates/admin/';
        
        try {
            echo '<div class="bjt-admin-content">';
            
            // 根据页面和操作加载对应的模板
            switch ($action) {
                case 'edit':
                    $template_path = $base_path . $section . '/edit.php';
                    break;
                
                case 'manage-relations':
                    $template_path = $base_path . $section . '/relationships/list.php';
                    break;
                
                case 'manage-part-numbers':
                    $template_path = $base_path . $section . '/part-numbers/list.php';
                    break;
                
                case 'edit-part-number':
                    $template_path = $base_path . $section . '/part-numbers/edit.php';
                    break;
                
                default:
                    $template_path = $base_path . $section . '/list.php';
                    break;
            }

            // 检查模板文件是否存在
            if (!file_exists($template_path)) {
                throw new Exception(sprintf('模板文件 %s 不存在', $template_path));
            }

            // 加载模板文件
            include $template_path;
            
            echo '</div>';

        } catch (Exception $e) {
            echo '<div class="bjt-admin-content">';
            wp_die(
                '<h1>' . __('页面加载错误') . '</h1>' .
                '<p>' . esc_html($e->getMessage()) . '</p>',
                500
            );
            echo '</div>';
        }
    }

    public function render_custom_navigation($current_page, $current_section) {
        // 获取当前产品线和类型
        $current_product_line = isset($_GET['product_line']) ? sanitize_text_field($_GET['product_line']) : '';
        $current_type = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : '';
        $current_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
        
        // 输出导航HTML
        ?>
        <div class="bjt-admin-menu-container" id="bjtAdminMenu">
            <ul class="bjt-admin-menu">
                <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug); ?>" class="menu-item <?php echo ($current_page === $this->menu_slug && empty($current_product_line) && empty($current_type)) ? 'active' : ''; ?>">
                    <span class="menu-icon">🏠</span>
                    <span>首页</span>
                </a>
                
                <div class="menu-item-container">
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-pages'); ?>" class="menu-item <?php echo ($current_section === 'pages') ? 'active' : ''; ?>">
                        <span class="menu-icon">📄</span>
                        <span>页面编辑</span>
                    </a>
                    <span class="expand-toggle" data-target="pages">▶</span>
                </div>
                <div class="submenu" id="submenu-pages" <?php echo ($current_section === 'pages') ? 'style="display:block"' : ''; ?>>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-pages&product_line=1'); ?>" class="menu-item <?php echo ($current_product_line === '1') ? 'active' : ''; ?>">产品线1</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-pages&product_line=2'); ?>" class="menu-item <?php echo ($current_product_line === '2') ? 'active' : ''; ?>">产品线2</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-pages&product_line=3'); ?>" class="menu-item <?php echo ($current_product_line === '3') ? 'active' : ''; ?>">产品线3</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-pages&product_line=4'); ?>" class="menu-item <?php echo ($current_product_line === '4') ? 'active' : ''; ?>">产品线4</a>
                </div>
                
                <div class="menu-item-container">
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug); ?>" class="menu-item <?php echo (in_array($current_section, ['host', 'accessory', 'consumable', 'spare'])) ? 'active' : ''; ?>">
                        <span class="menu-icon">🛋️</span>
                        <span>气垫机</span>
                    </a>
                    <span class="expand-toggle" data-target="cushion">▶</span>
                </div>
                <div class="submenu" id="submenu-cushion" <?php echo (in_array($current_section, ['host', 'accessory', 'consumable', 'spare'])) ? 'style="display:block"' : ''; ?>>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-hosts'); ?>" class="menu-item <?php echo ($current_section === 'host') ? 'active' : ''; ?>">主机</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-hosts&action=manage-relations'); ?>" class="menu-item <?php echo ($current_section === 'host' && $current_action === 'manage-relations') ? 'active' : ''; ?>">关系管理</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-hosts&action=manage-part-numbers'); ?>" class="menu-item <?php echo ($current_section === 'host' && $current_action === 'manage-part-numbers') ? 'active' : ''; ?>">料号管理</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-accessory'); ?>" class="menu-item <?php echo ($current_section === 'accessory') ? 'active' : ''; ?>">配件</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-consumable'); ?>" class="menu-item <?php echo ($current_section === 'consumable') ? 'active' : ''; ?>">耗材</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-spare'); ?>" class="menu-item <?php echo ($current_section === 'spare') ? 'active' : ''; ?>">备件</a>
                </div>
                
                <div class="menu-item-container">
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-paper'); ?>" class="menu-item <?php echo ($current_section === 'paper') ? 'active' : ''; ?>">
                        <span class="menu-icon">📃</span>
                        <span>纸机</span>
                    </a>
                    <span class="expand-toggle" data-target="paper">▶</span>
                </div>
                <div class="submenu" id="submenu-paper" <?php echo ($current_section === 'paper') ? 'style="display:block"' : ''; ?>>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-paper'); ?>" class="menu-item <?php echo ($current_section === 'paper' && empty($current_type)) ? 'active' : ''; ?>">主机</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-paper&type=accessory'); ?>" class="menu-item <?php echo ($current_section === 'paper' && $current_type === 'accessory') ? 'active' : ''; ?>">配件</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-paper&type=consumable'); ?>" class="menu-item <?php echo ($current_section === 'paper' && $current_type === 'consumable') ? 'active' : ''; ?>">耗材</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-paper&type=spare'); ?>" class="menu-item <?php echo ($current_section === 'paper' && $current_type === 'spare') ? 'active' : ''; ?>">备件</a>
                </div>
                
                <div class="menu-item-container">
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-tape'); ?>" class="menu-item <?php echo ($current_section === 'tape') ? 'active' : ''; ?>">
                        <span class="menu-icon">🧵</span>
                        <span>胶带机</span>
                    </a>
                    <span class="expand-toggle" data-target="tape">▶</span>
                </div>
                <div class="submenu" id="submenu-tape" <?php echo ($current_section === 'tape') ? 'style="display:block"' : ''; ?>>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-tape'); ?>" class="menu-item <?php echo ($current_section === 'tape' && empty($current_type)) ? 'active' : ''; ?>">主机</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-tape&type=accessory'); ?>" class="menu-item <?php echo ($current_section === 'tape' && $current_type === 'accessory') ? 'active' : ''; ?>">配件</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-tape&type=consumable'); ?>" class="menu-item <?php echo ($current_section === 'tape' && $current_type === 'consumable') ? 'active' : ''; ?>">耗材</a>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-tape&type=spare'); ?>" class="menu-item <?php echo ($current_section === 'tape' && $current_type === 'spare') ? 'active' : ''; ?>">备件</a>
                </div>
                
                <div class="menu-item-container">
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-airbag'); ?>" class="menu-item <?php echo ($current_section === 'airbag') ? 'active' : ''; ?>">
                        <span class="menu-icon">💼</span>
                        <span>气柱袋</span>
                    </a>
                    <span class="expand-toggle" data-target="airbag">▶</span>
                </div>
                <div class="submenu" id="submenu-airbag" <?php echo ($current_section === 'airbag') ? 'style="display:block"' : ''; ?>>
                    <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-airbag&type=consumable'); ?>" class="menu-item <?php echo ($current_section === 'airbag' && $current_type === 'consumable') ? 'active' : ''; ?>">耗材</a>
                </div>
                
                <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-users'); ?>" class="menu-item <?php echo ($current_section === 'users') ? 'active' : ''; ?>">
                    <span class="menu-icon">👤</span>
                    <span>用户管理</span>
                </a>
                <a href="<?php echo admin_url('admin.php?page=' . $this->menu_slug . '-settings'); ?>" class="menu-item <?php echo ($current_section === 'settings') ? 'active' : ''; ?>">
                    <span class="menu-icon">⚙️</span>
                    <span>系统设置</span>
                </a>
            </ul>
        </div>

        <style>
            /* 导航菜单样式 */
            .bjt-admin-menu-container {
                width: 220px;
                background-color: #1a3c70;
                color: #fff;
                padding: 15px 0;
                overflow-y: auto;
                position: fixed;
                left: 0;
                top: 32px;
                height: calc(100vh - 32px);
            }

            .bjt-admin-menu {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .menu-item {
                padding: 12px 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                color: rgba(255,255,255,0.8);
                text-decoration: none;
                transition: all 0.2s ease;
                border-left: 3px solid transparent;
                font-size: 14px;
                flex-grow: 1;
            }
            
            .menu-item:hover {
                background-color: rgba(255,255,255,0.1);
                color: #fff;
            }
            
            .menu-item.active {
                background-color: rgba(255,255,255,0.15);
                color: #fff;
                border-left-color: #4dabf7;
            }
            
            .submenu {
                margin-left: 0;
                display: none;
                background-color: rgba(0,0,0,0.15);
            }
            
            .submenu .menu-item {
                padding-left: 40px;
                font-size: 13px;
            }
            
            .menu-icon {
                margin-right: 10px;
                opacity: 0.8;
                font-size: 16px;
            }

            .menu-item-container {
                display: flex;
                align-items: center;
                position: relative;
            }

            .expand-toggle {
                cursor: pointer;
                font-size: 10px;
                padding: 12px 15px;
                color: rgba(255,255,255,0.8);
            }

            .expand-toggle:hover {
                color: #fff;
            }
        </style>

        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 菜单展开/折叠功能
            document.querySelectorAll('.expand-toggle').forEach(toggle => {
                toggle.addEventListener('click', function() {
                    const targetId = 'submenu-' + this.getAttribute('data-target');
                    const submenu = document.getElementById(targetId);
                    
                    if (submenu) {
                        if (submenu.style.display === 'block') {
                            submenu.style.display = 'none';
                            this.textContent = '▶';
                        } else {
                            submenu.style.display = 'block';
                            this.textContent = '▼';
                        }
                    }
                });

                // 初始化箭头方向
                const targetId = 'submenu-' + toggle.getAttribute('data-target');
                const submenu = document.getElementById(targetId);
                if (submenu && submenu.style.display === 'block') {
                    toggle.textContent = '▼';
                }
            });
        });
        </script>
        <?php
    }

    public function enqueue_scripts($hook) {
        // 只在插件页面加载资源
        if (strpos($hook, $this->menu_slug) === false) {
            return;
        }

        // 注册和加载样式
        wp_register_style(
            'bjt-admin-style',
            plugins_url('assets/css/admin.css', dirname(dirname(__FILE__))),
            array(),
            '1.0.0'
        );
        wp_enqueue_style('bjt-admin-style');

        // 注册和加载脚本
        wp_register_script(
            'bjt-admin-script',
            plugins_url('assets/js/admin.js', dirname(dirname(__FILE__))),
            array('jquery'),
            '1.0.0',
            true
        );
        
        // 添加AJAX URL和nonce到JavaScript
        wp_localize_script('bjt-admin-script', 'bjtAdmin', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt_ajax_nonce')
        ));
        
        wp_enqueue_script('bjt-admin-script');
    }
} 