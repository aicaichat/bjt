# Figma Variables → 单一 Tokens → 组件只读：最佳实践

本文约定 **设计到代码** 的数据流与实现纪律，目标：**稿面可验收、可回归、少「万能 flex」带来的比例漂移**。

---

## 1. 原则（必须遵守）

| 原则 | 说明 |
|------|------|
| **单一数据源** | 颜色、间距、定宽定高、圆角、字阶等 **以 Figma Variables（或 Dev Mode 标注）为真**；进入代码时只落在 **一份 tokens 定义** 中。 |
| **组件只读 token** | React/TSX 与业务 CSS **不手写魔法数字**（无 `212px`、`#012583` 等散落）；一律 `var(--…)` 或从已封装的 token 模块读取。 |
| **定稿模块用定寸** | Figma 对某 Frame 给了 **固定宽高**（如 Frame 205：`288×212`）时，实现侧用 **token + `flex: 0 0` / 固定 `width|height`**，**禁止**用 `flex: 1` + `max-width`「猜」成接近稿。 |
| **flex 只用于稿允许的布局** | `flex`/`grid` 可用于 **Auto layout 方向、对齐、gap 与「剩余空间」**；若稿面是 **px 级分栏**（如 288 \| 中间 \| 321），则 **各栏宽度来自 token**，中间列才可 `flex: 1 1 auto; min-width: 0`。 |

---

## 2. 数据流（推荐顺序）

```
Figma Variables / 命名样式
        ↓
  （导出或手工同步）
        ↓
  单一 tokens 载体（二选一为主副本，另一份必须跟跑）
        ↓
  运行时 CSS 自定义属性 :root { --ff-… }
        ↓
  页面/组件样式只引用 var(--ff-…)
```

### 2.1 本仓库中的载体（现状）

| 层级 | 文件 | 职责 |
|------|------|------|
| 全站 | `frontend/src/styles/figma-design-tokens.css` | 全局 `--ff-*`：画布、主色、字体、顶栏/侧栏共用变量。 |
| 页面域 | `frontend/src/styles/figma-tokens-machine-selection.css` | 机器选型等 **域内** `--ff-ms-*`；**与 JSON 同源**。 |
| 机器选型 JSON | `frontend/src/figma-tokens/machine-selection.json` | 可与 Tokens Studio / 脚本对齐；**与上表 CSS 含义一致**。 |
| 叠图与覆盖 | `frontend/src/styles/machine-selection-figma.css` | **仅布局/选择器/特异性**；数值仍来自 `var(--ff-ms-*)`，避免再写死。 |

**加载顺序**（已固定在 `frontend/src/main.tsx`）：`figma-design-tokens.css` → `figma-tokens-*.css` → `index.css`（Tailwind）→ `machine-selection-figma.css`。  
新增域级 tokens 时 **沿用此顺序**，且 **页面覆盖层始终在 Tailwind 之后**，避免 utility 盖掉定稿尺寸。

### 2.2 谁算「主副本」

- **改稿时**：在 **Figma** 更新 Variables → 更新 **JSON 或 CSS 其一作为主副本** → **另一份同步** → 再检查 `machine-selection-figma.css` 是否仍只有 `var()`。
- 若启用 `scripts/figma-sync.js` 等自动化，**以脚本输出为准**时，需在 PR 说明中写清 **fileKey / 节点**，避免静默漂移。

---

## 3. 命名约定

- **全局**：`--ff-` 前缀（Figma Front / 全站）。
- **机器选型域**：`--ff-ms-`；与 JSON 字段对应时用 **camelCase → kebab** 映射在文档或注释中说明。
- **页面局部别名**（如 `--ms-page-gutter`）仅当 **明确等于** 某一 `--ff-ms-*` 时使用 `var(--ff-ms-page-gutter)` 引用，**不在组件内再定义第二套数值**。

---

## 4. 定宽模块 vs「万能 flex」

### 4.1 必须使用 token + 固定尺寸的典型情况

- Figma Dev 导出中出现 **明确 `width` / `height`**（如 Frame 205 `288×212`、右栏 `321px`、缩略 `68×68`、主图 `212×212`）。
- 列表行内 **多列并排且稿面给的是 px 列宽**，而非「Fill container」百分比。

**推荐写法示例（语义）：**

```css
.ms-figma-widget {
  width: var(--ff-ms-air-gallery-track-width);
  height: var(--ff-ms-air-gallery-frame-height);
  gap: var(--ff-ms-air-gallery-main-gap);
}
.ms-figma-widget__main {
  flex: 0 0 var(--ff-ms-air-gallery-main);
  width: var(--ff-ms-air-gallery-main);
  height: var(--ff-ms-air-gallery-main);
}
```

### 4.2 允许 flex 承担「剩余空间」的情况

- 稿面 **中间列** 为 **Fill**、左右为 **Fixed**：左右用 token 固定，中间 `flex: 1 1 auto; min-width: 0`。
- **仅** 方向、对齐、`gap` 与 Figma Auto layout 一致，**且子项尺寸已由 token 或内容决定**。

### 4.3 反模式（禁止作为默认手段）

- 主图区域 **`flex: 1` + `max-width: 280px`** 代替稿面 **212×212**。
- 用 **`width: 20%` / `60%` / `20%`** 代替稿面 **288px + 321px + 中间自适应**（除非设计文档明确验收百分比布局）。
- 在 **TSX inline style** 或 **Tailwind 任意值** 写死与 Figma 相关的 px/色值（紧急 hotfix 须跟进补 token）。

---

## 5. 组件层（React）纪律

- **禁止**：`style={{ width: 288 }}` 表示设计尺寸（应用 class + token）。
- **允许**：`className` 只表达 **结构/BEM**；尺寸颜色由 CSS 文件中 **`var(--ff-*)`** 完成。
- **共享组件**（如 `ThumbnailGallery`）：默认样式须 **按「带 `machine-gallery` 等修饰符」与 token 对齐**；若多产品线尺寸不同，用 **不同修饰符或 data 属性** 挂不同 token 集，避免一套硬编码伺候所有页面。

---

## 6. 合入前自检清单（PR / 验收）

- [ ] 本次视觉变更涉及的 **Figma Variables** 是否已在 **JSON 或 `figma-tokens-*.css`** 更新？
- [ ] 另一份载体（JSON ↔ CSS）是否已 **同步**？
- [ ] `machine-selection-figma.css`（或其它覆盖层）中 **新增行是否几乎全部为 `var()`**，无新魔法数字？
- [ ] 定稿 Frame 是否对照 **Dev 导出或 Variables**，确认 **未用 flex 替代固定模块尺寸**？
- [ ] `main.tsx` 引入顺序是否仍满足：**tokens → Tailwind → 页面覆盖**？
- [ ] `npm run build:skip-check`（或项目约定构建）通过。

---

## 7. 与现有文档的关系

- 稿面片段存档：`figma-machines-page-css-export-2026-04-12.css`（注释型规格，**非运行时源**）。
- 节点与清单：`figma-node-mapping.md`、`figma-machines-page-alignment-checklist.md`。
- 同步状态与缺口：`figma-sync-status.md`、`figma-gap-analysis.md`。

**本文优先于** 各页面零散注释：若冲突，以 **Figma Variables + 单一 tokens 文件** 为准并修正注释。

---

## 8. 演进建议（可选）

- 将 **全站** 颜色/间距逐步收敛到 **与 Figma Variables 同名** 的 token，减少 `--figma-*` 与 `--ff-*` 两套并行（见 `figma-export-guide.md` 中历史命名）。
- 在 CI 中对 `frontend/src/pages`、`components` 做简单 grep：**禁止新增** `#([0-9a-fA-F]{3,8})\b` 与裸 `\d{2,4}px`（白名单目录除外），作为辅助护栏。

---

*文档版本：与「Figma Variables → 单一 tokens → 组件只读」策略同步维护。*
