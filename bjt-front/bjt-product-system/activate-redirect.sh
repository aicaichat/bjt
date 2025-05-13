#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统 重定向主题激活脚本 ===${NC}"

# 检查服务是否正在运行
echo -e "${YELLOW}检查服务状态...${NC}"
if ! docker-compose -f docker/dev/docker-compose.dev.yml ps | grep -q "wordpress.*Up"; then
    echo -e "${RED}WordPress 容器未运行，请先运行 start-dev.sh 启动环境${NC}"
    exit 1
fi

# 激活我们的重定向主题
echo -e "${YELLOW}激活重定向主题...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress bash -c "
    # 确保主题文件存在
    if [ ! -d '/var/www/html/wp-content/themes/bjt-redirect' ]; then
        echo '错误：未找到bjt-redirect主题目录'
        exit 1
    fi
    
    # 激活主题
    echo '激活重定向主题...'
    wp theme activate bjt-redirect --allow-root
    
    # 启用固定链接
    echo '更新固定链接结构...'
    wp rewrite structure '/%postname%/' --allow-root
    wp rewrite flush --allow-root
    
    # 确保首页正确设置
    echo '检查首页设置...'
    HOME_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='首页' --field=ID --allow-root)
    if [ -n \"\$HOME_ID\" ]; then
        wp option update page_on_front \$HOME_ID --allow-root
        wp option update show_on_front 'page' --allow-root
    fi
    
    # 添加REST API设置
    echo '配置REST API设置...'
    wp option update permalink_structure '/%postname%/' --allow-root
"

# 检查结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}重定向主题激活成功!${NC}"
    echo -e "${GREEN}现在访问 ${NC}http://localhost:8080/ ${GREEN}将被重定向到${NC} http://localhost:5173"
    echo -e "${GREEN}WordPress 管理后台仍可通过以下地址访问:${NC} http://localhost:8080/wp-admin/"
else
    echo -e "${RED}重定向主题激活过程中出错，请查看上方日志${NC}"
fi 