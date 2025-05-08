# BJT产品管理系统快速重构计划 (2小时版)

## 关键问题

1. **目录结构混乱**：模板存放位置不一致
2. **命名不统一**：产品类型命名混用
3. **产品线分类缺失**：无法按产品线筛选
4. **UI不一致**：各管理页面风格不同

## 2小时重构目标

1. 统一模板加载机制
2. 实现基本产品线筛选功能
3. 标准化页面布局结构
4. 修复最严重的代码问题

## 快速实施计划

### 阶段1：修复架构问题（30分钟）

1. **模板加载统一**
   - 修改所有管理页面使用相同的输出缓冲模式
   - 确保所有页面正确加载自定义布局

2. **常量定义清理**
   - 在主插件文件中添加缺失的常量定义
   - 确保所有文件使用统一的常量访问模式

### 阶段2：产品线筛选功能（45分钟）

1. **简易过滤器实现**
   - 在所有列表页面顶部添加产品线下拉选择框
   - 修改现有查询以支持产品线参数过滤

2. **数据关联**
   - 在数据读取函数中添加产品线参数
   - 确保页面间跳转保留产品线筛选状态

### 阶段3：UI统一（30分钟）

1. **页面布局标准化**
   - 应用统一的页眉/页脚
   - 确保表单元素风格一致
   - 统一错误和成功消息显示

2. **导航优化**
   - 调整主菜单结构以反映产品线分组
   - 修复菜单高亮显示问题

### 阶段4：测试与部署（15分钟）

1. **快速测试**
   - 验证所有管理页面能正常加载
   - 测试产品线筛选功能
   - 检查页面间导航流程

2. **部署**
   - 停用并重新激活插件
   - 验证所有功能正常工作

## 优先任务详细说明

1. **统一模板加载机制**
   ```php
   // 在每个管理页面顶部添加
   $page_title = '页面标题';
   ob_start();
   // 页面内容...
   $page_content = ob_get_clean();
   require_once BJT_PLUGIN_DIR . 'templates/admin/layout/custom-layout.php';
   ```

2. **产品线下拉筛选器**
   ```php
   // 添加到每个列表页面顶部
   <div class="bjt-filter-controls">
     <select id="product-line-filter" name="product_line">
       <option value="">所有产品线</option>
       <option value="air_cushion" <?php selected(isset($_GET['product_line']) ? $_GET['product_line'] : '', 'air_cushion'); ?>>气垫机</option>
       <option value="paper" <?php selected(isset($_GET['product_line']) ? $_GET['product_line'] : '', 'paper'); ?>>纸机</option>
       <option value="tape" <?php selected(isset($_GET['product_line']) ? $_GET['product_line'] : '', 'tape'); ?>>胶带机</option>
       <option value="air_column" <?php selected(isset($_GET['product_line']) ? $_GET['product_line'] : '', 'air_column'); ?>>气柱袋</option>
     </select>
     <button type="submit" class="button">筛选</button>
   </div>
   ```

3. **查询修改示例**
   ```php
   // 修改数据查询函数
   function get_items($product_line = '') {
     global $wpdb;
     $where = '';
     $params = array();
     
     if (!empty($product_line)) {
       $where = " WHERE product_line = %s";
       $params[] = $product_line;
     }
     
     return $wpdb->get_results(
       $wpdb->prepare("SELECT * FROM {$wpdb->prefix}bjt_items{$where}", $params)
     );
   }
   ```

## 暂不处理的问题

由于时间限制，以下问题将在后续更新中解决：

1. 数据库表结构优化
2. 完整的代码重构
3. 详细的文档更新
4. 完善的单元测试

## 实施后的验收标准

成功的2小时重构应达到以下目标：

1. 所有管理页面加载不报错
2. 产品线筛选功能可用
3. 页面布局风格一致
4. 无明显功能缺陷

## 风险与应急措施

1. **风险**：页面布局崩溃
   **应对**：准备回滚脚本，保存所有文件的备份

2. **风险**：数据查询出错
   **应对**：添加错误处理代码，确保页面不会完全崩溃

## 后续建议

完成这个2小时的快速重构后，建议：

1. 制定更全面的长期重构计划
2. 优先解决剩余的UI一致性问题
3. 逐步实现更完善的产品线管理功能
4. 更新系统文档以反映新的结构和功能 