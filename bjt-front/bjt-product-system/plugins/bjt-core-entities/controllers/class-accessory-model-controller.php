<?php
/**
 * Accessory Model Controller
 * 
 * 处理配件型号相关的API请求
 */
class BJT_Accessory_Model_Controller extends BJT_API_Controller {
    
    protected $table_name;
    public $resource_name = 'accessory-models'; // API端点slug

    // 根据数据库表wp_bjt_accessory_models的字段设置可填充字段
    protected $fillable_fields = [
        'product_line_id',
        'model',
        'title_zh',
        'title_en',
        'description_zh',
        'description_en',
        'type',
        'image1_url',
        'image2_url',
        'explosion_diagram_pdf',
        'spec_pdf',
        'status',
        'sort_order'
    ];

    // 创建时必填字段
    protected $required_api_fields_for_create = [
        'product_line_id',
        'model',
        'title_zh',
        'title_en'
    ];

    /**
     * 构造函数
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_accessory_models';
        parent::__construct();
    }

    /**
     * 注册路由
     */
    public function register_routes() {
        register_rest_route('bjt/v1', '/' . $this->resource_name, array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args'                => $this->get_collection_params(),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'create_item'),
                'permission_callback' => array($this, 'check_write_permission'),
                'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            )
        ));

        register_rest_route('bjt/v1', '/' . $this->resource_name . '/(?P<id>[\d]+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        },
                        'required' => true
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array($this, 'update_item'),
                'permission_callback' => array($this, 'check_write_permission'),
                'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array($this, 'delete_item'),
                'permission_callback' => array($this, 'check_write_permission'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        },
                        'required' => true
                    ),
                ),
            )
        ));
    }

    /**
     * 获取单个配件型号的响应格式处理
     */
    protected function format_item_for_response($item_db_object) {
        $data = array(
            'id'                      => intval($item_db_object->id),
            'product_line_id'         => intval($item_db_object->product_line_id),
            'model'                   => $item_db_object->model,
            'title_zh'                => $item_db_object->title_zh,
            'title_en'                => $item_db_object->title_en,
            'description_zh'          => $item_db_object->description_zh,
            'description_en'          => $item_db_object->description_en,
            'type'                    => $item_db_object->type,
            'image1_url'              => $item_db_object->image1_url,
            'image2_url'              => $item_db_object->image2_url,
            'explosion_diagram_pdf'   => $item_db_object->explosion_diagram_pdf,
            'spec_pdf'                => $item_db_object->spec_pdf,
            'status'                  => $item_db_object->status,
            'sort_order'              => intval($item_db_object->sort_order),
            'created_at'              => $item_db_object->created_at,
            'updated_at'              => $item_db_object->updated_at
        );

        return $data;
    }

    /**
     * 创建配件型号
     */
    public function create_item($request) {
        global $wpdb;
        $params = $request->get_params();

        // 验证必填字段
        foreach ($this->required_api_fields_for_create as $field) {
            if (empty($params[$field])) {
                return $this->error_response("Missing required field: {$field}", 'missing_required_field', 400);
            }
        }

        // 检查product_line_id是否存在
        $product_line_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_product_lines WHERE id = %d",
            intval($params['product_line_id'])
        ));
        
        if (!$product_line_exists) {
            return $this->error_response("Product line with ID {$params['product_line_id']} does not exist.", 'product_line_not_found', 404);
        }

        // 检查同一产品线下是否已存在相同型号
        $existing_model = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE product_line_id = %d AND model = %s",
            intval($params['product_line_id']),
            $params['model']
        ));
        
        if ($existing_model) {
            return $this->error_response("Accessory model with code '{$params['model']}' already exists in this product line.", 'duplicate_model_code', 409);
        }

        $data_to_insert = array();
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_insert[$field] = $params[$field];
            }
        }

        // 设置默认状态
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish';
        }

        // 设置默认排序
        if (empty($data_to_insert['sort_order'])) {
            $data_to_insert['sort_order'] = 0;
        }

        // 执行插入
        $result = $wpdb->insert($this->table_name, $data_to_insert);
        if ($result === false) {
            return $this->error_response("Failed to create accessory model. Database error: " . $wpdb->last_error, 'db_error', 500);
        }

        $new_id = $wpdb->insert_id;
        $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_id));
        $formatted_item = $this->format_item_for_response($item);

        return $this->format_response($formatted_item, '配件型号创建成功', true, 201);
    }

    /**
     * 获取单个配件型号
     */
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid accessory model ID.', 'invalid_id', 400);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db) {
            return $this->error_response("Accessory model with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db);
        return $this->format_response($formatted_item, '获取配件型号详情成功');
    }

    /**
     * 更新配件型号
     */
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        $params = $request->get_params();

        if ($id <= 0) {
            return $this->error_response('Invalid accessory model ID.', 'invalid_id', 400);
        }

        // 检查是否存在
        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item) {
            return $this->error_response("Accessory model with ID {$id} not found.", 'not_found', 404);
        }

        // 如果修改了model，检查是否会与其他配件型号冲突
        if (isset($params['model']) && $params['model'] !== $existing_item->model) {
            $product_line_id = isset($params['product_line_id']) ? intval($params['product_line_id']) : $existing_item->product_line_id;
            
            $model_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} WHERE product_line_id = %d AND model = %s AND id != %d",
                $product_line_id,
                $params['model'],
                $id
            ));
            
            if ($model_exists) {
                return $this->error_response("Accessory model with code '{$params['model']}' already exists in this product line.", 'duplicate_model_code', 409);
            }
        }

        $data_to_update = array();
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_update[$field] = $params[$field];
            }
        }

        if (empty($data_to_update)) {
            return $this->error_response("No valid fields to update.", 'no_fields_to_update', 400);
        }

        // 执行更新
        $result = $wpdb->update(
            $this->table_name,
            $data_to_update,
            array('id' => $id)
        );

        if ($result === false) {
            return $this->error_response("Failed to update accessory model. Database error: " . $wpdb->last_error, 'db_error', 500);
        }

        $updated_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        $formatted_item = $this->format_item_for_response($updated_item);

        return $this->format_response($formatted_item, '配件型号更新成功');
    }

    /**
     * 删除配件型号
     */
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid accessory model ID.', 'invalid_id', 400);
        }

        // 检查是否存在
        $existing_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item) {
            return $this->error_response("Accessory model with ID {$id} not found.", 'not_found', 404);
        }

        // 检查是否有依赖关系 (这里可以检查accessories表中是否有使用此model的配件)
        $has_dependents = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_accessories WHERE model = %s",
            $existing_item->model
        ));
        
        if ($has_dependents > 0) {
            return $this->error_response("Cannot delete accessory model. It is being used by {$has_dependents} accessories.", 'has_dependents', 400);
        }

        // 执行删除
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $id)
        );

        if ($result === false) {
            return $this->error_response("Failed to delete accessory model. Database error: " . $wpdb->last_error, 'db_error', 500);
        }

        return $this->format_response(array('id' => $id), '配件型号删除成功');
    }

    /**
     * 获取配件型号列表
     */
    public function get_items($request) {
        global $wpdb;

        // 提取分页参数
        $pagination_params = $this->extract_pagination_params_from_request($request);
        $per_page = $pagination_params['per_page'];
        $offset = $pagination_params['offset'];
        
        // 构建WHERE子句
        $where_clauses = [];
        $where_values = [];

        // 状态筛选
        if ($request->get_param('status')) {
            $where_clauses[] = "status = %s";
            $where_values[] = sanitize_text_field($request->get_param('status'));
        } else {
            $where_clauses[] = "status = 'publish'";  // 默认只返回已发布的
        }

        // 产品线筛选
        if ($request->get_param('product_line_id')) {
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = absint($request->get_param('product_line_id'));
        }

        // 型号筛选
        if ($request->get_param('model')) {
            $where_clauses[] = "model = %s";
            $where_values[] = sanitize_text_field($request->get_param('model'));
        }

        // 类型筛选
        if ($request->get_param('type')) {
            $where_clauses[] = "type = %s";
            $where_values[] = sanitize_text_field($request->get_param('type'));
        }

        // 搜索功能
        if ($request->get_param('search')) {
            $search_term = '%' . $wpdb->esc_like(sanitize_text_field($request->get_param('search'))) . '%';
            $where_clauses[] = "(title_zh LIKE %s OR title_en LIKE %s OR model LIKE %s)";
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }

        // 构建完整的WHERE子句
        $where_sql = '';
        if (!empty($where_clauses)) {
            $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
        }

        // 处理排序
        $orderby = $request->get_param('orderby') ? sanitize_text_field($request->get_param('orderby')) : 'id';
        $order = $request->get_param('order') ? strtoupper(sanitize_text_field($request->get_param('order'))) : 'ASC';
        
        // 验证排序参数
        $valid_orderby_fields = ['id', 'product_line_id', 'model', 'title_zh', 'title_en', 'type', 'sort_order', 'status', 'created_at', 'updated_at'];
        if (!in_array($orderby, $valid_orderby_fields)) {
            $orderby = 'id';
        }
        
        $valid_order_values = ['ASC', 'DESC'];
        if (!in_array($order, $valid_order_values)) {
            $order = 'ASC';
        }
        
        $order_sql = "ORDER BY {$orderby} {$order}";

        // 获取总记录数
        $query = "SELECT COUNT(*) FROM {$this->table_name} {$where_sql}";
        $prepared_query = $where_values ? $wpdb->prepare($query, $where_values) : $query;
        $total_items = intval($wpdb->get_var($prepared_query));

        // 计算总页数
        $total_pages = ceil($total_items / $per_page);

        // 查询数据
        $query = "SELECT * FROM {$this->table_name} {$where_sql} {$order_sql} LIMIT %d OFFSET %d";
        $prepared_query = $wpdb->prepare(
            $where_values ? $wpdb->prepare($query, array_merge($where_values, [$per_page, $offset])) : $query,
            $per_page, $offset
        );
        $items = $wpdb->get_results($prepared_query);

        // 格式化响应数据
        $formatted_items = array_map(function($item) {
            return $this->format_item_for_response($item);
        }, $items);

        // 返回分页数据
        $response_data = [
            'items' => $formatted_items,
            'total' => $total_items,
            'page' => floor($offset / $per_page) + 1,
            'per_page' => $per_page,
            'total_pages' => $total_pages
        ];

        return $this->format_response($response_data, '获取配件型号列表成功');
    }

    /**
     * 从请求中提取分页参数
     */
    protected function extract_pagination_params_from_request($request) {
        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 10;
        
        // 限制每页数量
        $per_page = min(100, max(1, $per_page));
        $page = max(1, $page);
        
        $offset = ($page - 1) * $per_page;
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => $offset
        ];
    }

    /**
     * 获取分页参数定义
     */
    protected function get_pagination_arg_definitions() {
        return [
            'page' => [
                'description' => 'Current page of the collection.',
                'type'        => 'integer',
                'default'     => 1,
                'minimum'     => 1,
            ],
            'per_page' => [
                'description' => 'Maximum number of items to be returned in result set.',
                'type'        => 'integer',
                'default'     => 10,
                'minimum'     => 1,
                'maximum'     => 100,
            ],
        ];
    }

    /**
     * 检查是否有权限获取配件型号列表
     */
    public function get_items_permissions_check($request) {
        return true; // 任何已登录用户都可以获取列表
    }
    
    /**
     * 检查是否有权限获取单个配件型号
     */
    public function get_item_permissions_check($request) {
        return true; // 任何已登录用户都可以获取单个项目
    }
    
    /**
     * 检查是否有权限创建配件型号
     */
    public function create_item_permissions_check($request) {
        return true; // 临时允许所有用户创建
    }
    
    /**
     * 检查是否有权限更新配件型号
     */
    public function update_item_permissions_check($request) {
        return true; // 临时允许所有用户更新
    }
    
    /**
     * 检查是否有权限删除配件型号
     */
    public function delete_item_permissions_check($request) {
        return true; // 临时允许所有用户删除
    }
} 