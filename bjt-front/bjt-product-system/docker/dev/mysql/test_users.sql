-- 插入测试用户数据到wp_bjt_users表
USE bjt_product;

-- 清空现有用户数据（如果存在）
DELETE FROM wp_bjt_users;

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

-- 显示插入的用户
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