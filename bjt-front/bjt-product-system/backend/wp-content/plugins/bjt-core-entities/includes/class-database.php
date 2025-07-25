<?php
/**
 * 数据库操作类
 */

class BJT_Database {
    /**
     * 检查数据库表是否存在，不存在则创建
     */
    public static function check_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $tables = [
            'bjt_product_lines' => "CREATE TABLE {$wpdb->prefix}bjt_product_lines (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                title_zh varchar(255) NOT NULL,
                title_en varchar(255) NOT NULL,
                description_zh text,
                description_en text,
                subitem1_zh varchar(255),
                subitem1_en varchar(255),
                subitem2_zh varchar(255),
                subitem2_en varchar(255),
                subitem3_zh varchar(255),
                subitem3_en varchar(255),
                image_url varchar(255),
                code varchar(50) NOT NULL,
                status varchar(20) DEFAULT 'publish',
                sort_order int DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY code (code)
            ) $charset_collate;",
            
            'bjt_machines' => "CREATE TABLE {$wpdb->prefix}bjt_machines (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                title_zh varchar(255) NOT NULL,
                title_en varchar(255) NOT NULL,
                description_zh text,
                description_en text,
                code varchar(50) NOT NULL,
                product_line_id bigint(20),
                price_cny decimal(10,2) DEFAULT 0,
                price_usd decimal(10,2) DEFAULT 0,
                price_eur decimal(10,2) DEFAULT 0,
                image_url varchar(255),
                specs_json longtext,
                status varchar(20) DEFAULT 'publish',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY code (code)
            ) $charset_collate;",
            
            'bjt_accessories' => "CREATE TABLE {$wpdb->prefix}bjt_accessories (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                title_zh varchar(255) NOT NULL,
                title_en varchar(255) NOT NULL,
                description_zh text,
                description_en text,
                code varchar(50) NOT NULL,
                machine_id varchar(50),
                parent_id bigint(20) DEFAULT 0,
                level int DEFAULT 1,
                is_required tinyint(1) DEFAULT 0,
                price_cny decimal(10,2) DEFAULT 0,
                price_usd decimal(10,2) DEFAULT 0,
                price_eur decimal(10,2) DEFAULT 0,
                image_url varchar(255),
                specs_json longtext,
                status varchar(20) DEFAULT 'publish',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY code (code)
            ) $charset_collate;",
            
            'bjt_consumables' => "CREATE TABLE {$wpdb->prefix}bjt_consumables (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                title_zh varchar(255) NOT NULL,
                title_en varchar(255) NOT NULL,
                description_zh text,
                description_en text,
                code varchar(50) NOT NULL,
                product_line_id bigint(20),
                price_cny decimal(10,2) DEFAULT 0,
                price_usd decimal(10,2) DEFAULT 0,
                price_eur decimal(10,2) DEFAULT 0,
                inventory_cn int DEFAULT 0,
                inventory_eu int DEFAULT 0,
                inventory_na int DEFAULT 0,
                inventory_au int DEFAULT 0,
                image_url varchar(255),
                specs_json longtext,
                status varchar(20) DEFAULT 'publish',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY code (code)
            ) $charset_collate;",
            
            'bjt_spare_parts' => "CREATE TABLE {$wpdb->prefix}bjt_spare_parts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                title_zh varchar(255) NOT NULL,
                title_en varchar(255) NOT NULL,
                description_zh text,
                description_en text,
                code varchar(50) NOT NULL,
                machine_codes text,
                price_cny decimal(10,2) DEFAULT 0,
                price_usd decimal(10,2) DEFAULT 0,
                price_eur decimal(10,2) DEFAULT 0,
                inventory_cn int DEFAULT 0,
                inventory_eu int DEFAULT 0,
                inventory_na int DEFAULT 0,
                inventory_au int DEFAULT 0,
                image_url varchar(255),
                specs_json longtext,
                status varchar(20) DEFAULT 'publish',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY code (code)
            ) $charset_collate;",
            
            'bjt_carts' => "CREATE TABLE {$wpdb->prefix}bjt_carts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                user_id bigint(20) NOT NULL,
                region varchar(10) DEFAULT 'CN',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id)
            ) $charset_collate;",
            
            'bjt_cart_items' => "CREATE TABLE {$wpdb->prefix}bjt_cart_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                cart_id bigint(20) NOT NULL,
                item_type varchar(20) NOT NULL,
                item_id varchar(50) NOT NULL,
                quantity int DEFAULT 1,
                price decimal(10,2) DEFAULT 0,
                currency varchar(3) DEFAULT 'CNY',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id)
            ) $charset_collate;",
            
            'bjt_orders' => "CREATE TABLE {$wpdb->prefix}bjt_orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_number varchar(50) NOT NULL,
                user_id bigint(20) NOT NULL,
                status varchar(20) DEFAULT 'pending',
                total_amount decimal(10,2) DEFAULT 0,
                currency varchar(3) DEFAULT 'CNY',
                region varchar(10) DEFAULT 'CN',
                shipping_address text,
                billing_address text,
                payment_method varchar(50),
                payment_status varchar(20) DEFAULT 'unpaid',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY  (id),
                UNIQUE KEY order_number (order_number)
            ) $charset_collate;",
            
            'bjt_order_items' => "CREATE TABLE {$wpdb->prefix}bjt_order_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) NOT NULL,
                item_type varchar(20) NOT NULL,
                item_id varchar(50) NOT NULL,
                item_name varchar(255) NOT NULL,
                quantity int DEFAULT 1,
                price decimal(10,2) DEFAULT 0,
                currency varchar(3) DEFAULT 'CNY',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id)
            ) $charset_collate;"
        ];
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        foreach ($tables as $table => $sql) {
            dbDelta($sql);
        }
    }
} 