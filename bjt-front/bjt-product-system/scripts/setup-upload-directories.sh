#!/bin/bash

# 设置上传目录权限脚本
# 用于解决文件上传权限问题

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_info "开始设置上传目录..."

# 创建上传目录结构
mkdir -p frontend/public/uploads
mkdir -p frontend/public/uploads/specifications
mkdir -p frontend/public/uploads/images
mkdir -p frontend/public/uploads/documents

print_message "创建上传目录结构完成"

# 设置目录权限
chmod -R 755 frontend/public/uploads

print_message "设置目录权限完成"

# 创建测试文件以确保目录可写
touch frontend/public/uploads/.gitkeep
echo "# 上传目录" > frontend/public/uploads/README.md

print_message "创建测试文件完成"

print_info "上传目录设置完成！"
print_info "目录结构："
print_info "  frontend/public/uploads/"
print_info "  ├── specifications/  (规格文档)"
print_info "  ├── images/          (图片文件)"
print_info "  ├── documents/       (其他文档)"
print_info "  └── README.md        (说明文件)"
print_info ""
print_info "现在可以重启开发环境服务："
print_info "  docker-compose -f docker/dev/docker-compose.nginx.yml restart" 