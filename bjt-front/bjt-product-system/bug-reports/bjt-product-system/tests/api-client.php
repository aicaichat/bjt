<?php
/**
 * BJT Product System API 客户端示例
 * 
 * 此脚本演示如何在PHP应用程序中调用BJT Product System的API
 */

class BJT_API_Client {
    /**
     * API基础URL
     * @var string
     */
    private $api_base_url;
    
    /**
     * 认证令牌
     * @var string|null
     */
    private $token = null;
    
    /**
     * 构造函数
     * 
     * @param string $api_base_url API基础URL
     */
    public function __construct($api_base_url) {
        $this->api_base_url = $api_base_url;
    }
    
    /**
     * 设置认证令牌
     * 
     * @param string $token 认证令牌
     */
    public function set_token($token) {
        $this->token = $token;
    }
    
    /**
     * 获取认证令牌
     * 
     * @param string $username 用户名
     * @param string $password 密码
     * @return bool 是否成功获取令牌
     */
    public function authenticate($username, $password) {
        $auth_url = str_replace('/bjt/v1', '/jwt-auth/v1/token', $this->api_base_url);
        
        $response = $this->make_request('POST', $auth_url, [
            'username' => $username,
            'password' => $password
        ]);
        
        if (isset($response['token'])) {
            $this->token = $response['token'];
            return true;
        }
        
        return false;
    }
    
    /**
     * 发送API请求
     * 
     * @param string $method HTTP方法
     * @param string $endpoint API端点
     * @param array $data 请求数据
     * @return array|false 响应数据或失败
     */
    private function request($method, $endpoint, $data = null) {
        $url = $this->api_base_url . $endpoint;
        return $this->make_request($method, $url, $data);
    }
    
    /**
     * 发送HTTP请求
     * 
     * @param string $method HTTP方法
     * @param string $url 完整URL
     * @param array $data 请求数据
     * @return array|false 响应数据或失败
     */
    private function make_request($method, $url, $data = null) {
        $ch = curl_init();
        
        $headers = ['Content-Type: application/json'];
        if ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code < 200 || $http_code >= 300) {
            echo "API请求失败: {$method} {$url} - 状态码 {$http_code}\n";
            if ($response) {
                echo "错误信息: {$response}\n";
            }
            return false;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * 获取所有产品线
     * 
     * @return array|false 产品线列表或失败
     */
    public function get_product_lines() {
        return $this->request('GET', '/product-lines');
    }
    
    /**
     * 获取特定产品线
     * 
     * @param int $id 产品线ID
     * @return array|false 产品线信息或失败
     */
    public function get_product_line($id) {
        return $this->request('GET', "/product-lines/{$id}");
    }
    
    /**
     * 创建产品线
     * 
     * @param array $data 产品线数据
     * @return array|false 创建的产品线信息或失败
     */
    public function create_product_line($data) {
        return $this->request('POST', '/product-lines', $data);
    }
    
    /**
     * 更新产品线
     * 
     * @param int $id 产品线ID
     * @param array $data 更新数据
     * @return array|false 更新后的产品线信息或失败
     */
    public function update_product_line($id, $data) {
        return $this->request('PUT', "/product-lines/{$id}", $data);
    }
    
    /**
     * 删除产品线
     * 
     * @param int $id 产品线ID
     * @return bool 是否成功删除
     */
    public function delete_product_line($id) {
        $result = $this->request('DELETE', "/product-lines/{$id}");
        return $result !== false;
    }
    
    /**
     * 获取产品线下的主机型号
     * 
     * @param int $id 产品线ID
     * @return array|false 主机型号列表或失败
     */
    public function get_product_line_host_models($id) {
        return $this->request('GET', "/product-lines/{$id}/host-models");
    }
    
    /**
     * 获取所有主机型号
     * 
     * @return array|false 主机型号列表或失败
     */
    public function get_host_models() {
        return $this->request('GET', '/host-models');
    }
    
    /**
     * 获取特定主机型号
     * 
     * @param int $id 主机型号ID
     * @return array|false 主机型号信息或失败
     */
    public function get_host_model($id) {
        return $this->request('GET', "/host-models/{$id}");
    }
    
    /**
     * 创建主机型号
     * 
     * @param array $data 主机型号数据
     * @return array|false 创建的主机型号信息或失败
     */
    public function create_host_model($data) {
        return $this->request('POST', '/host-models', $data);
    }
    
    // 以下为其他API方法，根据需要补充
}

// 使用示例
function run_api_client_example() {
    // 设置API客户端
    $api_client = new BJT_API_Client('http://localhost:8080/wp-json/bjt/v1');
    
    // 认证（如果需要）
    // $api_client->authenticate('admin', 'password');
    
    // 获取产品线
    $product_lines = $api_client->get_product_lines();
    if ($product_lines) {
        echo "获取到 " . count($product_lines) . " 个产品线\n";
        
        // 显示第一个产品线的详细信息
        if (!empty($product_lines)) {
            $line = $product_lines[0];
            echo "产品线: {$line['title_zh']} ({$line['title_en']})\n";
            echo "代码: {$line['code']}\n";
            
            // 获取该产品线下的主机型号
            $host_models = $api_client->get_product_line_host_models($line['id']);
            if ($host_models) {
                echo "该产品线下有 " . count($host_models) . " 个主机型号\n";
                
                // 显示第一个主机型号的详细信息
                if (!empty($host_models)) {
                    $model = $host_models[0];
                    echo "主机型号: {$model['model_name']} ({$model['name_en']})\n";
                    echo "型号: {$model['model_number']}\n";
                }
            }
            
            // 创建一个新的产品线
            $new_line_data = [
                'title_zh' => '测试产品线-' . time(),
                'title_en' => 'Test Product Line-' . time(),
                'code' => 'test-' . time(),
                'status' => 'publish'
            ];
            
            $new_line = $api_client->create_product_line($new_line_data);
            if ($new_line) {
                echo "成功创建产品线: ID {$new_line['id']}\n";
                
                // 更新产品线
                $update_data = [
                    'description_zh' => '这是通过API客户端创建的测试产品线',
                    'description_en' => 'This is a test product line created via the API client'
                ];
                
                $updated_line = $api_client->update_product_line($new_line['id'], $update_data);
                if ($updated_line) {
                    echo "成功更新产品线\n";
                    
                    // 最后删除测试产品线
                    if ($api_client->delete_product_line($new_line['id'])) {
                        echo "成功删除测试产品线\n";
                    }
                }
            }
        }
    }
}

// 运行示例
run_api_client_example(); 