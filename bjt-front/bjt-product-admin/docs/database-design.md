# 气垫机产品管理系统数据库设计文档

## 1. 数据库概述

本系统使用WordPress数据库，所有表都使用`wp_bjt_air_cushion_`作为前缀。系统主要管理气垫机产品线、型号、配件、耗材和备件等信息，以及它们之间的关联关系。

## 2. 数据表设计

### 2.1 产品线表 (lines)
存储气垫机产品线的基本信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| title_cn | varchar(255) | 中文标题 | NOT NULL |
| title_en | varchar(255) | 英文标题 | NOT NULL |
| description_cn | text | 中文描述 | |
| description_en | text | 英文描述 | |
| subitem1_cn | varchar(255) | 子项1中文 | |
| subitem1_en | varchar(255) | 子项1英文 | |
| subitem2_cn | varchar(255) | 子项2中文 | |
| subitem2_en | varchar(255) | 子项2英文 | |
| subitem3_cn | varchar(255) | 子项3中文 | |
| subitem3_en | varchar(255) | 子项3英文 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| menu_order | int(11) | 菜单顺序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.2 主机型号表 (host_models)
存储气垫机主机型号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 主机型号编码 | NOT NULL, UNIQUE |
| title_cn | varchar(255) | 中文名称 | NOT NULL |
| title_en | varchar(255) | 英文名称 | NOT NULL |
| description_cn | text | 中文描述 | |
| description_en | text | 英文描述 | |
| specifications_cn | text | 中文规格 | |
| specifications_en | text | 英文规格 | |
| features_cn | text | 中文特点 | |
| features_en | text | 英文特点 | |
| image1_url | varchar(255) | 主图URL | |
| image2_url | varchar(255) | 副图URL | |
| explosion_diagram_pdf | varchar(255) | 爆炸图PDF文件URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| menu_order | int(11) | 菜单顺序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.3 配件型号表 (accessory_models)
存储气垫机配件型号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 配件型号编码 | NOT NULL, UNIQUE |
| title_cn | varchar(255) | 中文名称 | NOT NULL |
| title_en | varchar(255) | 英文名称 | NOT NULL |
| description_cn | text | 中文描述 | |
| description_en | text | 英文描述 | |
| specifications_cn | text | 中文规格 | |
| specifications_en | text | 英文规格 | |
| features_cn | text | 中文特点 | |
| features_en | text | 英文特点 | |
| image1_url | varchar(255) | 主图URL | |
| image2_url | varchar(255) | 副图URL | |
| explosion_diagram_pdf | varchar(255) | 爆炸图PDF文件URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| menu_order | int(11) | 菜单顺序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.4 备件型号表 (spare_part_models)
存储气垫机备件型号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 备件型号编码 | NOT NULL, UNIQUE |
| title_cn | varchar(255) | 中文名称 | NOT NULL |
| title_en | varchar(255) | 英文名称 | NOT NULL |
| description_cn | text | 中文描述 | |
| description_en | text | 英文描述 | |
| specifications_cn | text | 中文规格 | |
| specifications_en | text | 英文规格 | |
| features_cn | text | 中文特点 | |
| features_en | text | 英文特点 | |
| image1_url | varchar(255) | 主图URL | |
| image2_url | varchar(255) | 副图URL | |
| explosion_diagram_pdf | varchar(255) | 爆炸图PDF文件URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| menu_order | int(11) | 菜单顺序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.5 料号表 (parts)
存储气垫机料号信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| package_size | varchar(100) | 包装尺寸 | |
| package_weight | decimal(10,2) | 包装重量 | |
| pallet_size | varchar(100) | 托盘尺寸 | |
| pcs_per_pallet_1 | int(11) | 每托盘数量1 | |
| pallet_height_1 | decimal(10,2) | 托盘高度1 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.6 配件料号表 (accessories)
存储气垫机配件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| voltage | varchar(50) | 电压 | |
| frequency | varchar(50) | 频率 | |
| package_size | varchar(100) | 包装尺寸 | |
| package_weight | decimal(10,2) | 包装重量 | |
| pallet_size | varchar(100) | 托盘尺寸 | |
| pcs_per_pallet_1 | int(11) | 每托盘数量1 | |
| pallet_height_1 | decimal(10,2) | 托盘高度1 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.7 耗材料号表 (consumables)
存储气垫机耗材信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 型号 | NOT NULL |
| brand | varchar(100) | 品牌 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| package_size | varchar(100) | 包装尺寸 | |
| package_weight | decimal(10,2) | 包装重量 | |
| pallet_size | varchar(100) | 托盘尺寸 | |
| pcs_per_pallet_1 | int(11) | 每托盘数量1 | |
| pallet_height_1 | decimal(10,2) | 托盘高度1 | |
| pcs_per_pallet_2 | int(11) | 每托盘数量2 | |
| pallet_height_2 | decimal(10,2) | 托盘高度2 | |
| pcs_per_pallet_3 | int(11) | 每托盘数量3 | |
| pallet_height_3 | decimal(10,2) | 托盘高度3 | |
| app_model | varchar(255) | 适用型号 | |
| pak_shape | varchar(100) | 包装形状 | |
| material | varchar(100) | 材料 | |
| thickness_met | decimal(10,2) | 厚度(公制) | |
| thickness_imp | decimal(10,2) | 厚度(英制) | |
| gram_met | decimal(10,2) | 克重(公制) | |
| gram_imp | decimal(10,2) | 克重(英制) | |
| pcs_width_met | decimal(10,2) | 宽度(公制) | |
| pcs_width_imp | decimal(10,2) | 宽度(英制) | |
| pcs_length_met | decimal(10,2) | 长度(公制) | |
| pcs_length_imp | decimal(10,2) | 长度(英制) | |
| total_length_met | decimal(10,2) | 总长度(公制) | |
| total_length_imp | decimal(10,2) | 总长度(英制) | |
| inner_diameter | decimal(10,2) | 内径 | |
| roll_diameter | decimal(10,2) | 卷径 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.8 备件料号表 (spare_parts)
存储气垫机备件信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| consumable | varchar(100) | 耗材 | |
| part_number | varchar(100) | 料号 | NOT NULL, UNIQUE |
| name_cn | varchar(255) | 中文名称 | NOT NULL |
| name_en | varchar(255) | 英文名称 | NOT NULL |
| package_size | varchar(100) | 包装尺寸 | |
| package_weight | decimal(10,2) | 包装重量 | |
| app_model | varchar(255) | 适用型号 | |
| app_sn | varchar(255) | 适用序列号 | |
| image_url | varchar(255) | 图片URL | |
| status | varchar(20) | 状态 | DEFAULT 'publish' |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.9 备件必选备件表 (spare_part_required)
存储备件之间的必选关系。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| parent_part_number | varchar(100) | 父备件料号 | NOT NULL, FOREIGN KEY REFERENCES spare_parts(part_number) ON DELETE CASCADE |
| required_part_number | varchar(100) | 必选备件料号 | NOT NULL, FOREIGN KEY REFERENCES spare_parts(part_number) ON DELETE CASCADE |
| quantity | int(11) | 必选数量 | NOT NULL, DEFAULT 1 |
| menu_order | int(11) | 排序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

索引设计：
- PRIMARY KEY (id)
- UNIQUE KEY unique_required_part (parent_part_number, required_part_number)
- KEY parent_part_number (parent_part_number)
- KEY required_part_number (required_part_number)

### 2.10 主机配件必选备件表 (host_accessory_required)
存储主机配件与备件之间的必选关系。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| model | varchar(100) | 主机型号 | NOT NULL, FOREIGN KEY |
| accessory_part_number | varchar(100) | 配件料号 | NOT NULL, FOREIGN KEY |
| required_part_number | varchar(100) | 必选备件料号 | NOT NULL, FOREIGN KEY |
| quantity | int(11) | 必选数量 | NOT NULL, DEFAULT 1 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### 2.11 关联关系表 (relations)
存储产品线、型号、料号之间的多对多关系。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | bigint(20) | 主键ID | PRIMARY KEY, AUTO_INCREMENT |
| parent_type | varchar(50) | 父级类型 | NOT NULL, ENUM('line', 'host_model', 'accessory_model', 'spare_part_model') |
| parent_id | bigint(20) | 父级ID | NOT NULL |
| child_type | varchar(50) | 子级类型 | NOT NULL, ENUM('host_model', 'accessory_model', 'spare_part_model', 'part', 'accessory', 'consumable', 'spare_part') |
| child_id | bigint(20) | 子级ID | NOT NULL |
| menu_order | int(11) | 菜单顺序 | DEFAULT 0 |
| created_at | datetime | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | datetime | 更新时间 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## 3. 表关系说明

1. 产品线表 (lines) 与主机型号表 (host_models) 通过关联关系表 (relations) 建立多对多关系
   - parent_type = 'line', child_type = 'host_model'
   - 一个产品线可以包含多个主机型号
   - 一个主机型号可以属于多个产品线

2. 主机型号表 (host_models) 与配件型号表 (accessory_models) 通过关联关系表 (relations) 建立多对多关系
   - parent_type = 'host_model', child_type = 'accessory_model'
   - 一个主机型号可以包含多个配件型号
   - 一个配件型号可以属于多个主机型号

3. 主机型号表 (host_models) 与备件型号表 (spare_part_models) 通过关联关系表 (relations) 建立多对多关系
   - parent_type = 'host_model', child_type = 'spare_part_model'
   - 一个主机型号可以包含多个备件型号
   - 一个备件型号可以属于多个主机型号

4. 配件型号表 (accessory_models) 与配件表 (accessories) 通过关联关系表 (relations) 建立多对多关系
   - parent_type = 'accessory_model', child_type = 'accessory'
   - 一个配件型号可以包含多个配件
   - 一个配件可以属于多个配件型号

5. 备件型号表 (spare_part_models) 与备件表 (spare_parts) 通过关联关系表 (relations) 建立多对多关系
   - parent_type = 'spare_part_model', child_type = 'spare_part'
   - 一个备件型号可以包含多个备件
   - 一个备件可以属于多个备件型号

6. 备件必选备件表 (spare_part_required) 与备件表 (spare_parts) 建立自引用关系
   - 通过 parent_part_number 和 required_part_number 字段关联
   - 一个备件可以有多个必选备件
   - 一个备件可以是多个其他备件的必选备件
   - 支持递归获取所有必选备件

7. 主机配件必选备件表 (host_accessory_required) 与主机型号表 (host_models)、配件表 (accessories) 和备件表 (spare_parts) 建立多对多关系
   - 通过 model, accessory_part_number 和 required_part_number 字段关联
   - 一个主机型号的配件可以有多个必选备件
   - 一个备件可以是多个主机型号配件的必选备件

## 4. 索引设计

1. 所有表的主键都使用自增ID
2. 所有型号编码字段都建立唯一索引
3. 所有外键字段都建立普通索引
4. 状态字段在需要筛选的表中建立普通索引
5. 关联关系表建立复合索引：
   - (parent_type, parent_id)
   - (child_type, child_id)
   - (parent_type, parent_id, child_type, child_id) UNIQUE
6. 备件必选备件表建立复合索引：
   - (parent_part_number, required_part_number) UNIQUE
   - (parent_part_number)
   - (required_part_number)
7. 主机配件必选备件表建立复合索引：
   - (model, accessory_part_number, required_part_number) UNIQUE
   - (model)
   - (accessory_part_number)
   - (required_part_number)

## 5. 数据完整性

1. 使用外键约束确保关联数据的完整性
2. 使用级联删除确保关联数据的一致性
3. 使用默认值确保必要字段的非空性
4. 使用唯一约束确保关键字段的唯一性

## 6. 性能优化

1. 合理使用索引提高查询效率
2. 使用适当的字段类型减少存储空间
3. 使用适当的字段长度减少存储空间
4. 使用适当的字符集和排序规则提高查询效率

## 7. 安全考虑

1. 所有用户输入都经过安全过滤
2. 使用预处理语句防止SQL注入
3. 使用WordPress权限系统控制数据访问
4. 使用WordPress非ce机制防止CSRF攻击 



docker exec -it product-management-system-wordpress-1 /bin/bash -c "cd /var/www/html && wp plugin deactivate bjt-product-admin --allow-root && wp plugin activate bjt-product-admin --allow-root"