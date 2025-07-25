#!/bin/bash

# Qwen Code 最新版本安装脚本
# 支持多种安装方式和配置选项

set -e

echo "🚀 开始安装最新版本的 Qwen Code..."
echo "=================================="

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，正在安装..."
    curl -qL https://www.npmjs.com/install.sh | sh
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "❌ Node.js 版本过低，需要 20 及以上版本"
        echo "当前版本: $(node --version)"
        echo "请先升级 Node.js 到 20+ 版本"
        exit 1
    else
        echo "✅ Node.js 版本检查通过: $(node --version)"
    fi
fi

# 检查 npm 版本
echo "📋 检查 npm 版本..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
else
    echo "✅ npm 版本: $(npm --version)"
fi

# 创建安装选项菜单
echo ""
echo "请选择安装方式:"
echo "1) 从 npm 安装 Qwen Code (推荐)"
echo "2) 从源码安装 Qwen Code"
echo "3) 安装 Claude Code + Qwen3-Coder 集成"
echo "4) 安装所有工具 (完整开发环境)"
echo "5) 仅配置环境变量"

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "📦 从 npm 安装 Qwen Code..."
        npm install -g @qwen-code/qwen-code
        echo "✅ Qwen Code 安装完成"
        ;;
    2)
        echo "📦 从源码安装 Qwen Code..."
        if [ -d "qwen-code" ]; then
            echo "⚠️  qwen-code 目录已存在，正在删除..."
            rm -rf qwen-code
        fi
        git clone https://github.com/QwenLM/qwen-code.git
        cd qwen-code
        npm install
        npm install -g .
        cd ..
        echo "✅ Qwen Code 从源码安装完成"
        ;;
    3)
        echo "📦 安装 Claude Code + Qwen3-Coder 集成..."
        npm install -g @anthropic-ai/claude-code
        npm install -g @musistudio/claude-code-router
        npm install -g @dashscope-js/claude-code-config
        echo "✅ Claude Code 集成安装完成"
        ;;
    4)
        echo "📦 安装所有工具 (完整开发环境)..."
        # 安装 Qwen Code
        npm install -g @qwen-code/qwen-code
        
        # 安装 Claude Code 集成
        npm install -g @anthropic-ai/claude-code
        npm install -g @musistudio/claude-code-router
        npm install -g @dashscope-js/claude-code-config
        
        echo "✅ 所有工具安装完成"
        ;;
    5)
        echo "⚙️ 仅配置环境变量..."
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 配置环境变量
echo ""
echo "🔧 配置环境变量..."

# 创建 .env 文件
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# 检查是否已有配置
if ! grep -q "OPENAI_API_KEY" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Qwen Code 配置" >> "$ENV_FILE"
    echo "OPENAI_API_KEY=your_api_key_here" >> "$ENV_FILE"
    echo "OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1" >> "$ENV_FILE"
    echo "OPENAI_MODEL=qwen3-coder-plus" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
    echo "# Claude Code 配置" >> "$ENV_FILE"
    echo "ANTHROPIC_BASE_URL=https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy" >> "$ENV_FILE"
    echo "ANTHROPIC_AUTH_TOKEN=your-dashscope-apikey" >> "$ENV_FILE"
    echo "✅ 环境变量配置已添加到 $ENV_FILE"
else
    echo "⚠️  环境变量已存在，请手动检查 $ENV_FILE"
fi

# 更新 .cursor-env.sh
echo ""
echo "🔧 更新 Cursor 环境配置..."
CURSOR_ENV_FILE=".cursor-env.sh"

# 备份原文件
if [ -f "$CURSOR_ENV_FILE" ]; then
    cp "$CURSOR_ENV_FILE" "${CURSOR_ENV_FILE}.backup"
    echo "✅ 已备份原配置文件到 ${CURSOR_ENV_FILE}.backup"
fi

# 创建新的配置
cat > "$CURSOR_ENV_FILE" << 'EOF'
#!/bin/bash

# Qwen Code 环境配置
export CURSOR_AI_MODEL="qwen3-coder-plus"
export CURSOR_AI_PROVIDER="openai"

# Qwen Code 配置
export OPENAI_API_KEY="your_api_key_here"
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
EOF

chmod +x "$CURSOR_ENV_FILE"
echo "✅ Cursor 环境配置已更新"

# 生成 Claude Code Router 配置
if command -v ccr-dashscope &> /dev/null; then
    echo ""
    echo "🔧 生成 Claude Code Router 配置..."
    ccr-dashscope
    echo "✅ Claude Code Router 配置已生成"
fi

# 创建使用指南
echo ""
echo "📖 创建使用指南..."
cat > "QWEN_CODE_USAGE_GUIDE.md" << 'EOF'
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
EOF

echo "✅ 使用指南已创建: QWEN_CODE_USAGE_GUIDE.md"

# 安装完成总结
echo ""
echo "🎉 安装完成！"
echo "=================================="
echo "✅ Qwen Code 已安装并配置"
echo "✅ 环境变量已设置"
echo "✅ Cursor 配置已更新"
echo "✅ 使用指南已创建"
echo ""
echo "📋 下一步操作："
echo "1. 获取阿里云百炼平台 API Key"
echo "2. 更新 .env 文件中的 API Key"
echo "3. 重启 Cursor IDE"
echo "4. 在终端测试: qwen --version"
echo ""
echo "📖 详细使用说明请查看: QWEN_CODE_USAGE_GUIDE.md"
echo ""
echo "🚀 开始享受 Qwen3-Coder 的强大编码能力！" 