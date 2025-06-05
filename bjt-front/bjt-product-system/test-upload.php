<?php
/**
 * 简单的PDF上传测试脚本
 */

// 模拟WordPress环境
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// 测试配置
$test_data = [
    'action' => 'bjt_upload_specification',
    'host_id' => '1',
    'upload_dir' => 'frontend/public/uploads'
];

// 测试JWT token（简单的base64编码模拟）
$test_payload = [
    'iss' => 'http://localhost',
    'iat' => time(),
    'exp' => time() + 3600,
    'data' => [
        'user_id' => 1,
        'username' => 'test',
        'role' => 'admin'
    ]
];

// 创建模拟token
$test_token = base64_encode(json_encode($test_payload));

echo "=== PDF上传功能测试 ===\n";
echo "测试数据: " . json_encode($test_data, JSON_PRETTY_PRINT) . "\n";
echo "测试Token: " . substr($test_token, 0, 50) . "...\n";

// 检查目录结构
$upload_base = __DIR__ . '/frontend/public/uploads';
$specifications_dir = $upload_base . '/specifications';
$host_dir = $specifications_dir . '/1';

echo "\n=== 目录检查 ===\n";
echo "上传基础目录: " . $upload_base . " - " . (is_dir($upload_base) ? "存在" : "不存在") . "\n";
echo "规格说明书目录: " . $specifications_dir . " - " . (is_dir($specifications_dir) ? "存在" : "不存在") . "\n";
echo "主机1目录: " . $host_dir . " - " . (is_dir($host_dir) ? "存在" : "不存在") . "\n";

// 创建目录
if (!is_dir($upload_base)) {
    if (mkdir($upload_base, 0755, true)) {
        echo "创建上传基础目录: 成功\n";
    } else {
        echo "创建上传基础目录: 失败\n";
    }
}

if (!is_dir($specifications_dir)) {
    if (mkdir($specifications_dir, 0755, true)) {
        echo "创建规格说明书目录: 成功\n";
    } else {
        echo "创建规格说明书目录: 失败\n";
    }
}

if (!is_dir($host_dir)) {
    if (mkdir($host_dir, 0755, true)) {
        echo "创建主机1目录: 成功\n";
    } else {
        echo "创建主机1目录: 失败\n";
    }
}

echo "\n=== 权限检查 ===\n";
echo "上传基础目录权限: " . substr(sprintf('%o', fileperms($upload_base)), -4) . "\n";
echo "规格说明书目录权限: " . substr(sprintf('%o', fileperms($specifications_dir)), -4) . "\n";
echo "主机1目录权限: " . substr(sprintf('%o', fileperms($host_dir)), -4) . "\n";

echo "\n=== 测试完成 ===\n";
echo "现在可以通过前端页面测试PDF上传功能\n";
echo "访问: http://localhost:5173/admin/machines\n";
echo "在'PDF上传测试'区域选择一个PDF文件进行上传\n";
?> 