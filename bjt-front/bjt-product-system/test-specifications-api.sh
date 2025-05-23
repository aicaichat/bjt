#!/bin/bash

# Test script for Specifications Dictionary API endpoints
# This script tests the Specifications API endpoints for the dictionary controller

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Test 1: Check if specifications is in dictionary types
echo -e "${BLUE}Test 1: Check if specifications is in dictionary types${NC}"
DICT_TYPES=$(curl -s -X GET "${API_BASE}/dictionaries/types" \
  -H "$AUTH_HEADER")
echo "$DICT_TYPES" | jq .

# Check if specifications is in the response
if echo "$DICT_TYPES" | grep -q "specifications"; then
  echo -e "${GREEN}✓ Specifications found in dictionary types${NC}"
else
  echo -e "${RED}✗ Specifications not found in dictionary types${NC}"
fi

echo -e "\n"

# Test 2: Get specifications dictionary items
echo -e "${BLUE}Test 2: Get specifications dictionary items${NC}"
SPECIFICATIONS_DICT=$(curl -s -X GET "${API_BASE}/dictionaries/specifications?lang=zh" \
  -H "$AUTH_HEADER")
echo "$SPECIFICATIONS_DICT" | jq .

# Check if the response contains items
SPECIFICATIONS_COUNT=$(echo "$SPECIFICATIONS_DICT" | jq '.data.items | length')
if [ "$SPECIFICATIONS_COUNT" -gt 0 ] || [ "$SPECIFICATIONS_COUNT" == "0" ]; then
  echo -e "${GREEN}✓ Successfully retrieved specifications dictionary items (count: $SPECIFICATIONS_COUNT)${NC}"
else
  echo -e "${RED}✗ Failed to retrieve specifications dictionary items${NC}"
fi

echo -e "\n"

# Test 3: Get specifications dictionary items with English language
echo -e "${BLUE}Test 3: Get specifications dictionary items with English language${NC}"
SPECIFICATIONS_DICT_EN=$(curl -s -X GET "${API_BASE}/dictionaries/specifications?lang=en" \
  -H "$AUTH_HEADER")
echo "$SPECIFICATIONS_DICT_EN" | jq .

echo -e "\n"

# Test 4: Test relationship with consumables
echo -e "${BLUE}Test 4: Test relationship with consumables${NC}"
# First, get a list of consumables
CONSUMABLES=$(curl -s -X GET "${API_BASE}/consumables?page=1&per_page=5" \
  -H "$AUTH_HEADER")

echo "Sample consumables data with specification information:"
echo "$CONSUMABLES" | jq '.data.items[0].specs' 2>/dev/null || echo "No consumables found or unexpected response format"

echo -e "\n"
echo -e "${GREEN}All tests completed!${NC}" 