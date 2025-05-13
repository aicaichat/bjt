<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// 确保只在管理页面中显示
if (!is_admin()) {
    return;
}

// 获取页面标题
$page_title = function_exists('get_admin_page_title') ? get_admin_page_title() : __('BJT Product Management', 'bjt-product-admin');
?>

<div class="wrap bjt-admin-dashboard">
    <h1><?php echo esc_html__('BJT Product Management Dashboard', 'bjt-product-admin'); ?></h1>
    
    <div class="bjt-admin-grid">
        <!-- Quick Stats -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('Quick Stats', 'bjt-product-admin'); ?></h2>
            <div class="bjt-stats-grid">
                <?php
                $product_lines = wp_count_posts('bjt_product_line');
                $products = wp_count_posts('bjt_product');
                $hosts = wp_count_posts('bjt_host');
                $parts = wp_count_posts('bjt_part');
                
                // Get online hosts count
                $online_hosts_count = 0;
                $online_hosts_query = new WP_Query(array(
                    'post_type' => 'bjt_host',
                    'posts_per_page' => -1,
                    'fields' => 'ids',
                    'meta_query' => array(
                        array(
                            'key' => '_bjt_host_status',
                            'value' => 'online',
                            'compare' => '='
                        )
                    )
                ));
                $online_hosts_count = $online_hosts_query->found_posts;
                ?>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($product_lines->publish); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Product Lines', 'bjt-product-admin'); ?></span>
                </div>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($products->publish); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Published Products', 'bjt-product-admin'); ?></span>
                </div>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($hosts->publish); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Host Models', 'bjt-product-admin'); ?></span>
                </div>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($online_hosts_count); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Online Hosts', 'bjt-product-admin'); ?></span>
                </div>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($parts->publish); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Part Numbers', 'bjt-product-admin'); ?></span>
                </div>
                <div class="bjt-stat-item">
                    <span class="bjt-stat-number"><?php echo esc_html($products->draft); ?></span>
                    <span class="bjt-stat-label"><?php echo esc_html__('Draft Products', 'bjt-product-admin'); ?></span>
                </div>
            </div>
        </div>
        
        <!-- Recent Products -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('Recent Products', 'bjt-product-admin'); ?></h2>
            <ul class="bjt-recent-list">
                <?php
                $recent_products = get_posts(array(
                    'post_type' => 'bjt_product',
                    'posts_per_page' => 5,
                    'orderby' => 'date',
                    'order' => 'DESC'
                ));
                
                if ($recent_products) {
                    foreach ($recent_products as $product) {
                        $edit_link = get_edit_post_link($product->ID);
                        echo '<li>';
                        echo '<a href="' . esc_url($edit_link) . '">' . esc_html($product->post_title) . '</a>';
                        echo '<span class="bjt-date">' . esc_html(get_the_date('', $product->ID)) . '</span>';
                        echo '</li>';
                    }
                } else {
                    echo '<li>' . esc_html__('No products found.', 'bjt-product-admin') . '</li>';
                }
                ?>
            </ul>
        </div>
        
        <!-- Recent Host Models -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('Recent Host Models', 'bjt-product-admin'); ?></h2>
            <ul class="bjt-recent-list">
                <?php
                $recent_hosts = get_posts(array(
                    'post_type' => 'bjt_host',
                    'posts_per_page' => 5,
                    'orderby' => 'date',
                    'order' => 'DESC'
                ));
                
                if ($recent_hosts) {
                    foreach ($recent_hosts as $host) {
                        $edit_link = get_edit_post_link($host->ID);
                        $status = get_post_meta($host->ID, '_bjt_host_status', true);
                        $status_class = $status === 'online' ? 'bjt-status-online' : 'bjt-status-offline';
                        $status_label = $status === 'online' ? __('Online', 'bjt-product-admin') : __('Offline', 'bjt-product-admin');
                        
                        echo '<li>';
                        echo '<a href="' . esc_url($edit_link) . '">' . esc_html($host->post_title) . '</a>';
                        echo '<span class="bjt-host-status ' . esc_attr($status_class) . '">' . esc_html($status_label) . '</span>';
                        echo '<span class="bjt-date">' . esc_html(get_the_date('', $host->ID)) . '</span>';
                        echo '</li>';
                    }
                } else {
                    echo '<li>' . esc_html__('No host models found.', 'bjt-product-admin') . '</li>';
                }
                ?>
            </ul>
        </div>
        
        <!-- Quick Actions -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('Quick Actions', 'bjt-product-admin'); ?></h2>
            <div class="bjt-quick-actions">
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_product')); ?>" class="button button-primary">
                    <?php echo esc_html__('Add New Product', 'bjt-product-admin'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_product_line')); ?>" class="button button-primary">
                    <?php echo esc_html__('Add New Product Line', 'bjt-product-admin'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_host')); ?>" class="button button-primary">
                    <?php echo esc_html__('Add New Host Model', 'bjt-product-admin'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('post-new.php?post_type=bjt_part')); ?>" class="button button-primary">
                    <?php echo esc_html__('Add New Part Number', 'bjt-product-admin'); ?>
                </a>
                <a href="<?php echo esc_url(admin_url('upload.php')); ?>" class="button">
                    <?php echo esc_html__('Manage Media', 'bjt-product-admin'); ?>
                </a>
            </div>
        </div>
        
        <!-- System Status -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('System Status', 'bjt-product-admin'); ?></h2>
            <table class="bjt-status-table">
                <tr>
                    <th><?php echo esc_html__('WordPress Version', 'bjt-product-admin'); ?></th>
                    <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                </tr>
                <tr>
                    <th><?php echo esc_html__('PHP Version', 'bjt-product-admin'); ?></th>
                    <td><?php echo esc_html(phpversion()); ?></td>
                </tr>
                <tr>
                    <th><?php echo esc_html__('Upload Directory', 'bjt-product-admin'); ?></th>
                    <td><?php 
                        $upload_dir = wp_upload_dir();
                        echo esc_html($upload_dir['basedir']); 
                    ?></td>
                </tr>
                <tr>
                    <th><?php echo esc_html__('Max Upload Size', 'bjt-product-admin'); ?></th>
                    <td><?php echo esc_html(size_format(wp_max_upload_size())); ?></td>
                </tr>
            </table>
        </div>
        
        <!-- Recent Activity -->
        <div class="bjt-admin-card">
            <h2><?php echo esc_html__('Recent Activity', 'bjt-product-admin'); ?></h2>
            <ul class="bjt-activity-list">
                <?php
                $recent_activity = get_option('bjt_recent_activity', array());
                
                if (!empty($recent_activity)) {
                    foreach (array_slice($recent_activity, 0, 5) as $activity) {
                        echo '<li>';
                        echo '<span class="bjt-activity-time">' . esc_html($activity['time']) . '</span>';
                        echo '<span class="bjt-activity-text">' . esc_html($activity['text']) . '</span>';
                        echo '</li>';
                    }
                } else {
                    echo '<li>' . esc_html__('No recent activity.', 'bjt-product-admin') . '</li>';
                }
                ?>
            </ul>
        </div>
    </div>
</div>

<style>
.bjt-admin-dashboard {
    margin: 20px;
}

.bjt-admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.bjt-admin-card {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}

.bjt-admin-card h2 {
    margin-top: 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.bjt-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    text-align: center;
}

.bjt-stat-item {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
}

.bjt-stat-number {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #2271b1;
}

.bjt-stat-label {
    display: block;
    margin-top: 5px;
    color: #666;
}

.bjt-recent-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.bjt-recent-list li {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.bjt-recent-list li:last-child {
    border-bottom: none;
}

.bjt-date {
    color: #666;
    font-size: 12px;
    margin-left: 10px;
}

.bjt-host-status {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    margin-left: 10px;
}

.bjt-status-online {
    background-color: #edfaef;
    color: #46b450;
}

.bjt-status-offline {
    background-color: #faeaea;
    color: #dc3232;
}

.bjt-quick-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.bjt-status-table {
    width: 100%;
    border-collapse: collapse;
}

.bjt-status-table td {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.bjt-status-table td:first-child {
    font-weight: bold;
    width: 40%;
}

.bjt-activity-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.bjt-activity-list li {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.bjt-activity-time {
    color: #666;
    font-size: 12px;
    margin-right: 10px;
}

.bjt-activity-text {
    color: #333;
}
</style> 