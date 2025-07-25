# Qwen Code 快速开始指南

## 🎉 安装完成！

恭喜！Qwen Code 已成功安装到您的项目中。以下是快速开始的方法：

## 🚀 立即开始使用

### 1. 配置 API Key

编辑 `.env` 文件，填入您的阿里云百炼平台 API Key：

```bash
# 获取 API Key: https://bailian.console.aliyun.com/
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3-coder-plus
```

### 2. 在终端中使用

```bash
# 基本使用
qwen

# 生成 TypeScript 代码
qwen --language typescript

# 指定文件
qwen --file src/components/MyComponent.tsx
```

### 3. 在 Cursor IDE 中使用

1. 重启 Cursor IDE
2. 在 AI 对话中选择 Qwen3-Coder 模型
3. 开始编码对话

### 4. 在前端应用中使用

```tsx
// 在您的 React 组件中
import QwenCodeAssistant from './components/QwenCodeAssistant';

function App() {
  return (
    <div>
      <QwenCodeAssistant />
    </div>
  );
}
```

## 🛠️ 常用命令

### Qwen Code CLI

```bash
# 生成代码
qwen "创建一个 React 函数组件"

# 代码审查
qwen "审查这段代码" --file src/utils/helper.ts

# 代码重构
qwen "重构这个函数" --file src/components/ProductList.tsx

# 生成测试
qwen "为这个组件生成测试" --file src/components/Button.tsx
```

### Claude Code

```bash
# 使用 Claude Code Router
ccr code

# 直接使用 Claude Code
claude-code
```

## 📝 示例用法

### 生成 React 组件

```bash
qwen "创建一个产品卡片组件，包含图片、标题、价格和购买按钮"
```

### 代码审查

```bash
qwen "审查这个函数的安全性" --file src/utils/auth.ts
```

### 重构代码

```bash
qwen "将这个类组件重构为函数组件" --file src/components/UserProfile.tsx
```

### 生成测试

```bash
qwen "为这个 API 服务生成单元测试" --file src/services/api.ts
```

## 🔧 高级配置

### 自定义模型参数

```bash
# 设置温度（创造性）
export CURSOR_AI_TEMPERATURE="0.8"

# 设置最大令牌数
export CURSOR_AI_MAX_TOKENS="8000"
```

### 多语言支持

```bash
# TypeScript
qwen --language typescript

# Python
qwen --language python

# JavaScript
qwen --language javascript

# Java
qwen --language java
```

## 🎯 项目集成示例

### 在您的项目中添加 Qwen Code 助手

```tsx
// src/pages/DeveloperTools.tsx
import React from 'react';
import QwenCodeAssistant from '../components/QwenCodeAssistant';

const DeveloperTools: React.FC = () => {
  return (
    <div>
      <h1>开发者工具</h1>
      <QwenCodeAssistant />
    </div>
  );
};

export default DeveloperTools;
```

### 使用 Qwen Code 工具函数

```tsx
// src/utils/codeGenerator.ts
import { useQwenCode } from './qwen-code-integration';

export const useCodeGenerator = () => {
  const { generateCode, reviewCode } = useQwenCode();

  const generateComponent = async (description: string) => {
    return await generateCode({
      prompt: description,
      language: 'typescript',
      context: 'React TypeScript 项目'
    });
  };

  const reviewComponent = async (code: string) => {
    return await reviewCode(code, 'typescript');
  };

  return { generateComponent, reviewComponent };
};
```

## 🚨 故障排除

### 常见问题

**Q: `qwen` 命令不可用**
```bash
npm install -g @qwen-code/qwen-code
```

**Q: API 请求失败**
- 检查 API Key 是否正确
- 确认网络连接正常
- 验证 API 配额是否充足

**Q: Cursor 没有使用 Qwen 模型**
- 重启 Cursor IDE
- 检查 `.cursor-env.sh` 配置
- 确认环境变量已加载

### 检查安装状态

```bash
# 检查 Qwen Code
qwen --version

# 检查环境变量
echo $OPENAI_API_KEY

# 检查 Cursor 配置
cat .cursor-env.sh
```

## 📚 更多资源

- [完整安装指南](QWEN_CODE_INSTALLATION_GUIDE.md)
- [使用指南](QWEN_CODE_USAGE_GUIDE.md)
- [官方文档](https://github.com/QwenLM/qwen-code)
- [阿里云百炼平台](https://bailian.console.aliyun.com/)

## 🎉 开始编码！

现在您可以：

1. ✅ 在终端中使用 `qwen` 命令
2. ✅ 在 Cursor IDE 中使用 Qwen3-Coder 模型
3. ✅ 在前端应用中使用 Qwen Code 组件
4. ✅ 享受强大的 AI 辅助编程体验

祝您编码愉快！🚀 