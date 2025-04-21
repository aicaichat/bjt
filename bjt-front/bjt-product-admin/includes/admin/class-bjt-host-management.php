<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Host_Management {
    private static $instance = null;
    private $table_prefix;
    private $tables;

    private function __construct() {
        global $wpdb;
        $this->table_prefix = $wpdb->prefix . 'bjt_';
        
        // Define table names
        $this->tables = array(
            'hosts' => $this->table_prefix . 'hosts',
            'part_numbers' => $this->table_prefix . 'part_numbers',
            'host_part_relations' => $this->table_prefix . 'host_part_relations'
        );
        
        // Initialize database tables
        add_action('init', array($this, 'init'));
        
        // Register AJAX handlers
        add_action('wp_ajax_bjt_add_host', array($this, 'ajax_add_host'));
        add_action('wp_ajax_bjt_update_host', array($this, 'ajax_update_host'));
        add_action('wp_ajax_bjt_delete_host', array($this, 'ajax_delete_host'));
        add_action('wp_ajax_bjt_get_host', array($this, 'ajax_get_host'));
        add_action('wp_ajax_bjt_toggle_host_status', array($this, 'ajax_toggle_host_status'));
        add_action('wp_ajax_bjt_save_host', array($this, 'ajax_save_host'));
        add_action('wp_ajax_bjt_add_part_number', array($this, 'ajax_add_part_number'));
        add_action('wp_ajax_bjt_update_part_number', array($this, 'ajax_update_part_number'));
        add_action('wp_ajax_bjt_delete_part_number', array($this, 'ajax_delete_part_number'));
        add_action('wp_ajax_bjt_get_part_numbers', array($this, 'ajax_get_part_numbers'));
        
        // 新增处理函数
        add_action('wp_ajax_bjt_upload_file', array($this, 'ajax_upload_file'));
        add_action('wp_ajax_bjt_export_data', array($this, 'ajax_export_data'));
        add_action('wp_ajax_bjt_import_data', array($this, 'ajax_import_data'));

        add_action('bjt_admin_process_add_host', array($this, 'process_add_host'));
        add_action('bjt_admin_process_update_host', array($this, 'process_update_host'));
        add_action('bjt_admin_process_delete_host', array($this, 'process_delete_host'));
        add_action('wp_ajax_bjt_get_hosts', array($this, 'ajax_get_hosts'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init() {
        $this->create_tables();
        $this->generate_test_data();
    }

    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // 检查 MySQL 版本是否支持外键
        $supports_foreign_keys = version_compare($wpdb->db_version(), '5.6', '>=');
        
        // 定义支持的语言列表（不包括中文，因为已经有title_zh和description_zh）
        $supported_languages = array('en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'ru', 'pt', 'ar', 'hi');
        
        // 构建多语言字段SQL
        $language_fields_sql = '';
        foreach ($supported_languages as $lang_code) {
            $language_fields_sql .= "title_{$lang_code} varchar(255),\n";
            $language_fields_sql .= "description_{$lang_code} text,\n";
        }
        
        // 1. Hosts table
        $sql_hosts = "CREATE TABLE IF NOT EXISTS {$this->tables['hosts']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL,
            title_zh varchar(255) NOT NULL,
            description_zh text,
            {$language_fields_sql}
            specifications_zh text,
            specifications_en text,
            features_zh text,
            features_en text,
            image1_url varchar(255),
            image2_url varchar(255),
            explosion_diagram_pdf varchar(255),
            status varchar(20) DEFAULT 'publish',
            menu_order int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY model (model)
        ) $charset_collate;";

        // 2. Part numbers table - 为零件表也添加多语言支持
        $part_language_fields_sql = '';
        foreach ($supported_languages as $lang_code) {
            $part_language_fields_sql .= "name_{$lang_code} varchar(255),\n";
            $part_language_fields_sql .= "description_{$lang_code} text,\n";
        }
        
        $sql_part_numbers = "CREATE TABLE IF NOT EXISTS {$this->tables['part_numbers']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL,
            brand varchar(100),
            part_number varchar(100) NOT NULL,
            name_zh varchar(255) NOT NULL,
            description_zh text,
            {$part_language_fields_sql}
            voltage varchar(50),
            package_size varchar(100),
            package_weight decimal(10,2),
            pallet_size varchar(100),
            pcs_per_pallet_1 int(11),
            pallet_height_1 decimal(10,2),
            image_url varchar(255),
            status varchar(20) DEFAULT 'publish',
            menu_order int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        // 3. Host-Part relations table
        $sql_relations = "CREATE TABLE IF NOT EXISTS {$this->tables['host_part_relations']} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            host_id bigint(20) NOT NULL,
            part_number_id bigint(20) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY host_part (host_id, part_number_id)" . 
            ($supports_foreign_keys ? 
                ", FOREIGN KEY (host_id) REFERENCES {$this->tables['hosts']}(id) ON DELETE CASCADE,
                FOREIGN KEY (part_number_id) REFERENCES {$this->tables['part_numbers']}(id) ON DELETE CASCADE" : 
                "") . "
        ) $charset_collate;";

        // 创建表并检查结果
        $result = dbDelta($sql_hosts);
        if (empty($result)) {
            error_log('BJT Product Admin: Failed to create hosts table');
                    return false;
                }

        $result = dbDelta($sql_part_numbers);
        if (empty($result)) {
            error_log('BJT Product Admin: Failed to create part_numbers table');
            return false;
        }

        $result = dbDelta($sql_relations);
        if (empty($result)) {
            error_log('BJT Product Admin: Failed to create relations table');
                return false;
        }

        return true;
    }

    public function generate_test_data() {
        global $wpdb;

        // Check if hosts table is empty
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->tables['hosts']}");
        if ($count == 0) {
            // Insert test hosts
            $test_hosts = array(
                array(
                    'model' => 'HOST-001',
                    'title_zh' => '主机型号1',
                    'title_en' => 'Host Model 1',
                    'description_zh' => '测试主机1描述',
                    'description_en' => 'Test Host 1 Description',
                    'status' => 'publish'
                ),
                array(
                    'model' => 'HOST-002',
                    'title_zh' => '主机型号2',
                    'title_en' => 'Host Model 2',
                    'description_zh' => '测试主机2描述',
                    'description_en' => 'Test Host 2 Description',
                    'status' => 'publish'
                ),
                array(
                    'model' => 'HOST-003',
                    'title_zh' => '主机型号3',
                    'title_en' => 'Host Model 3',
                    'description_zh' => '测试主机3描述',
                    'description_en' => 'Test Host 3 Description',
                    'status' => 'publish'
                )
            );
            
            foreach ($test_hosts as $host) {
                $wpdb->insert($this->tables['hosts'], $host);
            }
        }
        
        // Check if part numbers table is empty
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->tables['part_numbers']}");
        if ($count == 0) {
            // Insert test part numbers
            $test_parts = array(
                array(
                    'model' => 'HOST-001',
                    'part_number' => 'PART-001',
                    'name_zh' => '料号1',
                    'name_en' => 'Part Number 1',
                    'voltage' => '220V',
                    'status' => 'publish'
                ),
                array(
                    'model' => 'HOST-002',
                    'part_number' => 'PART-002',
                    'name_zh' => '料号2',
                    'name_en' => 'Part Number 2',
                    'voltage' => '110V',
                    'status' => 'publish'
                ),
                array(
                    'model' => 'HOST-003',
                    'part_number' => 'PART-003',
                    'name_zh' => '料号3',
                    'name_en' => 'Part Number 3',
                    'voltage' => '220V',
                    'status' => 'publish'
                )
            );
            
            foreach ($test_parts as $part) {
                $wpdb->insert($this->tables['part_numbers'], $part);
            }
        }
    }

    public function get_all_hosts() {
        global $wpdb;
        return $wpdb->get_results("SELECT * FROM {$this->tables['hosts']} ORDER BY created_at DESC");
    }

    public function get_hosts($args = array()) {
        global $wpdb;

        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'search' => '',
            'orderby' => 'id',
            'order' => 'DESC'
        );

        $args = wp_parse_args($args, $defaults);
        $where = array();
        $where_values = array();

        if (!empty($args['search'])) {
            $where[] = "(model LIKE %s OR title_zh LIKE %s OR title_en LIKE %s)";
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Get total count
        $total_query = "SELECT COUNT(*) FROM {$this->tables['hosts']} {$where_clause}";
        $total = $wpdb->get_var($wpdb->prepare($total_query, $where_values));

        // Get paginated results
        $offset = ($args['page'] - 1) * $args['per_page'];
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->tables['hosts']} 
            {$where_clause} 
            ORDER BY {$args['orderby']} {$args['order']}
            LIMIT %d OFFSET %d",
            array_merge($where_values, array($args['per_page'], $offset))
        );

        $items = $wpdb->get_results($query, ARRAY_A);

        return array(
            'items' => $items,
            'total' => $total,
            'pages' => ceil($total / $args['per_page'])
        );
    }

    public function ajax_add_host() {
        try {
            // 检查权限
            if (!current_user_can('manage_options')) {
                throw new Exception('权限不足');
            }

            // 检查 nonce
            if (!check_ajax_referer('bjt_host_nonce', 'nonce', false)) {
                throw new Exception('无效的请求');
            }

            // 获取并验证数据
            $model = sanitize_text_field($_POST['model'] ?? '');
            $title_zh = sanitize_text_field($_POST['title_zh'] ?? '');
            $title_en = sanitize_text_field($_POST['title_en'] ?? '');
            
            if (empty($model) || empty($title_zh) || empty($title_en)) {
                throw new Exception('请填写所有必填字段');
            }

            // 检查型号是否已存在
            global $wpdb;
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tables['hosts']} WHERE model = %s",
                $model
            ));
            
            if ($exists) {
                throw new Exception('该型号已存在');
            }

            // 准备数据
            $data = array(
                'model' => $model,
                'title_zh' => $title_zh,
                'title_en' => $title_en,
                'description_zh' => wp_kses_post($_POST['description_zh'] ?? ''),
                'description_en' => wp_kses_post($_POST['description_en'] ?? ''),
                'status' => sanitize_text_field($_POST['status'] ?? 'publish')
            );

            // 插入数据
            $result = $wpdb->insert($this->tables['hosts'], $data);
            
            if ($result === false) {
                throw new Exception('添加失败：' . $wpdb->last_error);
            }

            wp_send_json_success(array(
                'message' => '添加成功',
                'id' => $wpdb->insert_id
            ));

        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }

    public function ajax_update_host() {
        try {
            // 检查权限
            if (!current_user_can('manage_options')) {
                throw new Exception('权限不足');
            }

            // 检查 nonce
            if (!check_ajax_referer('bjt_host_nonce', 'nonce', false)) {
                throw new Exception('无效的请求');
            }

            // 获取并验证数据
            $id = absint($_POST['id'] ?? 0);
            if (!$id) {
                throw new Exception('无效的ID');
            }

            $model = sanitize_text_field($_POST['model'] ?? '');
            $title_zh = sanitize_text_field($_POST['title_zh'] ?? '');
            $title_en = sanitize_text_field($_POST['title_en'] ?? '');
            
            if (empty($model) || empty($title_zh) || empty($title_en)) {
                throw new Exception('请填写所有必填字段');
            }

            // 检查型号是否已被其他记录使用
            global $wpdb;
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tables['hosts']} WHERE model = %s AND id != %d",
                $model,
                $id
            ));
            
            if ($exists) {
                throw new Exception('该型号已被其他记录使用');
            }

            // 准备数据
            $data = array(
                'model' => $model,
                'title_zh' => $title_zh,
                'title_en' => $title_en,
                'description_zh' => wp_kses_post($_POST['description_zh'] ?? ''),
                'description_en' => wp_kses_post($_POST['description_en'] ?? ''),
                'status' => sanitize_text_field($_POST['status'] ?? 'publish')
            );

            // 更新数据
            $result = $wpdb->update(
                $this->tables['hosts'],
                $data,
                array('id' => $id),
                null,
                array('%d')
            );
            
            if ($result === false) {
                throw new Exception('更新失败：' . $wpdb->last_error);
            }

            wp_send_json_success(array(
                'message' => '更新成功'
            ));

        } catch (Exception $e) {
            wp_send_json_error($e->getMessage());
        }
    }

    public function ajax_delete_host() {
        check_ajax_referer('bjt_host_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $id = intval($_POST['id']);

        global $wpdb;
        $result = $wpdb->delete(
            $this->tables['hosts'],
            array('id' => $id),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('删除失败');
        }

        wp_send_json_success();
    }

    public function ajax_get_host() {
        check_ajax_referer('bjt_host_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $id = intval($_POST['id']);

        global $wpdb;
        $host = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tables['hosts']} WHERE id = %d",
                $id
            ),
            ARRAY_A
        );

        if (!$host) {
            wp_send_json_error('主机不存在');
        }

        wp_send_json_success($host);
    }

    public function ajax_toggle_host_status() {
        check_ajax_referer('bjt_host_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $id = intval($_POST['id']);
        $status = intval($_POST['status']);

        global $wpdb;
        $result = $wpdb->update(
            $this->tables['hosts'],
            array('status' => $status),
            array('id' => $id),
            array('%d'),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('状态更新失败');
        }

        wp_send_json_success();
    }

    public function ajax_add_part_number() {
        check_ajax_referer('bjt_part_number_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $model = sanitize_text_field($_POST['model']);
        $name = sanitize_text_field($_POST['name']);
        $description = wp_kses_post($_POST['description']);
        $status = intval($_POST['status']);

        if (empty($model) || empty($name)) {
            wp_send_json_error('料号不能为空');
        }

        global $wpdb;
        $result = $wpdb->insert(
            $this->tables['part_numbers'],
            array(
                'part_number' => $model,
                'name' => $name,
                'description' => $description,
                'status' => $status
            ),
            array('%s', '%s', '%s', '%d')
        );

        if ($result === false) {
            wp_send_json_error('添加失败');
        }

        wp_send_json_success(array('id' => $wpdb->insert_id));
    }

    public function ajax_update_part_number() {
        check_ajax_referer('bjt_part_number_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $id = intval($_POST['id']);
        $model = sanitize_text_field($_POST['model']);
        $name = sanitize_text_field($_POST['name']);
        $description = wp_kses_post($_POST['description']);
        $status = intval($_POST['status']);

        if (empty($model) || empty($name)) {
            wp_send_json_error('料号不能为空');
        }

        global $wpdb;
        $result = $wpdb->update(
            $this->tables['part_numbers'],
            array(
                'part_number' => $model,
                'name' => $name,
                'description' => $description,
                'status' => $status
            ),
            array('id' => $id),
            array('%s', '%s', '%s', '%d'),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('更新失败');
        }

        wp_send_json_success();
    }

    public function ajax_delete_part_number() {
        check_ajax_referer('bjt_part_number_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $id = intval($_POST['id']);

        global $wpdb;
        $result = $wpdb->delete(
            $this->tables['part_numbers'],
            array('id' => $id),
            array('%d')
        );

        if ($result === false) {
            wp_send_json_error('删除失败');
        }

        wp_send_json_success();
    }

    public function ajax_get_part_numbers() {
        check_ajax_referer('bjt_part_number_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('权限不足');
        }

        $model = isset($_POST['model']) ? sanitize_text_field($_POST['model']) : '';
        $part_number = isset($_POST['part_number']) ? sanitize_text_field($_POST['part_number']) : '';

        global $wpdb;
        $where = array();
        $where_values = array();

        if ($model) {
            $where[] = "p.part_number LIKE %s";
            $where_values[] = '%' . $wpdb->esc_like($model) . '%';
        }

        if ($part_number) {
            $where[] = "p.part_number LIKE %s";
            $where_values[] = '%' . $wpdb->esc_like($part_number) . '%';
        }

        $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $query = $wpdb->prepare(
            "SELECT p.*, h.model as host_model 
            FROM {$this->tables['part_numbers']} p 
            LEFT JOIN {$this->tables['hosts']} h ON p.part_number = h.model 
            {$where_clause} 
            ORDER BY p.id DESC",
            $where_values
        );

        $part_numbers = $wpdb->get_results($query, ARRAY_A);

        wp_send_json_success($part_numbers);
    }

    /**
     * Save host data via AJAX
     */
    public function ajax_save_host() {
        // Check security nonce
        if (!isset($_POST['security']) || !wp_verify_nonce($_POST['security'], 'bjt_host_nonce')) {
            wp_send_json_error(['message' => __('Security check failed.', 'bjt-product-admin')]);
        }
        
        // Check user permissions
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'bjt-product-admin')]);
        }
        
        // Check for required fields
        if (empty($_POST['model']) || empty($_POST['name_zh'])) {
            wp_send_json_error(['message' => __('Model and Chinese name are required fields.', 'bjt-product-admin')]);
        }
        
        // Get host ID (0 if new)
        $host_id = isset($_POST['host_id']) ? intval($_POST['host_id']) : 0;
        
        // Define supported languages
        $languages = array('zh', 'en');
        
        $data = array(
            'model' => sanitize_text_field($_POST['model']),
            'status' => sanitize_text_field($_POST['status']),
            'menu_order' => intval($_POST['menu_order'])
        );
        
        // Process language fields
        foreach ($languages as $lang) {
            if (isset($_POST["name_{$lang}"])) {
                $data["title_{$lang}"] = sanitize_text_field($_POST["name_{$lang}"]);
            }
            
            if (isset($_POST["description_{$lang}"])) {
                $data["description_{$lang}"] = wp_kses_post($_POST["description_{$lang}"]);
            }
        }
        
        // Process specifications and features (currently only supporting Chinese and English)
        if (isset($_POST['specifications_zh'])) {
            $data['specifications_zh'] = wp_kses_post($_POST['specifications_zh']);
        }
        
        if (isset($_POST['specifications_en'])) {
            $data['specifications_en'] = wp_kses_post($_POST['specifications_en']);
        }
        
        if (isset($_POST['features_zh'])) {
            $data['features_zh'] = wp_kses_post($_POST['features_zh']);
        }
        
        if (isset($_POST['features_en'])) {
            $data['features_en'] = wp_kses_post($_POST['features_en']);
        }
        
        // Process image and document URLs
        if (isset($_POST['image1_url'])) {
            $data['image1_url'] = esc_url_raw($_POST['image1_url']);
        }
        
        if (isset($_POST['image2_url'])) {
            $data['image2_url'] = esc_url_raw($_POST['image2_url']);
        }
        
        if (isset($_POST['explosion_diagram_pdf'])) {
            $data['explosion_diagram_pdf'] = esc_url_raw($_POST['explosion_diagram_pdf']);
        }
        
        global $wpdb;
        $tables = bjt_get_tables();
        
        // Update or insert record
        if ($host_id > 0) {
            // Update existing host
            $result = $wpdb->update(
                $tables['hosts'],
                $data,
                array('id' => $host_id)
            );
            
            if ($result !== false) {
                wp_send_json_success(array(
                    'message' => __('Host updated successfully.', 'bjt-product-admin'),
                    'host_id' => $host_id
                ));
            } else {
                wp_send_json_error(array('message' => __('Error updating host.', 'bjt-product-admin')));
            }
        } else {
            // Insert new host
            $result = $wpdb->insert(
                $tables['hosts'],
                $data
            );
            
            if ($result) {
                $new_host_id = $wpdb->insert_id;
                wp_send_json_success(array(
                    'message' => __('Host added successfully.', 'bjt-product-admin'),
                    'host_id' => $new_host_id
                ));
            } else {
                wp_send_json_error(array('message' => __('Error adding host.', 'bjt-product-admin')));
            }
        }
    }

    /**
     * 处理文件上传请求
     * AJAX处理文件上传
     */
    public function ajax_upload_file() {
        // 检查安全性
        check_ajax_referer('bjt_ajax_nonce', 'security');
        
        // 检查权限
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
            return;
        }
        
        // 检查是否有文件上传
        if (empty($_FILES['file'])) {
            wp_send_json_error(array('message' => __('No file uploaded', 'bjt-product-admin')));
            return;
        }
        
        // 设置允许的文件类型
        $allowed_types = array('xlsx', 'xls', 'csv', 'json');
        $file = $_FILES['file'];
        $file_ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        
        if (!in_array(strtolower($file_ext), $allowed_types)) {
            wp_send_json_error(array('message' => __('Invalid file type. Allowed types: xlsx, xls, csv, json', 'bjt-product-admin')));
            return;
        }
        
        // 创建上传目录
        $upload_dir = wp_upload_dir();
        $target_dir = $upload_dir['basedir'] . '/bjt-imports/';
        
        if (!file_exists($target_dir)) {
            wp_mkdir_p($target_dir);
        }
        
        // 生成唯一文件名
        $filename = uniqid() . '-' . sanitize_file_name($file['name']);
        $target_file = $target_dir . $filename;
        
        // 移动上传的文件
        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            wp_send_json_success(array(
                'message' => __('File uploaded successfully', 'bjt-product-admin'),
                'file_path' => $target_file,
                'file_url' => $upload_dir['baseurl'] . '/bjt-imports/' . $filename,
                'file_name' => $filename,
                'file_type' => $file_ext
            ));
        } else {
            wp_send_json_error(array('message' => __('Failed to upload file', 'bjt-product-admin')));
        }
        
        wp_die();
    }
    
    /**
     * 处理数据导出请求
     * AJAX处理导出数据的请求
     */
    public function ajax_export_data() {
        global $wpdb;
        
        // 检查安全性
        check_ajax_referer('bjt_ajax_nonce', 'security');
        
        // 检查权限
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
            return;
        }
        
        // 获取参数
        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';
        $format = isset($_POST['format']) ? sanitize_text_field($_POST['format']) : 'excel';
        
        if (!in_array($type, array('hosts', 'parts'))) {
            wp_send_json_error(array('message' => __('Invalid export type', 'bjt-product-admin')));
            return;
        }
        
        if (!in_array($format, array('excel', 'csv', 'json'))) {
            wp_send_json_error(array('message' => __('Invalid export format', 'bjt-product-admin')));
            return;
        }
        
        // 获取数据
        $data = array();
        
        if ($type === 'hosts') {
            $data = $wpdb->get_results("SELECT * FROM {$this->tables['hosts']} ORDER BY id DESC", ARRAY_A);
        } else if ($type === 'parts') {
            $data = $wpdb->get_results("SELECT * FROM {$this->tables['part_numbers']} ORDER BY id DESC", ARRAY_A);
        }
        
        // 准备导出
        $filename = $type . '_export_' . date('Y-m-d') . '.' . ($format === 'excel' ? 'xlsx' : $format);
        $upload_dir = wp_upload_dir();
        $export_dir = $upload_dir['basedir'] . '/bjt-exports/';
        
        if (!file_exists($export_dir)) {
            wp_mkdir_p($export_dir);
        }
        
        $file_path = $export_dir . $filename;
        $file_url = $upload_dir['baseurl'] . '/bjt-exports/' . $filename;
        
        // 根据格式导出数据
        $result = false;
        
        if ($format === 'excel') {
            $result = $this->export_to_excel($data, $file_path, $type);
        } else if ($format === 'csv') {
            $result = $this->export_to_csv($data, $file_path, $type);
        } else if ($format === 'json') {
            $result = $this->export_to_json($data, $file_path);
        }
        
        if ($result) {
            wp_send_json_success(array(
                'message' => __('Data exported successfully', 'bjt-product-admin'),
                'file_url' => $file_url,
                'file_name' => $filename
            ));
        } else {
            wp_send_json_error(array('message' => __('Failed to export data', 'bjt-product-admin')));
        }
        
        wp_die();
    }
    
    /**
     * 导出数据到Excel
     */
    private function export_to_excel($data, $file_path, $type) {
        // 如果安装了PhpSpreadsheet库，使用它导出Excel
        if (class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // 设置表头
            if ($type === 'hosts') {
                $columns = array('ID', __('Model', 'bjt-product-admin'), __('Name', 'bjt-product-admin'), __('Description', 'bjt-product-admin'), __('Status', 'bjt-product-admin'), __('Created At', 'bjt-product-admin'), __('Updated At', 'bjt-product-admin'));
            } else {
                $columns = array('ID', __('Part Number', 'bjt-product-admin'), __('Name', 'bjt-product-admin'), __('Description', 'bjt-product-admin'), __('Status', 'bjt-product-admin'), __('Created At', 'bjt-product-admin'), __('Updated At', 'bjt-product-admin'));
            }
            
            for ($i = 0; $i < count($columns); $i++) {
                $sheet->setCellValueByColumnAndRow($i + 1, 1, $columns[$i]);
            }
            
            // 填充数据
            $row = 2;
            foreach ($data as $item) {
                $col = 1;
                foreach ($item as $key => $value) {
                    $sheet->setCellValueByColumnAndRow($col, $row, $value);
                    $col++;
                }
                $row++;
            }
            
            // 保存文件
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($file_path);
            
            return file_exists($file_path);
        } else {
            // 如果没有PhpSpreadsheet库，则导出为CSV并重命名
            return $this->export_to_csv($data, $file_path, $type);
        }
    }

    /**
     * 导出数据到CSV
     */
    private function export_to_csv($data, $file_path, $type) {
        $fp = fopen($file_path, 'w');
        
        if ($fp) {
            // 设置表头
            if ($type === 'hosts') {
                $header = array('id', 'model', 'title', 'description', 'status', 'created_at', 'updated_at');
            } else {
                $header = array('id', 'part_number', 'title', 'description', 'status', 'created_at', 'updated_at');
            }
            
            fputcsv($fp, $header);
            
            // 写入数据
            foreach ($data as $item) {
                fputcsv($fp, $item);
            }
            
            fclose($fp);
            return file_exists($file_path);
        }
        
        return false;
    }
    
    /**
     * 导出数据到JSON
     */
    private function export_to_json($data, $file_path) {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        $result = file_put_contents($file_path, $json);
        return $result !== false;
    }
    
    /**
     * 处理数据导入请求
     * AJAX处理导入数据的请求
     */
    public function ajax_import_data() {
        global $wpdb;
        
        // 检查安全性
        check_ajax_referer('bjt_ajax_nonce', 'security');
        
        // 检查权限
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
            return;
        }
        
        // 获取参数
        $file_path = isset($_POST['file_path']) ? sanitize_text_field($_POST['file_path']) : '';
        $file_type = isset($_POST['file_type']) ? sanitize_text_field($_POST['file_type']) : '';
        $import_type = isset($_POST['import_type']) ? sanitize_text_field($_POST['import_type']) : 'hosts';
        $validation_mode = isset($_POST['validation_mode']) ? sanitize_text_field($_POST['validation_mode']) : 'strict';
        $conflict_mode = isset($_POST['conflict_mode']) ? sanitize_text_field($_POST['conflict_mode']) : 'skip';
        
        if (!file_exists($file_path)) {
            wp_send_json_error(array('message' => __('File not found', 'bjt-product-admin')));
            return;
        }
        
        // 根据文件类型解析数据
        $data = array();
        
        if (in_array($file_type, array('xlsx', 'xls'))) {
            if (class_exists('PhpOffice\PhpSpreadsheet\IOFactory')) {
                try {
                    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file_path);
                    $worksheet = $spreadsheet->getActiveSheet();
                    $data = $worksheet->toArray();
                    
                    // 第一行是表头，移除它
                    $headers = array_shift($data);
                } catch (Exception $e) {
                    wp_send_json_error(array('message' => __('Failed to parse Excel file', 'bjt-product-admin') . ': ' . $e->getMessage()));
                    return;
                }
            } else {
                wp_send_json_error(array('message' => __('PhpSpreadsheet library not installed', 'bjt-product-admin')));
                return;
            }
        } else if ($file_type === 'csv') {
            $row = 0;
            $headers = array();
            
            if (($handle = fopen($file_path, "r")) !== FALSE) {
                while (($rowData = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    if ($row === 0) {
                        $headers = $rowData;
                    } else {
                        $data[] = $rowData;
                    }
                    $row++;
                }
                fclose($handle);
            } else {
                wp_send_json_error(array('message' => __('Failed to open CSV file', 'bjt-product-admin')));
                return;
            }
        } else if ($file_type === 'json') {
            $json = file_get_contents($file_path);
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error(array('message' => __('Failed to parse JSON file', 'bjt-product-admin') . ': ' . json_last_error_msg()));
                return;
            }
        } else {
            wp_send_json_error(array('message' => __('Unsupported file type', 'bjt-product-admin')));
            return;
        }
        
        // 将数据导入数据库
        $results = array(
            'success' => 0,
            'skipped' => 0,
            'failed' => 0,
            'errors' => array()
        );
        
        $table = $import_type === 'hosts' ? $this->tables['hosts'] : $this->tables['part_numbers'];
        
        foreach ($data as $index => $row) {
            try {
                $record = array();
                
                // 构建记录数据
                if ($import_type === 'hosts') {
                    $record = array(
                        'model' => isset($row['model']) ? sanitize_text_field($row['model']) : '',
                        'title' => isset($row['title']) ? sanitize_text_field($row['title']) : '',
                        'description' => isset($row['description']) ? sanitize_textarea_field($row['description']) : '',
                        'status' => isset($row['status']) ? intval($row['status']) : 1,
                    );
                } else {
                    $record = array(
                        'part_number' => isset($row['part_number']) ? sanitize_text_field($row['part_number']) : '',
                        'title' => isset($row['title']) ? sanitize_text_field($row['title']) : '',
                        'description' => isset($row['description']) ? sanitize_textarea_field($row['description']) : '',
                        'status' => isset($row['status']) ? intval($row['status']) : 1,
                    );
                }
                
                // 验证记录
                $valid = true;
                
                if ($validation_mode === 'strict') {
                    if ($import_type === 'hosts' && empty($record['model'])) {
                        $valid = false;
                    } else if ($import_type === 'parts' && empty($record['part_number'])) {
                        $valid = false;
                    }
                }
                
                if (!$valid) {
                    $results['skipped']++;
                    continue;
                }
                
                // 检查记录是否已存在
                $exists = false;
                
                if ($import_type === 'hosts') {
                    $exists = $wpdb->get_var($wpdb->prepare(
                        "SELECT COUNT(*) FROM $table WHERE model = %s",
                        $record['model']
                    )) > 0;
                } else {
                    $exists = $wpdb->get_var($wpdb->prepare(
                        "SELECT COUNT(*) FROM $table WHERE part_number = %s",
                        $record['part_number']
                    )) > 0;
                }
                
                // 处理冲突
                if ($exists) {
                    if ($conflict_mode === 'skip') {
                        $results['skipped']++;
                        continue;
                    } else if ($conflict_mode === 'update') {
                        if ($import_type === 'hosts') {
                            $result = $wpdb->update(
                                $table,
                                $record,
                                array('model' => $record['model'])
                            );
                        } else {
                            $result = $wpdb->update(
                                $table,
                                $record,
                                array('part_number' => $record['part_number'])
                            );
                        }
                        
                        if ($result !== false) {
                            $results['success']++;
                        } else {
                            $results['failed']++;
                            $results['errors'][] = 'Failed to update record at row ' . ($index + 2);
                        }
                    }
                } else {
                    // 添加新记录
                    $result = $wpdb->insert($table, $record);
                    
                    if ($result !== false) {
                        $results['success']++;
                    } else {
                        $results['failed']++;
                        $results['errors'][] = 'Failed to insert record at row ' . ($index + 2);
                    }
                }
            } catch (Exception $e) {
                $results['failed']++;
                $results['errors'][] = 'Error at row ' . ($index + 2) . ': ' . $e->getMessage();
            }
        }
        
        // 删除临时文件
        @unlink($file_path);
        
        wp_send_json_success(array(
            'message' => sprintf(
                __('%d records imported successfully, %d skipped, %d failed', 'bjt-product-admin'),
                $results['success'],
                $results['skipped'],
                $results['failed']
            ),
            'results' => $results
        ));
        
        wp_die();
    }
}

// 初始化类
BJT_Host_Management::get_instance(); 