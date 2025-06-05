<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Host_Part_Number_Management {
    private static $instance = null;
    private $table_name;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_host_part_numbers';
        $this->init_hooks();
    }

    private function init_hooks() {
        add_action('wp_ajax_bjt_get_host', array($this, 'ajax_get_host'));
        add_action('wp_ajax_bjt_save_host', array($this, 'ajax_save_host'));
        add_action('wp_ajax_bjt_delete_host', array($this, 'ajax_delete_host'));
        add_action('wp_ajax_bjt_update_host_status', array($this, 'ajax_update_host_status'));
        add_action('wp_ajax_bjt_upload_specification', array($this, 'ajax_upload_specification'));
        add_action('wp_ajax_bjt_get_nonce', array($this, 'ajax_get_nonce'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function register_rest_routes() {
        register_rest_route('bjt/v1', '/nonce', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_nonce'),
            'permission_callback' => '__return_true'
        ));
    }

    public function get_nonce() {
        $nonce = wp_create_nonce('bjt_upload_specification');
        return rest_ensure_response(array(
            'success' => true,
            'nonce' => $nonce,
            'action' => 'bjt_upload_specification'
        ));
    }

    public function get_all_hosts() {
        global $wpdb;
        return $wpdb->get_results("SELECT * FROM {$this->table_name} ORDER BY created_at DESC");
    }

    public function ajax_get_host() {
        check_ajax_referer('bjt_get_host', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => '权限不足'));
        }

        $id = intval($_POST['id']);
        if (!$id) {
            wp_send_json_error(array('message' => '无效的主机ID'));
        }

        global $wpdb;
        $host = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $id
        ));

        if (!$host) {
            wp_send_json_error(array('message' => '主机不存在'));
        }

        wp_send_json_success($host);
    }

    public function ajax_save_host() {
        check_ajax_referer('bjt_save_host', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => '权限不足'));
        }

        $id = intval($_POST['host_id']);
        $model = sanitize_text_field($_POST['model']);
        $part_number = sanitize_text_field($_POST['part_number']);
        $name_cn = sanitize_text_field($_POST['name_cn']);
        $name_en = sanitize_text_field($_POST['name_en']);
        $voltage = sanitize_text_field($_POST['voltage']);
        $brand = sanitize_text_field($_POST['brand']);
        $package_length = intval($_POST['package_length']);
        $package_width = intval($_POST['package_width']);
        $package_height = intval($_POST['package_height']);
        $package_weight = floatval($_POST['package_weight']);
        $pallet_length = intval($_POST['pallet_length']);
        $pallet_width = intval($_POST['pallet_width']);
        $pallet_height = intval($_POST['pallet_height']);
        $quantity_per_pallet = intval($_POST['quantity_per_pallet']);
        $total_height = intval($_POST['total_height']);
        $status = in_array($_POST['status'], array('publish', 'draft')) ? $_POST['status'] : 'draft';

        if (empty($model) || empty($part_number) || empty($name_cn)) {
            wp_send_json_error(array('message' => '型号、料号和中文名称为必填项'));
        }

        global $wpdb;
        $data = array(
            'model' => $model,
            'part_number' => $part_number,
            'name_cn' => $name_cn,
            'name_en' => $name_en,
            'voltage' => $voltage,
            'brand' => $brand,
            'package_length' => $package_length,
            'package_width' => $package_width,
            'package_height' => $package_height,
            'package_weight' => $package_weight,
            'pallet_length' => $pallet_length,
            'pallet_width' => $pallet_width,
            'pallet_height' => $pallet_height,
            'quantity_per_pallet' => $quantity_per_pallet,
            'total_height' => $total_height,
            'status' => $status,
            'updated_at' => current_time('mysql')
        );

        if ($id) {
            // 更新现有主机
            $result = $wpdb->update(
                $this->table_name,
                $data,
                array('id' => $id)
            );
        } else {
            // 创建新主机
            $data['created_at'] = current_time('mysql');
            $result = $wpdb->insert($this->table_name, $data);
        }

        if ($result === false) {
            wp_send_json_error(array('message' => '保存失败：' . $wpdb->last_error));
        }

        wp_send_json_success();
    }

    public function ajax_delete_host() {
        check_ajax_referer('bjt_delete_host', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => '权限不足'));
        }

        $id = intval($_POST['id']);
        if (!$id) {
            wp_send_json_error(array('message' => '无效的主机ID'));
        }

        global $wpdb;
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $id)
        );

        if ($result === false) {
            wp_send_json_error(array('message' => '删除失败：' . $wpdb->last_error));
        }

        wp_send_json_success();
    }

    public function ajax_update_host_status() {
        check_ajax_referer('bjt_update_host_status', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => '权限不足'));
        }

        $id = intval($_POST['id']);
        $status = in_array($_POST['status'], array('publish', 'draft')) ? $_POST['status'] : 'draft';

        if (!$id) {
            wp_send_json_error(array('message' => '无效的主机ID'));
        }

        global $wpdb;
        $result = $wpdb->update(
            $this->table_name,
            array(
                'status' => $status,
                'updated_at' => current_time('mysql')
            ),
            array('id' => $id)
        );

        if ($result === false) {
            wp_send_json_error(array('message' => '状态更新失败：' . $wpdb->last_error));
        }

        wp_send_json_success();
    }

    public function ajax_upload_specification() {
        error_log('[BJT Upload] Starting PDF upload process');
        
        // 认证检查 - 支持两种方式：nonce和JWT
        $authenticated = false;
        $auth_method = '';
        
        // 方式1：检查nonce（保持向后兼容）
        if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'bjt_upload_specification')) {
            $authenticated = true;
            $auth_method = 'nonce';
            error_log('[BJT Upload] Authentication successful via nonce');
        }
        
        // 方式2：检查JWT token（新的认证方式）
        if (!$authenticated) {
            $authorization_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
            
            if (empty($authorization_header) && function_exists('getallheaders')) {
                $headers = getallheaders();
                $authorization_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            }
            
            if ($authorization_header && preg_match('/Bearer\s+(.*)$/i', $authorization_header, $matches)) {
                $token = $matches[1];
                error_log('[BJT Upload] Found Bearer token, attempting JWT validation');
                
                // 确保加载BJT Core Entities的JWT处理类
                $jwt_handler = null;
                
                // 方法1：尝试使用BJT_JWT_Handler（新版本）
                if (class_exists('BJT_JWT_Handler')) {
                    $jwt_handler = new BJT_JWT_Handler();
                    $payload = $jwt_handler->validate_token($token);
                    error_log('[BJT Upload] Using BJT_JWT_Handler');
                } 
                // 方法2：尝试使用BJT_Auth（旧版本）
                elseif (class_exists('BJT_Auth')) {
                    $auth = new BJT_Auth();
                    $payload = $auth->validate_token($token);
                    error_log('[BJT Upload] Using BJT_Auth');
                }
                // 方法3：尝试从Core Entities插件加载
                else {
                    $core_entities_path = WP_PLUGIN_DIR . '/bjt-core-entities/includes/class-bjt-jwt-handler.php';
                    if (file_exists($core_entities_path)) {
                        require_once $core_entities_path;
                        if (class_exists('BJT_JWT_Handler')) {
                            $jwt_handler = new BJT_JWT_Handler();
                            $payload = $jwt_handler->validate_token($token);
                            error_log('[BJT Upload] Loaded BJT_JWT_Handler from core entities');
                        }
                    }
                    
                    if (!$jwt_handler) {
                        $auth_path = WP_PLUGIN_DIR . '/bjt-core-entities/includes/class-auth.php';
                        if (file_exists($auth_path)) {
                            require_once $auth_path;
                            if (class_exists('BJT_Auth')) {
                                $auth = new BJT_Auth();
                                $payload = $auth->validate_token($token);
                                error_log('[BJT Upload] Loaded BJT_Auth from core entities');
                            }
                        }
                    }
                }
                
                if (isset($payload) && $payload && !is_wp_error($payload)) {
                    $authenticated = true;
                    $auth_method = 'jwt';
                    error_log('[BJT Upload] Authentication successful via JWT');
                    
                    // 设置当前用户上下文（如果需要）
                    if (is_array($payload) && isset($payload['data']['user_id'])) {
                        global $current_user;
                        $current_user = get_user_by('id', $payload['data']['user_id']);
                    } elseif (is_object($payload) && isset($payload->data->user_id)) {
                        global $current_user;
                        $current_user = get_user_by('id', $payload->data->user_id);
                    }
                } else {
                    error_log('[BJT Upload] JWT token validation failed');
                }
            }
        }
        
        // 如果两种认证方式都失败
        if (!$authenticated) {
            error_log('[BJT Upload] Authentication failed - no valid nonce or JWT token');
            wp_send_json_error(array(
                'message' => '认证失败，请重新登录',
                'code' => 'authentication_failed'
            ));
        }
        
        error_log("[BJT Upload] Authentication successful via: {$auth_method}");

        // 获取host_id
        $host_id = intval($_POST['host_id']);
        if (!$host_id) {
            error_log('[BJT Upload] Invalid or missing host_id');
            wp_send_json_error(array('message' => '无效的主机ID'));
        }

        // 检查文件
        if (empty($_FILES['pdf_file'])) {
            error_log('[BJT Upload] No PDF file uploaded');
            wp_send_json_error(array('message' => '请选择要上传的PDF文件'));
        }

        $file = $_FILES['pdf_file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            error_log('[BJT Upload] File upload error: ' . $file['error']);
            wp_send_json_error(array('message' => '文件上传失败: ' . $this->get_upload_error_message($file['error'])));
        }

        // 验证文件类型
        $file_info = wp_check_filetype($file['name']);
        if ($file_info['ext'] !== 'pdf' || $file_info['type'] !== 'application/pdf') {
            error_log('[BJT Upload] Invalid file type: ' . $file_info['type']);
            wp_send_json_error(array('message' => '只能上传PDF文件'));
        }

        // 验证文件大小 (10MB)
        if ($file['size'] > 10 * 1024 * 1024) {
            error_log('[BJT Upload] File too large: ' . $file['size']);
            wp_send_json_error(array('message' => '文件大小不能超过10MB'));
        }

        // 确定上传目录
        $upload_dir = isset($_POST['upload_dir']) ? sanitize_text_field($_POST['upload_dir']) : '';
        
        if (empty($upload_dir)) {
            // 默认使用前端public目录下的uploads目录
            $frontend_dir = ABSPATH . 'frontend/public/uploads';
            $upload_path = $frontend_dir . '/specifications';
            $upload_url_path = home_url('/frontend/public/uploads/specifications');
        } else {
            // 使用指定目录（相对于WordPress根目录的frontend/public/uploads）
            $frontend_dir = ABSPATH . 'frontend/public/uploads';
            $upload_path = $frontend_dir . '/' . $upload_dir;
            $upload_url_path = home_url('/frontend/public/uploads/' . $upload_dir);
        }

        // 创建具体的主机目录
        $host_upload_path = $upload_path . '/' . $host_id;
        $host_upload_url = $upload_url_path . '/' . $host_id;

        // 确保目录存在
        if (!file_exists($host_upload_path)) {
            if (!wp_mkdir_p($host_upload_path)) {
                error_log('[BJT Upload] Failed to create directory: ' . $host_upload_path);
                wp_send_json_error(array('message' => '无法创建上传目录'));
            }
        }

        // 生成唯一文件名
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sanitize_file_name(pathinfo($file['name'], PATHINFO_FILENAME));
        $unique_filename = $filename . '_' . time() . '.' . $file_extension;
        $full_path = $host_upload_path . '/' . $unique_filename;
        $file_url = $host_upload_url . '/' . $unique_filename;

        // 移动文件
        if (move_uploaded_file($file['tmp_name'], $full_path)) {
            error_log('[BJT Upload] File uploaded successfully to: ' . $full_path);
            
            // TODO: 这里可以将文件信息保存到数据库
            // 例如：更新主机表中的specification_pdf字段
            
            wp_send_json_success(array(
                'url' => $file_url,
                'filename' => $unique_filename,
                'host_id' => $host_id,
                'message' => 'PDF文件上传成功',
                'auth_method' => $auth_method
            ));
        } else {
            error_log('[BJT Upload] Failed to move uploaded file');
            wp_send_json_error(array('message' => '保存文件失败'));
        }
    }

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
                return '未知错误';
        }
    }

    public function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL,
            part_number varchar(100) NOT NULL,
            name_cn varchar(255) NOT NULL,
            name_en varchar(255) DEFAULT NULL,
            voltage varchar(50) DEFAULT NULL,
            brand varchar(100) DEFAULT NULL,
            package_length int DEFAULT NULL,
            package_width int DEFAULT NULL,
            package_height int DEFAULT NULL,
            package_weight decimal(10,2) DEFAULT NULL,
            pallet_length int DEFAULT NULL,
            pallet_width int DEFAULT NULL,
            pallet_height int DEFAULT NULL,
            quantity_per_pallet int DEFAULT NULL,
            total_height int DEFAULT NULL,
            specification_pdf varchar(255) DEFAULT NULL,
            status varchar(20) NOT NULL DEFAULT 'draft',
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * AJAX获取nonce
     */
    public function ajax_get_nonce() {
        // 检查用户是否已登录
        if (!is_user_logged_in()) {
            wp_send_json_error(array(
                'message' => '用户未登录',
                'code' => 'not_logged_in'
            ));
        }

        // 生成nonce
        $nonce = wp_create_nonce('bjt_upload_specification');
        
        wp_send_json_success(array(
            'nonce' => $nonce,
            'user_id' => get_current_user_id(),
            'message' => 'Nonce生成成功'
        ));
    }
} 