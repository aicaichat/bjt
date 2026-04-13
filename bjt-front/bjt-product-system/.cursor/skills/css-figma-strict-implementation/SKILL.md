---
name: css-figma-strict-implementation
description: >-
  Implements Figma-aligned CSS/UI from a single agreed source (Dev Mode CSS,
  repo paths under docs/visual-upgrade/sources/, or inspect text). Forbids
  guessing px or using Ant/Material defaults for dimensions. Strict-alignment
  pages (per user scope) prefer native DOM + project tokens over Ant for visible
  chrome. Covers Home H1–H13, storefront login L1–L8 (native form), consumables
  C1–C12, machine-selection M1–M12, shell/sidebar/header (S1–S6): verify DOM matches
  CSS child selectors (e.g. nav>ul>li not nav>li), single-source layout vars
  (--bjt-sidebar-width, --ff-site-header-height), .figma-front canvas background,
  legacy header-layout-fix overrides. See docs/visual-upgrade/session-retrospective-sidebar-shell.md.
  Triggers: 严格按稿, 不要猜尺寸, pixel-perfect, MainLayout, Sidebar,
  figma-front-shell, sidebar-figma, 耗材 consumables. PC: absolute + fixed sizes; mobile: @media fluid.
  Machine width chain: figma-machine-selection-layout rule.
---

# CSS / Figma — 严格按信源实现

## 严格对齐页：组件策略 — **优先不用 Ant Design 画稿面**

用户指定某路由要做 **Figma 严格对齐 / 像素级还原** 时（含「本页」「consumer 耗材」等明确范围），Agent **默认遵守**：

1. **可见布局与表单控件**：用 **原生 HTML + 项目 BEM/class + `figma-tokens-*.css` / 域 CSS** 实现；**不**用 Ant `Form` / `Input` / `Button` / `Select` / `Tabs` / `Modal` 等作为**稿面主结构**，以免 Row/Col、affix、内联样式与全局 `*fix.css` 叠加后无法 1:1。
2. **例外（须在本回合回复中点名原因）**：仅当功能极复杂且用户同意保留时，可暂时保留 Ant（例如大型可编辑表格、日期范围等）；**仍须**用稿面 token 在 **页面根限域类**（如 `.*--figma`）下覆盖，并记录「技术债」。
3. **与「先去掉 Ant」的关系**：指 **正在对齐的具体页面** 上 **优先移除或不再新增** Ant 依赖，**不是**要求全仓库一键卸载 `antd`（后台与其它路由可渐进）。
4. **已落地参考**：前台 **`/login`** 已为 **原生 `<form>` + `Login.css`**，无 Ant；耗材等页应对齐同一策略。

**教训归纳**：Ant 默认盒模型 + 项目内全局 Ant 覆盖 → `max-width:100%`、flex 子项 `min-width` 等与稿面固定宽易冲突；**自有 DOM** 才能与 Dev CSS 选择器一一对应。

## CSS 原文必须入库（Home — 强制）

用户在对话里提供 **Home** 页 Figma Dev Mode / Inspect **CSS**（含使用「**以下 CSS 为唯一信源**」的整页对齐任务）时，Agent **必须**：

1. **先把本回合代码块中的 CSS 完整写入仓库**（二选一或同时）：**①** [`docs/visual-upgrade/sources/home-figma-dev-export-YYYY-MM-DD.css`](../../../docs/visual-upgrade/sources/home-figma-dev-export-2026-04-12.css) 纯文本（大段粘贴推荐）；**②** [`docs/visual-upgrade/home-figma-user-dev-css.md`](../../../docs/visual-upgrade/home-figma-user-dev-css.md) 内说明并 **链接** 到上述 `.css`。须可逐行核对、勿只拆 token 不留原文。
2. **再** 据同一套 CSS 更新 `frontend/src/styles/figma-tokens-home.css`、`frontend/src/figma-tokens/home.json`、`frontend/src/pages/Home/Home.css` 等。

**禁止**只把数字拆进 token、却不在仓库里保留**可逐行核对**的 Dev CSS 原文。

- 用户仅提供**片段**时：仍将片段**原样**写入该文件，并在围栏上方用一行注释标明「以下为片段 / 对应 Frame ___」。
- **信源冲突**：对话粘贴与 md 内旧文不一致时，在回复中列差异；**默认以用户本回合明确指令为准**；若用户写「以文件为准」则以 `home-figma-user-dev-css.md` 最新内容为准。

### 机器选型页（ProductLine1 / 2 / 3）

用户在对话里提供 **机器选型** Figma Dev **CSS**，且声明 **「以下 CSS 为唯一信源」**（或整页对齐任务）时，Agent **必须**：

1. 将本回合 `css` 围栏内全文写入 **`docs/visual-upgrade/sources/machine-selection-figma-dev-export-YYYY-MM-DD.css`**；并在 **`docs/visual-upgrade/machine-selection-figma-user-dev-css.md`** 中增加索引与链接（格式可类比 `home-figma-user-dev-css.md`）。
2. 再据同一套 CSS 更新 **`figma-tokens-machine-selection.css`**、**`frontend/src/figma-tokens/machine-selection.json`**（若同步）、**`machine-selection-figma.css`** 及对应 **`ProductLine*Page.tsx`** 中必要的 class（通常不改结构，只改样式与 token）。

**块枚举防漏**：打开 [reference-machine-selection-full-alignment.md](reference-machine-selection-full-alignment.md)（M1–M12）。**宽度与 gutter 链**须同时符合 [`.cursor/rules/figma-machine-selection-layout.mdc`](../../rules/figma-machine-selection-layout.mdc)，若与粘贴 CSS 冲突在回复列 **差异表** 并请用户确认以何为准。

### 前台商城登录 `/login`

用户在对话里提供 **前台登录页** Figma Dev **CSS**，且声明 **「以下 CSS 为唯一信源」**（或整页对齐任务）时，Agent **必须**：

1. 将本回合 `css` 围栏内全文写入 **`docs/visual-upgrade/sources/login-figma-dev-export-YYYY-MM-DD.css`**；并更新 **`docs/visual-upgrade/login-figma-user-dev-css.md`** 索引与链接。
2. 再据同一套 CSS 更新 **`frontend/src/styles/figma-tokens-login.css`**、**`frontend/src/pages/Login/Login.css`**；**`main.tsx` 须已**在 `figma-design-tokens.css` **之后**引入 `figma-tokens-login.css`（若缺失则补上）。

**块枚举防漏**：[reference-login-full-alignment.md](reference-login-full-alignment.md)（**L1–L8**：整页背景、卡片、Logo、标题/副标题、错误条、表单、主按钮、注册区）。**实现**：登录页为 **原生表单**，**不**再使用 Ant；尺寸与颜色仅来自 token / Dev CSS。

### 前台 consumer 耗材 `/consumables`（及产品线子路由）

用户在对话里提供 **耗材页** Figma Dev **CSS**，且声明 **「以下 CSS 为唯一信源」**（或整页对齐任务）时，Agent **必须**：

1. 将本回合 `css` 围栏内全文写入 **`docs/visual-upgrade/sources/consumables-figma-dev-export-YYYY-MM-DD.css`**；并新建或更新 **`docs/visual-upgrade/consumables-figma-user-dev-css.md`** 索引与链接（格式类比 `login-figma-user-dev-css.md`）。
2. 再据同一套 CSS 更新域 token 与页面样式：优先使用或扩展 **`frontend/src/styles/figma-tokens-consumables.css`**（若项目尚未拆分，可与现有 **`consumables-figma.css`** 合并策略，但须在回复中说明 **token 与组件样式的分界**）；**`main.tsx`** 须在 `figma-design-tokens.css` 之后加载耗材域 token 文件（若新增则补上）。
3. **组件策略**：对齐范围内 **优先移除 Ant** 对稿面的占用（见上文「严格对齐页：组件策略」）；`frontend/src/pages/Consumables/index.tsx` 中可见筛选、Tabs、按钮、卡片外壳等逐步换为 **原生 + token**。
4. **Legacy 限域**：`Consumables.css` / `consumables.scss` 等全局规则若误伤，用 **`:not(.consumables-page--figma)`** 或与 Home 登录相同的 **`*--figma` 根类** 排除（以页面已有 class 为准）。

**块枚举防漏**：[reference-consumables-full-alignment.md](reference-consumables-full-alignment.md)（**C1–C12**，可按 TSX 调整行表）。**产品线子路由**单独出稿时分别列覆盖表。

## 项目布局约定（当前）

本仓库 Figma 对齐页（以 Home `--figma` 为例）按 **视口分流**：

### PC 端（宽屏）

- **主布局须采用 `position: absolute`（及稿中要求的 `fixed`）+ 固定 `width` / `height`（或信源中的 min/max）**，与 Figma Dev 导出一致。
- **`fixed`** 仍慎用：注意与顶栏、滚动容器的叠层关系，仅在稿明确要求或等价场景使用。

**Agent 不得**在 PC 宽屏下仅因「流式更佳」把绝对定位整体改成纯 flex/auto；若用户要求改 PC 策略，须明确说明。

### 移动端 / 窄屏（例外）

- 在页面既有 **`@media (max-width: 1024px)`**（及更小断点，如 768、480）内：**不强制**绝对定位；应恢复 **`position: static` 或 `relative`**、流式宽度、纵向栈叠等，避免重叠与横向溢出。
- 移动样式写在同一套 `Home.css` / `figma-tokens-home.css` 的 `@media` 中，并注释 **`/* 移动端：取消 PC 绝对定位 */`** 或类似说明。

断点以 **当前页面已存在的 media 为准**；若项目对「移动端」另有统一定义，以用户或 `docs` 为准。

### 通用

- 所有 **PC 用** 像素、偏移、尺寸进入 **`figma-tokens-*.css`（及 `*.json` 若同步）**，页面 CSS 用 `var(--*)`。
- 绝对定位子元素的父级须形成 **包含块**（通常 `position: relative`，除非信源另有指定），并注释 **Figma 父帧**。

## 前台壳层、顶栏与侧栏（防再犯）

改 **`MainLayout.tsx`**、**`Sidebar.tsx`**、**`figma-front-shell.css`**、**`sidebar-figma.css`**，或与 **`header-layout-fix.css`** 产生覆盖关系时，**先读本小节**，并打开 **[reference-shell-sidebar-checklist.md](reference-shell-sidebar-checklist.md)（S1–S6）** 与 **[session-retrospective-sidebar-shell.md](../../../docs/visual-upgrade/session-retrospective-sidebar-shell.md)**（问题归类与长文说明）。

### 硬规则（补充）

1. **DOM 与选择器一致**：任何使用子选择器 `>` 的规则，**必须在 DevTools 核对真实父子链**。例：侧栏为 `nav.sidebar-figma-nav` → `ul.sidebar-figma-nav__list` → `li.sidebar-figma-nav__item`，**不得**写成 `nav > li` 跳过 `ul`。
2. **布局数字同源**：侧栏宽、顶栏 `left`/`width`、顶栏高度等与稿相关的量，**统一走同一组 CSS 变量**（如 `--bjt-sidebar-width`、`--bjt-sidebar-effective-width`、`--ff-site-header-height`）；禁止在多个全局文件各写一套互不一致的 magic number（如 300px 与 303px 混用）。
3. **壳根画布**：前台 Figma 壳（**`.figma-front`**）须按信源铺主列/画布背景（如 `var(--ff-content-canvas-bg)`），避免滚动边缘透出与稿不一致的底色。
4. **组件模型服从稿**：若稿为「一级行 + 平铺二级」，**不得**用 Ant `Menu`/`SubMenu` 的折叠模型硬套；侧栏导航可用原生列表 + 项目 BEM class。
5. **按钮与控件**：顶栏/壳层与 **正在严格对齐的页面** 内，**Ant `Button` / `Select` 等默认值不可替代稿面**；优先 **原生控件 + token**；若短期保留 Ant，须在 **`.figma-front`** / **`*--figma` 根** 下用信源 token **显式覆盖**，并在覆盖表标注「待原生化」。
6. **Legacy 限域**：全局 `*.override.css`、`header-layout-fix.css` 等若盖掉稿面，须在 **`.figma-front`** 或更高特异性下用信源 token **显式覆盖**，并注明与哪段 legacy 冲突。

### 壳层任务交付

- 对照 **S1–S6** 给出 **覆盖表**（每块：已对齐 / 信源未覆盖 / 待补 CSS）；规则与 Home **H1–H13** 相同：**未覆盖块禁止编造 px**。
- 若用户粘贴壳层/侧栏 **Dev CSS 全文**，**建议** 入库 `docs/visual-upgrade/sources/`（命名如 `shell-sidebar-figma-dev-export-YYYY-MM-DD.css`）并在 `docs/visual-upgrade/` 下 md **索引**，便于与 Skill「CSS 原文必须入库」一致（Home/选型仍为强制，壳层为**强烈建议**）。

## 何时读取本 Skill

用户给出 **具体数字或 Dev 原文**、要求 **对齐 Figma**，或修改 **`figma-tokens-*.css`** / **`figma-tokens/*.json`** / 带 **`--figma`** 的页面样式，或 **`MainLayout` / `Sidebar` / `figma-front-shell` / `sidebar-figma`**，或 **耗材 `/consumables`** 时，**先读本文件再改代码**；壳层大范围改动时对照 **S1–S6** 清单。

若用户要求 **某页所有元素都对齐**（含「完整 Home」）：

- **数值与具体 px / 定位 / 字重等**：**唯一信源 = 粘贴的 CSS**（含「**以下 CSS 为唯一信源**」）时，**禁止编造** CSS 未出现的数字。
- **覆盖范围**：**必须**覆盖该页 **全部主要可视区块**——从对应页面 `*.tsx` 归纳结构（class / 大区）。**Home** 用 [reference-home-full-alignment.md](reference-home-full-alignment.md)（H1–H13）；**前台登录** 用 [reference-login-full-alignment.md](reference-login-full-alignment.md)（L1–L8）；**耗材** 用 [reference-consumables-full-alignment.md](reference-consumables-full-alignment.md)（C1–C12）；**机器选型** 用 [reference-machine-selection-full-alignment.md](reference-machine-selection-full-alignment.md)（M1–M12）。各表 **不提供数值**，数值仍只来自 CSS。
- 对 **清单中有、但当前 CSS 未覆盖** 的块：在交付物中列入 **「待补信源」**，并 **①** 请用户追加该块 Dev CSS，或 **②** 用户明确指令「与 CSS 中某已给组件共用同一 token」（须在回复写明引用哪段 CSS）；**在此之前不得**为该类块臆造新像素。允许做 **无新数值** 的衔接（如去掉错误 override、补 `position: relative` 包含块、与已对齐块共用已有变量名）。

项目内 **Cursor Rule**：`.cursor/rules/css-figma-strict-implementation.mdc`。

## Home 页 — 完整对齐（工作流）

当任务范围是 **整页 Home**（用户要求 **所有元素** 对齐）时：

1. **信源**：以用户粘贴 **CSS** 为数值唯一来源；块枚举对照 `index.tsx` + **建议**打开 [reference-home-full-alignment.md](reference-home-full-alignment.md) 的 H1–H13，确保 **无漏块**。
2. **入库**：先把该 CSS 写入 `docs/visual-upgrade/sources/home-figma-dev-export-YYYY-MM-DD.css` 并更新 [`home-figma-user-dev-css.md`](../../../docs/visual-upgrade/home-figma-user-dev-css.md) 索引（见上文「CSS 原文必须入库」）。
3. **读结构**：`frontend/src/pages/Home/index.tsx` — 将 Figma 导出选择器映射到 `.section-content` 等；对 **清单中每一块** 在覆盖表里打勾或标「待补 CSS」。
4. **先 token 后页面**：`figma-tokens-home.css` + `home.json` → 再改 `Home.css`；页面内 **无裸数字**（仅 `var(--*)` / `calc()`）。
5. **全量遍历**：**先**按块清单扫全页，再逐条落实 **CSS 中已有** 的规则；**不得**只改 CSS 里出现的选择器却不给出 **全页覆盖表**。
6. **Override**：确认 `Home.override.css` 中链接等规则仅作用于 `:not(.home-page--figma)`。
7. **顶栏与主列**：**CSS 有写** 用信源；**无写** 标「信源未覆盖」，不编新 px（除非用户确认沿用现有全局 token）。
8. **交付**：**①** 已更新 `sources/home-figma-dev-export-*.css` 与/或 `home-figma-user-dev-css.md`（路径写明）**② 全页块覆盖表**（每块：已对齐 / 待补 CSS / 已共用某段 CSS 的 token）**③** CSS→class/token 映射 **④** token 审计 **⑤** 构建结果。

**分批贴 CSS**：每批后更新覆盖表；直至 **所有块均为「已对齐」或用户接受「待补」** 为止。

**其它路由**：无现成 reference 时，由 Agent 从 `*.tsx` **自建块表**，规则同上。

## 机器选型页 — 完整对齐（工作流）

当用户指定 **机器选型**（`ProductLine1Page` / `2` / `3`）且要求 **全元素** 对齐时：

1. **信源**：粘贴 **CSS**；**须**先 **入库** 至 `docs/visual-upgrade/sources/machine-selection-figma-dev-export-YYYY-MM-DD.css` 并更新 `machine-selection-figma-user-dev-css.md`（见上文「机器选型页」小节）。
2. **块清单**：对照 [reference-machine-selection-full-alignment.md](reference-machine-selection-full-alignment.md) **M1–M12** + 实际 TSX，填 **全页块覆盖表**。
3. **布局 Rule**：修改主列宽度、gutter、`.ms-content-column` 链时 **对照** `figma-machine-selection-layout.mdc`，避免双 gutter / 假居中。
4. **先 token 后页面**：`figma-tokens-machine-selection.css` + `machine-selection.json` → `machine-selection-figma.css` → 必要时微调 TSX class。
5. **交付**：入库路径、覆盖表、映射、token 审计、与 layout Rule 一致性说明、`npm run build:skip-check`。

## 前台商城登录页 — 完整对齐（工作流）

当用户指定 **前台登录 `/login`** 且要求 **全元素** 或 **与 Figma 一致** 时：

1. **信源**：粘贴 **CSS**；**须**先 **入库** 至 `docs/visual-upgrade/sources/login-figma-dev-export-YYYY-MM-DD.css` 并更新 `login-figma-user-dev-css.md`（见上文「前台商城登录」小节）。
2. **块清单**：对照 [reference-login-full-alignment.md](reference-login-full-alignment.md) **L1–L8** + `frontend/src/pages/Login/index.tsx`，填 **全页块覆盖表**。
3. **先 token 后页面**：`figma-tokens-login.css` → `Login.css`；**主色/画布**优先复用 `figma-design-tokens.css` 的 `--ff-accent`、`--ff-content-canvas-bg` 等（在 login token 中用 `var(--ff-*)` 衔接）。
4. **PC / 移动**：与 Skill「项目布局约定」一致——稿为 **absolute + 固定卡片** 则宽屏照做；**`@media`** 内取消强制 absolute、流式宽度（可在 `figma-tokens-login.css` 或 `Login.css` 中扩展断点）。
5. **实现**：登录为 **原生表单**，无 Ant；若用户旧文档仍写「覆盖 Ant」，以代码现状与本 Skill 为准。
6. **交付**：入库路径、**L1–L8 覆盖表**、CSS→class/token 映射、token 审计、diff、`npm run build:skip-check`。

## 前台 consumer 耗材页 — 完整对齐（工作流）

当用户指定 **耗材 `/consumables`**（及可选 **product-line-2 / product-line-3** 子路由）且要求 **全元素** 或 **与 Figma 一致** 时：

1. **信源**：粘贴 **CSS**；**须**先 **入库** 至 `docs/visual-upgrade/sources/consumables-figma-dev-export-YYYY-MM-DD.css` 并更新 `docs/visual-upgrade/consumables-figma-user-dev-css.md`（见上文「前台 consumer 耗材」小节）。
2. **块清单**：对照 [reference-consumables-full-alignment.md](reference-consumables-full-alignment.md) **C1–C12** + 实际 `Consumables/index.tsx`（及子页 TSX），填 **全页块覆盖表**；子路由单独出稿则分行标注。
3. **组件策略**：对齐范围内 **优先不用 Ant** 实现稿面可见结构（筛选、Tab、按钮、卡片框等）；保留 Ant 的块须在覆盖表标 **待原生化** 并说明原因。
4. **先 token 后页面**：域 token 文件（`figma-tokens-consumables.css` 或与现有 `consumables-figma.css` 的约定）→ `consumables-figma.css` / `Consumables.css` 等；页面内 **无裸数字**（仅 `var(--*)` / `calc()`）。主色衔接可复用 `--ff-accent` 等全局 token。
5. **PC / 移动**：与 Skill「项目布局约定」一致。
6. **Legacy**：全局 scss/css 误伤时用 `consumables-page--figma`（或页面实际 `--figma` 根类）与 `:not()` 限域。
7. **交付**：入库路径、**C1–C12 覆盖表**、Ant 移除/保留清单、CSS→class/token 映射、token 审计、diff、`npm run build:skip-check`。

## 流程（通用页面也适用）

### 1. 锁定唯一信源

若用户未写「以何为准」，**先问一句**：本次以粘贴全文 / 指定仓库路径 / Figma 节点+截图 哪一种为准？

多份信源冲突时：列 **差异表**（信源值 | 当前代码 | 文件路径），**等用户确认后再改**。

### 2. 硬规则

1. **间距、圆角、字号、行高、字重、宽高、flex、position、top/right/bottom/left、z-index** 必须能从信源推出（含绝对定位与固定框）。信源没有的，在回复写 **「信源未提供」**，**禁止编造**。可保留已有 `var(--*)` 名称，**不得擅自改数值**。
2. **顺序**：先改 **域 token**（如 `figma-tokens-home.css`、`figma-tokens-login.css`、`figma-tokens-machine-selection.css`）及需同步的 **`src/figma-tokens/*.json`**（若有）→ 再改页面/组件 CSS。页面选择器下 **禁止新裸数字**（仅 `var(--*)` 与合法 `calc()`）。
3. **注释映射**：关键块注明 `/* Figma Frame 740 → .section-content */` 等。
4. **Override**：检查 `*.override.css`、`index.css` 等；会盖 Figma 页时，提高特异性或用 `:not(.home-page--figma)` / `.*--figma` **限定作用域**。
5. **范围**：仅提某一帧时，**同卡内子节点**若也贴了规格要一起做进 token；**未提的不顺手「优化」**。  
   **全页任务**：用户要求 **页面内所有元素** 对齐时，必须 **枚举该页全部主要块** 并交付 **覆盖表**；**数值**仅来自 CSS（或用户明确允许共用某段 CSS 的 token），**禁止**对未覆盖块编造 px；未覆盖块须 **待补 CSS** 或用户确认共用规则。
6. **子选择器与 DOM**：使用 `A > B` 前核对 DevTools 中 **A 的直接子节点** 是否为 **B**；结构从组件库改为原生（或反之）后 **必须重验** 所有相关选择器。
7. **壳层与侧栏**：涉及 **S1–S6**（见 [reference-shell-sidebar-checklist.md](reference-shell-sidebar-checklist.md)）时，交付 **壳层覆盖表**；布局相关变量 **不得** 在多文件重复为不同字面量。

### 3. 交付前在回复中自检

- [ ] Home 且信源为对话粘贴 CSS：**`docs/visual-upgrade/sources/home-figma-dev-export-*.css`**（或 md 内同文）已写入（路径在回复中点名）  
- [ ] 机器选型且信源为对话粘贴 CSS：**`docs/visual-upgrade/sources/machine-selection-figma-dev-export-*.css`**（及 `machine-selection-figma-user-dev-css.md` 索引）已写入  
- [ ] 前台登录且信源为对话粘贴 CSS：**`docs/visual-upgrade/sources/login-figma-dev-export-*.css`**（及 `login-figma-user-dev-css.md` 索引）已写入  
- [ ] 耗材且信源为对话粘贴 CSS：**`docs/visual-upgrade/sources/consumables-figma-dev-export-*.css`**（及 `consumables-figma-user-dev-css.md` 索引）已写入  
- [ ] **全页块覆盖表**已给出，且与 TSX + Home H1–H13 / 登录 L1–L8 / 耗材 C1–C12 / 选型 M1–M12 一致，无静默漏块  
- [ ] **严格对齐页**：已按「组件策略」优先原生实现；保留 Ant 的块已标注原因或「待原生化」  
- [ ] 信源中的数字都有 token 或选择器对应项；**待补 CSS** 块未臆造新像素  
- [ ] **PC 宽屏**主布局已按约定使用绝对定位；**移动 `@media`** 内已覆写为流式（非强制 absolute）  
- [ ] 使用 `absolute`/`fixed` 时，包含块与父级 `position` 已写明或注释说明  
- [ ] 无与信源冲突且未说明的遗留注释  
- [ ] 已运行项目约定构建（如 `npm run build:skip-check`）
- [ ] （若改 **MainLayout / Sidebar / figma-front-shell / sidebar-figma / 顶栏与侧栏衔接**）**S1–S6 覆盖表**已给出；**`>` 选择器**已与真实 DOM 核对；**布局变量**未与 legacy 固定像素静默冲突

## 完整 walkthrough 案例

逐步对话示例（含 **覆盖表**、**待补 CSS**、第二轮补贴）：见 [example-full-home-css.md](example-full-home-css.md)。

## 模版是什么？

**模版** = 发给 Agent 时的**固定说明文字** + **你填的内容**。Agent 按本 Skill 识别任务范围、信源和交付格式。

---

## 用户粘贴模版

### 极简版（推荐：只填 CSS）

你只要 **@ 本 Skill**，复制下面整段，把中间 ```css … ``` 换成你的代码即可（可顺带加一行 PNG 路径，不加也行）。

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

按本 Skill 做 **完整 Home 对齐**，**以下 CSS 为唯一信源**（数值仅来自 CSS）。**须覆盖首页全部主要区块**（建议对照 Skill 内 `reference-home-full-alignment.md` 的 H1–H13 防漏）；CSS 未写到的块列入「待补 CSS」或按我说明共用已有 token，禁止编造 px。

```css
在此粘贴从 Figma Dev / Inspect 复制的 CSS 全文（可含注释帧名）
```

Agent 将把上述 `css` 围栏内的内容**完整保存**到 `docs/visual-upgrade/sources/home-figma-dev-export-YYYY-MM-DD.css`（并更新 `home-figma-user-dev-css.md` 链接），再同步 `figma-tokens-home.css` / `home.json` / `Home.css`。

可选：对比截图 `docs/visual-upgrade/你的图.png`  （无则删本行）
```

**Agent 识别规则**：消息含「**以下 CSS 为唯一信源**」且紧跟 `css` 代码块时，**默认**视为 **整页 Home + 信源=该 CSS**；若同条消息写明 **【页面】前台商城登录** / **【页面】/login**（或等价），则走 **登录** 入库与 L1–L8 覆盖（`login-figma-dev-export-*.css`、`reference-login-full-alignment.md`），**不得**误写入 `home-figma-dev-export-*.css`。若写明 **【页面】耗材** / **【页面】/consumables** / **consumer 耗材**，则走 **耗材** 入库与 C1–C12 覆盖（`consumables-figma-dev-export-*.css`、`reference-consumables-full-alignment.md`）。Home 路径下**须先将**该代码块全文写入 `docs/visual-upgrade/sources/home-figma-dev-export-YYYY-MM-DD.css`（并更新 md 索引）**再改 token**；**数值以 CSS 为准**，**范围须覆盖全页主要块**（建议用 `reference-home-full-alignment.md` 作块清单）；输出 **已入库路径**、**全页块覆盖表**、**CSS→class/token 映射**、token 审计、diff、多视口自测与构建结果。

---

### 整页 Home（可分批贴 CSS 时）

若一次贴不下，可分批发送；**每一批**在代码块前写清区域，例如 `【H5 section-content / Frame 740】`。

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

完整对齐 Home，本批信源（以 CSS 为准时可写区域名，不必 H#）：

【区域】（如 Frame 740 / section-header）

```css
…
```

【禁止】只改单帧漏其它块；禁止猜尺寸。

【输出】CSS→class/token 映射表、token 审计、diff、1920/1024/768 自测、build:skip-check
```

---

### 机器选型页（ProductLine — 整页 / 全元素）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

【页面】机器选型 — ProductLine___（填 1 / 2 / 3 或具体路由名）

按本 Skill 做 **全元素对齐**，**以下 CSS 为唯一信源**（数值仅来自 CSS）。须覆盖 **M1–M12**（见 `reference-machine-selection-full-alignment.md`），并遵守 `figma-machine-selection-layout` Rule；未覆盖块标「待补 CSS」。禁止编造 px。

```css
在此粘贴 Figma Dev / Inspect 导出的 CSS 全文
```

Agent 须先将本围栏全文写入 `docs/visual-upgrade/sources/machine-selection-figma-dev-export-YYYY-MM-DD.css`，并更新 `docs/visual-upgrade/machine-selection-figma-user-dev-css.md`，再改 `figma-tokens-machine-selection.css` / `machine-selection.json` / `machine-selection-figma.css` 等。

【输出】入库路径、全页块覆盖表（M1–M12）、CSS→class/token 映射、token 审计、与 1617/gutter 链一致性、diff、构建
```

### 前台商城登录 `/login`（整页 / 全元素）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

【页面】前台商城登录 — 路由 /login

按本 Skill 做 **与 Figma 一致** 的 **全元素对齐**，**以下 CSS 为唯一信源**（数值仅来自 CSS）。须覆盖 **L1–L8**（见 `reference-login-full-alignment.md`）：整页背景、`.login-container`、Logo、标题/副标题、错误提示、表单项、主按钮、底部注册链接。未覆盖块标「待补 CSS」。禁止编造 px。PC 宽屏若稿为 absolute + 固定卡片则按稿；窄屏用 `@media` 流式。

```css
在此粘贴 Figma Dev / Inspect 导出的 CSS 全文（可含注释帧名）
```

Agent 须先将本围栏全文写入 `docs/visual-upgrade/sources/login-figma-dev-export-YYYY-MM-DD.css`，并更新 `docs/visual-upgrade/login-figma-user-dev-css.md`，再改 `figma-tokens-login.css`（`main.tsx` 已在 `figma-design-tokens.css` 之后加载）与 `Login.css`；主色/画布与 Home、选型一致时复用 `--ff-accent`、`--ff-content-canvas-bg` 等。

【输出】入库路径、全页块覆盖表（L1–L8）、CSS→class/token 映射、token 审计、原生表单说明、diff、1920/480 自测、build:skip-check
```

### 前台 consumer 耗材 `/consumables`（整页 / 全元素）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

【页面】前台 consumer 耗材 — 路由 /consumables（可含 product-line-2 / product-line-3）

按本 Skill 做 **与 Figma 一致** 的 **全元素对齐**，**以下 CSS 为唯一信源**（数值仅来自 CSS）。须覆盖 **C1–C12**（见 `reference-consumables-full-alignment.md`，可按 TSX 微调块名）。**优先不用 Ant Design** 实现稿面可见结构；未覆盖块标「待补 CSS」。禁止编造 px。PC/移动与 Skill「项目布局约定」一致。

```css
在此粘贴 Figma Dev / Inspect 导出的 CSS 全文（可含注释帧名）
```

Agent 须先将本围栏全文写入 `docs/visual-upgrade/sources/consumables-figma-dev-export-YYYY-MM-DD.css`，并更新 `docs/visual-upgrade/consumables-figma-user-dev-css.md`；再更新域 token（`figma-tokens-consumables.css` 或与现有 `consumables-figma.css` 的约定）及 `Consumables` 相关样式与 TSX（逐步移除稿面上的 Ant）。

【输出】入库路径、全页块覆盖表（C1–C12）、Ant 保留/移除清单、CSS→class/token 映射、token 审计、legacy 限域说明、diff、构建
```

### 单块区域（非整页）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

只实现信源涉及的 UI，勿改未提及样式。

【页面】Home / 前台登录 /login / 耗材 /consumables / 机器选型 ProductLine___

【映射】目标 class：___（不确定先写推断）

```css
…
```

【输出】信源每条 → 选择器与 token 名、diff、自测视口
```

### 壳层 / 侧栏 / 顶栏（S1–S6）

```
@.cursor/skills/css-figma-strict-implementation/SKILL.md

【范围】前台壳层 — 侧栏、顶栏、主列背景与衔接（须对照 reference-shell-sidebar-checklist.md 的 S1–S6 交付覆盖表）

【信源】粘贴 Dev CSS 或写明仓库内文件路径（强烈建议同时将全文入库 docs/visual-upgrade/sources/shell-sidebar-figma-dev-export-YYYY-MM-DD.css）

【禁止】nav>li 跳过 ul；300px/303px 等与侧栏宽不一致的魔法数字；Ant Menu 折叠模型代替「一级 + 平铺二级」稿面

【输出】S1–S6 覆盖表、CSS→选择器/token 映射、与 header-layout-fix / legacy 的差异说明、build:skip-check
```
