#!/bin/bash

# BJT Product System - 数据库初始化脚本
# 用于手动初始化生产数据库

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认值
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="bjt_product"
DB_USER="root"
INCLUDE_TEST_USERS=false

# 打印帮助信息
print_help() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --host HOST          数据库主机 (默认: localhost)"
    echo "  -P, --port PORT          数据库端口 (默认: 3306)"
    echo "  -d, --database NAME      数据库名称 (默认: bjt_product)"
    echo "  -u, --user USER          数据库用户 (默认: root)"
    echo "  -p, --password PASSWORD  数据库密码 (将提示输入)"
    echo "  -t, --test-users         包含测试用户数据"
    echo "  --help                   显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -h mysql.example.com -u admin -p"
    echo "  $0 --host localhost --user root --test-users"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            if [ -n "$2" ] && [ ${2:0:1} != "-" ]; then
                DB_PASS="$2"
                shift 2
            else
                shift
                # 稍后提示输入密码
            fi
            ;;
        -t|--test-users)
            INCLUDE_TEST_USERS=true
            shift
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            print_help
            exit 1
            ;;
    esac
done

# 如果没有提供密码，提示输入
if [ -z "$DB_PASS" ]; then
    echo -n "请输入数据库密码: "
    read -s DB_PASS
    echo
fi

# 检查SQL文件是否存在
check_sql_files() {
    local missing=false
    
    if [ ! -f "docker/dev/mysql/init.sql" ]; then
        echo -e "${RED}错误: 找不到 docker/dev/mysql/init.sql${NC}"
        missing=true
    fi
    
    if [ ! -f "generated_sql_imports/_设备.sql" ]; then
        echo -e "${RED}错误: 找不到 generated_sql_imports/_设备.sql${NC}"
        missing=true
    fi
    
    if [ ! -f "generated_sql_imports/_耗材.sql" ]; then
        echo -e "${RED}错误: 找不到 generated_sql_imports/_耗材.sql${NC}"
        missing=true
    fi
    
    if [ "$INCLUDE_TEST_USERS" = true ] && [ ! -f "docker/dev/mysql/test_users.sql" ]; then
        echo -e "${RED}错误: 找不到 docker/dev/mysql/test_users.sql${NC}"
        missing=true
    fi
    
    if [ "$missing" = true ]; then
        echo -e "${RED}请确保在项目根目录运行此脚本${NC}"
        exit 1
    fi
}

# 测试数据库连接
test_connection() {
    echo -e "${BLUE}测试数据库连接...${NC}"
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
    else
        echo -e "${RED}✗ 无法连接到数据库${NC}"
        exit 1
    fi
}

# 创建数据库
create_database() {
    echo -e "${BLUE}创建数据库 $DB_NAME...${NC}"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "
        CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    "
    echo -e "${GREEN}✓ 数据库创建完成${NC}"
}

# 导入SQL文件
import_sql() {
    local file=$1
    local desc=$2
    
    echo -e "${BLUE}导入 $desc...${NC}"
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file"; then
        echo -e "${GREEN}✓ $desc 导入成功${NC}"
    else
        echo -e "${RED}✗ $desc 导入失败${NC}"
        exit 1
    fi
}

# 验证导入结果
verify_import() {
    echo -e "${BLUE}验证导入结果...${NC}"
    
    local result=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
        SELECT CONCAT(COUNT(*), ' ', table_name) FROM (
            SELECT 'product_lines' as table_name, COUNT(*) as cnt FROM wp_bjt_product_lines
            UNION ALL
            SELECT 'host_models', COUNT(*) FROM wp_bjt_host_models
            UNION ALL
            SELECT 'accessories', COUNT(*) FROM wp_bjt_accessories
            UNION ALL
            SELECT 'consumables', COUNT(*) FROM wp_bjt_consumables
            UNION ALL
            SELECT 'users', COUNT(*) FROM wp_bjt_users
        ) t WHERE cnt > 0;
    ")
    
    echo -e "${GREEN}导入的数据统计:${NC}"
    echo "$result" | while read line; do
        echo "  - $line"
    done
}

# 主函数
main() {
    echo -e "${GREEN}=== BJT Product System 数据库初始化 ===${NC}"
    echo ""
    echo "数据库配置:"
    echo "  主机: $DB_HOST:$DB_PORT"
    echo "  数据库: $DB_NAME"
    echo "  用户: $DB_USER"
    echo "  包含测试用户: $INCLUDE_TEST_USERS"
    echo ""
    
    # 确认继续
    echo -n "是否继续? (y/N) "
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "已取消"
        exit 0
    fi
    
    # 检查文件
    check_sql_files
    
    # 测试连接
    test_connection
    
    # 创建数据库
    create_database
    
    # 导入数据
    import_sql "docker/dev/mysql/init.sql" "数据库结构"
    import_sql "generated_sql_imports/_设备.sql" "设备数据"
    import_sql "generated_sql_imports/_耗材.sql" "耗材数据"
    
    if [ "$INCLUDE_TEST_USERS" = true ]; then
        import_sql "docker/dev/mysql/test_users.sql" "测试用户数据"
    fi
    
    # 验证结果
    verify_import
    
    echo ""
    echo -e "${GREEN}✅ 数据库初始化完成！${NC}"
    
    if [ "$INCLUDE_TEST_USERS" = true ]; then
        echo ""
        echo -e "${YELLOW}测试用户账号:${NC}"
        echo "  管理员: admin / password123"
        echo "  销售: sales_user / password123"
        echo "  合作伙伴: partner_user / password123"
        echo "  客户: customer_user / password123"
        echo "  测试: test_imperial / password123"
        echo ""
        echo -e "${YELLOW}⚠️  请在生产环境中修改这些默认密码！${NC}"
    fi
}

# 运行主函数
main 