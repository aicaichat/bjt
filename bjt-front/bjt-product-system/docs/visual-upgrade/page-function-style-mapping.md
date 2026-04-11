# 页面-功能-样式对应关系表（执行版）

> 用途：把“要改什么”和“由谁控制”对齐到可执行单元。  
> 使用方式：每次只领取若干行，按 `验收标准 + 测试用例ID` 关闭。

## 字段说明

| 字段 | 含义 |
|---|---|
| page | 页面名称 |
| route | 路由 |
| feature | 功能模块 |
| figmaNodeId | 对应 Figma 节点 |
| componentFiles | 组件实现文件 |
| styleFiles | 主要样式文件 |
| tokenGroup | 依赖 token 组 |
| acceptance | 严格验收标准 |
| testCaseIds | 对应测试用例 |
| owner | 负责人 |
| status | `todo / in_progress / done / blocked` |

## 映射表（首批主链路）

| page | route | feature | figmaNodeId | componentFiles | styleFiles | tokenGroup | acceptance | testCaseIds | owner | status |
|---|---|---|---|---|---|---|---|---|---|---|
| Global Shell | all | Header + Sidebar + Main 容器 | TODO | `frontend/src/components/layout/MainLayout.tsx` `frontend/src/components/layout/Header.tsx` `frontend/src/components/layout/Sidebar.tsx` | `frontend/src/styles/figma-front-shell.css` `frontend/src/styles/sidebar-figma.css` | shell/layout/nav | 顶栏/侧栏/主区与 Figma 骨架一致，关键尺寸误差 <=1px | VT-SHELL-001 VT-SHELL-002 | TBD | in_progress |
| Home | `/` | 首页骨架与卡片区 | TODO | `frontend/src/pages/Home/index.tsx` | `frontend/src/pages/Home/Home.css` `frontend/src/pages/Home/Home.override.css` | surface/spacing/typography | Frame 529 对齐；卡片尺寸/间距/色值一致 | VT-HOME-001 VT-HOME-002 | TBD | todo |
| Machines | `/machines` | 入口页列表与筛选 | TODO（与 P1 同文件，待单独 Frame） | `frontend/src/pages/Machines/index.tsx` | `frontend/src/pages/Machines/Machines.css` `frontend/src/pages/Machines/machines.scss` | table/card/filter | 列表密度、筛选条、状态色一致；**Playwright 全页基线** `machines-index.png` | VT-MACH-001 VT-MACH-002 | TBD | done |
| Machine Selection P1 | `/machines/product-line-1` | 对比区+筛选+列表+分页 | page `2443:17459`；card `2679:22612`；entry `2679:24930`（见 `machine-selection.json` meta） | `frontend/src/pages/Machines/ProductLine1Page.tsx` `frontend/src/pages/Machines/components/MsFigmaPagination.tsx` | `frontend/src/styles/machine-selection-figma.css` `frontend/src/styles/machine-compare-alignment.css`（`main.tsx` 全局加载 figma 层） | machine-selection | 单行卡片、分页、库存区、按钮态严格对齐；**Playwright 全页基线** `machines-product-line-1.png`（sql-mock、容差见 spec） | VT-MS1-001 VT-MS1-002 VT-MS1-003 | TBD | done |
| Machine Selection P2 | `/machines/product-line-2` | 产品线2视觉一致性 | TODO | `frontend/src/pages/Machines/ProductLine2Page.tsx` | `frontend/src/styles/machine-selection-figma.css` | machine-selection | 与 P1 同风格规则并对齐节点 | VT-MS2-001 | TBD | todo |
| Machine Selection P3 | `/machines/product-line-3` | 产品线3视觉一致性 | TODO | `frontend/src/pages/Machines/ProductLine3Page.tsx` | `frontend/src/styles/machine-selection-figma.css` | machine-selection | 与 P1 同风格规则并对齐节点 | VT-MS3-001 | TBD | todo |
| Consumables | `/consumables` | 列表与筛选 | TODO | `frontend/src/pages/Consumables/index.tsx` | `frontend/src/pages/Consumables/Consumables.css` | list/filter/tag | 筛选行、卡片边界、按钮态一致 | VT-CONS-001 VT-CONS-002 | TBD | todo |
| Spare Parts | `/spare-parts` | 列表与详情卡片 | TODO | `frontend/src/pages/SpareParts/index.tsx` | `frontend/src/pages/SpareParts/SpareParts.css` | list/detail | 列间距、标题层级、操作按钮一致 | VT-SP-001 | TBD | todo |
| Support | `/support` | 文档与入口区域 | TODO | `frontend/src/pages/Support/SupportPage.tsx` | `frontend/src/pages/Support/Support.css` | content/card | 文本层级与卡片样式一致 | VT-SUP-001 | TBD | todo |
| Contact | `/contact` | 联系页布局与表单 | TODO | `frontend/src/pages/Contact/ContactPage.tsx` | `frontend/src/pages/Contact/Contact.css` | form/layout | 表单高度、错误态、按钮态一致 | VT-CONTACT-001 | TBD | todo |
| Cart | `/cart` | 购物车列表与汇总 | TODO | `frontend/src/pages/Cart/index.tsx` | `frontend/src/pages/Cart/Cart.css` | cart/price | 数量器、价格区、空态一致 | VT-CART-001 VT-CART-002 | TBD | todo |
| Login | `/login` | 登录页 | TODO | `frontend/src/pages/Login/index.tsx` | `frontend/src/pages/Login/Login.css` | auth/form | 表单与提示态一致 | VT-AUTH-001 | TBD | todo |
| Register | `/register` | 注册页 | TODO | `frontend/src/pages/Register/index.tsx` | `frontend/src/pages/Register/Register.css` | auth/form | 表单布局与错误态一致 | VT-AUTH-002 | TBD | todo |

## 样式风险登记（治理必看）

| 风险类型 | 文件 | 风险描述 | 处置策略 |
|---|---|---|---|
| 全局覆盖 | `frontend/src/styles/page-layout-fix.css` | 含历史 `!important` 规则，易误伤 | 仅保留命名空间规则，分批下线 |
| 头部冲突 | `frontend/src/styles/header-layout-fix.css` | 旧版磨砂与新壳层冲突 | 迁移到 `.figma-front` 局部，旧规则降权 |
| 侧栏冲突 | `frontend/src/styles/sidebar-functional-fix.css` | 旧宽度变量与 303 不一致 | 统一 `--bjt-sidebar-width` 单源 |

## 执行建议

1. 每个迭代只处理 8-12 行映射项，避免超大批量改动。  
2. 每行关闭前必须补齐 `figmaNodeId` 和 `testCaseIds`。  
3. `blocked` 状态必须写阻塞原因（Figma未定稿 / MCP限额 / 业务冲突）。
