#!/bin/bash

# 生产环境PO页面修复部署脚本
# 快速构建和部署修复后的代码

set -e  # 遇到错误时停止执行

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🔧 生产环境PO页面修复部署脚本${NC}"
echo "=================================================="

# 1. 检查当前目录
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

log_info "当前工作目录: $(pwd)"

# 2. 进入前端目录
cd frontend

# 3. 检查依赖
log_info "检查依赖..."
if [ ! -d "node_modules" ]; then
    log_warning "node_modules不存在，正在安装依赖..."
    npm install
else
    log_success "依赖已存在"
fi

# 4. 清理旧的构建文件
log_info "清理旧的构建文件..."
if [ -d "dist" ]; then
    rm -rf dist
    log_success "已清理dist目录"
fi

# 5. 构建生产版本
log_info "开始构建生产版本..."
echo "使用的环境配置:"
echo "----------------------------------------"
cat .env.production
echo "----------------------------------------"

# 设置生产环境并构建
export NODE_ENV=production
npm run build

if [ $? -eq 0 ]; then
    log_success "构建完成"
else
    log_error "构建失败"
    exit 1
fi

# 6. 检查构建结果
log_info "检查构建结果..."
if [ -d "dist" ]; then
    log_success "dist目录已生成"
    
    # 显示构建文件大小
    log_info "构建文件大小:"
    du -sh dist/*
    
    # 检查关键文件
    if [ -f "dist/index.html" ]; then
        log_success "index.html 存在"
    else
        log_warning "index.html 不存在"
    fi
    
    if [ -f "dist/debug-production-api.html" ]; then
        log_success "调试页面已包含"
    else
        log_warning "调试页面未找到"
    fi
    
    if [ -f "dist/production-test.html" ]; then
        log_success "测试页面已包含"
    else
        log_warning "测试页面未找到"
    fi
else
    log_error "构建失败，dist目录不存在"
    exit 1
fi

# 7. 创建部署包
log_info "创建部署包..."
cd ..
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_PACKAGE="bjt-frontend-production-fix-${TIMESTAMP}.tar.gz"

tar -czf "$DEPLOY_PACKAGE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    frontend/dist/

if [ -f "$DEPLOY_PACKAGE" ]; then
    log_success "部署包已创建: $DEPLOY_PACKAGE"
    log_info "部署包大小: $(du -sh $DEPLOY_PACKAGE | cut -f1)"
else
    log_error "部署包创建失败"
    exit 1
fi

# 8. 生成部署说明
DEPLOY_INSTRUCTIONS="部署说明-${TIMESTAMP}.md"
cat > "$DEPLOY_INSTRUCTIONS" << EOF
# 生产环境PO页面修复部署说明

## 部署包信息
- 文件名: $DEPLOY_PACKAGE
- 创建时间: $(date)
- 修复内容: PO页面生产环境API配置问题

## 部署步骤

### 1. 上传部署包到服务器
\`\`\`bash
scp $DEPLOY_PACKAGE user@server:/path/to/deployment/
\`\`\`

### 2. 在服务器上解压
\`\`\`bash
cd /path/to/deployment/
tar -xzf $DEPLOY_PACKAGE
\`\`\`

### 3. 备份现有文件（推荐）
\`\`\`bash
cp -r /var/www/html/bjt/ /var/www/html/bjt.backup.\$(date +%Y%m%d_%H%M%S)/
\`\`\`

### 4. 部署新文件
\`\`\`bash
cp -r frontend/dist/* /var/www/html/bjt/
\`\`\`

### 5. 重启Web服务（如需要）
\`\`\`bash
sudo systemctl restart nginx
# 或
sudo systemctl restart apache2
\`\`\`

## 测试步骤

### 1. 基础测试
访问以下URL进行测试：
- https://bjt.lockedair.com/bjt/production-test.html
- https://bjt.lockedair.com/bjt/debug-production-api.html

### 2. PO页面测试
- 访问: https://bjt.lockedair.com/bjt/po
- 检查是否能正常显示内容
- 查看浏览器控制台是否有错误

### 3. API连接测试
在浏览器控制台运行：
\`\`\`javascript
// 检查API配置
console.log('API配置调试:', window.poEnvironmentDebug);

// 测试API连接
fetch('/wp-json/bjt/v1/orders')
  .then(response => console.log('API响应:', response.status))
  .catch(error => console.error('API错误:', error));
\`\`\`

## 修复内容说明

### 1. API配置优化
- 使用动态URL检测，自动适应生产环境
- 移除硬编码的API地址
- 支持相对路径和绝对路径

### 2. 环境变量清理
- 简化生产环境配置
- 启用调试模式便于问题排查
- 禁用Mock数据确保使用真实API

### 3. 调试工具
- 添加生产环境调试页面
- 增强错误日志输出
- 提供API连接测试工具

## 回滚方案
如果部署后出现问题：
\`\`\`bash
# 恢复备份
rm -rf /var/www/html/bjt/*
cp -r /var/www/html/bjt.backup.*/  /var/www/html/bjt/
sudo systemctl restart nginx
\`\`\`

## 联系信息
如有问题请联系开发团队
EOF

log_success "部署说明已生成: $DEPLOY_INSTRUCTIONS"

# 9. 输出总结
echo ""
echo "=================================================="
log_success "部署准备完成！"
echo ""
log_info "生成的文件:"
echo "  📦 部署包: $DEPLOY_PACKAGE"
echo "  📋 部署说明: $DEPLOY_INSTRUCTIONS"
echo ""
log_info "下一步操作:"
echo "  1. 将部署包上传到生产服务器"
echo "  2. 按照部署说明进行部署"
echo "  3. 使用调试页面测试修复效果"
echo ""
log_warning "注意事项:"
echo "  • 部署前请备份现有文件"
echo "  • 部署后请及时测试"
echo "  • 如有问题请及时回滚"
echo ""
echo "🎉 准备就绪！" 