<?php
/**
 * Front to the WordPress application. This file doesn't do anything, but loads
 * wp-blog-header.php which does and tells WordPress to load the theme.
 *
 * @package WordPress
 */

// 检查是否是REST API请求
if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') !== false) {
    // 这是REST API请求，确保它不被重定向
    define('REST_REQUEST', true);
    
    // 设置合适的头部
    header('Content-Type: application/json; charset=utf-8');
}

/**
 * Tells WordPress to load the WordPress theme and output it.
 *
 * @var bool
 */
define('WP_USE_THEMES', true);

/** Loads the WordPress Environment and Template */
require __DIR__ . '/wp-blog-header.php'; 