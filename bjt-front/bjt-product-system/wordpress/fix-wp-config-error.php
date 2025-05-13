<?php
/**
 * 修复WordPress配置文件中的错误
 * 运行方式: docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress php /var/www/html/fix-wp-config-error.php
 */

// 定义Constants
define('ABSPATH', '/var/www/html/');

// 读取原始wp-config.php文件
$config_file = ABSPATH . 'wp-config.php';
$config_content = file_get_contents($config_file);

// 检查是否存在语法错误 - 例如nrequire_once() 应该是 require_once()
$fixed_content = str_replace('nrequire_once', 'require_once', $config_content);

// 备份原始文件
$backup_file = ABSPATH . 'wp-config.php.bak.' . time();
file_put_contents($backup_file, $config_content);
echo "已创建备份文件: " . $backup_file . "\n";

// 写入修复后的内容
if (file_put_contents($config_file, $fixed_content)) {
    echo "已成功修复wp-config.php文件\n";
} else {
    echo "修复wp-config.php文件失败\n";
}

// 添加访问权限
chmod($config_file, 0644);
echo "已设置适当的权限\n";

echo "完成!\n"; 