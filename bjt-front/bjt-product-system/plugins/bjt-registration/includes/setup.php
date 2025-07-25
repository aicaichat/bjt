<?php
namespace BJT\Reg;

class Setup {
    public static function activate() {
        global $wpdb;
        $table = $wpdb->prefix . 'bjt_user_registration';
        $charset = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE IF NOT EXISTS {$table} (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            wp_user_id BIGINT UNSIGNED NULL,
            json_data LONGTEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            reviewer_id BIGINT UNSIGNED NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME NULL
        ) $charset;";
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    public static function deactivate() {
        // No-op: keep table for data retention
    }
} 