<?php
/**
 * 辅助函数
 * 
 * 提供插件所需的工具函数
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 检查值是否为空或null
 * @param mixed $value 要检查的值
 * @return bool
 */
function bjt_is_null_or_empty($value) {
    if (is_null($value)) {
        return true;
    }
    if (is_string($value)) {
        return trim($value) === '';
    }
    if (is_array($value)) {
        return empty($value);
    }
    return false;
}

/**
 * 安全的strpos函数
 * @param string $haystack 要搜索的字符串
 * @param string $needle 要查找的字符串
 * @param int $offset 开始搜索的位置
 * @return int|false
 */
function bjt_safe_strpos($haystack, $needle, $offset = 0) {
    if (bjt_is_null_or_empty($haystack) || bjt_is_null_or_empty($needle)) {
        return false;
    }
    if (!is_string($haystack) || !is_string($needle)) {
        return false;
    }
    if (!is_int($offset)) {
        $offset = 0;
    }
    return strpos($haystack, $needle, $offset);
}

/**
 * 安全的str_replace函数
 * @param string|array $search 要搜索的值
 * @param string|array $replace 要替换的值
 * @param string|array $subject 要处理的字符串或数组
 * @return string|array
 */
function bjt_safe_str_replace($search, $replace, $subject) {
    if (bjt_is_null_or_empty($subject)) {
        return '';
    }
    if (!is_string($subject) && !is_array($subject)) {
        return '';
    }
    if (bjt_is_null_or_empty($search) || bjt_is_null_or_empty($replace)) {
        return $subject;
    }
    return str_replace($search, $replace, $subject);
}

/**
 * 安全的sanitize_text_field函数
 * @param string $str 要处理的字符串
 * @return string
 */
function bjt_safe_sanitize_text_field($str) {
    if (bjt_is_null_or_empty($str)) {
        return '';
    }
    if (!is_string($str)) {
        return '';
    }
    return sanitize_text_field($str);
}

/**
 * 安全的wp_kses_post函数
 * @param string $content 要处理的内容
 * @return string
 */
function bjt_safe_wp_kses_post($content) {
    if (bjt_is_null_or_empty($content)) {
        return '';
    }
    if (!is_string($content)) {
        return '';
    }
    return wp_kses_post($content);
}

/**
 * 安全的wp_unslash函数
 * @param string|array $value 要处理的值
 * @return string|array
 */
function bjt_safe_wp_unslash($value) {
    if (bjt_is_null_or_empty($value)) {
        return '';
    }
    if (!is_string($value) && !is_array($value)) {
        return '';
    }
    return wp_unslash($value);
}

/**
 * 安全的wp_parse_args函数
 * @param array|string $args 要解析的参数
 * @param array $defaults 默认值
 * @return array
 */
function bjt_safe_wp_parse_args($args, $defaults = array()) {
    if (bjt_is_null_or_empty($args)) {
        return $defaults;
    }
    if (!is_array($args) && !is_string($args)) {
        return $defaults;
    }
    return wp_parse_args($args, $defaults);
}

/**
 * 安全的add_query_arg函数
 * @param mixed $args 要添加的参数
 * @param mixed $url 基础URL
 * @return string 处理后的URL
 */
function bjt_safe_add_query_arg($args, $url = '') {
    if (bjt_is_null_or_empty($url)) {
        $url = '';
    }
    if (!is_string($url)) {
        $url = (string)$url;
    }
    if (bjt_is_null_or_empty($args)) {
        return $url;
    }
    if (!is_array($args) && !is_string($args)) {
        return $url;
    }
    return add_query_arg($args, $url);
}

/**
 * 安全的admin_url函数
 * @param mixed $path 路径
 * @param mixed $scheme 方案
 * @return string 处理后的URL
 */
function bjt_safe_admin_url($path = '', $scheme = 'admin') {
    if (bjt_is_null_or_empty($path)) {
        $path = '';
    }
    if (!is_string($path)) {
        $path = (string)$path;
    }
    if (bjt_is_null_or_empty($scheme)) {
        $scheme = 'admin';
    }
    if (!is_string($scheme)) {
        $scheme = 'admin';
    }
    return admin_url($path, $scheme);
}

/**
 * 安全的esc_html函数
 * @param mixed $text 要转义的文本
 * @return string 转义后的文本
 */
function bjt_safe_esc_html($text) {
    if (bjt_is_null_or_empty($text)) {
        return '';
    }
    if (!is_string($text)) {
        $text = (string)$text;
    }
    return esc_html($text);
}

/**
 * 安全的esc_attr函数
 * @param mixed $text 要转义的文本
 * @return string 转义后的文本
 */
function bjt_safe_esc_attr($text) {
    if (bjt_is_null_or_empty($text)) {
        return '';
    }
    if (!is_string($text)) {
        $text = (string)$text;
    }
    return esc_attr($text);
} 