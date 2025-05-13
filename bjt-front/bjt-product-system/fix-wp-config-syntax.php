<?php
/**
 * 修复WordPress配置文件中的语法错误
 * 运行方式: docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress php /var/www/html/fix-wp-config-syntax.php
 */

// 定义Constants
define('ABSPATH', '/var/www/html/');

// 读取原始wp-config.php文件
$config_file = ABSPATH . 'wp-config.php';
$config_content = file_get_contents($config_file);

// 修复require_once前面多出的反斜杠
$fixed_content = str_replace('\\require_once', 'require_once', $config_content);

// 备份原始文件
$backup_file = ABSPATH . 'wp-config.php.bak.' . time();
file_put_contents($backup_file, $config_content);
echo "已创建备份文件: " . $backup_file . "\n";

// 写入修复后的内容
if (file_put_contents($config_file, $fixed_content)) {
    echo "已成功修复wp-config.php文件中的语法错误\n";
} else {
    echo "修复wp-config.php文件失败\n";
}

// 添加访问权限
chmod($config_file, 0644);
echo "已设置适当的权限\n";

echo "完成!\n"; 