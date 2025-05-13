#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 设置API基础URL
API_BASE="bjt/v1"

# 打印分隔线
separator() {
    echo -e "${BLUE}================================================================================${NC}"
    echo -e "${BLUE}== $1${NC}"
    echo -e "${BLUE}================================================================================${NC}"
}

# 开始测试
separator "BJT产品管理系统 API 测试 (通过WP-CLI)"

# 检查WordPress基础API
separator "0. 检查WordPress基础API"
echo -e "${YELLOW}尝试访问WordPress REST API${NC}"
docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress wp --allow-root rest

echo -e "\n${YELLOW}尝试访问WordPress核心API路由${NC}"
docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress wp --allow-root rest route list

separator "1. 检查BJT API 路由"
echo -e "${YELLOW}尝试获取BJT API 路由${NC}"
docker-compose -f docker/dev/docker-compose.nginx.yml exec wordpress wp --allow-root rest route list --namespace=bjt

separator "测试完成" 