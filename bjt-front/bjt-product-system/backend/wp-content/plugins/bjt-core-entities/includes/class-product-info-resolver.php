<?php
/**
 * 产品信息解析器 - 确保订单中的主机、配件、备件、耗材都能正确查找
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Info_Resolver {
    
    /**
     * 根据料号和类型获取产品详细信息
     * 这是核心方法，保证所有产品类型都能正确查找
     * 优先使用订单项中的 item_type，这是最准确的产品类型标识
     */
    public static function get_product_details($part_number, $product_type, $target_id = null) {
        global $wpdb;
        
        error_log("🎯 [Product Resolver] 开始查询: PartNumber={$part_number}, Type={$product_type}, TargetId={$target_id}");
        
        // 🎯 策略1: 如果有target_id，优先使用ID查询（最精确）
        if (!empty($target_id) && is_numeric($target_id)) {
            error_log("🔍 [Product Resolver] 策略1: 使用目标ID查询 {$target_id}");
            $result = self::get_product_details_by_id(intval($target_id), $product_type);
            if ($result) {
                error_log("✅ [Product Resolver] 策略1成功: 通过ID找到产品: ID={$target_id}, Type={$product_type}, PartNumber={$part_number}");
                return $result;
            } else {
                error_log("⚠️ [Product Resolver] 策略1失败: ID={$target_id} 在类型 {$product_type} 中未找到");
            }
        }
        
        // 🎯 策略2: 使用订单项类型 + 料号查询（最常用的准确方式）
        error_log("🔍 [Product Resolver] 策略2: 使用订单类型 {$product_type} + 料号 {$part_number} 查询");
        $result = self::get_product_details_by_part_number($part_number, $product_type);
        if ($result) {
            error_log("✅ [Product Resolver] 策略2成功: 通过料号找到产品: PartNumber={$part_number}, Type={$product_type}");
            return $result;
        } else {
            error_log("⚠️ [Product Resolver] 策略2失败: 料号 {$part_number} 在类型 {$product_type} 中未找到");
        }
        
        // 🎯 策略3: 模糊匹配（解决料号数据不一致问题）
        error_log("🔍 [Product Resolver] 策略3: 启动模糊匹配，解决料号数据不一致");
        $result = self::get_product_details_by_fuzzy_match($part_number, $product_type);
        if ($result) {
            error_log("✅ [Product Resolver] 策略3成功: 通过模糊匹配找到产品: PartNumber={$part_number}, Type={$product_type}");
            return $result;
        }
        
        // 🎯 策略4: 如果指定类型没找到，尝试所有类型（容错机制）
        error_log("🔍 [Product Resolver] 策略4: 启动容错机制，遍历所有产品类型");
        $all_types = ['machine', 'spare_part', 'accessory', 'consumable'];
        foreach ($all_types as $type) {
            if ($type === $product_type) continue; // 跳过已经尝试过的类型
            
            error_log("🔍 [Product Resolver] 策略4: 尝试类型 {$type}");
            $result = self::get_product_details_by_part_number($part_number, $type);
            if ($result) {
                error_log("⚠️ [Product Resolver] 策略4成功: 类型不匹配但找到产品: PartNumber={$part_number}, ExpectedType={$product_type}, ActualType={$type}");
                return $result;
            }
        }
        
        error_log("❌ [Product Resolver] 所有策略失败: 未找到产品: PartNumber={$part_number}, Type={$product_type}, TargetId={$target_id}");
        return null;
    }
    
    /**
     * 通过ID查询产品信息
     */
    private static function get_product_details_by_id($product_id, $product_type) {
        global $wpdb;
        
        $table_map = [
            'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
            'accessory' => $wpdb->prefix . 'bjt_accessories', 
            'consumable' => $wpdb->prefix . 'bjt_consumables',
            'machine' => $wpdb->prefix . 'bjt_parts'
        ];
        
        if (!isset($table_map[$product_type])) {
            return null;
        }
        
        $table_name = $table_map[$product_type];
        
        switch ($product_type) {
            case 'machine':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT model, brand, spec, '' as properties, name_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE id = %d LIMIT 1",
                    $product_id
                ));
                break;
                
            case 'spare_part':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(NULLIF(model, ''), app_model, '') as model, '' as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE id = %d LIMIT 1",
                    $product_id
                ));
                break;
                
            case 'consumable':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(model, '') as model, COALESCE(brand, '') as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, 
                            COALESCE(name_zh, title_zh, '') AS name_zh, 
                            COALESCE(name_en, title_en, '') AS name_en, 
                            product_line_id as category,
                            COALESCE(model_imperial, '') as model_imperial,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE id = %d LIMIT 1",
                    $product_id
                ));
                break;
                
            case 'accessory':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(model, '') as model, COALESCE(brand, '') as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE id = %d LIMIT 1",
                    $product_id
                ));
                break;
                
            default:
                return null;
        }
        
        return self::process_product_result($product, $product_id, $product_type);
    }
    
    /**
     * 处理产品查询结果，生成缺失的产品名称
     */
    private static function process_product_result($product, $identifier, $product_type) {
        if (!$product) {
            return null;
        }
        
        $result = (array)$product;
        
        // 🔧 修复：当name_zh和name_en为空时，生成合理的产品名称
        if (empty($result['name_zh']) && empty($result['name_en'])) {
            error_log("⚠️ [Product Resolver] 产品名称字段为空，尝试生成: Identifier={$identifier}, Type={$product_type}");
            
            // 优先使用型号作为产品名称
            if (!empty($result['model'])) {
                $result['name_zh'] = $result['model'];
                $result['name_en'] = $result['model'];
                error_log("✅ [Product Resolver] 使用型号作为产品名称: {$result['model']}");
            }
            // 其次使用规格的第一部分
            elseif (!empty($result['spec'])) {
                $spec_parts = explode(',', $result['spec']);
                $name = trim($spec_parts[0]);
                $result['name_zh'] = $name;
                $result['name_en'] = $name;
                error_log("✅ [Product Resolver] 使用规格作为产品名称: {$name}");
            }
            // 最后使用标识符
            else {
                $result['name_zh'] = $identifier;
                $result['name_en'] = $identifier;
                error_log("✅ [Product Resolver] 使用标识符作为产品名称: {$identifier}");
            }
        }
        
        return $result;
    }
    
    /**
     * 通过料号查询产品信息
     */
    private static function get_product_details_by_part_number($part_number, $product_type) {
        global $wpdb;
        
        $table_map = [
            'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
            'accessory' => $wpdb->prefix . 'bjt_accessories', 
            'consumable' => $wpdb->prefix . 'bjt_consumables',
            'machine' => $wpdb->prefix . 'bjt_parts'
        ];
        
        if (!isset($table_map[$product_type])) {
            return null;
        }
        
        $table_name = $table_map[$product_type];
        
        switch ($product_type) {
            case 'machine':
                // 多策略查询主机
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT model, brand, spec, '' as properties, name_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE part_number = %s LIMIT 1",
                    $part_number
                ));
                
                if (!$product) {
                    $product = $wpdb->get_row($wpdb->prepare(
                        "SELECT model, brand, spec, '' as properties, name_zh as description, name_zh, name_en, product_line_id as category,
                                COALESCE(spec_imperial, '') as spec_imperial
                         FROM {$table_name} WHERE model = %s LIMIT 1",
                        $part_number
                    ));
                }
                break;
                
            case 'spare_part':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(NULLIF(model, ''), app_model, '') as model, '' as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE part_number = %s LIMIT 1",
                    $part_number
                ));
                break;
                
            case 'consumable':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(model, '') as model, COALESCE(brand, '') as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, 
                            COALESCE(name_zh, title_zh, '') AS name_zh, 
                            COALESCE(name_en, title_en, '') AS name_en, 
                            product_line_id as category,
                            COALESCE(model_imperial, '') as model_imperial,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE part_number = %s LIMIT 1",
                    $part_number
                ));
                break;
                
            case 'accessory':
                $product = $wpdb->get_row($wpdb->prepare(
                    "SELECT COALESCE(model, '') as model, COALESCE(brand, '') as brand, 
                            COALESCE(spec, description_zh, '') as spec, '' as properties, 
                            description_zh as description, name_zh, name_en, product_line_id as category,
                            COALESCE(spec_imperial, '') as spec_imperial
                     FROM {$table_name} WHERE part_number = %s LIMIT 1",
                    $part_number
                ));
                break;
                
            default:
                return null;
        }
        
        return self::process_product_result($product, $part_number, $product_type);
    }
    
    /**
     * 模糊匹配产品信息（解决料号数据不一致问题）
     */
    private static function get_product_details_by_fuzzy_match($part_number, $product_type) {
        global $wpdb;
        
        $table_map = [
            'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
            'accessory' => $wpdb->prefix . 'bjt_accessories', 
            'consumable' => $wpdb->prefix . 'bjt_consumables',
            'machine' => $wpdb->prefix . 'bjt_parts'
        ];
        
        if (!isset($table_map[$product_type])) {
            return null;
        }
        
        $table_name = $table_map[$product_type];
        
        // 策略1: 数据库料号包含订单料号（如：92R01006666 包含 92R01006）
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE part_number LIKE %s ORDER BY CHAR_LENGTH(part_number) ASC LIMIT 1",
            $part_number . '%'
        ));
        
        if ($product) {
            error_log("✅ [Product Resolver - Fuzzy] 策略1成功: 数据库料号包含订单料号: {$product->part_number} 包含 {$part_number}");
            return self::format_product_result($product, $product_type);
        }
        
        // 策略2: 订单料号包含数据库料号（如：92R01006666 被包含在 92R010066661234 中）
        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE %s LIKE CONCAT('%', part_number, '%') ORDER BY CHAR_LENGTH(part_number) DESC LIMIT 1",
            $part_number
        ));
        
        if ($product) {
            error_log("✅ [Product Resolver - Fuzzy] 策略2成功: 订单料号包含数据库料号: {$part_number} 包含 {$product->part_number}");
            return self::format_product_result($product, $product_type);
        }
        
        // 策略3: 相似度匹配（编辑距离小于3的料号）
        $similar_products = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE part_number LIKE %s OR part_number LIKE %s LIMIT 5",
            '%' . substr($part_number, 0, 6) . '%',
            '%' . substr($part_number, -6) . '%'
        ));
        
        if ($similar_products) {
            // 找到最相似的料号
            $best_match = null;
            $min_distance = PHP_INT_MAX;
            
            foreach ($similar_products as $candidate) {
                $distance = levenshtein($part_number, $candidate->part_number);
                if ($distance < $min_distance && $distance <= 3) { // 允许最多3个字符差异
                    $min_distance = $distance;
                    $best_match = $candidate;
                }
            }
            
            if ($best_match) {
                error_log("✅ [Product Resolver - Fuzzy] 策略3成功: 相似度匹配: {$best_match->part_number} (距离: {$min_distance})");
                return self::format_product_result($best_match, $product_type);
            }
        }
        
        return null;
    }
    
    /**
     * 格式化产品结果
     */
    private static function format_product_result($product, $product_type) {
        switch ($product_type) {
            case 'machine':
                $result = [
                    'model' => $product->model ?? '',
                    'brand' => $product->brand ?? '',
                    'spec' => $product->spec ?? '',
                    'properties' => '',
                    'description' => $product->name_zh ?? '',
                    'name_zh' => $product->name_zh ?? '',
                    'name_en' => $product->name_en ?? '',
                    'category' => $product->product_line_id ?? '',
                    'spec_imperial' => $product->spec_imperial ?? ''
                ];
                break;
                
            case 'spare_part':
                $result = [
                    'model' => !empty($product->model) ? $product->model : ($product->app_model ?? ''),
                    'brand' => '',
                    'spec' => $product->spec ?? ($product->description_zh ?? ''),
                    'properties' => '',
                    'description' => $product->description_zh ?? '',
                    'name_zh' => $product->name_zh ?? '',
                    'name_en' => $product->name_en ?? '',
                    'category' => $product->product_line_id ?? '',
                    'spec_imperial' => $product->spec_imperial ?? ''
                ];
                break;
                
            case 'consumable':
                $result = [
                    'model' => $product->model ?? '',
                    'brand' => $product->brand ?? '',
                    'spec' => $product->spec ?? ($product->description_zh ?? ''),
                    'properties' => '',
                    'description' => $product->description_zh ?? '',
                    'name_zh' => $product->name_zh ?? ($product->title_zh ?? ''),
                    'name_en' => $product->name_en ?? ($product->title_en ?? ''),
                    'category' => $product->product_line_id ?? '',
                    'model_imperial' => $product->model_imperial ?? '',
                    'spec_imperial' => $product->spec_imperial ?? ''
                ];
                break;
                
            case 'accessory':
                $result = [
                    'model' => $product->model ?? '',
                    'brand' => $product->brand ?? '',
                    'spec' => $product->spec ?? ($product->description_zh ?? ''),
                    'properties' => '',
                    'description' => $product->description_zh ?? '',
                    'name_zh' => $product->name_zh ?? '',
                    'name_en' => $product->name_en ?? '',
                    'category' => $product->product_line_id ?? '',
                    'spec_imperial' => $product->spec_imperial ?? ''
                ];
                break;
                
            default:
                return null;
        }
        
        return self::process_product_result((object)$result, $product->part_number ?? '', $product_type);
    }
}
?> 