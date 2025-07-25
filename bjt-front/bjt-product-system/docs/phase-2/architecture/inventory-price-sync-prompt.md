# 价格 & 库存同步服务 · AI 代码生成提示词

> 假设已经获得《CRM API 使用说明》文档，下面的提示词可直接用于 ChatGPT / Copilot / CodeWhisperer，让 AI 生成符合二期 FR-02 / FR-03 的 **Inventory-Price Sync Micro-Service**（WordPress 插件 + Cron + 缓存表）源码。

---

【Prompt 开始】

你是一名 PHP 后端工程师，需要为 **BJT 产品管理系统 (WordPress)** 实现"价格 & 库存同步服务"，对接 CRM 系统提供的 REST API。请生成**完整可运行的 WP 插件源码**，要求如下：

1. 插件基本信息  
   • 文件夹：`bjt-sync-service/`  
   • 主文件：`bjt-sync-service.php`  
   • 环境：PHP ≥ 7.4 、WP ≥ 6.0

2. CRM API 概要（来自说明文档，可据此 Mock）  
   • 鉴权：`Authorization: Bearer {token}`，token 通过 `/auth/token` 获取，24 h 失效  
   • 库存接口：`GET /api/v1/inventory?sku=LA-E4S&warehouse=US` → `{ "sku":"LA-E4S","warehouse":"US","qty":42 }`  
   • 价格接口：`GET /api/v1/pricing?sku=LA-E4S&customer_code=CUS001` → `{ "sku":"LA-E4S","currency":"USD","ladder":[{"min":1,"price":100},{"min":10,"price":95}] }`

3. DB 设计  
```sql
CREATE TABLE wp_bjt_inventory_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64),
  warehouse VARCHAR(20),
  qty INT,
  updated_at DATETIME,
  UNIQUE KEY (sku, warehouse)
);

CREATE TABLE wp_bjt_price_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64),
  customer_code VARCHAR(32),
  currency CHAR(3),
  ladder JSON,
  updated_at DATETIME,
  UNIQUE KEY (sku, customer_code)
);
```

4. 同步策略  
   • WP-Cron 每 60 min 批量全量刷新（分批 100 SKU / 调分页）  
   • 前端页面调用实时 API 时，若缓存 > 10 min 则临时实时拉取 + 更新缓存  
   • 接口超时/错误写入 `wp_options -> bjt_sync_error_log`，并触发邮件 / 钉钉机器人

5. 插件功能点
   • Settings 页面：配置 CRM API host、client_id、client_secret、仓库列表、超时阈值  
   • Token Service：自动刷新并缓存 Bearer Token  
   • WP-CLI 命令：`wp bjt-sync run --type=inventory` / `--type=price`  
   • REST 端点 (phase2)：
     - `GET /wp-json/bjt/v1/phase2/cache/inventory?sku=LA-E4S&warehouse=US`  
     - `GET /wp-json/bjt/v1/phase2/cache/pricing?sku=LA-E4S&customer_code=CUS001`  
     - 若缓存失效自动刷新再返回

6. 代码结构
```
bjt-sync-service/
  bjt-sync-service.php
  includes/
    class-loader.php           // PSR-4
    class-settings.php         // 后台设置页
    class-token-service.php
    class-inventory-sync.php
    class-price-sync.php
    class-rest-controller.php
    class-cron.php
    class-cli.php
    class-logger.php
```

7. 性能与可靠性
   • 使用 `wp_remote_get` + `wp_remote_retrieve_body`，timeout=10s  
   • 同步批次并行 (Requests::request_multiple)  
   • 指标：`bjt_sync_last_success_ts`, `error_count`, Prometheus `/metrics` endpoint

8. 输出格式  
   用**目录树 + 每个文件全文**方式输出，保证插件启用后可：
   ```bash
   wp plugin activate bjt-sync-service
   wp bjt-sync run --type=inventory
   ```

【Prompt 结束】

---

> 如需分阶段，可先实现 Token Service + Inventory Sync，再扩展 Price Sync 与 CLI。 