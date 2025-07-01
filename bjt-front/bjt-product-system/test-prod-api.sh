#!/bin/bash

# 生产环境 API 测试脚本
API_BASE="https://eorder.lockedair.com/wp-json/bjt/v1"

echo "=== 测试生产环境 API ==="
echo "API Base: $API_BASE"
echo

# 获取 JWT Token
echo "1. 获取 JWT Token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}')

echo "Token Response: $TOKEN_RESPONSE"
echo

# 提取 token
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 无法获取 Token，请检查用户名密码"
  exit 1
fi

echo "✅ Token 获取成功: ${TOKEN:0:50}..."
echo

# 测试订单列表
echo "2. 测试订单列表 API..."
ORDERS_RESPONSE=$(curl -s "$API_BASE/orders?page=1&per_page=2&lang=en" \
  -H "Authorization: Bearer $TOKEN")

echo "Orders Response (前500字符):"
echo "$ORDERS_RESPONSE" | head -c 500
echo
echo

# 提取第一个订单号
ORDER_NUMBER=$(echo "$ORDERS_RESPONSE" | grep -o '"order_number":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$ORDER_NUMBER" ]; then
  echo "3. 测试订单详情 API (订单号: $ORDER_NUMBER)..."
  ORDER_DETAIL=$(curl -s "$API_BASE/orders/$ORDER_NUMBER?context=view&lang=en" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Order Detail - 关键字段检查:"
  echo "$ORDER_DETAIL" | grep -o '"model":"[^"]*' | head -3
  echo "$ORDER_DETAIL" | grep -o '"spec":"[^"]*' | head -3
  echo "$ORDER_DETAIL" | grep -o '"model_imperial":"[^"]*' | head -3
  echo "$ORDER_DETAIL" | grep -o '"spec_imperial":"[^"]*' | head -3
  echo
  
  echo "完整的第一个 item:"
  echo "$ORDER_DETAIL" | grep -o '"items":\[.*\]' | sed 's/.*"items":\[\([^}]*}[^}]*}[^}]*}\).*/\1/' | head -1
else
  echo "❌ 无法获取订单号"
fi

echo
echo "=== 测试完成 ===" 