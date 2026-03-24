#!/bin/bash
# 检查Nginx路由和文件位置，诊断uploads 404问题

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}=== Nginx路由和文件位置诊断 ===${NC}\n"

# 1. 检查Nginx是否在Docker中运行
echo -e "${YELLOW}1. 检查Nginx容器状态${NC}"
if $COMPOSE ps nginx | grep -q "Up"; then
    echo -e "${GREEN}✅ Nginx容器正在运行${NC}"
    NGINX_CONTAINER=$($COMPOSE ps -q nginx)
    echo "   容器ID: $NGINX_CONTAINER"
else
    echo -e "${RED}❌ Nginx容器未运行${NC}"
    exit 1
fi
echo ""

# 2. 检查Nginx容器内的uploads目录
echo -e "${YELLOW}2. 检查Nginx容器内的uploads目录结构${NC}"
echo "   路径: /usr/share/nginx/html/uploads/"
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | head -10 || echo -e "${RED}   ❌ 目录不存在或为空${NC}"
echo ""

# 3. 检查WordPress容器内的文件位置
echo -e "${YELLOW}3. 检查WordPress容器内的文件位置${NC}"
echo "   路径1: /var/www/html/frontend/public/uploads/product-lines/images/"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -10 || echo -e "${YELLOW}   ⚠️  目录不存在${NC}"
echo ""
echo "   路径2: /var/www/html/wp-content/uploads/product-lines/images/"
$COMPOSE exec wordpress ls -la /var/www/html/wp-content/uploads/product-lines/images/ 2>/dev/null | head -10 || echo -e "${YELLOW}   ⚠️  目录不存在${NC}"
echo ""

# 4. 检查volume挂载点
echo -e "${YELLOW}4. 检查uploads_data volume${NC}"
VOLUME_NAME="bjt-product-system_uploads_data"
if docker volume inspect "$VOLUME_NAME" &>/dev/null; then
    VOLUME_PATH=$(docker volume inspect "$VOLUME_NAME" | grep -oP '(?<="Mountpoint": ")[^"]+')
    echo -e "${GREEN}✅ Volume存在${NC}"
    echo "   Mountpoint: $VOLUME_PATH"
    echo "   检查volume中的文件:"
    docker run --rm -v "$VOLUME_NAME:/data" alpine ls -la /data/product-lines/images/ 2>/dev/null | head -10 || echo -e "${YELLOW}   ⚠️  volume中不存在product-lines目录${NC}"
else
    echo -e "${RED}❌ Volume不存在${NC}"
fi
echo ""

# 5. 检查Nginx配置中的路由
echo -e "${YELLOW}5. 检查Nginx配置中的uploads路由${NC}"
echo "   检查 /uploads/ location配置:"
$COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null | grep -A 10 "location /uploads/" || echo -e "${RED}   ❌ 无法读取配置${NC}"
echo ""

# 6. 测试Nginx是否能访问WordPress容器
echo -e "${YELLOW}6. 测试Nginx到WordPress的网络连接${NC}"
if $COMPOSE exec nginx ping -c 1 wordpress &>/dev/null; then
    echo -e "${GREEN}✅ Nginx可以访问WordPress容器${NC}"
else
    echo -e "${RED}❌ Nginx无法访问WordPress容器${NC}"
fi
echo ""

# 7. 检查实际请求路径
echo -e "${YELLOW}7. 检查请求路径映射${NC}"
echo "   请求URL: /uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
echo "   解码后: /uploads/product_lines/Water Activated Tape Dispenser.jpg"
echo ""
echo "   Nginx查找路径:"
echo "   1. /usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg"
echo "   2. 如果不存在，代理到WordPress: http://wordpress:80/uploads/product_lines/..."
echo ""

# 8. 检查WordPress容器内的实际文件
echo -e "${YELLOW}8. 查找包含'Water'的文件${NC}"
echo "   在WordPress容器中搜索:"
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -iname "*water*" -type f 2>/dev/null | head -5 || echo -e "${YELLOW}   ⚠️  未找到文件${NC}"
$COMPOSE exec wordpress find /var/www/html/wp-content/uploads -iname "*water*" -type f 2>/dev/null | head -5 || echo -e "${YELLOW}   ⚠️  未找到文件${NC}"
echo ""

# 9. 检查Nginx的try_files配置是否正确
echo -e "${YELLOW}9. 检查Nginx try_files配置${NC}"
NGINX_CONFIG=$($COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null)
if echo "$NGINX_CONFIG" | grep -q "try_files.*@wordpress_uploads"; then
    echo -e "${GREEN}✅ try_files配置存在${NC}"
    echo "   配置: try_files \$uri @wordpress_uploads;"
    echo ""
    echo -e "${YELLOW}   注意: 在location块中使用alias时，try_files的行为可能不同${NC}"
    echo "   - alias会改变文件查找的根路径"
    echo "   - try_files需要相对于alias路径"
else
    echo -e "${RED}❌ try_files配置不存在${NC}"
fi
echo ""

# 10. 测试实际HTTP请求
echo -e "${YELLOW}10. 测试HTTP请求（如果可能）${NC}"
echo "   从Nginx容器内部测试:"
$COMPOSE exec nginx curl -I http://localhost/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg 2>/dev/null | head -5 || echo -e "${YELLOW}   ⚠️  无法测试（可能需要实际域名）${NC}"
echo ""

# 总结
echo -e "${BLUE}=== 诊断总结 ===${NC}\n"
echo "关键发现："
echo "1. Nginx配置了 try_files \$uri @wordpress_uploads;"
echo "2. 如果Nginx找不到文件，应该会代理到WordPress"
echo "3. 但需要确认："
echo "   - WordPress容器内文件是否存在？"
echo "   - WordPress的web服务器能否访问 /var/www/html/frontend/public/uploads/？"
echo "   - Nginx的try_files在alias location中是否正确工作？"
echo ""
echo -e "${YELLOW}建议：${NC}"
echo "1. 检查WordPress容器的Apache/Nginx配置，确认web根目录"
echo "2. 检查Nginx的try_files在alias location中的行为"
echo "3. 考虑修改Nginx配置，直接代理到WordPress的frontend目录"
