<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/admin
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/admin
 * @author     BJT Team
 */
class BJT_Product_System_Admin {

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     */
    public function __construct() {
        // Add admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        /**
         * This function is provided for demonstration purposes only.
         */
        wp_enqueue_style(
            'bjt-product-system-admin',
            plugin_dir_url(__FILE__) . 'css/bjt-product-system-admin.css',
            array(),
            BJT_PRODUCT_SYSTEM_VERSION,
            'all'
        );
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts() {
        /**
         * This function is provided for demonstration purposes only.
         */
        wp_enqueue_script(
            'bjt-product-system-admin',
            plugin_dir_url(__FILE__) . 'js/bjt-product-system-admin.js',
            array('jquery'),
            BJT_PRODUCT_SYSTEM_VERSION,
            false
        );
        
        // 添加媒体上传器
        wp_enqueue_media();
    }
} 