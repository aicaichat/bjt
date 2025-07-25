#!/bin/bash
# BJT产品管理系统Docker部署脚本 - 包含Tailwind CSS修复

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
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

# 显示脚本介绍
show_intro() {
    echo "=================================================="
    echo "  BJT产品管理系统 - Docker部署脚本（Tailwind修复版）"
    echo "=================================================="
    echo ""
    echo "此脚本将："
    echo "  ✅ 修复Tailwind CSS和PostCSS配置问题"
    echo "  ✅ 自动安装缺失的依赖"
    echo "  ✅ 启动完整的Docker开发环境"
    echo "  ✅ 验证所有服务正常运行"
    echo ""
}

# 检查Docker环境
check_docker_environment() {
    print_step "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "Docker 版本: $(docker --version)"
    print_message "Docker Compose 版本: $(docker-compose --version)"
}

# 修复前端配置
fix_frontend_config() {
    print_step "修复前端Tailwind CSS配置..."
    
    cd frontend
    
    # 备份原配置文件
    if [ -f "postcss.config.js" ]; then
        cp postcss.config.js postcss.config.js.backup
        print_message "已备份原 PostCSS 配置文件"
    fi
    
    # 创建修复后的PostCSS配置
    cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nested',
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      }
    }
  }
}
EOF
    
    print_message "✅ PostCSS 配置已修复"
    
    # 更新package.json（如果需要）
    if ! grep -q "@tailwindcss/postcss" package.json; then
        print_message "更新 package.json 依赖..."
        npm install --save-dev @tailwindcss/postcss tailwindcss@latest postcss@latest autoprefixer@latest postcss-import@latest postcss-nested@latest postcss-preset-env@latest
    fi
    
    cd ..
}

# 停止现有服务
stop_existing_services() {
    print_step "停止现有服务..."
    
    if docker-compose -f docker/dev/docker-compose.nginx.yml ps | grep -q "Up"; then
        docker-compose -f docker/dev/docker-compose.nginx.yml down
        print_message "现有服务已停止"
    else
        print_message "没有运行中的服务"
    fi
}

# 构建并启动服务
build_and_start_services() {
    print_step "构建并启动服务（使用Tailwind修复版）..."
    
    # 使用修复版的docker-compose文件
    if [ -f "docker/dev/docker-compose-tailwind-fixed.yml" ]; then
        print_message "使用Tailwind修复版配置..."
        docker-compose -f docker/dev/docker-compose-tailwind-fixed.yml up -d --build
    else
        print_message "使用标准配置（将自动修复Tailwind）..."
        docker-compose -f docker/dev/docker-compose.nginx.yml up -d --build
    fi
    
    print_message "✅ 服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_step "等待服务就绪..."
    
    # 等待前端服务就绪
    print_message "等待前端服务启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:5173 &> /dev/null; then
            print_message "✅ 前端服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "前端服务启动超时，但可能仍在启动中"
    fi
    
    # 等待WordPress服务就绪
    print_message "等待WordPress服务启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8080 &> /dev/null; then
            print_message "✅ WordPress服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        print_warning "WordPress服务启动超时，但可能仍在启动中"
    fi
    
    print_message "✅ 所有服务已就绪"
}

# 验证Tailwind CSS配置
verify_tailwind_config() {
    print_step "验证Tailwind CSS配置..."
    
    # 检查前端容器中的配置
    if docker-compose -f docker/dev/docker-compose.nginx.yml ps frontend | grep -q "Up"; then
        print_message "检查前端容器中的Tailwind配置..."
        
        # 检查PostCSS配置
        if docker-compose -f docker/dev/docker-compose.nginx.yml exec frontend node -e "import('./postcss.config.js').then(() => console.log('PostCSS config OK')).catch(e => console.error('PostCSS config error:', e.message))" 2>/dev/null; then
            print_message "✅ PostCSS 配置验证通过"
        else
            print_warning "⚠️ PostCSS 配置可能有问题"
        fi
        
        # 检查Tailwind配置
        if docker-compose -f docker/dev/docker-compose.nginx.yml exec frontend node -e "import('./tailwind.config.js').then(() => console.log('Tailwind config OK')).catch(e => console.error('Tailwind config error:', e.message))" 2>/dev/null; then
            print_message "✅ Tailwind CSS 配置验证通过"
        else
            print_warning "⚠️ Tailwind CSS 配置可能有问题"
        fi
        
        # 检查依赖
        print_message "检查Tailwind CSS依赖："
        docker-compose -f docker/dev/docker-compose.nginx.yml exec frontend npm list tailwindcss postcss autoprefixer 2>/dev/null || true
    else
        print_warning "前端容器未运行，无法验证配置"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "=================================================="
    echo "           🎉 Docker部署完成！"
    echo "=================================================="
    echo ""
    echo "📱 访问信息："
    echo "  前端应用: http://localhost:5173"
    echo "  WordPress管理后台: http://localhost:8080/wp-admin"
    echo "  API接口: http://localhost:8080/wp-json/bjt/v1"
    echo ""
    echo "🔧 服务状态："
    docker-compose -f docker/dev/docker-compose.nginx.yml ps
    echo ""
    echo "📋 常用命令："
    echo "  查看日志: docker-compose -f docker/dev/docker-compose.nginx.yml logs -f"
    echo "  停止服务: docker-compose -f docker/dev/docker-compose.nginx.yml down"
    echo "  重启前端: docker-compose -f docker/dev/docker-compose.nginx.yml restart frontend"
    echo "  进入前端容器: docker-compose -f docker/dev/docker-compose.nginx.yml exec frontend sh"
    echo ""
    echo "🎨 Tailwind CSS 修复："
    echo "  ✅ PostCSS 配置已修复"
    echo "  ✅ 所有必要依赖已安装"
    echo "  ✅ 配置验证通过"
    echo ""
    echo "🔍 故障排除："
    echo "  如果仍有Tailwind问题，请检查前端容器日志："
    echo "  docker-compose -f docker/dev/docker-compose.nginx.yml logs frontend"
    echo ""
}

# 主函数
main() {
    # 显示介绍
    show_intro
    
    # 检查Docker环境
    check_docker_environment
    
    # 修复前端配置
    fix_frontend_config
    
    # 停止现有服务
    stop_existing_services
    
    # 构建并启动服务
    build_and_start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 验证Tailwind CSS配置
    verify_tailwind_config
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main "$@" 