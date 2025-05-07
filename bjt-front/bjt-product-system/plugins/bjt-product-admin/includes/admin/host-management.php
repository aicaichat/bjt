<?php
/**
 * Host Model Management
 * 
 * Handles host model meta boxes and saving data.
 */

if (!defined('ABSPATH')) { exit; }

/**
 * Register meta boxes for host models
 */
function bjt_register_host_meta_boxes() {
    add_meta_box(
        'bjt-host-details',
        __('Host Model Details', 'bjt-product-admin'),
        'bjt_host_details_meta_box',
        'bjt_host',
        'normal',
        'high'
    );
    
    add_meta_box(
        'bjt-host-parts',
        __('Associated Part Numbers', 'bjt-product-admin'),
        'bjt_host_parts_meta_box',
        'bjt_host',
        'normal',
        'default'
    );
}
add_action('add_meta_boxes_bjt_host', 'bjt_register_host_meta_boxes');

/**
 * Host details meta box callback
 */
function bjt_host_details_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('bjt_save_host_meta', 'bjt_host_meta_nonce');
    
    // Get current values
    $host_status = get_post_meta($post->ID, '_bjt_host_status', true);
    $host_model_code = get_post_meta($post->ID, '_bjt_host_model_code', true);
    $host_sort_order = get_post_meta($post->ID, '_bjt_host_sort_order', true);
    
    // If status is not set, default to offline
    if (empty($host_status)) {
        $host_status = 'offline';
    }
    
    // If sort order is not set, default to 0
    if (empty($host_sort_order)) {
        $host_sort_order = 0;
    }
    ?>
    
    <div class="bjt-meta-field">
        <label for="bjt_host_model_code"><?php esc_html_e('Model Code', 'bjt-product-admin'); ?></label>
        <input type="text" id="bjt_host_model_code" name="bjt_host_model_code" value="<?php echo esc_attr($host_model_code); ?>" class="regular-text">
        <p class="description"><?php esc_html_e('Enter the unique model code for this host.', 'bjt-product-admin'); ?></p>
    </div>
    
    <div class="bjt-meta-field">
        <label for="bjt_host_status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></label>
        <select id="bjt_host_status" name="bjt_host_status">
            <option value="online" <?php selected($host_status, 'online'); ?>><?php esc_html_e('Online', 'bjt-product-admin'); ?></option>
            <option value="offline" <?php selected($host_status, 'offline'); ?>><?php esc_html_e('Offline', 'bjt-product-admin'); ?></option>
        </select>
        <p class="description"><?php esc_html_e('Set whether this host model is online (visible to customers) or offline.', 'bjt-product-admin'); ?></p>
    </div>
    
    <div class="bjt-meta-field">
        <label for="bjt_host_sort_order"><?php esc_html_e('Sort Order', 'bjt-product-admin'); ?></label>
        <input type="number" id="bjt_host_sort_order" name="bjt_host_sort_order" value="<?php echo esc_attr($host_sort_order); ?>" class="small-text" min="0" step="1">
        <p class="description"><?php esc_html_e('Enter a number to determine the order in which this host model appears (lower numbers appear first).', 'bjt-product-admin'); ?></p>
    </div>
    <?php
}

/**
 * Host parts meta box callback
 */
function bjt_host_parts_meta_box($post) {
    global $wpdb;
    
    // Get associated parts
    $associated_parts = $wpdb->get_col($wpdb->prepare(
        "SELECT part_id FROM {$wpdb->prefix}bjt_host_parts WHERE host_id = %d",
        $post->ID
    ));
    
    // Get all parts
    $all_parts = get_posts(array(
        'post_type' => 'bjt_part',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ));
    
    // If we have no parts, show a message
    if (empty($all_parts)) {
        echo '<p>' . esc_html__('No part numbers have been created yet.', 'bjt-product-admin') . '</p>';
        echo '<a href="' . esc_url(admin_url('post-new.php?post_type=bjt_part')) . '" class="button">' . 
             esc_html__('Create New Part Number', 'bjt-product-admin') . '</a>';
        return;
    }
    ?>
    
    <div class="bjt-host-parts-container">
        <p><?php esc_html_e('Select the part numbers associated with this host model:', 'bjt-product-admin'); ?></p>
        
        <div class="bjt-host-parts-list">
            <?php foreach ($all_parts as $part) : ?>
                <label class="bjt-part-checkbox">
                    <input type="checkbox" name="bjt_host_parts[]" value="<?php echo esc_attr($part->ID); ?>"
                           <?php checked(in_array($part->ID, $associated_parts)); ?>>
                    <?php echo esc_html($part->post_title); ?>
                </label>
            <?php endforeach; ?>
        </div>
    </div>
    
    <style>
        .bjt-host-parts-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            margin-top: 10px;
        }
        
        .bjt-part-checkbox {
            display: block;
            margin-bottom: 8px;
        }
        
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
 * Save host meta data
 */
function bjt_save_host_meta($post_id) {
    // Check if our nonce is set
    if (!isset($_POST['bjt_host_meta_nonce'])) {
        return;
    }
    
    // Verify the nonce
    if (!wp_verify_nonce($_POST['bjt_host_meta_nonce'], 'bjt_save_host_meta')) {
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
    
    // Update host model code
    if (isset($_POST['bjt_host_model_code'])) {
        update_post_meta($post_id, '_bjt_host_model_code', sanitize_text_field($_POST['bjt_host_model_code']));
    }
    
    // Update host status
    if (isset($_POST['bjt_host_status'])) {
        $status = sanitize_text_field($_POST['bjt_host_status']);
        if (!in_array($status, array('online', 'offline'))) {
            $status = 'offline';
        }
        update_post_meta($post_id, '_bjt_host_status', $status);
    }
    
    // Update sort order
    if (isset($_POST['bjt_host_sort_order'])) {
        update_post_meta($post_id, '_bjt_host_sort_order', absint($_POST['bjt_host_sort_order']));
    }
    
    // Update associated parts
    global $wpdb;
    
    // First, delete all existing associations for this host
    $wpdb->delete(
        $wpdb->prefix . 'bjt_host_parts',
        array('host_id' => $post_id),
        array('%d')
    );
    
    // Then, add the new associations
    if (isset($_POST['bjt_host_parts']) && is_array($_POST['bjt_host_parts'])) {
        foreach ($_POST['bjt_host_parts'] as $part_id) {
            $part_id = absint($part_id);
            if ($part_id > 0) {
                $wpdb->insert(
                    $wpdb->prefix . 'bjt_host_parts',
                    array(
                        'host_id' => $post_id,
                        'part_id' => $part_id,
                        'created_at' => current_time('mysql')
                    ),
                    array('%d', '%d', '%s')
                );
                
                // Also update the part meta
                update_post_meta($part_id, '_bjt_host_id', $post_id);
            }
        }
    }
    
    // Add to recent activity
    $post = get_post($post_id);
    $activity = array(
        'time' => current_time('mysql'),
        'text' => sprintf(
            __('Host model "%s" updated', 'bjt-product-admin'),
            $post->post_title
        )
    );
    
    $recent_activity = get_option('bjt_recent_activity', array());
    array_unshift($recent_activity, $activity);
    $recent_activity = array_slice($recent_activity, 0, 20); // Keep only the most recent 20 activities
    update_option('bjt_recent_activity', $recent_activity);
}
add_action('save_post_bjt_host', 'bjt_save_host_meta');

class BJT_Host_Management {
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
        add_action('wp_ajax_save_host', array($this, 'save_host'));
        add_action('wp_ajax_bjt_upload_host_image', array($this, 'upload_host_image'));
    }

    public function save_host() {
        check_ajax_referer('bjt_product_admin_nonce', 'nonce');

        $host_id = isset($_POST['host_id']) ? intval($_POST['host_id']) : 0;
        $title_cn = isset($_POST['title_cn']) ? sanitize_text_field($_POST['title_cn']) : '';
        $title_en = isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '';
        $description_cn = isset($_POST['description_cn']) ? wp_kses_post($_POST['description_cn']) : '';
        $description_en = isset($_POST['description_en']) ? wp_kses_post($_POST['description_en']) : '';
        $specifications = isset($_POST['specifications']) ? $_POST['specifications'] : array();
        $features = isset($_POST['features']) ? $_POST['features'] : array();
        $product_line_id = isset($_POST['product_line_id']) ? intval($_POST['product_line_id']) : 0;

        if ($host_id) {
            // Update existing host
            $post_data = array(
                'ID' => $host_id,
                'post_title' => $title_cn,
                'post_content' => $description_cn,
                'post_status' => 'publish',
                'post_type' => 'product'
            );

            wp_update_post($post_data);

            // Update meta data
            update_post_meta($host_id, 'title_en', $title_en);
            update_post_meta($host_id, 'description_en', $description_en);
            update_post_meta($host_id, 'specifications', $specifications);
            update_post_meta($host_id, 'features', $features);
            update_post_meta($host_id, 'product_line_id', $product_line_id);

            wp_send_json_success(array(
                'message' => __('Host machine updated successfully.', 'bjt-product-admin')
            ));
        } else {
            // Create new host
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
                update_post_meta($new_id, 'features', $features);
                update_post_meta($new_id, 'product_line_id', $product_line_id);

                wp_send_json_success(array(
                    'message' => __('Host machine created successfully.', 'bjt-product-admin'),
                    'id' => $new_id
                ));
            } else {
                wp_send_json_error(array(
                    'message' => __('Failed to create host machine.', 'bjt-product-admin')
                ));
            }
        }
    }

    public function upload_host_image() {
        check_ajax_referer('bjt_product_admin_nonce', 'nonce');

        // 检查文件是否存在
        if (empty($_FILES)) {
            wp_send_json_error(array('message' => 'No files were uploaded.'));
            return;
        }
        
        // 日志记录 - 调试用
        error_log('Upload request received. FILES: ' . print_r($_FILES, true));
        
        // 获取上传的文件，尝试不同的键名
        $uploadedfile = null;
        if (isset($_FILES['file'])) {
            $uploadedfile = $_FILES['file'];
        } elseif (isset($_FILES['async-upload'])) {
            $uploadedfile = $_FILES['async-upload'];
        } elseif (!empty($_FILES)) {
            // 使用第一个可用的文件
            reset($_FILES);
            $first_key = key($_FILES);
            $uploadedfile = $_FILES[$first_key];
        }
        
        if (!$uploadedfile) {
            wp_send_json_error(array('message' => 'No valid file found in request.'));
            return;
        }

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $upload_overrides = array('test_form' => false);
        $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

        if ($movefile && !isset($movefile['error'])) {
            $attachment = array(
                'post_mime_type' => $movefile['type'],
                'post_title' => sanitize_file_name($uploadedfile['name']),
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
            } else {
                wp_send_json_error(array('message' => $attach_id->get_error_message()));
            }
        } else {
            $error_msg = isset($movefile['error']) ? $movefile['error'] : __('Failed to upload image.', 'bjt-product-admin');
            wp_send_json_error(array('message' => $error_msg));
        }
    }

    public function get_host($id) {
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
            'features' => get_post_meta($post->ID, 'features', true),
            'product_line_id' => get_post_meta($post->ID, 'product_line_id', true),
            'image' => get_post_thumbnail_id($post->ID)
        );
    }

    public function get_hosts_by_product_line($product_line_id) {
        $args = array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'meta_query' => array(
                array(
                    'key' => 'product_line_id',
                    'value' => $product_line_id,
                    'compare' => '='
                )
            ),
            'orderby' => 'menu_order',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $hosts = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $hosts[] = $this->get_host(get_the_ID());
            }
        }

        wp_reset_postdata();
        return $hosts;
    }
}

// Initialize the class
BJT_Host_Management::get_instance(); 