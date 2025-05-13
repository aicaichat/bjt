<?php
/**
 * BJT Product System API 测试脚本
 * 
 * 使用方法:
 * 1. 复制此文件到WordPress根目录
 * 2. 使用命令行运行: php api-test.php
 * 或者在浏览器中访问此文件
 * 
 * 此脚本测试所有BJT Product System的API端点
 */

// 设置测试环境
$api_base_url = 'http://localhost:8080/wp-json/bjt/v1'; // 请根据实际环境修改
$auth_username = 'admin'; // WordPress管理员用户名
$auth_password = 'password'; // WordPress管理员密码

// 输出格式化
function output($message, $type = 'info') {
    $colors = [
        'success' => "\033[0;32m", // 绿色
        'error' => "\033[0;31m",   // 红色
        'info' => "\033[0;36m",    // 青色
        'reset' => "\033[0m"       // 重置
    ];
    
    if (php_sapi_name() === 'cli') {
        echo $colors[$type] . $message . $colors['reset'] . PHP_EOL;
    } else {
        $style = '';
        switch ($type) {
            case 'success': $style = 'color: green;'; break;
            case 'error': $style = 'color: red;'; break;
            case 'info': $style = 'color: blue;'; break;
        }
        echo "<div style='$style'>" . htmlspecialchars($message) . "</div>";
    }
}

// 获取认证令牌
function get_auth_token($api_url, $username, $password) {
    $auth_url = str_replace('/bjt/v1', '/jwt-auth/v1/token', $api_url);
    
    $response = wp_remote_post($auth_url, [
        'body' => [
            'username' => $username,
            'password' => $password
        ]
    ]);
    
    if (is_wp_error($response)) {
        output('认证失败: ' . $response->get_error_message(), 'error');
        return false;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (isset($data['token'])) {
        return $data['token'];
    } else {
        output('获取令牌失败: ' . print_r($data, true), 'error');
        return false;
    }
}

// API请求函数
function api_request($method, $endpoint, $token = null, $data = null) {
    global $api_base_url;
    
    $url = $api_base_url . $endpoint;
    $args = [
        'method' => $method,
        'timeout' => 30,
        'headers' => [
            'Content-Type' => 'application/json',
        ]
    ];
    
    if ($token) {
        $args['headers']['Authorization'] = 'Bearer ' . $token;
    }
    
    if ($data && ($method === 'POST' || $method === 'PUT')) {
        $args['body'] = json_encode($data);
    }
    
    $response = wp_remote_request($url, $args);
    
    if (is_wp_error($response)) {
        output("请求失败: {$method} {$endpoint} - " . $response->get_error_message(), 'error');
        return false;
    }
    
    $code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if ($code < 200 || $code >= 300) {
        output("请求失败: {$method} {$endpoint} - 状态码 {$code}", 'error');
        if ($data) {
            output("错误信息: " . print_r($data, true), 'error');
        }
        return false;
    }
    
    return $data;
}

// 加载WordPress环境
if (!function_exists('wp_remote_request')) {
    $wp_load_path = __DIR__ . '/wp-load.php';
    if (file_exists($wp_load_path)) {
        require_once $wp_load_path;
    } else {
        die('无法加载WordPress环境，请确保脚本位于WordPress根目录');
    }
}

// 开始测试
output("开始BJT Product System API测试", 'info');
output("API基础URL: {$api_base_url}", 'info');
output("----------------------------------------", 'info');

// 获取认证令牌
//$token = get_auth_token($api_base_url, $auth_username, $auth_password);
// 为简化测试，暂时跳过认证
$token = null;

// 测试产品线API
function test_product_lines_api($token) {
    output("测试产品线API", 'info');
    
    // GET /product-lines - 获取所有产品线
    $product_lines = api_request('GET', '/product-lines', $token);
    if ($product_lines) {
        output("成功获取产品线列表，共 " . count($product_lines) . " 项", 'success');
    }
    
    // 如果有产品线，测试获取单个产品线
    if ($product_lines && !empty($product_lines)) {
        $first_line = $product_lines[0];
        $line_id = $first_line['id'];
        
        // GET /product-lines/{id} - 获取特定产品线
        $product_line = api_request('GET', "/product-lines/{$line_id}", $token);
        if ($product_line) {
            output("成功获取产品线: " . $product_line['title_zh'], 'success');
        }
        
        // GET /product-lines/{id}/host-models - 获取产品线下的主机型号
        $host_models = api_request('GET', "/product-lines/{$line_id}/host-models", $token);
        if ($host_models) {
            output("成功获取产品线下的主机型号，共 " . count($host_models) . " 项", 'success');
        }
    }
    
    // 测试创建产品线
    $new_line_data = [
        'title_zh' => '测试产品线-' . time(),
        'title_en' => 'Test Product Line-' . time(),
        'code' => 'test-' . time(),
        'status' => 'publish'
    ];
    
    // POST /product-lines - 创建产品线
    $new_line = api_request('POST', '/product-lines', $token, $new_line_data);
    if ($new_line) {
        $new_line_id = $new_line['id'];
        output("成功创建产品线: ID {$new_line_id}", 'success');
        
        // 测试更新产品线
        $update_data = [
            'description_zh' => '这是一个通过API测试创建的产品线',
            'description_en' => 'This is a product line created through API testing'
        ];
        
        // PUT /product-lines/{id} - 更新产品线
        $updated_line = api_request('PUT', "/product-lines/{$new_line_id}", $token, $update_data);
        if ($updated_line) {
            output("成功更新产品线: ID {$new_line_id}", 'success');
        }
        
        // DELETE /product-lines/{id} - 删除产品线
        $deleted = api_request('DELETE', "/product-lines/{$new_line_id}", $token);
        if ($deleted) {
            output("成功删除产品线: ID {$new_line_id}", 'success');
        }
    }
    
    output("产品线API测试完成", 'info');
    output("----------------------------------------", 'info');
}

// 测试主机型号API
function test_host_models_api($token) {
    output("测试主机型号API", 'info');
    
    // GET /host-models - 获取所有主机型号
    $host_models = api_request('GET', '/host-models', $token);
    if ($host_models) {
        output("成功获取主机型号列表，共 " . count($host_models) . " 项", 'success');
    }
    
    // 如果有主机型号，测试获取单个主机型号
    if ($host_models && !empty($host_models)) {
        $first_model = $host_models[0];
        $model_id = $first_model['id'];
        
        // GET /host-models/{id} - 获取特定主机型号
        $host_model = api_request('GET', "/host-models/{$model_id}", $token);
        if ($host_model) {
            output("成功获取主机型号: " . $host_model['model_name'], 'success');
        }
    }
    
    // 获取产品线以用于创建主机型号
    $product_lines = api_request('GET', '/product-lines', $token);
    if ($product_lines && !empty($product_lines)) {
        $product_line_id = $product_lines[0]['id'];
        
        // 测试创建主机型号
        $new_model_data = [
            'product_line_id' => $product_line_id,
            'model_number' => 'TEST-' . time(),
            'model_name' => '测试主机-' . time(),
            'name_en' => 'Test Host-' . time(),
            'status' => 'publish'
        ];
        
        // POST /host-models - 创建主机型号
        $new_model = api_request('POST', '/host-models', $token, $new_model_data);
        if ($new_model) {
            $new_model_id = $new_model['id'];
            output("成功创建主机型号: ID {$new_model_id}", 'success');
            
            // 测试更新主机型号
            $update_data = [
                'description_zh' => '这是一个通过API测试创建的主机型号',
                'description_en' => 'This is a host model created through API testing'
            ];
            
            // PUT /host-models/{id} - 更新主机型号
            $updated_model = api_request('PUT', "/host-models/{$new_model_id}", $token, $update_data);
            if ($updated_model) {
                output("成功更新主机型号: ID {$new_model_id}", 'success');
            }
            
            // DELETE /host-models/{id} - 删除主机型号
            $deleted = api_request('DELETE', "/host-models/{$new_model_id}", $token);
            if ($deleted) {
                output("成功删除主机型号: ID {$new_model_id}", 'success');
            }
        }
    } else {
        output("未找到产品线，跳过创建主机型号测试", 'info');
    }
    
    output("主机型号API测试完成", 'info');
    output("----------------------------------------", 'info');
}

// 测试配件API
function test_accessories_api($token) {
    output("测试配件API", 'info');
    
    // GET /accessories - 获取所有配件
    $accessories = api_request('GET', '/accessories', $token);
    if ($accessories) {
        output("成功获取配件列表，共 " . count($accessories) . " 项", 'success');
    }
    
    // 如果有配件，测试获取单个配件
    if ($accessories && !empty($accessories)) {
        $first_accessory = $accessories[0];
        $accessory_id = $first_accessory['id'];
        
        // GET /accessories/{id} - 获取特定配件
        $accessory = api_request('GET', "/accessories/{$accessory_id}", $token);
        if ($accessory) {
            output("成功获取配件: " . $accessory['name_zh'], 'success');
        }
    }
    
    // 获取产品线以用于创建配件
    $product_lines = api_request('GET', '/product-lines', $token);
    if ($product_lines && !empty($product_lines)) {
        $product_line_id = $product_lines[0]['id'];
        
        // 测试创建配件
        $new_accessory_data = [
            'product_line_id' => $product_line_id,
            'model' => 'TEST-ACC-' . time(),
            'part_number' => 'PN-' . time(),
            'name_zh' => '测试配件-' . time(),
            'name_en' => 'Test Accessory-' . time(),
            'status' => 'publish'
        ];
        
        // POST /accessories - 创建配件
        $new_accessory = api_request('POST', '/accessories', $token, $new_accessory_data);
        if ($new_accessory) {
            $new_accessory_id = $new_accessory['id'];
            output("成功创建配件: ID {$new_accessory_id}", 'success');
            
            // 测试更新配件
            $update_data = [
                'brand' => 'BJT-TEST',
                'spec' => '测试规格'
            ];
            
            // PUT /accessories/{id} - 更新配件
            $updated_accessory = api_request('PUT', "/accessories/{$new_accessory_id}", $token, $update_data);
            if ($updated_accessory) {
                output("成功更新配件: ID {$new_accessory_id}", 'success');
            }
            
            // DELETE /accessories/{id} - 删除配件
            $deleted = api_request('DELETE', "/accessories/{$new_accessory_id}", $token);
            if ($deleted) {
                output("成功删除配件: ID {$new_accessory_id}", 'success');
            }
        }
    } else {
        output("未找到产品线，跳过创建配件测试", 'info');
    }
    
    output("配件API测试完成", 'info');
    output("----------------------------------------", 'info');
}

// 测试耗材API
function test_consumables_api($token) {
    output("测试耗材API", 'info');
    
    // GET /consumables - 获取所有耗材
    $consumables = api_request('GET', '/consumables', $token);
    if ($consumables) {
        output("成功获取耗材列表，共 " . count($consumables) . " 项", 'success');
    }
    
    // 如果有耗材，测试获取单个耗材
    if ($consumables && !empty($consumables)) {
        $first_consumable = $consumables[0];
        $consumable_id = $first_consumable['id'];
        
        // GET /consumables/{id} - 获取特定耗材
        $consumable = api_request('GET', "/consumables/{$consumable_id}", $token);
        if ($consumable) {
            output("成功获取耗材: " . $consumable['model'], 'success');
        }
    }
    
    // 获取产品线以用于创建耗材
    $product_lines = api_request('GET', '/product-lines', $token);
    if ($product_lines && !empty($product_lines)) {
        $product_line_id = $product_lines[0]['id'];
        
        // 测试创建耗材
        $new_consumable_data = [
            'product_line_id' => $product_line_id,
            'model' => 'TEST-CON-' . time(),
            'part_number' => 'PN-CON-' . time(),
            'material' => '测试材料',
            'status' => 'publish'
        ];
        
        // POST /consumables - 创建耗材
        $new_consumable = api_request('POST', '/consumables', $token, $new_consumable_data);
        if ($new_consumable) {
            $new_consumable_id = $new_consumable['id'];
            output("成功创建耗材: ID {$new_consumable_id}", 'success');
            
            // 测试更新耗材
            $update_data = [
                'spec' => '测试规格-更新',
                'brand' => 'BJT-TEST'
            ];
            
            // PUT /consumables/{id} - 更新耗材
            $updated_consumable = api_request('PUT', "/consumables/{$new_consumable_id}", $token, $update_data);
            if ($updated_consumable) {
                output("成功更新耗材: ID {$new_consumable_id}", 'success');
            }
            
            // DELETE /consumables/{id} - 删除耗材
            $deleted = api_request('DELETE', "/consumables/{$new_consumable_id}", $token);
            if ($deleted) {
                output("成功删除耗材: ID {$new_consumable_id}", 'success');
            }
        }
    } else {
        output("未找到产品线，跳过创建耗材测试", 'info');
    }
    
    output("耗材API测试完成", 'info');
    output("----------------------------------------", 'info');
}

// 测试备件API
function test_spare_parts_api($token) {
    output("测试备件API", 'info');
    
    // GET /spare-parts - 获取所有备件
    $spare_parts = api_request('GET', '/spare-parts', $token);
    if ($spare_parts) {
        output("成功获取备件列表，共 " . count($spare_parts) . " 项", 'success');
    }
    
    // 如果有备件，测试获取单个备件
    if ($spare_parts && !empty($spare_parts)) {
        $first_part = $spare_parts[0];
        $part_id = $first_part['id'];
        
        // GET /spare-parts/{id} - 获取特定备件
        $spare_part = api_request('GET', "/spare-parts/{$part_id}", $token);
        if ($spare_part) {
            output("成功获取备件: " . $spare_part['name_zh'], 'success');
        }
    }
    
    // 获取产品线以用于创建备件
    $product_lines = api_request('GET', '/product-lines', $token);
    if ($product_lines && !empty($product_lines)) {
        $product_line_id = $product_lines[0]['id'];
        
        // 测试创建备件
        $new_part_data = [
            'product_line_id' => $product_line_id,
            'part_number' => 'SP-' . time(),
            'name_zh' => '测试备件-' . time(),
            'name_en' => 'Test Spare Part-' . time(),
            'is_consumable' => 0,
            'status' => 'publish'
        ];
        
        // POST /spare-parts - 创建备件
        $new_part = api_request('POST', '/spare-parts', $token, $new_part_data);
        if ($new_part) {
            $new_part_id = $new_part['id'];
            output("成功创建备件: ID {$new_part_id}", 'success');
            
            // 测试更新备件
            $update_data = [
                'app_model' => 'TEST-HOST-MODEL',
                'spec' => '测试规格-备件'
            ];
            
            // PUT /spare-parts/{id} - 更新备件
            $updated_part = api_request('PUT', "/spare-parts/{$new_part_id}", $token, $update_data);
            if ($updated_part) {
                output("成功更新备件: ID {$new_part_id}", 'success');
            }
            
            // DELETE /spare-parts/{id} - 删除备件
            $deleted = api_request('DELETE', "/spare-parts/{$new_part_id}", $token);
            if ($deleted) {
                output("成功删除备件: ID {$new_part_id}", 'success');
            }
        }
    } else {
        output("未找到产品线，跳过创建备件测试", 'info');
    }
    
    output("备件API测试完成", 'info');
    output("----------------------------------------", 'info');
}

// 执行所有测试
if (is_wp_error($token)) {
    output("认证失败，某些测试可能会失败", 'error');
} elseif (!$token) {
    output("跳过认证，某些需要认证的操作可能会失败", 'info');
}

test_product_lines_api($token);
test_host_models_api($token);
test_accessories_api($token);
test_consumables_api($token);
test_spare_parts_api($token);

output("BJT Product System API测试完成！", 'success'); 