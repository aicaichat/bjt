# 机器选型页 — 全元素块枚举（Figma ↔ 代码）

**用途**：与 Skill `css-figma-strict-implementation` 配合；用户要求 **选型页所有元素** 对齐时，用本表 **防漏块**。**不提供数值**，数值 **只** 来自粘贴的 CSS。

**另须遵守**：布局链、1617 / 40px gutter、1537 内容宽等见项目 Rule [`.cursor/rules/figma-machine-selection-layout.mdc`](../../../.cursor/rules/figma-machine-selection-layout.mdc)，勿与 token 分叉。

## 1. 仓库内主要文件

| 用途 | 路径 |
|------|------|
| 页面（气垫示例） | `frontend/src/pages/Machines/ProductLine1Page.tsx` |
| 其它产品线 | `ProductLine2Page.tsx`、`ProductLine3Page.tsx` |
| 选型叠图样式 | `frontend/src/styles/machine-selection-figma.css` |
| 选型域 token | `frontend/src/styles/figma-tokens-machine-selection.css` |
| JSON 同步（可选） | `frontend/src/figma-tokens/machine-selection.json` |
| 前台壳 / 主列 | `frontend/src/styles/figma-front-shell.css`、`MainLayout.tsx` |
| 全局色 / 顶栏 | `frontend/src/styles/figma-design-tokens.css` |

## 2. 块清单 M1–M12（单卡列表 + 筛选为主；以 ProductLine1 为参考）

| # | 区域说明 | 典型 class / 结构 |
|---|----------|-------------------|
| M1 | 页面根与选型布局 | `.machines-page`、`.ms-product-line-layout` |
| M2 | 主内容列（gutter 内） | `.ms-content-column` |
| M3 | 筛选卡片 | `.ms-filter-card`、`.ms-filter-card__row` 等 |
| M4 | 机器列表容器 | `.ms-figma-machine-grid`、`.figma-exact-content` |
| M5 | 单卡外框 | `.figma-exact-machine-card` |
| M6 | 卡内图库（如 Frame 205） | `.figma-exact-card-gallery`、`ThumbnailGallery` |
| M7 | 卡内主列（标题/规格） | `.ms-figma-machine-card__col-main`、`.ms-figma-product-title-row`、`.ms-figma-spec-grid`、双列规格 `.ms-figma-spec-dual-cols` |
| M8 | 规格区操作 / More info | `.ms-figma-machine-spec-actions`、`.ms-figma-moreinfo*`、`.ms-figma-spec-action-links` |
| M9 | 卡内右侧（价/库存/加购） | `.ms-figma-machine-card__col-actions`、`.ms-figma-purchase-rail`、`.ms-figma-stock-panel`、`.ms-figma-qty-stepper`、`.ms-figma-primary-cart` |
| M10 | 列表分页 | `.ms-figma-pagination-wrap`、`MsFigmaPagination` |
| M11 | 配件卡（若本轮含配件区） | `.ms-figma-accessory-card` 及子列 |
| M12 | 空状态 / 加载 / 错误 | 页面内对应占位卡片（若稿中有独立样式） |

**纸垫 / 其它产品线**：若 DOM 与上表差异大，在覆盖表中 **增行** 说明，仍以 TSX 为准。

## 3. 视口自测

| 视口 | 目的 |
|------|------|
| 1920 | 主列 1617、gutter、单卡三列、分页 |
| ≤1024 / 768 / 480 | 与 `machine-selection-figma.css` 中 `@media` 一致，移动不强制 PC 绝对定位 |

## 4. 全页任务交付物

1. **全页块覆盖表**（M1–M12 逐行：已对齐 / 待补 CSS / 共用 token 说明）  
2. **CSS → class / token 映射**  
3. **Token 审计**（`--ff-ms-*` / `--ms-*` 等与 CSS 一致）  
4. **已入库 CSS 路径**（若使用「以下 CSS 为唯一信源」）：`docs/visual-upgrade/sources/machine-selection-figma-dev-export-*.css`  
5. **构建**结果  
