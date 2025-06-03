<?php
// 测试密码哈希脚本

// 测试密码
$password = 'password123';

// 数据库中存储的哈希值（来自 test_users.sql）
$stored_hash = '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC';

// 验证密码
if (password_verify($password, $stored_hash)) {
    echo "密码验证成功！\n";
    echo "存储的哈希值是正确的。\n";
} else {
    echo "密码验证失败！\n";
    echo "需要重新生成密码哈希。\n";
}

// 生成新的密码哈希
$new_hash = password_hash($password, PASSWORD_DEFAULT);
echo "\n新的密码哈希值：\n";
echo $new_hash . "\n";

// 验证新哈希
if (password_verify($password, $new_hash)) {
    echo "\n新哈希验证成功！\n";
}

// 生成 SQL 更新语句
echo "\n如果需要更新数据库中的密码，可以使用以下 SQL：\n";
echo "UPDATE wp_bjt_users SET password = '$new_hash' WHERE username = 'admin';\n";
?> 