# 会话复盘：侧栏 / 顶栏 / 壳层 Figma 对齐（防再犯）

本文档总结前台壳层与侧栏改造中反复出现的问题，并对照项目 **Agent Skill** 与 **Cursor Rule**，便于后续改样式时自查。

- **Skill**：`.cursor/skills/css-figma-strict-implementation/SKILL.md`
- **壳层块清单 S1–S6**：`.cursor/skills/css-figma-strict-implementation/reference-shell-sidebar-checklist.md`
- **Rule**：`.cursor/rules/css-figma-strict-implementation.mdc`

---

## 1. 出现过的问题（归类）

| 类型 | 现象 | 根因（一句话） |
|------|------|----------------|
| **组件模型与稿不一致** | 侧栏像折叠子菜单、与 Figma「一级行 + 平铺二级」不符 | 使用 Ant Design `Menu` / `SubMenu` 的交互模型代替稿面结构 |
| **选择器与 DOM 脱节（Ant 时代）** | 侧栏样式「差很多」、规则像没生效 | CSS 假设的层级与真实 DOM（如 `ul.ant-menu` 下直接 `li`）不一致 |
| **选择器与 DOM 脱节（去 Ant 后）** | 图标、标题、chevron 分行、整列散架 | 写成 `nav > li`，实际为 `nav > ul > li`，子选择器 `>` 全部不匹配，`display: flex` 等未生效 |
| **全局 legacy 与稿冲突** | 顶栏相对侧栏错位、高度不对 | `header-layout-fix.css` 等写死 `300px` / `60px`，与稿面侧栏 `303px`、顶栏 `68px` 及变量不同源 |
| **多层底色** | 主列灰底边缘透出白、像叠了两层背景 | 主列背景未在壳根统一铺全；`flex` 未铺满时底层白色露出 |
| **按钮尺寸** | 按钮偏大偏小、与稿不一致 | 沿用 Ant `Button` 默认 `size` / padding，未按信源或 token 覆盖 |

---

## 2. 对照 Skill / Rule：如何避免再犯

### 2.1 禁止用「组件默认值」代替 Figma（含 Button）

- **Skill 硬规则**：间距、圆角、字号、行高、宽高等须能从**唯一信源**推出；禁止用常见组件默认值或记忆中的尺寸替代。
- **做法**：顶栏按钮、主按钮等从 **Figma Dev / Inspect** 或已入库的 `docs/visual-upgrade/sources/*-figma-dev-export-*.css` 取数 → 写入 **`figma-tokens-*.css`**，页面侧使用 **`var(--*)`** → 在 **`.figma-front`**（或对应 `--figma` 根）下覆盖，而非「Ant 默认差不多」。

### 2.2 改结构后必须「验 DOM 再写选择器」

- 与 Skill 中「映射到真实 class / 结构」一致：**选择器必须匹配真实父子关系**。
- **做法**：从 Ant 改为原生（或任何结构变更）后，在 DevTools 确认：`nav` 的直接子节点是 `ul` 还是 `li`？**存在 `ul` 时不得使用 `nav > li`。** 改完后确认关键 `li` 是否命中 `display: flex` 等规则。

### 2.3 侧栏 / 顶栏 / 主列：布局数字同源

- Skill 要求数值来自信源；**多文件各写一套 magic number** 等于没有单一信源。
- **做法**：侧栏宽、顶栏 `left` / `width`、顶栏高度等与布局相关的量，统一为 **同一组 CSS 变量**（例如 `--bjt-sidebar-width`、`--bjt-sidebar-effective-width`、`--ff-site-header-height`）。新增稿面尺寸时 **先加 token，再引用**，避免再次出现 300px 与 303px 混用。

### 2.4 多层底色：壳根当作整块「画布」

- **做法**：在 **`.figma-front`**（或项目约定的前台根）上铺设 **`var(--ff-content-canvas-bg)`**（或信源中的画布色），并核对 `body` / `#root` 是否与稿一致。参见 `frontend/src/styles/figma-front-shell.css` 中的注释说明。

### 2.5 Legacy 全局样式：限域，避免误伤 Figma 页

- **Rule 第 4 点**：检查 `*.override.css`、全局 `index.css` 等；使用 **更高特异性** 或 **`:not(.home-page--figma)` / `.*--figma`** 等限定作用域。
- **做法**：前台 Figma 壳用 **`.figma-front`** 承接覆盖；稿面 token 应能覆盖 `header-layout-fix.css` 中的固定像素，避免全局文件成为「唯一真相」。

### 2.6 大改导航或壳层：用块清单防漏

- Skill：**全页对齐**须对照 **Home H1–H13** / **机器选型 M1–M12**；无 reference 时从 TSX **自建块表**。
- **做法**：改动「侧栏 + 顶栏 + 主列」时至少覆盖：**侧栏导航、顶栏工具区、主区顶距、背景画布、关键按钮**；信源未写的块须标注 **「信源未覆盖」**，**禁止对未覆盖块编造新 px**（Skill 明确要求）。

### 2.7 Dev CSS 先入库再改 token

- Skill：**Home / 机器选型** 要求先将粘贴的 CSS 写入 `docs/visual-upgrade/sources/...` 并更新对应 md 索引，再改 token 与页面。
- **做法**：若侧栏或壳层有独立 Dev 导出，建议同样 **入库 `sources/` + 索引**，避免规格仅存在于聊天记录、无法逐行核对。

---

## 3. 改样式前短检查单

1. **信源是谁？**（粘贴 CSS / 仓库路径 / Figma 节点）— Skill「必须先明确」  
2. **本次改哪些块？**（TSX 结构 + H1–H13 / M1–M12 或自建块表）— 防只改局部漏全局  
3. **数字是否进 token？** 页面 CSS 是否以 **`var(--*)` / `calc()`** 为主 — Skill 硬规则  
4. **DevTools 中 DOM 父子关系** 是否与 CSS 里的 **`>`** 一致？  
5. **侧栏宽、顶栏 offset / 高度** 是否共用同一套变量？  
6. **`.figma-front` 画布背景** 是否铺满、是否仍露白底？  
7. **Ant 等 UI 库组件** 是否仍用默认高度 / padding 冒充稿面？必要时是否在 **`.figma-front`** 下按信源覆盖？  
8. **交付前**：过一遍 Skill 回复中的自检项（入库路径、覆盖表、构建如 `npm run build:skip-check` 等）

---

## 4. 侧栏 DOM 约定（备忘）

当前侧栏导航为原生结构，样式选择器须针对 **`ul` 下的 `li`**，例如：

```text
nav.sidebar-figma-nav
  └── ul.sidebar-figma-nav__list
        └── li.sidebar-figma-nav__item
```

**错误示例**：`.sidebar-figma-nav > .sidebar-figma-nav__item`（跳过 `ul`，永不匹配）  
**正确示例**：`.sidebar-figma-nav__list > .sidebar-figma-nav__item`

---

## 5. 相关文件（便于跳转）

| 用途 | 路径 |
|------|------|
| 前台壳层、顶栏与侧栏变量覆盖 | `frontend/src/styles/figma-front-shell.css` |
| 侧栏 Figma 样式 | `frontend/src/styles/sidebar-figma.css` |
| 侧栏组件 | `frontend/src/components/layout/Sidebar.tsx` |
| 主布局 | `frontend/src/components/layout/MainLayout.tsx` |
| 历史头部固定布局（易被稿面覆盖） | `frontend/src/styles/header-layout-fix.css` |
| Home Dev CSS 入库示例 | `docs/visual-upgrade/sources/home-figma-dev-export-2026-04-12.css` |

---

*文档版本：与 `css-figma-strict-implementation` Skill / Rule 对齐；若 Skill 更新流程，请同步修订本节对照关系。*
