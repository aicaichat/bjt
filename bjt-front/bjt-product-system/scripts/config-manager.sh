#!/bin/bash

# BJT Product System - 配置管理脚本
# 用于管理不同环境的配置文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"
}

# 检查当前环境
detect_environment() {
    print_info "检测当前环境..."
    
    # 检查Docker环境
    if [ -n "$DOCKER_ENV" ] || [ -n "$COMPOSE_PROJECT_NAME" ]; then
        echo "docker"
        return
    fi
    
    # 检查是否在Docker容器内
    if [ -f /.dockerenv ]; then
        echo "docker"
        return
    fi
    
    # 检查Docker进程
    if docker ps >/dev/null 2>&1; then
        if docker ps | grep -q "bjt.*frontend"; then
            echo "docker"
            return
        fi
    fi
    
    # 检查端口占用
    if lsof -i :5173 >/dev/null 2>&1; then
        local process=$(lsof -ti :5173 | head -1)
        if ps -p $process -o comm= | grep -q "docker"; then
            echo "docker"
            return
        fi
    fi
    
    echo "local"
}

# 设置本地开发环境
setup_local_dev() {
    print_message "设置本地开发环境..."
    
    cd frontend
    
    # 复制本地开发配置
    if [ ! -f .env.local ]; then
        cp env.development .env.local
        print_message "已创建 .env.local (本地开发配置)"
    else
        print_warning ".env.local 已存在，跳过创建"
    fi
    
    # 检查端口冲突
    if lsof -i :5173 >/dev/null 2>&1; then
        print_warning "端口5173被占用，请检查是否有Docker容器在运行"
        print_info "运行以下命令停止Docker前端容器："
        print_info "  docker-compose -f docker/dev/docker-compose.nginx.yml stop frontend"
    fi
    
    cd ..
    print_message "本地开发环境配置完成"
}

# 设置Docker开发环境
setup_docker_dev() {
    print_message "设置Docker开发环境..."
    
    # 停止本地Node.js服务器
    local node_pids=$(lsof -ti :5173 2>/dev/null | grep -v docker || true)
    if [ -n "$node_pids" ]; then
        print_warning "停止本地Node.js服务器..."
        kill $node_pids 2>/dev/null || true
        sleep 2
    fi
    
    # 更新Docker compose配置
    if [ -f docker/dev/docker-compose.nginx.yml ]; then
        print_message "启动Docker开发环境..."
        docker-compose -f docker/dev/docker-compose.nginx.yml up -d
        
        # 等待服务启动
        sleep 10
        
        # 检查服务状态
        if curl -s http://localhost:5173 >/dev/null; then
            print_message "Docker前端服务启动成功: http://localhost:5173"
        else
            print_error "Docker前端服务启动失败"
            docker-compose -f docker/dev/docker-compose.nginx.yml logs frontend --tail=20
        fi
    else
        print_error "Docker配置文件不存在"
        exit 1
    fi
}

# 设置生产环境
setup_production() {
    print_message "设置生产环境..."
    
    if [ ! -f .env.production ]; then
        print_error ".env.production 文件不存在"
        print_info "请从 env.production.example 复制并配置："
        print_info "  cp env.production.example .env.production"
        print_info "  然后编辑 .env.production 填写实际配置"
        exit 1
    fi
    
    # 验证生产环境配置
    source .env.production
    
    required_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "JWT_AUTH_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "生产环境变量 $var 未设置"
            exit 1
        fi
    done
    
    print_message "生产环境配置验证通过"
}

# 清理配置
cleanup_config() {
    print_message "清理配置文件..."
    
    # 清理前端配置
    if [ -f frontend/.env.local ]; then
        rm frontend/.env.local
        print_message "已删除 frontend/.env.local"
    fi
    
    # 停止所有服务
    if docker ps | grep -q bjt; then
        print_message "停止Docker服务..."
        docker-compose -f docker/dev/docker-compose.nginx.yml down
    fi
    
    # 停止本地Node.js服务器
    local node_pids=$(lsof -ti :5173 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        print_message "停止本地Node.js服务器..."
        kill $node_pids 2>/dev/null || true
    fi
    
    print_message "配置清理完成"
}

# 显示当前状态
show_status() {
    print_info "=== BJT系统状态 ==="
    
    # 检测环境
    local env=$(detect_environment)
    print_info "当前环境: $env"
    
    # 检查端口
    if lsof -i :5173 >/dev/null 2>&1; then
        local process=$(ps -p $(lsof -ti :5173 | head -1) -o comm= 2>/dev/null || echo "unknown")
        print_info "端口5173被占用: $process"
    else
        print_info "端口5173空闲"
    fi
    
    # 检查Docker服务
    if docker ps | grep -q bjt; then
        print_info "Docker服务状态:"
        docker-compose -f docker/dev/docker-compose.nginx.yml ps
    else
        print_info "Docker服务未运行"
    fi
    
    # 检查配置文件
    print_info "配置文件状态:"
    [ -f frontend/.env.local ] && echo "  ✓ frontend/.env.local" || echo "  ✗ frontend/.env.local"
    [ -f .env.production ] && echo "  ✓ .env.production" || echo "  ✗ .env.production"
    
    print_info "====================="
}

# 主函数
main() {
    case "${1:-status}" in
        "local")
            setup_local_dev
            ;;
        "docker")
            setup_docker_dev
            ;;
        "production")
            setup_production
            ;;
        "cleanup")
            cleanup_config
            ;;
        "status")
            show_status
            ;;
        *)
            echo "BJT Product System - 配置管理工具"
            echo ""
            echo "用法: $0 [command]"
            echo ""
            echo "命令:"
            echo "  local      - 设置本地开发环境"
            echo "  docker     - 设置Docker开发环境"
            echo "  production - 设置生产环境"
            echo "  cleanup    - 清理所有配置"
            echo "  status     - 显示当前状态"
            echo ""
            echo "示例:"
            echo "  $0 local    # 设置本地开发"
            echo "  $0 docker   # 设置Docker开发"
            echo "  $0 status   # 查看状态"
            ;;
    esac
}

# 运行主函数
main "$@" 