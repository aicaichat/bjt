# Home 页 — 全元素对齐检查表（Figma ↔ 代码）

**是什么**：本文件是 Skill `css-figma-strict-implementation` 的 **Home 专用块枚举表（H1–H13）**。**不提供任何数值**；数值 **只** 来自你粘贴的 CSS。当用户要求 **Home 所有元素都对齐** 时，应用本表 **防漏块**（标题条、按钮、图、分页等），并在交付物中给出 **全页块覆盖表**（每块：已按 CSS 对齐 / 待补 CSS）。与 `SKILL.md` 冲突时以 **Skill + 用户 CSS** 为准。

在 **完整实现 Home 对齐** 时，按上→下、外→内逐项核对；**每一行**都应在信源（Figma Dev / 粘贴 CSS）中有依据，或标注「信源未提供」。

## 0. 布局策略（项目当前约定）

- **PC 宽屏**（未命中页面移动断点，Home 现为 **`min-width: 1025px` 等效**，即不进入 `@media (max-width: 1024px)`）：**主布局使用绝对定位 + 固定宽高**，与 Figma 导出一致；**不要**在 PC 上默认改成纯 flex。
- **移动端 / 窄屏**（**`max-width: 1024px`** 及以下已有 `@media`）：**不强制**绝对定位；使用 `static`/`relative`、流式宽度、纵向栈叠等，避免重叠。
- **`top` / `right` / `bottom` / `left` / `width` / `height` / `z-index`** 等 PC 用数值进 **`--ff-home-*`**（或信源要求的全局 `--ff-*`），页面层不写裸 px。
- 子元素绝对定位时，父级形成 **包含块**，并注释 **Figma 父 Frame**。

## 1. 仓库内必读文件

| 用途 | 路径 |
|------|------|
| 结构 / class | `frontend/src/pages/Home/index.tsx` |
| Figma 作用域样式 | `frontend/src/pages/Home/Home.css`（选择器以 `.home-page.home-page--figma` 为根） |
| 旧版全局样式（勿污染 Figma 页） | `frontend/src/pages/Home/Home.override.css`（应使用 `:not(.home-page--figma)` 限定） |
| Home 域 token | `frontend/src/styles/figma-tokens-home.css` |
| JSON 同步（可选） | `frontend/src/figma-tokens/home.json` |
| 全局色 / 顶栏高 / 画布 | `frontend/src/styles/figma-design-tokens.css` |
| Token 加载顺序 | `frontend/src/main.tsx`（`figma-design-tokens.css` → `figma-tokens-home.css` → …） |
| **Dev CSS 原文（须持久化）** | `docs/visual-upgrade/sources/home-figma-dev-export-*.css`（推荐）+ `docs/visual-upgrade/home-figma-user-dev-css.md`（索引）；与 `figma-tokens-home.css` 同步 |

## 2. 元素清单（DOM → 建议 token / 样式位置）

| # | 区域说明 | DOM / class（`index.tsx`） | 主要 token 前缀 / 样式块 |
|---|----------|---------------------------|---------------------------|
| H1 | 页面壳层（左右 gutter、顶栏下留白、画布底） | `.home-page.home-page--figma` | `--ff-home-shell-pad-x`、`--ff-home-header-below-gap`、`--ff-site-header-height`（全局）、`--ff-content-canvas-bg` |
| H2 | 主列 Frame 529 | `.home-main.home-frame-529` | `--ff-home-main-max-width`、`--ff-home-stack-gap`、`--ff-home-main-min-height-lg` |
| H3 | 产品线卡片容器 | `.product-section` | `--ff-home-card-*`、hover 阴影 |
| H4 | 海军标题条 | `.section-header` | `--ff-home-section-header-*`、`--ff-home-bar-*` |
| H5 | 卡体主行（稿常对应 Frame 740） | `.section-content` | `--ff-home-frame-740-*`、`--ff-home-section-content-gap`、pad |
| H6 | 左侧文案列 | `.section-text` | `--ff-home-section-text-gap` |
| H7 | 描述段落 | `.home-line-description` | `--ff-home-desc-*` |
| H8 | 链接栈 | `.product-links` | `--ff-home-link-stack-gap` |
| H9 | 单个 CTA（outline 按钮） | `.product-link`、`.external-link` | `--ff-home-link-min-height`、`--ff-home-link-pad-*`、`--ff-home-link-font-*`、`--ff-home-link-radius` |
| H10 | 链接内文案行 | `.product-link-text` | 与 H9 一致，避免被全局 `font-size` 压掉 |
| H11 | 外链图标 | `.external-icon` | `--ff-home-external-icon-ml` |
| H12 | 右侧图区 | `.section-image`、`img` | `--ff-home-image-*` |
| H13 | 分页 | `.pagination`、`.pagination-button` | `--ff-home-pagination-*` |

**产品线 4**：若稿有特殊色或结构，核对 `[data-product-line='4']` 相关规则。

## 3. 视口与断点（交付前自测）

| 视口 | 目的 |
|------|------|
| 1920（或稿面宽度） | 主列宽、Frame 740 宽 1457、按钮与图区与稿对比 |
| ≤1024 | 纵排、内边距 token 是否从 `figma-tokens-home.css` 的 `@media` 回落 |
| ≤768 / ≤480 | 字号、按钮高度、分页按钮、gutter |

## 4. 全页任务交付物（回复中必须包含）

1. **全页块覆盖表**：H1–H13 每一行对应状态：**已按 CSS 对齐** / **待补 CSS** / **已与某段 CSS 共用 token**（并注明引用）。  
2. **映射表**：信源 CSS 片段 / 选择器 → 项目 class + token。  
3. **Token 审计表**：已对齐块涉及的 `--ff-home-*` / `--ff-*` 与 CSS 一致。  
4. **Override 确认**：`Home.override.css` 未对 `.home-page--figma` 泄漏旧规则。  
5. **构建**：`npm run build:skip-check`（或项目约定命令）结果。
