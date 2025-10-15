#!/bin/bash
# 检查 WordPress 具体错误

echo "=== 检查 WordPress 错误详情 ==="
echo ""

echo "1️⃣ 查看 WordPress 完整日志..."
echo "========================================="
docker logs prod_wordpress_1 2>&1 | tail -100

echo ""
echo ""
echo "2️⃣ 检查 WordPress 环境变量..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress env | grep -E "WORDPRESS_|MYSQL_|DB_" | sort

echo ""
echo ""
echo "3️⃣ 检查 wp-config.php 数据库配置..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress grep -E "DB_NAME|DB_USER|DB_PASSWORD|DB_HOST" /var/www/html/wp-config.php 2>/dev/null | head -10 || echo "❌ 无法读取 wp-config.php"

echo ""
echo ""
echo "4️⃣ 测试 WordPress 容器内的数据库连接..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress sh -c '
mysql -h mysql -u root -pbjtpassword123 -e "SELECT 1 as test;" 2>&1
' || echo "❌ MySQL 连接失败"

echo ""
echo ""
echo "5️⃣ 检查 PHP 错误日志..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress tail -50 /var/log/apache2/error.log 2>/dev/null || echo "无 Apache 错误日志"

echo ""
echo ""
echo "6️⃣ 直接在容器内访问 WordPress..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress curl -v http://localhost 2>&1 | head -30

echo ""
echo ""
echo "7️⃣ 检查 WordPress 是否能加载..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress php -r "
define('WP_USE_THEMES', false);
require('/var/www/html/wp-load.php');
if (function_exists('wp_get_current_user')) {
    echo '✅ WordPress 核心加载成功' . PHP_EOL;
} else {
    echo '❌ WordPress 核心加载失败' . PHP_EOL;
}
" 2>&1

echo ""
echo ""
echo "8️⃣ 检查插件状态..."
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;
SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';
" 2>/dev/null

echo ""
echo ""
echo "=== 诊断完成 ==="

