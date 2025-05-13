<?php
/**
 * JWT Implementation
 * 
 * 一个简单的JWT实现，用于生成和验证令牌
 */

// 如果这个文件被直接访问，退出
if (!defined('ABSPATH')) {
    exit;
}

class JWT {
    /**
     * 使用给定的密钥和算法对数据进行编码
     *
     * @param array  $payload   要编码的数据
     * @param string $key       用于签名的密钥
     * @param string $alg       算法 (支持 HS256, HS384, HS512)
     * @return string 生成的JWT
     */
    public static function encode($payload, $key, $alg = 'HS256') {
        $header = array('typ' => 'JWT', 'alg' => $alg);
        
        $segments = array(
            self::urlsafeB64Encode(json_encode($header)),
            self::urlsafeB64Encode(json_encode($payload))
        );
        
        $signing_input = implode('.', $segments);
        $signature = self::sign($signing_input, $key, $alg);
        $segments[] = self::urlsafeB64Encode($signature);
        
        return implode('.', $segments);
    }
    
    /**
     * 验证并解码JWT
     *
     * @param string $jwt       要解码的JWT
     * @param string $key       用于验证签名的密钥
     * @param array  $allowed_algs 允许的算法
     * @return object 解码后的JWT数据
     * @throws Exception 如果JWT无效则抛出异常
     */
    public static function decode($jwt, $key, $allowed_algs = array('HS256')) {
        $tks = explode('.', $jwt);
        if (count($tks) != 3) {
            throw new Exception('错误的JWT格式');
        }
        
        list($headb64, $bodyb64, $cryptob64) = $tks;
        
        $header = json_decode(self::urlsafeB64Decode($headb64));
        if (null === $header) {
            throw new Exception('无效的JWT头部');
        }
        
        $payload = json_decode(self::urlsafeB64Decode($bodyb64));
        if (null === $payload) {
            throw new Exception('无效的JWT负载');
        }
        
        $sig = self::urlsafeB64Decode($cryptob64);
        if (empty($header->alg)) {
            throw new Exception('JWT头部中未指定算法');
        }
        
        if (!in_array($header->alg, $allowed_algs)) {
            throw new Exception('不支持的JWT算法: ' . $header->alg);
        }
        
        // 检查签名
        if (!self::verify("$headb64.$bodyb64", $sig, $key, $header->alg)) {
            throw new Exception('JWT签名验证失败');
        }
        
        // 检查过期时间
        if (isset($payload->exp) && $payload->exp < time()) {
            throw new Exception('已过期的令牌');
        }
        
        return $payload;
    }
    
    /**
     * 对数据进行签名
     */
    private static function sign($input, $key, $alg) {
        switch($alg) {
            case 'HS256':
                return hash_hmac('sha256', $input, $key, true);
            case 'HS384':
                return hash_hmac('sha384', $input, $key, true);
            case 'HS512':
                return hash_hmac('sha512', $input, $key, true);
            default:
                throw new Exception('不支持的算法: ' . $alg);
        }
    }
    
    /**
     * 验证签名
     */
    private static function verify($input, $signature, $key, $alg) {
        $expected_signature = self::sign($input, $key, $alg);
        return hash_equals($signature, $expected_signature);
    }
    
    /**
     * URL安全的Base64编码
     */
    private static function urlsafeB64Encode($input) {
        return str_replace('=', '', strtr(base64_encode($input), '+/', '-_'));
    }
    
    /**
     * URL安全的Base64解码
     */
    private static function urlsafeB64Decode($input) {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $input .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($input, '-_', '+/'));
    }
} 