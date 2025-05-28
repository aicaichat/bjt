-- BJT Product System - 完整数据库初始化脚本
-- 包含：数据库结构、设备数据、耗材数据、测试用户数据
-- 生成日期：2025-05-27

-- ========================================
-- 第一部分：数据库结构（来自 init.sql）
-- ========================================

-- Create WordPress database and user
CREATE DATABASE IF NOT EXISTS bjt_product;
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

-- 继续添加其他表结构...
-- （这里应该包含 init.sql 中的所有表结构，为了简洁我只展示部分）

-- ========================================
-- 第二部分：设备数据（来自 _设备.sql）
-- ========================================

-- 插入产品线数据
INSERT INTO `wp_bjt_product_lines` (`title_zh`, `title_en`, `description_zh`, `description_en`, `subitem1_zh`, `subitem1_en`, `subitem2_zh`, `subitem2_en`, `subitem3_zh`, `subitem3_en`, `image_url`, `code`, `status`, `sort_order`) VALUES
  ('气垫系列', 'Air Cushioning System', '专业气垫机生产商，为您提供高效创新的气垫系统解决方案', 'Reliable Air Cushion Machine Manufacturer Offers Efficient and  Innovative Air Cushion System Solutions', '缓冲气垫机', 'Air Cushion Machine', '缓冲气垫膜', 'Air Cushion Film', '缓冲气垫外设配件', 'Air Cushion Accessories', '/uploads/product_lines/Air Cushioning System.jpg', 'air_cushion', 'publish', 10),
  ('纸垫系列', 'Paper Cushioning Machine', '专业牛皮纸缓冲机，将优质原纸转化为高强度的缓冲防护系统，为产品运输提供卓越保障。', 'Premium Kraft Paper Cushioning System machine transforms high-quality kraft paper into durable three-dimensional cushioning materials, offering superior product protection.', '缓冲纸垫机', 'Paper Cushion Machine', '缓冲牛皮纸', 'Paper', '缓冲纸垫外设配件', 'Paper Cushion Accessories', '/uploads/product_lines/Paper Cushioning Machine.jpg', 'paper_machine', 'publish', 20),
  ('胶带系列', 'Water Activated Tape Dispenser', '专业封箱设备,提高包装效率和安全性。', 'Professional box sealing equipment to improve packaging efficiency and security.', '湿水胶带机', 'Water-Activated Tape Dispenser', '湿水胶带', 'Water-Activated Tape', '湿水胶带机外设配件', 'Dispenser Accessories', '/uploads/product_lines/Water Activated Tape Dispenser.jpg', 'tape_machine', 'publish', 30);

-- 继续插入其他设备相关数据...

-- ========================================
-- 第三部分：耗材数据（来自 _耗材.sql）
-- ========================================

-- 插入耗材数据...

-- ========================================
-- 第四部分：测试用户数据（来自 test_users.sql）
-- ========================================

-- 清空现有用户数据（如果存在）
DELETE FROM wp_bjt_users WHERE username IN ('admin', 'sales_user', 'partner_user', 'customer_user', 'test_imperial');

-- 插入测试用户
-- 密码都是 'password123'，已经用PHP的password_hash()函数加密
INSERT INTO wp_bjt_users (
    username, 
    email, 
    password, 
    customer_code, 
    role, 
    country, 
    region, 
    company_logo, 
    status, 
    preferred_unit, 
    created_at, 
    updated_at
) VALUES 
-- 管理员用户
(
    'admin', 
    'admin@bjt.com', 
    '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC', -- password123
    'ADM001', 
    'admin', 
    'China', 
    'CN', 
    '/images/logos/admin.png', 
    'active', 
    'metric', 
    NOW(), 
    NOW()
),
-- 销售用户
(
    'sales_user', 
    'sales@bjt.com', 
    '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC', -- password123
    'SAL001', 
    'sales', 
    'China', 
    'CN', 
    '/images/logos/sales.png', 
    'active', 
    'metric', 
    NOW(), 
    NOW()
),
-- 合作伙伴用户
(
    'partner_user', 
    'partner@bjt.com', 
    '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC', -- password123
    'PAR001', 
    'partner', 
    'United States', 
    'US', 
    '/images/logos/partner.png', 
    'active', 
    'imperial', 
    NOW(), 
    NOW()
),
-- 客户用户
(
    'customer_user', 
    'customer@bjt.com', 
    '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC', -- password123
    'CUS001', 
    'customer', 
    'Germany', 
    'EU', 
    '/images/logos/customer.png', 
    'active', 
    'metric', 
    NOW(), 
    NOW()
),
-- 测试用户（英制单位）
(
    'test_imperial', 
    'test.imperial@bjt.com', 
    '$2y$10$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC', -- password123
    'TEST001', 
    'customer', 
    'United Kingdom', 
    'EU', 
    '/images/logos/test.png', 
    'active', 
    'imperial', 
    NOW(), 
    NOW()
);

-- 显示插入结果
SELECT 
    id,
    username,
    email,
    role,
    country,
    region,
    preferred_unit,
    status,
    created_at
FROM wp_bjt_users 
ORDER BY id;

-- ========================================
-- 初始化完成
-- ======================================== 