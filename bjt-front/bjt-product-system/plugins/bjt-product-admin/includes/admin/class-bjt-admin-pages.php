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
    private $page_slug = '';
    private $page_title = '';
    private $current_tab = '';
    private $current_section = '';

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
        // 添加内联脚本以折叠WordPress管理菜单
        ?>
        <style>
            /* 强制折叠WordPress管理菜单 */
            body:not(.mobile) #adminmenu,
            body:not(.mobile) #adminmenu .wp-submenu,
            body:not(.mobile) #adminmenuback,
            body:not(.mobile) #adminmenuwrap {
                width: 36px !important;
            }
            
            body:not(.mobile) #adminmenu .wp-submenu {
                left: 36px !important;
            }
            
            body:not(.mobile) #adminmenu .opensub .wp-submenu,
            body:not(.mobile) #adminmenu .wp-has-current-submenu .wp-submenu.sub-open,
            body:not(.mobile) #adminmenu .wp-has-current-submenu.opensub .wp-submenu,
            body:not(.mobile) #adminmenu a.wp-has-current-submenu:focus+.wp-submenu {
                left: 36px !important;
            }
            
            body:not(.mobile) #adminmenu .wp-has-current-submenu .wp-submenu {
                left: 36px !important;
            }
            
            /* 隐藏菜单文本 */
            body:not(.mobile) #adminmenu .wp-menu-name,
            body:not(.mobile) #adminmenu li.menu-top .wp-submenu-head {
                display: none !important;
            }
            
            /* 确保我们的自定义菜单紧贴折叠后的WordPress菜单 */
            .bjt-admin-menu-container {
                left: 36px !important;
            }
            
            /* 调整主内容区域左边距，防止被菜单覆盖 */
            #wpcontent, #wpfooter {
                margin-left: 36px !important;
            }
            
            .bjt-admin-content {
                margin-left: 276px !important;
            }
            
            /* 移动设备适配 */
            @media screen and (max-width: 782px) {
                .bjt-admin-menu-container {
                    left: 0 !important;
                }
                
                #wpcontent, #wpfooter {
                    margin-left: 0 !important;
                }
                
                .bjt-admin-content {
                    margin-left: 0 !important;
                    max-width: 100% !important;
                }
            }
        </style>
        <script>
            // 在文档加载时自动折叠WordPress菜单
            document.addEventListener('DOMContentLoaded', function() {
                // 添加折叠类到body
                document.body.classList.add('folded');
                
                // 如果有菜单折叠按钮，模拟点击它
                const collapseButton = document.getElementById('collapse-button');
                if (collapseButton) {
                    if (!document.body.classList.contains('folded')) {
                        collapseButton.click();
                    }
                    
                    // 禁用折叠按钮，防止用户展开菜单
                    collapseButton.style.display = 'none';
                }
                
                // 即使用户手动尝试展开菜单，也强制保持折叠状态
                const forceFolded = function() {
                    if (!document.body.classList.contains('folded')) {
                        document.body.classList.add('folded');
                    }
                };
                
                // 监听类变化，确保始终保持折叠状态
                const observer = new MutationObserver(forceFolded);
                observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
                
                // 定期检查折叠状态
                setInterval(forceFolded, 1000);
            });
        </script>
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
            array($this, 'render_hosts_page')
        );
        
        // 添加配件管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '配件管理',
            '配件管理',
            'edit_posts',
            $this->menu_slug . '-accessories',
            array($this, 'render_accessories_page')
        );
        
        // 添加耗材管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '耗材管理',
            '耗材管理',
            'edit_posts',
            $this->menu_slug . '-consumables',
            array($this, 'render_consumables_page')
        );
        
        // 添加备件管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '备件管理',
            '备件管理',
            'edit_posts',
            $this->menu_slug . '-spare-parts',
            array($this, 'render_spare_parts_page')
        );
        
        // 添加用户管理子菜单
        add_submenu_page(
            $this->menu_slug,
            '用户管理',
            '用户管理',
            'edit_posts',
            $this->menu_slug . '-users',
            array($this, 'render_users_page')
        );
    }

    public function render_settings_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-settings', 'settings');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        ?>
        <h1>产品管理系统设置</h1>
        <div class="form-container">
            <form method="post" action="options.php">
                <?php
                settings_fields($this->option_group);
                do_settings_sections($this->menu_slug . '-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    public function render_hosts_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-hosts', isset($_GET['action']) ? $_GET['action'] : '');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        
        // 根据action参数加载不同的模板
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        if ($action === 'edit') {
            // 加载编辑模板
            require_once plugin_dir_path(dirname(dirname(__FILE__))) . 'templates/admin/hosts/edit.php';
        } else {
            // 加载列表模板
            require_once plugin_dir_path(dirname(dirname(__FILE__))) . 'templates/admin/hosts/list.php';
        }
        
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    public function render_accessories_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-accessories', isset($_GET['action']) ? $_GET['action'] : '');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        
        // 显示开发中消息
        echo '<div class="notice notice-info"><p>配件管理功能正在开发中，敬请期待！</p></div>';
        
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    public function render_consumables_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-consumables', isset($_GET['action']) ? $_GET['action'] : '');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        
        // 显示开发中消息
        echo '<div class="notice notice-info"><p>耗材管理功能正在开发中，敬请期待！</p></div>';
        
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    public function render_spare_parts_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-spare-parts', isset($_GET['action']) ? $_GET['action'] : '');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        
        // 显示开发中消息
        echo '<div class="notice notice-info"><p>备件管理功能正在开发中，敬请期待！</p></div>';
        
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    public function render_users_page() {
        if (!current_user_can('edit_posts')) {
            wp_die(__('您没有足够的权限访问此页面。'));
        }
        
        // 开始输出内容，使用新的布局结构
        echo '<div class="wrap bjt-product-admin-wrap">';
        
        // 构建自定义导航
        $this->render_custom_navigation($this->menu_slug . '-users', isset($_GET['action']) ? $_GET['action'] : '');
        
        // 开始内容区域
        echo '<div class="bjt-admin-content">';
        
        // 显示开发中消息
        echo '<div class="notice notice-info"><p>用户管理功能正在开发中，敬请期待！</p></div>';
        
        // 关闭内容区域
        echo '</div>';
        
        // 关闭wrap div
        echo '</div>';
    }

    /**
     * 从页面名称获取section
     */
    private function get_section_from_page($page) {
        $section = 'host'; // 默认为主机管理
        
        if ($page !== $this->menu_slug) {
            // 移除前缀并返回section名称
            $section = str_replace($this->menu_slug . '-', '', $page);
        }
        
        return $section;
    }

    /**
     * Render the admin page
     */
    public function render_admin_page() {
        $is_mobile = wp_is_mobile();
        ?>
        <div class="wrap bjt-product-admin-wrap">
            <div class="bjt-admin-header">
                <h1 class="wp-heading-inline"><?php echo esc_html( $this->page_title ); ?></h1>
                <?php if ( $is_mobile ) : ?>
                    <div class="bjt-menu-toggle">
                        <span></span>
                    </div>
                <?php endif; ?>
            </div>

            <div class="bjt-menu-overlay"></div>
            
            <div class="bjt-admin-container">
                <?php $this->render_custom_navigation(); ?>
                
                <div class="bjt-admin-content">
                    <?php 
                    if ( $this->current_tab && $this->current_section ) {
                        do_action( 'bjt_product_admin_' . $this->current_tab . '_' . $this->current_section . '_page' );
                    } elseif ( $this->current_tab ) {
                        do_action( 'bjt_product_admin_' . $this->current_tab . '_page' );
                    } else {
                        do_action( 'bjt_product_admin_default_page' );
                    }
                    ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render custom navigation
     */
    public function render_custom_navigation($current_page = '', $current_action = '') {
        // Set current page from class property if not provided
        if (empty($current_page)) {
            $current_page = isset($_GET['page']) ? $_GET['page'] : $this->menu_slug;
        }
        
        // Get section from page name
        $current_section = $this->get_section_from_page($current_page);
        
        // Define menu structure
        $menu_items = array(
            'page_edit' => array(
                'title' => '页面编辑',
                'icon' => 'dashicons-edit',
                'sections' => array(
                    'product_line1' => array(
                        'title' => '产品线1',
                        'page' => $this->menu_slug . '-product-line1'
                    ),
                    'product_line2' => array(
                        'title' => '产品线2',
                        'page' => $this->menu_slug . '-product-line2'
                    ),
                    'product_line3' => array(
                        'title' => '产品线3',
                        'page' => $this->menu_slug . '-product-line3'
                    ),
                    'product_line4' => array(
                        'title' => '产品线4',
                        'page' => $this->menu_slug . '-product-line4'
                    )
                )
            ),
            'air_cushion' => array(
                'title' => '气垫机',
                'icon' => 'dashicons-admin-generic',
                'sections' => array(
                    'hosts' => array(
                        'title' => '主机',
                        'page' => $this->menu_slug . '-hosts'
                    ),
                    'accessories' => array(
                        'title' => '配件',
                        'page' => $this->menu_slug . '-accessories'
                    ),
                    'consumables' => array(
                        'title' => '耗材',
                        'page' => $this->menu_slug . '-consumables'
                    ),
                    'spare_parts' => array(
                        'title' => '备件',
                        'page' => $this->menu_slug . '-spare-parts'
                    )
                )
            ),
            'paper_machine' => array(
                'title' => '纸机',
                'icon' => 'dashicons-media-document',
                'sections' => array(
                    'paper_hosts' => array(
                        'title' => '主机',
                        'page' => $this->menu_slug . '-paper-hosts'
                    ),
                    'paper_accessories' => array(
                        'title' => '配件',
                        'page' => $this->menu_slug . '-paper-accessories'
                    ),
                    'paper_consumables' => array(
                        'title' => '耗材',
                        'page' => $this->menu_slug . '-paper-consumables'
                    ),
                    'paper_spare_parts' => array(
                        'title' => '备件',
                        'page' => $this->menu_slug . '-paper-spare-parts'
                    )
                )
            ),
            'tape_machine' => array(
                'title' => '胶带机',
                'icon' => 'dashicons-admin-tools',
                'sections' => array(
                    'tape_hosts' => array(
                        'title' => '主机',
                        'page' => $this->menu_slug . '-tape-hosts'
                    ),
                    'tape_accessories' => array(
                        'title' => '配件',
                        'page' => $this->menu_slug . '-tape-accessories'
                    ),
                    'tape_consumables' => array(
                        'title' => '耗材',
                        'page' => $this->menu_slug . '-tape-consumables'
                    ),
                    'tape_spare_parts' => array(
                        'title' => '备件',
                        'page' => $this->menu_slug . '-tape-spare-parts'
                    )
                )
            ),
            'air_column_bag' => array(
                'title' => '气柱袋',
                'icon' => 'dashicons-archive',
                'sections' => array(
                    'air_column_consumables' => array(
                        'title' => '耗材',
                        'page' => $this->menu_slug . '-air-column-consumables'
                    )
                )
            ),
            'user_management' => array(
                'title' => '用户管理',
                'icon' => 'dashicons-admin-users',
                'page' => $this->menu_slug . '-users'
            ),
            'settings' => array(
                'title' => '系统设置',
                'icon' => 'dashicons-admin-settings',
                'page' => $this->menu_slug . '-settings'
            )
        );
        
        // Render the menu
        ?>
        <div class="bjt-admin-menu-container">
            <nav class="bjt-admin-menu">
                <?php foreach ($menu_items as $key => $item) : 
                    $has_submenu = !empty($item['sections']);
                    $is_active = false;
                    
                    // Check if this item or any of its children is active
                    if (!$has_submenu) {
                        $is_active = ($current_page === $item['page']);
                    } else {
                        foreach ($item['sections'] as $section_key => $section) {
                            if ($current_page === $section['page']) {
                                $is_active = true;
                                break;
                            }
                        }
                    }
                    
                    // Build CSS classes
                    $classes = array('menu-item', 'bjt-menu-item');
                    if ($is_active) {
                        $classes[] = 'active';
                    }
                    if ($has_submenu) {
                        $classes[] = 'expandable';
                        $classes[] = 'has-submenu';
                    }
                    
                    $class_attr = implode(' ', $classes);
                    $data_attr = "data-section=\"{$key}\" data-menu-key=\"{$key}\"";
                ?>
                    <div class="<?php echo esc_attr($class_attr); ?>" <?php echo $data_attr; ?>>
                        <?php if (!$has_submenu) : ?>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=' . $item['page'])); ?>" class="menu-link">
                                <?php if (!empty($item['icon'])) : ?>
                                    <span class="menu-icon dashicons <?php echo esc_attr($item['icon']); ?>"></span>
                                <?php endif; ?>
                                <span class="menu-title"><?php echo esc_html($item['title']); ?></span>
                            </a>
                        <?php else : ?>
                            <div class="menu-title">
                                <?php if (!empty($item['icon'])) : ?>
                                    <span class="menu-icon dashicons <?php echo esc_attr($item['icon']); ?>"></span>
                                <?php endif; ?>
                                <?php echo esc_html($item['title']); ?>
                                <span class="submenu-icon"></span>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <?php if ($has_submenu) : ?>
                        <div class="submenu bjt-submenu-container <?php echo $is_active ? 'active expanded' : ''; ?>"
                             data-parent="<?php echo esc_attr($key); ?>"
                             data-parent-menu="<?php echo esc_attr($key); ?>">
                            <?php foreach ($item['sections'] as $section_key => $section) :
                                $section_is_active = $current_page === $section['page'];
                                $section_classes = array('menu-item', 'bjt-submenu-item');
                                
                                if ($section_is_active) {
                                    $section_classes[] = 'active';
                                }
                                
                                $section_class_attr = implode(' ', $section_classes);
                            ?>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=' . $section['page'])); ?>"
                                   class="<?php echo esc_attr($section_class_attr); ?>"
                                   data-submenu-key="<?php echo esc_attr($section_key); ?>">
                                    <?php echo esc_html($section['title']); ?>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </nav>
        </div>

        <script>
        (function($) {
            // Store menu state in localStorage
            function saveMenuState(menuId, isOpen) {
                const savedState = getSavedMenuState();
                savedState[menuId] = isOpen;
                localStorage.setItem('bjt_menu_state', JSON.stringify(savedState));
            }
            
            // Get saved menu state from localStorage
            function getSavedMenuState() {
                const savedState = localStorage.getItem('bjt_menu_state');
                return savedState ? JSON.parse(savedState) : {};
            }
            
            // Restore menu state
            function restoreMenuState() {
                const savedState = getSavedMenuState();
                
                // Restore submenu open/closed states
                $('.bjt-admin-menu .expandable').each(function() {
                    const sectionId = $(this).data('section');
                    const submenu = $('.submenu[data-parent="' + sectionId + '"]');
                    
                    if (savedState[sectionId]) {
                        $(this).addClass('active');
                        submenu.addClass('active');
                    }
                });
                
                // Ensure current active menu item is visible
                const activeMenuItem = $('.bjt-admin-menu .menu-item.active');
                if (activeMenuItem.length) {
                    const parentSubmenu = activeMenuItem.closest('.submenu');
                    if (parentSubmenu.length) {
                        const parentId = parentSubmenu.data('parent');
                        const parentMenuItem = $('.menu-item[data-section="' + parentId + '"]');
                        
                        parentMenuItem.addClass('active');
                        parentSubmenu.addClass('active');
                        
                        // Save this state
                        saveMenuState(parentId, true);
                    }
                }
            }
            
            // Handle submenu toggle
            $('.bjt-admin-menu .expandable').on('click', function(e) {
                const sectionId = $(this).data('section');
                const submenu = $('.submenu[data-parent="' + sectionId + '"]');
                
                $(this).toggleClass('active');
                submenu.toggleClass('active');
                
                // Save menu state
                saveMenuState(sectionId, $(this).hasClass('active'));
            });
            
            // Handle mobile menu toggle
            $('.bjt-menu-toggle').on('click', function() {
                $('body').toggleClass('bjt-menu-active');
            });
            
            // Close mobile menu when clicking overlay
            $('.bjt-menu-overlay').on('click', function() {
                $('body').removeClass('bjt-menu-active');
            });
            
            // Close mobile menu when clicking a menu item on mobile
            $(window).on('resize', function() {
                if (window.innerWidth > 782) {
                    $('body').removeClass('bjt-menu-active');
                }
            });
            
            // Track URL hash changes for SPA-like behavior
            $(window).on('hashchange', function() {
                // Find and activate menu item based on hash if needed
                const hash = window.location.hash;
                if (hash) {
                    const targetMenuItem = $('.bjt-admin-menu a[href$="' + hash + '"]');
                    if (targetMenuItem.length) {
                        $('.bjt-admin-menu .menu-item').removeClass('active');
                        targetMenuItem.addClass('active');
                        
                        // Open parent submenu if needed
                        const parentSubmenu = targetMenuItem.closest('.submenu');
                        if (parentSubmenu.length) {
                            const parentId = parentSubmenu.data('parent');
                            const parentMenuItem = $('.menu-item[data-section="' + parentId + '"]');
                            
                            parentMenuItem.addClass('active');
                            parentSubmenu.addClass('active');
                            
                            // Save this state
                            saveMenuState(parentId, true);
                        }
                    }
                }
            });
            
            // Initialize menu state on load
            $(document).ready(function() {
                restoreMenuState();
            });
        })(jQuery);
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
        wp_localize_script('bjt-admin-script', 'bjt_pages_data', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt_ajax_nonce')
        ));
        
        wp_enqueue_script('bjt-admin-script');
    }
} 