# 机器选型页 Figma 对齐 — 改造计划

## 1. 文档目的与范围

- **目的**：将「机器选型」相关页面按 Figma 设计实现**可验收、可维护**的视觉对齐，优先保证在约定基准宽度下误差可控（建议 ≤1px 关键区域），再推广断点。
- **首期范围（Phase 1）**：
  - 路由：`/machines/product-line-1` → `ProductLine1Page`
  - 模块：固定面包屑区、主机型号对比卡片（图 + 热点）、筛选区（电压/型号）、主机列表表格、与对比区视觉衔接的周边留白。
- **设计参考**：[Figma 原型 — 丙甲 UI](https://www.figma.com/proto/QluTLuKXbauHIiCN8AZUGJ/%E4%B8%99%E7%94%B2UI?node-id=1699-2614&viewport=145%2C1478%2C0.17&t=TjDsCgF1XUJvsddR-1&scaling=scale-down-width&content-scaling=fixed&starting-point-node-id=1990%3A4060&page-id=0%3A1)（实施前需在 Figma 中锁定**具体 Frame 名称**与**节点 ID**，写入本文档第 9 节；功能范围对照见第 3 节。）

**不在首期范围（可列 Phase 2）**：`/machines` 入口页、`ProductLine2/3Page`、配件多级区块、全站主题 token 大一统（可与本期并行设计，但不阻塞首期交付）。

---

## 2. 当前基线（已落实）

| 项 | 说明 |
|----|------|
| 样式冲突 | 已从 `App.tsx` 移除全局 `machine-compare-vertical-override.css`，避免与选型页互相覆盖。 |
| 对比区样式 | `machine-compare-alignment.css` 已改为**类名选择器**（`.machine-comparison-container` / `-image-container` / `-image`），并用 CSS 变量集中可调参数。 |
| 对比图配置 API | **`machine-model-compare`**：GET 按产品线读 `diagram_url`；PUT（需 BJT 鉴权）写入/清空。配置存 WordPress 选项 `bjt_machine_model_compare_urls`。`ProductLine1Page` 已对接 GET。 |
| 页面引入 | `ProductLine1Page.tsx` 已 `import '../../styles/machine-compare-alignment.css'`。 |

**遗留风险**：`ProductLine1Page.tsx` 内仍有大量 **inline style**（面包屑、热点 `left/top/width/height` 等），与 Figma 像素对齐时需在「CSS 变量 / 类名 / 少量 inline」之间统一策略，避免双重来源。

---

## 3. 功能差异对照（当前实现 vs Figma）

本节用于**并行**做两件事：视觉对齐 + **交互/流程/数据范围**对齐。下表「Figma / PRD」列须由设计或产品在 Figma 原型、用户故事或评审纪要中**逐条填写**（有/无/不同）。实现侧描述依据 `frontend/src/pages/Machines/ProductLine1Page.tsx`（截至文档编写时）。

### 3.1 当前实现 — 功能清单（摘要）

| 模块 | 行为摘要 |
|------|----------|
| 路由与产品线 | 固定 `category = '1'`（产品线 1 / 气垫机），不随 URL 变化；与通用 `/machines?category=` 入口页分离。 |
| 固定面包屑条 | `position: fixed`；「产品线」调用 `history.back()`；当前产品线文案来自 i18n（如 `productLines.airCushion`）；选中主机后出现 Host 标签、可点击清空选型；未选/已选配件时路径与右侧状态文案联动。 |
| 主机对比区 | **仅当未选中主机**时展示；**示意图 URL** 由 `GET /bjt/v1/machine-model-compare?product_line_id={产品线}` 提供，未配置时前端回退 `DEFAULT_COMPARE_DIAGRAM`（`/static/machine-model-compare-table.png`）。**单张对比表图，无热点**；选型在下方主机列表完成。 |
| 筛选（页面上可见） | **电压**（`Select`）、**型号**（`filterType`，选项来自 `modelOptions`，与 `hostModels`/机器数据相关）。 |
| 筛选（状态存在但无 UI） | `filterRegion` 参与列表缓存 key、列表与配件 API 的 `region` 查询参数，但页面**无地区选择控件**，默认多为空字符串（由后端或用户 `user.region` 间接影响展示/价格货币等）。 |
| 主机列表呈现 | **`renderMachinesTable` 为卡片栅格**，非 Ant Design `Table`；每台机包含 `ThumbnailGallery`（主图 + 缩略图）、**单选 radio**、规格字段网格、**规格 PDF**（按 `hostModels` 多策略匹配后 `window.open`）、**更多信息**（`Tooltip`）、价格（取 `prices[0].tiers[0].base_price`）、**销售角色**下多区域库存 `Tag`、`InputNumber` 数量、`SmartAddToCartButton`。 |
| 选中主机后 | 对比区**整体隐藏**；列表仅保留**当前选中**一台；区块标题由「主机选择」变为「配件选择」。 |
| 分页 | 请求使用 `currentPage` / `pageSize`（默认 10），但页面**未发现分页器 UI**，用户无法直接翻页（若总数超过一页，行为需与 Figma/产品确认是否属缺陷）。 |
| 配件（Level 1–5） | 存在 `#accessory-level-1` … `-5` 容器，默认 `display: 'none'`；通过脚本查找 DOM 控制显示，内含配件卡片、路径、`SmartAddToCart` 等；与主机、语言、`filterRegion`、电压过滤逻辑耦合。 |
| 权限与购物车 | `hasPermission` 恒为 `true`；`canAddToCart` 恒为 `true`（`disabled` 与「无权限」文案实际不可达）；库存仅 `admin`/`sales` 可见。 |
| 其它 | `MockServiceStatus` 为 `hidden`；`useNavigationHistory` 记录访问；支持语言切换后部分数据重载。 |

### 3.2 差异登记表（请填写 Figma 列）

| # | 能力项 | 当前实现 | Figma / PRD（待填） | 差异类型 | 处理建议 |
|---|--------|----------|---------------------|----------|----------|
| F1 | 入口与产品线切换 | 本页锁定产品线 1；返回依赖浏览器历史 | | 待确认 | 若设计为「站内产品线切换」需改路由或导航，避免仅用 `back()` |
| F2 | 未选主机时的选型方式 | **对比示意图无热点** + 列表选机 | **永不要求热点图** | 一致 | 仅示意图 + 文案提示；选型在列表 / 配件链 |
| F3 | 对比图与数据一致性 | 热点绑定当前筛选后的列表顺序前 3 条 | | 待确认 | 若设计与「固定 SKU 位」不一致，需按 part number 映射而非 index |
| F4 | 筛选维度 | 电压 + 型号 + 产品类型；类型/型号选项来自 **host-models**（`type` / `model`），列表筛选走 **machineparts** `model` / `model_type` / `voltage` | **同左**（2026-04-07 产品确认：选项来自后端 API） | 一致 | `host-models` 已支持 `product_line_id`；`machineparts` 已支持 `model_type`（`hm.type`） |
| F5 | 列表形态 | 大卡片 + 图库 + 多按钮 | Figma 卡片一行：标题行 + 规格网格 + 库存 + 加购 | 持续对齐 CSS | 标题行：**型号 + PN pill + Show Optional Accessories 同行**；规格顺序对齐 Figma |
| F6 | 分页与加载更多 | 后端分页 + **Pagination**（每页 10/20/50，条数展示） | **需要 Figma 式分页** | 已落实 | 去掉破坏分页的本地全量缓存；筛选变更重置第 1 页 |
| F7 | 价格与库存展示 | 单一 tier 基础价；库存仅销售可见 | | 待确认 | 对照 Figma 是否含阶梯价、起订量、各角色可见性 |
| F8 | 加购流程 | 数量步进 + `SmartAddToCartButton` | | 待确认 | 核对是否需「立即购买」、询价、禁用条件等 |
| F9 | 规格与文档 | PDF 打开新窗；无则 Toast | | 待确认 | 设计若内嵌预览/下载列表，需改交互 |
| F10 | 选中主机后布局 | 对比区消失、列表缩为单机 | | 待确认 | 若设计保留对比或并排配件，需改状态机 |
| F11 | 配件层级与导航 | 最多 5 级；DOM 显隐驱动 | | 待确认 | 若设计为单页 Stepper/抽屉，需重构交互而非只改样式 |
| F12 | 面包屑语义 | 「产品线」= 后退；非真实路由栈 | | 待确认 | 若设计为可分享深链路径，需改用 `navigate` + 明确 URL |

**差异类型说明**：`一致` / `缺失（实现无）` / `多余（实现有设计无）` / `行为不一致` / `待确认`。

### 3.3 建议 workflow

1. 产品/设计在 Figma 原型上列出**可点击元素清单**与**每个状态的界面**（未选主机 / 已选主机 / 配件各级）。  
2. 将上表 **Figma / PRD** 列填为：`有，与实现同` / `有，不同：…` / `无`。  
3. 开发按「差异类型」拆 issue：**纯视觉**走 token + CSS；**流程/结构**走组件与状态重构（不可强行用样式伪装）。

---

## 4. 设计令牌（Tokens）策略

在 Figma 中导出或抄录以下值，映射到实现层（优先复用 `theme.css` 已有变量，缺失则先挂在 `.machines-page` 或专用 `machines-selection.css` 的 `:root` / 区块根上）。

| 类别 | 示例 | 落地建议 |
|------|------|----------|
| 颜色 | 主色、中性灰、边框、成功/警告文案色 | 与 BJT 主题对齐，避免硬编码散落 |
| 间距 | 4/8 网格、卡片 padding、区块间距 | 对比区已与 `--mc-*` 起步，可扩展 `--ms-section-gap` 等 |
| 圆角 / 阴影 | 卡片、图、按钮、下拉 | 与 Figma 一一对应命名 |
| 字体 | 字号、行高、字重 | 确认与全局 `font-family` 一致，避免行高偏差 |
| 布局 | 内容最大宽、与侧栏/顶栏的左边距 | 与 `MainLayout`、固定面包屑的 `left/top` 一并校准 |

---

## 5. 分阶段实施计划

### Phase 1A — 设计冻结与基准（0.5～1 天）

1. 在 Figma 选定**验收 Frame**（桌面基准宽度 **1920px**）。
2. 导出该 Frame **1x PNG**（或 Dev Mode 量纲截图）作为叠图基准。
3. 填写本文档 **§9 设计对照表**（节点 ID、Frame 名、基准宽度）。

### Phase 1B — 对比选择区像素对齐（1～2 天）

1. 按 Figma 调整 `machine-compare-alignment.css` 中已有变量：`--mc-container-max-width`、`--mc-image-max-width`、`--mc-image-height`、圆角、阴影、边框、标题 `font-size`/`line-height`/`margin`。
2. 热点区域：当前为 `left: 20 + index*180` 等硬编码；若设计图为固定三列，改为 **百分比或 CSS 变量**（与图片实际显示区域联动），必要时用 `ResizeObserver` + 与 `object-fit: contain` 一致的**内容框计算**（进阶项，见 §7）。
3. 右上角提示文案：样式已由 `.machine-comparison-image-container > div:last-child` 控制；若 DOM 顺序变化，改为**独立 class**（如 `machine-comparison-hint`）避免脆弱选择器。

### Phase 1C — 筛选条与列表区（1～2 天）

1. 对齐筛选区容器：`rounded-lg shadow-md p-4` 等与 Figma 卡片规范统一（padding、标题 `text-xl`、表单项间距 `gap`）。
2. Ant Design `Select`：高度、边框色、hover、focus ring 与 Figma 一致（可用 `ConfigProvider` 局部主题或 class 覆盖）。
3. `renderMachinesTable` 当前为**卡片列表**（非 Ant `Table`）：须与 Figma 核对若设计为表格式，则需结构调整；若仍为卡片，则统一卡片内图库、按钮区、价格区与 Figma 一致。

### Phase 1D — 固定面包屑与整页留白（1～2 天）

1. 固定定位条：`top: 80px`、`left: 280px` 等与 **MainLayout 侧栏实际宽度**一致；用变量或从 layout 组件读取，避免改侧栏后选型页错位。
2. 占位 `height: 150px` 与真实面包屑高度同步（内容换行时不变形）。
3. 整页 `machines-page` 背景与内容区最大宽与 Figma 一致。

### Phase 1E — 验收与回归（0.5～1 天）

1. 浏览器叠图（§6）在基准宽度下通过。
2. 抽测 1024 / 768 / 375：允许非关键区 ±2px，但不可出现截断、重叠、热点不可点。
3. 记录 before/after 截图路径（可放 `docs/screenshots/` 或团队约定目录）。

---

## 6. 像素级验收方法（强制执行）

1. **叠图**：Chrome 插件或半透明 PNG 浮层，透明度约 50%，对齐页面左上与内容宽；**视口宽度 1920px**（与 §9 基准一致）。
2. **关闭动画**：验收时临时关闭 `transform` 微动效，避免误判 1px。
3. **缩放**：浏览器缩放 100%，系统缩放与 Figma export 倍数一致。
4. **清单**：按模块勾选 §8 检查表；功能行为勾选 §3.2 差异登记表。

---

## 7. 技术债与可选增强

| 项 | 说明 |
|----|------|
| 对比图资源 | 默认使用仓库内 Figma 导出 PNG；`machine-compare-alignment.css` 按 `max-height` + `object-fit: contain` 保留原图比例。 |
| `machine-compare-vertical-override.css` | 已不全局引入；若产品仍要竖版布局，改为**仅在该路由或 feature flag 下按需 import**，并写清与横版的互斥关系。 |
| 大文件 `ProductLine1Page.tsx` | 长期建议拆分为 `MachineComparisonSection`、`MachineBreadcrumbBar`、`MachineFilters` 等，利于评审与样式隔离；**首期可在不改结构前提下**先完成视觉对齐。 |

---

## 8. 交付检查表（Phase 1 完成定义）

- [ ] Figma Frame、节点 ID、基准宽度已写入 §9。
- [ ] 对比卡片：外框、内边距、圆角、阴影、边框与 Figma 一致。
- [ ] 对比图：尺寸、背景、内边距、`object-fit` 行为与 Figma 一致。
- [ ] 热点：三机型点击区域与图面对齐，选中/hover 态颜色、线宽与 Figma 一致。
- [ ] 对比示意图：后端已配置或确认默认 SVG 与 Figma 资源一致（必要时通过 `machine-model-compare` PUT 上架）。
- [ ] 筛选区：标题、标签、控件宽度与间距与 Figma 一致。
- [ ] 列表区：与 Figma 一致（卡片或表格形态已确认）；关键信息层级、操作入口一致。
- [ ] **功能**：§3.2 差异登记表已填写，「待确认」项均有产品结论或已建 issue。
- [ ] 固定面包屑：与侧栏/顶栏无重叠，滚动时不错位。
- [ ] 响应式：约定断点下无布局崩坏。
- [ ] 无全局样式误伤其他路由（新增样式加 `.machines-page` 或页面根 class 前缀）。

---

## 9. 设计对照表（实施时填写）

| 字段 | 值 |
|------|-----|
| Figma 文件 | [丙甲UI](https://www.figma.com/design/QluTLuKXbauHIiCN8AZUGJ/%E4%B8%99%E7%94%B2UI?m=dev)（fileKey: `QluTLuKXbauHIiCN8AZUGJ`） |
| Dev Mode / 当前节点 | [node `2679-22612`](https://www.figma.com/design/QluTLuKXbauHIiCN8AZUGJ/%E4%B8%99%E7%94%B2UI?node-id=2679-22612&m=dev) |
| Figma 页面名 | （在文件中打开上述节点后补全左侧 Page 名） |
| 验收 Frame 名 | （选中根 Frame 后在右侧面板复制 Frame 名） |
| 节点 ID（node-id） | `2679-22612`（插件 / REST 中常写作 `2679:22612`） |
| 基准宽度（px） | **1920**（叠图与验收统一用此视口宽度） |
| 导出参考图路径 | `docs/screenshots/machine-selection-desktop-1920-full.png`（1920 全页；侧栏 + 顶栏 + 深蓝面包屑 + 机型参数对比表 + Machine Selection + 列表 + 分页） |
| 与设计负责人确认日期 | （待填） |

### 9.1 单条机器列表行（Figma 局部 — 具体怎么展示）

说明**列表里一行机器**的布局，用于和全页参考图 `machine-selection-desktop-1920-full.png` 对照同一区域。

| 项 | 说明 |
|----|------|
| 参考截图 | `docs/screenshots/machine-list-row-figma-1491x280.png` |
| Figma 选中框尺寸 | **1491 × 280 px**（主内容区单行宽度语境；实现为响应式流式布局，验收时以对齐、间距、字级与 Figma 一致为准） |
| 左区 | 左侧竖排缩略图 + 右侧主图；浅灰描边与内边距与整卡一致 |
| 中左区 | **标题行**：机型名（粗体）+ **PN** 圆角浅灰底徽标 + 右上 **Show Optional Accessories**（链接色） |
| 中左区下方 | **规格网格**（多行键值，小号灰色标签）；常见项：Item / Packaging / Qty per Carton / Pallet / Voltage / Packs per Pallet / 包装尺寸等 |
| 中左区底栏 | **More Info**（浅蓝底按钮 + 信息图标）+ 蓝字链：**View Detailed Specifications** / **Introduction** / **Film Options** |
| 右中区 | **Stock Status** 面板：浅蓝 tint 底；**Total Stock**；**2×2** 区域仓库存（有货绿字、无货红字） |
| 最右 | 数量 **− / +** 与 **Add to Cart**（深蓝底、白字、购物车图标） |
| 实现映射 | `ProductLine1Page.tsx` → `renderMachinesTable` → `.ms-figma-machine-card`；图库为 `ThumbnailGallery`（`layout="thumbnails-left"`），样式见 `machine-selection-figma.css` 等 |

**验收提示**：该行外框为细浅灰边框；中区在图库与库存/购物车之间**弹性占满**剩余宽度，与 Figma 四段横向分区一致。

### 9.2 侧面导航栏（Figma 局部）

| 项 | 说明 |
|----|------|
| 参考截图 | `docs/screenshots/sidebar-figma-303w.png` |
| Figma 框尺寸 | 约 **303 × 1123 px**（高度随视口滚动；**固定宽 303**） |
| 背景 | `#FFFFFF`，Logo 区与菜单区之间 **浅灰分割线**（约 `#EEEEEE`） |
| 一级项 | **海军蓝**粗体主色（设计稿常见 `#002D72` 量级）、左侧图标同色；**Chevron** 表折叠；点击为手风琴展开子项 |
| 二级项 | **中灰**文案（约 `#666666`），相对一级**明显缩进**（约 40–48px 视觉-indent） |
| 纵向节奏 | 一级之间约 **32px** 级距感；子项之间约 **16–20px**（实现中为 Ant Design Menu + 自定义 margin/padding，可再微调叠图） |
| 结构 | Home；Air cushion / Paper / Water tape 等 **可展开分组**；Air Column；Support（多子链）；Contact Us — 与 `Sidebar.tsx` 中 `navItems` + `simpleDropdown` 对应 |
| 代码宽度 | `.figma-front` 定义 **`--bjt-sidebar-width: 303px`**；侧栏 `sidebar-figma.css`、主区 `MainLayout` `ml-[var(--bjt-sidebar-width)]`、固定顶栏 `header-layout-fix` / `sidebar-functional-fix` 均须使用该变量，避免与 **280px** 混用错位 |

### 9.3 导航栏组件库（一级 / 二级 / 状态）— 如何导出 & MCP

**仓库内参考整图（你提供的组件画板截图）**：`docs/screenshots/figma-nav-components-library.png`（含「导航栏组件」：默认 / Hover / Active、分组展开、二级选中海军底等；标注色常见为 **`#002D88`**，实现时以 Dev Mode 拷贝为准）。

#### 在 Figma 里「比较好」的手动导出（推荐给研发归档）

1. **按 Frame 导出 PNG（叠图 / 验收）**  
   - 选中根 Frame「导航栏组件」或单个子组件 Frame → 右侧面板 **Export** → 加 **1x**（必要时再加 **2x** 供高清屏）。  
   - 命名规则示例：`nav-primary-default.png`、`nav-submenu-expanded.png`，与组件名一致，放入仓库 `docs/screenshots/figma-export/nav/`（团队约定即可）。

2. **逐组件导出（完整资产包）**  
   - 在图层面板多选多个组件 → 右下角 Export 会按层各自导出（或使用插件 **Export Kit** / **Batch export** 类插件批量）。  
   - SVG：仅适合图标；导航整块一般是 **PNG** 或 **PDF**（给评审），不要强行走 SVG。

3. **Token / 色值 / 间距**  
   - **Dev Mode** 点选图层 → 复制 CSS 或间距；若文件使用 **Variables**，在菜单 **Variables** 中导出或让设计导出 CSV/JSON（与 `figma-front-shell.css` / `sidebar-figma.css` 中 `--sd-*`、`--ff-*` 对齐）。

4. **给开发的「一条链接」**  
   - 对每个验收 Frame 复制带 `node-id` 的链接（与 §9 表格一致），便于 MCP 或人工打开同一节点。

#### Cursor 里 Figma MCP 能做什么（自动化「导出」含义）

已配置的官方 **Figma MCP**（`user-Figma`）典型能力包括：

| 能力 | 说明 |
|------|------|
| `get_design_context` | **首选**：指定 `fileKey` + `nodeId`（URL 里 `node-id=2679-22612` → `2679:22612`）返回结构/提示，常带截图与实现参考。 |
| `get_screenshot` | 对**单个节点**生成截图（等同远程导出一张 PNG 用于归档）。 |
| `get_metadata` | 列出某页/节点下子树 XML，用于先扫 Frame 名再对每个子节点调用上面两项。 |

**限制（本会话实测）**：即使用户在 Figma 内为 **Professional / Full** 等席位，`get_metadata` 仍可能返回 **MCP 工具调用额度**相关错误（文案里甚至可能写「Starter」——以 Figma 当时返回为准）。**MCP 配额与「专业版能否编辑文件」未必同一套计费**，若需大批量 `get_screenshot` / `get_metadata`，请到 [Figma 账户与计费](https://www.figma.com/) 或团队管理员处确认 **MCP / AI 相关额度**，或隔时段重试。

**本次环境**：MCP 账号已连通，但 `get_metadata` 曾触发上述额度提示，**未在对话内做完整板自动导出**；已用你提供的画板截图落入 `docs/screenshots/figma-nav-components-library.png`，并与 §9.2 宽度说明闭环。额度正常时可在 Cursor 中对各 `nodeId` 连续调用 MCP 做导出。

---

## 10. 相关文件索引

| 路径 | 职责 |
|------|------|
| `frontend/src/pages/Machines/ProductLine1Page.tsx` | 机器选型主页面逻辑与结构 |
| `frontend/src/styles/machine-compare-alignment.css` | 主机型号对比区样式与 `--mc-*` 变量 |
| `frontend/src/App.tsx` | 全局样式入口（避免再引入冲突覆盖） |
| `frontend/src/components/layout/MainLayout.tsx` | 侧栏/内容区布局，面包屑 `left` 需与其一致 |
| `frontend/src/styles/theme.css` | 全站主题与可复用 token |
| `frontend/public/static/machine-model-compare-table.png` | 机型参数对比表**默认**图（Figma 导出；无热点；`machine-model-compare` API 未配置时使用） |
| `plugins/bjt-core-entities/controllers/class-machine-model-compare-controller.php` | 对比图 REST：`/machine-model-compare` |
| `plugins/bjt-core-entities/bjt-product-api.php` | 注册 `BJT_Machine_Model_Compare_Controller`（`backend/wp-content/plugins/...` 目录已同步同文件时可并行部署） |
| `frontend/src/styles/machine-compare-vertical-override.css` | 竖版实验样式，**勿全局 import**，按需使用 |
| `docs/screenshots/machine-selection-desktop-1920-full.png` | 1920 全页验收 / 叠图基准截图（与 §9 同源） |
| `docs/screenshots/machine-list-row-figma-1491x280.png` | 单条机器列表行 Figma 局部（§9.1，1491×280） |
| `frontend/src/components/ThumbnailGallery.tsx` | 列表行左侧缩略图 + 主图 |
| `docs/screenshots/sidebar-figma-303w.png` | 侧面导航栏 Figma 局部（§9.2，宽 303） |
| `frontend/src/components/layout/Sidebar.tsx` | 前台侧栏数据与 `Menu`；`sidebar--figma` |
| `frontend/src/styles/sidebar-figma.css` | Figma 模式侧栏视觉 |
| `frontend/src/styles/figma-front-shell.css` | `.figma-front` 含 `--bjt-sidebar-width` |
| `docs/screenshots/figma-nav-components-library.png` | 导航栏组件库画板（§9.3；一级/二级/状态） |

---

## 11. 建议排期（可按人力压缩）

| 阶段 | 内容 | 预估 |
|------|------|------|
| 1A | 设计冻结 + 导出基准图 | 0.5～1 d |
| 1B | 对比区 + 热点 | 1～2 d |
| 1C | 筛选 + 列表 | 1～2 d |
| 1D | 面包屑 + 整页留白 | 1～2 d |
| 1E | 叠图验收 + 截图归档 | 0.5～1 d |

**合计**：约 4～8 人日（视 Figma 标注完整度与是否改热点算法而定）。

---

## 12. 版本升级记录

### v3（当前）

| 变更 | 说明 |
|------|------|
| 顶部对比图可配置 | 新增 **`GET/PUT /wp-json/bjt/v1/machine-model-compare`**。GET 公开，`?product_line_id=` 必填；返回 `data.diagram_url`（可为 `null`）。PUT Body（需 BJT 登录）：`{"product_line_id":1,"diagram_url":"/path/or/https://..."}`，`diagram_url` 为 `""` 表示清除该产品线配置。数据键：`bjt_machine_model_compare_urls`。 |
| 前端 | `ProductLine1Page.tsx`：`compareDiagramSrc` 随 `category` 请求上述 GET，相对路径拼 API 站点 origin；失败或未配置时使用 `DEFAULT_COMPARE_DIAGRAM`（`/static/machine-model-compare-table.png`）。 |
| 部署 | 插件路径：`plugins/bjt-core-entities/` 与可选 **`backend/wp-content/plugins/bjt-core-entities/`** 均已加入控制器与 `bjt_api_register_routes` 注册；WordPress 侧更新插件或覆盖文件后无需另建表。 |
| Figma / 列表多图 | 列表卡片 **1 主图 + 3 缩略图** 仍以 `ThumbnailGallery` + 接口字段（`image_url` / `model_image*` 等）为准；若要对齐 Figma **4 张互不重复图**，需在 **`machineparts`（及/或 host-models）响应中保证至少 4 个可用 URL**（见 §3 与后续 backend issue），**不在 v3 自动完成**。 |

### v3.1（交互）

- **`ThumbnailGallery`（`main-with-thumbnails`）**：缩略图点击**仅切换主图**，不再打开大图 Modal；放大仍通过**主图区域**「点击放大」。

### v2

- 增加 §3 功能差异对照表；章节编号顺延。
- 样式：类名化对比区；移除 `App.tsx` 全局 `machine-compare-vertical-override.css`。

### v1

- 初版：范围、分阶段计划、像素验收、文件索引。

---

## 13. 待解决问题与风险清单（审计摘要）

以下基于 `ProductLine1Page`、`machineparts` / `ThumbnailGallery`、`machine-model-compare` 及 Figma 差异表（§3）的**静态代码阅读**结论；实施前建议在联调环境再验证一次网络与数据。

### 13.1 高优先级（功能/正确性）

| # | 问题 | 位置/说明 | 建议 |
|---|------|-----------|------|
| H1 | **`fetchMachines` + `fetchHostModels` 重复订阅** | `ProductLine1Page.tsx` 中至少**两处** `useEffect(..., [category, currentLanguage, filterRegion, selectedVoltage])` 均调用上述函数（约前段与 ~3181 行附近） | **删除重复块，只保留一处**；否则每次依赖变化会**发双倍请求**，易竞态、浪费带宽、加重后端。 |
| H2 | **列表无分页 UI** | ✅ 已加 `Pagination`（`showSizeChanger`、筛选重置页码）；仍依赖 `machineparts` 返回 `total` / `total_pages` | 联调核对 `per_page` 与总条数。 |
| H3 | **`machineparts` 未合并主机型号图** | `class-machine-part-controller.php` 仍为 `SELECT * FROM bjt_parts`，响应里通常**没有**前端映射所期望的 `image1_url` / `host` 多图字段 | 对 `bjt_host_models` **LEFT JOIN**（`model` + `product_line_id`）并返回 `image1_url`、`image2_url`（及计划中的第 3、4 张），或统一输出 **`gallery_image_urls`**；否则列表 **1+3 缩略图**often 重复同一张图。 |
| H4 | **对比图 URL 与热点不同步** | 顶部图改由 API 配置；热点仍为**写死像素**（`left/top/width` + `index*180`） | 换图或比例变化后热点易错位；应用 **百分比/API 元数据** 或设计固定比例资源，并在计划中验收。 |

### 13.2 中优先级（体验 / 与 Figma 差距）

| # | 问题 | 说明 | 建议 |
|---|------|------|------|
| M1 | **缩略图点击行为** | ~~曾与主图同时触发弹层~~ **已对齐**：缩略图仅 `setCurrentImageIndex`；**仅点击主图区**打开 Modal（见 `ThumbnailGallery.tsx`）。 |
| M2 | **多于 3 张 URL 时** | 缩略条只用 `displayImages.slice(0, 3)` | 第 4 张及以后不进缩略条；若业务需 4 槽位需改组件。 |
| M3 | **其它产品线页未接对比图 API** | 检索仅 `ProductLine1Page` 使用 `machine-model-compare` | `ProductLine2Page` / `ProductLine3Page` 若也有顶部对比区，应复用同一请求与 `product_line_id`。 |
| M4 | **`diagram_url` 无后台界面** | 仅 REST PUT + 选项存储 | 需运营/文档说明如何用 Postman 或后续在管理后台加表单项。 |
| M5 | **地区筛选无 UI** | `filterRegion` 参与缓存与配件 API，用户不可选 | 与 §3 一致；有全球化诉求时补控件。 |

### 13.3 低优先级 / 技术债

| # | 问题 | 说明 |
|---|------|------|
| L1 | **TypeScript** | `ProductLine1Page` 等处 `onMouseOver` 使用 `e.target.style`，`EventTarget` 类型报错；应 cast 为 `HTMLButtonElement` 或改用 `currentTarget`。 |
| L2 | **调试 `useEffect`** | `machines` / `hostModels` 仅打 log 的 effect 若上生产会增噪音；可包 `import.meta.env.DEV` 或移除。 |
| L3 | **权限逻辑名存实亡** | `hasPermission`、`canAddToCart` 等恒为 true，与真实角色模型不符。 |
| L4 | **大文件维护** | `ProductLine1Page.tsx` 体量巨大、含重复逻辑，长期应拆组件（§7）。 |
| L5 | **`Machines/index.tsx` 与产品线页** | 通用 `/machines` 与 `product-line-*` 行为不一致时，需在文档中写清用户路径，避免双轨需求遗漏。 |

### 13.4 建议的收尾顺序

1. **立即**：修复 **H1** 重复 `useEffect`。  
2. **短期**：后端 **H3**（多图字段或 `gallery_image_urls`）+ 前端可选消费该数组。  
3. **与产品对齐**：**H2** 分页、**H4** 热点策略、**M1/M2** 图库交互。  
4. **专项**：L1 类型、调试代码清理、多产品线 **M3**。

---

*文档版本：v4.1 | v3.1：`ThumbnailGallery` 缩略图与 Figma 对齐（仅切换主图）；§13 M1 标记已处理。*
