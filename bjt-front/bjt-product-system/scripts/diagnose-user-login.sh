#!/bin/bash
# 诊断用户登录问题

set -e

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_ROOT" || { echo "错误: 无法进入项目目录"; exit 1; }

echo "=== BJT 用户登录诊断工具 ==="
echo ""

echo "📋 1. 检查 wp_bjt_users 表是否存在..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -p'${MYSQL_ROOT_PASSWORD}' -e "
USE bjt;
SHOW TABLES LIKE 'wp_bjt_users';
" 2>/dev/null || echo "❌ 无法连接数据库"

echo ""
echo "📊 2. 检查用户表记录数..."
USER_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -p'${MYSQL_ROOT_PASSWORD}' -N -e "
USE bjt;
SELECT COUNT(*) FROM wp_bjt_users;
" 2>/dev/null) || USER_COUNT="ERROR"

if [ "$USER_COUNT" = "ERROR" ]; then
    echo "❌ wp_bjt_users 表不存在或无法访问"
else
    echo "✅ wp_bjt_users 表存在，共有 $USER_COUNT 条用户记录"
fi

echo ""
echo "👥 3. 列出所有用户（不显示密码）..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -p'${MYSQL_ROOT_PASSWORD}' -e "
USE bjt;
SELECT id, username, email, role, status, created_at 
FROM wp_bjt_users 
ORDER BY id;
" 2>/dev/null || echo "❌ 无法查询用户数据"

echo ""
echo "🔍 4. 检查特定用户名是否存在..."
echo "   检查用户: admin"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -p'${MYSQL_ROOT_PASSWORD}' -e "
USE bjt;
SELECT id, username, email, role, status 
FROM wp_bjt_users 
WHERE username = 'admin';
" 2>/dev/null || echo "❌ 无法查询用户"

echo ""
echo "📦 5. 检查所有 BJT 相关表..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -p'${MYSQL_ROOT_PASSWORD}' -e "
USE bjt;
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.tables 
WHERE table_schema = 'bjt' 
  AND TABLE_NAME LIKE 'wp_bjt%'
ORDER BY TABLE_NAME;
" 2>/dev/null || echo "❌ 无法查询表信息"

echo ""
echo "🔐 6. 检查认证端点..."
echo "   测试 /wp-json/bjt/v1/auth/login 端点"
RESPONSE=$(curl -s -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}')
echo "   响应: $RESPONSE"

echo ""
echo "📝 7. 检查 WordPress 错误日志（最近10条认证相关）..."
docker logs prod_wordpress_1 2>&1 | grep -iE "auth|login|wp_bjt_users" | tail -10 || echo "   无相关日志"

echo ""
echo "=== 诊断完成 ==="

