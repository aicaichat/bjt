#!/bin/bash
# 重新初始化数据库和用户表

echo "=== 重新初始化 BJT 数据库 ==="
echo ""

echo "步骤 1: 检查 MySQL 服务状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps mysql

echo ""
echo "步骤 2: 检查数据库连接..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "SHOW DATABASES;" 2>&1 | head -20

echo ""
echo "步骤 3: 检查 bjt 数据库是否存在..."
echo "----------------------------"
DB_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "SHOW DATABASES LIKE 'bjt';" 2>/dev/null)

if [ -n "$DB_EXISTS" ]; then
    echo "✅ bjt 数据库存在"
    
    echo ""
    echo "步骤 4: 检查表..."
    echo "----------------------------"
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SHOW TABLES;" 2>&1 | head -30
    
    echo ""
    echo "步骤 5: 检查是否有 wp_bjt_users 表..."
    echo "----------------------------"
    TABLE_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'bjt' AND table_name = 'wp_bjt_users';
    " 2>/dev/null)
    
    if [ "$TABLE_EXISTS" = "1" ]; then
        echo "✅ wp_bjt_users 表存在"
        
        # 检查用户数
        USER_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
        USE bjt;
        SELECT COUNT(*) FROM wp_bjt_users;
        " 2>/dev/null)
        
        echo "   用户数量: $USER_COUNT"
        
        if [ "$USER_COUNT" -eq 0 ]; then
            echo ""
            echo "步骤 6: 创建管理员用户..."
            echo "----------------------------"
            
            docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt <<EOF
INSERT INTO wp_bjt_users (username, password, email, role, status, created_at) 
VALUES (
    'admin', 
    MD5('BJTeorder601'),
    'admin@bjt.com',
    'admin',
    'active',
    NOW()
);
EOF
            
            if [ $? -eq 0 ]; then
                echo "✅ 管理员用户创建成功"
            else
                echo "❌ 用户创建失败"
            fi
        fi
    else
        echo "❌ wp_bjt_users 表不存在"
        echo ""
        echo "步骤 6: 运行 db-init 创建表..."
        echo "----------------------------"
        
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d db-init
        
        echo ""
        echo "等待初始化完成..."
        sleep 10
        
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production logs db-init | tail -50
    fi
else
    echo "❌ bjt 数据库不存在！"
    echo ""
    echo "创建 bjt 数据库..."
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "CREATE DATABASE IF NOT EXISTS bjt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if [ $? -eq 0 ]; then
        echo "✅ 数据库创建成功"
        
        echo ""
        echo "运行 db-init..."
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up -d db-init
        
        echo ""
        echo "等待初始化完成..."
        sleep 10
        
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production logs db-init | tail -50
    fi
fi

echo ""
echo "步骤 7: 验证结果..."
echo "----------------------------"

echo "检查所有表:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SHOW TABLES;" 2>/dev/null

echo ""
echo "检查用户:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "USE bjt; SELECT id, username, email, role, status FROM wp_bjt_users;" 2>/dev/null || echo "无法查询用户表"

echo ""
echo "步骤 8: 重启 WordPress..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart wordpress

echo ""
echo "等待服务启动..."
sleep 5

echo ""
echo "步骤 9: 测试登录..."
echo "----------------------------"
curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}' | jq . 2>/dev/null || curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}'

echo ""
echo ""
echo "=== 初始化完成 ==="

