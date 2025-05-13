#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统开发环境启动脚本 ===${NC}"
echo -e "${YELLOW}正在准备启动开发环境...${NC}"

# 检查Docker是否安装并运行
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装，请先安装Docker${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}错误: Docker未运行，请先启动Docker${NC}"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: docker-compose未安装，请先安装docker-compose${NC}"
    exit 1
fi

# 确保所需目录存在
if [ ! -d "wordpress" ]; then
    echo -e "${YELLOW}WordPress目录不存在，正在创建...${NC}"
    mkdir -p wordpress
fi

if [ ! -d "plugins" ]; then
    echo -e "${YELLOW}plugins目录不存在，正在创建...${NC}"
    mkdir -p plugins
fi

# 停止可能正在运行的容器
echo -e "${YELLOW}停止可能正在运行的容器...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml down

# 启动开发环境
echo -e "${YELLOW}启动开发环境...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查服务健康状态
echo -e "${YELLOW}检查服务健康状态...${NC}"
MYSQL_HEALTHY=$(docker-compose -f docker/dev/docker-compose.dev.yml ps | grep mysql | grep -i "up" | wc -l)
WP_HEALTHY=$(docker-compose -f docker/dev/docker-compose.dev.yml ps | grep wordpress | grep -i "up" | wc -l)
FRONTEND_HEALTHY=$(docker-compose -f docker/dev/docker-compose.dev.yml ps | grep frontend | grep -i "up" | wc -l)

if [ $MYSQL_HEALTHY -eq 1 ] && [ $WP_HEALTHY -eq 1 ] && [ $FRONTEND_HEALTHY -eq 1 ]; then
    echo -e "${GREEN}所有服务已成功启动!${NC}"
    echo -e "${GREEN}前端访问地址: ${NC}http://localhost:5173"
    echo -e "${GREEN}WordPress管理后台: ${NC}http://localhost:8080/wp-admin/"
    echo -e "${GREEN}WordPress用户名: ${NC}admin"
    echo -e "${GREEN}WordPress密码: ${NC}password"
    echo -e "${GREEN}MySQL数据库: ${NC}bjt_product"
    echo -e "${GREEN}MySQL用户名: ${NC}wordpress"
    echo -e "${GREEN}MySQL密码: ${NC}wordpress"
    echo -e "${GREEN}MySQL Root密码: ${NC}root"
else
    echo -e "${RED}一个或多个服务未能正常启动，请检查日志${NC}"
    docker-compose -f docker/dev/docker-compose.dev.yml logs
fi 