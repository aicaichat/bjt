# BJT 产品管理系统数据库设计文档

## 一、数据库概述

### 1.1 设计原则
- 遵循 WordPress 数据库设计规范
- 使用 UTF8MB4 字符集
- 所有表名使用 `wp_bjt_` 前缀
- 所有表必须包含基础字段（id, status, created_at, updated_at）
- 所有外键关系必须建立索引

### 1.2 基础字段规范
```sql
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`status` varchar(20) NOT NULL DEFAULT 'publish',
`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

## 二、表结构设计

### 2.1 产品线表 (wp_bjt_product_lines)
```sql
CREATE TABLE `wp_bjt_product_lines` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title_cn` varchar(255) NOT NULL COMMENT '中文标题',
  `title_en` varchar(255) NOT NULL COMMENT '英文标题',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `subitem1_cn` varchar(255) COMMENT '子项1中文',
  `subitem1_en` varchar(255) COMMENT '子项1英文',
  `subitem2_cn` varchar(255) COMMENT '子项2中文',
  `subitem2_en` varchar(255) COMMENT '子项2英文',
  `subitem3_cn` varchar(255) COMMENT '子项3中文',
  `subitem3_en` varchar(255) COMMENT '子项3英文',
  `image_url` varchar(255) COMMENT '图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品线表';
```

### 2.2 产品型号及关系表

#### 2.2.1 主机型号表 (wp_bjt_host_models)
```sql
CREATE TABLE `wp_bjt_host_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识(air_cushion/paper_machine/tape_machine/air_column)',
  `model` varchar(100) NOT NULL COMMENT '主机型号编码',
  `title_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` text COMMENT '主机类型',
  `image1_url` varchar(255) COMMENT '主图URL',
  `image2_url` varchar(255) COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) COMMENT '爆炸图PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line`, `model`),
  KEY `idx_product_line` (`product_line`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机型号表';
```

#### 2.2.2 配件型号表 (wp_bjt_accessory_models)
```sql
CREATE TABLE `wp_bjt_accessory_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `model` varchar(100) NOT NULL COMMENT '配件型号编码',
  `title_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` text COMMENT '配件类型',
  `image1_url` varchar(255) COMMENT '主图URL',
  `image2_url` varchar(255) COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) COMMENT '爆炸图PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line`, `model`),
  KEY `idx_product_line` (`product_line`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件型号表';
```

#### 2.2.3 主机料号表 (wp_bjt_parts)
```sql
CREATE TABLE `wp_bjt_parts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `voltage` varchar(50) COMMENT '电压',
  `image_url` varchar(255) COMMENT '图片URL',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line`, `part_number`),
  KEY `idx_product_line` (`product_line`),
  KEY `idx_model` (`product_line`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机料号表';
```

#### 2.2.4 配件料号表 (wp_bjt_accessories)
```sql
CREATE TABLE `wp_bjt_accessories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `brand` varchar(100) COMMENT '品牌',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line`, `part_number`),
  KEY `idx_product_line` (`product_line`),
  KEY `idx_model` (`product_line`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件料号表';
```

#### 2.2.5 耗材表 (wp_bjt_consumables)
```sql
CREATE TABLE `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line`, `part_number`),
  KEY `idx_product_line` (`product_line`),
  KEY `idx_model` (`product_line`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材表';
```

#### 2.2.6 备件料号表 (wp_bjt_spare_parts)
```sql
CREATE TABLE `wp_bjt_spare_parts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `app_model` varchar(255) COMMENT '适配机型',
  `is_consumable` tinyint(1) DEFAULT 0 COMMENT '是否易损',
  `image_url` varchar(255) COMMENT '产品图片',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line`, `part_number`),
  KEY `idx_product_line` (`product_line`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件料号表';
```

#### 2.2.7 关联关系表 (wp_bjt_relations)
```sql
CREATE TABLE `wp_bjt_relations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `parent_part_number` varchar(100) NOT NULL COMMENT '父项料号',
  `child_part_number` varchar(100) NOT NULL COMMENT '子项料号',
  `child_type` ENUM('accessory', 'spare_part') NOT NULL COMMENT '子项类型：配件/备件',
  `level` int(11) NOT NULL DEFAULT 1 COMMENT '层级(1-5)，备件固定为1',
  `quantity` int(11) DEFAULT 1 COMMENT '数量',
  `required_part_number` varchar(100) DEFAULT NULL COMMENT '必选备件料号',
  `required_quantity` int(11) DEFAULT 1 COMMENT '必选备件数量',
  `menu_order` int(11) DEFAULT 0 COMMENT '同级排序',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_relation` (`product_line`, `parent_part_number`, `child_part_number`),
  KEY `idx_product_line` (`product_line`),
  KEY `idx_parent_part_number` (`parent_part_number`),
  KEY `idx_child_part_number` (`child_part_number`),
  KEY `idx_required_part_number` (`required_part_number`),
  KEY `idx_child_type` (`child_type`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关联关系表';
```

### 2.3 价格表 (wp_bjt_prices)
```sql
CREATE TABLE `wp_bjt_prices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
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
  UNIQUE KEY `uk_target_region_quantity` (`product_line`, `target_type`, `target_id`, `region`, `min_quantity`),
  KEY `idx_product_line` (`product_line`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格表';
```

### 2.4 库存表 (wp_bjt_inventory)
```sql
CREATE TABLE `wp_bjt_inventory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
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
  UNIQUE KEY `uk_target_region_warehouse` (`product_line`, `target_type`, `target_id`, `region`, `warehouse`),
  KEY `idx_product_line` (`product_line`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';
```

### 2.5 耗材基础数据表

#### 2.5.1 形状表 (wp_bjt_shapes)
```sql
CREATE TABLE `wp_bjt_shapes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `code` varchar(50) NOT NULL COMMENT '形状缩写代码',
  `name_cn` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `image_url` varchar(255) COMMENT '形状图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材形状表';
```

#### 2.5.2 材料表 (wp_bjt_materials)
```sql
CREATE TABLE `wp_bjt_materials` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `code` varchar(50) NOT NULL COMMENT '材料缩写代码',
  `name_cn` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `base_material` varchar(100) COMMENT '基材',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材材料表';
```

#### 2.5.3 规格尺寸表 (wp_bjt_specifications)
```sql
CREATE TABLE `wp_bjt_specifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `spec_type` ENUM('thickness', 'weight', 'width', 'length') NOT NULL COMMENT '规格类型',
  `metric_value` decimal(10,2) NOT NULL COMMENT '公制数值',
  `metric_unit` varchar(20) NOT NULL COMMENT '公制单位',
  `imperial_value` decimal(10,2) NOT NULL COMMENT '英制数值',
  `imperial_unit` varchar(20) NOT NULL COMMENT '英制单位',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_spec` (`product_line`, `spec_type`, `metric_value`, `metric_unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材规格尺寸表';
```

#### 2.5.4 耗材主机适配表 (wp_bjt_consumable_compatibility)
```sql
CREATE TABLE `wp_bjt_consumable_compatibility` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line` varchar(50) NOT NULL COMMENT '产品线标识',
  `consumable_part_number` varchar(100) NOT NULL COMMENT '耗材料号',
  `host_model` varchar(100) NOT NULL COMMENT '适用主机型号',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_compatibility` (`product_line`, `consumable_part_number`, `host_model`),
  KEY `idx_product_line` (`product_line`),
  KEY `idx_consumable_part_number` (`consumable_part_number`),
  KEY `idx_host_model` (`host_model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材主机适配表';
```

## 三、数据关系

### 3.1 主要关系
1. 所有表都包含 product_line 字段，用于区分不同产品线的数据
2. 价格和库存通过统一的表进行管理，使用 target_type 和 target_id 关联具体产品
3. 关联关系表统一维护产品之间的层级关系，包括：
   - 主机与配件的关系
   - 配件与子配件的关系
   - 配件与备件的关系
   - 主机配件组合与其必选备件的关系
4. 备件表中的必选备件字段（required_parts和required_quantity）用于指定选择该备件时需要默认增加的其他备件
5. 耗材管理通过基础数据表（形状、材料、规格尺寸）来维护耗材的标准化数据
6. 耗材主机适配表维护耗材与主机型号之间的兼容关系

### 3.2 产品线类型
产品线标识（product_line）包括：
- air_cushion: 气垫机
- paper_machine: 纸机
- tape_machine: 胶带机
- air_column: 气柱袋

## 四、索引设计

### 4.1 主键索引
- 所有表都使用自增ID作为主键
- 主键索引命名规则：PRIMARY KEY

### 4.2 唯一索引
- 料号：uk_part_number
- 型号：uk_model
- 价格表组合键：uk_target_region_quantity
- 库存表组合键：uk_target_region_warehouse

### 4.3 普通索引
- 状态字段：idx_status
- 排序字段：idx_menu_order

## 五、数据维护

### 5.1 数据备份
```sql
-- 备份整个数据库
mysqldump -u [username] -p [database_name] > backup.sql

-- 备份特定表
mysqldump -u [username] -p [database_name] wp_bjt_product_lines > product_lines_backup.sql
```

### 5.2 数据恢复
```sql
-- 恢复整个数据库
mysql -u [username] -p [database_name] < backup.sql

-- 恢复特定表
mysql -u [username] -p [database_name] < product_lines_backup.sql
```

### 5.3 数据清理
```sql
-- 清理过期数据
DELETE FROM wp_bjt_prices WHERE status = 'inactive' AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 清理测试数据
DELETE FROM wp_bjt_inventory WHERE warehouse LIKE 'TEST_%';
```

## 六、性能优化

### 6.1 查询优化
1. 使用适当的索引
2. 避免使用 SELECT *
3. 使用 EXPLAIN 分析查询
4. 限制 JOIN 表的数量

### 6.2 数据优化
1. 使用适当的字段类型
2. 对大字段使用 TEXT 类型
3. 使用 JSON 类型存储复杂数据
4. 定期优化表结构

## 七、安全措施

### 7.1 数据验证
1. 所有输入数据必须验证
2. 使用预处理语句
3. 转义特殊字符
4. 验证外键关系

### 7.2 权限控制
1. 使用最小权限原则
2. 定期更新数据库密码
3. 限制远程访问
4. 记录关键操作日志 




基于init.sql中的数据库表结构，我对系统的理解如下：

### 主要表结构及关系

1. **产品线（wp_bjt_product_lines）**
   - 核心表，所有产品都归属于特定产品线
   - 通过`product_line_id`字段与其他表关联
   - 包含中英文标题、描述等基本信息

2. **型号表系列**
   - `wp_bjt_host_models`（主机型号）
   - `wp_bjt_accessory_models`（配件型号）
   - `wp_bjt_spare_part_models`（备件型号）
   - 这些表存储产品的"类型"信息，通过`product_line_id`和`model`字段建立关联

3. **实例表系列**
   - `wp_bjt_parts`（主机料号）
   - `wp_bjt_accessories`（配件料号）
   - `wp_bjt_consumables`（耗材）
   - `wp_bjt_spare_parts`（备件料号）
   - 这些表存储具体的产品实例，通过`product_line_id`和`model`字段与型号表关联

4. **关系表（wp_bjt_relations）**
   - 定义产品间的层级和关系
   - 使用`parent_part_number`和`child_part_number`建立上下级关系
   - 记录层级、数量和必选备件等信息

5. **价格表（wp_bjt_prices）**
   - 存储所有类型产品的价格
   - 使用`target_type`（如'host'/'accessory'/'consumable'）和`target_id`指向具体产品
   - 按区域（`region`）、数量范围（`min_quantity`/`max_quantity`）设置不同价格

6. **库存表（wp_bjt_inventory）**
   - 存储所有类型产品的库存
   - 同样使用`target_type`和`target_id`指向具体产品
   - 按区域和仓库记录库存和预留数量

### 耗材特有表

1. **耗材形状表（wp_bjt_shapes）**
2. **耗材材料表（wp_bjt_materials）**
3. **耗材规格表（wp_bjt_specifications）**
4. **耗材主机适配表（wp_bjt_consumable_compatibility）**
   - 这些表提供耗材的附加属性和兼容性信息

### 关键关系

- 所有实体通过`product_line_id`关联到产品线
- 产品型号与具体实例通过`model`字段关联
- 产品间的层级关系通过`wp_bjt_relations`表维护
- 价格和库存通过`target_type`和`target_id`字段关联到具体产品
- 备件与主机的兼容性通过`app_model`字段或专用的兼容性表表示

在实现API时，特别是批量价格和库存查询，需要注意跨表联合查询，确保返回完整且符合预期格式的数据。同时，需要根据`model`和`part_number`的区别准确处理请求和响应。
