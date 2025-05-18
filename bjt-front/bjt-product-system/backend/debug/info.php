<?php
// 设置安全访问令牌
$access_token = 'bjt-debug-2025';

// 检查访问权限
if (!isset($_GET['token']) || $_GET['token'] !== $access_token) {
    header('HTTP/1.1 403 Forbidden');
    echo '<h1>403 Forbidden</h1>';
    echo '<p>Access denied. Please provide a valid token.</p>';
    exit;
}

// 显示 PHP 和服务器信息
phpinfo(); 