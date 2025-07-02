#!/bin/bash

# BJT Product System - 远程机器Git问题诊断和修复脚本
# 使用方法: ./scripts/remote-git-fix.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# 检查基本环境
check_environment() {
    print_message "🔍 检查基本环境..."
    
    # 检查是否在项目根目录
    if [ ! -f "deploy-production.sh" ] || [ ! -d "frontend" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查Git是否安装
    if ! command -v git &> /dev/null; then
        print_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    # 检查当前用户
    print_info "当前用户: $(whoami)"
    print_info "当前目录: $(pwd)"
    print_info "Git版本: $(git --version)"
}

# 检查Git状态
check_git_status() {
    print_message "📊 检查Git状态..."
    
    print_info "Git状态:"
    git status || {
        print_error "无法获取Git状态"
        return 1
    }
    
    print_info "远程仓库配置:"
    git remote -v || {
        print_error "无法获取远程仓库配置"
        return 1
    }
    
    print_info "当前分支:"
    git branch -v || {
        print_error "无法获取分支信息"
        return 1
    }
}

# 检查网络连接
check_network() {
    print_message "🌐 检查网络连接..."
    
    # 检查GitHub连接
    if ping -c 1 github.com &> /dev/null; then
        print_info "✅ GitHub网络连接正常"
    else
        print_warning "❌ GitHub网络连接失败"
        return 1
    fi
    
    # 检查DNS解析
    if nslookup github.com &> /dev/null; then
        print_info "✅ DNS解析正常"
    else
        print_warning "❌ DNS解析失败"
    fi
    
    # 测试Git连接
    print_info "测试Git远程连接..."
    if timeout 10 git ls-remote origin &> /dev/null; then
        print_info "✅ Git远程连接正常"
    else
        print_warning "❌ Git远程连接失败"
        return 1
    fi
}

# 检查SSH密钥
check_ssh_keys() {
    print_message "🔐 检查SSH密钥..."
    
    if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
        print_info "✅ 找到SSH密钥"
        
        # 测试SSH连接
        if ssh -T git@github.com -o ConnectTimeout=10 -o StrictHostKeyChecking=no 2>&1 | grep -q "successfully authenticated"; then
            print_info "✅ SSH认证成功"
        else
            print_warning "❌ SSH认证失败"
            print_info "建议配置SSH密钥或使用HTTPS"
        fi
    else
        print_warning "未找到SSH密钥，将尝试使用HTTPS"
    fi
}

# 修复Git配置
fix_git_config() {
    print_message "🔧 修复Git配置..."
    
    # 确保使用HTTPS而不是SSH（更稳定）
    current_remote=$(git remote get-url origin)
    if [[ "$current_remote" == git@github.com:* ]]; then
        https_url=$(echo "$current_remote" | sed 's/git@github.com:/https:\/\/github.com\//')
        print_info "将远程URL从SSH改为HTTPS: $https_url"
        git remote set-url origin "$https_url"
    fi
    
    # 配置Git凭据缓存
    git config --global credential.helper cache
    git config --global credential.helper 'cache --timeout=3600'
    
    print_info "Git配置已更新"
}

# 清理Git状态
clean_git_state() {
    print_message "🧹 清理Git状态..."
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        print_warning "发现未提交的更改"
        
        # 备份当前更改
        backup_file="git-backup-$(date +%Y%m%d_%H%M%S).patch"
        git diff > "$backup_file"
        print_info "当前更改已备份到: $backup_file"
        
        # 询问是否要重置
        read -p "是否要重置所有更改？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git reset --hard HEAD
            print_info "已重置所有更改"
        else
            print_info "保留当前更改，请手动处理冲突"
            return 1
        fi
    fi
    
    # 清理未跟踪的文件（排除uploads）
    print_info "清理未跟踪的文件..."
    git clean -fd -e "frontend/public/uploads/*" -e "uploads_backup_*"
}

# 执行安全的Git Pull
safe_git_pull() {
    print_message "📥 执行安全的Git Pull..."
    
    # 先fetch获取最新信息
    print_info "获取远程更新..."
    if ! git fetch origin; then
        print_error "无法获取远程更新"
        return 1
    fi
    
    # 检查是否有冲突
    local current_branch=$(git branch --show-current)
    local remote_branch="origin/$current_branch"
    
    if git merge-base --is-ancestor HEAD "$remote_branch"; then
        print_info "本地分支已是最新"
        return 0
    fi
    
    # 检查是否会有冲突
    if git merge-tree $(git merge-base HEAD "$remote_branch") HEAD "$remote_branch" | grep -q "<<<<<<< "; then
        print_warning "检测到潜在冲突"
        
        # 使用我们的uploads管理脚本
        if [ -f "scripts/sync-uploads.sh" ]; then
            print_info "使用uploads同步脚本处理冲突..."
            chmod +x scripts/sync-uploads.sh
            ./scripts/sync-uploads.sh
        else
            print_error "未找到uploads同步脚本，请手动处理冲突"
            return 1
        fi
    else
        # 直接pull
        if git pull origin "$current_branch"; then
            print_info "✅ Git Pull成功完成"
        else
            print_error "Git Pull失败"
            return 1
        fi
    fi
}

# 验证部署状态
verify_deployment() {
    print_message "✅ 验证部署状态..."
    
    # 检查关键文件
    local key_files=(
        "frontend/package.json"
        "docker/prod/docker-compose.prod.yml"
        "deploy-production.sh"
        "scripts/sync-uploads.sh"
    )
    
    for file in "${key_files[@]}"; do
        if [ -f "$file" ]; then
            print_info "✅ $file 存在"
        else
            print_warning "❌ $file 缺失"
        fi
    done
    
    # 检查uploads目录
    if [ -d "frontend/public/uploads" ]; then
        local upload_count=$(find frontend/public/uploads -type f | wc -l)
        print_info "✅ uploads目录存在，包含 $upload_count 个文件"
    else
        print_warning "❌ uploads目录不存在"
    fi
}

# 主函数
main() {
    print_message "🚀 开始远程机器Git问题诊断和修复"
    
    # 执行检查和修复步骤
    check_environment
    check_git_status
    
    # 网络检查
    if ! check_network; then
        print_error "网络连接问题，请检查网络设置"
        exit 1
    fi
    
    # SSH检查（可选）
    check_ssh_keys
    
    # 修复Git配置
    fix_git_config
    
    # 清理Git状态
    if ! clean_git_state; then
        print_error "Git状态清理失败，请手动处理"
        exit 1
    fi
    
    # 执行安全的Git Pull
    if safe_git_pull; then
        print_message "🎉 Git Pull成功完成！"
        verify_deployment
    else
        print_error "Git Pull失败，请检查错误信息"
        exit 1
    fi
    
    print_message "✨ 远程机器Git问题修复完成！"
}

# 运行主函数
main "$@" 