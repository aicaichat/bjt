<?php
/**
 * BJT Accessories Controller
 * 
 * 处理配件相关的API请求
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT配件控制器类
 */
class BJT_Accessories_Controller extends BJT_API_Controller {
    /**
     * 资源基础
     */
    protected $rest_base = 'accessories';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 获取配件列表
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
                    'category' => array(
                        'type' => 'string',
                    ),
                ),
            ),
        ));
        
        // 获取单个配件
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '配件ID',
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
        
        // 获取配件适用的设备
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)/machines', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_compatible_machines'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '配件ID',
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
     * 获取配件列表
     */
    public function get_items($request) {
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        $category = $request->get_param('category');
        
        // 获取所有配件
        $accessories = $this->get_accessories();
        
        // 如果有分类，进行筛选
        if ($category) {
            $accessories = array_filter($accessories, function($accessory) use ($category) {
                return $accessory['category'] === $category;
            });
        }
        
        // 计算分页
        $total = count($accessories);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($accessories, $offset, $per_page);
        
        // 根据语言和区域处理数据
        $items = $this->prepare_accessories_for_response($items, $region, $lang);
        
        return $this->get_paginated_response($items, $total, $request);
    }
    
    /**
     * 获取单个配件
     */
    public function get_item($request) {
        $id = $request->get_param('id');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取配件
        $accessory = $this->get_accessory($id);
        
        if (!$accessory) {
            return $this->error_response('找不到指定的配件', 'accessory_not_found', 404);
        }
        
        // 根据语言和区域处理数据
        $item = $this->prepare_accessory_for_response($accessory, $region, $lang, true);
        
        return $this->success_response($item);
    }
    
    /**
     * 获取配件适用的设备
     */
    public function get_compatible_machines($request) {
        $id = $request->get_param('id');
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取配件
        $accessory = $this->get_accessory($id);
        
        if (!$accessory) {
            return $this->error_response('找不到指定的配件', 'accessory_not_found', 404);
        }
        
        // 获取兼容设备
        $machines = $this->get_compatible_machines_data($id);
        
        // 计算分页
        $total = count($machines);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($machines, $offset, $per_page);
        
        // 根据语言和区域处理数据
        $machines_controller = new BJT_Machines_Controller();
        $items = $machines_controller->prepare_machines_for_response($items, $region, $lang);
        
        return $this->get_paginated_response($items, $total, $request);
    }
    
    /**
     * 获取所有配件
     */
    private function get_accessories() {
        // 模拟数据，实际应从数据库获取
        return array(
            array(
                'id' => 'FS-001',
                'model' => 'Floor Stand',
                'title_cn' => '地面支架组件',
                'title_en' => 'Floor Stand Assembly',
                'subtitle_cn' => '适用于多种气垫机型号',
                'subtitle_en' => 'Compatible with various air cushion machine models',
                'description_cn' => '高品质钢制地面支架，可调节高度，适用于MEY系列气垫机。提供稳定的工作平台，减少震动，延长设备使用寿命。',
                'description_en' => 'High-quality steel floor stand with adjustable height, suitable for MEY series air cushion machines. Provides a stable working platform, reduces vibration, and extends equipment life.',
                'category' => '支架',
                'image_url' => '/images/shop/FS-001.jpg',
                'images' => array(
                    '/images/shop/FS-001_1.jpg',
                    '/images/shop/FS-001_2.jpg',
                ),
                'specs' => array(
                    '材质' => '优质钢材',
                    '高度' => '可调节70-90cm',
                    '最大承重' => '100kg',
                    '折叠' => '支持',
                ),
                'parts' => array(
                    array(
                        'id' => 'BJT-FS-V2-2024',
                        'part_number' => 'BJT-FS-V2-2024',
                        'title_cn' => '标准地面支架',
                        'title_en' => 'Standard Floor Stand',
                        'specs' => array(
                            '电压' => 'N/A',
                            '频率' => 'N/A',
                            '托盘尺寸' => '90×70×120cm',
                            '一托数量' => '16件',
                        ),
                        'spec_cn' => '90×70×120cm, 7.8kg',
                        'spec_en' => '90×70×120cm, 7.8kg',
                        'spec_imperial' => '35.4×27.6×47.2inch, 17.2lbs',
                        'prices' => array(
                            'base' => 85,
                            'tier1' => 75,
                            'tier2' => 65,
                            'vip' => 55,
                        ),
                        'inventory' => array(
                            'CN' => 156,
                            'EU' => 16,
                            'NA' => 24,
                            'AU' => 12,
                        ),
                    ),
                ),
                'compatible_machines' => array(
                    'MEY-001',
                ),
                'features_cn' => array(
                    '高强度结构',
                    '高度可调节',
                    '表面防锈处理',
                    '工业级脚轮',
                ),
                'features_en' => array(
                    'High-strength structure',
                    'Adjustable height',
                    'Anti-rust surface treatment',
                    'Industrial-grade casters',
                ),
                'documents' => array(
                    array(
                        'name_cn' => '安装说明',
                        'name_en' => 'Installation Instructions',
                        'url' => '/docs/FS-001_installation.pdf',
                        'type' => 'pdf',
                    ),
                ),
            ),
            array(
                'id' => 'PH-001',
                'model' => 'Print Head',
                'title_cn' => '打印头组件',
                'title_en' => 'Print Head Assembly',
                'subtitle_cn' => '适用于MEY系列气垫机',
                'subtitle_en' => 'Compatible with MEY series air cushion machines',
                'description_cn' => '高精度热敏打印头，用于气垫膜标识打印。配备先进的温控系统，确保打印质量和使用寿命。适用于所有MEY系列气垫机。',
                'description_en' => 'High-precision thermal print head for air cushion film identification printing. Equipped with an advanced temperature control system to ensure print quality and service life. Compatible with all MEY series air cushion machines.',
                'category' => '打印部件',
                'image_url' => '/images/shop/PH-001.jpg',
                'images' => array(
                    '/images/shop/PH-001_1.jpg',
                    '/images/shop/PH-001_2.jpg',
                ),
                'specs' => array(
                    '打印分辨率' => '300dpi',
                    '打印宽度' => '最大80mm',
                    '使用寿命' => '约100万次打印',
                    '接口' => 'USB/RS232',
                ),
                'parts' => array(
                    array(
                        'id' => 'BJT-PH-V1-2024',
                        'part_number' => 'BJT-PH-V1-2024',
                        'title_cn' => '热敏打印头',
                        'title_en' => 'Thermal Print Head',
                        'specs' => array(
                            '电压' => '24V',
                            '频率' => 'N/A',
                            '托盘尺寸' => '50×40×20cm',
                            '一托数量' => '100件',
                        ),
                        'spec_cn' => '55×45×10mm, 0.6kg',
                        'spec_en' => '55×45×10mm, 0.6kg',
                        'spec_imperial' => '2.2×1.8×0.4inch, 1.3lbs',
                        'prices' => array(
                            'base' => 2200,
                            'tier1' => 2000,
                            'tier2' => 1800,
                            'vip' => 1700,
                        ),
                        'inventory' => array(
                            'CN' => 220,
                            'EU' => 30,
                            'NA' => 45,
                            'AU' => 25,
                        ),
                    ),
                ),
                'compatible_machines' => array(
                    'MEY-001',
                ),
                'features_cn' => array(
                    '高分辨率打印',
                    '快速加热',
                    '耐磨损设计',
                    '简易安装',
                ),
                'features_en' => array(
                    'High-resolution printing',
                    'Quick heating',
                    'Wear-resistant design',
                    'Easy installation',
                ),
                'documents' => array(
                    array(
                        'name_cn' => '安装手册',
                        'name_en' => 'Installation Manual',
                        'url' => '/docs/PH-001_manual.pdf',
                        'type' => 'pdf',
                    ),
                    array(
                        'name_cn' => '维护指南',
                        'name_en' => 'Maintenance Guide',
                        'url' => '/docs/PH-001_maintenance.pdf',
                        'type' => 'pdf',
                    ),
                ),
            ),
            array(
                'id' => 'FS-002',
                'model' => 'Paper Stand',
                'title_cn' => '纸张支架',
                'title_en' => 'Paper Stand',
                'subtitle_cn' => '适用于PB1系列纸垫机',
                'subtitle_en' => 'Compatible with PB1 series paper pad machines',
                'description_cn' => '专为PB1系列纸垫机设计的纸张支架，确保纸张顺利输送和稳定供应。采用高强度铝合金材质，轻便耐用。',
                'description_en' => 'Paper stand specially designed for PB1 series paper pad machines, ensuring smooth paper feeding and stable supply. Made of high-strength aluminum alloy, lightweight and durable.',
                'category' => '支架',
                'image_url' => '/images/shop/FS-002.jpg',
                'images' => array(
                    '/images/shop/FS-002_1.jpg',
                    '/images/shop/FS-002_2.jpg',
                ),
                'specs' => array(
                    '材质' => '铝合金',
                    '高度' => '固定85cm',
                    '最大承重' => '30kg',
                    '折叠' => '不支持',
                ),
                'parts' => array(
                    array(
                        'id' => 'BJT-PS-V1-2024',
                        'part_number' => 'BJT-PS-V1-2024',
                        'title_cn' => '纸张支架',
                        'title_en' => 'Paper Stand',
                        'specs' => array(
                            '电压' => 'N/A',
                            '频率' => 'N/A',
                            '托盘尺寸' => '80×60×100cm',
                            '一托数量' => '10件',
                        ),
                        'spec_cn' => '80×60×100cm, 6.5kg',
                        'spec_en' => '80×60×100cm, 6.5kg',
                        'spec_imperial' => '31.5×23.6×39.4inch, 14.3lbs',
                        'prices' => array(
                            'base' => 75,
                            'tier1' => 70,
                            'tier2' => 65,
                            'vip' => 60,
                        ),
                        'inventory' => array(
                            'CN' => 120,
                            'EU' => 12,
                            'NA' => 18,
                            'AU' => 8,
                        ),
                    ),
                ),
                'compatible_machines' => array(
                    'PB1-001',
                ),
                'features_cn' => array(
                    '轻量化设计',
                    '防滑底座',
                    '可调节张力',
                    '便携式结构',
                ),
                'features_en' => array(
                    'Lightweight design',
                    'Non-slip base',
                    'Adjustable tension',
                    'Portable structure',
                ),
                'documents' => array(
                    array(
                        'name_cn' => '使用说明',
                        'name_en' => 'User Guide',
                        'url' => '/docs/FS-002_guide.pdf',
                        'type' => 'pdf',
                    ),
                ),
            ),
        );
    }
    
    /**
     * 获取单个配件
     */
    private function get_accessory($id) {
        $accessories = $this->get_accessories();
        
        foreach ($accessories as $accessory) {
            if ($accessory['id'] === $id) {
                return $accessory;
            }
        }
        
        return null;
    }
    
    /**
     * 获取兼容的设备数据
     */
    private function get_compatible_machines_data($accessory_id) {
        $accessory = $this->get_accessory($accessory_id);
        
        if (!$accessory || empty($accessory['compatible_machines'])) {
            return array();
        }
        
        $machines_controller = new BJT_Machines_Controller();
        $all_machines = $machines_controller->get_machines();
        $compatible_machines = array();
        
        foreach ($all_machines as $machine) {
            if (in_array($machine['id'], $accessory['compatible_machines'])) {
                $compatible_machines[] = $machine;
            }
        }
        
        return $compatible_machines;
    }
    
    /**
     * 处理配件列表数据
     */
    private function prepare_accessories_for_response($accessories, $region, $lang) {
        $items = array();
        
        foreach ($accessories as $accessory) {
            $items[] = $this->prepare_accessory_for_response($accessory, $region, $lang);
        }
        
        return $items;
    }
    
    /**
     * 处理单个配件数据
     */
    private function prepare_accessory_for_response($accessory, $region, $lang, $include_details = false) {
        $title_field = 'title_' . $lang;
        $subtitle_field = 'subtitle_' . $lang;
        $description_field = 'description_' . $lang;
        $features_field = 'features_' . $lang;
        
        // 基本信息
        $item = array(
            'id' => $accessory['id'],
            'model' => $accessory['model'],
            'title' => $accessory[$title_field],
            'subtitle' => $accessory[$subtitle_field],
            'description' => $accessory[$description_field],
            'image_url' => $accessory['image_url'],
            'specs' => $accessory['specs'],
            'category' => $accessory['category'],
        );
        
        // 处理部件信息
        $parts = array();
        foreach ($accessory['parts'] as $part) {
            $part_title_field = 'title_' . $lang;
            $part_spec_field = 'spec_' . $lang;
            
            $part_item = array(
                'id' => $part['id'],
                'part_number' => $part['part_number'],
                'title' => $part[$part_title_field],
                'specs' => $part['specs'],
                'spec' => $part[$part_spec_field],
                'spec_imperial' => $part['spec_imperial'],
                'prices' => $part['prices'],
            );
            
            // 添加当前区域的库存
            $part_item['inventory'] = array();
            if (isset($part['inventory'][$region])) {
                $part_item['inventory'][] = array('region' => $region, 'amount' => $part['inventory'][$region]);
            } else {
                // 如果没有当前区域的库存，提供所有区域的库存
                foreach ($part['inventory'] as $reg => $amount) {
                    $part_item['inventory'][] = array('region' => $reg, 'amount' => $amount);
                }
            }
            
            $parts[] = $part_item;
        }
        $item['parts'] = $parts;
        
        // 如果需要，添加详细信息
        if ($include_details) {
            $item['images'] = $accessory['images'];
            $item['features'] = $accessory[$features_field];
            
            // 处理文档
            $documents = array();
            foreach ($accessory['documents'] as $document) {
                $documents[] = array(
                    'name' => $document['name_' . $lang],
                    'url' => $document['url'],
                    'type' => $document['type'],
                );
            }
            $item['documents'] = $documents;
            
            // 添加兼容设备信息
            $item['compatible_machines'] = $accessory['compatible_machines'];
        }
        
        return $item;
    }
} 