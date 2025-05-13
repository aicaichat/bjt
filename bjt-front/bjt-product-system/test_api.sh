#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 设置API基础URL
API_BASE="http://localhost:8080/wp-json/bjt/v1"

# 打印分隔线
separator() {
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "${BLUE}== $1${NC}"
    echo -e "${BLUE}================================================================================${NC}"
}

# 开始测试
separator "BJT产品管理系统 API 测试"

# 检查WordPress基础API
separator "0. 检查WordPress基础API"
echo -e "${YELLOW}尝试访问WordPress REST API（基础）${NC}"
curl -v "http://localhost:8080/wp-json/"

echo -e "\n${YELLOW}尝试访问WordPress REST API（添加REST_REQUEST=true）${NC}"
curl -v "http://localhost:8080/wp-json/?REST_REQUEST=true"

echo -e "\n${YELLOW}尝试访问WordPress REST API（添加bjt_is_rest=1）${NC}"
curl -v "http://localhost:8080/wp-json/?bjt_is_rest=1"

echo -e "\n${YELLOW}尝试访问WordPress REST API（添加两个参数）${NC}"
curl -v "http://localhost:8080/wp-json/?REST_REQUEST=true&bjt_is_rest=1"

echo -e "\n${YELLOW}尝试访问WordPress REST API（添加Accept头）${NC}"
curl -v "http://localhost:8080/wp-json/" -H "Accept: application/json"

separator "测试完成" 