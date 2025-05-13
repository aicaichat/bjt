<?php
/**
 * Plugin Name: BJT API Test V2
 * Description: 测试BJT API功能（简化版）
 * Version: 1.0.0
 * Author: BJT Team
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

// 注册测试API路由
add_action('rest_api_init', function() {
    register_rest_route('bjt-test/v1', '/test', array(
        'methods' => 'GET',
        'callback' => function() {
            return array(
                'success' => true,
                'message' => 'BJT API Test Success!',
                'data' => array(
                    'time' => current_time('mysql'),
                    'version' => '1.0.0',
                    'wordpress_version' => get_bloginfo('version')
                )
            );
        },
        'permission_callback' => '__return_true'
    ));
}); 