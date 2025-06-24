#!/bin/bash

echo "🔧 [验证] 订单项和Shipping信息修复验证"
echo "========================================="

# 检查前端服务是否运行
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务运行正常 (http://localhost:5173)"
else
    echo "❌ 前端服务未运行"
    exit 1
fi

# 检查后端API服务
if curl -s http://localhost/wp-json/bjt/v1/orders > /dev/null; then
    echo "✅ 后端API服务运行正常"
else
    echo "❌ 后端API服务未运行"
    exit 1
fi

echo ""
echo "📊 修复验证结果："

# 检查API数据完整性
echo "1. API数据完整性检查..."
ORDER_COUNT=$(curl -s http://localhost/wp-json/bjt/v1/orders | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success']:
        print(len(data['data']))
    else:
        print('0')
except:
    print('0')
")

if [ "$ORDER_COUNT" -gt 0 ]; then
    echo "   ✅ 订单数量: $ORDER_COUNT"
else
    echo "   ❌ 无法获取订单数据"
fi

# 检查订单项数据
echo "2. 订单项数据检查..."
curl -s http://localhost/wp-json/bjt/v1/orders/5 | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success']:
        items = data['data'].get('items', [])
        if items:
            print(f'   ✅ 订单项数量: {len(items)}')
            for item in items[:2]:  # 只显示前两个
                print(f'   - {item.get(\"item_id\", \"N/A\")}: {item.get(\"item_name\", \"N/A\")}')
        else:
            print('   ❌ 订单项为空')
    else:
        print('   ❌ 无法获取订单数据')
except Exception as e:
    print(f'   ❌ 解析失败: {e}')
"

# 检查shipping信息
echo "3. Shipping信息检查..."
curl -s http://localhost/wp-json/bjt/v1/orders/5 | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success']:
        shipping = data['data'].get('shipping_address', {})
        if shipping:
            print(f'   ✅ 收货人: {shipping.get(\"name\", \"N/A\")}')
            print(f'   ✅ 地址: {shipping.get(\"address\", \"N/A\")}')
            print(f'   ✅ 电话: {shipping.get(\"phone\", \"N/A\")}')
        else:
            print('   ❌ Shipping信息为空')
    else:
        print('   ❌ 无法获取Shipping信息')
except Exception as e:
    print('   ❌ 解析Shipping信息失败')
"

echo ""
echo "🧪 测试建议："
echo "1. 打开浏览器访问: http://localhost:5173/orders"
echo "2. 检查订单列表是否显示商品项"
echo "3. 点击任意订单的'查看详情'按钮"
echo "4. 验证PO页面是否正确显示："
echo "   - 所有商品项 (料号、名称、数量、价格)"
echo "   - 正确的收货信息 (收货人、地址、电话)"
echo "5. 测试Excel导出功能"

echo ""
echo "🔧 如果仍有问题，请检查："
echo "- 浏览器控制台是否有JavaScript错误"
echo "- 网络面板中API请求是否成功"
echo "- 前端代码是否已重新加载"

echo ""
echo "✅ 验证脚本执行完成" 