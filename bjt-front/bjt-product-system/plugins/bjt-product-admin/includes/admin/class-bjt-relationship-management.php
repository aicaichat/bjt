<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Relationship_Management {
    private static $instance = null;
    private $wpdb;
    private $relations_table;
    private $accessories_table;
    private $parts_table;

    private function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->relations_table = $wpdb->prefix . 'bjt_accessory_relations';
        $this->accessories_table = $wpdb->prefix . 'bjt_accessories';
        $this->parts_table = $wpdb->prefix . 'bjt_parts';

        // 注册AJAX处理函数
        add_action('wp_ajax_get_accessories', array($this, 'ajax_get_accessories'));
        add_action('wp_ajax_get_accessory_detail', array($this, 'ajax_get_accessory_detail'));
        add_action('wp_ajax_get_accessory_options', array($this, 'ajax_get_accessory_options'));
        add_action('wp_ajax_save_accessory_relation', array($this, 'ajax_save_accessory_relation'));
        add_action('wp_ajax_delete_accessory', array($this, 'ajax_delete_accessory'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // 创建数据库表
    public function create_tables() {
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // 创建关联关系表
        $sql = "CREATE TABLE IF NOT EXISTS {$this->relations_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            product_type varchar(50) NOT NULL,
            accessory_id bigint(20) NOT NULL,
            parent_id bigint(20) DEFAULT NULL,
            level int(11) NOT NULL,
            relation_note text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY product_idx (product_id, product_type),
            KEY accessory_idx (accessory_id),
            KEY parent_idx (parent_id),
            KEY level_idx (level)
        ) {$this->wpdb->get_charset_collate()};";
        
        dbDelta($sql);

        // 创建配件表（如果不存在）
        $sql = "CREATE TABLE IF NOT EXISTS {$this->accessories_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            type varchar(50) NOT NULL,
            model varchar(100) NOT NULL,
            part_number varchar(100) NOT NULL,
            name varchar(255) NOT NULL,
            description text,
            status varchar(20) DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY part_number_idx (part_number),
            KEY type_idx (type),
            KEY status_idx (status)
        ) {$this->wpdb->get_charset_collate()};";
        
        dbDelta($sql);
    }

    // 获取配件列表
    public function get_accessories($product_id, $product_type, $level, $parent_id = null) {
        $where = array(
            'r.product_id' => $product_id,
            'r.product_type' => $product_type,
            'r.level' => $level
        );

        if ($parent_id !== null) {
            $where['r.parent_id'] = $parent_id;
        } elseif ($level > 1) {
            return array();
        }

        $query = "SELECT 
                    r.id as relation_id,
                    r.accessory_id,
                    r.parent_id,
                    r.level,
                    r.relation_note,
                    a.type,
                    a.model,
                    a.part_number,
                    a.name,
                    a.status
                FROM {$this->relations_table} r
                JOIN {$this->accessories_table} a ON r.accessory_id = a.id
                WHERE " . implode(' AND ', array_map(function($k, $v) {
                    return $k . ' = %s';
                }, array_keys($where), array_values($where)));

        return $this->wpdb->get_results($this->wpdb->prepare($query, array_values($where)));
    }

    // 获取配件详情
    public function get_accessory_detail($accessory_id) {
        $query = "SELECT 
                    a.*,
                    r.relation_note,
                    r.level,
                    r.parent_id
                FROM {$this->accessories_table} a
                LEFT JOIN {$this->relations_table} r ON r.accessory_id = a.id
                WHERE a.id = %d";

        return $this->wpdb->get_row($this->wpdb->prepare($query, $accessory_id));
    }

    // 获取可选配件列表
    public function get_accessory_options($type) {
        $query = "SELECT id, model, part_number, name
                FROM {$this->accessories_table}
                WHERE type = %s AND status = 'active'
                ORDER BY model ASC";

        return $this->wpdb->get_results($this->wpdb->prepare($query, $type));
    }

    // 保存配件关联关系
    public function save_accessory_relation($data) {
        $required = array('product_id', 'product_type', 'accessory_id', 'level');
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return new WP_Error('missing_field', "缺少必填字段：{$field}");
            }
        }

        // 检查是否已存在相同的关联
        $exists = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT id FROM {$this->relations_table}
            WHERE product_id = %d AND product_type = %s AND accessory_id = %d",
            $data['product_id'], $data['product_type'], $data['accessory_id']
        ));

        if ($exists) {
            return new WP_Error('duplicate_relation', '该配件已经关联到此产品');
        }

        // 插入关联记录
        $result = $this->wpdb->insert(
            $this->relations_table,
            array(
                'product_id' => $data['product_id'],
                'product_type' => $data['product_type'],
                'accessory_id' => $data['accessory_id'],
                'parent_id' => isset($data['parent_id']) ? $data['parent_id'] : null,
                'level' => $data['level'],
                'relation_note' => isset($data['relation_note']) ? $data['relation_note'] : null
            ),
            array('%d', '%s', '%d', '%d', '%d', '%s')
        );

        if ($result === false) {
            return new WP_Error('db_error', '保存关联关系失败');
        }

        return $this->wpdb->insert_id;
    }

    // 删除配件关联关系
    public function delete_accessory_relation($relation_id, $level) {
        // 获取所有需要删除的关联ID
        $ids_to_delete = array($relation_id);
        
        if ($level < 3) {
            // 递归获取所有子级关联
            $child_ids = $this->get_child_relations($relation_id);
            $ids_to_delete = array_merge($ids_to_delete, $child_ids);
        }

        // 执行删除
        $placeholders = implode(',', array_fill(0, count($ids_to_delete), '%d'));
        $query = "DELETE FROM {$this->relations_table} WHERE id IN ($placeholders)";
        
        $result = $this->wpdb->query($this->wpdb->prepare($query, $ids_to_delete));

        if ($result === false) {
            return new WP_Error('db_error', '删除关联关系失败');
        }

        return true;
    }

    // 获取子级关联ID
    private function get_child_relations($parent_id) {
        $child_ids = array();
        
        $children = $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT id FROM {$this->relations_table} WHERE parent_id = %d",
            $parent_id
        ));

        foreach ($children as $child_id) {
            $child_ids[] = $child_id;
            $child_ids = array_merge($child_ids, $this->get_child_relations($child_id));
        }

        return $child_ids;
    }

    // AJAX处理函数
    public function ajax_get_accessories() {
        check_ajax_referer('bjt_ajax_nonce', 'nonce');

        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        $product_type = isset($_POST['product_type']) ? sanitize_text_field($_POST['product_type']) : '';
        $level = isset($_POST['level']) ? intval($_POST['level']) : 1;
        $parent_id = isset($_POST['parent_id']) ? intval($_POST['parent_id']) : null;

        $accessories = $this->get_accessories($product_id, $product_type, $level, $parent_id);

        wp_send_json_success($accessories);
    }

    public function ajax_get_accessory_detail() {
        check_ajax_referer('bjt_ajax_nonce', 'nonce');

        $accessory_id = isset($_POST['accessory_id']) ? intval($_POST['accessory_id']) : 0;
        
        $detail = $this->get_accessory_detail($accessory_id);
        
        if ($detail) {
            wp_send_json_success($detail);
        } else {
            wp_send_json_error('未找到配件信息');
        }
    }

    public function ajax_get_accessory_options() {
        check_ajax_referer('bjt_ajax_nonce', 'nonce');

        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';
        
        $options = $this->get_accessory_options($type);
        
        wp_send_json_success($options);
    }

    public function ajax_save_accessory_relation() {
        check_ajax_referer('bjt_ajax_nonce', 'nonce');

        $data = array(
            'product_id' => isset($_POST['product_id']) ? intval($_POST['product_id']) : 0,
            'product_type' => isset($_POST['product_type']) ? sanitize_text_field($_POST['product_type']) : '',
            'accessory_id' => isset($_POST['accessory_id']) ? intval($_POST['accessory_id']) : 0,
            'parent_id' => isset($_POST['parent_id']) ? intval($_POST['parent_id']) : null,
            'level' => isset($_POST['level']) ? intval($_POST['level']) : 1,
            'relation_note' => isset($_POST['relation_note']) ? sanitize_textarea_field($_POST['relation_note']) : ''
        );

        $result = $this->save_accessory_relation($data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success($result);
        }
    }

    public function ajax_delete_accessory() {
        check_ajax_referer('bjt_ajax_nonce', 'nonce');

        $relation_id = isset($_POST['relation_id']) ? intval($_POST['relation_id']) : 0;
        $level = isset($_POST['level']) ? intval($_POST['level']) : 1;

        $result = $this->delete_accessory_relation($relation_id, $level);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success();
        }
    }
} 