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
     * 检查认证
     */
    public function check_authentication($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('unauthorized', '未授权访问', array('status' => 401));
        }

        $token = substr($auth_header, 7);
        
        try {
            // 验证JWT令牌
            $decoded = JWT::decode($token, get_option('bjt_jwt_secret'), array('HS256'));
            
            // 如果需要，从令牌中提取用户ID并验证用户
            if (isset($decoded->user) && isset($decoded->user->id)) {
                $user = get_user_by('id', $decoded->user->id);
                if (!$user) {
                    return new WP_Error('invalid_token', '无效的令牌：找不到用户', array('status' => 401));
                }
                
                // 为当前请求设置当前用户（可选）
                wp_set_current_user($user->ID);
            }
            
            return true;
        } catch (Exception $e) {
            return new WP_Error('invalid_token', '无效的令牌：' . $e->getMessage(), array('status' => 401));
        }
    }
    
    /**
     * 检查特定权限
     */
    public function check_permission($request, $permission) {
        $auth_result = $this->check_authentication($request);
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
} 