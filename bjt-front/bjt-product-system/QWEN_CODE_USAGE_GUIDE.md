# Qwen Code 使用指南

## 安装完成 ✅

恭喜！Qwen Code 已成功安装并配置。

## 使用方法

### 1. Qwen Code CLI
```bash
# 在终端中使用 Qwen Code
qwen

# 或者指定文件
qwen --file src/main.js
```

### 2. Claude Code + Qwen3-Coder
```bash
# 使用 Claude Code Router
ccr code

# 或者直接使用 Claude Code
claude-code
```

### 3. Cursor IDE 集成
- 重启 Cursor
- 在 AI 对话中使用 Qwen3-Coder 模型
- 享受强大的代码生成和编辑功能

## 环境变量配置

### Qwen Code 配置
```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENAI_MODEL="qwen3-coder-plus"
```

### Claude Code 配置
```bash
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy"
export ANTHROPIC_AUTH_TOKEN="your-dashscope-apikey"
```

## 获取 API Key

1. 访问阿里云百炼平台：https://bailian.console.aliyun.com/
2. 申请 API Key
3. 将 API Key 替换到环境变量中

## 故障排除

### 如果 qwen 命令不可用
```bash
npm install -g @qwen-code/qwen-code
```

### 如果 ccr 命令不可用
```bash
npm install -g @musistudio/claude-code-router
npm install -g @dashscope-js/claude-code-config
ccr-dashscope
```

### 检查安装状态
```bash
# 检查 Qwen Code
qwen --version

# 检查 Claude Code
claude-code --version

# 检查 Node.js 版本
node --version
```

## 特性

- 🤖 强大的代码生成能力
- 🔧 智能代码编辑和重构
- 🌍 多语言支持
- 🚀 与主流 IDE 集成
- 📚 丰富的工具链支持

## 更多信息

- 官方文档：https://github.com/QwenLM/qwen-code
- 阿里云百炼平台：https://bailian.console.aliyun.com/
- 社区支持：https://github.com/QwenLM/qwen-code/issues
