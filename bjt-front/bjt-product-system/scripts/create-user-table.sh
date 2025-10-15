#!/bin/bash
# 手动创建 wp_bjt_users 表并添加管理员用户

echo "=== 创建 wp_bjt_users 表 ==="
echo ""

echo "步骤 1: 检查表是否存在..."
TABLE_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'bjt' AND table_name = 'wp_bjt_users';
" 2>/dev/null)

if [ "$TABLE_EXISTS" = "1" ]; then
    echo "✅ wp_bjt_users 表已存在"
    
    USER_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
    USE bjt;
    SELECT COUNT(*) FROM wp_bjt_users;
    " 2>/dev/null)
    
    echo "   当前用户数: $USER_COUNT"
else
    echo "❌ wp_bjt_users 表不存在，开始创建..."
    echo ""
    
    echo "步骤 2: 创建 wp_bjt_users 表..."
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt <<'EOF'
CREATE TABLE IF NOT EXISTS `wp_bjt_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `customer_code` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `country` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `preferred_unit` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ wp_bjt_users 表创建成功"
    else
        echo "❌ 表创建失败"
        exit 1
    fi
fi

echo ""
echo "步骤 3: 检查是否有管理员用户..."
ADMIN_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
USE bjt;
SELECT COUNT(*) FROM wp_bjt_users WHERE username = 'admin';
" 2>/dev/null)

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "✅ 管理员用户已存在"
    
    echo ""
    echo "当前管理员信息:"
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
    USE bjt;
    SELECT id, username, email, role, status FROM wp_bjt_users WHERE username = 'admin';
    "
elif [ "$ADMIN_EXISTS" = "0" ]; then
    echo "❌ 管理员用户不存在，开始创建..."
    
    echo ""
    echo "步骤 4: 创建管理员用户..."
    docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt <<'EOF'
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
        
        echo ""
        echo "新创建的管理员信息:"
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
        USE bjt;
        SELECT id, username, email, role, status FROM wp_bjt_users WHERE username = 'admin';
        "
    else
        echo "❌ 管理员用户创建失败"
        exit 1
    fi
else
    echo "⚠️  无法查询用户，可能是表不存在或数据库连接问题"
    exit 1
fi

echo ""
echo "步骤 5: 检查 WordPress 服务状态..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps wordpress

echo ""
echo "步骤 6: 检查 WordPress 日志..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production logs wordpress --tail=20

echo ""
echo "步骤 7: 重启 WordPress..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart wordpress

echo ""
echo "等待 WordPress 启动（30秒）..."
sleep 30

echo ""
echo "步骤 8: 测试登录 API..."
curl -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}'

echo ""
echo ""
echo "=== 完成 ==="
echo ""
echo "登录凭据:"
echo "  用户名: admin"
echo "  密码: BJTeorder601"

