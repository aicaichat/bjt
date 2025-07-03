#!/bin/bash

# BJT Product System - 修复生产环境 pcs_per_box 显示问题
# 重新部署最新代码到生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "=== BJT Product System - 生产环境快速修复 ==="

# 1. 确认问题
print_info "1. 确认修复逻辑存在..."
if grep -q "pcs_per_box.*Number.*> 0" frontend/src/hooks/useConsumableFieldDisplay.ts; then
    print_success "✅ 本地代码包含正确的 pcs_per_box 隐藏逻辑"
    grep -A 3 "pcs_per_box字段特殊处理" frontend/src/hooks/useConsumableFieldDisplay.ts
else
    print_error "❌ 本地代码缺少修复逻辑，无法继续"
    exit 1
fi

# 2. 检查环境配置
print_info "2. 检查环境配置..."
if [ -f ".env.production" ]; then
    print_success "✅ 生产环境配置文件存在"
    echo "关键配置："
    grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" .env.production
else
    print_error "❌ 生产环境配置文件不存在"
    exit 1
fi

# 3. 备份当前部署
print_info "3. 备份当前部署..."
backup_dir="backups/pcs-per-box-fix-$(date +'%Y%m%d_%H%M%S')"
mkdir -p "$backup_dir"
print_success "✅ 备份目录已创建: $backup_dir"

# 4. 构建前端应用
print_info "4. 构建前端应用..."
cd frontend

# 确保使用生产环境配置
print_info "复制生产环境配置..."
cp env.production .env.production

# 安装依赖
print_info "安装依赖..."
npm ci

# 构建应用
print_info "构建应用（使用生产环境配置）..."
npm run build

# 验证构建结果
if [ -d "dist" ]; then
    print_success "✅ 前端构建成功"
    echo "构建文件："
    ls -la dist/assets/ | head -5
else
    print_error "❌ 前端构建失败"
    exit 1
fi

cd ..

# 5. 停止生产环境服务
print_info "5. 停止生产环境服务..."
if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
    print_info "停止现有服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml down
    print_success "✅ 服务已停止"
else
    print_info "服务未运行，跳过停止步骤"
fi

# 6. 重新构建和启动服务
print_info "6. 重新构建和启动服务..."
print_info "构建 Docker 镜像..."
docker-compose -f docker/prod/docker-compose.prod.yml build --no-cache nginx

print_info "启动服务..."
docker-compose -f docker/prod/docker-compose.prod.yml up -d

# 7. 等待服务启动
print_info "7. 等待服务启动..."
sleep 30

# 8. 验证服务状态
print_info "8. 验证服务状态..."
docker-compose -f docker/prod/docker-compose.prod.yml ps

# 9. 健康检查
print_info "9. 执行健康检查..."

# 检查前端服务
if curl -f -s "http://localhost:80" > /dev/null 2>&1; then
    print_success "✅ 前端服务正常"
else
    print_warning "⚠️ 前端服务可能需要更多时间启动"
fi

# 10. 清除缓存建议
print_info "10. 清除缓存建议..."
print_warning "请执行以下步骤清除缓存："
echo "1. 重启 Nginx 容器强制清除服务器缓存："
echo "   docker-compose -f docker/prod/docker-compose.prod.yml restart nginx"
echo ""
echo "2. 清除浏览器缓存："
echo "   - 打开浏览器开发者工具 (F12)"
echo "   - 右键点击刷新按钮"
echo "   - 选择 '清空缓存并硬性重新加载'"
echo ""
echo "3. 如果使用CDN，请清除CDN缓存"

# 11. 验证修复效果
print_info "11. 验证修复效果..."
echo "请按照以下步骤验证修复："
echo "1. 访问生产环境的耗材页面"
echo "2. 查找 pcs_per_box 为 0 的产品"
echo "3. 确认这些产品不再显示 'QTY PER CARTON: 0' 字段"
echo "4. 在浏览器控制台运行诊断脚本确认修复"

print_success "🎉 生产环境修复部署完成！"
print_info "如果问题仍然存在，请："
echo "1. 检查浏览器是否缓存了旧版本"
echo "2. 确认访问的是正确的生产环境地址"
echo "3. 运行 check-production-environment.js 脚本获取详细诊断信息" 