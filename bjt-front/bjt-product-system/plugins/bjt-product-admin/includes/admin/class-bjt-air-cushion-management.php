<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Air_Cushion_Management {
    private static $instance = null;
    private $table_prefix;

    private function __construct() {
        global $wpdb;
        $this->table_prefix = $wpdb->prefix . 'bjt_air_cushion_';
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // 主机型号表
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_prefix}host_models (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '主机型号编码',
            title_cn varchar(255) NOT NULL COMMENT '中文名称',
            title_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications_cn text COMMENT '中文规格',
            specifications_en text COMMENT '英文规格',
            features_cn text COMMENT '中文特点',
            features_en text COMMENT '英文特点',
            image1_url varchar(255) COMMENT '主图URL',
            image2_url varchar(255) COMMENT '副图URL',
            explosion_diagram_pdf varchar(255) COMMENT '爆炸图PDF',
            status varchar(20) DEFAULT 'publish' COMMENT '状态',
            menu_order int(11) DEFAULT 0 COMMENT '排序',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY model (model)
        ) $charset_collate;";

        // 配件型号表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}accessory_models (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '配件型号编码',
            title_cn varchar(255) NOT NULL COMMENT '中文名称',
            title_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications_cn text COMMENT '中文规格',
            specifications_en text COMMENT '英文规格',
            features_cn text COMMENT '中文特点',
            features_en text COMMENT '英文特点',
            image1_url varchar(255) COMMENT '主图URL',
            image2_url varchar(255) COMMENT '副图URL',
            explosion_diagram_pdf varchar(255) COMMENT '爆炸图PDF',
            status varchar(20) DEFAULT 'publish' COMMENT '状态',
            menu_order int(11) DEFAULT 0 COMMENT '排序',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY model (model)
        ) $charset_collate;";

        // 备件型号表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}spare_part_models (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '备件型号编码',
            title_cn varchar(255) NOT NULL COMMENT '中文名称',
            title_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            specifications_cn text COMMENT '中文规格',
            specifications_en text COMMENT '英文规格',
            features_cn text COMMENT '中文特点',
            features_en text COMMENT '英文特点',
            image1_url varchar(255) COMMENT '主图URL',
            image2_url varchar(255) COMMENT '副图URL',
            explosion_diagram_pdf varchar(255) COMMENT '爆炸图PDF',
            status varchar(20) DEFAULT 'publish' COMMENT '状态',
            menu_order int(11) DEFAULT 0 COMMENT '排序',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY model (model)
        ) $charset_collate;";

        // 配件表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}accessories (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            part_number varchar(100) NOT NULL COMMENT '配件料号',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            voltage varchar(50) COMMENT '电压',
            frequency varchar(50) COMMENT '频率',
            package_size varchar(100) COMMENT '包装尺寸',
            package_weight decimal(10,2) COMMENT '包装重量',
            pallet_size varchar(100) COMMENT '托盘尺寸',
            pcs_per_pallet int(11) COMMENT '每托数量',
            pallet_height decimal(10,2) COMMENT '托盘高度',
            image_url varchar(255) COMMENT '图片URL',
            status varchar(20) DEFAULT 'publish' COMMENT '状态',
            menu_order int(11) DEFAULT 0 COMMENT '排序',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        // 配件关联关系表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}accessory_relations (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '适用主机型号',
            parent_part_number varchar(100) COMMENT '父配件料号，第一级为null',
            child_part_number varchar(100) NOT NULL COMMENT '子配件/备件料号',
            child_type ENUM('accessory', 'spare_part') NOT NULL COMMENT '子项类型：配件/备件',
            level int(11) NOT NULL DEFAULT 1 COMMENT '层级(1-5)，备件固定为1',
            quantity int(11) DEFAULT 1 COMMENT '数量',
            menu_order int(11) DEFAULT 0 COMMENT '同级排序',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_relation (model, parent_part_number, child_part_number),
            KEY model (model),
            KEY parent_part_number (parent_part_number),
            KEY child_part_number (child_part_number),
            KEY child_type (child_type),
            KEY level (level),
            FOREIGN KEY (model) REFERENCES {$this->table_prefix}host_models(model) ON DELETE CASCADE,
            FOREIGN KEY (parent_part_number) REFERENCES {$this->table_prefix}accessories(part_number) ON DELETE CASCADE,
            CONSTRAINT check_child_reference CHECK (
                (child_type = 'accessory' AND child_part_number IN (SELECT part_number FROM {$this->table_prefix}accessories)) OR
                (child_type = 'spare_part' AND child_part_number IN (SELECT part_number FROM {$this->table_prefix}spare_parts))
            )
        ) $charset_collate;";

        // 备件表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}spare_parts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            part_number varchar(100) NOT NULL COMMENT '备件料号',
            name_cn varchar(255) NOT NULL COMMENT '中文名称',
            name_en varchar(255) NOT NULL COMMENT '英文名称',
            description_cn text COMMENT '中文描述',
            description_en text COMMENT '英文描述',
            package_size varchar(100) COMMENT '包装尺寸',
            package_weight decimal(10,2) COMMENT '包装重量',
            image_url varchar(255) COMMENT '图片URL',
            status varchar(20) DEFAULT 'publish' COMMENT '状态',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY part_number (part_number)
        ) $charset_collate;";

        // 配件必选备件表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}accessory_required_parts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            model varchar(100) NOT NULL COMMENT '适用主机型号',
            accessory_part_number varchar(100) NOT NULL COMMENT '配件料号',
            spare_part_number varchar(100) NOT NULL COMMENT '必选备件料号',
            quantity int(11) DEFAULT 1 COMMENT '必选数量',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_required_part (model, accessory_part_number, spare_part_number),
            KEY model (model),
            KEY accessory_part_number (accessory_part_number),
            KEY spare_part_number (spare_part_number),
            FOREIGN KEY (model) REFERENCES {$this->table_prefix}host_models(model) ON DELETE CASCADE,
            FOREIGN KEY (accessory_part_number) REFERENCES {$this->table_prefix}accessories(part_number) ON DELETE CASCADE,
            FOREIGN KEY (spare_part_number) REFERENCES {$this->table_prefix}spare_parts(part_number) ON DELETE CASCADE
        ) $charset_collate;";

        // 价格表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}prices (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            part_number varchar(100) NOT NULL COMMENT '料号',
            min_quantity int(11) NOT NULL COMMENT '最小数量',
            max_quantity int(11) COMMENT '最大数量',
            price decimal(10,2) NOT NULL COMMENT '价格',
            currency varchar(10) NOT NULL DEFAULT 'CNY' COMMENT '货币',
            region varchar(50) NOT NULL DEFAULT 'CN' COMMENT '区域',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY part_number (part_number),
            KEY region (region)
        ) $charset_collate;";

        // 库存表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}inventory (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            part_number varchar(100) NOT NULL COMMENT '料号',
            warehouse varchar(50) NOT NULL COMMENT '仓库代码',
            quantity int(11) NOT NULL DEFAULT 0 COMMENT '库存数量',
            reserved_quantity int(11) NOT NULL DEFAULT 0 COMMENT '预留数量',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY part_warehouse (part_number, warehouse),
            KEY part_number (part_number),
            KEY warehouse (warehouse)
        ) $charset_collate;";

        // 仓库表
        $sql .= "CREATE TABLE IF NOT EXISTS {$this->table_prefix}warehouses (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            code varchar(50) NOT NULL COMMENT '仓库代码',
            name_cn varchar(100) NOT NULL COMMENT '中文名称',
            name_en varchar(100) NOT NULL COMMENT '英文名称',
            region varchar(50) NOT NULL COMMENT '区域',
            status varchar(20) DEFAULT 'active' COMMENT '状态',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY code (code)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    // 获取配件的所有必选备件
    public function get_required_spare_parts($model, $accessory_part_number) {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT 
                r.child_part_number as required_part_number,
                r.quantity,
                s.name_cn,
                s.name_en,
                s.package_size,
                s.package_weight,
                s.image_url
            FROM {$this->table_prefix}accessory_relations r
            JOIN {$this->table_prefix}spare_parts s ON r.child_part_number = s.part_number
            WHERE r.model = %s 
            AND r.parent_part_number = %s
            AND r.child_type = 'spare_part'
            ORDER BY r.menu_order ASC",
            $model,
            $accessory_part_number
        ));
    }

    // 添加必选备件关系
    public function add_required_spare_part($model, $accessory_part_number, $spare_part_number, $quantity = 1) {
        return $this->add_accessory_relation(
            $model,
            $accessory_part_number,
            $spare_part_number,
            'spare_part',
            1,  // 备件固定为第1级
            $quantity
        );
    }

    // 删除必选备件关系
    public function delete_required_spare_part($model, $accessory_part_number, $spare_part_number) {
        global $wpdb;
        return $wpdb->delete(
            $this->table_prefix . 'accessory_relations',
            array(
                'model' => $model,
                'parent_part_number' => $accessory_part_number,
                'child_part_number' => $spare_part_number,
                'child_type' => 'spare_part'
            ),
            array('%s', '%s', '%s', '%s')
        );
    }

    // 获取配件的所有关联项（包括子配件和必选备件）
    public function get_accessory_relations($model, $parent_part_number = null, $level = 1) {
        global $wpdb;
        
        $sql = $wpdb->prepare(
            "SELECT 
                r.*,
                CASE r.child_type
                    WHEN 'accessory' THEN a.name_cn
                    WHEN 'spare_part' THEN s.name_cn
                END as name_cn,
                CASE r.child_type
                    WHEN 'accessory' THEN a.name_en
                    WHEN 'spare_part' THEN s.name_en
                END as name_en,
                CASE r.child_type
                    WHEN 'accessory' THEN a.image_url
                    WHEN 'spare_part' THEN s.image_url
                END as image_url,
                CASE r.child_type
                    WHEN 'accessory' THEN a.voltage
                    ELSE NULL
                END as voltage,
                CASE r.child_type
                    WHEN 'accessory' THEN a.frequency
                    ELSE NULL
                END as frequency,
                COALESCE(p.price, 0) as price,
                COALESCE(i.quantity - i.reserved_quantity, 0) as available_stock
            FROM {$this->table_prefix}accessory_relations r
            LEFT JOIN {$this->table_prefix}accessories a ON r.child_type = 'accessory' AND r.child_part_number = a.part_number
            LEFT JOIN {$this->table_prefix}spare_parts s ON r.child_type = 'spare_part' AND r.child_part_number = s.part_number
            LEFT JOIN {$this->table_prefix}prices p ON r.child_part_number = p.part_number 
                AND p.min_quantity <= r.quantity 
                AND (p.max_quantity IS NULL OR p.max_quantity >= r.quantity)
                AND p.region = %s
            LEFT JOIN {$this->table_prefix}inventory i ON r.child_part_number = i.part_number 
                AND i.warehouse = %s
            WHERE r.model = %s AND r.level = %d",
            'CN',
            'MAIN',
            $model,
            $level
        );
        
        $relations = $wpdb->get_results($sql, ARRAY_A);
        
        if (empty($relations)) {
            return array();
        }
        
        // 处理每个关系
        foreach ($relations as &$relation) {
            // 处理图片URL
            if (!empty($relation['image_url'])) {
                $relation['image_url'] = bjt_safe_str_replace('\\', '/', $relation['image_url']);
            }
            
            // 处理价格
            $relation['price'] = floatval($relation['price']);
            
            // 处理库存
            $relation['available_stock'] = intval($relation['available_stock']);
        }
        
        return $relations;
    }

    // 获取配件的价格信息
    public function get_part_price($part_number, $quantity, $region = 'CN') {
        global $wpdb;
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT price, currency
            FROM {$this->table_prefix}price_tiers
            WHERE part_number = %s 
            AND region = %s
            AND min_quantity <= %d 
            AND (max_quantity IS NULL OR max_quantity >= %d)
            ORDER BY min_quantity DESC
            LIMIT 1",
            $part_number,
            $region,
            $quantity,
            $quantity
        ));
    }

    /**
     * Get child accessories for a given parent and model
     */
    public function get_child_accessories($model, $level, $parent_part_number = null) {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT 
                r.id,
                r.child_part_number,
                r.quantity,
                r.menu_order,
                a.name_cn,
                a.name_en,
                a.voltage,
                a.frequency,
                a.package_size,
                a.package_weight,
                a.image_url
            FROM {$this->table_prefix}accessory_relations r
            JOIN {$this->table_prefix}accessories a ON r.child_part_number = a.part_number
            WHERE r.model = %s 
            AND r.parent_part_number " . (is_null($parent_part_number) ? "IS NULL" : "= %s") . "
            AND r.level = %d
            AND r.child_type = 'accessory'
            ORDER BY r.menu_order ASC",
            array_filter(array($model, $parent_part_number, $level), function($value) { return !is_null($value); })
        ), ARRAY_A);
    }

    // 添加配件层级关系
    public function add_accessory_relationship($parent_part_number, $child_part_number, $model, $level, $is_required = false, $quantity = 1) {
        global $wpdb;
        
        // 验证层级范围
        if ($level < 1 || $level > 5) {
            return new WP_Error('invalid_level', '配件层级必须在1-5之间');
        }

        // 验证主机型号存在
        $model_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_prefix}models WHERE model = %s",
            $model
        ));
        if (!$model_exists) {
            return new WP_Error('invalid_model', '主机型号不存在');
        }

        // 验证子配件存在
        $child_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_prefix}accessories WHERE part_number = %s",
            $child_part_number
        ));
        if (!$child_exists) {
            return new WP_Error('invalid_child', '子配件不存在');
        }

        // 如果有父配件，验证父配件存在
        if ($parent_part_number !== null) {
            $parent_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_prefix}accessories WHERE part_number = %s",
                $parent_part_number
            ));
            if (!$parent_exists) {
                return new WP_Error('invalid_parent', '父配件不存在');
            }
        }

        // 获取同级最大排序值
        $max_order = $wpdb->get_var($wpdb->prepare(
            "SELECT MAX(menu_order) FROM {$this->table_prefix}accessory_hierarchy 
            WHERE model = %s AND level = %d",
            $model,
            $level
        ));

        // 插入关系
        return $wpdb->insert(
            $this->table_prefix . 'accessory_hierarchy',
            array(
                'parent_part_number' => $parent_part_number,
                'child_part_number' => $child_part_number,
                'model' => $model,
                'level' => $level,
                'is_required' => $is_required,
                'quantity' => $quantity,
                'menu_order' => ($max_order !== null ? $max_order + 1 : 0)
            ),
            array('%s', '%s', '%s', '%d', '%d', '%d', '%d')
        );
    }

    // 更新配件层级关系
    public function update_accessory_relationship($id, $is_required, $quantity, $menu_order) {
        global $wpdb;
        
        return $wpdb->update(
            $this->table_prefix . 'accessory_hierarchy',
            array(
                'is_required' => $is_required,
                'quantity' => $quantity,
                'menu_order' => $menu_order
            ),
            array('id' => $id),
            array('%d', '%d', '%d'),
            array('%d')
        );
    }

    // 删除配件层级关系
    public function delete_accessory_relationship($id) {
        global $wpdb;
        
        return $wpdb->delete(
            $this->table_prefix . 'accessory_hierarchy',
            array('id' => $id),
            array('%d')
        );
    }

    // 获取主机和配件组合的所有必选备件
    public function get_all_required_parts($model, $accessory_part_number) {
        global $wpdb;
        
        // 获取主机配件的必选备件
        $sql = $wpdb->prepare(
            "SELECT 
                r.required_part_number,
                r.quantity,
                s.name_cn,
                s.name_en,
                s.package_size,
                s.package_weight,
                s.image_url,
                'host_accessory' as requirement_type
            FROM {$this->table_prefix}host_accessory_required r
            JOIN {$this->table_prefix}spare_parts s ON r.required_part_number = s.part_number
            WHERE r.model = %s AND r.accessory_part_number = %s",
            $model,
            $accessory_part_number
        );
        
        $host_accessory_parts = $wpdb->get_results($sql);
        
        // 获取这些备件的必选备件（递归获取）
        $all_required_parts = $host_accessory_parts;
        foreach ($host_accessory_parts as $part) {
            $spare_parts = $this->get_required_spare_parts($part->required_part_number);
            foreach ($spare_parts as $spare_part) {
                $spare_part->requirement_type = 'spare_part';
                $all_required_parts[] = $spare_part;
            }
        }
        
        return $all_required_parts;
    }

    // 添加配件关系
    public function add_accessory_relation($model, $parent_part_number, $child_part_number, $child_type, $level = 1, $quantity = 1) {
        global $wpdb;
        
        // 验证主机型号
        $model_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_prefix}models WHERE model = %s",
            $model
        ));
        if (!$model_exists) {
            return new WP_Error('invalid_model', '主机型号不存在');
        }
        
        // 验证父配件（如果有）
        if ($parent_part_number !== null) {
            $parent_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_prefix}accessories WHERE part_number = %s",
                $parent_part_number
            ));
            if (!$parent_exists) {
                return new WP_Error('invalid_parent', '父配件不存在');
            }
        }
        
        // 验证子项
        if ($child_type === 'accessory') {
            $child_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_prefix}accessories WHERE part_number = %s",
                $child_part_number
            ));
        } else {
            $child_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_prefix}spare_parts WHERE part_number = %s",
                $child_part_number
            ));
        }
        if (!$child_exists) {
            return new WP_Error('invalid_child', '子配件/备件不存在');
        }
        
        // 获取同级最大排序值
        $max_order = $wpdb->get_var($wpdb->prepare(
            "SELECT MAX(menu_order) FROM {$this->table_prefix}accessory_relations 
            WHERE model = %s AND level = %d AND COALESCE(parent_part_number, '') = COALESCE(%s, '')",
            $model,
            $level,
            $parent_part_number
        ));
        
        // 插入关系
        return $wpdb->insert(
            $this->table_prefix . 'accessory_relations',
            array(
                'model' => $model,
                'parent_part_number' => $parent_part_number,
                'child_part_number' => $child_part_number,
                'child_type' => $child_type,
                'level' => $level,
                'quantity' => $quantity,
                'menu_order' => ($max_order !== null ? $max_order + 1 : 0)
            ),
            array('%s', '%s', '%s', '%s', '%d', '%d', '%d')
        );
    }

    // 获取备件的所有必选备件
    public function get_spare_part_required_parts($spare_part_number) {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT 
                r.required_part_number,
                r.quantity,
                s.name_cn,
                s.name_en,
                s.package_size,
                s.package_weight,
                s.image_url
            FROM {$this->table_prefix}spare_part_required r
            JOIN {$this->table_prefix}spare_parts s ON r.required_part_number = s.part_number
            WHERE r.parent_part_number = %s
            ORDER BY r.menu_order ASC",
            $spare_part_number
        ));
    }

    // 添加备件的必选备件关系
    public function add_spare_part_required_part($spare_part_number, $required_part_number, $quantity = 1) {
        global $wpdb;
        
        // 验证备件存在
        $spare_part_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_prefix}spare_parts WHERE part_number = %s",
            $spare_part_number
        ));
        if (!$spare_part_exists) {
            return new WP_Error('invalid_spare_part', '备件不存在');
        }
        
        // 验证必选备件存在
        $required_part_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_prefix}spare_parts WHERE part_number = %s",
            $required_part_number
        ));
        if (!$required_part_exists) {
            return new WP_Error('invalid_required_part', '必选备件不存在');
        }
        
        // 获取最大排序值
        $max_order = $wpdb->get_var($wpdb->prepare(
            "SELECT MAX(menu_order) FROM {$this->table_prefix}spare_part_required 
            WHERE parent_part_number = %s",
            $spare_part_number
        ));
        
        // 插入关系
        return $wpdb->insert(
            $this->table_prefix . 'spare_part_required',
            array(
                'parent_part_number' => $spare_part_number,
                'required_part_number' => $required_part_number,
                'quantity' => $quantity,
                'menu_order' => ($max_order !== null ? $max_order + 1 : 0)
            ),
            array('%s', '%s', '%d', '%d')
        );
    }

    // 删除备件的必选备件关系
    public function delete_spare_part_required_part($spare_part_number, $required_part_number) {
        global $wpdb;
        return $wpdb->delete(
            $this->table_prefix . 'spare_part_required',
            array(
                'parent_part_number' => $spare_part_number,
                'required_part_number' => $required_part_number
            ),
            array('%s', '%s')
        );
    }

    // 获取备件及其所有必选备件（递归）
    public function get_spare_part_with_required_parts($spare_part_number) {
        global $wpdb;
        
        // 获取备件基本信息
        $spare_part = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_prefix}spare_parts WHERE part_number = %s",
            $spare_part_number
        ));
        
        if (!$spare_part) {
            return null;
        }
        
        // 获取直接必选备件
        $required_parts = $this->get_spare_part_required_parts($spare_part_number);
        
        // 递归获取必选备件的必选备件
        $all_required_parts = array();
        foreach ($required_parts as $part) {
            $part->required_parts = $this->get_spare_part_with_required_parts($part->required_part_number);
            $all_required_parts[] = $part;
        }
        
        $spare_part->required_parts = $all_required_parts;
        return $spare_part;
    }

    /**
     * Get accessories list
     */
    public function get_accessories($request) {
        $machine_id = $request->get_param('machine_id');
        $parent_id = $request->get_param('parent_id');
        $page = $request->get_param('page') ?: 1;
        $page_size = $request->get_param('page_size') ?: 10;
        $lang = $request->get_param('lang') ?: 'zh';
        $region = $request->get_param('region') ?: 'CN';

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_air_cushion_accessories';

        // 构建查询条件
        $where = array('status = "publish"');
        $params = array();

        if ($machine_id) {
            $where[] = 'id IN (SELECT accessory_id FROM ' . $wpdb->prefix . 'bjt_air_cushion_accessory_relations WHERE machine_id = %d)';
            $params[] = $machine_id;
        }

        if ($parent_id) {
            $where[] = 'parent_id = %d';
            $params[] = $parent_id;
        }

        // 获取总数
        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE " . implode(' AND ', $where),
            $params
        ));

        // 获取分页数据
        $offset = ($page - 1) * $page_size;
        $params[] = $page_size;
        $params[] = $offset;

        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                a.id,
                a.model,
                a.name_$lang as name,
                a.description_$lang as description,
                a.specifications_$lang as specifications,
                a.image_url,
                p.price as base_price,
                p.currency,
                i.quantity as available,
                i.reserved_quantity as reserved
            FROM $table_name a
            LEFT JOIN {$wpdb->prefix}bjt_prices p ON a.model = p.part_number AND p.region = %s
            LEFT JOIN {$wpdb->prefix}bjt_inventory i ON a.model = i.part_number AND i.warehouse = 'MAIN'
            WHERE " . implode(' AND ', $where) . "
            ORDER BY a.menu_order ASC
            LIMIT %d OFFSET %d",
            array_merge(array($region), $params)
        ));

        // 处理返回数据
        foreach ($items as &$item) {
            $item->specifications = json_decode($item->specifications);
            $item->price = array(
                'base' => (float)$item->base_price,
                'currency' => $item->currency
            );
            $item->inventory = array(
                'available' => (int)$item->available,
                'reserved' => (int)$item->reserved
            );
            unset($item->base_price, $item->currency, $item->available, $item->reserved);
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => array(
                'items' => $items,
                'total' => (int)$total,
                'page' => (int)$page,
                'page_size' => (int)$page_size
            )
        ));
    }

    /**
     * Get accessory detail
     */
    public function get_accessory($request) {
        $id = $request->get_param('id');
        $lang = $request->get_param('lang') ?: 'zh';
        $region = $request->get_param('region') ?: 'CN';

        global $wpdb;
        $table_name = $wpdb->prefix . 'bjt_air_cushion_accessories';

        $accessory = $wpdb->get_row($wpdb->prepare(
            "SELECT 
                a.id,
                a.model,
                a.name_$lang as name,
                a.description_$lang as description,
                a.specifications_$lang as specifications,
                a.image_url,
                p.price as base_price,
                p.currency,
                i.quantity as available,
                i.reserved_quantity as reserved,
                i.next_arrival
            FROM $table_name a
            LEFT JOIN {$wpdb->prefix}bjt_prices p ON a.model = p.part_number AND p.region = %s
            LEFT JOIN {$wpdb->prefix}bjt_inventory i ON a.model = i.part_number AND i.warehouse = 'MAIN'
            WHERE a.id = %d AND a.status = 'publish'",
            $region,
            $id
        ));

        if (!$accessory) {
            return new WP_Error(
                'rest_not_found',
                'Accessory not found.',
                array('status' => 404)
            );
        }

        // 处理规格
        $accessory->specifications = json_decode($accessory->specifications);

        // 处理价格
        $price_tiers = $wpdb->get_results($wpdb->prepare(
            "SELECT min_quantity, max_quantity, price
            FROM {$wpdb->prefix}bjt_prices
            WHERE part_number = %s AND region = %s
            ORDER BY min_quantity ASC",
            $accessory->model,
            $region
        ));

        $accessory->price = array(
            'base' => (float)$accessory->base_price,
            'currency' => $accessory->currency,
            'tiers' => $price_tiers
        );

        // 处理库存
        $accessory->inventory = array(
            'available' => (int)$accessory->available,
            'reserved' => (int)$accessory->reserved,
            'next_arrival' => $accessory->next_arrival
        );

        // 获取兼容的设备
        $compatible_machines = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                h.id,
                h.model,
                h.name_$lang as name
            FROM {$wpdb->prefix}bjt_hosts h
            JOIN {$wpdb->prefix}bjt_air_cushion_accessory_relations ar ON h.model = ar.machine_model
            WHERE ar.accessory_model = %s AND h.status = 'publish'
            ORDER BY h.menu_order ASC",
            $accessory->model
        ));

        $accessory->compatible_machines = $compatible_machines;

        // 获取必选配件
        $required_accessories = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                a.id,
                a.model,
                a.name_$lang as name,
                ar.quantity
            FROM {$wpdb->prefix}bjt_air_cushion_accessories a
            JOIN {$wpdb->prefix}bjt_air_cushion_accessory_relations ar ON a.model = ar.accessory_model
            WHERE ar.parent_model = %s AND ar.type = 'required' AND a.status = 'publish'
            ORDER BY ar.menu_order ASC",
            $accessory->model
        ));

        $accessory->required_accessories = $required_accessories;

        // 清理不需要的字段
        unset($accessory->base_price, $accessory->currency, $accessory->available, $accessory->reserved, $accessory->next_arrival);

        return rest_ensure_response(array(
            'success' => true,
            'data' => $accessory
        ));
    }

    // 其他管理方法将在后续添加
} 