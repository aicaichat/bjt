#!/bin/bash

# 设置颜色变量
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}启动开发环境...${NC}"

# 检查环境变量文件
if [ ! -f .env.development ]; then
  echo -e "${YELLOW}未找到 .env.development 文件，将创建默认配置${NC}"
  cat > .env.development << 'EOF'
# 数据库配置
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress

# WordPress 配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress
WORDPRESS_DEBUG=1

# 前端配置
NODE_ENV=development
VITE_API_URL=http://localhost:8080
EOF
fi

# 启动 Docker 容器
echo -e "${GREEN}启动 Docker 容器...${NC}"
docker compose -f docker/dev/docker-compose.nginx.yml up -d

# 等待容器启动完成
echo -e "${GREEN}等待服务启动完成...${NC}"
sleep 5

# 提供访问信息
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}开发环境已启动!${NC}"
echo -e "${GREEN}前端界面: ${YELLOW}http://localhost:80${NC}"
echo -e "${GREEN}WordPress 后台: ${YELLOW}http://localhost:8080/wp-admin/${NC}"
echo -e "${GREEN}API 接口: ${YELLOW}http://localhost:8080/wp-json/${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}如需停止环境，请运行: ${YELLOW}docker compose -f docker/dev/docker-compose.nginx.yml down${NC}" 