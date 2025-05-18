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
        ];
        
        return $this->format_response([
            'types' => $types
        ]);
    }
    
    /**
     * 获取特定类型的数据字典项
     */
    public function get_dictionary_items($request) {
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
                if (!in_array($key, ['code', 'name_zh', 'name_en'])) {
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
     * @return array 格式化的响应
     */
    protected function format_response($data = null, $message = '', $success = true) {
        $response = [
            'success' => $success,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        return $response;
    }
} 