<?php
/**
 * BJT API 综合测试脚本
 * 测试各个API端点是否正常工作
 */

// 配置
$base_url = 'http://127.0.0.1:80/wp-json';  // 在容器内使用内部端口80
$endpoints = [
    'core' => '/wp/v2',
    'bjt-fix' => '/bjt-fix/test',
    'bjt-test' => '/bjt-test/v1/test',
];

// 结果存储
$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'summary' => [],
    'tests' => []
];

// 辅助函数：API请求
function make_api_request($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    
    return [
        'status_code' => $info['http_code'],
        'content_type' => $info['content_type'],
        'body' => $response,
        'parsed' => json_decode($response, true)
    ];
}

// 测试1：核心API
echo "测试WordPress核心API...\n";
$core_test = make_api_request($base_url);
$results['tests']['core_api'] = [
    'url' => $base_url,
    'status_code' => $core_test['status_code'],
    'content_type' => $core_test['content_type'],
    'is_json' => strpos($core_test['content_type'], 'application/json') !== false,
    'has_routes' => is_array($core_test['parsed']) && isset($core_test['parsed']['routes'])
];

$results['summary']['core_api'] = 
    $results['tests']['core_api']['status_code'] == 200 && 
    $results['tests']['core_api']['is_json'] && 
    $results['tests']['core_api']['has_routes'];

// 测试2：BJT-Fix API
echo "测试BJT-Fix API...\n";
$fix_test = make_api_request($base_url . $endpoints['bjt-fix']);
$results['tests']['bjt_fix_api'] = [
    'url' => $base_url . $endpoints['bjt-fix'],
    'status_code' => $fix_test['status_code'],
    'content_type' => $fix_test['content_type'],
    'is_json' => strpos($fix_test['content_type'], 'application/json') !== false,
    'success' => is_array($fix_test['parsed']) && isset($fix_test['parsed']['success']) && $fix_test['parsed']['success'] === true,
    'has_message' => is_array($fix_test['parsed']) && isset($fix_test['parsed']['message'])
];

$results['summary']['bjt_fix_api'] = 
    $results['tests']['bjt_fix_api']['status_code'] == 200 && 
    $results['tests']['bjt_fix_api']['is_json'] && 
    $results['tests']['bjt_fix_api']['success'];

// 测试3：BJT-Test API
echo "测试BJT-Test API...\n";
$test_api = make_api_request($base_url . $endpoints['bjt-test']);
$results['tests']['bjt_test_api'] = [
    'url' => $base_url . $endpoints['bjt-test'],
    'status_code' => $test_api['status_code'],
    'content_type' => $test_api['content_type'],
    'is_json' => strpos($test_api['content_type'], 'application/json') !== false,
    'success' => is_array($test_api['parsed']) && isset($test_api['parsed']['success']) && $test_api['parsed']['success'] === true,
    'has_data' => is_array($test_api['parsed']) && isset($test_api['parsed']['data']) && is_array($test_api['parsed']['data'])
];

$results['summary']['bjt_test_api'] = 
    $results['tests']['bjt_test_api']['status_code'] == 200 && 
    $results['tests']['bjt_test_api']['is_json'] && 
    $results['tests']['bjt_test_api']['success'] && 
    $results['tests']['bjt_test_api']['has_data'];

// 总结测试结果
$results['all_tests_passed'] = 
    $results['summary']['core_api'] && 
    $results['summary']['bjt_fix_api'] && 
    $results['summary']['bjt_test_api'];

// 输出结果
echo "\n=== 测试结果摘要 ===\n";
echo "测试时间: " . $results['timestamp'] . "\n";
echo "所有测试通过: " . ($results['all_tests_passed'] ? '是' : '否') . "\n\n";

echo "WordPress核心API: " . ($results['summary']['core_api'] ? '通过' : '失败') . "\n";
echo "BJT-Fix API: " . ($results['summary']['bjt_fix_api'] ? '通过' : '失败') . "\n";
echo "BJT-Test API: " . ($results['summary']['bjt_test_api'] ? '通过' : '失败') . "\n\n";

echo "=== 详细测试结果 ===\n";
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n"; 