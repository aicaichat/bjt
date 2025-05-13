<?php
/**
 * BJT Product Line Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复加载
if (!class_exists('BJT_Product_Line_Management')) {

class BJT_Product_Line_Management {
    /**
     * 单例实例
     */
    private static $instance = null;
    private $table_name;

    /**
     * 获取单例实例
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 构造函数
     */
    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // Register AJAX handlers
        add_action('wp_ajax_save_product_line', array($this, 'save_product_line_ajax'));
        add_action('wp_ajax_upload_product_line_image', array($this, 'upload_product_line_image'));
        add_action('wp_ajax_bjt_save_product_line_page', array($this, 'save_product_line_page'));
        add_action('wp_ajax_get_product_line', array($this, 'get_product_line_ajax'));
    }

    public function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            code varchar(50) NOT NULL,
            title_zh varchar(255) NOT NULL,
            title_en varchar(255) NOT NULL,
            description_zh text,
            description_en text,
            consumables_zh text,
            consumables_en text,
            parts_zh text,
            parts_en text,
            image_url varchar(255),
            status varchar(20) DEFAULT 'publish',
            sort_order int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY code (code)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * 获取产品线
     * 
     * @param int $id 产品线ID
     * @param string $lang 语言代码 (zh/en)
     * @return array|WP_Error 产品线数据或错误
     */
    public function get_product_line($id, $lang = null) {
        global $wpdb;
        
        $product_line = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $id
        ), ARRAY_A);
        
        if (!$product_line) {
            return new WP_Error('not_found', __('Product line not found', 'bjt-product-admin'));
        }

        // 如果指定了语言，返回该语言的标题和描述
        if ($lang) {
            $is_zh = strpos($lang, 'zh') !== false;
            $product_line['title'] = $is_zh ? $product_line['title_zh'] : $product_line['title_en'];
            $product_line['description'] = $is_zh ? $product_line['description_zh'] : $product_line['description_en'];
            $product_line['consumables'] = $is_zh ? (isset($product_line['consumables_zh']) ? $product_line['consumables_zh'] : null) : (isset($product_line['consumables_en']) ? $product_line['consumables_en'] : null);
            $product_line['parts'] = $is_zh ? (isset($product_line['parts_zh']) ? $product_line['parts_zh'] : null) : (isset($product_line['parts_en']) ? $product_line['parts_en'] : null);
        }
        
        return $product_line;
    }

    /**
     * AJAX handler for getting a product line
     */
    public function get_product_line_ajax() {
        check_ajax_referer('bjt_product_line_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
            return;
        }
        
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : get_locale();
        
        $product_line = $this->get_product_line($id, $lang);
        
        if (is_wp_error($product_line)) {
            wp_send_json_error(array('message' => $product_line->get_error_message()));
        } else {
            wp_send_json_success(array('data' => $product_line));
        }
    }

    /**
     * 获取产品线列表
     */
    public function get_product_lines($args = array()) {
        global $wpdb;

        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'orderby' => 'sort_order',
            'order' => 'ASC',
            'status' => 'publish',
            'search' => '',
            'lang' => get_locale()
        );

        $args = wp_parse_args($args, $defaults);
        $is_zh = strpos($args['lang'], 'zh') !== false;

        // 构建查询
        $where = array("1=1");
        $values = array();

        if ($args['status']) {
            $where[] = "status = %s";
            $values[] = $args['status'];
        }

        if ($args['search']) {
            $title_field = $is_zh ? 'title_zh' : 'title_en';
            $where[] = "$title_field LIKE %s";
            $values[] = '%' . $wpdb->esc_like($args['search']) . '%';
        }

        // 计算总数
        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE " . implode(' AND ', $where),
            $values
        ));

        // 获取数据
        $offset = ($args['page'] - 1) * $args['per_page'];
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
            WHERE " . implode(' AND ', $where) . "
            ORDER BY {$args['orderby']} {$args['order']}
            LIMIT %d OFFSET %d",
            array_merge($values, array($args['per_page'], $offset))
        ));

        return array(
            'items' => $items,
            'total' => (int)$total,
            'pages' => ceil($total / $args['per_page'])
        );
    }

    /**
     * AJAX处理程序：保存产品线
     */
    public function save_product_line_ajax() {
        check_ajax_referer('bjt_product_line_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'bjt-product-admin')));
            return;
        }
        
        $data = array(
            'id' => isset($_POST['id']) ? intval($_POST['id']) : 0,
            'code' => sanitize_text_field($_POST['code']),
            'title_zh' => sanitize_text_field($_POST['title_zh']),
            'title_en' => sanitize_text_field($_POST['title_en']),
            'description_zh' => wp_kses_post($_POST['description_zh']),
            'description_en' => wp_kses_post($_POST['description_en']),
            'consumables_zh' => wp_kses_post($_POST['consumables_zh']),
            'consumables_en' => wp_kses_post($_POST['consumables_en']),
            'parts_zh' => wp_kses_post($_POST['parts_zh']),
            'parts_en' => wp_kses_post($_POST['parts_en']),
            'image_url' => esc_url_raw($_POST['image_url']),
            'status' => in_array($_POST['status'], array('draft', 'publish', 'trash')) ? $_POST['status'] : 'draft',
            'sort_order' => intval($_POST['sort_order'])
        );
        
        $result = $this->save_product_line($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
            return;
        }
        
        wp_send_json_success(array(
            'message' => __('Product line saved successfully', 'bjt-product-admin'),
            'data' => $result
        ));
    }

    /**
     * 保存产品线
     */
    public function save_product_line($data) {
        global $wpdb;

        // 验证必填字段
        $required_fields = array('code', 'title_zh', 'title_en');
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                return new WP_Error('missing_required_field', 
                    sprintf(__('Field "%s" is required', 'bjt-product-admin'), $field));
            }
        }

        // 检查代码是否已存在
        $code_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE code = %s AND id != %d",
            $data['code'],
            isset($data['id']) ? $data['id'] : 0
        ));

        if ($code_exists) {
            return new WP_Error('code_exists', __('Product line code already exists', 'bjt-product-admin'));
        }

        // 准备数据
        $db_data = array(
            'code' => $data['code'],
            'title_zh' => $data['title_zh'],
            'title_en' => $data['title_en'],
            'description_zh' => isset($data['description_zh']) ? $data['description_zh'] : null,
            'description_en' => isset($data['description_en']) ? $data['description_en'] : null,
            // 'consumables_zh' => isset($data['consumables_zh']) ? $data['consumables_zh'] : null, // Commented out
            // 'consumables_en' => isset($data['consumables_en']) ? $data['consumables_en'] : null, // Commented out
            // 'parts_zh' => isset($data['parts_zh']) ? $data['parts_zh'] : null,                   // Commented out
            // 'parts_en' => isset($data['parts_en']) ? $data['parts_en'] : null,                   // Commented out
            'image_url' => isset($data['image_url']) ? $data['image_url'] : null,
            'status' => isset($data['status']) ? $data['status'] : 'draft',
            'sort_order' => isset($data['sort_order']) ? intval($data['sort_order']) : 0,
        );

        // 更新或插入
        if (!empty($data['id'])) {
            $result = $wpdb->update(
                $this->table_name,
                $db_data,
                array('id' => absint($data['id'])),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d'),
                array('%d')
            );
        } else {
            $result = $wpdb->insert(
                $this->table_name,
                $db_data,
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d')
            );
        }

        if ($result === false) {
            return new WP_Error('db_error', __('Failed to save product line', 'bjt-product-admin'));
        }

        return $this->get_product_line(!empty($data['id']) ? $data['id'] : $wpdb->insert_id);
    }

    /**
     * 删除产品线
     */
    public function delete_product_line($id, $force = false) {
        global $wpdb;

        if ($force) {
            // 永久删除
            $result = $wpdb->delete(
                $this->table_name,
                array('id' => $id),
                array('%d')
            );
        } else {
            // 移到回收站
            $result = $wpdb->update(
                $this->table_name,
                array('status' => 'trash'),
                array('id' => $id),
                array('%s'),
                array('%d')
            );
        }

        if ($result === false) {
            return new WP_Error('delete_failed', __('Failed to delete product line', 'bjt-product-admin'));
        }

        return true;
    }

    /**
     * 批量更新产品线
     */
    public function batch_update_product_lines($ids, $action) {
        global $wpdb;

        if (empty($ids) || !is_array($ids)) {
            return new WP_Error('invalid_ids', __('Invalid product line IDs', 'bjt-product-admin'));
        }

        $ids = array_map('absint', $ids);
        $status = '';

        switch ($action) {
            case 'trash':
                $status = 'trash';
                break;
            case 'restore':
                $status = 'draft';
                break;
            case 'delete':
                // 永久删除
                $placeholders = implode(',', array_fill(0, count($ids), '%d'));
                $result = $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$this->table_name} WHERE id IN ($placeholders)",
                    $ids
                ));
                return $result !== false;
            case 'publish':
                $status = 'publish';
                break;
            default:
                return new WP_Error('invalid_action', __('Invalid action', 'bjt-product-admin'));
        }

        if ($status) {
            $placeholders = implode(',', array_fill(0, count($ids), '%d'));
            $result = $wpdb->query($wpdb->prepare(
                "UPDATE {$this->table_name} SET status = %s WHERE id IN ($placeholders)",
                array_merge(array($status), $ids)
            ));
            return $result !== false;
        }

        return false;
    }
}

} // class_exists 检查的结尾