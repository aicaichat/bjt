<?php
/**
 * BJT Consumable Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Consumable_Management {
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

        // Consumables table
        $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_consumables (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL,
            brand varchar(100) DEFAULT NULL,
            part_number varchar(100) NOT NULL,
            name_cn varchar(255) NOT NULL,
            name_en varchar(255) NOT NULL,
            package_size varchar(100) DEFAULT NULL,
            package_weight decimal(10,2) DEFAULT NULL,
            pallet_size varchar(100) DEFAULT NULL,
            pcs_per_pallet_1 int(11) DEFAULT NULL,
            pallet_height_1 decimal(10,2) DEFAULT NULL,
            pcs_per_pallet_2 int(11) DEFAULT NULL,
            pallet_height_2 decimal(10,2) DEFAULT NULL,
            pcs_per_pallet_3 int(11) DEFAULT NULL,
            pallet_height_3 decimal(10,2) DEFAULT NULL,
            app_model varchar(255) DEFAULT NULL,
            pak_shape varchar(100) DEFAULT NULL,
            material varchar(100) DEFAULT NULL,
            thickness_met decimal(10,2) DEFAULT NULL,
            thickness_imp decimal(10,2) DEFAULT NULL,
            gram_met decimal(10,2) DEFAULT NULL,
            gram_imp decimal(10,2) DEFAULT NULL,
            pcs_width_met decimal(10,2) DEFAULT NULL,
            pcs_width_imp decimal(10,2) DEFAULT NULL,
            pcs_length_met decimal(10,2) DEFAULT NULL,
            pcs_length_imp decimal(10,2) DEFAULT NULL,
            total_length_met decimal(10,2) DEFAULT NULL,
            total_length_imp decimal(10,2) DEFAULT NULL,
            inner_diameter decimal(10,2) DEFAULT NULL,
            roll_diameter decimal(10,2) DEFAULT NULL,
            image_url varchar(255) DEFAULT NULL,
            status varchar(20) DEFAULT 'publish',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number),
            KEY model (model),
            KEY status (status)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Get consumable by ID
     */
    public function get_consumable($id) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bjt_consumables WHERE id = %d",
                $id
            ),
            ARRAY_A
        );
    }

    /**
     * Get consumables list
     */
    public function get_consumables($args = array()) {
        global $wpdb;

        $defaults = array(
            'model' => '',
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

        if (!empty($args['model'])) {
            $where[] = 'model = %s';
            $values[] = $args['model'];
        }

        if (!empty($args['part_number'])) {
            $where[] = 'part_number LIKE %s';
            $values[] = '%' . $wpdb->esc_like($args['part_number']) . '%';
        }

        if (!empty($args['status'])) {
            $where[] = 'status = %s';
            $values[] = $args['status'];
        }

        $sql = "SELECT * FROM {$wpdb->prefix}bjt_consumables WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY {$args['orderby']} {$args['order']}";
        $sql .= " LIMIT %d OFFSET %d";
        $values[] = $args['limit'];
        $values[] = $args['offset'];

        return $wpdb->get_results($wpdb->prepare($sql, $values), ARRAY_A);
    }

    /**
     * Add consumable
     */
    public function add_consumable($data) {
        global $wpdb;

        $defaults = array(
            'status' => 'publish',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

        $data = wp_parse_args($data, $defaults);
        
        return $wpdb->insert(
            $wpdb->prefix . 'bjt_consumables',
            $data,
            array('%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%d', '%f', '%d', '%f', '%d', '%f', '%s', '%s', '%s', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%s', '%s', '%s', '%s')
        );
    }

    /**
     * Update consumable
     */
    public function update_consumable($id, $data) {
        global $wpdb;

        $data['updated_at'] = current_time('mysql');
        
        return $wpdb->update(
            $wpdb->prefix . 'bjt_consumables',
            $data,
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%d', '%f', '%d', '%f', '%d', '%f', '%s', '%s', '%s', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%f', '%s', '%s', '%s'),
            array('%d')
        );
    }

    /**
     * Delete consumable
     */
    public function delete_consumable($id) {
        global $wpdb;
        return $wpdb->delete(
            $wpdb->prefix . 'bjt_consumables',
            array('id' => $id),
            array('%d')
        );
    }
} 