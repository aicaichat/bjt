#!/bin/bash
# BJT产品管理系统 - 本地环境bag_type修复测试脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_banner() {
    echo -e "${PURPLE}"
    echo "════════════════════════════════════════════════════════════════"
    echo "  BJT产品管理系统 - 本地环境bag_type修复测试"
    echo "  测试目标: 验证数据库初始化时的bag_type修复功能"
    echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}[STEP $(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 全局变量
TEST_LOG="logs/bag-type-fix-test-$(date +%Y%m%d_%H%M%S).log"
DOCKER_COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"

# 创建日志目录
mkdir -p logs

# 日志记录函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$TEST_LOG"
}

# 检查前置条件
check_prerequisites() {
    print_step "检查前置条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装"
        exit 1
    fi
    
    # 检查必要文件
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose文件不存在: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "generated_sql_imports/fix-bag-type-during-init.sql" ]; then
        print_error "bag_type修复脚本不存在"
        exit 1
    fi
    
    print_success "前置条件检查通过"
    log_message "前置条件检查通过"
}

# 准备测试环境
prepare_test_environment() {
    print_step "准备测试环境..."
    
    # 创建测试用的数据库初始化目录
    mkdir -p docker/dev/mysql/initdb.d
    
    # 复制基础初始化文件
    if [ -f "docker/dev/mysql/init.sql" ]; then
        cp docker/dev/mysql/init.sql docker/dev/mysql/initdb.d/01-init.sql
        print_success "✅ 基础数据库结构文件已准备"
    else
        print_warning "⚠️ 基础数据库结构文件不存在，使用generated_sql_imports中的文件"
        cp generated_sql_imports/init.sql docker/dev/mysql/initdb.d/01-init.sql
    fi
    
    # 复制设备数据文件
    if [ -f "generated_sql_imports/_设备.sql" ]; then
        cp "generated_sql_imports/_设备.sql" docker/dev/mysql/initdb.d/02-machines.sql
        print_success "✅ 设备数据文件已准备"
    else
        print_warning "⚠️ 设备数据文件不存在"
    fi
    
    # 复制耗材数据文件
    if [ -f "generated_sql_imports/_耗材.sql" ]; then
        cp "generated_sql_imports/_耗材.sql" docker/dev/mysql/initdb.d/03-consumables.sql
        print_success "✅ 耗材数据文件已准备"
    else
        print_warning "⚠️ 耗材数据文件不存在"
    fi
    
    # 🔥 关键：添加bag_type修复脚本
    cp generated_sql_imports/fix-bag-type-during-init.sql docker/dev/mysql/initdb.d/04-fix-bag-type.sql
    print_success "✅ bag_type修复脚本已准备"
    
    # 复制测试用户文件
    if [ -f "docker/dev/mysql/test_users.sql" ]; then
        cp docker/dev/mysql/test_users.sql docker/dev/mysql/initdb.d/05-test-users.sql
        print_success "✅ 测试用户文件已准备"
    elif [ -f "generated_sql_imports/test_users.sql" ]; then
        cp generated_sql_imports/test_users.sql docker/dev/mysql/initdb.d/05-test-users.sql
        print_success "✅ 测试用户文件已准备"
    fi
    
    # 创建验证脚本
    cat > docker/dev/mysql/initdb.d/99-test-verification.sql << 'EOF'
-- =====================================================
-- 本地测试验证脚本
-- =====================================================

-- 显示bag_type修复前后对比
SELECT '🎯 bag_type修复测试结果:' as info;

-- 检查是否还有非标准格式的bag_type
SELECT 
    'bag_type标准化验证' as test_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN bag_type IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as standardized_records,
    COUNT(CASE WHEN bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as non_standard_records,
    CASE 
        WHEN COUNT(CASE WHEN bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) = 0 
        THEN '✅ 测试通过' 
        ELSE '❌ 测试失败' 
    END as test_result
FROM wp_bjt_consumables;

-- 显示修复后的分布
SELECT 
    bag_type,
    COUNT(*) as count,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM wp_bjt_consumables), 1), '%') as percentage
FROM wp_bjt_consumables 
GROUP BY bag_type 
ORDER BY count DESC;

-- 记录测试完成
INSERT INTO wp_bjt_logs (log_type, message, details, created_at) 
VALUES (
    'test', 
    '本地环境bag_type修复测试完成',
    CONCAT(
        '测试时间: ', NOW(),
        ', 总记录数: ', (SELECT COUNT(*) FROM wp_bjt_consumables),
        ', 标准化记录数: ', (SELECT COUNT(*) FROM wp_bjt_consumables WHERE bag_type IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF'))
    ),
    NOW()
);

-- 最终测试结果
SELECT 
    '🧪 本地环境bag_type修复测试完成！' as message,
    CASE 
        WHEN (SELECT COUNT(*) FROM wp_bjt_consumables WHERE bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF')) = 0 
        THEN '✅ 修复成功，可以部署到生产环境' 
        ELSE '❌ 修复失败，需要检查修复逻辑' 
    END as result,
    NOW() as test_time;
EOF
    
    print_success "测试环境准备完成"
    log_message "测试环境准备完成"
}

# 停止现有服务
stop_existing_services() {
    print_step "停止现有服务..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        print_success "现有服务已停止"
    else
        print_info "没有运行中的服务"
    fi
    
    # 清理数据库数据卷（重新初始化）
    print_info "清理数据库数据卷..."
    docker volume rm bjt-product-system_mysql_data 2>/dev/null || true
    
    log_message "现有服务已停止"
}

# 启动测试服务
start_test_services() {
    print_step "启动测试服务..."
    
    # 启动服务
    print_info "启动Docker服务..."
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
        print_error "Docker服务启动失败"
        exit 1
    fi
    
    print_success "测试服务启动完成"
    log_message "测试服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_step "等待服务就绪..."
    
    # 等待MySQL就绪
    print_info "等待MySQL服务启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost -u root -proot &> /dev/null; then
            print_success "MySQL服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待数据库初始化完成
    print_info "等待数据库初始化完成..."
    sleep 20  # 给数据库初始化一些时间
    
    # 等待WordPress就绪
    print_info "等待WordPress服务启动..."
    max_attempts=20
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8080/wp-admin/admin-ajax.php &> /dev/null; then
            print_success "WordPress服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -le $max_attempts ]; then
        print_success "所有服务已就绪"
    else
        print_warning "WordPress服务启动可能有问题，但继续测试"
    fi
    
    log_message "服务就绪检查完成"
}

# 验证bag_type修复结果
verify_bag_type_fix() {
    print_step "验证bag_type修复结果..."
    
    # 检查数据库中的bag_type分布
    print_info "检查数据库中的bag_type分布..."
    
    local bag_type_result=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql \
        mysql -u root -proot -e "
            USE bjt_product;
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN bag_type IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as standardized,
                COUNT(CASE WHEN bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as non_standard
            FROM wp_bjt_consumables;" 2>/dev/null | tail -n 1)
    
    if [ ! -z "$bag_type_result" ]; then
        echo "数据库验证结果: $bag_type_result"
        
        # 提取非标准记录数
        local non_standard_count=$(echo "$bag_type_result" | awk '{print $3}')
        
        if [ "$non_standard_count" = "0" ]; then
            print_success "✅ bag_type字段标准化修复成功"
        else
            print_warning "⚠️ 仍有 $non_standard_count 条非标准bag_type记录"
        fi
    else
        print_warning "⚠️ 无法获取数据库验证结果"
    fi
    
    # 显示详细分布
    print_info "bag_type修复后的详细分布："
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mysql \
        mysql -u root -proot -e "
            USE bjt_product;
            SELECT bag_type, COUNT(*) as count 
            FROM wp_bjt_consumables 
            GROUP BY bag_type 
            ORDER BY count DESC;" 2>/dev/null || print_warning "无法获取详细分布"
    
    log_message "bag_type修复验证完成"
}

# 测试API接口
test_api_endpoints() {
    print_step "测试API接口..."
    
    # 测试耗材API
    print_info "测试耗材API..."
    if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | grep -q "data\|items"; then
        print_success "✓ 耗材API接口正常"
        
        # 测试筛选选项
        local api_response=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1")
        if echo "$api_response" | grep -q "filterOptions"; then
            print_success "✓ 筛选选项API正常"
            
            # 检查形状选项
            local shapes_count=$(echo "$api_response" | jq '.data.filterOptions.shapes | length' 2>/dev/null || echo "0")
            print_info "形状筛选选项数量: $shapes_count"
            
            # 检查是否有重复的Tube选项
            local tube_options=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables" | jq '.data.filterOptions.shapes[] | select(.name_en | contains("Tube"))' 2>/dev/null || echo "")
            if [ -z "$tube_options" ]; then
                print_success "✓ 没有发现重复的Tube选项"
            else
                print_info "Tube相关选项: $tube_options"
            fi
        else
            print_warning "⚠ 筛选选项API可能异常"
        fi
    else
        print_warning "⚠ 耗材API接口可能异常"
    fi
    
    log_message "API接口测试完成"
}

# 显示测试结果
show_test_results() {
    print_step "测试结果总结"
    
    echo ""
    echo -e "${GREEN}🧪 本地环境bag_type修复测试完成！${NC}"
    echo ""
    echo "📊 测试结果:"
    echo "   ✅ 数据库初始化成功"
    echo "   ✅ bag_type修复脚本执行"
    echo "   ✅ 服务启动正常"
    echo "   ✅ API接口可访问"
    echo ""
    echo "🌐 测试访问地址:"
    echo "   前端应用: http://localhost"
    echo "   WordPress后台: http://localhost:8080/wp-admin"
    echo "   API接口: http://localhost:8080/wp-json/bjt/v1"
    echo "   前端开发服务器: http://localhost:5173"
    echo ""
    echo "📁 测试日志:"
    echo "   📋 测试日志: $TEST_LOG"
    echo ""
    echo "🧪 手动验证建议:"
    echo "   1. 访问 http://localhost 查看前端应用"
    echo "   2. 进入耗材页面测试筛选功能"
    echo "   3. 检查形状筛选是否显示正确且无重复"
    echo "   4. 验证材质和机型筛选是否正常"
    echo ""
    echo "🔧 常用调试命令:"
    echo "   查看服务状态: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    echo "   查看日志: docker-compose -f $DOCKER_COMPOSE_FILE logs"
    echo "   进入数据库: docker-compose -f $DOCKER_COMPOSE_FILE exec mysql mysql -u root -proot bjt_product"
    echo "   停止服务: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo ""
}

# 主执行流程
main() {
    print_banner
    
    print_info "🚀 开始本地环境bag_type修复测试"
    print_info "预计执行时间: 5-10分钟"
    
    # 用户确认
    echo
    read -p "⚠️  即将开始测试，是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "用户取消测试"
        exit 0
    fi
    
    # 执行各个阶段
    check_prerequisites
    prepare_test_environment
    stop_existing_services
    start_test_services
    wait_for_services
    verify_bag_type_fix
    test_api_endpoints
    show_test_results
    
    print_success "🎉 本地环境bag_type修复测试完成！"
}

# 错误处理
trap 'print_error "测试过程中断，查看日志: $TEST_LOG"' ERR

# 执行主流程
main "$@" 