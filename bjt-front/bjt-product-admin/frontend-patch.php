<?php
/**
 * 前端页面处理补丁文件
 * 
 * 这个文件包含处理独立前端页面访问的函数
 */

// 添加重写规则，使前端页面可以通过 /product-frontend/ 访问
function bjt_add_frontend_rewrite_rules() {
    add_rewrite_rule(
        'product-frontend/?$',
        'index.php?bjt_product_frontend=1',
        'top'
    );
    
    add_rewrite_rule(
        'product-frontend/(.+)/?$',
        'index.php?bjt_product_frontend=1&bjt_product_frontend_path=$matches[1]',
        'top'
    );
}
add_action('init', 'bjt_add_frontend_rewrite_rules');

// 添加查询变量
function bjt_add_query_vars($vars) {
    $vars[] = 'bjt_product_frontend';
    $vars[] = 'bjt_product_frontend_path';
    return $vars;
}
add_filter('query_vars', 'bjt_add_query_vars');

// 处理前端请求
function bjt_handle_frontend_request() {
    global $wp_query;
    
    if (isset($wp_query->query_vars['bjt_product_frontend'])) {
        // 记录日志以便调试
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('处理前端页面请求: ' . print_r($wp_query->query_vars, true));
        }
        
        // 检查是否是对具体资源的请求
        if (isset($wp_query->query_vars['bjt_product_frontend_path'])) {
            $path = $wp_query->query_vars['bjt_product_frontend_path'];
            $file_path = BJT_PLUGIN_DIR . 'public-frontend/' . $path;
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('尝试加载文件: ' . $file_path);
            }
            
            if (file_exists($file_path)) {
                // 确定正确的MIME类型
                $extension = pathinfo($file_path, PATHINFO_EXTENSION);
                $mime_types = array(
                    'css' => 'text/css',
                    'js' => 'application/javascript',
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'html' => 'text/html',
                    'htm' => 'text/html',
                );
                
                if (isset($mime_types[$extension])) {
                    header('Content-Type: ' . $mime_types[$extension]);
                }
                
                // 输出文件内容
                readfile($file_path);
                exit;
            } else {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('文件不存在: ' . $file_path);
                }
            }
        }
        
        // 默认情况下显示主HTML文件
        $main_file = BJT_PLUGIN_DIR . 'public-frontend/index.html';
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('尝试加载主文件: ' . $main_file);
        }
        
        if (file_exists($main_file)) {
            header('Content-Type: text/html');
            readfile($main_file);
            exit;
        } else {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('主文件不存在: ' . $main_file);
            }
        }
    }
}
add_action('template_redirect', 'bjt_handle_frontend_request');

// 添加REST API支持
function bjt_register_product_rest_routes() {
    register_rest_route('bjt-product/v1', '/products', array(
        'methods' => 'GET',
        'callback' => 'bjt_get_products',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products', array(
        'methods' => 'POST',
        'callback' => 'bjt_create_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'bjt_get_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'bjt_update_product',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt-product/v1', '/products/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'bjt_delete_product',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'bjt_register_product_rest_routes');

// API回调函数
function bjt_get_products() {
    // 在实际应用中从数据库获取数据
    // 这里返回示例数据
    $products = array(
        array(
            'id' => 1,
            'model' => 'BLP-001',
            'title' => '智能控制器',
            'description' => '高性能智能控制器，支持多种协议',
            'title_zh' => '智能控制器',
            'description_zh' => '高性能智能控制器，支持多种协议',
            'title_en' => 'Smart Controller',
            'description_en' => 'High-performance smart controller with multi-protocol support',
            'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
        ),
        array(
            'id' => 2,
            'model' => 'BLP-002',
            'title' => '数据采集器',
            'description' => '工业级数据采集器，稳定可靠',
            'title_zh' => '数据采集器',
            'description_zh' => '工业级数据采集器，稳定可靠',
            'title_en' => 'Data Collector',
            'description_en' => 'Industrial-grade data collector, stable and reliable',
            'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
        )
    );
    
    return new WP_REST_Response($products, 200);
}

function bjt_get_product($request) {
    $id = $request['id'];
    // 实际应用中从数据库获取特定ID的产品
    // 这里返回示例数据
    
    return new WP_REST_Response(array(
        'id' => $id,
        'model' => 'BLP-00' . $id,
        'title' => '智能控制器' . $id,
        'description' => '高性能智能控制器，支持多种协议',
        'title_zh' => '智能控制器' . $id,
        'description_zh' => '高性能智能控制器，支持多种协议',
        'title_en' => 'Smart Controller ' . $id,
        'description_en' => 'High-performance smart controller with multi-protocol support',
        'image' => BJT_PLUGIN_URL . 'assets/images/placeholder.png'
    ), 200);
}

function bjt_create_product($request) {
    $params = $request->get_params();
    
    // 实际应用中将数据保存到数据库
    // 这里简单返回提交的数据，并添加ID
    $params['id'] = time(); // 使用时间戳作为临时ID
    
    return new WP_REST_Response($params, 201);
}

function bjt_update_product($request) {
    $id = $request['id'];
    $params = $request->get_params();
    
    // 实际应用中更新数据库中的记录
    // 这里简单返回提交的数据
    $params['id'] = $id;
    
    return new WP_REST_Response($params, 200);
}

function bjt_delete_product($request) {
    $id = $request['id'];
    
    // 实际应用中从数据库删除记录
    // 这里简单返回成功消息
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => '产品已删除',
        'id' => $id
    ), 200);
}

// 添加前端页面的快捷方式到管理菜单
function bjt_add_frontend_menu_item($menu_items) {
    $menu_items[] = array(
        'title' => '产品前台页面',
        'capability' => 'manage_options',
        'url' => home_url('product-frontend/'),
        'icon' => 'dashicons-laptop'
    );
    
    return $menu_items;
}
add_filter('bjt_admin_menu_items', 'bjt_add_frontend_menu_item'); 