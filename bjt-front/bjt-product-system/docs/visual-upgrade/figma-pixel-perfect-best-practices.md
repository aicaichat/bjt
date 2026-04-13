# Figma 像素级对齐最佳实践

## 核心原则

### 1. 精确值优先原则
- **使用 Figma 原始数值**，不经过 CSS 变量映射
- **像素级复制**：width: 288px (不是 20%)
- **颜色直接写死**：#FFFFFF (不是 var(--ff-surface))

### 2. 结构匹配原则
- JSX DOM 结构必须与 Figma 图层结构一致
- 层级关系：Frame → Group → Element
- 不允许额外包裹 div

### 3. 单一来源原则
- 每个组件只加载一个 CSS 文件
- 避免样式覆盖链（旧样式 → 新样式 → Tailwind）
- 使用 CSS Modules 或 CSS-in-JS 隔离

### 4. 视口基准原则
- Figma 设计以 1920px 为基准
- 验收必须在 1920px 视口下进行
- 响应式作为独立阶段处理

---

## 文件结构规范

```
frontend/src/styles/
├── figma-exact/                    # Figma 精确匹配样式
│   ├── machines-exact.css          # Machines 页面精确样式
│   ├── sidebar-exact.css           # Sidebar 精确样式
│   └── home-exact.css              # Home 页面精确样式
├── figma-reference/                # Figma 原始导出（只读）
│   ├── figma-machine-page-raw.css  # Figma Dev Mode 原始导出
│   └── figma-sidebar-raw.css
└── legacy/                         # 旧样式（待迁移）
    ├── Machines.css
    └── accessibility.css
```

---

## CSS 编写规范

### 命名规范
```css
/* Figma 精确匹配类名 */
.figma-exact-{component}-{element}

/* 示例 */
.figma-exact-machine-card          /* Frame 471 */
.figma-exact-card-gallery          /* Frame 205 - 图片区 */
.figma-exact-card-main             /* Frame 487 - 主内容 */
.figma-exact-card-actions          /* Frame 1017 - 操作区 */
```

### 数值规范
```css
/* ✅ 正确：使用 Figma 精确值 */
.figma-exact-card {
  width: 1537px;           /* Figma: Frame 471 width */
  height: 280px;           /* Figma: Frame 471 height */
  background: #FFFFFF;     /* Figma: fill */
  box-shadow: 0px 0.5px 0px rgba(0, 0, 0, 0.25);  /* Figma: effects */
}

/* ❌ 错误：使用变量或百分比 */
.figma-exact-card {
  width: 100%;             /* 不精确 */
  background: var(--ff-surface);  /* 映射可能出错 */
}
```

### 字体规范
```css
/* ✅ 正确：完全匹配 Figma */
.figma-exact-text {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;         /* Figma: fontSize */
  font-weight: 400;        /* Figma: fontWeight */
  line-height: 19px;       /* Figma: lineHeight */
  color: rgba(0, 0, 0, 0.85);  /* Figma: fills[0].color */
}
```

---

## JSX 结构规范

### 结构映射
```tsx
// Figma: Frame 471 (Machine Card)
//  ├── Frame 205 (Gallery) - 288px
//  ├── Frame 487 (Main) - 864px
//  └── Frame 1017 (Actions) - 321px

<div className="figma-exact-machine-card">
  <div className="figma-exact-card-gallery">
    {/* Frame 205 内容 */}
  </div>
  <div className="figma-exact-card-main">
    {/* Frame 487 内容 */}
  </div>
  <div className="figma-exact-card-actions">
    {/* Frame 1017 内容 */}
  </div>
</div>
```

### 避免的做法
```tsx
{/* ❌ 不要添加额外包裹层 */}
<div className="wrapper">  {/* 多余 */}
  <div className="figma-exact-machine-card">
    ...
  </div>
</div>

{/* ❌ 不要混用 Tailwind 和 Figma 精确类 */}
<div className="figma-exact-machine-card p-4 mb-4">  {/* 冲突 */}
```

---

## 实施流程

### 阶段 1：提取 Figma 规格
1. 打开 Figma Dev Mode
2. 选中每个 Frame/Component
3. 记录：
   - width, height, x, y (绝对位置)
   - padding, margin, gap
   - fontSize, fontWeight, lineHeight
   - color, background, border, shadow

### 阶段 2：创建精确 CSS
1. 新建 `{page}-exact.css`
2. 按照 Figma 层级书写 CSS
3. 每个类对应一个 Figma 节点
4. 使用 `!important` 确保不被覆盖

### 阶段 3：重构 JSX
1. 移除旧样式导入
2. 移除 Tailwind 工具类（除了布局类如 flex, grid）
3. 应用新的 figma-exact 类名
4. 确保 DOM 结构与 Figma 一致

### 阶段 4：像素级验收
1. 打开浏览器 DevTools
2. 设置视口 1920px
3. 对比 Figma 和实现：
   - 使用截图叠加工具
   - 检查每个元素的尺寸
   - 检查间距和边距

---

## 验收检查清单

### 尺寸检查
- [ ] 卡片宽度：1537px
- [ ] 卡片高度：280px
- [ ] 图片区宽度：288px
- [ ] 主内容区宽度：864px
- [ ] 操作区宽度：321px

### 间距检查
- [ ] 卡片内边距：16px 40px
- [ ] 列间距：24px
- [ ] 元素间距：与 Figma gap 一致

### 视觉检查
- [ ] 背景色：#FFFFFF
- [ ] 页面背景：#F1F5F9
- [ ] 边框：1px solid #DEDEDE
- [ ] 阴影：0px 0.5px 0px rgba(0, 0, 0, 0.25)

### 字体检查
- [ ] 字体：Roboto
- [ ] 主文字：16px/400/19px, rgba(0,0,0,0.85)
- [ ] 次文字：16px/400/19px, rgba(0,0,0,0.65)
- [ ] 标题：18px/700/21px

---

## 常见陷阱

### 陷阱 1：CSS 变量映射
```css
/* ❌ 不要 */
--card-bg: var(--ff-surface, #ffffff);

/* ✅ 要 */
background: #FFFFFF;  /* Figma 原始值 */
```

### 陷阱 2：响应式过早
```css
/* ❌ 不要 */
@media (max-width: 768px) {
  .figma-exact-card { width: 100%; }
}

/* ✅ 先实现精确版，响应式作为第二阶段 */
```

### 陷阱 3：Tailwind 混用
```tsx
{/* ❌ 不要 */}
<div className="figma-exact-card p-4">

{/* ✅ 要 */}
<div className="figma-exact-card">  {/* 所有样式在 CSS 中 */}
```

### 陷阱 4：浏览器默认样式
```css
/* ✅ 总是要重置 */
.figma-exact-card {
  box-sizing: border-box;
  margin: 0;
  padding: 0;  /* 明确设置，不依赖浏览器默认 */
}
```

---

## 工具推荐

1. **Figma Dev Mode**：获取精确规格
2. **Browser DevTools**：验证尺寸
3. **PerfectPixel Chrome 插件**：截图叠加对比
4. **CSS Peeper**：快速查看计算样式

---

## 示例：完整实施

见 `frontend/src/styles/figma-exact/machines-exact.css` 和
`frontend/src/pages/Machines/ProductLine1Page.tsx` 的更新。
