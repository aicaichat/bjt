<?php
/**
 * Plugin Name: BJT Product API
 * Description: Custom REST API endpoints for BJT Product Management System
 * Version: 1.0.0
 * Author: BJT Team
 * Text Domain: bjt-product-api
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('BJT_PRODUCT_API_VERSION', '1.0.0');
define('BJT_PRODUCT_API_DIR', plugin_dir_path(__FILE__));
define('BJT_PRODUCT_API_URL', plugin_dir_url(__FILE__));

// Include required files
require_once BJT_PRODUCT_API_DIR . 'includes/class-bjt-model-data.php';

class BJT_Product_API {
    /**
     * The model data instance
     * 
     * @var BJT_Model_Data
     */
    protected $model;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Initialize the model
        $this->model = new BJT_Model_Data();
        
        // Register REST API routes
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }
    
    /**
     * Register all the REST API routes
     */
    public function register_rest_routes() {
        $namespace = 'bjt/v1';
        
        // 认证接口 (Authentication endpoints)
        register_rest_route($namespace, '/auth/login', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_login'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route($namespace, '/auth/me', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_current_user'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/auth/refresh', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_refresh_token'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route($namespace, '/auth/logout', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_logout'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        // 设备选型 (Machines endpoints)
        register_rest_route($namespace, '/machines', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_machines'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
                'page' => [
                    'required' => false,
                    'default' => 1,
                ],
                'page_size' => [
                    'required' => false,
                    'default' => 10,
                ],
                'category' => [
                    'required' => false,
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/machines/(?P<machine_id>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_machine'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/machines/(?P<machine_id>[a-zA-Z0-9-]+)/accessories', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_machine_accessories'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'level' => [
                    'required' => false,
                    'default' => 1,
                ],
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
            ],
        ]);
        
        // 配件 (Accessories endpoints)
        register_rest_route($namespace, '/accessories/(?P<accessory_id>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_accessory'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/accessories/(?P<accessory_id>[a-zA-Z0-9-]+)/children', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_accessory_children'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/accessories/(?P<accessory_id>[a-zA-Z0-9-]+)/required', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_accessory_required_parts'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        // 耗材 (Consumables endpoints)
        register_rest_route($namespace, '/product-lines/(?P<product_line_id>[a-zA-Z0-9-]+)/consumables', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_consumables'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'region' => [
                    'required' => false,
                    'default' => $this->get_default_region(),
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
                'page' => [
                    'required' => false,
                    'default' => 1,
                ],
                'page_size' => [
                    'required' => false,
                    'default' => 10,
                ],
                'filters' => [
                    'required' => false,
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/consumables/prices/batch', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_batch_consumable_prices'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/consumables/inventory/batch', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_batch_consumable_inventory'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/consumables/(?P<consumable_id>[a-zA-Z0-9-]+)/compatibility-check', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_check_consumable_compatibility'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'model' => [
                    'required' => true,
                ],
            ],
        ]);
        
        // 产品线 (Product Lines endpoints)
        register_rest_route($namespace, '/product-lines', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_product_lines'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/product-lines/(?P<id>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_product_line'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        // 数据字典 (Dictionary endpoints)
        register_rest_route($namespace, '/dictionary/(?P<type>[a-zA-Z0-9_-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_dictionary'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'lang' => [
                    'required' => false,
                    'default' => 'zh',
                ],
            ],
        ]);
        
        // 购物车 (Cart endpoints)
        register_rest_route($namespace, '/cart', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_cart'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/cart/add', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_add_to_cart'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/cart/update', [
            'methods' => 'PUT',
            'callback' => [$this, 'handle_update_cart'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/cart/clear', [
            'methods' => 'DELETE',
            'callback' => [$this, 'handle_clear_cart'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        // 订单 (Orders endpoints)
        register_rest_route($namespace, '/orders', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_orders'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'page' => [
                    'required' => false,
                    'default' => 1,
                ],
                'page_size' => [
                    'required' => false,
                    'default' => 10,
                ],
                'status' => [
                    'required' => false,
                ],
            ],
        ]);
        
        register_rest_route($namespace, '/orders', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_create_order'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        register_rest_route($namespace, '/orders/(?P<order_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handle_get_order'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
    }
    
    /**
     * Check if user is authenticated
     * 
     * @param WP_REST_Request $request
     * @return bool
     */
    public function check_authentication($request) {
        // This is a simple implementation, you may want to enhance this
        // with JWT token validation or other authentication methods
        return is_user_logged_in();
    }
    
    /**
     * Get default region based on current user
     * 
     * @return string
     */
    public function get_default_region() {
        // Get user's region from user meta if logged in, otherwise return default
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $region = get_user_meta($user_id, 'region', true);
            return !empty($region) ? $region : 'CN';
        }
        
        return 'CN';
    }
    
    /**
     * Generate standard response format
     * 
     * @param mixed $data
     * @param bool $success
     * @param string $message
     * @param int $code
     * @return array
     */
    protected function format_response($data = null, $success = true, $message = '', $code = null) {
        $response = [
            'success' => $success,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($message)) {
            $response['message'] = $message;
        }
        
        if ($code !== null && !$success) {
            $response['code'] = $code;
        }
        
        return $response;
    }
    
    /**
     * Handle login request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_login($request) {
        $username = $request->get_param('username');
        $password = $request->get_param('password');
        
        if (empty($username) || empty($password)) {
            return new WP_REST_Response(
                $this->format_response(null, false, '用户名或密码不能为空', 1001),
                400
            );
        }
        
        $user = wp_authenticate($username, $password);
        
        if (is_wp_error($user)) {
            return new WP_REST_Response(
                $this->format_response(null, false, '用户名或密码错误', 1001),
                401
            );
        }
        
        // Generate a JWT token or use WP's auth cookie
        $token = $this->generate_auth_token($user);
        
        // Get user data
        $user_data = $this->get_user_data($user);
        
        return new WP_REST_Response(
            $this->format_response([
                'token' => $token,
                'expires_in' => 86400, // 24 hours
                'user' => $user_data,
            ]),
            200
        );
    }
    
    /**
     * Handle get current user request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_get_current_user($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);
        
        if (!$user) {
            return new WP_REST_Response(
                $this->format_response(null, false, '未授权访问', 1002),
                401
            );
        }
        
        $user_data = $this->get_user_data($user);
        
        // Add user permissions
        $user_data['permissions'] = $this->get_user_permissions($user);
        
        return new WP_REST_Response(
            $this->format_response($user_data),
            200
        );
    }
    
    /**
     * Handle token refresh request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_refresh_token($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return new WP_REST_Response(
                $this->format_response(null, false, '未提供有效的认证令牌'),
                401
            );
        }

        $token = $matches[1];
        
        try {
            // 验证当前token
            $decoded = JWT::decode($token, $this->get_jwt_secret(), array('HS256'));
            
            // 检查token是否即将过期（比如还有不到1小时）
            $exp = $decoded->exp;
            $now = time();
            
            // 检查token是否已经过期
            if ($exp < $now) {
                return new WP_REST_Response(
                    $this->format_response(null, false, '令牌已过期'),
                    401
                );
            }
            
            // 如果token还有超过1小时的有效期，直接返回当前token
            if ($exp - $now > 3600) {
                return new WP_REST_Response(
                    $this->format_response([
                        'token' => $token,
                        'expires_in' => $exp - $now
                    ]),
                    200
                );
            }
            
            // 获取用户信息
            $user_id = $decoded->data->user_id;
            $user = get_user_by('id', $user_id);
            
            if (!$user) {
                return new WP_REST_Response(
                    $this->format_response(null, false, '用户不存在'),
                    401
                );
            }
            
            // 生成新token
            $new_token = $this->generate_jwt_token($user);
            
            // 验证新token
            try {
                $new_decoded = JWT::decode($new_token, $this->get_jwt_secret(), array('HS256'));
                if (!$new_decoded || !isset($new_decoded->exp) || $new_decoded->exp <= $now) {
                    throw new Exception('Invalid new token');
                }
            } catch (Exception $e) {
                return new WP_REST_Response(
                    $this->format_response(null, false, '生成新令牌失败'),
                    500
                );
            }
            
            return new WP_REST_Response(
                $this->format_response([
                    'token' => $new_token,
                    'expires_in' => 86400 // 24小时
                ]),
                200
            );
        } catch (Exception $e) {
            error_log('Token refresh error: ' . $e->getMessage());
            return new WP_REST_Response(
                $this->format_response(null, false, '令牌无效或已过期'),
                401
            );
        }
    }
    
    /**
     * Handle logout request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_logout($request) {
        // Implement logout logic here
        // This would typically invalidate the user's token
        
        return new WP_REST_Response(
            $this->format_response(null, true, '已成功退出'),
            200
        );
    }
    
    /**
     * Handle get machines request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_get_machines($request) {
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        $page = (int)$request->get_param('page');
        $page_size = (int)$request->get_param('page_size');
        $category = $request->get_param('category');
        
        // Get machines from the model
        $machines = $this->model->get_machines($region, $lang, $page, $page_size, $category);
        
        return new WP_REST_Response(
            $this->format_response($machines),
            200
        );
    }
    
    /**
     * Handle get machine request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_get_machine($request) {
        $machine_id = $request->get_param('machine_id');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // Get machine from the model
        $machine = $this->model->get_machine($machine_id, $region, $lang);
        
        if (!$machine) {
            return new WP_REST_Response(
                $this->format_response(null, false, '找不到指定的设备', 2001),
                404
            );
        }
        
        return new WP_REST_Response(
            $this->format_response($machine),
            200
        );
    }
    
    /**
     * Handle get machine accessories request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_get_machine_accessories($request) {
        $machine_id = $request->get_param('machine_id');
        $level = (int)$request->get_param('level');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // Get machine accessories from the model
        $accessories = $this->model->get_machine_accessories($machine_id, $level, $region, $lang);
        
        return new WP_REST_Response(
            $this->format_response($accessories),
            200
        );
    }
    
    /**
     * Handle get accessory request
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_get_accessory($request) {
        $accessory_id = $request->get_param('accessory_id');
        $region = $request->get_param('region');
        $lang = $request->get_param('lang');
        
        // Get accessory from the model
        $accessory = $this->model->get_accessory($accessory_id, $region, $lang);
        
        if (!$accessory) {
            return new WP_REST_Response(
                $this->format_response(null, false, '找不到指定的配件', 3001),
                404
            );
        }
        
        return new WP_REST_Response(
            $this->format_response($accessory),
            200
        );
    }
    
    /**
     * Helper function to generate an authentication token
     * 
     * @param WP_User $user
     * @return string
     */
    private function generate_auth_token($user) {
        // In a real implementation, you would use JWT or another token system
        // This is a simplified example
        return md5($user->ID . time() . wp_generate_password(16, true, true));
    }
    
    /**
     * Helper function to get user data
     * 
     * @param WP_User $user
     * @return array
     */
    private function get_user_data($user) {
        return [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => $this->get_user_role($user),
            'region' => get_user_meta($user->ID, 'region', true) ?: 'CN',
            'vipLevel' => (int)get_user_meta($user->ID, 'vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'user_type', true) ?: 'standard',
        ];
    }
    
    /**
     * Helper function to get user's primary role
     * 
     * @param WP_User $user
     * @return string
     */
    private function get_user_role($user) {
        if (!empty($user->roles) && is_array($user->roles)) {
            return $user->roles[0];
        }
        
        return '';
    }
    
    /**
     * Helper function to get user permissions
     * 
     * @param WP_User $user
     * @return array
     */
    private function get_user_permissions($user) {
        $permissions = [];
        
        // Add permissions based on user role or capabilities
        if (user_can($user, 'edit_posts')) {
            $permissions[] = 'view_prices';
            $permissions[] = 'view_inventory';
        }
        
        if (user_can($user, 'publish_posts')) {
            $permissions[] = 'add_to_cart';
        }
        
        return $permissions;
    }
}

// Activation and deactivation hooks
register_activation_hook(__FILE__, 'bjt_product_api_activate');
register_deactivation_hook(__FILE__, 'bjt_product_api_deactivate');

/**
 * Activation function
 */
function bjt_product_api_activate() {
    // Create required database tables
    BJT_Model_Data::create_tables();
    
    // Flush rewrite rules
    flush_rewrite_rules();
}

/**
 * Deactivation function
 */
function bjt_product_api_deactivate() {
    // Clean up on deactivation
    flush_rewrite_rules();
}

// Initialize the plugin
new BJT_Product_API(); 