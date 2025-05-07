<?php
if (!defined('ABSPATH')) {
    exit;
}

// Get current page and action
$current_page = isset($_GET['page']) ? bjt_safe_sanitize_text_field($_GET['page']) : '';
$current_action = isset($_GET['action']) ? bjt_safe_sanitize_text_field($_GET['action']) : '';
$current_product_line = isset($_GET['product_line']) ? intval($_GET['product_line']) : 0;
$current_section = isset($_GET['section']) ? bjt_safe_sanitize_text_field($_GET['section']) : '';

// Define menu structure
$menu_items = array(
    array(
        'icon' => '📄',
        'title' => __('页面编辑', 'bjt-product-admin'),
        'page' => 'bjt-product-lines',
        'submenu' => array(
            array(
                'title' => __('产品线1', 'bjt-product-admin'),
                'page' => 'bjt-product-lines',
                'params' => array('product_line' => 1)
            ),
            array(
                'title' => __('产品线2', 'bjt-product-admin'),
                'page' => 'bjt-product-lines',
                'params' => array('product_line' => 2)
            ),
            array(
                'title' => __('产品线3', 'bjt-product-admin'),
                'page' => 'bjt-product-lines',
                'params' => array('product_line' => 3)
            ),
            array(
                'title' => __('产品线4', 'bjt-product-admin'),
                'page' => 'bjt-product-lines',
                'params' => array('product_line' => 4)
            ),
        )
    ),
    array(
        'icon' => '🛋️',
        'title' => __('气垫机', 'bjt-product-admin'),
        'page' => 'bjt-air-cushion',
        'submenu' => array(
            array(
                'icon' => '🔧',
                'title' => __('主机管理', 'bjt-product-admin'),
                'page' => 'bjt-air-cushion-hosts',
                'submenu' => array(
                    array(
                        'title' => __('主机列表', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-hosts',
                        'params' => array('section' => 'list')
                    ),
                    array(
                        'title' => __('添加主机', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-hosts',
                        'params' => array('section' => 'add')
                    ),
                    array(
                        'title' => __('主机料号', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-hosts',
                        'params' => array('section' => 'part-numbers')
                    )
                )
            ),
            array(
                'icon' => '🔌',
                'title' => __('配件管理', 'bjt-product-admin'),
                'page' => 'bjt-air-cushion-accessories',
                'submenu' => array(
                    array(
                        'title' => __('配件列表', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-accessories',
                        'params' => array('section' => 'list')
                    ),
                    array(
                        'title' => __('添加配件', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-accessories',
                        'params' => array('section' => 'add')
                    ),
                    array(
                        'title' => __('配件料号', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-accessories',
                        'params' => array('section' => 'part-numbers')
                    )
                )
            ),
            array(
                'icon' => '📦',
                'title' => __('耗材管理', 'bjt-product-admin'),
                'page' => 'bjt-air-cushion-consumables',
                'submenu' => array(
                    array(
                        'title' => __('耗材列表', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-consumables',
                        'params' => array('section' => 'list')
                    ),
                    array(
                        'title' => __('添加耗材', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-consumables',
                        'params' => array('section' => 'add')
                    ),
                    array(
                        'title' => __('耗材料号', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-consumables',
                        'params' => array('section' => 'part-numbers')
                    )
                )
            ),
            array(
                'icon' => '🔩',
                'title' => __('备件管理', 'bjt-product-admin'),
                'page' => 'bjt-air-cushion-parts',
                'submenu' => array(
                    array(
                        'title' => __('备件列表', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-parts',
                        'params' => array('section' => 'list')
                    ),
                    array(
                        'title' => __('添加备件', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-parts',
                        'params' => array('section' => 'add')
                    ),
                    array(
                        'title' => __('备件料号', 'bjt-product-admin'),
                        'page' => 'bjt-air-cushion-parts',
                        'params' => array('section' => 'part-numbers')
                    )
                )
            )
        )
    ),
    array(
        'icon' => '📄',
        'title' => __('纸机', 'bjt-product-admin'),
        'page' => 'bjt-paper-machine'
    ),
    array(
        'icon' => '🧵',
        'title' => __('胶带机', 'bjt-product-admin'),
        'page' => 'bjt-tape-machine'
    ),
    array(
        'icon' => '💼',
        'title' => __('气柱袋', 'bjt-product-admin'),
        'page' => 'bjt-air-column'
    ),
    array(
        'icon' => '👤',
        'title' => __('用户管理', 'bjt-product-admin'),
        'page' => 'bjt-users'
    ),
    array(
        'icon' => '⚙️',
        'title' => __('系统设置', 'bjt-product-admin'),
        'page' => 'bjt-settings'
    ),
);
?>

<div class="sidebar">
    <?php foreach ($menu_items as $item) : 
        $is_current = $current_page === $item['page'];
        $has_submenu = isset($item['submenu']);
        $submenu_active = false;
        
        if ($has_submenu) {
            foreach ($item['submenu'] as $submenu_item) {
                if ($current_page === $submenu_item['page']) {
                    if (isset($submenu_item['params'])) {
                        foreach ($submenu_item['params'] as $key => $value) {
                            if (isset($_GET[$key]) && bjt_safe_sanitize_text_field($_GET[$key]) == $value) {
                                $submenu_active = true;
                                break;
                            }
                        }
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
        ?>
        <a href="<?php echo bjt_safe_admin_url('admin.php?page=' . $item['page']); ?>" class="<?php echo $menu_class; ?>">
            <span class="menu-icon"><?php echo $item['icon']; ?></span>
            <span><?php echo $item['title']; ?></span>
        </a>
        
        <?php if ($has_submenu) : ?>
            <div class="submenu<?php echo ($is_current || $submenu_active) ? ' active' : ''; ?>">
                <?php foreach ($item['submenu'] as $submenu_item) : 
                    $is_current_submenu = $current_page === $submenu_item['page'];
                    $submenu_has_submenu = isset($submenu_item['submenu']);
                    $submenu_params_active = false;
                    
                    if (isset($submenu_item['params'])) {
                        $params_match = true;
                        foreach ($submenu_item['params'] as $key => $value) {
                            if (!isset($_GET[$key]) || bjt_safe_sanitize_text_field($_GET[$key]) != $value) {
                                $params_match = false;
                                break;
                            }
                        }
                        $submenu_params_active = $params_match;
                    }
                    
                    $submenu_class = 'menu-item';
                    if ($submenu_has_submenu) {
                        $submenu_class .= ' has-submenu';
                    }
                    if ($is_current_submenu || $submenu_params_active) {
                        $submenu_class .= ' active';
                    }
                    
                    // Build URL with parameters if needed
                    $url = bjt_safe_admin_url('admin.php?page=' . $submenu_item['page']);
                    if (isset($submenu_item['params'])) {
                        $url = bjt_safe_add_query_arg($submenu_item['params'], $url);
                    }
                    ?>
                    <a href="<?php echo $url; ?>" class="<?php echo $submenu_class; ?>">
                        <?php if (isset($submenu_item['icon'])) : ?>
                            <span class="menu-icon"><?php echo $submenu_item['icon']; ?></span>
                        <?php endif; ?>
                        <span><?php echo $submenu_item['title']; ?></span>
                    </a>
                    
                    <?php if ($submenu_has_submenu) : ?>
                        <div class="submenu<?php echo ($is_current_submenu || $submenu_params_active) ? ' active' : ''; ?>">
                            <?php foreach ($submenu_item['submenu'] as $child_item) : 
                                $child_params_active = false;
                                if (isset($child_item['params'])) {
                                    $child_params_match = true;
                                    foreach ($child_item['params'] as $key => $value) {
                                        if (!isset($_GET[$key]) || bjt_safe_sanitize_text_field($_GET[$key]) != $value) {
                                            $child_params_match = false;
                                            break;
                                        }
                                    }
                                    $child_params_active = $child_params_match;
                                }
                                
                                $child_url = bjt_safe_admin_url('admin.php?page=' . $child_item['page']);
                                if (isset($child_item['params'])) {
                                    $child_url = bjt_safe_add_query_arg($child_item['params'], $child_url);
                                }
                                ?>
                                <a href="<?php echo $child_url; ?>" 
                                   class="menu-item<?php echo $child_params_active ? ' active' : ''; ?>">
                                    <?php echo $child_item['title']; ?>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    <?php endforeach; ?>
</div>

<style>
.sidebar {
    width: 220px;
    background-color: #1a3c70;
    color: #fff;
    padding: 15px 0;
    overflow-y: auto;
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
.expandable::after {
    content: "▶";
    font-size: 10px;
    margin-left: auto;
    transition: transform 0.2s;
}
.expandable.active::after {
    content: "▼";
}
.menu-icon {
    margin-right: 10px;
    opacity: 0.8;
    font-size: 16px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Menu toggle functionality
    $('.expandable').on('click', function(e) {
        e.preventDefault();
        const submenu = $(this).next('.submenu');
        if (submenu.length) {
            submenu.slideToggle(200);
            $(this).toggleClass('active');
        }
    });

    // Ensure submenus with active items are visible
    $('.submenu .menu-item.active').each(function() {
        $(this).closest('.submenu').show().prev('.expandable').addClass('active');
    });
});</script> 