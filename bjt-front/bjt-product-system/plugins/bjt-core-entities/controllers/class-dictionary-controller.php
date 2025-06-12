<?php
/**
 * 数据字典控制器
 * 负责提供数据字典API接口
 */
class BJT_Dictionary_Controller extends BJT_API_Controller {
    protected $rest_base = 'dictionaries';
    
    public function __construct() {
        $this->namespace = 'bjt/v1';
        parent::__construct();
    }
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 获取所有数据字典类型
        register_rest_route($this->namespace, '/' . $this->rest_base . '/types', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_dictionary_types'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
            ],
        ]);
        
        // 获取特定类型的数据字典项
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<type>[a-zA-Z0-9_-]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_dictionary_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => [
                    'type' => [
                        'description' => __('Dictionary type'),
                        'type' => 'string',
                        'required' => true,
                    ],
                    'lang' => [
                        'description' => __('Language code'),
                        'type' => 'string',
                        'default' => 'zh',
                        'enum' => ['zh', 'en'],
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_dictionary_item'],
                'permission_callback' => [$this, 'create_items_permissions_check'],
                'args' => [
                    'type' => [
                        'description' => __('Dictionary type'),
                        'type' => 'string',
                        'required' => true,
                    ],
                ],
            ],
        ]);
        
        // 单个字典项的操作（获取、更新、删除）
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<type>[a-zA-Z0-9_-]+)/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_dictionary_item'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
                'args' => [
                    'type' => [
                        'description' => __('Dictionary type'),
                        'type' => 'string',
                        'required' => true,
                    ],
                    'id' => [
                        'description' => __('Item ID'),
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_dictionary_item'],
                'permission_callback' => [$this, 'update_items_permissions_check'],
                'args' => [
                    'type' => [
                        'description' => __('Dictionary type'),
                        'type' => 'string',
                        'required' => true,
                    ],
                    'id' => [
                        'description' => __('Item ID'),
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_dictionary_item'],
                'permission_callback' => [$this, 'delete_items_permissions_check'],
                'args' => [
                    'type' => [
                        'description' => __('Dictionary type'),
                        'type' => 'string',
                        'required' => true,
                    ],
                    'id' => [
                        'description' => __('Item ID'),
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
        ]);
    }
    
    /**
     * 获取所有数据字典类型
     */
    public function get_dictionary_types($request) {
        $types = [
            'machine_types' => __('Machine Types'),
            'product_lines' => __('Product Lines'),
            'regions' => __('Regions'),
            'currencies' => __('Currencies'),
            'order_statuses' => __('Order Statuses'),
            'payment_methods' => __('Payment Methods'),
            'shapes' => __('Shapes'),
            'materials' => __('Materials'),
            'specifications' => __('Specifications'),
            'host_models' => __('Host Models'),
            
            // 新增的字典类型
            'units' => __('Units'),
            'voltages' => __('Voltages'),
            'frequencies' => __('Frequencies'),
            'bag_types' => __('Bag Types'),
            'brands' => __('Brands'),
            'statuses' => __('Statuses'),
            'countries' => __('Countries'),
            'user_roles' => __('User Roles'),
            'product_types' => __('Product Types'),
        ];
        
        return $this->format_response([
            'types' => $types
        ]);
    }
    
    /**
     * 获取特定类型的数据字典项
     */
    public function get_dictionary_items($request) {
        global $wpdb;
        $type = $request['type'];
        $lang = $request->get_param('lang') ?: 'zh';
        
        $items = [];
        
        switch ($type) {
            case 'machine_types':
                $items = [
                    ['code' => 'small', 'name_zh' => '小型', 'name_en' => 'Small'],
                    ['code' => 'medium', 'name_zh' => '中型', 'name_en' => 'Medium'],
                    ['code' => 'large', 'name_zh' => '大型', 'name_en' => 'Large'],
                ];
                break;
                
            case 'product_lines':
                $table_name = $wpdb->prefix . 'bjt_product_lines';
                $query = $wpdb->prepare("
                    SELECT id, code, title_zh, title_en, status, sort_order 
                    FROM {$table_name} 
                    WHERE status = %s
                    ORDER BY sort_order ASC, id ASC
                ", 'publish');
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        $items[] = [
                            'id' => (int) $row->id,
                            'code' => trim($row->code, '"\''),
                            'name_zh' => trim($row->title_zh, '"\''),
                            'name_en' => trim($row->title_en, '"\''),
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                }
                break;
                
            case 'regions':
                $items = [
                    ['code' => 'CN', 'name_zh' => '中国', 'name_en' => 'China'],
                    ['code' => 'US', 'name_zh' => '美国', 'name_en' => 'United States'],
                    ['code' => 'EU', 'name_zh' => '欧盟', 'name_en' => 'European Union'],
                    ['code' => 'JP', 'name_zh' => '日本', 'name_en' => 'Japan'],
                ];
                break;
                
            case 'currencies':
                $items = [
                    ['code' => 'CNY', 'name_zh' => '人民币', 'name_en' => 'Chinese Yuan', 'symbol' => '¥'],
                    ['code' => 'USD', 'name_zh' => '美元', 'name_en' => 'US Dollar', 'symbol' => '$'],
                    ['code' => 'EUR', 'name_zh' => '欧元', 'name_en' => 'Euro', 'symbol' => '€'],
                    ['code' => 'JPY', 'name_zh' => '日元', 'name_en' => 'Japanese Yen', 'symbol' => '¥'],
                ];
                break;
                
            case 'order_statuses':
                $items = [
                    ['code' => 'pending_payment', 'name_zh' => '待付款', 'name_en' => 'Pending Payment'],
                    ['code' => 'processing', 'name_zh' => '处理中', 'name_en' => 'Processing'],
                    ['code' => 'shipped', 'name_zh' => '已发货', 'name_en' => 'Shipped'],
                    ['code' => 'completed', 'name_zh' => '已完成', 'name_en' => 'Completed'],
                    ['code' => 'cancelled', 'name_zh' => '已取消', 'name_en' => 'Cancelled'],
                    ['code' => 'refunded', 'name_zh' => '已退款', 'name_en' => 'Refunded'],
                    ['code' => 'failed', 'name_zh' => '失败', 'name_en' => 'Failed'],
                ];
                break;
                
            case 'payment_methods':
                $items = [
                    ['code' => 'online', 'name_zh' => '在线支付', 'name_en' => 'Online Payment'],
                    ['code' => 'transfer', 'name_zh' => '银行转账', 'name_en' => 'Bank Transfer'],
                    ['code' => 'cod', 'name_zh' => '货到付款', 'name_en' => 'Cash on Delivery'],
                ];
                break;
                
            case 'shapes':
                $table_name = $wpdb->prefix . 'bjt_shapes';
                $query = $wpdb->prepare("
                    SELECT id, product_line_id, code, name_zh, name_en, image_url, image_url2, status, sort_order 
                    FROM {$table_name} 
                    WHERE status = %s
                    ORDER BY sort_order ASC, id ASC
                ", 'publish');
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        $items[] = [
                            'id' => (int) $row->id,
                            'product_line_id' => (int) $row->product_line_id,
                            'code' => trim($row->code, '"\''),
                            'name_zh' => trim($row->name_zh, '"\''),
                            'name_en' => trim($row->name_en, '"\''),
                            'image_url' => trim($row->image_url, '"\''),
                            'image_url2' => trim($row->image_url2, '"\''),
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                }
                break;
                
            case 'materials':
                $table_name = $wpdb->prefix . 'bjt_materials';
                $query = $wpdb->prepare("
                    SELECT id, product_line_id, code, name_zh, name_en, status, sort_order 
                    FROM {$table_name} 
                    WHERE status = %s
                    ORDER BY sort_order ASC, id ASC
                ", 'publish');
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        $items[] = [
                            'id' => (int) $row->id,
                            'product_line_id' => (int) $row->product_line_id,
                            'code' => trim($row->code, '"\''),
                            'name_zh' => trim($row->name_zh, '"\''),
                            'name_en' => trim($row->name_en, '"\''),
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                }
                break;
                
            case 'specifications':
                $table_name = $wpdb->prefix . 'bjt_specifications';
                $query = $wpdb->prepare("
                    SELECT id, product_line_id, spec_type, metric_value, metric_unit, 
                    imperial_value, imperial_unit, status, sort_order 
                    FROM {$table_name} 
                    WHERE status = %s
                    ORDER BY sort_order ASC, id ASC
                ", 'publish');
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        // 根据spec_type生成中英文名称
                        $name_zh = '';
                        $name_en = '';
                        
                        // 清理spec_type可能含有的引号
                        $spec_type = trim($row->spec_type, '"\'');
                        
                        switch ($spec_type) {
                            case 'thickness':
                                $name_zh = '厚度';
                                $name_en = 'Thickness';
                                break;
                            case 'weight':
                                $name_zh = '重量';
                                $name_en = 'Weight';
                                break;
                            case 'width':
                                $name_zh = '宽度';
                                $name_en = 'Width';
                                break;
                            case 'length':
                                $name_zh = '长度';
                                $name_en = 'Length';
                                break;
                            default:
                                $name_zh = $spec_type;
                                $name_en = $spec_type;
                        }
                        
                        $items[] = [
                            'id' => (int) $row->id,
                            'product_line_id' => (int) $row->product_line_id,
                            'code' => $spec_type,
                            'name_zh' => $name_zh,
                            'name_en' => $name_en,
                            'metric_value' => (float) $row->metric_value,
                            'metric_unit' => trim($row->metric_unit, '"\''),
                            'imperial_value' => (float) $row->imperial_value,
                            'imperial_unit' => trim($row->imperial_unit, '"\''),
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                }
                break;
                
            case 'host_models':
                $table_name = $wpdb->prefix . 'bjt_host_models';
                $query = $wpdb->prepare("
                    SELECT id, product_line_id, model, title_zh, title_en, type, status, sort_order 
                    FROM {$table_name} 
                    WHERE status = %s
                    ORDER BY sort_order ASC, id ASC
                ", 'publish');
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        // 处理引号和其他特殊字符
                        $model = trim($row->model, '"\'');
                        $title_zh = trim($row->title_zh, '"\'');
                        $title_en = trim($row->title_en, '"\'');
                        
                        $items[] = [
                            'id' => (int) $row->id,
                            'product_line_id' => (int) $row->product_line_id,
                            'code' => $model,
                            'name_zh' => $title_zh,
                            'name_en' => $title_en,
                            'type' => $row->type,
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                }
                break;
                
            case 'units':
                // 基于CSV文件中的单位数据
                $items = [
                    ['code' => 'pcs', 'name_zh' => '件', 'name_en' => 'Pieces'],
                    ['code' => 'roll', 'name_zh' => '卷', 'name_en' => 'Roll'],
                    ['code' => 'box', 'name_zh' => '箱', 'name_en' => 'Box'],
                    ['code' => 'set', 'name_zh' => '套', 'name_en' => 'Set'],
                    ['code' => 'meter', 'name_zh' => '米', 'name_en' => 'Meter'],
                    ['code' => 'kg', 'name_zh' => '千克', 'name_en' => 'Kilogram'],
                    ['code' => 'gram', 'name_zh' => '克', 'name_en' => 'Gram'],
                    ['code' => 'mm', 'name_zh' => '毫米', 'name_en' => 'Millimeter'],
                    ['code' => 'cm', 'name_zh' => '厘米', 'name_en' => 'Centimeter'],
                    ['code' => 'inch', 'name_zh' => '英寸', 'name_en' => 'Inch'],
                    ['code' => 'ft', 'name_zh' => '英尺', 'name_en' => 'Foot'],
                    ['code' => 'lb', 'name_zh' => '磅', 'name_en' => 'Pound'],
                ];
                break;

            case 'voltages':
                $items = [
                    ['code' => '110V', 'name_zh' => '110V', 'name_en' => '110V'],
                    ['code' => '220V', 'name_zh' => '220V', 'name_en' => '220V']
                ];
                break;

            case 'frequencies':
                $items = [
                    ['code' => '50Hz', 'name_zh' => '50Hz', 'name_en' => '50Hz'],
                    ['code' => '60Hz', 'name_zh' => '60Hz', 'name_en' => '60Hz'],
                ];
                break;

            case 'bag_types':
                // 🔥 修复：从形状表(wp_bjt_shapes)获取数据，显示code字段和英文名称
                $shapes_table = $wpdb->prefix . 'bjt_shapes';
                $query = "
                    SELECT id, code, name_zh, name_en, image_url, image_url2, sort_order 
                    FROM {$shapes_table} 
                    WHERE status = 'publish'
                    ORDER BY sort_order ASC, code ASC
                ";
                
                $results = $wpdb->get_results($query);
                
                if ($results) {
                    foreach ($results as $row) {
                        $items[] = [
                            'id' => (int) $row->id,
                            'code' => trim($row->code, '"\''),
                            'name_zh' => trim($row->name_zh, '"\''),
                            'name_en' => trim($row->name_en, '"\''),
                            'image_url' => $row->image_url,
                            'image_url2' => $row->image_url2,
                            'sort_order' => (int) $row->sort_order
                        ];
                    }
                } else {
                    // 如果形状表没有数据，提供默认选项
                    $items[] = [
                        'code' => 'MEX',
                        'name_zh' => '气泡枕',
                        'name_en' => 'Air Pillow'
                    ];
                    $items[] = [
                        'code' => 'MFB',
                        'name_zh' => '葫芦膜',
                        'name_en' => 'Bubble'
                    ];
                    $items[] = [
                        'code' => 'MFC',
                        'name_zh' => '气枕膜',
                        'name_en' => 'Tube'
                    ];
                }
                break;

            case 'brands':
                // 基于CSV文件中的品牌数据
                $items = [
                    ['code' => 'BJT', 'name_zh' => 'BJT', 'name_en' => 'BJT'],
                    ['code' => 'Lockedair', 'name_zh' => 'Lockedair', 'name_en' => 'Lockedair'],
                    ['code' => 'PakTech', 'name_zh' => 'PakTech', 'name_en' => 'PakTech'],
                    ['code' => 'Generic', 'name_zh' => '通用', 'name_en' => 'Generic'],
                ];
                break;

            case 'statuses':
                $items = [
                    ['code' => 'draft', 'name_zh' => '草稿', 'name_en' => 'Draft'],
                    ['code' => 'publish', 'name_zh' => '已发布', 'name_en' => 'Published'],
                    ['code' => 'trash', 'name_zh' => '回收站', 'name_en' => 'Trash'],
                    ['code' => 'private', 'name_zh' => '私有', 'name_en' => 'Private'],
                ];
                break;

            case 'countries':
                $items = [
                    ['code' => 'CN', 'name_zh' => '中国', 'name_en' => 'China'],
                    ['code' => 'US', 'name_zh' => '美国', 'name_en' => 'United States'],
                    ['code' => 'UK', 'name_zh' => '英国', 'name_en' => 'United Kingdom'],
                    ['code' => 'DE', 'name_zh' => '德国', 'name_en' => 'Germany'],
                    ['code' => 'JP', 'name_zh' => '日本', 'name_en' => 'Japan'],
                    ['code' => 'KR', 'name_zh' => '韩国', 'name_en' => 'South Korea'],
                    ['code' => 'FR', 'name_zh' => '法国', 'name_en' => 'France'],
                    ['code' => 'CA', 'name_zh' => '加拿大', 'name_en' => 'Canada'],
                    ['code' => 'AU', 'name_zh' => '澳大利亚', 'name_en' => 'Australia'],
                ];
                break;

            case 'user_roles':
                $items = [
                    ['code' => 'admin', 'name_zh' => '管理员', 'name_en' => 'Administrator'],
                    ['code' => 'manager', 'name_zh' => '经理', 'name_en' => 'Manager'],
                    ['code' => 'editor', 'name_zh' => '编辑员', 'name_en' => 'Editor'],
                    ['code' => 'user', 'name_zh' => '用户', 'name_en' => 'User'],
                ];
                break;

            case 'product_types':
                // 基于CSV文件中的产品类型
                $items = [
                    ['code' => 'machine', 'name_zh' => '主机', 'name_en' => 'Machine'],
                    ['code' => 'accessory', 'name_zh' => '配件', 'name_en' => 'Accessory'],
                    ['code' => 'consumable', 'name_zh' => '耗材', 'name_en' => 'Consumable'],
                    ['code' => 'spare_part', 'name_zh' => '备件', 'name_en' => 'Spare Part'],
                ];
                break;
                
            default:
                return new WP_Error(
                    'dictionary_type_not_found',
                    __('Dictionary type not found'),
                    ['status' => 404]
                );
        }
        
        // 根据语言处理返回数据
        $formatted_items = [];
        foreach ($items as $item) {
            $formatted_item = [
                'code' => $item['code'],
                'name' => $item[$lang === 'zh' ? 'name_zh' : 'name_en'],
            ];
            
            // 添加额外属性（如果有）
            foreach ($item as $key => $value) {
                if (!in_array($key, ['code'])) { // 不排除name_zh和name_en，只排除code避免重复
                    $formatted_item[$key] = $value;
                }
            }
            
            $formatted_items[] = $formatted_item;
        }
        
        return $this->format_response([
            'type' => $type,
            'items' => $formatted_items
        ]);
    }
    
    /**
     * 检查是否有权限读取字典数据
     * 
     * @param WP_REST_Request $request 完整的请求对象
     * @return true|WP_Error 如有权访问返回true，否则返回WP_Error
     */
    public function get_items_permissions_check($request) {
        // 字典数据是公开的，允许任何人访问
        return true;
    }
    
    /**
     * 格式化响应
     *
     * @param mixed $data 响应数据
     * @param string $message 消息
     * @param bool $success 是否成功
     * @param int $status_code HTTP状态码
     * @return WP_REST_Response 格式化的响应
     */
    protected function format_response($data = null, $message = '', $success = true, $status_code = 200) {
        // 调用父类的format_response方法
        return parent::format_response($data, $message, $success, $status_code);
    }
    
    /**
     * 获取单个字典项
     */
    public function get_dictionary_item($request) {
        global $wpdb;
        $type = $request['type'];
        $id = $request['id'];
        
        if (!$this->is_editable_type($type)) {
            return new WP_Error(
                'dictionary_type_not_editable',
                __('Dictionary type is not editable'),
                ['status' => 400]
            );
        }
        
        $table_name = $this->get_table_name($type);
        if (!$table_name) {
            return new WP_Error(
                'dictionary_type_not_found',
                __('Dictionary type not found'),
                ['status' => 404]
            );
        }
        
        $query = $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id);
        $item = $wpdb->get_row($query);
        
        if (!$item) {
            return new WP_Error(
                'dictionary_item_not_found',
                __('Dictionary item not found'),
                ['status' => 404]
            );
        }
        
        $formatted_item = $this->format_item($item, $type);
        
        return $this->format_response([
            'item' => $formatted_item
        ]);
    }
    
    /**
     * 创建字典项
     */
    public function create_dictionary_item($request) {
        global $wpdb;
        $type = $request['type'];
        $data = $request->get_json_params();
        
        if (!$this->is_editable_type($type)) {
            return new WP_Error(
                'dictionary_type_not_editable',
                __('Dictionary type is not editable'),
                ['status' => 400]
            );
        }
        
        $table_name = $this->get_table_name($type);
        if (!$table_name) {
            return new WP_Error(
                'dictionary_type_not_found',
                __('Dictionary type not found'),
                ['status' => 404]
            );
        }
        
        // 验证必填字段
        $validation_result = $this->validate_item_data($data, $type);
        if (is_wp_error($validation_result)) {
            return $validation_result;
        }
        
        // 准备插入数据
        $insert_data = $this->prepare_item_data($data, $type);
        $insert_data['created_at'] = current_time('mysql');
        $insert_data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->insert($table_name, $insert_data);
        
        if ($result === false) {
            return new WP_Error(
                'dictionary_item_create_failed',
                __('Failed to create dictionary item'),
                ['status' => 500]
            );
        }
        
        $item_id = $wpdb->insert_id;
        
        // 获取创建的项目并返回
        $query = $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $item_id);
        $created_item = $wpdb->get_row($query);
        
        $formatted_item = $this->format_item($created_item, $type);
        
        return $this->format_response([
            'item' => $formatted_item
        ], __('Dictionary item created successfully'));
    }
    
    /**
     * 更新字典项
     */
    public function update_dictionary_item($request) {
        global $wpdb;
        $type = $request['type'];
        $id = $request['id'];
        $data = $request->get_json_params();
        
        if (!$this->is_editable_type($type)) {
            return new WP_Error(
                'dictionary_type_not_editable',
                __('Dictionary type is not editable'),
                ['status' => 400]
            );
        }
        
        $table_name = $this->get_table_name($type);
        if (!$table_name) {
            return new WP_Error(
                'dictionary_type_not_found',
                __('Dictionary type not found'),
                ['status' => 404]
            );
        }
        
        // 检查项目是否存在
        $query = $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id);
        $existing_item = $wpdb->get_row($query);
        
        if (!$existing_item) {
            return new WP_Error(
                'dictionary_item_not_found',
                __('Dictionary item not found'),
                ['status' => 404]
            );
        }
        
        // 验证必填字段
        $validation_result = $this->validate_item_data($data, $type, true);
        if (is_wp_error($validation_result)) {
            return $validation_result;
        }
        
        // 准备更新数据
        $update_data = $this->prepare_item_data($data, $type, true);
        $update_data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->update(
            $table_name,
            $update_data,
            ['id' => $id],
            null,
            ['%d']
        );
        
        if ($result === false) {
            return new WP_Error(
                'dictionary_item_update_failed',
                __('Failed to update dictionary item'),
                ['status' => 500]
            );
        }
        
        // 获取更新后的项目并返回
        $query = $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id);
        $updated_item = $wpdb->get_row($query);
        
        $formatted_item = $this->format_item($updated_item, $type);
        
        return $this->format_response([
            'item' => $formatted_item
        ], __('Dictionary item updated successfully'));
    }
    
    /**
     * 删除字典项
     */
    public function delete_dictionary_item($request) {
        global $wpdb;
        $type = $request['type'];
        $id = $request['id'];
        
        if (!$this->is_editable_type($type)) {
            return new WP_Error(
                'dictionary_type_not_editable',
                __('Dictionary type is not editable'),
                ['status' => 400]
            );
        }
        
        $table_name = $this->get_table_name($type);
        if (!$table_name) {
            return new WP_Error(
                'dictionary_type_not_found',
                __('Dictionary type not found'),
                ['status' => 404]
            );
        }
        
        // 检查项目是否存在
        $query = $wpdb->prepare("SELECT * FROM {$table_name} WHERE id = %d", $id);
        $existing_item = $wpdb->get_row($query);
        
        if (!$existing_item) {
            return new WP_Error(
                'dictionary_item_not_found',
                __('Dictionary item not found'),
                ['status' => 404]
            );
        }
        
        $result = $wpdb->delete(
            $table_name,
            ['id' => $id],
            ['%d']
        );
        
        if ($result === false) {
            return new WP_Error(
                'dictionary_item_delete_failed',
                __('Failed to delete dictionary item'),
                ['status' => 500]
            );
        }
        
        return $this->format_response(
            null,
            __('Dictionary item deleted successfully')
        );
    }
    
    /**
     * 权限检查 - 创建
     */
    public function create_items_permissions_check($request) {
        error_log('[BJT_Dictionary_Controller] Checking create permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Dictionary_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Dictionary_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Dictionary_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Dictionary_Controller] User account is not active: ' . $user->status);
            return new WP_Error('rest_user_inactive', __('用户账户未激活。', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色权限 - 管理员和销售可以创建字典项
        if (!in_array($user->role, ['admin', 'sales'])) {
            error_log('[BJT_Dictionary_Controller] User does not have permission to create dictionary items. User role: ' . $user->role);
            return new WP_Error('rest_forbidden', __('您没有权限执行此操作。', 'bjt'), ['status' => 403]);
        }

        error_log('[BJT_Dictionary_Controller] Create permission granted for user: ' . $user->email . ' with role: ' . $user->role);
        return true;
    }
    
    /**
     * 权限检查 - 更新
     */
    public function update_items_permissions_check($request) {
        error_log('[BJT_Dictionary_Controller] Checking update permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Dictionary_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Dictionary_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Dictionary_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Dictionary_Controller] User account is not active: ' . $user->status);
            return new WP_Error('rest_user_inactive', __('用户账户未激活。', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色权限 - 管理员和销售可以更新字典项
        if (!in_array($user->role, ['admin', 'sales'])) {
            error_log('[BJT_Dictionary_Controller] User does not have permission to update dictionary items. User role: ' . $user->role);
            return new WP_Error('rest_forbidden', __('您没有权限执行此操作。', 'bjt'), ['status' => 403]);
        }

        error_log('[BJT_Dictionary_Controller] Update permission granted for user: ' . $user->email . ' with role: ' . $user->role);
        return true;
    }
    
    /**
     * 权限检查 - 删除
     */
    public function delete_items_permissions_check($request) {
        error_log('[BJT_Dictionary_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Dictionary_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Dictionary_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Dictionary_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Dictionary_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Dictionary_Controller] User account is not active: ' . $user->status);
            return new WP_Error('rest_user_inactive', __('用户账户未激活。', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色权限 - 只有管理员可以删除字典项
        if ($user->role !== 'admin') {
            error_log('[BJT_Dictionary_Controller] User does not have permission to delete dictionary items. User role: ' . $user->role);
            return new WP_Error('rest_forbidden', __('您没有权限执行此操作。', 'bjt'), ['status' => 403]);
        }

        error_log('[BJT_Dictionary_Controller] Delete permission granted for user: ' . $user->email . ' with role: ' . $user->role);
        return true;
    }
    
    /**
     * 检查字典类型是否可编辑
     */
    private function is_editable_type($type) {
        $editable_types = ['shapes', 'materials', 'specifications'];
        return in_array($type, $editable_types);
    }
    
    /**
     * 获取数据表名
     */
    private function get_table_name($type) {
        global $wpdb;
        
        $table_map = [
            'shapes' => $wpdb->prefix . 'bjt_shapes',
            'materials' => $wpdb->prefix . 'bjt_materials',
            'specifications' => $wpdb->prefix . 'bjt_specifications'
        ];
        
        return isset($table_map[$type]) ? $table_map[$type] : null;
    }
    
    /**
     * 验证数据
     */
    private function validate_item_data($data, $type, $is_update = false) {
        switch ($type) {
            case 'shapes':
                if (!$is_update || isset($data['code'])) {
                    if (empty($data['code'])) {
                        return new WP_Error('missing_code', __('Code is required'));
                    }
                }
                if (!$is_update || isset($data['name_zh'])) {
                    if (empty($data['name_zh'])) {
                        return new WP_Error('missing_name_zh', __('Chinese name is required'));
                    }
                }
                if (!$is_update || isset($data['name_en'])) {
                    if (empty($data['name_en'])) {
                        return new WP_Error('missing_name_en', __('English name is required'));
                    }
                }
                break;
                
            case 'materials':
                if (!$is_update || isset($data['code'])) {
                    if (empty($data['code'])) {
                        return new WP_Error('missing_code', __('Code is required'));
                    }
                }
                if (!$is_update || isset($data['name_zh'])) {
                    if (empty($data['name_zh'])) {
                        return new WP_Error('missing_name_zh', __('Chinese name is required'));
                    }
                }
                if (!$is_update || isset($data['name_en'])) {
                    if (empty($data['name_en'])) {
                        return new WP_Error('missing_name_en', __('English name is required'));
                    }
                }
                break;
                
            case 'specifications':
                if (!$is_update || isset($data['code'])) {
                    if (empty($data['code'])) {
                        return new WP_Error('missing_code', __('Specification type is required'));
                    }
                }
                if (!$is_update || isset($data['metric_value'])) {
                    if (!isset($data['metric_value']) || !is_numeric($data['metric_value'])) {
                        return new WP_Error('missing_metric_value', __('Metric value is required and must be numeric'));
                    }
                }
                if (!$is_update || isset($data['metric_unit'])) {
                    if (empty($data['metric_unit'])) {
                        return new WP_Error('missing_metric_unit', __('Metric unit is required'));
                    }
                }
                if (!$is_update || isset($data['imperial_value'])) {
                    if (!isset($data['imperial_value']) || !is_numeric($data['imperial_value'])) {
                        return new WP_Error('missing_imperial_value', __('Imperial value is required and must be numeric'));
                    }
                }
                if (!$is_update || isset($data['imperial_unit'])) {
                    if (empty($data['imperial_unit'])) {
                        return new WP_Error('missing_imperial_unit', __('Imperial unit is required'));
                    }
                }
                break;
        }
        
        return true;
    }
    
    /**
     * 准备数据
     */
    private function prepare_item_data($data, $type, $is_update = false) {
        $prepared = [];
        
        // 公共字段
        if (isset($data['product_line_id'])) {
            $prepared['product_line_id'] = (int) $data['product_line_id'];
        } elseif (!$is_update) {
            $prepared['product_line_id'] = 1; // 默认产品线ID
        }
        
        if (isset($data['status'])) {
            $prepared['status'] = sanitize_text_field($data['status']);
        } elseif (!$is_update) {
            $prepared['status'] = 'publish';
        }
        
        if (isset($data['sort_order'])) {
            $prepared['sort_order'] = (int) $data['sort_order'];
        } elseif (!$is_update) {
            $prepared['sort_order'] = 0;
        }
        
        // 类型特定字段
        switch ($type) {
            case 'shapes':
                if (isset($data['code'])) {
                    $prepared['code'] = sanitize_text_field($data['code']);
                }
                if (isset($data['name_zh'])) {
                    $prepared['name_zh'] = sanitize_text_field($data['name_zh']);
                }
                if (isset($data['name_en'])) {
                    $prepared['name_en'] = sanitize_text_field($data['name_en']);
                }
                if (isset($data['image_url'])) {
                    $prepared['image_url'] = esc_url_raw($data['image_url']);
                }
                if (isset($data['image_url2'])) {
                    $prepared['image_url2'] = esc_url_raw($data['image_url2']);
                }
                break;
                
            case 'materials':
                if (isset($data['code'])) {
                    $prepared['code'] = sanitize_text_field($data['code']);
                }
                if (isset($data['name_zh'])) {
                    $prepared['name_zh'] = sanitize_text_field($data['name_zh']);
                }
                if (isset($data['name_en'])) {
                    $prepared['name_en'] = sanitize_text_field($data['name_en']);
                }
                if (isset($data['base_material'])) {
                    $prepared['base_material'] = sanitize_text_field($data['base_material']);
                }
                break;
                
            case 'specifications':
                if (isset($data['code'])) {
                    $prepared['spec_type'] = sanitize_text_field($data['code']);
                }
                if (isset($data['metric_value'])) {
                    $prepared['metric_value'] = (float) $data['metric_value'];
                }
                if (isset($data['metric_unit'])) {
                    $prepared['metric_unit'] = sanitize_text_field($data['metric_unit']);
                }
                if (isset($data['imperial_value'])) {
                    $prepared['imperial_value'] = (float) $data['imperial_value'];
                }
                if (isset($data['imperial_unit'])) {
                    $prepared['imperial_unit'] = sanitize_text_field($data['imperial_unit']);
                }
                break;
        }
        
        return $prepared;
    }
    
    /**
     * 格式化单个项目
     */
    private function format_item($item, $type) {
        $formatted = [];
        
        foreach ($item as $key => $value) {
            // 清理可能的引号
            if (is_string($value)) {
                $value = trim($value, '"\'');
            }
            $formatted[$key] = $value;
        }
        
        // 类型转换
        if (isset($formatted['id'])) {
            $formatted['id'] = (int) $formatted['id'];
        }
        if (isset($formatted['product_line_id'])) {
            $formatted['product_line_id'] = (int) $formatted['product_line_id'];
        }
        if (isset($formatted['sort_order'])) {
            $formatted['sort_order'] = (int) $formatted['sort_order'];
        }
        
        // 规格特殊处理
        if ($type === 'specifications') {
            if (isset($formatted['metric_value'])) {
                $formatted['metric_value'] = (float) $formatted['metric_value'];
            }
            if (isset($formatted['imperial_value'])) {
                $formatted['imperial_value'] = (float) $formatted['imperial_value'];
            }
            // 为了兼容前端，将spec_type映射为code
            if (isset($formatted['spec_type'])) {
                $formatted['code'] = $formatted['spec_type'];
            }
        }
        
        return $formatted;
    }
} 