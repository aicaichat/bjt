# 前台 consumer 耗材 — Figma Dev Mode CSS 信源索引

**路由**：`/consumables`  
**实现**：`frontend/src/pages/Consumables/index.tsx`、`frontend/src/styles/consumables-figma.css`  
**域 token**：`frontend/src/styles/figma-tokens-consumables.css`（在 `main.tsx` 中于 `consumables-figma.css` 之前加载）

**状态**：用户于 **2026-04-13** 再次提供 **Figma Dev 全文导出** 并作为唯一信源；按帧摘录已入库 `2026-04-13.css`。侧栏 Frame 1013、顶栏 Frame 17 与整站壳层一致；本页自 **Frame 3** 灰画布、**Frame 221** 白筛选卡、**Frame 175/207/287/245** 等子帧在 `consumables-figma.css` 中实现。

## 已入库文件

- [`sources/consumables-figma-dev-export-2026-04-13.css`](sources/consumables-figma-dev-export-2026-04-13.css) — 自用户 **2026-04-13** 粘贴全文整理的**按帧数值摘录**（实现与核对用）。
- [`sources/consumables-figma-dev-export-2026-04-13-VERBATIM-README.md`](sources/consumables-figma-dev-export-2026-04-13-VERBATIM-README.md) — 说明全文原文存档方式。
- [`sources/consumables-figma-dev-export-2026-04-12.css`](sources/consumables-figma-dev-export-2026-04-12.css) — **已弃用**，仅保留重定向说明（旧链接指向 `2026-04-13.css`）。

**块枚举防漏**：`.cursor/skills/css-figma-strict-implementation/reference-consumables-full-alignment.md`（C1–C12）。

### Ant 技术债（本回合）

- **保留**：`Modal`、`Tooltip`、`Spin`（加载态由 `LoadingState` 外包）、`SmartAddToCartButton` 内部若含 Ant 未改。
- **稿面覆盖**：`SmartFilterSelect` 仍为 `antd` `Select`，在 `.consumables-page--figma` 下用 Dev 规格覆盖 `.ant-select-selector`（Frame 391：208×40、边框、圆角）。
- **待原生化**（可选后续）：将型号/厚度等下拉改为原生 `<select>`，与登录页策略一致。
