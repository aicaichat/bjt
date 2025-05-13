<?php
/**
 * BJT Machines Controller
 * 
 * 处理设备相关的API请求
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT设备控制器类
 */
class BJT_Machines_Controller extends BJT_API_Controller {
    /**
     * 资源基础
     */
    protected $rest_base = 'machines';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // 获取设备列表
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
        
        // 获取单个设备
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '设备ID',
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
        
        // 获取设备配件
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w-]+)/accessories', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_accessories'),
                'permission_callback' => array($this, 'check_authentication'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'type' => 'string',
                        'description' => '设备ID',
                    ),
                    'level' => array(
                        'default' => 1,
                        'type' => 'integer',
                        'minimum' => 1,
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
     * 获取设备列表
     */
    public function get_items($request) {
        $page = $request->get_param('page');
        $per_page = $request->get_param('page_size');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        $category = $request->get_param('category');
        
        // 获取所有设备
        $machines = $this->get_machines();
        
        // 如果有分类，进行筛选
        if ($category) {
            $machines = array_filter($machines, function($machine) use ($category) {
                return $machine['category'] === $category;
            });
        }
        
        // 计算分页
        $total = count($machines);
        $offset = ($page - 1) * $per_page;
        $items = array_slice($machines, $offset, $per_page);
        
        // 根据语言和区域处理数据
        $items = $this->prepare_machines_for_response($items, $region, $lang);
        
        return $this->get_paginated_response($items, $total, $request);
    }
    
    /**
     * 获取单个设备
     */
    public function get_item($request) {
        $id = $request->get_param('id');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取设备
        $machine = $this->get_machine($id);
        
        if (!$machine) {
            return $this->error_response('找不到指定的设备', 'machine_not_found', 404);
        }
        
        // 根据语言和区域处理数据
        $item = $this->prepare_machine_for_response($machine, $region, $lang, true);
        
        return $this->success_response($item);
    }
    
    /**
     * 获取设备配件
     */
    public function get_accessories($request) {
        $id = $request->get_param('id');
        $level = $request->get_param('level');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // 获取设备
        $machine = $this->get_machine($id);
        
        if (!$machine) {
            return $this->error_response('找不到指定的设备', 'machine_not_found', 404);
        }
        
        // 获取设备配件
        $accessories = $this->get_machine_accessories($id, $level);
        
        // 根据语言和区域处理数据
        $items = $this->prepare_accessories_for_response($accessories, $region, $lang);
        
        return $this->success_response(array(
            'items' => $items,
            'total' => count($items),
        ));
    }
    
    /**
     * 获取所有设备
     */
    private function get_machines() {
        // 模拟数据，实际应从数据库获取
        return array(
            array(
                'id' => 'MEY-001',
                'model' => 'MEY',
                'name_cn' => '气垫机 Pro - MEY系列',
                'name_en' => 'Air Cushion Machine Pro - MEY Series',
                'subtitle_cn' => '高效气泡缓冲包装解决方案',
                'subtitle_en' => 'High-efficiency bubble cushioning packaging solution',
                'description_cn' => '气垫机 Pro - MEY 系列是我们的高端气垫制造设备，专为高产能环境设计。它可以快速生成气垫膜，提供卓越的产品保护。',
                'description_en' => 'The Air Cushion Machine Pro - MEY Series is our high-end air cushion manufacturing equipment designed for high-capacity environments. It quickly generates air cushion film, providing superior product protection.',
                'category' => '气垫机',
                'image_url' => '/images/shop/MEY.jpg',
                'images' => array(
                    '/images/shop/MEY_1.jpg',
                    '/images/shop/MEY_2.jpg',
                ),
                'specs' => array(
                    '电压' => '220V/110V',
                    '功率' => '250W',
                    '尺寸' => '560 x 350 x 334 mm',
                    '重量' => '13.5 kg',
                ),
                'inventory' => array(
                    'CN' => 245,
                    'EU' => 78,
                    'NA' => 120,
                    'AU' => 46,
                ),
                'prices' => array(
                    'base' => 12800,
                    'tier1' => 12000,
                    'tier2' => 11500,
                    'vip' => 11000,
                ),
                'features_cn' => array(
                    '高效率气垫制造',
                    '自动换卷功能',
                    '智能压力控制',
                ),
                'features_en' => array(
                    'High-efficiency air cushion production',
                    'Automatic roll change function',
                    'Intelligent pressure control',
                ),
                'documents' => array(
                    array(
                        'name_cn' => '产品说明书',
                        'name_en' => 'Product Manual',
                        'url' => '/docs/MEY_manual.pdf',
                        'type' => 'pdf',
                    ),
                    array(
                        'name_cn' => '规格参数表',
                        'name_en' => 'Specifications Sheet',
                        'url' => '/docs/MEY_specs.pdf',
                        'type' => 'pdf',
                    ),
                ),
                'videos' => array(
                    array(
                        'title_cn' => '产品演示视频',
                        'title_en' => 'Product Demo Video',
                        'url' => 'https://www.youtube.com/watch?v=abcdefg',
                        'thumbnail' => '/images/shop/MEY_video_thumb.jpg',
                    ),
                ),
            ),
            array(
                'id' => 'PB1-001',
                'model' => 'PB1',
                'name_cn' => '纸垫机 - PB1系列',
                'name_en' => 'Paper Pad Machine - PB1 Series',
                'subtitle_cn' => '环保包装纸垫解决方案',
                'subtitle_en' => 'Eco-friendly paper pad packaging solution',
                'description_cn' => '纸垫机 - PB1 系列是我们的环保包装解决方案，使用牛皮纸生成缓冲纸垫，适合多种产品的保护包装。',
                'description_en' => 'The Paper Pad Machine - PB1 Series is our eco-friendly packaging solution that generates cushioning paper pads using kraft paper, suitable for protective packaging of various products.',
                'category' => '纸垫机',
                'image_url' => '/images/shop/PB1.jpg',
                'images' => array(
                    '/images/shop/PB1_1.jpg',
                    '/images/shop/PB1_2.jpg',
                ),
                'specs' => array(
                    '电压' => '220V/110V',
                    '功率' => '200W',
                    '尺寸' => '520 x 320 x 300 mm',
                    '重量' => '12 kg',
                ),
                'inventory' => array(
                    'CN' => 180,
                    'EU' => 60,
                    'NA' => 90,
                    'AU' => 35,
                ),
                'prices' => array(
                    'base' => 10500,
                    'tier1' => 10000,
                    'tier2' => 9500,
                    'vip' => 9000,
                ),
                'features_cn' => array(
                    '环保材料',
                    '可调节垫子长度',
                    '低噪音运行',
                ),
                'features_en' => array(
                    'Eco-friendly materials',
                    'Adjustable pad length',
                    'Low noise operation',
                ),
                'documents' => array(
                    array(
                        'name_cn' => '产品说明书',
                        'name_en' => 'Product Manual',
                        'url' => '/docs/PB1_manual.pdf',
                        'type' => 'pdf',
                    ),
                ),
                'videos' => array(
                    array(
                        'title_cn' => '产品演示视频',
                        'title_en' => 'Product Demo Video',
                        'url' => 'https://www.youtube.com/watch?v=hijklmn',
                        'thumbnail' => '/images/shop/PB1_video_thumb.jpg',
                    ),
                ),
            ),
        );
    }
    
    /**
     * 获取单个设备
     */
    private function get_machine($id) {
        $machines = $this->get_machines();
        
        foreach ($machines as $machine) {
            if ($machine['id'] === $id) {
                return $machine;
            }
        }
        
        return null;
    }
    
    /**
     * 获取设备配件
     */
    private function get_machine_accessories($machine_id, $level) {
        // 模拟数据，实际应从数据库获取
        $accessories = array(
            'MEY-001' => array(
                array(
                    'id' => 'FS-001',
                    'model' => 'Floor Stand',
                    'title_cn' => '地面支架组件',
                    'title_en' => 'Floor Stand Assembly',
                    'level' => 1,
                    'image_url' => '/images/shop/FS-001.jpg',
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
                ),
                array(
                    'id' => 'PH-001',
                    'model' => 'Print Head',
                    'title_cn' => '打印头组件',
                    'title_en' => 'Print Head Assembly',
                    'level' => 2,
                    'image_url' => '/images/shop/PH-001.jpg',
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
                ),
            ),
            'PB1-001' => array(
                array(
                    'id' => 'FS-002',
                    'model' => 'Paper Stand',
                    'title_cn' => '纸张支架',
                    'title_en' => 'Paper Stand',
                    'level' => 1,
                    'image_url' => '/images/shop/FS-002.jpg',
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
                ),
            ),
        );
        
        // 根据级别筛选
        if (isset($accessories[$machine_id])) {
            return array_filter($accessories[$machine_id], function($accessory) use ($level) {
                return $accessory['level'] === $level;
            });
        }
        
        return array();
    }
    
    /**
     * 处理设备列表数据
     */
    private function prepare_machines_for_response($machines, $region, $lang) {
        $items = array();
        
        foreach ($machines as $machine) {
            $items[] = $this->prepare_machine_for_response($machine, $region, $lang);
        }
        
        return $items;
    }
    
    /**
     * 处理单个设备数据
     */
    private function prepare_machine_for_response($machine, $region, $lang, $include_details = false) {
        $name_field = 'name_' . $lang;
        $subtitle_field = 'subtitle_' . $lang;
        $description_field = 'description_' . $lang;
        $features_field = 'features_' . $lang;
        
        // 基本信息
        $item = array(
            'id' => $machine['id'],
            'model' => $machine['model'],
            'name' => $machine[$name_field],
            'subtitle' => $machine[$subtitle_field],
            'description' => $machine[$description_field],
            'image_url' => $machine['image_url'],
            'specs' => $machine['specs'],
        );
        
        // 库存和价格
        $item['inventory'] = array();
        if (isset($machine['inventory'][$region])) {
            $item['inventory'] = array(
                array('region' => $region, 'amount' => $machine['inventory'][$region]),
            );
        } else {
            // 如果没有当前区域的库存，提供所有区域的库存
            foreach ($machine['inventory'] as $reg => $amount) {
                $item['inventory'][] = array('region' => $reg, 'amount' => $amount);
            }
        }
        
        $item['prices'] = $machine['prices'];
        
        // 如果需要，添加详细信息
        if ($include_details) {
            $item['images'] = $machine['images'];
            $item['features'] = $machine[$features_field];
            
            // 处理文档和视频
            $documents = array();
            foreach ($machine['documents'] as $document) {
                $documents[] = array(
                    'name' => $document['name_' . $lang],
                    'url' => $document['url'],
                    'type' => $document['type'],
                );
            }
            $item['documents'] = $documents;
            
            $videos = array();
            foreach ($machine['videos'] as $video) {
                $videos[] = array(
                    'title' => $video['title_' . $lang],
                    'url' => $video['url'],
                    'thumbnail' => $video['thumbnail'],
                );
            }
            $item['videos'] = $videos;
        }
        
        return $item;
    }
    
    /**
     * 处理配件列表数据
     */
    private function prepare_accessories_for_response($accessories, $region, $lang) {
        $items = array();
        
        foreach ($accessories as $accessory) {
            $title_field = 'title_' . $lang;
            
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
            
            $items[] = array(
                'id' => $accessory['id'],
                'model' => $accessory['model'],
                'title' => $accessory[$title_field],
                'level' => $accessory['level'],
                'image_url' => $accessory['image_url'],
                'parts' => $parts,
            );
        }
        
        return $items;
    }
} 