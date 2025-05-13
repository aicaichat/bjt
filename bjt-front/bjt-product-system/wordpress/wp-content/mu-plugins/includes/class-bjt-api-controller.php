<?php
/**
 * BJT API Controller
 * 
 * API控制器基类，提供共用方法
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT API控制器基类
 */
abstract class BJT_API_Controller extends WP_REST_Controller {
    /**
     * API命名空间
     */
    protected $namespace = 'bjt/v1';
    
    /**
     * 检查用户是否已认证
     */
    public function check_authentication($request) {
        // 从请求头获取Bearer Token
        $authorization_header = $request->get_header('authorization');
        if (empty($authorization_header) || !preg_match('/Bearer\s+(.*)$/i', $authorization_header, $matches)) {
            return $this->error_response('未提供授权令牌', 'token_not_provided', 401, false);
        }
        
        $token = $matches[1];
        
        // 验证JWT Token
        try {
            $jwt_handler = new BJT_JWT_Handler();
            $decoded_token = $jwt_handler->validate_token($token);
            
            if (!$decoded_token) {
                return $this->error_response('无效的授权令牌', 'invalid_token', 401, false);
            }
            
            // 将用户ID存储在请求对象中，以便在控制器方法中使用
            $request->set_param('user_id', $decoded_token->data->user_id);
            
            return true;
        } catch (Exception $e) {
            return $this->error_response('令牌验证失败: ' . $e->getMessage(), 'token_validation_failed', 401, false);
        }
    }
    
    /**
     * 无需认证的检查方法（用于公开接口）
     */
    public function no_authentication() {
        return true;
    }
    
    /**
     * 返回错误响应
     */
    protected function error_response($message, $code = '', $status = 400, $return_wp_error = true) {
        $data = array(
            'success' => false,
            'message' => $message,
            'code' => $code ?: 'unknown_error',
        );
        
        if ($return_wp_error) {
            return new WP_Error($code ?: 'unknown_error', $message, array('status' => $status));
        } else {
            return new WP_REST_Response($data, $status);
        }
    }
    
    /**
     * 返回成功响应
     */
    protected function success_response($data = null, $message = '操作成功', $status = 200) {
        $response = array(
            'success' => true,
            'message' => $message,
        );
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        return new WP_REST_Response($response, $status);
    }
    
    /**
     * 返回分页响应
     */
    protected function get_paginated_response($items, $total, $request) {
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('page_size') ?: 10;
        
        $last_page = ceil($total / $per_page);
        
        $response = array(
            'current_page' => (int) $page,
            'per_page' => (int) $per_page,
            'last_page' => (int) max(1, $last_page),
            'total' => (int) $total,
            'items' => $items,
        );
        
        return $this->success_response($response);
    }
    
    /**
     * 格式化日期时间
     */
    protected function format_datetime($datetime, $format = 'Y-m-d H:i:s') {
        if (empty($datetime)) {
            return '';
        }
        
        if (is_numeric($datetime)) {
            $datetime = date('Y-m-d H:i:s', $datetime);
        }
        
        $date = new DateTime($datetime);
        return $date->format($format);
    }
    
    /**
     * 确保是数组
     */
    protected function ensure_array($data) {
        if (empty($data)) {
            return array();
        }
        
        if (is_array($data)) {
            return $data;
        }
        
        if (is_object($data)) {
            return (array) $data;
        }
        
        return array($data);
    }
} 