#!/bin/bash
# backup-remote.sh - 远程部署备份脚本

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境配置文件
if [ ! -f ".env.remote-ip" ]; then
    print_error "找不到 .env.remote-ip 配置文件"
    exit 1
fi

# 加载环境变量
export $(cat .env.remote-ip | grep -v '^#' | xargs)

# 创建备份目录
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_message "开始备份到目录: $BACKUP_DIR"

# 1. 备份数据库
print_message "备份MySQL数据库..."
docker-compose -f docker/dev/docker-compose.remote-ip.yml exec -T mysql \
    mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$BACKUP_DIR/database.sql"

if [ $? -eq 0 ]; then
    print_message "数据库备份完成: $BACKUP_DIR/database.sql"
else
    print_error "数据库备份失败"
    exit 1
fi

# 2. 备份WordPress文件
print_message "备份WordPress文件..."
docker-compose -f docker/dev/docker-compose.remote-ip.yml exec -T wordpress \
    tar -czf /tmp/wordpress-files.tar.gz -C /var/www/html wp-content/uploads wp-content/themes wp-content/plugins

docker cp $(docker-compose -f docker/dev/docker-compose.remote-ip.yml ps -q wordpress):/tmp/wordpress-files.tar.gz "$BACKUP_DIR/"

if [ $? -eq 0 ]; then
    print_message "WordPress文件备份完成: $BACKUP_DIR/wordpress-files.tar.gz"
else
    print_error "WordPress文件备份失败"
    exit 1
fi

# 3. 备份配置文件
print_message "备份配置文件..."
cp .env.remote-ip "$BACKUP_DIR/"
cp docker/dev/docker-compose.remote-ip.yml "$BACKUP_DIR/"
cp docker/nginx/conf.d/remote-ip.conf "$BACKUP_DIR/"

# 4. 创建备份信息文件
cat > "$BACKUP_DIR/backup-info.txt" << EOF
BJT产品管理系统备份信息
========================

备份时间: $(date)
服务器IP: ${SERVER_IP}
数据库名: ${MYSQL_DATABASE}
备份类型: 远程IP部署

文件列表:
- database.sql: MySQL数据库备份
- wordpress-files.tar.gz: WordPress文件备份
- .env.remote-ip: 环境配置文件
- docker-compose.remote-ip.yml: Docker编排配置
- remote-ip.conf: Nginx配置文件

恢复命令:
1. 恢复数据库: mysql -u root -p ${MYSQL_DATABASE} < database.sql
2. 恢复文件: tar -xzf wordpress-files.tar.gz -C /var/www/html/
3. 恢复配置: 复制配置文件到相应位置
EOF

# 5. 压缩备份
print_message "压缩备份文件..."
tar -czf "${BACKUP_DIR}.tar.gz" -C backups "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

print_message "备份完成: ${BACKUP_DIR}.tar.gz"
print_message "备份大小: $(du -h ${BACKUP_DIR}.tar.gz | cut -f1)"

# 6. 清理旧备份（保留最近7天）
print_message "清理旧备份文件..."
find backups/ -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

print_message "备份脚本执行完成！" 