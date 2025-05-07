<?php
/**
 * BJT Database Upgrader Class
 *
 * @package BJT_Product_Admin
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Database_Upgrader {
    private static $instance = null;
    private $current_version;
    private $target_version = '2.0.0';
    private $wpdb;
    private $errors = array();

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->current_version = get_option('bjt_product_db_version', '1.0.0');
    }

    public function maybe_upgrade() {
        try {
            // 检查是否需要升级
            if (version_compare($this->current_version, $this->target_version, '>=')) {
                return true;
            }

            // 检查数据库权限
            if (!$this->check_db_permissions()) {
                throw new Exception('Insufficient database permissions. Required: CREATE, ALTER, DROP');
            }

            // 检查数据库版本
            if (!$this->check_db_version()) {
                throw new Exception('Database version not supported. Required: MySQL 5.6 or higher');
            }

            // 执行升级
            $result = $this->upgrade();
            if ($result === false) {
                throw new Exception('Database upgrade failed: ' . implode('; ', $this->errors));
            }

            return true;
        } catch (Exception $e) {
            $this->errors[] = $e->getMessage();
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('BJT Database Upgrade Error: ' . $e->getMessage());
            }
            return false;
        }
    }

    private function check_db_permissions() {
        try {
            $grants = $this->wpdb->get_results("SHOW GRANTS FOR CURRENT_USER()", ARRAY_N);
            $required_privileges = array('CREATE', 'ALTER', 'DROP');
            $has_privileges = false;

            foreach ($grants as $grant) {
                foreach ($required_privileges as $privilege) {
                    if (strpos($grant[0], $privilege) !== false) {
                        $has_privileges = true;
                        break;
                    }
                }
            }

            return $has_privileges;
        } catch (Exception $e) {
            $this->errors[] = 'Failed to check database permissions: ' . $e->getMessage();
            return false;
        }
    }

    private function check_db_version() {
        try {
            $version = $this->wpdb->db_version();
            return version_compare($version, '5.6', '>=');
        } catch (Exception $e) {
            $this->errors[] = 'Failed to check database version: ' . $e->getMessage();
            return false;
        }
    }

    private function upgrade() {
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        require_once(BJT_PLUGIN_DIR . 'includes/class-bjt-data-migrator.php');

        // 开始事务
        $this->wpdb->query('START TRANSACTION');

        try {
            // 1. 检查并创建新表
            $table_results = array(
                'product_lines' => $this->create_product_lines_table(),
                'host_models' => $this->create_host_models_table(),
                'accessory_models' => $this->create_accessory_models_table(),
                'consumables' => $this->create_consumables_table(),
                'prices' => $this->create_prices_table(),
                'inventory' => $this->create_inventory_table(),
                'required_accessories' => $this->create_required_accessories_table()
            );

            // 检查表创建结果
            foreach ($table_results as $table => $result) {
                if ($result === false) {
                    throw new Exception("Failed to create table: {$table}");
                }
            }

            // 2. 检查是否存在旧表
            $old_tables_exist = $this->check_old_tables_exist();
            
            // 3. 如果存在旧表，创建临时表并迁移数据
            if ($old_tables_exist) {
                $this->create_old_tables();
                $migrator = BJT_Data_Migrator::get_instance();
                
                if (!$migrator) {
                    throw new Exception('Failed to initialize data migrator');
                }
                
                $success = $migrator->migrate_all();
                if (!$success) {
                    throw new Exception('Data migration failed');
                }
            }

            // 4. 更新数据库版本
            if (!update_option('bjt_product_db_version', $this->target_version)) {
                throw new Exception('Failed to update database version');
            }

            // 提交事务
            $this->wpdb->query('COMMIT');
            
            return true;
        } catch (Exception $e) {
            // 回滚事务
            $this->wpdb->query('ROLLBACK');
            
            // 记录错误
            $this->errors[] = $e->getMessage();
            if ($this->wpdb->last_error) {
                $this->errors[] = 'Database error: ' . $this->wpdb->last_error;
            }
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('BJT Database Upgrade Error: ' . $e->getMessage());
                if ($this->wpdb->last_error) {
                    error_log('Database Error: ' . $this->wpdb->last_error);
                }
            }
            
            return false;
        }
    }

    public function get_errors() {
        return $this->errors;
    }

    private function check_old_tables_exist() {
        $tables = array(
            $this->wpdb->prefix . 'bjt_product_lines',
            $this->wpdb->prefix . 'bjt_hosts',
            $this->wpdb->prefix . 'bjt_accessories',
            $this->wpdb->prefix . 'bjt_consumables',
            $this->wpdb->prefix . 'bjt_prices',
            $this->wpdb->prefix . 'bjt_inventory'
        );

        foreach ($tables as $table) {
            if ($this->wpdb->get_var("SHOW TABLES LIKE '$table'") === $table) {
                return true;
            }
        }

        return false;
    }

    private function create_old_tables() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        // 创建临时表
        $tables = array(
            'bjt_product_lines' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_product_lines_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                code varchar(50) NOT NULL COMMENT '产品线代码',
                name varchar(255) NOT NULL COMMENT '名称',
                description text COMMENT '描述',
                image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
                status varchar(20) NOT NULL DEFAULT 'publish',
                menu_order int(11) DEFAULT '0',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_code (code)
            ) $charset_collate;",
            
            'bjt_hosts' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_hosts_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                code varchar(100) NOT NULL COMMENT '型号',
                name varchar(255) NOT NULL COMMENT '名称',
                description text COMMENT '描述',
                product_line_code varchar(50) NOT NULL COMMENT '产品线代码',
                image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
                status varchar(20) NOT NULL DEFAULT 'publish',
                menu_order int(11) DEFAULT '0',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_code (code)
            ) $charset_collate;",
            
            'bjt_accessories' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_accessories_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                code varchar(100) NOT NULL COMMENT '型号',
                name varchar(255) NOT NULL COMMENT '名称',
                description text COMMENT '描述',
                product_line_code varchar(50) NOT NULL COMMENT '产品线代码',
                image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
                status varchar(20) NOT NULL DEFAULT 'publish',
                menu_order int(11) DEFAULT '0',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_code (code)
            ) $charset_collate;",
            
            'bjt_consumables' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_consumables_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                code varchar(100) NOT NULL COMMENT '型号',
                name varchar(255) NOT NULL COMMENT '名称',
                description text COMMENT '描述',
                product_line_code varchar(50) NOT NULL COMMENT '产品线代码',
                image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
                status varchar(20) NOT NULL DEFAULT 'publish',
                menu_order int(11) DEFAULT '0',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_code (code)
            ) $charset_collate;",
            
            'bjt_prices' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_prices_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                target_type varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
                target_id bigint(20) NOT NULL COMMENT '目标ID',
                region varchar(10) NOT NULL COMMENT '区域代码',
                currency varchar(10) NOT NULL COMMENT '货币代码',
                base_price decimal(10,2) NOT NULL COMMENT '基础价格',
                min_quantity int(11) NOT NULL DEFAULT '1' COMMENT '最小数量',
                max_quantity int(11) DEFAULT NULL COMMENT '最大数量',
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_target_region_quantity (target_type,target_id,region,min_quantity)
            ) $charset_collate;",
            
            'bjt_inventory' => "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_inventory_old (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                target_type varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
                target_id bigint(20) NOT NULL COMMENT '目标ID',
                region varchar(10) NOT NULL COMMENT '区域代码',
                warehouse varchar(50) NOT NULL COMMENT '仓库代码',
                quantity int(11) NOT NULL DEFAULT '0' COMMENT '库存数量',
                reserved int(11) NOT NULL DEFAULT '0' COMMENT '预留数量',
                status varchar(20) NOT NULL DEFAULT 'active',
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_target_region_warehouse (target_type,target_id,region,warehouse)
            ) $charset_collate;"
        );

        foreach ($tables as $table_name => $sql) {
            dbDelta($sql);
            
            // 复制数据到临时表
            $this->wpdb->query("INSERT INTO {$this->wpdb->prefix}{$table_name}_old SELECT * FROM {$this->wpdb->prefix}{$table_name}");
        }
    }

    private function create_product_lines_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_product_lines (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            code varchar(50) NOT NULL COMMENT '产品线代码',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
            status varchar(20) NOT NULL DEFAULT 'publish',
            menu_order int(11) DEFAULT '0',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_code (code),
            KEY idx_status (status)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_host_models_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_host_models (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_line_id bigint(20) NOT NULL COMMENT '产品线ID',
            model varchar(100) NOT NULL COMMENT '型号',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications json DEFAULT NULL COMMENT '规格参数',
            voltage_options json DEFAULT NULL COMMENT '电压选项',
            image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
            status varchar(20) NOT NULL DEFAULT 'publish',
            menu_order int(11) DEFAULT '0',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_model (model),
            KEY idx_product_line_id (product_line_id),
            KEY idx_status (status),
            CONSTRAINT fk_host_product_line FOREIGN KEY (product_line_id) REFERENCES {$this->wpdb->prefix}bjt_product_lines (id)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_accessory_models_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_accessory_models (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '型号',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications json DEFAULT NULL COMMENT '规格参数',
            image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
            parent_id bigint(20) DEFAULT NULL COMMENT '父级配件ID',
            level int(11) NOT NULL DEFAULT '1' COMMENT '层级',
            status varchar(20) NOT NULL DEFAULT 'publish',
            menu_order int(11) DEFAULT '0',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_model (model),
            KEY idx_parent_id (parent_id),
            KEY idx_status (status),
            CONSTRAINT fk_accessory_parent FOREIGN KEY (parent_id) REFERENCES {$this->wpdb->prefix}bjt_accessory_models (id)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_consumables_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_consumables (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_line_id bigint(20) NOT NULL COMMENT '产品线ID',
            model varchar(100) NOT NULL COMMENT '型号',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications json DEFAULT NULL COMMENT '规格参数',
            image_url varchar(255) DEFAULT NULL COMMENT '图片URL',
            compatible_models json DEFAULT NULL COMMENT '兼容型号',
            status varchar(20) NOT NULL DEFAULT 'publish',
            menu_order int(11) DEFAULT '0',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_model (model),
            KEY idx_product_line_id (product_line_id),
            KEY idx_status (status),
            CONSTRAINT fk_consumable_product_line FOREIGN KEY (product_line_id) REFERENCES {$this->wpdb->prefix}bjt_product_lines (id)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_prices_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_prices (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            target_type varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
            target_id bigint(20) NOT NULL COMMENT '目标ID',
            region varchar(10) NOT NULL COMMENT '区域代码',
            currency varchar(10) NOT NULL COMMENT '货币代码',
            base_price decimal(10,2) NOT NULL COMMENT '基础价格',
            min_quantity int(11) NOT NULL DEFAULT '1' COMMENT '最小数量',
            max_quantity int(11) DEFAULT NULL COMMENT '最大数量',
            discount_rate decimal(5,4) DEFAULT NULL COMMENT '折扣率',
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_target_region_quantity (target_type,target_id,region,min_quantity),
            KEY idx_status (status)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_inventory_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_inventory (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            target_type varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
            target_id bigint(20) NOT NULL COMMENT '目标ID',
            region varchar(10) NOT NULL COMMENT '区域代码',
            warehouse varchar(50) NOT NULL COMMENT '仓库代码',
            quantity int(11) NOT NULL DEFAULT '0' COMMENT '库存数量',
            reserved int(11) NOT NULL DEFAULT '0' COMMENT '预留数量',
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_target_region_warehouse (target_type,target_id,region,warehouse),
            KEY idx_status (status)
        ) $charset_collate;";
        
        dbDelta($sql);
    }

    private function create_required_accessories_table() {
        $charset_collate = $this->wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$this->wpdb->prefix}bjt_required_accessories (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            host_model_id bigint(20) NOT NULL COMMENT '主机型号ID',
            accessory_model_id bigint(20) NOT NULL COMMENT '配件型号ID',
            quantity int(11) NOT NULL DEFAULT '1' COMMENT '所需数量',
            description text COMMENT '说明',
            status varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态',
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_host_accessory (host_model_id, accessory_model_id),
            KEY idx_host_model (host_model_id),
            KEY idx_accessory_model (accessory_model_id),
            CONSTRAINT fk_required_host_model FOREIGN KEY (host_model_id) REFERENCES {$this->wpdb->prefix}bjt_host_models (id) ON DELETE CASCADE,
            CONSTRAINT fk_required_accessory_model FOREIGN KEY (accessory_model_id) REFERENCES {$this->wpdb->prefix}bjt_accessory_models (id) ON DELETE CASCADE
        ) $charset_collate;";
        
        dbDelta($sql);
    }
} 