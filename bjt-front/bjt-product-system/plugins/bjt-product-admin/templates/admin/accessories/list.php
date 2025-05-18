<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Get current accessories list with pagination
$current_page = isset($_GET['paged']) ? intval($_GET['paged']) : 1;
$per_page = 20;
$search_term = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
$filter_status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
$filter_type = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : '';

// Placeholder for accessories data
$accessories = array();
$total_items = 0;

// This is a placeholder - in real implementation, you'd fetch the data from your API
$accessories_data = apply_filters('bjt_get_accessories', array(
    'items' => $accessories,
    'total' => $total_items,
    'page' => $current_page,
    'per_page' => $per_page,
    'search' => $search_term,
    'status' => $filter_status,
    'type' => $filter_type
));

$accessories = $accessories_data['items'];
$total_items = $accessories_data['total'];
$total_pages = ceil($total_items / $per_page);

// Get accessory types for filter dropdown
$accessory_types = array();
// This is a placeholder - in real implementation, you'd fetch the data from your API
$accessory_types = apply_filters('bjt_get_accessory_types', $accessory_types);
?>

<div class="wrap bjt-admin-page bjt-accessories-list">
    <h1 class="wp-heading-inline"><?php _e('配件管理', 'bjt-product-system'); ?></h1>
    
    <!-- Top Actions -->
    <div class="bjt-top-actions">
        <div class="bjt-filters">
            <form method="get" id="bjt-filter-form">
                <input type="hidden" name="page" value="bjt-accessories">
                
                <div class="bjt-filter-group">
                    <select name="status" id="filter-status">
                        <option value=""><?php _e('所有状态', 'bjt-product-system'); ?></option>
                        <option value="published" <?php selected($filter_status, 'published'); ?>><?php _e('已上架', 'bjt-product-system'); ?></option>
                        <option value="draft" <?php selected($filter_status, 'draft'); ?>><?php _e('未上架', 'bjt-product-system'); ?></option>
                    </select>
                </div>
                
                <div class="bjt-filter-group">
                    <select name="type" id="filter-type">
                        <option value=""><?php _e('所有类型', 'bjt-product-system'); ?></option>
                        <?php foreach ($accessory_types as $type) : ?>
                            <option value="<?php echo esc_attr($type['id']); ?>" <?php selected($filter_type, $type['id']); ?>>
                                <?php echo esc_html($type['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="bjt-filter-group bjt-search-group">
                    <input type="search" name="s" value="<?php echo esc_attr($search_term); ?>" placeholder="<?php _e('搜索配件...', 'bjt-product-system'); ?>">
                    <button type="submit" class="bjt-btn bjt-btn-primary"><?php _e('搜索', 'bjt-product-system'); ?></button>
                </div>
            </form>
        </div>
        
        <div class="bjt-actions">
            <button type="button" class="bjt-btn" id="btn-import-accessories"><?php _e('导入配件', 'bjt-product-system'); ?></button>
            <button type="button" class="bjt-btn" id="btn-export-accessories"><?php _e('导出配件', 'bjt-product-system'); ?></button>
            <a href="?page=bjt-accessories&action=add" class="bjt-btn bjt-btn-primary"><?php _e('添加配件', 'bjt-product-system'); ?></a>
        </div>
    </div>
    
    <!-- Bulk Actions -->
    <div class="bjt-bulk-actions">
        <select id="bulk-action-selector">
            <option value=""><?php _e('批量操作', 'bjt-product-system'); ?></option>
            <option value="delete"><?php _e('删除', 'bjt-product-system'); ?></option>
            <option value="publish"><?php _e('上架', 'bjt-product-system'); ?></option>
            <option value="draft"><?php _e('下架', 'bjt-product-system'); ?></option>
        </select>
        <button type="button" class="bjt-btn" id="do-bulk-action"><?php _e('应用', 'bjt-product-system'); ?></button>
    </div>
    
    <!-- Accessories Table -->
    <div class="bjt-card">
        <div class="bjt-table-container">
            <table class="bjt-table widefat">
                <thead>
                    <tr>
                        <th class="check-column">
                            <input type="checkbox" id="select-all-accessories">
                        </th>
                        <th class="column-id"><?php _e('ID', 'bjt-product-system'); ?></th>
                        <th class="column-image"><?php _e('图片', 'bjt-product-system'); ?></th>
                        <th class="column-title"><?php _e('配件名称', 'bjt-product-system'); ?></th>
                        <th class="column-model"><?php _e('配件型号', 'bjt-product-system'); ?></th>
                        <th class="column-type"><?php _e('类型', 'bjt-product-system'); ?></th>
                        <th class="column-status"><?php _e('状态', 'bjt-product-system'); ?></th>
                        <th class="column-sort"><?php _e('排序', 'bjt-product-system'); ?></th>
                        <th class="column-date"><?php _e('创建时间', 'bjt-product-system'); ?></th>
                        <th class="column-actions"><?php _e('操作', 'bjt-product-system'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($accessories)) : ?>
                        <tr class="bjt-no-items">
                            <td colspan="10"><?php _e('未找到配件', 'bjt-product-system'); ?></td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($accessories as $accessory) : ?>
                            <tr data-id="<?php echo esc_attr($accessory['id']); ?>">
                                <td class="check-column">
                                    <input type="checkbox" name="select-accessory" value="<?php echo esc_attr($accessory['id']); ?>">
                                </td>
                                <td class="column-id"><?php echo esc_html($accessory['id']); ?></td>
                                <td class="column-image">
                                    <?php if (!empty($accessory['thumbnail'])) : ?>
                                        <img src="<?php echo esc_url($accessory['thumbnail']); ?>" alt="<?php echo esc_attr($accessory['title']); ?>" class="bjt-thumbnail">
                                    <?php else : ?>
                                        <div class="bjt-no-thumbnail"></div>
                                    <?php endif; ?>
                                </td>
                                <td class="column-title">
                                    <a href="?page=bjt-accessories&action=edit&id=<?php echo esc_attr($accessory['id']); ?>" class="row-title">
                                        <?php echo esc_html($accessory['title']); ?>
                                    </a>
                                </td>
                                <td class="column-model"><?php echo esc_html($accessory['model']); ?></td>
                                <td class="column-type"><?php echo esc_html($accessory['type_name']); ?></td>
                                <td class="column-status">
                                    <span class="bjt-status-badge bjt-status-<?php echo esc_attr($accessory['status']); ?>">
                                        <?php echo $accessory['status'] === 'published' ? __('已上架', 'bjt-product-system') : __('未上架', 'bjt-product-system'); ?>
                                    </span>
                                </td>
                                <td class="column-sort"><?php echo esc_html($accessory['sort_order']); ?></td>
                                <td class="column-date"><?php echo esc_html($accessory['created_at']); ?></td>
                                <td class="column-actions">
                                    <div class="bjt-table-actions">
                                        <a href="?page=bjt-accessories&action=edit&id=<?php echo esc_attr($accessory['id']); ?>" class="bjt-btn bjt-btn-sm" title="<?php _e('编辑', 'bjt-product-system'); ?>">
                                            <span class="dashicons dashicons-edit"></span>
                                        </a>
                                        <button type="button" class="bjt-btn bjt-btn-sm bjt-btn-danger bjt-delete-accessory" data-id="<?php echo esc_attr($accessory['id']); ?>" title="<?php _e('删除', 'bjt-product-system'); ?>">
                                            <span class="dashicons dashicons-trash"></span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <?php if ($total_pages > 1) : ?>
            <div class="bjt-pagination">
                <?php
                // Display pagination links
                $page_links = paginate_links(array(
                    'base' => add_query_arg('paged', '%#%'),
                    'format' => '',
                    'prev_text' => __('&laquo;', 'bjt-product-system'),
                    'next_text' => __('&raquo;', 'bjt-product-system'),
                    'total' => $total_pages,
                    'current' => $current_page
                ));
                
                if ($page_links) {
                    echo '<div class="tablenav-pages">' . $page_links . '</div>';
                }
                ?>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Import Modal -->
    <div id="bjt-import-modal" class="bjt-modal">
        <div class="bjt-modal-content">
            <div class="bjt-modal-header">
                <h3><?php _e('导入配件', 'bjt-product-system'); ?></h3>
                <span class="bjt-modal-close">&times;</span>
            </div>
            <div class="bjt-modal-body">
                <form id="bjt-import-form" method="post" enctype="multipart/form-data">
                    <?php wp_nonce_field('bjt_import_accessories', 'bjt_import_nonce'); ?>
                    <input type="hidden" name="action" value="bjt_import_accessories">
                    
                    <div class="bjt-form-row">
                        <div class="bjt-form-col bjt-form-col-full">
                            <label for="import_file"><?php _e('选择CSV文件', 'bjt-product-system'); ?></label>
                            <input type="file" id="import_file" name="import_file" accept=".csv" required>
                        </div>
                    </div>
                    
                    <div class="bjt-form-row">
                        <div class="bjt-form-col bjt-form-col-full">
                            <div class="bjt-checkbox-group">
                                <input type="checkbox" id="update_existing" name="update_existing" value="1">
                                <label for="update_existing"><?php _e('更新已存在的配件', 'bjt-product-system'); ?></label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bjt-form-row">
                        <div class="bjt-form-col bjt-form-col-full">
                            <a href="#" id="download-template"><?php _e('下载导入模板', 'bjt-product-system'); ?></a>
                        </div>
                    </div>
                </form>
            </div>
            <div class="bjt-modal-footer">
                <button type="button" class="bjt-btn bjt-btn-primary" id="btn-do-import"><?php _e('导入', 'bjt-product-system'); ?></button>
                <button type="button" class="bjt-btn bjt-modal-cancel"><?php _e('取消', 'bjt-product-system'); ?></button>
            </div>
        </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div id="bjt-confirm-modal" class="bjt-modal">
        <div class="bjt-modal-content">
            <div class="bjt-modal-header">
                <h3><?php _e('确认删除', 'bjt-product-system'); ?></h3>
                <span class="bjt-modal-close">&times;</span>
            </div>
            <div class="bjt-modal-body">
                <p><?php _e('确定要删除选中的配件吗？此操作无法撤销。', 'bjt-product-system'); ?></p>
            </div>
            <div class="bjt-modal-footer">
                <button type="button" class="bjt-btn bjt-btn-danger bjt-confirm-yes"><?php _e('删除', 'bjt-product-system'); ?></button>
                <button type="button" class="bjt-btn bjt-modal-cancel"><?php _e('取消', 'bjt-product-system'); ?></button>
            </div>
        </div>
    </div>
    
    <!-- Toast Notifications -->
    <div id="bjt-toast-container" class="bjt-toast-container"></div>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    // Initialize variables
    let selectedItems = [];
    
    // Filter form submission
    $('#filter-status, #filter-type').on('change', function() {
        $('#bjt-filter-form').submit();
    });
    
    // Select all toggle
    $('#select-all-accessories').on('change', function() {
        const isChecked = $(this).prop('checked');
        $('input[name="select-accessory"]').prop('checked', isChecked);
        updateSelectedItems();
    });
    
    // Individual checkbox selection
    $('input[name="select-accessory"]').on('change', function() {
        updateSelectedItems();
        
        // Update select all checkbox
        const totalCheckboxes = $('input[name="select-accessory"]').length;
        const checkedCheckboxes = $('input[name="select-accessory"]:checked').length;
        
        $('#select-all-accessories').prop('checked', totalCheckboxes === checkedCheckboxes && totalCheckboxes > 0);
    });
    
    // Update selected items array
    function updateSelectedItems() {
        selectedItems = [];
        $('input[name="select-accessory"]:checked').each(function() {
            selectedItems.push($(this).val());
        });
        
        // Toggle bulk action button state
        $('#do-bulk-action').prop('disabled', selectedItems.length === 0);
    }
    
    // Bulk actions
    $('#do-bulk-action').on('click', function() {
        const action = $('#bulk-action-selector').val();
        
        if (!action || selectedItems.length === 0) {
            showToast('<?php _e('请选择操作和配件', 'bjt-product-system'); ?>', 'error');
            return;
        }
        
        if (action === 'delete') {
            // Show confirmation modal
            showConfirmModal('<?php _e('确定要删除选中的配件吗？此操作无法撤销。', 'bjt-product-system'); ?>', function() {
                performBulkAction(action);
            });
        } else {
            performBulkAction(action);
        }
    });
    
    // Perform bulk action via AJAX
    function performBulkAction(action) {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_bulk_accessory_action',
                bulk_action: action,
                items: selectedItems,
                _wpnonce: '<?php echo wp_create_nonce('bjt_bulk_accessory_action'); ?>'
            },
            beforeSend: function() {
                $('#do-bulk-action').prop('disabled', true).text('<?php _e('处理中...', 'bjt-product-system'); ?>');
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    
                    // Reload the page after a short delay
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    showToast(response.data.message, 'error');
                    $('#do-bulk-action').prop('disabled', false).text('<?php _e('应用', 'bjt-product-system'); ?>');
                }
            },
            error: function() {
                showToast('<?php _e('操作失败，请重试', 'bjt-product-system'); ?>', 'error');
                $('#do-bulk-action').prop('disabled', false).text('<?php _e('应用', 'bjt-product-system'); ?>');
            }
        });
    }
    
    // Delete individual accessory
    $('.bjt-delete-accessory').on('click', function() {
        const itemId = $(this).data('id');
        selectedItems = [itemId];
        
        showConfirmModal('<?php _e('确定要删除此配件吗？此操作无法撤销。', 'bjt-product-system'); ?>', function() {
            performBulkAction('delete');
        });
    });
    
    // Import accessories
    $('#btn-import-accessories').on('click', function() {
        $('#bjt-import-modal').css('display', 'flex');
    });
    
    // Handle import form submission
    $('#btn-do-import').on('click', function() {
        const importForm = $('#bjt-import-form')[0];
        const formData = new FormData(importForm);
        
        if ($('#import_file').val() === '') {
            showToast('<?php _e('请选择文件', 'bjt-product-system'); ?>', 'error');
            return;
        }
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function() {
                $('#btn-do-import').prop('disabled', true).text('<?php _e('导入中...', 'bjt-product-system'); ?>');
            },
            success: function(response) {
                if (response.success) {
                    showToast(response.data.message, 'success');
                    $('#bjt-import-modal').hide();
                    
                    // Reload the page after a short delay
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    showToast(response.data.message, 'error');
                    $('#btn-do-import').prop('disabled', false).text('<?php _e('导入', 'bjt-product-system'); ?>');
                }
            },
            error: function() {
                showToast('<?php _e('导入失败，请重试', 'bjt-product-system'); ?>', 'error');
                $('#btn-do-import').prop('disabled', false).text('<?php _e('导入', 'bjt-product-system'); ?>');
            }
        });
    });
    
    // Download import template
    $('#download-template').on('click', function(e) {
        e.preventDefault();
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_download_accessory_template',
                _wpnonce: '<?php echo wp_create_nonce('bjt_download_accessory_template'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    // Create a download link and trigger it
                    const link = document.createElement('a');
                    link.href = response.data.url;
                    link.download = response.data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showToast(response.data.message, 'error');
                }
            },
            error: function() {
                showToast('<?php _e('下载模板失败，请重试', 'bjt-product-system'); ?>', 'error');
            }
        });
    });
    
    // Export accessories
    $('#btn-export-accessories').on('click', function() {
        // Collect current filter parameters
        const filterStatus = $('#filter-status').val();
        const filterType = $('#filter-type').val();
        const searchTerm = $('input[name="s"]').val();
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_export_accessories',
                status: filterStatus,
                type: filterType,
                search: searchTerm,
                _wpnonce: '<?php echo wp_create_nonce('bjt_export_accessories'); ?>'
            },
            beforeSend: function() {
                $(this).prop('disabled', true).text('<?php _e('导出中...', 'bjt-product-system'); ?>');
            },
            success: function(response) {
                if (response.success) {
                    // Create a download link and trigger it
                    const link = document.createElement('a');
                    link.href = response.data.url;
                    link.download = response.data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast(response.data.message, 'success');
                } else {
                    showToast(response.data.message, 'error');
                }
                
                $('#btn-export-accessories').prop('disabled', false).text('<?php _e('导出配件', 'bjt-product-system'); ?>');
            },
            error: function() {
                showToast('<?php _e('导出失败，请重试', 'bjt-product-system'); ?>', 'error');
                $('#btn-export-accessories').prop('disabled', false).text('<?php _e('导出配件', 'bjt-product-system'); ?>');
            }
        });
    });
    
    // Close modals
    $('.bjt-modal-close, .bjt-modal-cancel').on('click', function() {
        $(this).closest('.bjt-modal').hide();
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
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).hasClass('bjt-modal')) {
            $(e.target).hide();
        }
    });
});
</script> 