#!/bin/bash

# 数据库备份脚本
# 用于定期备份MySQL数据库

set -e

# 配置变量
DB_HOST="mysql"
DB_NAME="${MYSQL_DATABASE}"
DB_USER="root"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD}"
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bjt_product_backup_${DATE}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 执行备份
echo "开始备份数据库: ${DB_NAME}"
mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --opt \
    ${DB_NAME} > ${BACKUP_FILE}

# 压缩备份文件
gzip ${BACKUP_FILE}
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "备份完成: ${BACKUP_FILE}"

# 清理旧备份文件
echo "清理 ${RETENTION_DAYS} 天前的备份文件"
find ${BACKUP_DIR} -name "bjt_product_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# 显示备份文件大小
echo "备份文件大小:"
ls -lh ${BACKUP_FILE}

# 验证备份文件
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    echo "备份验证成功"
    exit 0
else
    echo "备份验证失败"
    exit 1
fi 