#!/bin/bash

# 等待服务启动脚本

set -e

echo "⏳ 等待MySQL数据库启动..."
until curl -f http://mysql-test:3306 2>/dev/null || mysqladmin ping -h mysql-test -u root -pbjt_test_password123 2>/dev/null; do
  echo "MySQL还未准备就绪，等待5秒..."
  sleep 5
done
echo "✅ MySQL数据库已启动"

echo "⏳ 等待WordPress服务启动..."
until curl -f http://wordpress-test/wp-admin/ 2>/dev/null; do
  echo "WordPress还未准备就绪，等待5秒..."
  sleep 5
done
echo "✅ WordPress服务已启动"

echo "⏳ 检查API端点..."
until curl -f http://wordpress-test/wp-json/bjt/v1/relations?per_page=1 2>/dev/null; do
  echo "API端点还未就绪，等待5秒..."
  sleep 5
done
echo "✅ API端点已就绪" 