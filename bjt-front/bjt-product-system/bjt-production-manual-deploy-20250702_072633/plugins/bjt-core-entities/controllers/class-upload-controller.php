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
                'permission_callback' => [$this, 'check_write_permission'],
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

        // 图片上传端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/image', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'upload_image'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'upload_dir' => [
                        'required' => false,
                        'type' => 'string',
                        'default' => 'uploads/machines/images',
                        'description' => '上传目录',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
        ]);

        // 通用文件上传端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/file', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'upload_file'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'upload_dir' => [
                        'required' => false,
                        'type' => 'string',
                        'default' => 'uploads',
                        'description' => '上传目录',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ],
        ]);

        // 获取nonce（为了兼容传统AJAX调用）- 无需认证
        register_rest_route($this->namespace, '/' . $this->resource_name . '/nonce', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_upload_nonce'],
                'permission_callback' => '__return_true', // 无需认证
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
        ], 'Nonce生成成功');
    }
    
    /**
     * 检查上传权限
     */
    public function check_write_permission($request) {
        error_log('[BJT_Upload_Controller] Checking upload permission');
        
        // Using BJT Auth Controller instead of custom auth logic
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Upload_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Upload_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Upload_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Upload_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Upload_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Upload_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin, manager, editor可以上传文件
        $has_upload_permission = false;
        if (isset($user->role)) {
            $allowed_upload_roles = ['admin', 'manager', 'editor'];
            $has_upload_permission = in_array($user->role, $allowed_upload_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_upload_permission = $has_upload_permission || 
                                     in_array('upload_files', $user->permissions) || 
                                     in_array('manage_files', $user->permissions);
        }

        if (!$has_upload_permission) {
            error_log('[BJT_Upload_Controller] User does not have upload permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to upload files.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Upload_Controller] Upload permission granted for user: ' . $user->username);
        return true;
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
            $base_url = str_replace(ABSPATH, '/', $upload_dir);
        } else {
            // 相对路径（相对于WordPress根目录）
            $base_dir = ABSPATH . $upload_dir;
            $base_url = '/' . $upload_dir;
        }
        
        $upload_path = $base_dir . '/specifications/' . $host_id;
        $upload_url = $base_url . '/specifications/' . $host_id;
        
        error_log('[BJT Upload Controller] PDF upload directory: ' . $upload_path);
        error_log('[BJT Upload Controller] PDF URL path: ' . $upload_url);
        
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
    
    /**
     * 上传图片文件
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function upload_image($request) {
        error_log('[BJT Upload Controller] Starting image upload');
        
        // 获取参数
        $upload_dir = $request->get_param('upload_dir') ?: 'uploads/machines/images';
        
        error_log('[BJT Upload Controller] Image upload parameters: upload_dir=' . $upload_dir);
        
        // 检查是否有文件上传
        $files = $request->get_file_params();
        $file = null;
        
        // 尝试不同的文件字段名
        if (!empty($files['image_file'])) {
            $file = $files['image_file'];
        } elseif (!empty($files['file'])) {
            $file = $files['file'];
        } else {
            error_log('[BJT Upload Controller] No image file in request. Available files: ' . implode(', ', array_keys($files)));
            return $this->error_response('请选择要上传的图片文件', 'no_file', 400);
        }
        
        error_log('[BJT Upload Controller] Image file info: name=' . $file['name'] . ', size=' . $file['size'] . ', type=' . $file['type']);
        
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
        $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($file_info['ext'], $allowed_types)) {
            error_log('[BJT Upload Controller] Invalid image type: ' . $file_info['type']);
            return $this->error_response('只能上传 JPG, PNG, GIF, WebP 格式的图片', 'invalid_file_type', 400);
        }
        
        // 验证文件大小 (5MB)
        $max_size = 5 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            error_log('[BJT Upload Controller] Image too large: ' . $file['size']);
            return $this->error_response('图片大小不能超过5MB', 'file_too_large', 400);
        }
        
        // 确定上传目录路径
        $upload_result = $this->prepare_generic_upload_directory($upload_dir);
        if (is_wp_error($upload_result)) {
            return $upload_result;
        }
        
        extract($upload_result); // $upload_path, $upload_url
        
        // 生成唯一文件名
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME));
        $timestamp = time();
        $random = substr(md5(mt_rand()), 0, 6);
        $unique_filename = $timestamp . '_' . $random . '.' . $file_extension;
        $full_path = $upload_path . '/' . $unique_filename;
        $file_url = $upload_url . '/' . $unique_filename;
        
        error_log('[BJT Upload Controller] Image target path: ' . $full_path);
        
        // 移动上传的文件
        if (move_uploaded_file($file['tmp_name'], $full_path)) {
            error_log('[BJT Upload Controller] Image uploaded successfully: ' . $full_path);
            
            return $this->format_response([
                'url' => $file_url,
                'filename' => $unique_filename,
                'file_size' => $file['size'],
                'upload_path' => $full_path,
                'file_type' => 'image',
            ], '图片上传成功');
            
        } else {
            error_log('[BJT Upload Controller] Failed to move uploaded image');
            return $this->error_response('保存图片失败', 'save_failed', 500);
        }
    }
    
    /**
     * 通用文件上传
     *
     * @param WP_REST_Request $request 请求对象
     * @return WP_REST_Response|WP_Error 响应对象
     */
    public function upload_file($request) {
        error_log('[BJT Upload Controller] Starting generic file upload');
        
        try {
            // 获取参数
            $upload_dir = $request->get_param('upload_dir') ?: 'uploads';
            
            error_log('[BJT Upload Controller] Generic upload parameters: upload_dir=' . $upload_dir);
            
            // 检查是否有文件上传
            $files = $request->get_file_params();
            error_log('[BJT Upload Controller] Available files: ' . print_r(array_keys($files), true));
            
            if (empty($files['file'])) {
                error_log('[BJT Upload Controller] No file in request. Available files: ' . implode(', ', array_keys($files)));
                return $this->error_response('请选择要上传的文件', 'no_file', 400);
            }
            
            $file = $files['file'];
            error_log('[BJT Upload Controller] File info: name=' . $file['name'] . ', size=' . $file['size'] . ', type=' . $file['type'] . ', tmp_name=' . $file['tmp_name']);
            
            // 检查临时文件是否存在
            if (!file_exists($file['tmp_name'])) {
                error_log('[BJT Upload Controller] Temporary file does not exist: ' . $file['tmp_name']);
                return $this->error_response('上传的临时文件不存在', 'temp_file_missing', 500);
            }
            
            // 检查文件上传错误
            if ($file['error'] !== UPLOAD_ERR_OK) {
                error_log('[BJT Upload Controller] File upload error: ' . $file['error']);
                return $this->error_response(
                    '文件上传失败: ' . $this->get_upload_error_message($file['error']),
                    'upload_error',
                    400
                );
            }
            
            // 验证文件类型（允许常见的文件类型）
            $file_info = wp_check_filetype($file['name']);
            error_log('[BJT Upload Controller] File type check: ext=' . $file_info['ext'] . ', type=' . $file_info['type']);
            
            $allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt'];
            if (!in_array($file_info['ext'], $allowed_types)) {
                error_log('[BJT Upload Controller] Invalid file type: ' . $file_info['type']);
                return $this->error_response('不支持的文件类型: ' . $file_info['ext'], 'invalid_file_type', 400);
            }
            
            // 验证文件大小 (10MB)
            $max_size = 10 * 1024 * 1024;
            if ($file['size'] > $max_size) {
                error_log('[BJT Upload Controller] File too large: ' . $file['size']);
                return $this->error_response('文件大小不能超过10MB', 'file_too_large', 400);
            }
            
            // 确定上传目录路径
            error_log('[BJT Upload Controller] Preparing upload directory...');
            $upload_result = $this->prepare_generic_upload_directory($upload_dir);
            if (is_wp_error($upload_result)) {
                error_log('[BJT Upload Controller] Failed to prepare upload directory: ' . $upload_result->get_error_message());
                return $upload_result;
            }
            
            extract($upload_result); // $upload_path, $upload_url
            error_log('[BJT Upload Controller] Upload directory prepared: path=' . $upload_path . ', url=' . $upload_url);
            
            // 生成唯一文件名
            $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME));
            $timestamp = time();
            $random = substr(md5(mt_rand()), 0, 6);
            $unique_filename = $timestamp . '_' . $random . '.' . $file_extension;
            $full_path = $upload_path . '/' . $unique_filename;
            $file_url = $upload_url . '/' . $unique_filename;
            
            error_log('[BJT Upload Controller] File target path: ' . $full_path);
            error_log('[BJT Upload Controller] File URL: ' . $file_url);
            
            // 检查目标目录是否可写
            if (!is_writable($upload_path)) {
                error_log('[BJT Upload Controller] Target directory not writable: ' . $upload_path);
                return $this->error_response('目标目录不可写: ' . $upload_path, 'directory_not_writable', 500);
            }
            
            // 检查磁盘空间
            $free_space = disk_free_space($upload_path);
            error_log('[BJT Upload Controller] Free disk space: ' . ($free_space ? number_format($free_space / 1024 / 1024, 2) . ' MB' : 'unknown'));
            
            if ($free_space !== false && $free_space < $file['size'] * 2) { // 需要至少2倍文件大小的空间
                error_log('[BJT Upload Controller] Insufficient disk space');
                return $this->error_response('磁盘空间不足', 'insufficient_disk_space', 500);
            }
            
            // 移动上传的文件
            error_log('[BJT Upload Controller] Attempting to move uploaded file from ' . $file['tmp_name'] . ' to ' . $full_path);
            
            if (move_uploaded_file($file['tmp_name'], $full_path)) {
                error_log('[BJT Upload Controller] File uploaded successfully: ' . $full_path);
                
                // 设置正确的文件权限
                if (@chmod($full_path, 0644) || true) {
                    error_log('[BJT Upload Controller] Directory permissions setup completed (chmod may have been skipped in container environment)');
                    
                    // 再次检查是否可写
                    if (!is_writable($full_path)) {
                        error_log('[BJT Upload Controller] Directory still not writable after chmod attempt');
                        return $this->error_response(
                            '上传目录不可写: ' . $full_path . ' (权限: ' . sprintf('%o', fileperms($full_path) & 0777) . ')',
                            'directory_not_writable', 
                            500
                        );
                    }
                } else {
                    // 这个分支理论上不会被执行，因为 || true 总是使条件为真
                    error_log('[BJT Upload Controller] chmod operation bypassed');
                }
                
                // 验证文件确实存在并可读
                if (!file_exists($full_path) || !is_readable($full_path)) {
                    error_log('[BJT Upload Controller] File exists check failed after upload');
                    return $this->error_response('文件上传后验证失败', 'post_upload_verification_failed', 500);
                }
                
                $final_size = filesize($full_path);
                error_log('[BJT Upload Controller] Final file size: ' . $final_size . ' bytes');
                
                return $this->format_response([
                    'url' => $file_url,
                    'filename' => $unique_filename,
                    'file_size' => $file['size'],
                    'final_file_size' => $final_size,
                    'upload_path' => $full_path,
                    'file_type' => 'file',
                    'debug_info' => [
                        'upload_dir' => $upload_dir,
                        'resolved_path' => $upload_path,
                        'resolved_url' => $upload_url,
                        'original_filename' => $file['name'],
                        'temp_file' => $file['tmp_name'],
                        'php_upload_max_filesize' => ini_get('upload_max_filesize'),
                        'php_post_max_size' => ini_get('post_max_size'),
                        'wp_memory_limit' => WP_MEMORY_LIMIT,
                    ]
                ], '文件上传成功');
                
            } else {
                $error_info = error_get_last();
                error_log('[BJT Upload Controller] Failed to move uploaded file. Last error: ' . print_r($error_info, true));
                error_log('[BJT Upload Controller] Source file exists: ' . (file_exists($file['tmp_name']) ? 'yes' : 'no'));
                error_log('[BJT Upload Controller] Target dir exists: ' . (file_exists($upload_path) ? 'yes' : 'no'));
                error_log('[BJT Upload Controller] Target dir writable: ' . (is_writable($upload_path) ? 'yes' : 'no'));
                
                return $this->error_response(
                    '保存文件失败 - 源文件: ' . $file['tmp_name'] . ', 目标: ' . $full_path . 
                    ', 错误: ' . ($error_info ? $error_info['message'] : '未知错误'), 
                    'save_failed', 
                    500
                );
            }
            
        } catch (Exception $e) {
            error_log('[BJT Upload Controller] Exception in upload_file: ' . $e->getMessage());
            error_log('[BJT Upload Controller] Exception trace: ' . $e->getTraceAsString());
            return $this->error_response('文件上传时发生异常: ' . $e->getMessage(), 'upload_exception', 500);
        } catch (Error $e) {
            error_log('[BJT Upload Controller] Fatal error in upload_file: ' . $e->getMessage());
            error_log('[BJT Upload Controller] Error trace: ' . $e->getTraceAsString());
            return $this->error_response('文件上传时发生严重错误: ' . $e->getMessage(), 'upload_fatal_error', 500);
        }
    }
    
    /**
     * 准备通用上传目录
     *
     * @param string $upload_dir 上传目录
     * @return array|WP_Error 目录信息或错误
     */
    private function prepare_generic_upload_directory($upload_dir) {
        error_log('[BJT Upload Controller] prepare_generic_upload_directory called with: ' . $upload_dir);
        
        try {
            // 确保目录路径以 frontend/public/ 开头
            $original_upload_dir = $upload_dir;
            if (strpos($upload_dir, 'frontend/public/') !== 0) {
                $upload_dir = 'frontend/public/' . ltrim($upload_dir, '/');
            }
            error_log('[BJT Upload Controller] Normalized upload_dir: ' . $original_upload_dir . ' -> ' . $upload_dir);
            
            $base_dir = ABSPATH . $upload_dir;
            error_log('[BJT Upload Controller] ABSPATH: ' . ABSPATH);
            error_log('[BJT Upload Controller] Full base_dir path: ' . $base_dir);
            
            // 生成前端可访问的相对URL路径
            // 从frontend/public/uploads/xxx 转换为 /uploads/xxx
            $relative_path = str_replace('frontend/public/', '', $upload_dir);
            $base_url = '/' . ltrim($relative_path, '/');
            
            error_log('[BJT Upload Controller] Preparing directory: ' . $base_dir);
            error_log('[BJT Upload Controller] Generated URL path: ' . $base_url);
            error_log('[BJT Upload Controller] Relative path: ' . $relative_path);
            
            // 检查父目录是否存在
            $parent_dir = dirname($base_dir);
            error_log('[BJT Upload Controller] Parent directory: ' . $parent_dir);
            error_log('[BJT Upload Controller] Parent exists: ' . (file_exists($parent_dir) ? 'yes' : 'no'));
            error_log('[BJT Upload Controller] Parent writable: ' . (is_writable($parent_dir) ? 'yes' : 'no'));
            
            // 确保目录存在
            if (!file_exists($base_dir)) {
                error_log('[BJT Upload Controller] Directory does not exist, attempting to create: ' . $base_dir);
                
                if (!wp_mkdir_p($base_dir)) {
                    $last_error = error_get_last();
                    error_log('[BJT Upload Controller] Failed to create directory: ' . $base_dir);
                    error_log('[BJT Upload Controller] Last PHP error: ' . print_r($last_error, true));
                    
                    // 尝试手动创建
                    if (!mkdir($base_dir, 0755, true)) {
                        error_log('[BJT Upload Controller] Manual mkdir also failed');
                        return $this->error_response(
                            '无法创建上传目录: ' . $base_dir . 
                            ' (父目录存在: ' . (file_exists($parent_dir) ? '是' : '否') . 
                            ', 可写: ' . (is_writable($parent_dir) ? '是' : '否') . ')',
                            'directory_creation_failed', 
                            500
                        );
                    } else {
                        error_log('[BJT Upload Controller] Manual mkdir succeeded');
                    }
                } else {
                    error_log('[BJT Upload Controller] wp_mkdir_p succeeded');
                }
            } else {
                error_log('[BJT Upload Controller] Directory already exists: ' . $base_dir);
            }
            
            // 验证目录确实存在
            if (!file_exists($base_dir)) {
                error_log('[BJT Upload Controller] Directory still does not exist after creation attempt');
                return $this->error_response('目录创建失败: ' . $base_dir, 'directory_verification_failed', 500);
            }
            
            // 检查目录权限
            $perms = fileperms($base_dir);
            $perms_octal = sprintf('%o', $perms & 0777);
            error_log('[BJT Upload Controller] Directory permissions: ' . $perms_octal);
            
            // 检查目录是否可写
            if (!is_writable($base_dir)) {
                error_log('[BJT Upload Controller] Directory not writable: ' . $base_dir);
                
                // 尝试修改权限
                if (@chmod($base_dir, 0755) || true) {
                    error_log('[BJT Upload Controller] Directory permissions setup completed (chmod may have been skipped in container environment)');
                    
                    // 再次检查是否可写
                    if (!is_writable($base_dir)) {
                        error_log('[BJT Upload Controller] Directory still not writable after chmod attempt');
                        return $this->error_response(
                            '上传目录不可写: ' . $base_dir . ' (权限: ' . $perms_octal . ')',
                            'directory_not_writable', 
                            500
                        );
                    }
                } else {
                    // 这个分支理论上不会被执行，因为 || true 总是使条件为真
                    error_log('[BJT Upload Controller] chmod operation bypassed');
                }
            }
            
            // 检查磁盘空间
            $free_space = disk_free_space($base_dir);
            $total_space = disk_total_space($base_dir);
            
            if ($free_space !== false && $total_space !== false) {
                error_log('[BJT Upload Controller] Disk space - Free: ' . number_format($free_space / 1024 / 1024, 2) . 'MB, Total: ' . number_format($total_space / 1024 / 1024, 2) . 'MB');
            }
            
            // 检查目录所有者（如果可能）
            if (function_exists('posix_getpwuid')) {
                $owner_info = posix_getpwuid(fileowner($base_dir));
                $group_info = posix_getgrgid(filegroup($base_dir));
                error_log('[BJT Upload Controller] Directory owner: ' . ($owner_info ? $owner_info['name'] : 'unknown'));
                error_log('[BJT Upload Controller] Directory group: ' . ($group_info ? $group_info['name'] : 'unknown'));
            }
            
            error_log('[BJT Upload Controller] Directory preparation successful');
            
            return [
                'upload_path' => $base_dir,
                'upload_url' => $base_url,
            ];
            
        } catch (Exception $e) {
            error_log('[BJT Upload Controller] Exception in prepare_generic_upload_directory: ' . $e->getMessage());
            error_log('[BJT Upload Controller] Exception trace: ' . $e->getTraceAsString());
            return $this->error_response('准备上传目录时发生异常: ' . $e->getMessage(), 'directory_preparation_exception', 500);
        }
    }
} 