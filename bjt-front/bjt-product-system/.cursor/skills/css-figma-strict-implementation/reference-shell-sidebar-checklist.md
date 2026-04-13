# 前台壳层 / 侧栏 / 顶栏 — 块清单（S1–S6）

全页或大范围改 **MainLayout、Sidebar、顶栏、主列背景** 时，用本表防漏块；**数值仍只来自信源**（Dev CSS / 已入库 `sources/*.css`），本表**不提供像素**。

与 [session-retrospective-sidebar-shell.md](../../../docs/visual-upgrade/session-retrospective-sidebar-shell.md) 配套：该文档写「为什么错、怎么避免」，本表写「别漏改哪几块」。

| 块 | 内容 | 典型路径 / 备注 |
|----|------|-----------------|
| **S1** | 侧栏导航结构 + 样式选择器与 DOM 一致 | `Sidebar.tsx`、`sidebar-figma.css`；`nav > ul > li`，勿写 `nav > li` |
| **S2** | 侧栏宽度与顶栏 `left` / `width` 同源 | `--bjt-sidebar-width`、`--bjt-sidebar-effective-width`；`figma-front-shell.css` 覆盖 legacy |
| **S3** | 顶栏高度、内边距、与稿一致 | `--ff-site-header-height`、`main-header__inner`；压过 `header-layout-fix.css` 固定值 |
| **S4** | 主列顶距、滚动区域、不与顶栏重叠 | `figma-front-main`、`page-layout-fix` / `sidebar-functional-fix`；信源未写标「待补」 |
| **S5** | 画布背景单层铺满、不露白 | `.figma-front` + `var(--ff-content-canvas-bg)`；核对 `body` / `#root` |
| **S6** | 顶栏 / 页内关键按钮尺寸与稿 | 禁止仅用 Ant `Button` 默认；信源 → token → `.figma-front` 下覆盖 |

**交付**：在回复中给出 **S1–S6 覆盖表**（已对齐 / 信源未覆盖 / 待补 CSS），规则同 Home H1–H13。
