<?php
// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// Get current page parameters
$page = isset($_GET['paged']) ? absint($_GET['paged']) : 1;
$search = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';
$product_line_filter = isset($_GET['product_line']) ? absint($_GET['product_line']) : 0;

// Query parameters
$args = array(
    'post_type' => 'bjt_product',
    'posts_per_page' => 20,
    'paged' => $page,
    'orderby' => 'meta_value',
    'meta_key' => '_bjt_product_sort_order',
    'order' => 'ASC'
);

// Add search if provided
if (!empty($search)) {
    $args['s'] = $search;
}

// Add product line filter if provided
if ($product_line_filter > 0) {
    $args['meta_query'] = array(
        array(
            'key' => '_bjt_product_line',
            'value' => $product_line_filter,
            'compare' => '='
        )
    );
}

// Get products
$products_query = new WP_Query($args);

// Get all product lines for filter dropdown
$product_lines = get_posts(array(
    'post_type' => 'bjt_product_line',
    'posts_per_page' => -1,
    'orderby' => 'title',
    'order' => 'ASC'
));
?>

<div class="wrap bjt-products-page">
    <h1 class="wp-heading-inline"><?php echo esc_html__('Products', 'bjt-product-admin'); ?></h1>
    <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_product')); ?>" class="page-title-action">
        <?php echo esc_html__('Add New Product', 'bjt-product-admin'); ?>
    </a>
    
    <hr class="wp-header-end">
    
    <!-- Filter and search form -->
    <form id="bjt-products-filter" method="get">
        <input type="hidden" name="page" value="bjt-products">
        
        <div class="tablenav top">
            <div class="alignleft actions">
                <label for="filter-by-product-line" class="screen-reader-text">
                    <?php esc_html_e('Filter by product line', 'bjt-product-admin'); ?>
                </label>
                <select id="filter-by-product-line" name="product_line">
                    <option value="0"><?php esc_html_e('All Product Lines', 'bjt-product-admin'); ?></option>
                    <?php
                    foreach ($product_lines as $line) {
                        printf(
                            '<option value="%s" %s>%s</option>',
                            esc_attr($line->ID),
                            selected($product_line_filter, $line->ID, false),
                            esc_html($line->post_title)
                        );
                    }
                    ?>
                </select>
                <input type="submit" class="button" value="<?php esc_attr_e('Filter', 'bjt-product-admin'); ?>">
            </div>
            
            <div class="alignright">
                <p class="search-box">
                    <label class="screen-reader-text" for="bjt-product-search">
                        <?php esc_html_e('Search Products:', 'bjt-product-admin'); ?>
                    </label>
                    <input type="search" id="bjt-product-search" name="s" value="<?php echo esc_attr($search); ?>">
                    <input type="submit" class="button" value="<?php esc_attr_e('Search', 'bjt-product-admin'); ?>">
                </p>
            </div>
            
            <br class="clear">
        </div>
        
        <!-- Products table -->
        <table class="wp-list-table widefat fixed striped products">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Product Name', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-code"><?php esc_html_e('Product Code', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-product-line"><?php esc_html_e('Product Line', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-features"><?php esc_html_e('Features', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-specs"><?php esc_html_e('Specifications', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                </tr>
            </thead>
            
            <tbody id="the-list">
                <?php
                if ($products_query->have_posts()) {
                    while ($products_query->have_posts()) {
                        $products_query->the_post();
                        $product_id = get_the_ID();
                        $edit_link = get_edit_post_link($product_id);
                        
                        // Get featured image
                        $thumbnail = get_the_post_thumbnail($product_id, array(50, 50));
                        if (empty($thumbnail)) {
                            $thumbnail = '<div class="bjt-no-image">N/A</div>';
                        }
                        
                        // Get product code
                        $product_code = get_post_meta($product_id, '_bjt_product_code', true);
                        
                        // Get product line
                        $product_line_id = get_post_meta($product_id, '_bjt_product_line', true);
                        $product_line_name = '';
                        if ($product_line_id) {
                            $product_line = get_post($product_line_id);
                            if ($product_line) {
                                $product_line_name = $product_line->post_title;
                            }
                        }
                        
                        // Get features count
                        $features = get_post_meta($product_id, '_bjt_product_features', true);
                        $features_count = is_array($features) ? count($features) : 0;
                        
                        // Get specifications count
                        $specifications = get_post_meta($product_id, '_bjt_product_specifications', true);
                        $specs_count = is_array($specifications) ? count($specifications) : 0;
                        
                        // Get status
                        $status = get_post_status($product_id);
                        $status_label = 'publish' === $status ? __('Published', 'bjt-product-admin') : __('Draft', 'bjt-product-admin');
                        $status_class = 'publish' === $status ? 'status-publish' : 'status-draft';
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
                                        <a href="<?php echo get_delete_post_link($product_id); ?>" class="submitdelete">
                                            <?php esc_html_e('Trash', 'bjt-product-admin'); ?>
                                        </a>
                                    </span>
                                </div>
                            </td>
                            <td class="column-code">
                                <?php echo esc_html($product_code); ?>
                            </td>
                            <td class="column-product-line">
                                <?php 
                                if ($product_line_id) {
                                    echo '<a href="' . esc_url(admin_url('admin.php?page=bjt-products&product_line=' . $product_line_id)) . '">' . 
                                          esc_html($product_line_name) . 
                                         '</a>';
                                } else {
                                    esc_html_e('N/A', 'bjt-product-admin');
                                }
                                ?>
                            </td>
                            <td class="column-features">
                                <?php echo esc_html($features_count); ?>
                            </td>
                            <td class="column-specs">
                                <?php echo esc_html($specs_count); ?>
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
                        <td colspan="7"><?php esc_html_e('No products found.', 'bjt-product-admin'); ?></td>
                    </tr>
                    <?php
                }
                wp_reset_postdata();
                ?>
            </tbody>
            
            <tfoot>
                <tr>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Product Name', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-code"><?php esc_html_e('Product Code', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-product-line"><?php esc_html_e('Product Line', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-features"><?php esc_html_e('Features', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-specs"><?php esc_html_e('Specifications', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                </tr>
            </tfoot>
        </table>
        
        <!-- Pagination -->
        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <?php
                $total_pages = $products_query->max_num_pages;
                
                if ($total_pages > 1) {
                    $current_page = max(1, $page);
                    
                    echo '<span class="displaying-num">' . 
                         sprintf(
                             _n('%s item', '%s items', $products_query->found_posts, 'bjt-product-admin'),
                             number_format_i18n($products_query->found_posts)
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