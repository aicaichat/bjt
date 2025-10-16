#!/bin/bash
# 修复 wp-config.php 中的数据库配置

echo "=== 修复 WordPress 数据库配置 ==="
echo ""

echo "步骤 1: 备份当前 wp-config.php..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress cp /var/www/html/wp-config.php /var/www/html/wp-config.php.backup-$(date +%Y%m%d-%H%M%S)

echo "✅ 备份完成"
echo ""

echo "步骤 2: 查看当前错误的配置..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress grep -E "define.*DB_" /var/www/html/wp-config.php | head -5

echo ""
echo "步骤 3: 修复数据库配置..."
echo "----------------------------"

# 修复数据库配置
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress bash -c "
# 修复 DB_NAME
sed -i 's/define( \"DB_NAME\", \"bjt_product\" );/define( \"DB_NAME\", \"bjt\" );/' /var/www/html/wp-config.php

# 修复 DB_PASSWORD
sed -i 's/define( \"DB_PASSWORD\", \"wordpress\" );/define( \"DB_PASSWORD\", \"bjtpassword123\" );/' /var/www/html/wp-config.php

echo 'Database configuration updated'
"

echo "✅ 配置已修复"
echo ""

echo "步骤 4: 验证修复后的配置..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress grep -E "define.*DB_" /var/www/html/wp-config.php | head -5

echo ""
echo "步骤 5: 重启 WordPress..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart wordpress

echo ""
echo "等待 WordPress 启动（30秒）..."
sleep 30

echo ""
echo "步骤 6: 测试数据库连接..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress php -r "
\$conn = new mysqli('mysql', 'wordpress', 'bjtpassword123', 'bjt');
if (\$conn->connect_error) {
    echo '❌ 连接失败: ' . \$conn->connect_error . PHP_EOL;
    exit(1);
} else {
    echo '✅ 数据库连接成功！' . PHP_EOL;
    
    // 测试查询
    \$result = \$conn->query('SELECT COUNT(*) as count FROM wp_bjt_users');
    if (\$result) {
        \$row = \$result->fetch_assoc();
        echo '   wp_bjt_users 表存在，用户数: ' . \$row['count'] . PHP_EOL;
    } else {
        echo '   ❌ 无法查询 wp_bjt_users 表' . PHP_EOL;
    }
    \$conn->close();
}
"

echo ""
echo "步骤 7: 测试 WordPress 首页..."
echo "----------------------------"
curl -I http://localhost:5173/ 2>&1 | head -10 || curl -I https://eorder.lockedair.com/ 2>&1 | head -10

echo ""
echo "步骤 8: 测试登录 API..."
echo "----------------------------"
curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}'

echo ""
echo ""
echo "=== 修复完成 ==="
echo ""
echo "如果登录成功，您应该看到返回的 token 和用户信息"
echo "如果仍然失败，请检查:"
echo "1. wp_bjt_users 表是否真的存在"
echo "2. admin 用户是否存在"
echo "3. 密码是否正确"

