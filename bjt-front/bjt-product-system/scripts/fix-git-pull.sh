#!/bin/bash
# 修复 git pull 分支冲突问题

echo "=== 修复 Git 分支冲突 ==="
echo ""

# 1. 检查当前状态
echo "1. 当前 Git 状态："
echo "--------------------------------------"
git status
echo ""

# 2. 查看本地和远程的差异
echo "2. 查看本地修改："
echo "--------------------------------------"
git log --oneline origin/phase-2..HEAD
echo ""

# 3. 保存本地修改
echo "3. 保存本地修改到临时分支..."
BACKUP_BRANCH="local-backup-$(date +%Y%m%d_%H%M%S)"
git branch "$BACKUP_BRANCH"
echo "✅ 已创建备份分支: $BACKUP_BRANCH"
echo ""

# 4. 拉取远程更新
echo "4. 拉取远程更新（使用 rebase）..."
git pull --rebase origin phase-2

echo ""
echo "=== 完成 ==="
echo ""
echo "如果出现冲突，请解决后执行："
echo "  git rebase --continue"
echo ""
echo "如果想放弃 rebase："
echo "  git rebase --abort"
echo "  git checkout $BACKUP_BRANCH"

