# BJT Tech 主题系统

## 快速开始

### 使用主题切换器

新的 BJT Tech 主题系统已经完全替换了之前的 "Dark Tech" 主题。现在您可以通过以下方式使用主题切换功能：

1. **在任何页面的底部** - 主题切换器会自动显示在所有页面的底部
2. **实时切换** - 支持浅色/深色模式的即时切换
3. **自动保存** - 您的主题偏好会自动保存在本地存储中
4. **响应式设计** - 在所有设备上都能完美工作

### 在组件中使用主题

```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, mode, toggleMode } = useTheme();
  
  return (
    <div className="bjt-card">
      <p>当前主题: {theme}</p>
      <p>当前模式: {mode}</p>
      <button onClick={toggleMode}>切换模式</button>
    </div>
  );
};
```

### 新主题特色

- ✅ **专业** - 基于 BJT logo 的品牌色彩设计
- ✅ **现代** - 使用最新的设计趋势和交互模式  
- ✅ **有趣** - 平衡专业性和用户友好性
- ✅ **无障碍** - 符合 WCAG AA 标准
- ✅ **响应式** - 移动端优先设计
- ✅ **国际化** - 支持中英文切换

---

## 概述

BJT Tech 主题系统是为 BJT 产品系统前端设计的专业、现代、有趣的设计系统。该主题基于 BJT tech logo 的品牌色彩，提供了完整的 UI 组件样式、颜色规范和设计原则。

## 主题特色

- **专业与有趣的平衡**: 既体现技术公司的专业性，又保持友好可接近的用户体验
- **品牌一致性**: 基于 BJT tech logo 提取的主色调
- **响应式设计**: 移动端优先的设计理念
- **无障碍支持**: 符合 WCAG AA 标准的对比度和交互设计
- **现代化**: 使用 CSS 自定义属性实现动态主题切换

## 颜色系统

### 主色调（Primary Colors）

```css
--bjt-primary-blue: #1a57a5;        /* 主品牌蓝色 */
--bjt-primary-blue-light: #2c6cbc;   /* 浅蓝色 */
--bjt-primary-blue-dark: #144289;    /* 深蓝色 */
```

### 次要色调（Secondary Colors）

```css
--bjt-secondary-orange: #ff6b35;     /* 强调橙色 */
--bjt-secondary-orange-light: #ff8559; /* 浅橙色 */
--bjt-secondary-orange-dark: #e55a2b;  /* 深橙色 */
```

### 交互色彩（Interactive Colors）

```css
--bjt-interactive-blue: #3b82f6;     /* 交互蓝色 */
--bjt-interactive-blue-hover: #2563eb; /* 悬停状态 */
--bjt-interactive-blue-active: #1d4ed8; /* 激活状态 */
```

### 背景色彩（Background Colors）

```css
--bjt-bg-primary: #ffffff;           /* 主背景 */
--bjt-bg-secondary: #f8f9fa;         /* 次要背景 */
--bjt-bg-tertiary: #f1f3f4;          /* 第三级背景 */
--bjt-bg-accent: #e6f0ff;            /* 强调背景 */
--bjt-bg-card: #ffffff;              /* 卡片背景 */
```

### 文本色彩（Text Colors）

```css
--bjt-text-primary: #1f2937;         /* 主要文本 */
--bjt-text-secondary: #374151;       /* 次要文本 */
--bjt-text-tertiary: #6b7280;        /* 第三级文本 */
--bjt-text-light: #9ca3af;           /* 浅色文本 */
--bjt-text-brand: var(--bjt-primary-blue); /* 品牌色文本 */
```

### 状态色彩（State Colors）

```css
--bjt-success: #10b981;              /* 成功状态 */
--bjt-warning: #f59e0b;              /* 警告状态 */
--bjt-error: #ef4444;                /* 错误状态 */
--bjt-info: var(--bjt-interactive-blue); /* 信息状态 */
```

## 间距系统（8px Grid）

```css
--bjt-space-xs: 0.25rem;   /* 4px */
--bjt-space-sm: 0.5rem;    /* 8px */
--bjt-space-md: 1rem;      /* 16px */
--bjt-space-lg: 1.5rem;    /* 24px */
--bjt-space-xl: 2rem;      /* 32px */
--bjt-space-2xl: 3rem;     /* 48px */
--bjt-space-3xl: 4rem;     /* 64px */
```

## 字体系统

### 字体族

```css
--bjt-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### 字体大小

```css
--bjt-font-size-xs: 0.75rem;   /* 12px */
--bjt-font-size-sm: 0.875rem;  /* 14px */
--bjt-font-size-base: 1rem;    /* 16px */
--bjt-font-size-lg: 1.125rem;  /* 18px */
--bjt-font-size-xl: 1.25rem;   /* 20px */
--bjt-font-size-2xl: 1.5rem;   /* 24px */
--bjt-font-size-3xl: 1.875rem; /* 30px */
--bjt-font-size-4xl: 2.25rem;  /* 36px */
```

## 组件样式

### 按钮组件

```html
<!-- 主要按钮 -->
<button class="bjt-btn bjt-btn-primary">主要操作</button>

<!-- 次要按钮 -->
<button class="bjt-btn bjt-btn-secondary">次要操作</button>

<!-- 线框按钮 -->
<button class="bjt-btn bjt-btn-outline">线框按钮</button>

<!-- 幽灵按钮 -->
<button class="bjt-btn bjt-btn-ghost">幽灵按钮</button>
```

### 输入组件

```html
<input type="text" class="bjt-input" placeholder="请输入内容">
```

### 卡片组件

```html
<div class="bjt-card">
  <div class="bjt-card-header">
    <h3>卡片标题</h3>
  </div>
  <div class="bjt-card-body">
    <p>卡片内容</p>
  </div>
  <div class="bjt-card-footer">
    <button class="bjt-btn bjt-btn-primary">操作</button>
  </div>
</div>
```

### 导航组件

```html
<nav class="bjt-nav">
  <a href="#" class="bjt-nav-item active">首页</a>
  <a href="#" class="bjt-nav-item">产品</a>
  <a href="#" class="bjt-nav-item">关于</a>
</nav>
```

## 工具类

### 背景色

```css
.bg-primary { background-color: var(--bjt-bg-primary); }
.bg-secondary { background-color: var(--bjt-bg-secondary); }
.bg-card { background-color: var(--bjt-bg-card); }
.bg-accent { background-color: var(--bjt-bg-accent); }
```

### 文本色

```css
.text-primary { color: var(--bjt-text-primary); }
.text-secondary { color: var(--bjt-text-secondary); }
.text-brand { color: var(--bjt-text-brand); }
.text-accent { color: var(--bjt-secondary-orange); }
```

### 间距

```css
.p-1 { padding: var(--bjt-space-xs); }
.p-2 { padding: var(--bjt-space-sm); }
.p-3 { padding: var(--bjt-space-md); }
.p-4 { padding: var(--bjt-space-lg); }

.m-1 { margin: var(--bjt-space-xs); }
.m-2 { margin: var(--bjt-space-sm); }
.m-3 { margin: var(--bjt-space-md); }
.m-4 { margin: var(--bjt-space-lg); }
```

### 圆角

```css
.rounded { border-radius: var(--bjt-radius-md); }
.rounded-sm { border-radius: var(--bjt-radius-sm); }
.rounded-lg { border-radius: var(--bjt-radius-lg); }
.rounded-xl { border-radius: var(--bjt-radius-xl); }
```

### 阴影

```css
.shadow-sm { box-shadow: var(--bjt-shadow-sm); }
.shadow { box-shadow: var(--bjt-shadow-md); }
.shadow-lg { box-shadow: var(--bjt-shadow-lg); }
.shadow-card { box-shadow: var(--bjt-shadow-card); }
```

## 使用主题

### React 组件中使用

```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, mode, toggleMode } = useTheme();
  
  return (
    <div className="bjt-card">
      <h2 className="bjt-heading-2">当前主题: {theme}</h2>
      <p className="text-secondary">模式: {mode}</p>
      <button className="bjt-btn bjt-btn-primary" onClick={toggleMode}>
        切换模式
      </button>
    </div>
  );
};
```

### 动态样式

```tsx
const MyStyledComponent = () => {
  const { mode } = useTheme();
  
  const styles = {
    backgroundColor: mode === 'dark' ? 'var(--bjt-bg-tertiary)' : 'var(--bjt-bg-primary)',
    color: 'var(--bjt-text-primary)',
    padding: 'var(--bjt-space-md)',
    borderRadius: 'var(--bjt-radius-md)',
  };
  
  return <div style={styles}>动态主题组件</div>;
};
```

## 响应式设计

```css
/* 移动端 */
@media (max-width: 768px) {
  .bjt-card-header,
  .bjt-card-body,
  .bjt-card-footer {
    padding: var(--bjt-space-md);
  }
}

/* 小屏移动端 */
@media (max-width: 480px) {
  html {
    font-size: 14px;
  }
}
```

## 无障碍支持

- 所有交互元素都有适当的焦点指示器
- 颜色对比度符合 WCAG AA 标准
- 支持屏幕阅读器的 ARIA 标签
- 支持键盘导航

## 动画和过渡

```css
--bjt-transition-fast: 150ms ease-in-out;
--bjt-transition-normal: 300ms ease-in-out;
--bjt-transition-slow: 500ms ease-in-out;
```

### 使用示例

```css
.my-element {
  transition: all var(--bjt-transition-normal);
}

.my-element:hover {
  transform: translateY(-2px);
  box-shadow: var(--bjt-shadow-lg);
}
```

## 暗色模式支持

```css
@media (prefers-color-scheme: dark) {
  .bjt-dark-mode {
    --bjt-bg-primary: #1f2937;
    --bjt-bg-secondary: #111827;
    --bjt-text-primary: #f9fafb;
    --bjt-text-secondary: #d1d5db;
  }
}
```

## 最佳实践

1. **保持一致性**: 始终使用主题提供的颜色和间距变量
2. **响应式优先**: 确保所有组件在移动端都能正常工作
3. **无障碍考虑**: 使用语义化 HTML 和适当的 ARIA 属性
4. **性能优化**: 使用 CSS 自定义属性而不是 JavaScript 来应用主题
5. **模块化**: 将组件样式分离到独立的 CSS 文件中

## 扩展主题

如需添加新的颜色或组件样式，请遵循现有的命名约定：

```css
/* 新颜色 */
--bjt-new-color: #value;
--bjt-new-color-light: #value;
--bjt-new-color-dark: #value;

/* 新组件 */
.bjt-new-component {
  /* 使用现有的设计令牌 */
  padding: var(--bjt-space-md);
  background-color: var(--bjt-bg-card);
  border-radius: var(--bjt-radius-md);
  box-shadow: var(--bjt-shadow-card);
}
```

## 支持和维护

- 主题文件位置: `frontend/src/styles/themes/bjt-tech.css`
- 主题上下文: `frontend/src/contexts/ThemeContext.tsx`
- 全局样式: `frontend/src/styles/global.css`

如有问题或需要新功能，请提交 issue 或联系开发团队。 