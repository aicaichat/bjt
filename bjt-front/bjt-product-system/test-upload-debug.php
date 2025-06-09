<?php
/**
 * BJT文件上传调试测试脚本
 * 
 * 用于快速诊断线上环境的文件上传问题
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>BJT文件上传调试测试</h2>\n";
echo "<pre>\n";

// 1. 基础环境检查
echo "=== 基础环境检查 ===\n";
echo "PHP版本: " . PHP_VERSION . "\n";
echo "上传最大文件大小: " . ini_get('upload_max_filesize') . "\n";
echo "POST最大大小: " . ini_get('post_max_size') . "\n";
echo "最大执行时间: " . ini_get('max_execution_time') . "秒\n";
echo "内存限制: " . ini_get('memory_limit') . "\n";
echo "临时目录: " . sys_get_temp_dir() . "\n";
echo "临时目录可写: " . (is_writable(sys_get_temp_dir()) ? '是' : '否') . "\n";

// 2. WordPress环境检查
if (file_exists('wp-config.php')) {
    require_once 'wp-config.php';
    echo "\nWordPress根目录: " . ABSPATH . "\n";
    
    if (defined('WP_CONTENT_DIR')) {
        echo "WP_CONTENT_DIR: " . WP_CONTENT_DIR . "\n";
    }
    
    if (defined('WP_MEMORY_LIMIT')) {
        echo "WP_MEMORY_LIMIT: " . WP_MEMORY_LIMIT . "\n";
    }
} else {
    echo "\n警告: 未找到wp-config.php，可能不在WordPress根目录\n";
}

// 3. 目录权限检查
echo "\n=== 目录权限检查 ===\n";

$directories_to_check = [
    'frontend/public/uploads',
    'frontend/public/uploads/machines',
    'frontend/public/uploads/machines/pdfs',
    'frontend/public/uploads/machines/images',
];

foreach ($directories_to_check as $dir) {
    if (file_exists($dir)) {
        $perms = fileperms($dir);
        $perms_octal = sprintf('%o', $perms);
        echo "$dir: 存在, 权限=" . substr($perms_octal, -3) . ", 可写=" . (is_writable($dir) ? '是' : '否') . "\n";
        
        // 检查所有者和组
        if (function_exists('posix_getpwuid') && function_exists('posix_getgrgid')) {
            $owner = posix_getpwuid(fileowner($dir));
            $group = posix_getgrgid(filegroup($dir));
            echo "  所有者: " . $owner['name'] . ", 组: " . $group['name'] . "\n";
        }
    } else {
        echo "$dir: 不存在\n";
        
        // 尝试创建目录
        if (mkdir($dir, 0755, true)) {
            echo "  -> 已创建，权限=755\n";
        } else {
            echo "  -> 创建失败\n";
        }
    }
}

// 4. 磁盘空间检查
echo "\n=== 磁盘空间检查 ===\n";
$upload_dir = 'frontend/public/uploads';
if (file_exists($upload_dir)) {
    $total_space = disk_total_space($upload_dir);
    $free_space = disk_free_space($upload_dir);
    
    if ($total_space !== false && $free_space !== false) {
        echo "总空间: " . number_format($total_space / 1024 / 1024 / 1024, 2) . " GB\n";
        echo "可用空间: " . number_format($free_space / 1024 / 1024 / 1024, 2) . " GB\n";
        echo "使用率: " . number_format(($total_space - $free_space) / $total_space * 100, 2) . "%\n";
    } else {
        echo "无法获取磁盘空间信息\n";
    }
}

// 5. 文件上传测试
echo "\n=== 文件上传测试 ===\n";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['test_file'])) {
    $file = $_FILES['test_file'];
    
    echo "收到文件上传请求:\n";
    echo "文件名: " . $file['name'] . "\n";
    echo "类型: " . $file['type'] . "\n";
    echo "大小: " . $file['size'] . " 字节\n";
    echo "临时文件: " . $file['tmp_name'] . "\n";
    echo "错误码: " . $file['error'] . "\n";
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        $target_dir = 'frontend/public/uploads/test';
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0755, true);
        }
        
        $target_file = $target_dir . '/test_' . time() . '_' . basename($file['name']);
        
        echo "目标文件: $target_file\n";
        echo "目标目录可写: " . (is_writable($target_dir) ? '是' : '否') . "\n";
        echo "临时文件存在: " . (file_exists($file['tmp_name']) ? '是' : '否') . "\n";
        
        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            echo "文件上传成功!\n";
            echo "最终文件大小: " . filesize($target_file) . " 字节\n";
            echo "文件权限: " . substr(sprintf('%o', fileperms($target_file)), -3) . "\n";
            
            // 清理测试文件
            unlink($target_file);
            echo "测试文件已清理\n";
        } else {
            echo "文件上传失败!\n";
            $last_error = error_get_last();
            if ($last_error) {
                echo "最后错误: " . $last_error['message'] . "\n";
            }
        }
    } else {
        $error_messages = [
            UPLOAD_ERR_INI_SIZE => 'File size exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File size exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];
        
        echo "上传错误: " . ($error_messages[$file['error']] ?? '未知错误') . "\n";
    }
} else {
    echo "要测试文件上传，请提交一个文件:\n";
    echo <<<HTML
<form method="post" enctype="multipart/form-data">
    <input type="file" name="test_file" accept=".pdf,.jpg,.png">
    <input type="submit" value="测试上传">
</form>
HTML;
}

// 6. API端点检查
echo "\n=== API端点检查 ===\n";

$api_endpoints = [
    '/wp-json/bjt/v1/upload/file',
    '/wp-json/bjt/v1/upload/image',
    '/wp-json/bjt/v1/upload/specification',
];

foreach ($api_endpoints as $endpoint) {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . $endpoint;
    echo "检查端点: $url\n";
    
    // 简单的端点存在性检查（GET请求）
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 5,
            'ignore_errors' => true,
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    if ($response !== false) {
        $http_response_header = $http_response_header ?? [];
        $status_line = $http_response_header[0] ?? 'Unknown';
        echo "  响应: $status_line\n";
    } else {
        echo "  无法访问\n";
    }
}

echo "\n=== 调试测试完成 ===\n";
echo "</pre>\n";
?> 