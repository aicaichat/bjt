<?php
/**
 * BJT JWT Handler
 * 
 * JWT令牌处理类，提供JWT令牌的生成和验证功能
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT JWT处理类
 */
class BJT_JWT_Handler {
    /**
     * 密钥
     *
     * @var string
     */
    private $secret_key;
    
    /**
     * 构造函数
     */
    public function __construct() {
        // 获取密钥
        $this->secret_key = get_option('bjt_jwt_secret', 'bjt-product-api-secret-key');
    }
    
    /**
     * 生成JWT令牌
     *
     * @param int $user_id 用户ID
     * @return string 生成的令牌
     */
    public function generate_token($user_id) {
        // 创建payload
        $issued_at = time();
        $expiration = $issued_at + (DAY_IN_SECONDS); // Token有效期1天
        
        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expiration,
            'data' => array(
                'user_id' => $user_id
            ),
            'user' => array(
                'id' => $user_id
            )
        );
        
        // 使用简单实现以避免版本兼容性问题
        return $this->simple_encode($payload);
    }
    
    /**
     * 使用自定义payload生成JWT令牌
     *
     * @param array $payload 自定义令牌负载
     * @return string 生成的令牌
     */
    public function generate_token_with_payload($payload) {
        // 使用简单实现以避免版本兼容性问题
        return $this->simple_encode($payload);
    }
    
    /**
     * 验证JWT令牌
     *
     * @param string $token JWT令牌
     * @return object|false 解码后的负载对象或失败时返回false
     */
    public function validate_token($token) {
        try {
            // 使用简单实现以避免版本兼容性问题
            return $this->simple_decode($token);
        } catch (Exception $e) {
            error_log('JWT验证失败: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 简单的JWT编码实现
     *
     * @param array $payload 负载数据
     * @return string JWT令牌
     */
    private function simple_encode($payload) {
        $header = array('alg' => 'HS256', 'typ' => 'JWT');
        
        $header_encoded = $this->base64url_encode(json_encode($header));
        $payload_encoded = $this->base64url_encode(json_encode($payload));
        
        $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret_key, true);
        $signature_encoded = $this->base64url_encode($signature);
        
        return "$header_encoded.$payload_encoded.$signature_encoded";
    }
    
    /**
     * 简单的JWT解码实现
     *
     * @param string $token JWT令牌
     * @return object|false 解码后的负载对象或失败时返回false
     */
    private function simple_decode($token) {
        // 分割令牌
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header_encoded, $payload_encoded, $signature_encoded) = $parts;
        
        // 验证签名
        $signature = $this->base64url_decode($signature_encoded);
        $expected_signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret_key, true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return false;
        }
        
        // 解码负载
        $payload_json = $this->base64url_decode($payload_encoded);
        $payload = json_decode($payload_json);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }
        
        // 检查令牌是否过期
        if (isset($payload->exp) && $payload->exp < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Base64Url编码
     *
     * @param string $data 要编码的数据
     * @return string Base64Url编码后的字符串
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
} 