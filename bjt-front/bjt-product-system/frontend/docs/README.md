# BJT产品管理系统 - 前端组件

## 项目概述

BJT产品管理系统是一个面向B2B工业设备和配件销售的电子商务平台。系统支持多语言、多区域、多角色的用户体验，包括产品展示、备件管理、购物车和订单处理等功能。

## 最近改进

### 1. 配置模块化

创建了全局配置模块，集中管理API URL、区域设置和用户角色等全局参数：

- `src/config/appConfig.ts` - 集中管理应用配置
- 统一了区域、货币和角色的定义
- 提供了工具函数如`getUserRegionFromEmail`和`getCurrencySymbol`

### 2. 统一Mock数据管理

将原先分散在API实现中的Mock数据移至独立模块：

- `src/services/mockData/sparePartsMockData.ts` - 备件模拟数据
- 分类存储不同类型的备件数据
- 与API层实现解耦

### 3. API服务抽象

创建了统一的API服务层，支持根据环境切换真实API和Mock API：

- `src/services/apiService.ts` - API服务工厂
- 统一的请求和响应拦截处理
- 根据环境配置自动选择数据源

### 4. 工具函数库

添加了通用工具函数库，提供常用辅助函数：

- `src/utils/helpers.ts` - 工具函数集合
- 包含格式化、延迟、防抖等常用功能
- 可在整个应用中重用

## SpareParts页面优化

### 优化项目：

1. **消除硬编码配置**
   - 区域判断逻辑移至配置模块
   - 货币符号从配置中获取
   - API基础URL集中管理

2. **统一Mock数据管理**
   - 将备件Mock数据移至专门的数据文件
   - 支持通过配置切换真实/模拟API
   - 更好的代码组织和维护性

3. **API调用优化**
   - 使用统一的API调用接口
   - 添加类型定义和参数验证
   - 更好的错误处理

4. **响应式设计**
   - 完善的移动端卡片视图
   - 适配不同屏幕尺寸
   - 优化移动端用户体验

## 配置说明

### API配置

```typescript
// 在环境变量中设置
VITE_API_URL=https://api.example.com
VITE_USE_MOCK=true // 控制是否使用模拟数据
```

### 区域配置

系统支持以下区域：
- 中国 (CN) - 默认货币 ¥
- 欧洲 (EU) - 默认货币 €
- 北美 (NA) - 默认货币 $
- 澳洲 (AU) - 默认货币 A$

### 用户角色

系统支持以下角色：
- 管理员 (admin)
- 销售 (sales)
- 客户 (customer)
- 合作伙伴 (partner)
- 访客 (guest)

## 开发指南

### 使用配置模块

```typescript
import { API_CONFIG, getCurrencySymbol } from '../config/appConfig';

// 检查是否使用Mock数据
if (API_CONFIG.USE_MOCK_DATA) {
  // 处理模拟数据逻辑
}

// 获取货币符号
const currencySymbol = getCurrencySymbol('eu'); // 返回 €
```

### 使用API服务

```typescript
import apiService from '../services/apiService';

// GET请求
const data = await apiService.get('/endpoint', { param: value });

// POST请求
const result = await apiService.post('/endpoint', { data: value });
```

### 使用工具函数

```typescript
import { delay, formatCurrency } from '../utils/helpers';

// 延迟执行
await delay(500);

// 格式化货币
const price = formatCurrency(100, '$', 2); // 返回 $100.00
```

## 下一步改进

1. 增加服务端分页支持
2. 改进国际化实现
3. 添加单元测试覆盖
4. 性能优化和代码拆分



Okay, let's break down what happened, how we fixed it, and how to prevent similar issues in the future.

**根本原因 (Root Cause):**

The core problem was a series of cascading issues related to an incomplete and misconfigured WordPress setup, primarily:

1.  **WordPress 未完全安装 (WordPress Not Fully Installed):** The most fundamental issue was that the WordPress installation process itself hadn't been completed. This was initially masked by other errors but became clear when API calls were redirecting to `wp-admin/install.php`.
2.  **CORS 脚本处理不当 (Improper CORS Script Handling):**
    *   You had a custom PHP script (`cors-support.php`) intended to add CORS headers. However, it was not structured as a proper WordPress plugin.
    *   This script was being loaded directly via `require_once` in your `wp-config.php` file. During certain operations (like `wp core install` via WP-CLI), `wp-config.php` is loaded, but the full WordPress environment (including functions like `add_action` used in your script) might not be available yet, leading to a "Call to undefined function add_action()" fatal error.
    *   Even after we moved it to the plugins directory, the `wp-config.php` file still contained the `require_once` call to the old location, causing a "Failed opening required" fatal error.
3.  **固定链接未配置 (Permalinks Not Configured):** After the installation was technically complete, the WordPress REST API (`/wp-json/`) wasn't working correctly because the permalink structure hadn't been set. This often results in a 200 OK with an empty response or a 404 for API endpoints.

**怎么解决的 (How It Was Solved):**

We addressed these issues step-by-step:

1.  **启用详细调试 (Enabled Detailed Debugging):**
    *   We set `WORDPRESS_DEBUG: true` in `docker-compose.nginx.yml`.
    *   We added more specific debug constants (`WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY`, etc.) to `backend/wp-config.php` to get more detailed error messages into the `wp-content/debug.log` file.
2.  **识别并修正 CORS 脚本问题 (Identified and Fixed CORS Script Issues):**
    *   The WP-CLI installation failure and subsequent `debug.log` pointed to `cors-support.php`.
    *   We converted `cors-support.php` into a proper WordPress plugin:
        *   Added standard plugin header comments (Plugin Name, Description, etc.).
        *   Moved it from `backend/wp-content/cors-support.php` to `backend/wp-content/plugins/bjt-cors/bjt-cors.php`.
    *   We then removed (commented out) the problematic `require_once(ABSPATH . "wp-content/cors-support.php");` line from `backend/wp-config.php`, allowing WordPress to load it correctly as a plugin.
3.  **完成 WordPress 安装 (Completed WordPress Installation):**
    *   With the CORS script issue resolved, we successfully installed WordPress using the WP-CLI command: `docker exec -it dev-wordpress-1 wp core install ...`.
4.  **配置固定链接 (Configured Permalinks):**
    *   We set the permalink structure to `/%postname%/` using WP-CLI: `docker exec -it dev-wordpress-1 wp rewrite structure '/%postname%/' --hard --allow-root`. This is crucial for the REST API to function.
5.  **激活所需插件 (Activated Necessary Plugins):**
    *   We activated all required plugins, including the newly structured `bjt-cors` plugin and the standard `rest-api` plugin, using WP-CLI: `docker exec -it dev-wordpress-1 wp plugin activate bjt-core-entities bjt-product-admin rest-api bjt-cors --allow-root`.

After these steps, the `curl -v http://localhost:8080/wp-json/` command successfully returned the JSON response with all API endpoints.

**怎么避免下次出现 (How to Avoid Next Time):**

1.  **遵循标准的 WordPress 插件开发规范 (Follow Standard WordPress Plugin Development Practices):**
    *   Any custom code that needs to interact with WordPress core functions or hooks (like `add_action`, `add_filter`) should be developed as a proper plugin. This means:
        *   Creating a dedicated directory for the plugin within `wp-content/plugins/`.
        *   Including the standard plugin header comments in the main plugin file.
2.  **不在 `wp-config.php` 中加载插件类功能 (Don't Load Plugin-like Functionality in `wp-config.php`):**
    *   Avoid using `require` or `include` in `wp-config.php` for files that behave like plugins or use WordPress hooks. `wp-config.php` is loaded very early in the WordPress lifecycle, often before the necessary functions or environment for plugin code are available.
3.  **清晰的安装和配置流程 (Have a Clear Installation and Configuration Workflow):**
    *   **Step 1: Install WordPress Core:** Use WP-CLI (`wp core install`) or go through the web installer (`/wp-admin/install.php`).
    *   **Step 2: Configure Permalinks:** Immediately after installation, set your desired permalink structure (e.g., "Post name" or `/%postname%/`) via the WordPress admin dashboard or WP-CLI (`wp rewrite structure`).
    *   **Step 3: Install and Activate Plugins:** Place all plugins in `wp-content/plugins/` and then activate them through the admin dashboard or WP-CLI (`wp plugin activate <plugin-slug>`).
4.  **利用 WP-CLI (Utilize WP-CLI):** For development and deployment, WP-CLI is a powerful tool that can script and automate WordPress installation, plugin management, and configuration, reducing manual errors.
5.  **理解 WordPress 加载顺序 (Understand WordPress Loading Order):** Be mindful of *when* certain WordPress functions and APIs become available during the loading process.
6.  **系统性检查日志 (Systematic Log Checking):** When troubleshooting:
    *   Always check `wp-content/debug.log` first (ensure `WP_DEBUG` and `WP_DEBUG_LOG` are enabled in `wp-config.php`).
    *   Check web server error logs (Nginx, Apache).
    *   Check PHP error logs if accessible.

By following these practices, you can create a more stable and predictable WordPress development environment and avoid similar setup-related issues.
