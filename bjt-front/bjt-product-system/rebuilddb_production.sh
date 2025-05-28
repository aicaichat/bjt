#!/bin/bash

# Production Database Rebuild Script
# 生产环境数据库重建脚本

# 生产环境配置
DB_HOST="prod_mysql_1"
DB_USER="root"
DB_PASSWORD="bjtpassword123"
DB_NAME="bjt_product"
WORDPRESS_CONTAINER="prod_wordpress_1"

echo "=== BJT Production Database Rebuild Script ==="
echo "WARNING: This will completely rebuild the production database!"
echo "Database: $DB_NAME"
echo "MySQL Container: $DB_HOST"
echo "WordPress Container: $WORDPRESS_CONTAINER"
echo ""

# 确认操作
read -p "Are you sure you want to proceed? This will DELETE ALL existing data! (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# 备份现有数据库（可选但推荐）
echo "Creating backup of existing database..."
docker exec -i $DB_HOST mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > "bjt_product_backup_$(date +%Y%m%d_%H%M%S).sql"
if [ $? -eq 0 ]; then
    echo "Backup created successfully."
else
    echo "Warning: Backup failed, but continuing..."
fi

echo "Dropping and recreating database '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || exit 1

# 重启WordPress容器以确保连接
echo "Restarting WordPress container..."
docker restart $WORDPRESS_CONTAINER || exit 1

echo "Waiting for WordPress container to be ready..."
sleep 30

# 检查WordPress容器状态
echo "Checking WordPress container status..."
docker ps | grep $WORDPRESS_CONTAINER

echo "Explicitly dropping existing BJT tables from '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 -e "
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS wp_bjt_product_lines;
DROP TABLE IF EXISTS wp_bjt_host_models;
DROP TABLE IF EXISTS wp_bjt_accessory_models;
DROP TABLE IF EXISTS wp_bjt_spare_part_models;
DROP TABLE IF EXISTS wp_bjt_parts;
DROP TABLE IF EXISTS wp_bjt_accessories;
DROP TABLE IF EXISTS wp_bjt_consumables;
DROP TABLE IF EXISTS wp_bjt_spare_parts;
DROP TABLE IF EXISTS wp_bjt_relations;
DROP TABLE IF EXISTS wp_bjt_prices;
DROP TABLE IF EXISTS wp_bjt_inventory;
DROP TABLE IF EXISTS wp_bjt_shapes;
DROP TABLE IF EXISTS wp_bjt_materials;
DROP TABLE IF EXISTS wp_bjt_specifications;
DROP TABLE IF EXISTS wp_bjt_consumable_compatibility;
DROP TABLE IF EXISTS wp_bjt_users;
DROP TABLE IF EXISTS wp_bjt_orders;
DROP TABLE IF EXISTS wp_bjt_logs;
DROP TABLE IF EXISTS wp_bjt_order_items;
DROP TABLE IF EXISTS wp_bjt_cart_items;
SET FOREIGN_KEY_CHECKS = 1;
" || exit 1

# 初始化BJT插件的数据库结构
echo "Initializing BJT plugin database structure into '$DB_NAME'..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < docker/dev/mysql/init.sql || exit 1

# 导入生成的SQL文件数据
echo "Importing data from 设备 Excel..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < generated_sql_imports/_设备.sql || exit 1

echo "Importing data from 耗材 Excel..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < generated_sql_imports/_耗材.sql || exit 1

# 导入测试用户数据
echo "Importing test users data..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME --default-character-set=utf8mb4 < docker/dev/mysql/test_users.sql || exit 1

# 验证表结构
echo "Verifying BJT plugin database structure..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES LIKE 'wp_bjt_%';" || exit 1

echo "Verifying key BJT tables structure..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; DESC wp_bjt_relations; DESC wp_bjt_product_lines; DESC wp_bjt_parts;" || exit 1

# 验证用户数据
echo "Verifying test users data..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SELECT id, username, email, role, status FROM wp_bjt_users;" || exit 1

# 设置数据库连接字符集
echo "Setting database connection charset..."
docker exec -i $DB_HOST mysql -u$DB_USER -p$DB_PASSWORD -e "
SET GLOBAL character_set_client = utf8mb4;
SET GLOBAL character_set_connection = utf8mb4;
SET GLOBAL character_set_results = utf8mb4;
FLUSH PRIVILEGES;
" || echo "Warning: Could not set global charset variables (may require higher privileges)"

echo ""
echo "=== Production Database Rebuild Complete! ==="
echo "Database: $DB_NAME"
echo "All data has been imported with proper UTF-8 encoding."
echo "Test users have been created with correct password hashes."
echo ""
echo "You can now test the login with:"
echo "curl -X POST https://bjt.nh.cool/wp-json/bjt/v1/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"username\":\"admin\",\"password\":\"password123\"}'"
echo ""
echo "Please verify the WordPress site is running correctly at your domain." 