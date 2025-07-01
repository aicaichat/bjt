#!/bin/bash

# 在生产环境 Docker 容器中测试产品信息解析器
echo "=== 生产环境产品信息解析器调试 ==="

# 检查生产环境容器
echo "1. 检查生产环境容器状态..."
docker ps | grep -E "(wordpress|nginx|mysql)" | head -5

echo
echo "2. 进入生产环境 WordPress 容器..."

# 创建测试脚本
cat > /tmp/test-resolver.php << 'EOF'
<?php
// 模拟 WordPress 环境
define('ABSPATH', '/var/www/html/');
require_once('/var/www/html/wp-config.php');

// 加载产品信息解析器
$resolver_path = '/var/www/html/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';
if (file_exists($resolver_path)) {
    require_once($resolver_path);
    echo "✅ 产品信息解析器类文件存在\n";
} else {
    echo "❌ 产品信息解析器类文件不存在: $resolver_path\n";
    exit(1);
}

// 测试类是否可用
if (class_exists('BJT_Product_Info_Resolver')) {
    echo "✅ BJT_Product_Info_Resolver 类已加载\n";
} else {
    echo "❌ BJT_Product_Info_Resolver 类未找到\n";
    exit(1);
}

// 测试生产环境的具体产品（从之前的API响应中获取）
$test_cases = [
    ['92R01006', 'consumable', 224],
    ['92A01007', 'consumable', 225],
    ['08A0105127', 'spare_part', 226]
];

echo "\n=== 测试产品信息解析 ===\n";
foreach ($test_cases as $case) {
    list($part_number, $type, $target_id) = $case;
    echo "测试: PartNumber=$part_number, Type=$type, TargetId=$target_id\n";
    
    $result = BJT_Product_Info_Resolver::get_product_details($part_number, $type, $target_id);
    
    if ($result) {
        echo "✅ 成功获取产品信息:\n";
        echo "  - Model: " . ($result['model'] ?? 'N/A') . "\n";
        echo "  - Spec: " . ($result['spec'] ?? 'N/A') . "\n";
        echo "  - Model Imperial: " . ($result['model_imperial'] ?? 'N/A') . "\n";
        echo "  - Spec Imperial: " . ($result['spec_imperial'] ?? 'N/A') . "\n";
        echo "  - Name ZH: " . ($result['name_zh'] ?? 'N/A') . "\n";
        echo "  - Name EN: " . ($result['name_en'] ?? 'N/A') . "\n";
    } else {
        echo "❌ 未找到产品信息\n";
    }
    echo "---\n";
}

// 检查数据库表是否存在
global $wpdb;
$tables = [
    $wpdb->prefix . 'bjt_consumables',
    $wpdb->prefix . 'bjt_spare_parts',
    $wpdb->prefix . 'bjt_parts',
    $wpdb->prefix . 'bjt_accessories'
];

echo "\n=== 检查数据库表 ===\n";
foreach ($tables as $table) {
    $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
    if ($exists) {
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        echo "✅ $table 存在，记录数: $count\n";
    } else {
        echo "❌ $table 不存在\n";
    }
}

echo "\n=== 测试完成 ===\n";
?>
EOF

# 执行测试
if docker ps | grep -q "wordpress"; then
    CONTAINER_NAME=$(docker ps --format "{{.Names}}" | grep wordpress | head -1)
    echo "使用容器: $CONTAINER_NAME"
    
    # 复制测试脚本到容器
    docker cp /tmp/test-resolver.php $CONTAINER_NAME:/tmp/test-resolver.php
    
    # 在容器中执行测试
    docker exec $CONTAINER_NAME php /tmp/test-resolver.php
    
    # 清理
    docker exec $CONTAINER_NAME rm -f /tmp/test-resolver.php
    rm -f /tmp/test-resolver.php
else
    echo "❌ 未找到 WordPress 容器"
fi

echo
echo "=== 调试完成 ===" 