#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API基础URL
API_BASE="http://localhost:8080/wp-json/bjt/v1"

# 登录并获取令牌
echo -e "${BLUE}====== 测试登录API ======${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password"}' \
    $API_BASE/auth/login)

echo -e "${YELLOW}登录响应:${NC}"
echo $LOGIN_RESPONSE

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}登录失败，无法获取令牌${NC}"
    exit 1
else
    echo -e "${GREEN}成功获取令牌${NC}"
    AUTH_HEADER="Authorization: Bearer $TOKEN"
fi

# 测试获取当前用户信息
echo -e "\n${BLUE}====== 测试获取用户信息 ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" $API_BASE/auth/me | jq

# 测试设备API
echo -e "\n${BLUE}====== 测试设备列表API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/machines?page=1&per_page=10&region=CN&lang=zh" | jq

echo -e "\n${BLUE}====== 测试单个设备API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/machines/MEY-001?region=CN&lang=zh" | jq

echo -e "\n${BLUE}====== 测试设备配件API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/machines/MEY-001/accessories?region=CN&lang=zh" | jq

# 测试配件API
echo -e "\n${BLUE}====== 测试配件列表API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/accessories?page=1&per_page=10&region=CN&lang=zh" | jq

echo -e "\n${BLUE}====== 测试单个配件API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/accessories/FS-001?region=CN&lang=zh" | jq

echo -e "\n${BLUE}====== 测试配件兼容设备API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/accessories/FS-001/machines?region=CN&lang=zh" | jq

# 测试耗材API
echo -e "\n${BLUE}====== 测试耗材列表API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/consumables?page=1&per_page=10&region=CN&lang=zh" | jq

echo -e "\n${BLUE}====== 测试单个耗材API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/consumables/ACF-350?region=CN&lang=zh" | jq

# 测试备件API
echo -e "\n${BLUE}====== 测试备件列表API ======${NC}"
curl -s -H "$AUTH_HEADER" -H "Content-Type: application/json" "$API_BASE/spare-parts?page=1&per_page=10&region=CN&lang=zh" | jq

# 测试退出登录
echo -e "\n${BLUE}====== 测试退出登录API ======${NC}"
curl -s -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" $API_BASE/auth/logout | jq

echo -e "\n${GREEN}API测试完成${NC}"