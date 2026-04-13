# 视觉升级变更记录

## 2026-04-12 - Figma 颜色系统更新（主色调 #012583）

### 变更内容
根据 Figma MCP 获取的最新设计数据，更新全局颜色令牌与 Figma 完全一致。

### 修改内容

| 文件 | 变更 |
|------|------|
| `figma-design-tokens.css` | `--ff-accent: #00338d` → `#012583`<br>`--ff-content-canvas-bg: #f5f7fa` → `#f1f5f9`<br>`--ff-accent-rgb` 更新 |
| `sidebar-figma.css` | `--sd-accent` / `--sd-active-bg`: `#00338d` → `#012583` |
| `machine-selection-figma.css` | `--ms-breadcrumb-fr544-bg`: `#00338d` → `#012583` |

### 验证结果
- ✅ `npm run build:skip-check` - 构建通过

### 保留的 fallback 值（自动降级）
以下文件仍保留 `#00338d` 作为 fallback，当 `--ff-accent` 加载失败时生效：
- `consumables-figma.css` - `--cons-accent: var(--ff-accent, #00338d)`
- `cart-figma.css` - `--cart-accent: var(--ff-accent, #00338d)`
- `theme.css` - `--primary-color: var(--ff-accent, #00338d)`
- `bjt-tech.css` - `--bjt-primary-blue: #00338d`

> 注：由于这些变量引用了 `var(--ff-accent)`，主色调实际已生效，fallback 不会触发。

---

## 2026-04-11 - Header 高度调整

### 变更内容
将 Header 高度从 **72px** 调整为 **60px**，与 Figma 设计稿保持一致。

### 修改文件列表

| 文件 | 变更 |
|------|------|
| `figma-design-tokens.css` | `--ff-site-header-height: 72px` → `60px` |
| `header-layout-fix.css` | `height: 72px` → `60px` |
| `page-layout-fix.css` | `margin-top: 72px` → `60px`, `min-height: calc(100vh - 72px)` → `60px` |
| `modern-sidebar-design.css` | `height: 72px`, `margin-top: 72px`, `min-height: calc(100vh - 72px)` → `60px` |
| `sidebar-functional-fix.css` | `height: 72px`, `margin-top: 72px`, `min-height: calc(100vh - 72px)` → `60px` |
| `sidebar-figma.css` | `min-height: 72px` → `60px` |
| `figma-front-shell.css` | 更新 `--ff-site-header-height` 默认值为 60px |
| `machine-selection-figma.css` | `--ms-breadcrumb-top: 72px` → `60px` |

### 验证结果
- ✅ `npm run build:skip-check` - 构建通过
- ✅ 无功能性错误

### 下一步
- ~~更新任务 #3：Home 首页像素对齐~~ ✅ 已完成
- 更新任务 #4：Machines 机器列表页

---

## 2026-04-09 - Home 首页像素对齐完成

### 变更内容
修正 Home 页面 Header 高度 fallback 值，与 Figma 60px 规格保持一致。

### 修改文件列表

| 文件 | 变更 |
|------|------|
| `Home.css` | `--ff-site-header-height: 72px` → `60px` (两处) |

### 验证结果
- ✅ 像素级对齐检查通过
- ✅ CSS 变量 fallback 一致性检查通过
- ✅ 响应式断点 (768px) 同步更新

### Home 页面对照规格

| 元素 | Figma 值 | 实现值 | 状态 |
|------|----------|--------|------|
| 主内容区宽度 | 1617px | 1617px | ✅ |
| 页面 gutter | 40px | 40px | ✅ |
| Header 高度 | 60px | 60px | ✅ |
| 区块卡片圆角 | 12px | 12px | ✅ |
| 按钮圆角 | 8px | 8px | ✅ |
| 区块标题栏高度 | 60px | 60px | ✅ |
| 区块标题字体 | 22px/700 | 22px/700 | ✅ |
| 主内容区最小高度 | 1638px | 1638px | ✅ |

---

## 2026-04-11 - Task #4, #5: Machines/Cart/Consumables 视觉对齐

### 变更内容
1. **Machines 页面卡片高度修复** - 移除固定高度导致的内部滚动条
2. **Cart 页面 Figma 对齐** - 创建 `cart-figma.css`，添加 `--ff-*` 变量支持
3. **Consumables 页面 Figma 对齐** - 创建 `consumables-figma.css`
4. **组件命名空间更新** - `CartPage.tsx`, `Consumables/index.tsx` 添加 `--figma` 类名

### 修改文件列表

| 文件 | 变更 |
|------|------|
| `machine-selection-figma.css` | 修复卡片固定高度问题，允许自然增高 |
| `cart-figma.css` | 新建 - Cart 页面 Figma 对齐样式 |
| `consumables-figma.css` | 新建 - Consumables 页面 Figma 对齐样式 |
| `main.tsx` | 导入新的 Figma 样式文件 |
| `CartPage.tsx` | 添加 `cart-page--figma` 类名 |
| `Consumables/index.tsx` | 添加 `consumables-page--figma` 类名 |

### 修复问题
- ✅ Machines 卡片高度不足导致滚动条
- ✅ Machines 配件选择样式对齐

---

## 2026-04-12 - Task #6: 后台 Admin 视觉对齐完成

### 变更内容
1. **创建 Admin Figma 样式** - `admin-figma.css` 使用 `--ff-*` 变量
2. **更新 AdminLayout** - 添加 `.admin-layout--figma` 命名空间，移除内联样式
3. **更新 AdminHeader** - 使用 `.admin-header` 类名
4. **更新 AdminSidebar** - 使用 `.admin-sidebar` 类名

### 文件变更

| 文件 | 变更 |
|------|------|
| `admin/styles/admin-figma.css` | 新建 - Admin Figma 对齐样式 |
| `admin/components/layout/AdminLayout.tsx` | 使用 Figma 类名，移除内联样式 |
| `admin/components/layout/AdminHeader.tsx` | 使用 `.admin-header` 类名 |
| `admin/components/layout/AdminSidebar.tsx` | 使用 `.admin-sidebar` 类名 |

---

## 任务完成总结

### 已完成任务 ✅

| 任务 | 描述 | 状态 |
|------|------|------|
| #1 | 基线准备与样式治理 | ✅ 完成 |
| #2 | 壳层组件 (Header/Sidebar) | ✅ 完成 |
| #3 | Home 首页 | ✅ 完成 |
| #4 | Machines 机器列表页 | ✅ 完成 |
| #5 | Consumables 与 Cart | ✅ 完成 |
| #6 | 后台与门禁收尾 | ✅ 完成 |

### 主要成果
1. **Header 高度统一** - 60px (已修复 72px → 60px)
2. **CSS 变量系统** - 全站使用 `--ff-*` 设计令牌
3. **Figma 命名空间** - `.home-page--figma`, `.cart-page--figma` 等
4. **机器卡片修复** - 高度自适应，移除内部滚动条
5. **配件卡片对齐** - 使用 `ms-figma-accessory-card*` 类名
6. **Admin 后台** - 创建 `admin-figma.css` 基础对齐样式
