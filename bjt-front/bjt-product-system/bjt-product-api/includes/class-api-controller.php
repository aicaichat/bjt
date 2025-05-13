<?php
/**
 * API控制器基类
 * 
 * 提供所有控制器共享的基础功能
 */

class BJT_API_Controller {
    /**
     * API命名空间
     *
     * @var string
     */
    protected $namespace = 'bjt/v1';
    
    /**
     * 资源名称
     *
     * @var string
     */
    protected $resource_name = '';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 由子类实现
    }
    
    /**
     * 检查读权限
     *
     * @return bool 是否有读权限
     */
    public function check_read_permission() {
        return true; // 默认开放读取，子类可以覆盖此方法
    }
    
    /**
     * 检查写权限
     *
     * @return bool 是否有写权限
     */
    public function check_write_permission() {
        return current_user_can('edit_posts'); // 默认仅登录用户可写
    }
    
    /**
     * 标准化响应
     *
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param bool $success 是否成功
     * @param int $code 状态码
     * @return array 标准化的响应
     */
    protected function response($data = null, $message = '', $success = true, $code = null) {
        $response = [
            'success' => $success,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        if ($code !== null) {
            $response['code'] = $code;
        }
        
        return $response;
    }
    
    /**
     * 错误响应
     *
     * @param string $message 错误消息
     * @param int $code 错误码
     * @param int $status HTTP状态码
     * @return WP_Error 错误响应对象
     */
    protected function error_response($message, $code = 400, $status = 400) {
        return new WP_Error(
            'bjt_api_error',
            $message,
            [
                'status' => $status,
                'code' => $code,
                'success' => false
            ]
        );
    }
    
    /**
     * 获取分页参数
     *
     * @param WP_REST_Request $request 请求对象
     * @return array 分页参数
     */
    protected function get_pagination_params($request) {
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        $page_size = isset($request['page_size']) ? (int) $request['page_size'] : 10;
        
        // 确保页码和页大小有效
        $page = max(1, $page);
        $page_size = max(1, min($page_size, 100));
        
        return [
            'page' => $page,
            'page_size' => $page_size,
            'offset' => ($page - 1) * $page_size,
        ];
    }

    public function __construct() {
        error_log('BJT_API_PARENT_CTRL: Constructor invoked. Resource: ' . (isset($this->resource_name) ? $this->resource_name : 'NOT SET'));
        try {
            error_log('BJT_API_PARENT_CTRL: Attempting BJT_Database::instance()');
            $this->db = BJT_Database::instance();
            error_log('BJT_API_PARENT_CTRL: BJT_Database::instance() SUCCEEDED.');
        } catch (Throwable $e) {
            error_log('BJT_API_PARENT_CTRL: ERROR in BJT_Database::instance(): ' . $e->getMessage());
            throw $e; // Re-throw to see if it stops execution
        }
        error_log('BJT_API_PARENT_CTRL: Constructor finished. Resource: ' . (isset($this->resource_name) ? $this->resource_name : 'NOT SET'));
    }
} 