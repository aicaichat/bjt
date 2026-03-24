#!/bin/bash
# 验证uploads文件修复

set -e

cd /var/bjt/bjt/bjt-front/bjt-product-system

COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

echo "=== 验证uploads文件修复 ==="
echo ""

# 1. 检查本地文件
echo "1. 检查本地文件"
echo "----------------------------------------"
ls -la frontend/public/uploads/product_lines/ | head -5

# 2. 检查容器内文件
echo ""
echo "2. 检查WordPress容器内文件"
echo "----------------------------------------"
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/ 2>/dev/null | head -5 || echo "  ❌ 容器内文件不存在"

# 3. 测试WordPress内部访问
echo ""
echo "3. 测试WordPress内部访问"
echo "----------------------------------------"
echo "  测试: http://wordpress:80/frontend/public/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
wp_response=$($COMPOSE exec nginx curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://wordpress:80/frontend/public/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null || echo "000")
if [ "$wp_response" = "200" ]; then
    echo "  ✅ WordPress可以访问文件 (HTTP $wp_response)"
else
    echo "  ⚠️  WordPress访问状态码: $wp_response"
fi

# 4. 测试Nginx代理
echo ""
echo "4. 测试Nginx代理"
echo "----------------------------------------"
echo "  测试: http://localhost/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
nginx_response=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://localhost/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null || echo "000")
if [ "$nginx_response" = "200" ]; then
    echo "  ✅ Nginx可以访问文件 (HTTP $nginx_response)"
else
    echo "  ⚠️  Nginx访问状态码: $nginx_response"
fi

# 5. 测试HTTPS访问
echo ""
echo "5. 测试HTTPS访问"
echo "----------------------------------------"
echo "  测试: https://bjt.nh.cool/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
https_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://bjt.nh.cool/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null || echo "000")
if [ "$https_response" = "200" ]; then
    echo "  ✅ HTTPS可以访问文件 (HTTP $https_response)"
else
    echo "  ⚠️  HTTPS访问状态码: $https_response"
fi

# 6. 检查Apache Alias配置
echo ""
echo "6. 检查Apache Alias配置"
echo "----------------------------------------"
apache_alias=$($COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "Alias.*uploads" || echo "")
if [ -n "$apache_alias" ]; then
    echo "  ✅ Apache Alias配置存在"
    echo "$apache_alias" | sed 's/^/    /'
else
    echo "  ⚠️  Apache Alias配置不存在（可能需要重新构建镜像）"
fi

# 7. 检查Nginx配置
echo ""
echo "7. 检查Nginx配置"
echo "----------------------------------------"
nginx_config=$($COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf 2>/dev/null | grep -A 10 "location /uploads/" | head -15)
if echo "$nginx_config" | grep -q "proxy_pass.*wordpress"; then
    echo "  ✅ Nginx配置正确（代理到WordPress）"
else
    echo "  ⚠️  Nginx配置可能需要检查"
fi

echo ""
echo "=== 总结 ==="
echo ""
if [ "$wp_response" = "200" ] && [ "$nginx_response" = "200" ]; then
    echo "✅ 文件修复成功！"
    echo ""
    echo "如果CDN仍然返回404，需要："
    echo "1. 刷新CDN缓存"
    echo "2. 配置CDN不缓存404响应"
else
    echo "⚠️  需要进一步检查："
    echo "1. 如果WordPress返回非200，检查Apache配置"
    echo "2. 如果Nginx返回非200，检查Nginx配置"
    echo "3. 确保容器已重启使配置生效"
fi
