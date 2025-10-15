#!/bin/bash
# 检查数据库数据并恢复用户表

echo "=== 检查和恢复 BJT 用户 ==="
echo ""

echo "1️⃣ 检查当前数据库表..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;
SHOW TABLES;
"

echo ""
echo "2️⃣ 检查 wp_bjt_users 表是否存在..."
echo "----------------------------"
USER_TABLE_EXISTS=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
USE bjt;
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'bjt' AND table_name = 'wp_bjt_users';
" 2>/dev/null)

if [ "$USER_TABLE_EXISTS" = "1" ]; then
    echo "✅ wp_bjt_users 表存在"
    
    echo ""
    echo "3️⃣ 检查用户数量..."
    echo "----------------------------"
    USER_COUNT=$(docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -N -e "
    USE bjt;
    SELECT COUNT(*) FROM wp_bjt_users;
    " 2>/dev/null)
    
    echo "当前用户数: $USER_COUNT"
    
    if [ "$USER_COUNT" -gt 0 ]; then
        echo ""
        echo "4️⃣ 列出所有用户..."
        echo "----------------------------"
        docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
        USE bjt;
        SELECT id, username, email, role, status FROM wp_bjt_users;
        "
    else
        echo "❌ 用户表为空，需要从备份恢复或创建新用户"
    fi
else
    echo "❌ wp_bjt_users 表不存在，需要创建"
fi

echo ""
echo "5️⃣ 检查备份文件..."
echo "----------------------------"
BACKUP_FILE="/var/bjt/backups/recovery-20251015_135529/database-backup.sql"

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ 找到备份文件: $BACKUP_FILE"
    
    echo ""
    echo "备份文件信息:"
    ls -lh "$BACKUP_FILE"
    
    echo ""
    echo "检查备份中是否有 wp_bjt_users 表..."
    if grep -q "wp_bjt_users" "$BACKUP_FILE"; then
        echo "✅ 备份包含 wp_bjt_users 表"
        
        echo ""
        echo "提取 wp_bjt_users 相关数据..."
        grep -A 20 "CREATE TABLE.*wp_bjt_users" "$BACKUP_FILE" | head -25
        
        echo ""
        echo "📋 可以从备份恢复用户数据！"
        echo ""
        echo "恢复命令:"
        echo "docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 bjt < $BACKUP_FILE"
    else
        echo "❌ 备份不包含 wp_bjt_users 表"
    fi
else
    echo "❌ 备份文件不存在"
fi

echo ""
echo "6️⃣ 如果需要手动创建管理员用户..."
echo "----------------------------"
echo "可以执行以下 SQL："
echo ""
cat << 'EOF'
INSERT INTO wp_bjt_users (username, password, email, role, status, created_at) 
VALUES (
  'admin', 
  MD5('BJTeorder601'),
  'admin@example.com',
  'admin',
  'active',
  NOW()
);
EOF

echo ""
echo "=== 检查完成 ==="

