<?php
/**
 * Host form template
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Get host data if editing
$host_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$host = array();

if ($host_id > 0) {
    global $wpdb;
    $tables = bjt_get_tables();
    $host = $wpdb->get_row("SELECT * FROM {$tables['hosts']} WHERE id = $host_id", ARRAY_A);
}

// Define default values
$model = isset($host['model']) ? esc_attr($host['model']) : '';
$status = isset($host['status']) ? esc_attr($host['status']) : 'publish';
$menu_order = isset($host['menu_order']) ? intval($host['menu_order']) : 0;

// Define supported languages
$languages = array(
    'zh' => array('name' => '中文', 'flag' => '🇨🇳', 'placeholder_prefix' => '请输入'),
    'en' => array('name' => 'English', 'flag' => '🇬🇧', 'placeholder_prefix' => 'Enter')
);

// CSS for language tabs
?>
<style>
    .bjt-form-container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .language-tabs {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 20px;
        border-bottom: 1px solid #ddd;
    }
    .language-tab {
        padding: 10px 15px;
        cursor: pointer;
        background: #f1f1f1;
        margin-right: 5px;
        border: 1px solid #ddd;
        border-bottom: none;
        border-radius: 5px 5px 0 0;
    }
    .language-tab.active {
        background: #fff;
        border-bottom: 1px solid #fff;
        margin-bottom: -1px;
        font-weight: bold;
    }
    .language-content {
        display: none;
        padding: 20px;
        border: 1px solid #ddd;
        border-top: none;
        margin-bottom: 20px;
    }
    .language-content.active {
        display: block;
    }
    .form-row {
        margin-bottom: 15px;
    }
    .form-row label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    .form-row input[type="text"],
    .form-row textarea {
        width: 100%;
        padding: 8px;
    }
    .media-preview {
        max-width: 150px;
        max-height: 150px;
        margin-top: 10px;
    }
    .required {
        color: red;
    }
    .form-section {
        margin-bottom: 30px;
        padding: 20px;
        background: #f9f9f9;
        border: 1px solid #eee;
        border-radius: 5px;
    }
    .form-section h3 {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }
</style>

<div class="wrap bjt-form-container">
    <h1><?php echo $host_id > 0 ? __('Edit Host', 'bjt-product-admin') : __('Add New Host', 'bjt-product-admin'); ?></h1>

    <form id="bjt-host-form" method="post">
        <?php wp_nonce_field('bjt_host_nonce', 'bjt_host_nonce'); ?>
        <input type="hidden" name="host_id" value="<?php echo $host_id; ?>">
        
        <div class="form-section">
            <h3><?php _e('Basic Information', 'bjt-product-admin'); ?></h3>
            <div class="form-row">
                <label for="model"><?php _e('Model', 'bjt-product-admin'); ?> <span class="required">*</span></label>
                <input type="text" id="model" name="model" value="<?php echo $model; ?>" required>
                <p class="description"><?php _e('Model number or code for this host', 'bjt-product-admin'); ?></p>
            </div>
        </div>

        <!-- Language Tabs -->
        <div class="form-section">
            <h3><?php _e('Language Information', 'bjt-product-admin'); ?></h3>
            
            <div class="language-tabs">
                <?php 
                $active_class = 'active';
                foreach ($languages as $code => $name): 
                ?>
                    <div class="language-tab <?php echo $code === 'zh' ? $active_class : ''; ?>" data-lang="<?php echo $code; ?>">
                        <?php echo $name['name']; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php foreach ($languages as $code => $name): 
                $title_field = "title_$code";
                $description_field = "description_$code";
                
                $title_value = isset($host[$title_field]) ? esc_attr($host[$title_field]) : '';
                $description_value = isset($host[$description_field]) ? esc_textarea($host[$description_field]) : '';
                
                $required = $code === 'zh' ? 'required' : '';
                $required_mark = $code === 'zh' ? '<span class="required">*</span>' : '';
            ?>
            <div class="language-content <?php echo $code === 'zh' ? 'active' : ''; ?>" data-lang="<?php echo $code; ?>" id="language-<?php echo $code; ?>">
                <h4><?php echo sprintf(__('%s Content', 'bjt-product-admin'), $name['name']); ?></h4>
                
                <div class="form-row">
                    <label for="name_<?php echo $code; ?>"><?php _e('Name', 'bjt-product-admin'); ?> <?php echo $required_mark; ?></label>
                    <input type="text" id="name_<?php echo $code; ?>" name="name_<?php echo $code; ?>" value="<?php echo $title_value; ?>" <?php echo $required; ?>>
                </div>
                
                <div class="form-row">
                    <label for="description_<?php echo $code; ?>"><?php _e('Description', 'bjt-product-admin'); ?></label>
                    <textarea id="description_<?php echo $code; ?>" name="description_<?php echo $code; ?>" rows="5"><?php echo $description_value; ?></textarea>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        
        <!-- Specifications and Features (currently only support Chinese and English) -->
        <div class="form-section">
            <h3><?php _e('Technical Information', 'bjt-product-admin'); ?></h3>
            
            <div class="form-row">
                <label for="specifications_zh"><?php _e('Specifications (Chinese)', 'bjt-product-admin'); ?></label>
                <textarea id="specifications_zh" name="specifications_zh" rows="5"><?php echo isset($host['specifications_zh']) ? esc_textarea($host['specifications_zh']) : ''; ?></textarea>
            </div>
            
            <div class="form-row">
                <label for="specifications_en"><?php _e('Specifications (English)', 'bjt-product-admin'); ?></label>
                <textarea id="specifications_en" name="specifications_en" rows="5"><?php echo isset($host['specifications_en']) ? esc_textarea($host['specifications_en']) : ''; ?></textarea>
            </div>
            
            <div class="form-row">
                <label for="features_zh"><?php _e('Features (Chinese)', 'bjt-product-admin'); ?></label>
                <textarea id="features_zh" name="features_zh" rows="5"><?php echo isset($host['features_zh']) ? esc_textarea($host['features_zh']) : ''; ?></textarea>
            </div>
            
            <div class="form-row">
                <label for="features_en"><?php _e('Features (English)', 'bjt-product-admin'); ?></label>
                <textarea id="features_en" name="features_en" rows="5"><?php echo isset($host['features_en']) ? esc_textarea($host['features_en']) : ''; ?></textarea>
            </div>
        </div>
        
        <!-- Media Section -->
        <div class="form-section">
            <h3><?php _e('Media', 'bjt-product-admin'); ?></h3>
            
            <div class="form-row">
                <label for="image1_url"><?php _e('Main Image', 'bjt-product-admin'); ?></label>
                <input type="text" id="image1_url" name="image1_url" value="<?php echo isset($host['image1_url']) ? esc_url($host['image1_url']) : ''; ?>" class="media-input">
                <button type="button" class="button media-upload" data-target="image1_url"><?php _e('Select Image', 'bjt-product-admin'); ?></button>
                <?php if (!empty($host['image1_url'])): ?>
                <div class="media-preview-container">
                    <img src="<?php echo esc_url($host['image1_url']); ?>" class="media-preview">
                </div>
                <?php endif; ?>
            </div>
            
            <div class="form-row">
                <label for="image2_url"><?php _e('Secondary Image', 'bjt-product-admin'); ?></label>
                <input type="text" id="image2_url" name="image2_url" value="<?php echo isset($host['image2_url']) ? esc_url($host['image2_url']) : ''; ?>" class="media-input">
                <button type="button" class="button media-upload" data-target="image2_url"><?php _e('Select Image', 'bjt-product-admin'); ?></button>
                <?php if (!empty($host['image2_url'])): ?>
                <div class="media-preview-container">
                    <img src="<?php echo esc_url($host['image2_url']); ?>" class="media-preview">
                </div>
                <?php endif; ?>
            </div>
            
            <div class="form-row">
                <label for="explosion_diagram_pdf"><?php _e('Explosion Diagram (PDF)', 'bjt-product-admin'); ?></label>
                <input type="text" id="explosion_diagram_pdf" name="explosion_diagram_pdf" value="<?php echo isset($host['explosion_diagram_pdf']) ? esc_url($host['explosion_diagram_pdf']) : ''; ?>" class="media-input">
                <button type="button" class="button media-upload" data-target="explosion_diagram_pdf" data-type="application/pdf"><?php _e('Select PDF', 'bjt-product-admin'); ?></button>
                <?php if (!empty($host['explosion_diagram_pdf'])): ?>
                <div class="media-preview-container">
                    <a href="<?php echo esc_url($host['explosion_diagram_pdf']); ?>" target="_blank"><?php _e('View PDF', 'bjt-product-admin'); ?></a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Status Section -->
        <div class="form-section">
            <h3><?php _e('Status and Order', 'bjt-product-admin'); ?></h3>
            
            <div class="form-row">
                <label for="status"><?php _e('Status', 'bjt-product-admin'); ?></label>
                <select id="status" name="status">
                    <option value="publish" <?php selected($status, 'publish'); ?>><?php _e('Published', 'bjt-product-admin'); ?></option>
                    <option value="draft" <?php selected($status, 'draft'); ?>><?php _e('Draft', 'bjt-product-admin'); ?></option>
                </select>
            </div>
            
            <div class="form-row">
                <label for="menu_order"><?php _e('Menu Order', 'bjt-product-admin'); ?></label>
                <input type="number" id="menu_order" name="menu_order" value="<?php echo $menu_order; ?>" min="0">
                <p class="description"><?php _e('Lower numbers appear first', 'bjt-product-admin'); ?></p>
            </div>
        </div>
        
        <div class="form-row">
            <button type="submit" class="button button-primary" id="save-host"><?php _e('Save Host', 'bjt-product-admin'); ?></button>
            <a href="<?php echo admin_url('admin.php?page=bjt-product-admin-hosts'); ?>" class="button"><?php _e('Cancel', 'bjt-product-admin'); ?></a>
            <span class="spinner" style="float: none; margin-top: 0;"></span>
        </div>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Tab switching
    $('.language-tab').on('click', function() {
        var language = $(this).data('lang');
        
        // Update tabs
        $('.language-tab').removeClass('active');
        $(this).addClass('active');
        
        // Update content
        $('.language-content').removeClass('active');
        $('.language-content[data-lang="' + language + '"]').addClass('active');
    });
    
    // Media upload
    $('.media-upload').on('click', function(e) {
        e.preventDefault();
        
        var button = $(this);
        var targetInput = button.data('target');
        var mediaType = button.data('type') || '';
        
        var frame = wp.media({
            title: '<?php _e('Select or Upload Media', 'bjt-product-admin'); ?>',
            button: {
                text: '<?php _e('Use this media', 'bjt-product-admin'); ?>'
            },
            multiple: false
        });
        
        if (mediaType) {
            frame.on('open', function() {
                var library = frame.state().get('library');
                library.props.set('type', mediaType);
            });
        }
        
        frame.on('select', function() {
            var attachment = frame.state().get('selection').first().toJSON();
            $('#' + targetInput).val(attachment.url);
            
            // Update preview
            var container = $('#' + targetInput).closest('.form-row').find('.media-preview-container');
            
            if (attachment.type === 'image') {
                if (container.length === 0) {
                    $('#' + targetInput).after('<div class="media-preview-container"><img src="' + attachment.url + '" class="media-preview"></div>');
                } else {
                    container.html('<img src="' + attachment.url + '" class="media-preview">');
                }
            } else if (attachment.type === 'application/pdf') {
                if (container.length === 0) {
                    $('#' + targetInput).after('<div class="media-preview-container"><a href="' + attachment.url + '" target="_blank"><?php _e('View PDF', 'bjt-product-admin'); ?></a></div>');
                } else {
                    container.html('<a href="' + attachment.url + '" target="_blank"><?php _e('View PDF', 'bjt-product-admin'); ?></a>');
                }
            }
        });
        
        frame.open();
    });
    
    // Form submission
    $('#bjt-host-form').on('submit', function(e) {
        e.preventDefault();
        
        // Show spinner
        $(this).find('.spinner').addClass('is-active');
        
        // Disable submit button
        $('#save-host').prop('disabled', true);
        
        // Collect form data
        var formData = $(this).serialize();
        formData += '&action=bjt_save_host&security=' + $('#bjt_host_nonce').val();
        
        // Send AJAX request
        $.post(ajaxurl, formData, function(response) {
            if (response.success) {
                // Show success message
                alert(response.data.message);
                
                // Redirect to hosts list if adding new host
                if ($('#host_id').val() === '0') {
                    window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-admin-hosts'); ?>';
                } else {
                    // Reload the page to refresh data
                    window.location.reload();
                }
            } else {
                // Show error message
                alert(response.data.message);
                
                // Hide spinner
                $('.spinner').removeClass('is-active');
                
                // Enable submit button
                $('#save-host').prop('disabled', false);
            }
        });
    });
});
</script> 