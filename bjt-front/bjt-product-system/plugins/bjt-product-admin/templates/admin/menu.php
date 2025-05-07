<?php
if (!defined('ABSPATH')) {
    exit;
}

$current_page = $_GET['page'];
$product_lines = array(
    'air-cushion' => array(
        'title' => '气垫机',
        'icon' => '🛋️'
    ),
    'paper-machine' => array(
        'title' => '纸机',
        'icon' => '📃'
    ),
    'tape-machine' => array(
        'title' => '胶带机',
        'icon' => '🧵'
    ),
    'air-column' => array(
        'title' => '气柱袋',
        'icon' => '💼'
    )
);

// 定义管理选项
$management_options = array(
    'list' => '列表',
    'add' => '添加',
    'edit' => '编辑',
    'delete' => '删除'
);

// 检查当前页面是否属于某个产品线
function is_product_line_page($page) {
    global $product_lines;
    foreach ($product_lines as $key => $name) {
        if (bjt_safe_strpos($page, $key) !== false) {
            return true;
        }
    }
    return false;
}

// 获取当前产品线
function get_current_product_line($page) {
    global $product_lines;
    foreach ($product_lines as $key => $name) {
        if (bjt_safe_strpos($page, $key) !== false) {
            return $key;
        }
    }
    return '';
}

// 获取当前管理选项
function get_current_management_option($page) {
    global $management_options;
    foreach ($management_options as $key => $name) {
        if (bjt_safe_strpos($page, $key) !== false) {
            return $key;
        }
    }
    return '';
}
?>

<div class="wrap">
    <h1>产品管理系统</h1>
    
    <div class="nav-tab-wrapper">
        <?php foreach ($product_lines as $key => $name): ?>
            <a href="?page=bjt-<?php echo esc_attr($key); ?>" 
               class="nav-tab <?php echo bjt_safe_strpos($current_page, $key) !== false ? 'nav-tab-active' : ''; ?>">
                <?php echo esc_html($name); ?>
            </a>
        <?php endforeach; ?>
    </div>
    
    <?php if (is_product_line_page($current_page)): ?>
        <div class="subsubsub">
            <?php
            $product_line = get_current_product_line($current_page);
            $links = array();
            foreach ($management_options as $key => $name) {
                $url = '?page=bjt-' . $product_line . '-' . $key;
                $class = bjt_safe_strpos($current_page, $key) !== false ? 'current' : '';
                $links[] = sprintf(
                    '<a href="%s" class="%s">%s</a>',
                    esc_url($url),
                    esc_attr($class),
                    esc_html($name)
                );
            }
            echo implode(' | ', $links);
            ?>
        </div>
    <?php endif; ?>
</div> 