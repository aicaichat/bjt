<?php
/**
 * Spare Part Model Controller
 * 
 * 处理备件型号相关的API请求
 */
class BJT_Spare_Part_Model_Controller extends BJT_API_Controller {
    
    protected $table_name;
    public $resource_name = 'spare-part-models'; // API端点slug

    // 根据数据库表wp_bjt_spare_part_models的字段设置可填充字段
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
        $this->table_name = $wpdb->prefix . 'bjt_spare_part_models';
    }

    /**
     * 注册路由
     */
    public function register_routes() {
        register_rest_route('bjt/v1', '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'create_item_permissions_check'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
            'schema' => [$this, 'get_item_schema'],
        ]);

        register_rest_route('bjt/v1', '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'get_item_permissions_check'],
                'args' => [
                    'id' => [
                        'validate_callback' => function($param, $request, $key) {
                            return is_numeric($param);
                        }
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'update_item_permissions_check'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'delete_item_permissions_check'],
                'args' => [
                    'force' => [
                        'type' => 'boolean',
                        'default' => false,
                        'description' => '强制删除，而不是将状态设置为trash',
                    ],
                ],
            ],
            'schema' => [$this, 'get_item_schema'],
        ]);
    }

    /**
     * 格式化数据库对象为API响应
     */
    protected function format_item_for_response($item_db_object) {
        $data = [
            'id' => (int) $item_db_object->id,
            'product_line_id' => (int) $item_db_object->product_line_id,
            'model' => $item_db_object->model,
            'title_zh' => $item_db_object->title_zh,
            'title_en' => $item_db_object->title_en,
            'description_zh' => $item_db_object->description_zh,
            'description_en' => $item_db_object->description_en,
            'type' => $item_db_object->type,
            'image1_url' => $item_db_object->image1_url,
            'image2_url' => $item_db_object->image2_url,
            'explosion_diagram_pdf' => $item_db_object->explosion_diagram_pdf,
            'spec_pdf' => $item_db_object->spec_pdf,
            'status' => $item_db_object->status,
            'sort_order' => (int) $item_db_object->sort_order,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at
        ];

        return $data;
    }

    /**
     * 创建新的备件型号
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

        $data_to_insert = [];
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_insert[$field] = $params[$field];
            }
        }

        // 默认状态如果未提供
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish';
        }

        // 检查产品线是否存在
        $product_line_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_product_lines WHERE id = %d",
                $data_to_insert['product_line_id']
            )
        );

        if (!$product_line_exists) {
            return $this->error_response(
                "Product line with ID {$data_to_insert['product_line_id']} does not exist.", 
                'product_line_not_found', 
                404
            );
        }

        // 检查型号是否已存在（同一产品线下）
        $model_exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} 
                 WHERE product_line_id = %d AND model = %s",
                $data_to_insert['product_line_id'],
                $data_to_insert['model']
            )
        );

        if ($model_exists) {
            return $this->error_response(
                "A spare part model with the same model code already exists in this product line.", 
                'duplicate_model_code', 
                409
            );
        }

        // 插入数据
        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if (false === $result) {
            return $this->error_response(
                "Failed to create spare part model.", 
                'db_error', 
                500
            );
        }

        $new_id = $wpdb->insert_id;
        $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_id));
        
        if (!$item) {
            return $this->error_response(
                "Failed to retrieve the created spare part model.", 
                'db_error', 
                500
            );
        }

        $formatted_item = $this->format_item_for_response($item);
        return $this->format_response($formatted_item, '备件型号创建成功', true, 201);
    }

    /**
     * 获取单个备件型号
     */
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid spare part model ID.', 'invalid_id', 400);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db) {
            return $this->error_response("Spare part model with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db);
        return $this->format_response($formatted_item, '获取备件型号详情成功');
    }

    /**
     * 更新备件型号
     */
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        $params = $request->get_params();

        if ($id <= 0) {
            return $this->error_response('Invalid spare part model ID.', 'invalid_id', 400);
        }

        // 检查备件型号是否存在
        $item_exists = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE id = %d", $id)
        );

        if (!$item_exists) {
            return $this->error_response("Spare part model with ID {$id} not found.", 'not_found', 404);
        }

        // 收集要更新的字段
        $data_to_update = [];
        foreach ($this->fillable_fields as $field) {
            if (isset($params[$field])) {
                $data_to_update[$field] = $params[$field];
            }
        }

        if (empty($data_to_update)) {
            return $this->error_response("No valid fields to update.", 'no_fields_to_update', 400);
        }

        // 如果尝试更新model，检查该model是否与其他记录冲突
        if (isset($data_to_update['model']) || isset($data_to_update['product_line_id'])) {
            // 先获取当前记录的product_line_id和model
            $current_item = $wpdb->get_row(
                $wpdb->prepare("SELECT product_line_id, model FROM {$this->table_name} WHERE id = %d", $id)
            );
            
            $product_line_id = isset($data_to_update['product_line_id']) ? 
                               $data_to_update['product_line_id'] : $current_item->product_line_id;
            
            $model = isset($data_to_update['model']) ? 
                     $data_to_update['model'] : $current_item->model;
            
            // 检查是否有其他记录使用相同的product_line_id和model
            $duplicate_exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$this->table_name} 
                     WHERE id != %d AND product_line_id = %d AND model = %s",
                    $id, $product_line_id, $model
                )
            );

            if ($duplicate_exists) {
                return $this->error_response(
                    "Another spare part model with the same model code already exists in this product line.", 
                    'duplicate_model_code', 
                    409
                );
            }
        }

        // 执行更新
        $result = $wpdb->update(
            $this->table_name,
            $data_to_update,
            ['id' => $id]
        );

        if (false === $result && 0 !== $wpdb->rows_affected) {
            return $this->error_response("Database error while updating spare part model.", 'db_error', 500);
        }

        // 获取更新后的记录
        $updated_item = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        $formatted_item = $this->format_item_for_response($updated_item);
        
        return $this->format_response($formatted_item, '备件型号更新成功');
    }

    /**
     * 删除备件型号
     */
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        $force = isset($request['force']) ? (bool) $request['force'] : false;

        if ($id <= 0) {
            return $this->error_response('Invalid spare part model ID.', 'invalid_id', 400);
        }

        // 检查备件型号是否存在
        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id)
        );

        if (!$item) {
            return $this->error_response("Spare part model with ID {$id} not found.", 'not_found', 404);
        }

        // 检查该备件型号是否被引用
        // 这里应该检查可能引用备件型号的表，例如备件表
        $is_referenced = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_spare_parts 
                 WHERE model = %s AND product_line_id = %d",
                $item->model,
                $item->product_line_id
            )
        );

        if ($is_referenced > 0 && !$force) {
            return $this->error_response(
                "This spare part model is referenced by {$is_referenced} spare parts and cannot be deleted. Use 'force=true' to delete anyway.", 
                'model_in_use', 
                400
            );
        }

        // 执行删除
        $deleted = $wpdb->delete(
            $this->table_name,
            ['id' => $id]
        );

        if (!$deleted) {
            return $this->error_response("Failed to delete spare part model.", 'db_error', 500);
        }

        // 如果强制删除，同时更新引用了该型号的备件记录
        if ($force && $is_referenced > 0) {
            $wpdb->update(
                $wpdb->prefix . 'bjt_spare_parts',
                ['status' => 'trash'],
                [
                    'model' => $item->model,
                    'product_line_id' => $item->product_line_id
                ]
            );
        }

        return $this->format_response(['id' => $id], '备件型号删除成功');
    }

    /**
     * 获取备件型号列表
     */
    public function get_items($request) {
        global $wpdb;

        $pagination_params = $this->extract_pagination_params_from_request($request);
        $per_page = $pagination_params['per_page'];
        $offset = $pagination_params['offset'];
        
        $where_clauses = ["status = 'publish'"]; // 默认查询已发布项
        $where_values = [];

        // 添加过滤条件
        if ($request->get_param('product_line_id')) {
            $where_clauses[] = "product_line_id = %d";
            $where_values[] = absint($request->get_param('product_line_id'));
        }

        if ($request->get_param('model')) {
            $where_clauses[] = "model = %s";
            $where_values[] = sanitize_text_field($request->get_param('model'));
        }

        if ($request->get_param('type')) {
            $where_clauses[] = "type = %s";
            $where_values[] = sanitize_text_field($request->get_param('type'));
        }

        if ($request->get_param('status')) {
            $where_clauses[] = "status = %s";
            $where_values[] = sanitize_text_field($request->get_param('status'));
        }

        if ($request->get_param('search')) {
            $search_term = '%' . $wpdb->esc_like(sanitize_text_field($request->get_param('search'))) . '%';
            $where_clauses[] = "(title_zh LIKE %s OR title_en LIKE %s OR model LIKE %s)";
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }

        // 构建WHERE子句
        $where_sql = implode(' AND ', $where_clauses);
        
        // 处理排序
        $orderby = $request->get_param('orderby') ? sanitize_sql_orderby($request->get_param('orderby')) : 'id';
        $order = $request->get_param('order') ? strtoupper(sanitize_text_field($request->get_param('order'))) : 'ASC';
        if (!in_array($order, ['ASC', 'DESC'])) {
            $order = 'ASC';
        }
        
        // 查询总记录数
        $count_query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE {$where_sql}",
            ...$where_values
        );
        $total_items = (int) $wpdb->get_var($count_query);
        
        // 查询分页数据
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE {$where_sql} 
             ORDER BY {$orderby} {$order} 
             LIMIT %d OFFSET %d",
            ...array_merge($where_values, [$per_page, $offset])
        );
        $items = $wpdb->get_results($query);
        
        if (!is_array($items)) {
            return $this->error_response("Database error while retrieving spare part models.", 'db_error', 500);
        }
        
        // 格式化响应数据
        $formatted_items = [];
        foreach ($items as $item) {
            $formatted_items[] = $this->format_item_for_response($item);
        }
        
        $total_pages = ceil($total_items / $per_page);
        
        $result = [
            'items' => $formatted_items,
            'total' => $total_items,
            'page' => (int) $pagination_params['page'],
            'per_page' => (int) $per_page,
            'total_pages' => $total_pages
        ];
        
        return $this->format_response($result, '获取备件型号列表成功');
    }

    /**
     * 从请求中提取分页参数
     */
    protected function extract_pagination_params_from_request($request) {
        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 10;
        
        // 限制每页数量
        $per_page = min(max($per_page, 1), 100);
        
        // 计算偏移量
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
                'description' => '当前页码',
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
            ],
            'per_page' => [
                'description' => '每页记录数',
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
            ],
        ];
    }

    /**
     * 获取集合参数
     */
    public function get_collection_params() {
        $query_params = [
            'product_line_id' => [
                'description' => '按产品线ID筛选',
                'type' => 'integer',
            ],
            'model' => [
                'description' => '按型号筛选',
                'type' => 'string',
            ],
            'type' => [
                'description' => '按类型筛选',
                'type' => 'string',
            ],
            'status' => [
                'description' => '按状态筛选',
                'type' => 'string',
                'enum' => ['publish', 'draft', 'trash'],
            ],
            'search' => [
                'description' => '搜索关键词',
                'type' => 'string',
            ],
            'orderby' => [
                'description' => '排序字段',
                'type' => 'string',
                'enum' => ['id', 'model', 'title_zh', 'title_en', 'type', 'sort_order', 'status', 'created_at', 'updated_at'],
                'default' => 'id',
            ],
            'order' => [
                'description' => '排序方向',
                'type' => 'string',
                'enum' => ['asc', 'desc', 'ASC', 'DESC'],
                'default' => 'ASC',
            ],
        ];
        
        return array_merge($query_params, $this->get_pagination_arg_definitions());
    }

    /**
     * 检查是否有权限获取备件型号列表
     */
    public function get_items_permissions_check($request) {
        return true; // 任何已登录用户都可以获取列表
    }
    
    /**
     * 检查是否有权限获取单个备件型号
     */
    public function get_item_permissions_check($request) {
        return true; // 任何已登录用户都可以获取单个项目
    }
    
    /**
     * 检查是否有权限创建备件型号
     */
    public function create_item_permissions_check($request) {
        return true; // 临时允许所有用户创建
    }
    
    /**
     * 检查是否有权限更新备件型号
     */
    public function update_item_permissions_check($request) {
        return true; // 临时允许所有用户更新
    }
    
    /**
     * 检查是否有权限删除备件型号
     */
    public function delete_item_permissions_check($request) {
        return true; // 临时允许所有用户删除
    }
} 