#!/bin/bash

# BJT Product System - 数据库备份脚本

# 设置变量
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bjt_backup_${DATE}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# 创建备份目录
mkdir -p ${BACKUP_DIR}

echo "[$(date)] 开始备份数据库..."

# 执行备份
if mysqldump -h ${MYSQL_HOST} -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > ${BACKUP_FILE}; then
    echo "[$(date)] 数据库备份成功: ${BACKUP_FILE}"
    
    # 压缩备份文件
    gzip ${BACKUP_FILE}
    echo "[$(date)] 备份文件已压缩: ${BACKUP_FILE}.gz"
    
    # 清理旧备份
    echo "[$(date)] 清理超过 ${RETENTION_DAYS} 天的旧备份..."
    find ${BACKUP_DIR} -name "bjt_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    
    # 列出当前备份
    echo "[$(date)] 当前备份文件:"
    ls -lh ${BACKUP_DIR}/bjt_backup_*.sql.gz 2>/dev/null || echo "没有备份文件"
else
    echo "[$(date)] 数据库备份失败！"
    exit 1
fi

echo "[$(date)] 备份任务完成" 