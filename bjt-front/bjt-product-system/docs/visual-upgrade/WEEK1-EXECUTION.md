# 7 日全站像素对齐 — 执行清单（进行中）

> 与 `page-batch-rollout-plan.md` 对应；每日勾选并补一行「阻塞/结论」。

## Day 1 — 基线冻结

- [x] `figma-baseline-manifest.md` 写入 fileKey、已知 node-id（从 `machine-selection.json` 同步）
- [ ] MCP 恢复后补全 Home / Machines / Consumables 等 Frame node-id
- [x] Playwright `visual-chromium` + `visual-regression.spec.ts` 公共路由基线
- [ ] 受保护路由：登录态 fixture 或仅快照公开壳

## Day 2 — 全局样式治理

- [x] `App` 根节点 `app-scope--storefront` / `app-scope--admin`（`app-scope.css`）
- [ ] 将 `page-layout-fix.css` / `header-layout-fix.css` 等规则分批改为 `.app-scope--storefront` 前缀
- [ ] `design:audit` 对当周修改文件跑 strict

## Day 3 — 壳层

- [ ] Header / Sidebar / Main 与 `figma-front-shell.css` 1px 验收（VT-SHELL-001/002）
- [ ] 侧栏 303px、`--bjt-sidebar-width` 单源

## Day 4 — Home

- [ ] Frame 529 叠图；`Home.css` / `Home.override.css` 与 tokens

## Day 5 — Machines / Selection

- [x] **范例闭环**：`visual-regression.spec.ts` 增加 `/machines`、`/machines/product-line-1`；`playwright.config` webServer 注入 `VITE_DATA_SOURCE=sql-mock`
- [ ] 本地/CI：首次需 `npx playwright install chromium` 后执行 `npm run test:visual:update` 并**提交** `e2e/snapshots/**` 下 PNG 基线（当前仓库若尚无基线，CI 视觉任务会失败）
- [ ] P2/P3 同规则（可选：复用 P1 样式 + 单独截图）

## Day 6 — Consumables / Cart

- [ ] 列表与购物车关键态

## Day 7 — 门禁与收尾

- [ ] PR 必附 Before/After/Overlay；CI `test:visual` + `design:audit` 绿

## 当日记录（追加）

| 日期 | 完成项 | 阻塞 |
|---|---|---|
| 2026-04-10 | 基线 manifest 同步 node-id；app-scope 根类 | Figma MCP 读节点限额 |
