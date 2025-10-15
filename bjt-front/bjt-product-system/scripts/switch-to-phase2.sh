#!/bin/bash
# 从 main 分支安全切换到 phase-2 分支

set -e

echo "=========================================="
echo "  切换到 phase-2 分支"
echo "=========================================="
echo ""

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
BACKUP_DIR="/var/bjt/backups/git-backup-$(date +%Y%m%d_%H%M%S)"

cd "$PROJECT_DIR" || exit 1

# 1. 备份当前配置
echo "1. 备份当前重要配置..."
echo "--------------------------------------"
mkdir -p "$BACKUP_DIR"

# 备份 SSL 证书
if [ -f nginx/ssl/cert.pem ]; then
    cp nginx/ssl/cert.pem "$BACKUP_DIR/cert.pem.backup"
    echo "✅ SSL 证书已备份"
fi

if [ -f nginx/ssl/private.key ]; then
    cp nginx/ssl/private.key "$BACKUP_DIR/private.key.backup"
    echo "✅ SSL 私钥已备份"
fi

# 备份 docker-compose 配置
if [ -f docker/prod/docker-compose.prod.yml ]; then
    cp docker/prod/docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml.backup"
    echo "✅ Docker Compose 配置已备份"
fi

# 备份 .env 文件（如果存在）
if [ -f docker/prod/.env ]; then
    cp docker/prod/.env "$BACKUP_DIR/.env.backup"
    echo "✅ 环境变量文件已备份"
fi

echo ""
echo "备份保存在: $BACKUP_DIR"
echo ""

# 2. 显示当前状态
echo "2. 当前分支状态："
echo "--------------------------------------"
git branch -v
echo ""

# 3. 保存本地修改
echo "3. 保存本地修改..."
echo "--------------------------------------"

# 保存 SSL 证书的修改
git stash push -m "保存 SSL 证书和配置修改 $(date)" \
    nginx/ssl/cert.pem \
    nginx/ssl/private.key \
    docker/prod/docker-compose.prod.yml 2>/dev/null || true

echo "✅ 重要修改已暂存"
echo ""

# 4. 清理不需要的文件
echo "4. 清理临时文件..."
echo "--------------------------------------"
rm -f Dockpod.yml docker-compose.yml poddeploy.sh podman.yml 2>/dev/null || true
rm -rf docker/dev/Dockerfile.prod docker/dev/nginx/Dockerfile.* docker/dev/wordpress/default.conf 2>/dev/null || true
rm -rf temp_frontend 2>/dev/null || true
echo "✅ 临时文件已清理"
echo ""

# 5. 获取最新的远程分支
echo "5. 获取最新的远程分支..."
echo "--------------------------------------"
git fetch origin
echo "✅ 远程分支已更新"
echo ""

# 6. 切换到 phase-2 分支
echo "6. 切换到 phase-2 分支..."
echo "--------------------------------------"
if git show-ref --verify --quiet refs/heads/phase-2; then
    echo "本地已有 phase-2 分支，切换..."
    git checkout phase-2
    git pull origin phase-2
else
    echo "创建并切换到 phase-2 分支..."
    git checkout -b phase-2 origin/phase-2
fi
echo "✅ 已切换到 phase-2 分支"
echo ""

# 7. 恢复 SSL 证书
echo "7. 恢复 SSL 证书和重要配置..."
echo "--------------------------------------"

# 恢复 SSL 证书（从备份）
if [ -f "$BACKUP_DIR/cert.pem.backup" ]; then
    cp "$BACKUP_DIR/cert.pem.backup" nginx/ssl/cert.pem
    echo "✅ SSL 证书已恢复"
fi

if [ -f "$BACKUP_DIR/private.key.backup" ]; then
    cp "$BACKUP_DIR/private.key.backup" nginx/ssl/private.key
    echo "✅ SSL 私钥已恢复"
fi

# 恢复证书权限
chmod 644 nginx/ssl/cert.pem 2>/dev/null || true
chmod 600 nginx/ssl/private.key 2>/dev/null || true

echo ""

# 8. 检查 docker-compose 配置差异
echo "8. 检查 docker-compose 配置差异..."
echo "--------------------------------------"
if [ -f "$BACKUP_DIR/docker-compose.prod.yml.backup" ]; then
    echo "对比新旧配置..."
    diff -u docker/prod/docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml.backup" || true
    echo ""
    read -p "是否使用旧的 docker-compose 配置？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$BACKUP_DIR/docker-compose.prod.yml.backup" docker/prod/docker-compose.prod.yml
        echo "✅ 已恢复旧配置"
    else
        echo "保持使用新配置"
    fi
fi
echo ""

# 9. 赋予脚本执行权限
echo "9. 设置脚本执行权限..."
echo "--------------------------------------"
chmod +x scripts/*.sh
echo "✅ 脚本权限已设置"
echo ""

# 10. 显示最终状态
echo "=========================================="
echo "  切换完成"
echo "=========================================="
echo ""
echo "当前分支: $(git branch --show-current)"
echo "最新提交: $(git log --oneline -1)"
echo ""
echo "备份位置: $BACKUP_DIR"
echo ""
echo "📝 下一步操作："
echo "  1. 检查部署环境: sudo ./scripts/pre-deploy-check.sh"
echo "  2. 执行恢复部署: sudo ./scripts/safe-recovery-deploy.sh"
echo ""

