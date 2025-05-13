<?php
// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// Get current page parameters
$page = isset($_GET['paged']) ? absint($_GET['paged']) : 1;
$search = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';

// Query parameters
$args = array(
    'post_type' => 'bjt_product_line',
    'posts_per_page' => 20,
    'paged' => $page,
    'orderby' => 'title',
    'order' => 'ASC'
);

// Add search if provided
if (!empty($search)) {
    $args['s'] = $search;
}

// Get product lines
$product_lines_query = new WP_Query($args);
?>

<div class="wrap bjt-product-lines-page">
    <h1 class="wp-heading-inline"><?php echo esc_html__('Product Lines', 'bjt-product-admin'); ?></h1>
    <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_product_line')); ?>" class="page-title-action">
        <?php echo esc_html__('Add New Product Line', 'bjt-product-admin'); ?>
    </a>
    
    <hr class="wp-header-end">
    
    <!-- Filter and search form -->
    <form id="bjt-product-lines-filter" method="get">
        <input type="hidden" name="page" value="bjt-product-lines">
        
        <div class="tablenav top">
            <div class="alignright">
                <p class="search-box">
                    <label class="screen-reader-text" for="bjt-product-line-search">
                        <?php esc_html_e('Search Product Lines:', 'bjt-product-admin'); ?>
                    </label>
                    <input type="search" id="bjt-product-line-search" name="s" value="<?php echo esc_attr($search); ?>">
                    <input type="submit" class="button" value="<?php esc_attr_e('Search', 'bjt-product-admin'); ?>">
                </p>
            </div>
            
            <br class="clear">
        </div>
        
        <!-- Product Lines table -->
        <table class="wp-list-table widefat fixed striped product-lines">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Product Line', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-products"><?php esc_html_e('Products', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                </tr>
            </thead>
            
            <tbody id="the-list">
                <?php
                if ($product_lines_query->have_posts()) {
                    while ($product_lines_query->have_posts()) {
                        $product_lines_query->the_post();
                        $product_line_id = get_the_ID();
                        $edit_link = get_edit_post_link($product_line_id);
                        
                        // Get featured image
                        $thumbnail = get_the_post_thumbnail($product_line_id, array(50, 50));
                        if (empty($thumbnail)) {
                            $thumbnail = '<div class="bjt-no-image">N/A</div>';
                        }
                        
                        // Get product count for this product line
                        $product_count = new WP_Query(array(
                            'post_type' => 'bjt_product',
                            'posts_per_page' => -1,
                            'fields' => 'ids',
                            'meta_query' => array(
                                array(
                                    'key' => '_bjt_product_line',
                                    'value' => $product_line_id,
                                    'compare' => '='
                                )
                            )
                        ));
                        
                        // Get status
                        $status = get_post_status($product_line_id);
                        $status_label = 'publish' === $status ? __('Published', 'bjt-product-admin') : __('Draft', 'bjt-product-admin');
                        $status_class = 'publish' === $status ? 'status-publish' : 'status-draft';
                        
                        // Get excerpt 
                        $excerpt = get_the_excerpt();
                        if (empty($excerpt) && has_excerpt()) {
                            $excerpt = wp_trim_words(get_the_content(), 20);
                        }
                        ?>
                        <tr>
                            <td class="column-image"><?php echo $thumbnail; ?></td>
                            <td class="column-title column-primary">
                                <strong>
                                    <a href="<?php echo esc_url($edit_link); ?>" class="row-title">
                                        <?php the_title(); ?>
                                    </a>
                                </strong>
                                <div class="row-actions">
                                    <span class="edit">
                                        <a href="<?php echo esc_url($edit_link); ?>">
                                            <?php esc_html_e('Edit', 'bjt-product-admin'); ?>
                                        </a> | 
                                    </span>
                                    <span class="view">
                                        <a href="<?php the_permalink(); ?>">
                                            <?php esc_html_e('View', 'bjt-product-admin'); ?>
                                        </a> | 
                                    </span>
                                    <span class="trash">
                                        <a href="<?php echo get_delete_post_link($product_line_id); ?>" class="submitdelete">
                                            <?php esc_html_e('Trash', 'bjt-product-admin'); ?>
                                        </a>
                                    </span>
                                </div>
                            </td>
                            <td class="column-description">
                                <?php echo esc_html($excerpt); ?>
                            </td>
                            <td class="column-products">
                                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-products&product_line=' . $product_line_id)); ?>">
                                    <?php echo esc_html($product_count->found_posts); ?>
                                </a>
                            </td>
                            <td class="column-status">
                                <span class="<?php echo esc_attr($status_class); ?>">
                                    <?php echo esc_html($status_label); ?>
                                </span>
                            </td>
                        </tr>
                        <?php
                    }
                } else {
                    ?>
                    <tr>
                        <td colspan="5"><?php esc_html_e('No product lines found.', 'bjt-product-admin'); ?></td>
                    </tr>
                    <?php
                }
                wp_reset_postdata();
                ?>
            </tbody>
            
            <tfoot>
                <tr>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Product Line', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-products"><?php esc_html_e('Products', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                </tr>
            </tfoot>
        </table>
        
        <!-- Pagination -->
        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <?php
                $total_pages = $product_lines_query->max_num_pages;
                
                if ($total_pages > 1) {
                    $current_page = max(1, $page);
                    
                    echo '<span class="displaying-num">' . 
                         sprintf(
                             _n('%s item', '%s items', $product_lines_query->found_posts, 'bjt-product-admin'),
                             number_format_i18n($product_lines_query->found_posts)
                         ) . 
                         '</span>';
                    
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => __('&laquo;', 'bjt-product-admin'),
                        'next_text' => __('&raquo;', 'bjt-product-admin'),
                        'total' => $total_pages,
                        'current' => $current_page
                    ));
                }
                ?>
            </div>
        </div>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // 语言选项卡切换
    $('.bjt-language-tab').on('click', function() {
        $('.bjt-language-tab').removeClass('active');
        $(this).addClass('active');
        
        var language = $(this).data('language');
        $('.bjt-language-content').removeClass('active');
        $('.bjt-language-content[data-language="' + language + '"]').addClass('active');
    });
    
    // 树形菜单展开/收起
    $('.bjt-has-submenu > a').on('click', function(e) {
        e.preventDefault();
        var $parent = $(this).parent();
        var $submenu = $parent.find('.bjt-submenu').first();
        var $icon = $(this).find('.bjt-submenu-icon');
        
        if ($submenu.hasClass('bjt-submenu-open')) {
            $submenu.removeClass('bjt-submenu-open');
            $submenu.slideUp(200);
            $icon.removeClass('dashicons-arrow-down-alt2').addClass('dashicons-arrow-right-alt2');
        } else {
            $submenu.addClass('bjt-submenu-open');
            $submenu.slideDown(200);
            $icon.removeClass('dashicons-arrow-right-alt2').addClass('dashicons-arrow-down-alt2');
        }
    });
    
    // 初始状态下展开活动菜单
    $('.bjt-submenu-open').show();
    
    // 媒体上传
    var frame;
    $('.bjt-upload-image').on('click', function(e) {
        e.preventDefault();
        
        if (frame) {
            frame.open();
            return;
        }
        
        frame = wp.media({
            title: '<?php _e("Select or Upload Product Line Image", "bjt-product-admin"); ?>',
            button: {
                text: '<?php _e("Use this image", "bjt-product-admin"); ?>'
            },
            multiple: false
        });
        
        frame.on('select', function() {
            var attachment = frame.state().get('selection').first().toJSON();
            $('#product_line_image_id').val(attachment.id);
            
            var $preview = $('.bjt-image-preview');
            $preview.html('<img src="' + attachment.url + '" alt="Product Line"><button type="button" class="bjt-remove-image"><span class="dashicons dashicons-no-alt"></span></button>');
        });
        
        frame.open();
    });
    
    // 删除图片
    $(document).on('click', '.bjt-remove-image', function(e) {
        e.preventDefault();
        
        $('#product_line_image_id').val('');
        var $preview = $('.bjt-image-preview');
        $preview.html('<div class="bjt-no-image"><span class="dashicons dashicons-format-image"></span><p><?php _e("No image selected", "bjt-product-admin"); ?></p></div>');
    });
    
    // 顶部下拉菜单
    $('.bjt-dropdown').on('click', function(e) {
        $(this).find('.bjt-dropdown-content').toggleClass('show');
    });
    
    // 语言切换器
    $('.bjt-current-lang').on('click', function(e) {
        e.preventDefault();
        $('.bjt-lang-options').toggleClass('show');
    });
    
    // 点击页面其他地方关闭下拉菜单
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.bjt-dropdown').length) {
            $('.bjt-dropdown-content').removeClass('show');
        }
        
        if (!$(e.target).closest('.bjt-language-switcher').length) {
            $('.bjt-lang-options').removeClass('show');
        }
    });
});
</script> 