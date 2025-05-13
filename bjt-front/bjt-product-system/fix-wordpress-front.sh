#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统 WordPress 前台修复脚本 ===${NC}"

# 检查服务是否正在运行
echo -e "${YELLOW}检查服务状态...${NC}"
if ! docker-compose -f docker/dev/docker-compose.dev.yml ps | grep -q "wordpress.*Up"; then
    echo -e "${RED}WordPress 容器未运行，请先运行 start-dev.sh 启动环境${NC}"
    exit 1
fi

# 执行WordPress前台修复
echo -e "${YELLOW}开始修复 WordPress 前台...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress bash -c "
    # 安装更适合菜单的主题
    echo '安装适合的主题...'
    wp theme install twentytwentyone --activate --allow-root
    
    # 创建首页内容
    echo '创建示例页面内容...'
    wp post create --post_type=page --post_title='首页' --post_status=publish --post_author=1 --page_template='default' --allow-root
    wp post create --post_type=page --post_title='关于我们' --post_status=publish --post_author=1 --page_template='default' --allow-root
    wp post create --post_type=page --post_title='产品' --post_status=publish --post_author=1 --page_template='default' --allow-root
    wp post create --post_type=page --post_title='联系方式' --post_status=publish --post_author=1 --page_template='default' --allow-root
    
    # 创建示例博客内容
    echo '创建示例博客内容...'
    wp post create --post_type=post --post_title='欢迎使用BJT产品管理系统' --post_content='这是一个示例文章，用于测试WordPress前台是否正常工作。' --post_status=publish --post_author=1 --allow-root
    
    # 设置首页
    echo '设置首页...'
    HOME_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='首页' --field=ID --allow-root)
    wp option update page_on_front \$HOME_ID --allow-root
    wp option update show_on_front 'page' --allow-root
    
    # 创建导航菜单
    echo '创建导航菜单...'
    wp menu create '主导航' --allow-root
    
    # 添加页面到导航
    HOME_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='首页' --field=ID --allow-root)
    ABOUT_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='关于我们' --field=ID --allow-root)
    PRODUCT_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='产品' --field=ID --allow-root)
    CONTACT_ID=\$(wp post list --post_type=page --post_status=publish --posts_per_page=1 --post_title='联系方式' --field=ID --allow-root)
    
    wp menu item add-post 主导航 \$HOME_ID --title='首页' --allow-root
    wp menu item add-post 主导航 \$ABOUT_ID --title='关于我们' --allow-root
    wp menu item add-post 主导航 \$PRODUCT_ID --title='产品' --allow-root
    wp menu item add-post 主导航 \$CONTACT_ID --title='联系方式' --allow-root
    
    # 查看可用菜单位置
    echo '获取可用的菜单位置...'
    wp menu location list --allow-root
    
    # 设置导航菜单位置 (使用twenty twenty-one主题的菜单位置)
    wp menu location assign 主导航 primary --allow-root
    
    # 更新固定链接结构（确保伪静态正常工作）
    echo '更新固定链接...'
    wp rewrite structure '/%postname%/' --allow-root
    wp rewrite flush --allow-root
    
    # 关闭调试模式
    echo '关闭调试模式...'
    wp config set WP_DEBUG false --raw --allow-root
    
    # 刷新缓存
    echo '刷新缓存...'
    wp cache flush --allow-root
"

# 检查安装结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}WordPress 前台修复成功!${NC}"
    echo -e "${GREEN}现在可以访问: ${NC}http://localhost:8080/"
    echo -e "${GREEN}WordPress 管理后台: ${NC}http://localhost:8080/wp-admin/"
else
    echo -e "${RED}WordPress 前台修复过程中出错，请查看上方日志${NC}"
fi 