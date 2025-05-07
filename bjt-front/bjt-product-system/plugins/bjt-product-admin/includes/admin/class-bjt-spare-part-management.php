<?php
/**
 * BJT Spare Part Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Spare_Part_Management {
    /**
     * The single instance of the class
     */
    private static $instance = null;

    /**
     * Main Instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    public function __construct() {
        // Initialize
    }

    /**
     * Create database tables
     */
    public function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Spare parts table
        $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_spare_parts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            part_number varchar(100) NOT NULL,
            name_cn varchar(255) NOT NULL,
            name_en varchar(255) NOT NULL,
            description_cn text,
            description_en text,
            package_size varchar(100),
            package_weight decimal(10,2),
            image_url varchar(255),
            status varchar(20) DEFAULT 'publish',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Get spare part by ID
     */
    public function get_spare_part($id) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bjt_spare_parts WHERE id = %d",
                $id
            ),
            ARRAY_A
        );
    }

    /**
     * Get spare parts list
     */
    public function get_spare_parts($args = array()) {
        global $wpdb;

        $defaults = array(
            'part_number' => '',
            'status' => 'publish',
            'orderby' => 'id',
            'order' => 'DESC',
            'limit' => 20,
            'offset' => 0
        );

        $args = wp_parse_args($args, $defaults);
        $where = array('1=1');
        $values = array();

        if (!empty($args['part_number'])) {
            $where[] = 'part_number LIKE %s';
            $values[] = '%' . $wpdb->esc_like($args['part_number']) . '%';
        }

        if (!empty($args['status'])) {
            $where[] = 'status = %s';
            $values[] = $args['status'];
        }

        $sql = "SELECT * FROM {$wpdb->prefix}bjt_spare_parts WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY {$args['orderby']} {$args['order']}";
        $sql .= " LIMIT %d OFFSET %d";
        $values[] = $args['limit'];
        $values[] = $args['offset'];

        return $wpdb->get_results($wpdb->prepare($sql, $values), ARRAY_A);
    }

    /**
     * Add spare part
     */
    public function add_spare_part($data) {
        global $wpdb;

        $defaults = array(
            'status' => 'publish',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

        $data = wp_parse_args($data, $defaults);
        
        return $wpdb->insert(
            $wpdb->prefix . 'bjt_spare_parts',
            $data,
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%s', '%s', '%s')
        );
    }

    /**
     * Update spare part
     */
    public function update_spare_part($id, $data) {
        global $wpdb;

        $data['updated_at'] = current_time('mysql');
        
        return $wpdb->update(
            $wpdb->prefix . 'bjt_spare_parts',
            $data,
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%s', '%s'),
            array('%d')
        );
    }

    /**
     * Delete spare part
     */
    public function delete_spare_part($id) {
        global $wpdb;
        return $wpdb->delete(
            $wpdb->prefix . 'bjt_spare_parts',
            array('id' => $id),
            array('%d')
        );
    }
} 