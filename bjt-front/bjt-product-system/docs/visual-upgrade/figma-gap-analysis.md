# Figma 设计稿与实现差异分析

> 基于用户反馈："差异很大"
> 日期：2026-04-12

## 可能的主要差异点

### 1. Home 页面按钮

| 属性 | 当前实现 | 常见 Figma 规格 | 差异 |
|------|---------|----------------|------|
| 高度 | 56px | 可能为 48px 或 52px | ❓ 待确认 |
| Padding | 16px 24px | 可能为 12px 20px | ❓ 待确认 |
| 字体大小 | 16px | 可能为 14px | ❓ 待确认 |
| 边框宽度 | 1px | 可能为 1.5px 或 2px | ❓ 待确认 |
| 圆角 | 8px | 可能为 6px 或 10px | ❓ 待确认 |

### 2. 整体布局差异

#### 2.1 页面间距
```css
/* 当前 */
.home-page.home-page--figma {
  padding-left: var(--ff-ms-page-gutter, 40px);
  padding-right: var(--ff-ms-page-gutter, 40px);
}

/* Figma 可能的值 */
- 可能为 32px 或 48px
```

#### 2.2 卡片内边距
```css
/* 当前 */
.home-page.home-page--figma .section-content {
  padding: 24px 24px;
}

/* 可能差异 */
- 可能为 20px 或 32px
```

### 3. 颜色差异

#### 3.1 当前使用的颜色变量
```css
--ff-accent: #00338d;           /* 主色海军蓝 */
--ff-content-canvas-bg: #f5f7fa; /* 背景色 */
--ff-surface: #ffffff;          /* 卡片白色 */
--ff-border: #e5e7eb;           /* 边框 */
--ff-text: rgba(0,0,0,0.85);    /* 主文字 */
--ff-text-muted: rgba(0,0,0,0.65); /* 次要文字 */
```

#### 3.2 可能的颜色差异
- 按钮 hover 状态颜色
- 卡片边框颜色
- 描述文字颜色

### 4. 字体差异

#### 4.1 当前字体栈
```css
font-family: var(--ff-font, 'Roboto', sans-serif);
```

#### 4.2 可能的差异
- 可能是 Inter、PingFang SC 或其他字体
- 字体粗细可能不同
- 行高可能不同

### 5. 阴影差异

#### 5.1 当前阴影
```css
box-shadow: 0 1px 3px rgba(15, 36, 64, 0.06);  /* 默认 */
box-shadow: 0 4px 14px rgba(15, 36, 64, 0.08); /* hover */
```

#### 5.2 可能的 Figma 阴影
- 可能是 0 2px 8px rgba(0, 0, 0, 0.08)
- 可能是 0 4px 12px rgba(0, 0, 0, 0.1)

## 快速验证方法

### 1. 使用浏览器 DevTools
```javascript
// 在控制台运行，检查元素实际样式
const btn = document.querySelector('.product-link');
const styles = window.getComputedStyle(btn);
console.log({
  height: styles.height,
  padding: styles.padding,
  fontSize: styles.fontSize,
  borderRadius: styles.borderRadius,
  borderWidth: styles.borderWidth
});
```

### 2. 屏幕截图对比
1. 在浏览器打开页面 (1920px 视口)
2. 在 Figma 中按 Ctrl+\ 进入 Dev Mode
3. 截图对比或使用浏览器插件

### 3. 关键检查点
- [ ] 按钮高度、padding、字体大小
- [ ] 卡片圆角、阴影
- [ ] 页面左右边距
- [ ] 标题栏高度和字体
- [ ] 整体颜色色调

## 需要用户确认的信息

为了精确修复，请提供以下任一信息：

1. **Figma Dev Mode 截图** - 显示具体元素的尺寸
2. **具体差异描述** - 例如"按钮太高了"、"颜色不对"
3. **设计令牌导出** - 如果有 design tokens JSON
4. **标注图** - 显示具体像素值

## 建议修复流程

1. 确认具体差异点
2. 更新 CSS 变量值
3. 检查响应式断点
4. 验证所有页面一致性
