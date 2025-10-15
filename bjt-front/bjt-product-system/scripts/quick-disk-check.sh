#!/bin/bash
# 快速检查磁盘占用 - 最关键的信息

echo "=== 快速磁盘占用检查 ==="
echo ""

# 1. 磁盘使用率
echo "【磁盘使用率】"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# 2. 最大的 5 个目录
echo "【根目录最大的 5 个目录】"
sudo du -sh /* 2>/dev/null | sort -hr | head -5
echo ""

# 3. /var 下最大的目录
echo "【/var 下最大的 5 个目录】"
sudo du -sh /var/* 2>/dev/null | sort -hr | head -5
echo ""

# 4. Docker 占用
echo "【Docker 占用】"
if command -v docker &> /dev/null; then
    docker system df
else
    echo "Docker 未安装"
fi
echo ""

# 5. 项目目录占用
echo "【项目目录占用】"
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
if [ -d "$PROJECT_DIR" ]; then
    echo "项目总大小:"
    sudo du -sh "$PROJECT_DIR"
    echo ""
    echo "主要子目录:"
    sudo du -sh "$PROJECT_DIR"/* 2>/dev/null | sort -hr | head -5
    echo ""
    echo "node_modules 占用:"
    sudo find "$PROJECT_DIR" -type d -name "node_modules" -exec du -sh {} \; 2>/dev/null
else
    echo "项目目录不存在"
fi
echo ""

# 6. 日志占用
echo "【日志占用】"
sudo du -sh /var/log
echo ""

# 7. 最大的 10 个文件
echo "【系统最大的 10 个文件】"
sudo find / -type f -size +100M -exec du -h {} \; 2>/dev/null | sort -hr | head -10
echo ""

echo "=== 检查完成 ==="
echo ""
echo "💡 运行详细分析: ./scripts/analyze-disk-usage.sh"
echo "🧹 运行自动清理: ./scripts/cleanup-disk-space.sh"

