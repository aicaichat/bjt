# Machines 页面 Figma 对齐检查清单

> 生成日期: 2026-04-12
> Figma 节点: 2679:22612 (Machines P1 - 气垫机选型页面)

---

## 一、整体布局结构

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 备注 |
|------|--------------|-----------|------|------|
| 设计视口 | 1920px | 1920px | ✅ | CSS: `--ff-ms-design-viewport-width` |
| 侧边栏宽度 | 303px | 303px | ✅ | CSS: `--bjt-sidebar-width` |
| 主内容宽度 | 1617px | 1617px | ✅ | 1920 - 303 |
| 页面背景色 | `#f1f5f9` | `#f1f5f9` | ✅ | CSS: `--ff-content-canvas-bg` |
| Header 高度 | 60px | 60px | ✅ | CSS: `--ff-site-header-height` |
| 页面 gutter | 40px | 40px | ✅ | CSS: `--ms-page-gutter` |

---

## 二、侧边栏 (Sidebar) - 待修复

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 侧边栏背景 | 深色 (#012583 或深蓝) | 白色 | ❌ | 检查 `sidebar-figma.css` 的 `--sd-bg` |
| 选中项背景 | `#012583` | `#012583` | ✅ | |
| 选中项文字 | 白色 | 白色 | ✅ | |
| 未选中项文字 | `rgba(0,0,0,0.85)` | 灰色 | ✅ | |
| 分割线 | `rgba(0,0,0,0.16)` | 已设置 | ✅ | CSS: `--ff-sidebar-divider` |

**相关文件:**
- `frontend/src/styles/sidebar-figma.css`
- `frontend/src/components/layout/Sidebar.tsx`

---

## 三、面包屑导航 (Breadcrumb Bar) - 待修复

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 背景色 | `#012583` | `#012583` | ✅ | CSS: `--ms-breadcrumb-fr544-bg` |
| 高度 | 60px | 60px | ✅ | |
| 字体颜色 | 白色 | 白色 | ✅ | |
| 内边距-left | 48px | 48px | ✅ | |
| 左侧返回箭头 | 有 (chevron_backward) | 有 | ✅ | |

**相关文件:**
- `frontend/src/styles/machine-selection-figma.css` (line 537-562)

---

## 四、筛选卡片 (Filter Card)

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 标题文字 | "Machine Selection" | ? | 待确认 | 检查 TSX 中的标题 |
| 背景色 | 白色 | 白色 | ✅ | |
| 圆角 | **4px** | 12px | ❌ | 需修改: `border-radius: 4px` |
| 边框色 | `#dedede` | `#dedede` | ✅ | |
| 边框宽度 | 1px | 1px | ✅ | |
| 下拉框宽度 | 208px | 208px | ✅ | |
| 筛选器高度 | 40px | 40px | ✅ | |

**相关文件:**
- `frontend/src/styles/machine-selection-figma.css` (line 219-234 `.ms-filter-card`)
- `frontend/src/pages/Machines/ProductLine1Page.tsx`

---

## 五、机器卡片 (Machine Card)

### 5.1 卡片整体

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 卡片背景 | 白色 | 白色 | ✅ | |
| 卡片高度 | 280px | 280px | ✅ | CSS: `--ff-ms-air-row-height` |
| 阴影 | `0px 0.5px 0px rgba(0,0,0,0.25)` | 已设置 | ✅ | |
| 气垫机圆角 | 0 (无圆角) | 0 | ✅ | |
| 纸垫机圆角 | 12px | 12px | ✅ | |

### 5.2 图片区域 (Gallery)

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 缩略图尺寸 | 68x68px | 68px | ✅ | CSS: `--ff-ms-air-gallery-thumb` |
| 缩略图圆角 | 8px | 8px | ✅ | |
| 缩略图边框 | `#dedede` | `#dedede` | ✅ | |
| 主图尺寸 | 212px | 212px | ✅ | CSS: `--ff-ms-air-gallery-main` |
| 主图圆角 | 8px | 8px | ✅ | |
| 缩略图间隙 | 4px | 4px | ✅ | |
| 主图间隙 | 8px | 8px | ✅ | |

### 5.3 规格区域

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 规格区域背景 | `#f3f4f6` | `#f3f4f6` | ✅ | CSS: `--ff-surface-muted` |
| 标题字体 | Roboto Bold 18px | 18px 700 | ✅ | |
| 标题颜色 | `rgba(0,0,0,0.85)` | 已设置 | ✅ | |
| PN 药丸背景 | `#d9dfed` | `#d9dfed` | ✅ | |
| PN 药丸圆角 | 8px | 8px | ✅ | |
| 规格标签颜色 | `rgba(0,0,0,0.65)` | 已设置 | ✅ | |
| 规格值颜色 | `rgba(0,0,0,0.85)` | 已设置 | ✅ | |

---

## 六、库存面板 (Stock Panel) - 待修复

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 面板宽度 | 321px | 321px | ✅ | |
| 面板高度 | 254px | 254px | ✅ | |
| 面板背景 | `#eff7ff` | `#ebf3ff` | ⚠️ | 需确认使用哪个值 |
| 边框 | 无边框 | 无边框 | ✅ | |
| 圆角 | 8px | 8px | ✅ | |
| 标题字体 | Roboto Regular 18px | 18px | ✅ | |
| 标题颜色 | `rgba(0,0,0,0.65)` | 已设置 | ✅ | |
| 库存标签背景 | 白色 | 白色 | ✅ | |
| 库存标签圆角 | 4px | 4px | ✅ | |
| 库存标签内边距 | 5px 20px | 5px 20px | ✅ | |

**相关文件:**
- `frontend/src/styles/machine-selection-figma.css` (line 863-907)

---

## 七、按钮样式

### 7.1 Add to Cart 按钮

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 背景色 | `#012583` | `#012583` | ✅ | |
| 圆角 | 8px | 8px | ✅ | |
| 内边距 | 12px | 12px | ✅ | |
| 字体 | Roboto Bold 16px | 16px 700 | ✅ | |
| 文字颜色 | 白色 | 白色 | ✅ | |
| 图标尺寸 | 20x20px | 20px | ✅ | |

### 7.2 More Info 气泡按钮

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 背景色 | `#d9dfed` | `#d9dfed` | ✅ | |
| 边框色 | `#c4dcff` | `#c4dcff` | ✅ | |
| 圆角 | 8px | 8px | ✅ | |
| 字体 | Roboto Bold 18px | 18px 700 | ✅ | |
| 图标 | 24x24px | 24px | ✅ | |

### 7.3 数量选择器

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 按钮尺寸 | 32x32px | 32px | ✅ | |
| 按钮圆角 | 4px | 4px | ✅ | |
| 输入框宽度 | 46px | 46px | ✅ | |
| 边框色 | `#dedede` | `#dedede` | ✅ | |

---

## 八、分页组件 (Pagination)

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 按钮尺寸 | 40x40px | 40px | ✅ | |
| 圆角 | 2px | 2px | ✅ | |
| 当前页背景 | `#012583` | `#012583` | ✅ | |
| 当前页文字 | 白色 | 白色 | ✅ | |
| 默认背景 | 白色 | 白色 | ✅ | |
| 边框色 | `#dedede` | `#dedede` ✅ | |
| 字体 | Roboto Regular 16px | 16px | ✅ | |

---

## 九、可点击链接

| 元素 | Figma 设计值 | 当前实现值 | 状态 | 修复建议 |
|------|--------------|-----------|------|----------|
| 链接颜色 | `#2A7DFA` | `#2a7dfa` | ✅ | CSS: `--ff-ms-air-link-hint` |
| 下划线 | 有 | 有 | ✅ | |

---

## 十、待修复问题汇总

### 高优先级 (P0)

| # | 问题 | 位置 | 修复建议 |
|---|------|------|----------|
| 1 | 侧边栏背景色不正确 | `sidebar-figma.css` | 检查 `--sd-bg` 是否应为深色 |
| 2 | 筛选卡片圆角过大 | `machine-selection-figma.css` | 12px → 4px |
| 3 | 库存面板背景色不一致 | `machine-selection-figma.css` | `#eff7ff` vs `#ebf3ff` 需确认 |

### 中优先级 (P1)

| # | 问题 | 位置 | 修复建议 |
|---|------|------|----------|
| 4 | 面包屑定位可能不正确 | `ProductLine1Page.tsx` | 检查是否使用 `--figma` 样式 |
| 5 | 部分组件可能未使用 Figma 类名 | TSX 文件 | 检查是否使用 `.ms-figma-*` 类名 |

---

## 十一、相关文件清单

### 样式文件
- `frontend/src/styles/figma-design-tokens.css` - 全局设计令牌
- `frontend/src/styles/figma-tokens-machine-selection.css` - 机器选型专用令牌
- `frontend/src/styles/machine-selection-figma.css` - 机器选型 Figma 对齐样式
- `frontend/src/styles/sidebar-figma.css` - 侧边栏 Figma 样式
- `frontend/src/styles/figma-front-shell.css` - 前台壳层样式

### 组件文件
- `frontend/src/pages/Machines/ProductLine1Page.tsx` - 气垫机选型页面
- `frontend/src/components/layout/Sidebar.tsx` - 侧边栏组件
- `frontend/src/components/layout/MainLayout.tsx` - 主布局组件
- `frontend/src/components/layout/Header.tsx` - 顶部导航组件

---

## 十二、下一步行动

1. **优先修复 P0 问题**
   - 确认侧边栏应为深色还是白色
   - 修正筛选卡片圆角
   - 确认库存面板背景色

2. **获取更多 Figma 数据**
   - 需要更详细的侧边栏设计规格
   - 需要确认筛选区域的精确布局

3. **视觉验证**
   - 在 1920px 视口下进行对比
   - 使用浏览器 DevTools 逐项验证

---

*文档生成工具: Figma MCP (get_design_context)*
*Node ID: 2679:22612*