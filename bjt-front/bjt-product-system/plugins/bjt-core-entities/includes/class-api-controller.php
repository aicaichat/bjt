<?php
/**
 * API控制器基类 (General BJT APIs)
 * 
 * 提供所有控制器共享的基础功能 (namespace bjt/v1)
 */
class BJT_API_Controller { // NOTE: This is BJT_API_Controller, not BJT_Product_API_Controller
    /**
     * API命名空间
     *
     * @var string
     */
    protected $namespace = 'bjt/v1'; // Default namespace for general BJT APIs
    
    /**
     * 资源名称
     *
     * @var string
     */
    protected $resource_name = ''; // To be set by child classes

    /**
     * Constructor
     */
    public function __construct() {
        // Explicitly empty constructor
    }
    
    /**
     * 注册路由
     * Must be implemented by child classes.
     */
    public function register_routes() {
        // This method should be overridden by child classes to register their specific routes.
        // Example: register_rest_route( $this->namespace, '/' . $this->resource_name, ... );
    }
    
    /**
     * 检查读权限
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
     */
    public function check_read_permission($request) {
        return true; // Default: Allow public read access
    }
    
    /**
     * 检查写权限
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return bool|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        // Example: return current_user_can('edit_posts');
        return true; // Default: Allow writes (adjust for production)
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
            // For WP_REST_Response, status is set separately
        }
        
        return $response; // This structure is for direct return, not WP_REST_Response objects
    }
    
    /**
     * 错误响应
     *
     * @param string $message 错误消息
     * @param string $error_code 应用程序特定的错误代码
     * @param int $status HTTP状态码
     * @return WP_Error 错误响应对象
     */
    protected function error_response($message, $error_code = 'bjt_api_error', $status = 400) {
        return new WP_Error(
            $error_code,
            $message,
            [
                'status' => $status,
                // 'success' => false // WP_Error implies not success
            ]
        );
    }
    
    /**
     * Extracts and processes pagination parameters from an incoming WP_REST_Request object.
     *
     * @param WP_REST_Request $request Request object.
     * @return array Associative array containing 'page', 'per_page', and 'offset'.
     */
    protected function extract_pagination_params_from_request($request) {
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        $per_page = isset($request['per_page']) ? (int) $request['per_page'] : 10;
        
        $page = max(1, $page);
        $per_page = max(1, min($per_page, 100)); // Cap per_page
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => ($page - 1) * $per_page,
        ];
    }

    /**
     * Returns the schema definition for pagination arguments.
     * Suitable for use in the 'args' key of register_rest_route.
     *
     * @return array
     */
    protected function get_pagination_arg_definitions() {
        return [
            'page' => [
                'description'       => 'Current page of the collection.',
                'type'              => 'integer',
                'default'           => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => function( $param, $request, $key ) {
                    return is_numeric( $param ) && (int) $param > 0;
                }
            ],
            'per_page' => [
                'description'       => 'Maximum number of items to be returned in result set.',
                'type'              => 'integer',
                'default'           => 10,
                'sanitize_callback' => 'absint',
                'validate_callback' => function( $param, $request, $key ) {
                    return is_numeric( $param ) && (int) $param > 0 && (int) $param <= 100;
                }
            ],
        ];
    }
} 