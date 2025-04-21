<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Part_Management {
    private static $instance = null;
    private $table_name;

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_parts';
        
        add_action('admin_init', array($this, 'init'));
        add_action('wp_ajax_save_part', array($this, 'save_part'));
        add_action('wp_ajax_upload_part_image', array($this, 'upload_part_image'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init() {
        // Add AJAX handlers
        add_action('wp_ajax_save_part', array($this, 'save_part'));
        add_action('wp_ajax_upload_part_image', array($this, 'upload_part_image'));
    }

    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            host_id bigint(20) NOT NULL,
            part_number varchar(50) NOT NULL,
            title_cn varchar(255) NOT NULL,
            title_en varchar(255) NOT NULL,
            description_cn text,
            description_en text,
            specifications_cn text,
            specifications_en text,
            type varchar(20) NOT NULL,
            image_url varchar(255),
            status varchar(20) DEFAULT 'publish',
            menu_order int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY host_id (host_id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function save_part() {
        check_ajax_referer('save_part', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        $part_id = isset($_POST['part_id']) ? intval($_POST['part_id']) : 0;
        $host_id = isset($_POST['host_id']) ? intval($_POST['host_id']) : 0;
        $part_number = isset($_POST['part_number']) ? sanitize_text_field($_POST['part_number']) : '';
        $title_cn = isset($_POST['title_cn']) ? sanitize_text_field($_POST['title_cn']) : '';
        $title_en = isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '';
        $description_cn = isset($_POST['description_cn']) ? wp_kses_post($_POST['description_cn']) : '';
        $description_en = isset($_POST['description_en']) ? wp_kses_post($_POST['description_en']) : '';
        $specifications_cn = isset($_POST['specifications_cn']) ? wp_kses_post($_POST['specifications_cn']) : '';
        $specifications_en = isset($_POST['specifications_en']) ? wp_kses_post($_POST['specifications_en']) : '';
        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';
        $status = isset($_POST['status']) ? sanitize_text_field($_POST['status']) : 'publish';

        if (empty($part_number)) {
            wp_send_json_error('Part number is required');
        }

        if (empty($title_cn)) {
            wp_send_json_error('Chinese title is required');
        }

        if (empty($host_id)) {
            wp_send_json_error('Host ID is required');
        }

        if (empty($type) || !in_array($type, array('accessory', 'consumable', 'spare'))) {
            wp_send_json_error('Invalid part type');
        }

        global $wpdb;

        // Check if part number already exists
        if (!$part_id) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE part_number = %s",
                $part_number
            ));
            if ($existing) {
                wp_send_json_error('Part number already exists');
            }
        }

        $data = array(
            'host_id' => $host_id,
            'part_number' => $part_number,
            'title_cn' => $title_cn,
            'title_en' => $title_en,
            'description_cn' => $description_cn,
            'description_en' => $description_en,
            'specifications_cn' => $specifications_cn,
            'specifications_en' => $specifications_en,
            'type' => $type,
            'status' => $status
        );

        if ($part_id) {
            $result = $wpdb->update(
                $this->table_name,
                $data,
                array('id' => $part_id)
            );
        } else {
            $result = $wpdb->insert(
                $this->table_name,
                $data
            );
            $part_id = $wpdb->insert_id;
        }

        if ($result === false) {
            wp_send_json_error('Failed to save part');
        }

        wp_send_json_success(array(
            'part_id' => $part_id,
            'message' => 'Part saved successfully'
        ));
    }

    public function upload_part_image() {
        check_ajax_referer('upload_part_image', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
        }

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $uploadedfile = $_FILES['file'];
        $upload_overrides = array('test_form' => false);
        $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

        if ($movefile && !isset($movefile['error'])) {
            wp_send_json_success(array(
                'url' => $movefile['url'],
                'file' => $movefile['file']
            ));
        } else {
            wp_send_json_error($movefile['error']);
        }
    }

    public function get_part($part_id) {
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $part_id
        ));
    }

    public function get_parts_by_host($host_id) {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE host_id = %d ORDER BY menu_order ASC",
            $host_id
        ));
    }

    public function get_parts_by_product_line($product_line_id) {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT p.* FROM {$this->table_name} p 
            INNER JOIN {$wpdb->prefix}bjt_hosts h ON p.host_id = h.id 
            WHERE h.product_line_id = %d 
            ORDER BY p.menu_order ASC",
            $product_line_id
        ));
    }

    public function update_part_status($part_id, $status) {
        global $wpdb;
        return $wpdb->update(
            $this->table_name,
            array('status' => $status),
            array('id' => $part_id)
        );
    }

    public function delete_part($part_id) {
        global $wpdb;
        return $wpdb->delete(
            $this->table_name,
            array('id' => $part_id)
        );
    }
} 