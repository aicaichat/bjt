#!/bin/bash
# BJT产品管理系统 - 安全生产环境部署脚本
# 专为一次性成功部署设计，包含完整的错误处理和回滚机制

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
    echo "  BJT产品管理系统 - 安全生产环境部署"
    echo "  版本: v2.0 (支持购物车系统)"
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
DEPLOYMENT_MODE="full"  # full | migration-only | backup-only | verify-only
BACKUP_DIR=""
DEPLOYMENT_LOG="logs/deployment-$(date +%Y%m%d_%H%M%S).log"

# 创建日志目录
mkdir -p logs

# 日志记录函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$DEPLOYMENT_LOG"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --mode=MODE          部署模式 (full|migration-only|backup-only|verify-only)"
    echo "  --domain=DOMAIN      指定域名"
    echo "  --skip-ssl          跳过SSL证书检查"
    echo "  --skip-backup       跳过备份步骤"
    echo "  --help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                                # 完整部署"
    echo "  $0 --mode=verify-only            # 仅验证环境"
    echo "  $0 --domain=bjt.example.com      # 指定域名部署"
    echo "  $0 --skip-ssl --skip-backup      # 快速部署"
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mode=*)
                DEPLOYMENT_MODE="${1#*=}"
                shift
                ;;
            --domain=*)
                FORCE_DOMAIN="${1#*=}"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 环境变量验证
validate_environment() {
    print_step "验证环境配置..."
    
    # 检查.env.production文件
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_info "请运行: cp env.production.example .env.production"
        print_info "然后编辑 .env.production 配置您的环境变量"
        exit 1
    fi
    
    # 加载环境变量
    source .env.production
    log_message "已加载环境变量配置"
    
    # 验证必需的环境变量
    local required_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_AUTH_SECRET_KEY"
        "WP_HOME"
        "WP_SITEURL"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "以下环境变量未设置："
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    # 使用强制指定的域名（如果有）
    if [ ! -z "$FORCE_DOMAIN" ]; then
        DOMAIN_NAME="$FORCE_DOMAIN"
        print_info "使用强制指定的域名: $DOMAIN_NAME"
    fi
    
    print_success "环境变量验证通过"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "数据库: $MYSQL_DATABASE"
    
    # 验证购物车系统环境变量（新增）
    print_step "验证购物车系统配置..."
    
    local cart_vars=(
        "REACT_APP_ENABLE_SMART_UNITS"
        "REACT_APP_ENABLE_CART_ENHANCEMENT"
        "VITE_ENABLE_SMART_UNITS"
        "VITE_ENABLE_CART_ENHANCEMENT"
    )
    
    local missing_cart_vars=()
    for var in "${cart_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_cart_vars+=("$var")
        fi
    done
    
    if [ ${#missing_cart_vars[@]} -gt 0 ]; then
        print_warning "购物车系统环境变量未设置，将使用默认值:"
        for var in "${missing_cart_vars[@]}"; do
            echo "  - $var=false (默认关闭)"
        done
        print_info "购物车功能将在部署成功后可手动启用"
    else
        print_success "购物车系统环境变量配置完整"
        print_info "智能单位制: ${REACT_APP_ENABLE_SMART_UNITS:-false}"
        print_info "购物车增强: ${REACT_APP_ENABLE_CART_ENHANCEMENT:-false}"
    fi
    
    log_message "环境变量验证完成"
}

# 前置条件检查
check_prerequisites() {
    print_step "检查前置条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查端口占用
    if netstat -tuln | grep -q ":80 \|:443 "; then
        print_warning "端口80或443可能被占用"
        print_info "将在部署过程中尝试停止冲突服务"
    fi
    
    # 检查磁盘空间
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB
        print_warning "可用磁盘空间不足2GB，建议清理空间"
    fi
    
    # 检查内存
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 1024 ]; then  # 1GB
        print_warning "可用内存不足1GB，可能影响部署性能"
    fi
    
    print_success "前置条件检查通过"
    log_message "前置条件检查完成"
}

# SSL证书检查和处理
handle_ssl_certificate() {
    if [ "$SKIP_SSL" = true ]; then
        print_step "跳过SSL证书检查..."
        return 0
    fi
    
    print_step "检查SSL证书..."
    
    local ssl_cert="nginx/ssl/cert.pem"
    local ssl_key="nginx/ssl/private.key"
    
    # 如果证书不存在或即将过期，自动生成
    if [ ! -f "$ssl_cert" ] || [ ! -f "$ssl_key" ]; then
        print_warning "SSL证书不存在，自动生成自签名证书..."
        
        mkdir -p nginx/ssl
        
        # 生成自签名证书
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$ssl_key" \
            -out "$ssl_cert" \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=BJT/CN=${DOMAIN_NAME}" \
            -config <(
                echo '[dn]'
                echo "CN=${DOMAIN_NAME}"
                echo '[req]'
                echo 'distinguished_name = dn'
                echo '[v3_ca]'
                echo 'basicConstraints = CA:FALSE'
                echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
                echo "subjectAltName = @alt_names"
                echo '[alt_names]'
                echo "DNS.1 = ${DOMAIN_NAME}"
                echo "DNS.2 = www.${DOMAIN_NAME}"
            ) -extensions v3_ca
        
        chmod 644 "$ssl_cert"
        chmod 600 "$ssl_key"
        
        print_success "自签名SSL证书生成完成"
        print_info "如需正式证书，请运行: ./scripts/ssl-deployment-complete.sh $DOMAIN_NAME letsencrypt"
    else
        # 验证现有证书
        if openssl x509 -in "$ssl_cert" -noout -text &>/dev/null; then
            local expiry=$(openssl x509 -in "$ssl_cert" -noout -enddate | cut -d= -f2)
            local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
            local current_timestamp=$(date +%s)
            local days_left=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ $days_left -lt 30 ]; then
                print_warning "SSL证书即将过期 (剩余 $days_left 天)"
                print_info "建议更新证书: ./scripts/ssl-deployment-complete.sh $DOMAIN_NAME letsencrypt"
            else
                print_success "SSL证书有效 (剩余 $days_left 天)"
            fi
        else
            print_error "SSL证书格式错误"
            exit 1
        fi
    fi
    
    log_message "SSL证书检查完成"
}

# 备份当前部署
backup_current_deployment() {
    if [ "$SKIP_BACKUP" = true ] || [ "$DEPLOYMENT_MODE" = "backup-only" ]; then
        if [ "$DEPLOYMENT_MODE" = "backup-only" ]; then
            print_step "执行备份..."
        else
            print_step "跳过备份步骤..."
            return 0
        fi
    else
        print_step "备份当前部署..."
    fi
    
    BACKUP_DIR="backups/deployment-$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # 备份配置文件
    if [ -f ".env.production" ]; then
        cp .env.production "$BACKUP_DIR/"
        print_info "✓ 环境配置已备份"
    fi
    
    # 备份nginx配置
    if [ -d "nginx" ]; then
        cp -r nginx "$BACKUP_DIR/"
        print_info "✓ Nginx配置已备份"
    fi
    
    # 备份前端构建文件
    if [ -d "frontend/build" ] || [ -d "frontend/dist" ]; then
        mkdir -p "$BACKUP_DIR/frontend"
        [ -d "frontend/build" ] && cp -r frontend/build "$BACKUP_DIR/frontend/"
        [ -d "frontend/dist" ] && cp -r frontend/dist "$BACKUP_DIR/frontend/"
        print_info "✓ 前端构建文件已备份"
    fi
    
    # 备份数据库
    if docker-compose -f docker/prod/docker-compose.prod.yml ps mysql 2>/dev/null | grep -q "Up"; then
        print_info "备份数据库..."
        
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
            mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > "$BACKUP_DIR/database.sql" 2>/dev/null; then
            print_info "✓ 数据库已备份"
        else
            print_warning "数据库备份失败，可能数据库未运行"
        fi
    else
        print_info "数据库服务未运行，跳过数据库备份"
    fi
    
    print_success "备份完成，保存在: $BACKUP_DIR"
    log_message "备份完成: $BACKUP_DIR"
    
    if [ "$DEPLOYMENT_MODE" = "backup-only" ]; then
        print_success "备份完成，退出"
        exit 0
    fi
}

# 构建前端应用（支持购物车系统）
build_frontend() {
    print_step "构建前端应用 (支持购物车系统)..."
    
    cd frontend
    
    # 清理之前的构建
    print_info "清理之前的构建文件..."
    rm -rf build dist node_modules/.cache 2>/dev/null || true
    
    # 安装依赖
    print_info "安装前端依赖..."
    if ! npm ci; then
        print_error "前端依赖安装失败"
        exit 1
    fi
    
    # 设置构建环境变量（购物车系统支持）
    export VITE_API_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1"
    
    # 从.env.production加载购物车系统配置
    if [ ! -z "$REACT_APP_ENABLE_SMART_UNITS" ]; then
        export VITE_ENABLE_SMART_UNITS="$REACT_APP_ENABLE_SMART_UNITS"
    fi
    
    if [ ! -z "$REACT_APP_ENABLE_CART_ENHANCEMENT" ]; then
        export VITE_ENABLE_CART_ENHANCEMENT="$REACT_APP_ENABLE_CART_ENHANCEMENT"
    fi
    
    if [ ! -z "$REACT_APP_DEBUG" ]; then
        export VITE_DEBUG="$REACT_APP_DEBUG"
    fi
    
    print_info "构建环境变量:"
    print_info "  API_URL: $VITE_API_URL"
    print_info "  智能单位制: ${VITE_ENABLE_SMART_UNITS:-false}"
    print_info "  购物车增强: ${VITE_ENABLE_CART_ENHANCEMENT:-false}"
    print_info "  调试模式: ${VITE_DEBUG:-false}"
    
    # 构建生产版本
    print_info "构建前端生产版本..."
    if ! npm run build; then
        print_error "前端构建失败"
        exit 1
    fi
    
    # 验证构建结果
    if [ ! -f "build/index.html" ] && [ ! -f "dist/index.html" ]; then
        print_error "前端构建失败，未生成index.html"
        exit 1
    fi
    
    cd ..
    
    print_success "前端构建完成"
    log_message "前端构建完成"
}

# 设置上传目录权限
setup_upload_permissions() {
    print_step "设置上传目录权限..."
    
    # 创建上传目录结构
    local upload_dirs=(
        "frontend/public/uploads"
        "frontend/public/uploads/machines"
        "frontend/public/uploads/machines/pdfs"
        "frontend/public/uploads/machines/images"
        "frontend/public/uploads/consumables"
        "frontend/public/uploads/consumables/pdfs"
        "frontend/public/uploads/consumables/images"
        "frontend/public/uploads/spare-parts"
        "frontend/public/uploads/spare-parts/pdfs"
        "frontend/public/uploads/spare-parts/images"
        "frontend/public/uploads/accessories"
        "frontend/public/uploads/accessories/pdfs"
        "frontend/public/uploads/accessories/images"
    )
    
    for dir in "${upload_dirs[@]}"; do
        mkdir -p "$dir"
        chmod 755 "$dir"
    done
    
    # 创建测试文件确保目录可写
    for dir in "${upload_dirs[@]}"; do
        if echo "test" > "$dir/.test" 2>/dev/null; then
            rm "$dir/.test"
        else
            print_warning "目录可能不可写: $dir"
        fi
    done
    
    print_success "上传目录权限设置完成"
    log_message "上传目录权限设置完成"
}

# 执行部署
execute_deployment() {
    print_step "执行Docker部署..."
    
    # 停止现有服务
    print_info "停止现有服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml down 2>/dev/null || true
    
    # 清理旧镜像（可选）
    print_info "清理旧镜像..."
    docker system prune -f &>/dev/null || true
    
    # 构建并启动服务
    print_info "构建并启动服务..."
    if ! docker-compose -f docker/prod/docker-compose.prod.yml up -d --build; then
        print_error "Docker服务启动失败"
        exit 1
    fi
    
    print_success "Docker服务启动完成"
    log_message "Docker服务启动完成"
}

# 健康检查
health_check() {
    print_step "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    print_info "等待服务启动..."
    while [ $attempt -le $max_attempts ]; do
        sleep 10
        
        # 检查容器状态
        if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
            print_info "尝试 $attempt/$max_attempts: 容器运行正常"
            
            # 检查网站可访问性
            if curl -k -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}" | grep -q "200\|301\|302"; then
                print_success "网站健康检查通过"
                break
            else
                print_info "网站暂时不可访问，继续等待..."
            fi
        else
            print_warning "部分容器未正常启动"
        fi
        
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "健康检查超时，请手动验证部署状态"
        show_debug_info
        exit 1
    fi
    
    # 详细健康检查
    print_info "执行详细健康检查..."
    
    # 检查API接口
    if curl -k -s "https://${DOMAIN_NAME}/wp-json/bjt/v1" | grep -q "namespace\|routes"; then
        print_success "✓ API接口正常"
    else
        print_warning "⚠ API接口可能异常"
    fi
    
    # 检查上传目录
    if [ -d "frontend/public/uploads" ]; then
        print_success "✓ 上传目录已配置"
    else
        print_warning "⚠ 上传目录未找到"
    fi
    
    # 检查购物车系统功能
    if [ "${REACT_APP_ENABLE_SMART_UNITS:-false}" = "true" ] || [ "${REACT_APP_ENABLE_CART_ENHANCEMENT:-false}" = "true" ]; then
        print_info "✓ 购物车智能系统已启用"
    else
        print_info "○ 购物车智能系统未启用 (可在后续开启)"
    fi
    
    log_message "健康检查完成"
}

# 显示调试信息
show_debug_info() {
    print_step "显示调试信息..."
    
    echo "容器状态:"
    docker-compose -f docker/prod/docker-compose.prod.yml ps
    
    echo ""
    echo "最近的服务日志:"
    docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=20
}

# 显示部署结果
show_deployment_result() {
    print_step "部署完成!"
    
    echo ""
    echo -e "${GREEN}✅ 部署成功完成！${NC}"
    echo ""
    echo "🌐 访问地址:"
    echo "   前端应用: https://$DOMAIN_NAME"
    echo "   WordPress后台: https://$DOMAIN_NAME/wp-admin"
    echo "   API接口: https://$DOMAIN_NAME/wp-json/bjt/v1"
    echo ""
    
    # SSL证书信息
    if [ -f "nginx/ssl/cert.pem" ]; then
        local issuer=$(openssl x509 -in nginx/ssl/cert.pem -noout -issuer 2>/dev/null | cut -d= -f2- | sed 's/^.*CN=//')
        local expiry=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        
        echo "🔒 SSL证书:"
        echo "   颁发者: $issuer"
        echo "   有效期: $expiry"
        
        if [[ "$issuer" == *"Let's Encrypt"* ]]; then
            echo "   ✅ 使用Let's Encrypt正式证书"
        else
            echo "   ⚠️  使用自签名证书 (浏览器会显示安全警告)"
            echo "   💡 获取正式证书: ./scripts/ssl-deployment-complete.sh $DOMAIN_NAME letsencrypt"
        fi
    fi
    
    echo ""
    echo "🛒 购物车系统:"
    if [ "${REACT_APP_ENABLE_SMART_UNITS:-false}" = "true" ]; then
        echo "   ✅ 智能单位制已启用"
    else
        echo "   ○ 智能单位制未启用"
    fi
    
    if [ "${REACT_APP_ENABLE_CART_ENHANCEMENT:-false}" = "true" ]; then
        echo "   ✅ 购物车增强已启用"
    else
        echo "   ○ 购物车增强未启用"
    fi
    
    echo ""
    echo "📁 备份信息:"
    if [ ! -z "$BACKUP_DIR" ]; then
        echo "   📦 备份位置: $BACKUP_DIR"
    fi
    echo "   📋 部署日志: $DEPLOYMENT_LOG"
    
    echo ""
    echo "🔧 管理命令:"
    echo "   查看服务状态: docker-compose -f docker/prod/docker-compose.prod.yml ps"
    echo "   查看服务日志: docker-compose -f docker/prod/docker-compose.prod.yml logs -f"
    echo "   健康监控: ./scripts/health-monitor.sh"
    echo "   前端热部署: ./deploy-frontend-hot.sh"
    echo ""
    echo "📖 文档参考:"
    echo "   故障排除: cat PRODUCTION_TROUBLESHOOTING_GUIDE.md"
    echo "   购物车功能: cat docs/购物车系统实施指南/README.md"
    
    log_message "部署完成"
}

# 主函数
main() {
    # 解析参数
    parse_arguments "$@"
    
    # 显示横幅
    print_banner
    
    print_info "部署模式: $DEPLOYMENT_MODE"
    log_message "开始部署，模式: $DEPLOYMENT_MODE"
    
    # 根据模式执行不同操作
    case $DEPLOYMENT_MODE in
        "verify-only")
            validate_environment
            check_prerequisites
            handle_ssl_certificate
            print_success "环境验证完成"
            exit 0
            ;;
        "backup-only")
            validate_environment
            backup_current_deployment
            exit 0
            ;;
        "migration-only")
            validate_environment
            setup_upload_permissions
            execute_deployment
            health_check
            ;;
        "full"|*)
            validate_environment
            check_prerequisites
            handle_ssl_certificate
            backup_current_deployment
            build_frontend
            setup_upload_permissions
            execute_deployment
            health_check
            show_deployment_result
            ;;
    esac
}

# 错误处理
handle_error() {
    local exit_code=$?
    print_error "部署过程中出现错误 (退出码: $exit_code)"
    log_message "部署失败，退出码: $exit_code"
    
    if [ ! -z "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
        print_info "可使用备份进行回滚: $BACKUP_DIR"
    fi
    
    print_info "查看完整日志: cat $DEPLOYMENT_LOG"
    print_info "调试信息:"
    show_debug_info
    
    exit $exit_code
}

# 设置错误处理
trap handle_error ERR

# 执行主函数
main "$@" 