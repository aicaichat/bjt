<?php
if (!defined('ABSPATH')) {
    exit;
}

$product_lines = get_posts(array(
    'post_type' => 'product_line',
    'posts_per_page' => -1,
    'orderby' => 'menu_order',
    'order' => 'ASC'
));

$message = isset($_GET['message']) ? $_GET['message'] : '';
?>

<div class="wrap bjt-product-lines">
    <h1 class="wp-heading-inline">产品线管理</h1>
    <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=new'); ?>" class="page-title-action">添加产品线</a>
    
    <?php if ($message === 'saved'): ?>
    <div class="notice notice-success is-dismissible">
        <p>产品线已保存。</p>
    </div>
    <?php endif; ?>
    
    <?php if ($message === 'deleted'): ?>
    <div class="notice notice-success is-dismissible">
        <p>产品线已删除。</p>
    </div>
    <?php endif; ?>
    
    <div class="product-lines-list">
        <?php if (!empty($product_lines)): ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th class="column-order">排序</th>
                        <th class="column-image">图片</th>
                        <th class="column-title">标题</th>
                        <th class="column-specs">规格数量</th>
                        <th class="column-status">状态</th>
                        <th class="column-actions">操作</th>
                    </tr>
                </thead>
                <tbody id="the-list">
                    <?php foreach ($product_lines as $product_line): 
                        $title_cn = get_post_meta($product_line->ID, 'title_cn', true);
                        $title_en = get_post_meta($product_line->ID, 'title_en', true);
                        $specifications = get_post_meta($product_line->ID, 'specifications', true);
                        $spec_count = is_array($specifications) ? count($specifications) : 0;
                        $status = $product_line->post_status;
                        $featured_image = get_post_thumbnail_id($product_line->ID);
                    ?>
                    <tr id="product-line-<?php echo $product_line->ID; ?>" data-id="<?php echo $product_line->ID; ?>">
                        <td class="column-order">
                            <span class="dashicons dashicons-move"></span>
                        </td>
                        <td class="column-image">
                            <?php if ($featured_image): ?>
                                <?php echo wp_get_attachment_image($featured_image, array(50, 50)); ?>
                            <?php endif; ?>
                        </td>
                        <td class="column-title">
                            <strong>
                                <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=edit&id=' . $product_line->ID); ?>">
                                    <?php echo esc_html($title_cn); ?>
                                </a>
                            </strong>
                            <div class="row-actions">
                                <span class="edit">
                                    <a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=edit&id=' . $product_line->ID); ?>">编辑</a> |
                                </span>
                                <span class="trash">
                                    <a href="#" class="delete-product-line" data-id="<?php echo $product_line->ID; ?>">删除</a>
                                </span>
                            </div>
                            <div class="title-en"><?php echo esc_html($title_en); ?></div>
                        </td>
                        <td class="column-specs">
                            <?php echo $spec_count; ?>
                        </td>
                        <td class="column-status">
                            <span class="status-<?php echo $status; ?>">
                                <?php echo $status === 'publish' ? '已发布' : '草稿'; ?>
                            </span>
                        </td>
                        <td class="column-actions">
                            <button type="button" class="button toggle-status" data-id="<?php echo $product_line->ID; ?>" data-status="<?php echo $status; ?>">
                                <?php echo $status === 'publish' ? '设为草稿' : '发布'; ?>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <div class="no-items">
                <p>暂无产品线。<a href="<?php echo admin_url('admin.php?page=bjt-product-admin&action=new'); ?>">创建第一个产品线</a></p>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // 排序功能
    $('#the-list').sortable({
        handle: '.dashicons-move',
        axis: 'y',
        update: function(event, ui) {
            var order = $(this).sortable('toArray', { attribute: 'data-id' });
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'update_product_line_order',
                    order: order,
                    nonce: '<?php echo wp_create_nonce('update_product_line_order'); ?>'
                },
                success: function(response) {
                    if (!response.success) {
                        alert('更新排序失败，请重试。');
                    }
                },
                error: function() {
                    alert('更新排序失败，请重试。');
                }
            });
        }
    });
    
    // 切换状态
    $('.toggle-status').click(function() {
        var $button = $(this);
        var productLineId = $button.data('id');
        var currentStatus = $button.data('status');
        var newStatus = currentStatus === 'publish' ? 'draft' : 'publish';
        
        $button.prop('disabled', true);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'toggle_product_line_status',
                product_line_id: productLineId,
                status: newStatus,
                nonce: '<?php echo wp_create_nonce('toggle_product_line_status'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    $button.data('status', newStatus);
                    $button.text(newStatus === 'publish' ? '设为草稿' : '发布');
                    $button.closest('tr').find('.column-status .status-' + currentStatus)
                        .removeClass('status-' + currentStatus)
                        .addClass('status-' + newStatus)
                        .text(newStatus === 'publish' ? '已发布' : '草稿');
                } else {
                    alert('更新状态失败，请重试。');
                }
                $button.prop('disabled', false);
            },
            error: function() {
                alert('更新状态失败，请重试。');
                $button.prop('disabled', false);
            }
        });
    });
    
    // 删除产品线
    $('.delete-product-line').click(function(e) {
        e.preventDefault();
        
        var $link = $(this);
        var productLineId = $link.data('id');
        
        if (!confirm('确定要删除这个产品线吗？此操作无法撤销。')) {
            return;
        }
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_product_line',
                product_line_id: productLineId,
                nonce: '<?php echo wp_create_nonce('delete_product_line'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    $link.closest('tr').fadeOut(400, function() {
                        $(this).remove();
                        if ($('#the-list tr').length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    alert('删除失败，请重试。');
                }
            },
            error: function() {
                alert('删除失败，请重试。');
            }
        });
    });
});
</script>

<style>
.bjt-product-lines {
    margin: 20px 0;
}

.product-lines-list {
    margin-top: 20px;
}

.column-order {
    width: 50px;
    text-align: center;
}

.column-order .dashicons {
    cursor: move;
    color: #999;
}

.column-image {
    width: 60px;
}

.column-image img {
    border-radius: 4px;
}

.column-specs {
    width: 100px;
    text-align: center;
}

.column-status {
    width: 100px;
}

.column-actions {
    width: 120px;
    text-align: right;
}

.title-en {
    color: #666;
    font-size: 12px;
    margin-top: 4px;
}

.status-publish {
    color: #46b450;
}

.status-draft {
    color: #999;
}

.no-items {
    padding: 40px;
    text-align: center;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
}

@media screen and (max-width: 782px) {
    .column-order,
    .column-specs,
    .column-status {
        display: none;
    }
    
    .column-actions {
        text-align: left;
    }
}
</style> 