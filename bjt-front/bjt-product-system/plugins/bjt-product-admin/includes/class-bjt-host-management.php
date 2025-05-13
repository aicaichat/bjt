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
        check_ajax_referer('bjt_upload_specification', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => '权限不足'));
        }

        $host_id = intval($_POST['host_id']);
        if (!$host_id) {
            wp_send_json_error(array('message' => '无效的主机ID'));
        }

        if (empty($_FILES['pdf_file'])) {
            wp_send_json_error(array('message' => '请选择要上传的PDF文件'));
        }

        $file = $_FILES['pdf_file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_send_json_error(array('message' => '文件上传失败：' . $this->get_upload_error_message($file['error'])));
        }

        if ($file['type'] !== 'application/pdf') {
            wp_send_json_error(array('message' => '只允许上传PDF文件'));
        }

        // 创建上传目录
        $upload_dir = wp_upload_dir();
        $host_dir = $upload_dir['basedir'] . '/bjt-hosts/' . $host_id . '/specifications';
        if (!file_exists($host_dir)) {
            wp_mkdir_p($host_dir);
        }

        // 生成唯一的文件名
        $file_name = wp_unique_filename($host_dir, $file['name']);
        $file_path = $host_dir . '/' . $file_name;

        // 移动文件
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            wp_send_json_error(array('message' => '文件保存失败'));
        }

        // 更新数据库
        global $wpdb;
        $file_url = $upload_dir['baseurl'] . '/bjt-hosts/' . $host_id . '/specifications/' . $file_name;
        $result = $wpdb->update(
            $this->table_name,
            array(
                'specification_pdf' => $file_url,
                'updated_at' => current_time('mysql')
            ),
            array('id' => $host_id)
        );

        if ($result === false) {
            // 如果数据库更新失败，删除已上传的文件
            unlink($file_path);
            wp_send_json_error(array('message' => '文件信息保存失败：' . $wpdb->last_error));
        }

        wp_send_json_success();
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
} 