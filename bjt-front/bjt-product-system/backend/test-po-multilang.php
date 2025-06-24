<?php
/**
 * 测试PO页面多语言数据
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "测试PO页面多语言数据\n";
echo "====================\n\n";

// 包含产品信息解析器
require_once __DIR__ . '/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

$resolver = new BJT_Product_Info_Resolver();

// 测试从截图中看到的产品
$test_products = [
    '09A0101107', // 面板排线 -> Panel Flexible Flat Cable
    '60A04004',   // ET1005 多风机输送系统 -> ET1005 Multi-fan conveying system
    '90R01258'    // MEX-RH30-13-20-13-L
];

foreach ($test_products as $product_id) {
    echo "产品: {$product_id}\n";
    echo str_repeat('-', 30) . "\n";
    
    $result = $resolver->get_product_info($product_id);
    
    if ($result) {
        echo "✅ 解析成功:\n";
        echo "   • 产品名称: '" . ($result->product_name ?? 'N/A') . "'\n";
        echo "   • 中文名称: '" . ($result->name_zh ?? 'N/A') . "'\n";
        echo "   • 英文名称: '" . ($result->name_en ?? 'N/A') . "'\n";
        echo "   • 型号: '" . ($result->model ?? 'N/A') . "'\n";
        echo "   • 品牌: '" . ($result->brand ?? 'N/A') . "'\n";
        echo "   • 规格: '" . ($result->spec ?? 'N/A') . "'\n";
        
        // 模拟前端的显示逻辑
        echo "\n   🔧 前端显示逻辑测试:\n";
        
        // 中文状态
        $zh_display = $result->name_zh ?: ($result->name_en ?: $result->model);
        echo "   • 中文状态显示: '{$zh_display}'\n";
        
        // 英文状态
        $en_display = $result->name_en ?: ($result->name_zh ?: $result->model);
        echo "   • 英文状态显示: '{$en_display}'\n";
        
    } else {
        echo "❌ 解析失败\n";
    }
    
    echo "\n" . str_repeat('=', 40) . "\n\n";
}

echo "测试完成！\n";
?> 