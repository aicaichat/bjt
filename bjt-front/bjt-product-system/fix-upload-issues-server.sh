#!/bin/bash

# 服务器端文件上传问题修复脚本
# 使用方法: ./fix-upload-issues-server.sh
# 作者: AI Assistant
# 用途: 修复服务器端文件上传500错误问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印函数
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_step() {
    echo -e "${GREEN}📋 步骤: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在正确目录
check_directory() {
    print_header "检查项目目录"
    
    if [ ! -f "deploy-production.sh" ] || [ ! -d "frontend/public" ]; then
        print_error "请确保在BJT项目根目录运行此脚本"
        print_info "当前目录: $(pwd)"
        print_info "应该包含: deploy-production.sh, frontend/public/ 等文件"
        exit 1
    fi
    
    print_success "项目目录检查通过"
    print_info "当前目录: $(pwd)"
}

# 检查和创建uploads目录结构
setup_upload_directories() {
    print_header "设置uploads目录结构"
    
    print_step "创建uploads目录结构"
    mkdir -p frontend/public/uploads/machines/pdfs
    mkdir -p frontend/public/uploads/machines/images
    mkdir -p frontend/public/uploads/host
    mkdir -p frontend/public/uploads/accessory
    mkdir -p frontend/public/uploads/spare_parts
    mkdir -p frontend/public/uploads/consumables
    mkdir -p frontend/public/uploads/documents
    
    print_step "设置目录权限"
    find frontend/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true
    find frontend/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
    chmod -R 755 frontend/public/uploads 2>/dev/null || true
    
    print_step "检查目录状态"
    ls -la frontend/public/uploads/ | head -10
    
    print_success "uploads目录设置完成"
}

# 检查PHP文件语法
check_php_syntax() {
    print_header "检查PHP文件语法"
    
    local upload_controller="plugins/bjt-core-entities/controllers/class-upload-controller.php"
    
    if [ -f "$upload_controller" ]; then
        print_step "检查upload controller语法"
        if php -l "$upload_controller" > /dev/null 2>&1; then
            print_success "Upload controller语法正确"
        else
            print_error "Upload controller语法错误:"
            php -l "$upload_controller"
            return 1
        fi
        
        print_step "检查文件权限"
        ls -la "$upload_controller"
    else
        print_error "Upload controller文件不存在: $upload_controller"
        return 1
    fi
}

# 检查Docker容器状态
check_docker_status() {
    print_header "检查Docker容器状态"
    
    print_step "查看运行中的容器"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    print_step "检查WordPress容器"
    local wordpress_container=$(docker ps --format "{{.Names}}" | grep wordpress | head -1)
    if [ -n "$wordpress_container" ]; then
        print_success "发现WordPress容器: $wordpress_container"
        
        print_step "查看最近的WordPress日志"
        docker logs "$wordpress_container" --tail=20 2>/dev/null || print_info "无法读取日志"
    else
        print_error "未发现运行中的WordPress容器"
        return 1
    fi
}

# 检查Docker挂载
check_docker_mounts() {
    print_header "检查Docker挂载配置"
    
    local wordpress_container=$(docker ps --format "{{.Names}}" | grep wordpress | head -1)
    if [ -n "$wordpress_container" ]; then
        print_step "检查容器内uploads目录"
        
        echo "容器内frontend uploads目录:"
        docker exec "$wordpress_container" ls -la /var/www/html/frontend/public/uploads/ 2>/dev/null || print_info "路径不存在或无权限"
        
        echo -e "\n容器内nginx uploads目录:"
        docker exec "$wordpress_container" ls -la /usr/share/nginx/html/uploads/ 2>/dev/null || print_info "路径不存在或无权限"
        
        echo -e "\n容器内用户信息:"
        docker exec "$wordpress_container" whoami 2>/dev/null || print_info "无法获取用户信息"
        docker exec "$wordpress_container" id 2>/dev/null || print_info "无法获取用户ID"
    fi
}

# 重启Docker服务
restart_docker_services() {
    print_header "重启Docker服务"
    
    read -p "是否重启Docker容器以应用配置? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "重启Docker容器"
        
        # 检测使用的docker-compose文件
        if [ -f "docker/prod/docker-compose.prod.yml" ]; then
            print_info "使用生产环境配置重启"
            docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress nginx
        elif [ -f "docker/dev/docker-compose.nginx.yml" ]; then
            print_info "使用开发环境配置重启"
            docker-compose -f docker/dev/docker-compose.nginx.yml restart wordpress nginx
        else
            print_info "使用通用命令重启"
            docker restart $(docker ps -q --filter "name=wordpress") $(docker ps -q --filter "name=nginx") 2>/dev/null || true
        fi
        
        print_step "等待服务启动"
        sleep 10
        
        print_success "Docker服务重启完成"
    else
        print_info "跳过Docker重启"
    fi
}

# 测试API端点
test_api_endpoint() {
    print_header "测试API端点"
    
    print_step "检查API可访问性"
    
    # 尝试多个可能的URL
    local urls=("http://localhost/wp-json/bjt/v1" "http://127.0.0.1/wp-json/bjt/v1")
    
    for url in "${urls[@]}"; do
        print_info "测试URL: $url"
        if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
            print_success "API端点可访问: $url"
            break
        else
            print_info "无法访问: $url"
        fi
    done
}

# 生成诊断报告
generate_diagnostic_report() {
    print_header "生成诊断报告"
    
    local report_file="upload-diagnostic-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "BJT Upload诊断报告"
        echo "生成时间: $(date)"
        echo "================================"
        echo
        
        echo "1. 系统信息:"
        uname -a
        echo
        
        echo "2. Docker版本:"
        docker --version
        echo
        
        echo "3. 项目目录结构:"
        ls -la frontend/public/uploads/ | head -15
        echo
        
        echo "4. Docker容器状态:"
        docker ps
        echo
        
        echo "5. 磁盘空间:"
        df -h
        echo
        
        echo "6. 目录权限:"
        ls -la frontend/public/uploads/machines/ 2>/dev/null || echo "目录不存在"
        echo
        
    } > "$report_file"
    
    print_success "诊断报告已生成: $report_file"
    print_info "可以将此文件发送给技术支持"
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "🔧 BJT产品系统 - 服务器端Upload修复脚本"
    echo "=========================================="
    echo -e "${NC}"
    
    # 执行修复步骤
    check_directory
    setup_upload_directories
    check_php_syntax
    check_docker_status
    check_docker_mounts
    restart_docker_services
    test_api_endpoint
    generate_diagnostic_report
    
    print_header "修复完成"
    print_success "Upload修复脚本执行完成！"
    echo
    print_info "后续步骤:"
    echo "1. 检查前端上传功能是否正常"
    echo "2. 如果问题仍然存在，查看生成的诊断报告"
    echo "3. 考虑运行完整部署: ./deploy-production.sh"
    echo
    print_info "如果需要更多帮助，请提供诊断报告内容"
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi 