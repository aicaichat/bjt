# BJT Product Admin Plugin - Debugging Summary and Best Practices

This document summarizes the issues encountered, the solutions applied, and best practices derived from the debugging session for the `bjt-product-admin` WordPress plugin, after encountering issues with a previous plugin (`bjt-product-api`).

## 1. Initial Problem with `bjt-product-api`

*   **Issue**: Persistent "Class BJT_Product_API_Controller not found" fatal error.
*   **Debugging Attempts**: Verified file existence, checked include paths, restarted services (opcode cache), added extensive logging. The root cause seemed to be the plugin's main file not executing correctly or an issue very early in its execution.
*   **Resolution**: Bypassed by disabling the `bjt-product-api` plugin. This was done by renaming its directory (`bjt-product-api-disabled`) because the fatal error prevented WP-CLI from deactivating it normally.

## 2. Issues and Fixes for `bjt-product-admin` Plugin

After switching to the `bjt-product-admin` plugin, the following issues were addressed:

### 2.1. Plugin Activation Error
*   **Issue**: `call_user_func_array(): Argument #1 ($callback) must be a valid callback, non-static method BJT_Install::install() cannot be called statically.`
*   **Cause**: The activation hook `register_activation_hook(__FILE__, array('BJT_Install', 'install'));` and a direct call `BJT_Install::install();` in `bjt_product_admin_activate()` were attempting to call a non-static method `install()` in the `BJT_Install` class as if it were static.
*   **Fix**:
    1.  The `BJT_Install` class was designed as a singleton. The call in `bjt_product_admin_activate()` was changed to use the singleton instance: `BJT_Install::get_instance()->install();`.
    2.  The redundant and incorrect `register_activation_hook(__FILE__, array('BJT_Install', 'install'));` was removed from `bjt-product-admin.php`.

### 2.2. API Initialization Error
*   **Issue**: `Call to private BJT_API::__construct() from global scope` when `new BJT_API()` was called in `bjt_product_admin_init()`.
*   **Cause**: The `BJT_API` class (in `includes/api/class-bjt-api.php`) has a private constructor, as it's also a singleton.
*   **Fix**: Changed the instantiation in `bjt_product_admin.php` from `new BJT_API();` to `BJT_API::get_instance();`.

### 2.3. API Unauthorized Error (401)
*   **Issue**: Requests to `/wp-json/bjt/v1/host-models` (previously `/machines`) returned a 401 "unauthorized" error.
*   **Cause**: The `BJT_API::check_authentication()` method was performing an authentication check (expecting a JWT).
*   **Fix (Temporary)**: For testing, the `check_authentication()` method in `plugins/bjt-product-admin/includes/api/class-bjt-api.php` was modified to unconditionally `return true;`.
    *   **Note**: This is a temporary measure for debugging and should be reverted to a proper authentication mechanism.

### 2.4. Database Errors for `/host-models` Endpoint

These errors occurred in `BJT_Host_Models_Controller` (`plugins/bjt-product-admin/includes/api/class-bjt-host-models-controller.php`):

*   **Issue 1**: `Unknown column 'pl.name_cn' in 'field list'`
    *   **Cause**: The SQL query selected `pl.name_cn` and `pl.name_en` from the `wp_bjt_product_lines` table, but the actual table schema (from `init.sql`) used `title_zh` and `title_en`.
    *   **Fix**: Modified the SQL queries in `get_items()` and `get_item()` to select `pl.title_zh as product_line_name_cn` and `pl.title_en as product_line_name_en`.

*   **Issue 2**: `Column 'status' in where clause is ambiguous` in `get_items()`
    *   **Cause**: The `WHERE status = 'publish'` clause was ambiguous because both `wp_bjt_host_models` (aliased `h`) and `wp_bjt_product_lines` (aliased `pl`) have a `status` column.
    *   **Fix**: Qualified the column in the `WHERE` clause to `WHERE h.status = 'publish'`.

*   **Issue 3**: `Unknown column 'h.menu_order' in 'order clause'` in `get_items()`
    *   **Cause**: The query used `ORDER BY h.menu_order`, but the `wp_bjt_host_models` table has `sort_order`.
    *   **Fix**:
        1.  Changed `ORDER BY h.menu_order` to `ORDER BY h.sort_order` in the SQL query.
        2.  Updated `prepare_item_for_response()` to use `$item['sort_order']` instead of `$item['menu_order']`.
        3.  Updated `prepare_item_for_database()` to use `sort_order` from request parameters.
        4.  Updated `get_endpoint_args_for_item_schema()` to define `sort_order` instead of `menu_order`.

*   **Issue 4**: `product_line.name` was `null` in the JSON response.
    *   **Cause**: `prepare_item_for_response()` was trying to access `$item['product_line_name_' . $lang]`. For Chinese (`zh`), this became `product_line_name_zh`, but the SQL alias was `product_line_name_cn`.
    *   **Fix**: Modified `prepare_item_for_response()` to construct the correct key: `$product_line_name_key = 'product_line_name_' . ($lang === 'zh' ? 'cn' : $lang);`, then used `$item[$product_line_name_key]`.

*   **Issue 5**: `Unknown column 'h.status' in 'where clause' for query SELECT COUNT(*)` in `get_items()`
    *   **Cause**: The count query `SELECT COUNT(*) FROM wp_bjt_host_models WHERE {$where_sql}` did not alias the table `wp_bjt_host_models` as `h`, but `$where_sql` contained `h.status`.
    *   **Fix**: Aliased the table in the count query: `SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_host_models h WHERE {$where_sql}`.

### 2.5. API Route Registration Issues
*   **Initial State**: The `/host-models` route was not being registered correctly, leading to 401 errors (potentially falling back to a default auth check) instead of 404s.
*   **Cause**: `BJT_Host_Models_Controller::register_routes()` was defined but never called. The mechanism for individual controllers to hook into the main `BJT_API`'s `do_action('bjt_api_register_routes', ...)` was missing.
*   **Fix**:
    1.  Modified `BJT_Host_Models_Controller::__construct()` to hook its `register_routes` method directly into WordPress's standard `rest_api_init` action: `add_action('rest_api_init', array($this, 'register_routes'));`.
    2.  Ensured an instance of `BJT_Host_Models_Controller` was created in the main plugin file (`bjt-product-admin.php`) after its class file was included: `new BJT_Host_Models_Controller();`. This ensures its constructor (and thus the hook) runs. (Similar changes would be needed for other resource controllers).

## 3. Best Practices and Key Takeaways

*   **Database Schema Consistency**: This was a major source of bugs.
    *   Ensure schemas in installer code (`dbDelta`), `init.sql` (if used for Docker), and application code (queries, data mappers) are perfectly aligned.
    *   `dbDelta()` is good for adding tables/columns but less reliable for altering existing columns (like renaming or changing types significantly). Manual migrations or more robust migration tools might be needed for complex schema changes.
    *   Regularly verify live database schemas against code definitions.
*   **Qualify SQL Columns**: In queries with JOINs, always prefix column names with table aliases (e.g., `h.status`, `pl.code`) to prevent ambiguity.
*   **Singleton and Static Methods**:
    *   Call singleton methods via their static `get_instance()` or `instance()` method. Do not use `new ClassName()`.
    *   Ensure methods intended to be called statically are defined with the `static` keyword. Pay attention to WordPress hook callback requirements.
*   **REST API Route Registration**:
    *   Ensure all controller `register_routes()` methods are actually called, typically by hooking into `rest_api_init`.
    *   Instantiate controllers if their constructors are responsible for adding these hooks.
    *   Use WP-CLI (if available via `wp-cli/restful`) or other tools to list registered routes and verify they match expectations.
*   **Debugging Techniques**:
    *   **Incremental Logging**: Add `error_log` statements at critical points to trace execution flow and variable states. Remove or conditionalize them for production.
    *   **WP-CLI**: Use for plugin activation/deactivation, listing plugins, checking database schemas (`wp db query`, `wp db prefix`), and route listing (if `wp rest` commands are available).
    *   **Direct API Calls (`curl`)**: Essential for testing API responses directly and bypassing frontend complexities. Use with `jq` for readable JSON.
    *   **Service Restarts**: Restart PHP-FPM and web server (or Docker containers) to clear opcode caches when "class not found" or stale code issues are suspected.
*   **Code Structure and Initialization**:
    *   Ensure plugin main files are correctly structured and that necessary include paths (`plugin_dir_path`) are accurate.
    *   Be mindful of the order of operations during WordPress loading (`plugins_loaded`, `init`, `rest_api_init`).
*   **Error Handling**:
    *   WordPress database errors in logs are very informative.
    *   Implement robust error handling in custom code.
    *   Gracefully handle plugin activation failures (e.g., deactivate the plugin and inform the user).
*   **Temporary Fixes**: Clearly comment temporary changes (like disabling authentication) and have a plan to implement proper solutions.
*   **Naming Consistency**: Using consistent naming conventions for database columns, PHP variables, and API response fields (e.g., `name_cn` vs `model_name` vs `title_zh`) can prevent confusion and bugs.
*   **Endpoint Naming**: Use consistent and clear naming for API endpoints (e.g., `/host-models` vs `/machines`). If aliases are needed, implement them explicitly. 