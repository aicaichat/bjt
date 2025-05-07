#!/bin/bash

# 设置备份目录
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bjt_product_$DATE.sql"

# 执行备份
mysqldump -h localhost -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除30天前的备份
find $BACKUP_DIR -name "bjt_product_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz" 