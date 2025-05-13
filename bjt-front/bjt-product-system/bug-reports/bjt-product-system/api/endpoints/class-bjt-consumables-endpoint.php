<?php
/**
 * 耗材 API 端点
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
 * 耗材 API 端点类
 *
 * 处理耗材相关的API请求
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/api/endpoints
 * @author     BJT Team
 */
class BJT_Consumables_Endpoint {

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
        // 获取所有耗材
        register_rest_route($this->namespace, '/consumables', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_consumables'),
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
                    'material' => array(
                        'description' => '材质',
                        'type'        => 'string',
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
                'callback' => array($this, 'create_consumable'),
                'permission_callback' => array($this, 'create_item_permissions_check'),
                'args'     => $this->get_endpoint_args_for_item_schema(true),
            ),
            'schema' => array($this, 'get_item_schema'),
        ));

        // 获取特定耗材
        register_rest_route($this->namespace, '/consumables/(?P<id>\d+)', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_consumable'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args'     => array(
                    'id' => array(
                        'description' => '耗材ID',
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
                'callback' => array($this, 'update_consumable'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args'     => $this->get_endpoint_args_for_item_schema(false),
            ),
            array(
                'methods'  => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_consumable'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args'     => array(
                    'id' => array(
                        'description' => '耗材ID',
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

        // 获取与主机型号兼容的耗材
        register_rest_route($this->namespace, '/host-models/(?P<host_model_id>\d+)/consumables', array(
            array(
                'methods'  => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_compatible_consumables'),
                'permission_callback' => array($this, 'get_items_permissions_check'),
                'args'     => array(
                    'host_model_id' => array(
                        'description' => '主机型号ID',
                        'type'        => 'integer',
                        'required'    => true,
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
            'schema' => array($this, 'get_item_schema'),
        ));
    }

    /**
     * 获取所有耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_consumables($request) {
        $host_model_id = $request->get_param('host_model_id');
        $product_line_id = $request->get_param('product_line_id');
        $material = $request->get_param('material');
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

        if ($material) {
            $args['material'] = $material;
        }

        $consumables = $this->db->get_consumables($args);

        if (is_wp_error($consumables)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumables->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response($consumables, 200);
    }

    /**
     * 获取特定耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_consumable($request) {
        $id = $request->get_param('id');
        $lang = $request->get_param('lang') ?? 'zh';

        $consumable = $this->db->get_consumable($id);

        if (is_wp_error($consumable)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumable->get_error_message(),
            ), 404);
        }

        return new WP_REST_Response($consumable, 200);
    }

    /**
     * 获取与主机型号兼容的耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function get_compatible_consumables($request) {
        $host_model_id = $request->get_param('host_model_id');
        $status = $request->get_param('status') ?? 'publish';
        $lang = $request->get_param('lang') ?? 'zh';

        $consumables = $this->db->get_compatible_consumables($host_model_id, $status);

        if (is_wp_error($consumables)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumables->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response($consumables, 200);
    }

    /**
     * 创建耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function create_consumable($request) {
        $data = $this->prepare_item_for_database($request);

        // 验证必填字段
        $required_fields = array('model_number', 'part_number', 'name_zh', 'name_en');
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return new WP_REST_Response(array(
                    'success' => false,
                    'message' => sprintf(__('字段 %s 不能为空', 'bjt-product-system'), $field),
                ), 400);
            }
        }

        $consumable_id = $this->db->add_consumable($data);

        if (is_wp_error($consumable_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumable_id->get_error_message(),
            ), 500);
        }

        $consumable = $this->db->get_consumable($consumable_id);

        return new WP_REST_Response($consumable, 201);
    }

    /**
     * 更新耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function update_consumable($request) {
        $id = $request->get_param('id');
        $data = $this->prepare_item_for_database($request);

        // 检查记录是否存在
        $consumable = $this->db->get_consumable($id);
        if (is_wp_error($consumable)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumable->get_error_message(),
            ), 404);
        }

        $result = $this->db->update_consumable($id, $data);

        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $result->get_error_message(),
            ), 500);
        }

        $updated_consumable = $this->db->get_consumable($id);

        return new WP_REST_Response($updated_consumable, 200);
    }

    /**
     * 删除耗材
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    请求对象
     * @return   WP_REST_Response   响应对象
     */
    public function delete_consumable($request) {
        $id = $request->get_param('id');
        $force = $request->get_param('force') ?? false;

        // 检查记录是否存在
        $consumable = $this->db->get_consumable($id);
        if (is_wp_error($consumable)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $consumable->get_error_message(),
            ), 404);
        }

        $result = $this->db->delete_consumable($id, $force);

        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $result->get_error_message(),
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => __('耗材已成功删除', 'bjt-product-system'),
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
            'model_number',
            'part_number',
            'name_zh',
            'name_en',
            'description_zh',
            'description_en',
            'specifications_zh',
            'specifications_en',
            'application_models',
            'shape',
            'material',
            'brand',
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
            'model_number' => array(
                'description' => '耗材型号编码',
                'type'        => 'string',
                'required'    => $create_or_update,
            ),
            'part_number' => array(
                'description' => '耗材零件编号',
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
            'application_models' => array(
                'description' => '适用机型',
                'type'        => 'string',
            ),
            'shape' => array(
                'description' => '形状',
                'type'        => 'string',
            ),
            'material' => array(
                'description' => '材质',
                'type'        => 'string',
            ),
            'brand' => array(
                'description' => '品牌',
                'type'        => 'string',
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
     * 获取项目架构
     *
     * @since    1.0.0
     * @return   array   项目架构
     */
    public function get_item_schema() {
        return array(
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'consumable',
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
        return current_user_can('edit_bjt_consumables');
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
        return current_user_can('edit_bjt_consumables');
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
        return current_user_can('edit_bjt_consumables');
    }
} 