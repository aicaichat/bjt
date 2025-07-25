# WooCommerce Bridge 插件 · AI 代码生成提示词

> 将以下完整内容复制到 ChatGPT / Copilot / CodeWhisperer 等 AI 编码助手，可一次性生成符合二期架构的 **BJT WooCommerce Bridge** WordPress 插件源码。

---

【Prompt 开始】

你是一名资深 PHP / WordPress / WooCommerce 开发工程师，现在需要从零实现一个 **BJT WooCommerce Bridge** 插件，以复用 WooCommerce 的支付与物流生态，桥接我方已有的选型-下单系统。请生成**完整可运行的插件源码**，结构与功能必须满足下列要求：

1. 插件基本信息  
   • 文件夹：`bjt-wc-bridge/`  
   • 主文件：`bjt-wc-bridge.php`（标准插件头：名称、作者、版本、描述）  
   • 运行环境：PHP ≥ 7.4、WordPress ≥ 6.0、WooCommerce ≥ 8.0

2. 创建订单 REST 接口  
   • 注册 **POST** `/wp-json/bjt/v1/phase2/create-order`  
   • 接收 JSON
     ```json
     {
       "id": "CUS12345",
       "currency": "USD",
       "weight": 3.5,
       "items": [
         {"sku":"LA-E4S","qty":2,"price":199},
         {"sku":"FILM-01","qty":1,"price":29}
       ],
       "billing": { ... },
       "shipping": { ... }
     }
     ```  
   • 逻辑  
     – 查找/创建虚拟商品占位（SKU 唯一）  
     – 调用 `wc_create_order()` 写 line_items、价格  
     – `meta_data` 写入 `custom_order_id`,`weight_total`  
     – 返回
       ```json
       { "wc_order_id":123, "payment_url":"https://example.com/checkout/order-pay/123" }
       ```

3. 订单状态回调  
   • `add_action('woocommerce_order_status_changed', …)` 监听  
   • 读取 `custom_order_id`，将 `wcStatus`,`txnId` **PATCH** 到内部 API  `https://api.bjt.local/order/update-status`，Header 携带 `Authorization: Bearer BRIDGE_TOKEN`  
   • 回调失败写入 `wp_options` 重试队列，WP-Cron 每 10 分钟补偿

4. 物流 Webhook  
   • 注册 **POST** `/wp-json/bjt/v1/phase2/shipment` 供 AST / AfterShip 调用  
   • 示例请求
     ```json
     { "order_id":123, "tracking_history":[{ "status":"In Transit", "time":"2025-07-08T10:00:00Z" }] }
     ```  
   • 查 `custom_order_id`，POST 至 `https://api.bjt.local/order/update-logistics`  
   • 返回 `{"success":true}`

5. 安全  
   • 两个自定义 REST 端点校验 `Signature` 头：`hash_hmac('sha256', body, WC_API_SECRET)`  
   • 插件设置页（Settings API）填写并保存：`WC_API_SECRET`、`BRIDGE_TOKEN`、内部 API 根地址  
   • 设置数据存于 `wp_options`

6. 日志 & 监控  
   • 封装 `BJT_WC_Logger`（基于 `wc_get_logger()`）  
   • 暴露 **GET** `/wp-json/bjt/v1/phase2/metrics`，输出 Prometheus 格式
     ```
     # HELP bjt_wc_bridge_sync_total Total sync calls
     # TYPE bjt_wc_bridge_sync_total counter
     bjt_wc_bridge_sync_total 123
     ```  
   • WP-Cron 每小时统计同步成功 / 失败并更新指标

7. 代码质量  
   • 命名空间：`BJT\\Bridge\\...`，PSR-4 自动加载  
   • 类 / 方法带 PHPDoc，关键行内注释  
   • 不得硬编码 URL / 密钥，全部走设置或 `.env`  
   • 提供 `composer.json`（依赖 `psr/log`,`vlucas/phpdotenv`）、`README.md`（安装、配置、API 示例）

8. 示例 & 测试  
   • `README.md` 含 `curl` 示例、Webhook 配置指引  
   • `tests/` 目录：PHPUnit 用例（创建订单、状态 Webhook、物流 Webhook）  
   • `phpunit.xml.dist` + GitHub Actions `/.github/workflows/ci.yml` 跑 PHPUnit 与 PHPCS

9. 输出格式  
   用 **目录树 + 各关键文件全文** 方式输出，例如  
   ```
   bjt-wc-bridge/
     ├─ bjt-wc-bridge.php
     ├─ includes/
     │   ├─ class-plugin.php
     │   ├─ class-rest-controller.php
     │   ├─ class-order-service.php
     │   ├─ class-webhook-handler.php
     │   └─ class-logger.php
     ├─ admin/
     │   └─ class-settings-page.php
     ├─ tests/...
     ├─ composer.json
     └─ README.md
   ```  
   随后为每个文件给出完整源码，插件应在 **WP + WooCommerce Sandbox** 环境直接启用并通过示例测试。

【Prompt 结束】

---

> 如需精简或分阶段生成，可自行删减测试/CI 或设置页要求。 