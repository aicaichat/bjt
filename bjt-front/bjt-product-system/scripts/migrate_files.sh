#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/zuodao/BLP/product-management-system/bjt-front"
CORRECT_ROOT="$PROJECT_ROOT/bjt-product-system"

# 创建必要的目录
create_directories() {
    echo -e "${YELLOW}创建必要的目录结构...${NC}"
    
    mkdir -p "$CORRECT_ROOT/frontend"
    mkdir -p "$CORRECT_ROOT/backend/plugins/bjt-product-admin/includes/api"
    mkdir -p "$CORRECT_ROOT/docker"
    mkdir -p "$CORRECT_ROOT/nginx"
    mkdir -p "$CORRECT_ROOT/docs"
}

# 迁移前端文件
migrate_frontend() {
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        echo -e "${YELLOW}迁移前端文件...${NC}"
        cp -r "$PROJECT_ROOT/frontend/"* "$CORRECT_ROOT/frontend/" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}前端文件迁移成功${NC}"
        else
            echo -e "${RED}前端文件迁移失败${NC}"
        fi
    fi
}

# 迁移后端文件
migrate_backend() {
    if [ -d "$PROJECT_ROOT/backend" ]; then
        echo -e "${YELLOW}迁移后端文件...${NC}"
        
        # 迁移插件文件
        if [ -d "$PROJECT_ROOT/backend/plugins" ]; then
            cp -r "$PROJECT_ROOT/backend/plugins/"* "$CORRECT_ROOT/backend/plugins/" 2>/dev/null
        fi
        
        # 迁移API文件
        if [ -d "$PROJECT_ROOT/backend/api" ]; then
            cp -r "$PROJECT_ROOT/backend/api/"* "$CORRECT_ROOT/backend/plugins/bjt-product-admin/includes/api/" 2>/dev/null
        fi
        
        echo -e "${GREEN}后端文件迁移成功${NC}"
    fi
}

# 清理错误目录
cleanup_wrong_dirs() {
    echo -e "${YELLOW}清理错误目录...${NC}"
    
    local wrong_dirs=(
        "$PROJECT_ROOT/bjt-front"
        "$PROJECT_ROOT/backend"
        "$PROJECT_ROOT/frontend"
    )

    for dir in "${wrong_dirs[@]}"; do
        if [ -d "$dir" ]; then
            read -p "是否删除目录 $dir? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$dir"
                echo -e "${GREEN}已删除 $dir${NC}"
            else
                echo -e "${YELLOW}保留 $dir${NC}"
            fi
        fi
    done
}

# 主函数
main() {
    echo -e "${YELLOW}开始迁移文件...${NC}\n"
    
    # 创建目录结构
    create_directories
    
    # 迁移文件
    migrate_frontend
    migrate_backend
    
    # 清理错误目录
    cleanup_wrong_dirs
    
    echo -e "\n${GREEN}迁移完成${NC}"
    echo -e "${YELLOW}请检查 $CORRECT_ROOT 目录下的文件是否正确${NC}"
}

# 执行主函数
main 