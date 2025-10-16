#!/bin/bash
# 全面检查所有数据表

echo "=== 全面数据检查 ==="
echo ""

echo "📊 数据库表统计"
echo "========================================="
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;

-- 核心业务表
SELECT '用户表 (wp_bjt_users)' as 表名, COUNT(*) as 记录数 FROM wp_bjt_users
UNION ALL
SELECT '产品线 (wp_bjt_product_lines)', COUNT(*) FROM wp_bjt_product_lines
UNION ALL  
SELECT '主机 (wp_bjt_machines)', COUNT(*) FROM wp_bjt_machines
UNION ALL
SELECT '配件 (wp_bjt_parts)', COUNT(*) FROM wp_bjt_parts
UNION ALL
SELECT '耗材 (wp_bjt_consumables)', COUNT(*) FROM wp_bjt_consumables
UNION ALL
SELECT '备件 (wp_bjt_spare_parts)', COUNT(*) FROM wp_bjt_spare_parts
UNION ALL
SELECT '附件 (wp_bjt_accessories)', COUNT(*) FROM wp_bjt_accessories
UNION ALL
SELECT '订单 (wp_bjt_orders)', COUNT(*) FROM wp_bjt_orders
UNION ALL
SELECT '购物车 (wp_bjt_carts)', COUNT(*) FROM wp_bjt_carts;
"

echo ""
echo ""
echo "📋 检查数据文件位置"
echo "========================================="
echo "初始化 SQL 文件:"
ls -lh /var/bjt/www/bjt/bjt-front/bjt-product-system/generated_sql_imports/ 2>/dev/null | grep -E "\.sql$|设备|耗材" | head -10

echo ""
echo ""
echo "💾 MySQL Volume 信息"
echo "========================================="
docker volume inspect prod_mysql_data --format='{{.Mountpoint}}' | xargs sudo du -sh

echo ""
echo "数据文件数量:"
docker volume inspect prod_mysql_data --format='{{.Mountpoint}}' | xargs sudo find | wc -l

echo ""
echo ""
echo "🔍 分析"
echo "========================================="

PRODUCT_LINES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_product_lines;" 2>/dev/null)
MACHINES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_machines;" 2>/dev/null)
CONSUMABLES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_consumables;" 2>/dev/null)

echo "数据状态:"
echo "  产品线: $PRODUCT_LINES 条"
echo "  主机: $MACHINES 条"
echo "  耗材: $CONSUMABLES 条"
echo ""

if [ "$PRODUCT_LINES" -eq 0 ] && [ "$MACHINES" -eq 0 ] && [ "$CONSUMABLES" -eq 0 ]; then
    echo "❌ 业务数据为空 - 需要重新导入"
    echo ""
    echo "可能的原因:"
    echo "1. 数据库在清理磁盘时被清空（最可能）"
    echo "2. db-init 脚本只创建了表结构，没有导入数据"
    echo "3. 数据导入 SQL 文件不存在或未执行"
    echo ""
    echo "恢复方案:"
    echo "1. 检查是否有数据备份（/var/bjt/backups/）"
    echo "2. 从备份恢复数据"
    echo "3. 如果没有备份，需要重新导入原始数据"
else
    echo "✅ 有部分业务数据"
fi

echo ""
echo ""
echo "🔎 检查备份"
echo "========================================="
echo "数据库备份文件:"
find /var/bjt/backups -name "*.sql" -type f -exec ls -lh {} \; 2>/dev/null | head -10

echo ""
echo "最近的备份:"
ls -lht /var/bjt/backups/ 2>/dev/null | head -5

echo ""
echo "=== 检查完成 ==="
echo ""

echo "💡 下一步建议:"
if [ "$PRODUCT_LINES" -eq 0 ]; then
    echo "1. 先完成管理员登录"
    echo "2. 检查备份目录中是否有数据"
    echo "3. 如果有备份，运行数据恢复脚本"
    echo "4. 如果没有备份，需要重新导入原始业务数据"
else
    echo "1. 数据已存在，系统可以正常使用"
    echo "2. 只需重新上传产品图片"
fi

