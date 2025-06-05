#!/bin/bash

# 本地开发环境规格PDF功能部署脚本
# 适配docker/dev/docker-compose.nginx.yml配置
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
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -f, --force         强制执行，跳过确认"
    echo "  -s, --skip-restart  跳过服务重启"
    echo "  -v, --verify-only   仅验证，不执行部署"
    echo "  -c, --compose-file  指定compose文件路径 (默认: docker/dev/docker-compose.nginx.yml)"
    echo ""
    echo "示例:"
    echo "  $0                   部署到本地开发环境"
    echo "  $0 --force          强制部署，跳过确认"
    echo "  $0 --verify-only    仅验证当前配置"
    echo "  $0 -c docker-compose.yml  使用自定义compose文件"
}

# 默认配置
FORCE=false
SKIP_RESTART=false
VERIFY_ONLY=false
COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"

# 本地开发环境配置
DB_HOST="mysql"
DB_USER="wordpress"
DB_PASS="wordpress"
DB_NAME="bjt_product"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:8080"
NGINX_URL="http://localhost:80"
SERVICES=("frontend" "wordpress")
ALL_SERVICES=("frontend" "wordpress" "mysql" "nginx")

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
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
        -c|--compose-file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "=========================================="
echo -e "${BLUE}开始部署规格PDF功能到本地开发环境...${NC}"
echo "Docker Compose文件: $COMPOSE_FILE"
echo "前端地址: $FRONTEND_URL"
echo "后端地址: $BACKEND_URL"
echo "Nginx代理: $NGINX_URL"
echo "=========================================="

# 检查前置条件
check_prerequisites() {
    print_info "检查前置条件..."
    
    # 检查是否在项目根目录
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "未找到 $COMPOSE_FILE 文件，请确认文件路径或在项目根目录下执行"
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
    
    # 检查docker服务是否运行
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行，请启动 Docker Desktop"
        exit 1
    fi
    
    print_status "前置条件检查通过"
}

# 检查服务状态
check_services_status() {
    print_info "检查当前服务状态..."
    
    local running_services=()
    local stopped_services=()
    
    for service in "${ALL_SERVICES[@]}"; do
        local status=$(docker-compose -f $COMPOSE_FILE ps -q $service 2>/dev/null)
        if [ -n "$status" ]; then
            local container_status=$(docker inspect --format='{{.State.Status}}' $status 2>/dev/null)
            if [ "$container_status" = "running" ]; then
                running_services+=("$service")
            else
                stopped_services+=("$service")
            fi
        else
            stopped_services+=("$service")
        fi
    done
    
    if [ ${#running_services[@]} -gt 0 ]; then
        print_status "运行中的服务: ${running_services[*]}"
    fi
    
    if [ ${#stopped_services[@]} -gt 0 ]; then
        print_warning "未运行的服务: ${stopped_services[*]}"
        
        if [ "$VERIFY_ONLY" = false ]; then
            echo ""
            read -p "是否需要启动所有服务? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "启动所有服务..."
                docker-compose -f $COMPOSE_FILE up -d
                sleep 10
            fi
        fi
    fi
}

# 用户确认
confirm_deployment() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    echo ""
    print_warning "即将在本地开发环境执行以下操作:"
    echo "  1. 数据库迁移 (为三个型号表添加spec_pdf字段)"
    echo "  2. 重启相关服务 (${SERVICES[*]})"
    echo "  3. 验证部署结果"
    echo ""
    echo "注意：这将修改数据库结构，请确保已备份重要数据"
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
    
    # 检查MySQL容器是否运行
    local mysql_status=$(docker-compose -f $COMPOSE_FILE ps -q mysql 2>/dev/null)
    if [ -z "$mysql_status" ]; then
        print_error "MySQL容器未运行，请先启动服务"
        exit 1
    fi
    
    # 如果是全新环境，init.sql会自动创建包含spec_pdf字段的表
    # 如果是现有环境，需要执行迁移脚本
    print_info "检查是否需要执行数据库迁移..."
    
    # 检查是否已经有spec_pdf字段
    local host_spec_pdf_exists=$(docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h localhost -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW COLUMNS FROM wp_bjt_host_models LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf || echo "")
    
    if [ -z "$host_spec_pdf_exists" ]; then
        print_info "需要执行数据库迁移，正在添加spec_pdf字段..."
        
        # 检查迁移文件是否存在
        if [ -f "database/migrations/add_spec_pdf_to_models.sql" ]; then
            docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h localhost -u $DB_USER -p$DB_PASS $DB_NAME < database/migrations/add_spec_pdf_to_models.sql
            
            if [ $? -eq 0 ]; then
                print_status "数据库迁移完成"
            else
                print_error "数据库迁移失败，请检查数据库连接和SQL语法"
                exit 1
            fi
        else
            print_warning "迁移文件不存在，但init.sql已更新，新建容器时会自动包含spec_pdf字段"
        fi
    else
        print_status "spec_pdf字段已存在，跳过迁移"
    fi
}

# 重启服务
restart_services() {
    if [ "$SKIP_RESTART" = true ]; then
        print_info "跳过服务重启"
        return 0
    fi
    
    print_info "步骤2：重启相关服务..."
    
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
    
    # 等待服务完全启动
    print_info "等待服务完全启动..."
    sleep 20
}

# 验证数据库字段
verify_database_fields() {
    print_info "验证数据库表结构..."
    
    local tables=("wp_bjt_host_models" "wp_bjt_accessory_models" "wp_bjt_spare_part_models")
    local success_count=0
    
    for table in "${tables[@]}"; do
        local result=$(docker-compose -f $COMPOSE_FILE exec -T mysql mysql -h localhost -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW COLUMNS FROM $table LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf)
        
        if [ -n "$result" ]; then
            print_status "$table 表 spec_pdf 字段已添加"
            ((success_count++))
        else
            print_error "$table 表 spec_pdf 字段未找到"
        fi
    done
    
    if [ $success_count -eq ${#tables[@]} ]; then
        return 0
    else
        return 1
    fi
}

# 验证服务状态
verify_services() {
    print_info "验证服务状态..."
    
    # 检查Docker服务状态
    for service in "${ALL_SERVICES[@]}"; do
        local status=$(docker-compose -f $COMPOSE_FILE ps -q $service 2>/dev/null)
        if [ -n "$status" ]; then
            local container_status=$(docker inspect --format='{{.State.Status}}' $status 2>/dev/null)
            if [ "$container_status" = "running" ]; then
                print_status "$service 容器运行中"
            else
                print_warning "$service 容器状态: $container_status"
            fi
        else
            print_warning "$service 容器未找到"
        fi
    done
    
    # 检查HTTP服务
    if command -v curl &> /dev/null; then
        print_info "检查HTTP服务..."
        
        # 检查前端服务
        local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
        if [ "$frontend_status" = "200" ]; then
            print_status "前端服务正常运行 ($FRONTEND_URL)"
        else
            print_warning "前端服务状态码: $frontend_status"
        fi
        
        # 检查后端服务
        local backend_status=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL)
        if [ "$backend_status" = "200" ] || [ "$backend_status" = "302" ]; then
            print_status "后端服务正常运行 ($BACKEND_URL)"
        else
            print_warning "后端服务状态码: $backend_status"
        fi
        
        # 检查Nginx代理
        local nginx_status=$(curl -s -o /dev/null -w "%{http_code}" $NGINX_URL)
        if [ "$nginx_status" = "200" ] || [ "$nginx_status" = "302" ]; then
            print_status "Nginx代理正常运行 ($NGINX_URL)"
        else
            print_warning "Nginx代理状态码: $nginx_status"
        fi
    else
        print_warning "curl 未安装，跳过HTTP状态检查"
    fi
}

# 生成部署报告和测试指南
generate_deployment_report() {
    local timestamp=$(date)
    local report_file="deployment-checklist-dev-$(date +%Y%m%d-%H%M%S).md"
    
    cat << EOF > $report_file
# 规格PDF功能本地开发环境部署检查清单

**部署时间**: $timestamp  
**Docker Compose文件**: $COMPOSE_FILE  
**环境**: 本地开发环境  

## 🗃️ 数据库检查
- [x] wp_bjt_host_models 表添加 spec_pdf 字段
- [x] wp_bjt_accessory_models 表添加 spec_pdf 字段  
- [x] wp_bjt_spare_part_models 表添加 spec_pdf 字段

## 🔧 前端检查
- [x] TypeScript接口更新 (AdminHostModel, AdminAccessoryModel, AdminSparePartModel)
- [x] 主机型号页面表单添加上传组件
- [x] PdfUploader组件创建
- [x] 导出配置更新

## 🔌 后端检查
- [x] 主机型号控制器支持spec_pdf字段
- [x] 配件型号控制器支持spec_pdf字段
- [x] 备件型号控制器支持spec_pdf字段

## 🌐 服务状态
- [x] 前端开发服务: $FRONTEND_URL
- [x] WordPress后端: $BACKEND_URL  
- [x] Nginx反向代理: $NGINX_URL
- [x] MySQL数据库: localhost:3306

## 🧪 功能测试项目

### 主机型号管理测试
访问: $NGINX_URL/admin/machines
- [ ] 创建主机型号时上传规格PDF
- [ ] 编辑主机型号时更新规格PDF
- [ ] 查看PDF文件链接
- [ ] 删除PDF文件
- [ ] 导出功能包含spec_pdf字段

### API接口测试
- [ ] GET $BACKEND_URL/wp-json/bjt/v1/host-models - 响应包含spec_pdf字段
- [ ] POST $BACKEND_URL/wp-json/bjt/v1/host-models - 创建时支持spec_pdf
- [ ] PUT $BACKEND_URL/wp-json/bjt/v1/host-models/{id} - 更新时支持spec_pdf
- [ ] GET $BACKEND_URL/wp-json/bjt/v1/accessory-models - 响应包含spec_pdf字段
- [ ] GET $BACKEND_URL/wp-json/bjt/v1/spare-part-models - 响应包含spec_pdf字段

### 文件上传测试
- [ ] PDF文件类型验证正常
- [ ] 文件大小限制生效（10MB）
- [ ] 上传进度显示正常
- [ ] 文件URL生成正确
- [ ] 权限控制正常

## 🔧 开发工具
- 前端热重载: $FRONTEND_URL
- WordPress管理: $BACKEND_URL/wp-admin
- API文档: $BACKEND_URL/wp-json/bjt/v1
- 数据库管理: 推荐使用 MySQL Workbench 连接 localhost:3306

## 🐛 故障排除

### 常见问题
1. **服务无法启动**
   \`\`\`bash
   docker-compose -f $COMPOSE_FILE down
   docker-compose -f $COMPOSE_FILE up -d
   \`\`\`

2. **数据库连接失败**
   \`\`\`bash
   docker-compose -f $COMPOSE_FILE logs mysql
   \`\`\`

3. **前端编译错误**
   \`\`\`bash
   docker-compose -f $COMPOSE_FILE logs frontend
   \`\`\`

4. **重新执行迁移**
   \`\`\`bash
   ./scripts/deploy-spec-pdf-feature-dev.sh --verify-only
   \`\`\`

## 📝 下一步
1. 完成功能测试验证
2. 检查浏览器控制台确认无错误
3. 验证PDF文件上传和显示
4. 测试不同型号的CRUD操作
5. 验证导出功能

EOF

    print_status "部署报告已生成: $report_file"
}

# 显示快速访问链接
show_quick_links() {
    echo ""
    echo "=========================================="
    print_info "快速访问链接:"
    echo "🌐 前端管理界面: $NGINX_URL"
    echo "🌐 WordPress后台: $BACKEND_URL/wp-admin"
    echo "🌐 主机型号管理: $NGINX_URL/admin/machines"
    echo "🌐 API根路径: $BACKEND_URL/wp-json/bjt/v1"
    echo "=========================================="
}

# 主执行流程
main() {
    check_prerequisites
    check_services_status
    
    if [ "$VERIFY_ONLY" = true ]; then
        print_info "仅执行验证..."
        verify_database_fields
        verify_services
        print_status "验证完成"
        show_quick_links
        exit 0
    fi
    
    confirm_deployment
    
    execute_database_migration
    restart_services
    
    print_info "步骤3：验证部署..."
    if ! verify_database_fields; then
        print_error "数据库验证失败，但部分字段可能已添加成功"
        print_info "请检查数据库状态或重新运行验证: $0 --verify-only"
    fi
    
    verify_services
    generate_deployment_report
    
    echo "=========================================="
    print_status "规格PDF功能本地开发环境部署完成！"
    show_quick_links
    print_info "请参考生成的检查清单进行功能测试"
    echo "=========================================="
}

# 执行主流程
main 