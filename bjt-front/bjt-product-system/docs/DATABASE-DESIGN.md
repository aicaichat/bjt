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
  `code` varchar(50) NOT NULL COMMENT '产品线代码',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish' COMMENT '状态',
  `menu_order` int(11) DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`),
  KEY `idx_menu_order` (`menu_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品线表';
```

### 2.2 主机型号表 (wp_bjt_host_models)
```sql
CREATE TABLE `wp_bjt_host_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `specifications` json DEFAULT NULL COMMENT '规格参数',
  `voltage_options` json DEFAULT NULL COMMENT '电压选项',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`model`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_host_product_line` FOREIGN KEY (`product_line_id`) REFERENCES `wp_bjt_product_lines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主机型号表';
```

### 2.3 配件型号表 (wp_bjt_accessory_models)
```sql
CREATE TABLE `wp_bjt_accessory_models` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `model` varchar(100) NOT NULL COMMENT '型号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `specifications` json DEFAULT NULL COMMENT '规格参数',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '父级配件ID',
  `level` int(11) NOT NULL DEFAULT '1' COMMENT '层级',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`model`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_accessory_parent` FOREIGN KEY (`parent_id`) REFERENCES `wp_bjt_accessory_models` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配件型号表';
```

### 2.4 耗材表 (wp_bjt_consumables)
```sql
CREATE TABLE `wp_bjt_consumables` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint(20) NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `name_cn` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_cn` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `specifications` json DEFAULT NULL COMMENT '规格参数',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `compatible_models` json DEFAULT NULL COMMENT '兼容型号',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `menu_order` int(11) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`model`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_consumable_product_line` FOREIGN KEY (`product_line_id`) REFERENCES `wp_bjt_product_lines` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材表';
```

### 2.5 价格表 (wp_bjt_prices)
```sql
CREATE TABLE `wp_bjt_prices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
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
  UNIQUE KEY `uk_target_region_quantity` (`target_type`,`target_id`,`region`,`min_quantity`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格表';
```

### 2.6 库存表 (wp_bjt_inventory)
```sql
CREATE TABLE `wp_bjt_inventory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
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
  UNIQUE KEY `uk_target_region_warehouse` (`target_type`,`target_id`,`region`,`warehouse`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表';
```

### 2.7 必选备件表 (wp_bjt_required_accessories)
```sql
CREATE TABLE `wp_bjt_required_accessories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `accessory_id` bigint(20) NOT NULL COMMENT '配件ID',
  `required_accessory_id` bigint(20) NOT NULL COMMENT '必选备件ID',
  `quantity` int(11) NOT NULL DEFAULT '1' COMMENT '必选数量',
  `description` varchar(255) DEFAULT NULL COMMENT '说明',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_accessory_required` (`accessory_id`,`required_accessory_id`),
  KEY `idx_required_accessory_id` (`required_accessory_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_required_accessory` FOREIGN KEY (`accessory_id`) REFERENCES `wp_bjt_accessory_models` (`id`),
  CONSTRAINT `fk_required_required` FOREIGN KEY (`required_accessory_id`) REFERENCES `wp_bjt_accessory_models` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='必选备件表';
```

## 三、数据关系

### 3.1 主要关系
1. 产品线 -> 主机型号：一对多
2. 产品线 -> 耗材：一对多
3. 配件型号 -> 配件型号：自引用（树形结构）
4. 配件型号 -> 必选备件：多对多

### 3.2 价格和库存
1. 所有产品（主机、配件、耗材）都关联价格表
2. 所有产品都关联库存表
3. 价格和库存按区域、仓库独立管理

## 四、索引设计

### 4.1 主键索引
- 所有表都使用自增ID作为主键
- 主键索引命名规则：PRIMARY KEY

### 4.2 唯一索引
- 产品线代码：uk_code
- 型号：uk_model
- 价格表组合键：uk_target_region_quantity
- 库存表组合键：uk_target_region_warehouse

### 4.3 外键索引
- 产品线关联：idx_product_line_id
- 配件父级关联：idx_parent_id
- 必选备件关联：idx_required_accessory_id

### 4.4 普通索引
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