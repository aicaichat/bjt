<?php
/**
 * Product lines admin page.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/admin/partials
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Get action
$action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Initialize database handler
$db = new BJT_Product_System_DB();

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit'])) {
    // Verify nonce
    if (!isset($_POST['bjt_product_line_nonce']) || !wp_verify_nonce($_POST['bjt_product_line_nonce'], 'bjt_product_line_action')) {
        wp_die(__('安全验证失败，请重试。', 'bjt-product-system'));
    }
    
    // Prepare data
    $data = array(
        'title_zh' => isset($_POST['title_zh']) ? sanitize_text_field($_POST['title_zh']) : '',
        'title_en' => isset($_POST['title_en']) ? sanitize_text_field($_POST['title_en']) : '',
        'description_zh' => isset($_POST['description_zh']) ? sanitize_textarea_field($_POST['description_zh']) : '',
        'description_en' => isset($_POST['description_en']) ? sanitize_textarea_field($_POST['description_en']) : '',
        'subitem1_zh' => isset($_POST['subitem1_zh']) ? sanitize_text_field($_POST['subitem1_zh']) : '',
        'subitem1_en' => isset($_POST['subitem1_en']) ? sanitize_text_field($_POST['subitem1_en']) : '',
        'subitem2_zh' => isset($_POST['subitem2_zh']) ? sanitize_text_field($_POST['subitem2_zh']) : '',
        'subitem2_en' => isset($_POST['subitem2_en']) ? sanitize_text_field($_POST['subitem2_en']) : '',
        'subitem3_zh' => isset($_POST['subitem3_zh']) ? sanitize_text_field($_POST['subitem3_zh']) : '',
        'subitem3_en' => isset($_POST['subitem3_en']) ? sanitize_text_field($_POST['subitem3_en']) : '',
        'image_url' => isset($_POST['image_url']) ? esc_url_raw($_POST['image_url']) : '',
        'code' => isset($_POST['code']) ? sanitize_key($_POST['code']) : '',
        'status' => isset($_POST['status']) ? sanitize_text_field($_POST['status']) : 'publish',
        'sort_order' => isset($_POST['sort_order']) ? intval($_POST['sort_order']) : 0,
    );
    
    // Validate required fields
    if (empty($data['title_zh']) || empty($data['title_en']) || empty($data['code'])) {
        $error_message = __('请填写必填字段：中文标题、英文标题和产品线代码。', 'bjt-product-system');
    } else {
        // Add or update
        if ($action === 'add') {
            $result = $db->add_product_line($data);
            if ($result) {
                $message = __('产品线添加成功。', 'bjt-product-system');
                $action = 'edit';
                $id = $result;
            } else {
                $error_message = __('产品线添加失败。', 'bjt-product-system');
            }
        } elseif ($action === 'edit' && $id > 0) {
            $result = $db->update_product_line($id, $data);
            if ($result) {
                $message = __('产品线更新成功。', 'bjt-product-system');
            } else {
                $error_message = __('产品线更新失败。', 'bjt-product-system');
            }
        }
    }
}

// Delete product line
if ($action === 'delete' && $id > 0) {
    // Verify nonce
    if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'delete_product_line_' . $id)) {
        wp_die(__('安全验证失败，请重试。', 'bjt-product-system'));
    }
    
    $result = $db->delete_product_line($id);
    if ($result) {
        $message = __('产品线删除成功。', 'bjt-product-system');
    } else {
        $error_message = __('产品线删除失败。', 'bjt-product-system');
    }
    
    $action = '';
    $id = 0;
}

// Get product line data for edit
$product_line = array();
if ($action === 'edit' && $id > 0) {
    $product_line = $db->get_product_line($id);
    if (empty($product_line)) {
        $error_message = __('产品线不存在。', 'bjt-product-system');
        $action = '';
        $id = 0;
    }
}

// Display the page
?>
<div class="wrap">
    <h1 class="wp-heading-inline"><?php _e('产品线管理', 'bjt-product-system'); ?></h1>
    
    <?php if ($action !== 'add' && $action !== 'edit') : ?>
        <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=add'); ?>" class="page-title-action"><?php _e('添加产品线', 'bjt-product-system'); ?></a>
    <?php endif; ?>
    
    <hr class="wp-header-end">
    
    <?php if (isset($message)) : ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo $message; ?></p>
        </div>
    <?php endif; ?>
    
    <?php if (isset($error_message)) : ?>
        <div class="notice notice-error is-dismissible">
            <p><?php echo $error_message; ?></p>
        </div>
    <?php endif; ?>
    
    <?php if ($action === 'add' || $action === 'edit') : ?>
        <!-- Add/Edit Form -->
        <div class="card">
            <h2><?php echo $action === 'add' ? __('添加产品线', 'bjt-product-system') : __('编辑产品线', 'bjt-product-system'); ?></h2>
            
            <form method="post" action="">
                <?php wp_nonce_field('bjt_product_line_action', 'bjt_product_line_nonce'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="title_zh"><?php _e('中文标题', 'bjt-product-system'); ?> <span class="required">*</span></label></th>
                        <td>
                            <input name="title_zh" type="text" id="title_zh" value="<?php echo isset($product_line['title_zh']) ? esc_attr($product_line['title_zh']) : ''; ?>" class="regular-text" required>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="title_en"><?php _e('英文标题', 'bjt-product-system'); ?> <span class="required">*</span></label></th>
                        <td>
                            <input name="title_en" type="text" id="title_en" value="<?php echo isset($product_line['title_en']) ? esc_attr($product_line['title_en']) : ''; ?>" class="regular-text" required>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="description_zh"><?php _e('中文描述', 'bjt-product-system'); ?></label></th>
                        <td>
                            <textarea name="description_zh" id="description_zh" class="large-text" rows="5"><?php echo isset($product_line['description_zh']) ? esc_textarea($product_line['description_zh']) : ''; ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="description_en"><?php _e('英文描述', 'bjt-product-system'); ?></label></th>
                        <td>
                            <textarea name="description_en" id="description_en" class="large-text" rows="5"><?php echo isset($product_line['description_en']) ? esc_textarea($product_line['description_en']) : ''; ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem1_zh"><?php _e('子项1中文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem1_zh" type="text" id="subitem1_zh" value="<?php echo isset($product_line['subitem1_zh']) ? esc_attr($product_line['subitem1_zh']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem1_en"><?php _e('子项1英文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem1_en" type="text" id="subitem1_en" value="<?php echo isset($product_line['subitem1_en']) ? esc_attr($product_line['subitem1_en']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem2_zh"><?php _e('子项2中文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem2_zh" type="text" id="subitem2_zh" value="<?php echo isset($product_line['subitem2_zh']) ? esc_attr($product_line['subitem2_zh']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem2_en"><?php _e('子项2英文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem2_en" type="text" id="subitem2_en" value="<?php echo isset($product_line['subitem2_en']) ? esc_attr($product_line['subitem2_en']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem3_zh"><?php _e('子项3中文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem3_zh" type="text" id="subitem3_zh" value="<?php echo isset($product_line['subitem3_zh']) ? esc_attr($product_line['subitem3_zh']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="subitem3_en"><?php _e('子项3英文', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="subitem3_en" type="text" id="subitem3_en" value="<?php echo isset($product_line['subitem3_en']) ? esc_attr($product_line['subitem3_en']) : ''; ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="image_url"><?php _e('图片URL', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="image_url" type="text" id="image_url" value="<?php echo isset($product_line['image_url']) ? esc_url($product_line['image_url']) : ''; ?>" class="regular-text">
                            <button type="button" class="button" id="upload_image_button"><?php _e('选择图片', 'bjt-product-system'); ?></button>
                            <div id="image_preview">
                                <?php if (isset($product_line['image_url']) && !empty($product_line['image_url'])) : ?>
                                    <img src="<?php echo esc_url($product_line['image_url']); ?>" alt="<?php _e('图片预览', 'bjt-product-system'); ?>" style="max-width: 200px; margin-top: 10px;">
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="code"><?php _e('产品线代码', 'bjt-product-system'); ?> <span class="required">*</span></label></th>
                        <td>
                            <input name="code" type="text" id="code" value="<?php echo isset($product_line['code']) ? esc_attr($product_line['code']) : ''; ?>" class="regular-text" required>
                            <p class="description"><?php _e('唯一标识符，只能包含小写字母、数字和下划线。例如：air_cushion', 'bjt-product-system'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="status"><?php _e('状态', 'bjt-product-system'); ?></label></th>
                        <td>
                            <select name="status" id="status">
                                <option value="publish" <?php selected(isset($product_line['status']) ? $product_line['status'] : 'publish', 'publish'); ?>><?php _e('发布', 'bjt-product-system'); ?></option>
                                <option value="draft" <?php selected(isset($product_line['status']) ? $product_line['status'] : 'publish', 'draft'); ?>><?php _e('草稿', 'bjt-product-system'); ?></option>
                                <option value="trash" <?php selected(isset($product_line['status']) ? $product_line['status'] : 'publish', 'trash'); ?>><?php _e('回收站', 'bjt-product-system'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="sort_order"><?php _e('排序', 'bjt-product-system'); ?></label></th>
                        <td>
                            <input name="sort_order" type="number" id="sort_order" value="<?php echo isset($product_line['sort_order']) ? intval($product_line['sort_order']) : 0; ?>" class="small-text">
                            <p class="description"><?php _e('数字越小排序越靠前', 'bjt-product-system'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="submit" id="submit" class="button button-primary" value="<?php echo $action === 'add' ? __('添加产品线', 'bjt-product-system') : __('更新产品线', 'bjt-product-system'); ?>">
                    <a href="<?php echo admin_url('admin.php?page=bjt-product-lines'); ?>" class="button"><?php _e('取消', 'bjt-product-system'); ?></a>
                </p>
            </form>
        </div>
    <?php else : ?>
        <!-- List Table -->
        <?php
        // Get product lines
        $args = array(
            'page' => isset($_GET['paged']) ? intval($_GET['paged']) : 1,
            'per_page' => 20,
            'orderby' => isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : 'sort_order',
            'order' => isset($_GET['order']) ? sanitize_text_field($_GET['order']) : 'ASC',
            'status' => isset($_GET['status']) ? sanitize_text_field($_GET['status']) : 'publish'
        );
        
        $product_lines = $db->get_product_lines($args);
        ?>
        
        <ul class="subsubsub">
            <?php
            global $wpdb;
            $statuses = array(
                'publish' => __('已发布', 'bjt-product-system'),
                'draft' => __('草稿', 'bjt-product-system'),
                'trash' => __('回收站', 'bjt-product-system')
            );
            
            $status_counts = array();
            foreach ($statuses as $status_key => $status_label) {
                $count = $wpdb->get_var($wpdb->prepare("
                    SELECT COUNT(*) 
                    FROM " . $db->get_table_name('product_lines') . " 
                    WHERE status = %s
                ", $status_key));
                
                $status_counts[$status_key] = $count;
            }
            
            $current_status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : 'publish';
            
            $links = array();
            foreach ($statuses as $status_key => $status_label) {
                $class = $status_key === $current_status ? ' class="current"' : '';
                $url = add_query_arg('status', $status_key, admin_url('admin.php?page=bjt-product-lines'));
                $links[] = sprintf(
                    '<li><a href="%s"%s>%s <span class="count">(%s)</span></a></li>',
                    esc_url($url),
                    $class,
                    $status_label,
                    $status_counts[$status_key]
                );
            }
            
            echo implode(' | ', $links);
            ?>
        </ul>
        
        <form method="get">
            <input type="hidden" name="page" value="bjt-product-lines">
            <?php if (isset($_GET['status'])) : ?>
                <input type="hidden" name="status" value="<?php echo esc_attr($_GET['status']); ?>">
            <?php endif; ?>
            
            <p class="search-box">
                <label class="screen-reader-text" for="post-search-input"><?php _e('搜索产品线:', 'bjt-product-system'); ?></label>
                <input type="search" id="post-search-input" name="s" value="<?php echo isset($_GET['s']) ? esc_attr($_GET['s']) : ''; ?>">
                <input type="submit" id="search-submit" class="button" value="<?php _e('搜索产品线', 'bjt-product-system'); ?>">
            </p>
        </form>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-id"><?php _e('ID', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php _e('标题', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-code"><?php _e('代码', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-sort-order"><?php _e('排序', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php _e('状态', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-date"><?php _e('创建时间', 'bjt-product-system'); ?></th>
                </tr>
            </thead>
            
            <tbody>
                <?php if (!empty($product_lines['items'])) : ?>
                    <?php foreach ($product_lines['items'] as $item) : ?>
                        <tr>
                            <td class="column-id"><?php echo $item['id']; ?></td>
                            <td class="column-title column-primary">
                                <strong>
                                    <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id=' . $item['id']); ?>" class="row-title">
                                        <?php echo esc_html($item['title_zh']); ?>
                                    </a>
                                </strong>
                                <div class="row-actions">
                                    <span class="edit">
                                        <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id=' . $item['id']); ?>"><?php _e('编辑', 'bjt-product-system'); ?></a> |
                                    </span>
                                    <span class="delete">
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bjt-product-lines&action=delete&id=' . $item['id']), 'delete_product_line_' . $item['id']); ?>" class="submitdelete" onclick="return confirm('<?php _e('确定要删除此产品线吗？此操作不可撤销。', 'bjt-product-system'); ?>');"><?php _e('删除', 'bjt-product-system'); ?></a>
                                    </span>
                                </div>
                            </td>
                            <td class="column-code"><?php echo esc_html($item['code']); ?></td>
                            <td class="column-sort-order"><?php echo intval($item['sort_order']); ?></td>
                            <td class="column-status">
                                <?php
                                $status_labels = array(
                                    'publish' => __('已发布', 'bjt-product-system'),
                                    'draft' => __('草稿', 'bjt-product-system'),
                                    'trash' => __('回收站', 'bjt-product-system')
                                );
                                echo isset($status_labels[$item['status']]) ? $status_labels[$item['status']] : $item['status'];
                                ?>
                            </td>
                            <td class="column-date"><?php echo date_i18n(get_option('date_format'), strtotime($item['created_at'])); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else : ?>
                    <tr>
                        <td colspan="6"><?php _e('暂无数据', 'bjt-product-system'); ?></td>
                    </tr>
                <?php endif; ?>
            </tbody>
            
            <tfoot>
                <tr>
                    <th scope="col" class="manage-column column-id"><?php _e('ID', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php _e('标题', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-code"><?php _e('代码', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-sort-order"><?php _e('排序', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php _e('状态', 'bjt-product-system'); ?></th>
                    <th scope="col" class="manage-column column-date"><?php _e('创建时间', 'bjt-product-system'); ?></th>
                </tr>
            </tfoot>
        </table>
        
        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <?php
                $page_links = paginate_links(array(
                    'base' => add_query_arg('paged', '%#%'),
                    'format' => '',
                    'prev_text' => '&laquo;',
                    'next_text' => '&raquo;',
                    'total' => $product_lines['total_pages'],
                    'current' => $args['page']
                ));
                
                if ($page_links) {
                    echo '<span class="pagination-links">' . $page_links . '</span>';
                }
                ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<script>
(function($) {
    // Media uploader
    $(document).ready(function() {
        $('#upload_image_button').click(function(e) {
            e.preventDefault();
            
            var custom_uploader = wp.media({
                title: '<?php _e('选择图片', 'bjt-product-system'); ?>',
                button: {
                    text: '<?php _e('使用这张图片', 'bjt-product-system'); ?>'
                },
                multiple: false
            });
            
            custom_uploader.on('select', function() {
                var attachment = custom_uploader.state().get('selection').first().toJSON();
                $('#image_url').val(attachment.url);
                $('#image_preview').html('<img src="' + attachment.url + '" alt="<?php _e('图片预览', 'bjt-product-system'); ?>" style="max-width: 200px; margin-top: 10px;">');
            });
            
            custom_uploader.open();
        });
    });
})(jQuery);
</script> 