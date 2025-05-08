# BJT产品管理系统快速重构实施指南

本指南详细说明如何在2小时内完成BJT产品管理系统的快速重构。按照时间顺序和优先级组织，确保最关键的问题得到解决。

## 准备工作（5分钟）

1. **备份关键文件**
   ```bash
   # 在开始前备份关键文件
   cp -r plugins/bjt-product-admin/templates plugins/bjt-product-admin/templates.bak
   cp plugins/bjt-product-admin/bjt-product-admin.php plugins/bjt-product-admin/bjt-product-admin.php.bak
   cp plugins/bjt-product-admin/includes/admin/class-bjt-admin.php plugins/bjt-product-admin/includes/admin/class-bjt-admin.php.bak
   ```

2. **停用插件**
   ```bash
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin deactivate bjt-product-admin --allow-root
   ```

## 阶段1：修复架构问题（30分钟）

### 步骤1.1：常量定义统一（10分钟）

1. 编辑主插件文件，添加缺失的常量：
   ```php
   // 在 plugins/bjt-product-admin/bjt-product-admin.php 中添加
   define('BJT_PLUGIN_DIR', plugin_dir_path(__FILE__));
   define('BJT_PLUGIN_URL', plugin_dir_url(__FILE__));
   define('BJT_TEMPLATES_DIR', BJT_PLUGIN_DIR . 'templates/');
   define('BJT_ADMIN_TEMPLATES_DIR', BJT_TEMPLATES_DIR . 'admin/');
   ```

### 步骤1.2：统一模板加载机制（20分钟）

1. 确认自定义布局文件存在：
   ```php
   // 检查 plugins/bjt-product-admin/templates/admin/layout/custom-layout.php 是否存在
   // 如不存在，创建该文件
   ```

2. 修改每个管理页面，使用统一的输出缓冲模式：
   ```php
   // 修改模板文件模式（以host-management.php为例）
   $page_title = '主机管理';
   ob_start();
   // ... 原页面内容 ...
   $page_content = ob_get_clean();
   require_once BJT_PLUGIN_DIR . 'templates/admin/layout/custom-layout.php';
   ```

3. 需要修改的关键页面：
   - `templates/admin/dashboard.php`
   - `templates/admin/host-management.php`
   - `templates/admin/parts.php`
   - `templates/admin/product-lines.php`
   - `templates/admin/accessories.php`

## 阶段2：产品线筛选功能（45分钟）

### 步骤2.1：添加筛选UI组件（20分钟）

1. 创建可重用的筛选器组件：
   ```php
   // 创建文件 templates/admin/components/product-line-filter.php
   <?php
   // 获取当前筛选值
   $current_product_line = isset($_GET['product_line']) ? $_GET['product_line'] : '';
   ?>
   <div class="bjt-filter-controls">
     <form method="get">
       <input type="hidden" name="page" value="<?php echo esc_attr($_GET['page']); ?>">
       <select id="product-line-filter" name="product_line">
         <option value="">所有产品线</option>
         <option value="air_cushion" <?php selected($current_product_line, 'air_cushion'); ?>>气垫机</option>
         <option value="paper" <?php selected($current_product_line, 'paper'); ?>>纸机</option>
         <option value="tape" <?php selected($current_product_line, 'tape'); ?>>胶带机</option>
         <option value="air_column" <?php selected($current_product_line, 'air_column'); ?>>气柱袋</option>
       </select>
       <button type="submit" class="button">筛选</button>
     </form>
   </div>
   ```

2. 引入筛选器到各个列表页面：
   ```php
   // 在每个列表页面适当位置添加（通常在标题下方）
   include BJT_ADMIN_TEMPLATES_DIR . 'components/product-line-filter.php';
   ```

### 步骤2.2：修改查询功能（25分钟）

1. 添加通用数据查询函数：
   ```php
   // 添加到 includes/class-bjt-data-manager.php
   
   /**
    * 通用获取数据函数，支持产品线筛选
    *
    * @param string $table_name 表名（不含前缀）
    * @param string $product_line 产品线
    * @return array 查询结果
    */
   public static function get_items($table_name, $product_line = '') {
     global $wpdb;
     $table = $wpdb->prefix . $table_name;
     $where = '';
     $params = array();
     
     if (!empty($product_line)) {
       // 检查表是否有product_line字段
       $columns = $wpdb->get_results("SHOW COLUMNS FROM $table");
       $has_product_line = false;
       
       foreach ($columns as $column) {
         if ($column->Field === 'product_line') {
           $has_product_line = true;
           break;
         }
       }
       
       if ($has_product_line) {
         $where = " WHERE product_line = %s";
         $params[] = $product_line;
       }
     }
     
     $query = "SELECT * FROM $table" . $where;
     if (!empty($params)) {
       return $wpdb->get_results($wpdb->prepare($query, $params));
     } else {
       return $wpdb->get_results($query);
     }
   }
   ```

2. 修改列表页面使用通用查询函数：
   ```php
   // 修改各列表页面的数据获取部分
   $product_line = isset($_GET['product_line']) ? $_GET['product_line'] : '';
   $items = BJT_Data_Manager::get_items('bjt_items', $product_line);
   ```

## 阶段3：UI统一（30分钟）

### 步骤3.1：页面布局标准化（15分钟）

1. 更新自定义布局文件：
   ```php
   // 修改 templates/admin/layout/custom-layout.php
   <?php
   // 确保未直接访问
   if (!defined('ABSPATH')) {
     exit;
   }
   
   // 获取页面标题
   $page_title = isset($page_title) ? $page_title : '产品管理系统';
   ?>
   <div class="wrap bjt-admin-wrap">
     <h1><?php echo esc_html($page_title); ?></h1>
     
     <div class="bjt-admin-content">
       <?php 
       // 输出页面内容
       echo $page_content; 
       ?>
     </div>
     
     <div class="bjt-admin-footer">
       <p>北京天硕产品管理系统 &copy; <?php echo date('Y'); ?></p>
     </div>
   </div>
   ```

2. 添加统一的样式：
   ```php
   // 编辑 includes/admin/class-bjt-admin.php 的 enqueue_styles 方法
   public function enqueue_styles() {
     wp_enqueue_style('bjt-admin-css', BJT_PLUGIN_URL . 'assets/css/admin.css', array(), $this->version);
     
     // 添加内联样式以确保统一
     $custom_css = "
       .bjt-admin-wrap {
         max-width: 1200px;
         margin: 20px auto;
       }
       .bjt-admin-content {
         background: #fff;
         padding: 20px;
         border: 1px solid #ddd;
         box-shadow: 0 1px 3px rgba(0,0,0,0.1);
       }
       .bjt-filter-controls {
         margin-bottom: 20px;
         padding: 15px;
         background: #f9f9f9;
         border: 1px solid #e5e5e5;
       }
       .bjt-admin-footer {
         margin-top: 20px;
         padding: 10px;
         text-align: center;
         color: #777;
       }
     ";
     wp_add_inline_style('bjt-admin-css', $custom_css);
   }
   ```

### 步骤3.2：导航菜单优化（15分钟）

1. 更新菜单结构：
   ```php
   // 修改 includes/admin/class-bjt-admin.php 的 add_admin_menu 方法
   public function add_admin_menu() {
     // 添加主菜单
     add_menu_page(
       __('BJT产品管理系统', 'bjt-product-admin'),
       __('产品管理', 'bjt-product-admin'),
       'manage_options',
       'bjt-dashboard',
       array($this, 'render_dashboard_page'),
       'dashicons-products',
       25
     );
     
     // 添加子菜单
     add_submenu_page(
       'bjt-dashboard',
       __('仪表盘', 'bjt-product-admin'),
       __('仪表盘', 'bjt-product-admin'),
       'manage_options',
       'bjt-dashboard',
       array($this, 'render_dashboard_page')
     );
     
     // 增加产品线分组
     add_submenu_page(
       'bjt-dashboard',
       __('主机管理', 'bjt-product-admin'),
       __('主机管理', 'bjt-product-admin'),
       'manage_options',
       'bjt-host-models',
       array($this, 'render_host_models_page')
     );
     
     // 保留其他子菜单...
   }
   ```

## 阶段4：测试与部署（15分钟）

### 步骤4.1：快速测试（10分钟）

1. 重新激活插件：
   ```bash
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin activate bjt-product-admin --allow-root
   ```

2. 测试要点清单：
   - 检查所有页面是否正确加载
   - 验证产品线筛选器是否显示和工作
   - 确认菜单导航是否正常
   - 检查样式是否一致

### 步骤4.2：错误修复与部署（5分钟）

1. 常见问题和解决方案：
   - 路径问题：确保使用常量定义的路径
   - 样式不一致：添加额外的CSS规则
   - 功能失效：检查JS错误和PHP警告

2. 最终部署：
   ```bash
   # 清理临时文件和缓存
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp cache flush --allow-root
   ```

## 应急回滚计划

如需快速回滚，运行：

```bash
# 恢复备份文件
cp -r plugins/bjt-product-admin/templates.bak/* plugins/bjt-product-admin/templates/
cp plugins/bjt-product-admin/bjt-product-admin.php.bak plugins/bjt-product-admin/bjt-product-admin.php
cp plugins/bjt-product-admin/includes/admin/class-bjt-admin.php.bak plugins/bjt-product-admin/includes/admin/class-bjt-admin.php

# 重新激活插件
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin deactivate bjt-product-admin --allow-root
docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin activate bjt-product-admin --allow-root
```

## 附录：关键文件清单

- **主插件文件**: `plugins/bjt-product-admin/bjt-product-admin.php`
- **管理类**: `plugins/bjt-product-admin/includes/admin/class-bjt-admin.php`
- **布局模板**: `plugins/bjt-product-admin/templates/admin/layout/custom-layout.php`
- **主要页面**:
  - `plugins/bjt-product-admin/templates/admin/dashboard.php`
  - `plugins/bjt-product-admin/templates/admin/host-management.php`
  - `plugins/bjt-product-admin/templates/admin/parts.php`
  - `plugins/bjt-product-admin/templates/admin/product-lines.php`
  - `plugins/bjt-product-admin/templates/admin/accessories.php` 