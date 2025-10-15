#!/bin/bash
# 详细分析磁盘空间占用情况

echo "======================================"
echo "   服务器磁盘空间占用详细分析报告"
echo "======================================"
echo ""
echo "分析时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. 总体磁盘使用情况
echo "【1】总体磁盘使用情况"
echo "--------------------------------------"
df -h
echo ""

# 2. 根目录下各目录占用（按大小排序）
echo "【2】根目录(/)下各目录占用空间 TOP 20"
echo "--------------------------------------"
echo "正在扫描根目录，请稍候..."
sudo du -sh /* 2>/dev/null | sort -hr | head -20
echo ""

# 3. /var 目录详细分析（通常占用较大）
echo "【3】/var 目录详细分析 TOP 20"
echo "--------------------------------------"
sudo du -sh /var/* 2>/dev/null | sort -hr | head -20
echo ""

# 4. /var/lib 目录分析（Docker 数据通常在这里）
echo "【4】/var/lib 目录详细分析"
echo "--------------------------------------"
sudo du -sh /var/lib/* 2>/dev/null | sort -hr | head -20
echo ""

# 5. Docker 占用分析
echo "【5】Docker 占用空间详细分析"
echo "--------------------------------------"
if command -v docker &> /dev/null; then
    echo "Docker 总体占用："
    docker system df
    echo ""
    
    echo "Docker 详细占用："
    docker system df -v
    echo ""
    
    echo "Docker 数据目录大小："
    if [ -d /var/lib/docker ]; then
        sudo du -sh /var/lib/docker
        echo ""
        echo "Docker 子目录占用："
        sudo du -sh /var/lib/docker/* 2>/dev/null | sort -hr
    fi
else
    echo "Docker 未安装"
fi
echo ""

# 6. 项目目录占用分析
echo "【6】项目目录占用分析"
echo "--------------------------------------"
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
if [ -d "$PROJECT_DIR" ]; then
    echo "项目根目录总大小："
    sudo du -sh "$PROJECT_DIR"
    echo ""
    
    echo "项目主要目录占用："
    sudo du -sh "$PROJECT_DIR"/* 2>/dev/null | sort -hr | head -20
    echo ""
    
    # frontend 目录详细分析
    if [ -d "$PROJECT_DIR/frontend" ]; then
        echo "Frontend 目录详细分析："
        sudo du -sh "$PROJECT_DIR/frontend"/* 2>/dev/null | sort -hr | head -10
        echo ""
    fi
    
    # 查找所有 node_modules
    echo "所有 node_modules 目录占用："
    sudo find "$PROJECT_DIR" -type d -name "node_modules" -exec du -sh {} \; 2>/dev/null | sort -hr
    echo ""
    
    # 查找所有 dist 目录
    echo "所有构建输出目录 (dist/build) 占用："
    sudo find "$PROJECT_DIR" -type d \( -name "dist" -o -name "build" \) -exec du -sh {} \; 2>/dev/null | sort -hr
    echo ""
else
    echo "项目目录不存在: $PROJECT_DIR"
fi
echo ""

# 7. 备份文件占用
echo "【7】备份文件占用分析"
echo "--------------------------------------"
if [ -d /var/bjt/backups ]; then
    echo "备份目录总大小："
    sudo du -sh /var/bjt/backups
    echo ""
    
    echo "各个备份文件大小："
    sudo find /var/bjt/backups -type f -exec du -sh {} \; 2>/dev/null | sort -hr | head -20
else
    echo "备份目录不存在"
fi
echo ""

# 8. 日志文件占用
echo "【8】日志文件占用分析"
echo "--------------------------------------"
echo "/var/log 总大小："
sudo du -sh /var/log
echo ""

echo "最大的日志文件 TOP 20："
sudo find /var/log -type f -exec du -sh {} \; 2>/dev/null | sort -hr | head -20
echo ""

# 9. 查找超大文件（>100MB）
echo "【9】超大文件列表（>100MB）"
echo "--------------------------------------"
echo "正在扫描系统中大于 100MB 的文件，请稍候..."
sudo find / -type f -size +100M -exec du -h {} \; 2>/dev/null | sort -hr | head -30
echo ""

# 10. 查找超大文件（>1GB）
echo "【10】特大文件列表（>1GB）"
echo "--------------------------------------"
sudo find / -type f -size +1G -exec du -h {} \; 2>/dev/null | sort -hr | head -20
echo ""

# 11. 临时文件占用
echo "【11】临时文件占用"
echo "--------------------------------------"
if [ -d /tmp ]; then
    echo "/tmp 目录大小："
    sudo du -sh /tmp
    echo "TOP 10 文件/目录："
    sudo du -sh /tmp/* 2>/dev/null | sort -hr | head -10
fi
echo ""

if [ -d /var/tmp ]; then
    echo "/var/tmp 目录大小："
    sudo du -sh /var/tmp
    echo "TOP 10 文件/目录："
    sudo du -sh /var/tmp/* 2>/dev/null | sort -hr | head -10
fi
echo ""

# 12. 包管理器缓存
echo "【12】包管理器缓存占用"
echo "--------------------------------------"
if [ -d /var/cache/apt ]; then
    echo "APT 缓存大小："
    sudo du -sh /var/cache/apt
fi

if [ -d /var/cache/yum ]; then
    echo "YUM 缓存大小："
    sudo du -sh /var/cache/yum
fi

if command -v npm &> /dev/null; then
    NPM_CACHE=$(npm config get cache)
    if [ -d "$NPM_CACHE" ]; then
        echo "NPM 缓存大小："
        sudo du -sh "$NPM_CACHE"
    fi
fi
echo ""

# 13. 已删除但未释放的文件（进程仍在使用）
echo "【13】已删除但未释放的文件"
echo "--------------------------------------"
echo "正在检查..."
sudo lsof 2>/dev/null | grep deleted | awk '{sum+=$7} END {print "占用空间: " sum/1024/1024 " MB"}'
sudo lsof 2>/dev/null | grep deleted | awk '{print $7/1024/1024 " MB - " $9}' | sort -rn | head -10
echo ""

# 14. systemd journal 日志
echo "【14】systemd journal 日志占用"
echo "--------------------------------------"
if command -v journalctl &> /dev/null; then
    echo "Journal 日志占用："
    sudo journalctl --disk-usage
fi
echo ""

# 15. 生成清理建议
echo "======================================"
echo "   清理建议汇总"
echo "======================================"
echo ""

# 分析并给出建议
DOCKER_SIZE=$(docker system df 2>/dev/null | tail -n +2 | awk '{sum+=$4} END {print sum}')
LOG_SIZE=$(sudo du -s /var/log 2>/dev/null | awk '{print $1}')
PROJECT_NM_SIZE=$(sudo find "$PROJECT_DIR" -type d -name "node_modules" -exec du -s {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}')

echo "可清理空间估算："
echo "--------------------------------------"

if [ -n "$DOCKER_SIZE" ] && [ "$DOCKER_SIZE" != "" ]; then
    echo "✓ Docker 未使用资源: ${DOCKER_SIZE} (执行: docker system prune -a -f)"
fi

if [ -n "$LOG_SIZE" ] && [ "$LOG_SIZE" -gt 1000000 ]; then
    echo "✓ 系统日志: $(echo $LOG_SIZE | awk '{print $1/1024 " MB"}') (执行: journalctl --vacuum-time=7d)"
fi

if [ -n "$PROJECT_NM_SIZE" ] && [ "$PROJECT_NM_SIZE" -gt 100000 ]; then
    echo "✓ node_modules: $(echo $PROJECT_NM_SIZE | awk '{print $1/1024 " MB"}') (部署时会重新安装)"
fi

echo ""
echo "======================================"
echo "   分析完成"
echo "======================================"
echo ""
echo "💡 提示："
echo "   1. 使用 ./scripts/cleanup-disk-space.sh 自动清理"
echo "   2. 手动删除不需要的大文件"
echo "   3. 考虑购买更大的云盘或添加数据盘"
echo ""

