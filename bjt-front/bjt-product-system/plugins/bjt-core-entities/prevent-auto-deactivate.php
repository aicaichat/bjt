<?php
/**
 * 防止插件自动禁用
 * 
 * 这个文件应该被包含在主插件文件中
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 防止插件被自动禁用
 */
function bjt_prevent_plugin_deactivation() {
    // 关键插件列表
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php',
        'bjt-cors/bjt-cors.php',
    );
    
    // 获取当前激活的插件
    $active_plugins = get_option('active_plugins', array());
    
    // 检查并确保关键插件始终在激活列表中
    $modified = false;
    foreach ($required_plugins as $plugin) {
        if (!in_array($plugin, $active_plugins)) {
            $active_plugins[] = $plugin;
            $modified = true;
            error_log("BJT: 自动重新激活插件 - $plugin");
        }
    }
    
    // 如果有修改，更新数据库
    if ($modified) {
        update_option('active_plugins', array_unique($active_plugins));
    }
}

// 每次 WordPress 初始化时检查
add_action('plugins_loaded', 'bjt_prevent_plugin_deactivation', 1);

/**
 * 防止通过管理界面禁用关键插件
 */
function bjt_prevent_plugin_deactivation_ui($actions, $plugin_file) {
    // 关键插件列表
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php',
        'bjt-cors/bjt-cors.php',
    );
    
    // 如果是关键插件，移除"停用"链接
    if (in_array($plugin_file, $required_plugins)) {
        unset($actions['deactivate']);
        $actions['required'] = '<span style="color: #d63638;">必需插件</span>';
    }
    
    return $actions;
}
add_filter('plugin_action_links', 'bjt_prevent_plugin_deactivation_ui', 10, 2);

/**
 * 记录插件状态变化
 */
function bjt_log_plugin_status_change($plugin, $network_wide) {
    error_log("BJT: 插件状态变化 - $plugin");
    
    // 如果是关键插件被禁用，立即重新激活
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php',
        'bjt-cors/bjt-cors.php',
    );
    
    if (in_array($plugin, $required_plugins)) {
        error_log("BJT: 检测到关键插件被禁用，正在重新激活 - $plugin");
        activate_plugin($plugin);
    }
}
add_action('deactivated_plugin', 'bjt_log_plugin_status_change', 10, 2);

/**
 * 定期检查插件状态（使用 wp-cron）
 */
function bjt_schedule_plugin_check() {
    if (!wp_next_scheduled('bjt_check_plugins_status')) {
        wp_schedule_event(time(), 'hourly', 'bjt_check_plugins_status');
    }
}
add_action('wp', 'bjt_schedule_plugin_check');

function bjt_check_plugins_status() {
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php',
        'bjt-cors/bjt-cors.php',
    );
    
    $active_plugins = get_option('active_plugins', array());
    
    foreach ($required_plugins as $plugin) {
        if (!in_array($plugin, $active_plugins)) {
            error_log("BJT: 定期检查发现插件未激活，正在激活 - $plugin");
            activate_plugin($plugin);
        }
    }
}
add_action('bjt_check_plugins_status', 'bjt_check_plugins_status');

/**
 * 在插件列表页面显示警告
 */
function bjt_plugin_notice() {
    $screen = get_current_screen();
    if ($screen->id !== 'plugins') {
        return;
    }
    
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php' => 'BJT Core Entities',
        'bjt-cors/bjt-cors.php' => 'BJT CORS',
    );
    
    $active_plugins = get_option('active_plugins', array());
    $missing_plugins = array();
    
    foreach ($required_plugins as $plugin => $name) {
        if (!in_array($plugin, $active_plugins)) {
            $missing_plugins[] = $name;
        }
    }
    
    if (!empty($missing_plugins)) {
        ?>
        <div class="notice notice-error">
            <p><strong>警告：</strong>以下关键插件未激活，系统可能无法正常工作：</p>
            <ul>
                <?php foreach ($missing_plugins as $plugin): ?>
                    <li><?php echo esc_html($plugin); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php
    }
}
add_action('admin_notices', 'bjt_plugin_notice');

