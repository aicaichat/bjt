#!/bin/bash
# 清理服务器磁盘空间 - 安全版本

set -e

echo "=== 服务器磁盘空间清理 ==="
echo ""

# 检查当前磁盘使用率
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "当前磁盘使用率: ${DISK_USAGE}%"
echo ""

if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✅ 磁盘使用率正常，无需清理"
    exit 0
fi

echo "⚠️  磁盘使用率超过 80%，开始清理..."
echo ""

# 记录清理前的空间
BEFORE_SPACE=$(df / | awk 'NR==2 {print $4}')
echo "清理前可用空间: $(df -h / | awk 'NR==2 {print $4}')"
echo ""

# 1. 清理 Docker 资源
echo "1. 清理 Docker 未使用的资源..."
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    echo "清理前 Docker 占用："
    docker system df
    echo ""
    
    echo "清理停止的容器..."
    docker container prune -f
    
    echo "清理未使用的镜像..."
    docker image prune -a -f
    
    echo "清理未使用的卷..."
    docker volume prune -f
    
    echo "清理未使用的网络..."
    docker network prune -f
    
    echo "清理构建缓存..."
    docker builder prune -a -f
    
    echo ""
    echo "清理后 Docker 占用："
    docker system df
else
    echo "Docker 未安装，跳过"
fi
echo ""

# 2. 清理旧的备份文件
echo "2. 清理旧的备份文件（保留最近 7 天）..."
echo "----------------------------------------"
if [ -d /var/bjt/backups ]; then
    echo "查找 7 天前的备份文件..."
    find /var/bjt/backups -type f -name "*.sql" -mtime +7 -ls
    find /var/bjt/backups -type f -name "*.sql" -mtime +7 -delete
    echo "✅ 旧备份文件已删除"
else
    echo "备份目录不存在，跳过"
fi
echo ""

# 3. 清理前端构建产物和 node_modules
echo "3. 清理前端构建缓存..."
echo "----------------------------------------"
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
if [ -d "$PROJECT_DIR/frontend" ]; then
    echo "清理 frontend/node_modules..."
    if [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
        du -sh "$PROJECT_DIR/frontend/node_modules"
        rm -rf "$PROJECT_DIR/frontend/node_modules"
        echo "✅ node_modules 已删除（部署时会重新安装）"
    fi
    
    echo "清理 frontend/dist..."
    if [ -d "$PROJECT_DIR/frontend/dist" ]; then
        du -sh "$PROJECT_DIR/frontend/dist"
        rm -rf "$PROJECT_DIR/frontend/dist"
        echo "✅ dist 已删除（部署时会重新构建）"
    fi
    
    echo "清理 frontend/.vite 缓存..."
    if [ -d "$PROJECT_DIR/frontend/.vite" ]; then
        rm -rf "$PROJECT_DIR/frontend/.vite"
    fi
    
    echo "清理 frontend/.cache 缓存..."
    if [ -d "$PROJECT_DIR/frontend/.cache" ]; then
        rm -rf "$PROJECT_DIR/frontend/.cache"
    fi
else
    echo "frontend 目录不存在，跳过"
fi
echo ""

# 4. 清理系统日志
echo "4. 清理系统日志..."
echo "----------------------------------------"
echo "清理前日志大小："
du -sh /var/log
echo ""

# 清理 journal 日志（保留最近 7 天）
if command -v journalctl &> /dev/null; then
    echo "清理 systemd journal 日志（保留 7 天）..."
    journalctl --vacuum-time=7d
fi

# 清理旧的日志文件
echo "压缩旧的日志文件..."
find /var/log -type f -name "*.log" -size +100M -exec gzip {} \;
find /var/log -type f -name "*.log.*" -mtime +30 -delete

echo ""
echo "清理后日志大小："
du -sh /var/log
echo ""

# 5. 清理 APT/YUM 缓存
echo "5. 清理包管理器缓存..."
echo "----------------------------------------"
if command -v apt-get &> /dev/null; then
    echo "清理 APT 缓存..."
    apt-get clean
    apt-get autoclean
    apt-get autoremove -y
elif command -v yum &> /dev/null; then
    echo "清理 YUM 缓存..."
    yum clean all
fi
echo ""

# 6. 清理临时文件
echo "6. 清理临时文件..."
echo "----------------------------------------"
echo "清理 /tmp 目录（30 天前的文件）..."
find /tmp -type f -atime +30 -delete 2>/dev/null || true

echo "清理 /var/tmp 目录（30 天前的文件）..."
find /var/tmp -type f -atime +30 -delete 2>/dev/null || true
echo ""

# 7. 清理旧的部署文件
echo "7. 清理旧的部署文件..."
echo "----------------------------------------"
if [ -d "$PROJECT_DIR" ]; then
    echo "查找旧的部署备份..."
    find "$PROJECT_DIR" -type d -name "*deploy*" -o -name "*backup*" | head -10
    
    # 只保留最近的 3 个备份
    find "$PROJECT_DIR" -type d -name "*backup*" -mtime +7 | tail -n +4 | xargs rm -rf 2>/dev/null || true
fi
echo ""

# 8. 清理 npm 缓存
echo "8. 清理 npm 缓存..."
echo "----------------------------------------"
if command -v npm &> /dev/null; then
    echo "npm 缓存位置："
    npm config get cache
    echo ""
    npm cache clean --force
    echo "✅ npm 缓存已清理"
fi
echo ""

# 9. 清理 core dump 文件
echo "9. 清理 core dump 文件..."
echo "----------------------------------------"
find / -name "core.*" -type f -delete 2>/dev/null || true
find / -name "*.core" -type f -delete 2>/dev/null || true
echo "✅ core dump 文件已清理"
echo ""

# 记录清理后的空间
AFTER_SPACE=$(df / | awk 'NR==2 {print $4}')
FREED_SPACE=$((AFTER_SPACE - BEFORE_SPACE))

echo "=== 清理完成 ==="
echo ""
echo "清理后可用空间: $(df -h / | awk 'NR==2 {print $4}')"
echo "释放的空间: $(echo $FREED_SPACE | awk '{print $1/1024/1024 " GB"}')"
echo ""

echo "当前磁盘使用情况："
df -h
echo ""

NEW_DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "清理后磁盘使用率: ${NEW_DISK_USAGE}%"

if [ "$NEW_DISK_USAGE" -lt 80 ]; then
    echo "✅ 磁盘使用率已恢复正常"
else
    echo "⚠️  磁盘使用率仍然较高，建议："
    echo "   1. 购买更大的云盘"
    echo "   2. 添加额外的数据盘"
    echo "   3. 检查是否有异常占用空间的文件"
fi

