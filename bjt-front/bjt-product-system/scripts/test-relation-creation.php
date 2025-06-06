<?php
/**
 * 测试关系创建功能中的host_part_number自动计算
 * 
 * 使用方法：
 * php scripts/test-relation-creation.php
 */

// 设置WordPress环境
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../backend/wp-load.php');

function test_relation_creation() {
    global $wpdb;
    
    $relations_table = $wpdb->prefix . 'bjt_relations';
    
    echo "=== 关系创建功能测试 ===\n\n";
    
    // 测试主机
    $host_part_number = '421343214123412343212142141';
    $product_line_id = 1;
    
    echo "测试主机: {$host_part_number}\n";
    echo "产品线ID: {$product_line_id}\n\n";
    
    // 创建API请求对象（模拟）
    if (!class_exists('BJT_Relation_Controller')) {
        require_once __DIR__ . '/../plugins/bjt-core-entities/controllers/class-relation-controller.php';
    }
    
    $controller = new BJT_Relation_Controller();
    
    // 测试1: 创建一级关系（主机直接子级）
    echo "1. 测试创建一级关系:\n";
    
    $request1 = new WP_REST_Request('POST', '/wp-json/bjt/v1/relations');
    $request1->set_param('product_line_id', $product_line_id);
    $request1->set_param('host_part_number', $host_part_number);
    $request1->set_param('part_number', $host_part_number);
    $request1->set_param('parent_part_number', null);
    $request1->set_param('child_part_number', 'TEST001');
    $request1->set_param('child_type', 'accessory');
    $request1->set_param('level', 1);
    $request1->set_param('quantity', 1);
    $request1->set_param('sort_order', 0);
    $request1->set_param('status', 'publish');
    
    $response1 = $controller->create_item($request1);
    
    if (is_wp_error($response1)) {
        echo "❌ 一级关系创建失败: " . $response1->get_error_message() . "\n";
    } else {
        $data1 = $response1->get_data();
        echo "✅ 一级关系创建成功!\n";
        echo "  ID: {$data1['id']}\n";
        echo "  host_part_number: {$data1['host_part_number']}\n";
        echo "  part_number: {$data1['part_number']}\n";
        echo "  child_part_number: {$data1['child_part_number']}\n";
        
        // 验证host_part_number是否正确
        if ($data1['host_part_number'] === $host_part_number) {
            echo "  ✅ host_part_number 正确\n";
        } else {
            echo "  ❌ host_part_number 错误，期望: {$host_part_number}，实际: {$data1['host_part_number']}\n";
        }
        
        // 测试2: 创建二级关系（TEST001的子级）
        echo "\n2. 测试创建二级关系:\n";
        
        $request2 = new WP_REST_Request('POST', '/wp-json/bjt/v1/relations');
        $request2->set_param('product_line_id', $product_line_id);
        $request2->set_param('host_part_number', $host_part_number);
        $request2->set_param('part_number', 'TEST001');
        $request2->set_param('parent_part_number', 'TEST001');
        $request2->set_param('child_part_number', 'TEST002');
        $request2->set_param('child_type', 'accessory');
        $request2->set_param('level', 2);
        $request2->set_param('quantity', 1);
        $request2->set_param('sort_order', 0);
        $request2->set_param('status', 'publish');
        
        $response2 = $controller->create_item($request2);
        
        if (is_wp_error($response2)) {
            echo "❌ 二级关系创建失败: " . $response2->get_error_message() . "\n";
        } else {
            $data2 = $response2->get_data();
            echo "✅ 二级关系创建成功!\n";
            echo "  ID: {$data2['id']}\n";
            echo "  host_part_number: {$data2['host_part_number']}\n";
            echo "  part_number: {$data2['part_number']}\n";
            echo "  parent_part_number: {$data2['parent_part_number']}\n";
            echo "  child_part_number: {$data2['child_part_number']}\n";
            
            // 验证host_part_number是否正确
            if ($data2['host_part_number'] === $host_part_number) {
                echo "  ✅ host_part_number 正确\n";
            } else {
                echo "  ❌ host_part_number 错误，期望: {$host_part_number}，实际: {$data2['host_part_number']}\n";
            }
            
            // 测试3: 创建三级关系（TEST002的子级）
            echo "\n3. 测试创建三级关系:\n";
            
            $request3 = new WP_REST_Request('POST', '/wp-json/bjt/v1/relations');
            $request3->set_param('product_line_id', $product_line_id);
            $request3->set_param('host_part_number', $host_part_number);
            $request3->set_param('part_number', 'TEST002');
            $request3->set_param('parent_part_number', 'TEST002');
            $request3->set_param('child_part_number', 'TEST003');
            $request3->set_param('child_type', 'accessory');
            $request3->set_param('level', 3);
            $request3->set_param('quantity', 1);
            $request3->set_param('sort_order', 0);
            $request3->set_param('status', 'publish');
            
            $response3 = $controller->create_item($request3);
            
            if (is_wp_error($response3)) {
                echo "❌ 三级关系创建失败: " . $response3->get_error_message() . "\n";
            } else {
                $data3 = $response3->get_data();
                echo "✅ 三级关系创建成功!\n";
                echo "  ID: {$data3['id']}\n";
                echo "  host_part_number: {$data3['host_part_number']}\n";
                echo "  part_number: {$data3['part_number']}\n";
                echo "  parent_part_number: {$data3['parent_part_number']}\n";
                echo "  child_part_number: {$data3['child_part_number']}\n";
                
                // 验证host_part_number是否正确
                if ($data3['host_part_number'] === $host_part_number) {
                    echo "  ✅ host_part_number 正确\n";
                } else {
                    echo "  ❌ host_part_number 错误，期望: {$host_part_number}，实际: {$data3['host_part_number']}\n";
                }
                
                // 清理测试数据
                echo "\n4. 清理测试数据:\n";
                $cleanup_ids = [$data3['id'], $data2['id'], $data1['id']];
                foreach ($cleanup_ids as $cleanup_id) {
                    $delete_result = $wpdb->delete($relations_table, ['id' => $cleanup_id], ['%d']);
                    if ($delete_result) {
                        echo "  ✅ 删除测试记录 ID: {$cleanup_id}\n";
                    } else {
                        echo "  ❌ 删除测试记录失败 ID: {$cleanup_id}\n";
                    }
                }
            }
        }
    }
    
    echo "\n=== 测试完成 ===\n";
}

// 运行测试
try {
    test_relation_creation();
} catch (Exception $e) {
    echo "❌ 测试异常: " . $e->getMessage() . "\n";
    echo "异常追踪:\n" . $e->getTraceAsString() . "\n";
} 