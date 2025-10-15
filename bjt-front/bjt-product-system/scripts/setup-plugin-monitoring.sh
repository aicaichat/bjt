#!/bin/bash
# 设置插件监控 cron 任务

echo "=========================================="
echo "  设置插件监控"
echo "=========================================="
echo ""

PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"

# 1. 赋予监控脚本执行权限
chmod +x "$PROJECT_DIR/scripts/monitor-plugins.sh"
chmod +x "$PROJECT_DIR/scripts/keep-plugins-active.sh"

# 2. 创建日志目录
mkdir -p /var/log

# 3. 添加 cron 任务（每5分钟检查一次）
CRON_JOB="*/5 * * * * $PROJECT_DIR/scripts/monitor-plugins.sh"

# 检查 cron 任务是否已存在
if crontab -l 2>/dev/null | grep -q "monitor-plugins.sh"; then
    echo "✅ Cron 任务已存在"
else
    echo "添加 Cron 任务..."
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron 任务已添加（每5分钟检查一次）"
fi

# 4. 显示当前 cron 任务
echo ""
echo "当前 Cron 任务："
crontab -l | grep "bjt"

echo ""
echo "=========================================="
echo "  设置完成"
echo "=========================================="
echo ""
echo "监控功能："
echo "  - 每5分钟自动检查插件状态"
echo "  - 如果插件被禁用，自动重新激活"
echo "  - 日志记录在 /var/log/bjt-plugin-monitor.log"
echo ""
echo "手动检查命令："
echo "  $PROJECT_DIR/scripts/monitor-plugins.sh"
echo ""
echo "查看日志："
echo "  tail -f /var/log/bjt-plugin-monitor.log"
echo ""
echo "立即执行一次检查："
$PROJECT_DIR/scripts/monitor-plugins.sh

