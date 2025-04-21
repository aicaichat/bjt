<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Line_Management {
    private static $instance = null;
    private $table_name;

    private function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_product_lines';
        
        // Register AJAX handlers
        add_action('wp_ajax_save_product_line', array($this, 'save_product_line'));
        add_action('wp_ajax_upload_product_line_image', array($this, 'upload_product_line_image'));
        add_action('wp_ajax_bjt_save_product_line_page', array($this, 'save_product_line_page'));
        add_action('wp_ajax_get_product_line', array($this, 'get_product_line_ajax'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            title_cn varchar(255) NOT NULL,
            title_en varchar(255) NOT NULL,
            description_cn text,
            description_en text,
            subitem1_cn varchar(255),
            subitem1_en varchar(255),
            subitem2_cn varchar(255),
            subitem2_en varchar(255),
            image_id bigint(20),
            menu_order int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function get_product_line($line_id) {
        global $wpdb;
        
        $line = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_name} WHERE id = %d",
                $line_id
            ),
            ARRAY_A
        );
        
        if (!$line) {
            return array(
                'id' => 0,
                'title_cn' => '',
                'title_en' => '',
                'description_cn' => '',
                'description_en' => '',
                'subitem1_cn' => '',
                'subitem1_en' => '',
                'subitem2_cn' => '',
                'subitem2_en' => '',
                'image_id' => 0,
                'menu_order' => 0
            );
        }
        
        return $line;
    }

    public function save_product_line() {
        check_ajax_referer('bjt_product_line_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
            return;
        }
        
        $line_id = isset($_POST['line_id']) ? intval($_POST['line_id']) : 0;
        $data = array(
            'title_cn' => sanitize_text_field($_POST['title_cn']),
            'title_en' => sanitize_text_field($_POST['title_en']),
            'description_cn' => wp_kses_post($_POST['description_cn']),
            'description_en' => wp_kses_post($_POST['description_en']),
            'subitem1_cn' => sanitize_text_field($_POST['subitem1_cn']),
            'subitem1_en' => sanitize_text_field($_POST['subitem1_en']),
            'subitem2_cn' => sanitize_text_field($_POST['subitem2_cn']),
            'subitem2_en' => sanitize_text_field($_POST['subitem2_en']),
            'image_id' => intval($_POST['image_id']),
            'menu_order' => intval($_POST['menu_order'])
        );
        
        global $wpdb;
        
        if ($line_id > 0) {
            // Update existing product line
            $result = $wpdb->update(
                $this->table_name,
                $data,
                array('id' => $line_id),
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d'),
                array('%d')
            );
        } else {
            // Insert new product line
            $result = $wpdb->insert(
                $this->table_name,
                $data,
                array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d')
            );
            $line_id = $wpdb->insert_id;
        }
        
        if ($result === false) {
            wp_send_json_error(array('message' => 'Failed to save product line'));
            return;
        }
        
        wp_send_json_success(array(
            'message' => 'Product line saved successfully',
            'line_id' => $line_id
        ));
    }

    public function upload_product_line_image() {
        check_ajax_referer('bjt_product_line_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
            return;
        }
        
        if (!isset($_FILES['image'])) {
            wp_send_json_error(array('message' => 'No image file provided'));
            return;
        }
        
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        $attachment_id = media_handle_upload('image', 0);
        
        if (is_wp_error($attachment_id)) {
            wp_send_json_error(array('message' => $attachment_id->get_error_message()));
            return;
        }
        
        $image_url = wp_get_attachment_url($attachment_id);
        
        wp_send_json_success(array(
            'message' => 'Image uploaded successfully',
            'attachment_id' => $attachment_id,
            'image_url' => $image_url
        ));
    }

    public function get_all_product_lines() {
        global $wpdb;
        
        return $wpdb->get_results(
            "SELECT * FROM {$this->table_name} ORDER BY menu_order ASC",
            ARRAY_A
        );
    }

    /**
     * Save a product line via AJAX - for the page edit form
     */
    public function save_product_line_page() {
        // Check nonce for security
        check_ajax_referer( 'bjt_product_line_nonce', 'security' );

        // Check if user has capability
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'You do not have permission to perform this action.', 'bjt-product-admin' ) ) );
        }

        // Get form data
        $id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
        $title_cn = isset( $_POST['title_cn'] ) ? sanitize_text_field( $_POST['title_cn'] ) : '';
        $title_en = isset( $_POST['title_en'] ) ? sanitize_text_field( $_POST['title_en'] ) : '';
        $description = isset( $_POST['description'] ) ? wp_kses_post( $_POST['description'] ) : '';
        $image_id = isset( $_POST['image_id'] ) ? intval( $_POST['image_id'] ) : 0;
        $menu_order = isset( $_POST['menu_order'] ) ? intval( $_POST['menu_order'] ) : 0;
        $status = isset( $_POST['status'] ) ? sanitize_text_field( $_POST['status'] ) : 'publish';

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_product_lines';

        // Prepare data for database
        $data = array(
            'title_cn' => $title_cn,
            'title_en' => $title_en,
            'description' => $description,
            'image_id' => $image_id,
            'menu_order' => $menu_order,
            'status' => $status,
            'updated_at' => current_time( 'mysql' )
        );

        // Format for data types
        $formats = array( '%s', '%s', '%s', '%d', '%d', '%s', '%s' );

        // If ID exists, update; otherwise insert
        if ( $id > 0 ) {
            // Update existing product line
            $result = $wpdb->update(
                $table_name,
                $data,
                array( 'id' => $id ),
                $formats,
                array( '%d' )
            );

            if ( $result === false ) {
                wp_send_json_error( array( 'message' => __( 'Error updating product line.', 'bjt-product-admin' ) ) );
            } else {
                wp_send_json_success( array( 
                    'message' => __( 'Product line updated successfully.', 'bjt-product-admin' ),
                    'id' => $id
                ) );
            }
        } else {
            // Add created_at for new entries
            $data['created_at'] = current_time( 'mysql' );
            $formats[] = '%s';

            // Insert new product line
            $result = $wpdb->insert(
                $table_name,
                $data,
                $formats
            );

            if ( $result === false ) {
                wp_send_json_error( array( 'message' => __( 'Error creating product line.', 'bjt-product-admin' ) ) );
            } else {
                $new_id = $wpdb->insert_id;
                wp_send_json_success( array( 
                    'message' => __( 'Product line created successfully.', 'bjt-product-admin' ),
                    'id' => $new_id
                ) );
            }
        }
    }

    public function get_product_line_ajax() {
        check_ajax_referer('bjt_product_line_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Permission denied'));
            return;
        }
        
        $line_id = isset($_POST['line_id']) ? intval($_POST['line_id']) : 0;
        
        if ($line_id > 0) {
            $product_line = $this->get_product_line($line_id);
            wp_send_json_success($product_line);
        } else {
            wp_send_json_error(array('message' => 'Invalid line ID'));
        }
    }
}