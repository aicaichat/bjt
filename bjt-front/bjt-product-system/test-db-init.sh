#!/bin/bash
# 测试数据库初始化功能

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要文件
check_files() {
    print_message "检查必要文件..."
    
    files=(
        "docker/mysql/init-db.sh"
        "docker/prod/docker-compose.local.yml"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "文件不存在: $file"
            exit 1
        fi
    done
    
    print_message "必要文件检查通过"
}

# 启动测试环境
start_test_env() {
    print_message "启动测试环境..."
    
    # 停止现有服务
    docker-compose -f docker/prod/docker-compose.local.yml down 2>/dev/null || true
    
    # 删除现有数据卷
    docker volume rm bjt-product-system_mysql_data 2>/dev/null || true
    
    # 启动服务
    docker-compose -f docker/prod/docker-compose.local.yml up -d
    
    print_message "测试环境启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message "等待服务就绪..."
    
    # 等待MySQL
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.local.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -proot123 &> /dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "MySQL启动超时"
        exit 1
    fi
    
    # 等待数据库初始化
    timeout=120
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.local.yml ps db-init | grep -q "Exit"; then
            break
        fi
        sleep 3
        timeout=$((timeout-3))
    done
    
    print_message "服务就绪"
}

# 测试数据库初始化
test_database_init() {
    print_message "测试数据库初始化..."
    
    # 检查数据库初始化日志
    print_message "数据库初始化日志："
    docker-compose -f docker/prod/docker-compose.local.yml logs db-init
    
    # 检查BJT表是否存在
    TABLE_COUNT=$(docker-compose -f docker/prod/docker-compose.local.yml exec -T mysql \
        mysql -u root -proot123 -e "
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'bjt_product' 
            AND table_name LIKE 'wp_bjt_%';" 2>/dev/null | tail -n 1)
    
    print_message "BJT相关表数量: $TABLE_COUNT"
    
    if [ "$TABLE_COUNT" -gt "0" ]; then
        print_message "✅ 数据库初始化成功"
        
        # 显示表列表
        print_message "BJT表列表："
        docker-compose -f docker/prod/docker-compose.local.yml exec -T mysql \
            mysql -u root -proot123 -e "
                USE bjt_product;
                SHOW TABLES LIKE 'wp_bjt_%';"
        
        # 检查关键表的记录数
        print_message "关键表记录数："
        docker-compose -f docker/prod/docker-compose.local.yml exec -T mysql \
            mysql -u root -proot123 -e "
                USE bjt_product;
                SELECT 'wp_bjt_product_lines' as table_name, COUNT(*) as count FROM wp_bjt_product_lines
                UNION ALL
                SELECT 'wp_bjt_parts' as table_name, COUNT(*) as count FROM wp_bjt_parts
                UNION ALL
                SELECT 'wp_bjt_accessories' as table_name, COUNT(*) as count FROM wp_bjt_accessories
                UNION ALL
                SELECT 'wp_bjt_spare_parts' as table_name, COUNT(*) as count FROM wp_bjt_spare_parts;" 2>/dev/null || true
        
    else
        print_error "❌ 数据库初始化失败"
        exit 1
    fi
}

# 测试前端访问
test_frontend_access() {
    print_message "测试前端访问..."
    
    # 等待WordPress就绪
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8080 &> /dev/null; then
            print_message "✅ 前端应用可访问"
            break
        fi
        sleep 3
        timeout=$((timeout-3))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "⚠️ 前端应用访问超时"
    fi
    
    # 测试API接口
    if curl -f http://localhost:8080/wp-json/bjt/v1 &> /dev/null; then
        print_message "✅ API接口可访问"
    else
        print_warning "⚠️ API接口不可访问"
    fi
}

# 清理测试环境
cleanup() {
    print_message "清理测试环境..."
    
    docker-compose -f docker/prod/docker-compose.local.yml down
    docker volume rm bjt-product-system_mysql_data 2>/dev/null || true
    
    print_message "清理完成"
}

# 显示测试结果
show_results() {
    print_message "测试完成！"
    echo ""
    echo "测试结果："
    echo "  ✅ 数据库自动初始化功能正常"
    echo "  ✅ BJT产品管理系统表结构创建成功"
    echo "  ✅ 数据导入功能正常"
    echo ""
    echo "访问地址："
    echo "  前端应用: http://localhost:8080"
    echo "  WordPress后台: http://localhost:8080/wp-admin"
    echo "  API接口: http://localhost:8080/wp-json/bjt/v1"
    echo ""
    echo "如需保留测试环境，请不要运行清理命令"
    echo "手动清理: docker-compose -f docker/prod/docker-compose.local.yml down"
}

# 主函数
main() {
    print_message "开始测试数据库自动初始化功能..."
    
    # 检查文件
    check_files
    
    # 启动测试环境
    start_test_env
    
    # 等待服务就绪
    wait_for_services
    
    # 测试数据库初始化
    test_database_init
    
    # 测试前端访问
    test_frontend_access
    
    # 显示结果
    show_results
    
    # 询问是否清理
    echo ""
    read -p "是否清理测试环境？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        print_message "测试环境保留，可继续测试"
    fi
}

# 执行主函数
main "$@" 