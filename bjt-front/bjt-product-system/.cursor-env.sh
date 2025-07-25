#!/bin/bash

# Qwen Code 环境配置
export CURSOR_AI_MODEL="qwen3-coder-plus"
export CURSOR_AI_PROVIDER="openai"

# Qwen Code 配置
export OPENAI_API_KEY="sk-d82da97c918e4d8aa4bf41c13f6a7ba7"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENAI_MODEL="qwen3-coder-plus"

# Claude Code 配置 (可选)
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy"
export ANTHROPIC_AUTH_TOKEN="your-dashscope-apikey"

# 可选：设置其他AI相关环境变量
export CURSOR_AI_TEMPERATURE="0.7"
export CURSOR_AI_MAX_TOKENS="4000"

echo "Qwen Code 环境已配置"
echo "请重启 Cursor 以应用设置"
echo ""
echo "使用方法:"
echo "- 在终端输入 'qwen' 使用 Qwen Code"
echo "- 在终端输入 'ccr code' 使用 Claude Code"
echo "- 在 Cursor 中使用 Qwen3-Coder 模型"
