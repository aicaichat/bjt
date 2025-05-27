<?php

class BJT_JWT_Handler {
    private $secret_key;

    public function __construct() {
        $this->secret_key = get_option('bjt_jwt_secret', 'bjt-secret-key-2023');
    }

    public function validate_token($token, $check_expiration = true) {
        try {
            error_log('🔍 [JWT Handler] Validating token...');
            error_log('🔑 [JWT Handler] Using secret key: ' . substr($this->secret_key, 0, 5) . '...');
            
            // 分割令牌
            $token_parts = explode('.', $token);
            if (count($token_parts) !== 3) {
                error_log('❌ [JWT Handler] Invalid token format (not 3 parts)');
                return false;
            }
            
            list($header_encoded, $payload_encoded, $signature_encoded) = $token_parts;
            
            // 验证签名
            $signature = $this->base64url_decode($signature_encoded);
            $expected_signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret_key, true);
            
            if (!hash_equals($signature, $expected_signature)) {
                error_log('❌ [JWT Handler] Invalid token signature');
                return false;
            }
            
            // 解码负载
            $payload_json = $this->base64url_decode($payload_encoded);
            $payload = json_decode($payload_json);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('❌ [JWT Handler] Failed to decode payload JSON: ' . json_last_error_msg());
                return false;
            }
            
            // 检查过期时间
            if ($check_expiration && isset($payload->exp) && $payload->exp < time()) {
                error_log('⚠️ [JWT Handler] Token expired at: ' . date('Y-m-d H:i:s', $payload->exp));
                return false;
            }
            
            error_log('✅ [JWT Handler] Token validation successful');
            error_log('👤 [JWT Handler] User ID from token: ' . (isset($payload->user->id) ? $payload->user->id : 'not found'));
            
            return $payload;
        } catch (Exception $e) {
            error_log('❌ [JWT Handler] Token validation failed: ' . $e->getMessage());
            error_log('🔍 [JWT Handler] Token being validated: ' . substr($token, 0, 20) . '...');
            return false;
        }
    }

    /**
     * 生成JWT令牌
     */
    public function generate_token($payload) {
        try {
            error_log('🔑 [JWT Handler] Generating token...');
            
            // 编码header
            $header = [
                'alg' => 'HS256',
                'typ' => 'JWT'
            ];
            $header_encoded = $this->base64url_encode(json_encode($header));
            
            // 编码payload
            $payload_encoded = $this->base64url_encode(json_encode($payload));
            
            // 生成签名
            $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $this->secret_key, true);
            $signature_encoded = $this->base64url_encode($signature);
            
            // 组合令牌
            $token = "$header_encoded.$payload_encoded.$signature_encoded";
            
            error_log('✅ [JWT Handler] Token generated successfully');
            return $token;
        } catch (Exception $e) {
            error_log('❌ [JWT Handler] Token generation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Base64Url编码
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64Url解码
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
} 