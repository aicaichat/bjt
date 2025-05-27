#!/bin/bash

# Docker构建测试脚本

set -e

echo "测试Docker构建配置..."

# 设置测试环境变量
export DOMAIN_NAME="localhost"
export MYSQL_ROOT_PASSWORD="test123"
export MYSQL_DATABASE="bjt_product"
export MYSQL_USER="wordpress"
export MYSQL_PASSWORD="test123"

echo "1. 测试前端Dockerfile构建..."
cd frontend
docker build -f Dockerfile.prod -t test-frontend .
cd ..

echo "2. 测试WordPress Dockerfile构建..."
docker build -f docker/wordpress/Dockerfile.prod -t test-wordpress docker/wordpress/

echo "3. 测试Nginx Dockerfile构建..."
docker build -f docker/nginx/Dockerfile.prod --build-arg VITE_API_URL=https://localhost/wp-json/bjt/v1 -t test-nginx .

echo "4. 测试Docker Compose配置验证..."
docker-compose -f docker/prod/docker-compose.prod.yml config

echo "所有Docker构建测试通过！"

# 清理测试镜像
echo "清理测试镜像..."
docker rmi test-frontend test-wordpress test-nginx || true

echo "测试完成！" 