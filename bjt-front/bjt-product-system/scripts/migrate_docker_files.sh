#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/zuodao/BLP/product-management-system/bjt-front"
CORRECT_ROOT="$PROJECT_ROOT/bjt-product-system"

# 创建必要的 Docker 目录结构
create_docker_directories() {
    echo -e "${YELLOW}创建 Docker 目录结构...${NC}"
    
    mkdir -p "$CORRECT_ROOT/docker/frontend"
    mkdir -p "$CORRECT_ROOT/docker/nginx/conf.d"
    mkdir -p "$CORRECT_ROOT/docker/mysql/conf.d"
    mkdir -p "$CORRECT_ROOT/docker/mysql/data"
    mkdir -p "$CORRECT_ROOT/docker/wordpress"
    
    echo -e "${GREEN}Docker 目录结构创建完成${NC}"
}

# 迁移 Docker 文件
migrate_docker_files() {
    echo -e "${YELLOW}迁移 Docker 文件...${NC}"
    
    # 迁移 docker-compose 文件
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        cp "$PROJECT_ROOT/docker-compose.yml" "$CORRECT_ROOT/"
        echo -e "${GREEN}已迁移 docker-compose.yml${NC}"
    fi
    
    if [ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]; then
        cp "$PROJECT_ROOT/docker-compose.prod.yml" "$CORRECT_ROOT/"
        echo -e "${GREEN}已迁移 docker-compose.prod.yml${NC}"
    fi
    
    # 迁移 Dockerfile
    if [ -f "$PROJECT_ROOT/Dockerfile.frontend" ]; then
        cp "$PROJECT_ROOT/Dockerfile.frontend" "$CORRECT_ROOT/docker/frontend/Dockerfile"
        echo -e "${GREEN}已迁移 Dockerfile.frontend${NC}"
    fi
    
    # 迁移 docker 目录下的所有文件
    if [ -d "$PROJECT_ROOT/docker" ]; then
        cp -r "$PROJECT_ROOT/docker/"* "$CORRECT_ROOT/docker/"
        echo -e "${GREEN}已迁移 docker 目录下的文件${NC}"
    fi
}

# 检查并创建配置文件
create_config_files() {
    echo -e "${YELLOW}检查并创建配置文件...${NC}"
    
    # 创建 nginx.conf 如果不存在
    if [ ! -f "$CORRECT_ROOT/docker/nginx/nginx.conf" ]; then
        echo "user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/conf.d/*.conf;
}" > "$CORRECT_ROOT/docker/nginx/nginx.conf"
        echo -e "${GREEN}已创建 nginx.conf${NC}"
    fi
    
    # 创建 php.ini 如果不存在
    if [ ! -f "$CORRECT_ROOT/docker/wordpress/php.ini" ]; then
        echo "; Custom PHP configuration
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
memory_limit = 256M" > "$CORRECT_ROOT/docker/wordpress/php.ini"
        echo -e "${GREEN}已创建 php.ini${NC}"
    fi
}

# 更新 docker-compose.yml 中的路径
update_docker_compose() {
    echo -e "${YELLOW}更新 docker-compose.yml 中的路径...${NC}"
    
    if [ -f "$CORRECT_ROOT/docker-compose.yml" ]; then
        # 使用 sed 替换路径（这里需要根据实际情况调整）
        sed -i '' 's|./frontend|./bjt-front|g' "$CORRECT_ROOT/docker-compose.yml"
        sed -i '' 's|./backend|./bjt-product-admin|g' "$CORRECT_ROOT/docker-compose.yml"
        echo -e "${GREEN}已更新 docker-compose.yml 中的路径${NC}"
    fi
}

# 主函数
main() {
    echo -e "${YELLOW}开始迁移 Docker 文件...${NC}\n"
    
    create_docker_directories
    migrate_docker_files
    create_config_files
    update_docker_compose
    
    echo -e "\n${GREEN}Docker 文件迁移完成${NC}"
    echo -e "${YELLOW}请检查 $CORRECT_ROOT/docker 目录下的文件是否正确${NC}"
}

# 执行主函数
main 