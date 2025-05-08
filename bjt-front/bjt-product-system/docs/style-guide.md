# BJT产品管理系统UI样式指南

本文档提供BJT产品管理系统UI样式规范，用于解决当前页面与设计稿不一致的问题。在2小时重构中，可参照此指南快速统一界面风格。

## 主要样式问题

1. **布局不一致**：各页面边距、间距不统一
2. **配色不统一**：使用了多种不同的蓝色和灰色色调
3. **控件样式混乱**：按钮、表单元素样式不一致
4. **响应式设计缺失**：部分页面在不同屏幕尺寸下显示异常

## 统一色彩系统

### 主色调
- 主要蓝色：`#1e88e5`
- 深蓝色：`#1565c0`
- 浅蓝色：`#64b5f6`

### 辅助色
- 辅助绿色：`#26a69a`
- 深绿色：`#00897b`

### 状态颜色
- 成功：`#4caf50`
- 警告：`#ff9800`
- 错误：`#f44336`
- 信息：`#2196f3`

### 灰度
- 背景：`#f5f5f5`
- 边框：`#e0e0e0`
- 文本主色：`#212121`
- 文本次要色：`#757575`

## 基础组件规范

### 卡片容器
- 白色背景
- 圆角：4px
- 阴影：`0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- 内边距：24px

### 按钮
- 圆角：4px
- 内边距：8px 16px
- 主要按钮：蓝色背景，白色文字
- 次要按钮：白色背景，蓝色边框和文字
- 悬停状态：加深颜色

### 表单元素
- 统一高度：40px
- 边框颜色：`#e0e0e0`
- 聚焦状态：蓝色边框
- 标签位置：元素上方

### 表格
- 表头背景：浅灰色
- 边框：仅底部细线
- 悬停行：浅灰色背景
- 内边距：16px

## 字体与排版

### 字体系列
```css
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif
```

### 字体大小
- 大标题：24px
- 小标题：18px
- 正文：16px
- 小文本：14px
- 辅助文本：12px

### 间距
- 页面内边距：24px
- 元素间距：16px
- 相关元素内间距：8px

## 实施步骤

### 1. 创建CSS变量文件
添加 `assets/css/variables.css` 文件，定义所有颜色和间距变量。

### 2. 更新主CSS文件
修改 `assets/css/admin.css`，应用统一样式规则。

### 3. 更新布局模板
修改 `templates/admin/layout/custom-layout.php`，使用统一的页面结构。

### 4. 统一关键页面
更新以下页面的结构和样式：
- 仪表盘 (`dashboard.php`)
- 主机管理 (`host-management.php`)
- 配件管理 (`accessories.php`)
- 表单页面 (`*-edit.php`, `*-add.php`)

## 快速修复代码示例

### CSS变量定义
```css
:root {
  --bjt-primary: #1e88e5;
  --bjt-text: #212121;
  --bjt-border: #e0e0e0;
  --bjt-bg: #f5f5f5;
  --bjt-spacing: 16px;
}
```

### 卡片组件
```css
.bjt-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  padding: 24px;
  margin-bottom: 24px;
}
```

### 按钮样式
```css
.bjt-btn {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.bjt-btn-primary {
  background: var(--bjt-primary);
  color: white;
  border: none;
}
```

### 表单样式
```css
.bjt-form-control {
  display: block;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--bjt-border);
  border-radius: 4px;
}

.bjt-form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
```

## 优先级和检查清单

### 最高优先级
1. 统一颜色变量
2. 修复布局容器样式
3. 标准化按钮和表单

### 验收检查
- 所有页面使用相同的颜色方案
- 布局边距一致
- 按钮样式统一
- 表单元素外观统一

## 后续建议

完成基础样式统一后，建议：
1. 开发组件库文档
2. 创建样式预览页面
3. 实现自定义主题功能 