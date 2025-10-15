#!/bin/bash
# 检查服务器真实磁盘情况和清理空间

echo "=== 服务器磁盘真实情况检查 ==="
echo ""

echo "1. 检查 /dev/vdb 是否真实存在并可用："
echo "----------------------------------------"
if [ -b /dev/vdb ]; then
    echo "✅ /dev/vdb 存在"
    echo ""
    echo "检查是否已有数据："
    sudo file -s /dev/vdb
    echo ""
    echo "检查磁盘大小："
    sudo blockdev --getsize64 /dev/vdb | awk '{print "大小: " $1/1024/1024/1024 " GB"}'
else
    echo "❌ /dev/vdb 不存在或不可用"
fi
echo ""

echo "2. 当前磁盘使用情况："
echo "----------------------------------------"
df -h
echo ""

echo "3. 查找占用空间最大的目录（前 20 个）："
echo "----------------------------------------"
du -sh /var/* 2>/dev/null | sort -hr | head -20
echo ""

echo "4. Docker 占用空间："
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    docker system df
else
    echo "Docker 未安装"
fi
echo ""

echo "5. 系统日志占用："
echo "----------------------------------------"
du -sh /var/log
echo ""

echo "6. 项目目录占用："
echo "----------------------------------------"
if [ -d /var/bjt ]; then
    du -sh /var/bjt/www/bjt/bjt-front/bjt-product-system/* 2>/dev/null | sort -hr | head -10
else
    echo "/var/bjt 不存在"
fi
echo ""

echo "7. npm/node_modules 占用："
echo "----------------------------------------"
find /var/bjt -type d -name "node_modules" -exec du -sh {} \; 2>/dev/null | sort -hr | head -10
echo ""

echo "8. 可清理的空间估算："
echo "----------------------------------------"
echo "Docker 未使用的镜像/容器/卷："
if command -v docker &> /dev/null; then
    docker system df | tail -n +2 | awk '{if($4+0>0) print $1 ": " $4}'
fi
echo ""
echo "系统日志："
du -sh /var/log/*.log 2>/dev/null | awk '{sum+=$1} END {print "约 " sum " 可清理"}'
echo ""

echo "=== 检查完成 ==="

