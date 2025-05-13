#!/bin/bash

# 启动PHP-FPM
php-fpm -D

# 等待PHP-FPM启动
sleep 2
echo "PHP-FPM 已启动"

# 初始化WordPress权限
chown -R www-data:www-data /var/www/html

# 启动Nginx
echo "启动Nginx服务器..."
nginx -g "daemon off;" 