<?php
/**
 * BJT Product Admin Installation Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Install {
    /**
     * 安装插件
     */
    public static function install() {
        if (!is_blog_installed()) {
            return;
        }

        // 检查权限
        if (!current_user_can('activate_plugins')) {
            return;
        }

        // 创建数据库表
        self::create_tables();

        // 添加默认选项
        self::create_options();

        // 创建必要的目录
        self::create_directories();

        // 设置版本号
        self::update_version();

        // 清理缓存
        self::clear_cache();

        // 刷新重写规则
        flush_rewrite_rules();
    }

    /**
     * 创建数据库表
     */
    private static function create_tables() {
        global $wpdb;

        $wpdb->hide_errors();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $collate = '';

        if ($wpdb->has_cap('collation')) {
            $collate = $wpdb->get_charset_collate();
        }

        $tables = array();

        // 产品线表
        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_product_lines (
            id bigint(20) unsigned NOT NULL auto_increment,
            title_en varchar(255) NOT NULL,
            title_zh varchar(255) NOT NULL,
            description_en text,
            description_zh text,
            consumables_en text,
            consumables_zh text,
            parts_en text,
            parts_zh text,
            image_url varchar(255),
            status varchar(20) NOT NULL default 'draft',
            sort_order int(11) NOT NULL default 0,
            created_at datetime NOT NULL default CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY sort_order (sort_order)
        ) $collate;";

        // 主机型号表
        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_host_models (
            id bigint(20) unsigned NOT NULL auto_increment,
            product_line_id bigint(20) unsigned NOT NULL,
            model_number varchar(100) NOT NULL,
            description_en text,
            description_zh text,
            image_url varchar(255),
            status varchar(20) NOT NULL default 'draft',
            created_at datetime NOT NULL default CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY product_line_id (product_line_id),
            KEY model_number (model_number),
            KEY status (status)
        ) $collate;";

        // 配件型号表
        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_accessory_models (
            id bigint(20) unsigned NOT NULL auto_increment,
            product_line_id bigint(20) unsigned NOT NULL,
            model_number varchar(100) NOT NULL,
            description_en text,
            description_zh text,
            image_url varchar(255),
            status varchar(20) NOT NULL default 'draft',
            created_at datetime NOT NULL default CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY product_line_id (product_line_id),
            KEY model_number (model_number),
            KEY status (status)
        ) $collate;";

        // 耗材表
        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_consumables (
            id bigint(20) unsigned NOT NULL auto_increment,
            product_line_id bigint(20) unsigned NOT NULL,
            part_number varchar(100) NOT NULL,
            shape_id bigint(20) unsigned,
            material_id bigint(20) unsigned,
            thickness_metric decimal(10,2),
            thickness_imperial decimal(10,2),
            width_metric decimal(10,2),
            width_imperial decimal(10,2),
            length_metric decimal(10,2),
            length_imperial decimal(10,2),
            weight_metric decimal(10,2),
            weight_imperial decimal(10,2),
            status varchar(20) NOT NULL default 'draft',
            created_at datetime NOT NULL default CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number),
            KEY product_line_id (product_line_id),
            KEY shape_id (shape_id),
            KEY material_id (material_id),
            KEY status (status)
        ) $collate;";

        // 备件表
        $tables[] = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_parts (
            id bigint(20) unsigned NOT NULL auto_increment,
            product_line_id bigint(20) unsigned NOT NULL,
            part_number varchar(100) NOT NULL,
            model_number varchar(100),
            description_en text,
            description_zh text,
            is_common tinyint(1) NOT NULL default 0,
            serial_number varchar(100),
            image_url varchar(255),
            status varchar(20) NOT NULL default 'draft',
            created_at datetime NOT NULL default CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY part_number (part_number),
            KEY product_line_id (product_line_id),
            KEY model_number (model_number),
            KEY is_common (is_common),
            KEY status (status)
        ) $collate;";

        // 执行表创建
        foreach ($tables as $table) {
            dbDelta($table);
        }
    }

    /**
     * 创建选项
     */
    private static function create_options() {
        // 添加或更新插件版本
        add_option('bjt_product_admin_version', BJT_PRODUCT_ADMIN_VERSION);

        // 添加其他必要的选项
        add_option('bjt_product_admin_installed', 'yes');
        add_option('bjt_product_admin_install_date', current_time('mysql'));
    }

    /**
     * 创建必要的目录
     */
    private static function create_directories() {
        // 创建上传目录
        $upload_dir = wp_upload_dir();
        $bjt_upload_dir = $upload_dir['basedir'] . '/bjt-product-admin';

        if (!file_exists($bjt_upload_dir)) {
            wp_mkdir_p($bjt_upload_dir);
        }

        // 创建缓存目录
        $bjt_cache_dir = $bjt_upload_dir . '/cache';
        if (!file_exists($bjt_cache_dir)) {
            wp_mkdir_p($bjt_cache_dir);
        }

        // 保护目录
        $htaccess_file = $bjt_upload_dir . '/.htaccess';
        if (!file_exists($htaccess_file)) {
            $htaccess_content = "Options -Indexes\n";
            $htaccess_content .= "<Files *.php>\n";
            $htaccess_content .= "deny from all\n";
            $htaccess_content .= "</Files>\n";
            @file_put_contents($htaccess_file, $htaccess_content);
        }
    }

    /**
     * 更新版本
     */
    private static function update_version() {
        delete_option('bjt_product_admin_version');
        add_option('bjt_product_admin_version', BJT_PRODUCT_ADMIN_VERSION);
    }

    /**
     * 清理缓存
     */
    private static function clear_cache() {
        wp_cache_flush();
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }
    }
}
