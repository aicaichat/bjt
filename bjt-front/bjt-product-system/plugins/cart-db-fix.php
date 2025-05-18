<?php
/**
 * Plugin Name: BJT Cart Database Fix
 * Plugin URI: https://example.com/plugins/cart-db-fix
 * Description: Fixes missing columns in the BJT Cart API database tables
 * Version: 1.0.0
 * Author: BJT Developer
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * 使用钩子和过滤器修复购物车API查询
 */
class BJT_Cart_Fix_Plugin {
    private $log_enabled = true;
    private $log_file;

    public function __construct() {
        $this->log_file = dirname(__FILE__) . '/cart-db-fix.log';
        
        // Use WordPress init hook to ensure all plugins are loaded
        add_action('init', array($this, 'add_filters'));
        
        $this->log_message('BJT_Cart_Fix_Plugin initialized');
    }

    /**
     * 添加过滤器来修改查询
     */
    public function add_filters() {
        // Add database error recovery filter
        add_filter('query_errors', array($this, 'fix_database_queries'), 10, 2);
        
        // Run an initial check to ensure tables are correctly structured
        $this->check_and_fix_db_tables();
        
        $this->log_message('Filters added and initial table check completed');
    }
    
    /**
     * 修复数据库查询
     */
    public function fix_database_queries($error, $query) {
        if (!$error) {
            return $error;
        }

        $this->log_message("Database error detected: " . print_r($error, true));
        $this->log_message("Query: " . $query);
        
        // Check for "Unknown column 'price'" error
        if (is_string($error) && strpos($error, "Unknown column 'price'") !== false) {
            $this->log_message("Detected 'Unknown column price' error");
            $this->add_price_column();
            return null; // Clear the error after fixing
        }
        
        // Check for "Unknown column 'part_number'" error
        if (is_string($error) && strpos($error, "Unknown column 'part_number'") !== false) {
            $this->log_message("Detected 'Unknown column part_number' error");
            $this->add_part_number_column();
            return null; // Clear the error after fixing
        }
        
        return $error;
    }
    
    /**
     * 在REST API初始化之前检查并修复数据库表
     */
    public function check_and_fix_db_tables() {
        global $wpdb;
        
        // Check price column in bjt_prices table
        $this->log_message("Checking price column in bjt_prices table");
        $prices_table_name = $wpdb->prefix . 'bjt_prices';
        $price_column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$prices_table_name} LIKE 'price'");
        
        if (empty($price_column_exists)) {
            $this->log_message("Price column does not exist, adding it");
            $this->add_price_column();
        } else {
            $this->log_message("Price column already exists");
        }
        
        // Check part_number column in bjt_inventory table
        $this->log_message("Checking part_number column in bjt_inventory table");
        $inventory_table_name = $wpdb->prefix . 'bjt_inventory';
        $part_number_column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$inventory_table_name} LIKE 'part_number'");
        
        if (empty($part_number_column_exists)) {
            $this->log_message("Part number column does not exist, adding it");
            $this->add_part_number_column();
        } else {
            $this->log_message("Part number column already exists");
        }
    }
    
    /**
     * 向价格表添加price列
     */
    private function add_price_column() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_prices';
        
        $this->log_message("Adding price column to {$table_name}");
        
        $result = $wpdb->query("ALTER TABLE {$table_name} ADD COLUMN price DECIMAL(10,2) AS (base_price) VIRTUAL");
        
        if ($result === false) {
            $this->log_message("Error adding price column: " . $wpdb->last_error);
        } else {
            $this->log_message("Successfully added price column");
        }
    }
    
    /**
     * 向库存表添加part_number列
     */
    private function add_part_number_column() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_inventory';
        
        $this->log_message("Adding part_number column to {$table_name}");
        
        $result = $wpdb->query("ALTER TABLE {$table_name} ADD COLUMN part_number VARCHAR(64) AS (target_id) VIRTUAL");
        
        if ($result === false) {
            $this->log_message("Error adding part_number column: " . $wpdb->last_error);
        } else {
            $this->log_message("Successfully added part_number column");
        }
    }
    
    /**
     * Logs a message to the plugin's log file
     * 
     * @param string $message The message to log
     */
    private function log_message($message) {
        if (!$this->log_enabled) {
            return;
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[{$timestamp}] {$message}" . PHP_EOL;
        
        error_log($log_entry, 3, $this->log_file);
    }
}

// 初始化插件
new BJT_Cart_Fix_Plugin(); 