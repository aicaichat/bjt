<?php
/**
 * Product Lines Page Template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap">
    <h1 class="wp-heading-inline"><?php _e('Product Lines', 'bjt-product-admin'); ?></h1>
    <a href="#" class="page-title-action" id="add-product-line"><?php _e('Add New', 'bjt-product-admin'); ?></a>
    <hr class="wp-header-end">

    <div class="notice notice-info inline">
        <p><?php _e('Manage your product lines here. You can add, edit, and delete product lines.', 'bjt-product-admin'); ?></p>
    </div>

    <div class="tablenav top">
        <div class="alignleft actions bulkactions">
            <label for="bulk-action-selector-top" class="screen-reader-text"><?php _e('Select bulk action', 'bjt-product-admin'); ?></label>
            <select name="action" id="bulk-action-selector-top">
                <option value="-1"><?php _e('Bulk Actions', 'bjt-product-admin'); ?></option>
                <option value="trash"><?php _e('Move to Trash', 'bjt-product-admin'); ?></option>
                <option value="delete"><?php _e('Delete Permanently', 'bjt-product-admin'); ?></option>
                <option value="publish"><?php _e('Publish', 'bjt-product-admin'); ?></option>
            </select>
            <input type="submit" id="doaction" class="button action" value="<?php _e('Apply', 'bjt-product-admin'); ?>">
        </div>
        <div class="tablenav-pages">
            <span class="displaying-num"><span id="total-items">0</span> <?php _e('items', 'bjt-product-admin'); ?></span>
            <span class="pagination-links">
                <span class="tablenav-pages-navspan button disabled" aria-hidden="true">&laquo;</span>
                <span class="tablenav-pages-navspan button disabled" aria-hidden="true">&lsaquo;</span>
                <span class="paging-input">
                    <label for="current-page-selector" class="screen-reader-text"><?php _e('Current Page', 'bjt-product-admin'); ?></label>
                    <input class="current-page" id="current-page" type="number" min="1" value="1" size="1" aria-describedby="table-paging">
                    <span class="tablenav-paging-text"> <?php _e('of', 'bjt-product-admin'); ?> <span class="total-pages">1</span></span>
                </span>
                <a class="next-page button" href="#"><span aria-hidden="true">&rsaquo;</span></a>
                <a class="last-page button" href="#"><span aria-hidden="true">&raquo;</span></a>
            </span>
        </div>
        <br class="clear">
    </div>

    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <td id="cb" class="manage-column column-cb check-column">
                    <input id="cb-select-all-1" type="checkbox">
                </td>
                <th scope="col" class="manage-column column-title column-primary"><?php _e('Title', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-code"><?php _e('Code', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-status"><?php _e('Status', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-date"><?php _e('Date', 'bjt-product-admin'); ?></th>
            </tr>
        </thead>

        <tbody id="the-list">
            <!-- Product lines will be loaded here via JavaScript -->
            <tr class="no-items">
                <td class="colspanchange" colspan="5"><?php _e('Loading product lines...', 'bjt-product-admin'); ?></td>
            </tr>
        </tbody>

        <tfoot>
            <tr>
                <td class="manage-column column-cb check-column">
                    <input id="cb-select-all-2" type="checkbox">
                </td>
                <th scope="col" class="manage-column column-title column-primary"><?php _e('Title', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-code"><?php _e('Code', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-status"><?php _e('Status', 'bjt-product-admin'); ?></th>
                <th scope="col" class="manage-column column-date"><?php _e('Date', 'bjt-product-admin'); ?></th>
            </tr>
        </tfoot>
    </table>

    <div class="tablenav bottom">
        <div class="alignleft actions bulkactions">
            <label for="bulk-action-selector-bottom" class="screen-reader-text"><?php _e('Select bulk action', 'bjt-product-admin'); ?></label>
            <select name="action2" id="bulk-action-selector-bottom">
                <option value="-1"><?php _e('Bulk Actions', 'bjt-product-admin'); ?></option>
                <option value="trash"><?php _e('Move to Trash', 'bjt-product-admin'); ?></option>
                <option value="delete"><?php _e('Delete Permanently', 'bjt-product-admin'); ?></option>
                <option value="publish"><?php _e('Publish', 'bjt-product-admin'); ?></option>
            </select>
            <input type="submit" id="doaction2" class="button action" value="<?php _e('Apply', 'bjt-product-admin'); ?>">
        </div>
        <div class="tablenav-pages">
            <!-- Page navigation will be here -->
        </div>
        <br class="clear">
    </div>
</div>

<!-- Product Line Edit Modal -->
<div id="product-line-modal" class="bjt-modal" style="display: none;">
    <div class="bjt-modal-content">
        <div class="bjt-modal-header">
            <span class="bjt-modal-close">&times;</span>
            <h2 id="modal-title"><?php _e('Edit Product Line', 'bjt-product-admin'); ?></h2>
        </div>
        <div class="bjt-modal-body">
            <form id="product-line-form" method="post">
                <input type="hidden" id="product-line-id" name="id" value="0">
                
                <div class="form-field">
                    <label for="code"><?php _e('Code', 'bjt-product-admin'); ?> <span class="required">*</span></label>
                    <input type="text" id="code" name="code" required>
                    <p class="description"><?php _e('A unique identifier for the product line. Only lowercase letters, numbers, dashes and underscores are allowed.', 'bjt-product-admin'); ?></p>
                </div>
                
                <div class="form-field">
                    <label for="title-zh"><?php _e('Chinese Title', 'bjt-product-admin'); ?> <span class="required">*</span></label>
                    <input type="text" id="title-zh" name="title_zh" required>
                </div>
                
                <div class="form-field">
                    <label for="title-en"><?php _e('English Title', 'bjt-product-admin'); ?> <span class="required">*</span></label>
                    <input type="text" id="title-en" name="title_en" required>
                </div>
                
                <div class="form-field">
                    <label for="description-zh"><?php _e('Chinese Description', 'bjt-product-admin'); ?></label>
                    <textarea id="description-zh" name="description_zh" rows="5"></textarea>
                </div>
                
                <div class="form-field">
                    <label for="description-en"><?php _e('English Description', 'bjt-product-admin'); ?></label>
                    <textarea id="description-en" name="description_en" rows="5"></textarea>
                </div>
                
                <div class="form-field">
                    <label for="image-url"><?php _e('Image URL', 'bjt-product-admin'); ?></label>
                    <input type="text" id="image-url" name="image_url">
                    <button type="button" class="button" id="select-image"><?php _e('Select Image', 'bjt-product-admin'); ?></button>
                </div>
                
                <div class="form-field">
                    <label for="status"><?php _e('Status', 'bjt-product-admin'); ?></label>
                    <select id="status" name="status">
                        <option value="publish"><?php _e('Published', 'bjt-product-admin'); ?></option>
                        <option value="draft"><?php _e('Draft', 'bjt-product-admin'); ?></option>
                    </select>
                </div>
                
                <div class="form-field">
                    <label for="sort-order"><?php _e('Sort Order', 'bjt-product-admin'); ?></label>
                    <input type="number" id="sort-order" name="sort_order" min="0" value="0">
                </div>
                
                <div class="bjt-modal-footer">
                    <button type="button" class="button button-secondary bjt-modal-close"><?php _e('Cancel', 'bjt-product-admin'); ?></button>
                    <button type="submit" class="button button-primary"><?php _e('Save', 'bjt-product-admin'); ?></button>
                </div>
            </form>
        </div>
    </div>
</div>

<script type="text/template" id="product-line-row-template">
    <tr id="product-line-{id}">
        <th scope="row" class="check-column">
            <input type="checkbox" name="product_lines[]" value="{id}">
        </th>
        <td class="title column-title has-row-actions column-primary">
            <strong><a href="#" class="edit-product-line" data-id="{id}">{title}</a></strong>
            <div class="row-actions">
                <span class="edit"><a href="#" class="edit-product-line" data-id="{id}"><?php _e('Edit', 'bjt-product-admin'); ?></a> | </span>
                <span class="trash"><a href="#" class="trash-product-line" data-id="{id}"><?php _e('Trash', 'bjt-product-admin'); ?></a></span>
            </div>
        </td>
        <td class="code column-code">{code}</td>
        <td class="status column-status">{status}</td>
        <td class="date column-date">{date}</td>
    </tr>
</script>

<script>
jQuery(document).ready(function($) {
    // Load product lines
    function loadProductLines(page = 1) {
        $.ajax({
            url: bjt_admin.rest_url + 'product-lines',
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', bjt_admin.rest_nonce);
            },
            data: {
                page: page,
                per_page: 10
            },
            success: function(response) {
                if (response && response.items.length > 0) {
                    var template = $('#product-line-row-template').html();
                    var html = '';
                    
                    $.each(response.items, function(index, item) {
                        var row = template
                            .replace(/{id}/g, item.id)
                            .replace('{title}', item.title_en || item.title_zh)
                            .replace('{code}', item.code)
                            .replace('{status}', item.status)
                            .replace('{date}', item.updated_at || item.created_at);
                        
                        html += row;
                    });
                    
                    $('#the-list').html(html);
                    $('#total-items').text(response.total);
                    $('.total-pages').text(response.pages);
                } else {
                    $('#the-list').html('<tr class="no-items"><td class="colspanchange" colspan="5"><?php _e('No product lines found.', 'bjt-product-admin'); ?></td></tr>');
                }
            },
            error: function(xhr) {
                alert(bjt_admin.i18n.error);
                console.error(xhr.responseJSON || xhr.responseText);
            }
        });
    }
    
    // Load product lines on page load
    loadProductLines();
    
    // Add new product line
    $('#add-product-line').on('click', function(e) {
        e.preventDefault();
        
        // Reset form
        $('#product-line-form')[0].reset();
        $('#product-line-id').val(0);
        $('#modal-title').text('<?php _e('Add New Product Line', 'bjt-product-admin'); ?>');
        
        // Show modal
        $('#product-line-modal').show();
    });
    
    // Edit product line
    $(document).on('click', '.edit-product-line', function(e) {
        e.preventDefault();
        
        var id = $(this).data('id');
        
        // Get product line data
        $.ajax({
            url: bjt_admin.rest_url + 'product-lines/' + id,
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', bjt_admin.rest_nonce);
            },
            success: function(response) {
                // Fill form
                $('#product-line-id').val(response.id);
                $('#code').val(response.code);
                $('#title-zh').val(response.title_zh);
                $('#title-en').val(response.title_en);
                $('#description-zh').val(response.description_zh);
                $('#description-en').val(response.description_en);
                $('#image-url').val(response.image_url);
                $('#status').val(response.status);
                $('#sort-order').val(response.sort_order);
                
                // Show modal
                $('#modal-title').text('<?php _e('Edit Product Line', 'bjt-product-admin'); ?>');
                $('#product-line-modal').show();
            },
            error: function(xhr) {
                alert(bjt_admin.i18n.error);
                console.error(xhr.responseJSON || xhr.responseText);
            }
        });
    });
    
    // Save product line
    $('#product-line-form').on('submit', function(e) {
        e.preventDefault();
        
        var id = $('#product-line-id').val();
        var isNew = id == 0;
        var method = isNew ? 'POST' : 'PUT';
        var url = bjt_admin.rest_url + 'product-lines';
        
        if (!isNew) {
            url += '/' + id;
        }
        
        // Get form data
        var formData = $(this).serializeArray();
        var data = {};
        
        $.each(formData, function(index, field) {
            data[field.name] = field.value;
        });
        
        // Save product line
        $.ajax({
            url: url,
            method: method,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', bjt_admin.rest_nonce);
            },
            data: data,
            success: function(response) {
                $('#product-line-modal').hide();
                alert(bjt_admin.i18n.save_success);
                loadProductLines();
            },
            error: function(xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.message 
                    ? xhr.responseJSON.message 
                    : bjt_admin.i18n.error;
                alert(message);
                console.error(xhr.responseJSON || xhr.responseText);
            }
        });
    });
    
    // Close modal
    $('.bjt-modal-close').on('click', function() {
        $('#product-line-modal').hide();
    });
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is('.bjt-modal')) {
            $('.bjt-modal').hide();
        }
    });
    
    // Page navigation
    $('.next-page').on('click', function(e) {
        e.preventDefault();
        var currentPage = parseInt($('#current-page').val());
        var totalPages = parseInt($('.total-pages').text());
        
        if (currentPage < totalPages) {
            $('#current-page').val(currentPage + 1);
            loadProductLines(currentPage + 1);
        }
    });
    
    $('.last-page').on('click', function(e) {
        e.preventDefault();
        var totalPages = parseInt($('.total-pages').text());
        
        $('#current-page').val(totalPages);
        loadProductLines(totalPages);
    });
    
    $('#current-page').on('change', function() {
        var page = parseInt($(this).val());
        var totalPages = parseInt($('.total-pages').text());
        
        if (page > 0 && page <= totalPages) {
            loadProductLines(page);
        } else {
            $(this).val(1);
            loadProductLines(1);
        }
    });
    
    // Bulk actions
    $('#doaction, #doaction2').on('click', function(e) {
        e.preventDefault();
        
        var action = $(this).prev('select').val();
        
        if (action == '-1') {
            return;
        }
        
        var ids = [];
        $('input[name="product_lines[]"]:checked').each(function() {
            ids.push($(this).val());
        });
        
        if (ids.length == 0) {
            alert('<?php _e('Please select items', 'bjt-product-admin'); ?>');
            return;
        }
        
        if (action == 'delete' && !confirm(bjt_admin.i18n.confirm_batch_delete)) {
            return;
        }
        
        // Perform batch action
        $.ajax({
            url: bjt_admin.rest_url + 'product-lines/batch',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', bjt_admin.rest_nonce);
            },
            data: {
                ids: ids,
                action: action
            },
            success: function(response) {
                alert(response.message);
                loadProductLines();
            },
            error: function(xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.message 
                    ? xhr.responseJSON.message 
                    : bjt_admin.i18n.error;
                alert(message);
                console.error(xhr.responseJSON || xhr.responseText);
            }
        });
    });
    
    // Trash single product line
    $(document).on('click', '.trash-product-line', function(e) {
        e.preventDefault();
        
        if (!confirm(bjt_admin.i18n.confirm_delete)) {
            return;
        }
        
        var id = $(this).data('id');
        
        $.ajax({
            url: bjt_admin.rest_url + 'product-lines/' + id,
            method: 'DELETE',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', bjt_admin.rest_nonce);
            },
            success: function(response) {
                alert(response.message);
                loadProductLines();
            },
            error: function(xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.message 
                    ? xhr.responseJSON.message 
                    : bjt_admin.i18n.error;
                alert(message);
                console.error(xhr.responseJSON || xhr.responseText);
            }
        });
    });
    
    // Select all checkboxes
    $('#cb-select-all-1, #cb-select-all-2').on('change', function() {
        var isChecked = $(this).prop('checked');
        $('input[name="product_lines[]"]').prop('checked', isChecked);
    });
});
</script>

<style>
.bjt-modal {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
}

.bjt-modal-content {
    background-color: #fefefe;
    margin: 50px auto;
    padding: 0;
    border: 1px solid #ddd;
    width: 80%;
    max-width: 800px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}

.bjt-modal-header {
    padding: 15px;
    border-bottom: 1px solid #ddd;
    background-color: #f5f5f5;
}

.bjt-modal-header h2 {
    margin: 0;
    padding: 0;
}

.bjt-modal-body {
    padding: 15px;
}

.bjt-modal-footer {
    padding: 15px;
    border-top: 1px solid #ddd;
    background-color: #f5f5f5;
    text-align: right;
}

.bjt-modal-close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.bjt-modal-close:hover,
.bjt-modal-close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}

.form-field {
    margin-bottom: 15px;
}

.form-field label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field textarea,
.form-field select {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

.form-field textarea {
    min-height: 100px;
}

.required {
    color: red;
}

.description {
    font-style: italic;
    color: #666;
    margin-top: 5px;
}
</style> 