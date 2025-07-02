#!/bin/bash

# BJT产品系统 - uploads文件同步脚本
# 用于在远程服务器上保留用户上传的文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# uploads目录路径
UPLOADS_DIR="frontend/public/uploads"
BACKUP_DIR="uploads_backup_$(date +'%Y%m%d_%H%M%S')"

# 备份当前uploads文件
backup_uploads() {
    print_message "备份当前uploads文件..."
    
    if [ -d "$UPLOADS_DIR" ]; then
        cp -r "$UPLOADS_DIR" "$BACKUP_DIR"
        print_message "✅ uploads文件已备份到: $BACKUP_DIR"
    else
        print_warning "uploads目录不存在，跳过备份"
    fi
}

# 安全的git pull操作
safe_git_pull() {
    print_message "执行安全的git pull操作..."
    
    # 检查是否有uploads相关的冲突
    if git pull 2>&1 | grep -q "frontend/public/uploads"; then
        print_warning "检测到uploads文件冲突，执行冲突解决..."
        
        # 重置uploads目录
        git checkout HEAD -- "$UPLOADS_DIR/"
        
        # 重新尝试pull
        git pull
        
        print_message "✅ git pull完成"
        return 0
    else
        print_message "✅ git pull完成，无冲突"
        return 0
    fi
}

# 恢复uploads文件
restore_uploads() {
    if [ -d "$BACKUP_DIR" ]; then
        print_message "恢复uploads文件..."
        
        # 确保目标目录存在
        mkdir -p "$UPLOADS_DIR"
        
        # 恢复文件
        cp -r "$BACKUP_DIR"/* "$UPLOADS_DIR/"
        
        print_message "✅ uploads文件已恢复"
    else
        print_warning "没有找到备份目录，跳过恢复"
    fi
}

# 清理旧备份（保留最近5个）
cleanup_old_backups() {
    print_message "清理旧备份文件..."
    
    # 查找所有uploads_backup目录，按时间排序，删除最旧的（保留最新5个）
    ls -dt uploads_backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    print_message "✅ 旧备份清理完成"
}

# 更新.gitignore
update_gitignore() {
    print_message "更新.gitignore配置..."
    
    # 检查是否已经配置
    if ! grep -q "# BJT uploads ignore rules" .gitignore; then
        cat >> .gitignore << 'EOF'

# BJT uploads ignore rules
frontend/public/uploads/*
!frontend/public/uploads/.gitkeep
!frontend/public/uploads/README.md
uploads_backup_*
EOF
        print_message "✅ .gitignore已更新"
    else
        print_message "✅ .gitignore已经配置过了"
    fi
}

# 主函数
main() {
    print_message "开始BJT uploads文件同步..."
    
    # 检查是否在项目根目录
    if [ ! -f "deploy-production.sh" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行同步步骤
    backup_uploads
    update_gitignore
    safe_git_pull
    restore_uploads
    cleanup_old_backups
    
    print_message "🎯 uploads文件同步完成！"
    print_message "📁 当前备份: $BACKUP_DIR"
    print_message "🔧 uploads文件已保留并恢复"
}

# 运行主函数
main "$@" 