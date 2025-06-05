#!/bin/bash

# 多环境规格PDF功能部署脚本
# 支持: dev (开发环境) 和 pro (生产环境)
# 执行日期：2025-06-05
# 作者：开发团队

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 显示使用帮助
show_help() {
    echo "用法: $0 [环境] [选项]"
    echo ""
    echo "环境:"
    echo "  dev     本地开发环境 (默认)"
    echo "  pro     生产环境"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -f, --force         强制执行，跳过确认"
    echo "  -s, --skip-restart  跳过服务重启"
    echo "  -v, --verify-only   仅验证，不执行部署"
    echo ""
    echo "示例:"
    echo "  $0 dev               在开发环境部署"
    echo "  $0 pro --force       在生产环境强制部署"
    echo "  $0 dev --verify-only 验证开发环境配置"
}

# 默认配置
ENVIRONMENT="dev"
FORCE=false
SKIP_RESTART=false
VERIFY_ONLY=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|pro)
            ENVIRONMENT="$1"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--skip-restart)
            SKIP_RESTART=true
            shift
            ;;
        -v|--verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 环境配置
case $ENVIRONMENT in
    dev)
        DB_HOST="mysql"
        DB_USER="wordpress"
        DB_PASS="wordpress"
        DB_NAME="bjt_product"
        FRONTEND_URL="http://localhost:3000"
        BACKEND_URL="http://localhost:8000"
        COMPOSE_FILE="docker-compose.yml"
        SERVICES=("frontend" "backend")
        ;;
    pro)
        DB_HOST="mysql"
        DB_USER="wordpress"
        DB_PASS="wordpress"
        DB_NAME="bjt_product"
        FRONTEND_URL="http://localhost:3000"
        BACKEND_URL="http://localhost:8000"
        COMPOSE_FILE="docker-compose.prod.yml"
        SERVICES=("frontend" "backend")
        ;;
    *)
        print_error "不支持的环境: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "=========================================="
echo -e "${BLUE}开始部署规格PDF功能...${NC}"
echo "环境: $ENVIRONMENT"
echo "配置文件: $COMPOSE_FILE"
echo "=========================================="

# 检查前置条件
check_prerequisites() {
    print_info "检查前置条件..."
    
    # 检查是否在项目根目录
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "未找到 $COMPOSE_FILE 文件，请在项目根目录下执行此脚本"
        exit 1
    fi
    
    # 检查docker和docker-compose命令
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装或不在PATH中"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装或不在PATH中"
        exit 1
    fi
    
    # 检查迁移文件
    if [ ! -f "database/migrations/add_spec_pdf_to_models.sql" ]; then
        print_error "数据库迁移文件不存在: database/migrations/add_spec_pdf_to_models.sql"
        exit 1
    fi
    
    print_status "前置条件检查通过"
}

# 用户确认
confirm_deployment() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    echo ""
    print_warning "即将在 $ENVIRONMENT 环境执行以下操作:"
    echo "  1. 数据库迁移 (添加spec_pdf字段)"
    echo "  2. 重启服务 (${SERVICES[*]})"
    echo "  3. 验证部署结果"
    echo ""
    read -p "确定要继续吗? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "部署已取消"
        exit 0
    fi
}

# 执行数据库迁移
execute_database_migration() {
    print_info "步骤1：执行数据库迁移..."
    
    # 根据环境选择不同的执行方式
    case $ENVIRONMENT in
        dev)
            docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < database/migrations/add_spec_pdf_to_models.sql
            ;;
        pro)
            docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < database/migrations/add_spec_pdf_to_models.sql
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_status "数据库迁移完成"
    else
        print_error "数据库迁移失败"
        exit 1
    fi
}

# 重启服务
restart_services() {
    if [ "$SKIP_RESTART" = true ]; then
        print_info "跳过服务重启"
        return 0
    fi
    
    print_info "步骤2：重启服务..."
    
    for service in "${SERVICES[@]}"; do
        print_info "重启 $service 服务..."
        docker-compose -f $COMPOSE_FILE restart $service
        
        if [ $? -eq 0 ]; then
            print_status "$service 服务重启完成"
        else
            print_error "$service 服务重启失败"
            exit 1
        fi
    done
}

# 验证数据库字段
verify_database_fields() {
    print_info "验证数据库表结构..."
    
    local tables=("wp_bjt_host_models" "wp_bjt_accessory_models" "wp_bjt_spare_part_models")
    
    for table in "${tables[@]}"; do
        local result=$(docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW COLUMNS FROM $table LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf)
        
        if [ -n "$result" ]; then
            print_status "$table 表 spec_pdf 字段已添加"
        else
            print_error "$table 表 spec_pdf 字段未找到"
            return 1
        fi
    done
    
    return 0
}

# 验证服务状态
verify_services() {
    print_info "验证服务状态..."
    
    # 等待服务启动
    sleep 15
    
    # 检查前端服务
    if command -v curl &> /dev/null; then
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
        
        if [ "$http_status" = "200" ]; then
            print_status "前端服务正常运行 ($FRONTEND_URL)"
        else
            print_warning "前端服务状态码: $http_status，请检查服务状态"
        fi
    else
        print_warning "curl 未安装，跳过HTTP状态检查"
    fi
    
    # 检查Docker服务状态
    for service in "${SERVICES[@]}"; do
        local status=$(docker-compose -f $COMPOSE_FILE ps -q $service 2>/dev/null)
        if [ -n "$status" ]; then
            print_status "$service 容器运行中"
        else
            print_warning "$service 容器可能未运行"
        fi
    done
}

# 生成部署报告
generate_deployment_report() {
    local timestamp=$(date)
    local report_file="deployment-checklist-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).md"
    
    cat << EOF > $report_file
# 规格PDF功能部署检查清单

**环境**: $ENVIRONMENT  
**部署时间**: $timestamp  
**配置文件**: $COMPOSE_FILE  

## 数据库检查
- [x] wp_bjt_host_models 表添加 spec_pdf 字段
- [x] wp_bjt_accessory_models 表添加 spec_pdf 字段  
- [x] wp_bjt_spare_part_models 表添加 spec_pdf 字段

## 前端检查
- [x] TypeScript接口更新
- [x] 主机型号页面表单添加上传组件
- [x] PdfUploader组件创建
- [x] 导出配置更新

## 后端检查
- [x] 主机型号控制器支持spec_pdf字段
- [x] 配件型号控制器支持spec_pdf字段
- [x] 备件型号控制器支持spec_pdf字段

## 服务状态
- [x] 前端服务: $FRONTEND_URL
- [x] 后端服务: $BACKEND_URL

## 功能测试项目
- [ ] 主机型号创建时上传规格PDF
- [ ] 主机型号编辑时上传/更新规格PDF
- [ ] 配件型号创建时上传规格PDF
- [ ] 配件型号编辑时上传/更新规格PDF
- [ ] 备件型号创建时上传规格PDF
- [ ] 备件型号编辑时上传/更新规格PDF
- [ ] PDF文件查看功能
- [ ] PDF文件删除功能
- [ ] 导出功能包含spec_pdf字段
- [ ] API响应包含spec_pdf字段

## 环境配置
- 数据库: $DB_HOST/$DB_NAME
- Docker Compose: $COMPOSE_FILE
- 重启服务: ${SERVICES[*]}

## 后续步骤
1. 进行功能测试验证
2. 检查日志确认无错误
3. 验证文件上传权限配置
4. 测试API接口响应

EOF

    print_status "部署报告已生成: $report_file"
}

# 主执行流程
main() {
    check_prerequisites
    
    if [ "$VERIFY_ONLY" = true ]; then
        print_info "仅执行验证..."
        verify_database_fields
        verify_services
        print_status "验证完成"
        exit 0
    fi
    
    confirm_deployment
    
    execute_database_migration
    restart_services
    
    print_info "步骤3：验证部署..."
    if ! verify_database_fields; then
        print_error "数据库验证失败"
        exit 1
    fi
    
    verify_services
    generate_deployment_report
    
    echo "=========================================="
    print_status "规格PDF功能部署完成！"
    print_info "环境: $ENVIRONMENT"
    print_info "请参考生成的检查清单进行功能测试"
    echo "=========================================="
}

# 执行主流程
main 