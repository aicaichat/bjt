<?php
/**
 * Plugin Name: BJT Registration & Audit
 * Description: Provides self-registration and admin audit workflow for BJT Product System.
 * Version: 1.0.0
 * Author: BJT Dev Team
 * License: GPLv2 or later
 * Text Domain: bjt-registration
 * Domain Path: /languages
 */

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

// Autoload classes via PSR-4 (simple)
 spl_autoload_register(function ($class) {
     $prefix = 'BJT\\Reg\\';
     $base_dir = plugin_dir_path(__FILE__) . 'includes/';
     $len = strlen($prefix);
     if (strncmp($prefix, $class, $len) !== 0) {
         return;
     }
     $relative_class = substr($class, $len);
     $file = $base_dir . str_replace(['\\', '_'], ['/', '-'], strtolower($relative_class)) . '.php';
     if (file_exists($file)) {
         require $file;
     }
 });

// Activation / deactivation hooks
register_activation_hook(__FILE__, ['BJT\\Reg\\Setup', 'activate']);
register_deactivation_hook(__FILE__, ['BJT\\Reg\\Setup', 'deactivate']);

// Initialize plugin after all plugins loaded
add_action('plugins_loaded', function () {
    // Load i18n
    load_plugin_textdomain('bjt-registration', false, dirname(plugin_basename(__FILE__)) . '/languages');

    (new BJT\Reg\Plugin())->init();
}); 