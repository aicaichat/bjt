<?php
if (!defined('ABSPATH')) {
    exit;
}

$part_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$part = $part_id ? BJT_Part_Management::get_instance()->get_part($part_id) : null;
$is_new = !$part;

$title = $is_new ? __('Add New Part', 'bjt-product-admin') : __('Edit Part', 'bjt-product-admin');
?>

<div class="wrap">
    <h1 class="wp-heading-inline"><?php echo esc_html($title); ?></h1>
    <hr class="wp-header-end">

    <form id="part-form" method="post" enctype="multipart/form-data">
        <?php wp_nonce_field('bjt_product_admin_nonce'); ?>
        <input type="hidden" name="part_id" value="<?php echo $part_id; ?>">

        <div id="poststuff">
            <div id="post-body" class="metabox-holder columns-2">
                <div id="post-body-content">
                    <!-- Basic Information -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Basic Information', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <table class="form-table">
                                <tr>
                                    <th scope="row">
                                        <label for="part_number"><?php _e('Part Number', 'bjt-product-admin'); ?></label>
                                    </th>
                                    <td>
                                        <input type="text" id="part_number" name="part_number" class="regular-text" 
                                               value="<?php echo $part ? esc_attr($part['part_number']) : ''; ?>" required>
                                        <p class="description"><?php _e('Unique identifier for this part', 'bjt-product-admin'); ?></p>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <label for="title_cn"><?php _e('Name (Chinese)', 'bjt-product-admin'); ?></label>
                                    </th>
                                    <td>
                                        <input type="text" id="title_cn" name="title_cn" class="regular-text" 
                                               value="<?php echo $part ? esc_attr($part['title_cn']) : ''; ?>" required>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <label for="title_en"><?php _e('Name (English)', 'bjt-product-admin'); ?></label>
                                    </th>
                                    <td>
                                        <input type="text" id="title_en" name="title_en" class="regular-text" 
                                               value="<?php echo $part ? esc_attr($part['title_en']) : ''; ?>" required>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <label for="part_type"><?php _e('Part Type', 'bjt-product-admin'); ?></label>
                                    </th>
                                    <td>
                                        <select id="part_type" name="part_type" required>
                                            <option value="accessory" <?php selected($part && $part['part_type'] === 'accessory'); ?>>
                                                <?php _e('Accessory', 'bjt-product-admin'); ?>
                                            </option>
                                            <option value="consumable" <?php selected($part && $part['part_type'] === 'consumable'); ?>>
                                                <?php _e('Consumable', 'bjt-product-admin'); ?>
                                            </option>
                                        </select>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Description', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <h3><?php _e('Chinese Description', 'bjt-product-admin'); ?></h3>
                            <?php 
                            wp_editor(
                                $part ? $part['description_cn'] : '', 
                                'description_cn',
                                array(
                                    'media_buttons' => false,
                                    'textarea_rows' => 5,
                                    'teeny' => true
                                )
                            ); 
                            ?>

                            <h3 style="margin-top: 20px;"><?php _e('English Description', 'bjt-product-admin'); ?></h3>
                            <?php 
                            wp_editor(
                                $part ? $part['description_en'] : '', 
                                'description_en',
                                array(
                                    'media_buttons' => false,
                                    'textarea_rows' => 5,
                                    'teeny' => true
                                )
                            ); 
                            ?>
                        </div>
                    </div>

                    <!-- Specifications -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Specifications', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <div id="specifications-container">
                                <?php
                                $specifications = $part ? $part['specifications'] : array();
                                if (!empty($specifications)) {
                                    foreach ($specifications as $index => $spec) {
                                        ?>
                                        <div class="specification-row">
                                            <input type="text" name="specifications[<?php echo $index; ?>][name_cn]" 
                                                   value="<?php echo esc_attr($spec['name_cn']); ?>" 
                                                   placeholder="<?php _e('Name (Chinese)', 'bjt-product-admin'); ?>" class="medium-text">
                                            <input type="text" name="specifications[<?php echo $index; ?>][name_en]" 
                                                   value="<?php echo esc_attr($spec['name_en']); ?>" 
                                                   placeholder="<?php _e('Name (English)', 'bjt-product-admin'); ?>" class="medium-text">
                                            <input type="text" name="specifications[<?php echo $index; ?>][value_cn]" 
                                                   value="<?php echo esc_attr($spec['value_cn']); ?>" 
                                                   placeholder="<?php _e('Value (Chinese)', 'bjt-product-admin'); ?>" class="medium-text">
                                            <input type="text" name="specifications[<?php echo $index; ?>][value_en]" 
                                                   value="<?php echo esc_attr($spec['value_en']); ?>" 
                                                   placeholder="<?php _e('Value (English)', 'bjt-product-admin'); ?>" class="medium-text">
                                            <button type="button" class="button remove-specification"><?php _e('Remove', 'bjt-product-admin'); ?></button>
                                        </div>
                                        <?php
                                    }
                                }
                                ?>
                            </div>
                            <button type="button" class="button" id="add-specification">
                                <?php _e('Add Specification', 'bjt-product-admin'); ?>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="postbox-container-1" class="postbox-container">
                    <!-- Actions -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Actions', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <div class="submitbox">
                                <div id="major-publishing-actions">
                                    <div id="publishing-action">
                                        <button type="submit" class="button button-primary button-large">
                                            <?php echo $is_new ? __('Create', 'bjt-product-admin') : __('Update', 'bjt-product-admin'); ?>
                                        </button>
                                    </div>
                                    <div id="delete-action">
                                        <a href="<?php echo admin_url('admin.php?page=bjt-parts'); ?>" class="button button-large">
                                            <?php _e('Cancel', 'bjt-product-admin'); ?>
                                        </a>
                                    </div>
                                    <div class="clear"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Host Association -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Host Association', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <select name="host_id" id="host_id">
                                <option value=""><?php _e('-- Select Host --', 'bjt-product-admin'); ?></option>
                                <?php
                                $hosts = BJT_Host_Management::get_instance()->get_all_hosts();
                                foreach ($hosts as $host) {
                                    ?>
                                    <option value="<?php echo $host['id']; ?>" 
                                            <?php selected($part && $part['host_id'] == $host['id']); ?>>
                                        <?php echo esc_html($host['title_cn'] . ' / ' . $host['title_en']); ?>
                                    </option>
                                    <?php
                                }
                                ?>
                            </select>
                        </div>
                    </div>

                    <!-- Featured Image -->
                    <div class="postbox">
                        <h2 class="hndle"><span><?php _e('Featured Image', 'bjt-product-admin'); ?></span></h2>
                        <div class="inside">
                            <div id="part-image-container">
                                <?php if ($part && $part['image']) : ?>
                                    <img src="<?php echo wp_get_attachment_url($part['image']); ?>" style="max-width: 100%;">
                                <?php endif; ?>
                            </div>
                            <input type="hidden" name="part_image_id" id="part_image_id" 
                                   value="<?php echo $part ? $part['image'] : ''; ?>">
                            <button type="button" class="button" id="upload-part-image">
                                <?php _e('Upload Image', 'bjt-product-admin'); ?>
                            </button>
                            <button type="button" class="button" id="remove-part-image" 
                                    <?php echo (!$part || !$part['image']) ? 'style="display:none;"' : ''; ?>>
                                <?php _e('Remove Image', 'bjt-product-admin'); ?>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>

<style>
.specification-row {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
}
#major-publishing-actions {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #f5f5f5;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Add specification row
    $('#add-specification').on('click', function() {
        const index = $('.specification-row').length;
        const row = `
            <div class="specification-row">
                <input type="text" name="specifications[${index}][name_cn]" 
                       placeholder="<?php _e('Name (Chinese)', 'bjt-product-admin'); ?>" class="medium-text">
                <input type="text" name="specifications[${index}][name_en]" 
                       placeholder="<?php _e('Name (English)', 'bjt-product-admin'); ?>" class="medium-text">
                <input type="text" name="specifications[${index}][value_cn]" 
                       placeholder="<?php _e('Value (Chinese)', 'bjt-product-admin'); ?>" class="medium-text">
                <input type="text" name="specifications[${index}][value_en]" 
                       placeholder="<?php _e('Value (English)', 'bjt-product-admin'); ?>" class="medium-text">
                <button type="button" class="button remove-specification"><?php _e('Remove', 'bjt-product-admin'); ?></button>
            </div>
        `;
        $('#specifications-container').append(row);
    });

    // Remove specification row
    $(document).on('click', '.remove-specification', function() {
        $(this).closest('.specification-row').remove();
    });

    // Image upload
    let frame;
    $('#upload-part-image').on('click', function(e) {
        e.preventDefault();

        if (frame) {
            frame.open();
            return;
        }

        frame = wp.media({
            title: '<?php _e('Select or Upload Part Image', 'bjt-product-admin'); ?>',
            button: {
                text: '<?php _e('Use this image', 'bjt-product-admin'); ?>'
            },
            multiple: false
        });

        frame.on('select', function() {
            const attachment = frame.state().get('selection').first().toJSON();
            $('#part-image-container').html(`<img src="${attachment.url}" style="max-width: 100%;">`);
            $('#part_image_id').val(attachment.id);
            $('#remove-part-image').show();
        });

        frame.open();
    });

    // Remove image
    $('#remove-part-image').on('click', function() {
        $('#part-image-container').empty();
        $('#part_image_id').val('');
        $(this).hide();
    });

    // Form submission
    $('#part-form').on('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        formData.append('action', 'bjt_save_part');

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.location.href = '<?php echo admin_url('admin.php?page=bjt-parts&message=1'); ?>';
                } else {
                    alert(response.data.message);
                }
            }
        });
    });
});
</script> 