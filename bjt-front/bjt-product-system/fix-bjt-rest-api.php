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