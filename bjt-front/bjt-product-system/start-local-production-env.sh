#!/bin/bash

# BJT产品系统 - 一键启动本地生产环境
# 使用线上配置在本地运行，确保完全一致

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

# 检查是否存在生产配置
check_production_config() {
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production 文件不存在，创建示例配置..."
        
        # 从示例文件复制
        if [ -f "env.production.example" ]; then
            cp env.production.example .env.production
            print_info "已从 env.production.example 创建 .env.production"
            print_warning "请编辑 .env.production 填写实际的生产环境配置"
        else
            print_error "env.production.example 文件不存在，无法创建配置"
            exit 1
        fi
    fi
}

# 快速设置本地生产环境
quick_setup() {
    print_info "🚀 启动本地生产环境 (与线上配置一致)"
    
    # 1. 检查配置
    check_production_config
    
    # 2. 停止现有服务
    print_info "停止现有服务..."
    if lsof -ti:5173 &>/dev/null; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    fi
    
    if docker-compose -f docker/dev/docker-compose.nginx.yml ps | grep -q "Up"; then
        docker-compose -f docker/dev/docker-compose.nginx.yml down
    fi
    
    # 3. 加载生产环境配置
    source .env.production
    
    # 4. 创建本地前端配置 (使用生产环境的功能开关)
    print_info "创建本地前端配置 (使用生产环境功能开关)..."
    cat > frontend/.env.local << EOF
# 本地生产环境配置 - 从线上同步
# 生成时间: $(date)

# API配置 (本地使用代理)
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_WORDPRESS_HOST=http://localhost:8080

# 生产环境功能开关 (与线上完全一致)
VITE_ENABLE_SMART_UNITS=${VITE_ENABLE_SMART_UNITS:-true}
VITE_ENABLE_CART_ENHANCEMENT=${VITE_ENABLE_CART_ENHANCEMENT:-true}
VITE_ENABLE_STANDARD_FIELDS=${VITE_ENABLE_STANDARD_FIELDS:-true}
VITE_ENABLE_MULTILANG=${VITE_ENABLE_MULTILANG:-true}
VITE_USE_STANDARDIZED_FIELDS=${VITE_USE_STANDARDIZED_FIELDS:-true}
VITE_ENABLE_SMART_UNIT_SYSTEM=${VITE_ENABLE_SMART_UNIT_SYSTEM:-true}
VITE_USE_MOCK_CART=${VITE_USE_MOCK_CART:-false}

# 调试配置 (本地开启调试)
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# 环境标识
NODE_ENV=production
LOCAL_PRODUCTION_MODE=true
DOCKER_ENV=false

# 性能配置
VITE_ENABLE_COMPRESSION=${VITE_ENABLE_COMPRESSION:-true}
VITE_ENABLE_CACHE=${VITE_ENABLE_CACHE:-true}
EOF
    
    # 5. 启动后端Docker服务
    print_info "启动后端Docker服务..."
    docker-compose -f docker/dev/docker-compose.nginx.yml up -d mysql wordpress
    
    # 6. 等待服务启动
    print_info "等待后端服务启动..."
    sleep 20
    
    # 7. 检查后端服务
    if curl -s http://localhost:8080/wp-json/bjt/v1 > /dev/null; then
        print_info "✅ 后端服务启动成功"
    else
        print_error "❌ 后端服务启动失败"
        docker-compose -f docker/dev/docker-compose.nginx.yml logs wordpress
        exit 1
    fi
    
    # 8. 启动前端开发服务器
    print_info "启动前端开发服务器..."
    cd frontend
    
    # 在后台启动前端
    nohup npm run dev > ../logs/frontend-production.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend-production.pid
    
    cd ..
    
    # 9. 等待前端启动
    sleep 10
    
    # 10. 验证前端服务
    if curl -s http://localhost:5173 > /dev/null; then
        print_info "✅ 前端服务启动成功"
    else
        print_error "❌ 前端服务启动失败"
        cat logs/frontend-production.log
        exit 1
    fi
    
    # 11. 显示环境信息
    echo ""
    echo "🎉 本地生产环境启动成功！"
    echo ""
    echo "📍 访问地址:"
    echo "  前端: http://localhost:5173"
    echo "  后端: http://localhost:8080"
    echo "  API:  http://localhost:8080/wp-json/bjt/v1"
    echo ""
    echo "🔧 功能开关状态 (与生产环境一致):"
    echo "  SMART_UNITS: ${VITE_ENABLE_SMART_UNITS:-true}"
    echo "  CART_ENHANCEMENT: ${VITE_ENABLE_CART_ENHANCEMENT:-true}"
    echo "  STANDARD_FIELDS: ${VITE_ENABLE_STANDARD_FIELDS:-true}"
    echo "  MULTILANG: ${VITE_ENABLE_MULTILANG:-true}"
    echo "  STANDARDIZED_FIELDS: ${VITE_USE_STANDARDIZED_FIELDS:-true}"
    echo "  SMART_UNIT_SYSTEM: ${VITE_ENABLE_SMART_UNIT_SYSTEM:-true}"
    echo "  MOCK_CART: ${VITE_USE_MOCK_CART:-false}"
    echo ""
    echo "💡 说明:"
    echo "  - 本环境使用与生产环境相同的功能开关和配置"
    echo "  - 线上的问题现在可以在本地重现和调试"
    echo "  - 前端开启了调试模式，便于问题排查"
    echo ""
    echo "🛠️  管理命令:"
    echo "  停止环境: ./stop-local-production-env.sh"
    echo "  查看前端日志: tail -f logs/frontend-production.log"
    echo "  查看后端日志: docker-compose -f docker/dev/docker-compose.nginx.yml logs -f wordpress"
    echo ""
}

# 创建停止脚本
create_stop_script() {
    cat > stop-local-production-env.sh << 'EOF'
#!/bin/bash

echo "🛑 停止本地生产环境..."

# 停止前端服务器
if [ -f logs/frontend-production.pid ]; then
    FRONTEND_PID=$(cat logs/frontend-production.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端开发服务器已停止"
    fi
    rm logs/frontend-production.pid
fi

# 停止其他可能的前端进程
if lsof -ti:5173 &>/dev/null; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# 停止Docker服务
docker-compose -f docker/dev/docker-compose.nginx.yml down

echo "✅ 本地生产环境已停止"
EOF
    chmod +x stop-local-production-env.sh
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p logs
    
    # 创建停止脚本
    create_stop_script
    
    # 执行快速设置
    quick_setup
}

# 显示帮助
show_help() {
    echo "BJT产品系统 - 一键启动本地生产环境"
    echo ""
    echo "用法:"
    echo "  $0           # 启动本地生产环境"
    echo "  $0 --help   # 显示帮助信息"
    echo ""
    echo "功能:"
    echo "  - 自动加载 .env.production 配置"
    echo "  - 使用生产环境的功能开关设置"
    echo "  - 启动Docker后端 + Node.js前端"
    echo "  - 确保本地环境与线上完全一致"
    echo ""
    echo "停止环境:"
    echo "  ./stop-local-production-env.sh"
}

# 处理命令行参数
case "${1:-}" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "未知参数: $1"
        show_help
        exit 1
        ;;
esac 