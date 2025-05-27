#!/bin/bash

# 备份（可选）
echo "Backing up database... (Skipping for brevity in this example)"
# docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
#  mysqldump -uwordpress -pwordpress bjt_product > bjt_product_backup.sql

echo "Dropping and recreating database 'bjt_product'..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uroot -proot -e "DROP DATABASE IF EXISTS bjt_product; CREATE DATABASE bjt_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" || exit 1

# Ensure WordPress container is running and attempt to let it initialize
echo "Restarting WordPress container to allow it to initialize the database if needed..."
docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress || exit 1

echo "Waiting for WordPress to potentially initialize... (e.g., 30 seconds)"
sleep 30

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "!!! ACTION REQUIRED: Open http://localhost:8080 in your browser                    !!!"
echo "!!! and complete the WordPress installation steps if presented.                    !!!"
echo "!!! Use database name 'bjt_product', user 'wordpress', password 'wordpress',      !!!"
echo "!!! host 'mysql'. Set site title, admin username, and password as prompted.        !!!"
echo "!!! If WordPress is already running and you don't see the install screen, you can  !!!"
echo "!!! proceed. This step ensures core WP tables are present.                       !!!"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
read -p "Press [Enter] to continue AFTER WordPress installation is complete or verified..."

# Explicitly drop all BJT tables before running init.sql to ensure a clean state
echo "Explicitly dropping existing BJT tables from 'bjt_product'..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 -e "
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
echo "Initializing BJT plugin database structure into 'bjt_product'..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/init.sql || exit 1

# Comment out old demo data imports
# # 导入 BJT 插件的 demo 数据（分批）- 使用fixed版本
# echo "Importing BJT plugin demo data..."
# echo "Importing dictionary data (batch 1)..."
# docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
#  mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/demo_batch1_dict_fixed.sql || exit 1
#
# echo "Importing main product data (batch 2)..."
# docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
#  mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/demo_batch2_main_fixed.sql || exit 1
#
# echo "Importing relations, prices and inventory data (batch 3)..."
# docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
#  mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/demo_batch3_relation_price_inventory_fixed.sql || exit 1
#
# echo "Importing order, user and log data (batch 4)..."
# docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
#  mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/demo_batch4_order_user_log_fixed.sql || exit 1

# Import data from generated SQL files
echo "Importing data from 设备 Excel..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < generated_sql_imports/_设备.sql || exit 1

echo "Importing data from 耗材 Excel..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < generated_sql_imports/_耗材.sql || exit 1

# 导入测试用户数据
echo "Importing test users data..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product --default-character-set=utf8mb4 < docker/dev/mysql/test_users.sql || exit 1

# 验证表结构
echo "Verifying BJT plugin database structure..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress -e "USE bjt_product; SHOW TABLES LIKE 'wp_bjt_%';" || exit 1

echo "Verifying key BJT tables structure..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress -e "USE bjt_product; DESC wp_bjt_relations; DESC wp_bjt_product_lines; DESC wp_bjt_parts;" || exit 1

echo "Database rebuild (with manual WordPress install step) complete!"
echo "Please ensure the WordPress site is running correctly at http://localhost:8080"