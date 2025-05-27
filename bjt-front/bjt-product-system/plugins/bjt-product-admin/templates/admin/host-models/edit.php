<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

$edit_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$is_edit = $edit_id > 0;
$page_title = $is_edit ? __('编辑主机型号', 'bjt-product-system') : __('添加主机型号', 'bjt-product-system');

// Get current language
$current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'zh';

// Initialize variables
$host_data = array(
    'id' => 0,
    'title' => array('zh' => '', 'en' => ''),
    'description' => array('zh' => '', 'en' => ''),
    'thumbnail' => '',
    'status' => 'draft',
    'sort_order' => 0,
    'product_line_id' => 0,
    'properties' => array(),
    'parts' => array()
);

if ($is_edit) {
    // Get host model data from API
    // This is a placeholder - in real implementation, you'd fetch the data from your API
    $host_data = apply_filters('bjt_get_host_model_data', $host_data, $edit_id);
}

// Get product lines for dropdown
$product_lines = array();
// This is a placeholder - in real implementation, you'd fetch the data from your API
$product_lines = apply_filters('bjt_get_product_lines', $product_lines);

?>

<div class="wrap bjt-admin-page bjt-host-model-edit">
    <h1 class="wp-heading-inline"><?php echo esc_html($page_title); ?></h1>
    
    <!-- Language Switcher -->
    <div class="bjt-language-tabs">
        <a href="?page=bjt-host-models&action=<?php echo $is_edit ? 'edit&id=' . $edit_id : 'add'; ?>&lang=zh" class="bjt-language-tab <?php echo $current_lang === 'zh' ? 'active' : ''; ?>">中文</a>
        <a href="?page=bjt-host-models&action=<?php echo $is_edit ? 'edit&id=' . $edit_id : 'add'; ?>&lang=en" class="bjt-language-tab <?php echo $current_lang === 'en' ? 'active' : ''; ?>">English</a>
    </div>
    
    <div class="bjt-card">
        <form id="bjt-host-model-form" method="post">
            <?php wp_nonce_field('bjt_save_host_model', 'bjt_host_model_nonce'); ?>
            <input type="hidden" name="id" value="<?php echo esc_attr($host_data['id']); ?>">
            <input type="hidden" name="action" value="bjt_save_host_model">
            <input type="hidden" name="current_lang" value="<?php echo esc_attr($current_lang); ?>">
            
            <!-- Basic Information Section -->
            <div class="bjt-form-section">
                <h2 class="bjt-section-title"><?php _e('基本信息', 'bjt-product-system'); ?></h2>
                
                <div class="bjt-form-row">
                    <div class="bjt-form-col">
                        <label for="host_title" class="bjt-required"><?php _e('标题', 'bjt-product-system'); ?></label>
                        <input type="text" id="host_title" name="title[<?php echo $current_lang; ?>]" value="<?php echo esc_attr($host_data['title'][$current_lang]); ?>" required>
                    </div>
                    
                    <div class="bjt-form-col">
                        <label for="product_line_id"><?php _e('所属产品线', 'bjt-product-system'); ?></label>
                        <select id="product_line_id" name="product_line_id">
                            <option value=""><?php _e('请选择产品线', 'bjt-product-system'); ?></option>
                            <?php foreach ($product_lines as $line) : ?>
                                <option value="<?php echo esc_attr($line['id']); ?>" <?php selected($host_data['product_line_id'], $line['id']); ?>>
                                    <?php echo esc_html($line['title'][$current_lang]); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                
                <div class="bjt-form-row">
                    <div class="bjt-form-col bjt-form-col-full">
                        <label for="host_description"><?php _e('描述', 'bjt-product-system'); ?></label>
                        <textarea id="host_description" name="description[<?php echo $current_lang; ?>]" rows="4"><?php echo esc_textarea($host_data['description'][$current_lang]); ?></textarea>
                    </div>
                </div>
                
                <div class="bjt-form-row">
                    <div class="bjt-form-col">
                        <label for="host_status"><?php _e('状态', 'bjt-product-system'); ?></label>
                        <select id="host_status" name="status">
                            <option value="draft" <?php selected($host_data['status'], 'draft'); ?>><?php _e('草稿', 'bjt-product-system'); ?></option>
                            <option value="published" <?php selected($host_data['status'], 'published'); ?>><?php _e('已发布', 'bjt-product-system'); ?></option>
                        </select>
                    </div>
                    
                    <div class="bjt-form-col">
                        <label for="host_sort_order"><?php _e('排序', 'bjt-product-system'); ?></label>
                        <input type="number" id="host_sort_order" name="sort_order" value="<?php echo esc_attr($host_data['sort_order']); ?>" min="0">
                    </div>
                </div>
                
                <div class="bjt-form-row">
                    <div class="bjt-form-col bjt-form-col-full">
                        <label for="host_thumbnail"><?php _e('缩略图', 'bjt-product-system'); ?></label>
                        <div class="bjt-media-uploader">
                            <div class="bjt-thumbnail-preview">
                                <?php if (!empty($host_data['thumbnail'])) : ?>
                                    <img src="<?php echo esc_url($host_data['thumbnail']); ?>" alt="Thumbnail">
                                <?php else : ?>
                                    <div class="bjt-no-thumbnail"><?php _e('无缩略图', 'bjt-product-system'); ?></div>
                                <?php endif; ?>
                            </div>
                            <input type="hidden" id="host_thumbnail" name="thumbnail" value="<?php echo esc_attr($host_data['thumbnail']); ?>">
                            <button type="button" class="bjt-btn bjt-upload-btn"><?php _e('选择图片', 'bjt-product-system'); ?></button>
                            <button type="button" class="bjt-btn bjt-remove-btn" <?php echo empty($host_data['thumbnail']) ? 'style="display:none;"' : ''; ?>><?php _e('移除图片', 'bjt-product-system'); ?></button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Host Properties Section -->
            <div class="bjt-form-section">
                <h2 class="bjt-section-title"><?php _e('主机规格参数', 'bjt-product-system'); ?></h2>
                <div class="bjt-property-list">
                    <?php 
                    if (!empty($host_data['properties'])) :
                        foreach ($host_data['properties'] as $index => $property) : 
                    ?>
                    <div class="bjt-property-item">
                        <div class="bjt-form-row">
                            <div class="bjt-form-col">
                                <label><?php _e('参数名称', 'bjt-product-system'); ?></label>
                                <input type="text" name="properties[<?php echo $index; ?>][name][<?php echo $current_lang; ?>]" value="<?php echo esc_attr($property['name'][$current_lang]); ?>">
                            </div>
                            <div class="bjt-form-col">
                                <label><?php _e('参数值', 'bjt-product-system'); ?></label>
                                <input type="text" name="properties[<?php echo $index; ?>][value][<?php echo $current_lang; ?>]" value="<?php echo esc_attr($property['value'][$current_lang]); ?>">
                            </div>
                            <div class="bjt-form-col bjt-property-actions">
                                <button type="button" class="bjt-btn bjt-btn-icon bjt-remove-property"><span class="dashicons dashicons-trash"></span></button>
                                <span class="bjt-drag-handle dashicons dashicons-menu"></span>
                            </div>
                        </div>
                    </div>
                    <?php 
                        endforeach;
                    endif; 
                    ?>
                    <template id="property-template">
                        <div class="bjt-property-item">
                            <div class="bjt-form-row">
                                <div class="bjt-form-col">
                                    <label><?php _e('参数名称', 'bjt-product-system'); ?></label>
                                    <input type="text" name="properties[{index}][name][<?php echo $current_lang; ?>]" value="">
                                </div>
                                <div class="bjt-form-col">
                                    <label><?php _e('参数值', 'bjt-product-system'); ?></label>
                                    <input type="text" name="properties[{index}][value][<?php echo $current_lang; ?>]" value="">
                                </div>
                                <div class="bjt-form-col bjt-property-actions">
                                    <button type="button" class="bjt-btn bjt-btn-icon bjt-remove-property"><span class="dashicons dashicons-trash"></span></button>
                                    <span class="bjt-drag-handle dashicons dashicons-menu"></span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                <div class="bjt-property-actions">
                    <button type="button" class="bjt-btn bjt-add-property"><?php _e('添加规格参数', 'bjt-product-system'); ?></button>
                </div>
            </div>
            
            <!-- Parts List Section -->
            <div class="bjt-form-section">
                <h2 class="bjt-section-title"><?php _e('部件列表', 'bjt-product-system'); ?></h2>
                <div class="bjt-parts-table-container">
                    <table class="bjt-parts-table widefat">
                        <thead>
                            <tr>
                                <th><?php _e('部件名称', 'bjt-product-system'); ?></th>
                                <th><?php _e('部件型号', 'bjt-product-system'); ?></th>
                                <th><?php _e('规格', 'bjt-product-system'); ?></th>
                                <th><?php _e('数量', 'bjt-product-system'); ?></th>
                                <th><?php _e('操作', 'bjt-product-system'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (!empty($host_data['parts'])) : ?>
                                <?php foreach ($host_data['parts'] as $part) : ?>
                                <tr data-part-id="<?php echo esc_attr($part['id']); ?>">
                                    <td><?php echo esc_html($part['name'][$current_lang]); ?></td>
                                    <td><?php echo esc_html($part['model']); ?></td>
                                    <td><?php echo esc_html($part['specs'][$current_lang]); ?></td>
                                    <td><?php echo esc_html($part['quantity']); ?></td>
                                    <td>
                                        <div class="bjt-table-actions">
                                            <a href="?page=bjt-host-models&action=edit-part&host_id=<?php echo $edit_id; ?>&part_id=<?php echo esc_attr($part['id']); ?>&lang=<?php echo $current_lang; ?>" class="bjt-btn bjt-btn-sm"><?php _e('编辑', 'bjt-product-system'); ?></a>
                                            <button type="button" class="bjt-btn bjt-btn-sm bjt-btn-danger bjt-remove-part"><?php _e('删除', 'bjt-product-system'); ?></button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            <?php else : ?>
                                <tr class="bjt-no-items">
                                    <td colspan="5"><?php _e('暂无部件', 'bjt-product-system'); ?></td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                <?php if ($is_edit) : ?>
                <div class="bjt-parts-actions">
                    <a href="?page=bjt-host-models&action=add-part&host_id=<?php echo $edit_id; ?>&lang=<?php echo $current_lang; ?>" class="bjt-btn"><?php _e('添加部件', 'bjt-product-system'); ?></a>
                </div>
                <?php else : ?>
                <div class="bjt-notice bjt-notice-info">
                    <?php _e('请先保存主机型号，然后才能添加部件。', 'bjt-product-system'); ?>
                </div>
                <?php endif; ?>
            </div>
            
            <!-- Form Actions -->
            <div class="bjt-form-actions">
                <button type="submit" class="bjt-btn bjt-btn-primary"><?php _e('保存', 'bjt-product-system'); ?></button>
                <a href="?page=bjt-host-models" class="bjt-btn"><?php _e('取消', 'bjt-product-system'); ?></a>
            </div>
        </form>
    </div>
    
    <!-- Confirmation Modal -->
    <div id="bjt-confirm-modal" class="bjt-modal">
        <div class="bjt-modal-content">
            <div class="bjt-modal-header">
                <h3><?php _e('确认', 'bjt-product-system'); ?></h3>
                <span class="bjt-modal-close">&times;</span>
            </div>
            <div class="bjt-modal-body">
                <p><?php _e('确定要离开此页面吗？未保存的更改将会丢失。', 'bjt-product-system'); ?></p>
            </div>
            <div class="bjt-modal-footer">
                <button type="button" class="bjt-btn bjt-btn-danger bjt-confirm-yes"><?php _e('是的，离开', 'bjt-product-system'); ?></button>
                <button type="button" class="bjt-btn bjt-confirm-no"><?php _e('取消', 'bjt-product-system'); ?></button>
            </div>
        </div>
    </div>
    
    <!-- Toast Notifications -->
    <div id="bjt-toast-container" class="bjt-toast-container"></div>
</div>

<!-- JavaScript for the page -->
<script type="text/javascript">
jQuery(document).ready(function($) {
    // Initialize variables
    let formChanged = false;
    let nextPropertyIndex = <?php echo !empty($host_data['properties']) ? count($host_data['properties']) : 0; ?>;
    
    // Mark form as changed when inputs change
    $('#bjt-host-model-form').on('input change', 'input, select, textarea', function() {
        formChanged = true;
    });
    
    // Media uploader for thumbnail
    $('.bjt-upload-btn').on('click', function(e) {
        e.preventDefault();
        
        const button = $(this);
        const mediaUploader = wp.media({
            title: '<?php _e('选择或上传图片', 'bjt-product-system'); ?>',
            button: {
                text: '<?php _e('使用此图片', 'bjt-product-system'); ?>'
            },
            multiple: false
        });
        
        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#host_thumbnail').val(attachment.url);
            $('.bjt-thumbnail-preview').html('<img src="' + attachment.url + '" alt="Thumbnail">');
            $('.bjt-remove-btn').show();
            formChanged = true;
        });
        
        mediaUploader.open();
    });
    
    // Remove thumbnail
    $('.bjt-remove-btn').on('click', function(e) {
        e.preventDefault();
        $('#host_thumbnail').val('');
        $('.bjt-thumbnail-preview').html('<div class="bjt-no-thumbnail"><?php _e('无缩略图', 'bjt-product-system'); ?></div>');
        $(this).hide();
        formChanged = true;
    });
    
    // Add property
    $('.bjt-add-property').on('click', function() {
        const template = $('#property-template').html();
        const newItem = template.replace(/{index}/g, nextPropertyIndex++);
        $('.bjt-property-list').append(newItem);
        formChanged = true;
    });
    
    // Remove property
    $('.bjt-property-list').on('click', '.bjt-remove-property', function() {
        $(this).closest('.bjt-property-item').remove();
        formChanged = true;
    });
    
    // Remove part
    $('.bjt-parts-table').on('click', '.bjt-remove-part', function() {
        const row = $(this).closest('tr');
        const partId = row.data('part-id');
        
        // Show confirmation modal
        showConfirmModal('<?php _e('确定要删除此部件吗？', 'bjt-product-system'); ?>', function() {
            // Here you would normally send an AJAX request to delete the part
            // For now, we'll just remove the row
            row.remove();
            
            // Check if there are any parts left
            if ($('.bjt-parts-table tbody tr').length === 0) {
                $('.bjt-parts-table tbody').append('<tr class="bjt-no-items"><td colspan="5"><?php _e('暂无部件', 'bjt-product-system'); ?></td></tr>');
            }
            
            showToast('<?php _e('部件已删除', 'bjt-product-system'); ?>', 'success');
            formChanged = true;
        });
    });
    
    // Form submission
    $('#bjt-host-model-form').on('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return false;
        }
        
        // Disable submit button to prevent double submission
        $('.bjt-form-actions .bjt-btn-primary').prop('disabled', true).text('<?php _e('保存中...', 'bjt-product-system'); ?>');
        
        // Collect form data
        const formData = $(this).serialize();
        
        // Send AJAX request
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    formChanged = false;
                    showToast(response.data.message, 'success');
                    
                    // Redirect to edit page if this is a new record
                    if (!<?php echo $is_edit ? 'true' : 'false'; ?>) {
                        setTimeout(function() {
                            window.location.href = '?page=bjt-host-models&action=edit&id=' + response.data.id + '&lang=<?php echo $current_lang; ?>';
                        }, 1000);
                    } else {
                        // Re-enable submit button
                        $('.bjt-form-actions .bjt-btn-primary').prop('disabled', false).text('<?php _e('保存', 'bjt-product-system'); ?>');
                    }
                } else {
                    showToast(response.data.message, 'error');
                    // Re-enable submit button
                    $('.bjt-form-actions .bjt-btn-primary').prop('disabled', false).text('<?php _e('保存', 'bjt-product-system'); ?>');
                }
            },
            error: function() {
                showToast('<?php _e('保存失败，请重试', 'bjt-product-system'); ?>', 'error');
                // Re-enable submit button
                $('.bjt-form-actions .bjt-btn-primary').prop('disabled', false).text('<?php _e('保存', 'bjt-product-system'); ?>');
            }
        });
    });
    
    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Check required fields
        $('#bjt-host-model-form .bjt-required').each(function() {
            const label = $(this);
            const input = $('#' + label.attr('for'));
            
            if (input.val() === '') {
                input.addClass('bjt-invalid');
                isValid = false;
                
                // Show error message
                if (!input.next('.bjt-error-message').length) {
                    input.after('<div class="bjt-error-message"><?php _e('此字段为必填项', 'bjt-product-system'); ?></div>');
                }
            } else {
                input.removeClass('bjt-invalid');
                input.next('.bjt-error-message').remove();
            }
        });
        
        if (!isValid) {
            showToast('<?php _e('请填写所有必填字段', 'bjt-product-system'); ?>', 'error');
        }
        
        return isValid;
    }
    
    // Confirm before leaving page if form has changes
    window.addEventListener('beforeunload', function(e) {
        if (formChanged) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
    
    // Handle cancel button with confirmation
    $('.bjt-form-actions a.bjt-btn').on('click', function(e) {
        if (formChanged) {
            e.preventDefault();
            const targetHref = $(this).attr('href');
            
            showConfirmModal('<?php _e('确定要离开此页面吗？未保存的更改将会丢失。', 'bjt-product-system'); ?>', function() {
                window.removeEventListener('beforeunload', function() {});
                window.location.href = targetHref;
            });
        }
    });
    
    // Show confirmation modal
    function showConfirmModal(message, confirmCallback) {
        const modal = $('#bjt-confirm-modal');
        modal.find('.bjt-modal-body p').text(message);
        
        modal.css('display', 'flex');
        
        // Handle confirmation
        $('.bjt-confirm-yes').off('click').on('click', function() {
            modal.hide();
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
        });
        
        // Handle cancellation
        $('.bjt-confirm-no, .bjt-modal-close').off('click').on('click', function() {
            modal.hide();
        });
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const toast = $('<div class="bjt-toast bjt-toast-' + type + '">' + message + '</div>');
        $('#bjt-toast-container').append(toast);
        
        setTimeout(function() {
            toast.addClass('bjt-toast-show');
        }, 100);
        
        setTimeout(function() {
            toast.removeClass('bjt-toast-show');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // Make properties sortable
    if ($.fn.sortable) {
        $('.bjt-property-list').sortable({
            handle: '.bjt-drag-handle',
            axis: 'y',
            update: function() {
                formChanged = true;
            }
        });
    }
});
</script> 