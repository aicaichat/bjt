# Machines 页面 Figma 样式比对审计

> 文件: ProductLine1Page.tsx (气垫机选型页)
> Figma Node: 2679:22612
> 日期: 2026-04-12

## 1. 整体布局对比

| 元素 | Figma 规格 | 当前实现 | 状态 |
|------|-----------|---------|------|
| 页面宽度 | 1920px (viewport) | 继承 .figma-front | ✅ |
| 主内容区 | 1617px (1920-303 sidebar) | 1617px | ✅ |
| 页面背景 | #F5F7FA | var(--ff-content-canvas-bg) | ✅ |
| 卡片宽度 | 1537px (气垫行) / 1491px (纸垫卡) | 已对齐 | ✅ |
| 卡片高度 | 280px | 已改为 min-height | ✅ 已修复 |

## 2. 主机卡片样式对比

### 2.1 纸垫机卡片 (ms-figma-machine-card--paper)

| 元素 | Figma 值 | 当前实现 | 状态 |
|------|---------|---------|------|
| 背景 | #FFFFFF | #ffffff | ✅ |
| 圆角 | 12px | 12px | ✅ |
| 边框 | 1px #E5E7EB | 1px solid var(--ff-border) | ✅ |
| 阴影 | 0 2px 12px rgba(15,36,64,0.06) | 已对齐 | ✅ |
| 最小高度 | 280px | min-height: 280px | ✅ |
| 固定高度 | 否 | 已移除 fixed height | ✅ 已修复 |

### 2.2 气垫机列表行 (ms-figma-machine-card--air)

| 元素 | Figma 值 | 当前实现 | 状态 |
|------|---------|---------|------|
| 背景 | #FFFFFF | #ffffff | ✅ |
| 圆角 | 0 (列表行) | 0 | ✅ |
| 底边框 | 0.5px hairline | box-shadow: var(--ff-ms-air-row-shadow) | ✅ |
| 最小高度 | 280px | min-height: 280px | ✅ |
| 内部滚动 | 否 | 已移除 overflow: auto | ✅ 已修复 |

## 3. 配件卡片样式对比 (需要重点改进)

### 3.1 当前问题

当前配件卡片使用 Tailwind 类名，与主机卡片 Figma 样式不一致：

```tsx
// 当前实现 (ProductLine1Page.tsx ~2677行)
<div className="bg-white rounded-xl shadow-lg hover:shadow-xl ...">  // ❌ Tailwind
```

### 3.2 已添加的 Figma 样式 (machine-selection-figma.css)

已创建 `.ms-figma-accessory-card*` 系列类名：
- `.ms-figma-accessory-card` - 卡片容器
- `.ms-figma-accessory-card__row` - 三列布局行
- `.ms-figma-accessory-card__col-gallery` - 图片列 (20%)
- `.ms-figma-accessory-card__col-main` - 信息列 (60%)
- `.ms-figma-accessory-card__col-actions` - 操作列 (20%)
- `.ms-figma-accessory-card__specs` - 规格区域
- `.ms-figma-accessory-card__freq-highlight` - 频率高亮

### 3.3 已更新的 TSX 代码

已更新以下类名替换：
- ✅ 卡片容器: `bg-white rounded-xl...` → `ms-figma-accessory-card`
- ✅ 行布局: `flex flex-col md:flex-row p-6` → `ms-figma-accessory-card__row`
- ✅ 图片列: `w-full md:w-1/5...` → `ms-figma-accessory-card__col-gallery`
- ✅ 图片: `w-32 h-32 object-contain...` → `ms-figma-accessory-card__image`
- ✅ 选择按钮: `inline-flex items-center...` → `ms-figma-accessory-card__select`
- ✅ 信息列: `w-full md:w-3/5...` → `ms-figma-accessory-card__col-main`
- ✅ PN标签: `inline-block bg-blue-500...` → `ms-figma-accessory-card__pn`
- ✅ 标题: `text-xl font-bold...` → `ms-figma-accessory-card__title`
- ✅ 规格区: `bg-gray-50 rounded-lg...` → `ms-figma-accessory-card__specs`
- ✅ 规格网格: `grid grid-cols-2...` → `ms-figma-accessory-card__spec-grid`
- ✅ 规格项: `flex items-center` → `ms-figma-accessory-card__spec-item`
- ✅ 频率高亮: `frequency-highlight...` → `ms-figma-accessory-card__freq-highlight`

## 4. 颜色系统对比

| 用途 | Figma Token | 当前实现 | 状态 |
|------|------------|---------|------|
| 主色 (海军蓝) | #00338D | var(--ff-accent) | ✅ |
| 主色hover | #002A70 | var(--ff-btn-primary-hover) | ✅ |
| 浅色背景 | #F5F7FA | var(--ff-content-canvas-bg) | ✅ |
| 卡片背景 | #FFFFFF | var(--ff-surface) | ✅ |
| 边框 | #E5E7EB | var(--ff-border) | ✅ |
| 主文字 | rgba(0,0,0,0.85) | var(--ff-text) | ✅ |
| 次要文字 | rgba(0,0,0,0.65) | var(--ff-text-muted) | ✅ |
| 蓝色tint | #E8EEF9 | var(--ff-tint-blue) | ✅ |

## 5. 字体系统对比

| 元素 | Figma 值 | 当前实现 | 状态 |
|------|---------|---------|------|
| 字体族 | Roboto | 'Roboto', sans-serif | ✅ |
| 卡片标题 | 18px/700 | 18px/700 | ✅ |
| PN标签 | 13px/600 | 13px/600 | ✅ |
| 规格标签 | 14px/500 | 14px/500 | ✅ |
| 规格值 | 14px/600 | 14px/600 | ✅ |
| 价格 | 20px/700 | 20px/700 | ✅ |

## 6. 间距系统对比

| 元素 | Figma 值 | 当前实现 | 状态 |
|------|---------|---------|------|
| 卡片内边距 | 24px | 24px | ✅ |
| 列间距 | 24px | 24px | ✅ |
| 规格项间距 | 12px | 12px | ✅ |
| 卡片外边距 | 16px bottom | 16px bottom | ✅ |
| 页面gutter | 40px | 40px | ✅ |

## 7. 已修复项

### 7.1 ✅ 配件操作列 (Actions Column)

已更新类名：
- ✅ `.ms-figma-accessory-card__col-actions` - 操作列容器
- ✅ `.ms-figma-accessory-card__price` - 价格数值
- ✅ `.ms-figma-accessory-card__price-label` - 价格标签
- ✅ `.ms-figma-stock-heading` - 库存标题

### 7.2 ✅ 主机卡片价格区

已更新类名：
- ✅ `.ms-figma-price-label` - 价格标签
- ✅ `.ms-figma-stock-total` - 库存总计

### 7.3 ✅ 库存状态标签

已使用 Figma 样式：
- ✅ `.ms-figma-stock-tags`
- ✅ `.ms-figma-stock-pill`

## 8. 验证清单

- [x] 主机卡片高度问题已修复
- [x] 配件卡片 Figma 类名已添加
- [x] 主要 Tailwind 类名已替换
- [ ] 配件操作列样式需验证
- [ ] 配件按钮样式需统一
- [ ] 响应式断点测试

## 9. 建议

1. **构建测试**: 运行 `npm run build:skip-check` 验证无 CSS 错误
2. **视觉回归**: 在 1920px 视口下与 Figma 叠图对比
3. **响应式测试**: 检查 768px, 1024px, 1280px 断点
4. **交互验证**: 确保 hover 状态与 Figma 一致

## 10. 相关文件

| 文件 | 作用 |
|------|------|
| `src/pages/Machines/ProductLine1Page.tsx` | 气垫机选型页 |
| `src/pages/Machines/ProductLine2Page.tsx` | 纸垫机选型页 |
| `src/styles/machine-selection-figma.css` | Figma 对齐样式 |
| `src/styles/figma-design-tokens.css` | 全局设计令牌 |
| `src/styles/figma-tokens-machine-selection.css` | 机器选型专用令牌 |
