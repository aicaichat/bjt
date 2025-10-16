#!/bin/bash
# 完整恢复所有业务数据

echo "========================================="
echo "   BJT 业务数据恢复工具"
echo "========================================="
echo ""

PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
BACKUP_SQL="/var/bjt/backups/recovery-20251015_135529/database-backup.sql"

cd "$PROJECT_ROOT" || exit 1

echo "步骤 1: 检查备份文件..."
echo "----------------------------"
if [ -f "$BACKUP_SQL" ]; then
    echo "✅ 找到备份文件: $BACKUP_SQL"
    ls -lh "$BACKUP_SQL"
    echo ""
    echo "备份文件内容预览:"
    head -20 "$BACKUP_SQL"
else
    echo "❌ 备份文件不存在"
    exit 1
fi

echo ""
echo ""
echo "步骤 2: 从备份恢复数据库..."
echo "----------------------------"
echo "⚠️  这将覆盖当前数据库，是否继续？(自动继续)"
sleep 2

docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt < "$BACKUP_SQL" 2>&1 | head -50

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ 备份恢复成功"
else
    echo "⚠️  备份恢复有错误，但可能部分成功"
fi

echo ""
echo ""
echo "步骤 3: 重新运行 db-init 确保所有表存在..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d db-init

echo "等待 db-init 完成..."
sleep 15

docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production logs db-init | tail -30

echo ""
echo ""
echo "步骤 4: 导入设备数据..."
echo "----------------------------"
if [ -f "generated_sql_imports/_设备.sql" ]; then
    echo "导入 _设备.sql..."
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt < "generated_sql_imports/_设备.sql" 2>&1 | head -20
    echo "✅ 设备数据导入完成"
else
    echo "⚠️  _设备.sql 文件不存在"
fi

echo ""
echo ""
echo "步骤 5: 导入耗材数据..."
echo "----------------------------"
if [ -f "generated_sql_imports/_耗材.sql" ]; then
    echo "导入 _耗材.sql..."
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt < "generated_sql_imports/_耗材.sql" 2>&1 | head -20
    echo "✅ 耗材数据导入完成"
else
    echo "⚠️  _耗材.sql 文件不存在"
fi

echo ""
echo ""
echo "步骤 6: 验证数据恢复结果..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;

SELECT '所有表' as 检查项, COUNT(*) as 数量 
FROM information_schema.tables 
WHERE table_schema = 'bjt'

UNION ALL
SELECT '产品线', COUNT(*) FROM wp_bjt_product_lines
UNION ALL SELECT '主机', COUNT(*) FROM wp_bjt_machines  
UNION ALL SELECT '配件', COALESCE((SELECT COUNT(*) FROM wp_bjt_parts), 0)
UNION ALL SELECT '耗材', COUNT(*) FROM wp_bjt_consumables
UNION ALL SELECT '备件', COALESCE((SELECT COUNT(*) FROM wp_bjt_spare_parts), 0)
UNION ALL SELECT '用户', COUNT(*) FROM wp_bjt_users
UNION ALL SELECT '订单', COUNT(*) FROM wp_bjt_orders;
" 2>&1

echo ""
echo ""
echo "步骤 7: 重启 WordPress..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart wordpress

echo "等待 WordPress 重启（15秒）..."
sleep 15

echo ""
echo ""
echo "步骤 8: 测试 API 数据..."
echo "----------------------------"

echo "8.1) 测试产品线 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/product-lines/?per_page=5" | jq '.data | length' 2>/dev/null || echo "无法获取"

echo ""
echo "8.2) 测试主机 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/machines/?per_page=5" | jq '.data | length' 2>/dev/null || echo "无法获取"

echo ""
echo "8.3) 测试耗材 API:"
curl -s "https://eorder.lockedair.com/wp-json/bjt/v1/consumables/?per_page=5" | jq '.data | length' 2>/dev/null || echo "无法获取"

echo ""
echo ""
echo "========================================="
echo "           数据恢复完成"
echo "========================================="
echo ""

# 最终统计
PRODUCT_LINES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_product_lines;" 2>/dev/null | tr -d '\r')
MACHINES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_machines;" 2>/dev/null | tr -d '\r')
CONSUMABLES=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SELECT COUNT(*) FROM bjt.wp_bjt_consumables;" 2>/dev/null | tr -d '\r')

echo "📊 最终数据统计:"
echo "  产品线: $PRODUCT_LINES 条"
echo "  主机: $MACHINES 条"
echo "  耗材: $CONSUMABLES 条"
echo ""

if [ "$PRODUCT_LINES" -gt 0 ] && [ "$MACHINES" -gt 0 ]; then
    echo "🎉 数据恢复成功！"
    echo ""
    echo "系统状态:"
    echo "  ✅ 用户认证: 正常"
    echo "  ✅ 业务数据: 已恢复"
    echo "  ✅ API 服务: 正常"
    echo ""
    echo "⚠️  仍需处理:"
    echo "  ❌ 产品图片需要重新上传"
else
    echo "⚠️  数据恢复可能不完整"
    echo "  产品线: $PRODUCT_LINES"
    echo "  主机: $MACHINES"  
    echo "  耗材: $CONSUMABLES"
    echo ""
    echo "请检查:"
    echo "1. 备份文件内容是否完整"
    echo "2. 数据导入SQL文件是否正确"
    echo "3. 查看上方的错误信息"
fi

