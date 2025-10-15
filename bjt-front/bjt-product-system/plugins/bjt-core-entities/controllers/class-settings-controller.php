<?php

class BJT_Settings_Controller extends BJT_API_Controller {
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'settings';

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [[
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_settings'],
            'permission_callback' => [$this, 'check_read_permission'],
        ], [
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => [$this, 'update_settings'],
            'permission_callback' => [$this, 'check_write_permission'],
            'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
        ]]);
        
        // 添加测试端点
        register_rest_route($this->namespace, '/' . $this->rest_base . '/test', [[
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'test_settings'],
            'permission_callback' => '__return_true', // 公开访问用于测试
        ]]);
    }

    /**
     * 获取系统设置
     */
    public function get_settings($request) {
        try {
            global $wpdb;
            
            // 尝试从数据库获取设置
            $settings_table = $wpdb->prefix . 'bjt_settings';
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT option_value FROM {$settings_table} WHERE option_key = %s",
                'system'
            ));
            
            $settings = [];
            if ($row && !empty($row->option_value)) {
                $decoded = json_decode($row->option_value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $settings = $decoded;
                }
            }
            
            // 如果数据库中没有设置，返回默认设置
            if (empty($settings)) {
                $settings = $this->get_default_settings();
            }
            
            return $this->format_response($settings, 'Settings retrieved successfully');
            
        } catch (Exception $e) {
            error_log('BJT Settings Controller - Get settings error: ' . $e->getMessage());
            return $this->format_error_response(
                'Failed to retrieve settings: ' . $e->getMessage(),
                'settings_get_failed',
                500
            );
        }
    }

    /**
     * 更新系统设置
     */
    public function update_settings($request) {
        try {
            global $wpdb;
            
            $params = $request->get_json_params();
            
            if (empty($params)) {
                return $this->format_error_response(
                    'No settings data provided',
                    'missing_settings_data',
                    400
                );
            }
            
            // 验证设置数据
            $validated_settings = $this->validate_settings($params);
            if (is_wp_error($validated_settings)) {
                return $this->format_error_response(
                    $validated_settings->get_error_message(),
                    'settings_validation_failed',
                    400
                );
            }
            
            // 转换为JSON字符串
            $settings_json = json_encode($validated_settings, JSON_UNESCAPED_UNICODE);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->format_error_response(
                    'Failed to encode settings data',
                    'json_encode_failed',
                    500
                );
            }
            
            // 保存到数据库
            $settings_table = $wpdb->prefix . 'bjt_settings';
            
            // 检查表是否存在，如果不存在则创建
            $this->ensure_settings_table_exists();
            
            // 检查是否已存在记录
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$settings_table} WHERE option_key = %s",
                'system'
            ));
            
            if ($exists > 0) {
                // 更新现有记录
                $result = $wpdb->update(
                    $settings_table,
                    [
                        'option_value' => $settings_json,
                        'updated_at' => current_time('mysql')
                    ],
                    ['option_key' => 'system'],
                    ['%s', '%s'],
                    ['%s']
                );
            } else {
                // 插入新记录
                $result = $wpdb->insert(
                    $settings_table,
                    [
                        'option_key' => 'system',
                        'option_value' => $settings_json,
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql')
                    ],
                    ['%s', '%s', '%s', '%s']
                );
            }
            
            if ($result === false) {
                return $this->format_error_response(
                    'Failed to save settings to database: ' . $wpdb->last_error,
                    'database_save_failed',
                    500
                );
            }
            
            return $this->format_response($validated_settings, 'Settings updated successfully');
            
        } catch (Exception $e) {
            error_log('BJT Settings Controller - Update settings error: ' . $e->getMessage());
            return $this->format_error_response(
                'Failed to update settings: ' . $e->getMessage(),
                'settings_update_failed',
                500
            );
        }
    }

    /**
     * 获取默认设置
     */
    private function get_default_settings() {
        return [
            // 基础信息
            'company_name' => 'BJT Technology',
            'contact_info' => 'contact@bjt.com',
            'logo_url' => '/images/logo-1.webp',
            
            // 系统设置
            'default_language' => 'zh',
            'theme' => 'default',
            'timezone' => 'Asia/Shanghai',
            'date_format' => 'YYYY-MM-DD',
            
            // 邮件设置
            'smtp_host' => '',
            'smtp_port' => 587,
            'smtp_username' => '',
            'smtp_password' => '',
            'smtp_encryption' => 'tls',
            'mail_from_address' => '',
            'mail_from_name' => 'BJT System',
            
            // API设置
            'payment_api' => '',
            'logistics_api' => '',
            'inventory_api' => '',
            
            // 安全设置
            'session_timeout' => 3600,
            'password_policy' => [
                'min_length' => 8,
                'require_uppercase' => true,
                'require_lowercase' => true,
                'require_numbers' => true,
                'require_symbols' => false
            ],
            'login_attempts' => 5,
            'lockout_duration' => 900
        ];
    }

    /**
     * 验证设置数据
     */
    private function validate_settings($settings) {
        $default_settings = $this->get_default_settings();
        $validated = [];
        
        // 基础信息验证
        $validated['company_name'] = sanitize_text_field($settings['company_name'] ?? $default_settings['company_name']);
        $validated['contact_info'] = sanitize_email($settings['contact_info'] ?? $default_settings['contact_info']);
        $validated['logo_url'] = esc_url_raw($settings['logo_url'] ?? $default_settings['logo_url']);
        
        // 系统设置验证
        $validated['default_language'] = in_array($settings['default_language'] ?? '', ['zh', 'en']) 
            ? $settings['default_language'] 
            : $default_settings['default_language'];
        $validated['theme'] = sanitize_text_field($settings['theme'] ?? $default_settings['theme']);
        $validated['timezone'] = sanitize_text_field($settings['timezone'] ?? $default_settings['timezone']);
        $validated['date_format'] = sanitize_text_field($settings['date_format'] ?? $default_settings['date_format']);
        
        // 邮件设置验证
        $validated['smtp_host'] = sanitize_text_field($settings['smtp_host'] ?? $default_settings['smtp_host']);
        $validated['smtp_port'] = intval($settings['smtp_port'] ?? $default_settings['smtp_port']);
        $validated['smtp_username'] = sanitize_text_field($settings['smtp_username'] ?? $default_settings['smtp_username']);
        $validated['smtp_password'] = $settings['smtp_password'] ?? $default_settings['smtp_password']; // 不清洗密码
        $validated['smtp_encryption'] = in_array($settings['smtp_encryption'] ?? '', ['none', 'ssl', 'tls']) 
            ? $settings['smtp_encryption'] 
            : $default_settings['smtp_encryption'];
        $validated['mail_from_address'] = sanitize_email($settings['mail_from_address'] ?? $default_settings['mail_from_address']);
        $validated['mail_from_name'] = sanitize_text_field($settings['mail_from_name'] ?? $default_settings['mail_from_name']);
        
        // API设置验证
        $validated['payment_api'] = esc_url_raw($settings['payment_api'] ?? $default_settings['payment_api']);
        $validated['logistics_api'] = esc_url_raw($settings['logistics_api'] ?? $default_settings['logistics_api']);
        $validated['inventory_api'] = esc_url_raw($settings['inventory_api'] ?? $default_settings['inventory_api']);
        
        // 安全设置验证
        $validated['session_timeout'] = max(300, intval($settings['session_timeout'] ?? $default_settings['session_timeout'])); // 最少5分钟
        $validated['login_attempts'] = max(3, intval($settings['login_attempts'] ?? $default_settings['login_attempts'])); // 最少3次
        $validated['lockout_duration'] = max(300, intval($settings['lockout_duration'] ?? $default_settings['lockout_duration'])); // 最少5分钟
        
        // 密码策略验证
        $password_policy = $settings['password_policy'] ?? $default_settings['password_policy'];
        $validated['password_policy'] = [
            'min_length' => max(6, intval($password_policy['min_length'] ?? 8)),
            'require_uppercase' => (bool)($password_policy['require_uppercase'] ?? true),
            'require_lowercase' => (bool)($password_policy['require_lowercase'] ?? true),
            'require_numbers' => (bool)($password_policy['require_numbers'] ?? true),
            'require_symbols' => (bool)($password_policy['require_symbols'] ?? false)
        ];
        
        return $validated;
    }

    /**
     * 确保设置表存在
     */
    private function ensure_settings_table_exists() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_settings';
        
        // 检查表是否存在
        $table_exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table_name
        )) === $table_name;
        
        if (!$table_exists) {
            // 创建设置表
            $charset_collate = $wpdb->get_charset_collate();
            
            $sql = "CREATE TABLE {$table_name} (
                id int(11) NOT NULL AUTO_INCREMENT,
                option_key varchar(100) NOT NULL,
                option_value longtext NOT NULL,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_option_key (option_key)
            ) {$charset_collate};";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
    }

    /**
     * 测试设置端点
     */
    public function test_settings($request) {
        return $this->format_response([
            'status' => 'ok',
            'message' => 'Settings API is working correctly',
            'endpoints' => [
                'GET /wp-json/bjt/v1/settings' => 'Get system settings',
                'PUT /wp-json/bjt/v1/settings' => 'Update system settings', 
                'GET /wp-json/bjt/v1/settings/test' => 'Test endpoint (current)'
            ],
            'timestamp' => current_time('mysql')
        ], 'Settings API test successful');
    }

    /**
     * 检查读取权限
     */
    public function check_read_permission($request) {
        // 暂时允许所有人读取设置用于测试
        return true;
        // 正式环境应该使用: return is_user_logged_in();
    }

    /**
     * 检查写入权限
     */
    public function check_write_permission($request) {
        // 仅管理员可写入设置
        return current_user_can('manage_options');
    }

    /**
     * 获取端点参数架构
     */
    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $args = [];
        
        if ($method === WP_REST_Server::EDITABLE) {
            $args = [
                'company_name' => [
                    'description' => 'Company name',
                    'type' => 'string',
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'contact_info' => [
                    'description' => 'Contact information',
                    'type' => 'string',
                    'required' => false,
                    'sanitize_callback' => 'sanitize_email',
                ],
                'default_language' => [
                    'description' => 'Default language',
                    'type' => 'string',
                    'enum' => ['zh', 'en'],
                    'required' => false,
                ],
                // 更多参数可以在这里添加...
            ];
        }
        
        return $args;
    }
} 