<?php
/**
 * Plugin Name: Fix WordPress Internal Error
 * Description: 修复WordPress内部错误并确保REST API正常工作
 * Version: 1.0.0
 * Author: BJT Team
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 确保REST API返回JSON而不是HTML错误页面
function fix_wordpress_rest_api() {
    // 只处理REST API请求
    if (strpos($_SERVER['REQUEST_URI'], '/wp-json/') === false) {
        return;
    }
    
    // 捕获并处理所有错误
    register_shutdown_function(function() {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            // 清除所有已输出的内容
            if (ob_get_level() > 0) {
                while (ob_get_level() > 0) {
                    ob_end_clean();
                }
            }
            
            // 设置正确的头部
            header('Content-Type: application/json; charset=UTF-8');
            header('HTTP/1.1 500 Internal Server Error');
            
            // 返回JSON格式的错误信息
            $response = [
                'success' => false,
                'message' => 'WordPress内部错误',
                'error' => [
                    'type' => $error['type'],
                    'message' => $error['message'],
                    'file' => basename($error['file']),
                    'line' => $error['line']
                ],
                'debug' => defined('WP_DEBUG') && WP_DEBUG ? true : false
            ];
            
            echo json_encode($response, JSON_PRETTY_PRINT);
            exit;
        }
    });
    
    // 设置错误处理函数以捕获警告和提示
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        // 记录错误但不中断执行
        error_log("REST API错误：[$errno] $errstr in $errfile on line $errline");
        return true; // 继续执行脚本
    }, E_WARNING | E_NOTICE | E_DEPRECATED);
    
    // 设置异常处理函数
    set_exception_handler(function($exception) {
        // 清除已输出的内容
        if (ob_get_level() > 0) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
        }
        
        // 设置正确的头部
        header('Content-Type: application/json; charset=UTF-8');
        header('HTTP/1.1 500 Internal Server Error');
        
        // 返回JSON格式的异常信息
        $response = [
            'success' => false,
            'message' => '异常',
            'error' => [
                'type' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => basename($exception->getFile()),
                'line' => $exception->getLine()
            ],
            'debug' => defined('WP_DEBUG') && WP_DEBUG ? true : false
        ];
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    });
}

// 尽早执行修复代码，以捕获初始化阶段的错误
add_action('muplugins_loaded', 'fix_wordpress_rest_api', -1000);

// 添加API调试路由
function add_api_debug_route() {
    register_rest_route('bjt-debug/v1', '/test', [
        'methods' => 'GET',
        'callback' => function() {
            return [
                'success' => true,
                'message' => 'BJT API调试路由正常工作',
                'time' => current_time('mysql'),
                'info' => [
                    'php_version' => PHP_VERSION,
                    'wp_version' => get_bloginfo('version'),
                    'rest_url' => rest_url(),
                    'rest_namespace' => 'bjt/v1',
                    'debug_mode' => defined('WP_DEBUG') && WP_DEBUG
                ]
            ];
        },
        'permission_callback' => '__return_true'
    ]);
}
add_action('rest_api_init', 'add_api_debug_route');

// 添加一个测试动作，生成模拟数据用于测试
function add_api_mock_data() {
    register_rest_route('bjt/v1', '/mock-data', [
        'methods' => 'GET',
        'callback' => function($request) {
            return [
                'success' => true,
                'data' => [
                    'product_lines' => [
                        [
                            'id' => 'LINE-001',
                            'code' => 'LP',
                            'name_cn' => '气垫机产品线',
                            'name_en' => 'Air Cushion Machine Line',
                            'description_cn' => '气垫机产品线描述',
                            'description_en' => 'Air Cushion Machine Line Description',
                            'status' => 'active'
                        ],
                        [
                            'id' => 'LINE-002',
                            'code' => 'BP',
                            'name_cn' => '包装机产品线',
                            'name_en' => 'Packaging Machine Line',
                            'description_cn' => '包装机产品线描述',
                            'description_en' => 'Packaging Machine Line Description',
                            'status' => 'active'
                        ]
                    ],
                    'machines' => [
                        [
                            'id' => 'MEY-001',
                            'model' => 'MEY',
                            'name' => '气垫机 Pro - MEY系列',
                            'subtitle' => '高效气泡缓冲包装解决方案',
                            'description' => '产品描述...',
                            'image_url' => '/images/shop/MEY.jpg',
                            'specs' => [
                                '电压' => '220V/110V',
                                '功率' => '250W',
                                '尺寸' => '560 x 350 x 334 mm',
                                '重量' => '13.5 kg'
                            ],
                            'inventory' => [
                                ['region' => 'CN', 'amount' => 245],
                                ['region' => 'EU', 'amount' => 78],
                                ['region' => 'NA', 'amount' => 120],
                                ['region' => 'AU', 'amount' => 46]
                            ],
                            'prices' => [
                                'base' => 12800,
                                'tier1' => 12000,
                                'tier2' => 11500,
                                'vip' => 11000
                            ]
                        ]
                    ],
                    'accessories' => [
                        [
                            'id' => 'FS-001',
                            'model' => 'Floor Stand',
                            'title' => '地面支架组件',
                            'level' => 1,
                            'image_url' => '/images/shop/FS-001.jpg',
                            'parts' => [
                                [
                                    'id' => 'BJT-FS-V2-2024',
                                    'part_number' => 'BJT-FS-V2-2024',
                                    'title' => '标准地面支架',
                                    'specs' => [
                                        '电压' => 'N/A',
                                        '频率' => 'N/A',
                                        '托盘尺寸' => '90×70×120cm',
                                        '一托数量' => '16件'
                                    ],
                                    'spec' => '90×70×120cm, 7.8kg',
                                    'spec_imperial' => '35.4×27.6×47.2inch, 17.2lbs',
                                    'prices' => [
                                        'base' => 85,
                                        'tier1' => 75,
                                        'tier2' => 65,
                                        'vip' => 55
                                    ],
                                    'inventory' => [
                                        ['region' => 'CN', 'amount' => 156],
                                        ['region' => 'EU', 'amount' => 16],
                                        ['region' => 'NA', 'amount' => 24],
                                        ['region' => 'AU', 'amount' => 12]
                                    ]
                                ]
                            ]
                        ]
                    ],
                    'consumables' => [
                        [
                            'id' => 'ACF-350',
                            'product_line_id' => 'LINE-001',
                            'product_id' => 'BJT-CONS-001',
                            'model' => 'LP-V1',
                            'brand' => 'BJT',
                            'part_number' => 'BJT-CONS-001-2024',
                            'specifications' => [
                                'material' => 'HDPE',
                                'pak_shape' => 'roll',
                                'thickness' => [
                                    'metric' => '25um',
                                    'imperial' => '1mil'
                                ],
                                'dimensions' => [
                                    'width' => [
                                        'metric' => '100cm',
                                        'imperial' => '39.4inch'
                                    ],
                                    'length' => [
                                        'metric' => '200m',
                                        'imperial' => '656ft'
                                    ]
                                ]
                            ],
                            'compatibility' => [
                                'machines' => ['LP-V1', 'LP-V2'],
                                'accessories' => ['ACC-001']
                            ],
                            'pricing' => [
                                [
                                    'range' => '1-4',
                                    'prices' => [
                                        'CN' => 100,
                                        'EU' => 15,
                                        'NA' => 16,
                                        'AU' => 20
                                    ]
                                ]
                            ],
                            'inventory' => [
                                'CN' => 1000,
                                'EU' => 500,
                                'NA' => 800,
                                'AU' => 300
                            ]
                        ]
                    ]
                ],
                'pagination' => [
                    'total' => 1,
                    'page' => 1,
                    'page_size' => 10,
                    'total_pages' => 1
                ]
            ];
        },
        'permission_callback' => '__return_true'
    ]);
    
    // 添加授权路由
    register_rest_route('bjt/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => function($request) {
            $data = $request->get_json_params();
            $username = isset($data['username']) ? $data['username'] : '';
            $password = isset($data['password']) ? $data['password'] : '';
            
            // 简单模拟登录验证，实际应用应该验证WordPress用户
            if ($username && $password) {
                return [
                    'success' => true,
                    'data' => [
                        'token' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA',
                        'expires_in' => 86400,
                        'user' => [
                            'id' => 1,
                            'username' => $username,
                            'email' => $username . '@example.com',
                            'name' => 'Test User',
                            'role' => 'SALES',
                            'region' => 'CN',
                            'vipLevel' => 2,
                            'type' => 'vip'
                        ]
                    ]
                ];
            }
            
            return [
                'success' => false,
                'message' => '用户名或密码错误',
                'code' => 1001
            ];
        },
        'permission_callback' => '__return_true'
    ]);
    
    // 添加获取用户信息路由
    register_rest_route('bjt/v1', '/auth/me', [
        'methods' => 'GET',
        'callback' => function($request) {
            return [
                'success' => true,
                'data' => [
                    'id' => 1,
                    'username' => 'demo',
                    'email' => 'demo@example.com',
                    'name' => 'Demo User',
                    'role' => 'SALES',
                    'region' => 'CN',
                    'vipLevel' => 2,
                    'type' => 'vip',
                    'permissions' => [
                        'view_prices',
                        'view_inventory',
                        'add_to_cart'
                    ]
                ]
            ];
        },
        'permission_callback' => '__return_true'
    ]);
}
add_action('rest_api_init', 'add_api_mock_data'); 