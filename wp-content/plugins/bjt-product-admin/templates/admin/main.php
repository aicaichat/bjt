<?php
if (!defined('ABSPATH')) {
    exit;
}

// Get current page and action
$current_page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
$current_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

// 获取Admin Pages实例以使用template mapping
$admin_pages = BJT_Admin_Pages::get_instance();
?>

<div class="bjt-admin-wrap">
    <!-- 左侧自定义导航 -->
    <div class="bjt-admin-sidebar">
        <?php
        // 定义菜单结构 - 修改菜单结构以匹配实际页面
        $menu_items = array(
            array(
                'icon' => '🏠',
                'title' => __('首页', 'bjt-product-admin'),
                'page' => 'bjt-product-admin',
            ),
            array(
                'icon' => '📄',
                'title' => __('页面编辑', 'bjt-product-admin'),
                'page' => 'bjt-page-edit',
                'submenu' => array(
                    array('title' => __('产品线1', 'bjt-product-admin'), 'params' => array('line' => 1)),
                    array('title' => __('产品线2', 'bjt-product-admin'), 'params' => array('line' => 2)),
                    array('title' => __('产品线3', 'bjt-product-admin'), 'params' => array('line' => 3)),
                    array('title' => __('产品线4', 'bjt-product-admin'), 'params' => array('line' => 4)),
                )
            ),
            array(
                'icon' => '🛋️',
                'title' => __('气垫机', 'bjt-product-admin'),
                'page' => 'bjt-air-cushion',
                'submenu' => array(
                    array(
                        'title' => __('主机管理', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-hosts'
                    ),
                    array(
                        'title' => __('配件管理', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-accessories'
                    ),
                    array(
                        'title' => __('耗材管理', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-consumables'
                    ),
                    array(
                        'title' => __('备件管理', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-parts'
                    ),
                )
            ),
            array(
                'icon' => '📃',
                'title' => __('纸机', 'bjt-product-admin'),
                'page' => 'bjt-paper-machine',
                'submenu' => array(
                    array(
                        'title' => __('主机管理', 'bjt-product-admin'),
                        'page' => 'bjt-paper-machine-hosts'
                    ),
                    array(
                        'title' => __('配件管理', 'bjt-product-admin'),
                        'page' => 'bjt-paper-machine-accessories'
                    ),
                    array(
                        'title' => __('耗材管理', 'bjt-product-admin'),
                        'page' => 'bjt-paper-machine-consumables'
                    ),
                    array(
                        'title' => __('备件管理', 'bjt-product-admin'),
                        'page' => 'bjt-paper-machine-parts'
                    ),
                )
            ),
            array(
                'icon' => '🧵',
                'title' => __('胶带机', 'bjt-product-admin'),
                'page' => 'bjt-tape-machine',
                'submenu' => array(
                    array(
                        'title' => __('主机管理', 'bjt-product-admin'),
                        'page' => 'bjt-tape-machine-hosts'
                    ),
                    array(
                        'title' => __('配件管理', 'bjt-product-admin'),
                        'page' => 'bjt-tape-machine-accessories'
                    ),
                    array(
                        'title' => __('耗材管理', 'bjt-product-admin'),
                        'page' => 'bjt-tape-machine-consumables'
                    ),
                    array(
                        'title' => __('备件管理', 'bjt-product-admin'),
                        'page' => 'bjt-tape-machine-parts'
                    ),
                )
            ),
            array(
                'icon' => '💼',
                'title' => __('气柱袋', 'bjt-product-admin'),
                'page' => 'bjt-air-column',
                'submenu' => array(
                    array(
                        'title' => __('耗材管理', 'bjt-product-admin'),
                        'page' => 'bjt-air-column-consumables'
                    ),
                )
            ),
            array(
                'icon' => '👤',
                'title' => __('用户管理', 'bjt-product-admin'),
                'page' => 'bjt-user-management'
            ),
            array(
                'icon' => '⚙️',
                'title' => __('系统设置', 'bjt-product-admin'),
                'page' => 'bjt-system-settings'
            ),
        );

        // 渲染菜单
        foreach ($menu_items as $item) {
            $is_current = $current_page === $item['page'];
            $has_submenu = isset($item['submenu']);
            $submenu_active = false;
            
            // 检查子菜单激活状态
            if ($has_submenu) {
                foreach ($item['submenu'] as $submenu_item) {
                    if (isset($submenu_item['page']) && $current_page === $submenu_item['page']) {
                        $submenu_active = true;
                        break;
                    }
                    if (isset($submenu_item['params'])) {
                        $active = true;
                        foreach ($submenu_item['params'] as $param_key => $param_value) {
                            if (!isset($_GET[$param_key]) || $_GET[$param_key] != $param_value) {
                                $active = false;
                                break;
                            }
                        }
                        if ($active) {
                            $submenu_active = true;
                            break;
                        }
                    }
                }
            }
            
            $menu_class = 'menu-item';
            if ($has_submenu) {
                $menu_class .= ' expandable';
            }
            if ($is_current || $submenu_active) {
                $menu_class .= ' active';
            }
            
            $url = admin_url('admin.php?page=' . $item['page']);
            ?>
            <a href="<?php echo $url; ?>" class="<?php echo $menu_class; ?>">
                <span class="menu-icon"><?php echo $item['icon']; ?></span>
                <span><?php echo $item['title']; ?></span>
                <?php if ($has_submenu): ?>
                    <span class="menu-arrow">▶</span>
                <?php endif; ?>
            </a>
            
            <?php if ($has_submenu) : ?>
                <div class="submenu<?php echo ($is_current || $submenu_active) ? ' active' : ''; ?>">
                    <?php foreach ($item['submenu'] as $submenu_item) : 
                        $submenu_url = '';
                        $is_current_submenu = false;
                        
                        if (isset($submenu_item['page'])) {
                            // 子菜单有自己的页面参数
                            $submenu_url = admin_url('admin.php?page=' . $submenu_item['page']);
                            $is_current_submenu = ($current_page === $submenu_item['page']);
                        } else if (isset($submenu_item['params'])) {
                            // 子菜单使用主菜单页面但添加额外参数
                            $submenu_url = add_query_arg($submenu_item['params'], $url);
                            $is_current_submenu = $is_current;
                            
                            foreach ($submenu_item['params'] as $param_key => $param_value) {
                                if (isset($_GET[$param_key]) && $_GET[$param_key] == $param_value) {
                                    $is_current_submenu = true;
                                } else {
                                    $is_current_submenu = false;
                                    break;
                                }
                            }
                        }
                        ?>
                        <a href="<?php echo $submenu_url; ?>" 
                           class="menu-item<?php echo $is_current_submenu ? ' active' : ''; ?>">
                            <?php echo $submenu_item['title']; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        <?php } ?>
    </div>
    
    <div class="bjt-admin-content">
        <?php
        // 使用BJT_Admin_Pages类的get_template_path方法加载模板
        if (isset($_GET['page'])) {
            $template_path = $admin_pages->get_template_path($current_page);
            
            if ($template_path) {
                include $template_path;
            } else {
                // 如果找不到模板，回退到旧的逻辑
                switch ($_GET['page']) {
                    case 'bjt-product-admin':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/dashboard.php';
                        break;
                    case 'bjt-air-cushion-hosts':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/hosts/list.php';
                        break;
                    case 'bjt-air-cushion-accessories':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/accessories/list.php';
                        break;
                    case 'bjt-air-cushion-consumables':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/consumables/list.php';
                        break;
                    case 'bjt-air-cushion-parts':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/parts/list.php';
                        break;
                    case 'bjt-user-management':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/user-management.php';
                        break;
                    case 'bjt-system-settings':
                        include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/system-settings.php';
                        break;
                    default:
                        // 处理其他产品线的页面
                        if (strpos($_GET['page'], 'bjt-paper-machine') === 0 ||
                            strpos($_GET['page'], 'bjt-tape-machine') === 0 ||
                            strpos($_GET['page'], 'bjt-air-column') === 0) {
                            
                            if (strpos($_GET['page'], '-hosts') !== false) {
                                include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/hosts/list.php';
                            } else if (strpos($_GET['page'], '-accessories') !== false) {
                                include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/accessories/list.php';
                            } else if (strpos($_GET['page'], '-consumables') !== false) {
                                include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/consumables/list.php';
                            } else if (strpos($_GET['page'], '-parts') !== false) {
                                include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/parts/list.php';
                            } else {
                                // 产品线主页
                                include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/product-lines/overview.php';
                            }
                        } else {
                            // 默认显示仪表盘
                            include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/dashboard.php';
                        }
                }
            }
        } else {
            // 默认显示仪表盘
            include BJT_PRODUCT_ADMIN_PATH . 'templates/admin/dashboard.php';
        }
        ?>
    </div>
</div>

<style>
.bjt-admin-wrap {
    display: flex;
    min-height: calc(100vh - 32px);
}

.bjt-admin-content {
    flex: 1;
    padding: 20px;
    margin-left: 220px;
}

/* 导航样式 */
.bjt-admin-sidebar {
    position: fixed;
    left: 0;
    top: 32px;
    bottom: 0;
    width: 220px;
    background-color: #1a3c70;
    color: #fff;
    padding: 15px 0;
    overflow-y: auto;
    z-index: 100;
}

.bjt-admin-wrap .bjt-admin-sidebar .menu-item {
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

.bjt-admin-wrap .bjt-admin-sidebar .menu-item:hover {
    background-color: rgba(255,255,255,0.1);
    color: #fff;
}

.bjt-admin-wrap .bjt-admin-sidebar .menu-item.active {
    background-color: rgba(255,255,255,0.15);
    color: #fff;
    border-left-color: #4dabf7;
}

.bjt-admin-wrap .bjt-admin-sidebar .submenu {
    margin-left: 0;
    display: none;
    background-color: rgba(0,0,0,0.15);
}

.bjt-admin-wrap .bjt-admin-sidebar .submenu.active {
    display: block;
}

.bjt-admin-wrap .bjt-admin-sidebar .submenu .menu-item {
    padding-left: 40px;
    font-size: 13px;
}

.bjt-admin-wrap .bjt-admin-sidebar .expandable::after {
    content: "▶";
    font-size: 10px;
    margin-left: auto;
    transition: transform 0.2s;
}

.bjt-admin-wrap .bjt-admin-sidebar .expandable.active::after {
    content: "▼";
}

.bjt-admin-wrap .bjt-admin-sidebar .menu-icon {
    margin-right: 10px;
    opacity: 0.8;
    font-size: 16px;
}

.bjt-admin-wrap .bjt-admin-sidebar .menu-arrow {
    font-size: 10px;
    margin-left: auto;
    transition: transform 0.2s;
}

.bjt-admin-wrap .bjt-admin-sidebar .expandable.active .menu-arrow {
    transform: rotate(90deg);
}

/* 调整主内容区域 */
.wrap {
    margin-left: 0;
    padding: 0;
}

/* 隐藏WordPress原生菜单 */
#adminmenumain {
    display: none !important;
}

#wpadminbar {
    z-index: 99999;
}

#wpcontent, #wpfooter {
    margin-left: 0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .bjt-admin-sidebar {
        width: 60px;
        left: 0;
    }
    
    .menu-item span:not(.menu-icon):not(.menu-arrow) {
        display: none;
    }
    
    .menu-icon {
        margin-right: 0;
    }
    
    .submenu {
        position: absolute;
        left: 60px;
        width: 200px;
        z-index: 1001;
    }
    
    .bjt-admin-content {
        margin-left: 60px;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    // 使用更具体的选择器，防止与其他脚本冲突
    var mainAdminSidebar = $('.bjt-admin-wrap .bjt-admin-sidebar');
    
    // 菜单展开/折叠功能
    mainAdminSidebar.find('.expandable').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const submenu = $(this).next('.submenu');
        
        if (submenu.length) {
            // 总是展开，不自动关闭
            $(this).addClass('active');
            submenu.slideDown(200);
            
            // 旋转箭头
            $(this).find('.menu-arrow').css('transform', 'rotate(90deg)');
        }
    });

    // 确保带有活跃项的子菜单始终可见
    mainAdminSidebar.find('.submenu .menu-item.active').each(function() {
        $(this).closest('.submenu').show().prev('.expandable').addClass('active');
        $(this).closest('.submenu').prev('.expandable').find('.menu-arrow').css('transform', 'rotate(90deg)');
    });
});
</script> 