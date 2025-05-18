<?php
/**
 * Plugin Name: BJT CORS Support
 * Description: Enable CORS for the BJT Product Management System
 * Version: 1.0
 * Author: BJT
 */

// 添加CORS支持 - 仅处理REST API请求
function bjt_add_cors_http_header() {
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
        status_header(200);
        exit();
    }
}

// 仅在处理REST API请求时添加CORS头
add_action("rest_api_init", "bjt_add_cors_http_header", 15);
