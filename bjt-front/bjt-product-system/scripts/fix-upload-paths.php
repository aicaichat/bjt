<?php
/**
 * 修复数据库中的文件上传路径
 * 移除多余的 /frontend/public/ 前缀
 * 
 * 使用方法：
 * php scripts/fix-upload-paths.php
 * 
 * 或者在WordPress环境中运行：
 * docker-compose exec wordpress php /var/www/html/scripts/fix-upload-paths.php
 */

// 检查是否在WordPress环境中运行
if (!defined('ABSPATH')) {
    // 如果不在WordPress环境中，尝试加载WordPress
    $wp_load_paths = [
        __DIR__ . '/../wp-load.php',
        __DIR__ . '/../wordpress/wp-load.php', 
        __DIR__ . '/../backend/wp-load.php'
    ];
    
    $wp_loaded = false;
    foreach ($wp_load_paths as $wp_load_path) {
        if (file_exists($wp_load_path)) {
            require_once $wp_load_path;
            $wp_loaded = true;
            break;
        }
    }
    
    if (!$wp_loaded) {
        echo "错误: 无法找到WordPress环境，请确保脚本在正确的目录中运行\n";
        exit(1);
    }
}

global $wpdb;

echo "开始修复文件上传路径...\n";

// 需要修复的表和字段
$tables_to_fix = [
    'bjt_host_part_numbers' => [
        'image1_url', 'image2_url', 'image3_url', 
        'explosion_diagram_pdf', 'spec_pdf'
    ],
    'bjt_parts' => [
        'image1_url', 'image2_url', 'image3_url', 
        'explosion_diagram_pdf', 'spec_pdf'
    ],
    'bjt_accessories' => [
        'image1_url', 'image2_url', 'image3_url',
        'spec_pdf'
    ],
    'bjt_spare_parts' => [
        'image1_url', 'image2_url', 'image3_url',
        'spec_pdf'
    ]
];

$total_fixed = 0;

foreach ($tables_to_fix as $table => $fields) {
    $full_table_name = $wpdb->prefix . $table;
    
    // 检查表是否存在
    $table_exists = $wpdb->get_var($wpdb->prepare(
        "SHOW TABLES LIKE %s",
        $full_table_name
    ));
    
    if (!$table_exists) {
        echo "警告: 表 {$full_table_name} 不存在，跳过...\n";
        continue;
    }
    
    echo "处理表: {$full_table_name}\n";
    
    foreach ($fields as $field) {
        // 检查字段是否存在
        $field_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW COLUMNS FROM {$full_table_name} LIKE %s",
            $field
        ));
        
        if (!$field_exists) {
            echo "  警告: 字段 {$field} 不存在，跳过...\n";
            continue;
        }
        
        // 查找包含错误路径前缀的记录
        $affected_rows = $wpdb->query($wpdb->prepare("
            UPDATE {$full_table_name} 
            SET {$field} = REPLACE({$field}, '/frontend/public/', '/')
            WHERE {$field} LIKE %s
        ", '%/frontend/public/%'));
        
        if ($affected_rows > 0) {
            echo "  ✅ 修复字段 {$field}: {$affected_rows} 条记录\n";
            $total_fixed += $affected_rows;
        } else {
            echo "  ℹ️  字段 {$field}: 无需修复\n";
        }
    }
}

echo "\n修复完成！总共修复了 {$total_fixed} 条记录\n";

// 显示修复后的样本数据
echo "\n=== 修复后的样本数据 ===\n";
$sample_query = "
    SELECT 'bjt_host_part_numbers' as table_name, id, code, image1_url, spec_pdf 
    FROM {$wpdb->prefix}bjt_host_part_numbers 
    WHERE image1_url IS NOT NULL OR spec_pdf IS NOT NULL 
    LIMIT 3
    
    UNION ALL
    
    SELECT 'bjt_parts' as table_name, id, part_number as code, image1_url, spec_pdf 
    FROM {$wpdb->prefix}bjt_parts 
    WHERE image1_url IS NOT NULL OR spec_pdf IS NOT NULL 
    LIMIT 3
";

$results = $wpdb->get_results($sample_query);

foreach ($results as $row) {
    echo "表: {$row->table_name}, ID: {$row->id}, 代码: {$row->code}\n";
    if ($row->image1_url) {
        echo "  图片: {$row->image1_url}\n";
    }
    if ($row->spec_pdf) {
        echo "  PDF: {$row->spec_pdf}\n";
    }
    echo "\n";
}

// 检查是否还有遗漏的错误路径
echo "=== 检查是否还有错误路径 ===\n";
$check_queries = [
    "SELECT COUNT(*) as count FROM {$wpdb->prefix}bjt_host_part_numbers WHERE image1_url LIKE '%/frontend/public/%' OR spec_pdf LIKE '%/frontend/public/%'",
    "SELECT COUNT(*) as count FROM {$wpdb->prefix}bjt_parts WHERE image1_url LIKE '%/frontend/public/%' OR spec_pdf LIKE '%/frontend/public/%'"
];

$remaining_errors = 0;
foreach ($check_queries as $query) {
    $result = $wpdb->get_var($query);
    $remaining_errors += $result;
}

if ($remaining_errors > 0) {
    echo "⚠️  警告: 仍有 {$remaining_errors} 条记录包含错误路径前缀\n";
} else {
    echo "✅ 所有路径已修复！\n";
}

echo "\n完成!\n";
?> 