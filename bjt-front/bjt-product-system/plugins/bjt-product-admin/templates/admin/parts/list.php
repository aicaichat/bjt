<?php
if (!defined('ABSPATH')) {
    exit;
}

// Get parts management instance
$parts_manager = BJT_Part_Management::get_instance();

// Get current filters
$current_type = isset($_GET['part_type']) ? sanitize_text_field($_GET['part_type']) : '';
$current_number = isset($_GET['part_number']) ? sanitize_text_field($_GET['part_number']) : '';

// Get parts
$parts = $parts_manager->get_parts_by_filters($current_type, $current_number);

// Handle messages
$message = isset($_GET['message']) ? intval($_GET['message']) : 0;
$messages = array(
    1 => __('Part saved successfully.', 'bjt-product-admin'),
    2 => __('Part deleted successfully.', 'bjt-product-admin'),
    3 => __('Part status updated successfully.', 'bjt-product-admin'),
);
?>

<div class="wrap">
    <h1 class="wp-heading-inline"><?php _e('Parts Management', 'bjt-product-admin'); ?></h1>
    <a href="<?php echo admin_url('admin.php?page=bjt-parts&action=new'); ?>" class="page-title-action">
        <?php _e('Add New Part', 'bjt-product-admin'); ?>
    </a>
    <hr class="wp-header-end">

    <?php if ($message && isset($messages[$message])) : ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo esc_html($messages[$message]); ?></p>
        </div>
    <?php endif; ?>

    <!-- Filters -->
    <div class="tablenav top">
        <div class="alignleft actions">
            <form method="get" class="filter-form">
                <input type="hidden" name="page" value="bjt-parts">
                
                <select name="part_type" id="filter-part-type">
                    <option value=""><?php _e('All Types', 'bjt-product-admin'); ?></option>
                    <option value="accessory" <?php selected($current_type, 'accessory'); ?>>
                        <?php _e('Accessories', 'bjt-product-admin'); ?>
                    </option>
                    <option value="consumable" <?php selected($current_type, 'consumable'); ?>>
                        <?php _e('Consumables', 'bjt-product-admin'); ?>
                    </option>
                </select>

                <input type="text" name="part_number" id="filter-part-number" 
                       value="<?php echo esc_attr($current_number); ?>" 
                       placeholder="<?php _e('Part Number', 'bjt-product-admin'); ?>">

                <input type="submit" class="button" value="<?php _e('Filter', 'bjt-product-admin'); ?>">
                <a href="<?php echo admin_url('admin.php?page=bjt-parts'); ?>" class="button">
                    <?php _e('Reset', 'bjt-product-admin'); ?>
                </a>
            </form>
        </div>

        <div class="alignright">
            <button type="button" class="button" id="export-parts">
                <?php _e('Export', 'bjt-product-admin'); ?>
            </button>
            <label class="button">
                <?php _e('Import', 'bjt-product-admin'); ?>
                <input type="file" id="import-parts" style="display: none;" accept=".csv,.xlsx">
            </label>
        </div>
        <br class="clear">
    </div>

    <!-- Parts Table -->
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th scope="col" class="manage-column column-part-number">
                    <?php _e('Part Number', 'bjt-product-admin'); ?>
                </th>
                <th scope="col" class="manage-column column-title">
                    <?php _e('Title', 'bjt-product-admin'); ?>
                </th>
                <th scope="col" class="manage-column column-type">
                    <?php _e('Type', 'bjt-product-admin'); ?>
                </th>
                <th scope="col" class="manage-column column-host">
                    <?php _e('Associated Host', 'bjt-product-admin'); ?>
                </th>
                <th scope="col" class="manage-column column-status">
                    <?php _e('Status', 'bjt-product-admin'); ?>
                </th>
                <th scope="col" class="manage-column column-actions">
                    <?php _e('Actions', 'bjt-product-admin'); ?>
                </th>
            </tr>
        </thead>

        <tbody>
            <?php if (empty($parts)) : ?>
                <tr>
                    <td colspan="6"><?php _e('No parts found.', 'bjt-product-admin'); ?></td>
                </tr>
            <?php else : ?>
                <?php foreach ($parts as $part) : 
                    $host = $part['host_id'] ? $parts_manager->get_host($part['host_id']) : null;
                    ?>
                    <tr>
                        <td><?php echo esc_html($part['part_number']); ?></td>
                        <td>
                            <?php echo esc_html($part['title_cn']); ?>
                            <br>
                            <small><?php echo esc_html($part['title_en']); ?></small>
                        </td>
                        <td><?php echo esc_html(ucfirst($part['part_type'])); ?></td>
                        <td>
                            <?php if ($host) : ?>
                                <?php echo esc_html($host['title_cn']); ?>
                                <br>
                                <small><?php echo esc_html($host['title_en']); ?></small>
                            <?php else : ?>
                                <?php _e('None', 'bjt-product-admin'); ?>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="status-dot status-<?php echo $part['status']; ?>"></span>
                            <?php echo $part['status'] === 'active' ? 
                                __('Active', 'bjt-product-admin') : 
                                __('Inactive', 'bjt-product-admin'); ?>
                        </td>
                        <td class="actions">
                            <a href="<?php echo admin_url('admin.php?page=bjt-parts&action=edit&id=' . $part['id']); ?>" 
                               class="button button-small">
                                <?php _e('Edit', 'bjt-product-admin'); ?>
                            </a>
                            <button type="button" class="button button-small toggle-status" 
                                    data-id="<?php echo $part['id']; ?>" 
                                    data-status="<?php echo $part['status']; ?>">
                                <?php echo $part['status'] === 'active' ? 
                                    __('Deactivate', 'bjt-product-admin') : 
                                    __('Activate', 'bjt-product-admin'); ?>
                            </button>
                            <button type="button" class="button button-small button-link-delete delete-part" 
                                    data-id="<?php echo $part['id']; ?>">
                                <?php _e('Delete', 'bjt-product-admin'); ?>
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<style>
.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
}
.status-active {
    background-color: #46b450;
}
.status-inactive {
    background-color: #dc3232;
}
.actions {
    display: flex;
    gap: 5px;
}
.filter-form {
    display: flex;
    gap: 10px;
    align-items: center;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Toggle status
    $('.toggle-status').on('click', function() {
        const button = $(this);
        const partId = button.data('id');
        const currentStatus = button.data('status');
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        if (confirm(currentStatus === 'active' ? 
            '<?php _e("Are you sure you want to deactivate this part?", "bjt-product-admin"); ?>' : 
            '<?php _e("Are you sure you want to activate this part?", "bjt-product-admin"); ?>')) {
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_toggle_part_status',
                    part_id: partId,
                    status: newStatus,
                    nonce: '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        window.location.href = '<?php echo admin_url('admin.php?page=bjt-parts&message=3'); ?>';
                    } else {
                        alert(response.data.message);
                    }
                }
            });
        }
    });

    // Delete part
    $('.delete-part').on('click', function() {
        const partId = $(this).data('id');
        
        if (confirm('<?php _e("Are you sure you want to delete this part? This action cannot be undone.", "bjt-product-admin"); ?>')) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_delete_part',
                    part_id: partId,
                    nonce: '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        window.location.href = '<?php echo admin_url('admin.php?page=bjt-parts&message=2'); ?>';
                    } else {
                        alert(response.data.message);
                    }
                }
            });
        }
    });

    // Export parts
    $('#export-parts').on('click', function() {
        window.location.href = ajaxurl + '?' + $.param({
            action: 'bjt_export_parts',
            part_type: $('#filter-part-type').val(),
            part_number: $('#filter-part-number').val(),
            nonce: '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>'
        });
    });

    // Import parts
    $('#import-parts').on('change', function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('action', 'bjt_import_parts');
        formData.append('file', file);
        formData.append('nonce', '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>');

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.location.reload();
                } else {
                    alert(response.data.message);
                }
            }
        });
    });
});
</script> 