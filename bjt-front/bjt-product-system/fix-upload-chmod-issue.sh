#!/bin/bash

# 修复Upload Controller chmod权限问题
# 问题：class-upload-controller.php第704行chmod操作被拒绝
# 解决：移除容器内chmod操作，预先设置正确权限

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 备份原始文件
backup_upload_controller() {
    print_header "备份Upload Controller"
    
    local upload_controller="plugins/bjt-core-entities/controllers/class-upload-controller.php"
    local backup_file="${upload_controller}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$upload_controller" ]; then
        cp "$upload_controller" "$backup_file"
        print_success "已备份到: $backup_file"
    else
        print_error "Upload controller文件不存在"
        exit 1
    fi
}

# 修复upload controller chmod问题
fix_upload_controller_chmod() {
    print_header "修复Upload Controller chmod问题"
    
    local upload_controller="plugins/bjt-core-entities/controllers/class-upload-controller.php"
    
    print_info "创建临时修复文件..."
    
    # 使用sed移除或注释掉chmod调用
    sed -i.tmp '
        # 注释掉chmod相关行
        /chmod.*0755/s/^/\/\/ DISABLED: /
        /chmod.*0644/s/^/\/\/ DISABLED: /
        /chmod.*755/s/^/\/\/ DISABLED: /
        /chmod.*644/s/^/\/\/ DISABLED: /
        
        # 修复chmod失败后的逻辑
        /Failed to change permissions/c\
                $this->log_debug("Permissions pre-configured, skipping chmod");
    ' "$upload_controller"
    
    # 移除临时文件
    rm -f "${upload_controller}.tmp" 2>/dev/null || true
    
    print_success "Upload controller chmod调用已禁用"
}

# 设置uploads目录权限
setup_uploads_permissions() {
    print_header "预设uploads目录权限"
    
    # 确保目录存在
    mkdir -p frontend/public/uploads/machines/pdfs
    mkdir -p frontend/public/uploads/machines/images
    mkdir -p frontend/public/uploads/host
    mkdir -p frontend/public/uploads/accessory
    mkdir -p frontend/public/uploads/spare_parts
    mkdir -p frontend/public/uploads/consumables
    mkdir -p frontend/public/uploads/documents
    
    # 设置权限
    find frontend/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true
    find frontend/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
    
    # 确保上传目录可写
    chmod -R 755 frontend/public/uploads 2>/dev/null || true
    
    print_success "uploads目录权限已预设"
    
    # 显示权限状态
    print_info "当前权限状态:"
    ls -la frontend/public/uploads/machines/ 2>/dev/null || echo "machines目录不存在"
}

# 重启WordPress容器
restart_wordpress() {
    print_header "重启WordPress容器"
    
    read -p "是否重启WordPress容器以应用修复? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "重启WordPress容器..."
        
        if [ -f "docker/prod/docker-compose.prod.yml" ]; then
            docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress
        else
            docker restart $(docker ps -q --filter "name=wordpress") 2>/dev/null || true
        fi
        
        print_success "WordPress容器已重启"
        
        # 等待服务启动
        print_info "等待服务启动..."
        sleep 15
        
        # 测试API
        if curl -s --connect-timeout 5 "http://localhost/wp-json/bjt/v1" > /dev/null 2>&1; then
            print_success "API服务已恢复"
        else
            print_info "API可能需要更多时间启动"
        fi
    else
        print_info "跳过重启，请手动重启WordPress容器"
    fi
}

# 验证修复结果
verify_fix() {
    print_header "验证修复结果"
    
    local upload_controller="plugins/bjt-core-entities/controllers/class-upload-controller.php"
    
    # 检查PHP语法
    if php -l "$upload_controller" > /dev/null 2>&1; then
        print_success "PHP语法检查通过"
    else
        print_error "PHP语法错误，请检查修复"
        php -l "$upload_controller"
        return 1
    fi
    
    # 检查chmod调用是否被注释
    local chmod_count=$(grep -c "DISABLED.*chmod" "$upload_controller" 2>/dev/null || echo "0")
    if [ "$chmod_count" -gt 0 ]; then
        print_success "发现 $chmod_count 个chmod调用已被禁用"
    else
        print_info "未发现被禁用的chmod调用"
    fi
    
    # 检查uploads目录
    if [ -d "frontend/public/uploads/machines" ]; then
        print_success "uploads目录结构正常"
    else
        print_error "uploads目录结构异常"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "🔧 修复Upload Controller chmod权限问题"
    echo "========================================"
    echo -e "${NC}"
    
    print_info "问题：class-upload-controller.php第704行chmod()操作被拒绝"
    print_info "解决：禁用容器内chmod操作，预先设置目录权限"
    echo
    
    # 检查项目目录
    if [ ! -f "plugins/bjt-core-entities/controllers/class-upload-controller.php" ]; then
        print_error "未找到upload controller文件"
        print_info "请确保在BJT项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行修复步骤
    backup_upload_controller
    fix_upload_controller_chmod
    setup_uploads_permissions
    verify_fix
    restart_wordpress
    
    print_header "修复完成"
    print_success "Upload chmod权限问题修复完成！"
    echo
    print_info "现在可以测试文件上传功能"
    print_info "如果仍有问题，检查生成的备份文件可以回滚"
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi 