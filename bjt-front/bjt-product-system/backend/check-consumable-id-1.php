<?php
/**
 * 检查耗材表中ID为1的产品信息
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 检查耗材表中ID为1的产品信息\n";
echo "===============================\n\n";

// 1. 查看ID为1的耗材产品
$consumable = $wpdb->get_row("SELECT * FROM {$wpdb->prefix}bjt_consumables WHERE id = 1");

if ($consumable) {
    echo "✅ 找到ID为1的耗材产品:\n";
    echo "   • ID: {$consumable->id}\n";
    echo "   • 料号: " . ($consumable->part_number ?: 'N/A') . "\n";
    echo "   • 中文名: " . ($consumable->name_zh ?: 'N/A') . "\n";
    echo "   • 英文名: " . ($consumable->name_en ?: 'N/A') . "\n";
    echo "   • 型号: " . ($consumable->model ?: 'N/A') . "\n";
    echo "   • 品牌: " . ($consumable->brand ?: 'N/A') . "\n";
    echo "   • 规格: " . ($consumable->spec ?: 'N/A') . "\n";
    echo "   • 状态: " . ($consumable->status ?: 'N/A') . "\n";
} else {
    echo "❌ 未找到ID为1的耗材产品\n";
}

// 2. 查看前10个耗材产品
echo "\n📊 前10个耗材产品:\n";
echo "----------------\n";

$consumables = $wpdb->get_results("SELECT id, part_number, name_zh, name_en, model FROM {$wpdb->prefix}bjt_consumables ORDER BY id LIMIT 10");

if ($consumables) {
    foreach ($consumables as $item) {
        echo "• ID:{$item->id} | 料号:{$item->part_number} | 中文:{$item->name_zh} | 英文:{$item->name_en}\n";
    }
} else {
    echo "❌ 耗材表中没有任何产品\n";
}

// 3. 搜索包含 "90R" 的耗材
echo "\n🔍 搜索包含 '90R' 的耗材:\n";
echo "------------------------\n";

$similar_consumables = $wpdb->get_results("SELECT id, part_number, name_zh, name_en FROM {$wpdb->prefix}bjt_consumables WHERE part_number LIKE '%90R%' OR name_zh LIKE '%90R%' OR name_en LIKE '%90R%'");

if ($similar_consumables) {
    foreach ($similar_consumables as $item) {
        echo "• ID:{$item->id} | 料号:{$item->part_number} | 中文:{$item->name_zh} | 英文:{$item->name_en}\n";
    }
} else {
    echo "❌ 未找到包含 '90R' 的耗材\n";
}

echo "\n🎯 检查完成！\n";
?> 