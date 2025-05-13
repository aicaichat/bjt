<?php
/**
 * BJT Consumables Controller
 * 
 * 处理耗材相关的API请求
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT耗材控制器类
 */
class BJT_Consumables_Controller extends BJT_API_Controller {
    /**
     * 资源基础
     */
    protected $rest_base = 'consumables';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 获取耗材列表
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
        
        // 获取单个耗材
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '耗材ID',
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
        
        // 获取耗材适用的设备
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)/machines', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_compatible_machines'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '耗材ID',
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
     * 获取耗材列表
     */
    public function get_items($request) {
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        $category = $request->get_param('category');
        
        // 获取所有耗材
        $consumables = $this->get_consumables();
        
        // 如果有分类，进行筛选
        if ($category) {
            $consumables = array_filter($consumables, function($consumable) use ($category) {
                return $consumable['category'] === $category;
            });
        }
        
        // 计算分页
        $total = count($consumables);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($consumables, $offset, $per_page);
        
        // 根据语言和区域处理数据
        $items = $this->prepare_consumables_for_response($items, $region, $lang);
        
        return $this->get_paginated_response($items, $total, $request);
    }
    
    /**
     * 获取单个耗材
     */
    public function get_item($request) {
        $id = $request->get_param('id');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取耗材
        $consumable = $this->get_consumable($id);
        
        if (!$consumable) {
            return $this->error_response('找不到指定的耗材', 'consumable_not_found', 404);
        }
        
        // 根据语言和区域处理数据
        $item = $this->prepare_consumable_for_response($consumable, $region, $lang, true);
        
        return $this->success_response($item);
    }
    
    /**
     * 获取耗材适用的设备
     */
    public function get_compatible_machines($request) {
        $id = $request->get_param('id');
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取耗材
        $consumable = $this->get_consumable($id);
        
        if (!$consumable) {
            return $this->error_response('找不到指定的耗材', 'consumable_not_found', 404);
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
     * 获取所有耗材
     */
    private function get_consumables() {
        // 模拟数据，实际应从数据库获取
        return array(
            array(
                'id' => 'ACF-350',
                'model' => 'ACF-350',
                'title_cn' => '气垫膜 - 标准型',
                'title_en' => 'Air Cushion Film - Standard',
                'subtitle_cn' => '350mm宽高韧性气垫膜',
                'subtitle_en' => '350mm wide high-tenacity air cushion film',
                'description_cn' => '标准型气垫膜，宽度350mm，适用于MEY系列气垫机。采用优质PE材料制造，具有优异的韧性和透明度，提供卓越的缓冲保护效果。',
                'description_en' => 'Standard air cushion film, 350mm wide, suitable for MEY series air cushion machines. Made of high-quality PE material with excellent tenacity and transparency, providing superior cushioning protection.',
                'category' => '气垫膜',
                'image_url' => '/images/shop/ACF-350.jpg',
                'images' => array(
                    '/images/shop/ACF-350_1.jpg',
                    '/images/shop/ACF-350_2.jpg',
                ),
                'specs' => array(
                    '宽度' => '350mm',
                    '厚度' => '25μm',
                    '长度' => '300m/卷',
                    '材质' => 'PE',
                ),
                'specs_imperial' => array(
                    '宽度' => '13.8英寸',
                    '厚度' => '1mil',
                    '长度' => '984英尺/卷',
                    '材质' => 'PE',
                ),
                'package_specs' => array(
                    '包装尺寸' => '360×360×150mm',
                    '毛重' => '4.2kg',
                    '净重' => '4kg',
                    '单箱数量' => '1卷',
                ),
                'package_specs_imperial' => array(
                    '包装尺寸' => '14.2×14.2×5.9英寸',
                    '毛重' => '9.3磅',
                    '净重' => '8.8磅',
                    '单箱数量' => '1卷',
                ),
                'prices' => array(
                    'base' => 199,
                    'tier1' => 189,
                    'tier2' => 179,
                    'vip' => 169,
                ),
                'inventory' => array(
                    'CN' => 1200,
                    'EU' => 450,
                    'NA' => 680,
                    'AU' => 320,
                ),
                'compatible_machines' => array(
                    'MEY-001',
                ),
                'features_cn' => array(
                    '高韧性',
                    '透明度好',
                    '防静电处理',
                    '环保可降解',
                ),
                'features_en' => array(
                    'High tenacity',
                    'Good transparency',
                    'Anti-static treatment',
                    'Environmentally degradable',
                ),
                'docs' => array(
                    array(
                        'name_cn' => '产品规格书',
                        'name_en' => 'Product Specification',
                        'url' => '/docs/ACF-350_spec.pdf',
                        'type' => 'pdf',
                    ),
                    array(
                        'name_cn' => '使用指南',
                        'name_en' => 'Usage Guide',
                        'url' => '/docs/ACF-350_guide.pdf',
                        'type' => 'pdf',
                    ),
                ),
            ),
            array(
                'id' => 'KPR-400',
                'model' => 'KPR-400',
                'title_cn' => '牛皮纸卷 - 加强型',
                'title_en' => 'Kraft Paper Roll - Reinforced',
                'subtitle_cn' => '400mm宽高强度牛皮纸',
                'subtitle_en' => '400mm wide high-strength kraft paper',
                'description_cn' => '加强型牛皮纸卷，宽度400mm，适用于PB1系列纸垫机。采用100%再生纸制造，具有优异的强度和韧性，提供可靠的环保包装解决方案。',
                'description_en' => 'Reinforced kraft paper roll, 400mm wide, suitable for PB1 series paper pad machines. Made of 100% recycled paper, featuring excellent strength and tenacity, providing a reliable eco-friendly packaging solution.',
                'category' => '纸垫材料',
                'image_url' => '/images/shop/KPR-400.jpg',
                'images' => array(
                    '/images/shop/KPR-400_1.jpg',
                    '/images/shop/KPR-400_2.jpg',
                ),
                'specs' => array(
                    '宽度' => '400mm',
                    '厚度' => '80g/㎡',
                    '长度' => '250m/卷',
                    '材质' => '再生牛皮纸',
                ),
                'specs_imperial' => array(
                    '宽度' => '15.7英寸',
                    '厚度' => '80gsm',
                    '长度' => '820英尺/卷',
                    '材质' => '再生牛皮纸',
                ),
                'package_specs' => array(
                    '包装尺寸' => '420×420×200mm',
                    '毛重' => '8.5kg',
                    '净重' => '8kg',
                    '单箱数量' => '1卷',
                ),
                'package_specs_imperial' => array(
                    '包装尺寸' => '16.5×16.5×7.9英寸',
                    '毛重' => '18.7磅',
                    '净重' => '17.6磅',
                    '单箱数量' => '1卷',
                ),
                'prices' => array(
                    'base' => 158,
                    'tier1' => 148,
                    'tier2' => 138,
                    'vip' => 128,
                ),
                'inventory' => array(
                    'CN' => 780,
                    'EU' => 320,
                    'NA' => 450,
                    'AU' => 180,
                ),
                'compatible_machines' => array(
                    'PB1-001',
                ),
                'features_cn' => array(
                    '高强度',
                    '100%可回收',
                    '优质纸质',
                    '无荧光剂',
                ),
                'features_en' => array(
                    'High strength',
                    '100% recyclable',
                    'Premium paper quality',
                    'No fluorescent agents',
                ),
                'docs' => array(
                    array(
                        'name_cn' => '产品规格书',
                        'name_en' => 'Product Specification',
                        'url' => '/docs/KPR-400_spec.pdf',
                        'type' => 'pdf',
                    ),
                ),
            ),
        );
    }
    
    /**
     * 获取单个耗材
     */
    private function get_consumable($id) {
        $consumables = $this->get_consumables();
        
        foreach ($consumables as $consumable) {
            if ($consumable['id'] === $id) {
                return $consumable;
            }
        }
        
        return null;
    }
    
    /**
     * 获取兼容的设备数据
     */
    private function get_compatible_machines_data($consumable_id) {
        $consumable = $this->get_consumable($consumable_id);
        
        if (!$consumable || empty($consumable['compatible_machines'])) {
            return array();
        }
        
        $machines_controller = new BJT_Machines_Controller();
        $all_machines = $machines_controller->get_machines();
        $compatible_machines = array();
        
        foreach ($all_machines as $machine) {
            if (in_array($machine['id'], $consumable['compatible_machines'])) {
                $compatible_machines[] = $machine;
            }
        }
        
        return $compatible_machines;
    }
    
    /**
     * 处理耗材列表数据
     */
    private function prepare_consumables_for_response($consumables, $region, $lang) {
        $items = array();
        
        foreach ($consumables as $consumable) {
            $items[] = $this->prepare_consumable_for_response($consumable, $region, $lang);
        }
        
        return $items;
    }
    
    /**
     * 处理单个耗材数据
     */
    private function prepare_consumable_for_response($consumable, $region, $lang, $include_details = false) {
        $title_field = 'title_' . $lang;
        $subtitle_field = 'subtitle_' . $lang;
        $description_field = 'description_' . $lang;
        $features_field = 'features_' . $lang;
        
        // 基本信息
        $item = array(
            'id' => $consumable['id'],
            'model' => $consumable['model'],
            'title' => $consumable[$title_field],
            'subtitle' => $consumable[$subtitle_field],
            'description' => $consumable[$description_field],
            'image_url' => $consumable['image_url'],
            'category' => $consumable['category'],
        );
        
        // 规格信息
        if ($lang === 'en') {
            $item['specs'] = $consumable['specs_imperial'];
            $item['package_specs'] = $consumable['package_specs_imperial'];
        } else {
            $item['specs'] = $consumable['specs'];
            $item['package_specs'] = $consumable['package_specs'];
        }
        
        // 价格和库存
        $item['prices'] = $consumable['prices'];
        
        // 添加当前区域的库存
        $item['inventory'] = array();
        if (isset($consumable['inventory'][$region])) {
            $item['inventory'][] = array('region' => $region, 'amount' => $consumable['inventory'][$region]);
        } else {
            // 如果没有当前区域的库存，提供所有区域的库存
            foreach ($consumable['inventory'] as $reg => $amount) {
                $item['inventory'][] = array('region' => $reg, 'amount' => $amount);
            }
        }
        
        // 如果需要，添加详细信息
        if ($include_details) {
            $item['images'] = $consumable['images'];
            $item['features'] = $consumable[$features_field];
            
            // 处理文档
            $documents = array();
            foreach ($consumable['docs'] as $document) {
                $documents[] = array(
                    'name' => $document['name_' . $lang],
                    'url' => $document['url'],
                    'type' => $document['type'],
                );
            }
            $item['documents'] = $documents;
            
            // 添加兼容设备信息
            $item['compatible_machines'] = $consumable['compatible_machines'];
        }
        
        return $item;
    }
} 