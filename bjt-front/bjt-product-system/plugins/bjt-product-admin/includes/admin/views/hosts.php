<?php
if (!defined('ABSPATH')) { exit; }

// Get current page parameters for hosts
$host_page = isset($_GET['host_paged']) ? absint($_GET['host_paged']) : 1;
$host_search = isset($_GET['host_s']) ? sanitize_text_field($_GET['host_s']) : '';

// Get current page parameters for part numbers
$part_page = isset($_GET['part_paged']) ? absint($_GET['part_paged']) : 1;
$part_search = isset($_GET['part_s']) ? sanitize_text_field($_GET['part_s']) : '';
$host_filter = isset($_GET['host_id']) ? absint($_GET['host_id']) : 0;

// Query parameters for hosts
$hosts_args = array(
    'post_type' => 'bjt_host',
    'posts_per_page' => 10,
    'paged' => $host_page,
    'orderby' => 'title',
    'order' => 'ASC'
);

// Add search if provided
if (!empty($host_search)) {
    $hosts_args['s'] = $host_search;
}

// Get hosts
$hosts_query = new WP_Query($hosts_args);

// Query parameters for part numbers
$parts_args = array(
    'post_type' => 'bjt_part',
    'posts_per_page' => 10,
    'paged' => $part_page,
    'orderby' => 'title',
    'order' => 'ASC'
);

// Add search if provided
if (!empty($part_search)) {
    $parts_args['s'] = $part_search;
}

// Add host filter if provided
if ($host_filter > 0) {
    $parts_args['meta_query'] = array(
        array(
            'key' => '_bjt_host_id',
            'value' => $host_filter,
            'compare' => '='
        )
    );
}

// Get part numbers
$parts_query = new WP_Query($parts_args);

// Get all hosts for filter dropdown
$all_hosts = get_posts(array(
    'post_type' => 'bjt_host',
    'posts_per_page' => -1,
    'orderby' => 'title',
    'order' => 'ASC'
));
?>

<div class="wrap bjt-hosts-page">
    <!-- Host Models Section -->
    <h1 class="wp-heading-inline"><?php echo esc_html__('Host Models', 'bjt-product-admin'); ?></h1>
    <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_host')); ?>" class="page-title-action">
        <?php echo esc_html__('Add New Host Model', 'bjt-product-admin'); ?>
    </a>
    
    <hr class="wp-header-end">
    
    <!-- Host Models filter and search form -->
    <form id="bjt-hosts-filter" method="get">
        <input type="hidden" name="page" value="bjt-hosts">
        
        <div class="tablenav top">
            <div class="alignright">
                <p class="search-box">
                    <label class="screen-reader-text" for="bjt-host-search">
                        <?php esc_html_e('Search Host Models:', 'bjt-product-admin'); ?>
                    </label>
                    <input type="search" id="bjt-host-search" name="host_s" value="<?php echo esc_attr($host_search); ?>">
                    <input type="submit" class="button" value="<?php esc_attr_e('Search', 'bjt-product-admin'); ?>">
                </p>
            </div>
            
            <br class="clear">
        </div>
        
        <!-- Host Models table -->
        <table class="wp-list-table widefat fixed striped host-models">
            <thead>
                <tr>
                    <th scope="col" class="manage-column column-id"><?php esc_html_e('ID', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Model', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-parts"><?php esc_html_e('Parts', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-actions"><?php esc_html_e('Actions', 'bjt-product-admin'); ?></th>
                </tr>
            </thead>
            
            <tbody id="the-host-list">
                <?php
                if ($hosts_query->have_posts()) {
                    while ($hosts_query->have_posts()) {
                        $hosts_query->the_post();
                        $host_id = get_the_ID();
                        $edit_link = get_edit_post_link($host_id);
                        
                        // Get featured image
                        $thumbnail = get_the_post_thumbnail($host_id, array(50, 50));
                        if (empty($thumbnail)) {
                            $thumbnail = '<div class="bjt-no-image">N/A</div>';
                        }
                        
                        // Get part count for this host
                        $part_count = new WP_Query(array(
                            'post_type' => 'bjt_part',
                            'posts_per_page' => -1,
                            'fields' => 'ids',
                            'meta_query' => array(
                                array(
                                    'key' => '_bjt_host_id',
                                    'value' => $host_id,
                                    'compare' => '='
                                )
                            )
                        ));
                        
                        // Get status
                        $status = get_post_meta($host_id, '_bjt_host_status', true);
                        $status_label = $status === 'online' ? __('Online', 'bjt-product-admin') : __('Offline', 'bjt-product-admin');
                        $status_class = $status === 'online' ? 'status-online' : 'status-offline';
                        $status_icon = $status === 'online' ? 'dashicons-yes-alt' : 'dashicons-hidden';
                        
                        // Get excerpt 
                        $excerpt = get_the_excerpt();
                        if (empty($excerpt)) {
                            $excerpt = wp_trim_words(get_the_content(), 20);
                        }
                        ?>
                        <tr>
                            <td class="column-id"><?php echo esc_html($host_id); ?></td>
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
                                        <a href="<?php echo get_delete_post_link($host_id); ?>" class="submitdelete">
                                            <?php esc_html_e('Trash', 'bjt-product-admin'); ?>
                                        </a>
                                    </span>
                                </div>
                            </td>
                            <td class="column-description">
                                <?php echo esc_html($excerpt); ?>
                            </td>
                            <td class="column-parts">
                                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-hosts&host_id=' . $host_id . '#part-numbers')); ?>">
                                    <?php echo esc_html($part_count->found_posts); ?>
                                </a>
                            </td>
                            <td class="column-status">
                                <span class="<?php echo esc_attr($status_class); ?>">
                                    <span class="dashicons <?php echo esc_attr($status_icon); ?>"></span>
                                    <?php echo esc_html($status_label); ?>
                                </span>
                            </td>
                            <td class="column-actions">
                                <a href="<?php echo esc_url(admin_url('admin-post.php?action=bjt_toggle_host_status&host_id=' . $host_id . '&_wpnonce=' . wp_create_nonce('bjt_toggle_host_status'))); ?>" 
                                   class="button button-small <?php echo $status === 'online' ? 'bjt-offline-btn' : 'bjt-online-btn'; ?>">
                                    <?php echo $status === 'online' ? esc_html__('Take Offline', 'bjt-product-admin') : esc_html__('Set Online', 'bjt-product-admin'); ?>
                                </a>
                            </td>
                        </tr>
                        <?php
                    }
                } else {
                    ?>
                    <tr>
                        <td colspan="7"><?php esc_html_e('No host models found.', 'bjt-product-admin'); ?></td>
                    </tr>
                    <?php
                }
                wp_reset_postdata();
                ?>
            </tbody>
            
            <tfoot>
                <tr>
                    <th scope="col" class="manage-column column-id"><?php esc_html_e('ID', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-image"><?php esc_html_e('Image', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Model', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-parts"><?php esc_html_e('Parts', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-status"><?php esc_html_e('Status', 'bjt-product-admin'); ?></th>
                    <th scope="col" class="manage-column column-actions"><?php esc_html_e('Actions', 'bjt-product-admin'); ?></th>
                </tr>
            </tfoot>
        </table>
        
        <!-- Pagination for hosts -->
        <div class="tablenav bottom">
            <div class="tablenav-pages">
                <?php
                $total_host_pages = $hosts_query->max_num_pages;
                
                if ($total_host_pages > 1) {
                    $current_host_page = max(1, $host_page);
                    
                    echo '<span class="displaying-num">' . 
                         sprintf(
                             _n('%s item', '%s items', $hosts_query->found_posts, 'bjt-product-admin'),
                             number_format_i18n($hosts_query->found_posts)
                         ) . 
                         '</span>';
                    
                    echo paginate_links(array(
                        'base' => add_query_arg('host_paged', '%#%'),
                        'format' => '',
                        'prev_text' => __('&laquo;', 'bjt-product-admin'),
                        'next_text' => __('&raquo;', 'bjt-product-admin'),
                        'total' => $total_host_pages,
                        'current' => $current_host_page
                    ));
                }
                ?>
            </div>
        </div>
    </form>
    
    <!-- Part Numbers Section -->
    <div id="part-numbers" class="bjt-part-numbers-section">
        <h2 class="wp-heading-inline"><?php echo esc_html__('Part Numbers', 'bjt-product-admin'); ?></h2>
        <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_part')); ?>" class="page-title-action">
            <?php echo esc_html__('Add New Part Number', 'bjt-product-admin'); ?>
        </a>
        
        <hr class="wp-header-end">
        
        <!-- Part Numbers filter and search form -->
        <form id="bjt-parts-filter" method="get">
            <input type="hidden" name="page" value="bjt-hosts">
            <?php if (!empty($host_search)): ?>
                <input type="hidden" name="host_s" value="<?php echo esc_attr($host_search); ?>">
            <?php endif; ?>
            <?php if ($host_page > 1): ?>
                <input type="hidden" name="host_paged" value="<?php echo esc_attr($host_page); ?>">
            <?php endif; ?>
            
            <div class="tablenav top">
                <div class="alignleft actions">
                    <label for="filter-by-host" class="screen-reader-text">
                        <?php esc_html_e('Filter by host model', 'bjt-product-admin'); ?>
                    </label>
                    <select id="filter-by-host" name="host_id">
                        <option value="0"><?php esc_html_e('All Host Models', 'bjt-product-admin'); ?></option>
                        <?php
                        foreach ($all_hosts as $host) {
                            printf(
                                '<option value="%s" %s>%s</option>',
                                esc_attr($host->ID),
                                selected($host_filter, $host->ID, false),
                                esc_html($host->post_title)
                            );
                        }
                        ?>
                    </select>
                    <input type="submit" class="button" value="<?php esc_attr_e('Filter', 'bjt-product-admin'); ?>">
                </div>
                
                <div class="alignright">
                    <p class="search-box">
                        <label class="screen-reader-text" for="bjt-part-search">
                            <?php esc_html_e('Search Part Numbers:', 'bjt-product-admin'); ?>
                        </label>
                        <input type="search" id="bjt-part-search" name="part_s" value="<?php echo esc_attr($part_search); ?>">
                        <input type="submit" class="button" value="<?php esc_attr_e('Search', 'bjt-product-admin'); ?>">
                    </p>
                </div>
                
                <br class="clear">
            </div>
            
            <!-- Part Numbers table -->
            <table class="wp-list-table widefat fixed striped part-numbers">
                <thead>
                    <tr>
                        <th scope="col" class="manage-column column-id"><?php esc_html_e('ID', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Part Number', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-host"><?php esc_html_e('Host Model', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-actions"><?php esc_html_e('Actions', 'bjt-product-admin'); ?></th>
                    </tr>
                </thead>
                
                <tbody id="the-part-list">
                    <?php
                    if ($parts_query->have_posts()) {
                        while ($parts_query->have_posts()) {
                            $parts_query->the_post();
                            $part_id = get_the_ID();
                            $edit_link = get_edit_post_link($part_id);
                            
                            // Get host
                            $part_host_id = get_post_meta($part_id, '_bjt_host_id', true);
                            $host_name = '';
                            if ($part_host_id) {
                                $host = get_post($part_host_id);
                                if ($host) {
                                    $host_name = $host->post_title;
                                }
                            }
                            
                            // Get excerpt 
                            $excerpt = get_the_excerpt();
                            if (empty($excerpt)) {
                                $excerpt = wp_trim_words(get_the_content(), 20);
                            }
                            ?>
                            <tr>
                                <td class="column-id"><?php echo esc_html($part_id); ?></td>
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
                                            <a href="<?php echo get_delete_post_link($part_id); ?>" class="submitdelete">
                                                <?php esc_html_e('Trash', 'bjt-product-admin'); ?>
                                            </a>
                                        </span>
                                    </div>
                                </td>
                                <td class="column-host">
                                    <?php 
                                    if ($part_host_id) {
                                        echo '<a href="' . esc_url(admin_url('admin.php?page=bjt-hosts&host_id=' . $part_host_id . '#part-numbers')) . '">' . 
                                              esc_html($host_name) . 
                                             '</a>';
                                    } else {
                                        esc_html_e('N/A', 'bjt-product-admin');
                                    }
                                    ?>
                                </td>
                                <td class="column-description">
                                    <?php echo esc_html($excerpt); ?>
                                </td>
                                <td class="column-actions">
                                    <a href="<?php echo esc_url(admin_url('post.php?post=' . $part_id . '&action=edit&section=host-association')); ?>" class="button button-small">
                                        <?php esc_html_e('Associate', 'bjt-product-admin'); ?>
                                    </a>
                                </td>
                            </tr>
                            <?php
                        }
                    } else {
                        ?>
                        <tr>
                            <td colspan="5"><?php esc_html_e('No part numbers found.', 'bjt-product-admin'); ?></td>
                        </tr>
                        <?php
                    }
                    wp_reset_postdata();
                    ?>
                </tbody>
                
                <tfoot>
                    <tr>
                        <th scope="col" class="manage-column column-id"><?php esc_html_e('ID', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-title column-primary"><?php esc_html_e('Part Number', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-host"><?php esc_html_e('Host Model', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-description"><?php esc_html_e('Description', 'bjt-product-admin'); ?></th>
                        <th scope="col" class="manage-column column-actions"><?php esc_html_e('Actions', 'bjt-product-admin'); ?></th>
                    </tr>
                </tfoot>
            </table>
            
            <!-- Pagination for parts -->
            <div class="tablenav bottom">
                <div class="tablenav-pages">
                    <?php
                    $total_part_pages = $parts_query->max_num_pages;
                    
                    if ($total_part_pages > 1) {
                        $current_part_page = max(1, $part_page);
                        
                        echo '<span class="displaying-num">' . 
                             sprintf(
                                 _n('%s item', '%s items', $parts_query->found_posts, 'bjt-product-admin'),
                                 number_format_i18n($parts_query->found_posts)
                             ) . 
                             '</span>';
                        
                        echo paginate_links(array(
                            'base' => add_query_arg('part_paged', '%#%'),
                            'format' => '',
                            'prev_text' => __('&laquo;', 'bjt-product-admin'),
                            'next_text' => __('&raquo;', 'bjt-product-admin'),
                            'total' => $total_part_pages,
                            'current' => $current_part_page
                        ));
                    }
                    ?>
                </div>
            </div>
        </form>
    </div>
</div>

<style>
/* Host Status Styles */
.status-online {
    color: #46b450;
    font-weight: 500;
}
.status-online .dashicons {
    color: #46b450;
    vertical-align: middle;
    margin-right: 5px;
}

.status-offline {
    color: #dc3232;
    font-weight: 500;
}
.status-offline .dashicons {
    color: #dc3232;
    vertical-align: middle;
    margin-right: 5px;
}

/* Action Buttons */
.bjt-online-btn {
    background-color: #46b450 !important;
    border-color: #46b450 !important;
    color: white !important;
}

.bjt-offline-btn {
    background-color: #dc3232 !important;
    border-color: #dc3232 !important;
    color: white !important;
}

/* Part Numbers Section */
.bjt-part-numbers-section {
    margin-top: 40px;
    border-top: 1px solid #ccd0d4;
    padding-top: 20px;
}

/* No Image Placeholder */
.bjt-no-image {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f1f1f1;
    color: #666;
    font-size: 12px;
    border-radius: 3px;
}

/* Confirmation Dialog */
.bjt-confirm-dialog {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
}

.bjt-confirm-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 400px;
    border-radius: 4px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
}

.bjt-confirm-actions {
    margin-top: 20px;
    text-align: right;
}

.bjt-confirm-actions .button {
    margin-left: 10px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Confirm delete action
    $('.submitdelete').on('click', function(e) {
        return confirm('<?php echo esc_js(__('Are you sure you want to delete this item? This action cannot be undone.', 'bjt-product-admin')); ?>');
    });
    
    // Confirm status change
    $('.bjt-online-btn, .bjt-offline-btn').on('click', function(e) {
        var status = $(this).hasClass('bjt-online-btn') ? '<?php echo esc_js(__('online', 'bjt-product-admin')); ?>' : '<?php echo esc_js(__('offline', 'bjt-product-admin')); ?>';
        return confirm('<?php echo esc_js(__('Are you sure you want to set this host model', 'bjt-product-admin')); ?> ' + status + '?');
    });
    
    // Jump to part numbers section when host filter is used
    <?php if ($host_filter > 0): ?>
    $('html, body').animate({
        scrollTop: $('#part-numbers').offset().top - 50
    }, 500);
    <?php endif; ?>
});
</script> 