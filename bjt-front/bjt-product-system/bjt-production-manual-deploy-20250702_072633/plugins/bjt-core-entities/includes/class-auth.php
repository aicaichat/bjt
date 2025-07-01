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
        // Get the JWT secret key from WordPress options
        $secret_key = get_option('jwt_auth_secret_key', 'bjt-product-api-secret-key');
        
        // Use the option value if available, otherwise fall back to the default
        return $secret_key;
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
        error_log('BJT_Auth::validate_token - Starting token validation');
        
        if (!class_exists('\Firebase\JWT\JWT')) {
            // 如果没有Firebase JWT库，使用简单的JWT验证
            error_log('BJT_Auth::validate_token - Firebase JWT library not found, using simple validation');
            return $this->simple_validate_token($token);
        }
        
        error_log('BJT_Auth::validate_token - Using Firebase JWT library');
        try {
            // Updated to match Firebase JWT library v6.0+ API
            $key = $this->get_secret_key();
            $payload = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));
            error_log('BJT_Auth::validate_token - Token successfully decoded with Firebase JWT');
            return (array) $payload;
        } catch (\Firebase\JWT\ExpiredException $e) {
            error_log('BJT_Auth::validate_token - Token expired: ' . $e->getMessage());
            return new WP_Error('token_expired', '令牌已过期', ['status' => 401]);
        } catch (\Exception $e) {
            error_log('BJT_Auth::validate_token - Invalid token: ' . $e->getMessage());
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
        error_log('BJT_Auth::simple_validate_token - Starting simple token validation');
        
        // 分割令牌
        $token_parts = explode('.', $token);
        
        if (count($token_parts) !== 3) {
            error_log('BJT_Auth::simple_validate_token - Invalid token format (not 3 parts)');
            return new WP_Error('invalid_token', '无效的令牌格式', ['status' => 401]);
        }
        
        list($header_encoded, $payload_encoded, $signature_encoded) = $token_parts;
        
        // 验证签名
        $signature = $this->base64url_decode($signature_encoded);
        $expected_signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->get_secret_key(), true);
        
        if (!hash_equals($signature, $expected_signature)) {
            error_log('BJT_Auth::simple_validate_token - Invalid token signature');
            error_log('BJT_Auth::simple_validate_token - Secret key used: ' . substr($this->get_secret_key(), 0, 5) . '...');
            return new WP_Error('invalid_signature', '无效的令牌签名', ['status' => 401]);
        }
        
        // 解码负载
        $payload_json = $this->base64url_decode($payload_encoded);
        $payload = json_decode($payload_json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('BJT_Auth::simple_validate_token - Failed to decode payload JSON: ' . json_last_error_msg());
            return new WP_Error('invalid_payload', '无效的令牌负载', ['status' => 401]);
        }
        
        error_log('BJT_Auth::simple_validate_token - Payload decoded: ' . print_r($payload, true));
        
        // 检查过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            error_log('BJT_Auth::simple_validate_token - Token expired. Expiry: ' . date('Y-m-d H:i:s', $payload['exp']) . ', Current: ' . date('Y-m-d H:i:s', time()));
            return new WP_Error('token_expired', '令牌已过期', ['status' => 401]);
        }
        
        error_log('BJT_Auth::simple_validate_token - Token validated successfully');
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
        error_log('[BJT_Auth][validate_user] Attempting to authenticate user: ' . $username);
        
        // Check if username exists
        $user_exists = username_exists($username);
        error_log('[BJT_Auth][validate_user] Username exists check: ' . ($user_exists ? 'Yes' : 'No'));
        
        if (!$user_exists) {
            error_log('[BJT_Auth][validate_user] Username does not exist: ' . $username);
            return new WP_Error('invalid_credentials', '用户名或密码错误', ['status' => 401]);
        }
        
        // Attempt to authenticate
        $user = wp_authenticate($username, $password);
        error_log('[BJT_Auth][validate_user] wp_authenticate result type: ' . (is_wp_error($user) ? 'WP_Error' : 'WP_User'));
        
        if (is_wp_error($user)) {
            error_log('[BJT_Auth][validate_user] Authentication failed. Error code: ' . $user->get_error_code());
            error_log('[BJT_Auth][validate_user] Error message: ' . $user->get_error_message());
            return new WP_Error('invalid_credentials', '用户名或密码错误', ['status' => 401]);
        }
        
        error_log('[BJT_Auth][validate_user] Authentication successful for user: ' . $username . ' (ID: ' . $user->ID . ')');
        return $user;
    }
} 