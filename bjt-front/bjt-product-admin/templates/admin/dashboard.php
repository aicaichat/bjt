<?php
if (!defined('ABSPATH')) {
    exit;
}

// Get WordPress database object
global $wpdb;

// Get product line count
$product_line_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_product_lines");

// Get host count
$host_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_hosts");

// Get part count
$part_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_parts");

// Get recent product lines
$recent_product_lines = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}bjt_product_lines 
    ORDER BY created_at DESC 
    LIMIT 5"
);

// Get recent hosts
$recent_hosts = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}bjt_hosts 
    ORDER BY created_at DESC 
    LIMIT 5"
);

// Get recent parts
$recent_parts = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}bjt_parts 
    ORDER BY created_at DESC 
    LIMIT 5"
);

// 获取当前页面和操作
$current_page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
$current_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
?>

<div class="wrap">
    <h1 class="wp-heading-inline"><?php _e('BJT产品管理系统', 'bjt-product-admin'); ?></h1>
    
    <div class="notice notice-info">
        <p><?php _e('欢迎使用BJT产品管理系统，请从左侧菜单选择要管理的内容。', 'bjt-product-admin'); ?></p>
    </div>
    
    <div class="bjt-dashboard-stats">
        <div class="bjt-stat-box">
            <h3><?php _e('Product Lines', 'bjt-product-admin'); ?></h3>
            <p class="bjt-stat-number"><?php echo esc_html($product_line_count); ?></p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=product-lines')); ?>" class="button">
                <?php _e('Manage Product Lines', 'bjt-product-admin'); ?>
            </a>
        </div>

        <div class="bjt-stat-box">
            <h3><?php _e('Hosts', 'bjt-product-admin'); ?></h3>
            <p class="bjt-stat-number"><?php echo esc_html($host_count); ?></p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=hosts')); ?>" class="button">
                <?php _e('Manage Hosts', 'bjt-product-admin'); ?>
            </a>
        </div>

        <div class="bjt-stat-box">
            <h3><?php _e('Parts', 'bjt-product-admin'); ?></h3>
            <p class="bjt-stat-number"><?php echo esc_html($part_count); ?></p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=parts')); ?>" class="button">
                <?php _e('Manage Parts', 'bjt-product-admin'); ?>
            </a>
        </div>
    </div>

    <div class="bjt-dashboard-recent">
        <div class="bjt-recent-box">
            <h3><?php _e('Recent Product Lines', 'bjt-product-admin'); ?></h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Title', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Created', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Status', 'bjt-product-admin'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_product_lines as $line): ?>
                        <tr>
                            <td>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=edit-product-line&id=' . $line->id)); ?>">
                                    <?php echo esc_html($line->title_cn); ?>
                                </a>
                            </td>
                            <td><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($line->created_at))); ?></td>
                            <td>
                                <span class="bjt-status-<?php echo esc_attr($line->status); ?>">
                                    <?php echo esc_html($line->status); ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <div class="bjt-recent-box">
            <h3><?php _e('Recent Hosts', 'bjt-product-admin'); ?></h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Model', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Created', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Status', 'bjt-product-admin'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_hosts as $host): ?>
                        <tr>
                            <td>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=edit-host&id=' . $host->id)); ?>">
                                    <?php echo esc_html($host->title_cn); ?>
                                </a>
                            </td>
                            <td><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($host->created_at))); ?></td>
                            <td>
                                <span class="bjt-status-<?php echo esc_attr($host->status); ?>">
                                    <?php echo esc_html($host->status); ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <div class="bjt-recent-box">
            <h3><?php _e('Recent Parts', 'bjt-product-admin'); ?></h3>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Part Number', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Created', 'bjt-product-admin'); ?></th>
                        <th><?php _e('Status', 'bjt-product-admin'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_parts as $part): ?>
                        <tr>
                            <td>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-admin&action=edit-part&id=' . $part->id)); ?>">
                                    <?php echo esc_html($part->part_number); ?>
                                </a>
                            </td>
                            <td><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($part->created_at))); ?></td>
                            <td>
                                <span class="bjt-status-<?php echo esc_attr($part->status); ?>">
                                    <?php echo esc_html($part->status); ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
.bjt-dashboard-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
}

.bjt-stat-box {
    flex: 1;
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bjt-stat-number {
    font-size: 36px;
    font-weight: bold;
    margin: 10px 0;
    color: #2271b1;
}

.bjt-dashboard-recent {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.bjt-recent-box {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bjt-status-publish {
    color: #00a32a;
}

.bjt-status-draft {
    color: #dba617;
}
</style> 