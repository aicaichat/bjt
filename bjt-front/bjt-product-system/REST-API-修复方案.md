# WordPress REST API 修复方案

## 问题诊断

在BJT产品管理系统项目中，我们发现WordPress REST API存在以下问题：

1. REST API返回HTML而不是JSON
2. 首页为空白
3. 数据库中可能缺少BJT相关表

## 根本原因分析

经过深入排查，我们确定导致这些问题的可能原因有：

1. **Nginx配置问题**：Nginx可能没有正确配置REST API的处理规则
2. **WordPress配置问题**：`wp-config.php`中可能缺少必要的配置
3. **重定向干扰**：网站有重定向设置影响了REST API响应
4. **数据库初始化问题**：BJT产品相关表可能未正确创建
5. **内容类型处理问题**：REST API响应头没有正确设置

## 修复方案

### 1. 修复Nginx配置

将以下配置添加到Nginx配置文件中：

```nginx
# REST API特殊处理
location /wp-json/ {
    # 改进的处理方式
    rewrite ^/wp-json/(.*) /index.php?rest_route=/$1 last;
    
    # 确保JSON内容类型
    add_header Content-Type 'application/json; charset=utf-8' always;
    
    # CORS支持
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
    
    # 如果是OPTIONS请求，直接返回200
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        add_header 'Content-Type' 'text/plain charset=UTF-8' always;
        add_header 'Content-Length' 0 always;
        return 204;
    }
}
```

### 2. 修改WordPress配置

在`wp-config.php`中添加以下内容：

```php
/* BJT REST API Fix */
define('WP_HOME', 'http://localhost:8080');
define('WP_SITEURL', 'http://localhost:8080');
define('REST_API_FIX', true);
```

### 3. 创建REST API修复插件

在`wp-content/mu-plugins`目录下创建`bjt-rest-api-fix.php`文件，内容如下：

```php
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

class BJT_REST_API_Fix {
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('muplugins_loaded', array($this, 'early_init'), 0);
        add_action('plugins_loaded', array($this, 'init'), 0);
        add_action('rest_api_init', array($this, 'log_rest_request'), 0);
        remove_filter('template_redirect', 'redirect_canonical');
        add_action('send_headers', array($this, 'check_rest_request'), 0);
        $this->check_rest_request();
    }
    
    public function early_init() {
        if ($this->is_rest_request()) {
            remove_all_actions('template_redirect');
            while (ob_get_level()) {
                ob_end_clean();
            }
        }
    }
    
    public function init() {
        add_action('rest_api_init', array($this, 'rest_api_init_handler'), 0);
        add_filter('rest_pre_serve_request', array($this, 'rest_ensure_proper_headers'), 10, 4);
    }
    
    private function is_rest_request() {
        $rest_prefix = 'wp-json';
        if (isset($_SERVER['REQUEST_URI'])) {
            return strpos($_SERVER['REQUEST_URI'], '/' . $rest_prefix . '/') !== false;
        }
        return false;
    }
    
    public function check_rest_request() {
        if ($this->is_rest_request()) {
            if (!defined('REST_REQUEST')) {
                define('REST_REQUEST', true);
            }
            
            $this->add_cors_headers();
            
            if (!isset($_GET['_headless'])) {
                $_GET['_headless'] = 1;
            }
        }
    }
    
    public function rest_api_init_handler() {
        header('Content-Type: application/json; charset=utf-8');
        
        if (ob_get_level() > 0) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
        }
        
        register_rest_route('bjt-diag/v1', '/test', array(
            'methods' => 'GET',
            'callback' => function() {
                return array(
                    'success' => true,
                    'message' => 'REST API现在正常工作！',
                    'time' => current_time('mysql')
                );
            },
            'permission_callback' => '__return_true'
        ));
    }
    
    public function log_rest_request() {
        $log_file = WP_CONTENT_DIR . '/rest-api-debug.log';
        $data = array(
            'time' => current_time('mysql'),
            'uri' => $_SERVER['REQUEST_URI'],
            'method' => $_SERVER['REQUEST_METHOD']
        );
        
        @file_put_contents($log_file, json_encode($data, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
    }
    
    public function rest_ensure_proper_headers($served, $result, $request, $server) {
        $server->send_header('Content-Type', 'application/json; charset=utf-8');
        $this->add_cors_headers();
        return $served;
    }
    
    public function add_cors_headers() {
        if (headers_sent()) {
            return;
        }
        
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('HTTP/1.1 200 OK');
            exit;
        }
    }
}

BJT_REST_API_Fix::get_instance();
```

### 4. 修改WordPress主入口文件

在`index.php`文件开头添加以下代码：

```php
/** BJT REST API检测开始 */
if (strpos($_SERVER["REQUEST_URI"], "/wp-json/") !== false) {
    // 设置常量用于REST API请求
    define("REST_REQUEST", true);
    // 添加内容类型头
    header("Content-Type: application/json; charset=utf-8");
    // 添加CORS头
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With");
    if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
        status_header(200);
        exit;
    }
}
/** BJT REST API检测结束 */
```

### 5. 初始化数据库

检查并初始化BJT相关数据库表：

```bash
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
```

## 执行步骤

1. 复制Nginx配置到服务器
2. 编辑`wp-config.php`添加必要配置
3. 创建并安装REST API修复插件
4. 修改`index.php`
5. 检查并初始化数据库
6. 重启WordPress容器
7. 测试REST API是否正常工作

## 测试方法

执行以下命令测试REST API：

```bash
# 测试WordPress REST API基础功能
curl -H "Accept: application/json" http://localhost:8080/wp-json/

# 测试BJT健康检查API
curl -H "Accept: application/json" http://localhost:8080/wp-json/bjt-diag/v1/test

# 测试BJT测试API
curl -H "Accept: application/json" http://localhost:8080/wp-json/bjt-test/v1/test
```

## 验证标准

REST API修复成功的标准是：

1. REST API返回JSON而不是HTML
2. 内容类型头正确设置为`application/json`
3. REST API响应中包含预期的数据
4. BJT API正常工作并返回JSON数据

## 实际解决方案与结果

经过实际排查和修复，我们找到了导致WordPress REST API问题的确切原因，并成功解决了这些问题。以下是我们的解决方案和实施结果。

### 实际问题原因

1. **WordPress永久链接设置**：永久链接结构没有正确设置，影响REST API路由识别
2. **PHP输出缓冲问题**：WordPress主题或插件启动了输出缓冲，但未正确关闭，导致JSON响应被HTML内容污染
3. **内容类型头缺失**：REST API响应未设置正确的Content-Type头
4. **主题干扰**：WordPress主题的某些钩子干扰了REST API的输出处理
5. **Nginx配置不完整**：缺少对REST API路径的特殊处理规则

### 实施的解决方案

#### 1. 创建修复插件

在`wp-content/mu-plugins`目录下创建了`fix-bjt-rest-api.php`插件：

```php
<?php
/**
 * Plugin Name: BJT REST API Fix
 * Description: 修复WordPress REST API返回HTML而不是JSON的问题
 * Version: 1.0.0
 * Author: BJT Development Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 修复REST API输出的主类
 */
class BJT_REST_API_Fix {
    /**
     * 构造函数，设置钩子
     */
    public function __construct() {
        // 在WordPress初始化时添加钩子
        add_action('init', [$this, 'init']);
        
        // 在REST API之前设置头部
        add_action('rest_api_init', [$this, 'set_headers'], 5);
        
        // 在REST API处理请求之前直接设置头部（更早的钩子）
        add_action('parse_request', [$this, 'check_for_rest_request'], 1);
        
        // 在输出前刷新缓冲区并设置头部
        add_action('template_redirect', [$this, 'detect_rest_api_output'], 0);
        
        // 添加测试端点
        add_action('rest_api_init', [$this, 'register_test_route']);
    }
    
    /**
     * 初始化函数
     */
    public function init() {
        // 如果是REST请求，禁用主题
        if ($this->is_rest_request()) {
            // 禁用所有过滤器和操作，这些可能会干扰REST API的JSON输出
            remove_all_filters('the_content');
            remove_all_filters('the_excerpt');
            remove_all_actions('wp_head');
            remove_all_actions('wp_footer');
        }
    }
    
    /**
     * 检查是否是REST API请求
     */
    public function is_rest_request() {
        if (empty($_SERVER['REQUEST_URI'])) {
            return false;
        }
        
        $rest_prefix = trailingslashit(rest_get_url_prefix());
        
        // 检查URL路径是否包含REST API前缀
        return (strpos($_SERVER['REQUEST_URI'], $rest_prefix) !== false);
    }
    
    /**
     * 在REST API初始化时设置头部
     */
    public function set_headers() {
        // 设置CORS头，允许跨域请求
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        // 确保内容类型为JSON
        header('Content-Type: application/json; charset=UTF-8');
        
        // 处理OPTIONS请求
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('HTTP/1.1 200 OK');
            exit;
        }
    }
    
    /**
     * 在解析请求时检查是否是REST请求
     */
    public function check_for_rest_request($request) {
        if ($this->is_rest_request()) {
            // 设置头部
            $this->set_headers();
        }
        
        return $request;
    }
    
    /**
     * 检测REST API输出并确保正确的头部
     */
    public function detect_rest_api_output() {
        if ($this->is_rest_request()) {
            // 开始输出缓冲
            ob_start(function($buffer) {
                // 如果响应看起来像HTML，但应该是JSON
                if (strpos($buffer, '<!DOCTYPE html>') !== false || strpos($buffer, '<html') !== false) {
                    // 清除所有内容，返回一个错误JSON
                    return json_encode([
                        'success' => false,
                        'message' => 'REST API返回了HTML而不是JSON。这是一个服务器配置问题。',
                        'error' => 'html_output_detected',
                        'status' => 500
                    ]);
                }
                
                return $buffer;
            });
        }
    }
    
    /**
     * 注册测试路由
     */
    public function register_test_route() {
        register_rest_route('bjt-fix', '/test', [
            'methods' => 'GET',
            'callback' => [$this, 'test_endpoint'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * 测试端点回调
     */
    public function test_endpoint() {
        return [
            'success' => true,
            'message' => 'BJT REST API修复插件正常工作',
            'time' => current_time('mysql'),
            'php_version' => PHP_VERSION,
            'wp_version' => get_bloginfo('version'),
            'rest_url' => rest_url(),
            'rest_prefix' => rest_get_url_prefix()
        ];
    }
}

// 初始化插件
new BJT_REST_API_Fix();
```

#### 2. 更新Nginx配置

在WordPress容器的Nginx配置中为REST API路径添加了特定配置：

```nginx
location /wp-json/ {
    # 确保使用正确的内容类型
    add_header Content-Type application/json;
    
    # 添加CORS支持
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
    add_header Access-Control-Allow-Credentials "true";
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
    
    # 处理OPTIONS预检请求
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Content-Type "text/plain charset=UTF-8";
        add_header Content-Length 0;
        return 204;
    }
}
```

同样为各个BJT API路径(`/wp-json/bjt/`, `/wp-json/bjt-test/`, `/wp-json/bjt-fix/`)添加了类似的配置。

#### 3. 设置WordPress永久链接

设置了WordPress的永久链接结构为`/%postname%/`，这对REST API的正常运行至关重要：

```bash
wp rewrite structure /%postname%/ --path=/var/www/html --allow-root
wp rewrite flush --path=/var/www/html --allow-root
```

#### 4. 验证数据库

确认了BJT产品相关的数据库表已正确创建并包含所需数据：

```sql
SHOW TABLES FROM bjt_product;
```

### 测试结果

通过使用curl命令测试API端点，验证了修复的有效性：

```bash
curl -v -H "Accept: application/json" http://localhost:8080/wp-json/bjt-fix/test
```

响应结果：

```json
{
  "success": true,
  "message": "BJT REST API修复插件正常工作",
  "time": "2025-05-10 09:27:38",
  "php_version": "8.0.30",
  "wp_version": "6.4.1",
  "rest_url": "http://localhost:8080/wp-json/",
  "rest_prefix": "wp-json"
}
```

测试标准BJT API端点：

```bash
curl -v -H "Accept: application/json" http://localhost:8080/wp-json/bjt-test/v1/test
```

响应结果：

```json
{
  "success": true,
  "message": "BJT API Test Success!",
  "data": {
    "time": "2025-05-10 09:27:51",
    "version": "1.0.0",
    "wordpress_version": "6.4.1"
  }
}
```

所有测试都表明API现在正常返回JSON格式的数据，而不是之前的HTML响应。修复方案成功解决了REST API问题，使前端应用程序可以正常与WordPress后端通信。

## 后续优化

1. 优化重定向处理以避免与REST API冲突
2. 改进错误日志记录以便更好地诊断问题
3. 设置更完善的API测试套件
4. 优化BJT产品数据库结构 