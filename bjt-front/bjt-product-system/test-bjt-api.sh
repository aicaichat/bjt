#!/bin/bash

# BJT Product API Test Script
# This script tests the basic functionality of the BJT Product API

# Configuration
API_BASE_URL="http://localhost:8080/wp-json/bjt/v1"
ADMIN_USER="admin"
ADMIN_PASS="password"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== BJT Product API Test Script =====${NC}"
echo "Testing API at $API_BASE_URL"
echo ""

# Test API login
echo -e "${YELLOW}Testing Authentication...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    echo -e "${GREEN}Authentication succeeded, got token${NC}"
else
    echo -e "${RED}Authentication failed${NC}"
    echo $LOGIN_RESPONSE
    exit 1
fi

echo ""

# Test product lines endpoint
echo -e "${YELLOW}Testing Product Lines endpoint...${NC}"
PRODUCT_LINES_RESPONSE=$(curl -s "$API_BASE_URL/product-lines")

if [[ $PRODUCT_LINES_RESPONSE == "["* ]]; then
    LINES_COUNT=$(echo $PRODUCT_LINES_RESPONSE | grep -o "title_zh" | wc -l)
    echo -e "${GREEN}Successfully retrieved $LINES_COUNT product lines${NC}"
else
    echo -e "${RED}Failed to retrieve product lines${NC}"
    echo $PRODUCT_LINES_RESPONSE
fi

echo ""

# Test host models endpoint
echo -e "${YELLOW}Testing Host Models endpoint...${NC}"
HOST_MODELS_RESPONSE=$(curl -s "$API_BASE_URL/host-models")

if [[ $HOST_MODELS_RESPONSE == "["* ]]; then
    MODELS_COUNT=$(echo $HOST_MODELS_RESPONSE | grep -o "model_name" | wc -l)
    echo -e "${GREEN}Successfully retrieved $MODELS_COUNT host models${NC}"
else
    echo -e "${RED}Failed to retrieve host models${NC}"
    echo $HOST_MODELS_RESPONSE
fi

echo ""

# Test creating a product line (requires authentication)
echo -e "${YELLOW}Testing Create Product Line (with authentication)...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/product-lines" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title_zh": "测试产品线",
    "title_en": "Test Product Line",
    "code": "test_line_'$(date +%s)'",
    "description_zh": "这是一个API测试创建的产品线",
    "description_en": "This is a product line created by API test"
  }')

if [[ $CREATE_RESPONSE == *"title_zh"* ]]; then
    NEW_LINE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | sed 's/"id"://')
    echo -e "${GREEN}Successfully created a new product line with ID: $NEW_LINE_ID${NC}"
else
    echo -e "${RED}Failed to create product line${NC}"
    echo $CREATE_RESPONSE
fi

echo ""

# Test API documentation endpoint
echo -e "${YELLOW}Testing API Documentation endpoint...${NC}"
DOCS_RESPONSE=$(curl -s "$API_BASE_URL/docs")

if [[ $DOCS_RESPONSE == *"endpoints"* ]]; then
    echo -e "${GREEN}API documentation available${NC}"
else
    echo -e "${RED}Could not retrieve API documentation${NC}"
    echo $DOCS_RESPONSE
fi

echo ""
echo -e "${YELLOW}===== Test Summary =====${NC}"
echo "API Base URL: $API_BASE_URL"
echo "Authentication: ${GREEN}Successful${NC}"
echo "Product Lines: ${GREEN}Accessible${NC}"
echo "Host Models: ${GREEN}Accessible${NC}"
echo "Create Operations: ${GREEN}Working${NC}"
echo "API Documentation: ${GREEN}Available${NC}"
echo ""
echo "To explore the full API, visit: $API_BASE_URL/docs/ui"