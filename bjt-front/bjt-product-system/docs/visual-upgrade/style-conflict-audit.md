# 全局样式冲突审计（Phase M1）

> 审计范围：前台主入口加载链路与 `src/styles/*` 中高风险覆盖文件。  
> 审计时间：当前分支 latest。  
> 目标：收敛无边界覆盖，减少“改一页坏全站”。

## 1) 主入口样式加载链路（App）

来自 `frontend/src/App.tsx` 当前显式加载：

1. `styles/theme.css`
2. `styles/sidebar-functional-fix.css`
3. `styles/page-layout-fix.css`
4. `styles/products-submenu-fix.css`
5. `styles/header-layout-fix.css`
6. `styles/figma-global.css`

结论：历史 `*fix.css` 与新版 Figma 壳层并存，存在优先级竞争。

## 2) 高风险文件分级

| 风险级别 | 文件 | 风险点 | 处置 |
|---|---|---|---|
| P0 | `frontend/src/styles/page-layout-fix.css` | 历史 `!important` 覆盖范围大，易误伤 Home/Figma 页面 | 已开始通过 `.home-page:not(.home-page--figma)` 收敛，继续扩展命名空间 |
| P0 | `frontend/src/styles/header-layout-fix.css` | 旧头部磨砂/阴影规则与 Figma 壳层冲突 | 逐步迁移到 `figma-front-shell.css`，旧规则仅保留兼容 |
| P0 | `frontend/src/styles/sidebar-functional-fix.css` | 与 `sidebar-figma.css` 共同作用，变量源可能分叉 | 强制统一 `--bjt-sidebar-width` / `--bjt-sidebar-effective-width` |
| P1 | `frontend/src/styles/header-search-right.css` | 搜索框强样式，可能覆盖 Figma 新设计 | 仅保留基础交互，视觉尺寸由 `.figma-front` 下覆盖 |
| P1 | `frontend/src/styles/theme.css` 及 `themes/*.css` | 主题层和 Figma token 可能出现双源色值 | 新增 token 审计与 JSON 单源，逐步清理硬编码 |

## 3) 已上线约束

- 新增 `npm run design:audit`（`scripts/audit-hardcoded-design-values.mjs`）：
  - 审计硬编码 hex 色值；
  - 审计非白名单文件中的 `!important`。
- 新增视觉回归 workflow（见 `.github/workflows/visual-regression.yml`）在 PR 触发。

## 4) 下阶段收敛策略

1. 组件样式 > 页面样式 > 壳层样式 > token（固定层级）。  
2. 所有“全局修补”类规则必须带页面命名空间（如 `.figma-front`）。  
3. 新视觉需求只允许落在：
   - token 文件；
   - 目标页面/组件文件；
   - 映射表登记项。  
4. 非登记文件变更需在 PR 写明原因。
