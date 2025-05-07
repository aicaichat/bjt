<?php
/**
 * BJT Data Migrator Class
 *
 * Handles data migration from old tables to new tables.
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Data_Migrator {
    private static $instance = null;
    private $wpdb;
    private $old_prefix = 'wp_bjt_';
    private $new_prefix = 'wp_bjt_';
    private $errors = array();

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    public function migrate_all() {
        try {
            // 开始事务
            $this->wpdb->query('START TRANSACTION');

            // 检查临时表是否存在
            if (!$this->check_old_tables()) {
                // 如果没有旧表，认为是新安装，直接返回成功
                $this->wpdb->query('COMMIT');
                return true;
            }

            // 迁移数据
            $migrations = array(
                'product_lines' => array($this, 'migrate_product_lines'),
                'host_models' => array($this, 'migrate_host_models'),
                'accessories' => array($this, 'migrate_accessories'),
                'consumables' => array($this, 'migrate_consumables'),
                'prices' => array($this, 'migrate_prices'),
                'inventory' => array($this, 'migrate_inventory')
            );

            foreach ($migrations as $name => $migration) {
                try {
                    if (!$migration()) {
                        throw new Exception("Failed to migrate {$name}");
                    }
                } catch (Exception $e) {
                    $this->errors[] = "Migration of {$name} failed: " . $e->getMessage();
                    if ($this->wpdb->last_error) {
                        $this->errors[] = "Database error during {$name} migration: " . $this->wpdb->last_error;
                    }
                    throw $e;
                }
            }

            // 清理临时表
            $this->cleanup_old_tables();

            // 提交事务
            $this->wpdb->query('COMMIT');
            return true;

        } catch (Exception $e) {
            // 回滚事务
            $this->wpdb->query('ROLLBACK');
            
            // 记录错误
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('BJT Data Migration Error: ' . $e->getMessage());
                if ($this->wpdb->last_error) {
                    error_log('Database Error: ' . $this->wpdb->last_error);
                }
                error_log('Migration Errors: ' . print_r($this->errors, true));
            }
            
            return false;
        }
    }

    private function check_old_tables() {
        $required_tables = array(
            'bjt_product_lines_old',
            'bjt_hosts_old',
            'bjt_accessories_old',
            'bjt_consumables_old',
            'bjt_prices_old',
            'bjt_inventory_old'
        );

        foreach ($required_tables as $table) {
            if (!$this->table_exists($this->wpdb->prefix . $table)) {
                return false;
            }
        }

        return true;
    }

    private function cleanup_old_tables() {
        $tables = array(
            'bjt_product_lines_old',
            'bjt_hosts_old',
            'bjt_accessories_old',
            'bjt_consumables_old',
            'bjt_prices_old',
            'bjt_inventory_old'
        );

        foreach ($tables as $table) {
            try {
                $this->wpdb->query("DROP TABLE IF EXISTS {$this->wpdb->prefix}{$table}");
            } catch (Exception $e) {
                $this->errors[] = "Failed to drop table {$table}: " . $e->getMessage();
                // 继续删除其他表，不中断流程
            }
        }
    }

    private function migrate_product_lines() {
        global $wpdb;
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_product_lines");
        if ($count > 0) {
            bjt_log_error('Product lines table already has data, skipping migration');
            return true;
        }
        
        $sql = "INSERT INTO {$wpdb->prefix}bjt_product_lines
                (code, name_cn, name_en, description_cn, description_en, image_url, status, menu_order)
                SELECT 
                    code,
                    name,
                    name,
                    description,
                    description,
                    image_url,
                    status,
                    menu_order
                FROM {$wpdb->prefix}bjt_product_lines_old";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate product lines', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        return true;
    }

    private function migrate_host_models() {
        global $wpdb;
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_host_models");
        if ($count > 0) {
            bjt_log_error('Host models table already has data, skipping migration');
            return true;
        }
        
        $sql = "INSERT INTO {$wpdb->prefix}bjt_host_models
                (product_line_id, model, name_cn, name_en, description_cn, description_en, 
                 image_url, status, menu_order)
                SELECT 
                    pl.id AS product_line_id,
                    h.code AS model,
                    h.name AS name_cn,
                    h.name AS name_en,
                    h.description AS description_cn,
                    h.description AS description_en,
                    h.image_url,
                    h.status,
                    h.menu_order
                FROM {$wpdb->prefix}bjt_hosts_old h
                JOIN {$wpdb->prefix}bjt_product_lines pl ON h.product_line_code = pl.code";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate host models', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        return true;
    }

    private function migrate_accessories() {
        global $wpdb;
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_accessory_models");
        if ($count > 0) {
            bjt_log_error('Accessory models table already has data, skipping migration');
            return true;
        }
        
        $sql = "INSERT INTO {$wpdb->prefix}bjt_accessory_models
                (model, name_cn, name_en, description_cn, description_en, 
                 specifications, image_url, status, menu_order)
                SELECT 
                    a.code AS model,
                    a.name AS name_cn,
                    a.name AS name_en,
                    a.description AS description_cn,
                    a.description AS description_en,
                    '{}' AS specifications,
                    a.image_url,
                    a.status,
                    a.menu_order
                FROM {$wpdb->prefix}bjt_accessories_old a";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate accessories', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        return true;
    }

    private function migrate_consumables() {
        global $wpdb;
        
        if (!$this->table_exists($wpdb->prefix . 'bjt_consumables')) {
            bjt_log_error('Old consumables table not found');
            return false;
        }
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_consumables");
        if ($count > 0) {
            bjt_log_error('Consumables table already has data, skipping migration');
            return true;
        }
        
        return true;
    }

    private function migrate_prices() {
        global $wpdb;
        
        if (!$this->table_exists($wpdb->prefix . 'bjt_prices')) {
            bjt_log_error('Old prices table not found');
            return false;
        }
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_prices");
        if ($count > 0) {
            bjt_log_error('Prices table already has data, skipping migration');
            return true;
        }
        
        // 迁移主机型号的价格
        $sql = "INSERT INTO {$wpdb->prefix}bjt_prices
                    (target_type, target_id, region, currency, base_price, min_quantity, max_quantity, status)
                    SELECT 
                        'host_model',
                        h_new.id,
                        p.region,
                        p.currency,
                        p.base_price,
                        p.min_quantity,
                        p.max_quantity,
                        p.status
                    FROM {$wpdb->prefix}bjt_prices p
                    JOIN {$wpdb->prefix}bjt_hosts h_old ON p.target_id = h_old.id
                    JOIN {$wpdb->prefix}bjt_host_models h_new ON h_old.code = h_new.model
                    WHERE p.target_type = 'host'";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate host model prices', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        // 迁移配件的价格
        $sql = "INSERT INTO {$wpdb->prefix}bjt_prices
                    (target_type, target_id, region, currency, base_price, min_quantity, max_quantity, status)
                    SELECT 
                        'accessory_model',
                        a_new.id,
                        p.region,
                        p.currency,
                        p.base_price,
                        p.min_quantity,
                        p.max_quantity,
                        p.status
                    FROM {$wpdb->prefix}bjt_prices p
                    JOIN {$wpdb->prefix}bjt_accessories a_old ON p.target_id = a_old.id
                    JOIN {$wpdb->prefix}bjt_accessory_models a_new ON CONCAT('ACC', LPAD(a_old.id, 6, '0')) = a_new.model
                    WHERE p.target_type = 'accessory'";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate accessory model prices', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        // 迁移耗材的价格
        $sql = "INSERT INTO {$wpdb->prefix}bjt_prices
                    (target_type, target_id, region, currency, base_price, min_quantity, max_quantity, status)
                    SELECT 
                        'consumable',
                        c.id,
                        p.region,
                        p.currency,
                        p.base_price,
                        p.min_quantity,
                        p.max_quantity,
                        p.status
                    FROM {$wpdb->prefix}bjt_prices p
                    JOIN {$wpdb->prefix}bjt_consumables c ON p.target_id = c.id
                    WHERE p.target_type = 'consumable'";
        
        $result = $wpdb->query($sql);
        
        if ($result === false) {
            bjt_log_error('Failed to migrate consumable prices', array(
                'error' => $wpdb->last_error,
                'sql' => $sql
            ));
            return false;
        }
        
        return true;
    }

    private function migrate_inventory() {
        global $wpdb;
        
        if (!$this->table_exists($wpdb->prefix . 'bjt_inventory')) {
            bjt_log_error('Old inventory table not found');
            return false;
        }
        
        // 检查表中是否已有数据
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_inventory");
        if ($count > 0) {
            bjt_log_error('Inventory table already has data, skipping migration');
            return true;
        }
        
        return true;
    }

    private function table_exists($table) {
        try {
            return $this->wpdb->get_var(
                $this->wpdb->prepare(
                    "SHOW TABLES LIKE %s",
                    $table
                )
            ) === $table;
        } catch (Exception $e) {
            $this->errors[] = "Failed to check table existence: " . $e->getMessage();
            return false;
        }
    }

    public function get_errors() {
        return $this->errors;
    }
} 