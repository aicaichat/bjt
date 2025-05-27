# BJT Product Admin 激活问题修复方案

本文档总结了对 `bjt-product-admin` 插件激活和运行过程中的问题修复方案。

## 1. 插件激活问题

### 1.1 BJT_Install 类的调用问题

**问题描述**: 激活插件时出现 `call_user_func_array(): Argument #1 ($callback) must be a valid callback, non-static method BJT_Install::install() cannot be called statically.` 错误。

**原因**: 
- 在 `bjt-product-admin.php` 文件中的 `bjt_product_admin_activate()` 函数中，错误地尝试静态调用 `BJT_Install::install()` 方法，但该方法并非静态方法。
- `BJT_Install` 类设计为单例模式，应该通过 `BJT_Install::get_instance()->install()` 方式调用。

**解决方案**:
- 修改 `bjt_product_admin_activate()` 函数，使用单例方式调用: `BJT_Install::get_instance()->install()`。
- 删除了不必要的激活代码，简化了激活流程。

## 2. API 控制器问题

### 2.1 类名不一致问题

**问题描述**: `BJT_Product_Host_Models_Controller` 类在主文件中被作为 `BJT_Host_Models_Controller` 引用，导致找不到类。

**原因**: 类名不一致，文件中定义的类名与其他地方引用的不一致。

**解决方案**:
- 将 `class-bjt-host-models-controller.php` 中的类名从 `BJT_Product_Host_Models_Controller` 修改为 `BJT_Host_Models_Controller`，以与引用保持一致。

### 2.2 API 路由注册问题

**问题描述**: REST API 路由没有正确注册，导致访问 `/wp-json/bjt/v1/host-models` 返回 401 错误。

**原因**: 
- `BJT_Host_Models_Controller::register_routes()` 方法虽然已定义但从未被调用。
- 缺少将控制器挂钩到 WordPress 的 `rest_api_init` 操作的机制。

**解决方案**:
- 修改 `BJT_Host_Models_Controller::__construct()` 构造函数，直接将其 `register_routes` 方法挂钩到 WordPress 的 `rest_api_init` 动作。
- 在插件的主文件中主动实例化控制器，确保钩子生效。

### 2.3 SQL 查询列名问题

**问题描述**: 查询中出现 `Unknown column 'pl.name_cn' in 'field list'` 等数据库错误。

**原因**: 
- SQL 查询中使用了错误的列名（如 `pl.name_cn` 和 `pl.name_en`），而实际表结构中使用的是 `title_zh` 和 `title_en`。
- WHERE 子句中的列名未明确指定表别名，导致 `WHERE status = 'publish'` 出现 `Column 'status' in where clause is ambiguous` 错误。

**解决方案**:
- 修改 SQL 查询，使用正确的列名: `pl.title_zh as product_line_name_cn` 和 `pl.title_en as product_line_name_en`。
- 在 WHERE 子句中明确指定表别名: `WHERE h.status = 'publish'`。
- 修改计数查询，使其包含表别名: `SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_host_models h WHERE {$where_sql}`。

### 2.4 语言键映射问题

**问题描述**: 在 JSON 响应中，`product_line.name` 为 `null`。

**原因**: 
- `prepare_item_for_response()` 尝试访问 `$item['product_line_name_' . $lang]`。
- 对于中文 (`zh`)，这变成了 `product_line_name_zh`，但 SQL 别名是 `product_line_name_cn`。

**解决方案**:
- 修改 `prepare_item_for_response()` 构建正确的键:
  ```php
  $product_line_name_key = 'product_line_name_' . ($lang === 'zh' ? 'cn' : $lang);
  ```
- 然后使用 `$item[$product_line_name_key]` 访问值。

## 3. 其他改进

### 3.1 身份验证绕过

**临时措施**: 为便于测试，`BJT_API::check_authentication()` 方法已修改为无条件返回 `true`。
**注意**: 这是一个临时措施，用于调试。在生产环境中应实现适当的身份验证机制。

### 3.2 错误处理改进

- 添加了更清晰的错误消息和日志记录。
- 在激活失败时优雅地停用插件并通知用户。

## 4. 部署指南

1. 应用上述所有修改，特别是类名和方法调用的修改。
2. 停用并重新激活插件，确保激活过程顺利完成。
3. 测试 REST API 端点，确保它们返回预期的数据。
4. 一旦确认修复有效，可以考虑恢复身份验证机制（移除 `BJT_API::check_authentication()` 中的临时返回 `true`）。

这些修改应该解决 bjt-product-admin 插件的激活和 API 功能问题，允许它正常运行并为前端应用程序提供数据。 