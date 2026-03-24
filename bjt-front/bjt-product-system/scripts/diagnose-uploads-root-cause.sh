#!/bin/bash
# 诊断uploads 404问题的根本原因

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 自动查找项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

# 检查.env.production文件
if [ -f ".env.production" ]; then
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
else
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
fi

echo -e "${BLUE}=== Uploads 404 根本原因诊断 ===${NC}\n"

# 1. 检查文件是否真的存在
echo -e "${YELLOW}1. 检查文件是否存在${NC}"
echo "   查找: Paper Cushioning Machine.jpg"
echo ""
echo "   1.1 WordPress容器 - frontend/public/uploads/product-lines/images/"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads/product-lines/images -iname "*paper*cushioning*" -o -iname "*cushioning*machine*" 2>/dev/null | head -5 || echo -e "   ${RED}❌ 未找到${NC}"
echo ""

echo "   1.2 WordPress容器 - frontend/public/uploads/product_lines/"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads/product_lines -iname "*paper*cushioning*" -o -iname "*cushioning*machine*" 2>/dev/null | head -5 || echo -e "   ${RED}❌ 未找到${NC}"
echo ""

echo "   1.3 WordPress容器 - wp-content/uploads/"
$COMPOSE exec wordpress find /var/www/html/wp-content/uploads -iname "*paper*cushioning*" -o -iname "*cushioning*machine*" 2>/dev/null | head -5 || echo -e "   ${RED}❌ 未找到${NC}"
echo ""

echo "   1.4 Nginx容器 - /usr/share/nginx/html/uploads/"
$COMPOSE exec nginx find /usr/share/nginx/html/uploads -iname "*paper*cushioning*" -o -iname "*cushioning*machine*" 2>/dev/null | head -5 || echo -e "   ${RED}❌ 未找到${NC}"
echo ""

# 2. 检查Nginx配置
echo -e "${YELLOW}2. 检查Nginx配置${NC}"
echo "   2.1 检查 /uploads/ location配置"
NGINX_UPLOADS=$($COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null | grep -A 25 "location /uploads/")
if echo "$NGINX_UPLOADS" | grep -q "try_files.*@wordpress_uploads"; then
    echo -e "   ${GREEN}✅ try_files配置存在${NC}"
else
    echo -e "   ${RED}❌ try_files配置不存在或错误${NC}"
fi
echo ""

echo "   2.2 检查 @wordpress_uploads location"
NGINX_WP=$($COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null | grep -A 15 "@wordpress_uploads")
if echo "$NGINX_WP" | grep -q "rewrite.*frontend/public/uploads"; then
    echo -e "   ${GREEN}✅ rewrite规则存在${NC}"
    echo "   Rewrite规则:"
    echo "$NGINX_WP" | grep "rewrite" | sed 's/^/      /'
else
    echo -e "   ${RED}❌ rewrite规则不存在或错误${NC}"
fi
echo ""

# 3. 检查Apache配置
echo -e "${YELLOW}3. 检查WordPress Apache配置${NC}"
echo "   3.1 检查Apache Alias配置"
APACHE_ALIAS=$($COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "Alias.*uploads")
if [ -n "$APACHE_ALIAS" ]; then
    echo -e "   ${GREEN}✅ Alias配置存在${NC}"
    echo "$APACHE_ALIAS" | sed 's/^/      /'
else
    echo -e "   ${RED}❌ Alias配置不存在${NC}"
    echo "   注意: 如果配置已修改但未生效，需要重新构建WordPress镜像"
fi
echo ""

echo "   3.2 检查DocumentRoot"
DOCROOT=$($COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "DocumentRoot")
echo "$DOCROOT" | sed 's/^/      /'
echo ""

# 4. 测试Nginx到WordPress的连接
echo -e "${YELLOW}4. 测试Nginx到WordPress的代理${NC}"
echo "   4.1 测试网络连接"
if $COMPOSE exec nginx ping -c 1 wordpress &>/dev/null; then
    echo -e "   ${GREEN}✅ Nginx可以访问WordPress容器${NC}"
else
    echo -e "   ${RED}❌ Nginx无法访问WordPress容器${NC}"
fi
echo ""

echo "   4.2 测试直接访问WordPress"
echo "   请求: http://wordpress:80/frontend/public/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg"
WP_RESPONSE=$($COMPOSE exec nginx curl -I "http://wordpress:80/frontend/public/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -1)
if echo "$WP_RESPONSE" | grep -q "200\|301\|302"; then
    echo -e "   ${GREEN}✅ WordPress可以访问文件${NC}"
    echo "   响应: $WP_RESPONSE"
else
    echo -e "   ${RED}❌ WordPress无法访问文件${NC}"
    echo "   响应: $WP_RESPONSE"
fi
echo ""

echo "   4.3 测试通过Alias访问"
echo "   请求: http://wordpress:80/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg"
WP_ALIAS_RESPONSE=$($COMPOSE exec nginx curl -I "http://wordpress:80/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -1)
if echo "$WP_ALIAS_RESPONSE" | grep -q "200\|301\|302"; then
    echo -e "   ${GREEN}✅ Apache Alias工作正常${NC}"
    echo "   响应: $WP_ALIAS_RESPONSE"
else
    echo -e "   ${YELLOW}⚠️  Apache Alias可能未生效${NC}"
    echo "   响应: $WP_ALIAS_RESPONSE"
fi
echo ""

# 5. 检查Nginx的try_files行为
echo -e "${YELLOW}5. 诊断Nginx try_files行为${NC}"
echo "   问题: 在alias location中，try_files的行为可能不符合预期"
echo "   当前配置:"
echo "     location /uploads/ {"
echo "       alias /usr/share/nginx/html/uploads/;"
echo "       try_files \$uri @wordpress_uploads;"
echo "     }"
echo ""
echo "   可能的问题:"
echo "   1. try_files在alias location中，\$uri仍然是原始URI"
echo "   2. 如果alias路径不存在，try_files可能不会正确跳转到named location"
echo "   3. 需要检查Nginx错误日志"
echo ""

# 6. 检查Nginx错误日志
echo -e "${YELLOW}6. 检查Nginx错误日志（最近10行）${NC}"
$COMPOSE exec nginx tail -10 /var/log/nginx/error.log 2>/dev/null | grep -i "upload\|404" || echo "   没有相关错误"
echo ""

# 7. 检查Apache错误日志
echo -e "${YELLOW}7. 检查Apache错误日志（最近10行）${NC}"
$COMPOSE exec wordpress tail -10 /var/log/apache2/error.log 2>/dev/null | grep -i "upload\|404\|alias" || echo "   没有相关错误"
echo ""

# 总结
echo -e "${BLUE}=== 诊断总结 ===${NC}\n"
echo "可能的原因:"
echo "1. 文件不存在 - 需要确认文件实际位置"
echo "2. Nginx try_files在alias location中行为异常"
echo "3. Apache Alias配置未生效（需要重新构建镜像）"
echo "4. 路径映射不正确（product_lines vs product-lines/images）"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 确认文件是否存在及位置"
echo "2. 检查配置是否已部署到容器"
echo "3. 查看错误日志获取详细信息"
