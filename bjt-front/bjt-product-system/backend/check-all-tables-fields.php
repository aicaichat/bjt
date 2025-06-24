<?php
/**
 * 检查所有产品表的字段结构
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 检查所有产品表的字段结构\n";
echo "============================\n\n";

$tables = [
    'parts' => $wpdb->prefix . 'bjt_parts',           // 主机
    'accessories' => $wpdb->prefix . 'bjt_accessories', // 配件
    'spare_parts' => $wpdb->prefix . 'bjt_spare_parts', // 备件
    'consumables' => $wpdb->prefix . 'bjt_consumables'  // 耗材
];

foreach ($tables as $type => $table_name) {
    echo "📊 {$type} 表 ({$table_name}):\n";
    echo str_repeat('-', 50) . "\n";
    
    $columns = $wpdb->get_results("DESCRIBE {$table_name}");
    if ($columns) {
        $name_fields = [];
        foreach ($columns as $col) {
            if (strpos($col->Field, 'name') !== false || strpos($col->Field, 'title') !== false) {
                $name_fields[] = $col->Field;
            }
        }
        
        if ($name_fields) {
            echo "✅ 名称相关字段: " . implode(', ', $name_fields) . "\n";
        } else {
            echo "❌ 没有找到名称相关字段\n";
        }
        
        // 检查是否有中英文字段
        $has_zh = false;
        $has_en = false;
        foreach ($name_fields as $field) {
            if (strpos($field, 'zh') !== false || strpos($field, 'cn') !== false) {
                $has_zh = true;
            }
            if (strpos($field, 'en') !== false) {
                $has_en = true;
            }
        }
        
        echo "   • 中文字段: " . ($has_zh ? '✅' : '❌') . "\n";
        echo "   • 英文字段: " . ($has_en ? '✅' : '❌') . "\n";
        
        // 查看第一条记录的名称字段
        $sample = $wpdb->get_row("SELECT * FROM {$table_name} LIMIT 1");
        if ($sample) {
            echo "   • 示例数据:\n";
            foreach ($name_fields as $field) {
                $value = $sample->$field ?? 'N/A';
                echo "     - {$field}: '" . ($value ?: 'EMPTY') . "'\n";
            }
        }
    } else {
        echo "❌ 无法获取表结构\n";
    }
    
    echo "\n";
}

echo "🎯 检查完成！\n";
?> 