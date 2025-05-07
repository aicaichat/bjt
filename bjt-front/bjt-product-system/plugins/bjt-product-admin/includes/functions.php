<?php
/**
 * Helper Functions
 * 
 * Provides utility functions for the plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

// Development environment check
if (!function_exists('bjt_is_development')) {
    function bjt_is_development() {
        return defined('WP_DEBUG') && WP_DEBUG;
    }
}

// Custom error logging
if (!function_exists('bjt_log_error')) {
    function bjt_log_error($message, $data = null) {
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            $log_message = date('[Y-m-d H:i:s] ') . $message;
            if ($data !== null) {
                $log_message .= ' Data: ' . print_r($data, true);
            }
            error_log($log_message);
        }
    }
}

// Debug logging
if (!function_exists('bjt_debug_log')) {
    function bjt_debug_log($message) {
        if (bjt_is_development()) {
            bjt_log_error('[DEBUG] ' . $message);
        }
    }
}

// Safe wp_parse_args
if (!function_exists('bjt_safe_wp_parse_args')) {
    function bjt_safe_wp_parse_args($args, $defaults = array()) {
        if (is_object($args)) {
            $r = get_object_vars($args);
        } elseif (is_array($args)) {
            $r =& $args;
        } else {
            wp_parse_str($args, $r);
        }
        return array_merge($defaults, $r);
    }
}

// Safe add_query_arg
if (!function_exists('bjt_safe_add_query_arg')) {
    function bjt_safe_add_query_arg($args, $url = '') {
        if (empty($url) && isset($_SERVER['REQUEST_URI'])) {
            $url = $_SERVER['REQUEST_URI'];
        }
        return add_query_arg($args, $url);
    }
}

// Safe admin_url
if (!function_exists('bjt_safe_admin_url')) {
    function bjt_safe_admin_url($path = '', $scheme = 'admin') {
        return admin_url($path, $scheme);
    }
}

// Safe esc_html
if (!function_exists('bjt_safe_esc_html')) {
    function bjt_safe_esc_html($text) {
        return esc_html($text);
    }
}

// Safe esc_attr
if (!function_exists('bjt_safe_esc_attr')) {
    function bjt_safe_esc_attr($text) {
        return esc_attr($text);
    }
}

// Get error message
if (!function_exists('bjt_get_error_message')) {
    function bjt_get_error_message($error) {
        if (is_wp_error($error)) {
            return $error->get_error_message();
        }
        return $error;
    }
}

// Current user capability check
if (!function_exists('bjt_current_user_can')) {
    function bjt_current_user_can($capability) {
        return current_user_can($capability);
    }
}

// Verify nonce
if (!function_exists('bjt_verify_nonce')) {
    function bjt_verify_nonce($nonce, $action) {
        return wp_verify_nonce($nonce, $action);
    }
}

// Create nonce
if (!function_exists('bjt_create_nonce')) {
    function bjt_create_nonce($action) {
        return wp_create_nonce($action);
    }
}

// Get admin page URL
if (!function_exists('bjt_get_admin_page_url')) {
    function bjt_get_admin_page_url($page = '') {
        return bjt_safe_admin_url('admin.php?page=' . $page);
    }
}

// Get AJAX URL
if (!function_exists('bjt_get_ajax_url')) {
    function bjt_get_ajax_url() {
        return admin_url('admin-ajax.php');
    }
}

// Get upload directory
if (!function_exists('bjt_get_upload_dir')) {
    function bjt_get_upload_dir() {
        return wp_upload_dir();
    }
}

// Create directory
if (!function_exists('bjt_create_directory')) {
    function bjt_create_directory($path) {
        if (!file_exists($path)) {
            wp_mkdir_p($path);
        }
        return is_dir($path);
    }
}

// Remove directory
if (!function_exists('bjt_remove_directory')) {
    function bjt_remove_directory($path) {
        if (!is_dir($path)) {
            return false;
        }
        $files = glob($path . '/*');
        foreach ($files as $file) {
            is_dir($file) ? bjt_remove_directory($file) : unlink($file);
        }
        return rmdir($path);
    }
}

// Remove file
if (!function_exists('bjt_remove_file')) {
    function bjt_remove_file($path) {
        if (!file_exists($path)) {
            return false;
        }
        return unlink($path);
    }
}

// Get file extension
if (!function_exists('bjt_get_file_extension')) {
    function bjt_get_file_extension($file_name) {
        return strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    }
}

// Check allowed file type
if (!function_exists('bjt_is_allowed_file_type')) {
    function bjt_is_allowed_file_type($file_name, $allowed_types = array()) {
        $extension = bjt_get_file_extension($file_name);
        return in_array($extension, $allowed_types);
    }
}

// Generate unique filename
if (!function_exists('bjt_generate_unique_filename')) {
    function bjt_generate_unique_filename($file_name) {
        $extension = bjt_get_file_extension($file_name);
        $name = pathinfo($file_name, PATHINFO_FILENAME);
        return $name . '_' . time() . '.' . $extension;
    }
}

// Get pagination arguments
if (!function_exists('bjt_get_pagination_args')) {
    function bjt_get_pagination_args($args = array()) {
        $defaults = array(
            'per_page' => 10,
            'page' => 1
        );
        return bjt_safe_wp_parse_args($args, $defaults);
    }
}

// Get ordering arguments
if (!function_exists('bjt_get_ordering_args')) {
    function bjt_get_ordering_args($args = array()) {
        $defaults = array(
            'orderby' => 'id',
            'order' => 'DESC'
        );
        return bjt_safe_wp_parse_args($args, $defaults);
    }
}

// Get search arguments
if (!function_exists('bjt_get_search_args')) {
    function bjt_get_search_args($args = array()) {
        $defaults = array(
            'search' => '',
            'search_columns' => array()
        );
        return bjt_safe_wp_parse_args($args, $defaults);
    }
}

// Build WHERE clause
if (!function_exists('bjt_build_where_clause')) {
    function bjt_build_where_clause($where = array(), $where_format = array()) {
        global $wpdb;
        $where_clause = '';
        $where_values = array();
        
        if (!empty($where)) {
            $where_parts = array();
            foreach ($where as $field => $value) {
                $format = isset($where_format[$field]) ? $where_format[$field] : '%s';
                $where_parts[] = $field . ' = ' . $format;
                $where_values[] = $value;
            }
            $where_clause = ' WHERE ' . implode(' AND ', $where_parts);
        }
        
        return array($where_clause, $where_values);
    }
}

// Build ORDER BY clause
if (!function_exists('bjt_build_orderby_clause')) {
    function bjt_build_orderby_clause($orderby, $order) {
        $orderby = sanitize_sql_orderby($orderby . ' ' . $order);
        return ' ORDER BY ' . $orderby;
    }
}

// Build LIMIT clause
if (!function_exists('bjt_build_limit_clause')) {
    function bjt_build_limit_clause($per_page, $page) {
        $offset = ($page - 1) * $per_page;
        return ' LIMIT ' . absint($offset) . ', ' . absint($per_page);
    }
}

// Get total count
if (!function_exists('bjt_get_total_count')) {
    function bjt_get_total_count($table, $where = '', $where_values = array()) {
        global $wpdb;
        $sql = "SELECT COUNT(*) FROM {$table}";
        if (!empty($where)) {
            $sql .= $where;
        }
        if (!empty($where_values)) {
            $sql = $wpdb->prepare($sql, $where_values);
        }
        return $wpdb->get_var($sql);
    }
}

// Get records
if (!function_exists('bjt_get_records')) {
    function bjt_get_records($table, $args = array()) {
        global $wpdb;
        
        $defaults = array(
            'fields' => '*',
            'where' => '',
            'where_values' => array(),
            'orderby' => 'id',
            'order' => 'DESC',
            'per_page' => 10,
            'page' => 1,
            'return_type' => OBJECT
        );
        
        $args = bjt_safe_wp_parse_args($args, $defaults);
        extract($args);
        
        $sql = "SELECT {$fields} FROM {$table}";
        
        if (!empty($where)) {
            $sql .= $where;
        }
        
        $sql .= bjt_build_orderby_clause($orderby, $order);
        $sql .= bjt_build_limit_clause($per_page, $page);
        
        if (!empty($where_values)) {
            $sql = $wpdb->prepare($sql, $where_values);
        }
        
        return $wpdb->get_results($sql, $return_type);
    }
} 