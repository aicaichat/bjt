#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/zuodao/BLP/product-management-system/bjt-front"
CORRECT_ROOT="$PROJECT_ROOT/bjt-product-system"

echo -e "${YELLOW}开始检查项目目录结构...${NC}\n"

# 检查错误目录
check_wrong_dirs() {
    local wrong_dirs=(
        "$PROJECT_ROOT/bjt-front"
        "$PROJECT_ROOT/backend"
        "$PROJECT_ROOT/frontend"
    )

    local found_wrong=0
    for dir in "${wrong_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo -e "${RED}发现错误目录: $dir${NC}"
            echo -e "  应该迁移到: $CORRECT_ROOT/ 下的对应目录"
            found_wrong=1
        fi
    done

    if [ $found_wrong -eq 0 ]; then
        echo -e "${GREEN}未发现错误目录${NC}"
    fi
}

# 检查正确目录结构
check_correct_dirs() {
    local required_dirs=(
        "$CORRECT_ROOT/frontend"
        "$CORRECT_ROOT/backend/plugins/bjt-product-admin"
        "$CORRECT_ROOT/docker"
        "$CORRECT_ROOT/nginx"
        "$CORRECT_ROOT/docs"
    )

    echo -e "\n${YELLOW}检查必要目录是否存在:${NC}"
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo -e "${GREEN}✓ $dir${NC}"
        else
            echo -e "${RED}✗ $dir (缺失)${NC}"
        fi
    done
}

# 检查文件位置
check_file_locations() {
    echo -e "\n${YELLOW}检查文件位置:${NC}"
    
    # 检查前端文件
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        echo -e "${RED}发现前端文件在错误位置: $PROJECT_ROOT/frontend${NC}"
        echo -e "  应该移动到: $CORRECT_ROOT/frontend/"
    fi

    # 检查后端文件
    if [ -d "$PROJECT_ROOT/backend" ]; then
        echo -e "${RED}发现后端文件在错误位置: $PROJECT_ROOT/backend${NC}"
        echo -e "  应该移动到: $CORRECT_ROOT/backend/plugins/bjt-product-admin/"
    fi
}

# 执行检查
check_wrong_dirs
check_correct_dirs
check_file_locations

echo -e "\n${YELLOW}检查完成${NC}" 