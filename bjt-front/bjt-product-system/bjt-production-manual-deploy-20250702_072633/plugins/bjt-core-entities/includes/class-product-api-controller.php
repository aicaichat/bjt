<?php
/**
 * Product API 控制器基类
 * 
 * 为产品、机器等提供统一的 REST API 控制器基础结构。
 * 继承自 WP_REST_Controller 以便利用 WordPress REST API 的功能。
 */

if (!class_exists('WP_REST_Controller')) {
    error_log('BJT_CRITICAL_ERROR: WP_REST_Controller class not found before defining BJT_Product_API_Controller!');
    // Optionally, die() here if this is unexpected and should halt everything.
    // die('BJT_CRITICAL_ERROR: WP_REST_Controller not found.'); 
} else {
    error_log('BJT_INFO: WP_REST_Controller class FOUND before defining BJT_Product_API_Controller.');
}

class BJT_Product_API_Controller extends WP_REST_Controller {
    /**
     * API 命名空间。
     * 例如：'bjt-product/v1'
     *
     * @var string
     */
    protected $namespace = 'bjt-product/v1';

    /**
     * WordPress 数据库对象。
     *
     * @var wpdb
     */
    protected $db;

    /**
     * 控制器管理的资源名称（例如 'products', 'machines'）。
     * 应由子类定义。
     *
     * @var string
     */
    protected $resource_name;
    
    /**
     * 数据表名称。
     * 应由子类定义。
     *
     * @var string
     */
    protected $table_name; 

    /**
     * 构造函数。
     * 初始化数据库连接。
     */
    public function __construct() {
        // 调用 WP_REST_Controller 的构造函数（如果它有重要的初始化逻辑）
        // parent::__construct(); // WP_REST_Controller does not have an explicit public constructor that needs calling like this.
        
        error_log('BJT_Product_API_Controller: Constructor for resource [' . (isset($this->resource_name) ? $this->resource_name : 'NOT YET SET') . '] invoked.');
        
        global $wpdb;
        $this->db = $wpdb; // Standard way to get wpdb

        if (empty($this->resource_name)) {
            error_log('BJT_Product_API_Controller: WARNING - resource_name is not set by the child class: ' . get_class($this));
        }
        error_log('BJT_Product_API_Controller: Constructor finished for resource [' . $this->resource_name . ']. Namespace: [' . $this->namespace . ']');
    }

    /**
     * 注册此控制器的所有路由。
     * 必须由子类实现。
     */
    public function register_routes() {
        // 子类应覆盖此方法以注册其特定的 REST API 路由。
        // Example: register_rest_route( $this->namespace, '/' . $this->resource_name, ... );
    }

    /**
     * 获取此资源的集合参数。
     * 包括分页、排序等通用参数。
     *
     * @return array
     */
    public function get_collection_params() {
        $params = parent::get_collection_params(); // Inherits params like 'context', 'page', 'per_page', 'search', 'order', 'orderby'
        
        // 添加自定义的通用集合参数（如果需要）
        // $params['custom_param'] = [
        //     'description'       => 'My custom parameter.',
        //     'type'              => 'string',
        //     'validate_callback' => function( $param, $request, $key ) {
        //         return is_string( $param );
        //     },
        // ];
        return $params;
    }
    
    /**
     * 检查默认的读取权限。
     * 允许公开访问GET请求。
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
     */
    public function check_read_permission($request) {
        return true; 
    }

    /**
     * _product检查默认的写入权限。
     * 要求用户具有 'edit_posts' 能力。
     *
     * @param  WP_REST_Request $request Full details about the request.
     * @return bool|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        // return current_user_can('edit_posts'); // Example: Check for capability
        return true; // For now, allowing writes during development
    }

    /**
     * 准备用于响应的单个项目。
     * 应由子类覆盖以格式化其特定项目。
     *
     * @param  mixed           $item    数据库对象或数组。
     * @param  WP_REST_Request $request 请求对象。
     * @return WP_REST_Response 响应对象。
     */
    public function prepare_item_for_response($item, $request) {
        // This should be overridden by child controllers
        return new WP_REST_Response($item, 200);
    }

    /**
     * 准备项目集合用于响应。
     *
     * @param  array           $items   要格式化的项目数组。
     * @param  WP_REST_Request $request 请求对象。
     * @return WP_REST_Response 响应对象。
     */
    public function prepare_collection_for_response($items, $request) {
        $data = [];
        foreach ($items as $item) {
            $prepared_item = $this->prepare_item_for_response($item, $request);
            if ($prepared_item instanceof WP_REST_Response) {
                $data[] = $prepared_item->get_data();
            }
        }
        return new WP_REST_Response($data, 200);
    }

} 