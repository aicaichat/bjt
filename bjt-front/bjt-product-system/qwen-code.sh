#!/bin/bash

# Qwen Code 便捷启动脚本
# 使用方法: ./qwen-code.sh [选项] [提示]

# 设置环境变量
export QWEN_API_KEY="sk-d82da97c918e4d8aa4bf41c13f6a7ba7"
export QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 运行 Qwen Code 客户端
node "$SCRIPT_DIR/qwen-code-client.js" "$@" 