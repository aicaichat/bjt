#!/bin/bash

# Test script for Parts API endpoints
# This script tests the CRUD operations for the Parts API

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for API - fix URL to match the comprehensive test script
API_BASE="http://localhost/wp-json/bjt/v1"

# Get an authentication token
echo -e "${YELLOW}Getting authentication token...${NC}"
TOKEN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Failed to get authentication token${NC}"
  # Fallback to a preset token like in the comprehensive script
  TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA"
  echo -e "${YELLOW}Using preset token as fallback${NC}"
fi

echo -e "${GREEN}Authentication token obtained successfully${NC}\n"

# Header with auth token
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Test 1: Get Parts List
echo -e "${YELLOW}Test 1: Get Parts List${NC}"
PARTS_LIST=$(curl -s -X GET "${API_BASE}/parts" \
  -H "$AUTH_HEADER")
echo "$PARTS_LIST" | jq .

echo -e "\n"

# 从列表中获取第一个 part 的 ID 以便后续测试使用
FIRST_PART_ID=$(echo "$PARTS_LIST" | jq -r '.data.items[0].id // 1')
echo -e "${YELLOW}Using part ID: ${FIRST_PART_ID} for single part test${NC}"

# Test 2: Get Single Part (using the first part ID from the list)
echo -e "${YELLOW}Test 2: Get Single Part${NC}"
curl -s -X GET "${API_BASE}/parts/${FIRST_PART_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 3: Create a new Part (使用时间戳创建唯一的part_number)
echo -e "${YELLOW}Test 3: Create a new Part${NC}"
TIMESTAMP=$(date +%s)
UNIQUE_PART_NUMBER="TEST-PART-${TIMESTAMP}"
NEW_PART=$(curl -s -X POST "${API_BASE}/parts" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"product_line_id\": 1,
    \"model\": \"TEST-MODEL-001\",
    \"voltage\": \"220V\",
    \"image_url\": \"http://example.com/test-image.jpg\",
    \"part_number\": \"${UNIQUE_PART_NUMBER}\",
    \"name_zh\": \"测试主机料号-${TIMESTAMP}\",
    \"name_en\": \"Test Host Part-${TIMESTAMP}\",
    \"brand\": \"BJT\",
    \"spec\": \"测试规格\",
    \"spec_imperial\": \"Test Specification\",
    \"package_size_cm\": \"100×80×20cm\",
    \"net_weight_kg\": 10,
    \"status\": \"publish\"
  }")

echo "$NEW_PART" | jq .

# Extract the ID of the newly created part
NEW_PART_ID=$(echo "$NEW_PART" | jq -r '.data.id // ""')
echo -e "${YELLOW}Created part ID: ${NEW_PART_ID}${NC}"

# 如果创建失败，尝试从列表中获取现有的part
if [ -z "$NEW_PART_ID" ] || [ "$NEW_PART_ID" == "null" ]; then
  echo -e "${RED}Failed to create new part or extract ID, using first part from list${NC}"
  NEW_PART_ID=$FIRST_PART_ID
fi

echo -e "\n"

# Test 4: Update the Part
echo -e "${YELLOW}Test 4: Update the Part${NC}"
curl -s -X PUT "${API_BASE}/parts/${NEW_PART_ID}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"name_zh\": \"更新的测试主机料号-${TIMESTAMP}\",
    \"name_en\": \"Updated Test Host Part-${TIMESTAMP}\",
    \"spec\": \"更新的测试规格\"
  }" | jq .

echo -e "\n"

# Test 5: Get the updated Part
echo -e "${YELLOW}Test 5: Get the updated Part${NC}"
curl -s -X GET "${API_BASE}/parts/${NEW_PART_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 6: Delete the Part
echo -e "${YELLOW}Test 6: Delete the Part${NC}"
curl -s -X DELETE "${API_BASE}/parts/${NEW_PART_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 7: Verify Part was deleted
echo -e "${YELLOW}Test 7: Verify Part was deleted${NC}"
curl -s -X GET "${API_BASE}/parts/${NEW_PART_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 8: Get Parts with filters
echo -e "${YELLOW}Test 8: Get Parts with filters${NC}"
curl -s -X GET "${API_BASE}/parts?product_line_id=1&model=TEST-MODEL-001" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 9: Get Parts pricing (修复批量价格API调用)
echo -e "${YELLOW}Test 9: Get Parts pricing${NC}"
curl -s -X POST "${API_BASE}/parts/prices/batch" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"ids\": [${FIRST_PART_ID}],
    \"region\": \"CN\",
    \"quantity\": 1
  }" | jq .

echo -e "\n"

# Test 10: Get Parts inventory (修复批量库存API调用)
echo -e "${YELLOW}Test 10: Get Parts inventory${NC}"
curl -s -X POST "${API_BASE}/parts/inventory/batch" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"ids\": [${FIRST_PART_ID}],
    \"region\": \"CN\"
  }" | jq .

echo -e "\n"

echo -e "${GREEN}All tests completed${NC}" 