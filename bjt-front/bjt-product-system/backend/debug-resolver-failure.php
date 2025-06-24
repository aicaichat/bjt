<?php
/**
 * 详细调试产品信息解析器失败原因
 */

// 包含WordPress环境
require_once __DIR__ . '/wp-config.php';

global $wpdb;

echo "🔍 详细调试产品信息解析器失败原因\n";
echo "==================================\n\n";

$part_number = '90R01258';
$product_type = 'consumable';
$target_id = 1;

// 1. 手动执行解析器中的SQL查询
echo "📊 步骤1: 手动执行解析器SQL查询\n";
echo "-------------------------------\n";

$table_name = $wpdb->prefix . 'bjt_consumables';

// 这是解析器中使用的确切SQL
$sql = "SELECT COALESCE(model, '') as model, COALESCE(brand, '') as brand, 
        COALESCE(spec, description_zh, '') as spec, '' as properties, 
        description_zh as description, name_zh, name_en, product_line_id as category 
        FROM {$table_name} WHERE id = 1 LIMIT 1";

echo "执行SQL: {$sql}\n\n";

$result = $wpdb->get_row($sql);

if ($result) {
    echo "✅ SQL查询成功:\n";
    foreach ((array)$result as $key => $value) {
        echo "   • {$key}: '" . ($value ?: 'NULL/EMPTY') . "'\n";
    }
} else {
    echo "❌ SQL查询失败\n";
    echo "SQL错误: " . $wpdb->last_error . "\n";
}

// 2. 检查表结构
echo "\n📊 步骤2: 检查表结构\n";
echo "-------------------\n";

$columns = $wpdb->get_results("DESCRIBE {$table_name}");
if ($columns) {
    echo "✅ 表结构:\n";
    foreach ($columns as $col) {
        echo "   • {$col->Field}: {$col->Type} " . ($col->Null === 'YES' ? '(可NULL)' : '(不可NULL)') . "\n";
    }
} else {
    echo "❌ 无法获取表结构\n";
}

// 3. 检查缺失的字段
echo "\n📊 步骤3: 检查缺失的字段\n";
echo "-----------------------\n";

$required_fields = ['model', 'brand', 'spec', 'description_zh', 'name_zh', 'name_en', 'product_line_id'];
$existing_fields = array_column($columns, 'Field');

foreach ($required_fields as $field) {
    if (in_array($field, $existing_fields)) {
        echo "✅ {$field} 字段存在\n";
    } else {
        echo "❌ {$field} 字段缺失\n";
    }
}

// 4. 直接测试解析器的process_product_result方法
echo "\n📊 步骤4: 模拟解析器处理过程\n";
echo "----------------------------\n";

if ($result) {
    $processed_result = (array)$result;
    
    echo "原始结果:\n";
    foreach ($processed_result as $key => $value) {
        echo "   • {$key}: '" . ($value ?: 'EMPTY') . "'\n";
    }
    
    // 模拟process_product_result的逻辑
    if (empty($processed_result['name_zh']) && empty($processed_result['name_en'])) {
        echo "\n🔧 检测到name_zh和name_en为空，开始生成产品名称...\n";
        
        if (!empty($processed_result['model'])) {
            $processed_result['name_zh'] = $processed_result['model'];
            $processed_result['name_en'] = $processed_result['model'];
            echo "✅ 使用型号作为产品名称: {$processed_result['model']}\n";
        } elseif (!empty($processed_result['spec'])) {
            $spec_parts = explode(',', $processed_result['spec']);
            $name = trim($spec_parts[0]);
            $processed_result['name_zh'] = $name;
            $processed_result['name_en'] = $name;
            echo "✅ 使用规格作为产品名称: {$name}\n";
        } else {
            $processed_result['name_zh'] = $part_number;
            $processed_result['name_en'] = $part_number;
            echo "✅ 使用料号作为产品名称: {$part_number}\n";
        }
    }
    
    echo "\n处理后结果:\n";
    foreach ($processed_result as $key => $value) {
        echo "   • {$key}: '" . ($value ?: 'EMPTY') . "'\n";
    }
}

// 5. 实际调用解析器并捕获错误
echo "\n📊 步骤5: 实际调用解析器\n";
echo "-----------------------\n";

// 启用错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';

try {
    echo "调用: BJT_Product_Info_Resolver::get_product_details('{$part_number}', '{$product_type}', {$target_id})\n";
    
    $resolver_result = BJT_Product_Info_Resolver::get_product_details($part_number, $product_type, $target_id);
    
    if ($resolver_result) {
        echo "✅ 解析器成功返回结果:\n";
        foreach ($resolver_result as $key => $value) {
            echo "   • {$key}: '" . ($value ?: 'EMPTY') . "'\n";
        }
    } else {
        echo "❌ 解析器返回null\n";
    }
} catch (Exception $e) {
    echo "❌ 解析器抛出异常: " . $e->getMessage() . "\n";
    echo "堆栈跟踪:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎯 调试完成！\n";
?> 