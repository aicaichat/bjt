<?php
/**
 * 配件管理类
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Accessory_Management {
    private static $instance = null;
    private $table_name;

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_accessories';
        $this->init();
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function init() {
        add_action('admin_init', array($this, 'create_table'));
    }

    public function create_table() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text,
            price decimal(10,2) NOT NULL DEFAULT 0.00,
            product_line_id bigint(20) NOT NULL,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY product_line_id (product_line_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function add_accessory($data) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($data) || !is_array($data)) {
            return new WP_Error('invalid_data', '无效的配件数据');
        }
        
        $name = bjt_safe_sanitize_text_field($data['name'] ?? '');
        if (bjt_is_null_or_empty($name)) {
            return new WP_Error('invalid_name', '配件名称不能为空');
        }
        
        $description = bjt_safe_wp_kses_post($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        $product_line_id = intval($data['product_line_id'] ?? 0);
        
        if ($product_line_id <= 0) {
            return new WP_Error('invalid_product_line', '无效的产品线ID');
        }
        
        $result = $wpdb->insert(
            $this->table_name,
            array(
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'product_line_id' => $product_line_id
            ),
            array('%s', '%s', '%f', '%d')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '添加配件失败');
        }
        
        return $wpdb->insert_id;
    }

    public function update_accessory($id, $data) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的配件ID');
        }
        
        if (bjt_is_null_or_empty($data) || !is_array($data)) {
            return new WP_Error('invalid_data', '无效的配件数据');
        }
        
        $name = bjt_safe_sanitize_text_field($data['name'] ?? '');
        if (bjt_is_null_or_empty($name)) {
            return new WP_Error('invalid_name', '配件名称不能为空');
        }
        
        $description = bjt_safe_wp_kses_post($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        $product_line_id = intval($data['product_line_id'] ?? 0);
        
        if ($product_line_id <= 0) {
            return new WP_Error('invalid_product_line', '无效的产品线ID');
        }
        
        $result = $wpdb->update(
            $this->table_name,
            array(
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'product_line_id' => $product_line_id
            ),
            array('id' => $id),
            array('%s', '%s', '%f', '%d'),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '更新配件失败');
        }
        
        return true;
    }

    public function get_accessory($id) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的配件ID');
        }
        
        $accessory = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE id = %d",
                $id
            )
        );
        
        if (bjt_is_null_or_empty($accessory)) {
            return new WP_Error('not_found', '配件不存在');
        }
        
        return $accessory;
    }

    public function get_accessories($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'product_line_id' => 0,
            'orderby' => 'id',
            'order' => 'DESC',
            'limit' => 10,
            'offset' => 0
        );
        
        $args = bjt_safe_wp_parse_args($args, $defaults);
        
        $product_line_id = intval($args['product_line_id']);
        $orderby = bjt_safe_sanitize_text_field($args['orderby']);
        $order = bjt_safe_sanitize_text_field($args['order']);
        $limit = intval($args['limit']);
        $offset = intval($args['offset']);
        
        $where = '';
        if ($product_line_id > 0) {
            $where = $wpdb->prepare(" WHERE product_line_id = %d", $product_line_id);
        }
        
        $sql = $wpdb->prepare(
            "SELECT * FROM {$this->table_name}{$where} ORDER BY %s %s LIMIT %d OFFSET %d",
            $orderby,
            $order,
            $limit,
            $offset
        );
        
        return $wpdb->get_results($sql);
    }

    public function delete_accessory($id) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的配件ID');
        }
        
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $id),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '删除配件失败');
        }
        
        return true;
    }
} 