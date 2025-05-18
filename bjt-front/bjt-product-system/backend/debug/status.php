<?php
// 加载 WordPress 环境
require_once(dirname(dirname(__FILE__)) . '/wp-load.php');

// 设置头部
header('Content-Type: text/html; charset=utf-8');

// 设置安全访问令牌
$access_token = 'bjt-status-2025';

// 检查访问权限
if (!isset($_GET['token']) || $_GET['token'] !== $access_token) {
    header('HTTP/1.1 403 Forbidden');
    echo '<h1>403 Forbidden</h1>';
    echo '<p>Access denied. Please provide a valid token.</p>';
    exit;
}

// 页面样式
echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordPress 系统状态</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #3498db; margin-top: 20px; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; }
        .warning { background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; }
        .info { background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>WordPress 系统状态</h1>';

// WordPress 基本信息
echo '<h2>WordPress 信息</h2>';
echo '<table>
    <tr><th>参数</th><th>值</th></tr>
    <tr><td>WordPress 版本</td><td>' . get_bloginfo('version') . '</td></tr>
    <tr><td>PHP 版本</td><td>' . phpversion() . '</td></tr>
    <tr><td>MySQL 版本</td><td>' . $wpdb->db_version() . '</td></tr>
    <tr><td>站点 URL</td><td>' . get_bloginfo('url') . '</td></tr>
    <tr><td>管理员 URL</td><td>' . admin_url() . '</td></tr>
    <tr><td>当前主题</td><td>' . wp_get_theme()->get('Name') . ' (' . wp_get_theme()->get('Version') . ')</td></tr>
    <tr><td>调试模式</td><td>' . (defined('WP_DEBUG') && WP_DEBUG ? '<span class="warning">启用</span>' : '<span class="success">禁用</span>') . '</td></tr>
    <tr><td>多站点模式</td><td>' . (is_multisite() ? '<span class="info">启用</span>' : '<span class="success">禁用</span>') . '</td></tr>
</table>';

// 数据库连接测试
echo '<h2>数据库连接</h2>';
if ($wpdb->check_connection()) {
    echo '<div class="success">数据库连接正常</div>';
} else {
    echo '<div class="error">数据库连接失败: ' . $wpdb->last_error . '</div>';
}

// 插件信息
echo '<h2>已安装插件</h2>';
echo '<table>
    <tr><th>插件名称</th><th>版本</th><th>状态</th></tr>';

$all_plugins = get_plugins();
foreach ($all_plugins as $plugin_path => $plugin_data) {
    $is_active = is_plugin_active($plugin_path) ? '<span class="success">激活</span>' : '<span class="warning">未激活</span>';
    echo '<tr>
        <td>' . esc_html($plugin_data['Name']) . '</td>
        <td>' . esc_html($plugin_data['Version']) . '</td>
        <td>' . $is_active . '</td>
    </tr>';
}
echo '</table>';

// 用户信息
if (current_user_can('administrator')) {
    echo '<h2>用户统计</h2>';
    
    // 获取用户统计
    $users_count = count_users();
    
    echo '<table>
        <tr><th>用户角色</th><th>数量</th></tr>';
    
    foreach ($users_count['avail_roles'] as $role => $count) {
        echo '<tr>
            <td>' . ucfirst($role) . '</td>
            <td>' . $count . '</td>
        </tr>';
    }
    
    echo '<tr><td><strong>总计</strong></td><td><strong>' . $users_count['total_users'] . '</strong></td></tr>';
    echo '</table>';
}

// 服务器信息
echo '<h2>服务器信息</h2>';
echo '<table>
    <tr><th>参数</th><th>值</th></tr>
    <tr><td>操作系统</td><td>' . PHP_OS . '</td></tr>
    <tr><td>服务器软件</td><td>' . $_SERVER['SERVER_SOFTWARE'] . '</td></tr>
    <tr><td>服务器 IP</td><td>' . $_SERVER['SERVER_ADDR'] . '</td></tr>
    <tr><td>服务器主机名</td><td>' . gethostname() . '</td></tr>
    <tr><td>PHP SAPI</td><td>' . php_sapi_name() . '</td></tr>
    <tr><td>PHP 内存限制</td><td>' . ini_get('memory_limit') . '</td></tr>
    <tr><td>最大执行时间</td><td>' . ini_get('max_execution_time') . ' 秒</td></tr>
    <tr><td>上传文件大小限制</td><td>' . ini_get('upload_max_filesize') . '</td></tr>
    <tr><td>POST 数据大小限制</td><td>' . ini_get('post_max_size') . '</td></tr>
</table>';

// 结束页面
echo '</body>
</html>'; 