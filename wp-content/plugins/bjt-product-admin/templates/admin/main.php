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

<style>
.bjt-admin-content {
    padding: 20px;
}

/* 调整主内容区域 */
.wrap {
    margin: 0;
    padding: 0;
}
</style> 