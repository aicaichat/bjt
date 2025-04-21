<?php
// If uninstall.php is not called by WordPress, die
if (!defined('WP_UNINSTALL_PLUGIN')) {
    die;
}

global $wpdb;

// Drop all plugin tables
$tables = array(
    'bjt_product_lines',
    'bjt_hosts',
    'bjt_parts',
    'bjt_air_cushion_lines',
    'bjt_air_cushion_models',
    'bjt_air_cushion_parts',
    'bjt_air_cushion_relations',
    'bjt_air_cushion_accessories',
    'bjt_air_cushion_consumables',
    'bjt_air_cushion_spare_parts',
    'bjt_air_cushion_spare_part_required',
    'bjt_air_cushion_host_accessory_required'
);

foreach ($tables as $table) {
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$table}");
}

// Delete plugin options
delete_option('bjt_product_admin_version');
delete_option('bjt_recent_activity');

// Clean up any additional options or transients
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE 'bjt_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_bjt_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_bjt_%'");

// Remove any scheduled cron jobs
wp_clear_scheduled_hook('bjt_daily_cleanup');
wp_clear_scheduled_hook('bjt_weekly_maintenance'); 