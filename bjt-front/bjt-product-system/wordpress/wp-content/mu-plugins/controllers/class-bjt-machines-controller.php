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
        global $wpdb;
        $host_part_number = $request->get_param('id'); // This is now the host part_number
        // $level_filter = $request->get_param('level'); // Level filter might apply to how deep we go in relations, but API doc example implies direct (level 1)
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // Optional: Validate if the host_part_number actually exists in wp_bjt_parts
        $parts_table = $wpdb->prefix . 'bjt_parts';
        $host_part_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$parts_table} WHERE part_number = %s", $host_part_number));
        if (!$host_part_exists) {
            return $this->error_response('指定的设备料号不存在 (Host part number not found)', 'host_part_not_found', 404);
        }

        $relations_table = $wpdb->prefix . 'bjt_relations';
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $accessory_models_table = $wpdb->prefix . 'bjt_accessory_models';
        $prices_table = $wpdb->prefix . 'bjt_prices';
        $inventory_table = $wpdb->prefix . 'bjt_inventory';

        // Query to find direct accessory part numbers linked to the host_part_number
        // Based on user definition: wp_bjt_relations.part_number is the parent (host_part_number here)
        // and wp_bjt_relations.child_part_number is the accessory part number.
        $query = $wpdb->prepare(
            "SELECT DISTINCT r.child_part_number 
             FROM {$relations_table} r
             WHERE r.part_number = %s AND r.child_type = 'accessory' AND r.status = 'publish'",
            $host_part_number
        );
        
        $accessory_pns_results = $wpdb->get_col($query);

        if (empty($accessory_pns_results)) {
            return $this->success_response(array('items' => array(), 'total' => 0));
        }
        
        $grouped_accessories = array();

        foreach ($accessory_pns_results as $acc_pn) {
            // Fetch accessory details from wp_bjt_accessories
            $accessory_detail = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM {$accessories_table} WHERE part_number = %s AND status = 'publish'", $acc_pn),
                ARRAY_A
            );

            if ($accessory_detail) {
                $accessory_db_id = $accessory_detail['id']; // Database ID for price/inventory lookups
                $accessory_model_code = $accessory_detail['model'];

                // Fetch accessory model details from wp_bjt_accessory_models
                $accessory_model_detail = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM {$accessory_models_table} WHERE model = %s AND status = 'publish'", $accessory_model_code),
                    ARRAY_A
                );

                if (!$accessory_model_detail) {
                    // If accessory model not found or not published, skip this accessory.
                    continue;
                }

                if (!isset($grouped_accessories[$accessory_model_code])) {
                    $grouped_accessories[$accessory_model_code] = array(
                        'id' => $accessory_model_code,
                        'model' => $lang === 'en' ? ($accessory_model_detail['title_en'] ?: $accessory_model_detail['title_zh']) : ($accessory_model_detail['title_zh'] ?: $accessory_model_detail['title_en']),
                        'title' => $lang === 'en' ? ($accessory_model_detail['title_en'] ?: $accessory_model_detail['title_zh']) : ($accessory_model_detail['title_zh'] ?: $accessory_model_detail['title_en']),
                        'level' => 1, // Per API documentation structure for direct accessories
                        'image_url' => $accessory_model_detail['image1_url'] ?: ($accessory_model_detail['image2_url'] ?: ''),
                        'parts' => array()
                    );
                }
                
                // Fetch pricing information
                $price_data_raw = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT base_price, currency, discount_rate FROM {$prices_table} 
                         WHERE target_type = 'accessory' AND target_id = %d AND region = %s AND status = 'active' 
                         ORDER BY min_quantity ASC LIMIT 1",
                        $accessory_db_id,
                        $region
                    ),
                    ARRAY_A
                );
                $price_data = $price_data_raw ?: new stdClass(); // Use empty object if no price

                // Fetch inventory information
                $inventory_data_raw = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT warehouse, quantity, reserved, status FROM {$inventory_table} 
                         WHERE target_type = 'accessory' AND target_id = %d AND region = %s AND status = 'active'",
                        $accessory_db_id,
                        $region
                    ),
                    ARRAY_A
                );
                $inventory_data_array = array();
                if (!empty($inventory_data_raw)) {
                    foreach($inventory_data_raw as $inv_item) {
                         $inventory_data_array[] = array(
                            'region' => $region, // Already filtered by region
                            'warehouse' => $inv_item['warehouse'],
                            'quantity' => (int) $inv_item['quantity'],
                            'reserved' => (int) $inv_item['reserved'],
                            'status' => $inv_item['status'] // 'active', 'inactive' etc. from DB
                        );
                    }
                }


                // Prepare the 'part' item for the response, mirroring API doc structure
                $part_item = array(
                    'id' => $accessory_detail['part_number'], 
                    'part_number' => $accessory_detail['part_number'],
                    'title' => $lang === 'en' ? ($accessory_detail['name_en'] ?: $accessory_detail['name_zh']) : ($accessory_detail['name_zh'] ?: $accessory_detail['name_en']),
                    // The 'specs' object in API doc is complex and its keys are localized.
                    // This example provides a simplified structure. Full mapping from db columns to localized spec keys would be needed.
                    'specs' => array( // Simplified - needs proper mapping
                        ($lang === 'en' ? 'Voltage' : '电压') => $accessory_detail['voltage'] ?: 'N/A',
                        ($lang === 'en' ? 'Frequency' : '频率') => $accessory_detail['frequency'] ?: 'N/A',
                        // Add other relevant specs here, mapping DB columns to localized keys
                    ),
                    'spec' => $lang === 'en' ? ($accessory_detail['spec_imperial'] ?: $accessory_detail['spec']) : $accessory_detail['spec'],
                    'spec_imperial' => $accessory_detail['spec_imperial'],
                    'prices' => $price_data, 
                    'inventory' => $inventory_data_array 
                );
                
                $grouped_accessories[$accessory_model_code]['parts'][] = $part_item;
            }
        }
        
        $final_items = array_values($grouped_accessories);
        
        return $this->success_response(array(
            'items' => $final_items,
            'total' => count($final_items),
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
} 