<?php
/**
 * Plugin Name: BJT CORS Support
 * Description: Enable CORS for the BJT Product Management System
 * Version: 1.4
 * Author: BJT
 */

// 添加CORS支持 - 主要支持5173端口
function bjt_add_cors_http_header() {
    // 🔧 主要支持5173端口，5174作为备用
    $allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',  // 备用端口
        'http://127.0.0.1:5174'   // 备用端口
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // 默认允许5173（主要端口）
        header("Access-Control-Allow-Origin: http://localhost:5173");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce");
    header("Access-Control-Expose-Headers: Link, X-WP-Total, X-WP-TotalPages");
    
    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
        status_header(200);
        exit();
    }
}

// 仅在处理REST API请求时添加CORS头
add_action("rest_api_init", "bjt_add_cors_http_header", 15);
