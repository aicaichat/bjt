# 全站 Figma 基线清单（严格像素级）

> 目标：为“页面-功能-样式”映射和视觉回归提供单一事实源。  
> 状态：已根据现有文档和路由预填；Figma MCP 当前配额受限，部分 node-id 待补。

## 1) 全局验收参数

| 项 | 值 |
|---|---|
| 基准桌面视口 | `1920 x 1080` |
| 基准笔电视口 | `1440 x 900` |
| 平板视口 | `1024 x 768` |
| 移动端视口 | `375 x 812` |
| 像素误差阈值 | 关键区域 <= 1px（严格） |
| 叠图标准 | 100% 缩放、动画关闭、同一 DPR（1x） |

## 2) Figma 文件基线

| 项 | 值 |
|---|---|
| 文件名 | 丙甲UI |
| 文件链接 | https://www.figma.com/design/QluTLuKXbauHIiCN8AZUGJ/%E4%B8%99%E7%94%B2UI?m=dev |
| fileKey | `QluTLuKXbauHIiCN8AZUGJ` |
| 当前已知节点 | 见 §3 表格（与 `frontend/src/figma-tokens/machine-selection.json` 的 `meta` 同步） |
| MCP 状态 | `whoami` 可用；批量拉 metadata 可能受配额限制，node-id 以仓库 JSON / 手工链接为准 |

## 3) 页面到 Figma 节点映射（首版）

| 页面 | 路由 | Figma Page | Figma Frame | node-id | 备注 |
|---|---|---|---|---|---|
| Home | `/` | TODO | TODO | TODO | 对应 `docs/screenshots/home-frame529-reference-2026.png` |
| Machines 首页 | `/machines` | TODO | TODO | TODO | 与 product-line 页面拆分验收；Playwright 基线 `machines-index.png`（见 `visual-regression.spec.ts`） |
| Machine Selection P1 | `/machines/product-line-1` | page-id `2443:17459`（proto 链接内） | 机器列表主 Frame | `2679:22612` | `machineCardFrameNodeId`；`startingPointNodeId` `2679:24930`；`MACHINE_SELECTION_FIGMA_ALIGNMENT_PLAN.md` |
| Machine Selection P2 | `/machines/product-line-2` | TODO | TODO | TODO | 与 P1 同框架 |
| Machine Selection P3 | `/machines/product-line-3` | TODO | TODO | TODO | 与 P1 同框架 |
| Consumables | `/consumables` | TODO | TODO | TODO | 需拆产品线版本 |
| Consumables P2 | `/consumables/product-line-2` | TODO | TODO | TODO | - |
| Consumables P3 | `/consumables/product-line-3` | TODO | TODO | TODO | - |
| Spare Parts | `/spare-parts` | TODO | TODO | TODO | - |
| Support | `/support` | TODO | TODO | TODO | - |
| Contact | `/contact` | TODO | TODO | TODO | - |
| Cart | `/cart` | TODO | TODO | TODO | 登录后态验收 |
| Order List | `/orders` | TODO | TODO | TODO | 登录后态验收 |
| Profile | `/profile` | TODO | TODO | TODO | 登录后态验收 |
| Login | `/login` | TODO | TODO | TODO | 公共页 |
| Register | `/register` | TODO | TODO | TODO | 公共页 |
| Admin | `/admin/*` | TODO | TODO | TODO | 后台独立壳层 |

## 4) 当前参考图资产（仓库）

- `docs/screenshots/machine-selection-desktop-1920-full.png`
- `docs/screenshots/machine-selection-figma-reference-layout.png`
- `docs/screenshots/machine-list-row-figma-1491x280.png`
- `docs/screenshots/sidebar-figma-303w.png`
- `docs/screenshots/home-frame529-reference-2026.png`
- `docs/screenshots/home-product-lines-figma-reference.png`
- `docs/screenshots/home-sidebar-frame529-figma-reference.png`
- `docs/screenshots/figma-nav-components-library.png`

## 5) 补全策略（配额恢复后）

1. 使用 Figma MCP `get_metadata(fileKey, nodeId)` 拉取首页级 Page 树。
2. 为每个路由确认唯一验收 Frame（避免一页多稿）。
3. 把 `Figma Page / Frame / node-id` 回填本文件表格并冻结版本。
4. 同步到 `docs/visual-upgrade/page-function-style-mapping.md` 的 `figmaNodeId` 字段。
