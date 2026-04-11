# 页面分批升级执行清单（主链路→复杂页→后台）

## Batch 1：壳层与导航（进行中）

- 范围：
  - `frontend/src/components/layout/MainLayout.tsx`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/styles/figma-front-shell.css`
  - `frontend/src/styles/sidebar-figma.css`
- 验收：
  - 顶栏/侧栏结构与 Figma 对齐
  - 桌面不重复品牌 logo
  - 侧栏宽度统一 `303`

## Batch 2：一级页面（待执行）

- 页面：Home / Machines / Consumables / Support / Contact
- 方法：每次只处理 1-2 个页面，完成后立即跑视觉回归。
- 关键文件：
  - `frontend/src/pages/Home/*`
  - `frontend/src/pages/Machines/*`
  - `frontend/src/pages/Consumables/*`
  - `frontend/src/pages/Support/*`
  - `frontend/src/pages/Contact/*`

## Batch 3：复杂业务页（待执行）

- 页面：Machine Selection(P1/P2/P3) / Cart / Orders / Profile / Spare Parts
- 重点：状态多、交互密集、最容易回归。

## Batch 4：后台与边缘页（待执行）

- 页面：`/admin/*`、登录/注册、异常与演示页。

## 批次门禁（每批都必须）

1. `npm run build:skip-check`
2. `npm run lint`
3. `npm run design:audit`
4. `npm run test:visual`（或同等视觉回归）
5. PR 附 `Before / After / Overlay` 三联图
