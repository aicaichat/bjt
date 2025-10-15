#!/bin/bash
# 验证数据是否真的丢失

echo "=== 数据丢失验证 ==="
echo ""

echo "1️⃣ 检查当前 MySQL volume 的创建时间..."
echo "----------------------------------------"
VOLUME_NAME="prod_mysql_data"

if docker volume ls | grep -q "$VOLUME_NAME"; then
    echo "✅ Volume $VOLUME_NAME 存在"
    echo ""
    
    # 获取 volume 详细信息
    echo "Volume 详细信息："
    docker volume inspect $VOLUME_NAME
    echo ""
    
    # 提取创建时间
    CREATED_AT=$(docker volume inspect $VOLUME_NAME | grep -i "CreatedAt" | cut -d'"' -f4)
    echo "📅 创建时间: $CREATED_AT"
    echo ""
    
    # 检查 volume 数据大小
    MOUNTPOINT=$(docker volume inspect $VOLUME_NAME | grep -i "Mountpoint" | cut -d'"' -f4)
    if [ -n "$MOUNTPOINT" ]; then
        echo "📂 挂载点: $MOUNTPOINT"
        echo "💾 数据大小:"
        sudo du -sh "$MOUNTPOINT" 2>/dev/null || echo "   无法访问（需要 root 权限）"
        echo ""
        
        echo "📁 数据文件列表（前 20 个）:"
        sudo ls -lh "$MOUNTPOINT" 2>/dev/null | head -20 || echo "   无法访问"
    fi
else
    echo "❌ Volume $VOLUME_NAME 不存在 - 数据已被完全删除！"
fi

echo ""
echo "2️⃣ 检查所有 prod 相关的 volumes..."
echo "----------------------------------------"
docker volume ls | grep prod

echo ""
echo "3️⃣ 检查数据库中的表..."
echo "----------------------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'bjt';
SHOW TABLES;
" 2>/dev/null || echo "❌ 无法连接数据库"

echo ""
echo "4️⃣ 检查备份文件..."
echo "----------------------------------------"
echo "MySQL 备份文件："
find /var/bjt/backups -name "*.sql" -type f -ls 2>/dev/null || echo "   无备份文件"

echo ""
docker volume ls | grep backup || echo "   无备份 volume"

echo ""
echo "5️⃣ 关键时间线分析..."
echo "----------------------------------------"
echo "磁盘清理操作时间: $(stat /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/cleanup-disk-space.sh 2>/dev/null | grep Modify || echo '未知')"

if docker volume ls | grep -q "$VOLUME_NAME"; then
    VOLUME_CREATED=$(docker volume inspect $VOLUME_NAME | grep CreatedAt | cut -d'"' -f4)
    echo "MySQL Volume 创建时间: $VOLUME_CREATED"
    echo ""
    
    # 比较时间
    CLEANUP_TIME=$(stat -c %Y /var/bjt/www/bjt/bjt-front/bjt-product-system/scripts/cleanup-disk-space.sh 2>/dev/null || echo 0)
    VOLUME_TIME=$(date -d "$VOLUME_CREATED" +%s 2>/dev/null || echo 0)
    
    if [ "$VOLUME_TIME" -gt "$CLEANUP_TIME" ]; then
        echo "⚠️  Volume 是在清理脚本之后创建的 - 数据已丢失！"
    else
        echo "✅ Volume 早于清理脚本 - 数据可能保留"
    fi
fi

echo ""
echo "=== 验证完成 ==="
echo ""

# 给出结论
if docker volume ls | grep -q "$VOLUME_NAME"; then
    SIZE=$(sudo du -s "$(docker volume inspect $VOLUME_NAME | grep Mountpoint | cut -d'"' -f4)" 2>/dev/null | cut -f1)
    if [ -n "$SIZE" ] && [ "$SIZE" -gt 100000 ]; then
        echo "✅ 结论: 数据可能还在，volume 大小 > 100MB"
    else
        echo "❌ 结论: 数据很可能已丢失，volume 太小或为空"
    fi
else
    echo "❌ 结论: 数据已完全丢失，volume 不存在"
fi

