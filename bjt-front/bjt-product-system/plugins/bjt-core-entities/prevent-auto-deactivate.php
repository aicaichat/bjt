<?php
/**
 * Plugin Name: BJT Plugin Auto-Deactivation Prevention
 * Description: Prevents specified BJT plugins from being automatically deactivated by WordPress.
 * Version: 1.0
 * Author: ZD
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// List of critical plugins to keep active
$bjt_critical_plugins = array(
    'bjt-core-entities/bjt-product-api.php',
    'bjt-cors/bjt-cors.php',
    // Add other critical plugins here if needed
);

/**
 * Ensures critical BJT plugins are active.
 * This runs early during WordPress load.
 */
function bjt_ensure_critical_plugins_active() {
    global $bjt_critical_plugins;

    if ( ! function_exists( 'is_plugin_active' ) ) {
        include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
    }

    $changed = false;
    foreach ( $bjt_critical_plugins as $plugin ) {
        if ( ! is_plugin_active( $plugin ) ) {
            activate_plugin( $plugin );
            error_log( "[BJT Plugin Guard] Activated missing critical plugin: " . $plugin );
            $changed = true;
        }
    }

    if ($changed) {
        // Flush rewrite rules if plugins were activated, to ensure API routes work
        flush_rewrite_rules();
        error_log( "[BJT Plugin Guard] Flushed rewrite rules after plugin activation." );
    }
}
add_action( 'plugins_loaded', 'bjt_ensure_critical_plugins_active', 1 ); // Run very early

/**
 * Re-checks and activates critical plugins on shutdown, in case something deactivated them during the request.
 */
function bjt_recheck_critical_plugins_on_shutdown() {
    global $bjt_critical_plugins;

    if ( ! function_exists( 'is_plugin_active' ) ) {
        include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
    }

    $changed = false;
    foreach ( $bjt_critical_plugins as $plugin ) {
        if ( ! is_plugin_active( $plugin ) ) {
            activate_plugin( $plugin );
            error_log( "[BJT Plugin Guard] Re-activated critical plugin on shutdown: " . $plugin );
            $changed = true;
        }
    }

    if ($changed) {
        flush_rewrite_rules();
        error_log( "[BJT Plugin Guard] Flushed rewrite rules on shutdown after re-activation." );
    }
}
add_action( 'shutdown', 'bjt_recheck_critical_plugins_on_shutdown' );

/**
 * Prevents WordPress from automatically deactivating plugins due to errors.
 * This is a more aggressive approach.
 */
add_filter( 'auto_deactivate_plugin', '__return_false' );
add_filter( 'auto_deactivate_theme', '__return_false' );

// Optionally, add a scheduled task to periodically check and activate
if ( ! wp_next_scheduled( 'bjt_hourly_plugin_check' ) ) {
    wp_schedule_event( time(), 'hourly', 'bjt_hourly_plugin_check' );
}
add_action( 'bjt_hourly_plugin_check', 'bjt_ensure_critical_plugins_active' );

// Clear scheduled event on plugin deactivation (if this file were a standalone plugin)
// register_deactivation_hook( __FILE__, 'bjt_clear_scheduled_plugin_check' );
// function bjt_clear_scheduled_plugin_check() {
//     wp_clear_scheduled_hook( 'bjt_hourly_plugin_check' );
// }

