<?php
/**
 * 查找产品在哪个表中
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "查找产品位置\n";
echo "============\n\n";

$products = ['60A01149', '60A04004', '1231313131313'];
$tables = [
    'parts' => $wpdb->prefix . 'bjt_parts',
    'accessories' => $wpdb->prefix . 'bjt_accessories', 
    'spare_parts' => $wpdb->prefix . 'bjt_spare_parts',
    'consumables' => $wpdb->prefix . 'bjt_consumables'
];

foreach ($products as $product_id) {
    echo "产品 {$product_id}:\n";
    $found = false;
    
    foreach ($tables as $type => $table) {
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT id, part_number, model, 
                    CASE 
                        WHEN name_zh IS NOT NULL THEN name_zh
                        WHEN title_zh IS NOT NULL THEN title_zh
                        ELSE 'N/A'
                    END as name_zh,
                    CASE 
                        WHEN name_en IS NOT NULL THEN name_en
                        WHEN title_en IS NOT NULL THEN title_en
                        ELSE 'N/A'
                    END as name_en
             FROM {$table} WHERE part_number = %s OR id = %s LIMIT 1",
            $product_id, $product_id
        ));
        
        if ($result) {
            echo "  ✅ 找到在 {$type} 表中\n";
            echo "     ID: {$result->id}\n";
            echo "     料号: {$result->part_number}\n";
            echo "     型号: {$result->model}\n";
            echo "     中文名称: '{$result->name_zh}'\n";
            echo "     英文名称: '{$result->name_en}'\n";
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        echo "  ❌ 未找到\n";
    }
    echo "\n";
}

echo "查找完成！\n";
?> 