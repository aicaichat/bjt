#!/bin/bash
# health-check.sh - 系统健康检查脚本

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 检查环境配置文件
if [ ! -f ".env.remote-ip" ]; then
    print_error "找不到 .env.remote-ip 配置文件"
    exit 1
fi

# 加载环境变量
export $(cat .env.remote-ip | grep -v '^#' | xargs)

echo "🏥 BJT产品管理系统健康检查"
echo "=========================="
echo ""

# 1. 检查Docker服务
print_info "检查Docker服务..."
if docker info &> /dev/null; then
    print_success "Docker服务运行正常"
else
    print_error "Docker服务未运行"
    exit 1
fi

# 2. 检查容器状态
print_info "检查容器状态..."
CONTAINERS=$(docker-compose -f docker/dev/docker-compose.remote-ip.yml ps -q)
if [ -z "$CONTAINERS" ]; then
    print_error "没有运行中的容器"
    exit 1
fi

for container in $CONTAINERS; do
    container_name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    container_status=$(docker inspect --format='{{.State.Status}}' $container)
    
    if [ "$container_status" = "running" ]; then
        print_success "容器 $container_name 运行正常"
    else
        print_error "容器 $container_name 状态异常: $container_status"
    fi
done

# 3. 检查网络连接
print_info "检查网络连接..."

# 检查前端服务
if curl -f http://localhost:5173 &> /dev/null; then
    print_success "前端服务 (5173) 可访问"
else
    print_error "前端服务 (5173) 不可访问"
fi

# 检查WordPress服务
if curl -f http://localhost:8080/wp-admin/admin-ajax.php &> /dev/null; then
    print_success "WordPress服务 (8080) 可访问"
else
    print_error "WordPress服务 (8080) 不可访问"
fi

# 检查Nginx代理
if curl -f http://localhost &> /dev/null; then
    print_success "Nginx代理 (80) 可访问"
else
    print_error "Nginx代理 (80) 不可访问"
fi

# 4. 检查数据库连接
print_info "检查数据库连接..."
if docker-compose -f docker/dev/docker-compose.remote-ip.yml exec -T mysql \
   mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
    print_success "MySQL数据库连接正常"
else
    print_error "MySQL数据库连接失败"
fi

# 5. 检查API接口
print_info "检查API接口..."
if curl -f http://localhost/wp-json/bjt/v1 &> /dev/null; then
    print_success "API接口可访问"
else
    print_warning "API接口可能不可访问（这可能是正常的）"
fi

# 6. 检查磁盘空间
print_info "检查磁盘空间..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    print_success "磁盘空间充足 (${DISK_USAGE}% 已使用)"
elif [ $DISK_USAGE -lt 90 ]; then
    print_warning "磁盘空间紧张 (${DISK_USAGE}% 已使用)"
else
    print_error "磁盘空间不足 (${DISK_USAGE}% 已使用)"
fi

# 7. 检查内存使用
print_info "检查内存使用..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -lt 80 ]; then
    print_success "内存使用正常 (${MEMORY_USAGE}% 已使用)"
elif [ $MEMORY_USAGE -lt 90 ]; then
    print_warning "内存使用较高 (${MEMORY_USAGE}% 已使用)"
else
    print_error "内存使用过高 (${MEMORY_USAGE}% 已使用)"
fi

# 8. 检查日志错误
print_info "检查最近的错误日志..."
ERROR_COUNT=$(docker-compose -f docker/dev/docker-compose.remote-ip.yml logs --since=1h 2>&1 | grep -i error | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    print_success "最近1小时内无错误日志"
elif [ $ERROR_COUNT -lt 10 ]; then
    print_warning "最近1小时内有 $ERROR_COUNT 条错误日志"
else
    print_error "最近1小时内有 $ERROR_COUNT 条错误日志，请检查"
fi

echo ""
echo "🏥 健康检查完成"
echo ""

# 9. 显示系统信息
print_info "系统信息摘要:"
echo "  服务器IP: $SERVER_IP"
echo "  数据库: $MYSQL_DATABASE"
echo "  磁盘使用: ${DISK_USAGE}%"
echo "  内存使用: ${MEMORY_USAGE}%"
echo "  运行容器数: $(echo $CONTAINERS | wc -w)"
echo ""

# 10. 建议操作
if [ $DISK_USAGE -gt 80 ] || [ $MEMORY_USAGE -gt 80 ] || [ $ERROR_COUNT -gt 10 ]; then
    echo "🔧 建议操作:"
    if [ $DISK_USAGE -gt 80 ]; then
        echo "  - 清理磁盘空间: docker system prune -f"
    fi
    if [ $MEMORY_USAGE -gt 80 ]; then
        echo "  - 重启服务释放内存: docker-compose restart"
    fi
    if [ $ERROR_COUNT -gt 10 ]; then
        echo "  - 查看详细日志: docker-compose logs"
    fi
    echo ""
fi 