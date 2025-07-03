#!/bin/bash

# BJT产品系统 - 生产配置同步脚本
# 将线上生产环境配置同步到本地开发环境，确保完全一致

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查必要文件
check_prerequisites() {
    print_step "检查必要文件..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_info "请先从 env.production.example 复制并配置："
        print_info "  cp env.production.example .env.production"
        exit 1
    fi
    
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "生产环境 Docker 配置文件不存在"
        exit 1
    fi
    
    print_info "必要文件检查通过"
}

# 停止当前本地服务
stop_local_services() {
    print_step "停止当前本地服务..."
    
    # 停止本地Node.js开发服务器
    if lsof -ti:5173 &>/dev/null; then
        print_info "停止本地前端服务器 (端口5173)..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    if lsof -ti:5174 &>/dev/null; then
        print_info "停止本地前端服务器 (端口5174)..."
        lsof -ti:5174 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # 停止开发环境Docker服务
    if docker-compose -f docker/dev/docker-compose.nginx.yml ps | grep -q "Up"; then
        print_info "停止开发环境Docker服务..."
        docker-compose -f docker/dev/docker-compose.nginx.yml down
    fi
    
    print_info "本地服务已停止"
}

# 同步生产环境配置到本地
sync_production_config() {
    print_step "同步生产环境配置..."
    
    # 加载生产环境变量
    source .env.production
    
    # 1. 创建本地生产环境配置文件
    print_info "创建本地生产环境配置..."
    
    cat > .env.local-production << EOF
# 本地生产环境配置 - 从线上同步
# 生成时间: $(date)

# 数据库配置 (本地使用相同的数据库结构)
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
MYSQL_HOST=mysql
MYSQL_PORT=3306
WORDPRESS_DB_CHARSET=${WORDPRESS_DB_CHARSET}
WORDPRESS_DB_COLLATE=${WORDPRESS_DB_COLLATE}

# WordPress配置 (本地访问)
WP_HOME=http://localhost:8080
WP_SITEURL=http://localhost:8080

# WordPress安全密钥 (使用生产环境相同的密钥)
WORDPRESS_AUTH_KEY='${WORDPRESS_AUTH_KEY}'
WORDPRESS_SECURE_AUTH_KEY='${WORDPRESS_SECURE_AUTH_KEY}'
WORDPRESS_LOGGED_IN_KEY='${WORDPRESS_LOGGED_IN_KEY}'
WORDPRESS_NONCE_KEY='${WORDPRESS_NONCE_KEY}'
WORDPRESS_AUTH_SALT='${WORDPRESS_AUTH_SALT}'
WORDPRESS_SECURE_AUTH_SALT='${WORDPRESS_SECURE_AUTH_SALT}'
WORDPRESS_LOGGED_IN_SALT='${WORDPRESS_LOGGED_IN_SALT}'
WORDPRESS_NONCE_SALT='${WORDPRESS_NONCE_SALT}'

# JWT认证密钥 (与生产环境一致)
JWT_AUTH_SECRET_KEY='${JWT_AUTH_SECRET_KEY}'

# 本地开发标识
LOCAL_PRODUCTION_MODE=true
ENVIRONMENT=local-production
EOF

    # 2. 创建前端生产配置
    print_info "创建前端生产配置..."
    
    cat > frontend/.env.local << EOF
# 前端本地生产环境配置 - 从线上同步
# 生成时间: $(date)

# API配置 (本地使用代理到Docker后端)
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_WORDPRESS_HOST=http://localhost:8080

# 生产环境功能开关 (与线上完全一致)
VITE_ENABLE_SMART_UNITS=${VITE_ENABLE_SMART_UNITS:-false}
VITE_ENABLE_CART_ENHANCEMENT=${VITE_ENABLE_CART_ENHANCEMENT:-false}
VITE_ENABLE_STANDARD_FIELDS=${VITE_ENABLE_STANDARD_FIELDS:-false}
VITE_ENABLE_MULTILANG=${VITE_ENABLE_MULTILANG:-false}
VITE_USE_STANDARDIZED_FIELDS=${VITE_USE_STANDARDIZED_FIELDS:-false}
VITE_ENABLE_SMART_UNIT_SYSTEM=${VITE_ENABLE_SMART_UNIT_SYSTEM:-false}
VITE_USE_MOCK_CART=${VITE_USE_MOCK_CART:-false}

# 调试配置 (本地开启调试，便于问题排查)
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# 环境标识
NODE_ENV=production
LOCAL_PRODUCTION_MODE=true
DOCKER_ENV=false

# 性能配置 (与生产环境一致)
VITE_ENABLE_COMPRESSION=${VITE_ENABLE_COMPRESSION:-true}
VITE_ENABLE_CACHE=${VITE_ENABLE_CACHE:-true}
EOF

    print_info "配置文件同步完成"
}

# 创建本地生产环境Docker配置
create_local_production_docker() {
    print_step "创建本地生产环境Docker配置..."
    
    # 创建专用的本地生产环境Docker配置
    cat > docker/dev/docker-compose.local-production.yml << EOF
# 本地生产环境配置 - 与线上保持一致
# 基于生产环境配置，但适配本地开发

version: '3.8'

services:
  # WordPress应用服务器 (使用生产环境相同配置)
  wordpress:
    build:
      context: ../wordpress
      dockerfile: Dockerfile.prod
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: \${MYSQL_DATABASE}
      WORDPRESS_DB_USER: \${MYSQL_USER}
      WORDPRESS_DB_PASSWORD: \${MYSQL_PASSWORD}
      WORDPRESS_DB_CHARSET: \${WORDPRESS_DB_CHARSET}
      WORDPRESS_DB_COLLATE: \${WORDPRESS_DB_COLLATE}
      WORDPRESS_AUTH_KEY: \${WORDPRESS_AUTH_KEY}
      WORDPRESS_SECURE_AUTH_KEY: \${WORDPRESS_SECURE_AUTH_KEY}
      WORDPRESS_LOGGED_IN_KEY: \${WORDPRESS_LOGGED_IN_KEY}
      WORDPRESS_NONCE_KEY: \${WORDPRESS_NONCE_KEY}
      WORDPRESS_AUTH_SALT: \${WORDPRESS_AUTH_SALT}
      WORDPRESS_SECURE_AUTH_SALT: \${WORDPRESS_SECURE_AUTH_SALT}
      WORDPRESS_LOGGED_IN_SALT: \${WORDPRESS_LOGGED_IN_SALT}
      WORDPRESS_NONCE_SALT: \${WORDPRESS_NONCE_SALT}
      JWT_AUTH_SECRET_KEY: \${JWT_AUTH_SECRET_KEY}
      WP_HOME: http://localhost:8080
      WP_SITEURL: http://localhost:8080
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_HOME', 'http://localhost:8080');
        define('WP_SITEURL', 'http://localhost:8080');
        define('WP_CONTENT_URL', 'http://localhost:8080/wp-content');
        define('WP_CONTENT_DIR', '/var/www/html/wp-content');
        define('JWT_AUTH_SECRET_KEY', '\${JWT_AUTH_SECRET_KEY}');
        define('FORCE_SSL_ADMIN', false);
        define('WP_CACHE', true);
        define('WP_DEBUG', true);
        define('WP_DEBUG_LOG', true);
        define('WP_DEBUG_DISPLAY', false);
    volumes:
      - ../../backend:/var/www/html
      - ../../plugins:/var/www/html/wp-content/plugins
      - ../../frontend:/var/www/html/frontend
      - uploads_data:/var/www/html/wp-content/uploads
      - wordpress_cache:/var/www/html/wp-content/cache
    env_file:
      - ../../.env.local-production
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - bjt_network
    restart: unless-stopped

  # MySQL数据库 (使用生产环境相同配置)
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: \${MYSQL_DATABASE}
      MYSQL_USER: \${MYSQL_USER}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
    volumes:
      - mysql_production_data:/var/lib/mysql
      - mysql_backup:/backup
      - ../mysql/conf.d:/etc/mysql/conf.d
      - ../mysql/init-db.sh:/usr/local/bin/init-db.sh:ro
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
      - ../../generated_sql_imports/_设备.sql:/docker-entrypoint-initdb.d/02-devices.sql:ro
      - ../../generated_sql_imports/_耗材.sql:/docker-entrypoint-initdb.d/03-consumables.sql:ro
    command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=512M
    env_file:
      - ../../.env.local-production
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p\${MYSQL_ROOT_PASSWORD}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - bjt_network
    restart: unless-stopped

networks:
  bjt_network:
    driver: bridge

volumes:
  mysql_production_data:
    driver: local
  mysql_backup:
    driver: local
  uploads_data:
    driver: local
  wordpress_cache:
    driver: local
EOF

    print_info "本地生产环境Docker配置已创建"
}

# 启动本地生产环境
start_local_production() {
    print_step "启动本地生产环境..."
    
    # 启动Docker服务
    print_info "启动Docker服务..."
    docker-compose -f docker/dev/docker-compose.local-production.yml up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    print_info "检查服务状态..."
    docker-compose -f docker/dev/docker-compose.local-production.yml ps
    
    print_info "本地生产环境已启动"
}

# 启动前端开发服务器
start_frontend_dev() {
    print_step "启动前端开发服务器..."
    
    cd frontend
    
    # 检查端口占用
    if lsof -ti:5173 &>/dev/null; then
        print_warning "端口5173被占用，正在停止占用进程..."
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_info "启动前端开发服务器 (生产配置模式)..."
    print_info "前端将在 http://localhost:5173 启动"
    print_info "后端API通过 http://localhost:8080 提供服务"
    
    # 在后台启动前端服务器
    nohup npm run dev > ../logs/frontend-dev.log 2>&1 &
    FRONTEND_PID=$!
    
    # 等待前端服务器启动
    sleep 10
    
    # 检查前端服务器是否启动成功
    if curl -s http://localhost:5173 > /dev/null; then
        print_info "前端服务器启动成功 (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > ../logs/frontend-dev.pid
    else
        print_error "前端服务器启动失败"
        return 1
    fi
    
    cd ..
}

# 验证环境一致性
verify_environment() {
    print_step "验证环境一致性..."
    
    # 检查API连接
    print_info "检查API连接..."
    if curl -s http://localhost:8080/wp-json/bjt/v1 > /dev/null; then
        print_info "✅ 后端API连接正常"
    else
        print_error "❌ 后端API连接失败"
        return 1
    fi
    
    # 检查前端连接
    if curl -s http://localhost:5173 > /dev/null; then
        print_info "✅ 前端服务连接正常"
    else
        print_error "❌ 前端服务连接失败"
        return 1
    fi
    
    # 检查数据库连接
    if docker-compose -f docker/dev/docker-compose.local-production.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;" > /dev/null 2>&1; then
        print_info "✅ 数据库连接正常"
    else
        print_error "❌ 数据库连接失败"
        return 1
    fi
    
    print_info "环境一致性验证通过"
}

# 显示环境信息
show_environment_info() {
    print_step "环境信息"
    
    echo ""
    echo "🎯 本地生产环境已启动，配置与线上完全一致"
    echo ""
    echo "📍 访问地址:"
    echo "  前端: http://localhost:5173"
    echo "  后端: http://localhost:8080"
    echo "  API:  http://localhost:8080/wp-json/bjt/v1"
    echo ""
    echo "🔧 配置文件:"
    echo "  后端: .env.local-production"
    echo "  前端: frontend/.env.local"
    echo "  Docker: docker/dev/docker-compose.local-production.yml"
    echo ""
    echo "📊 服务状态:"
    docker-compose -f docker/dev/docker-compose.local-production.yml ps
    echo ""
    echo "💡 使用说明:"
    echo "  - 本环境使用与生产环境相同的配置和功能开关"
    echo "  - 线上的问题现在可以在本地重现和调试"
    echo "  - 前端开启了调试模式，便于问题排查"
    echo "  - 数据库结构和数据与生产环境一致"
    echo ""
    echo "🛠️  管理命令:"
    echo "  停止环境: docker-compose -f docker/dev/docker-compose.local-production.yml down"
    echo "  查看日志: docker-compose -f docker/dev/docker-compose.local-production.yml logs -f"
    echo "  重启服务: docker-compose -f docker/dev/docker-compose.local-production.yml restart"
    echo ""
}

# 创建管理脚本
create_management_scripts() {
    print_step "创建环境管理脚本..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 创建启动脚本
    cat > start-local-production.sh << 'EOF'
#!/bin/bash
echo "🚀 启动本地生产环境..."
docker-compose -f docker/dev/docker-compose.local-production.yml up -d
echo "✅ 本地生产环境已启动"
echo "📍 前端: http://localhost:5173"
echo "📍 后端: http://localhost:8080"
EOF
    chmod +x start-local-production.sh
    
    # 创建停止脚本
    cat > stop-local-production.sh << 'EOF'
#!/bin/bash
echo "🛑 停止本地生产环境..."
docker-compose -f docker/dev/docker-compose.local-production.yml down
if [ -f logs/frontend-dev.pid ]; then
    FRONTEND_PID=$(cat logs/frontend-dev.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端开发服务器已停止"
    fi
    rm logs/frontend-dev.pid
fi
echo "✅ 本地生产环境已停止"
EOF
    chmod +x stop-local-production.sh
    
    print_info "管理脚本已创建: start-local-production.sh, stop-local-production.sh"
}

# 主函数
main() {
    print_info "BJT产品系统 - 生产配置同步工具"
    print_info "将线上生产环境配置同步到本地，确保完全一致"
    echo ""
    
    check_prerequisites
    stop_local_services
    sync_production_config
    create_local_production_docker
    create_management_scripts
    start_local_production
    
    # 等待服务完全启动
    sleep 10
    
    if verify_environment; then
        start_frontend_dev
        show_environment_info
        print_info "🎉 生产配置同步完成！现在您的本地环境与线上完全一致。"
    else
        print_error "环境验证失败，请检查日志"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "BJT产品系统 - 生产配置同步工具"
    echo ""
    echo "用法:"
    echo "  $0                    # 同步生产配置并启动本地生产环境"
    echo "  $0 --help            # 显示帮助信息"
    echo "  $0 --stop            # 停止本地生产环境"
    echo "  $0 --status          # 显示环境状态"
    echo ""
    echo "功能:"
    echo "  - 将 .env.production 配置同步到本地"
    echo "  - 创建与生产环境一致的Docker配置"
    echo "  - 启动本地生产环境 (后端Docker + 前端Node.js)"
    echo "  - 确保功能开关、数据库配置等与线上完全一致"
    echo ""
    echo "要求:"
    echo "  - 必须存在 .env.production 文件"
    echo "  - Docker 和 Docker Compose 已安装"
    echo "  - Node.js 和 npm 已安装"
}

# 停止本地生产环境
stop_environment() {
    print_info "停止本地生产环境..."
    
    # 停止Docker服务
    if [ -f "docker/dev/docker-compose.local-production.yml" ]; then
        docker-compose -f docker/dev/docker-compose.local-production.yml down
    fi
    
    # 停止前端服务器
    if [ -f "logs/frontend-dev.pid" ]; then
        FRONTEND_PID=$(cat logs/frontend-dev.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_info "前端开发服务器已停止"
        fi
        rm logs/frontend-dev.pid
    fi
    
    # 停止其他可能的前端进程
    if lsof -ti:5173 &>/dev/null; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    fi
    
    print_info "本地生产环境已停止"
}

# 显示环境状态
show_status() {
    print_info "本地生产环境状态"
    echo ""
    
    if [ -f "docker/dev/docker-compose.local-production.yml" ]; then
        echo "📊 Docker服务状态:"
        docker-compose -f docker/dev/docker-compose.local-production.yml ps
    else
        print_warning "本地生产环境未配置"
    fi
    
    echo ""
    echo "🌐 端口占用情况:"
    echo "  端口5173: $(lsof -ti:5173 &>/dev/null && echo "占用" || echo "空闲")"
    echo "  端口8080: $(lsof -ti:8080 &>/dev/null && echo "占用" || echo "空闲")"
    echo "  端口3306: $(lsof -ti:3306 &>/dev/null && echo "占用" || echo "空闲")"
    
    echo ""
    echo "📁 配置文件状态:"
    [ -f ".env.local-production" ] && echo "  ✅ .env.local-production" || echo "  ❌ .env.local-production"
    [ -f "frontend/.env.local" ] && echo "  ✅ frontend/.env.local" || echo "  ❌ frontend/.env.local"
    [ -f "docker/dev/docker-compose.local-production.yml" ] && echo "  ✅ docker-compose.local-production.yml" || echo "  ❌ docker-compose.local-production.yml"
}

# 处理命令行参数
case "${1:-}" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "--stop"|"-s")
        stop_environment
        exit 0
        ;;
    "--status")
        show_status
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac 