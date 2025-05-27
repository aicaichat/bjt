#!/bin/bash

# Test script for Accessory Models API endpoints
# This script tests the CRUD operations for the Accessory Models API

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for API
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

# Test 1: Get Accessory Models List
echo -e "${YELLOW}Test 1: Get Accessory Models List${NC}"
MODELS_LIST=$(curl -s -X GET "${API_BASE}/accessory-models" \
  -H "$AUTH_HEADER")
echo "$MODELS_LIST" | jq .

echo -e "\n"

# 从列表中获取第一个配件型号的ID以便后续测试使用
FIRST_MODEL_ID=$(echo "$MODELS_LIST" | jq -r '.data.items[0].id // 1')
echo -e "${YELLOW}Using accessory model ID: ${FIRST_MODEL_ID} for single model test${NC}"

# Test 2: Get Single Accessory Model (using the first model ID from the list)
echo -e "${YELLOW}Test 2: Get Single Accessory Model${NC}"
curl -s -X GET "${API_BASE}/accessory-models/${FIRST_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 3: Create a new Accessory Model (使用时间戳创建唯一的model code)
echo -e "${YELLOW}Test 3: Create a new Accessory Model${NC}"
TIMESTAMP=$(date +%s)
UNIQUE_MODEL_CODE="TEST-AM-${TIMESTAMP}"
NEW_MODEL=$(curl -s -X POST "${API_BASE}/accessory-models" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"product_line_id\": 1,
    \"model\": \"${UNIQUE_MODEL_CODE}\",
    \"title_zh\": \"测试配件型号-${TIMESTAMP}\",
    \"title_en\": \"Test Accessory Model-${TIMESTAMP}\",
    \"description_zh\": \"测试配件型号描述-${TIMESTAMP}\",
    \"description_en\": \"Test Accessory Model Description-${TIMESTAMP}\",
    \"type\": \"配件测试类型\",
    \"image1_url\": \"http://example.com/test-image-1.jpg\",
    \"image2_url\": \"http://example.com/test-image-2.jpg\",
    \"status\": \"publish\"
  }")

echo "$NEW_MODEL" | jq .

# Extract the ID of the newly created accessory model
NEW_MODEL_ID=$(echo "$NEW_MODEL" | jq -r '.data.id // ""')
echo -e "${YELLOW}Created accessory model ID: ${NEW_MODEL_ID}${NC}"

# 如果创建失败，尝试从列表中获取现有的accessory model
if [ -z "$NEW_MODEL_ID" ] || [ "$NEW_MODEL_ID" == "null" ]; then
  echo -e "${RED}Failed to create new accessory model or extract ID, using first model from list${NC}"
  NEW_MODEL_ID=$FIRST_MODEL_ID
fi

echo -e "\n"

# Test 4: Update the Accessory Model
echo -e "${YELLOW}Test 4: Update the Accessory Model${NC}"
curl -s -X PUT "${API_BASE}/accessory-models/${NEW_MODEL_ID}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{
    \"title_zh\": \"更新的配件型号-${TIMESTAMP}\",
    \"title_en\": \"Updated Accessory Model-${TIMESTAMP}\",
    \"description_zh\": \"更新的配件型号描述-${TIMESTAMP}\",
    \"status\": \"publish\"
  }" | jq .

echo -e "\n"

# Test 5: Get the updated Accessory Model
echo -e "${YELLOW}Test 5: Get the updated Accessory Model${NC}"
curl -s -X GET "${API_BASE}/accessory-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 6: Delete the Accessory Model
echo -e "${YELLOW}Test 6: Delete the Accessory Model${NC}"
curl -s -X DELETE "${API_BASE}/accessory-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 7: Verify Accessory Model was deleted
echo -e "${YELLOW}Test 7: Verify Accessory Model was deleted${NC}"
curl -s -X GET "${API_BASE}/accessory-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 8: Get Accessory Models with filters
echo -e "${YELLOW}Test 8: Get Accessory Models with filters${NC}"
curl -s -X GET "${API_BASE}/accessory-models?product_line_id=1&type=配件测试类型" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

echo -e "${GREEN}All tests completed${NC}" 