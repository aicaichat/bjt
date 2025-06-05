<?php
/**
 * 上传控制器
 * 
 * 处理文件上传相关的API端点
 */

class BJT_Upload_Controller extends BJT_API_Controller {
    public $resource_name = 'upload';
    
    /**
     * 注册路由
     */
    public function register_routes() {
        // PDF规格说明书上传
        register_rest_route($this->namespace, '/' . $this->resource_name . '/specification', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'upload_specification'],
                'permission_callback' => [$this, 'check_upload_permission'],
                'args' => [
                    'host_id' => [
                        'required' => true,
                        'type' => 'integer',
                        'description' => '主机ID',
                        'validate_callback' => function($param) {
                            return is_numeric($param) && (int)$param > 0;
                        },
                    ],
                    'upload_dir' => [
                        'required' => false,
                        'type' => 'string',
                        'default' => 'frontend/public/uploads',
                        'description' => '上传目录',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
        ]);

        // 获取nonce（为了兼容传统AJAX调用）
        register_rest_route($this->namespace, '/' . $this->resource_name . '/nonce', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_upload_nonce'],
                'permission_callback' => [$this, 'check_auth'],
            ],
        ]);
    }
    
    /**
     * 上传PDF规格说明书
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function upload_specification($request) {
        error_log('[BJT Upload Controller] Starting PDF specification upload');
        
        // 获取参数
        $host_id = intval($request->get_param('host_id'));
        $upload_dir = $request->get_param('upload_dir') ?: 'frontend/public/uploads';
        
        error_log('[BJT Upload Controller] Upload parameters: host_id=' . $host_id . ', upload_dir=' . $upload_dir);
        
        // 验证host_id
        if (!$host_id) {
            error_log('[BJT Upload Controller] Invalid host_id');
            return $this->error_response('无效的主机ID', 'invalid_host_id', 400);
        }
        
        // 检查是否有文件上传
        $files = $request->get_file_params();
        if (empty($files['pdf_file'])) {
            error_log('[BJT Upload Controller] No PDF file in request');
            return $this->error_response('请选择要上传的PDF文件', 'no_file', 400);
        }
        
        $file = $files['pdf_file'];
        error_log('[BJT Upload Controller] File info: name=' . $file['name'] . ', size=' . $file['size'] . ', type=' . $file['type']);
        
        // 检查文件上传错误
        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log('[BJT Upload Controller] File upload error: ' . $file['error']);
            return $this->error_response(
                '文件上传失败: ' . $this->get_upload_error_message($file['error']),
                'upload_error',
                400
            );
        }
        
        // 验证文件类型
        $file_info = wp_check_filetype($file['name']);
        if ($file_info['ext'] !== 'pdf' || $file_info['type'] !== 'application/pdf') {
            error_log('[BJT Upload Controller] Invalid file type: ' . $file_info['type']);
            return $this->error_response('只能上传PDF文件', 'invalid_file_type', 400);
        }
        
        // 验证文件大小 (10MB)
        $max_size = 10 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            error_log('[BJT Upload Controller] File too large: ' . $file['size']);
            return $this->error_response('文件大小不能超过10MB', 'file_too_large', 400);
        }
        
        // 确定上传目录路径
        $upload_result = $this->prepare_upload_directory($upload_dir, $host_id);
        if (is_wp_error($upload_result)) {
            return $upload_result;
        }
        
        extract($upload_result); // $upload_path, $upload_url
        
        // 生成唯一文件名
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME));
        $unique_filename = $filename . '_' . time() . '.' . $file_extension;
        $full_path = $upload_path . '/' . $unique_filename;
        $file_url = $upload_url . '/' . $unique_filename;
        
        error_log('[BJT Upload Controller] Target path: ' . $full_path);
        
        // 移动上传的文件
        if (move_uploaded_file($file['tmp_name'], $full_path)) {
            error_log('[BJT Upload Controller] File uploaded successfully: ' . $full_path);
            
            // TODO: 将文件信息保存到数据库
            $this->save_specification_to_database($host_id, $file_url, $unique_filename);
            
            return $this->format_response([
                'url' => $file_url,
                'filename' => $unique_filename,
                'host_id' => $host_id,
                'file_size' => $file['size'],
                'upload_path' => $full_path,
            ], 'PDF规格说明书上传成功');
            
        } else {
            error_log('[BJT Upload Controller] Failed to move uploaded file');
            return $this->error_response('保存文件失败', 'save_failed', 500);
        }
    }
    
    /**
     * 获取上传用的nonce
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response 响应对象
     */
    public function get_upload_nonce($request) {
        $nonce = wp_create_nonce('bjt_upload_specification');
        
        return $this->format_response([
            'nonce' => $nonce,
            'action' => 'bjt_upload_specification',
            'user_id' => $this->get_current_user_id(),
        ], 'Nonce生成成功');
    }
    
    /**
     * 检查上传权限
     *
     * @param WP_REST_Request $request 请求对象
     * @return bool|WP_Error 是否有权限
     */
    public function check_upload_permission($request) {
        // 首先检查基础认证
        $auth_result = $this->check_auth($request);
        if (is_wp_error($auth_result)) {
            return $auth_result;
        }
        
        // 检查用户是否有上传文件的权限
        $current_user = $this->get_current_bjt_user();
        if (!$current_user) {
            error_log('[BJT Upload Controller] No authenticated user found');
            return $this->error_response('用户未认证', 'user_not_authenticated', 401);
        }
        
        // 检查用户角色权限
        $allowed_roles = ['admin', 'editor', 'manager'];
        if (!in_array($current_user->role, $allowed_roles)) {
            error_log('[BJT Upload Controller] User role not allowed for upload: ' . $current_user->role);
            return $this->error_response('权限不足，无法上传文件', 'insufficient_permissions', 403);
        }
        
        error_log('[BJT Upload Controller] Upload permission granted for user: ' . $current_user->username);
        return true;
    }
    
    /**
     * 认证检查（从auth controller复制）
     */
    public function check_auth($request = null) {
        // 从请求头获取Bearer Token
        $authorization_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if (empty($authorization_header) || !preg_match('/Bearer\s+(.*)$/i', $authorization_header, $matches)) {
            error_log('[BJT Upload Controller] No valid Authorization header found');
            return $this->error_response('未提供授权令牌', 'rest_not_logged_in', 401);
        }
        
        $token = $matches[1];
        error_log('[BJT Upload Controller] Validating token: ' . substr($token, 0, 20) . '...');
        
        try {
            // 使用JWT Handler验证令牌
            $jwt_handler = new BJT_JWT_Handler();
            $payload = $jwt_handler->validate_token($token);
            
            if (!$payload) {
                error_log('[BJT Upload Controller] Token validation failed - no payload returned');
                return $this->error_response('无效的令牌', 'invalid_token', 401);
            }
            
            error_log('[BJT Upload Controller] Token payload: ' . print_r($payload, true));
            
            // 尝试从不同的payload格式中获取用户ID
            $user_id = null;
            if (isset($payload->data->user_id)) {
                $user_id = $payload->data->user_id;
            } else if (isset($payload->user) && isset($payload->user->id)) {
                $user_id = $payload->user->id;
            } else if (isset($payload->user_id)) {
                $user_id = $payload->user_id;
            }
            
            if (!$user_id) {
                error_log('[BJT Upload Controller] No user ID found in token payload');
                return $this->error_response('令牌不包含有效的用户信息', 'invalid_token', 401);
            }
            
            error_log('[BJT Upload Controller] Found user ID in token: ' . $user_id);
            
            // 验证用户是否存在且活跃
            global $wpdb;
            $table_name = $wpdb->prefix . 'bjt_users';
            $user = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$table_name} WHERE id = %d AND status = 'active'",
                $user_id
            ));
            
            if (!$user) {
                error_log('[BJT Upload Controller] User not found or inactive: ' . $user_id);
                return $this->error_response('用户不存在或已被禁用', 'user_not_found', 401);
            }
            
            error_log('[BJT Upload Controller] User authenticated successfully: ' . $user->username . ' (Role: ' . $user->role . ')');
            
            // 将用户信息存储到全局变量中以便后续使用
            $GLOBALS['bjt_current_user'] = $user;
            
            return true;
            
        } catch (Exception $e) {
            error_log('[BJT Upload Controller] Authentication error: ' . $e->getMessage());
            return $this->error_response('认证过程中发生错误', 'authentication_error', 401);
        }
    }
    
    /**
     * 获取当前认证的BJT用户
     */
    private function get_current_bjt_user() {
        return isset($GLOBALS['bjt_current_user']) ? $GLOBALS['bjt_current_user'] : null;
    }
    
    /**
     * 获取当前用户ID
     */
    private function get_current_user_id() {
        $user = $this->get_current_bjt_user();
        return $user ? $user->id : 0;
    }
    
    /**
     * 准备上传目录
     *
     * @param string $upload_dir 基础上传目录
     * @param int $host_id 主机ID
     * @return array|WP_Error 目录信息或错误
     */
    private function prepare_upload_directory($upload_dir, $host_id) {
        if (strpos($upload_dir, '/') === 0) {
            // 绝对路径
            $base_dir = $upload_dir;
            $base_url = str_replace(ABSPATH, home_url('/'), $upload_dir);
        } else {
            // 相对路径（相对于WordPress根目录）
            $base_dir = ABSPATH . $upload_dir;
            $base_url = home_url($upload_dir);
        }
        
        $upload_path = $base_dir . '/specifications/' . $host_id;
        $upload_url = $base_url . '/specifications/' . $host_id;
        
        // 确保目录存在
        if (!file_exists($upload_path)) {
            if (!wp_mkdir_p($upload_path)) {
                error_log('[BJT Upload Controller] Failed to create directory: ' . $upload_path);
                return $this->error_response('无法创建上传目录', 'directory_creation_failed', 500);
            }
        }
        
        // 检查目录是否可写
        if (!is_writable($upload_path)) {
            error_log('[BJT Upload Controller] Directory not writable: ' . $upload_path);
            return $this->error_response('上传目录不可写', 'directory_not_writable', 500);
        }
        
        return [
            'upload_path' => $upload_path,
            'upload_url' => $upload_url,
        ];
    }
    
    /**
     * 将规格说明书信息保存到数据库
     *
     * @param int $host_id 主机ID
     * @param string $file_url 文件URL
     * @param string $filename 文件名
     */
    private function save_specification_to_database($host_id, $file_url, $filename) {
        global $wpdb;
        
        // 更新主机表中的规格说明书字段
        $table_name = $wpdb->prefix . 'bjt_host_part_numbers';
        $result = $wpdb->update(
            $table_name,
            [
                'specification_pdf' => $file_url,
                'updated_at' => current_time('mysql')
            ],
            ['id' => $host_id]
        );
        
        if ($result === false) {
            error_log('[BJT Upload Controller] Failed to update database: ' . $wpdb->last_error);
        } else {
            error_log('[BJT Upload Controller] Database updated successfully for host_id: ' . $host_id);
        }
    }
    
    /**
     * 获取文件上传错误信息
     *
     * @param int $error_code 错误代码
     * @return string 错误信息
     */
    private function get_upload_error_message($error_code) {
        switch ($error_code) {
            case UPLOAD_ERR_INI_SIZE:
                return '文件大小超过php.ini中upload_max_filesize的限制';
            case UPLOAD_ERR_FORM_SIZE:
                return '文件大小超过表单中MAX_FILE_SIZE的限制';
            case UPLOAD_ERR_PARTIAL:
                return '文件只有部分被上传';
            case UPLOAD_ERR_NO_FILE:
                return '没有文件被上传';
            case UPLOAD_ERR_NO_TMP_DIR:
                return '找不到临时文件夹';
            case UPLOAD_ERR_CANT_WRITE:
                return '文件写入失败';
            case UPLOAD_ERR_EXTENSION:
                return '文件上传被PHP扩展程序中断';
            default:
                return '未知上传错误';
        }
    }
} 