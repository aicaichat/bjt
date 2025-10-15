#!/bin/bash
# 完整评估数据丢失情况

echo "========================================="
echo "   BJT 生产环境数据丢失完整评估"
echo "========================================="
echo ""

# 检查所有关键 volumes
CRITICAL_VOLUMES=(
    "prod_mysql_data"
    "prod_uploads_data"
    "prod_redis_data"
    "prod_mysql_backup"
    "prod_wordpress_cache"
)

echo "📦 1. 检查所有关键 Volumes 状态"
echo "========================================="
for volume in "${CRITICAL_VOLUMES[@]}"; do
    echo ""
    echo "🔍 检查: $volume"
    echo "-------------------"
    
    if docker volume ls | grep -q "$volume"; then
        echo "✅ Volume 存在"
        
        # 获取创建时间
        CREATED=$(docker volume inspect "$volume" 2>/dev/null | grep CreatedAt | cut -d'"' -f4)
        echo "   创建时间: $CREATED"
        
        # 获取挂载点和大小
        MOUNTPOINT=$(docker volume inspect "$volume" 2>/dev/null | grep Mountpoint | cut -d'"' -f4)
        if [ -n "$MOUNTPOINT" ]; then
            SIZE=$(sudo du -sh "$MOUNTPOINT" 2>/dev/null | cut -f1)
            FILE_COUNT=$(sudo find "$MOUNTPOINT" -type f 2>/dev/null | wc -l)
            echo "   挂载点: $MOUNTPOINT"
            echo "   大小: $SIZE"
            echo "   文件数: $FILE_COUNT"
            
            # 判断是否为空
            if [ "$FILE_COUNT" -lt 5 ]; then
                echo "   ⚠️  警告: 文件数量很少，可能是空 volume"
            fi
        fi
    else
        echo "❌ Volume 不存在 - 数据已丢失！"
    fi
done

echo ""
echo ""
echo "🗄️  2. 检查数据库内容"
echo "========================================="
echo "正在检查数据库表..."

DB_CHECK=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
USE bjt;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'bjt';
" 2>/dev/null)

if [ -n "$DB_CHECK" ] && [ "$DB_CHECK" -gt 0 ]; then
    echo "✅ 数据库有 $DB_CHECK 个表"
    
    # 检查关键表
    echo ""
    echo "检查关键表的数据量:"
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
    USE bjt;
    SELECT 'wp_bjt_users' as 表名, COUNT(*) as 记录数 FROM wp_bjt_users
    UNION ALL
    SELECT 'wp_bjt_machines', COUNT(*) FROM wp_bjt_machines
    UNION ALL
    SELECT 'wp_bjt_parts', COUNT(*) FROM wp_bjt_parts
    UNION ALL
    SELECT 'wp_bjt_consumables', COUNT(*) FROM wp_bjt_consumables
    UNION ALL
    SELECT 'wp_bjt_product_lines', COUNT(*) FROM wp_bjt_product_lines;
    " 2>/dev/null || echo "❌ 无法查询表数据"
else
    echo "❌ 数据库为空或无法访问 (表数: $DB_CHECK)"
fi

echo ""
echo ""
echo "🖼️  3. 检查上传图片文件"
echo "========================================="

# 检查 uploads volume
if docker volume ls | grep -q "prod_uploads_data"; then
    UPLOADS_MOUNTPOINT=$(docker volume inspect prod_uploads_data 2>/dev/null | grep Mountpoint | cut -d'"' -f4)
    
    if [ -n "$UPLOADS_MOUNTPOINT" ]; then
        IMAGE_COUNT=$(sudo find "$UPLOADS_MOUNTPOINT" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) 2>/dev/null | wc -l)
        TOTAL_SIZE=$(sudo du -sh "$UPLOADS_MOUNTPOINT" 2>/dev/null | cut -f1)
        
        echo "📂 Uploads 目录: $UPLOADS_MOUNTPOINT"
        echo "🖼️  图片文件数: $IMAGE_COUNT"
        echo "💾 总大小: $TOTAL_SIZE"
        
        if [ "$IMAGE_COUNT" -eq 0 ]; then
            echo "❌ 没有图片文件 - 上传的图片已丢失！"
        else
            echo "✅ 还有 $IMAGE_COUNT 个图片文件"
            echo ""
            echo "最近的图片文件（前5个）:"
            sudo find "$UPLOADS_MOUNTPOINT" -type f -iname "*.jpg" -o -iname "*.png" 2>/dev/null | head -5
        fi
    else
        echo "❌ 无法访问 uploads volume 挂载点"
    fi
else
    echo "❌ uploads_data volume 不存在 - 所有上传的图片已丢失！"
fi

echo ""
echo ""
echo "💾 4. 检查备份"
echo "========================================="

# 检查 MySQL 备份
if docker volume ls | grep -q "prod_mysql_backup"; then
    BACKUP_MOUNTPOINT=$(docker volume inspect prod_mysql_backup 2>/dev/null | grep Mountpoint | cut -d'"' -f4)
    
    if [ -n "$BACKUP_MOUNTPOINT" ]; then
        BACKUP_COUNT=$(sudo find "$BACKUP_MOUNTPOINT" -name "*.sql" -o -name "*.sql.gz" 2>/dev/null | wc -l)
        
        if [ "$BACKUP_COUNT" -gt 0 ]; then
            echo "✅ 找到 $BACKUP_COUNT 个数据库备份文件"
            echo ""
            echo "最新的备份文件:"
            sudo ls -lht "$BACKUP_MOUNTPOINT" 2>/dev/null | head -5
        else
            echo "❌ 没有数据库备份文件"
        fi
    fi
else
    echo "❌ 备份 volume 不存在"
fi

# 检查文件系统备份
if [ -d /var/bjt/backups ]; then
    echo ""
    echo "文件系统备份:"
    find /var/bjt/backups -name "*.sql" -o -name "*.tar.gz" 2>/dev/null | head -10
else
    echo "❌ 没有文件系统备份"
fi

echo ""
echo ""
echo "📊 5. 数据丢失总结"
echo "========================================="

# 生成总结报告
MYSQL_LOST="未知"
UPLOADS_LOST="未知"
BACKUP_EXISTS="未知"

if ! docker volume ls | grep -q "prod_mysql_data"; then
    MYSQL_LOST="是 ❌"
elif [ -n "$DB_CHECK" ] && [ "$DB_CHECK" -lt 5 ]; then
    MYSQL_LOST="是 ❌ (数据库为空)"
else
    MYSQL_LOST="否 ✅"
fi

if ! docker volume ls | grep -q "prod_uploads_data"; then
    UPLOADS_LOST="是 ❌"
elif [ "${IMAGE_COUNT:-0}" -eq 0 ]; then
    UPLOADS_LOST="是 ❌ (目录为空)"
else
    UPLOADS_LOST="否 ✅ (还有 $IMAGE_COUNT 个文件)"
fi

if [ "${BACKUP_COUNT:-0}" -gt 0 ]; then
    BACKUP_EXISTS="是 ✅ ($BACKUP_COUNT 个备份)"
else
    BACKUP_EXISTS="否 ❌"
fi

echo "┌─────────────────────────────────────┐"
echo "│      数据丢失情况汇总               │"
echo "├─────────────────────────────────────┤"
echo "│ 数据库数据丢失: $MYSQL_LOST"
echo "│ 上传图片丢失:   $UPLOADS_LOST"
echo "│ 有可用备份:     $BACKUP_EXISTS"
echo "└─────────────────────────────────────┘"

echo ""
echo "🔍 6. 根本原因"
echo "========================================="
echo "数据丢失原因: 执行了 'docker volume prune -f' 命令"
echo "问题脚本: scripts/cleanup-disk-space.sh (第 42 行)"
echo "清理时间: $(stat -c '%y' scripts/cleanup-disk-space.sh 2>/dev/null | cut -d. -f1 || echo '未知')"

echo ""
echo "💡 7. 恢复建议"
echo "========================================="

if [ "$BACKUP_EXISTS" = "是 ✅"* ]; then
    echo "✅ 有备份可用，建议立即恢复:"
    echo "   1. 恢复数据库: bash scripts/restore-from-backup.sh"
    echo "   2. 验证数据完整性"
    echo "   3. 重启所有服务"
else
    echo "❌ 没有可用备份，需要:"
    echo "   1. 重新初始化数据库表结构"
    echo "   2. 手动创建管理员用户"
    echo "   3. 重新上传所有产品图片"
    echo "   4. 重新导入业务数据（如果有其他来源）"
fi

echo ""
echo "🛡️  8. 预防措施（必须立即执行）"
echo "========================================="
echo "1. ✅ 已禁用 volume 清理命令 (cleanup-disk-space.sh)"
echo "2. ⏳ 需要: 设置自动数据库备份 cron job"
echo "3. ⏳ 需要: 添加 volume 保护标签"
echo "4. ⏳ 需要: 设置阿里云自动快照策略"
echo "5. ⏳ 需要: 定期测试备份恢复流程"

echo ""
echo "========================================="
echo "         评估完成"
echo "========================================="

