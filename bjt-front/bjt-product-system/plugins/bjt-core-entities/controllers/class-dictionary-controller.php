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
                // 基于CSV文件中的袋型数据
                $items = [
                    ['code' => 'MEX', 'name_zh' => 'MEX型', 'name_en' => 'MEX Type'],
                    ['code' => 'B4', 'name_zh' => 'B4型', 'name_en' => 'B4 Type'],
                    ['code' => 'MEE', 'name_zh' => 'MEE型', 'name_en' => 'MEE Type'],
                    ['code' => 'MEB', 'name_zh' => 'MEB型', 'name_en' => 'MEB Type'],
                    ['code' => 'QMF', 'name_zh' => 'QMF型', 'name_en' => 'QMF Type'],
                    ['code' => 'GVFX', 'name_zh' => 'GVFX型', 'name_en' => 'GVFX Type'],
                    ['code' => 'EXPRESS', 'name_zh' => 'EXPRESS型', 'name_en' => 'EXPRESS Type'],
                    ['code' => 'EXPRESS-A4', 'name_zh' => 'EXPRESS-A4型', 'name_en' => 'EXPRESS-A4 Type'],
                ];
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
} 