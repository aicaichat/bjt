# Figma → 实现（A：token 骨架）

本目录配合 `src/styles/figma-tokens-machine-selection.css` 使用：**设计稿上的数字只在这里维护一份**，页面 CSS 用 `var(--ff-ms-*)` 引用，避免 TSX / 散落的魔法数。

## 1. Figma 里要锁定的内容

1. 打开 Dev Mode，选中 **整页桌面 Frame（宽 1920）**，记下 **node-id**（URL 里 `node-id=…`）。
2. 选中 **单台主机列表卡片 Frame**，记下 **node-id**，填入 `machine-selection.json` → `meta.machineCardFrameNodeId`。
3. 若设计使用 **Variables**：颜色 / 间距 / 圆角 与 JSON/CSS 中的 key 建表对照（见下）。

## 2. 从 Dev Mode 抄到 CSS 的流程（推荐顺序）

对「单卡 Frame」从最外层到内层：

| 顺序 | 在 Figma 看哪里 | 写入位置（CSS 变量） |
|------|-----------------|----------------------|
| 1 | Frame **宽 × 高** | `--ff-ms-card-width`、`--ff-ms-card-height` |
| 2 | **Fill** 背景色 | `--ff-ms-card-bg` |
| 3 | **Corner radius** | `--ff-ms-card-radius` |
| 4 | **Stroke** 颜色 | `--ff-ms-card-border-color`（若与全局边线一致可保留 `var(--ff-border)`） |
| 5 | **Padding**（水平 / 垂直） | `--ff-ms-card-padding-x`、`--ff-ms-card-padding-y` |
| 6 | 内层 **Auto Layout 行** 的 min-width（若稿是定宽） | `--ff-ms-card-row-min-width` |
| 7 | 三列子 Frame 的 **宽度**（% 或固定 px） | `--ff-ms-col-gallery`、`--ff-ms-col-main`、`--ff-ms-col-actions` 及各列 **gap/padding** |
| 8 | 缩略图 **尺寸**、主图区 **高度** | `--ff-ms-gallery-thumb`、`--ff-ms-gallery-main-h` 等 |
| 9 | 标题 / 规格 / 链接 **字体、字号、字重、行高** | `--ff-ms-title-*`、`--ff-ms-spec-*`、`--ff-ms-link-size` |

改完 CSS 后，用同样数值更新 `machine-selection.json`，便于以后用插件 **导出 / diff**。

## 3. 图片与字体

### 图片

1. 在 Figma 选中要导出的节点 → **Export**（列表卡片内图标用 SVG，照片用 PNG 1x + 2x）。
2. 保存到 `frontend/public/figma-assets/machine-selection/`（可自建子目录）。
3. 在 JSON `assets.exportBasePath` 与实现里用统一前缀路径引用。

### 字体

1. Text 图层复制 **字体全名 + 字重**。
2. 在 `index.html` / `@font-face` / Google Fonts 中加载 **同名 web 字体**。
3. 将 `font-family` 写入 `--ff-ms-font-title`（或拆多段：`--ff-ms-font-body` 等），**禁止**仅在 TSX 里写 `font-family: xxx`。

## 4. 验收（1920）

1. 浏览器视口设为 **1920×1080**（或设计稿高度）。
2. Figma 同节点 **导出 PNG**，与页面 **整页截图** 叠图对比（透明度约 50%）。
3. 差异只通过 **调 token** 消除，避免在组件里直接改 px 颜色。

## 5. 与仓库其它文件的关系

| 文件 | 作用 |
|------|------|
| `src/styles/figma-design-tokens.css` | 全站色、侧栏/顶栏等 **全局** token |
| `src/styles/figma-tokens-machine-selection.css` | **仅机器选型**布局与单卡尺寸（本流程 A） |
| `src/styles/machine-selection-figma.css` | 选型页 **组件类**样式；应逐步改为引用 `--ff-ms-*` |
| `machine-selection.json` | 文档化 + 可与 Figma 插件 JSON 对齐 |

## 6. 下一步（可选自动化）

- 使用 **Figma REST API**（Personal Access Token）拉 `files/:key/nodes` 做 **结构校验**（第二期）。
- 使用 **Tokens Studio** 导出 JSON → 小脚本转成 `figma-tokens-machine-selection.css` 片段。

---

## 7. Figma MCP：在「有调用次数限制」下读全信息

目标：**尽量少次调用**，仍覆盖 **布局 + 样式 + 变量 + 资源 + 验收图**。

### 7.1 调用前先做的事（不消耗 MCP）

1. 从 Figma 链接抄 **`fileKey`**（`/design/:fileKey/...`）；若是 branch 链接，按 MCP 说明 **用 `branchKey` 当 fileKey**。
2. 把 URL 里的 `node-id=1699-2614` 转成 MCP 参数 **`1699:2614`**（横杠改冒号）。
3. 在稿子里 **命名并框选**「清单行」Frame：优先 **单台主机卡片** 的顶层 Frame（包含图库 + 规格 + 右侧购买条），作为 **主节点 A**。
4. 可选：再记 **整页 1920 桌面 Frame** 为 **节点 B**（仅当 A 里拿不到全页变量或 A 返回被截断时再用）。

### 7.2 推荐调用顺序（默认 2 次）

| 次序 | 工具 | 选哪个节点 | 目的 | 注意 |
|------|------|------------|------|------|
| **1** | `get_design_context` | **节点 A（单卡 Frame）** | 结构化参考输出、**嵌入式截图**、**资源下载 URL**、子层尺寸/间距线索 | **不要**再为同节点单独调 `get_screenshot`，除非需要更高清导出 |
| **2** | `get_variable_defs` | 仍用 **节点 A**；若返回变量很少，再改用 **节点 B（1920 页）** 作为第二次（算作备用计划，详见 7.4） | 颜色/间距/圆角等 **Variables** 的字典 | 与第 1 次 **互补**：设计上下文偏「怎么画」，变量偏「设计令牌」 |

**原则**：信息最多、最贴近实现的是 **单卡 Frame**；不要用「整站超大 Frame」当第一次，否则易 **体积超限只回 metadata**，反而浪费一次。

### 7.3 单次 `get_design_context` 里要抓全的信息（自检清单）

收到响应后，在本地 **复制保存**（见 7.5），并核对是否已有：

- [ ] 卡片 **宽高、圆角、背景、描边**
- [ ] **Auto Layout**：padding、gap、子层排列方向
- [ ] **文本样式**（字号/字重/行高）— 至少标题、规格标签、链接
- [ ] **图片/图标** 的临时 URL 或资源表 — 及时下载进 `public/figma-assets/`
- [ ] 自带 **截图** — 用于和实现叠图；若模糊再考虑本地 Figma Export（不耗 MCP）

若发现子结构（例如「库存格」）在输出里缺失，**再**对 **子 Frame** 追加第 3 次 `get_design_context`（只对缺失块，避免重复父级）。

### 7.4 若第 2 次变量仍不全

1. 把 `get_variable_defs` 的 `nodeId` 换成 **更上层**：**列表容器** → **1920 页 Frame**。
2. 仍不全：**不继续刷 MCP**；在 Figma **本地打开 Variables 面板** 导出或手抄，与 `machine-selection.json` 对齐（避免为变量耗尽额度）。

### 7.5 必做：把结果落盘，避免重复调用

在仓库建目录（示例）：

`frontend/src/figma-tokens/mcp-snapshots/README.md`（说明日期与节点）

每次 MCP 返回后：

1. 将 **完整回复**（或裁剪后的 JSON / 代码块）保存为  
   `mcp-snapshots/YYYYMMDD-<简短描述>.md`  
2. 把已解析的 token **合并进** `figma-tokens-machine-selection.css` 与 `machine-selection.json`。

之后同事或 CI **只读快照**，无需再占 MCP 配额。

### 7.6 不建议的用法（浪费次数）

- 对**同一 nodeId** 反复调 `get_design_context` + `get_screenshot`（截图一般重复）。
- 未缩小节点就选 **整份 Document** 级 Frame，导致 **输出过大被截断**。
- 在 Cursor 里「试一下」无准备地乱点节点 — 先固定 **节点 A 的 ID** 再调。

按上表 **默认 2 次** 即可覆盖「卡片级」完整信息与变量；**第 3 次及以后** 只补 **明确缺失的子模块**。
