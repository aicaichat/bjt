<?php
/**
 * REST API直接处理文件
 * 
 * 直接访问：http://localhost:8080/wp-content/plugins/bjt-product-system/rest-override.php?endpoint=product-lines
 * 
 * 这个文件用于在WordPress REST API不正常工作时，直接提供API功能
 */

// 开启错误报告
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 加载WordPress环境
require_once(dirname(dirname(dirname(dirname(__FILE__)))) . '/wp-load.php');

// 定义目录路径（避免常量冲突）
if (!defined('BJT_PRODUCT_SYSTEM_PATH')) {
    define('BJT_PRODUCT_SYSTEM_PATH', dirname(__FILE__) . '/');
}

try {
    // 确保WordPress正确加载
    if (!function_exists('wp_die')) {
        throw new Exception('WordPress环境未正确加载');
    }

    // REST API相关函数
    require_once(ABSPATH . WPINC . '/rest-api.php');

    // 避免header错误，检查输出是否已经开始
    if (!headers_sent()) {
        // 允许跨域
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
    }

    // 处理OPTIONS请求
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    // 获取请求的端点
    $endpoint = isset($_GET['endpoint']) ? sanitize_text_field($_GET['endpoint']) : '';
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $per_page = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;
    $status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : 'publish';
    $lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'zh';

    // 检查数据库类文件是否存在
    $db_class_file = BJT_PRODUCT_SYSTEM_PATH . 'includes/class-bjt-product-system-db.php';
    if (!file_exists($db_class_file)) {
        throw new Exception('数据库类文件不存在: ' . $db_class_file);
    }

    // 加载数据库类
    require_once $db_class_file;
    
    // 检查类是否已定义
    if (!class_exists('BJT_Product_System_DB')) {
        throw new Exception('数据库类未找到: BJT_Product_System_DB');
    }
    
    $db = new BJT_Product_System_DB();

    // 处理不同端点
    switch ($endpoint) {
        case 'test':
            echo json_encode(array(
                'success' => true,
                'message' => 'API测试端点正常工作',
                'time' => current_time('mysql'),
                'wordpress_version' => get_bloginfo('version'),
                'php_version' => phpversion(),
                'plugin_path' => BJT_PRODUCT_SYSTEM_PATH,
                'request' => array(
                    'endpoint' => $endpoint,
                    'method' => $_SERVER['REQUEST_METHOD'],
                ),
                'server_info' => array(
                    'document_root' => $_SERVER['DOCUMENT_ROOT'],
                    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
                    'request_uri' => $_SERVER['REQUEST_URI'],
                    'http_host' => $_SERVER['HTTP_HOST'],
                    'server_software' => $_SERVER['SERVER_SOFTWARE']
                ),
                'headers_sent' => headers_sent()
            ));
            break;
        
        case 'product-lines':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                if ($id > 0) {
                    // 获取单个产品线
                    $product_line = $db->get_product_line($id);
                    
                    if (empty($product_line)) {
                        http_response_code(404);
                        echo json_encode(array(
                            'success' => false,
                            'message' => '未找到产品线',
                            'code' => 404
                        ));
                        break;
                    }
                    
                    // 处理语言
                    if ($lang === 'en') {
                        $product_line['title'] = $product_line['title_en'];
                        $product_line['description'] = $product_line['description_en'];
                        $product_line['subitem1'] = $product_line['subitem1_en'];
                        $product_line['subitem2'] = $product_line['subitem2_en'];
                        $product_line['subitem3'] = $product_line['subitem3_en'];
                    } else {
                        $product_line['title'] = $product_line['title_zh'];
                        $product_line['description'] = $product_line['description_zh'];
                        $product_line['subitem1'] = $product_line['subitem1_zh'];
                        $product_line['subitem2'] = $product_line['subitem2_zh'];
                        $product_line['subitem3'] = $product_line['subitem3_zh'];
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $product_line
                    ));
                } else {
                    // 获取产品线列表
                    $args = array(
                        'page' => $page,
                        'per_page' => $per_page,
                        'status' => $status
                    );
                    
                    $product_lines = $db->get_product_lines($args);
                    
                    // 处理语言
                    if (!empty($product_lines['items'])) {
                        foreach ($product_lines['items'] as &$product_line) {
                            if ($lang === 'en') {
                                $product_line['title'] = $product_line['title_en'];
                                $product_line['description'] = $product_line['description_en'];
                                $product_line['subitem1'] = $product_line['subitem1_en'];
                                $product_line['subitem2'] = $product_line['subitem2_en'];
                                $product_line['subitem3'] = $product_line['subitem3_en'];
                            } else {
                                $product_line['title'] = $product_line['title_zh'];
                                $product_line['description'] = $product_line['description_zh'];
                                $product_line['subitem1'] = $product_line['subitem1_zh'];
                                $product_line['subitem2'] = $product_line['subitem2_zh'];
                                $product_line['subitem3'] = $product_line['subitem3_zh'];
                            }
                        }
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $product_lines
                    ));
                }
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        case 'host-models':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $product_line_id = isset($_GET['product_line_id']) ? intval($_GET['product_line_id']) : 0;
                
                if ($id > 0) {
                    // 获取单个主机型号
                    $host_model = $db->get_host_model($id);
                    
                    if (empty($host_model)) {
                        http_response_code(404);
                        echo json_encode(array(
                            'success' => false,
                            'message' => '未找到主机型号',
                            'code' => 404
                        ));
                        break;
                    }
                    
                    // 处理语言
                    if ($lang === 'en') {
                        $host_model['name'] = $host_model['name_en'];
                        $host_model['description'] = $host_model['description_en'];
                    } else {
                        $host_model['name'] = $host_model['model_name'];
                        $host_model['description'] = $host_model['description_zh'];
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $host_model
                    ));
                } else {
                    // 获取主机型号列表
                    $args = array(
                        'page' => $page,
                        'per_page' => $per_page,
                        'status' => $status,
                        'product_line_id' => $product_line_id
                    );
                    
                    $host_models = $db->get_host_models($args);
                    
                    // 处理语言
                    if (!empty($host_models['items'])) {
                        foreach ($host_models['items'] as &$host_model) {
                            if ($lang === 'en') {
                                $host_model['name'] = $host_model['name_en'];
                                $host_model['description'] = $host_model['description_en'];
                            } else {
                                $host_model['name'] = $host_model['model_name'];
                                $host_model['description'] = $host_model['description_zh'];
                            }
                        }
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $host_models
                    ));
                }
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        case 'accessories':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $host_model_id = isset($_GET['host_model_id']) ? intval($_GET['host_model_id']) : 0;
                
                if ($id > 0) {
                    // 获取单个配件
                    $accessory = $db->get_accessory($id);
                    
                    if (empty($accessory)) {
                        http_response_code(404);
                        echo json_encode(array(
                            'success' => false,
                            'message' => '未找到配件',
                            'code' => 404
                        ));
                        break;
                    }
                    
                    // 处理语言
                    if ($lang === 'en') {
                        $accessory['title'] = $accessory['title_en'];
                        $accessory['description'] = $accessory['description_en'];
                    } else {
                        $accessory['title'] = $accessory['title_zh'];
                        $accessory['description'] = $accessory['description_zh'];
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $accessory
                    ));
                } else {
                    // 获取配件列表
                    $args = array(
                        'page' => $page,
                        'per_page' => $per_page,
                        'status' => $status,
                        'host_model_id' => $host_model_id
                    );
                    
                    $accessories = $db->get_accessories($args);
                    
                    // 处理语言
                    if (!empty($accessories['items'])) {
                        foreach ($accessories['items'] as &$accessory) {
                            if ($lang === 'en') {
                                $accessory['title'] = $accessory['title_en'];
                                $accessory['description'] = $accessory['description_en'];
                            } else {
                                $accessory['title'] = $accessory['title_zh'];
                                $accessory['description'] = $accessory['description_zh'];
                            }
                        }
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $accessories
                    ));
                }
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        case 'consumables':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $host_model_id = isset($_GET['host_model_id']) ? intval($_GET['host_model_id']) : 0;
                
                if ($id > 0) {
                    // 获取单个耗材
                    $consumable = $db->get_consumable($id);
                    
                    if (empty($consumable)) {
                        http_response_code(404);
                        echo json_encode(array(
                            'success' => false,
                            'message' => '未找到耗材',
                            'code' => 404
                        ));
                        break;
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $consumable
                    ));
                } else {
                    // 获取耗材列表
                    $args = array(
                        'page' => $page,
                        'per_page' => $per_page,
                        'status' => $status,
                        'host_model_id' => $host_model_id
                    );
                    
                    $consumables = $db->get_consumables($args);
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $consumables
                    ));
                }
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        case 'spare-parts':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $host_model_id = isset($_GET['host_model_id']) ? intval($_GET['host_model_id']) : 0;
                
                if ($id > 0) {
                    // 获取单个零部件
                    $spare_part = $db->get_spare_part($id);
                    
                    if (empty($spare_part)) {
                        http_response_code(404);
                        echo json_encode(array(
                            'success' => false,
                            'message' => '未找到零部件',
                            'code' => 404
                        ));
                        break;
                    }
                    
                    // 处理语言
                    if ($lang === 'en') {
                        $spare_part['name'] = $spare_part['name_en'];
                    } else {
                        $spare_part['name'] = $spare_part['name_zh'];
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $spare_part
                    ));
                } else {
                    // 获取零部件列表
                    $args = array(
                        'page' => $page,
                        'per_page' => $per_page,
                        'status' => $status,
                        'host_model_id' => $host_model_id
                    );
                    
                    $spare_parts = $db->get_spare_parts($args);
                    
                    // 处理语言
                    if (!empty($spare_parts['items'])) {
                        foreach ($spare_parts['items'] as &$spare_part) {
                            if ($lang === 'en') {
                                $spare_part['name'] = $spare_part['name_en'];
                            } else {
                                $spare_part['name'] = $spare_part['name_zh'];
                            }
                        }
                    }
                    
                    echo json_encode(array(
                        'success' => true,
                        'data' => $spare_parts
                    ));
                }
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        case 'auth/login':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // 获取请求体
                $request_body = file_get_contents('php://input');
                $data = json_decode($request_body, true);
                
                $username = isset($data['username']) ? sanitize_user($data['username']) : '';
                $password = isset($data['password']) ? $data['password'] : '';
                
                // 验证用户凭据
                $user = wp_authenticate($username, $password);
                
                if (is_wp_error($user)) {
                    http_response_code(401);
                    echo json_encode(array(
                        'success' => false,
                        'message' => '用户名或密码不正确',
                        'code' => 1001
                    ));
                    break;
                }
                
                // 生成简单的令牌（生产环境应使用JWT）
                $token = md5($user->ID . time() . wp_generate_password(16, false));
                update_user_meta($user->ID, 'bjt_auth_token', $token);
                
                // 获取用户信息
                $user_data = array(
                    'id' => $user->ID,
                    'username' => $user->user_login,
                    'email' => $user->user_email,
                    'name' => $user->display_name,
                    'role' => !empty($user->roles) ? $user->roles[0] : '',
                    'region' => get_user_meta($user->ID, 'bjt_region', true) ?: 'CN',
                    'vipLevel' => (int) get_user_meta($user->ID, 'bjt_vip_level', true) ?: 0,
                    'type' => 'vip' // 示例值，实际应从用户元数据中获取
                );
                
                echo json_encode(array(
                    'success' => true,
                    'data' => array(
                        'token' => $token,
                        'expires_in' => 86400, // 24小时过期
                        'user' => $user_data
                    )
                ));
            } else {
                http_response_code(405);
                echo json_encode(array(
                    'success' => false,
                    'message' => '不支持的请求方法',
                    'code' => 405
                ));
            }
            break;
        
        default:
            if (!headers_sent()) {
                http_response_code(404);
            }
            echo json_encode(array(
                'success' => false,
                'message' => '未知的API端点',
                'code' => 404,
                'available_endpoints' => array(
                    'test' => '测试端点，返回基本信息',
                    'product-lines' => '产品线管理API',
                    'host-models' => '主机型号管理API',
                    'accessories' => '配件管理API',
                    'consumables' => '耗材管理API',
                    'spare-parts' => '零部件管理API',
                    'auth/login' => '用户认证API'
                )
            ));
            break;
    }
} catch (Exception $e) {
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode(array(
        'success' => false,
        'message' => '服务器内部错误: ' . $e->getMessage(),
        'code' => 500,
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ));
} 