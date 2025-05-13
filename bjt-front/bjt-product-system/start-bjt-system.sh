#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== BJT产品管理系统 完整启动脚本 ===${NC}"

# 检查Docker是否安装并运行
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装，请先安装Docker${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}错误: Docker未运行，请先启动Docker${NC}"
    exit 1
fi

# 确保所需目录存在
if [ ! -d "wordpress" ]; then
    echo -e "${YELLOW}WordPress目录不存在，正在创建...${NC}"
    mkdir -p wordpress
fi

if [ ! -d "plugins" ]; then
    echo -e "${YELLOW}plugins目录不存在，正在创建...${NC}"
    mkdir -p plugins
fi

# 确保WordPress重定向主题目录存在
if [ ! -d "wordpress/wp-content/themes/bjt-redirect" ]; then
    echo -e "${YELLOW}创建WordPress重定向主题目录...${NC}"
    mkdir -p wordpress/wp-content/themes/bjt-redirect
fi

# 停止可能正在运行的容器
echo -e "${YELLOW}停止可能正在运行的容器...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml down

# 启动开发环境
echo -e "${YELLOW}启动开发环境...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 15

# 检查WordPress是否需要初始化
if ! docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp core is-installed --allow-root; then
    echo -e "${YELLOW}WordPress尚未安装，开始初始化...${NC}"
    # 初始化WordPress
    docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress bash -c "
        echo '开始安装WordPress...'
        wp core install \
            --url=localhost:8080 \
            --title='BJT产品管理系统' \
            --admin_user=admin \
            --admin_password=password \
            --admin_email=admin@example.com \
            --path=/var/www/html \
            --allow-root
        
        echo '配置WordPress...'
        wp config set WP_DEBUG false --raw --allow-root
        wp rewrite structure '/%postname%/' --allow-root
        wp rewrite flush --allow-root
    "
fi

# 确保重定向主题文件存在
if [ ! -f "wordpress/wp-content/themes/bjt-redirect/style.css" ]; then
    echo -e "${YELLOW}创建重定向主题文件...${NC}"
    
    # 创建主题文件
    cat > wordpress/wp-content/themes/bjt-redirect/style.css << EOL
/*
Theme Name: BJT Frontend Redirect
Theme URI: http://localhost:5173
Author: BJT Development Team
Author URI: http://localhost:5173
Description: This theme redirects visitors to the BJT Product Management System React frontend app.
Version: 1.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: bjt-redirect
*/

/* This file is only used for WordPress theme detection */
EOL
    
    # 创建functions.php
    cat > wordpress/wp-content/themes/bjt-redirect/functions.php << EOL
<?php
/**
 * BJT Frontend Redirect functions and definitions
 *
 * @package BJT_Frontend_Redirect
 */

// 禁止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 重定向到前端应用
 */
function bjt_redirect_to_frontend() {
    // 不要重定向管理员区域、登录页面、API请求和REST API请求
    if (is_admin() || 
        strpos(\$_SERVER['REQUEST_URI'], '/wp-login.php') !== false ||
        strpos(\$_SERVER['REQUEST_URI'], '/wp-json/') !== false ||
        strpos(\$_SERVER['REQUEST_URI'], '/api/') !== false) {
        return;
    }
    
    // 设置重定向到React前端应用
    \$frontend_url = 'http://localhost:5173';
    
    // 执行重定向
    wp_redirect(\$frontend_url);
    exit;
}

// 添加到WordPress的template_redirect钩子
add_action('template_redirect', 'bjt_redirect_to_frontend');

/**
 * 允许跨域请求，使前端可以访问WordPress API
 */
function bjt_add_cors_headers() {
    // 允许从前端访问
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 如果是预检请求，直接返回
    if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }
}

// 添加到WordPress的send_headers钩子
add_action('send_headers', 'bjt_add_cors_headers');
EOL
    
    # 创建index.php
    cat > wordpress/wp-content/themes/bjt-redirect/index.php << EOL
<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 *
 * @package BJT_Frontend_Redirect
 */

// 如果直接访问此文件，重定向到React前端
if (!defined('ABSPATH')) {
    header("Location: http://localhost:5173");
    exit;
}

// 这应该不会被执行，因为functions.php中的钩子会先执行重定向
get_header();
?>

<div style="text-align: center; margin: 100px auto; max-width: 600px; font-family: Arial, sans-serif;">
    <h1>正在重定向到BJT产品管理系统...</h1>
    <p>如果您没有被自动重定向，请<a href="http://localhost:5173">点击此处</a>访问产品管理系统。</p>
    <script>
        window.location.href = "http://localhost:5173";
    </script>
</div>

<?php
get_footer();
EOL
fi

# 激活重定向主题
echo -e "${YELLOW}激活重定向主题...${NC}"
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp theme activate bjt-redirect --allow-root

# 检查服务健康状态
echo -e "${YELLOW}检查服务健康状态...${NC}"
MYSQL_HEALTHY=$(docker-compose -f docker/dev/docker-compose.dev.yml ps | grep mysql | grep -i "healthy" | wc -l)
WP_HEALTHY=$(docker-compose -f docker/dev/docker-compose.dev.yml ps | grep wordpress | grep -i "healthy" | wc -l)
FRONTEND_READY=$(docker-compose -f docker/dev/docker-compose.dev.yml logs frontend | grep -i "Network:" | wc -l)

if [ $MYSQL_HEALTHY -gt 0 ] && [ $WP_HEALTHY -gt 0 ] && [ $FRONTEND_READY -gt 0 ]; then
    echo -e "${GREEN}所有服务已成功启动!${NC}"
    echo -e "${GREEN}前端访问地址: ${NC}http://localhost:5173"
    echo -e "${GREEN}WordPress前台将重定向到React前端: ${NC}http://localhost:8080/ -> http://localhost:5173"
    echo -e "${GREEN}WordPress管理后台: ${NC}http://localhost:8080/wp-admin/"
    echo -e "${GREEN}WordPress用户名: ${NC}admin"
    echo -e "${GREEN}WordPress密码: ${NC}password"
    echo -e "${GREEN}MySQL数据库: ${NC}bjt_product"
    echo -e "${GREEN}MySQL用户名: ${NC}wordpress"
    echo -e "${GREEN}MySQL密码: ${NC}wordpress"
    echo -e "${GREEN}MySQL Root密码: ${NC}root"
else
    echo -e "${YELLOW}一些服务可能尚未完全启动，但应该很快就会可用。${NC}"
    echo -e "${GREEN}前端访问地址: ${NC}http://localhost:5173"
    echo -e "${GREEN}WordPress管理后台: ${NC}http://localhost:8080/wp-admin/"
    echo -e "${GREEN}WordPress用户名: ${NC}admin"
    echo -e "${GREEN}WordPress密码: ${NC}password"
fi 