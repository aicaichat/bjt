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
echo "<pre>" . json_encode($json_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>"; <?php
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
</pre>"; <?php
/**
 * BJT REST API 一键修复工具
 * 
 * 此脚本会自动检测并修复REST API相关的各种问题
 */

// 显示所有错误
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 设置内容类型为HTML
header('Content-Type: text/html; charset=utf-8');

echo "<h1>BJT REST API 一键修复工具</h1>";

// WordPress路径
$wp_dir = dirname(__DIR__);

// 检查是否在WordPress环境中
if (!file_exists($wp_dir . '/wp-config.php')) {
    die('<p style="color:red">错误: 找不到WordPress安装，请将此脚本放在WordPress根目录的子目录中。</p>');
}

// 检查是否有写入权限
if (!is_writable($wp_dir . '/wp-content')) {
    die('<p style="color:red">错误: 没有足够的写入权限来修复问题，请确保web服务器对WordPress目录有写入权限。</p>');
}

// 显示修复操作说明
echo '<p><strong>此工具将自动检测并尝试修复以下问题:</strong></p>';
echo '<ol>
    <li>REST API重定向问题</li>
    <li>REST API内容类型问题</li>
    <li>.htaccess或Nginx配置问题</li>
    <li>wp-config.php配置问题</li>
    <li>插件冲突问题</li>
    <li>主题冲突问题</li>
    <li>数据库表问题 (只检查不修复)</li>
</ol>';

// 显示修复表单
echo '<form method="post" action="">';
echo '<input type="hidden" name="fix_it" value="yes">';
echo '<p><button type="submit" style="padding: 10px; background-color: #0073aa; color: white; border: none; border-radius: 3px; cursor: pointer;">开始修复</button></p>';
echo '</form>';

// 如果提交了修复请求
if (isset($_POST['fix_it']) && $_POST['fix_it'] === 'yes') {
    echo '<h2>正在进行修复...</h2>';
    
    // 创建修复日志
    $log_file = __DIR__ . '/rest-api-fix-log-' . date('Y-m-d-H-i-s') . '.txt';
    $log = fopen($log_file, 'w');
    fwrite($log, "BJT REST API 修复日志 - " . date('Y-m-d H:i:s') . "\n\n");
    
    try {
        // 1. 修复 mu-plugins 目录
        echo '<h3>1. 检查并创建 mu-plugins 目录</h3>';
        $mu_plugins_dir = $wp_dir . '/wp-content/mu-plugins';
        if (!file_exists($mu_plugins_dir)) {
            mkdir($mu_plugins_dir, 0755, true);
            echo '<p style="color:green">✓ 已创建 mu-plugins 目录</p>';
            fwrite($log, "创建了 mu-plugins 目录\n");
        } else {
            echo '<p>mu-plugins 目录已存在</p>';
        }
        
        // 2. 创建REST API修复插件
        echo '<h3>2. 安装REST API修复插件</h3>';
        $rest_fix_file = $mu_plugins_dir . '/bjt-rest-api-fix.php';
        $rest_fix_content = <<<'EOT'
<?php
/**
 * Plugin Name: BJT REST API Fix
 * Description: 修复WordPress REST API问题，确保正确返回JSON响应
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT REST API修复类
 */
class BJT_REST_API_Fix {
    // 实例
    private static $instance = null;
    
    /**
     * 获取单例实例
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 构造函数
     */
    private function __construct() {
        // 非常早期就开始监听
        add_action('muplugins_loaded', array($this, 'early_init'), 0);
        
        // 标准初始化
        add_action('plugins_loaded', array($this, 'init'), 0);
        
        // 开启调试日志
        add_action('rest_api_init', array($this, 'log_rest_request'), 0);
        
        // 确保不会重定向REST请求
        remove_filter('template_redirect', 'redirect_canonical');
        
        // 在发送头之前检查请求
        add_action('send_headers', array($this, 'check_rest_request'), 0);
        
        // 立即检查当前请求
        $this->check_rest_request();
    }
    
    /**
     * 早期初始化
     */
    public function early_init() {
        // 先做最基本的REST路径检测
        if ($this->is_rest_request()) {
            // 移除重定向动作
            remove_all_actions('template_redirect');
            // 移除输出缓冲
            while (ob_get_level()) {
                ob_end_clean();
            }
        }
    }
    
    /**
     * 主要初始化
     */
    public function init() {
        // 必要的钩子
        add_action('rest_api_init', array($this, 'rest_api_init_handler'), 0);
        add_filter('rest_pre_serve_request', array($this, 'rest_ensure_proper_headers'), 10, 4);
    }
    
    /**
     * 检查是否是REST请求
     */
    private function is_rest_request() {
        // 检查请求URI
        $rest_prefix = 'wp-json';
        if (isset($_SERVER['REQUEST_URI'])) {
            return strpos($_SERVER['REQUEST_URI'], '/' . $rest_prefix . '/') !== false;
        }
        return false;
    }
    
    /**
     * 检查并处理REST请求
     */
    public function check_rest_request() {
        if ($this->is_rest_request()) {
            // 定义REST常量（如果未定义）
            if (!defined('REST_REQUEST')) {
                define('REST_REQUEST', true);
            }
            
            // 添加CORS头
            $this->add_cors_headers();
            
            // 无头显示模式
            if (!isset($_GET['_headless'])) {
                $_GET['_headless'] = 1;
            }
        }
    }
    
    /**
     * REST API初始化处理程序
     */
    public function rest_api_init_handler() {
        // 确保是JSON类型
        header('Content-Type: application/json; charset=utf-8');
        
        // 移除任何可能的输出
        if (ob_get_level() > 0) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
        }
        
        // 添加测试路由
        register_rest_route('bjt-diag/v1', '/test', array(
            'methods' => 'GET',
            'callback' => function() {
                return array(
                    'success' => true,
                    'message' => 'REST API现在正常工作！',
                    'time' => current_time('mysql'),
                    'request' => $_SERVER['REQUEST_URI'],
                    'headers' => getallheaders()
                );
            },
            'permission_callback' => '__return_true'
        ));
    }
    
    /**
     * 记录REST请求信息（用于调试）
     */
    public function log_rest_request() {
        $log_file = WP_CONTENT_DIR . '/rest-api-debug.log';
        $data = array(
            'time' => current_time('mysql'),
            'uri' => $_SERVER['REQUEST_URI'],
            'method' => $_SERVER['REQUEST_METHOD'],
            'headers' => getallheaders()
        );
        
        @file_put_contents($log_file, json_encode($data, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
    }
    
    /**
     * 确保REST响应有正确的头信息
     */
    public function rest_ensure_proper_headers($served, $result, $request, $server) {
        // 设置内容类型
        $server->send_header('Content-Type', 'application/json; charset=utf-8');
        
        // 添加CORS头
        $this->add_cors_headers();
        
        return $served;
    }
    
    /**
     * 添加CORS头信息
     */
    public function add_cors_headers() {
        // 如果头信息已发送，则无法添加
        if (headers_sent()) {
            return;
        }
        
        // 设置CORS头
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        
        // 处理OPTIONS请求
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('HTTP/1.1 200 OK');
            exit;
        }
    }
}

// 初始化单例
BJT_REST_API_Fix::get_instance();

// 添加一个简单的REST测试路由
add_action('rest_api_init', function() {
    register_rest_route('bjt-health/v1', '/check', array(
        'methods' => 'GET',
        'callback' => function() {
            return array(
                'status' => 'ok',
                'message' => 'REST API健康检查成功',
                'time' => current_time('mysql')
            );
        },
        'permission_callback' => '__return_true'
    ));
});

// 尝试直接修复REST输出问题
add_filter('rest_pre_echo_response', function($result) {
    if (headers_sent()) {
        error_log('BJT REST API Fix: Headers already sent');
    } else {
        header('Content-Type: application/json; charset=utf-8');
    }
    return $result;
}, 0);
EOT;

        file_put_contents($rest_fix_file, $rest_fix_content);
        echo '<p style="color:green">✓ 已创建并安装REST API修复插件</p>';
        fwrite($log, "创建了REST API修复插件\n");
        
        // 3. 修复wp-config.php文件
        echo '<h3>3. 检查并修复wp-config.php</h3>';
        $config_file = $wp_dir . '/wp-config.php';
        if (file_exists($config_file) && is_writable($config_file)) {
            $config_content = file_get_contents($config_file);
            
            // 备份wp-config.php
            $backup_file = $wp_dir . '/wp-config.php.bak.' . date('YmdHis');
            file_put_contents($backup_file, $config_content);
            echo '<p style="color:green">✓ 已备份wp-config.php到 ' . basename($backup_file) . '</p>';
            fwrite($log, "备份了wp-config.php\n");
            
            // 添加关键定义
            $has_changes = false;
            
            // 检查并添加WP_HOME和WP_SITEURL常量
            if (strpos($config_content, "define('WP_HOME'") === false && 
                strpos($config_content, 'define("WP_HOME"') === false) {
                $insertion_point = strpos($config_content, "/* That's all, stop editing!");
                if ($insertion_point === false) {
                    $insertion_point = strpos($config_content, '/** WordPress absolute path to the WordPress directory');
                }
                
                if ($insertion_point !== false) {
                    $new_constants = "\n\n/* BJT REST API Fix */\n";
                    $new_constants .= "define('WP_HOME', 'http://localhost:8080');\n";
                    $new_constants .= "define('WP_SITEURL', 'http://localhost:8080');\n";
                    $new_constants .= "define('REST_API_FIX', true);\n\n";
                    
                    $config_content = substr_replace($config_content, $new_constants, $insertion_point, 0);
                    $has_changes = true;
                    
                    echo '<p style="color:green">✓ 已添加REST API相关常量到wp-config.php</p>';
                    fwrite($log, "添加了REST API相关常量到wp-config.php\n");
                } else {
                    echo '<p style="color:orange">⚠ 无法在wp-config.php中找到合适的插入点，请手动添加配置</p>';
                    fwrite($log, "无法在wp-config.php中找到合适的插入点\n");
                }
            } else {
                echo '<p>WP_HOME和WP_SITEURL常量已存在，无需添加</p>';
            }
            
            // 保存修改后的wp-config.php
            if ($has_changes) {
                file_put_contents($config_file, $config_content);
            }
        } else {
            echo '<p style="color:orange">⚠ wp-config.php文件不存在或不可写入</p>';
            fwrite($log, "wp-config.php文件不存在或不可写入\n");
        }
        
        // 4. 创建或修改index.php文件以处理REST请求
        echo '<h3>4. 修改index.php文件</h3>';
        $index_file = $wp_dir . '/index.php';
        if (file_exists($index_file) && is_writable($index_file)) {
            $index_content = file_get_contents($index_file);
            
            // 备份index.php
            $backup_index = $wp_dir . '/index.php.bak.' . date('YmdHis');
            file_put_contents($backup_index, $index_content);
            echo '<p style="color:green">✓ 已备份index.php到 ' . basename($backup_index) . '</p>';
            fwrite($log, "备份了index.php\n");
            
            // 检查是否需要修改
            if (strpos($index_content, 'BJT_REST_API_FIX') === false) {
                // 在入口点添加REST API检测逻辑
                $target = "/** Loads the WordPress Environment and Template */";
                $replacement = "/** BJT REST API检测开始 */\n";
                $replacement .= 'if (strpos($_SERVER["REQUEST_URI"], "/wp-json/") !== false) {' . "\n";
                $replacement .= '    // 设置常量用于REST API请求' . "\n";
                $replacement .= '    define("REST_REQUEST", true);' . "\n";
                $replacement .= '    // 添加内容类型头' . "\n";
                $replacement .= '    header("Content-Type: application/json; charset=utf-8");' . "\n";
                $replacement .= '    // 添加CORS头' . "\n";
                $replacement .= '    header("Access-Control-Allow-Origin: *");' . "\n";
                $replacement .= '    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");' . "\n";
                $replacement .= '    header("Access-Control-Allow-Credentials: true");' . "\n";
                $replacement .= '    header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With");' . "\n";
                $replacement .= '    if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {' . "\n";
                $replacement .= '        status_header(200);' . "\n";
                $replacement .= '        exit;' . "\n";
                $replacement .= '    }' . "\n";
                $replacement .= '}' . "\n";
                $replacement .= "/** BJT REST API检测结束 */\n\n";
                $replacement .= $target;
                
                $index_content = str_replace($target, $replacement, $index_content);
                file_put_contents($index_file, $index_content);
                
                echo '<p style="color:green">✓ 已修改index.php以支持REST API</p>';
                fwrite($log, "修改了index.php以支持REST API\n");
            } else {
                echo '<p>index.php已包含REST API修复代码，无需修改</p>';
            }
        } else {
            echo '<p style="color:orange">⚠ index.php文件不存在或不可写入</p>';
            fwrite($log, "index.php文件不存在或不可写入\n");
        }
        
        // 5. 创建.htaccess文件（对Apache服务器有效）
        echo '<h3>5. 检查并创建.htaccess文件</h3>';
        $htaccess_file = $wp_dir . '/.htaccess';
        if (!file_exists($htaccess_file) || is_writable($htaccess_file)) {
            // 如果文件存在，先备份
            if (file_exists($htaccess_file)) {
                $backup_htaccess = $wp_dir . '/.htaccess.bak.' . date('YmdHis');
                copy($htaccess_file, $backup_htaccess);
                echo '<p style="color:green">✓ 已备份.htaccess到 ' . basename($backup_htaccess) . '</p>';
                fwrite($log, "备份了.htaccess\n");
            }
            
            // 创建或更新.htaccess
            $htaccess_content = <<<'EOT'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]

# REST API特殊处理
RewriteCond %{REQUEST_URI} ^/wp-json/ [NC]
RewriteRule ^wp-json/(.*) /index.php?rest_route=/$1 [L,QSA]

# 标准WordPress规则
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress

# 对REST API请求设置正确的内容类型
<IfModule mod_headers.c>
    <FilesMatch "wp-json">
        Header set Content-Type "application/json; charset=utf-8"
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
        Header set Access-Control-Allow-Credentials "true"
        Header set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With"
    </FilesMatch>
</IfModule>
EOT;

            file_put_contents($htaccess_file, $htaccess_content);
            echo '<p style="color:green">✓ 已创建/更新.htaccess文件</p>';
            fwrite($log, "创建/更新了.htaccess文件\n");
        } else {
            echo '<p style="color:orange">⚠ .htaccess文件存在但不可写入</p>';
            fwrite($log, ".htaccess文件存在但不可写入\n");
        }
        
        // 6. 创建nginx配置参考文件
        echo '<h3>6. 创建Nginx配置参考</h3>';
        $nginx_ref_file = __DIR__ . '/nginx-wordpress-config.conf';
        $nginx_content = <<<'EOT'
# Nginx配置参考 - 针对WordPress REST API
# 此文件是自动生成的参考配置，需要手动整合到您的nginx配置中

server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    
    index index.php;
    
    # REST API特殊处理
    location /wp-json/ {
        try_files $uri $uri/ /index.php?$args;
        
        # 设置正确的内容类型
        add_header Content-Type "application/json; charset=utf-8";
        
        # 允许CORS
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
        
        # 处理OPTIONS请求
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 标准WordPress规则
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    # 处理PHP请求
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass wordpress:9000;  # 更改为您的PHP-FPM服务器地址
    }
}
EOT;

        file_put_contents($nginx_ref_file, $nginx_content);
        echo '<p style="color:green">✓ 已创建Nginx配置参考文件: nginx-wordpress-config.conf</p>';
        fwrite($log, "创建了Nginx配置参考文件\n");
        
        // 7. 检查数据库BJT表
        echo '<h3>7. 检查数据库BJT表</h3>';
        echo '<p>请访问以下URL来查看数据库表状态:</p>';
        $diagnostic_url = 'http://localhost:8080/' . basename(__DIR__) . '/wp-api-diagnostic.php';
        echo '<p><a href="' . $diagnostic_url . '" target="_blank">' . $diagnostic_url . '</a></p>';
        fwrite($log, "建议检查数据库表状态\n");
        
        // 完成所有修复
        echo '<h2 style="color:green">修复完成!</h2>';
        echo '<p>重要: 请重启Web服务器以应用更改:</p>';
        echo '<pre>docker-compose -f docker/dev/docker-compose.nginx.yml restart</pre>';
        
        echo '<p>然后测试REST API是否工作正常:</p>';
        echo '<pre>curl -H "Accept: application/json" http://localhost:8080/wp-json/</pre>';
        
        echo '<p>测试BJT健康检查端点:</p>';
        echo '<pre>curl -H "Accept: application/json" http://localhost:8080/wp-json/bjt-health/v1/check</pre>';
        
        // 保存日志
        fwrite($log, "\n修复完成于 " . date('Y-m-d H:i:s') . "\n");
        fclose($log);
        
        echo '<p>修复日志已保存到: ' . basename($log_file) . '</p>';
    } catch (Exception $e) {
        echo '<p style="color:red">修复过程中发生错误: ' . $e->getMessage() . '</p>';
        if (isset($log) && is_resource($log)) {
            fwrite($log, "修复过程中发生错误: " . $e->getMessage() . "\n");
            fclose($log);
        }
    }
}
?> 