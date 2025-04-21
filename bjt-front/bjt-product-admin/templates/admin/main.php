<?php
/**
 * 产品管理系统主模板
 */

if (!defined('ABSPATH')) {
    exit;
}

// 获取当前页面
$current_page = bjt_safe_sanitize_text_field($_GET['page'] ?? '');

// 检查当前页面是否属于某个产品线
function is_product_line_page($page) {
    $product_lines = array('air-cushion', 'host', 'accessory', 'consumable', 'part');
    foreach ($product_lines as $line) {
        if (bjt_safe_strpos($page, $line) !== false) {
            return true;
        }
    }
    return false;
}

// 获取当前产品线
function get_current_product_line($page) {
    $product_lines = array('air-cushion', 'host', 'accessory', 'consumable', 'part');
    foreach ($product_lines as $line) {
        if (bjt_safe_strpos($page, $line) !== false) {
            return $line;
        }
    }
    return '';
}

// 获取当前管理选项
function get_current_management_option($page) {
    $options = array('list', 'add', 'edit', 'delete');
    foreach ($options as $option) {
        if (bjt_safe_strpos($page, $option) !== false) {
            return $option;
        }
    }
    return '';
}

// 包含头部
include_once plugin_dir_path(__FILE__) . 'header.php';

// 包含菜单
include_once plugin_dir_path(__FILE__) . 'menu.php';

// 根据当前页面加载内容
if (is_product_line_page($current_page)) {
    $product_line = get_current_product_line($current_page);
    $option = get_current_management_option($current_page);
    
    $template_file = plugin_dir_path(__FILE__) . $product_line . '/' . $option . '.php';
    if (file_exists($template_file)) {
        include $template_file;
    } else {
        echo '<div class="error"><p>模板文件不存在：' . esc_html($template_file) . '</p></div>';
    }
} else {
    echo '<div class="error"><p>页面未找到：' . esc_html($current_page) . '</p></div>';
}

// 包含底部
include_once plugin_dir_path(__FILE__) . 'footer.php'; 