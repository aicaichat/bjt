#!/bin/bash
# Figma 数据同步定时任务脚本
# 添加到 crontab: crontab -e
# 或使用 launchd (macOS)

# 必须在环境中设置 FIGMA_TOKEN（勿将真实 Token 写入仓库）
if [ -z "$FIGMA_TOKEN" ]; then
  echo "figma-cron.sh: 请设置环境变量 FIGMA_TOKEN" >&2
  exit 1
fi

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/../.figma-cache/sync.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 执行同步
echo "[$(date)] 开始 Figma 同步..." >> "$LOG_FILE"
node "$SCRIPT_DIR/figma-sync.js" sync >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date)] 同步成功" >> "$LOG_FILE"
else
    echo "[$(date)] 同步失败" >> "$LOG_FILE"
fi
echo "---" >> "$LOG_FILE"
