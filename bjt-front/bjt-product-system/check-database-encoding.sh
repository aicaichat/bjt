#!/bin/bash

# BJT产品管理系统 - 数据库编码检查脚本
# 用于验证MySQL字符集配置和数据显示

echo "=== BJT数据库编码检查工具 ==="
echo ""

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Docker Compose文件路径
COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"

# 检查Docker Compose服务状态
echo "1. 检查Docker Compose服务状态..."
if ! docker-compose -f "$COMPOSE_FILE" ps mysql | grep -q "Up"; then
    echo -e "${RED}❌ MySQL容器未运行，请先启动服务${NC}"
    echo "运行命令: docker-compose -f $COMPOSE_FILE up -d"
    exit 1
fi
echo -e "${GREEN}✅ MySQL容器正在运行${NC}"
echo ""

# 检查MySQL连接
echo "2. 检查MySQL连接..."
if ! docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到MySQL数据库${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL连接正常${NC}"
echo ""

# 检查字符集配置
echo "3. 检查MySQL字符集配置..."
echo -e "${YELLOW}当前字符集设置:${NC}"
docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot -e "
SELECT 
    'character_set_server' as setting, @@character_set_server as value
UNION ALL SELECT 
    'character_set_database', @@character_set_database
UNION ALL SELECT 
    'character_set_client', @@character_set_client
UNION ALL SELECT 
    'character_set_connection', @@character_set_connection
UNION ALL SELECT 
    'character_set_results', @@character_set_results
UNION ALL SELECT 
    'collation_server', @@collation_server
UNION ALL SELECT 
    'collation_database', @@collation_database
UNION ALL SELECT 
    'collation_connection', @@collation_connection;
" 2>/dev/null

echo ""

# 验证配置是否正确
echo "4. 验证字符集配置..."
CLIENT_CHARSET=$(docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot -e "SELECT @@character_set_client;" 2>/dev/null | tail -n 1)
SERVER_CHARSET=$(docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot -e "SELECT @@character_set_server;" 2>/dev/null | tail -n 1)

if [[ "$CLIENT_CHARSET" == *"utf8mb4"* && "$SERVER_CHARSET" == *"utf8mb4"* ]]; then
    echo -e "${GREEN}✅ 字符集配置正确 (UTF8MB4)${NC}"
else
    echo -e "${RED}❌ 字符集配置有问题${NC}"
    echo "客户端字符集: $CLIENT_CHARSET"
    echo "服务器字符集: $SERVER_CHARSET"
fi
echo ""

# 测试中文字符
echo "5. 测试中文字符支持..."
echo -e "${YELLOW}插入和查询中文测试数据...${NC}"
TEST_RESULT=$(docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot bjt_product -e "
DROP TABLE IF EXISTS encoding_test;
CREATE TABLE encoding_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_text VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
);
INSERT INTO encoding_test (test_text) VALUES ('测试中文字符编码');
INSERT INTO encoding_test (test_text) VALUES ('English and 中文混合 Test');
INSERT INTO encoding_test (test_text) VALUES ('特殊符号：™®©℃℉±×÷');
SELECT test_text FROM encoding_test;
DROP TABLE encoding_test;
" 2>/dev/null)

if [[ "$TEST_RESULT" == *"测试中文字符编码"* ]]; then
    echo -e "${GREEN}✅ 中文字符支持正常${NC}"
    echo "测试结果："
    echo "$TEST_RESULT" | grep -E "(测试中文|English and|特殊符号)"
else
    echo -e "${RED}❌ 中文字符显示有问题${NC}"
    echo "测试结果: $TEST_RESULT"
fi
echo ""

# 检查现有数据
echo "6. 检查现有产品数据..."
echo -e "${YELLOW}产品数据样本 (wp_bjt_parts):${NC}"
docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot bjt_product -e "
SELECT id, name_zh, brand 
FROM wp_bjt_parts 
WHERE name_zh IS NOT NULL 
LIMIT 3;
" 2>/dev/null

echo ""
echo -e "${YELLOW}耗材数据样本 (wp_bjt_consumables):${NC}"
docker-compose -f "$COMPOSE_FILE" exec mysql mysql -u root -proot bjt_product -e "
SELECT id, model, brand 
FROM wp_bjt_consumables 
WHERE model IS NOT NULL 
LIMIT 3;
" 2>/dev/null

echo ""

# 检查配置文件挂载
echo "7. 检查配置文件挂载..."
if docker-compose -f "$COMPOSE_FILE" exec mysql ls -la /etc/mysql/conf.d/my.cnf > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 配置文件已正确挂载${NC}"
    echo -e "${YELLOW}配置文件内容预览:${NC}"
    docker-compose -f "$COMPOSE_FILE" exec mysql head -10 /etc/mysql/conf.d/my.cnf 2>/dev/null
else
    echo -e "${RED}❌ 配置文件未正确挂载${NC}"
fi

echo ""

# 总结
echo "=== 检查总结 ==="
echo "如果所有检查项都显示 ✅，说明数据库编码配置正确。"
echo "如果有 ❌ 项目，请按以下步骤修复："
echo ""
echo "1. 字符集配置问题："
echo "   - 确保 docker/dev/mysql/my.cnf 文件存在"
echo "   - 重启MySQL容器: docker-compose -f $COMPOSE_FILE restart mysql"
echo ""
echo "2. 数据显示问题："
echo "   - 删除数据卷: docker volume rm dev_mysql_data"
echo "   - 重新启动服务: docker-compose -f $COMPOSE_FILE up -d"
echo ""
echo "3. 配置文件挂载问题："
echo "   - 检查 docker-compose.yml 中的 volumes 配置"
echo "   - 确保文件路径正确"
echo ""
echo "需要帮助请联系技术支持。" 