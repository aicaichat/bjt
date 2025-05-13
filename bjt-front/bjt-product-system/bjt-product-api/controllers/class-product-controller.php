<?php
/**
 * 产品控制器
 * 
 * 实现产品相关的API端点
 */

class BJT_Product_Controller extends BJT_API_Controller {
    protected $resource_name = 'product-lines';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        error_log("BJT_Product_Controller: register_routes CALLED"); // DEBUG LINE
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(true),
            ],
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) {
                            return is_numeric($value);
                        }
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(false),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) {
                            return is_numeric($value);
                        }
                    ],
                ],
            ],
        ]);
    }
    
    /**
     * 获取产品线列表
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_items($request) {
        $response_data = [
            'success' => true,
            'data' => [
                'message' => 'This is a hardcoded test response from Product Controller.',
                'items' => [['id' => 1, 'name' => 'Test Product']],
                'total' => 1,
                'page' => 1,
                'page_size' => 10,
                'total_pages' => 1
            ]
        ];
        $response = new WP_REST_Response($response_data, 200);
        // Explicitly set content type header to be sure
        $response->header('Content-Type', 'application/json; charset=' . get_option('blog_charset'));
        return $response;
    }
    
    /**
     * 获取单个产品线
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $lang = isset($request['lang']) ? sanitize_text_field($request['lang']) : 'zh';
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        
        if (!$product) {
            return $this->error_response('产品线不存在', 404, 404);
        }
        
        $item = $this->prepare_item_for_response($product, $lang);
        
        return rest_ensure_response($this->response($item));
    }
    
    /**
     * 创建产品线
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function create_item($request) {
        global $wpdb;
        
        $params = $request->get_params();
        
        // 验证必填字段
        if (empty($params['title_zh']) || empty($params['title_en']) || empty($params['code'])) {
            return $this->error_response('缺少必填字段', 400);
        }
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // 检查code是否已存在
        $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s", $params['code']));
        if ($existing) {
            return $this->error_response('产品线代码已存在', 400);
        }
        
        // 准备插入数据
        $data = [
            'title_zh' => sanitize_text_field($params['title_zh']),
            'title_en' => sanitize_text_field($params['title_en']),
            'description_zh' => isset($params['description_zh']) ? sanitize_textarea_field($params['description_zh']) : '',
            'description_en' => isset($params['description_en']) ? sanitize_textarea_field($params['description_en']) : '',
            'code' => sanitize_text_field($params['code']),
            'status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'publish',
            'sort_order' => isset($params['sort_order']) ? intval($params['sort_order']) : 0,
            'image_url' => isset($params['image_url']) ? esc_url_raw($params['image_url']) : '',
            'subitem1_zh' => isset($params['subitem1_zh']) ? sanitize_text_field($params['subitem1_zh']) : '',
            'subitem1_en' => isset($params['subitem1_en']) ? sanitize_text_field($params['subitem1_en']) : '',
            'subitem2_zh' => isset($params['subitem2_zh']) ? sanitize_text_field($params['subitem2_zh']) : '',
            'subitem2_en' => isset($params['subitem2_en']) ? sanitize_text_field($params['subitem2_en']) : '',
            'subitem3_zh' => isset($params['subitem3_zh']) ? sanitize_text_field($params['subitem3_zh']) : '',
            'subitem3_en' => isset($params['subitem3_en']) ? sanitize_text_field($params['subitem3_en']) : '',
        ];
        
        // 插入数据
        $result = $wpdb->insert($table_name, $data);
        
        if (false === $result) {
            return $this->error_response('创建产品线失败', 500);
        }
        
        $product_id = $wpdb->insert_id;
        
        // 获取创建的产品
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $product_id));
        $item = $this->prepare_item_for_response($product);
        
        return rest_ensure_response($this->response($item, '产品线创建成功'));
    }
    
    /**
     * 更新产品线
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function update_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $params = $request->get_params();
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // 检查产品线是否存在
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        if (!$product) {
            return $this->error_response('产品线不存在', 404);
        }
        
        // 如果更新code，检查是否与其他产品线冲突
        if (isset($params['code']) && $params['code'] !== $product->code) {
            $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s AND id != %d", $params['code'], $id));
            if ($existing) {
                return $this->error_response('产品线代码已存在', 400);
            }
        }
        
        // 准备更新数据
        $data = [];
        $fields = [
            'title_zh', 'title_en', 'description_zh', 'description_en', 'code', 
            'status', 'sort_order', 'image_url', 'subitem1_zh', 'subitem1_en', 
            'subitem2_zh', 'subitem2_en', 'subitem3_zh', 'subitem3_en'
        ];
        
        foreach ($fields as $field) {
            if (isset($params[$field])) {
                if (strpos($field, 'description') === 0) {
                    $data[$field] = sanitize_textarea_field($params[$field]);
                } elseif ($field === 'image_url') {
                    $data[$field] = esc_url_raw($params[$field]);
                } elseif ($field === 'sort_order') {
                    $data[$field] = intval($params[$field]);
                } else {
                    $data[$field] = sanitize_text_field($params[$field]);
                }
            }
        }
        
        // 更新数据
        if (!empty($data)) {
            $result = $wpdb->update($table_name, $data, ['id' => $id]);
            
            if (false === $result) {
                return $this->error_response('更新产品线失败', 500);
            }
        }
        
        // 获取更新后的产品
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        $item = $this->prepare_item_for_response($product);
        
        return rest_ensure_response($this->response($item, '产品线更新成功'));
    }
    
    /**
     * 删除产品线
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function delete_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // 检查产品线是否存在
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        if (!$product) {
            return $this->error_response('产品线不存在', 404);
        }
        
        // 删除产品线（实际是更新状态为deleted）
        $result = $wpdb->update(
            $table_name,
            ['status' => 'deleted'],
            ['id' => $id]
        );
        
        if (false === $result) {
            return $this->error_response('删除产品线失败', 500);
        }
        
        return rest_ensure_response($this->response(null, '产品线已删除'));
    }
    
    /**
     * 准备单个项目的响应
     *
     * @param object $item 产品线对象
     * @param string $lang 语言
     * @return array 格式化的数据
     */
    protected function prepare_item_for_response($item, $lang = 'zh') {
        // 根据语言选择标题和描述
        $title = $lang === 'en' ? $item->title_en : $item->title_zh;
        $description = $lang === 'en' ? $item->description_en : $item->description_zh;
        $subitem1 = $lang === 'en' ? $item->subitem1_en : $item->subitem1_zh;
        $subitem2 = $lang === 'en' ? $item->subitem2_en : $item->subitem2_zh;
        $subitem3 = $lang === 'en' ? $item->subitem3_en : $item->subitem3_zh;
        
        return [
            'id' => (int) $item->id,
            'title' => $title,
            'description' => $description,
            'code' => $item->code,
            'image_url' => $item->image_url,
            'status' => $item->status,
            'sort_order' => (int) $item->sort_order,
            'subitem1' => $subitem1,
            'subitem2' => $subitem2,
            'subitem3' => $subitem3,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
    
    /**
     * 获取集合参数
     *
     * @return array 参数定义
     */
    public function get_collection_params() {
        return [
            'page' => [
                'description' => '结果页码',
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
            ],
            'page_size' => [
                'description' => '每页结果数',
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
            ],
            'lang' => [
                'description' => '语言',
                'type' => 'string',
                'enum' => ['zh', 'en'],
                'default' => 'zh',
            ],
        ];
    }
    
    /**
     * 获取项目的模式参数
     *
     * @param bool $is_create 是否为创建操作
     * @return array 参数定义
     */
    public function get_endpoint_args_for_item_schema($is_create = false) {
        $args = [
            'title_zh' => [
                'description' => '产品线中文标题',
                'type' => 'string',
                'required' => $is_create,
            ],
            'title_en' => [
                'description' => '产品线英文标题',
                'type' => 'string',
                'required' => $is_create,
            ],
            'description_zh' => [
                'description' => '产品线中文描述',
                'type' => 'string',
            ],
            'description_en' => [
                'description' => '产品线英文描述',
                'type' => 'string',
            ],
            'code' => [
                'description' => '产品线代码',
                'type' => 'string',
                'required' => $is_create,
            ],
            'image_url' => [
                'description' => '产品线图片URL',
                'type' => 'string',
                'format' => 'uri',
            ],
            'status' => [
                'description' => '产品线状态',
                'type' => 'string',
                'enum' => ['publish', 'draft', 'private', 'deleted'],
                'default' => 'publish',
            ],
            'sort_order' => [
                'description' => '排序值',
                'type' => 'integer',
                'default' => 0,
            ],
            'subitem1_zh' => [
                'description' => '子项1中文',
                'type' => 'string',
            ],
            'subitem1_en' => [
                'description' => '子项1英文',
                'type' => 'string',
            ],
            'subitem2_zh' => [
                'description' => '子项2中文',
                'type' => 'string',
            ],
            'subitem2_en' => [
                'description' => '子项2英文',
                'type' => 'string',
            ],
            'subitem3_zh' => [
                'description' => '子项3中文',
                'type' => 'string',
            ],
            'subitem3_en' => [
                'description' => '子项3英文',
                'type' => 'string',
            ],
        ];
        
        return $args;
    }
} 