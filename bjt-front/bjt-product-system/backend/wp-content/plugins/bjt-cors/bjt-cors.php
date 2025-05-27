<?php
/**
 * Plugin Name: BJT CORS Support
 * Description: Enable CORS for the BJT Product Management System
 * Version: 1.3
 * Author: BJT
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sets essential CORS headers.
 */
function bjt_set_cors_headers() {
    if ( ! headers_sent() ) {
        header( "Access-Control-Allow-Origin: http://localhost:5173" );
        header( "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS" );
        header( "Access-Control-Allow-Credentials: true" );
        header( "Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-WP-Nonce" );
        header( "Access-Control-Expose-Headers: Link, X-WP-Total, X-WP-TotalPages" );
    }
}

/**
 * Handles OPTIONS preflight requests specifically for REST API or other relevant paths.
 */
function bjt_handle_options_preflight_request() {
    if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
        // Check if the request is likely for an API endpoint
        // You might want to make this check more specific if needed, e.g., by checking $wp->request
        if ( strpos( $_SERVER['REQUEST_URI'], '/wp-json/' ) !== false || strpos( $_SERVER['REQUEST_URI'], '/bjt/v1/' ) !== false ) {
            bjt_set_cors_headers();
            status_header( 200 );
            exit(); // Important to exit after sending headers for OPTIONS request
        }
    }
}

// Attempt to handle OPTIONS requests very early
add_action( 'init', 'bjt_handle_options_preflight_request', 1 );

/**
 * Ensures CORS headers are set on all responses, especially for REST API.
 */
function bjt_add_cors_headers_to_all_responses() {
    // Check if the request is likely for an API endpoint
    if ( strpos( $_SERVER['REQUEST_URI'], '/wp-json/' ) !== false || strpos( $_SERVER['REQUEST_URI'], '/bjt/v1/' ) !== false ) {
        bjt_set_cors_headers();
    }
}
add_action( 'send_headers', 'bjt_add_cors_headers_to_all_responses' );

/**
 * Filter for rest_pre_serve_request to ensure headers for actual data responses.
 */
function bjt_filter_rest_pre_serve_request_for_cors( $served, $result, $request, $server ) {
    bjt_set_cors_headers();
    return $served;
}
add_filter( 'rest_pre_serve_request', 'bjt_filter_rest_pre_serve_request_for_cors', 15, 4 );

?> 