# Figma 像素级对齐实施计划

## 现状分析

### 已创建的文件
1. ✅ `figma-exact/machines-exact.css` - Figma 精确匹配 CSS
2. ✅ `figma-pixel-perfect-best-practices.md` - 最佳实践文档

### 需要更新的文件
1. `frontend/src/pages/Machines/ProductLine1Page.tsx` - 更新类名和结构
2. `frontend/src/pages/Machines/index.tsx` - 更新样式导入
3. `frontend/src/main.tsx` - 确保正确的 CSS 加载顺序

---

## 实施步骤

### Phase 1: CSS 导入优化

**目标**: 确保 Figma 精确 CSS 最后加载，优先级最高

**操作**:
```tsx
// ProductLine1Page.tsx
// 移除旧的冲突样式
- import './Machines.css';
- import './accessibility.css';
- import './breadcrumb.css';
- import '../../styles/machine-selection-figma.css';

// 添加新的精确样式
+ import '../../styles/figma-exact/machines-exact.css';
```

### Phase 2: 机器卡片组件重构

**目标**: 机器卡片 JSX 结构精确匹配 Figma Frame 471

**Figma 结构**:
```
Frame 471 (Machine Card) - 1537×280
├── Frame 205 (Gallery) - 288×212
│   ├── 缩略图列表 (68×68 × 3)
│   └── 主图 (212×212)
├── Frame 487 (Main) - 864×240
│   ├── Frame 983 (Header) - 标题 + PN
│   ├── Frame 831 (Details) - 规格
│   └── Actions - More Info 按钮
└── Frame 1017 (Actions) - 321×254
    ├── 库存状态卡片
    ├── 数量选择器
    └── 加入购物车按钮
```

**React 结构更新**:
```tsx
// 旧结构（使用百分比和响应式）
<div className="ms-figma-machine-card">
  <div className="ms-figma-machine-card__row">
    <div className="ms-figma-machine-card__col-gallery">...</div>
    <div className="ms-figma-machine-card__col-main">...</div>
    <div className="ms-figma-machine-card__col-actions">...</div>
  </div>
</div>

// 新结构（使用 Figma 精确值）
<div className="figma-exact-machine-card">
  <div className="figma-exact-card-gallery">
    <div className="figma-exact-thumbnail-list">...</div>
    <div className="figma-exact-main-image">...</div>
  </div>
  <div className="figma-exact-card-main">
    <div className="figma-exact-card-header">...</div>
    <div className="figma-exact-machine-details">...</div>
  </div>
  <div className="figma-exact-card-actions">
    <div className="figma-exact-stock-card">...</div>
    <div className="figma-exact-qty-selector">...</div>
    <button className="figma-exact-add-to-cart-btn">...</button>
  </div>
</div>
```

### Phase 3: 配件卡片组件重构

**目标**: 配件卡片与机器卡片保持一致的布局结构

**关键修改**:
- 三列布局: 288px | 864px | 321px
- 固定尺寸，非百分比
- 移除响应式断点（先实现精确版）

### Phase 4: 工具栏和筛选区更新

**更新组件**:
- 搜索框: `figma-exact-search-box` (271×32)
- 购物车按钮: `figma-exact-cart-btn` (74×32)
- 语言选择: `figma-exact-lang-btn` (95×32)
- 筛选区: `figma-exact-filter-area` (1537×115)

### Phase 5: 清理和验证

**验证清单**:
- [ ] 所有元素尺寸与 Figma 完全一致
- [ ] 间距使用 gap: 24px（Figma 值）
- [ ] 颜色使用 Figma 原始值
- [ ] 字体使用 Roboto
- [ ] 在 1920px 视口下验证

---

## 关键类名映射表

| Figma 元素 | 旧类名 | 新类名 | 尺寸 |
|-----------|--------|--------|------|
| 机器卡片 | `.ms-figma-machine-card` | `.figma-exact-machine-card` | 1537×280 |
| 图片区 | `.ms-figma-machine-card__col-gallery` | `.figma-exact-card-gallery` | 288×212 |
| 主内容区 | `.ms-figma-machine-card__col-main` | `.figma-exact-card-main` | 864×240 |
| 操作区 | `.ms-figma-machine-card__col-actions` | `.figma-exact-card-actions` | 321×254 |
| 缩略图 | - | `.figma-exact-thumbnail` | 68×68 |
| 主图 | - | `.figma-exact-main-image` | 212×212 |
| 机器名称 | `.ms-figma-product-title` | `.figma-exact-machine-name` | - |
| PN 标签 | `.ms-figma-pn-pill` | `.figma-exact-pn-badge` | 127×31 |
| 库存状态 | `.ms-figma-stock-panel` | `.figma-exact-stock-card` | 321×186 |
| 数量选择器 | `.ms-figma-qty-stepper` | `.figma-exact-qty-selector` | 108×32 |
| 加入购物车 | `.ms-figma-primary-cart` | `.figma-exact-add-to-cart-btn` | 138×44 |

---

## 风险与缓解

### 风险 1: 响应式丢失
**缓解**: 先实现桌面精确版，响应式作为第二阶段单独处理

### 风险 2: 旧样式残留
**缓解**: 完全移除旧 CSS 导入，使用单一精确 CSS 文件

### 风险 3: 其他页面受影响
**缓解**: 新样式使用独立命名空间 `.figma-exact-*`，不影响其他页面

---

## 验收标准

1. **尺寸精度**: 所有元素 width/height 与 Figma 差异 < 1px
2. **间距精度**: 所有 padding/gap 与 Figma 完全一致
3. **颜色精度**: 使用 Figma 原始色值，不经过变量映射
4. **字体精度**: Roboto 字体，精确 font-size/weight/line-height
5. **结构精度**: DOM 结构与 Figma 图层结构一致

---

## 下一步行动

1. ✅ 创建精确 CSS 文件
2. 🔄 更新 ProductLine1Page.tsx 类名
3. 🔄 更新配件卡片组件
4. 🔄 验证并调整
