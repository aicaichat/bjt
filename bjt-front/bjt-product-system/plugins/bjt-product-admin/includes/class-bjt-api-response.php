<?php
/**
 * BJT API Response Class
 *
 * Standardizes API responses across all BJT API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_API_Response {
    /**
     * Format a successful API response
     *
     * @param mixed $data The response data
     * @param string $message Optional message
     * @param int $status_code HTTP status code
     * @return WP_REST_Response
     */
    public static function success($data = null, $message = '', $status_code = 200) {
        $response = [
            'success' => true,
        ];

        if (!empty($data)) {
            $response['data'] = $data;
        }

        if (!empty($message)) {
            $response['message'] = $message;
        }

        return new WP_REST_Response($response, $status_code);
    }

    /**
     * Format an error API response
     *
     * @param string $message Error message
     * @param int $code Error code
     * @param int $status_code HTTP status code
     * @param array $additional_data Additional data to include in the response
     * @return WP_Error
     */
    public static function error($message, $code = 1000, $status_code = 400, $additional_data = []) {
        $data = ['status' => $status_code];
        
        if (!empty($additional_data)) {
            $data = array_merge($data, $additional_data);
        }

        // WP_Error responses are automatically converted to a standardized format
        // by the REST API, but we'll ensure our custom code is included
        return new WP_Error($code, $message, $data);
    }

    /**
     * Filter function to wrap all API responses in our standard format
     *
     * @param WP_REST_Response|WP_Error $response The original response object
     * @param WP_REST_Server $server The REST server instance
     * @param WP_REST_Request $request The current request
     * @return WP_REST_Response|WP_Error
     */
    public static function filter_rest_response($response, $server, $request) {
        // Skip if this is already a WP_Error
        if (is_wp_error($response)) {
            return $response;
        }

        // 检查是否为BJT API请求
        $route = $request->get_route();
        if (strpos($route, '/bjt/v1/') === false) {
            return $response;
        }

        $data = $response->get_data();
        
        // If the response is already in our format, return it unchanged
        if (is_array($data) && isset($data['success'])) {
            return $response;
        }

        // Get status code
        $status = $response->get_status();
        
        // Successful responses (2xx status codes)
        if ($status >= 200 && $status < 300) {
            // Wrap the existing data in our standard format
            $new_data = [
                'success' => true,
                'data' => $data
            ];
            
            $response->set_data($new_data);
        }
        
        return $response;
    }

    /**
     * Register our response filter with WordPress
     */
    public static function register_filters() {
        // 使用更底层的过滤器，确保捕获所有REST响应
        add_filter('rest_pre_serve_request', [__CLASS__, 'pre_serve_request'], 10, 4);
    }
    
    /**
     * Pre-serve request filter for ensuring all BJT API responses have success field
     */
    public static function pre_serve_request($served, $result, $request, $server) {
        // 只处理BJT自己的API
        $route = $request->get_route();
        if (strpos($route, '/bjt/v1/') === false) {
            return $served;
        }
        
        // 如果已经处理过，则直接返回
        if ($served) {
            return $served;
        }
        
        // 获取响应数据
        $data = $result->get_data();
        
        // 如果响应已经包含success字段，则不需要修改
        if (is_array($data) && isset($data['success'])) {
            return $served;
        }
        
        // 获取状态码
        $status = $result->get_status();
        
        // 如果是成功的响应（2xx状态码），添加success=true
        if ($status >= 200 && $status < 300) {
            $modified_data = [
                'success' => true,
                'data' => $data
            ];
            
            $result->set_data($modified_data);
            
            // 设置适当的头部
            $server->send_headers($result);
            
            // 输出修改后的响应
            echo wp_json_encode($modified_data);
            
            // 标记为已处理
            return true;
        }
        
        return $served;
    }
}

// Register our response filter
BJT_API_Response::register_filters(); 