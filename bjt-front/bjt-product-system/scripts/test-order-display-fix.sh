#!/bin/bash

echo "=== 订单显示修复验证测试 ==="
echo ""

# 1. 验证API返回的订单数量
echo "1. 检查API返回的订单数量..."
API_ORDER_COUNT=$(curl -s "http://localhost/wp-json/bjt/v1/orders" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success'] and 'data' in data:
        print(len(data['data']))
    else:
        print('0')
except:
    print('0')
")

echo "   API返回订单数量: $API_ORDER_COUNT"

# 2. 验证数据库中的订单数量
echo ""
echo "2. 检查数据库中的订单数量..."
DB_ORDER_COUNT=$(docker exec -it dev-mysql-1 mysql -u wordpress -pwordpress bjt_product -e "SELECT COUNT(*) FROM wp_bjt_orders;" 2>/dev/null | tail -n 1 | tr -d '\r')

echo "   数据库订单数量: $DB_ORDER_COUNT"

# 3. 检查前端容器状态
echo ""
echo "3. 检查前端容器状态..."
FRONTEND_STATUS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep frontend | awk '{print $2}')
echo "   前端容器状态: $FRONTEND_STATUS"

# 4. 测试前端API代理
echo ""
echo "4. 测试前端API代理..."
PROXY_ORDER_COUNT=$(curl -s "http://localhost:5173/wp-json/bjt/v1/orders" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success'] and 'data' in data:
        print(len(data['data']))
    else:
        print('0')
except:
    print('0')
" 2>/dev/null || echo "0")

echo "   前端代理返回订单数量: $PROXY_ORDER_COUNT"

# 5. 验证结果
echo ""
echo "=== 验证结果 ==="

if [ "$API_ORDER_COUNT" = "4" ]; then
    echo "✅ API订单数量正确 (4个)"
else
    echo "❌ API订单数量异常 (期望4个，实际${API_ORDER_COUNT}个)"
fi

if [ "$DB_ORDER_COUNT" = "4" ]; then
    echo "✅ 数据库订单数量正确 (4个)"
else
    echo "❌ 数据库订单数量异常 (期望4个，实际${DB_ORDER_COUNT}个)"
fi

if [[ "$FRONTEND_STATUS" == *"Up"* ]]; then
    echo "✅ 前端容器运行正常"
else
    echo "❌ 前端容器状态异常: $FRONTEND_STATUS"
fi

if [ "$PROXY_ORDER_COUNT" = "4" ]; then
    echo "✅ 前端代理正常 (4个订单)"
else
    echo "⚠️  前端代理返回订单数量: $PROXY_ORDER_COUNT (可能需要等待容器完全启动)"
fi

# 6. 总结
echo ""
echo "=== 修复状态总结 ==="

if [ "$API_ORDER_COUNT" = "4" ] && [ "$DB_ORDER_COUNT" = "4" ]; then
    echo "🎉 后端数据正常！API和数据库都返回4个订单"
    echo ""
    echo "📋 订单详情:"
    echo "   - API端点: http://localhost/wp-json/bjt/v1/orders"
    echo "   - 前端页面: http://localhost:5173/orders"
    echo "   - 数据库表: wp_bjt_orders"
    echo ""
    echo "🔧 如果前端页面仍显示2个订单，请："
    echo "   1. 等待前端容器完全启动 (health: starting -> healthy)"
    echo "   2. 清除浏览器缓存"
    echo "   3. 刷新页面 http://localhost:5173/orders"
    echo "   4. 检查浏览器开发者工具的Console和Network标签"
else
    echo "❌ 数据异常，需要进一步检查"
fi

echo ""
echo "=== 测试完成 ===" 