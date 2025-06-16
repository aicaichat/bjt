#!/bin/bash

# 添加缺失的测试用户到线上数据库
# 使用Docker命令执行

echo "🚀 开始添加缺失的5个测试用户到线上数据库..."

# 方法1: 如果您的生产环境使用docker-compose
echo "方法1: 使用docker-compose执行SQL"
echo "请根据您的实际docker-compose文件名调整命令"
echo ""

# 生产环境docker-compose命令
echo "# 生产环境 (docker-compose.prod.yml)"
echo 'docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} bjt_product < scripts/add_missing_users_simple.sql'
echo ""

echo "# 或者使用环境变量文件"
echo 'docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p bjt_product < scripts/add_missing_users_simple.sql'
echo ""

# 方法2: 如果您知道具体的容器名
echo "方法2: 直接使用容器名执行"
echo "请先查看运行中的容器："
echo 'docker ps | grep mysql'
echo ""
echo "然后使用容器名执行："
echo 'docker exec -i <mysql_container_name> mysql -u root -p bjt_product < scripts/add_missing_users_simple.sql'
echo ""

# 方法3: 一行命令直接执行SQL
echo "方法3: 直接执行SQL命令"
echo 'docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} bjt_product -e "
INSERT INTO wp_bjt_users (username, email, password, customer_code, role, country, region, company_logo, status, preferred_unit, created_at, updated_at) VALUES 
(\"sales_manager\", \"sales.manager@bjt.com\", \"\$2y\$10\$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC\", \"SAL002\", \"sales\", \"Japan\", \"APAC\", \"/images/logos/sales_manager.png\", \"active\", \"metric\", NOW(), NOW()),
(\"tech_support\", \"tech.support@bjt.com\", \"\$2y\$10\$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC\", \"TEC001\", \"customer\", \"South Korea\", \"APAC\", \"/images/logos/tech_support.png\", \"active\", \"metric\", NOW(), NOW()),
(\"agent_user\", \"agent@bjt.com\", \"\$2y\$10\$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC\", \"AGT001\", \"partner\", \"Australia\", \"APAC\", \"/images/logos/agent.png\", \"active\", \"metric\", NOW(), NOW()),
(\"regional_customer\", \"regional.customer@bjt.com\", \"\$2y\$10\$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC\", \"CUS002\", \"customer\", \"France\", \"EU\", \"/images/logos/regional.png\", \"active\", \"metric\", NOW(), NOW()),
(\"enterprise_client\", \"enterprise@bjt.com\", \"\$2y\$10\$d.RiXZLYpzo2P.J9t5OzlOj13Xk/r54CH5GRA1zs4YdfmGXLpxTdC\", \"ENT001\", \"customer\", \"Canada\", \"NA\", \"/images/logos/enterprise.png\", \"active\", \"imperial\", NOW(), NOW());
"'
echo ""

# 验证命令
echo "验证用户是否添加成功："
echo 'docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} bjt_product -e "SELECT username, email, role, country, region, preferred_unit FROM wp_bjt_users WHERE username IN (\"sales_manager\", \"tech_support\", \"agent_user\", \"regional_customer\", \"enterprise_client\");"'
echo ""

echo "✅ 命令已生成完毕！"
echo "⚠️  请根据您的实际环境选择合适的命令执行"
echo "�� 建议先备份数据库，然后执行添加命令" 