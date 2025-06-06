<?php
/**
 * BJT Product Lines Controller
 * 
 * 处理产品线相关的API请求
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT产品线控制器类
 */
class BJT_Product_Lines_Controller extends BJT_API_Controller {
    /**
     * 资源基础
     */
    protected $rest_base = 'product-lines';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 获取产品线列表
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'page' => array(
                        'default' => 1,
                        'type' => 'integer',
                        'minimum' => 1,
                    ),
                    'page_size' => array(
                        'default' => 10,
                        'type' => 'integer',
                        'minimum' => 1,
                        'maximum' => 100,
                    ),
                    'lang' => array(
                        'default' => 'zh',
                        'type' => 'string',
                        'enum' => array('zh', 'en'),
                    ),
                ),
            ),
        ));
        
        // 获取单个产品线
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '产品线ID',
                    ),
                    'lang' => array(
                        'default' => 'zh',
                        'type' => 'string',
                        'enum' => array('zh', 'en'),
                    ),
                ),
            ),
        ));
        
        // 获取产品线下的耗材
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)/consumables', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_consumables'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '产品线ID',
                    ),
                    'page' => array(
                        'default' => 1,
                        'type' => 'integer',
                        'minimum' => 1,
                    ),
                    'page_size' => array(
                        'default' => 10,
                        'type' => 'integer',
                        'minimum' => 1,
                        'maximum' => 100,
                    ),
                    'region' => array(
                        'default' => 'CN',
                        'type' => 'string',
                        'enum' => array('CN', 'EU', 'NA', 'AU'),
                    ),
                    'lang' => array(
                        'default' => 'zh',
                        'type' => 'string',
                        'enum' => array('zh', 'en'),
                    ),
                ),
            ),
        ));
    }
    
    /**
     * 获取产品线列表
     */
    public function get_items($request) {
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $lang = $request->get_param('lang');
        
        // 获取所有产品线
        $product_lines = $this->get_product_lines();
        
        // 计算分页
        $total = count($product_lines);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($product_lines, $offset, $per_page);
        
        // 根据语言处理数据
        $items = $this->prepare_product_lines_for_response($items, $lang);
        
        return $this->format_response([
            'items' => $items,
            'total' => $total,
            'page' => (int)$page,
            'per_page' => (int)$per_page,
            'total_pages' => ceil($total / $per_page)
        ]);
    }
    
    /**
     * 获取单个产品线
     */
    public function get_item($request) {
        $id = $request->get_param('id');
        $lang = $request->get_param('lang');
        
        // 获取产品线
        $product_line = $this->get_product_line($id);
        
        if (!$product_line) {
            return $this->error_response('找不到指定的产品线', 'product_line_not_found', 404);
        }
        
        // 根据语言处理数据
        $item = $this->prepare_product_line_for_response($product_line, $lang, true);
        
        return $this->success_response($item);
    }
    
    /**
     * 获取产品线下的耗材
     */
    public function get_consumables($request) {
        $id = $request->get_param('id');
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取产品线
        $product_line = $this->get_product_line($id);
        
        if (!$product_line) {
            return $this->error_response('找不到指定的产品线', 'product_line_not_found', 404);
        }
        
        // 获取产品线下的耗材
        $consumables = $this->get_product_line_consumables($id);
        
        // 计算分页
        $total = count($consumables);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($consumables, $offset, $per_page);
        
        // 根据语言和区域处理数据
        $items = $this->prepare_consumables_for_response($items, $region, $lang);
        
        return $this->get_paginated_response($items, $total, $request);
    }
    
    /**
     * 获取所有产品线
     */
    private function get_product_lines() {
        // 模拟数据，实际应从数据库获取
        return array(
            array(
                'id' => 'LINE-001',
                'code' => 'LP',
                'name_cn' => '气垫机产品线',
                'name_en' => 'Air Cushion Machine Line',
                'description_cn' => '气垫机产品线描述',
                'description_en' => 'Air Cushion Machine Line Description',
                'status' => 'active',
            ),
            array(
                'id' => 'LINE-002',
                'code' => 'FP',
                'name_cn' => '纸垫机产品线',
                'name_en' => 'Paper Pad Machine Line',
                'description_cn' => '纸垫机产品线描述',
                'description_en' => 'Paper Pad Machine Line Description',
                'status' => 'active',
            ),
            array(
                'id' => 'LINE-003',
                'code' => 'RW',
                'name_cn' => '缠绕机产品线',
                'name_en' => 'Wrapping Machine Line',
                'description_cn' => '缠绕机产品线描述',
                'description_en' => 'Wrapping Machine Line Description',
                'status' => 'active',
            ),
        );
    }
    
    /**
     * 获取单个产品线
     */
    private function get_product_line($id) {
        $product_lines = $this->get_product_lines();
        
        foreach ($product_lines as $product_line) {
            if ($product_line['id'] === $id) {
                return $product_line;
            }
        }
        
        return null;
    }
    
    /**
     * 获取产品线下的设备
     */
    private function get_product_line_machines($product_line_id) {
        // 模拟数据，实际应从数据库获取
        $machines = array(
            'LINE-001' => array(
                array(
                    'id' => 'MEY-001',
                    'model' => 'MEY',
                    'voltage_options' => array('110V', '220V'),
                    'name_cn' => '气垫机 Pro - MEY系列',
                    'name_en' => 'Air Cushion Machine Pro - MEY Series',
                ),
                array(
                    'id' => 'MEZ-001',
                    'model' => 'MEZ',
                    'voltage_options' => array('110V', '220V'),
                    'name_cn' => '气垫机 Pro - MEZ系列',
                    'name_en' => 'Air Cushion Machine Pro - MEZ Series',
                ),
            ),
            'LINE-002' => array(
                array(
                    'id' => 'PB1-001',
                    'model' => 'PB1',
                    'voltage_options' => array('110V', '220V'),
                    'name_cn' => '纸垫机 - PB1系列',
                    'name_en' => 'Paper Pad Machine - PB1 Series',
                ),
            ),
            'LINE-003' => array(
                array(
                    'id' => 'RW1-001',
                    'model' => 'RW1',
                    'voltage_options' => array('110V', '220V'),
                    'name_cn' => '缠绕机 - RW1系列',
                    'name_en' => 'Wrapping Machine - RW1 Series',
                ),
            ),
        );
        
        return isset($machines[$product_line_id]) ? $machines[$product_line_id] : array();
    }
    
    /**
     * 获取产品线下的耗材
     */
    private function get_product_line_consumables($product_line_id) {
        // 模拟数据，实际应从数据库获取
        $consumables = array(
            'LINE-001' => array(
                array(
                    'id' => 'CONS-001',
                    'product_line_id' => 'LINE-001',
                    'product_id' => 'BJT-CONS-001',
                    'model' => 'LP-V1',
                    'brand' => 'BJT',
                    'part_number' => 'BJT-CONS-001-2024',
                    'name_cn' => '气垫膜 - 标准型',
                    'name_en' => 'Air Cushion Film - Standard',
                    'specifications' => array(
                        'material' => 'HDPE',
                        'pak_shape' => 'roll',
                        'thickness' => array(
                            'metric' => '25um',
                            'imperial' => '1mil',
                        ),
                        'dimensions' => array(
                            'width' => array(
                                'metric' => '100cm',
                                'imperial' => '39.4inch',
                            ),
                            'length' => array(
                                'metric' => '200m',
                                'imperial' => '656ft',
                            ),
                        ),
                    ),
                    'compatibility' => array(
                        'machines' => array('MEY-001', 'MEZ-001'),
                        'accessories' => array('ACC-001'),
                    ),
                    'pricing' => array(
                        array(
                            'range' => '1-4',
                            'prices' => array(
                                'CN' => 100,
                                'EU' => 15,
                                'NA' => 16,
                                'AU' => 20,
                            ),
                        ),
                        array(
                            'range' => '5-9',
                            'prices' => array(
                                'CN' => 90,
                                'EU' => 13.5,
                                'NA' => 14.5,
                                'AU' => 18,
                            ),
                        ),
                        array(
                            'range' => '10+',
                            'prices' => array(
                                'CN' => 80,
                                'EU' => 12,
                                'NA' => 13,
                                'AU' => 16,
                            ),
                        ),
                    ),
                    'inventory' => array(
                        'CN' => 1000,
                        'EU' => 500,
                        'NA' => 800,
                        'AU' => 300,
                    ),
                ),
                array(
                    'id' => 'CONS-002',
                    'product_line_id' => 'LINE-001',
                    'product_id' => 'BJT-CONS-002',
                    'model' => 'LP-V2',
                    'brand' => 'BJT',
                    'part_number' => 'BJT-CONS-002-2024',
                    'name_cn' => '气垫膜 - 加厚型',
                    'name_en' => 'Air Cushion Film - Thick',
                    'specifications' => array(
                        'material' => 'HDPE',
                        'pak_shape' => 'roll',
                        'thickness' => array(
                            'metric' => '35um',
                            'imperial' => '1.4mil',
                        ),
                        'dimensions' => array(
                            'width' => array(
                                'metric' => '100cm',
                                'imperial' => '39.4inch',
                            ),
                            'length' => array(
                                'metric' => '200m',
                                'imperial' => '656ft',
                            ),
                        ),
                    ),
                    'compatibility' => array(
                        'machines' => array('MEY-001', 'MEZ-001'),
                        'accessories' => array('ACC-001'),
                    ),
                    'pricing' => array(
                        array(
                            'range' => '1-4',
                            'prices' => array(
                                'CN' => 120,
                                'EU' => 18,
                                'NA' => 19,
                                'AU' => 24,
                            ),
                        ),
                        array(
                            'range' => '5+',
                            'prices' => array(
                                'CN' => 100,
                                'EU' => 15,
                                'NA' => 16,
                                'AU' => 20,
                            ),
                        ),
                    ),
                    'inventory' => array(
                        'CN' => 800,
                        'EU' => 300,
                        'NA' => 500,
                        'AU' => 200,
                    ),
                ),
            ),
            'LINE-002' => array(
                array(
                    'id' => 'CONS-003',
                    'product_line_id' => 'LINE-002',
                    'product_id' => 'BJT-CONS-003',
                    'model' => 'FP-V1',
                    'brand' => 'BJT',
                    'part_number' => 'BJT-CONS-003-2024',
                    'name_cn' => '包装纸垫 - 标准型',
                    'name_en' => 'Packaging Paper - Standard',
                    'specifications' => array(
                        'material' => 'Kraft Paper',
                        'pak_shape' => 'roll',
                        'thickness' => array(
                            'metric' => '5mm',
                            'imperial' => '0.2inch',
                        ),
                        'dimensions' => array(
                            'width' => array(
                                'metric' => '50cm',
                                'imperial' => '19.7inch',
                            ),
                            'length' => array(
                                'metric' => '100m',
                                'imperial' => '328ft',
                            ),
                        ),
                    ),
                    'compatibility' => array(
                        'machines' => array('PB1-001'),
                        'accessories' => array(),
                    ),
                    'pricing' => array(
                        array(
                            'range' => '1-4',
                            'prices' => array(
                                'CN' => 80,
                                'EU' => 12,
                                'NA' => 13,
                                'AU' => 16,
                            ),
                        ),
                        array(
                            'range' => '5+',
                            'prices' => array(
                                'CN' => 70,
                                'EU' => 10.5,
                                'NA' => 11.5,
                                'AU' => 14,
                            ),
                        ),
                    ),
                    'inventory' => array(
                        'CN' => 500,
                        'EU' => 200,
                        'NA' => 300,
                        'AU' => 100,
                    ),
                ),
            ),
        );
        
        return isset($consumables[$product_line_id]) ? $consumables[$product_line_id] : array();
    }
    
    /**
     * 处理产品线列表数据
     */
    private function prepare_product_lines_for_response($product_lines, $lang) {
        $items = array();
        
        foreach ($product_lines as $product_line) {
            $items[] = $this->prepare_product_line_for_response($product_line, $lang);
        }
        
        return $items;
    }
    
    /**
     * 处理单个产品线数据
     */
    private function prepare_product_line_for_response($product_line, $lang, $include_machines = false) {
        $name_field = 'name_' . $lang;
        $description_field = 'description_' . $lang;
        
        $item = array(
            'id' => $product_line['id'],
            'code' => $product_line['code'],
            'name_cn' => $product_line['name_cn'],
            'name_en' => $product_line['name_en'],
            'description_cn' => $product_line['description_cn'],
            'description_en' => $product_line['description_en'],
            'status' => $product_line['status'],
        );
        
        // 如果需要，添加设备信息
        if ($include_machines) {
            $machines = $this->get_product_line_machines($product_line['id']);
            $machines_data = array();
            
            foreach ($machines as $machine) {
                $machines_data[] = array(
                    'id' => $machine['id'],
                    'model' => $machine['model'],
                    'voltage_options' => $machine['voltage_options'],
                    'name_cn' => $machine['name_cn'],
                    'name_en' => $machine['name_en'],
                );
            }
            
            $item['machines'] = $machines_data;
        }
        
        return $item;
    }
    
    /**
     * 处理耗材列表数据
     */
    private function prepare_consumables_for_response($consumables, $region, $lang) {
        $items = array();
        
        foreach ($consumables as $consumable) {
            $name_field = 'name_' . $lang;
            
            $item = array(
                'id' => $consumable['id'],
                'product_line_id' => $consumable['product_line_id'],
                'product_id' => $consumable['product_id'],
                'model' => $consumable['model'],
                'brand' => $consumable['brand'],
                'part_number' => $consumable['part_number'],
                'name' => $consumable[$name_field],
                'specifications' => $consumable['specifications'],
                'compatibility' => $consumable['compatibility'],
            );
            
            // 添加当前区域的价格和库存
            $pricing = array();
            foreach ($consumable['pricing'] as $price_tier) {
                if (isset($price_tier['prices'][$region])) {
                    $pricing[] = array(
                        'range' => $price_tier['range'],
                        'price' => $price_tier['prices'][$region],
                    );
                }
            }
            
            $item['pricing'] = $pricing;
            $item['inventory'] = isset($consumable['inventory'][$region]) ? $consumable['inventory'][$region] : 0;
            
            $items[] = $item;
        }
        
        return $items;
    }
    
    /**
     * Format a successful response
     *
     * @param mixed $data The response data
     * @param string $message Optional message
     * @param boolean $success Whether the request was successful
     * @param int $code HTTP status code
     * @return WP_REST_Response
     */
    protected function format_response($data = null, $message = '', $success = true, $code = 200) {
        $response = [
            'success' => $success
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        return new WP_REST_Response($response, $code);
    }
    
    /**
     * Format an error response
     *
     * @param string $message Error message
     * @param string $code Error code
     * @param int $status HTTP status code
     * @return WP_Error
     */
    protected function error_response($message, $code = 'bjt_api_error', $status = 400) {
        return new WP_Error($code, $message, ['status' => $status]);
    }
} 