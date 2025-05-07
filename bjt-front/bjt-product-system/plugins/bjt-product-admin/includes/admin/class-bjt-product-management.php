<?php
/**
 * 产品管理类
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Management {
    private static $instance = null;
    private $table_name;

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_products';
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
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function add_product($data) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($data) || !is_array($data)) {
            return new WP_Error('invalid_data', '无效的产品数据');
        }
        
        $name = bjt_safe_sanitize_text_field($data['name'] ?? '');
        if (bjt_is_null_or_empty($name)) {
            return new WP_Error('invalid_name', '产品名称不能为空');
        }
        
        $description = bjt_safe_wp_kses_post($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        
        $result = $wpdb->insert(
            $this->table_name,
            array(
                'name' => $name,
                'description' => $description,
                'price' => $price
            ),
            array('%s', '%s', '%f')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '添加产品失败');
        }
        
        return $wpdb->insert_id;
    }

    public function update_product($id, $data) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的产品ID');
        }
        
        if (bjt_is_null_or_empty($data) || !is_array($data)) {
            return new WP_Error('invalid_data', '无效的产品数据');
        }
        
        $name = bjt_safe_sanitize_text_field($data['name'] ?? '');
        if (bjt_is_null_or_empty($name)) {
            return new WP_Error('invalid_name', '产品名称不能为空');
        }
        
        $description = bjt_safe_wp_kses_post($data['description'] ?? '');
        $price = floatval($data['price'] ?? 0);
        
        $result = $wpdb->update(
            $this->table_name,
            array(
                'name' => $name,
                'description' => $description,
                'price' => $price
            ),
            array('id' => $id),
            array('%s', '%s', '%f'),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '更新产品失败');
        }
        
        return true;
    }

    public function get_product($id) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的产品ID');
        }
        
        $product = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE id = %d",
                $id
            )
        );
        
        if (bjt_is_null_or_empty($product)) {
            return new WP_Error('not_found', '产品不存在');
        }
        
        return $product;
    }

    public function get_products($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'orderby' => 'id',
            'order' => 'DESC',
            'limit' => 10,
            'offset' => 0
        );
        
        $args = bjt_safe_wp_parse_args($args, $defaults);
        
        $orderby = bjt_safe_sanitize_text_field($args['orderby']);
        $order = bjt_safe_sanitize_text_field($args['order']);
        $limit = intval($args['limit']);
        $offset = intval($args['offset']);
        
        $sql = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} ORDER BY %s %s LIMIT %d OFFSET %d",
            $orderby,
            $order,
            $limit,
            $offset
        );
        
        return $wpdb->get_results($sql);
    }

    public function delete_product($id) {
        global $wpdb;
        
        if (bjt_is_null_or_empty($id) || !is_numeric($id)) {
            return new WP_Error('invalid_id', '无效的产品ID');
        }
        
        $result = $wpdb->delete(
            $this->table_name,
            array('id' => $id),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('db_error', '删除产品失败');
        }
        
        return true;
    }
} 