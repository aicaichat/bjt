#!/bin/bash

# 完整的文件上传权限修复脚本
# 解决Docker容器中文件上传权限问题

set -e  # 遇到错误立即退出

# 脚本信息
SCRIPT_NAME="BJT Upload Permissions Complete Fix"
SCRIPT_VERSION="1.0.0"
LOG_PREFIX="[BJT Upload Fix]"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}${LOG_PREFIX} INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}${LOG_PREFIX} SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}${LOG_PREFIX} WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}${LOG_PREFIX} ERROR:${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root user - this is recommended for permission fixes"
        return 0
    else
        log_info "Running as non-root user: $(whoami)"
        return 1
    fi
}

# 检查Docker是否运行
check_docker() {
    log_info "Checking Docker status..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        return 1
    fi
    
    if ! docker ps &> /dev/null; then
        log_error "Docker is not running or user has no permission"
        return 1
    fi
    
    log_success "Docker is running"
    return 0
}

# 获取容器用户信息
get_container_user_info() {
    log_info "Getting WordPress container user information..."
    
    # 获取WordPress容器ID
    WORDPRESS_CONTAINER=$(docker-compose -f docker/prod/docker-compose.prod.yml ps -q wordpress 2>/dev/null || echo "")
    
    if [[ -z "$WORDPRESS_CONTAINER" ]]; then
        log_warning "WordPress container not found, trying to find by name..."
        WORDPRESS_CONTAINER=$(docker ps --filter "name=wordpress" --format "{{.ID}}" | head -1)
    fi
    
    if [[ -n "$WORDPRESS_CONTAINER" ]]; then
        log_info "Found WordPress container: $WORDPRESS_CONTAINER"
        
        # 获取容器内www-data用户的UID和GID
        CONTAINER_UID=$(docker exec "$WORDPRESS_CONTAINER" id -u www-data 2>/dev/null || echo "33")
        CONTAINER_GID=$(docker exec "$WORDPRESS_CONTAINER" id -g www-data 2>/dev/null || echo "33")
        
        log_info "Container www-data UID: $CONTAINER_UID, GID: $CONTAINER_GID"
        
        return 0
    else
        log_warning "WordPress container not found, using default UID:GID (33:33)"
        CONTAINER_UID=33
        CONTAINER_GID=33
        return 1
    fi
}

# 创建和设置上传目录权限
setup_upload_directories() {
    log_info "Setting up upload directories..."
    
    # 定义需要设置的目录
    UPLOAD_DIRS=(
        "frontend/public/uploads"
        "frontend/public/uploads/machines"
        "frontend/public/uploads/machines/images"
        "frontend/public/uploads/files"
        "frontend/public/uploads/specifications"
    )
    
    for dir in "${UPLOAD_DIRS[@]}"; do
        log_info "Processing directory: $dir"
        
        # 创建目录（如果不存在）
        if [[ ! -d "$dir" ]]; then
            log_info "Creating directory: $dir"
            mkdir -p "$dir"
        fi
        
        # 设置目录所有者（如果是root用户）
        if check_root; then
            log_info "Setting ownership to $CONTAINER_UID:$CONTAINER_GID for $dir"
            chown -R "$CONTAINER_UID:$CONTAINER_GID" "$dir" || log_warning "Failed to set ownership for $dir"
        fi
        
        # 设置目录权限
        log_info "Setting permissions for $dir"
        chmod -R 755 "$dir" || log_warning "Failed to set permissions for $dir"
        
        # 确保新创建的文件和目录有正确的权限
        find "$dir" -type d -exec chmod 755 {} \; 2>/dev/null || log_warning "Failed to set directory permissions in $dir"
        find "$dir" -type f -exec chmod 644 {} \; 2>/dev/null || log_warning "Failed to set file permissions in $dir"
        
        log_success "Directory $dir setup completed"
    done
}

# 检查和修复Docker Compose配置
check_docker_compose_config() {
    log_info "Checking Docker Compose configuration..."
    
    local compose_file="docker/prod/docker-compose.prod.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # 检查上传目录挂载配置
    if grep -q "frontend/public/uploads.*rw" "$compose_file"; then
        log_success "Upload directory mount configuration found"
    else
        log_warning "Upload directory mount configuration not found in Docker Compose file"
        log_info "You may need to add volume mounts for upload directories"
    fi
    
    return 0
}

# 重启Docker容器
restart_containers() {
    log_info "Restarting Docker containers to apply changes..."
    
    # 检查Docker Compose文件
    local compose_file="docker/prod/docker-compose.prod.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        log_error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # 重启WordPress容器
    log_info "Restarting WordPress container..."
    if docker-compose -f "$compose_file" restart wordpress; then
        log_success "WordPress container restarted successfully"
    else
        log_error "Failed to restart WordPress container"
        return 1
    fi
    
    # 等待容器启动
    log_info "Waiting for container to be ready..."
    sleep 10
    
    # 检查容器状态
    if docker-compose -f "$compose_file" ps wordpress | grep -q "Up"; then
        log_success "WordPress container is running"
        return 0
    else
        log_error "WordPress container failed to start properly"
        return 1
    fi
}

# 测试上传功能
test_upload_functionality() {
    log_info "Testing upload functionality..."
    
    # 创建测试文件
    local test_file="test_upload_$(date +%s).txt"
    echo "Test upload file created at $(date)" > "$test_file"
    
    # 尝试将文件复制到上传目录来测试权限
    local upload_dir="frontend/public/uploads"
    
    if [[ -d "$upload_dir" ]]; then
        if cp "$test_file" "$upload_dir/" 2>/dev/null; then
            log_success "File copy test successful"
            rm -f "$upload_dir/$test_file" 2>/dev/null
            rm -f "$test_file" 2>/dev/null
            return 0
        else
            log_error "File copy test failed - permissions may still be incorrect"
            rm -f "$test_file" 2>/dev/null
            return 1
        fi
    else
        log_error "Upload directory not found: $upload_dir"
        rm -f "$test_file" 2>/dev/null
        return 1
    fi
}

# 生成权限检查报告
generate_permission_report() {
    log_info "Generating permission report..."
    
    echo "=== Upload Directory Permission Report ===" > upload_permissions_report.txt
    echo "Generated at: $(date)" >> upload_permissions_report.txt
    echo "" >> upload_permissions_report.txt
    
    # 检查各个上传目录
    local dirs=(
        "frontend/public/uploads"
        "frontend/public/uploads/machines"  
        "frontend/public/uploads/machines/images"
        "frontend/public/uploads/files"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            echo "Directory: $dir" >> upload_permissions_report.txt
            ls -la "$dir" >> upload_permissions_report.txt
            echo "Permissions: $(stat -c '%a' "$dir" 2>/dev/null || stat -f '%A' "$dir" 2>/dev/null || echo 'unknown')" >> upload_permissions_report.txt
            echo "Owner: $(stat -c '%U:%G' "$dir" 2>/dev/null || stat -f '%Su:%Sg' "$dir" 2>/dev/null || echo 'unknown')" >> upload_permissions_report.txt
            echo "---" >> upload_permissions_report.txt
        else
            echo "Directory not found: $dir" >> upload_permissions_report.txt
            echo "---" >> upload_permissions_report.txt
        fi
    done
    
    log_success "Permission report saved to: upload_permissions_report.txt"
}

# 主函数
main() {
    echo "================================================"
    echo "   $SCRIPT_NAME v$SCRIPT_VERSION"
    echo "================================================"
    echo ""
    
    log_info "Starting complete upload permissions fix..."
    
    # 检查基本环境
    if ! check_docker; then
        log_error "Docker environment check failed"
        exit 1
    fi
    
    # 获取容器用户信息（可选，即使失败也继续）
    get_container_user_info || log_warning "Could not get container user info, using defaults"
    
    # 设置上传目录权限
    if ! setup_upload_directories; then
        log_error "Failed to setup upload directories"
        exit 1
    fi
    
    # 检查Docker Compose配置
    check_docker_compose_config || log_warning "Docker Compose configuration check had issues"
    
    # 重启容器
    if ! restart_containers; then
        log_error "Failed to restart containers"
        exit 1
    fi
    
    # 测试上传功能
    if test_upload_functionality; then
        log_success "Upload functionality test passed"
    else
        log_warning "Upload functionality test failed - manual verification needed"
    fi
    
    # 生成报告
    generate_permission_report
    
    echo ""
    log_success "Complete upload permissions fix completed!"
    echo ""
    echo "Next steps:"
    echo "1. Test file upload through the web interface"
    echo "2. Check server logs for any remaining errors"
    echo "3. Review the generated permission report"
    echo ""
    echo "If issues persist, check:"
    echo "- Docker container logs: docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress"
    echo "- WordPress error logs in the container"
    echo "- Network connectivity between containers"
    echo ""
}

# 运行主函数
main "$@" 