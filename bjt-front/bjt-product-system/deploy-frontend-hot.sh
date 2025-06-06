#!/bin/bash

# BJT Product System - 前端热部署脚本
# 支持零停机时间的前端更新
# 使用方法: ./deploy-frontend-hot.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "BJT产品管理系统 - 前端热部署"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -e, --env ENV        指定环境 (prod|staging|dev)"
    echo "  -u, --api-url URL    指定API URL"
    echo "  -f, --force         强制执行，跳过确认"
    echo "  -b, --backup        创建当前版本备份"
    echo "  -r, --rollback      回滚到上一个版本"
    echo "  -v, --verify        验证部署后状态"
    echo "  -s, --strategy STR  部署策略 (replace|blue-green)"
    echo ""
    echo "示例:"
    echo "  $0 -e prod                    生产环境热部署"
    echo "  $0 -e prod -s blue-green     使用蓝绿部署策略"
    echo "  $0 -e prod -b                部署前创建备份"
    echo "  $0 -e prod -r                回滚到上一版本"
    echo "  $0 -v                        仅验证当前状态"
}

# 默认配置
ENV="prod"
API_URL=""
FORCE=false
BACKUP=false
ROLLBACK=false
VERIFY_ONLY=false
STRATEGY="replace"
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -u|--api-url)
            API_URL="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        -v|--verify)
            VERIFY_ONLY=true
            shift
            ;;
        -s|--strategy)
            STRATEGY="$2"
            shift 2
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 根据环境设置配置
setup_environment() {
    case $ENV in
        prod)
            COMPOSE_FILE="docker/prod/docker-compose.prod.yml"
            ENV_FILE=".env.production"
            FRONTEND_DIR="frontend_builds/prod"
            ;;
        staging)
            COMPOSE_FILE="docker/staging/docker-compose.staging.yml"
            ENV_FILE=".env.staging"
            FRONTEND_DIR="frontend_builds/staging"
            ;;
        dev)
            COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"
            ENV_FILE=".env.development"
            FRONTEND_DIR="frontend_builds/dev"
            ;;
        *)
            print_error "不支持的环境: $ENV"
            exit 1
            ;;
    esac
    
    print_info "环境: $ENV"
    print_info "Docker Compose: $COMPOSE_FILE"
    print_info "前端目录: $FRONTEND_DIR"
}

# 加载环境变量
load_env_vars() {
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        print_info "已加载环境变量: $ENV_FILE"
        
        # 设置API URL
        if [ -z "$API_URL" ]; then
            if [ -n "$DOMAIN_NAME" ]; then
                API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1"
            else
                API_URL="http://localhost:8080/wp-json/bjt/v1"
            fi
        fi
        print_info "API URL: $API_URL"
    else
        print_warning "环境文件不存在: $ENV_FILE"
    fi
}

# 检查Docker服务状态
check_docker_status() {
    print_info "检查Docker服务状态..."
    
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q nginx; then
        print_error "Nginx容器未运行，请先启动服务"
        exit 1
    fi
    
    local nginx_status=$(docker-compose -f "$COMPOSE_FILE" ps nginx | grep Up)
    if [ -z "$nginx_status" ]; then
        print_error "Nginx容器状态异常"
        exit 1
    fi
    
    print_message "Docker服务状态正常"
}

# 创建前端构建目录
create_frontend_dirs() {
    print_info "创建前端构建目录..."
    
    mkdir -p "$FRONTEND_DIR"
    mkdir -p "${FRONTEND_DIR}_backup"
    mkdir -p "${FRONTEND_DIR}_blue"
    mkdir -p "${FRONTEND_DIR}_green"
    
    print_message "前端目录创建完成"
}

# 构建前端应用
build_frontend() {
    print_message "开始构建前端应用..."
    
    cd frontend
    
    # 检查package.json
    if [ ! -f "package.json" ]; then
        print_error "未找到 frontend/package.json"
        exit 1
    fi
    
    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        print_info "安装前端依赖..."
        npm ci
    fi
    
    # 构建前端应用
    print_info "构建前端应用..."
    print_info "API URL: $API_URL"
    
    VITE_API_URL="$API_URL" npm run build
    
    if [ $? -ne 0 ]; then
        print_error "前端构建失败"
        exit 1
    fi
    
    cd ..
    
    print_message "前端构建完成"
}

# 备份当前版本
backup_current_version() {
    if [ "$BACKUP" = false ] && [ "$ROLLBACK" = false ]; then
        return 0
    fi
    
    print_info "备份当前前端版本..."
    
    if [ -d "$FRONTEND_DIR" ]; then
        local backup_dir="${FRONTEND_DIR}_backup/$(date +'%Y%m%d_%H%M%S')"
        mkdir -p "$backup_dir"
        cp -r "$FRONTEND_DIR"/* "$backup_dir/" 2>/dev/null || true
        
        # 保持最近5个备份
        local backup_count=$(ls -1 "${FRONTEND_DIR}_backup/" | wc -l)
        if [ $backup_count -gt 5 ]; then
            ls -1t "${FRONTEND_DIR}_backup/" | tail -n +6 | xargs -I {} rm -rf "${FRONTEND_DIR}_backup/{}"
        fi
        
        print_message "备份完成: $backup_dir"
    else
        print_warning "当前版本目录不存在，跳过备份"
    fi
}

# 回滚到上一版本
rollback_to_previous() {
    print_message "回滚到上一版本..."
    
    local latest_backup=$(ls -1t "${FRONTEND_DIR}_backup/" 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        print_error "未找到备份版本"
        exit 1
    fi
    
    print_info "回滚到: $latest_backup"
    
    # 清空当前目录
    rm -rf "$FRONTEND_DIR"/*
    
    # 恢复备份
    cp -r "${FRONTEND_DIR}_backup/$latest_backup"/* "$FRONTEND_DIR/"
    
    # 重新加载Nginx
    reload_nginx
    
    print_message "回滚完成"
}

# 直接替换策略
deploy_replace_strategy() {
    print_info "使用直接替换策略..."
    
    # 备份当前版本
    backup_current_version
    
    # 构建新版本
    build_frontend
    
    # 直接替换文件
    print_info "替换前端文件..."
    
    # 清空目标目录
    rm -rf "$FRONTEND_DIR"/*
    
    # 复制新构建的文件
    cp -r frontend/build/* "$FRONTEND_DIR/"
    
    # 重新加载Nginx配置
    reload_nginx
    
    print_message "直接替换部署完成"
}

# 蓝绿部署策略
deploy_blue_green_strategy() {
    print_info "使用蓝绿部署策略..."
    
    # 确定当前活跃目录
    local current_active=""
    local next_active=""
    
    if [ -L "$FRONTEND_DIR" ]; then
        current_active=$(readlink "$FRONTEND_DIR" | grep -o "blue\|green")
    fi
    
    if [ "$current_active" = "blue" ]; then
        next_active="green"
    else
        next_active="blue"
    fi
    
    print_info "当前活跃: ${current_active:-none}"
    print_info "下次活跃: $next_active"
    
    # 构建到非活跃目录
    build_frontend
    
    local target_dir="${FRONTEND_DIR}_${next_active}"
    
    print_info "部署到: $target_dir"
    
    # 清空目标目录并复制新文件
    rm -rf "$target_dir"/*
    cp -r frontend/build/* "$target_dir/"
    
    # 测试新版本（可选）
    test_new_version "$target_dir"
    
    # 原子切换
    print_info "执行原子切换..."
    
    # 创建新的符号链接
    local temp_link="${FRONTEND_DIR}_temp"
    ln -sfn "$target_dir" "$temp_link"
    mv "$temp_link" "$FRONTEND_DIR"
    
    # 重新加载Nginx
    reload_nginx
    
    print_message "蓝绿部署完成，当前活跃: $next_active"
}

# 测试新版本
test_new_version() {
    local test_dir="$1"
    
    print_info "测试新版本..."
    
    # 检查关键文件是否存在
    if [ ! -f "$test_dir/index.html" ]; then
        print_error "新版本缺少 index.html"
        exit 1
    fi
    
    # 检查文件大小（防止空文件）
    local index_size=$(stat -f%z "$test_dir/index.html" 2>/dev/null || stat -c%s "$test_dir/index.html" 2>/dev/null)
    if [ "$index_size" -lt 100 ]; then
        print_error "index.html 文件异常（太小）"
        exit 1
    fi
    
    print_message "新版本测试通过"
}

# 重新加载Nginx
reload_nginx() {
    print_info "重新加载Nginx配置..."
    
    # 测试Nginx配置
    if docker-compose -f "$COMPOSE_FILE" exec nginx nginx -t; then
        # 重新加载配置
        docker-compose -f "$COMPOSE_FILE" exec nginx nginx -s reload
        print_message "Nginx配置重新加载成功"
    else
        print_error "Nginx配置测试失败"
        exit 1
    fi
    
    # 等待重新加载完成
    sleep 2
}

# 验证部署状态
verify_deployment() {
    print_info "验证部署状态..."
    
    # 检查文件是否存在
    if [ ! -d "$FRONTEND_DIR" ] || [ -z "$(ls -A "$FRONTEND_DIR")" ]; then
        print_error "前端目录为空或不存在"
        return 1
    fi
    
    # 检查关键文件
    if [ ! -f "$FRONTEND_DIR/index.html" ]; then
        print_error "index.html 文件不存在"
        return 1
    fi
    
    # 设置上传文件权限
    setup_uploads_permissions
    
    # 检查HTTP响应
    local domain=${DOMAIN_NAME:-localhost}
    local protocol="https"
    
    if [ "$ENV" = "dev" ]; then
        protocol="http"
        domain="localhost"
    fi
    
    local url="${protocol}://${domain}"
    
    print_info "测试HTTP响应: $url"
    
    if command -v curl &> /dev/null; then
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" -k "$url")
        if [ "$http_status" = "200" ]; then
            print_message "HTTP响应正常 (200)"
        else
            print_warning "HTTP响应异常: $http_status"
            return 1
        fi
    else
        print_warning "curl 未安装，跳过HTTP测试"
    fi
    
    print_message "部署验证通过"
    return 0
}

# 设置上传文件权限
setup_uploads_permissions() {
    print_info "设置上传文件权限..."
    
    local uploads_dir="frontend/public/uploads"
    
    # 创建上传目录结构（如果不存在）
    local upload_subdirs=(
        "specifications"
        "machines"
        "parts"
        "consumables"
        "spare-parts"
        "accessory"
        "host"
        "product_lines"
        "spare_parts"
    )
    
    # 确保主上传目录存在
    if [ ! -d "$uploads_dir" ]; then
        mkdir -p "$uploads_dir"
        print_info "创建上传目录: $uploads_dir"
    fi
    
    # 创建子目录
    for subdir in "${upload_subdirs[@]}"; do
        if [ ! -d "$uploads_dir/$subdir" ]; then
            mkdir -p "$uploads_dir/$subdir"
            print_info "创建上传子目录: $uploads_dir/$subdir"
        fi
    done
    
    # 设置权限
    chmod -R 755 "$uploads_dir" 2>/dev/null || true
    
    # 修复容器内权限（如果容器正在运行）
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q nginx; then
        print_info "修复nginx容器内上传目录权限..."
        docker-compose -f "$COMPOSE_FILE" exec nginx sh -c "
            if [ -d /usr/share/nginx/html/uploads ]; then
                chown -R nginx:nginx /usr/share/nginx/html/uploads 2>/dev/null || true
                chmod -R 755 /usr/share/nginx/html/uploads 2>/dev/null || true
            fi
        " 2>/dev/null || true
    fi
    
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q wordpress; then
        print_info "修复WordPress容器内上传目录权限..."
        docker-compose -f "$COMPOSE_FILE" exec wordpress sh -c "
            if [ -d /var/www/html/frontend/public/uploads ]; then
                chown -R www-data:www-data /var/www/html/frontend/public/uploads 2>/dev/null || true
                chmod -R 755 /var/www/html/frontend/public/uploads 2>/dev/null || true
            fi
        " 2>/dev/null || true
    fi
    
    print_message "上传文件权限设置完成"
}

# 生成部署报告
generate_deployment_report() {
    local timestamp=$(date)
    local report_file="frontend-deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat << EOF > $report_file
# 前端热部署报告

**部署时间**: $timestamp  
**环境**: $ENV  
**策略**: $STRATEGY  
**API URL**: $API_URL  
**前端目录**: $FRONTEND_DIR  

## 部署详情

### 构建信息
- Node.js版本: $(node --version 2>/dev/null || echo "未检测到")
- NPM版本: $(npm --version 2>/dev/null || echo "未检测到")
- 构建时间: $timestamp

### 文件统计
- 总文件数: $(find "$FRONTEND_DIR" -type f | wc -l)
- 总大小: $(du -sh "$FRONTEND_DIR" | cut -f1)
- 主要文件:
$(ls -la "$FRONTEND_DIR"/ | head -10)

### 验证结果
- 文件完整性: ✅
- HTTP访问: $([ -f /tmp/http_test_result ] && cat /tmp/http_test_result || echo "未测试")

## 备份信息
- 备份目录: ${FRONTEND_DIR}_backup
- 可用备份: $(ls -1 "${FRONTEND_DIR}_backup/" 2>/dev/null | wc -l) 个

## 回滚命令
如需回滚，请执行：
\`\`\`bash
./deploy-frontend-hot.sh -e $ENV --rollback
\`\`\`

## 维护命令
重新部署：
\`\`\`bash
./deploy-frontend-hot.sh -e $ENV
\`\`\`

验证状态：
\`\`\`bash
./deploy-frontend-hot.sh -e $ENV --verify
\`\`\`

EOF

    print_message "部署报告已生成: $report_file"
}

# 主函数
main() {
    echo "=========================================="
    print_message "BJT产品管理系统 - 前端热部署"
    echo "=========================================="
    
    setup_environment
    load_env_vars
    create_frontend_dirs
    
    if [ "$VERIFY_ONLY" = true ]; then
        verify_deployment
        exit $?
    fi
    
    if [ "$ROLLBACK" = true ]; then
        check_docker_status
        rollback_to_previous
        verify_deployment
        exit $?
    fi
    
    # 确认部署
    if [ "$FORCE" = false ]; then
        echo ""
        print_warning "准备热部署前端到 $ENV 环境"
        print_info "部署策略: $STRATEGY"
        print_info "API URL: $API_URL"
        echo ""
        read -p "确定要继续吗? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "部署已取消"
            exit 0
        fi
    fi
    
    check_docker_status
    
    # 执行部署策略
    case $STRATEGY in
        replace)
            deploy_replace_strategy
            ;;
        blue-green)
            deploy_blue_green_strategy
            ;;
        *)
            print_error "不支持的部署策略: $STRATEGY"
            exit 1
            ;;
    esac
    
    # 验证部署
    if verify_deployment; then
        generate_deployment_report
        
        echo "=========================================="
        print_message "前端热部署成功完成！"
        print_info "环境: $ENV"
        print_info "策略: $STRATEGY"
        print_info "访问地址: ${protocol:-https}://${DOMAIN_NAME:-localhost}"
        echo "=========================================="
    else
        print_error "部署验证失败，请检查日志"
        exit 1
    fi
}

# 运行主函数
main "$@" 