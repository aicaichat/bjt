<?php
/**
 * N+1查询问题修复测试脚本
 * 测试批量获取配件数据功能是否正常工作
 */

// 检查是否在命令行环境中运行
if (php_sapi_name() !== 'cli') {
    die('This script must be run from the command line.');
}

// 加载WordPress环境
require_once(__DIR__ . '/../wp-load.php');

// 加载BJT Relations Controller
require_once(__DIR__ . '/../wp-content/plugins/bjt-core-entities/controllers/class-relation-controller.php');

global $wpdb;

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== N+1查询问题修复测试 ===\n";

// 1. 测试批量获取配件数据方法
echo "\n1. 测试批量获取配件数据方法:\n";

$controller = new BJT_Relation_Controller();

// 获取一些配件料号进行测试
$relations_table = $wpdb->prefix . 'bjt_relations';
$sample_relations = $wpdb->get_results(
    "SELECT DISTINCT child_part_number FROM {$relations_table} 
     WHERE child_part_number IS NOT NULL 
     AND child_part_number != '' 
     LIMIT 10"
);

$test_part_numbers = array_map(function($rel) {
    return $rel->child_part_number;
}, $sample_relations);

echo "   测试料号: " . implode(', ', $test_part_numbers) . "\n";

// 使用反射访问private方法
$reflection = new ReflectionClass($controller);
$batch_method = $reflection->getMethod('batch_get_accessories_data');
$batch_method->setAccessible(true);

// 测试批量获取
$start_time = microtime(true);
$accessories_data = $batch_method->invoke($controller, $test_part_numbers);
$end_time = microtime(true);

echo "   批量查询耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
echo "   找到配件数据: " . count($accessories_data) . "/" . count($test_part_numbers) . "\n";

// 显示找到的配件
foreach ($accessories_data as $part_number => $accessory) {
    echo "     {$part_number}: {$accessory->name_zh}\n";
}

// 2. 测试API端点性能
echo "\n2. 测试API端点性能:\n";

// 选择一个有配件的主机进行测试
$host_relation = $wpdb->get_row(
    "SELECT host_part_number FROM {$relations_table} 
     WHERE host_part_number IS NOT NULL 
     AND parent_part_number IS NULL 
     GROUP BY host_part_number 
     HAVING COUNT(*) > 1 
     LIMIT 1"
);

if ($host_relation) {
    $host_part_number = $host_relation->host_part_number;
    echo "   测试主机料号: {$host_part_number}\n";
    
    // 模拟API请求
    $request_mock = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations/' . $host_part_number . '/accessories');
    $request_mock->set_param('part_number', $host_part_number);
    $request_mock->set_param('max_levels', 3);
    $request_mock->set_param('lang', 'zh');
    
    // 测试API性能
    $start_time = microtime(true);
    $response = $controller->get_multi_level_accessories($request_mock);
    $end_time = microtime(true);
    
    echo "   API调用耗时: " . round(($end_time - $start_time) * 1000, 2) . "ms\n";
    
    if ($response instanceof WP_REST_Response) {
        $data = $response->get_data();
        if (isset($data['data']['accessories'])) {
            $accessories = $data['data']['accessories'];
            echo "   返回配件数量: " . count($accessories) . "\n";
            
            // 计算总的配件数量（包括子级）
            $total_count = 0;
            $count_accessories = function($accessories) use (&$count_accessories, &$total_count) {
                foreach ($accessories as $accessory) {
                    $total_count++;
                    if (isset($accessory['children']) && is_array($accessory['children'])) {
                        $count_accessories($accessory['children']);
                    }
                }
            };
            
            $count_accessories($accessories);
            echo "   总配件数量（包括子级）: {$total_count}\n";
        }
    } else {
        echo "   API调用失败\n";
    }
} else {
    echo "   未找到合适的测试主机\n";
}

// 3. 查询性能分析
echo "\n3. 查询性能分析:\n";

// 启用查询日志
$wpdb->show_errors();
$wpdb->print_error();

// 获取MySQL查询统计
$query_count_before = $wpdb->num_queries;
echo "   测试开始时查询次数: {$query_count_before}\n";

// 再次调用API
if ($host_relation) {
    $request_mock = new WP_REST_Request('GET', '/wp-json/bjt/v1/relations/' . $host_part_number . '/accessories');
    $request_mock->set_param('part_number', $host_part_number);
    $request_mock->set_param('max_levels', 2);
    $request_mock->set_param('lang', 'zh');
    
    $response = $controller->get_multi_level_accessories($request_mock);
    
    $query_count_after = $wpdb->num_queries;
    $query_increase = $query_count_after - $query_count_before;
    
    echo "   API调用后查询次数: {$query_count_after}\n";
    echo "   增加的查询次数: {$query_increase}\n";
    
    if ($response instanceof WP_REST_Response) {
        $data = $response->get_data();
        if (isset($data['data']['accessories'])) {
            $accessories = $data['data']['accessories'];
            $relations_count = count($accessories);
            
            echo "   返回的关系数量: {$relations_count}\n";
            echo "   平均每个关系的查询次数: " . ($relations_count > 0 ? round($query_increase / $relations_count, 2) : 0) . "\n";
            
            // 理想情况下，批量查询应该让每个关系的查询次数接近1
            if ($relations_count > 0 && $query_increase / $relations_count < 2) {
                echo "   ✅ N+1查询问题已修复！\n";
            } else {
                echo "   ❌ N+1查询问题可能仍然存在\n";
            }
        }
    }
}

echo "\n=== 测试完成 ===\n"; 