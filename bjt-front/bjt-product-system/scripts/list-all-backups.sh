#!/bin/bash
# 列出所有可用的备份

echo "========================================="
echo "   查找所有备份文件"
echo "========================================="
echo ""

echo "1️⃣ /var/bjt/backups 目录下的所有备份"
echo "----------------------------"
if [ -d /var/bjt/backups ]; then
    find /var/bjt/backups -name "*.sql" -o -name "*.sql.gz" -o -name "*.tar.gz" 2>/dev/null | while read file; do
        SIZE=$(ls -lh "$file" | awk '{print $5}')
        DATE=$(ls -l "$file" | awk '{print $6, $7, $8}')
        echo "📄 $file"
        echo "   大小: $SIZE | 日期: $DATE"
        
        # 如果是 SQL 文件，显示前几行
        if [[ "$file" == *.sql ]]; then
            echo "   内容预览:"
            head -5 "$file" 2>/dev/null | sed 's/^/     /'
        fi
        echo ""
    done
else
    echo "❌ /var/bjt/backups 目录不存在"
fi

echo ""
echo "2️⃣ Docker volumes 中的备份"
echo "----------------------------"
if docker volume ls | grep -q backup; then
    docker volume ls | grep backup
    echo ""
    
    for vol in $(docker volume ls --format '{{.Name}}' | grep backup); do
        echo "Volume: $vol"
        MOUNTPOINT=$(docker volume inspect "$vol" --format '{{.Mountpoint}}')
        if [ -n "$MOUNTPOINT" ]; then
            echo "路径: $MOUNTPOINT"
            sudo find "$MOUNTPOINT" -type f -name "*.sql*" 2>/dev/null | head -10
        fi
        echo ""
    done
else
    echo "❌ 没有找到 backup volumes"
fi

echo ""
echo "3️⃣ 项目目录中的备份"
echo "----------------------------"
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
if [ -d "$PROJECT_DIR" ]; then
    find "$PROJECT_DIR" -name "*backup*.sql" -o -name "*backup*.tar.gz" 2>/dev/null | while read file; do
        ls -lh "$file"
    done
else
    echo "❌ 项目目录不存在"
fi

echo ""
echo "4️⃣ 生产数据库的当前状态"
echo "----------------------------"
echo "检查数据库创建时间和数据量..."
cd "$PROJECT_DIR" 2>/dev/null
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
SELECT 
    table_name as 表名,
    table_rows as 行数,
    ROUND(data_length/1024/1024, 2) as 数据大小_MB,
    create_time as 创建时间,
    update_time as 更新时间
FROM information_schema.tables 
WHERE table_schema = 'bjt' 
  AND table_name LIKE 'wp_bjt%'
ORDER BY table_name;
" 2>/dev/null

echo ""
echo "5️⃣ 系统备份目录"
echo "----------------------------"
echo "检查系统级备份位置..."
for backup_dir in /backup /backups /var/backup /var/backups /opt/backup /opt/backups; do
    if [ -d "$backup_dir" ]; then
        echo "✅ 找到: $backup_dir"
        ls -lht "$backup_dir" 2>/dev/null | head -5
        echo ""
    fi
done

echo ""
echo "6️⃣ 当前 MySQL 数据目录"
echo "----------------------------"
MYSQL_MOUNTPOINT=$(docker volume inspect prod_mysql_data --format '{{.Mountpoint}}')
echo "MySQL 数据目录: $MYSQL_MOUNTPOINT"
echo "大小: $(sudo du -sh $MYSQL_MOUNTPOINT 2>/dev/null)"
echo "创建时间: $(docker volume inspect prod_mysql_data --format '{{.CreatedAt}}')"

echo ""
echo "最近修改的数据库文件（前10个）:"
sudo find "$MYSQL_MOUNTPOINT" -type f -name "*.ibd" -o -name "*.frm" 2>/dev/null | \
    xargs ls -lt 2>/dev/null | head -10

echo ""
echo ""
echo "========================================="
echo "           备份总结"
echo "========================================="
echo ""

BACKUP_COUNT=$(find /var/bjt/backups -name "*.sql" 2>/dev/null | wc -l)
echo "找到 SQL 备份文件: $BACKUP_COUNT 个"

echo ""
echo "💡 建议:"
echo "1. 如果有更早的备份，优先使用数据更完整的"
echo "2. 检查备份文件大小，越大通常包含更多数据"
echo "3. 可以用 head -100 查看备份文件内容"
echo ""
echo "查看备份内容命令:"
echo "  head -100 /var/bjt/backups/recovery-20251015_135529/database-backup.sql"

