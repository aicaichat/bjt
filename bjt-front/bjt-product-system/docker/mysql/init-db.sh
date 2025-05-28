#!/bin/bash
# MySQL容器启动时的数据库初始化脚本

set -e

echo "开始初始化BJT产品管理系统数据库..."

# 等待MySQL服务完全启动
echo "等待MySQL服务启动..."
until mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    echo "MySQL服务尚未就绪，继续等待..."
    sleep 3
done

echo "MySQL服务已启动，开始数据库初始化..."

# 检查是否已经初始化过
INIT_CHECK=$(mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = '$MYSQL_DATABASE' 
    AND table_name = 'wp_bjt_product_lines';" 2>/dev/null | tail -n 1)

if [ "$INIT_CHECK" = "0" ]; then
    echo "首次启动，开始初始化数据库结构和数据..."
    
    # 1. 确保数据库存在
    mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
        CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    "
    echo "数据库 $MYSQL_DATABASE 已确保存在"
    
    # 2. 初始化BJT插件的数据库结构
    if [ -f "/docker-entrypoint-initdb.d/init.sql" ]; then
        echo "导入数据库结构..."
        mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/init.sql
        echo "数据库结构导入完成"
    else
        echo "警告: init.sql 文件不存在，跳过数据库结构初始化"
    fi
    
    # 3. 导入设备数据
    if [ -f "/docker-entrypoint-initdb.d/_设备.sql" ]; then
        echo "导入设备数据..."
        mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/_设备.sql
        echo "设备数据导入完成"
    else
        echo "警告: _设备.sql 文件不存在，跳过设备数据导入"
    fi
    
    # 4. 导入耗材数据
    if [ -f "/docker-entrypoint-initdb.d/_耗材.sql" ]; then
        echo "导入耗材数据..."
        mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/_耗材.sql
        echo "耗材数据导入完成"
    else
        echo "警告: _耗材.sql 文件不存在，跳过耗材数据导入"
    fi
    
    # 5. 导入测试用户数据
    if [ -f "/docker-entrypoint-initdb.d/_test_users.sql" ]; then
        echo "导入测试用户数据..."
        mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /docker-entrypoint-initdb.d/_test_users.sql
        echo "测试用户数据导入完成"
    else
        echo "警告: _test_users.sql 文件不存在，跳过测试用户数据导入"
    fi
    
    # 6. 验证初始化结果
    echo "验证数据库初始化结果..."
    TABLE_COUNT=$(mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '$MYSQL_DATABASE' 
        AND table_name LIKE 'wp_bjt_%';" 2>/dev/null | tail -n 1)
    
    echo "BJT相关表数量: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt "0" ]; then
        echo "✅ 数据库初始化成功完成！"
    else
        echo "❌ 数据库初始化可能失败，请检查日志"
        exit 1
    fi
else
    echo "数据库已经初始化过（找到 $INIT_CHECK 个wp_bjt_product_lines表），跳过初始化步骤。"
fi

echo "🎉 BJT产品管理系统数据库准备就绪！" 