#!/bin/bash

# BJT Product System - 快速Git Pull脚本
# 使用方法: ./scripts/quick-git-pull.sh

echo "🚀 BJT Product System - 快速Git Pull"
echo "=================================="

# 检查是否在项目根目录
if [ ! -f "deploy-production.sh" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 显示当前状态
echo "📊 当前Git状态:"
git status --porcelain

# 备份uploads目录（如果存在）
if [ -d "frontend/public/uploads" ] && [ "$(ls -A frontend/public/uploads)" ]; then
    backup_dir="uploads_backup_$(date +%Y%m%d_%H%M%S)"
    echo "💾 备份uploads目录到: $backup_dir"
    cp -r frontend/public/uploads "$backup_dir"
fi

# 重置到HEAD状态（保留uploads）
echo "🧹 重置Git状态..."
git reset --hard HEAD

# 清理未跟踪文件（保留uploads和备份）
echo "🗑️  清理未跟踪文件..."
git clean -fd -e "frontend/public/uploads/*" -e "uploads_backup_*"

# 执行Git Pull
echo "📥 执行Git Pull..."
if git pull; then
    echo "✅ Git Pull成功!"
    
    # 恢复uploads文件（如果有备份）
    if [ -d "$backup_dir" ]; then
        echo "📂 恢复uploads文件..."
        # 确保uploads目录存在
        mkdir -p frontend/public/uploads
        # 恢复所有文件
        cp -r "$backup_dir"/* frontend/public/uploads/ 2>/dev/null || true
        echo "✅ uploads文件已恢复"
        
        # 清理备份（保留最新的3个）
        echo "🧹 清理旧备份..."
        ls -dt uploads_backup_* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    fi
    
    echo "🎉 Git Pull完成!"
else
    echo "❌ Git Pull失败"
    
    # 如果失败，尝试恢复uploads
    if [ -d "$backup_dir" ]; then
        echo "🔄 恢复uploads文件..."
        mkdir -p frontend/public/uploads
        cp -r "$backup_dir"/* frontend/public/uploads/ 2>/dev/null || true
    fi
    
    exit 1
fi 