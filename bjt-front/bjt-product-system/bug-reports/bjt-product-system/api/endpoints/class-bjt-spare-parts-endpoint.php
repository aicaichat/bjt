<?php
/**
 * 备件 API 端点
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * 备件 API 端点类
 *
 * 处理备件相关的API请求
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 * @author     BJT Team
 */
class BJT_Spare_Parts_Endpoint {

    /**
     * API命名空间
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $namespace    API命名空间
     */
    private $namespace;

    /**
     * 数据库实例
     *
     * @since    1.0.0
     * @access   private
     * @var      BJT_Product_System_DB    $db    数据库实例
     */
    private $db;

    /**
     * 构造函数
     *
     * @since    1.0.0
     * @param    string    $namespace    API命名空间
     */
    public function __construct($namespace) {
        $this->namespace = $namespace;
        $this->db = new BJT_Product_System_DB();
    }

    /**
     * 注册路由
     *
     * @since    1.0.0
     */
    public function register_routes() {
        // 获取所有备件
        register_rest_route($this->namespace, '/spare-parts', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_spare_parts'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args'     => array(
                    'host_model_id' => array(
                        'description' => '主机型号ID',
                        'type'        => 'integer',
                    ),
                    'product_line_id' => array(
                        'description' => '产品线ID',
                        'type'        => 'integer',
                    ),
                    'status' => array(
                        'description' => '状态',
                        'type'        => 'string',
                        'enum'        => array('publish', 'draft', 'trash', 'any'),
                        'default'     => 'publish',
                    ),
                    'lang' => array(
                        'description' => '语言',
                        'type'        => 'string',
                        'enum'        => array('zh', 'en'),
                        'default'     => 'zh',
                    ),
                ),
            ),
            array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_spare_part'),
                'permission_callback' => array($this, 'create_item_permissions_check'),
                'args'     => $this->get_endpoint_args_for_item_schema(true),
            ),
            'schema' => array($this, 'get_item_schema'),
        ));

        // 获取特定备件
        register_rest_route($this->namespace, '/spare-parts/(?P<id>\d+)', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_spare_part'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args'     => array(
                    'id' => array(
                        'description' => '备件ID',
                        'type'        => 'integer',
                        'required'    => true,
                    ),
                    'lang' => array(
                        'description' => '语言',
                        'type'        => 'string',
                        'enum'        => array('zh', 'en'),
                        'default'     => 'zh',
                    ),
                ),
            ),
            array(
                'methods'  => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_spare_part'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args'     => $this->get_endpoint_args_for_item_schema(false),
            ),
            array(
                'methods'  => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_spare_part'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args'     => array(
                    'id' => array(
                        'description' => '备件ID',
                        'type'        => 'integer',
                        'required'    => true,
                    ),
                    'force' => array(
                        'description' => '是否强制删除（否则移至回收站）',
                        'type'        => 'boolean',
                        'default'     => false,
                    ),
                ),
            ),
            'schema' => array($this, 'get_item_schema'),
        ));

        // 获取备件维护计划
        register_rest_route($this->namespace, '/spare-parts/(?P<id>\d+)/maintenance-schedule', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_maintenance_schedule'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args'     => array(
                    'id' => array(
                        'description' => '备件ID',
                        'type'        => 'integer',
                        'required'    => true,
                    ),
                ),
            ),
            'schema' => array($this, 'get_maintenance_schedule_schema'),
        ));
    }

    /**
     * 获取所有备件
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_spare_parts($request) {
        $host_model_id = $request->get_param('host_model_id');
        $product_line_id = $request->get_param('product_line_id');
        $status = $request->get_param('status') ?? 'publish';
        $lang = $request->get_param('lang') ?? 'zh';

        $args = array(
            'status' => $status,
        );

        if ($host_model_id) {
            $args['host_model_id'] = $host_model_id;
        }

        if ($product_line_id) {
            $args['product_line_id'] = $product_line_id;
        }

        $spare_parts = $this->db->get_spare_parts($args);

        if (is_wp_error($spare_parts)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_parts->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $spare_parts
        ), 200);
    }

    /**
     * 获取特定备件
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_spare_part($request) {
        $id = $request->get_param('id');
        $lang = $request->get_param('lang') ?? 'zh';

        $spare_part = $this->db->get_spare_part($id);

        if (is_wp_error($spare_part)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_part->get_error_message(),
            ), 404);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $spare_part
        ), 200);
    }

    /**
     * 获取备件维护计划
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_maintenance_schedule($request) {
        $id = $request->get_param('id');

        // 检查备件是否存在
        $spare_part = $this->db->get_spare_part($id);
        if (is_wp_error($spare_part)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_part->get_error_message(),
            ), 404);
        }

        // 获取维护计划数据
        $maintenance_schedule = $this->db->get_spare_part_maintenance_schedule($id);

        if (is_wp_error($maintenance_schedule)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $maintenance_schedule->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $maintenance_schedule
        ), 200);
    }

    /**
     * 创建备件
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function create_spare_part($request) {
        $data = $this->prepare_item_for_database($request);

        // 验证必填字段
        $required_fields = array('application_model', 'part_number', 'name_zh', 'name_en');
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => sprintf(__('字段 %s 不能为空', 'bjt-product-system'), $field),
                ), 400);
            }
        }

        $spare_part_id = $this->db->add_spare_part($data);

        if (is_wp_error($spare_part_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_part_id->get_error_message(),
            ), 500);
        }

        $spare_part = $this->db->get_spare_part($spare_part_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $spare_part
        ), 201);
    }

    /**
     * 更新备件
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function update_spare_part($request) {
        $id = $request->get_param('id');
        $data = $this->prepare_item_for_database($request);

        // 检查记录是否存在
        $spare_part = $this->db->get_spare_part($id);
        if (is_wp_error($spare_part)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_part->get_error_message(),
            ), 404);
        }

        $result = $this->db->update_spare_part($id, $data);

        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $result->get_error_message(),
            ), 500);
        }

        $updated_spare_part = $this->db->get_spare_part($id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $updated_spare_part
        ), 200);
    }

    /**
     * 删除备件
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function delete_spare_part($request) {
        $id = $request->get_param('id');
        $force = $request->get_param('force') ?? false;

        // 检查记录是否存在
        $spare_part = $this->db->get_spare_part($id);
        if (is_wp_error($spare_part)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $spare_part->get_error_message(),
            ), 404);
        }

        $result = $this->db->delete_spare_part($id, $force);

        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $result->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('备件已成功删除', 'bjt-product-system'),
        ), 200);
    }

    /**
     * 准备数据用于数据库
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   array              处理后的数据
     */
    private function prepare_item_for_database($request) {
        $data = array();
        $params = $request->get_params();

        // 允许修改的字段
        $allowed_fields = array(
            'application_model',
            'part_number',
            'name_zh',
            'name_en',
            'description_zh',
            'description_en',
            'specifications_zh',
            'specifications_en',
            'consumable_status',
            'replacement_cycle',
            'image_url',
            'price',
            'sale_price',
            'inventory',
            'status',
            'sort_order',
        );

        foreach ($allowed_fields as $field) {
            if (isset($params[$field])) {
                $data[$field] = $params[$field];
            }
        }

        return $data;
    }

    /**
     * 获取端点参数
     *
     * @since    1.0.0
     * @param    bool    $create_or_update    是否是创建或更新操作
     * @return   array   端点参数
     */
    private function get_endpoint_args_for_item_schema($create_or_update = false) {
        $args = array(
            'application_model' => array(
                'description' => '适用机型',
                'type'        => 'string',
                'required'    => $create_or_update,
            ),
            'part_number' => array(
                'description' => '零件编号',
                'type'        => 'string',
                'required'    => $create_or_update,
            ),
            'name_zh' => array(
                'description' => '中文名称',
                'type'        => 'string',
                'required'    => $create_or_update,
            ),
            'name_en' => array(
                'description' => '英文名称',
                'type'        => 'string',
                'required'    => $create_or_update,
            ),
            'description_zh' => array(
                'description' => '中文描述',
                'type'        => 'string',
            ),
            'description_en' => array(
                'description' => '英文描述',
                'type'        => 'string',
            ),
            'specifications_zh' => array(
                'description' => '中文规格',
                'type'        => 'string',
            ),
            'specifications_en' => array(
                'description' => '英文规格',
                'type'        => 'string',
            ),
            'consumable_status' => array(
                'description' => '消耗品状态',
                'type'        => 'string',
                'enum'        => array('yes', 'no'),
                'default'     => 'no',
            ),
            'replacement_cycle' => array(
                'description' => '更换周期（天）',
                'type'        => 'integer',
            ),
            'image_url' => array(
                'description' => '图片URL',
                'type'        => 'string',
                'format'      => 'uri',
            ),
            'price' => array(
                'description' => '价格',
                'type'        => 'number',
                'format'      => 'float',
            ),
            'sale_price' => array(
                'description' => '促销价格',
                'type'        => 'number',
                'format'      => 'float',
            ),
            'inventory' => array(
                'description' => '库存数量',
                'type'        => 'integer',
                'default'     => 0,
            ),
            'status' => array(
                'description' => '状态',
                'type'        => 'string',
                'enum'        => array('publish', 'draft', 'trash'),
                'default'     => 'publish',
            ),
            'sort_order' => array(
                'description' => '排序',
                'type'        => 'integer',
                'default'     => 0,
            ),
        );

        return $args;
    }

    /**
     * 获取维护计划架构
     *
     * @since    1.0.0
     * @return   array   维护计划架构
     */
    public function get_maintenance_schedule_schema() {
        return array(
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'maintenance_schedule',
            'type'       => 'object',
            'properties' => array(
                'part_id' => array(
                    'description' => '备件ID',
                    'type'        => 'integer',
                ),
                'part_name' => array(
                    'description' => '备件名称',
                    'type'        => 'string',
                ),
                'cycle' => array(
                    'description' => '维护周期（天）',
                    'type'        => 'integer',
                ),
                'procedures' => array(
                    'description' => '维护步骤',
                    'type'        => 'array',
                    'items'       => array(
                        'type'       => 'object',
                        'properties' => array(
                            'step'        => array(
                                'description' => '步骤编号',
                                'type'        => 'integer',
                            ),
                            'description' => array(
                                'description' => '步骤描述',
                                'type'        => 'string',
                            ),
                            'tools'       => array(
                                'description' => '所需工具',
                                'type'        => 'string',
                            ),
                        ),
                    ),
                ),
                'tips' => array(
                    'description' => '维护提示',
                    'type'        => 'array',
                    'items'       => array(
                        'type' => 'string',
                    ),
                ),
            ),
        );
    }

    /**
     * 获取项目架构
     *
     * @since    1.0.0
     * @return   array   项目架构
     */
    public function get_item_schema() {
        return array(
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'spare_part',
            'type'       => 'object',
            'properties' => $this->get_endpoint_args_for_item_schema(),
        );
    }

    /**
     * 获取项目权限检查
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function get_items_permissions_check($request) {
        return true; // 公开访问
    }

    /**
     * 获取单个项目权限检查
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function get_item_permissions_check($request) {
        return true; // 公开访问
    }

    /**
     * 创建项目权限检查
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function create_item_permissions_check($request) {
        // 检查用户是否有编辑权限
        return current_user_can('edit_bjt_spare_parts');
    }

    /**
     * 更新项目权限检查
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function update_item_permissions_check($request) {
        // 检查用户是否有编辑权限
        return current_user_can('edit_bjt_spare_parts');
    }

    /**
     * 删除项目权限检查
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   bool|WP_Error      是否有权限
     */
    public function delete_item_permissions_check($request) {
        // 检查用户是否有编辑权限
        return current_user_can('edit_bjt_spare_parts');
    }
} 