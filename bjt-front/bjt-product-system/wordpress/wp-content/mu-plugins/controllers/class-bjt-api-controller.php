<?php
/**
 * BJT API Controller
 * 
 * 控制器基类，提供共享功能
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT API控制器基类
 */
abstract class BJT_API_Controller {
    /**
     * API命名空间
     */
    protected $namespace = 'bjt/v1';
    
    /**
     * 资源基础
     */
    protected $rest_base = '';
    
    /**
     * 注册路由
     */
    abstract public function register_routes();
    
    /**
     * JWT Handler
     */
    protected $jwt_handler;

    public function __construct() {
        $this->jwt_handler = new BJT_JWT_Handler();
    }
    
    /**
     * 检查认证
     */
    protected function check_authentication() {
        error_log('🔍 [API Controller] Checking authentication...');
        
        // Get the Authorization header
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        error_log('🔑 [API Controller] Auth header: ' . substr($auth_header, 0, 20) . '...');
        
        if (empty($auth_header)) {
            error_log('❌ [API Controller] No Authorization header found');
            return new WP_Error('unauthorized', 'No authorization header', array('status' => 401));
        }

        // Check if it's a Bearer token
        if (strpos($auth_header, 'Bearer ') !== 0) {
            error_log('❌ [API Controller] Invalid token format');
            return new WP_Error('unauthorized', 'Invalid token format', array('status' => 401));
        }

        // Extract the token
        $token = substr($auth_header, 7);
        error_log('🔑 [API Controller] Extracted token: ' . substr($token, 0, 20) . '...');

        try {
            // Validate the token
            $decoded = $this->jwt_handler->validate_token($token);
            if (!$decoded) {
                error_log('❌ [API Controller] Token validation failed - no payload returned');
                return new WP_Error('unauthorized', 'Invalid token', array('status' => 401));
            }

            error_log('✅ [API Controller] Token payload: ' . print_r($decoded, true));

            // Get user ID from token
            $user_id = null;
            if (isset($decoded->data->user_id)) {
                $user_id = $decoded->data->user_id;
            } else if (isset($decoded->user) && isset($decoded->user->id)) {
                $user_id = $decoded->user->id;
            } else if (isset($decoded->user_id)) {
                $user_id = $decoded->user_id;
            }

            if (!$user_id) {
                error_log('❌ [API Controller] No user ID in token');
                return new WP_Error('unauthorized', 'Invalid user', array('status' => 401));
            }

            error_log('✅ [API Controller] Found user ID in token: ' . $user_id);

            // Get user
            $user = get_user_by('id', $user_id);
            if (!$user) {
                error_log('❌ [API Controller] User not found: ' . $user_id);
                return new WP_Error('unauthorized', 'User not found', array('status' => 401));
            }

            error_log('✅ [API Controller] Authentication successful for user: ' . $user_id);
            return $user;
        } catch (Exception $e) {
            error_log('❌ [API Controller] Token validation exception: ' . $e->getMessage());
            return new WP_Error('unauthorized', 'Token validation failed: ' . $e->getMessage(), array('status' => 401));
        }
    }
    
    /**
     * 检查特定权限
     */
    public function check_permission($request, $permission) {
        $auth_result = $this->check_authentication();
        if (is_wp_error($auth_result)) {
            return $auth_result;
        }
        
        $user = wp_get_current_user();
        if (!$user || !$user->ID) {
            return new WP_Error('not_logged_in', '用户未登录', array('status' => 401));
        }
        
        // 根据权限检查用户角色或特定权限
        switch ($permission) {
            case 'view_prices':
                // 需要有查看价格的权限
                return current_user_can('read') || current_user_can('manage_options');
                
            case 'admin':
                // 管理员权限
                return current_user_can('manage_options');
                
            case 'read':
            default:
                // 默认的读取权限
                return current_user_can('read');
        }
    }
    
    /**
     * 获取带分页的响应
     */
    protected function get_paginated_response($items, $total_items, $request) {
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        $per_page = isset($request['page_size']) ? (int) $request['page_size'] : 10;
        
        // 计算总页数
        $total_pages = ceil($total_items / $per_page);
        
        return array(
            'success' => true,
            'data' => array(
                'items' => $items,
                'total' => $total_items,
                'page' => $page,
                'page_size' => $per_page,
                'total_pages' => $total_pages
            )
        );
    }
    
    /**
     * 创建成功响应
     */
    protected function success_response($data, $message = null) {
        $response = array(
            'success' => true,
            'data' => $data
        );
        
        if ($message) {
            $response['message'] = $message;
        }
        
        return $response;
    }
    
    /**
     * 创建错误响应
     */
    protected function error_response($message, $code, $status = 400) {
        return new WP_Error(
            $code,
            $message,
            array('status' => $status)
        );
    }

    protected function check_read_permission($user) {
        error_log('🔍 [API Controller] Checking read permission for user: ' . $user->ID);
        
        if (!user_can($user, 'read')) {
            error_log('❌ [API Controller] User lacks read permission');
            return new WP_Error('forbidden', 'Insufficient permissions', array('status' => 403));
        }

        error_log('✅ [API Controller] Read permission granted');
        return true;
    }
} 