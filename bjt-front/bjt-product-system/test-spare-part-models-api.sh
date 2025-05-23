#!/bin/bash

# Test script for Spare Part Models API endpoints
# This script tests the CRUD operations for the Spare Part Models API

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
  -d '{
    "username":"admin",
    "password":"password"
  }' | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Failed to get authentication token${NC}"
  # Fallback to a preset token like in the comprehensive script
  TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA"
  echo -e "${YELLOW}Using fallback token...${NC}"
else
  echo -e "${GREEN}Successfully obtained authentication token${NC}"
fi

# Auth header with token
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Test 1: Get Spare Part Models List
echo -e "${YELLOW}Test 1: Get Spare Part Models List${NC}"
MODELS_LIST=$(curl -s -X GET "${API_BASE}/spare-part-models" \
  -H "$AUTH_HEADER")
echo "$MODELS_LIST" | jq .

echo -e "\n"

# 从列表中获取第一个 model 的 ID 以便后续测试使用
FIRST_MODEL_ID=$(echo "$MODELS_LIST" | jq -r '.data.items[0].id // 1')
echo -e "${YELLOW}Using model ID: ${FIRST_MODEL_ID} for single model test${NC}"

# Test 2: Get Single Spare Part Model
echo -e "${YELLOW}Test 2: Get Single Spare Part Model${NC}"
curl -s -X GET "${API_BASE}/spare-part-models/${FIRST_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 3: Create a new Spare Part Model
echo -e "${YELLOW}Test 3: Create a new Spare Part Model${NC}"
TIMESTAMP=$(date +%s)
NEW_MODEL_DATA=$(cat <<EOF
{
  "product_line_id": 1,
  "model": "SP-MODEL-${TIMESTAMP}",
  "title_zh": "测试备件型号-${TIMESTAMP}",
  "title_en": "Test Spare Part Model-${TIMESTAMP}",
  "description_zh": "测试备件型号描述-${TIMESTAMP}",
  "description_en": "Test Spare Part Model Description-${TIMESTAMP}",
  "type": "备件测试类型",
  "image1_url": "http://example.com/image-${TIMESTAMP}.jpg",
  "status": "publish"
}
EOF
)

CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/spare-part-models" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$NEW_MODEL_DATA")
echo "$CREATE_RESPONSE" | jq .

echo -e "\n"

# Extract the ID of the newly created spare part model
NEW_MODEL_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
if [ -z "$NEW_MODEL_ID" ] || [ "$NEW_MODEL_ID" == "null" ]; then
  echo -e "${RED}Failed to extract ID from creation response. Using first model ID for subsequent tests.${NC}"
  NEW_MODEL_ID=$FIRST_MODEL_ID
else
  echo -e "${GREEN}Successfully created spare part model with ID: ${NEW_MODEL_ID}${NC}"
fi

# Test 4: Update the Spare Part Model
echo -e "${YELLOW}Test 4: Update the Spare Part Model${NC}"
UPDATE_DATA=$(cat <<EOF
{
  "title_zh": "更新的备件型号-${TIMESTAMP}",
  "title_en": "Updated Spare Part Model-${TIMESTAMP}",
  "description_zh": "更新后的备件型号描述-${TIMESTAMP}"
}
EOF
)

curl -s -X PUT "${API_BASE}/spare-part-models/${NEW_MODEL_ID}" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$UPDATE_DATA" | jq .

echo -e "\n"

# Test 5: Get the updated Spare Part Model
echo -e "${YELLOW}Test 5: Get the updated Spare Part Model${NC}"
curl -s -X GET "${API_BASE}/spare-part-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 6: Delete the Spare Part Model
echo -e "${YELLOW}Test 6: Delete the Spare Part Model${NC}"
curl -s -X DELETE "${API_BASE}/spare-part-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"

# Test 7: Verify deletion by trying to get the deleted model (should fail)
echo -e "${YELLOW}Test 7: Verify deletion${NC}"
GET_DELETED_RESPONSE=$(curl -s -X GET "${API_BASE}/spare-part-models/${NEW_MODEL_ID}" \
  -H "$AUTH_HEADER")
echo "$GET_DELETED_RESPONSE" | jq .

# Check if the response contains "not_found" error code
NOT_FOUND=$(echo "$GET_DELETED_RESPONSE" | jq -r '.code // ""')
if [ "$NOT_FOUND" == "not_found" ]; then
  echo -e "${GREEN}Successfully verified deletion: Model with ID ${NEW_MODEL_ID} not found as expected${NC}"
else
  echo -e "${RED}Verification failed: Model with ID ${NEW_MODEL_ID} was not properly deleted${NC}"
fi

echo -e "\n"

# Test 8: Get Spare Part Models with filters
echo -e "${YELLOW}Test 8: Get Spare Part Models with filters${NC}"
curl -s -X GET "${API_BASE}/spare-part-models?product_line_id=1&status=publish&per_page=3" \
  -H "$AUTH_HEADER" | jq .

echo -e "\n"
echo -e "${GREEN}All tests completed!${NC}" 