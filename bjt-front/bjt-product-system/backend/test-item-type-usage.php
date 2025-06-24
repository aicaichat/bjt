<?php
/**
 * 测试验证：订单项的 item_type 字段是否被正确使用进行产品信息查询
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';
require_once __DIR__ . '/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

global $wpdb;

echo "🎯 测试：验证 item_type 字段的正确使用\n";
echo "==========================================\n\n";

// 1. 查询最新订单的订单项
echo "📋 步骤1: 获取最新订单的订单项数据\n";
$latest_order_items = $wpdb->get_results("
    SELECT 
        oi.order_id,
        oi.item_id,
        oi.item_name,
        oi.item_type,
        oi.target_id,
        oi.quantity,
        oi.price
    FROM {$wpdb->prefix}bjt_order_items oi
    JOIN {$wpdb->prefix}bjt_orders o ON oi.order_id = o.id
    ORDER BY o.created_at DESC, oi.id DESC
    LIMIT 10
");

if (empty($latest_order_items)) {
    echo "❌ 没有找到订单项数据\n";
    exit;
}

echo "✅ 找到 " . count($latest_order_items) . " 个订单项\n\n";

// 2. 分析 item_type 分布
echo "📊 步骤2: 分析 item_type 字段分布\n";
$type_counts = [];
foreach ($latest_order_items as $item) {
    $type = $item->item_type ?: 'NULL';
    $type_counts[$type] = ($type_counts[$type] ?? 0) + 1;
}

foreach ($type_counts as $type => $count) {
    echo "  • {$type}: {$count} 个订单项\n";
}
echo "\n";

// 3. 测试产品信息解析器
echo "🔍 步骤3: 测试产品信息解析器使用 item_type\n";
echo "------------------------------------------------\n";

foreach ($latest_order_items as $item) {
    echo "\n🎯 测试订单项: {$item->item_id} (类型: {$item->item_type})\n";
    
    // 使用产品信息解析器
    $product_details = BJT_Product_Info_Resolver::get_product_details(
        $item->item_id, 
        $item->item_type, 
        $item->target_id
    );
    
    if ($product_details) {
        echo "✅ 成功获取产品信息:\n";
        echo "   • Model: " . ($product_details['model'] ?? 'N/A') . "\n";
        echo "   • Brand: " . ($product_details['brand'] ?? 'N/A') . "\n";
        echo "   • Spec: " . ($product_details['spec'] ?? 'N/A') . "\n";
        echo "   • Description: " . ($product_details['description'] ?? 'N/A') . "\n";
    } else {
        echo "❌ 未找到产品信息\n";
        
        // 尝试手动查询验证数据是否存在
        $table_map = [
            'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
            'accessory' => $wpdb->prefix . 'bjt_accessories', 
            'consumable' => $wpdb->prefix . 'bjt_consumables',
            'machine' => $wpdb->prefix . 'bjt_parts'
        ];
        
        if (isset($table_map[$item->item_type])) {
            $table_name = $table_map[$item->item_type];
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$table_name} WHERE part_number = %s",
                $item->item_id
            ));
            
            if ($exists > 0) {
                echo "⚠️ 数据库中存在该产品，但解析器未找到\n";
            } else {
                echo "ℹ️ 数据库中确实不存在该产品\n";
            }
        }
    }
}

echo "\n";

// 4. 验证数据库中的产品类型分布
echo "📊 步骤4: 验证数据库中各类型产品的数量\n";
echo "--------------------------------------\n";

$tables = [
    'machine' => $wpdb->prefix . 'bjt_parts',
    'spare_part' => $wpdb->prefix . 'bjt_spare_parts',
    'accessory' => $wpdb->prefix . 'bjt_accessories',
    'consumable' => $wpdb->prefix . 'bjt_consumables'
];

foreach ($tables as $type => $table) {
    $count = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
    echo "  • {$type}: {$count} 个产品\n";
}

echo "\n";

// 5. 检查订单项类型与实际数据库表的匹配情况
echo "🔄 步骤5: 检查 item_type 与数据库表的匹配情况\n";
echo "--------------------------------------------\n";

$mismatch_count = 0;
$match_count = 0;

foreach ($latest_order_items as $item) {
    if (!$item->item_type) continue;
    
    if (isset($tables[$item->item_type])) {
        $table_name = $tables[$item->item_type];
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name} WHERE part_number = %s",
            $item->item_id
        ));
        
        if ($exists > 0) {
            $match_count++;
            echo "✅ {$item->item_id} 在 {$item->item_type} 表中找到\n";
        } else {
            $mismatch_count++;
            echo "❌ {$item->item_id} 在 {$item->item_type} 表中未找到\n";
            
            // 检查是否在其他表中
            foreach ($tables as $other_type => $other_table) {
                if ($other_type === $item->item_type) continue;
                
                $other_exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$other_table} WHERE part_number = %s",
                    $item->item_id
                ));
                
                if ($other_exists > 0) {
                    echo "   ⚠️ 但在 {$other_type} 表中找到了\n";
                    break;
                }
            }
        }
    }
}

echo "\n";
echo "📈 总结:\n";
echo "  • 匹配的订单项: {$match_count}\n";
echo "  • 不匹配的订单项: {$mismatch_count}\n";
echo "  • 匹配率: " . ($match_count + $mismatch_count > 0 ? round($match_count / ($match_count + $mismatch_count) * 100, 2) : 0) . "%\n";

if ($match_count > $mismatch_count) {
    echo "\n✅ item_type 字段基本准确，系统可以依赖此字段进行产品查询\n";
} else {
    echo "\n⚠️ item_type 字段存在较多不准确，建议保留容错机制\n";
}

echo "\n🎯 测试完成！\n";
?> 