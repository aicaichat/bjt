#!/bin/bash

echo "=== BJT 环境配置脚本 ==="
echo "=== BJT Environment Setup Script ==="

# 检测当前环境
detect_environment() {
    local env="unknown"
    
    # 检测Docker环境
    if [ -n "$DOCKER_ENV" ] || [ -n "$COMPOSE_PROJECT_NAME" ]; then
        echo "🐳 检测到Docker环境"
        
        # 检测是否为生产环境
        if [ "$NODE_ENV" = "production" ] || [ "$ENVIRONMENT" = "production" ]; then
            env="docker-production"
        else
            env="docker-development"
        fi
    elif [ -f "/.dockerenv" ]; then
        echo "🐳 检测到Docker容器内部"
        env="docker-container"
    else
        echo "💻 检测到本地环境"
        env="local"
    fi
    
    echo "📋 当前环境: $env"
    echo "$env"
}

# 设置环境变量
setup_environment() {
    local env=$1
    local frontend_dir="frontend"
    local env_file="$frontend_dir/.env.local"
    
    echo "🔧 配置环境变量..."
    
    case $env in
        "docker-development")
            cat > "$env_file" << EOF
# Docker 开发环境配置
VITE_WORDPRESS_HOST=http://dev-wordpress-1:80
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_DEBUG=true
DOCKER_ENV=development
EOF
            echo "✅ 已配置Docker开发环境"
            ;;
            
        "docker-production")
            cat > "$env_file" << EOF
# Docker 生产环境配置 - 使用Nginx代理
VITE_WORDPRESS_HOST=
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
VITE_DEBUG=false
DOCKER_ENV=production
EOF
            echo "✅ 已配置Docker生产环境 (Nginx代理)"
            ;;
            
        "local")
            cat > "$env_file" << EOF
# 本地开发环境配置
VITE_WORDPRESS_HOST=http://localhost:8080
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
VITE_DEBUG=true
EOF
            echo "✅ 已配置本地开发环境"
            ;;
            
        *)
            echo "⚠️  未知环境，使用默认配置"
            cat > "$env_file" << EOF
# 默认配置
VITE_WORDPRESS_HOST=
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true
VITE_DEBUG=false
EOF
            ;;
    esac
    
    echo "📁 环境配置文件: $env_file"
    echo "📄 配置内容:"
    cat "$env_file"
}

# 验证WordPress连接
verify_wordpress_connection() {
    local env=$1
    
    echo "🔍 验证WordPress连接..."
    
    case $env in
        "docker-development")
            local endpoint="http://dev-wordpress-1:80/wp-json/bjt/v1/"
            ;;
        "docker-production")
            local endpoint="http://wordpress:80/wp-json/bjt/v1/"
            ;;
        "local")
            local endpoint="http://localhost:8080/wp-json/bjt/v1/"
            ;;
        *)
            echo "⚠️  跳过连接验证"
            return 0
            ;;
    esac
    
    echo "📡 测试端点: $endpoint"
    
    # 尝试连接（如果在Docker环境中）
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout 5 "$endpoint" >/dev/null 2>&1; then
            echo "✅ WordPress连接成功"
        else
            echo "❌ WordPress连接失败"
            echo "💡 提示: 确保WordPress服务正在运行"
        fi
    else
        echo "⚠️  curl未找到，跳过连接测试"
    fi
}

# 显示使用说明
show_usage() {
    echo ""
    echo "🚀 环境配置完成！"
    echo ""
    echo "📋 不同环境的使用方法:"
    echo ""
    echo "1️⃣  Docker开发环境:"
    echo "   docker-compose -f docker/dev/docker-compose.yml up -d"
    echo ""
    echo "2️⃣  Docker生产环境:"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml up -d"
    echo ""
    echo "3️⃣  本地开发环境:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "🔧 手动配置环境变量:"
    echo "   编辑 frontend/.env.local 文件"
    echo ""
    echo "🔍 验证配置:"
    echo "   访问 http://localhost:5173/admin/relations"
    echo ""
}

# 主流程
main() {
    echo "开始环境检测和配置..."
    
    local env=$(detect_environment)
    setup_environment "$env"
    verify_wordpress_connection "$env"
    show_usage
}

# 如果直接运行脚本
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi 