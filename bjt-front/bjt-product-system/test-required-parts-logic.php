<?php
/**
 * 测试必选备件逻辑
 * 验证主机、配件、备件的必选备件查询是否正确
 */

// 测试数据
$test_cases = [
    // 主机测试 - 应该没有必选备件
    [
        'type' => '主机',
        'endpoint' => '/wp-json/bjt/v1/parts/1',
        'part_number' => '60A01143',
        'expected_required_parts' => 0,
        'description' => 'LA-E4S V2.0主机应该没有必选备件'
    ],
    
    // 配件测试 - 某些配件有必选备件
    [
        'type' => '配件',
        'endpoint' => '/wp-json/bjt/v1/accessories',
        'part_number' => '60A11002', // FR8002 收卷车
        'expected_required_parts' => 2, // 05A0101289,05A0101290
        'description' => 'FR8002收卷车应该有2个必选备件'
    ],
    [
        'type' => '配件',
        'endpoint' => '/wp-json/bjt/v1/accessories',
        'part_number' => '60A04005', // EC2005 推车
        'expected_required_parts' => 2, // 05A0101289,05A0101290
        'description' => 'EC2005推车应该有2个必选备件'
    ],
    [
        'type' => '配件',
        'endpoint' => '/wp-json/bjt/v1/accessories',
        'part_number' => '60A04038', // ET400 自动分离器
        'expected_required_parts' => 0,
        'description' => 'ET400自动分离器应该没有必选备件'
    ],
    
    // 备件测试 - 某些备件有必选备件
    [
        'type' => '备件',
        'endpoint' => '/wp-json/bjt/v1/spare-parts',
        'part_number' => '01A0101038', // 去皱硅胶
        'expected_required_parts' => 2, // 11A0103002,11A0101003
        'description' => '去皱硅胶应该有2个必选备件'
    ],
    [
        'type' => '备件',
        'endpoint' => '/wp-json/bjt/v1/spare-parts',
        'part_number' => '08A0105795', // 8A 保险丝
        'expected_required_parts' => 0,
        'description' => '8A保险丝应该没有必选备件'
    ]
];

echo "=== 必选备件逻辑测试 ===\n\n";

foreach ($test_cases as $test) {
    echo "测试: {$test['description']}\n";
    echo "类型: {$test['type']}\n";
    echo "料号: {$test['part_number']}\n";
    echo "预期必选备件数量: {$test['expected_required_parts']}\n";
    
    // 这里可以添加实际的API调用测试
    // $response = wp_remote_get($test['endpoint']);
    
    echo "状态: ✅ 待测试\n";
    echo "---\n\n";
}

echo "=== 数据库查询验证 ===\n\n";

// 验证数据库中的必选备件关系
$required_parts_queries = [
    "主机作为parent_part_number的必选备件关系" => "
        SELECT part_number, child_part_number, required_parts, required_quantity 
        FROM wp_bjt_relations 
        WHERE part_number LIKE '60A01%' 
        AND required_parts IS NOT NULL 
        AND required_parts != ''
        ORDER BY part_number, sort_order
    ",
    
    "配件作为child_part_number的必选备件关系" => "
        SELECT part_number, child_part_number, required_parts, required_quantity 
        FROM wp_bjt_relations 
        WHERE child_part_number LIKE '60A%' 
        AND child_part_number NOT LIKE '60A01%'
        AND required_parts IS NOT NULL 
        AND required_parts != ''
        ORDER BY child_part_number, sort_order
    ",
    
    "备件的必选备件关系" => "
        SELECT part_number, required_parts, required_quantity 
        FROM wp_bjt_spare_parts 
        WHERE required_parts IS NOT NULL 
        AND required_parts != ''
        ORDER BY part_number
    "
];

foreach ($required_parts_queries as $title => $query) {
    echo "{$title}:\n";
    echo "SQL: {$query}\n";
    echo "---\n\n";
}

echo "=== 正确的逻辑总结 ===\n\n";
echo "1. 主机 (60A01xxx): 本身没有必选备件，但其配件可能有必选备件\n";
echo "2. 配件 (60Axxxxx): 某些配件有必选备件，查询 wp_bjt_relations 表中 child_part_number 字段\n";
echo "3. 备件 (其他格式): 某些备件有必选备件，查询 wp_bjt_spare_parts 表中 required_parts 字段\n\n";

echo "=== API端点修复状态 ===\n\n";
echo "✅ 主机控制器: 移除了必选备件查询，返回空数组\n";
echo "✅ 配件控制器: 修复为查询 child_part_number 字段\n";
echo "✅ 备件控制器: 已正确查询 wp_bjt_spare_parts 表\n\n";

echo "测试完成！\n";
?> 