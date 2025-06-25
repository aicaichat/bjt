<?php
// 加载WordPress环境
require_once __DIR__ . '/wp-load.php';

echo "=== 密码哈希兼容性测试 ===\n\n";

$test_password = 'testpassword123';

// 测试WordPress密码哈希
$wp_hash = wp_hash_password($test_password);
echo "WordPress wp_hash_password(): " . $wp_hash . "\n";

// 测试PHP密码哈希
$php_hash = password_hash($test_password, PASSWORD_DEFAULT);
echo "PHP password_hash(): " . $php_hash . "\n\n";

// 测试交叉验证
echo "=== 交叉验证测试 ===\n";
echo "wp_hash + password_verify(): " . (password_verify($test_password, $wp_hash) ? 'TRUE' : 'FALSE') . "\n";
echo "php_hash + wp_check_password(): " . (wp_check_password($test_password, $php_hash) ? 'TRUE' : 'FALSE') . "\n";
echo "wp_hash + wp_check_password(): " . (wp_check_password($test_password, $wp_hash) ? 'TRUE' : 'FALSE') . "\n";
echo "php_hash + password_verify(): " . (password_verify($test_password, $php_hash) ? 'TRUE' : 'FALSE') . "\n\n";

// 检查数据库中实际用户的密码哈希
global $wpdb;
$table_name = $wpdb->prefix . 'bjt_users';
$users = $wpdb->get_results("SELECT id, username, password FROM {$table_name} LIMIT 3", ARRAY_A);

echo "=== 数据库中的密码哈希格式 ===\n";
foreach ($users as $user) {
    echo "用户: {$user['username']} (ID: {$user['id']})\n";
    echo "密码哈希: " . substr($user['password'], 0, 30) . "...\n";
    
    // 检查哈希格式
    if (strpos($user['password'], '$2y$') === 0) {
        echo "格式: PHP password_hash (bcrypt)\n";
    } elseif (strpos($user['password'], '$P$') === 0) {
        echo "格式: WordPress PHPass\n";
    } else {
        echo "格式: 未知\n";
    }
    echo "\n";
}
?> 