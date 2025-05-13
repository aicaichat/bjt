#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统 WordPress API 修复脚本 ===${NC}"

# 检查服务是否正在运行
echo -e "${YELLOW}检查服务状态...${NC}"
if ! docker-compose -f docker/dev/docker-compose.dev.yml ps | grep -q "wordpress.*Up"; then
    echo -e "${RED}WordPress 容器未运行，请先运行 start-dev.sh 启动环境${NC}"
    exit 1
fi

# 修复WordPress API
echo -e "${YELLOW}开始修复 WordPress REST API...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress bash -c "
    # 为.htaccess文件赋予写权限
    chmod 666 /var/www/html/.htaccess 2>/dev/null || touch /var/www/html/.htaccess && chmod 666 /var/www/html/.htaccess
    
    # 更新固定链接设置
    echo '更新固定链接设置...'
    wp option update permalink_structure '/%postname%/' --allow-root
    
    # 确保WP_REWRITE_RULES选项在数据库中
    echo '启用REST API重写规则...'
    wp rewrite structure '/%postname%/' --allow-root
    
    # 确保REST API可用
    echo '启用REST API...'
    wp option update rest_enabled 1 --allow-root
    
    # 确保WordPress版本正确显示，以使REST API可用
    echo '检查WordPress版本...'
    WP_VERSION=\$(wp core version --allow-root)
    echo \"WordPress版本: \$WP_VERSION\"
    
    # 添加到wp-config.php中启用REST API的配置
    echo '更新wp-config.php...'
    if ! grep -q 'REST_API_VERSION' /var/www/html/wp-config.php; then
        wp config set REST_API_VERSION 2 --raw --allow-root
    fi
    
    # 更新.htaccess文件
    echo '更新.htaccess文件...'
    cat > /var/www/html/.htaccess << EOL
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
EOL
    
    # 确保Apache rewrite模块已启用
    if [ -f /etc/apache2/mods-available/rewrite.load ]; then
        echo '启用Apache rewrite模块...'
        ln -sf /etc/apache2/mods-available/rewrite.load /etc/apache2/mods-enabled/ 2>/dev/null
    fi
    
    # 使用Apache配置
    cat > /etc/apache2/sites-available/000-default.conf << EOL
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOL
    
    # 重启Apache以应用更改
    if command -v apache2ctl &> /dev/null; then
        echo '重启Apache...'
        apache2ctl graceful
    else
        echo '尝试使用service重启Apache...'
        service apache2 restart || /etc/init.d/apache2 restart || echo '无法重启Apache，请手动重启容器'
    fi
    
    # 测试REST API是否可访问
    echo '测试REST API...'
    if command -v curl &> /dev/null; then
        curl -s http://localhost/wp-json/ | head -20
    else
        echo 'curl工具不可用，无法测试API'
    fi
"

echo -e "${GREEN}WordPress REST API 修复尝试完成!${NC}"
echo -e "${YELLOW}为确保更改生效，请重启WordPress容器:${NC}"
echo -e "${YELLOW}docker-compose -f docker/dev/docker-compose.dev.yml restart wordpress${NC}"
echo -e "${GREEN}然后在浏览器中访问: ${NC}http://localhost:8080/wp-json/"
echo -e "${GREEN}如果仍然返回404，请尝试下面的命令重启整个开发环境:${NC}"
echo -e "${YELLOW}./start-bjt-system.sh${NC}" 