#!/bin/bash

# BJT产品系统 - Docker开发环境管理脚本
# 支持启动、停止、重启、查看状态等操作

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DEV_DIR="$PROJECT_ROOT/docker/dev"
COMPOSE_FILE="$DOCKER_DEV_DIR/docker-compose.nginx.yml"

# 帮助信息
show_help() {
    echo -e "${BLUE}BJT产品系统 - Docker开发环境管理脚本${NC}"
    echo "================================================"
    echo ""
    echo "用法: $0 [命令] [服务名]"
    echo ""
    echo "命令:"
    echo "  start          启动所有服务"
    echo "  stop           停止所有服务"
    echo "  restart        重启所有服务"
    echo "  restart-frontend  只重启前端服务"
    echo "  restart-backend   只重启后端服务"
    echo "  status         查看服务状态"
    echo "  logs           查看所有服务日志"
    echo "  logs-frontend  查看前端服务日志"
    echo "  logs-backend   查看后端服务日志"
    echo "  shell          进入容器shell"
    echo "  clean          清理停止的容器"
    echo "  rebuild        重新构建并启动服务"
    echo "  help           显示此帮助信息"
    echo ""
    echo "服务名 (可选):"
    echo "  frontend       前端开发服务器"
    echo "  wordpress      WordPress后端"
    echo "  mysql          MySQL数据库"
    echo "  nginx          Nginx代理"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 启动所有服务"
    echo "  $0 restart-frontend         # 只重启前端"
    echo "  $0 logs-frontend            # 查看前端日志"
    echo "  $0 shell frontend           # 进入前端容器"
}

# 检查Docker环境
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker守护进程未运行，请先启动Docker Desktop${NC}"
        exit 1
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Docker Compose配置文件不存在: $COMPOSE_FILE${NC}"
        exit 1
    fi
}

# 进入Docker目录
cd_docker_dir() {
    cd "$DOCKER_DEV_DIR"
}

# 启动服务
start_services() {
    echo -e "${GREEN}🚀 启动BJT开发环境...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml up -d
    echo -e "${GREEN}✅ 服务启动完成${NC}"
    show_status
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}🛑 停止BJT开发环境...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml down
    echo -e "${GREEN}✅ 服务停止完成${NC}"
}

# 重启所有服务
restart_services() {
    echo -e "${YELLOW}🔄 重启BJT开发环境...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml restart
    echo -e "${GREEN}✅ 服务重启完成${NC}"
    show_status
}

# 只重启前端
restart_frontend() {
    echo -e "${YELLOW}🔄 重启前端服务...${NC}"
    cd_docker_dir
    
    if docker-compose -f docker-compose.nginx.yml ps frontend | grep -q "Up"; then
        echo "📦 前端容器正在运行，执行重启..."
        docker-compose -f docker-compose.nginx.yml restart frontend
    else
        echo "📦 前端容器未运行，启动前端容器..."
        docker-compose -f docker-compose.nginx.yml up -d frontend
    fi
    
    echo -e "${GREEN}✅ 前端服务重启完成${NC}"
    echo ""
    echo -e "${BLUE}🌐 前端访问地址: http://localhost:5173${NC}"
}

# 只重启后端
restart_backend() {
    echo -e "${YELLOW}🔄 重启后端服务...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml restart wordpress mysql
    echo -e "${GREEN}✅ 后端服务重启完成${NC}"
    echo ""
    echo -e "${BLUE}🌐 后端访问地址: http://localhost:8080${NC}"
}

# 查看状态
show_status() {
    echo -e "${BLUE}📋 服务状态:${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml ps
    echo ""
    echo -e "${BLUE}🌐 服务访问地址:${NC}"
    echo "  - 前端开发服务器: http://localhost:5173"
    echo "  - WordPress后端: http://localhost:8080"
    echo "  - Nginx代理: http://localhost:80"
    echo "  - MySQL数据库: localhost:3306"
}

# 查看日志
show_logs() {
    local service=$1
    cd_docker_dir
    if [ -n "$service" ]; then
        echo -e "${BLUE}📝 查看 $service 服务日志:${NC}"
        docker-compose -f docker-compose.nginx.yml logs -f "$service"
    else
        echo -e "${BLUE}📝 查看所有服务日志:${NC}"
        docker-compose -f docker-compose.nginx.yml logs -f
    fi
}

# 进入容器shell
enter_shell() {
    local service=$1
    if [ -z "$service" ]; then
        service="frontend"
    fi
    
    echo -e "${BLUE}🐚 进入 $service 容器shell...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml exec "$service" /bin/sh
}

# 清理容器
clean_containers() {
    echo -e "${YELLOW}🧹 清理停止的容器...${NC}"
    docker container prune -f
    docker image prune -f
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 重新构建
rebuild_services() {
    echo -e "${YELLOW}🔨 重新构建并启动服务...${NC}"
    cd_docker_dir
    docker-compose -f docker-compose.nginx.yml down
    docker-compose -f docker-compose.nginx.yml build --no-cache
    docker-compose -f docker-compose.nginx.yml up -d
    echo -e "${GREEN}✅ 重新构建完成${NC}"
    show_status
}

# 检查数据库连接
check_database() {
    echo -e "${BLUE}🔍 检查数据库连接...${NC}"
    cd_docker_dir
    
    if docker-compose -f docker-compose.nginx.yml exec mysql mysql -u wordpress -pwordpress -e "SHOW DATABASES;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
        
        # 查看订单表数据
        echo -e "${BLUE}📊 查看订单表数据:${NC}"
        docker-compose -f docker-compose.nginx.yml exec mysql mysql -u wordpress -pwordpress bjt_product -e "SELECT id, order_number, shipping_address, billing_address FROM wp_bjt_orders LIMIT 5;"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
    fi
}

# 主程序
main() {
    local command=$1
    local service=$2

    # 检查Docker环境
    check_docker

    case "$command" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "restart-frontend")
            restart_frontend
            ;;
        "restart-backend")
            restart_backend
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$service"
            ;;
        "logs-frontend")
            show_logs "frontend"
            ;;
        "logs-backend")
            show_logs "wordpress"
            ;;
        "shell")
            enter_shell "$service"
            ;;
        "clean")
            clean_containers
            ;;
        "rebuild")
            rebuild_services
            ;;
        "check-db")
            check_database
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $command${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主程序
main "$@" 