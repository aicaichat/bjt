<?php
/**
 * Part Number Management
 * 
 * Handles part number meta boxes and saving data.
 */

if (!defined('ABSPATH')) { exit; }

/**
 * Register meta boxes for part numbers
 */
function bjt_register_part_meta_boxes() {
    add_meta_box(
        'bjt-part-details',
        __('Part Number Details', 'bjt-product-admin'),
        'bjt_part_details_meta_box',
        'bjt_part',
        'normal',
        'high'
    );
    
    add_meta_box(
        'bjt-part-host-association',
        __('Host Model Association', 'bjt-product-admin'),
        'bjt_part_host_association_meta_box',
        'bjt_part',
        'normal',
        'default'
    );
}
add_action('add_meta_boxes_bjt_part', 'bjt_register_part_meta_boxes');

/**
 * Part details meta box callback
 */
function bjt_part_details_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('bjt_save_part_meta', 'bjt_part_meta_nonce');
    
    // Get current values
    $part_number = get_post_meta($post->ID, '_bjt_part_number', true);
    $part_description_en = get_post_meta($post->ID, '_bjt_part_description_en', true);
    $part_description_zh = get_post_meta($post->ID, '_bjt_part_description_zh', true);
    ?>
    
    <div class="bjt-meta-field">
        <label for="bjt_part_number"><?php esc_html_e('Part Number', 'bjt-product-admin'); ?></label>
        <input type="text" id="bjt_part_number" name="bjt_part_number" value="<?php echo esc_attr($part_number); ?>" class="regular-text">
        <p class="description"><?php esc_html_e('Enter the unique part number.', 'bjt-product-admin'); ?></p>
    </div>
    
    <div class="bjt-meta-field">
        <label for="bjt_part_description_en"><?php esc_html_e('Description (English)', 'bjt-product-admin'); ?></label>
        <textarea id="bjt_part_description_en" name="bjt_part_description_en" rows="3" class="large-text"><?php echo esc_textarea($part_description_en); ?></textarea>
    </div>
    
    <div class="bjt-meta-field">
        <label for="bjt_part_description_zh"><?php esc_html_e('Description (Chinese)', 'bjt-product-admin'); ?></label>
        <textarea id="bjt_part_description_zh" name="bjt_part_description_zh" rows="3" class="large-text"><?php echo esc_textarea($part_description_zh); ?></textarea>
    </div>
    
    <style>
        .bjt-meta-field {
            margin-bottom: 15px;
        }
        
        .bjt-meta-field label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
    <?php
}

/**
 * Part host association meta box callback
 */
function bjt_part_host_association_meta_box($post) {
    // Get current associated host
    $host_id = get_post_meta($post->ID, '_bjt_host_id', true);
    
    // Get all hosts
    $all_hosts = get_posts(array(
        'post_type' => 'bjt_host',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ));
    
    // If we have no hosts, show a message
    if (empty($all_hosts)) {
        echo '<p>' . esc_html__('No host models have been created yet.', 'bjt-product-admin') . '</p>';
        echo '<a href="' . esc_url(admin_url('post-new.php?post_type=bjt_host')) . '" class="button">' . 
             esc_html__('Create New Host Model', 'bjt-product-admin') . '</a>';
        return;
    }
    ?>
    
    <div class="bjt-part-host-container">
        <p><?php esc_html_e('Select the host model this part number is associated with:', 'bjt-product-admin'); ?></p>
        
        <select name="bjt_host_id" id="bjt_host_id" class="regular-text">
            <option value=""><?php esc_html_e('-- Select Host Model --', 'bjt-product-admin'); ?></option>
            <?php foreach ($all_hosts as $host) : ?>
                <option value="<?php echo esc_attr($host->ID); ?>" <?php selected($host_id, $host->ID); ?>>
                    <?php echo esc_html($host->post_title); ?>
                    <?php 
                    $host_model_code = get_post_meta($host->ID, '_bjt_host_model_code', true);
                    if (!empty($host_model_code)) {
                        echo ' (' . esc_html($host_model_code) . ')';
                    }
                    ?>
                </option>
            <?php endforeach; ?>
        </select>
        
        <p class="description"><?php esc_html_e('The host model this part number belongs to.', 'bjt-product-admin'); ?></p>
    </div>
    <?php
}

/**
 * Save part meta data
 */
function bjt_save_part_meta($post_id) {
    // Check if our nonce is set
    if (!isset($_POST['bjt_part_meta_nonce'])) {
        return;
    }
    
    // Verify the nonce
    if (!wp_verify_nonce($_POST['bjt_part_meta_nonce'], 'bjt_save_part_meta')) {
        return;
    }
    
    // If this is an autosave, we don't want to do anything
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // Check the user's permissions
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Update part number
    if (isset($_POST['bjt_part_number'])) {
        update_post_meta($post_id, '_bjt_part_number', sanitize_text_field($_POST['bjt_part_number']));
    }
    
    // Update part descriptions
    if (isset($_POST['bjt_part_description_en'])) {
        update_post_meta($post_id, '_bjt_part_description_en', sanitize_textarea_field($_POST['bjt_part_description_en']));
    }
    
    if (isset($_POST['bjt_part_description_zh'])) {
        update_post_meta($post_id, '_bjt_part_description_zh', sanitize_textarea_field($_POST['bjt_part_description_zh']));
    }
    
    // Update host association
    if (isset($_POST['bjt_host_id'])) {
        $host_id = absint($_POST['bjt_host_id']);
        
        // Get previous host ID
        $prev_host_id = get_post_meta($post_id, '_bjt_host_id', true);
        
        // Update post meta with new host ID
        update_post_meta($post_id, '_bjt_host_id', $host_id);
        
        // Update host-part relationship in database
        global $wpdb;
        
        // If there was a previous host, remove the association
        if (!empty($prev_host_id)) {
            $wpdb->delete(
                $wpdb->prefix . 'bjt_host_parts',
                array(
                    'host_id' => $prev_host_id,
                    'part_id' => $post_id
                ),
                array('%d', '%d')
            );
        }
        
        // If there's a new host, add the association
        if ($host_id > 0) {
            // Check if relationship already exists
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}bjt_host_parts WHERE host_id = %d AND part_id = %d",
                $host_id, $post_id
            ));
            
            if (!$existing) {
                $wpdb->insert(
                    $wpdb->prefix . 'bjt_host_parts',
                    array(
                        'host_id' => $host_id,
                        'part_id' => $post_id,
                        'created_at' => current_time('mysql')
                    ),
                    array('%d', '%d', '%s')
                );
            }
        }
    }
    
    // Add to recent activity
    $post = get_post($post_id);
    $activity = array(
        'time' => current_time('mysql'),
        'text' => sprintf(
            __('Part number "%s" updated', 'bjt-product-admin'),
            $post->post_title
        )
    );
    
    $recent_activity = get_option('bjt_recent_activity', array());
    array_unshift($recent_activity, $activity);
    $recent_activity = array_slice($recent_activity, 0, 20); // Keep only the most recent 20 activities
    update_option('bjt_recent_activity', $recent_activity);
}
add_action('save_post_bjt_part', 'bjt_save_part_meta');

class BJT_Part_Management {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_init', array($this, 'init'));
    }

    public function init() {
        // Add necessary hooks
        add_action('wp_ajax_save_part', array($this, 'save_part'));
        add_action('wp_ajax_upload_part_image', array($this, 'upload_part_image'));
    }

    public function save_part() {
        check_ajax_referer('bjt_product_admin_nonce', 'nonce');

        $part_id = isset($_POST['part_id']) ? intval($_POST['part_id']) : 0;
        $title_cn = isset($_POST['title_cn']) ? sanitize_text_field($_POST['title_cn']) : '';
        $title_en = isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '';
        $description_cn = isset($_POST['description_cn']) ? wp_kses_post($_POST['description_cn']) : '';
        $description_en = isset($_POST['description_en']) ? wp_kses_post($_POST['description_en']) : '';
        $specifications = isset($_POST['specifications']) ? $_POST['specifications'] : array();
        $part_type = isset($_POST['part_type']) ? sanitize_text_field($_POST['part_type']) : '';
        $host_id = isset($_POST['host_id']) ? intval($_POST['host_id']) : 0;

        if ($part_id) {
            // Update existing part
            $post_data = array(
                'ID' => $part_id,
                'post_title' => $title_cn,
                'post_content' => $description_cn,
                'post_status' => 'publish',
                'post_type' => 'product'
            );

            wp_update_post($post_data);

            // Update meta data
            update_post_meta($part_id, 'title_en', $title_en);
            update_post_meta($part_id, 'description_en', $description_en);
            update_post_meta($part_id, 'specifications', $specifications);
            update_post_meta($part_id, 'part_type', $part_type);
            update_post_meta($part_id, 'host_id', $host_id);

            wp_send_json_success(array(
                'message' => __('Part updated successfully.', 'bjt-product-admin')
            ));
        } else {
            // Create new part
            $post_data = array(
                'post_title' => $title_cn,
                'post_content' => $description_cn,
                'post_status' => 'publish',
                'post_type' => 'product'
            );

            $new_id = wp_insert_post($post_data);

            if ($new_id) {
                update_post_meta($new_id, 'title_en', $title_en);
                update_post_meta($new_id, 'description_en', $description_en);
                update_post_meta($new_id, 'specifications', $specifications);
                update_post_meta($new_id, 'part_type', $part_type);
                update_post_meta($new_id, 'host_id', $host_id);

                wp_send_json_success(array(
                    'message' => __('Part created successfully.', 'bjt-product-admin'),
                    'id' => $new_id
                ));
            } else {
                wp_send_json_error(array(
                    'message' => __('Failed to create part.', 'bjt-product-admin')
                ));
            }
        }
    }

    public function upload_part_image() {
        check_ajax_referer('bjt_product_admin_nonce', 'nonce');

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $uploadedfile = $_FILES['file'];
        $upload_overrides = array('test_form' => false);
        $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

        if ($movefile && !isset($movefile['error'])) {
            $attachment = array(
                'post_mime_type' => $movefile['type'],
                'post_title' => sanitize_file_name($_FILES['file']['name']),
                'post_content' => '',
                'post_status' => 'inherit'
            );

            $attach_id = wp_insert_attachment($attachment, $movefile['file']);

            if (!is_wp_error($attach_id)) {
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);

                wp_send_json_success(array(
                    'url' => $movefile['url'],
                    'id' => $attach_id
                ));
            }
        }

        wp_send_json_error(array(
            'message' => isset($movefile['error']) ? $movefile['error'] : __('Failed to upload image.', 'bjt-product-admin')
        ));
    }

    public function get_part($id) {
        $post = get_post($id);
        if (!$post || $post->post_type !== 'product') {
            return false;
        }

        return array(
            'id' => $post->ID,
            'title_cn' => $post->post_title,
            'title_en' => get_post_meta($post->ID, 'title_en', true),
            'description_cn' => $post->post_content,
            'description_en' => get_post_meta($post->ID, 'description_en', true),
            'specifications' => get_post_meta($post->ID, 'specifications', true),
            'part_type' => get_post_meta($post->ID, 'part_type', true),
            'host_id' => get_post_meta($post->ID, 'host_id', true),
            'image' => get_post_thumbnail_id($post->ID)
        );
    }

    public function get_parts_by_host($host_id, $part_type = '') {
        $args = array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key' => 'host_id',
                    'value' => $host_id,
                    'compare' => '='
                )
            ),
            'orderby' => 'menu_order',
            'order' => 'ASC'
        );

        if (!empty($part_type)) {
            $args['meta_query'][] = array(
                'key' => 'part_type',
                'value' => $part_type,
                'compare' => '='
            );
        }

        $query = new WP_Query($args);
        $parts = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $parts[] = $this->get_part(get_the_ID());
            }
        }

        wp_reset_postdata();
        return $parts;
    }

    public function get_parts_by_product_line($product_line_id, $part_type = '') {
        $hosts = BJT_Host_Management::get_instance()->get_hosts_by_product_line($product_line_id);
        $parts = array();

        foreach ($hosts as $host) {
            $host_parts = $this->get_parts_by_host($host['id'], $part_type);
            $parts = array_merge($parts, $host_parts);
        }

        return $parts;
    }
}

// Initialize the class
BJT_Part_Management::get_instance(); 