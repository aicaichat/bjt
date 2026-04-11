# 视觉升级测试用例（严格像素级）

## A. 视觉回归（截图）

| ID | 页面 | 路由 | 视口 | 检查点 | 通过标准 |
|---|---|---|---|---|---|
| VT-SHELL-001 | 壳层 | 全站 | 1920x1080 | 顶栏/侧栏/主内容对齐 | 关键区 <=1px |
| VT-SHELL-002 | 壳层移动端 | 全站 | 375x812 | 顶栏/抽屉侧栏切换 | 不重叠/不截断 |
| VT-HOME-001 | Home | `/` | 1920x1080 | Frame 529 主列宽、卡片间距 | <=1px |
| VT-MACH-001 | Machines | `/machines` | 1920x1080 | 筛选栏、列表密度 | <=1px；自动化全页截图见 `e2e/tests/visual-regression.spec.ts` → `machines-index.png` |
| VT-MS1-001 | 选型P1 | `/machines/product-line-1` | 1920x1080 | 对比区 + 列表行 + 分页 | <=1px；自动化全页截图 → `machines-product-line-1.png`（mock 数据下卡片图可能有像素容差） |
| VT-CONS-001 | Consumables | `/consumables` | 1920x1080 | 卡片/筛选布局 | <=1px |
| VT-CART-001 | Cart | `/cart` | 1920x1080 | 数量器 + 价格汇总区 | <=1px |
| VT-AUTH-001 | Login | `/login` | 1440x900 | 表单与按钮态 | <=1px |

## B. 状态一致性（交互态）

| ID | 模块 | 状态 | 通过标准 |
|---|---|---|---|
| VS-NAV-001 | 顶栏/侧栏导航 | hover/active/focus | 色值/圆角/描边与 Figma 一致 |
| VS-BTN-001 | 主按钮/次按钮 | default/hover/disabled | 背景/边框/文字层级一致 |
| VS-FORM-001 | 输入框/选择器 | default/focus/error | 焦点环与错误态符合 token |
| VS-TABLE-001 | 列表行 | hover/selected | 行高/边距/高亮一致 |

## C. 结构约束（防回归）

| ID | 规则 | 检查方式 |
|---|---|---|
| VG-TOKEN-001 | 禁止新增硬编码色值 | `npm run design:audit` |
| VG-IMPORTANT-001 | 禁止新增无边界 `!important` | `npm run design:audit` |
| VG-BUILD-001 | 构建通过 | `npm run build:skip-check` |
| VG-LINT-001 | Lint 通过 | `npm run lint` |

## D. PR 门禁要求

每个视觉升级 PR 必须包含：
1. 对应 `page-function-style-mapping.md` 行号或 ID。  
2. Before / After / Overlay 三联图。  
3. 本文档中命中的测试用例执行结果。  
4. 如果未达标（如 Figma 未冻结），需写 `blocked` 原因和处置计划。
