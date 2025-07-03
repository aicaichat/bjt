#!/bin/bash

# BJT产品系统 - 智能环境配置脚本
# 自动检测环境并设置正确的配置

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测当前环境
detect_environment() {
    local env_type=""
    
    # 检测Docker环境
    if docker ps &>/dev/null && docker ps | grep -q "dev-"; then
        env_type="docker-dev"
    elif docker ps &>/dev/null && docker ps | grep -q "prod-"; then
        env_type="docker-prod"
    # 检测本地开发环境
    elif curl -s http://localhost:8080/wp-json/bjt/v1 &>/dev/null; then
        env_type="local-dev"
    # 检测生产环境
    elif [[ -f ".env.production" ]]; then
        env_type="production"
    else
        env_type="unknown"
    fi
    
    echo "$env_type"
}

# 设置Docker开发环境
setup_docker_dev() {
    print_info "配置Docker开发环境..."
    
    cd frontend
    
    # 创建或更新.env.local文件
    cat > .env.local << EOF
# Docker开发环境 - 自动生成
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_WORDPRESS_HOST=http://wordpress:80
DOCKER_ENV=true
NODE_ENV=development
VITE_DEBUG=true
EOF
    
    print_info "Docker开发环境配置完成"
    print_info "访问地址: http://localhost:5173"
    print_info "API代理: /wp-json/* → http://wordpress:80"
}

# 设置本地开发环境
setup_local_dev() {
    print_info "配置本地开发环境..."
    
    cd frontend
    
    # 创建或更新.env.local文件
    cat > .env.local << EOF
# 本地开发环境 - 自动生成
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_WORDPRESS_HOST=http://localhost:8080
DOCKER_ENV=false
NODE_ENV=development
VITE_DEBUG=true
EOF
    
    print_info "本地开发环境配置完成"
    print_info "访问地址: http://localhost:5173"
    print_info "API代理: /wp-json/* → http://localhost:8080"
}

# 设置生产环境
setup_production() {
    print_info "配置生产环境..."
    
    cd frontend
    
    # 创建或更新.env.local文件
    cat > .env.local << EOF
# 生产环境 - 自动生成
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
NODE_ENV=production
VITE_DEBUG=false
VITE_ENABLE_COMPRESSION=true
EOF
    
    print_info "生产环境配置完成"
    print_info "使用Nginx代理，相对路径API访问"
}

# 启动开发服务器
start_dev_server() {
    local env_type="$1"
    
    print_info "启动开发服务器..."
    
    cd frontend
    
    # 检查端口占用
    if lsof -ti:5173 &>/dev/null; then
        print_warning "端口5173被占用，正在停止占用进程..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # 根据环境类型启动
    case "$env_type" in
        "docker-dev")
            print_info "使用Docker开发环境，请访问: http://localhost:5173"
            ;;
        "local-dev")
            print_info "启动本地开发服务器..."
            npm run dev
            ;;
        *)
            print_info "启动开发服务器..."
            npm run dev
            ;;
    esac
}

# 主函数
main() {
    print_info "BJT产品系统 - 智能环境配置"
    
    # 检测环境
    local env_type=$(detect_environment)
    print_info "检测到环境类型: $env_type"
    
    case "$env_type" in
        "docker-dev")
            setup_docker_dev
            print_info "Docker环境已配置，前端容器应该已在运行"
            print_info "如需重启容器，请运行: docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend"
            ;;
        "local-dev")
            setup_local_dev
            if [[ "$1" == "--start" ]]; then
                start_dev_server "$env_type"
            fi
            ;;
        "production")
            setup_production
            print_info "生产环境配置完成，请运行构建命令: npm run build"
            ;;
        *)
            print_warning "未能检测到环境，使用默认本地开发配置"
            setup_local_dev
            if [[ "$1" == "--start" ]]; then
                start_dev_server "local-dev"
            fi
            ;;
    esac
    
    print_info "配置完成！"
}

# 显示帮助信息
show_help() {
    echo "BJT产品系统 - 智能环境配置脚本"
    echo ""
    echo "用法:"
    echo "  $0                    # 检测并配置环境"
    echo "  $0 --start           # 配置环境并启动开发服务器"
    echo "  $0 --docker          # 强制使用Docker环境配置"
    echo "  $0 --local           # 强制使用本地环境配置"
    echo "  $0 --production      # 强制使用生产环境配置"
    echo "  $0 --help            # 显示帮助信息"
    echo ""
    echo "环境检测逻辑:"
    echo "  1. 检查Docker容器是否运行"
    echo "  2. 检查本地WordPress服务(localhost:8080)"
    echo "  3. 检查是否存在.env.production文件"
    echo "  4. 默认使用本地开发环境"
}

# 处理命令行参数
case "$1" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "--start"|"-s")
        main --start
        ;;
    "--docker"|"-d")
        setup_docker_dev
        ;;
    "--local"|"-l")
        setup_local_dev
        ;;
    "--production"|"-p")
        setup_production
        ;;
    *)
        main
        ;;
esac 