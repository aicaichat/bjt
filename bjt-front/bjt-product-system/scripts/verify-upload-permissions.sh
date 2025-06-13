#!/bin/bash
# 上传权限验证脚本
# 检查文件上传系统的完整配置

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}[检查]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# 检查目录结构
check_directory_structure() {
    print_step "检查上传目录结构"
    
    local base_dir="frontend/public/uploads"
    local required_dirs=(
        "$base_dir"
        "$base_dir/machines"
        "$base_dir/machines/pdfs"
        "$base_dir/machines/images"
        "$base_dir/consumables"
        "$base_dir/consumables/pdfs"
        "$base_dir/consumables/images"
        "$base_dir/spare-parts"
        "$base_dir/spare-parts/pdfs"
        "$base_dir/spare-parts/images"
        "$base_dir/accessories"
        "$base_dir/accessories/pdfs"
        "$base_dir/accessories/images"
    )
    
    local missing_dirs=0
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "目录存在: $dir"
        else
            print_error "目录缺失: $dir"
            missing_dirs=$((missing_dirs + 1))
        fi
    done
    
    if [ $missing_dirs -eq 0 ]; then
        print_success "所有必需目录都存在"
    else
        print_warning "发现 $missing_dirs 个缺失目录"
        print_info "运行以下命令创建缺失目录:"
        for dir in "${required_dirs[@]}"; do
            if [ ! -d "$dir" ]; then
                echo "  mkdir -p $dir"
            fi
        done
    fi
}

# 检查目录权限
check_directory_permissions() {
    print_step "检查目录权限"
    
    local base_dir="frontend/public/uploads"
    
    if [ ! -d "$base_dir" ]; then
        print_error "基础上传目录不存在: $base_dir"
        return 1
    fi
    
    # 检查目录权限
    local dir_perm=$(stat -c "%a" "$base_dir" 2>/dev/null || stat -f "%A" "$base_dir" 2>/dev/null)
    if [ "$dir_perm" = "755" ] || [ "$dir_perm" = "2755" ]; then
        print_success "目录权限正确: $dir_perm"
    else
        print_warning "目录权限可能不正确: $dir_perm (建议: 755)"
    fi
    
    # 测试目录可写性
    local test_file="$base_dir/.permission_test"
    if echo "test" > "$test_file" 2>/dev/null; then
        rm "$test_file"
        print_success "目录可写"
    else
        print_error "目录不可写"
    fi
}

# 检查Docker挂载配置
check_docker_mounts() {
    print_step "检查Docker挂载配置"
    
    local compose_file="docker/prod/docker-compose.prod.yml"
    
    if [ ! -f "$compose_file" ]; then
        print_error "Docker Compose文件不存在: $compose_file"
        return 1
    fi
    
    # 检查nginx服务的上传目录挂载
    if grep -q "frontend/public/uploads:/usr/share/nginx/html/uploads:rw" "$compose_file"; then
        print_success "nginx uploads挂载配置正确"
    else
        print_error "nginx uploads挂载配置缺失"
    fi
    
    if grep -q "frontend/public/uploads:/var/www/html/frontend/public/uploads:rw" "$compose_file"; then
        print_success "WordPress uploads挂载配置正确"
    else
        print_error "WordPress uploads挂载配置缺失"
    fi
}

# 检查nginx配置
check_nginx_config() {
    print_step "检查nginx配置"
    
    local nginx_config="nginx/conf.d/production.conf"
    
    if [ ! -f "$nginx_config" ]; then
        print_error "nginx配置文件不存在: $nginx_config"
        return 1
    fi
    
    # 检查uploads location配置
    if grep -q "location /uploads/" "$nginx_config"; then
        print_success "nginx uploads路由配置存在"
    else
        print_error "nginx uploads路由配置缺失"
    fi
    
    # 检查alias配置
    if grep -q "alias /usr/share/nginx/html/uploads/" "$nginx_config"; then
        print_success "nginx uploads alias配置正确"
    else
        print_error "nginx uploads alias配置缺失"
    fi
    
    # 检查安全配置
    if grep -q "location.*\\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)" "$nginx_config"; then
        print_success "nginx安全配置存在（禁止脚本执行）"
    else
        print_warning "nginx安全配置可能缺失"
    fi
    
    # 检查允许的文件类型
    if grep -q "\\.(pdf|jpg|jpeg|png|gif|svg|doc|docx|xls|xlsx|zip|rar|txt)" "$nginx_config"; then
        print_success "nginx允许文件类型配置正确"
    else
        print_warning "nginx文件类型限制可能缺失"
    fi
}

# 检查部署脚本配置
check_deploy_script() {
    print_step "检查部署脚本配置"
    
    local deploy_script="deploy-production-safe.sh"
    
    if [ ! -f "$deploy_script" ]; then
        print_error "部署脚本不存在: $deploy_script"
        return 1
    fi
    
    # 检查setup_upload_permissions函数
    if grep -q "setup_upload_permissions()" "$deploy_script"; then
        print_success "部署脚本包含上传权限设置函数"
    else
        print_error "部署脚本缺少上传权限设置函数"
    fi
    
    # 检查函数调用
    if grep -q "setup_upload_permissions" "$deploy_script" | grep -v "setup_upload_permissions()"; then
        print_success "部署脚本会执行上传权限设置"
    else
        print_warning "部署脚本可能不会执行上传权限设置"
    fi
}

# 创建上传目录结构
create_upload_structure() {
    print_step "创建完整的上传目录结构"
    
    local base_dir="frontend/public/uploads"
    local upload_dirs=(
        "$base_dir"
        "$base_dir/machines"
        "$base_dir/machines/pdfs"
        "$base_dir/machines/images"
        "$base_dir/consumables"
        "$base_dir/consumables/pdfs"
        "$base_dir/consumables/images"
        "$base_dir/spare-parts"
        "$base_dir/spare-parts/pdfs"
        "$base_dir/spare-parts/images"
        "$base_dir/accessories"
        "$base_dir/accessories/pdfs"
        "$base_dir/accessories/images"
    )
    
    for dir in "${upload_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "创建目录: $dir"
        fi
        chmod 755 "$dir"
    done
    
    # 创建.gitkeep文件确保目录被git跟踪
    for dir in "${upload_dirs[@]}"; do
        if [ ! -f "$dir/.gitkeep" ]; then
            touch "$dir/.gitkeep"
        fi
    done
    
    print_success "上传目录结构创建完成"
}

# 设置正确的权限
fix_permissions() {
    print_step "修复上传目录权限"
    
    local base_dir="frontend/public/uploads"
    
    if [ ! -d "$base_dir" ]; then
        print_error "基础上传目录不存在，请先创建目录结构"
        return 1
    fi
    
    # 设置目录权限
    find "$base_dir" -type d -exec chmod 755 {} \;
    print_info "已设置所有目录权限为 755"
    
    # 设置文件权限
    find "$base_dir" -type f -exec chmod 644 {} \;
    print_info "已设置所有文件权限为 644"
    
    print_success "权限修复完成"
}

# 测试文件上传
test_file_operations() {
    print_step "测试文件操作"
    
    local test_dir="frontend/public/uploads/machines/pdfs"
    local test_file="$test_dir/test-upload.txt"
    
    if [ ! -d "$test_dir" ]; then
        print_error "测试目录不存在: $test_dir"
        return 1
    fi
    
    # 测试文件创建
    if echo "This is a test file for upload permissions." > "$test_file" 2>/dev/null; then
        print_success "文件创建测试通过"
        
        # 测试文件读取
        if cat "$test_file" > /dev/null 2>&1; then
            print_success "文件读取测试通过"
        else
            print_error "文件读取测试失败"
        fi
        
        # 测试文件删除
        if rm "$test_file" 2>/dev/null; then
            print_success "文件删除测试通过"
        else
            print_error "文件删除测试失败"
        fi
    else
        print_error "文件创建测试失败"
    fi
}

# 检查运行时容器挂载
check_runtime_mounts() {
    print_step "检查运行时容器挂载（如果容器正在运行）"
    
    # 检查nginx容器
    if docker ps | grep -q "nginx"; then
        local nginx_container=$(docker ps | grep nginx | awk '{print $1}')
        
        if docker exec "$nginx_container" ls -la /usr/share/nginx/html/uploads > /dev/null 2>&1; then
            print_success "nginx容器uploads目录挂载正常"
        else
            print_warning "nginx容器uploads目录访问异常"
        fi
        
        # 测试在容器内创建文件
        if docker exec "$nginx_container" touch /usr/share/nginx/html/uploads/.container_test 2>/dev/null; then
            docker exec "$nginx_container" rm /usr/share/nginx/html/uploads/.container_test 2>/dev/null
            print_success "nginx容器uploads目录可写"
        else
            print_warning "nginx容器uploads目录不可写"
        fi
    else
        print_info "nginx容器未运行，跳过运行时检查"
    fi
}

# 生成上传配置报告
generate_report() {
    print_step "生成上传配置报告"
    
    local report_file="upload-config-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "BJT产品管理系统 - 上传权限配置报告"
        echo "生成时间: $(date)"
        echo "=========================================="
        echo ""
        
        echo "目录结构检查:"
        if [ -d "frontend/public/uploads" ]; then
            find frontend/public/uploads -type d | sort | while read dir; do
                perm=$(stat -c "%a" "$dir" 2>/dev/null || stat -f "%A" "$dir" 2>/dev/null)
                echo "  $dir (权限: $perm)"
            done
        else
            echo "  uploads目录不存在"
        fi
        echo ""
        
        echo "Docker配置检查:"
        if [ -f "docker/prod/docker-compose.prod.yml" ]; then
            echo "  Docker Compose文件: 存在"
            if grep -q "frontend/public/uploads" docker/prod/docker-compose.prod.yml; then
                echo "  uploads挂载配置: 已配置"
            else
                echo "  uploads挂载配置: 缺失"
            fi
        else
            echo "  Docker Compose文件: 不存在"
        fi
        echo ""
        
        echo "nginx配置检查:"
        if [ -f "nginx/conf.d/production.conf" ]; then
            echo "  nginx配置文件: 存在"
            if grep -q "location /uploads/" nginx/conf.d/production.conf; then
                echo "  uploads路由配置: 已配置"
            else
                echo "  uploads路由配置: 缺失"
            fi
        else
            echo "  nginx配置文件: 不存在"
        fi
        echo ""
        
        echo "建议的修复命令:"
        echo "  创建目录结构: $0 --create"
        echo "  修复权限: $0 --fix-permissions"
        echo "  完整检查: $0 --check"
        
    } > "$report_file"
    
    print_success "配置报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "上传权限验证脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --check              完整检查上传配置"
    echo "  --create             创建上传目录结构"
    echo "  --fix-permissions    修复目录权限"
    echo "  --test               测试文件操作"
    echo "  --report             生成配置报告"
    echo "  --help               显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --check          # 完整检查"
    echo "  $0 --create         # 创建目录并修复权限"
    echo "  $0 --test           # 测试文件操作"
}

# 主函数
main() {
    case "${1:---check}" in
        --check)
            echo "==================== 上传权限配置检查 ===================="
            check_directory_structure
            check_directory_permissions
            check_docker_mounts
            check_nginx_config
            check_deploy_script
            check_runtime_mounts
            echo ""
            echo "=========================================================="
            ;;
        --create)
            create_upload_structure
            fix_permissions
            ;;
        --fix-permissions)
            fix_permissions
            ;;
        --test)
            test_file_operations
            ;;
        --report)
            generate_report
            ;;
        --help)
            show_help
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 