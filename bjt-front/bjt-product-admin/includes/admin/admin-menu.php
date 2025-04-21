<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add admin menu items
 */
function bjt_add_admin_menu() {
    // Add main menu item
    add_menu_page(
        __('BJT Products', 'bjt-product-admin'),
        __('BJT Products', 'bjt-product-admin'),
        'manage_options',
        'bjt-dashboard',
        'bjt_admin_dashboard_page',
        'dashicons-store',
        30
    );

    // Add submenu items
    add_submenu_page(
        'bjt-dashboard',
        __('Dashboard', 'bjt-product-admin'),
        __('Dashboard', 'bjt-product-admin'),
        'manage_options',
        'bjt-dashboard',
        'bjt_admin_dashboard_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Product Lines', 'bjt-product-admin'),
        __('Product Lines', 'bjt-product-admin'),
        'manage_options',
        'bjt-product-lines',
        'bjt_product_lines_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Products', 'bjt-product-admin'),
        __('Products', 'bjt-product-admin'),
        'manage_options',
        'bjt-products',
        'bjt_products_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Host Models', 'bjt-product-admin'),
        __('Host Models', 'bjt-product-admin'),
        'manage_options',
        'bjt-hosts',
        'bjt_hosts_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Features', 'bjt-product-admin'),
        __('Features', 'bjt-product-admin'),
        'manage_options',
        'bjt-features',
        'bjt_features_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Specifications', 'bjt-product-admin'),
        __('Specifications', 'bjt-product-admin'),
        'manage_options',
        'bjt-specifications',
        'bjt_specifications_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Media Library', 'bjt-product-admin'),
        __('Media Library', 'bjt-product-admin'),
        'manage_options',
        'bjt-media',
        'bjt_media_page'
    );

    add_submenu_page(
        'bjt-dashboard',
        __('Settings', 'bjt-product-admin'),
        __('Settings', 'bjt-product-admin'),
        'manage_options',
        'bjt-settings',
        'bjt_settings_page'
    );
}

/**
 * Admin dashboard page callback
 */
function bjt_admin_dashboard_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the dashboard template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/dashboard.php';
}

/**
 * Product lines page callback
 */
function bjt_product_lines_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the product lines template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/product-lines.php';
}

/**
 * Products page callback
 */
function bjt_products_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the products template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/products.php';
}

/**
 * Host models page callback
 */
function bjt_hosts_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the hosts template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/hosts.php';
}

/**
 * Features page callback
 */
function bjt_features_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the features template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/features.php';
}

/**
 * Specifications page callback
 */
function bjt_specifications_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the specifications template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/specifications.php';
}

/**
 * Media library page callback
 */
function bjt_media_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the media library template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/media.php';
}

/**
 * Settings page callback
 */
function bjt_settings_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Include the settings template
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/admin/views/settings.php';
} 