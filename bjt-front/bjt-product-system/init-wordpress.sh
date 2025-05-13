#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统 WordPress 初始化脚本 ===${NC}"

# 检查服务是否正在运行
echo -e "${YELLOW}检查服务状态...${NC}"
if ! docker-compose -f docker/dev/docker-compose.dev.yml ps | grep -q "wordpress.*Up"; then
    echo -e "${RED}WordPress 容器未运行，请先运行 start-dev.sh 启动环境${NC}"
    exit 1
fi

# 重置 WordPress 安装
echo -e "${YELLOW}重置 WordPress 安装...${NC}"

# 进入 WordPress 容器执行安装
echo -e "${YELLOW}开始安装 WordPress...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress bash -c "
    # 等待 MySQL 完全启动
    echo '正在等待数据库连接...'
    sleep 5
    
    # 检查是否已安装
    if wp core is-installed --allow-root --path=/var/www/html; then
        echo '删除现有 WordPress 安装...'
        wp db reset --yes --allow-root --path=/var/www/html
    fi
    
    # 安装 WordPress
    echo '开始安装 WordPress...'
    wp core install \
        --url=localhost:8080 \
        --title='BJT产品管理系统' \
        --admin_user=admin \
        --admin_password=password \
        --admin_email=admin@example.com \
        --path=/var/www/html \
        --allow-root
    
    # 启用调试模式
    echo '配置调试模式...'
    wp config set WP_DEBUG true --raw --allow-root --path=/var/www/html
    
    # 安装必要插件
    echo '安装和激活必要插件...'
    wp plugin install rest-api --activate --allow-root --path=/var/www/html
    
    # 更新固定链接
    echo '更新固定链接结构...'
    wp rewrite structure '/%postname%/' --allow-root --path=/var/www/html
    
    # 确保 WordPress 目录权限正确
    echo '设置文件权限...'
    chmod -R 755 /var/www/html
    chown -R www-data:www-data /var/www/html
"

# 检查安装结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}WordPress 安装和配置成功!${NC}"
    echo -e "${GREEN}WordPress 前台地址: ${NC}http://localhost:8080/"
    echo -e "${GREEN}WordPress 管理后台: ${NC}http://localhost:8080/wp-admin/"
    echo -e "${GREEN}管理员用户名: ${NC}admin"
    echo -e "${GREEN}管理员密码: ${NC}password"
else
    echo -e "${RED}WordPress 安装过程中出错，请查看上方日志${NC}"
fi 