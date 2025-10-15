#!/bin/bash
# 快速修复登录问题

echo "=== 快速修复 BJT 登录问题 ==="
echo ""

echo "步骤 1: 检查 wp_bjt_users 表..."
TABLE_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
USE bjt;
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'bjt' AND table_name = 'wp_bjt_users';
" 2>/dev/null)

if [ "$TABLE_EXISTS" = "1" ]; then
    echo "✅ 表存在"
    
    USER_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
    USE bjt;
    SELECT COUNT(*) FROM wp_bjt_users;
    " 2>/dev/null)
    
    echo "   当前用户数: $USER_COUNT"
    
    if [ "$USER_COUNT" -eq 0 ]; then
        echo ""
        echo "步骤 2: 表为空，创建管理员用户..."
        
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
        USE bjt;
        INSERT INTO wp_bjt_users (username, password, email, role, status, created_at) 
        VALUES (
          'admin', 
          MD5('BJTeorder601'),
          'admin@bjt.com',
          'admin',
          'active',
          NOW()
        );
        " 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ 管理员用户创建成功"
            
            echo ""
            echo "验证用户..."
            docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
            USE bjt;
            SELECT id, username, email, role, status FROM wp_bjt_users;
            "
        else
            echo "❌ 用户创建失败"
        fi
    else
        echo "   用户已存在，列出所有用户:"
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
        USE bjt;
        SELECT id, username, email, role, status FROM wp_bjt_users;
        "
    fi
else
    echo "❌ wp_bjt_users 表不存在！"
    echo ""
    echo "可能需要重新运行 db-init:"
    echo "docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production up db-init"
fi

echo ""
echo "步骤 3: 测试登录 API..."
echo ""
curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}' | jq . || cat

echo ""
echo ""
echo "=== 修复完成 ==="
echo ""
echo "如果登录仍然失败，请检查:"
echo "1. 密码是否正确 (BJTeorder601)"
echo "2. 用户名是否正确 (admin)"
echo "3. 认证端点是否正常工作"

