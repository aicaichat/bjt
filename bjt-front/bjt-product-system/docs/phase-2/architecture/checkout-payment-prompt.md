# Checkout 双模式 + 支付集成 · AI 代码生成提示词

> 把下列内容粘贴到 ChatGPT / Copilot / CodeWhisperer，可一次生成"Checkout 双模式（PO / 在线支付）+ WooCommerce 支付桥接"完整源码（前端 React + TypeScript + 后端 WP 插件）。
>
> 该提示词基于 FR-04 与 FR-05 需求，要求前端与 `bjt-wc-bridge` 插件协作，实现按钮校验、支付跳转、回调同步闭环。

---

【Prompt 开始】

你是一名全栈工程师，需要同时为 **BJT 产品管理系统前端（Vite + React 18 + TS）** 与 WordPress 后端编写代码，实现：
* Checkout 双模式（生成 PO vs 在线支付 Order）
* 在线支付通过已有 `bjt-wc-bridge` 插件与 WooCommerce 网关（PayPal / Stripe）完成

请生成可直接运行的**前端 & 后端源码**，满足以下要求：

────────────────────────
一、前端 (React + TS)

1. 目录
```
src/modules/checkout/
  components/
    SummaryPanel.tsx         // 总览 + 两按钮
    EligibilityTooltip.tsx   // 不满足原因展示
  hooks/
    useCheckoutEligibility.ts
  pages/
    CheckoutPage/index.tsx
```

2. 校验逻辑 (useCheckoutEligibility)
```ts
const {
  eligible,                // true = 可以在线支付
  reasons,                 // string[] 不满足原因
  loading,                 // 校验中
  refresh                  // 手动重新校验
} = useCheckoutEligibility(cartItems, user, region);
```
• 内部调用 `/wp-json/bjt/v1/phase2/checkout/validate` 返回：
```json
{ "eligible": true, "reasons": ["OVER_WEIGHT","OUT_OF_STOCK"] }
```
• 每当购物车/用户变动自动重新校验

3. CheckoutPage
```tsx
<SummaryPanel
  cart={cart}
  eligible={eligible}
  reasons={reasons}
  onGeneratePO={handleGeneratePO}
  onPayNow={handlePayNow}
/>
```
• `Pay Now`：`disabled={!eligible}`，点击后 `POST /phase2/checkout/order` 取得 `payment_url` → `window.location.replace(payment_url)`
• `Generate PO`：`POST /phase2/checkout/po` 返回自家订单号 → 跳 `/order/{id}`

4. UI 细节
• 复用现有 Button、Drawer、Message 组件；`className` 前缀 `bjt-checkout-`，CSS Module
• i18n key 前缀 `checkout.*`

5. 单测
`CheckoutPage.test.tsx`：模拟 eligible / ineligible 场景，断言按钮状态与 tooltip 内容

────────────────────────
二、后端 (WordPress 插件扩展到 bjt-wc-bridge)

1. 新 REST 路由 (phase2 前缀)
```
POST   /wp-json/bjt/v1/phase2/checkout/validate
POST   /wp-json/bjt/v1/phase2/checkout/order
POST   /wp-json/bjt/v1/phase2/checkout/po
```

2. 校验接口
• 输入：`{ cart_items:[{sku,qty}], region, warehouse }`
• 逻辑：查询库存 & 价格服务 → 判断重量、金额、库存 → 返回 `{ eligible, reasons[] }`
• 阈值 & 库存由设置表获取 (`weight_limit`,`amount_limit`)

3. 创建在线支付 Order
```php
public function create_wc_order_endpoint() {
  // 重新校验 -> create WC order via Bridge ::create_wc_order()
  return rest_ensure_response([
    'customOrderId' => $coid,
    'payment_url'   => $paymentUrl,
  ]);
}
```

4. 生成 PO
• 写入自家 `wp_bjt_orders`，状态 `PENDING_PO`，返回订单详情 URL

5. 权限
• 以上接口需登录 JWT；访客返回 401

6. Error & Logging
• 失败返回国际化错误码；所有异常写 `BJT_WC_Logger`

────────────────────────
三、输出要求

1. 先输出 **目录树**，后紧跟 **每个文件完整源码**。
2. 前端与后端分栏清晰：
```
=== Frontend ===
<目录树 + 文件全文>
=== Backend WP Plugin Ext ===
<目录树 + 文件全文>
```
3. 源码可直接加入现有项目并通过：
```
# Frontend
yarn dev
# Backend (WP)
wp plugin activate bjt-wc-bridge
```

【Prompt 结束】

---

> 如需拆分生成，可先让 AI 出 Backend 部分，再生成 Frontend 部分；或视项目复杂度分阶段实施。 