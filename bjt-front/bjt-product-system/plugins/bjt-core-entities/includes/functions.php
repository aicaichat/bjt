<?php
/**
 * 辅助函数
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 获取当前JWT令牌
 * 
 * @return string|null 当前令牌或null
 */
function bjt_get_current_token() {
    $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    
    // 从Authorization头获取令牌
    if (!empty($auth_header) && strpos($auth_header, 'Bearer ') === 0) {
        return trim(substr($auth_header, 7));
    }
    
    // 从请求参数获取令牌
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    
    return null;
}

/**
 * 获取当前认证用户
 * 
 * @return WP_User|null 当前用户或null
 */
function bjt_get_current_user() {
    $token = bjt_get_current_token();
    
    if (!$token) {
        return null;
    }
    
    $auth = new BJT_Auth();
    $payload = $auth->validate_token($token);
    
    if (is_wp_error($payload)) {
        return null;
    }
    
    if (isset($payload['user']) && isset($payload['user']['id'])) {
        return get_user_by('id', $payload['user']['id']);
    }
    
    return null;
}

/**
 * 获取区域对应的货币
 * 
 * @param string $region 区域代码
 * @return string 货币代码
 */
function bjt_get_currency_by_region($region) {
    $currencies = [
        'CN' => 'CNY',
        'EU' => 'EUR',
        'NA' => 'USD',
        'AU' => 'AUD',
    ];
    
    return isset($currencies[$region]) ? $currencies[$region] : 'CNY';
}

/**
 * 获取区域对应的价格字段
 * 
 * @param string $region 区域代码
 * @return string 价格字段名
 */
function bjt_get_price_field_by_region($region) {
    $price_fields = [
        'CN' => 'price_cny',
        'EU' => 'price_eur',
        'NA' => 'price_usd',
        'AU' => 'price_usd',
    ];
    
    return isset($price_fields[$region]) ? $price_fields[$region] : 'price_cny';
}

/**
 * 获取区域对应的库存字段
 * 
 * @param string $region 区域代码
 * @return string 库存字段名
 */
function bjt_get_inventory_field_by_region($region) {
    $inventory_fields = [
        'CN' => 'inventory_cn',
        'EU' => 'inventory_eu',
        'NA' => 'inventory_na',
        'AU' => 'inventory_au',
    ];
    
    return isset($inventory_fields[$region]) ? $inventory_fields[$region] : 'inventory_cn';
}

/**
 * 根据当前语言获取标题字段
 * 
 * @param string $lang 语言代码
 * @return string 标题字段名
 */
function bjt_get_title_field_by_lang($lang) {
    return $lang === 'en' ? 'title_en' : 'title_zh';
}

/**
 * 根据当前语言获取描述字段
 * 
 * @param string $lang 语言代码
 * @return string 描述字段名
 */
function bjt_get_description_field_by_lang($lang) {
    return $lang === 'en' ? 'description_en' : 'description_zh';
}

/**
 * 记录API调试信息
 * 
 * @param string $message 消息
 * @param array $data 相关数据
 */
function bjt_api_log($message, $data = []) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $log_dir = WP_CONTENT_DIR . '/bjt-api-logs';
        
        // 确保日志目录存在
        if (!is_dir($log_dir)) {
            wp_mkdir_p($log_dir);
        }
        
        $log_file = $log_dir . '/api-debug-' . date('Y-m-d') . '.log';
        $log_entry = '[' . date('Y-m-d H:i:s') . '] ' . $message;
        
        if (!empty($data)) {
            $log_entry .= ' Data: ' . json_encode($data, JSON_UNESCAPED_UNICODE);
        }
        
        file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
    }
}

/**
 * Sets UTF-8 charset header for REST API responses
 * This fixes Chinese character encoding issues in API responses
 */
function bjt_set_utf8_charset_header() {
    // Only apply to REST API requests
    if (defined('REST_REQUEST') && REST_REQUEST) {
        header('Content-Type: application/json; charset=utf-8');
    }
}

// Add this hook with a high priority to ensure it runs before any output
add_action('send_headers', 'bjt_set_utf8_charset_header', 1); 