# BJT Product System - 数据库初始化指南

## 概述

本文档说明如何使用提供的SQL文件初始化BJT产品管理系统的线上数据库。

## SQL文件说明

系统包含以下SQL初始化文件：

1. **`docker/dev/mysql/init.sql`** - 数据库结构
   - 创建所有必要的数据表
   - 设置表关系和索引
   - 包含所有BJT相关的表结构

2. **`generated_sql_imports/_设备.sql`** - 设备基础数据
   - 产品线数据（气垫系列、纸垫系列、胶带系列）
   - 主机型号数据
   - 配件型号数据
   - 零件和备件数据
   - 关联关系数据

3. **`generated_sql_imports/_耗材.sql`** - 耗材基础数据
   - 耗材产品数据
   - 形状定义数据
   - 材料定义数据
   - 规格定义数据
   - 示例用户数据

4. **`docker/dev/mysql/test_users.sql`** - 测试用户数据
   - 管理员账号：admin/password123
   - 销售账号：sales_user/password123
   - 合作伙伴账号：partner_user/password123
   - 客户账号：customer_user/password123
   - 测试账号：test_imperial/password123

## 自动初始化（推荐）

### 使用 Docker Compose

系统已配置为在首次启动时自动初始化数据库：

```bash
# 生产环境部署
cd /path/to/bjt-product-system
./deploy-production.sh
```

Docker Compose 会自动：
1. 创建数据库
2. 按顺序执行所有SQL文件
3. 验证初始化结果

### 初始化顺序

SQL文件会按以下顺序执行：
1. `01-init.sql` - 数据库结构
2. `02-devices.sql` - 设备数据
3. `03-consumables.sql` - 耗材数据
4. `04-test-users.sql` - 测试用户

## 手动初始化

如果需要手动初始化数据库，请按以下步骤操作：

### 1. 准备数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS bjt_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bjt_product;
```

### 2. 导入数据库结构

```bash
mysql -h <host> -u <username> -p bjt_product < docker/dev/mysql/init.sql
```

### 3. 导入设备数据

```bash
mysql -h <host> -u <username> -p bjt_product < generated_sql_imports/_设备.sql
```

### 4. 导入耗材数据

```bash
mysql -h <host> -u <username> -p bjt_product < generated_sql_imports/_耗材.sql
```

### 5. 导入测试用户（可选）

```bash
mysql -h <host> -u <username> -p bjt_product < docker/dev/mysql/test_users.sql
```

## 验证初始化

### 检查表结构

```sql
-- 连接到数据库
mysql -h <host> -u <username> -p bjt_product

-- 查看所有BJT相关表
SHOW TABLES LIKE 'wp_bjt_%';

-- 应该看到以下表：
-- wp_bjt_product_lines
-- wp_bjt_host_models
-- wp_bjt_accessory_models
-- wp_bjt_spare_part_models
-- wp_bjt_parts
-- wp_bjt_accessories
-- wp_bjt_consumables
-- wp_bjt_spare_parts
-- wp_bjt_relations
-- wp_bjt_prices
-- wp_bjt_inventory
-- wp_bjt_shapes
-- wp_bjt_materials
-- wp_bjt_specifications
-- wp_bjt_consumable_compatibility
-- wp_bjt_users
-- wp_bjt_orders
-- wp_bjt_order_items
-- wp_bjt_cart_items
-- wp_bjt_logs
```

### 检查数据

```sql
-- 检查产品线数据
SELECT COUNT(*) as count, 'product_lines' as table_name FROM wp_bjt_product_lines
UNION ALL
SELECT COUNT(*), 'host_models' FROM wp_bjt_host_models
UNION ALL
SELECT COUNT(*), 'accessories' FROM wp_bjt_accessories
UNION ALL
SELECT COUNT(*), 'consumables' FROM wp_bjt_consumables
UNION ALL
SELECT COUNT(*), 'users' FROM wp_bjt_users;
```

预期结果：
- product_lines: 3条记录
- host_models: 2条记录
- accessories: 27条记录
- consumables: 50+条记录
- users: 5条记录（如果导入了测试用户）

## 注意事项

1. **字符集**：确保数据库使用 `utf8mb4` 字符集，以支持中文和特殊字符
2. **用户权限**：执行导入的数据库用户需要有 CREATE、INSERT、UPDATE 权限
3. **数据重复**：SQL文件使用 `INSERT` 语句，重复执行可能导致主键冲突
4. **测试用户**：生产环境建议不要导入测试用户，或在导入后修改密码

## 故障排查

### 常见问题

1. **字符集错误**
   ```sql
   -- 设置连接字符集
   SET NAMES utf8mb4;
   SET character_set_client = utf8mb4;
   ```

2. **主键冲突**
   ```sql
   -- 清空表数据（谨慎使用）
   TRUNCATE TABLE wp_bjt_product_lines;
   -- 然后重新导入
   ```

3. **外键约束错误**
   ```sql
   -- 临时禁用外键检查
   SET FOREIGN_KEY_CHECKS = 0;
   -- 导入数据
   -- 重新启用外键检查
   SET FOREIGN_KEY_CHECKS = 1;
   ```

## 备份建议

在初始化生产数据库前，建议：
1. 备份现有数据库（如果有）
2. 在测试环境先验证SQL文件
3. 记录初始化日志以便排查问题

```bash
# 备份命令示例
mysqldump -h <host> -u <username> -p bjt_product > backup_$(date +%Y%m%d_%H%M%S).sql
``` 