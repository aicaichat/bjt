-- 修复管理员密码的 SQL 脚本
-- 将密码设置为 'password123'

-- 使用一个新生成的密码哈希（PHP 7.4+ 生成的）
-- 这个哈希值对应密码 'password123'
UPDATE wp_bjt_users 
SET password = '$2y$10$YJvJYgGPjQlGDT5RZHmJCO5kctTMl5DXpKqyWlMbDpEqHfPBQGGDi'
WHERE username = 'admin';

-- 验证更新
SELECT id, username, email, role, status 
FROM wp_bjt_users 
WHERE username = 'admin';

-- 如果需要，也可以创建一个新的管理员用户
-- INSERT INTO wp_bjt_users (
--     username, 
--     email, 
--     password, 
--     customer_code, 
--     role, 
--     country, 
--     region, 
--     status, 
--     preferred_unit, 
--     created_at, 
--     updated_at
-- ) VALUES (
--     'admin2', 
--     'admin2@bjt.com', 
--     '$2y$10$YJvJYgGPjQlGDT5RZHmJCO5kctTMl5DXpKqyWlMbDpEqHfPBQGGDi', -- password123
--     'ADM002', 
--     'admin', 
--     'China', 
--     'CN', 
--     'active', 
--     'metric', 
--     NOW(), 
--     NOW()
-- ); 