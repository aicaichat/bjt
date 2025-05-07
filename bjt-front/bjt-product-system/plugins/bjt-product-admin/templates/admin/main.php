<?php
/**
 * BJT Product Admin - Main Page Template
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前语言
$current_lang = get_locale();
$is_zh = strpos($current_lang, 'zh') !== false;

// 获取当前页面和操作
$page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
$action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
$section = isset($_GET['section']) ? sanitize_text_field($_GET['section']) : '';

// 产品线数据
$product_lines = array(
    'air_cushion' => array(
        'name_en' => 'Air Cushion',
        'name_zh' => '气垫机',
    ),
    'paper' => array(
        'name_en' => 'Paper',
        'name_zh' => '纸机',
    ),
    'tape' => array(
        'name_en' => 'Tape',
        'name_zh' => '胶带机',
    ),
    'air_column' => array(
        'name_en' => 'Air Column',
        'name_zh' => '气柱袋',
    ),
);

// 管理部分
$sections = array(
    'host' => array(
        'name_en' => 'Host Management',
        'name_zh' => '主机管理',
    ),
    'accessory' => array(
        'name_en' => 'Accessory Management',
        'name_zh' => '配件管理',
    ),
    'consumable' => array(
        'name_en' => 'Consumable Management',
        'name_zh' => '耗材管理',
    ),
    'part' => array(
        'name_en' => 'Part Management',
        'name_zh' => '备件管理',
    ),
);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo esc_html($is_zh ? 'BJT产品管理系统' : 'BJT Product Management System'); ?></title>
    <?php wp_head(); ?>
    <style>
        /* 顶部导航栏样式 */
        .bjt-top-nav {
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 32px;
            left: 160px;
            right: 0;
            z-index: 100;
        }

        .bjt-logo {
            height: 40px;
            width: auto;
        }

        .bjt-nav-menu {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .bjt-dropdown {
            position: relative;
            display: inline-block;
        }

        .bjt-dropdown-content {
            display: none;
            position: absolute;
            background-color: #fff;
            min-width: 160px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1;
        }

        .bjt-dropdown:hover .bjt-dropdown-content {
            display: block;
        }

        /* 左侧导航栏样式 */
        .bjt-sidebar {
            position: fixed;
            left: 0;
            top: 32px;
            bottom: 0;
            width: 160px;
            background: #23282d;
            color: #eee;
            overflow-y: auto;
        }

        .bjt-menu-group {
            margin: 15px 0;
        }

        .bjt-menu-title {
            padding: 10px 15px;
            font-weight: bold;
            color: #fff;
            cursor: pointer;
        }

        .bjt-menu-items {
            display: none;
            padding-left: 15px;
        }

        .bjt-menu-items.active {
            display: block;
        }

        .bjt-menu-item {
            padding: 8px 15px;
            color: #eee;
            text-decoration: none;
            display: block;
        }

        .bjt-menu-item:hover {
            background: #32373c;
            color: #fff;
        }

        /* 主内容区域样式 */
        .bjt-content {
            margin-left: 160px;
            margin-top: 82px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <!-- 顶部导航栏 -->
    <div class="bjt-top-nav">
        <!-- 公司logo -->
        <img src="<?php echo esc_url(BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/images/logo.png'); ?>" alt="BJT Logo" class="bjt-logo">
        
        <!-- 导航菜单 -->
        <div class="bjt-nav-menu">
            <!-- 产品分类下拉菜单 -->
            <div class="bjt-dropdown">
                <span><?php echo esc_html($is_zh ? '产品分类' : 'Products'); ?></span>
                <div class="bjt-dropdown-content">
                    <?php foreach ($product_lines as $key => $line) : ?>
                    <a href="?page=bjt-product-lines&line=<?php echo esc_attr($key); ?>">
                        <?php echo esc_html($is_zh ? $line['name_zh'] : $line['name_en']); ?>
                    </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- 文档下载入口 -->
            <div class="bjt-dropdown">
                <span><?php echo esc_html($is_zh ? '文档下载' : 'Documents'); ?></span>
                <div class="bjt-dropdown-content">
                    <a href="#"><?php echo esc_html($is_zh ? '产品手册' : 'Product Manual'); ?></a>
                    <a href="#"><?php echo esc_html($is_zh ? '技术文档' : 'Technical Docs'); ?></a>
                </div>
            </div>

            <!-- 售后服务入口 -->
            <div class="bjt-dropdown">
                <span><?php echo esc_html($is_zh ? '售后服务' : 'After-sales'); ?></span>
                <div class="bjt-dropdown-content">
                    <a href="#"><?php echo esc_html($is_zh ? '维修服务' : 'Repair Service'); ?></a>
                    <a href="#"><?php echo esc_html($is_zh ? '技术支持' : 'Technical Support'); ?></a>
                </div>
            </div>

            <!-- 语言切换器 -->
            <div class="bjt-dropdown">
                <span><?php echo esc_html($is_zh ? '语言' : 'Language'); ?></span>
                <div class="bjt-dropdown-content">
                    <a href="?lang=zh_CN">中文</a>
                    <a href="?lang=en_US">English</a>
                </div>
            </div>
        </div>
    </div>

    <!-- 左侧导航栏 -->
    <div class="bjt-sidebar">
        <!-- 页面编辑菜单组 -->
        <div class="bjt-menu-group">
            <div class="bjt-menu-title"><?php echo esc_html($is_zh ? '页面编辑' : 'Page Edit'); ?></div>
            <div class="bjt-menu-items">
                <?php foreach ($product_lines as $key => $line) : ?>
                <a href="?page=bjt-product-lines&action=edit&line=<?php echo esc_attr($key); ?>" class="bjt-menu-item">
                    <?php echo esc_html($is_zh ? $line['name_zh'] : $line['name_en']); ?>
                </a>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- 产品线管理菜单组 -->
        <?php foreach ($product_lines as $key => $line) : ?>
        <div class="bjt-menu-group">
            <div class="bjt-menu-title"><?php echo esc_html($is_zh ? $line['name_zh'] : $line['name_en']); ?></div>
            <div class="bjt-menu-items">
                <?php foreach ($sections as $section_key => $section) : ?>
                <a href="?page=bjt-<?php echo esc_attr($section_key); ?>&line=<?php echo esc_attr($key); ?>" class="bjt-menu-item">
                    <?php echo esc_html($is_zh ? $section['name_zh'] : $section['name_en']); ?>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- 主内容区域 -->
    <div class="bjt-content">
        <?php
        // 根据当前页面加载相应的内容模板
        if ($page === 'bjt-product-lines') {
            if ($action === 'edit') {
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/edit.php';
            } else {
                include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/product-lines/list.php';
            }
        } elseif (strpos($page, 'bjt-') === 0) {
            $template_path = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/' . substr($page, 4) . '/list.php';
            if (file_exists($template_path)) {
                include $template_path;
            }
        } else {
            // 默认显示欢迎页面
            include BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'templates/admin/welcome.php';
        }
        ?>
    </div>

    <script>
    jQuery(document).ready(function($) {
        // 菜单展开/收起功能
        $('.bjt-menu-title').click(function() {
            $(this).next('.bjt-menu-items').toggleClass('active');
        });

        // 根据当前页面激活相应的菜单
        var currentPage = '<?php echo esc_js($page); ?>';
        var currentLine = '<?php echo isset($_GET['line']) ? esc_js($_GET['line']) : ''; ?>';
        
        if (currentPage && currentLine) {
            $('.bjt-menu-item[href*="' + currentPage + '"][href*="' + currentLine + '"]')
                .closest('.bjt-menu-items')
                .addClass('active');
        }
    });
    </script>

    <?php wp_footer(); ?>
</body>
</html> 