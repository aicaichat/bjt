#!/bin/bash

echo "🔧 [测试] 订单项和Shipping信息修复验证"
echo "====================================="

# 1. 测试API返回的订单数据结构
echo "1. 检查API返回的订单数据结构..."
curl -s -X GET "http://localhost/wp-json/bjt/v1/orders/5" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'success' in data and data['success']:
    order = data['data']
    print(f'✅ 订单ID: {order[\"id\"]}')
    print(f'✅ 订单号: {order[\"order_number\"]}')
    print(f'✅ 订单项数量: {len(order[\"items\"])}')
    print()
    print('📦 订单项详情:')
    for i, item in enumerate(order['items']):
        print(f'  [{i+1}] item_id: {item.get(\"item_id\", \"N/A\")}')
        print(f'      item_name: {item.get(\"item_name\", \"N/A\")}')
        print(f'      quantity: {item.get(\"quantity\", \"N/A\")}')
        print(f'      price: {item.get(\"price\", \"N/A\")}')
        print(f'      item_type: {item.get(\"item_type\", \"N/A\")}')
        print()
    
    print('🚚 Shipping信息:')
    shipping = order.get('shipping_address', {})
    print(f'  name: {shipping.get(\"name\", \"N/A\")}')
    print(f'  address: {shipping.get(\"address\", \"N/A\")}')
    print(f'  phone: {shipping.get(\"phone\", \"N/A\")}')
else:
    print('❌ API请求失败')
"

echo ""
echo "2. 检查所有订单的数据结构..."
curl -s -X GET "http://localhost/wp-json/bjt/v1/orders" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'success' in data and data['success']:
    orders = data['data']
    print(f'✅ 总订单数: {len(orders)}')
    
    total_items = 0
    for order in orders:
        items_count = len(order.get('items', []))
        total_items += items_count
        print(f'  订单 {order[\"id\"]}: {items_count} 个商品')
    
    print(f'✅ 总商品数: {total_items}')
    
    # 检查第一个订单的详细信息
    if orders:
        first_order = orders[0]
        print()
        print('📋 第一个订单详情:')
        print(f'  订单号: {first_order[\"order_number\"]}')
        print(f'  总金额: {first_order[\"total_amount\"]}')
        print(f'  状态: {first_order[\"status\"]}')
        
        shipping = first_order.get('shipping_address', {})
        print(f'  收货人: {shipping.get(\"name\", \"N/A\")}')
        print(f'  收货地址: {shipping.get(\"address\", \"N/A\")}')
        print(f'  联系电话: {shipping.get(\"phone\", \"N/A\")}')
else:
    print('❌ API请求失败')
"

echo ""
echo "3. 检查前端是否正确处理字段映射..."
echo "   前端期望字段: item_id -> part_number"
echo "   前端期望字段: item_name -> name"
echo "   前端期望字段: price -> price"
echo "   前端期望字段: quantity -> quantity"
echo "   前端期望字段: shipping_address.name -> contactName"

echo ""
echo "4. 测试建议:"
echo "   - 访问 http://localhost:5173/orders 查看订单列表"
echo "   - 点击订单查看详情，检查商品是否正确显示"
echo "   - 点击'back to po'按钮，检查PO页面是否正确显示商品和收货信息"
echo "   - 检查导出Excel功能是否正常工作"

echo ""
echo "✅ 测试脚本执行完成" 