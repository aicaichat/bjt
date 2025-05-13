<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register product meta boxes
 */
function bjt_register_product_meta_boxes() {
    add_meta_box(
        'bjt_product_details',
        __('Product Details', 'bjt-product-admin'),
        'bjt_product_details_meta_box',
        'product',
        'normal',
        'high'
    );

    add_meta_box(
        'bjt_product_features',
        __('Product Features', 'bjt-product-admin'),
        'bjt_product_features_meta_box',
        'product',
        'normal',
        'high'
    );

    add_meta_box(
        'bjt_product_specifications',
        __('Product Specifications', 'bjt-product-admin'),
        'bjt_product_specifications_meta_box',
        'product',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'bjt_register_product_meta_boxes');

/**
 * Product details meta box callback
 */
function bjt_product_details_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('bjt_product_details', 'bjt_product_details_nonce');

    // Get saved values
    $product_code = get_post_meta($post->ID, '_bjt_product_code', true);
    $product_line_id = get_post_meta($post->ID, '_bjt_product_line_id', true);
    $status = get_post_meta($post->ID, '_bjt_product_status', true);
    $sort_order = get_post_meta($post->ID, '_bjt_product_sort_order', true);

    // Get product lines
    $product_lines = get_posts(array(
        'post_type' => 'product_line',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ));
    ?>
    <div class="bjt-meta-box">
        <p>
            <label for="bjt_product_code"><?php _e('Product Code:', 'bjt-product-admin'); ?></label>
            <input type="text" id="bjt_product_code" name="bjt_product_code" value="<?php echo esc_attr($product_code); ?>" class="widefat">
        </p>
        <p>
            <label for="bjt_product_line_id"><?php _e('Product Line:', 'bjt-product-admin'); ?></label>
            <select id="bjt_product_line_id" name="bjt_product_line_id" class="widefat">
                <option value=""><?php _e('Select a product line', 'bjt-product-admin'); ?></option>
                <?php foreach ($product_lines as $line) : ?>
                    <option value="<?php echo $line->ID; ?>" <?php selected($product_line_id, $line->ID); ?>>
                        <?php echo esc_html($line->post_title); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </p>
        <p>
            <label for="bjt_product_status"><?php _e('Status:', 'bjt-product-admin'); ?></label>
            <select id="bjt_product_status" name="bjt_product_status" class="widefat">
                <option value="active" <?php selected($status, 'active'); ?>><?php _e('Active', 'bjt-product-admin'); ?></option>
                <option value="inactive" <?php selected($status, 'inactive'); ?>><?php _e('Inactive', 'bjt-product-admin'); ?></option>
            </select>
        </p>
        <p>
            <label for="bjt_product_sort_order"><?php _e('Sort Order:', 'bjt-product-admin'); ?></label>
            <input type="number" id="bjt_product_sort_order" name="bjt_product_sort_order" value="<?php echo esc_attr($sort_order); ?>" class="widefat">
        </p>
    </div>
    <?php
}

/**
 * Product features meta box callback
 */
function bjt_product_features_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('bjt_product_features', 'bjt_product_features_nonce');

    // Get saved features
    $features = get_post_meta($post->ID, '_bjt_product_features', true);
    if (!is_array($features)) {
        $features = array();
    }
    ?>
    <div class="bjt-meta-box">
        <div id="bjt-features-container">
            <?php foreach ($features as $index => $feature) : ?>
                <div class="bjt-feature-item">
                    <p>
                        <label><?php _e('Title (English):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_features[<?php echo $index; ?>][title_en]" value="<?php echo esc_attr($feature['title_en']); ?>" class="widefat">
                    </p>
                    <p>
                        <label><?php _e('Title (Chinese):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_features[<?php echo $index; ?>][title_zh]" value="<?php echo esc_attr($feature['title_zh']); ?>" class="widefat">
                    </p>
                    <p>
                        <label><?php _e('Description (English):', 'bjt-product-admin'); ?></label>
                        <textarea name="bjt_features[<?php echo $index; ?>][description_en]" class="widefat" rows="3"><?php echo esc_textarea($feature['description_en']); ?></textarea>
                    </p>
                    <p>
                        <label><?php _e('Description (Chinese):', 'bjt-product-admin'); ?></label>
                        <textarea name="bjt_features[<?php echo $index; ?>][description_zh]" class="widefat" rows="3"><?php echo esc_textarea($feature['description_zh']); ?></textarea>
                    </p>
                    <p>
                        <label><?php _e('Image:', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_features[<?php echo $index; ?>][image_url]" value="<?php echo esc_attr($feature['image_url']); ?>" class="widefat">
                        <button type="button" class="button bjt-upload-image" data-index="<?php echo $index; ?>">
                            <?php _e('Upload Image', 'bjt-product-admin'); ?>
                        </button>
                    </p>
                    <p>
                        <button type="button" class="button bjt-remove-feature"><?php _e('Remove Feature', 'bjt-product-admin'); ?></button>
                    </p>
                </div>
            <?php endforeach; ?>
        </div>
        <p>
            <button type="button" class="button" id="bjt-add-feature"><?php _e('Add Feature', 'bjt-product-admin'); ?></button>
        </p>
    </div>
    <?php
}

/**
 * Product specifications meta box callback
 */
function bjt_product_specifications_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('bjt_product_specifications', 'bjt_product_specifications_nonce');

    // Get saved specifications
    $specifications = get_post_meta($post->ID, '_bjt_product_specifications', true);
    if (!is_array($specifications)) {
        $specifications = array();
    }
    ?>
    <div class="bjt-meta-box">
        <div id="bjt-specifications-container">
            <?php foreach ($specifications as $index => $spec) : ?>
                <div class="bjt-specification-item">
                    <p>
                        <label><?php _e('Name (English):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_specifications[<?php echo $index; ?>][name_en]" value="<?php echo esc_attr($spec['name_en']); ?>" class="widefat">
                    </p>
                    <p>
                        <label><?php _e('Name (Chinese):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_specifications[<?php echo $index; ?>][name_zh]" value="<?php echo esc_attr($spec['name_zh']); ?>" class="widefat">
                    </p>
                    <p>
                        <label><?php _e('Value (English):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_specifications[<?php echo $index; ?>][value_en]" value="<?php echo esc_attr($spec['value_en']); ?>" class="widefat">
                    </p>
                    <p>
                        <label><?php _e('Value (Chinese):', 'bjt-product-admin'); ?></label>
                        <input type="text" name="bjt_specifications[<?php echo $index; ?>][value_zh]" value="<?php echo esc_attr($spec['value_zh']); ?>" class="widefat">
                    </p>
                    <p>
                        <button type="button" class="button bjt-remove-specification"><?php _e('Remove Specification', 'bjt-product-admin'); ?></button>
                    </p>
                </div>
            <?php endforeach; ?>
        </div>
        <p>
            <button type="button" class="button" id="bjt-add-specification"><?php _e('Add Specification', 'bjt-product-admin'); ?></button>
        </p>
    </div>
    <?php
}

/**
 * Save product meta data
 */
function bjt_save_product_meta($post_id) {
    // Check if our nonce is set
    if (!isset($_POST['bjt_product_details_nonce']) || 
        !isset($_POST['bjt_product_features_nonce']) || 
        !isset($_POST['bjt_product_specifications_nonce'])) {
        return;
    }

    // Verify the nonce
    if (!wp_verify_nonce($_POST['bjt_product_details_nonce'], 'bjt_product_details') ||
        !wp_verify_nonce($_POST['bjt_product_features_nonce'], 'bjt_product_features') ||
        !wp_verify_nonce($_POST['bjt_product_specifications_nonce'], 'bjt_product_specifications')) {
        return;
    }

    // If this is an autosave, don't do anything
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    // Check the user's permissions
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    // Save product details
    $fields = array(
        'bjt_product_code',
        'bjt_product_line_id',
        'bjt_product_status',
        'bjt_product_sort_order'
    );

    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
        }
    }

    // Save features
    if (isset($_POST['bjt_features'])) {
        $features = array();
        foreach ($_POST['bjt_features'] as $feature) {
            if (!empty($feature['title_en']) || !empty($feature['title_zh'])) {
                $features[] = array(
                    'title_en' => sanitize_text_field($feature['title_en']),
                    'title_zh' => sanitize_text_field($feature['title_zh']),
                    'description_en' => wp_kses_post($feature['description_en']),
                    'description_zh' => wp_kses_post($feature['description_zh']),
                    'image_url' => esc_url_raw($feature['image_url'])
                );
            }
        }
        update_post_meta($post_id, '_bjt_product_features', $features);
    }

    // Save specifications
    if (isset($_POST['bjt_specifications'])) {
        $specifications = array();
        foreach ($_POST['bjt_specifications'] as $spec) {
            if (!empty($spec['name_en']) || !empty($spec['name_zh'])) {
                $specifications[] = array(
                    'name_en' => sanitize_text_field($spec['name_en']),
                    'name_zh' => sanitize_text_field($spec['name_zh']),
                    'value_en' => sanitize_text_field($spec['value_en']),
                    'value_zh' => sanitize_text_field($spec['value_zh'])
                );
            }
        }
        update_post_meta($post_id, '_bjt_product_specifications', $specifications);
    }
}
add_action('save_post_product', 'bjt_save_product_meta');

/**
 * Enqueue admin scripts for product management
 */
function bjt_admin_product_scripts($hook) {
    global $post_type;
    
    if ('product' !== $post_type) {
        return;
    }

    wp_enqueue_media();
    wp_enqueue_script(
        'bjt-product-admin',
        BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/product-admin.js',
        array('jquery'),
        BJT_PRODUCT_ADMIN_VERSION,
        true
    );
}
add_action('admin_enqueue_scripts', 'bjt_admin_product_scripts');

class BJT_Product_Management {
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
        add_action('wp_ajax_save_product_line', array($this, 'save_product_line'));
        add_action('wp_ajax_upload_product_image', array($this, 'upload_product_image'));
    }

    public function save_product_line() {
        check_ajax_referer('bjt_product_admin_nonce', 'nonce');

        $product_line_id = isset($_POST['product_line_id']) ? intval($_POST['product_line_id']) : 0;
        $title_cn = isset($_POST['title_cn']) ? sanitize_text_field($_POST['title_cn']) : '';
        $title_en = isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '';
        $description_cn = isset($_POST['description_cn']) ? wp_kses_post($_POST['description_cn']) : '';
        $description_en = isset($_POST['description_en']) ? wp_kses_post($_POST['description_en']) : '';
        $subitems = isset($_POST['subitems']) ? $_POST['subitems'] : array();

        if ($product_line_id) {
            // Update existing product line
            $post_data = array(
                'ID' => $product_line_id,
                'post_title' => $title_cn,
                'post_content' => $description_cn,
                'post_status' => 'publish',
                'post_type' => 'product_line'
            );

            wp_update_post($post_data);

            // Update meta data
            update_post_meta($product_line_id, 'title_en', $title_en);
            update_post_meta($product_line_id, 'description_en', $description_en);
            update_post_meta($product_line_id, 'subitems', $subitems);

            wp_send_json_success(array(
                'message' => __('Product line updated successfully.', 'bjt-product-admin')
            ));
        } else {
            // Create new product line
            $post_data = array(
                'post_title' => $title_cn,
                'post_content' => $description_cn,
                'post_status' => 'publish',
                'post_type' => 'product_line'
            );

            $new_id = wp_insert_post($post_data);

            if ($new_id) {
                update_post_meta($new_id, 'title_en', $title_en);
                update_post_meta($new_id, 'description_en', $description_en);
                update_post_meta($new_id, 'subitems', $subitems);

                wp_send_json_success(array(
                    'message' => __('Product line created successfully.', 'bjt-product-admin'),
                    'id' => $new_id
                ));
            } else {
                wp_send_json_error(array(
                    'message' => __('Failed to create product line.', 'bjt-product-admin')
                ));
            }
        }
    }

    public function upload_product_image() {
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

    public function get_product_line($id) {
        $post = get_post($id);
        if (!$post || $post->post_type !== 'product_line') {
            return false;
        }

        return array(
            'id' => $post->ID,
            'title_cn' => $post->post_title,
            'title_en' => get_post_meta($post->ID, 'title_en', true),
            'description_cn' => $post->post_content,
            'description_en' => get_post_meta($post->ID, 'description_en', true),
            'subitems' => get_post_meta($post->ID, 'subitems', true),
            'image' => get_post_thumbnail_id($post->ID)
        );
    }

    public function get_all_product_lines() {
        $args = array(
            'post_type' => 'product_line',
            'posts_per_page' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        );

        $query = new WP_Query($args);
        $product_lines = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $product_lines[] = $this->get_product_line(get_the_ID());
            }
        }

        wp_reset_postdata();
        return $product_lines;
    }
}

// Initialize the class
BJT_Product_Management::get_instance(); 