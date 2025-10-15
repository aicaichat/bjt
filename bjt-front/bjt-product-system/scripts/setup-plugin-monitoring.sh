#!/bin/bash
# 脚本：setup-plugin-monitoring.sh
# 描述：设置一个 cron 任务来定期运行 monitor-plugins.sh 脚本。

set -e

# 项目根目录
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
# 监控脚本路径
MONITOR_SCRIPT="${PROJECT_ROOT}/scripts/monitor-plugins.sh"
# 日志文件
LOG_FILE="/var/log/bjt-plugin-monitor.log"

echo "=== 设置 BJT 插件监控 Cron 任务 ==="

# 确保监控脚本存在且可执行
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ 错误: 监控脚本未找到: $MONITOR_SCRIPT"
    exit 1
fi
chmod +x "$MONITOR_SCRIPT"
echo "✅ 监控脚本权限已设置。"

# 确保日志文件存在
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"
echo "✅ 日志文件 $LOG_FILE 已准备。"

# 添加或更新 cron 任务
CRON_JOB="*/5 * * * * $MONITOR_SCRIPT >> $LOG_FILE 2>&1"
(crontab -l 2>/dev/null | grep -v -F "$MONITOR_SCRIPT"; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron 任务已设置，每 5 分钟运行一次 $MONITOR_SCRIPT。"
    echo "   日志输出到: $LOG_FILE"
    echo "   当前 Cron 任务列表:"
    crontab -l | grep "$MONITOR_SCRIPT"
else
    echo "❌ 错误: 无法设置 Cron 任务。请手动检查 crontab 配置。"
    exit 1
fi

echo "=== BJT 插件监控设置完成 ==="
echo ""
