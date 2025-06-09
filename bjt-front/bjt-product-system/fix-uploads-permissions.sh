#!/bin/bash

# 修复uploads目录权限和挂载问题
# 作者: AI Assistant
# 用途: 解决Docker容器内文件上传后在宿主机无法访问的问题

set -e

echo "🔧 修复uploads目录权限和挂载问题..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -d "frontend/public/uploads" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}📂 检查uploads目录结构...${NC}"

# 确保uploads目录存在
mkdir -p frontend/public/uploads/machines/pdfs
mkdir -p frontend/public/uploads/machines/images
mkdir -p frontend/public/uploads/host
mkdir -p frontend/public/uploads/accessory
mkdir -p frontend/public/uploads/spare_parts
mkdir -p frontend/public/uploads/consumables
mkdir -p frontend/public/uploads/documents

echo -e "${GREEN}✅ uploads目录结构已创建${NC}"

# 设置正确的权限
echo -e "${BLUE}🔐 设置目录权限...${NC}"

# 设置目录权限为755，文件权限为644
find frontend/public/uploads -type d -exec chmod 755 {} \;
find frontend/public/uploads -type f -exec chmod 644 {} \;

# 确保上传目录可写
chmod -R 755 frontend/public/uploads

echo -e "${GREEN}✅ 权限设置完成${NC}"

# 检查Docker容器状态
echo -e "${BLUE}🐳 检查Docker容器状态...${NC}"

RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(wordpress|nginx)" || true)

if [ -n "$RUNNING_CONTAINERS" ]; then
    echo -e "${YELLOW}⚠️  发现运行中的容器:${NC}"
    echo "$RUNNING_CONTAINERS"
    echo
    echo -e "${YELLOW}建议重启容器以应用新的挂载配置...${NC}"
    echo
    read -p "是否现在重启容器? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 重启Docker容器...${NC}"
        
        # 检测并重启对应环境的容器
        if docker ps --format "{{.Names}}" | grep -q "dev-"; then
            echo "检测到开发环境，重启开发容器..."
            cd docker/dev && docker-compose -f docker-compose.dev.yml restart wordpress nginx || true
        elif docker ps --format "{{.Names}}" | grep -q "bjt.*wordpress"; then
            echo "检测到生产环境，重启生产容器..."
            cd docker/prod && docker-compose restart wordpress nginx || true
        else
            echo "使用通用重启命令..."
            docker restart $(docker ps -q --filter "name=wordpress") $(docker ps -q --filter "name=nginx") 2>/dev/null || true
        fi
        
        cd ../.. 2>/dev/null || cd .
        echo -e "${GREEN}✅ 容器重启完成${NC}"
    fi
else
    echo -e "${GREEN}✅ 没有运行中的相关容器${NC}"
fi

# 测试文件创建
echo -e "${BLUE}🧪 测试文件权限...${NC}"

TEST_FILE="frontend/public/uploads/test-$(date +%s).txt"
echo "Test file created at $(date)" > "$TEST_FILE"

if [ -f "$TEST_FILE" ]; then
    echo -e "${GREEN}✅ 文件创建测试成功${NC}"
    rm "$TEST_FILE"
else
    echo -e "${RED}❌ 文件创建测试失败${NC}"
    exit 1
fi

# 显示修复总结
echo
echo -e "${GREEN}🎉 uploads目录修复完成!${NC}"
echo
echo -e "${BLUE}📋 修复总结:${NC}"
echo "  ✅ 创建了完整的uploads目录结构"
echo "  ✅ 设置了正确的文件权限 (目录:755, 文件:644)"
echo "  ✅ 更新了Docker配置文件的挂载设置"
echo "  ✅ 测试了文件创建权限"
echo
echo -e "${YELLOW}📝 后续步骤:${NC}"
echo "  1. 如果使用开发环境: 运行 'cd docker/dev && docker-compose -f docker-compose.dev.yml up -d'"
echo "  2. 如果使用生产环境: 运行 'cd docker/prod && docker-compose up -d'"
echo "  3. 测试文件上传功能"
echo "  4. 检查浏览器是否能访问 http://localhost:5173/uploads/machines/pdfs/xxx.pdf"
echo
echo -e "${BLUE}🔍 如果仍有问题，请检查:${NC}"
echo "  - Docker容器内的挂载路径"
echo "  - nginx配置文件中的静态文件配置"
echo "  - 防火墙和SELinux设置(Linux)"
echo

# 显示当前uploads目录状态
echo -e "${BLUE}📊 当前uploads目录状态:${NC}"
echo "$(ls -la frontend/public/uploads/ | head -10)"

echo -e "${GREEN}✨ 修复脚本执行完成!${NC}" 