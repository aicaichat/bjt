#!/bin/bash

echo "=== 生产环境基础API连接测试 ==="
echo "=== Production Environment Basic API Connectivity Test ==="
echo

PROD_BASE_URL="https://eorder.lockedair.com"

echo "🔍 测试基础WordPress API连接..."
echo "🔍 Testing basic WordPress API connectivity..."
curl -s "${PROD_BASE_URL}/wp-json/" | head -10
echo

echo "🔍 测试BJT API命名空间..."
echo "🔍 Testing BJT API namespace..."
curl -s "${PROD_BASE_URL}/wp-json/bjt/v1/" | head -10
echo

echo "🔍 测试订单API端点..."
echo "🔍 Testing orders API endpoint..."
curl -s "${PROD_BASE_URL}/wp-json/bjt/v1/orders" | head -20
echo

echo "🔍 测试产品API端点..."
echo "🔍 Testing products API endpoint..."
curl -s "${PROD_BASE_URL}/wp-json/bjt/v1/products" | head -20
echo

echo "=== 测试完成 ==="
echo "=== Test Complete ===" 