#!/bin/bash
# 部署前检查脚本 - 快速评估当前状态

echo "=========================================="
echo "  部署前环境检查"
echo "=========================================="
echo ""

# 1. 磁盘空间
echo "【1】磁盘空间检查"
echo "--------------------------------------"
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

echo "使用率: ${DISK_USAGE}%"
echo "可用空间: ${DISK_AVAIL}"

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "❌ 磁盘空间不足，建议先清理"
    echo "   运行: sudo ./scripts/cleanup-disk-space.sh"
elif [ "$DISK_USAGE" -gt 75 ]; then
    echo "⚠️  磁盘空间紧张，建议清理后再部署"
else
    echo "✅ 磁盘空间充足"
fi
echo ""

# 2. Docker 状态
echo "【2】Docker 服务状态"
echo "--------------------------------------"
if systemctl is-active --quiet docker; then
    echo "✅ Docker 服务运行中"
else
    echo "❌ Docker 服务未运行"
fi
echo ""

# 3. 容器状态
echo "【3】当前容器状态"
echo "--------------------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml ps
echo ""

# 4. 数据库连接
echo "【4】数据库连接测试"
echo "--------------------------------------"
DB_TEST=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
    mysql -u root -pbjtpassword123 -e "SELECT 1" 2>/dev/null || echo "FAILED")

if [ "$DB_TEST" = "FAILED" ]; then
    echo "❌ 数据库连接失败"
else
    echo "✅ 数据库连接正常"
fi
echo ""

# 5. 关键数据库表
echo "【5】关键数据库表检查"
echo "--------------------------------------"
TABLES=(
    "wp_bjt_products"
    "wp_bjt_product_lines"
    "wp_bjt_machines"
    "wp_bjt_parts"
    "wp_bjt_consumables"
)

MISSING=0
for table in "${TABLES[@]}"; do
    EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -c "$table" || echo "0")
    
    if [ "$EXISTS" = "0" ]; then
        echo "❌ $table - 丢失"
        MISSING=$((MISSING + 1))
    else
        echo "✅ $table"
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "⚠️  检测到 $MISSING 个表丢失"
fi
echo ""

# 6. 备份检查
echo "【6】最近的备份"
echo "--------------------------------------"
if [ -d /var/bjt/backups ]; then
    LATEST=$(find /var/bjt/backups -name "*.sql" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1)
    if [ -n "$LATEST" ]; then
        BACKUP_FILE=$(echo "$LATEST" | cut -d' ' -f2)
        BACKUP_TIME=$(stat -c %y "$BACKUP_FILE" | cut -d'.' -f1)
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "✅ 最新备份: $BACKUP_FILE"
        echo "   时间: $BACKUP_TIME"
        echo "   大小: $BACKUP_SIZE"
    else
        echo "⚠️  未找到备份文件"
    fi
else
    echo "❌ 备份目录不存在"
fi
echo ""

# 7. 网络连接
echo "【7】网络连接测试"
echo "--------------------------------------"
if ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    echo "✅ 外网连接正常"
else
    echo "⚠️  外网连接异常"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost 2>&1 | grep -q "200"; then
    echo "✅ Nginx 响应正常"
else
    echo "⚠️  Nginx 响应异常"
fi
echo ""

# 8. 总结
echo "=========================================="
echo "  检查总结"
echo "=========================================="
echo ""

ISSUES=0

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️  磁盘空间不足"
    ISSUES=$((ISSUES + 1))
fi

if [ "$DB_TEST" = "FAILED" ]; then
    echo "⚠️  数据库连接失败"
    ISSUES=$((ISSUES + 1))
fi

if [ "$MISSING" -gt 0 ]; then
    echo "⚠️  数据库表丢失"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "✅ 所有检查通过，可以安全部署"
    echo ""
    echo "执行部署:"
    echo "  sudo ./scripts/safe-recovery-deploy.sh"
else
    echo "❌ 发现 $ISSUES 个问题，建议先解决后再部署"
    echo ""
    echo "建议操作:"
    if [ "$DISK_USAGE" -gt 85 ]; then
        echo "  1. 清理磁盘: sudo ./scripts/cleanup-disk-space.sh"
    fi
    if [ "$DB_TEST" = "FAILED" ]; then
        echo "  2. 重启数据库: docker-compose -f docker/prod/docker-compose.prod.yml restart mysql"
    fi
    if [ "$MISSING" -gt 0 ]; then
        echo "  3. 执行恢复部署: sudo ./scripts/safe-recovery-deploy.sh"
    fi
fi
echo ""
