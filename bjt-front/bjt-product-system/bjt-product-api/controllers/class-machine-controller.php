<?php
/**
 * 机器（设备）控制器
 * 
 * 实现机器相关的API端点
 */

class BJT_Machine_Controller extends BJT_API_Controller {
    protected $resource_name = 'machines';
    
    /**
     * 注册路由
     */
    public function register_routes() {
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
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\w\-]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) {
                            return !empty($value);
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
                            return !empty($value);
                        }
                    ],
                ],
            ],
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\w\-]+)/accessories', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_machine_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'validate_callback' => function($value) {
                            return !empty($value);
                        }
                    ],
                    'level' => [
                        'required' => false,
                        'type' => 'integer',
                        'default' => 1,
                    ],
                ],
            ],
        ]);
    }
    
    /**
     * 获取机器列表
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_items($request) {
        global $wpdb;
        
        // 获取分页参数
        $pagination = $this->get_pagination_params($request);
        
        // 获取筛选参数
        $lang = isset($request['lang']) ? sanitize_text_field($request['lang']) : 'zh';
        $region = isset($request['region']) ? strtoupper(sanitize_text_field($request['region'])) : 'CN';
        $product_line_id = isset($request['product_line_id']) ? intval($request['product_line_id']) : 0;
        
        // 查询机器
        $table_name = $wpdb->prefix . 'bjt_machines';
        
        // 检查表是否存在
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
        
        if (!$table_exists) {
            // 如果表不存在，创建表
            BJT_Database::check_tables();
            
            // 给出响应
            return rest_ensure_response($this->response(
                ['items' => [], 'total' => 0, 'page' => 1, 'page_size' => 10, 'total_pages' => 0],
                '数据表初始化完成，暂无数据'
            ));
        }
        
        // 构建查询条件
        $where_conditions = ["status = 'publish'"];
        $where_params = [];
        
        if ($product_line_id > 0) {
            $where_conditions[] = "product_line_id = %d";
            $where_params[] = $product_line_id;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // 计算总记录数
        $query = "SELECT COUNT(*) FROM $table_name WHERE $where_clause";
        if (!empty($where_params)) {
            $query = $wpdb->prepare($query, $where_params);
        }
        $total_items = $wpdb->get_var($query);
        
        // 获取当前页数据
        $query = "SELECT * FROM $table_name WHERE $where_clause ORDER BY id ASC LIMIT %d OFFSET %d";
        $query_params = array_merge($where_params, [$pagination['page_size'], $pagination['offset']]);
        $machines = $wpdb->get_results($wpdb->prepare($query, $query_params));
        
        // 格式化数据
        $items = [];
        foreach ($machines as $machine) {
            $items[] = $this->prepare_item_for_response($machine, $lang, $region);
        }
        
        // 准备分页数据
        $data = [
            'items' => $items,
            'total' => (int) $total_items,
            'page' => $pagination['page'],
            'page_size' => $pagination['page_size'],
            'total_pages' => ceil($total_items / $pagination['page_size']),
        ];
        
        return rest_ensure_response($this->response($data));
    }
    
    /**
     * 获取单个机器
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $lang = isset($request['lang']) ? sanitize_text_field($request['lang']) : 'zh';
        $region = isset($request['region']) ? strtoupper(sanitize_text_field($request['region'])) : 'CN';
        
        $table_name = $wpdb->prefix . 'bjt_machines';
        
        // 尝试按ID或代码查找
        if (is_numeric($id)) {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        } else {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE code = %s", $id));
        }
        
        if (!$machine) {
            return $this->error_response('机器不存在', 404, 404);
        }
        
        $item = $this->prepare_item_for_response($machine, $lang, $region);
        
        return rest_ensure_response($this->response($item));
    }
    
    /**
     * 获取机器配件
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function get_machine_accessories($request) {
        global $wpdb;
        
        $machine_id = $request['id'];
        $level = isset($request['level']) ? intval($request['level']) : 1;
        $lang = isset($request['lang']) ? sanitize_text_field($request['lang']) : 'zh';
        $region = isset($request['region']) ? strtoupper(sanitize_text_field($request['region'])) : 'CN';
        
        // 确保机器存在
        $machines_table = $wpdb->prefix . 'bjt_machines';
        if (is_numeric($machine_id)) {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $machines_table WHERE id = %d", $machine_id));
        } else {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $machines_table WHERE code = %s", $machine_id));
        }
        
        if (!$machine) {
            return $this->error_response('机器不存在', 404, 404);
        }
        
        // 获取配件
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $accessories = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $accessories_table WHERE machine_id = %s AND level = %d AND status = 'publish'",
            $machine->code,
            $level
        ));
        
        // 格式化数据
        $items = [];
        foreach ($accessories as $accessory) {
            $items[] = $this->prepare_accessory_for_response($accessory, $lang, $region);
        }
        
        return rest_ensure_response($this->response($items));
    }
    
    /**
     * 创建机器
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function create_item($request) {
        // global $wpdb;
        // 
        // $params = $request->get_params();
        // 
        // // 验证必填字段
        // if (empty($params['title_zh']) || empty($params['title_en']) || empty($params['code'])) {
        //     return $this->error_response('缺少必填字段', 400);
        // }
        // 
        // $table_name = $wpdb->prefix . 'bjt_machines';
        // 
        // // 检查code是否已存在
        // $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s", $params['code']));
        // if ($existing) {
        //     return $this->error_response('机器代码已存在', 400);
        // }
        // 
        // // 准备插入数据
        // $data = [
        //     'title_zh' => sanitize_text_field($params['title_zh']),
        //     'title_en' => sanitize_text_field($params['title_en']),
        //     'description_zh' => isset($params['description_zh']) ? sanitize_textarea_field($params['description_zh']) : '',
        //     'description_en' => isset($params['description_en']) ? sanitize_textarea_field($params['description_en']) : '',
        //     'code' => sanitize_text_field($params['code']),
        //     'product_line_id' => isset($params['product_line_id']) ? intval($params['product_line_id']) : 0,
        //     'price_cny' => isset($params['price_cny']) ? floatval($params['price_cny']) : 0,
        //     'price_usd' => isset($params['price_usd']) ? floatval($params['price_usd']) : 0,
        //     'price_eur' => isset($params['price_eur']) ? floatval($params['price_eur']) : 0,
        //     'image_url' => isset($params['image_url']) ? esc_url_raw($params['image_url']) : '',
        //     'specs_json' => isset($params['specs_json']) ? wp_json_encode($params['specs_json']) : '',
        //     'status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'publish',
        // ];
        // 
        // // 插入数据
        // $result = $wpdb->insert($table_name, $data);
        // 
        // if (false === $result) {
        //     return $this->error_response('创建机器失败', 500);
        // }
        // 
        // $machine_id = $wpdb->insert_id;
        // 
        // // 获取创建的机器
        // $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $machine_id));
        // $item = $this->prepare_item_for_response($machine);
        // 
        // return rest_ensure_response($this->response($item, '机器创建成功'));
        error_log("BJT_Machine_Controller: create_item CALLED (body commented out)");
        return $this->error_response('Create item temporarily disabled for debugging', 501);
    }
    
    /**
     * 更新机器
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function update_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $params = $request->get_params();
        
        $table_name = $wpdb->prefix . 'bjt_machines';
        
        // 尝试按ID或代码查找
        if (is_numeric($id)) {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        } else {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE code = %s", $id));
        }
        
        if (!$machine) {
            return $this->error_response('机器不存在', 404);
        }
        
        // 如果更新code，检查是否与其他机器冲突
        if (isset($params['code']) && $params['code'] !== $machine->code) {
            $existing = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_name WHERE code = %s AND id != %d", $params['code'], $machine->id));
            if ($existing) {
                return $this->error_response('机器代码已存在', 400);
            }
        }
        
        // 准备更新数据
        $data = [];
        $fields = [
            'title_zh', 'title_en', 'description_zh', 'description_en', 'code', 
            'product_line_id', 'price_cny', 'price_usd', 'price_eur', 
            'image_url', 'specs_json', 'status'
        ];
        
        foreach ($fields as $field) {
            if (isset($params[$field])) {
                if (strpos($field, 'description') === 0) {
                    $data[$field] = sanitize_textarea_field($params[$field]);
                } elseif ($field === 'image_url') {
                    $data[$field] = esc_url_raw($params[$field]);
                } elseif ($field === 'specs_json') {
                    $data[$field] = wp_json_encode($params[$field]);
                } elseif (strpos($field, 'price_') === 0) {
                    $data[$field] = floatval($params[$field]);
                } elseif ($field === 'product_line_id') {
                    $data[$field] = intval($params[$field]);
                } else {
                    $data[$field] = sanitize_text_field($params[$field]);
                }
            }
        }
        
        // 更新数据
        if (!empty($data)) {
            $result = $wpdb->update($table_name, $data, ['id' => $machine->id]);
            
            if (false === $result) {
                return $this->error_response('更新机器失败', 500);
            }
        }
        
        // 获取更新后的机器
        $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $machine->id));
        $item = $this->prepare_item_for_response($machine);
        
        return rest_ensure_response($this->response($item, '机器更新成功'));
    }
    
    /**
     * 删除机器
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function delete_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        
        $table_name = $wpdb->prefix . 'bjt_machines';
        
        // 尝试按ID或代码查找
        if (is_numeric($id)) {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        } else {
            $machine = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE code = %s", $id));
        }
        
        if (!$machine) {
            return $this->error_response('机器不存在', 404);
        }
        
        // 删除机器（实际是更新状态为deleted）
        $result = $wpdb->update(
            $table_name,
            ['status' => 'deleted'],
            ['id' => $machine->id]
        );
        
        if (false === $result) {
            return $this->error_response('删除机器失败', 500);
        }
        
        return rest_ensure_response($this->response(null, '机器已删除'));
    }
    
    /**
     * 准备单个机器的响应
     *
     * @param object $item 机器对象
     * @param string $lang 语言
     * @param string $region 区域
     * @return array 格式化的数据
     */
    protected function prepare_item_for_response($item, $lang = 'zh', $region = 'CN') {
        // 根据语言选择标题和描述
        $title = $lang === 'en' ? $item->title_en : $item->title_zh;
        $description = $lang === 'en' ? $item->description_en : $item->description_zh;
        
        // 根据区域获取价格
        $price_field = bjt_get_price_field_by_region($region);
        $price = $item->$price_field;
        
        // 处理规格
        $specs = [];
        if (!empty($item->specs_json)) {
            $specs_data = json_decode($item->specs_json, true);
            if (is_array($specs_data)) {
                // 根据语言筛选规格
                foreach ($specs_data as $spec) {
                    if (isset($spec['name_' . $lang])) {
                        $specs[] = [
                            'name' => $spec['name_' . $lang],
                            'value' => $spec['value_' . $lang] ?? $spec['value'],
                        ];
                    }
                }
            }
        }
        
        return [
            'id' => (int) $item->id,
            'title' => $title,
            'description' => $description,
            'code' => $item->code,
            'product_line_id' => (int) $item->product_line_id,
            'price' => (float) $price,
            'currency' => bjt_get_currency_by_region($region),
            'image_url' => $item->image_url,
            'specs' => $specs,
            'status' => $item->status,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
    
    /**
     * 准备单个配件的响应
     *
     * @param object $item 配件对象
     * @param string $lang 语言
     * @param string $region 区域
     * @return array 格式化的数据
     */
    protected function prepare_accessory_for_response($item, $lang = 'zh', $region = 'CN') {
        // 根据语言选择标题和描述
        $title = $lang === 'en' ? $item->title_en : $item->title_zh;
        $description = $lang === 'en' ? $item->description_en : $item->description_zh;
        
        // 根据区域获取价格
        $price_field = bjt_get_price_field_by_region($region);
        $price = $item->$price_field;
        
        // 处理规格
        $specs = [];
        if (!empty($item->specs_json)) {
            $specs_data = json_decode($item->specs_json, true);
            if (is_array($specs_data)) {
                // 根据语言筛选规格
                foreach ($specs_data as $spec) {
                    if (isset($spec['name_' . $lang])) {
                        $specs[] = [
                            'name' => $spec['name_' . $lang],
                            'value' => $spec['value_' . $lang] ?? $spec['value'],
                        ];
                    }
                }
            }
        }
        
        return [
            'id' => (int) $item->id,
            'title' => $title,
            'description' => $description,
            'code' => $item->code,
            'machine_id' => $item->machine_id,
            'parent_id' => (int) $item->parent_id,
            'level' => (int) $item->level,
            'is_required' => (bool) $item->is_required,
            'price' => (float) $price,
            'currency' => bjt_get_currency_by_region($region),
            'image_url' => $item->image_url,
            'specs' => $specs,
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
            'region' => [
                'description' => '区域',
                'type' => 'string',
                'enum' => ['CN', 'EU', 'NA', 'AU'],
                'default' => 'CN',
            ],
            'product_line_id' => [
                'description' => '产品线ID',
                'type' => 'integer',
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
                'description' => '机器中文标题',
                'type' => 'string',
                'required' => $is_create,
            ],
            'title_en' => [
                'description' => '机器英文标题',
                'type' => 'string',
                'required' => $is_create,
            ],
            'description_zh' => [
                'description' => '机器中文描述',
                'type' => 'string',
            ],
            'description_en' => [
                'description' => '机器英文描述',
                'type' => 'string',
            ],
            'code' => [
                'description' => '机器代码',
                'type' => 'string',
                'required' => $is_create,
            ],
            'product_line_id' => [
                'description' => '所属产品线ID',
                'type' => 'integer',
            ],
            'price_cny' => [
                'description' => '人民币价格',
                'type' => 'number',
                'default' => 0,
            ],
            'price_usd' => [
                'description' => '美元价格',
                'type' => 'number',
                'default' => 0,
            ],
            'price_eur' => [
                'description' => '欧元价格',
                'type' => 'number',
                'default' => 0,
            ],
            'image_url' => [
                'description' => '机器图片URL',
                'type' => 'string',
                'format' => 'uri',
            ],
            'specs_json' => [
                'description' => '机器规格',
                'type' => 'object',
            ],
            'status' => [
                'description' => '机器状态',
                'type' => 'string',
                'enum' => ['publish', 'draft', 'private', 'deleted'],
                'default' => 'publish',
            ],
        ];
        
        return $args;
    }
} 