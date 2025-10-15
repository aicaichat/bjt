#!/bin/bash
# 快速检查用户表状态

echo "=== 检查用户表 ==="

# 1. 检查表是否存在
echo "1️⃣ 检查 wp_bjt_users 表..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SHOW TABLES LIKE 'wp_bjt_users';"

# 2. 统计用户数
echo ""
echo "2️⃣ 用户数量..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SELECT COUNT(*) as total FROM wp_bjt_users;" 2>/dev/null || echo "❌ 表不存在"

# 3. 列出所有用户
echo ""
echo "3️⃣ 所有用户列表..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SELECT id, username, email, role FROM wp_bjt_users;" 2>/dev/null || echo "❌ 无法查询"

# 4. 查找 admin 用户
echo ""
echo "4️⃣ 查找 admin 用户..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SELECT * FROM wp_bjt_users WHERE username='admin';" 2>/dev/null || echo "❌ admin 用户不存在"

# 5. 检查所有 BJT 表
echo ""
echo "5️⃣ 所有 BJT 表..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SHOW TABLES LIKE 'wp_bjt%';"

echo ""
echo "=== 检查完成 ==="

