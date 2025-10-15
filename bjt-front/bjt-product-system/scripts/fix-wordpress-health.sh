#!/bin/bash
# 修复 WordPress 健康状态问题

echo "=== 诊断和修复 WordPress 健康状态 ==="
echo ""

echo "步骤 1: 检查 WordPress 容器状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps wordpress

echo ""
echo "步骤 2: 检查 WordPress 详细状态..."
echo "----------------------------"
docker inspect prod_wordpress_1 --format='{{json .State.Health}}' | jq . 2>/dev/null || docker inspect prod_wordpress_1 --format='{{json .State.Health}}'

echo ""
echo "步骤 3: 查看 WordPress 日志（最近50行）..."
echo "----------------------------"
docker logs prod_wordpress_1 --tail 50 2>&1

echo ""
echo "步骤 4: 检查数据库连接..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress php -r "
\$host = getenv('WORDPRESS_DB_HOST');
\$name = getenv('WORDPRESS_DB_NAME');
\$user = getenv('WORDPRESS_DB_USER');
\$pass = getenv('WORDPRESS_DB_PASSWORD');

echo 'DB_HOST: ' . \$host . PHP_EOL;
echo 'DB_NAME: ' . \$name . PHP_EOL;
echo 'DB_USER: ' . \$user . PHP_EOL;
echo 'DB_PASSWORD: ' . (empty(\$pass) ? 'EMPTY!' : 'SET') . PHP_EOL;
echo PHP_EOL;

// 测试连接
\$conn = @new mysqli(\$host, \$user, \$pass, \$name);
if (\$conn->connect_error) {
    echo '❌ 数据库连接失败: ' . \$conn->connect_error . PHP_EOL;
    exit(1);
} else {
    echo '✅ 数据库连接成功!' . PHP_EOL;
    \$conn->close();
}
" 2>&1

echo ""
echo "步骤 5: 检查 WordPress 配置文件..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress test -f /var/www/html/wp-config.php && echo "✅ wp-config.php 存在" || echo "❌ wp-config.php 不存在"

echo ""
echo "步骤 6: 测试 WordPress 内部访问..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost 2>&1 || echo "无法访问"

echo ""
echo "步骤 7: 检查 PHP-FPM 进程..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress ps aux | grep -E "php|apache" | head -10

echo ""
echo "步骤 8: 停止并重新启动 WordPress（完全重启）..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production stop wordpress
sleep 5
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d wordpress

echo ""
echo "等待 WordPress 启动（60秒）..."
for i in {60..1}; do
    echo -ne "\r剩余 $i 秒...   "
    sleep 1
done
echo ""

echo ""
echo "步骤 9: 再次检查健康状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps wordpress

echo ""
echo "步骤 10: 测试 API 端点..."
echo "----------------------------"

echo "1) 测试诊断端点:"
curl -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>&1 | head -5

echo ""
echo "2) 测试登录端点:"
curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}' 2>&1

echo ""
echo ""
echo "步骤 11: 如果仍然失败，检查 Nginx 配置..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec nginx nginx -t 2>&1

echo ""
echo "步骤 12: 检查 Nginx 到 WordPress 的连接..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec nginx curl -s -o /dev/null -w "Nginx->WordPress 状态码: %{http_code}\n" http://wordpress 2>&1 || echo "无法连接"

echo ""
echo "=== 诊断完成 ==="
echo ""

echo "💡 如果问题仍然存在，可能的原因:"
echo "1. WordPress 环境变量未正确加载（DB_NAME, DB_USER, DB_PASSWORD 为空）"
echo "2. wp-config.php 文件配置错误"
echo "3. Apache/PHP-FPM 进程崩溃"
echo "4. 内存不足导致容器不健康"
echo ""
echo "建议操作:"
echo "1. 检查 .env.production 文件是否存在且配置正确"
echo "2. 查看完整的 WordPress 日志: docker logs prod_wordpress_1"
echo "3. 如果环境变量为空，需要确保使用 --env-file .env.production 参数"

