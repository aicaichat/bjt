#!/bin/bash
# 最终检查和等待 WordPress 完全启动

echo "=== 最终检查 WordPress 状态 ==="
echo ""

echo "步骤 1: 检查 WordPress 容器状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps

echo ""
echo "步骤 2: 等待 WordPress 健康检查通过..."
echo "----------------------------"

MAX_WAIT=120
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    HEALTH_STATUS=$(docker inspect prod_wordpress_1 --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    
    echo -ne "\r等待中... ${ELAPSED}s / ${MAX_WAIT}s - 当前状态: $HEALTH_STATUS      "
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo ""
        echo "✅ WordPress 已就绪！"
        break
    fi
    
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

echo ""
echo ""

if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "⚠️  WordPress 在 ${MAX_WAIT} 秒后仍未就绪，状态: $HEALTH_STATUS"
    echo ""
    echo "查看最近的日志..."
    docker logs prod_wordpress_1 --tail=30 2>&1 | grep -iE "error|warn|ready|listening"
else
    echo "步骤 3: WordPress 已就绪，测试 API..."
    echo "----------------------------"
    
    echo ""
    echo "3.1) 测试诊断端点..."
    curl -s https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic | head -20
    
    echo ""
    echo ""
    echo "3.2) 测试登录端点..."
    RESPONSE=$(curl -s -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"BJTeorder601"}')
    
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    
    echo ""
    echo ""
    
    if echo "$RESPONSE" | grep -q "token"; then
        echo "🎉 登录成功！"
        echo ""
        echo "系统已完全恢复！"
    elif echo "$RESPONSE" | grep -q "502\|500\|Error"; then
        echo "❌ 仍然有错误"
        echo ""
        echo "需要进一步诊断..."
    else
        echo "⚠️  登录失败，但没有严重错误"
        echo "响应内容: $RESPONSE"
    fi
fi

echo ""
echo ""
echo "步骤 4: 系统状态总结"
echo "----------------------------"

# 检查所有服务状态
echo "所有容器状态:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps

echo ""
echo "数据库状态:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
SELECT 
    '用户数' as 项目, COUNT(*) as 数量 FROM bjt.wp_bjt_users
UNION ALL
SELECT '产品线', COUNT(*) FROM bjt.wp_bjt_product_lines
UNION ALL  
SELECT '主机', COUNT(*) FROM bjt.wp_bjt_machines
UNION ALL
SELECT '耗材', COUNT(*) FROM bjt.wp_bjt_consumables;
" 2>/dev/null

echo ""
echo "=== 检查完成 ==="

