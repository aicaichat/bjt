<?php
/**
 * BJT API处理器类
 * 
 * 用于处理REST API请求
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_API_Handler {
    /**
     * 单例实例
     *
     * @var BJT_API_Handler
     */
    private static $instance = null;
    
    /**
     * API基础URL
     *
     * @var string
     */
    private $api_base_url;
    
    /**
     * API版本
     *
     * @var string
     */
    private $api_version;
    
    /**
     * 构造函数
     */
    private function __construct() {
        // 默认使用本地WordPress REST API
        $this->api_base_url = rest_url();
        $this->api_version = 'bjt/v1';
    }
    
    /**
     * 获取单例实例
     *
     * @return BJT_API_Handler
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 设置API基础URL
     *
     * @param string $url API基础URL
     */
    public function set_api_base_url($url) {
        $this->api_base_url = rtrim($url, '/') . '/';
    }
    
    /**
     * 设置API版本
     *
     * @param string $version API版本
     */
    public function set_api_version($version) {
        $this->api_version = $version;
    }
    
    /**
     * 获取完整的API URL
     *
     * @param string $endpoint API端点
     * @return string 完整的API URL
     */
    public function get_api_url($endpoint) {
        return $this->api_base_url . $this->api_version . '/' . ltrim($endpoint, '/');
    }
    
    /**
     * 执行GET请求
     *
     * @param string $endpoint API端点
     * @param array $params 查询参数
     * @return array|WP_Error 响应数据或错误
     */
    public function get($endpoint, $params = array()) {
        $url = $this->get_api_url($endpoint);
        
        if (!empty($params)) {
            $url = add_query_arg($params, $url);
        }
        
        $args = array(
            'method' => 'GET',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            )
        );
        
        // 添加认证
        $args = $this->add_auth_header($args);
        
        $response = wp_remote_request($url, $args);
        return $this->handle_response($response);
    }
    
    /**
     * 执行POST请求
     *
     * @param string $endpoint API端点
     * @param array $data 请求数据
     * @return array|WP_Error 响应数据或错误
     */
    public function post($endpoint, $data = array()) {
        $url = $this->get_api_url($endpoint);
        
        $args = array(
            'method' => 'POST',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ),
            'body' => wp_json_encode($data)
        );
        
        // 添加认证
        $args = $this->add_auth_header($args);
        
        $response = wp_remote_request($url, $args);
        return $this->handle_response($response);
    }
    
    /**
     * 执行PUT请求
     *
     * @param string $endpoint API端点
     * @param array $data 请求数据
     * @return array|WP_Error 响应数据或错误
     */
    public function put($endpoint, $data = array()) {
        $url = $this->get_api_url($endpoint);
        
        $args = array(
            'method' => 'PUT',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ),
            'body' => wp_json_encode($data)
        );
        
        // 添加认证
        $args = $this->add_auth_header($args);
        
        $response = wp_remote_request($url, $args);
        return $this->handle_response($response);
    }
    
    /**
     * 执行DELETE请求
     *
     * @param string $endpoint API端点
     * @return array|WP_Error 响应数据或错误
     */
    public function delete($endpoint) {
        $url = $this->get_api_url($endpoint);
        
        $args = array(
            'method' => 'DELETE',
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            )
        );
        
        // 添加认证
        $args = $this->add_auth_header($args);
        
        $response = wp_remote_request($url, $args);
        return $this->handle_response($response);
    }
    
    /**
     * 处理响应
     *
     * @param array|WP_Error $response 响应或错误
     * @return array|WP_Error 处理后的响应数据或错误
     */
    private function handle_response($response) {
        if (is_wp_error($response)) {
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code >= 400) {
            $error_message = __('API请求失败', 'bjt-product-admin');
            
            // 尝试解析错误信息
            $body_data = json_decode($response_body, true);
            if (is_array($body_data) && isset($body_data['message'])) {
                $error_message = $body_data['message'];
            }
            
            return new WP_Error(
                'api_error',
                sprintf(__('API错误: %s (状态码: %d)', 'bjt-product-admin'), $error_message, $response_code),
                array('status' => $response_code)
            );
        }
        
        // 尝试解析响应数据
        $data = json_decode($response_body, true);
        if (null === $data && JSON_ERROR_NONE !== json_last_error()) {
            return new WP_Error(
                'api_response_error',
                __('无法解析API响应', 'bjt-product-admin'),
                array('response' => $response_body)
            );
        }
        
        return $data;
    }
    
    /**
     * 添加认证头
     *
     * @param array $args 请求参数
     * @return array 添加认证后的请求参数
     */
    private function add_auth_header($args) {
        // 如果需要认证，这里添加认证头
        // 例如，JWT认证或Basic认证
        
        // 获取可能存在的认证令牌
        $auth_token = get_option('bjt_api_auth_token');
        
        if (!empty($auth_token)) {
            if (!isset($args['headers'])) {
                $args['headers'] = array();
            }
            
            $args['headers']['Authorization'] = 'Bearer ' . $auth_token;
        }
        
        return $args;
    }
    
    /**
     * 上传文件
     *
     * @param string $endpoint API端点
     * @param string $file_path 文件路径
     * @param array $params 附加参数
     * @return array|WP_Error 响应数据或错误
     */
    public function upload_file($endpoint, $file_path, $params = array()) {
        $url = $this->get_api_url($endpoint);
        
        if (!file_exists($file_path)) {
            return new WP_Error('file_not_found', __('文件不存在', 'bjt-product-admin'));
        }
        
        $file_name = basename($file_path);
        $file_type = wp_check_filetype($file_name)['type'];
        
        $boundary = wp_generate_password(24);
        
        $headers = array(
            'Content-Type' => 'multipart/form-data; boundary=' . $boundary,
            'Accept' => 'application/json'
        );
        
        // 添加认证
        $auth_token = get_option('bjt_api_auth_token');
        if (!empty($auth_token)) {
            $headers['Authorization'] = 'Bearer ' . $auth_token;
        }
        
        $payload = '';
        
        // 添加附加参数
        foreach ($params as $key => $value) {
            $payload .= '--' . $boundary . "\r\n";
            $payload .= 'Content-Disposition: form-data; name="' . $key . '"' . "\r\n\r\n";
            $payload .= $value . "\r\n";
        }
        
        // 添加文件
        $payload .= '--' . $boundary . "\r\n";
        $payload .= 'Content-Disposition: form-data; name="file"; filename="' . $file_name . '"' . "\r\n";
        $payload .= 'Content-Type: ' . $file_type . "\r\n\r\n";
        $payload .= file_get_contents($file_path) . "\r\n";
        $payload .= '--' . $boundary . '--';
        
        $args = array(
            'method' => 'POST',
            'timeout' => 60,
            'headers' => $headers,
            'body' => $payload
        );
        
        $response = wp_remote_request($url, $args);
        return $this->handle_response($response);
    }
} 