-- Create WordPress database and user
CREATE DATABASE IF NOT EXISTS bjt_product;
-- CREATE USER IF NOT EXISTS 'wordpress'@'%' IDENTIFIED BY 'wordpress';
-- GRANT ALL PRIVILEGES ON bjt_product.* TO 'wordpress'@'%';
-- FLUSH PRIVILEGES;

USE bjt_product;

-- Set default character set
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

-- Product Lines Table
CREATE TABLE IF NOT EXISTS `wp_bjt_product_lines` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title_zh` varchar(255) NOT NULL COMMENT '中文标题',
  `title_en` varchar(255) NOT NULL COMMENT '英文标题',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `subitem1_zh` varchar(255) COMMENT '子项1中文',
  `subitem1_en` varchar(255) COMMENT '子项1英文',
  `subitem2_zh` varchar(255) COMMENT '子项2中文',
  `subitem2_en` varchar(255) COMMENT '子项2英文',
  `subitem3_zh` varchar(255) COMMENT '子项3中文',
  `subitem3_en` varchar(255) COMMENT '子项3英文',
  `image_url` varchar(255) COMMENT '图片URL',
  `code` varchar(50) NOT NULL COMMENT '产品线代码',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品线表';

-- Host Models Table
CREATE TABLE IF NOT EXISTS `wp_bjt_host_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '主机型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) COMMENT '主机类型',
  `image1_url` varchar(255) COMMENT '主图URL',
  `image2_url` varchar(255) COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) COMMENT '爆炸图PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`, `model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机型号表';

-- Accessory Models Table
CREATE TABLE IF NOT EXISTS `wp_bjt_accessory_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '配件型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) COMMENT '配件类型',
  `image1_url` varchar(255) COMMENT '主图URL',
  `image2_url` varchar(255) COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) COMMENT '爆炸图PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`, `model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件型号表';

-- Spare Models Table
CREATE TABLE IF NOT EXISTS `wp_bjt_spare_part_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '配件型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) COMMENT '配件类型',
  `image1_url` varchar(255) COMMENT '主图URL',
  `image2_url` varchar(255) COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) COMMENT '爆炸图PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`, `model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件型号表';


-- Parts Table
CREATE TABLE IF NOT EXISTS `wp_bjt_parts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `voltage` varchar(50) COMMENT '电压',
  `image_url` varchar(255) COMMENT '图片URL',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `brand` varchar(100) COMMENT '品牌',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `pallet_size_cm` varchar(100) COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet` int(11) COMMENT '一托数量',
  `pallet_height_cm` decimal(10,2) COMMENT '打托高度(cm)',
  `pallet_height_inch` decimal(10,2) COMMENT '打托高度(inch)',
  `pallet_gross_weight_kg` decimal(10,2) COMMENT '整托毛重(kg)',
  `pallet_gross_weight_lbs` decimal(10,2) COMMENT '整托毛重(lbs)',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机料号表';

-- Accessories Table
CREATE TABLE IF NOT EXISTS `wp_bjt_accessories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `brand` varchar(100) COMMENT '品牌',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `voltage` varchar(50) COMMENT '电压',
  `frequency` varchar(50) COMMENT '频率',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `pallet_size_cm` varchar(100) COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet` int(11) COMMENT '一托数量',
  `pallet_height_cm` decimal(10,2) COMMENT '打托高度(cm)',
  `pallet_height_inch` decimal(10,2) COMMENT '打托高度(inch)',
  `pallet_gross_weight_kg` decimal(10,2) COMMENT '整托毛重(kg)',
  `pallet_gross_weight_lbs` decimal(10,2) COMMENT '整托毛重(lbs)',
  `image_url` varchar(255) COMMENT '图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件料号表';

-- Consumables Table
CREATE TABLE IF NOT EXISTS `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `model_imperial` varchar(100) COMMENT '型号(英制)',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `brand` varchar(100) COMMENT '品牌',
  `app_model` varchar(255) COMMENT '适用机型',
  `bag_type` varchar(100) COMMENT '袋型',
  `material` varchar(100) COMMENT '材质',
  `thickness_met` decimal(10,2) COMMENT '厚度/克重(um/gsm)',
  `thickness_imp` decimal(10,2) COMMENT '厚度/克重(mil/#)',
  `width_met` decimal(10,2) COMMENT '膜宽(cm)',
  `width_imp` decimal(10,2) COMMENT '膜宽(inch)',
  `length_met` decimal(10,2) COMMENT '袋长(cm)',
  `length_imp` decimal(10,2) COMMENT '袋长(inch)',
  `bubble_diameter_met` decimal(10,2) COMMENT '泡径(cm)',
  `bubble_diameter_imp` decimal(10,2) COMMENT '泡径(inch)',
  `total_length_met` decimal(10,2) COMMENT '总长(m)',
  `total_length_imp` decimal(10,2) COMMENT '总长(ft)',
  `package_type` varchar(100) COMMENT '包装方式',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `image_url` varchar(255) COMMENT '产品图片(袋型实物)',
  `package_image_url` varchar(255) COMMENT '包装实物图片',
  `pallet_size_cm` varchar(100) COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet_a` int(11) COMMENT '一托卷数A',
  `pallet_gross_weight_a_kg` decimal(10,2) COMMENT '整托毛重A(kg)',
  `pallet_gross_weight_a_lbs` decimal(10,2) COMMENT '整托毛重A(lbs)',
  `pallet_height_a_cm` decimal(10,2) COMMENT '打托高度A(cm)',
  `pallet_height_a_inch` decimal(10,2) COMMENT '打托高度A(inch)',
  `pcs_per_pallet_b` int(11) COMMENT '一托卷数B',
  `pallet_gross_weight_b_kg` decimal(10,2) COMMENT '整托毛重B(kg)',
  `pallet_gross_weight_b_lbs` decimal(10,2) COMMENT '整托毛重B(lbs)',
  `pallet_height_b_cm` decimal(10,2) COMMENT '打托高度B(cm)',
  `pallet_height_b_inch` decimal(10,2) COMMENT '打托高度B(inch)',
  `pcs_per_pallet_c` int(11) COMMENT '一托卷数C',
  `pallet_gross_weight_c_kg` decimal(10,2) COMMENT '整托毛重C(kg)',
  `pallet_gross_weight_c_lbs` decimal(10,2) COMMENT '整托毛重C(lbs)',
  `pallet_height_c_cm` decimal(10,2) COMMENT '打托高度C(cm)',
  `pallet_height_c_inch` decimal(10,2) COMMENT '打托高度C(inch)',
  `tube_inner_diameter_cm` decimal(10,2) COMMENT '纸筒内径(cm)',
  `tube_inner_diameter_inch` decimal(10,2) COMMENT '纸筒内径(inch)',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'roll' COMMENT '单位：pcs/roll/box',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材表';

-- Spare Parts Table
CREATE TABLE IF NOT EXISTS `wp_bjt_spare_parts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `app_model` varchar(255) COMMENT '适配机型',
  `model` varchar(100) NOT NULL COMMENT '配件型号',
  `is_consumable` tinyint(1) DEFAULT 0 COMMENT '是否易损',
  `image_url` varchar(255) COMMENT '产品图片',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) COMMENT '规格参数(英制)',
  `app_sn` varchar(255) COMMENT '适配序列号',
  `package_size_cm` varchar(100) COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) COMMENT '包装毛重(lbs)',
  `pcs_per_box` int(11) COMMENT '单箱数量',
  `required_parts` text COMMENT '必选备件料号，多个用逗号分隔',
  `required_quantity` text COMMENT '必选备件数量，多个用逗号分隔，与必选备件料号一一对应',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`, `part_number`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件料号表';

-- Relations Table
CREATE TABLE IF NOT EXISTS `wp_bjt_relations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `parent_part_number` varchar(100) NOT NULL COMMENT '父项料号',
  `child_part_number` varchar(100) NOT NULL COMMENT '子项料号',
  `child_type` ENUM('accessory', 'spare_part') NOT NULL COMMENT '子项类型：配件/备件',
  `level` int(11) NOT NULL DEFAULT 1 COMMENT '层级(1-5)，备件固定为1',
  `quantity` int(11) DEFAULT 1 COMMENT '数量',
  `required_parts` varchar(100) DEFAULT NULL COMMENT '必选备件料号，多个用逗号分隔',
  `required_quantity` int(11) DEFAULT 1 COMMENT '必选备件数量',
  `sort_order` int(11) DEFAULT 0 COMMENT '同级排序',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_relation` (`product_line_id`, `parent_part_number`, `child_part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_parent_part_number` (`parent_part_number`),
  KEY `idx_child_part_number` (`child_part_number`),
  KEY `idx_required_parts` (`required_parts`),
  KEY `idx_child_type` (`child_type`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关联关系表';

-- Prices Table
CREATE TABLE IF NOT EXISTS `wp_bjt_prices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
  `target_id` bigint(20) NOT NULL COMMENT '目标ID',
  `region` varchar(10) NOT NULL COMMENT '区域代码',
  `currency` varchar(10) NOT NULL COMMENT '货币代码',
  `base_price` decimal(10,2) NOT NULL COMMENT '基础价格',
  `min_quantity` int(11) NOT NULL DEFAULT '1' COMMENT '最小数量',
  `max_quantity` int(11) DEFAULT NULL COMMENT '最大数量',
  `discount_rate` decimal(5,4) DEFAULT NULL COMMENT '折扣率',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_target_region_quantity` (`product_line_id`, `target_type`, `target_id`, `region`, `min_quantity`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格表';

-- Inventory Table
CREATE TABLE IF NOT EXISTS `wp_bjt_inventory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
  `target_id` bigint(20) NOT NULL COMMENT '目标ID',
  `region` varchar(10) NOT NULL COMMENT '区域代码',
  `warehouse` varchar(50) NOT NULL COMMENT '仓库代码',
  `quantity` int(11) NOT NULL DEFAULT '0' COMMENT '库存数量',
  `reserved` int(11) NOT NULL DEFAULT '0' COMMENT '预留数量',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_target_region_warehouse` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';

-- Shapes Table
CREATE TABLE IF NOT EXISTS `wp_bjt_shapes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `code` varchar(50) NOT NULL COMMENT '形状缩写代码',
  `name_zh` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `image_url` varchar(255) COMMENT '形状图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材形状表';

-- Materials Table
CREATE TABLE IF NOT EXISTS `wp_bjt_materials` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `code` varchar(50) NOT NULL COMMENT '材料缩写代码',
  `name_zh` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `base_material` varchar(100) COMMENT '基材',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材材料表';

-- Specifications Table
CREATE TABLE IF NOT EXISTS `wp_bjt_specifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `spec_type` ENUM('thickness', 'weight', 'width', 'length') NOT NULL COMMENT '规格类型',
  `metric_value` decimal(10,2) NOT NULL COMMENT '公制数值',
  `metric_unit` varchar(20) NOT NULL COMMENT '公制单位',
  `imperial_value` decimal(10,2) NOT NULL COMMENT '英制数值',
  `imperial_unit` varchar(20) NOT NULL COMMENT '英制单位',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_spec` (`product_line_id`, `spec_type`, `metric_value`, `metric_unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材规格尺寸表';

-- Consumable Compatibility Table
CREATE TABLE IF NOT EXISTS `wp_bjt_consumable_compatibility` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `consumable_part_number` varchar(100) NOT NULL COMMENT '耗材料号',
  `host_model` varchar(100) NOT NULL COMMENT '适用主机型号',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_compatibility` (`product_line_id`, `consumable_part_number`, `host_model`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_consumable_part_number` (`consumable_part_number`),
  KEY `idx_host_model` (`host_model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材主机适配表';

-- 用户表（wp_bjt_users）
CREATE TABLE IF NOT EXISTS `wp_bjt_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `preferred_unit` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单表（wp_bjt_orders）
CREATE TABLE IF NOT EXISTS `wp_bjt_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wp_bjt_orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wp_bjt_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 日志表
CREATE TABLE IF NOT EXISTS `wp_bjt_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `details` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单明细表（wp_bjt_order_items）
CREATE TABLE IF NOT EXISTS `wp_bjt_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_line_id` int(11) NOT NULL,
  `target_type` varchar(50) NOT NULL,
  `target_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `wp_bjt_cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT 'WordPress User ID',
  `product_type` varchar(50) NOT NULL COMMENT 'Type: host, accessory, consumable, spare_part',
  `product_id` bigint NOT NULL COMMENT 'ID from the corresponding product table (e.g., wp_bjt_parts, wp_bjt_accessories etc.)',
  `part_number` varchar(100) NOT NULL COMMENT 'Specific part number added',
  `quantity` int unsigned NOT NULL DEFAULT 1,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `part_number`) -- Ensure unique part number per user cart
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='BJT User Cart Items';
