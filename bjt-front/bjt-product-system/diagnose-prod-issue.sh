#!/bin/bash

echo "=== 生产环境详细诊断 ==="
echo "目标：找出为什么生产环境API不返回完整的产品信息"
echo

# 获取生产环境 Token
echo "1. 获取生产环境访问令牌..."
PROD_TOKEN=$(curl -s -X POST "https://eorder.lockedair.com/wp-json/bjt/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROD_TOKEN" ]; then
    echo "❌ 无法获取生产环境令牌"
    exit 1
fi

echo "✅ 获取令牌成功"

# 创建诊断脚本
cat > /tmp/prod-diagnosis.php << 'EOF'
<?php
// 诊断生产环境问题
define('ABSPATH', '/var/www/html/');
require_once('/var/www/html/wp-config.php');

echo "=== 生产环境诊断报告 ===\n";

// 1. 检查产品信息解析器类
echo "1. 检查 BJT_Product_Info_Resolver 类:\n";
$resolver_path = '/var/www/html/wp-content/plugins/bjt-core-entities/includes/class-product-info-resolver.php';
if (file_exists($resolver_path)) {
    echo "   ✅ 文件存在: $resolver_path\n";
    require_once($resolver_path);
    if (class_exists('BJT_Product_Info_Resolver')) {
        echo "   ✅ 类已加载\n";
        
        // 检查类方法
        $methods = get_class_methods('BJT_Product_Info_Resolver');
        if (in_array('get_product_details_by_fuzzy_match', $methods)) {
            echo "   ✅ 模糊匹配方法存在\n";
        } else {
            echo "   ❌ 模糊匹配方法不存在\n";
        }
    } else {
        echo "   ❌ 类未加载\n";
    }
} else {
    echo "   ❌ 文件不存在\n";
}

// 2. 检查订单控制器
echo "\n2. 检查订单控制器:\n";
$controller_path = '/var/www/html/wp-content/plugins/bjt-core-entities/controllers/class-order-controller.php';
if (file_exists($controller_path)) {
    echo "   ✅ 控制器文件存在\n";
    $content = file_get_contents($controller_path);
    if (strpos($content, 'BJT_Product_Info_Resolver::get_product_details') !== false) {
        echo "   ✅ 控制器包含产品信息解析调用\n";
    } else {
        echo "   ❌ 控制器不包含产品信息解析调用\n";
    }
} else {
    echo "   ❌ 控制器文件不存在\n";
}

// 3. 检查插件状态
echo "\n3. 检查插件状态:\n";
$active_plugins = get_option('active_plugins', []);
$bjt_plugin_active = false;
foreach ($active_plugins as $plugin) {
    if (strpos($plugin, 'bjt-core-entities') !== false) {
        echo "   ✅ BJT核心插件已激活: $plugin\n";
        $bjt_plugin_active = true;
        break;
    }
}
if (!$bjt_plugin_active) {
    echo "   ❌ BJT核心插件未激活\n";
}

// 4. 测试数据库连接和数据
echo "\n4. 检查数据库:\n";
global $wpdb;
$tables = [
    $wpdb->prefix . 'bjt_orders',
    $wpdb->prefix . 'bjt_order_items',
    $wpdb->prefix . 'bjt_consumables'
];

foreach ($tables as $table) {
    $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
    if ($exists) {
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table");
        echo "   ✅ $table: $count 条记录\n";
    } else {
        echo "   ❌ $table: 表不存在\n";
    }
}

// 5. 测试具体的产品信息解析
echo "\n5. 测试产品信息解析:\n";
if (class_exists('BJT_Product_Info_Resolver')) {
    $test_cases = [
        ['92R01006', 'consumable', 224],
        ['92A01007', 'consumable', 225]
    ];
    
    foreach ($test_cases as $case) {
        list($part_number, $type, $target_id) = $case;
        echo "   测试: $part_number ($type)\n";
        
        try {
            $result = BJT_Product_Info_Resolver::get_product_details($part_number, $type, $target_id);
            if ($result) {
                echo "     ✅ 成功: Model={$result['model']}, Spec=" . substr($result['spec'], 0, 30) . "...\n";
            } else {
                echo "     ❌ 未找到产品信息\n";
            }
        } catch (Exception $e) {
            echo "     ❌ 异常: " . $e->getMessage() . "\n";
        }
    }
} else {
    echo "   ❌ 无法测试，类不存在\n";
}

// 6. 检查 PHP 错误日志
echo "\n6. 检查 PHP 错误:\n";
$error_log = ini_get('error_log');
echo "   错误日志位置: $error_log\n";
if ($error_log && file_exists($error_log)) {
    $recent_errors = shell_exec("tail -20 $error_log | grep -i 'product\|resolver\|bjt' || echo '无相关错误'");
    echo "   最近的相关错误:\n$recent_errors\n";
} else {
    echo "   无法访问错误日志\n";
}

echo "\n=== 诊断完成 ===\n";
?>
EOF

# 在生产环境中执行诊断
echo
echo "2. 在生产环境中执行诊断..."

# 检查是否有生产环境容器
if docker ps | grep -q "prod.*wordpress\|wordpress.*prod"; then
    PROD_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "prod.*wordpress|wordpress.*prod" | head -1)
    echo "使用生产容器: $PROD_CONTAINER"
    
    docker cp /tmp/prod-diagnosis.php $PROD_CONTAINER:/tmp/prod-diagnosis.php
    docker exec $PROD_CONTAINER php /tmp/prod-diagnosis.php
    docker exec $PROD_CONTAINER rm -f /tmp/prod-diagnosis.php
    
elif docker ps | grep -q "wordpress"; then
    # 如果没有明确的生产容器，尝试用开发容器（可能是同一个）
    DEV_CONTAINER=$(docker ps --format "{{.Names}}" | grep wordpress | head -1)
    echo "使用容器: $DEV_CONTAINER (可能是开发环境)"
    
    docker cp /tmp/prod-diagnosis.php $DEV_CONTAINER:/tmp/prod-diagnosis.php
    docker exec $DEV_CONTAINER php /tmp/prod-diagnosis.php
    docker exec $DEV_CONTAINER rm -f /tmp/prod-diagnosis.php
else
    echo "❌ 未找到 WordPress 容器，无法在本地诊断"
    echo "请在生产服务器上手动执行 /tmp/prod-diagnosis.php"
fi

# 清理
rm -f /tmp/prod-diagnosis.php

echo
echo "3. 建议的解决步骤:"
echo "   - 如果插件未激活，请在 WordPress 后台激活 BJT Core Entities 插件"
echo "   - 如果有 PHP 缓存，请清除 OPcache: service php-fpm reload"
echo "   - 如果是 Docker 环境，请重启容器: docker-compose restart"
echo "   - 检查 WordPress 错误日志中是否有相关错误" 