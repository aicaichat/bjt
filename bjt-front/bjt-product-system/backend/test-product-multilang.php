<?php
/**
 * 测试产品多语言数据
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "测试产品多语言数据\n";
echo "==================\n\n";

// 测试备件 09A0101107 (面板排线)
$spare_part = $wpdb->get_row($wpdb->prepare(
    "SELECT part_number, model, name_zh, name_en FROM {$wpdb->prefix}bjt_spare_parts WHERE part_number = %s",
    '09A0101107'
));

if ($spare_part) {
    echo "备件 09A0101107:\n";
    echo "- 料号: " . $spare_part->part_number . "\n";
    echo "- 型号: " . $spare_part->model . "\n";
    echo "- 中文名称: '" . $spare_part->name_zh . "'\n";
    echo "- 英文名称: '" . $spare_part->name_en . "'\n";
    echo "\n";
} else {
    echo "未找到备件 09A0101107\n\n";
}

// 测试备件 60A01149
$spare_part2 = $wpdb->get_row($wpdb->prepare(
    "SELECT part_number, model, name_zh, name_en FROM {$wpdb->prefix}bjt_spare_parts WHERE part_number = %s",
    '60A01149'
));

if ($spare_part2) {
    echo "备件 60A01149:\n";
    echo "- 料号: " . $spare_part2->part_number . "\n";
    echo "- 型号: " . $spare_part2->model . "\n";
    echo "- 中文名称: '" . $spare_part2->name_zh . "'\n";
    echo "- 英文名称: '" . $spare_part2->name_en . "'\n";
    echo "\n";
} else {
    echo "未找到备件 60A01149\n\n";
}

// 测试备件 60A04004
$spare_part3 = $wpdb->get_row($wpdb->prepare(
    "SELECT part_number, model, name_zh, name_en FROM {$wpdb->prefix}bjt_spare_parts WHERE part_number = %s",
    '60A04004'
));

if ($spare_part3) {
    echo "备件 60A04004:\n";
    echo "- 料号: " . $spare_part3->part_number . "\n";
    echo "- 型号: " . $spare_part3->model . "\n";
    echo "- 中文名称: '" . $spare_part3->name_zh . "'\n";
    echo "- 英文名称: '" . $spare_part3->name_en . "'\n";
    echo "\n";
} else {
    echo "未找到备件 60A04004\n\n";
}

echo "测试完成！\n";
?> 