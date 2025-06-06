#!/bin/bash

echo "========================================="
echo "测试新增字典API - Day 1 验收标准"
echo "========================================="

BASE_URL="http://localhost:3001/wp-json/bjt/v1/dictionaries"

echo ""
echo "1. 测试获取所有字典类型..."
curl -s -X GET "${BASE_URL}/types" | jq '.' || echo "API调用失败"

echo ""
echo "2. 测试单位字典..."
curl -s -X GET "${BASE_URL}/units" | jq '.' || echo "API调用失败"

echo ""
echo "3. 测试电压字典..."
curl -s -X GET "${BASE_URL}/voltages" | jq '.' || echo "API调用失败"

echo ""
echo "4. 测试频率字典..."
curl -s -X GET "${BASE_URL}/frequencies" | jq '.' || echo "API调用失败"

echo ""
echo "5. 测试袋型字典..."
curl -s -X GET "${BASE_URL}/bag_types" | jq '.' || echo "API调用失败"

echo ""
echo "6. 测试品牌字典..."
curl -s -X GET "${BASE_URL}/brands" | jq '.' || echo "API调用失败"

echo ""
echo "7. 测试扩展材质字典..."
curl -s -X GET "${BASE_URL}/materials_extended" | jq '.' || echo "API调用失败"

echo ""
echo "========================================="
echo "测试完成！"
echo "=========================================" 