<?php
/**
 * JWT认证实现
 */

class BJT_Auth {
    /**
     * 获取JWT密钥
     *
     * @return string JWT密钥
     */
    private function get_secret_key() {
        return get_option('bjt_jwt_secret', 'bjt-default-secret-key');
    }
    
    /**
     * 生成JWT令牌
     *
     * @param array $payload 令牌负载
     * @return string 生成的令牌
     */
    public function generate_token($payload) {
        if (!class_exists('\Firebase\JWT\JWT')) {
            // 如果没有Firebase JWT库，使用简单的JWT实现
            return $this->simple_generate_token($payload);
        }
        
        $token = \Firebase\JWT\JWT::encode($payload, $this->get_secret_key(), 'HS256');
        return $token;
    }
    
    /**
     * 简单的JWT令牌生成（当Firebase JWT库不可用时）
     *
     * @param array $payload 令牌负载
     * @return string 生成的令牌
     */
    private function simple_generate_token($payload) {
        // 头部
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];
        
        // Base64Url编码头部和负载
        $header_encoded = $this->base64url_encode(json_encode($header));
        $payload_encoded = $this->base64url_encode(json_encode($payload));
        
        // 签名
        $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->get_secret_key(), true);
        $signature_encoded = $this->base64url_encode($signature);
        
        // 完整令牌
        return "$header_encoded.$payload_encoded.$signature_encoded";
    }
    
    /**
     * 验证JWT令牌
     *
     * @param string $token JWT令牌
     * @return array|WP_Error 解码后的payload或错误
     */
    public function validate_token($token) {
        if (!class_exists('\Firebase\JWT\JWT')) {
            // 如果没有Firebase JWT库，使用简单的JWT验证
            return $this->simple_validate_token($token);
        }
        
        try {
            $payload = \Firebase\JWT\JWT::decode($token, $this->get_secret_key(), ['HS256']);
            return (array) $payload;
        } catch (\Firebase\JWT\ExpiredException $e) {
            return new WP_Error('token_expired', '令牌已过期', ['status' => 401]);
        } catch (\Exception $e) {
            return new WP_Error('invalid_token', '无效的令牌', ['status' => 401]);
        }
    }
    
    /**
     * 简单的JWT令牌验证（当Firebase JWT库不可用时）
     *
     * @param string $token JWT令牌
     * @return array|WP_Error 解码后的payload或错误
     */
    private function simple_validate_token($token) {
        // 分割令牌
        $token_parts = explode('.', $token);
        
        if (count($token_parts) !== 3) {
            return new WP_Error('invalid_token', '无效的令牌格式', ['status' => 401]);
        }
        
        list($header_encoded, $payload_encoded, $signature_encoded) = $token_parts;
        
        // 验证签名
        $signature = $this->base64url_decode($signature_encoded);
        $expected_signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->get_secret_key(), true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return new WP_Error('invalid_signature', '无效的令牌签名', ['status' => 401]);
        }
        
        // 解码负载
        $payload = json_decode($this->base64url_decode($payload_encoded), true);
        
        // 检查过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return new WP_Error('token_expired', '令牌已过期', ['status' => 401]);
        }
        
        return $payload;
    }
    
    /**
     * Base64Url编码
     *
     * @param string $data 要编码的数据
     * @return string 编码后的数据
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64Url解码
     *
     * @param string $data 要解码的数据
     * @return string 解码后的数据
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    /**
     * 验证用户登录
     *
     * @param string $username 用户名
     * @param string $password 密码
     * @return WP_User|WP_Error 用户对象或错误
     */
    public function validate_user($username, $password) {
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', '用户名或密码错误', ['status' => 401]);
        }
        
        return $user;
    }
} 