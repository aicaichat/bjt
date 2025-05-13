<?php
/**
 * The database functionality of the plugin.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/includes
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * The database functionality of the plugin.
 *
 * Handles all database operations for the plugin.
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/includes
 * @author     BJT Team
 */
class BJT_Product_System_DB {

    /**
     * Table names
     *
     * @since    1.0.0
     * @access   private
     * @var      array    $tables    List of table names.
     */
    private $tables = array(
        'product_lines' => 'wp_bjt_product_lines',
        'host_models' => 'wp_bjt_host_models',
        'accessory_models' => 'wp_bjt_accessory_models',
        'parts' => 'wp_bjt_parts',
        'accessories' => 'wp_bjt_accessories',
        'consumables' => 'wp_bjt_consumables',
        'spare_parts' => 'wp_bjt_spare_parts',
        'relations' => 'wp_bjt_relations',
        'prices' => 'wp_bjt_prices',
        'inventory' => 'wp_bjt_inventory',
        'shapes' => 'wp_bjt_shapes',
        'materials' => 'wp_bjt_materials',
        'specifications' => 'wp_bjt_specifications',
        'consumable_compatibility' => 'wp_bjt_consumable_compatibility'
    );

    /**
     * 数据库连接实例
     *
     * @since    1.0.0
     * @access   private
     * @var      wpdb    $db    WordPress数据库对象
     */
    private $db;

    /**
     * 表名前缀
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $prefix    数据库表前缀
     */
    private $prefix;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     */
    public function __construct() {
        global $wpdb;
        $this->db = $wpdb;
        $this->prefix = $wpdb->prefix . 'bjt_';
    }

    /**
     * Get table name
     *
     * @since    1.0.0
     * @param    string    $table    The table name key.
     * @return   string    The full table name.
     */
    public function get_table_name($table) {
        global $wpdb;
        
        if (isset($this->tables[$table])) {
            return $this->tables[$table];
        }
        
        return null;
    }

    /**
     * 获取产品线列表
     *
     * @since    1.0.0
     * @param    array    $args    查询参数
     * @return   array    产品线列表和总数
     */
    public function get_product_lines($args = array()) {
        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'status' => 'publish',
            'orderby' => 'sort_order',
            'order' => 'ASC',
        );

        $args = wp_parse_args($args, $defaults);
        $table_name = $this->prefix . 'product_lines';
        
        // 构建查询条件
        $where = "WHERE 1=1";
        if (!empty($args['status'])) {
            if ($args['status'] !== 'all') {
                $where .= $this->db->prepare(" AND status = %s", $args['status']);
            }
        }
        
        // 计算分页
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        // 获取总数
        $count_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $this->db->get_var($count_query);
        
        // 获取数据
        $items_query = "SELECT * FROM $table_name $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $this->db->prepare($items_query, $args['per_page'], $offset);
        $items = $this->db->get_results($query, ARRAY_A);
        
        return array(
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $args['page'],
            'per_page' => (int) $args['per_page'],
            'total_pages' => ceil($total / $args['per_page']),
        );
    }
    
    /**
     * Get product line by ID
     *
     * @since    1.0.0
     * @param    int       $id       Product line ID.
     * @return   array     The product line data.
     */
    public function get_product_line($id) {
        $table_name = $this->prefix . 'product_lines';
        $query = $this->db->prepare("SELECT * FROM $table_name WHERE id = %d", $id);
        return $this->db->get_row($query, ARRAY_A);
    }
    
    /**
     * 获取主机型号列表
     *
     * @since    1.0.0
     * @param    array    $args    查询参数
     * @return   array    主机型号列表和总数
     */
    public function get_host_models($args = array()) {
        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'status' => 'publish',
            'product_line_id' => 0,
            'orderby' => 'sort_order',
            'order' => 'ASC',
        );

        $args = wp_parse_args($args, $defaults);
        $table_name = $this->prefix . 'host_models';
        
        // 构建查询条件
        $where = "WHERE 1=1";
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $where .= $this->db->prepare(" AND status = %s", $args['status']);
        }
        
        if (!empty($args['product_line_id'])) {
            $where .= $this->db->prepare(" AND product_line_id = %d", $args['product_line_id']);
        }
        
        // 计算分页
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        // 获取总数
        $count_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $this->db->get_var($count_query);
        
        // 获取数据
        $items_query = "SELECT * FROM $table_name $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $this->db->prepare($items_query, $args['per_page'], $offset);
        $items = $this->db->get_results($query, ARRAY_A);
        
        return array(
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $args['page'],
            'per_page' => (int) $args['per_page'],
            'total_pages' => ceil($total / $args['per_page']),
        );
    }
    
    /**
     * Get host model by ID
     *
     * @since    1.0.0
     * @param    int       $id       Host model ID.
     * @return   array     The host model data.
     */
    public function get_host_model($id) {
        $table_name = $this->prefix . 'host_models';
        $query = $this->db->prepare("SELECT * FROM $table_name WHERE id = %d", $id);
        return $this->db->get_row($query, ARRAY_A);
    }
    
    /**
     * Add product line
     *
     * @since    1.0.0
     * @param    array     $data     Product line data.
     * @return   int|false The product line ID or false on failure.
     */
    public function add_product_line($data) {
        global $wpdb;
        
        $table = $this->get_table_name('product_lines');
        
        $result = $wpdb->insert($table, $data);
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    /**
     * Update product line
     *
     * @since    1.0.0
     * @param    int       $id       Product line ID.
     * @param    array     $data     Product line data.
     * @return   bool      True on success, false on failure.
     */
    public function update_product_line($id, $data) {
        global $wpdb;
        
        $table = $this->get_table_name('product_lines');
        
        $result = $wpdb->update(
            $table,
            $data,
            array('id' => $id)
        );
        
        return $result !== false;
    }
    
    /**
     * Delete product line
     *
     * @since    1.0.0
     * @param    int       $id       Product line ID.
     * @return   bool      True on success, false on failure.
     */
    public function delete_product_line($id) {
        global $wpdb;
        
        $table = $this->get_table_name('product_lines');
        
        $result = $wpdb->update(
            $table,
            array('status' => 'trash'),
            array('id' => $id)
        );
        
        return $result !== false;
    }
    
    /**
     * Add host model
     *
     * @since    1.0.0
     * @param    array     $data     Host model data.
     * @return   int|false The host model ID or false on failure.
     */
    public function add_host_model($data) {
        global $wpdb;
        
        $table = $this->get_table_name('host_models');
        
        $result = $wpdb->insert($table, $data);
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    /**
     * Update host model
     *
     * @since    1.0.0
     * @param    int       $id       Host model ID.
     * @param    array     $data     Host model data.
     * @return   bool      True on success, false on failure.
     */
    public function update_host_model($id, $data) {
        global $wpdb;
        
        $table = $this->get_table_name('host_models');
        
        $result = $wpdb->update(
            $table,
            $data,
            array('id' => $id)
        );
        
        return $result !== false;
    }
    
    /**
     * Delete host model
     *
     * @since    1.0.0
     * @param    int       $id       Host model ID.
     * @return   bool      True on success, false on failure.
     */
    public function delete_host_model($id) {
        global $wpdb;
        
        $table = $this->get_table_name('host_models');
        
        $result = $wpdb->update(
            $table,
            array('status' => 'trash'),
            array('id' => $id)
        );
        
        return $result !== false;
    }
    
    /**
     * Get parts for a model
     *
     * @since    1.0.0
     * @param    string    $model          Model number.
     * @param    int       $product_line_id Product line ID.
     * @return   array     The parts data.
     */
    public function get_parts_by_model($model, $product_line_id) {
        global $wpdb;
        
        $table = $this->get_table_name('parts');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE model = %s 
            AND product_line_id = %d 
            AND status = 'publish'
            ORDER BY part_number ASC
        ", $model, $product_line_id), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get accessories for a model
     *
     * @since    1.0.0
     * @param    string    $model          Model number.
     * @param    int       $product_line_id Product line ID.
     * @return   array     The accessories data.
     */
    public function get_accessories_by_model($model, $product_line_id) {
        global $wpdb;
        
        $table = $this->get_table_name('accessories');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE model = %s 
            AND product_line_id = %d 
            AND status = 'publish'
            ORDER BY part_number ASC
        ", $model, $product_line_id), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get consumables for a model
     *
     * @since    1.0.0
     * @param    string    $model          Model number.
     * @param    int       $product_line_id Product line ID.
     * @return   array     The consumables data.
     */
    public function get_consumables_by_model($model, $product_line_id) {
        global $wpdb;
        
        $table = $this->get_table_name('consumables');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE model = %s 
            AND product_line_id = %d 
            AND status = 'publish'
            ORDER BY part_number ASC
        ", $model, $product_line_id), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get spare parts for a model
     *
     * @since    1.0.0
     * @param    string    $model          Model number.
     * @param    int       $product_line_id Product line ID.
     * @return   array     The spare parts data.
     */
    public function get_spare_parts_by_model($model, $product_line_id) {
        global $wpdb;
        
        $table = $this->get_table_name('spare_parts');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE FIND_IN_SET(%s, app_model) > 0
            AND product_line_id = %d 
            AND status = 'publish'
            ORDER BY part_number ASC
        ", $model, $product_line_id), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get relations by parent part number
     *
     * @since    1.0.0
     * @param    string    $part_number    Parent part number.
     * @param    int       $product_line_id Product line ID.
     * @return   array     The relations data.
     */
    public function get_relations_by_parent($part_number, $product_line_id) {
        global $wpdb;
        
        $table = $this->get_table_name('relations');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE parent_part_number = %s 
            AND product_line_id = %d 
            AND status = 'publish'
            ORDER BY level ASC, sort_order ASC
        ", $part_number, $product_line_id), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get prices for a target
     *
     * @since    1.0.0
     * @param    string    $target_type    Target type.
     * @param    int       $target_id      Target ID.
     * @param    int       $product_line_id Product line ID.
     * @param    string    $region         Region.
     * @return   array     The prices data.
     */
    public function get_prices($target_type, $target_id, $product_line_id, $region = 'CN') {
        global $wpdb;
        
        $table = $this->get_table_name('prices');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE target_type = %s 
            AND target_id = %d 
            AND product_line_id = %d 
            AND region = %s
            AND status = 'active'
            ORDER BY min_quantity ASC
        ", $target_type, $target_id, $product_line_id, $region), ARRAY_A);
        
        return $results;
    }
    
    /**
     * Get inventory for a target
     *
     * @since    1.0.0
     * @param    string    $target_type    Target type.
     * @param    int       $target_id      Target ID.
     * @param    int       $product_line_id Product line ID.
     * @param    string    $region         Region.
     * @return   array     The inventory data.
     */
    public function get_inventory($target_type, $target_id, $product_line_id, $region = 'CN') {
        global $wpdb;
        
        $table = $this->get_table_name('inventory');
        
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT * 
            FROM {$table} 
            WHERE target_type = %s 
            AND target_id = %d 
            AND product_line_id = %d 
            AND region = %s
            AND status = 'active'
        ", $target_type, $target_id, $product_line_id, $region), ARRAY_A);
        
        return $results;
    }

    /**
     * 获取配件列表
     *
     * @since    1.0.0
     * @param    array    $args    查询参数
     * @return   array    配件列表和总数
     */
    public function get_accessories($args = array()) {
        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'status' => 'publish',
            'host_model_id' => 0,
            'orderby' => 'sort_order',
            'order' => 'ASC',
        );

        $args = wp_parse_args($args, $defaults);
        $table_name = $this->prefix . 'accessories';
        
        // 构建查询条件
        $where = "WHERE 1=1";
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $where .= $this->db->prepare(" AND status = %s", $args['status']);
        }
        
        if (!empty($args['host_model_id'])) {
            $where .= $this->db->prepare(" AND FIND_IN_SET(%d, compatible_host_models)", $args['host_model_id']);
        }
        
        // 计算分页
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        // 获取总数
        $count_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $this->db->get_var($count_query);
        
        // 获取数据
        $items_query = "SELECT * FROM $table_name $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $this->db->prepare($items_query, $args['per_page'], $offset);
        $items = $this->db->get_results($query, ARRAY_A);
        
        return array(
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $args['page'],
            'per_page' => (int) $args['per_page'],
            'total_pages' => ceil($total / $args['per_page']),
        );
    }

    /**
     * 获取单个配件详情
     *
     * @since    1.0.0
     * @param    int      $id    配件ID
     * @return   array    配件详情
     */
    public function get_accessory($id) {
        $table_name = $this->prefix . 'accessories';
        $query = $this->db->prepare("SELECT * FROM $table_name WHERE id = %d", $id);
        return $this->db->get_row($query, ARRAY_A);
    }

    /**
     * 获取耗材列表
     *
     * @since    1.0.0
     * @param    array    $args    查询参数
     * @return   array    耗材列表和总数
     */
    public function get_consumables($args = array()) {
        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'status' => 'publish',
            'host_model_id' => 0,
            'orderby' => 'id',
            'order' => 'DESC',
        );

        $args = wp_parse_args($args, $defaults);
        $table_name = $this->prefix . 'consumables';
        
        // 构建查询条件
        $where = "WHERE 1=1";
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $where .= $this->db->prepare(" AND status = %s", $args['status']);
        }
        
        if (!empty($args['host_model_id'])) {
            $where .= $this->db->prepare(" AND FIND_IN_SET(%d, application_models)", $args['host_model_id']);
        }
        
        // 计算分页
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        // 获取总数
        $count_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $this->db->get_var($count_query);
        
        // 获取数据
        $items_query = "SELECT * FROM $table_name $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $this->db->prepare($items_query, $args['per_page'], $offset);
        $items = $this->db->get_results($query, ARRAY_A);
        
        return array(
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $args['page'],
            'per_page' => (int) $args['per_page'],
            'total_pages' => ceil($total / $args['per_page']),
        );
    }

    /**
     * 获取单个耗材详情
     *
     * @since    1.0.0
     * @param    int      $id    耗材ID
     * @return   array    耗材详情
     */
    public function get_consumable($id) {
        $table_name = $this->prefix . 'consumables';
        $query = $this->db->prepare("SELECT * FROM $table_name WHERE id = %d", $id);
        return $this->db->get_row($query, ARRAY_A);
    }

    /**
     * 获取零部件列表
     *
     * @since    1.0.0
     * @param    array    $args    查询参数
     * @return   array    零部件列表和总数
     */
    public function get_spare_parts($args = array()) {
        $defaults = array(
            'page' => 1,
            'per_page' => 10,
            'status' => 'publish',
            'host_model_id' => 0,
            'orderby' => 'id',
            'order' => 'DESC',
        );

        $args = wp_parse_args($args, $defaults);
        $table_name = $this->prefix . 'spare_parts';
        
        // 构建查询条件
        $where = "WHERE 1=1";
        if (!empty($args['status']) && $args['status'] !== 'all') {
            $where .= $this->db->prepare(" AND status = %s", $args['status']);
        }
        
        if (!empty($args['host_model_id'])) {
            $where .= $this->db->prepare(" AND FIND_IN_SET(%d, application_models)", $args['host_model_id']);
        }
        
        // 计算分页
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        // 获取总数
        $count_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $this->db->get_var($count_query);
        
        // 获取数据
        $items_query = "SELECT * FROM $table_name $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $this->db->prepare($items_query, $args['per_page'], $offset);
        $items = $this->db->get_results($query, ARRAY_A);
        
        return array(
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $args['page'],
            'per_page' => (int) $args['per_page'],
            'total_pages' => ceil($total / $args['per_page']),
        );
    }

    /**
     * 获取单个零部件详情
     *
     * @since    1.0.0
     * @param    int      $id    零部件ID
     * @return   array    零部件详情
     */
    public function get_spare_part($id) {
        $table_name = $this->prefix . 'spare_parts';
        $query = $this->db->prepare("SELECT * FROM $table_name WHERE id = %d", $id);
        return $this->db->get_row($query, ARRAY_A);
    }
} 