<?php
/**
 * Auto-fix WordPress Configuration
 * 
 * This file automatically fixes WordPress configuration issues on every request
 * to ensure the system stays functional.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Auto-fix active_plugins option if it's corrupted
 */
function bjt_auto_fix_active_plugins() {
    $active_plugins = get_option('active_plugins');
    
    // If active_plugins is not an array (corrupted), fix it
    if (!is_array($active_plugins)) {
        error_log('[BJT Auto-Fix] active_plugins is corrupted (not an array), fixing...');
        
        $required_plugins = array(
            'bjt-core-entities/bjt-product-api.php',
            'bjt-cors/bjt-cors.php',
            'rest-api/plugin.php',
        );
        
        update_option('active_plugins', $required_plugins);
        error_log('[BJT Auto-Fix] active_plugins has been fixed with required plugins');
        
        return true;
    }
    
    // Ensure required plugins are always active
    $required_plugins = array(
        'bjt-core-entities/bjt-product-api.php',
        'bjt-cors/bjt-cors.php',
        'rest-api/plugin.php',
    );
    
    $needs_update = false;
    foreach ($required_plugins as $plugin) {
        if (!in_array($plugin, $active_plugins)) {
            $active_plugins[] = $plugin;
            $needs_update = true;
            error_log("[BJT Auto-Fix] Added missing plugin to active_plugins: {$plugin}");
        }
    }
    
    if ($needs_update) {
        update_option('active_plugins', $active_plugins);
        error_log('[BJT Auto-Fix] active_plugins has been updated with missing plugins');
    }
    
    return $needs_update;
}

/**
 * Auto-fix permalink structure
 */
function bjt_auto_fix_permalink_structure() {
    $permalink_structure = get_option('permalink_structure');
    
    if (empty($permalink_structure)) {
        update_option('permalink_structure', '/%postname%/');
        flush_rewrite_rules();
        error_log('[BJT Auto-Fix] Permalink structure has been set to /%postname%/');
        return true;
    }
    
    return false;
}

/**
 * Auto-fix site URL and home URL
 */
function bjt_auto_fix_site_urls() {
    $siteurl = get_option('siteurl');
    $home = get_option('home');
    $expected_url = 'https://eorder.lockedair.com';
    
    $fixed = false;
    
    if ($siteurl !== $expected_url) {
        update_option('siteurl', $expected_url);
        error_log("[BJT Auto-Fix] siteurl has been set to {$expected_url}");
        $fixed = true;
    }
    
    if ($home !== $expected_url) {
        update_option('home', $expected_url);
        error_log("[BJT Auto-Fix] home has been set to {$expected_url}");
        $fixed = true;
    }
    
    return $fixed;
}

/**
 * Run all auto-fixes on init (but only once per request)
 */
function bjt_run_auto_fixes() {
    static $fixes_run = false;
    
    if ($fixes_run) {
        return;
    }
    
    $fixes_run = true;
    
    // Run fixes in order
    bjt_auto_fix_active_plugins();
    bjt_auto_fix_permalink_structure();
    bjt_auto_fix_site_urls();
}

// Run auto-fixes very early
add_action('plugins_loaded', 'bjt_run_auto_fixes', 1);

/**
 * Also run on admin_init to ensure admin area works
 */
add_action('admin_init', 'bjt_run_auto_fixes', 1);

/**
 * Run on REST API requests
 */
add_action('rest_api_init', 'bjt_run_auto_fixes', 1);

/**
 * Scheduled task to check and fix configuration hourly
 */
function bjt_scheduled_config_check() {
    bjt_auto_fix_active_plugins();
    bjt_auto_fix_permalink_structure();
    bjt_auto_fix_site_urls();
    
    error_log('[BJT Auto-Fix] Scheduled configuration check completed');
}

// Schedule hourly check if not already scheduled
if (!wp_next_scheduled('bjt_hourly_config_check')) {
    wp_schedule_event(time(), 'hourly', 'bjt_hourly_config_check');
}
add_action('bjt_hourly_config_check', 'bjt_scheduled_config_check');

/**
 * Add admin notice to show when auto-fixes are applied
 */
function bjt_auto_fix_admin_notice() {
    $active_plugins = get_option('active_plugins');
    
    if (!is_array($active_plugins)) {
        echo '<div class="notice notice-error"><p><strong>BJT Auto-Fix:</strong> WordPress configuration was corrupted and has been automatically repaired.</p></div>';
    }
}
add_action('admin_notices', 'bjt_auto_fix_admin_notice');

