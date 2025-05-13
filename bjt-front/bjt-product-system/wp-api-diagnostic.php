<?php
/**
 * WordPress REST API 诊断工具
 * 
 * 此脚本加载WordPress核心，但不运行完整的WordPress
 * 专门用于诊断REST API问题
 */

// 定义一个常量让WordPress知道我们不想运行完整的WordPress
define('SHORTINIT', true);

// 指定WordPress的根目录路径
$wordpress_path = realpath(__DIR__ . '/..');

// 加载WordPress配置
require_once($wordpress_path . '/wp-config.php');

// 设置内容类型为HTML，因为这是一个诊断页面
header('Content-Type: text/html; charset=utf-8');

echo "<h1>WordPress REST API 核心诊断</h1>";

// 导入必要的WordPress功能
require_once(ABSPATH . WPINC . '/load.php');
require_once(ABSPATH . WPINC . '/functions.php');
require_once(ABSPATH . WPINC . '/plugin.php');
require_once(ABSPATH . WPINC . '/l10n.php');
require_once(ABSPATH . WPINC . '/class-wp-error.php');

// 尝试加载REST API相关文件
try {
    require_once(ABSPATH . WPINC . '/rest-api.php');
    echo "<p style='color:green'>✓ REST API 核心文件已成功加载</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>✗ 无法加载REST API核心文件: " . $e->getMessage() . "</p>";
}

// 连接到数据库
try {
    $wpdb->db_connect();
    echo "<p style='color:green'>✓ 数据库连接成功</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>✗ 数据库连接失败: " . $e->getMessage() . "</p>";
}

// 检查WordPress版本
echo "<h2>WordPress环境</h2>";
echo "<p>WordPress版本: " . (defined('$wp_version') ? $wp_version : '未知') . "</p>";
echo "<p>PHP版本: " . phpversion() . "</p>";
echo "<p>数据库版本: " . (method_exists($wpdb, 'db_version') ? $wpdb->db_version() : '未知') . "</p>";
echo "<p>站点URL: " . (defined('WP_SITEURL') ? WP_SITEURL : '未定义') . "</p>";
echo "<p>主页URL: " . (defined('WP_HOME') ? WP_HOME : '未定义') . "</p>";

// 检查REST API重写规则是否正确设置
echo "<h2>REST API 路由检查</h2>";

// 获取REST URL的基本路径
$rest_url_base = rest_get_url_prefix();
echo "<p>REST API URL前缀: " . $rest_url_base . "</p>";

// 检查REST API相关的选项
echo "<h2>REST API 设置</h2>";
$rest_enabled = get_option('permalink_structure') ? true : false;
echo "<p>固定链接结构: " . ($rest_enabled ? get_option('permalink_structure') : '默认') . "</p>";
echo "<p>REST API 是否启用: " . ($rest_enabled ? '是' : '否 (需要启用固定链接)') . "</p>";

// 检查数据库表
echo "<h2>数据库表检查</h2>";
$tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}%'", ARRAY_N);
if ($tables) {
    echo "<p>找到 " . count($tables) . " 个WordPress表:</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>" . $table[0] . "</li>";
    }
    echo "</ul>";
    
    // 检查BJT相关表
    $bjt_tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}bjt_%'", ARRAY_N);
    if ($bjt_tables) {
        echo "<p style='color:green'>✓ 找到 " . count($bjt_tables) . " 个BJT相关表</p>";
        echo "<ul>";
        foreach ($bjt_tables as $table) {
            echo "<li>" . $table[0] . "</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:red'>✗ 未找到BJT相关表，可能需要初始化产品数据库</p>";
    }
} else {
    echo "<p style='color:red'>✗ 未找到任何WordPress表，数据库可能有问题</p>";
}

// 检查插件
echo "<h2>关键插件检查</h2>";
$active_plugins = get_option('active_plugins');
if ($active_plugins) {
    echo "<p>激活的插件:</p>";
    echo "<ul>";
    foreach ($active_plugins as $plugin) {
        echo "<li>" . $plugin . "</li>";
    }
    echo "</ul>";
    
    // 检查是否有BJT插件
    $has_bjt_plugin = false;
    foreach ($active_plugins as $plugin) {
        if (strpos($plugin, 'bjt') !== false) {
            $has_bjt_plugin = true;
            echo "<p style='color:green'>✓ 找到BJT相关插件: " . $plugin . "</p>";
        }
    }
    if (!$has_bjt_plugin) {
        echo "<p style='color:red'>✗ 未检测到BJT相关插件，请确保BJT产品管理系统插件已激活</p>";
    }
} else {
    echo "<p>没有激活的插件</p>";
}

// 检查主题
echo "<h2>主题检查</h2>";
$current_theme = wp_get_theme();
echo "<p>当前主题: " . $current_theme->get('Name') . " (版本 " . $current_theme->get('Version') . ")</p>";

// 检查是否有BJT主题
if (strpos(strtolower($current_theme->get('Name')), 'bjt') !== false) {
    echo "<p>当前正在使用BJT主题，这可能会影响REST API的正常工作</p>";
    echo "<p>建议临时切换到默认主题进行测试</p>";
}

// 尝试从数据库中提取REST API相关的路由信息
echo "<h2>REST API 路由信息</h2>";
$rest_routes_option = get_option('rest_route_options');
if ($rest_routes_option) {
    echo "<p>REST API路由选项已存在</p>";
} else {
    echo "<p>未找到REST API路由选项，这可能是正常的或表示REST API未正确初始化</p>";
}

// 检查.htaccess文件（如果存在）
if (file_exists($wordpress_path . '/.htaccess')) {
    echo "<h2>htaccess文件</h2>";
    echo "<pre>" . htmlspecialchars(file_get_contents($wordpress_path . '/.htaccess')) . "</pre>";
}

// 显示nginx配置文件中应该添加的内容
echo "<h2>Nginx配置建议</h2>";
echo "<p>确保您的Nginx配置包含以下内容:</p>";
echo "<pre>
# WordPress REST API支持
location /wp-json/ {
    try_files \$uri \$uri/ /index.php?\$args;
    
    # 设置正确的内容类型
    add_header Content-Type 'application/json; charset=utf-8';
    
    # 允许CORS
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
    add_header 'Access-Control-Allow-Credentials' 'true';
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
    
    # 处理OPTIONS请求
    if (\$request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
</pre>";

// WordPress wp-config.php修复建议
echo "<h2>wp-config.php修复建议</h2>";
echo "<p>在wp-config.php中添加以下内容:</p>";
echo "<pre>
/**
 * REST API相关修复
 */
// 强制使用特定URL
define('WP_HOME', 'http://localhost:8080');
define('WP_SITEURL', 'http://localhost:8080');

// 修复REST API
define('REST_API_FIX', true);
</pre>";

// 集成BJT API文档信息
echo "<h2>BJT API 端点测试</h2>";
echo "<p>根据BJT API文档，以下是主要的API端点:</p>";
echo "<ul>
    <li>/wp-json/bjt/v1/auth/login - 用户登录</li>
    <li>/wp-json/bjt/v1/auth/me - 获取当前用户信息</li>
    <li>/wp-json/bjt/v1/machines - 获取设备列表</li>
    <li>/wp-json/bjt/v1/accessories - 获取配件列表</li>
</ul>";

// 运行测试调用
echo "<p>让我们测试一下BJT API测试端点:</p>";
$test_url = 'http://localhost:8080/wp-json/bjt-test/v1/test';
$ch = curl_init($test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json'));
$response = curl_exec($ch);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p>测试URL: " . $test_url . "</p>";
echo "<p>状态码: " . $status_code . "</p>";
echo "<p>响应内容:</p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// 提供专门针对MySQL初始化问题的建议
echo "<h2>MySQL初始化建议</h2>";
echo "<p>如果数据库表检查显示没有BJT相关表，请确保已运行初始化SQL脚本:</p>";
echo "<pre>
# 进入MySQL容器
docker-compose -f docker/dev/docker-compose.nginx.yml exec mysql bash

# 连接到MySQL
mysql -u root -p

# 在MySQL中运行以下命令查看数据库
SHOW DATABASES;

# 如果bjt_product数据库存在，切换到该数据库
USE bjt_product;

# 检查表是否存在
SHOW TABLES;

# 如果表不存在，需要手动运行初始化SQL脚本
EXIT;

# 手动导入初始化SQL脚本
mysql -u root -p bjt_product < /docker-entrypoint-initdb.d/init.sql
</pre>"; 