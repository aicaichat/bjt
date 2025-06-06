#!/bin/bash

# BJT产品管理系统 - 部署前检查脚本
# 使用方法: ./scripts/pre-deploy-check.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "========================================"
echo "🔍 BJT产品管理系统 - 部署前检查"
echo "========================================"

# 检查基本要求
check_passed=true

# 检查磁盘空间（至少10GB可用）
echo "1. 检查磁盘空间..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}')
if [ $DISK_USAGE -gt 80 ]; then
    print_error "磁盘空间不足: 使用率${DISK_USAGE}%, 可用${DISK_AVAIL}"
    check_passed=false
else
    print_success "磁盘空间充足: 使用率${DISK_USAGE}%, 可用${DISK_AVAIL}"
fi

# 检查内存（至少2GB可用）
echo "2. 检查可用内存..."
if command -v free >/dev/null 2>&1; then
    MEMORY_FREE=$(free -m | grep Available | awk '{print $2}')
    if [ -z "$MEMORY_FREE" ]; then
        MEMORY_FREE=$(free -m | grep "^Mem:" | awk '{print $4}')
    fi
    if [ $MEMORY_FREE -lt 2048 ]; then
        print_error "可用内存不足: ${MEMORY_FREE}MB (建议至少2GB)"
        check_passed=false
    else
        print_success "内存充足: ${MEMORY_FREE}MB"
    fi
else
    print_warning "无法检查内存状态"
fi

# 检查端口占用
echo "3. 检查端口占用..."
port_conflicts=false

if netstat -tulpn 2>/dev/null | grep -q :80; then
    PORT_80_PROC=$(netstat -tulpn 2>/dev/null | grep :80 | head -1 | awk '{print $7}')
    print_error "端口80被占用: $PORT_80_PROC"
    port_conflicts=true
fi

if netstat -tulpn 2>/dev/null | grep -q :443; then
    PORT_443_PROC=$(netstat -tulpn 2>/dev/null | grep :443 | head -1 | awk '{print $7}')
    print_error "端口443被占用: $PORT_443_PROC"
    port_conflicts=true
fi

if [ "$port_conflicts" = false ]; then
    print_success "端口80和443可用"
else
    check_passed=false
fi

# 检查Docker
echo "4. 检查Docker..."
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker已安装并运行: $DOCKER_VERSION"
    else
        print_error "Docker已安装但未运行，请启动Docker服务"
        check_passed=false
    fi
else
    print_error "Docker未安装，请先安装Docker"
    check_passed=false
fi

# 检查Docker Compose
echo "5. 检查Docker Compose..."
if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    print_success "Docker Compose已安装: $COMPOSE_VERSION"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version --short)
    print_success "Docker Compose已安装: $COMPOSE_VERSION"
else
    print_error "Docker Compose未安装，请先安装Docker Compose"
    check_passed=false
fi

# 检查环境配置文件
echo "6. 检查环境配置文件..."
if [ -f ".env.production" ]; then
    print_success ".env.production 配置文件存在"
    
    # 检查关键配置项
    missing_vars=()
    for var in DOMAIN_NAME MYSQL_ROOT_PASSWORD MYSQL_DATABASE JWT_AUTH_SECRET_KEY; do
        if ! grep -q "^${var}=" .env.production; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "缺少环境变量: ${missing_vars[*]}"
        check_passed=false
    else
        print_success "环境变量配置完整"
    fi
else
    print_error ".env.production 文件不存在"
    echo "         请复制 env.production.example 并配置："
    echo "         cp env.production.example .env.production"
    check_passed=false
fi

# 检查SSL证书
echo "7. 检查SSL证书..."
if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/private.key" ]; then
    print_success "SSL证书文件存在"
    
    # 检查证书有效期
    if command -v openssl >/dev/null 2>&1; then
        EXPIRE_DATE=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ $? -eq 0 ]; then
            EXPIRE_TIMESTAMP=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRE_DATE" +%s 2>/dev/null)
            CURRENT_TIMESTAMP=$(date +%s)
            if [ ! -z "$EXPIRE_TIMESTAMP" ] && [ $EXPIRE_TIMESTAMP -gt $CURRENT_TIMESTAMP ]; then
                DAYS_TO_EXPIRE=$(( (EXPIRE_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                if [ $DAYS_TO_EXPIRE -lt 30 ]; then
                    print_warning "SSL证书即将过期，剩余 $DAYS_TO_EXPIRE 天"
                else
                    print_success "SSL证书有效，剩余 $DAYS_TO_EXPIRE 天"
                fi
            else
                print_warning "SSL证书已过期或无法解析有效期"
            fi
        else
            print_warning "无法读取SSL证书信息"
        fi
    fi
else
    print_error "SSL证书文件缺失: nginx/ssl/cert.pem 或 nginx/ssl/private.key"
    echo "         请生成或上传SSL证书文件"
    check_passed=false
fi

# 验证docker-compose配置
echo "8. 验证Docker Compose配置..."
if [ -f "docker/prod/docker-compose.prod.yml" ]; then
    if docker-compose -f docker/prod/docker-compose.prod.yml config >/dev/null 2>&1; then
        print_success "Docker Compose配置文件有效"
    else
        print_error "Docker Compose配置文件有语法错误"
        check_passed=false
    fi
else
    print_error "Docker Compose配置文件不存在: docker/prod/docker-compose.prod.yml"
    check_passed=false
fi

# 检查前端依赖
echo "9. 检查前端依赖..."
if [ -f "frontend/package.json" ]; then
    print_success "前端项目存在"
    if [ -d "frontend/node_modules" ]; then
        print_success "前端依赖已安装"
    else
        print_warning "前端依赖未安装，部署时会自动安装"
    fi
else
    print_error "前端项目不存在: frontend/package.json"
    check_passed=false
fi

# 检查后端插件
echo "10. 检查后端插件..."
plugin_missing=false
for plugin in bjt-core-entities bjt-product-admin; do
    if [ -d "plugins/$plugin" ]; then
        print_success "插件存在: $plugin"
    else
        print_error "插件缺失: $plugin"
        plugin_missing=true
    fi
done

if [ "$plugin_missing" = true ]; then
    check_passed=false
fi

echo "========================================"

# 最终结果
if [ "$check_passed" = true ]; then
    print_success "🎉 所有检查通过，可以开始部署！"
    echo ""
    echo "建议的部署命令："
    echo "  ./deploy-production.sh"
    echo ""
    echo "如果遇到问题，请查看故障排除指南："
    echo "  📚 PRODUCTION_TROUBLESHOOTING_GUIDE.md"
    exit 0
else
    print_error "❌ 部署前检查失败，请解决上述问题后重试"
    echo ""
    echo "常见解决方案："
    echo "1. 释放磁盘空间: docker system prune -a"
    echo "2. 停止占用端口的服务: sudo fuser -k 80/tcp 443/tcp"
    echo "3. 配置环境变量: nano .env.production"
    echo "4. 生成SSL证书: ./scripts/setup-ssl.sh your-domain.com"
    echo ""
    echo "详细故障排除: 📚 PRODUCTION_TROUBLESHOOTING_GUIDE.md"
    exit 1
fi 