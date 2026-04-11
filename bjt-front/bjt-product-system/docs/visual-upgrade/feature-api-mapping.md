# 功能 → API 映射（骨架）

> 视觉验收时对照：某屏数据来自哪个 client，避免改样式时误改契约。

| featureId | 页面/路由 | 主要 API / client | 备注 |
|---|---|---|---|
| `machines-index` | `/machines` | `MachinesPage` 内 machineparts / host-models 等 | 与 P1 不同布局（栅格卡片）；视觉回归单独基线 |
| `ms-list-p1` | `/machines/product-line-1` | 与 `ProductLine1Page` 内数据 hooks 一致 | 对齐时只读不写 mock 契约 |
| `home-hero` | `/` | Home 区块数据 | 待补具体 endpoint |
| `cart-summary` | `/cart` | 购物车 API | 登录态 |
