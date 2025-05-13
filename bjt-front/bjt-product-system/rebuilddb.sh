#!/bin/bash

# 备份（可选）
echo "Backing up database..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysqldump -uwordpress -pwordpress bjt_product > bjt_product_backup.sql

# 删除并重建数据库
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress -e "DROP DATABASE IF EXISTS bjt_product; CREATE DATABASE bjt_product;"

# 初始化数据库结构
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product < docker/dev/mysql/init.sql

# 导入 demo 数据（分批）
echo "Importing demo data..."
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product < docker/dev/mysql/demo_batch1_dict.sql
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product < docker/dev/mysql/demo_batch2_main.sql
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product < docker/dev/mysql/demo_batch3_relation_price_inventory.sql
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress bjt_product < docker/dev/mysql/demo_batch4_order_user_log.sql

# 验证表结构
docker-compose -f docker/dev/docker-compose.nginx.yml exec -T mysql \
 mysql -uwordpress -pwordpress -e "USE bjt_product; SHOW TABLES; DESC wp_bjt_parts; DESC wp_bjt_accessories; DESC wp_bjt_spare_parts; DESC wp_bjt_consumables;"

echo "Database rebuild complete!"