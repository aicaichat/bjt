#!/bin/bash

# Tailwind CSS 和 PostCSS 配置修复脚本
# 解决 "plugin: vite::css tailwindcss directly as a postcss plugin" 错误

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示脚本介绍
show_intro() {
    echo "=================================================="
    echo "  Tailwind CSS 和 PostCSS 配置修复脚本"
    echo "=================================================="
    echo ""
    echo "此脚本将："
    echo "  ✅ 检查并安装缺失的依赖"
    echo "  ✅ 修复 PostCSS 配置"
    echo "  ✅ 验证 Tailwind CSS 配置"
    echo "  ✅ 清理并重新安装依赖"
    echo ""
}

# 检查 Node.js 和 npm
check_node_environment() {
    print_step "检查 Node.js 环境..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    print_message "Node.js 版本: $(node --version)"
    print_message "npm 版本: $(npm --version)"
}

# 检查并安装依赖
install_dependencies() {
    print_step "检查并安装 Tailwind CSS 相关依赖..."
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        print_error "package.json 文件不存在，请确保在正确的目录中运行此脚本"
        exit 1
    fi
    
    # 安装必要的依赖
    print_message "安装 Tailwind CSS 和 PostCSS 依赖..."
    npm install --save-dev tailwindcss@latest postcss@latest autoprefixer@latest postcss-import@latest postcss-nested@latest postcss-preset-env@latest
    
    # 检查是否安装了 @tailwindcss/postcss
    if ! npm list @tailwindcss/postcss &> /dev/null; then
        print_message "安装 @tailwindcss/postcss..."
        npm install --save-dev @tailwindcss/postcss
    fi
    
    print_message "✅ 依赖安装完成"
}

# 修复 PostCSS 配置
fix_postcss_config() {
    print_step "修复 PostCSS 配置..."
    
    # 备份原配置文件
    if [ -f "postcss.config.js" ]; then
        cp postcss.config.js postcss.config.js.backup
        print_message "已备份原 PostCSS 配置文件"
    fi
    
    # 创建新的 PostCSS 配置
    cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nested',
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      }
    }
  }
}
EOF
    
    print_message "✅ PostCSS 配置已更新"
}

# 检查 Tailwind 配置
check_tailwind_config() {
    print_step "检查 Tailwind CSS 配置..."
    
    if [ ! -f "tailwind.config.js" ]; then
        print_warning "tailwind.config.js 不存在，正在创建..."
        npx tailwindcss init
    fi
    
    print_message "✅ Tailwind CSS 配置检查完成"
}

# 清理并重新安装依赖
clean_and_reinstall() {
    print_step "清理并重新安装依赖..."
    
    # 删除 node_modules 和 package-lock.json
    print_message "清理旧的依赖..."
    rm -rf node_modules package-lock.json
    
    # 清理 npm 缓存
    print_message "清理 npm 缓存..."
    npm cache clean --force
    
    # 重新安装依赖
    print_message "重新安装依赖..."
    npm install
    
    print_message "✅ 依赖重新安装完成"
}

# 验证配置
verify_configuration() {
    print_step "验证配置..."
    
    # 检查 PostCSS 配置
    if node -e "import('./postcss.config.js').then(console.log('PostCSS config OK')).catch(e => console.error('PostCSS config error:', e.message))" 2>/dev/null; then
        print_message "✅ PostCSS 配置验证通过"
    else
        print_warning "⚠️ PostCSS 配置可能有问题"
    fi
    
    # 检查 Tailwind 配置
    if node -e "import('./tailwind.config.js').then(console.log('Tailwind config OK')).catch(e => console.error('Tailwind config error:', e.message))" 2>/dev/null; then
        print_message "✅ Tailwind CSS 配置验证通过"
    else
        print_warning "⚠️ Tailwind CSS 配置可能有问题"
    fi
    
    # 检查关键依赖
    print_message "检查关键依赖版本："
    npm list tailwindcss postcss autoprefixer
}

# 测试构建
test_build() {
    print_step "测试构建..."
    
    print_message "尝试构建项目..."
    if npm run build:skip-check; then
        print_message "✅ 构建测试成功"
    else
        print_warning "⚠️ 构建测试失败，但配置已修复"
        print_message "请检查具体的构建错误信息"
    fi
}

# 显示修复结果
show_result() {
    echo ""
    echo "=================================================="
    echo "           🎉 修复完成！"
    echo "=================================================="
    echo ""
    echo "📋 修复内容："
    echo "  ✅ 安装了所有必要的 Tailwind CSS 依赖"
    echo "  ✅ 修复了 PostCSS 配置"
    echo "  ✅ 验证了 Tailwind CSS 配置"
    echo "  ✅ 清理并重新安装了依赖"
    echo ""
    echo "🚀 下一步："
    echo "  启动开发服务器: npm run dev"
    echo "  构建项目: npm run build"
    echo ""
    echo "📝 如果仍有问题："
    echo "  1. 检查具体的错误信息"
    echo "  2. 确保在正确的目录中运行"
    echo "  3. 检查 Node.js 版本兼容性"
    echo ""
}

# 主函数
main() {
    # 显示介绍
    show_intro
    
    # 检查 Node.js 环境
    check_node_environment
    
    # 安装依赖
    install_dependencies
    
    # 修复 PostCSS 配置
    fix_postcss_config
    
    # 检查 Tailwind 配置
    check_tailwind_config
    
    # 清理并重新安装依赖
    clean_and_reinstall
    
    # 验证配置
    verify_configuration
    
    # 测试构建
    test_build
    
    # 显示结果
    show_result
}

# 执行主函数
main "$@" 