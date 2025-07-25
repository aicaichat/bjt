# Qwen Code 最新版本安装指南

## 🚀 快速开始

### 自动安装 (推荐)

运行安装脚本：

```bash
./install-qwen-latest.sh
```

脚本会自动：
- 检查 Node.js 版本 (需要 20+)
- 安装 Qwen Code 和相关工具
- 配置环境变量
- 更新 Cursor IDE 设置
- 生成使用指南

### 手动安装

#### 1. 安装 Qwen Code CLI

**方式一：从 npm 安装 (推荐)**
```bash
npm install -g @qwen-code/qwen-code
```

**方式二：从源码安装**
```bash
git clone https://github.com/QwenLM/qwen-code.git
cd qwen-code
npm install
npm install -g .
```

#### 2. 安装 Claude Code 集成 (可选)

```bash
npm install -g @anthropic-ai/claude-code
npm install -g @musistudio/claude-code-router
npm install -g @dashscope-js/claude-code-config
```

#### 3. 配置环境变量

创建 `.env` 文件：

```bash
# Qwen Code 配置
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3-coder-plus

# Claude Code 配置 (可选)
ANTHROPIC_BASE_URL=https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy
ANTHROPIC_AUTH_TOKEN=your-dashscope-apikey
```

#### 4. 生成 Claude Code Router 配置

```bash
ccr-dashscope
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENAI_API_KEY` | 阿里云百炼平台 API Key | 必填 |
| `OPENAI_BASE_URL` | API 基础 URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `OPENAI_MODEL` | 使用的模型 | `qwen3-coder-plus` |
| `ANTHROPIC_BASE_URL` | Claude Code 代理 URL | `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy` |
| `ANTHROPIC_AUTH_TOKEN` | Claude Code API Key | 必填 |

### Cursor IDE 集成

更新 `.cursor-env.sh` 文件：

```bash
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
```

## 🎯 使用方法

### Qwen Code CLI

```bash
# 基本使用
qwen

# 指定文件
qwen --file src/main.js

# 指定语言
qwen --language typescript

# 交互模式
qwen --interactive
```

### Claude Code

```bash
# 使用 Claude Code Router
ccr code

# 直接使用 Claude Code
claude-code
```

### Cursor IDE

1. 重启 Cursor
2. 在 AI 对话中使用 Qwen3-Coder 模型
3. 享受强大的代码生成和编辑功能

## 🔗 前端集成

### 安装依赖

```bash
cd frontend
npm install
```

### 配置环境变量

复制 `qwen-code.env.example` 为 `.env.local`：

```bash
cp qwen-code.env.example .env.local
```

编辑 `.env.local` 文件，填入您的 API Key。

### 使用 Qwen Code 组件

```tsx
import QwenCodeAssistant from './components/QwenCodeAssistant';

function App() {
  return (
    <div>
      <QwenCodeAssistant />
    </div>
  );
}
```

### 使用 Qwen Code 工具函数

```tsx
import { useQwenCode } from './utils/qwen-code-integration';

function MyComponent() {
  const { generateCode, reviewCode } = useQwenCode();

  const handleGenerateCode = async () => {
    try {
      const result = await generateCode({
        prompt: '创建一个 React 组件',
        language: 'typescript'
      });
      console.log(result.code);
    } catch (error) {
      console.error('生成失败:', error);
    }
  };

  return (
    <button onClick={handleGenerateCode}>
      生成代码
    </button>
  );
}
```

## 📋 获取 API Key

1. 访问阿里云百炼平台：https://bailian.console.aliyun.com/
2. 注册并登录账号
3. 申请 API Key
4. 将 API Key 替换到环境变量中

## 🛠️ 故障排除

### 常见问题

**Q: `qwen` 命令不可用**
```bash
npm install -g @qwen-code/qwen-code
```

**Q: `ccr` 命令不可用**
```bash
npm install -g @musistudio/claude-code-router
npm install -g @dashscope-js/claude-code-config
ccr-dashscope
```

**Q: Node.js 版本过低**
```bash
# 使用 nvm 安装新版本
nvm install 20
nvm use 20
```

**Q: API 请求失败**
- 检查 API Key 是否正确
- 检查网络连接
- 确认 API 配额是否充足

### 检查安装状态

```bash
# 检查 Qwen Code
qwen --version

# 检查 Claude Code
claude-code --version

# 检查 Node.js 版本
node --version

# 检查环境变量
echo $OPENAI_API_KEY
```

## 🎉 特性

- 🤖 强大的代码生成能力
- 🔧 智能代码编辑和重构
- 🌍 多语言支持
- 🚀 与主流 IDE 集成
- 📚 丰富的工具链支持
- 🔄 代码审查和测试生成
- 🎯 前端组件集成

## 📚 更多资源

- [官方文档](https://github.com/QwenLM/qwen-code)
- [阿里云百炼平台](https://bailian.console.aliyun.com/)
- [社区支持](https://github.com/QwenLM/qwen-code/issues)
- [API 文档](https://help.aliyun.com/zh/dashscope/)

## 🚀 开始使用

现在您可以：

1. 在终端中使用 `qwen` 命令
2. 在 Cursor IDE 中使用 Qwen3-Coder 模型
3. 在前端应用中使用 Qwen Code 组件
4. 享受强大的 AI 辅助编程体验

祝您编码愉快！🎉 