# BJT产品管理系统常见问题及解决方案

本文档列出了BJT产品管理系统中常见的问题和相应的解决方案，特别是在快速重构过程中可能遇到的情况。

## 页面加载问题

### 问题：页面显示空白或报错"Undefined constant"

**原因**：常量定义缺失或路径引用错误

**解决方案**：
1. 确保在主插件文件中正确定义了所有必要常量：
   ```php
   define('BJT_PLUGIN_DIR', plugin_dir_path(__FILE__));
   define('BJT_PLUGIN_URL', plugin_dir_url(__FILE__));
   ```
2. 检查文件包含路径是否正确：
   ```php
   // 错误：使用硬编码路径
   require_once('../../templates/admin/layout.php');
   
   // 正确：使用常量定义路径
   require_once BJT_PLUGIN_DIR . 'templates/admin/layout.php';
   ```

### 问题：样式丢失或布局错乱

**原因**：CSS文件未正确加载或样式冲突

**解决方案**：
1. 检查样式是否正确入队：
   ```php
   // 在class-bjt-admin.php中确认
   wp_enqueue_style('bjt-admin-css', BJT_PLUGIN_URL . 'assets/css/admin.css', array(), $this->version);
   ```
2. 使用浏览器开发者工具检查CSS路径是否正确
3. 添加更高特异性选择器解决样式冲突：
   ```css
   /* 替换 */
   .admin-content { ... }
   
   /* 使用更具体的选择器 */
   .bjt-admin-wrap .admin-content { ... }
   ```

## 功能问题

### 问题：产品线筛选不工作

**原因**：查询参数处理不正确或数据库表缺少字段

**解决方案**：
1. 确保正确获取查询参数：
   ```php
   $product_line = isset($_GET['product_line']) ? sanitize_text_field($_GET['product_line']) : '';
   ```
2. 检查SQL查询是否正确包含条件：
   ```php
   // 打印SQL查询进行调试
   error_log('SQL查询: ' . $wpdb->last_query);
   ```
3. 临时解决方案：使用JavaScript前端过滤：
   ```javascript
   // 添加到列表页面底部
   jQuery(document).ready(function($) {
     $('#product-line-filter').change(function() {
       var productLine = $(this).val();
       if (productLine) {
         $('.item-row').hide();
         $('.item-row[data-product-line="' + productLine + '"]').show();
       } else {
         $('.item-row').show();
       }
     });
   });
   ```

### 问题：导航菜单项链接错误

**原因**：菜单注册与页面加载逻辑不匹配

**解决方案**：
1. 确保菜单slug与页面处理逻辑一致：
   ```php
   // 在add_admin_menu中
   add_submenu_page(
     'bjt-dashboard',
     __('主机管理', 'bjt-product-admin'),
     __('主机管理', 'bjt-product-admin'),
     'manage_options',
     'bjt-host-models', // 菜单slug
     array($this, 'render_host_models_page')
   );
   
   // 对应的渲染函数
   public function render_host_models_page() {
     // 确保页面文件使用相同的slug进行检查
     require_once BJT_ADMIN_TEMPLATES_DIR . 'host-management.php';
   }
   ```
2. 检查URL参数处理：
   ```php
   // 在页面模板内检查当前页面
   $current_page = isset($_GET['page']) ? $_GET['page'] : '';
   if ($current_page !== 'bjt-host-models') {
     wp_die('无效的页面请求');
   }
   ```

## 数据问题

### 问题：无法保存或更新数据

**原因**：数据库操作权限或表结构问题

**解决方案**：
1. 检查数据库连接和权限：
   ```php
   // 测试数据库连接
   global $wpdb;
   $test = $wpdb->get_results("SELECT 1");
   if ($wpdb->last_error) {
     error_log('数据库错误: ' . $wpdb->last_error);
   }
   ```
2. 临时解决方案：使用本地存储：
   ```javascript
   // 在无法保存到数据库时使用localStorage临时存储
   function saveLocalData(key, data) {
     localStorage.setItem('bjt_' + key, JSON.stringify(data));
   }
   
   function getLocalData(key) {
     const data = localStorage.getItem('bjt_' + key);
     return data ? JSON.parse(data) : null;
   }
   ```

### 问题：产品数据不完整

**原因**：数据导入问题或字段映射错误

**解决方案**：
1. 检查数据获取函数是否返回所有必要字段：
   ```php
   // 临时解决方案：确保返回所有字段，即使为空
   function get_complete_item($item_id) {
     global $wpdb;
     $item = $wpdb->get_row($wpdb->prepare(
       "SELECT * FROM {$wpdb->prefix}bjt_items WHERE id = %d",
       $item_id
     ));
     
     // 确保所有必要字段存在
     $required_fields = array('title', 'code', 'product_line', 'description');
     foreach ($required_fields as $field) {
       if (!isset($item->$field)) {
         $item->$field = '';
       }
     }
     
     return $item;
   }
   ```

## 输出缓冲问题

### 问题：页面内容混乱或布局模板不加载

**原因**：输出缓冲处理不正确

**解决方案**：
1. 确保每个页面都使用统一的输出缓冲模式：
   ```php
   // 页面开始
   $page_title = '页面标题';
   ob_start();
   
   // 页面内容...
   
   // 页面结束
   $page_content = ob_get_clean();
   require_once BJT_PLUGIN_DIR . 'templates/admin/layout/custom-layout.php';
   ```

2. 检查是否有意外的输出：
   ```php
   // 调试输出缓冲内容
   $buffer = ob_get_contents();
   error_log('Buffer内容: ' . substr($buffer, 0, 500) . '...');
   ```

3. 临时解决方案：禁用自定义布局，使用标准WordPress管理界面：
   ```php
   // 当布局问题无法快速解决时
   function render_simple_page($title, $template_file) {
     echo '<div class="wrap">';
     echo '<h1>' . esc_html($title) . '</h1>';
     include $template_file;
     echo '</div>';
   }
   ```

## 插件冲突

### 问题：BJT插件与其他插件冲突

**原因**：JavaScript或CSS冲突，或钩子优先级问题

**解决方案**：
1. 使用命名空间避免函数名冲突：
   ```php
   // 添加BJT前缀到所有函数和变量
   function bjt_process_data() { ... }
   ```

2. 隔离CSS：
   ```css
   /* 将所有样式放在特定类下 */
   .bjt-admin-wrap * {
     /* 插件特定样式 */
   }
   ```

3. 检查WordPress钩子优先级：
   ```php
   // 使用更高优先级确保我们的代码后执行
   add_action('admin_enqueue_scripts', array($this, 'enqueue_styles'), 100);
   ```

## 紧急恢复步骤

如果重构过程中发生严重问题，请按照以下步骤恢复：

1. **停用插件**：
   ```bash
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin deactivate bjt-product-admin --allow-root
   ```

2. **恢复备份文件**：
   ```bash
   cp -r plugins/bjt-product-admin/templates.bak/* plugins/bjt-product-admin/templates/
   cp plugins/bjt-product-admin/bjt-product-admin.php.bak plugins/bjt-product-admin/bjt-product-admin.php
   ```

3. **清除缓存**：
   ```bash
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp cache flush --allow-root
   ```

4. **重新激活插件**：
   ```bash
   docker-compose -f docker/dev/docker-compose.dev.yml exec wordpress wp plugin activate bjt-product-admin --allow-root
   ```

## 已知问题与待解决项

以下是已知的问题，由于时间限制，在2小时重构中可能无法解决：

1. **导航高亮问题**：子菜单项在某些情况下无法正确高亮显示
2. **多语言切换**：产品线名称在切换语言时不完全翻译
3. **表单验证**：某些表单缺少前端验证
4. **移动适配**：管理界面在移动设备上显示不理想

这些问题将在后续更新中逐步解决。 