<?php
/**
 * BJT REST API 直接诊断工具
 * 不依赖WordPress钩子系统的REST API诊断脚本
 */

// 显示所有错误
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>BJT REST API 诊断工具</h1>";

// 检查服务器基本信息
echo "<h2>1. 服务器信息</h2>";
echo "<p>PHP版本: " . phpversion() . "</p>";
echo "<p>服务器软件: " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p>请求方法: " . $_SERVER['REQUEST_METHOD'] . "</p>";
echo "<p>请求URI: " . $_SERVER['REQUEST_URI'] . "</p>";

// 获取HTTP头信息
echo "<h2>2. 当前请求头信息</h2>";
echo "<pre>";
$headers = getallheaders();
foreach ($headers as $name => $value) {
    echo "$name: $value\n";
}
echo "</pre>";

// 检查WordPress的配置
echo "<h2>3. WordPress配置检查</h2>";

// 尝试加载WordPress配置但不初始化
if (file_exists('../wp-config.php')) {
    echo "<p style='color:green'>✓ wp-config.php 文件存在</p>";
    
    // 提取一些关键配置（不实际加载WordPress）
    $config = file_get_contents('../wp-config.php');
    
    // 检查数据库配置
    if (preg_match('/define.*DB_NAME.*,\s*[\'"](.+?)[\'"]\s*\)/', $config, $matches)) {
        echo "<p>数据库名: " . $matches[1] . "</p>";
    }
    
    // 检查表前缀
    if (preg_match('/\$table_prefix\s*=\s*[\'"](.+?)[\'"]\s*;/', $config, $matches)) {
        echo "<p>表前缀: " . $matches[1] . "</p>";
    }
    
    // 检查调试模式
    if (preg_match('/define.*WP_DEBUG.*,\s*(true|false)/', $config, $matches)) {
        echo "<p>调试模式: " . $matches[1] . "</p>";
    }
    
    // 检查内存限制
    if (preg_match('/define.*WP_MEMORY_LIMIT.*,\s*[\'"](.+?)[\'"]\s*\)/', $config, $matches)) {
        echo "<p>内存限制: " . $matches[1] . "</p>";
    }
} else {
    echo "<p style='color:red'>✗ wp-config.php 文件不存在或无法访问</p>";
}

// 直接检查REST API URL
echo "<h2>4. REST API URL 测试</h2>";

$rest_url = 'http://localhost:8080/wp-json/';
echo "<p>测试REST API基础URL: $rest_url</p>";

// 使用PHP内置cURL检查REST API响应
$ch = curl_init($rest_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// 添加Accept头
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Accept: application/json',
));

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "<p>状态码: $status_code</p>";
echo "<h3>响应头:</h3>";
echo "<pre>" . htmlspecialchars($header) . "</pre>";
echo "<h3>响应体 (前500字符):</h3>";
echo "<pre>" . htmlspecialchars(substr($body, 0, 500)) . "...</pre>";

curl_close($ch);

// 测试我们的API测试端点
echo "<h2>5. 自定义API端点测试</h2>";

$test_url = 'http://localhost:8080/wp-json/bjt-test/v1/test';
echo "<p>测试自定义API端点: $test_url</p>";

$ch = curl_init($test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// 添加Accept头
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Accept: application/json',
));

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "<p>状态码: $status_code</p>";
echo "<h3>响应头:</h3>";
echo "<pre>" . htmlspecialchars($header) . "</pre>";
echo "<h3>响应体:</h3>";
echo "<pre>" . htmlspecialchars($body) . "</pre>";

curl_close($ch);

// 检查服务器配置
echo "<h2>6. Nginx/Web服务器配置检查</h2>";

// 检查.htaccess是否存在（Apache）
if (file_exists('../.htaccess')) {
    echo "<p>发现.htaccess文件，这表明可能使用的是Apache服务器</p>";
    echo "<p>.htaccess内容:</p>";
    echo "<pre>" . htmlspecialchars(file_get_contents('../.htaccess')) . "</pre>";
} else {
    echo "<p>未找到.htaccess文件，可能使用的是Nginx或其他服务器</p>";
}

// 尝试检测Nginx配置
if (strpos($_SERVER['SERVER_SOFTWARE'], 'nginx') !== false) {
    echo "<p>检测到Nginx服务器</p>";
    echo "<p>注意：Nginx配置应检查以下文件中是否有REST API相关的重写规则:</p>";
    echo "<ul>
        <li>/etc/nginx/nginx.conf</li>
        <li>/etc/nginx/sites-available/default (或您的站点配置)</li>
    </ul>";
    echo "<p>特别注意location块中与/wp-json/相关的配置</p>";
}

// 建议解决方案
echo "<h2>7. 可能的解决方案</h2>";
echo "<ol>
    <li>检查Nginx配置文件，确保正确处理/wp-json/请求路径</li>
    <li>在Nginx配置中添加以下规则:
<pre>
location /wp-json/ {
    # 确保此处理适用于REST API请求
    try_files \$uri \$uri/ /index.php?\$args;
    
    # 添加正确的内容类型头
    add_header Content-Type 'application/json; charset=utf-8' always;
}
</pre>
    </li>
    <li>确保WordPress的固定链接设置正确（访问wp-admin -> 设置 -> 固定链接）</li>
    <li>尝试修复wp-config.php中的潜在问题:
<pre>
# 添加以下行到wp-config.php
define('WP_HOME', 'http://localhost:8080');
define('WP_SITEURL', 'http://localhost:8080');
</pre>
    </li>
    <li>检查是否有其他插件正在干扰REST API</li>
</ol>";

echo "<h2>8. JSON数据测试</h2>";
echo "<p>生成一个简单的JSON响应:</p>";

// 设置正确的内容类型头
header('Content-Type: application/json');

// 生成测试JSON数据
$json_data = array(
    'success' => true,
    'message' => '这是一个JSON测试响应',
    'data' => array(
        'time' => date('Y-m-d H:i:s'),
        'server' => $_SERVER['SERVER_SOFTWARE'],
        'php_version' => phpversion()
    )
);

// 输出JSON（注释掉，以避免干扰HTML输出）
// echo json_encode($json_data, JSON_PRETTY_PRINT);
echo "<pre>" . json_encode($json_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>"; 