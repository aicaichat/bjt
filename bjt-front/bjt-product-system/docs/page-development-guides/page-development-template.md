# 页面开发指南模板

## ⚠️ 路径规范警告

**严格遵循路径规范是确保项目顺利进行的关键**。本指南中指定的路径必须准确无误地实现，以避免与现有代码冲突。

- 所有页面路径必须与指南中指定的路径完全匹配，包括目录名和文件名
- 注意目录名称中的连字符、下划线等细节
- 请勿将内容放在非指定路径，即使旧系统可能使用了相似但不同的路径
- 如果同名目录已存在，请确认您正在使用正确的目录（新目录可能使用了略有不同的命名）

## ⚠️ 产品线参数处理规范

本系统采用了统一的产品线处理机制，所有页面**必须**按照以下规范处理产品线参数:

- 每个功能页面(如主机管理、配件管理等)只实现一次，通过URL的`product_line`参数区分不同产品线的数据
- 所有页面应从`$_GET['product_line']`获取当前产品线参数，并在所有链接和表单中保持此参数
- 数据库查询必须根据产品线参数过滤数据
- 页面标题、筛选器等应显示当前产品线信息
- 添加/编辑表单应自动将当前产品线作为默认值

主要产品线ID:
- `bubble-machine`: 气垫机
- `paper-machine`: 纸机
- `tape-machine`: 胶带机
- `air-pillow-bag`: 气柱袋

## 1. 页面基本信息

- **页面名称**: [页面名称]
- **📁 页面路径**: `[文件路径，如 templates/admin/host-models/list.php]` (**必须严格遵循此路径**)
- **对应 Mockup**: [对应设计文件名称，如 2.html]
- **优先级**: [P0/P1/P2] (P0 = 核心功能，必须实现；P1 = 高优先级；P2 = 低优先级)

## 2. 数据关系

### 2.1 数据表关联
- **主表**: [表名]
  - 主要字段: `id`, `product_line`, `[字段1]`, `[字段2]`, ...
- **关联表**: [表名]
  - 主要字段: `id`, `product_line`, `[字段1]`, `[字段2]`, ...
- **关联关系**: [描述表之间的关联关系]

### 2.2 API 接口
- `GET [端点]`: [描述API功能，如获取列表、详情等]，必须支持`product_line`参数
- `POST [端点]`: [描述API功能，如创建新记录]，记录关联到指定产品线
- `PUT [端点]`: [描述API功能，如更新记录]
- `DELETE [端点]`: [描述API功能，如删除记录]

### 2.3 字段验证规则 (适用于表单页面)
- `product_line`: 必填，有效的产品线ID
- `[字段名]`: [验证规则，如必填、唯一、长度限制等]
- `[字段名]`: [验证规则]
- ...

## 3. 页面结构

### 3.1 必须实现的组件
以下组件必须完整实现，与 Mockup 设计保持一致:

- [ ] **产品线标识组件**: 在页面标题处显示当前产品线名称
- [ ] **组件1**: [组件详细描述]
  - [ ] 子组件1
  - [ ] 子组件2
- [ ] **组件2**: [组件详细描述]
- [ ] ...

### 3.2 页面布局要求
```
[使用ASCII图表示页面结构的简略布局]
+----------------------+
|  产品线名称 - 页头区域  |
+------+---------------+
|      |               |
|侧边栏|    内容区     |
|      |               |
+------+---------------+
```

## 4. 实现标准

### 4.1 HTML结构规范
```html
<!-- 关键组件HTML结构示例 -->
<div class="component-name">
  <div class="component-header">
    <h1><?php echo !empty($product_line_name) ? sprintf(__('%s - 页面标题', 'bjt-product-admin'), $product_line_name) : __('页面标题', 'bjt-product-admin'); ?></h1>
  </div>
  <div class="component-body">
    <!-- 主体内容结构 -->
  </div>
</div>
```

### 4.2 CSS样式规范
- 使用BEM命名约定: `.block__element--modifier`
- 页面特有样式应当在现有的全局样式基础上进行扩展
- 关键样式变量:
  ```css
  /* 关键样式变量 */
  :root {
    --component-bg: #ffffff;
    --component-text: #333333;
    --component-border: 1px solid #e0e0e0;
    --component-spacing: 16px;
  }
  ```

### 4.3 JavaScript交互规范
```javascript
// 页面初始化 - 产品线处理
jQuery(document).ready(function($) {
  // 获取当前产品线
  const currentProductLine = '<?php echo esc_js($current_product_line); ?>';
  
  // 初始化表格
  function initTableData() {
    // AJAX请求时包含产品线参数
    $.ajax({
      url: ajaxurl,
      data: {
        action: 'bjt_get_data',
        product_line: currentProductLine,
        // 其他参数...
      },
      // 成功回调...
    });
  }
  
  // 处理添加按钮 - 保留产品线参数
  $('#add-button').on('click', function() {
    window.location.href = '<?php echo admin_url("admin.php?page=bjt-page-name&action=new&product_line=" . esc_js($current_product_line)); ?>';
  });
  
  // 其他交互逻辑...
});
```

### 4.4 PHP处理规范
```php
/**
 * 页面渲染函数
 */
function render_page() {
  // 确保用户有权限
  if (!current_user_can('manage_options')) {
    wp_die(__('您没有足够的权限访问此页面。', 'bjt-product-admin'));
  }
  
  // 获取当前产品线
  global $current_product_line;
  
  // 获取产品线名称
  $product_line_name = '';
  if (!empty($current_product_line)) {
    global $wpdb;
    $table = $wpdb->prefix . 'bjt_product_lines';
    $result = $wpdb->get_row($wpdb->prepare(
      "SELECT title_cn FROM $table WHERE id = %s LIMIT 1",
      $current_product_line
    ));
    if ($result) {
      $product_line_name = $result->title_cn;
    }
  }
  
  // 开始输出缓冲
  ob_start();
  
  // [页面内容...]
  
  // 获取缓冲内容
  $content = ob_get_clean();
  
  // 使用布局模板
  include BJT_PLUGIN_DIR . 'templates/admin/layout/app.php';
}

/**
 * 数据库查询示例 - 过滤产品线
 */
function get_filtered_data($product_line) {
  global $wpdb;
  $table = $wpdb->prefix . '[表名]';
  
  $where = array();
  $where_format = array();
  
  if (!empty($product_line)) {
    $where[] = 'product_line = %s';
    $where_format[] = $product_line;
  }
  
  // 添加其他筛选条件...
  
  // 构建WHERE子句
  $where_clause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);
  
  // 执行查询
  $query = "SELECT * FROM $table $where_clause";
  $results = $wpdb->get_results($wpdb->prepare($query, $where_format));
  
  return $results;
}
```

## 5. 验收标准

### 5.1 功能验收标准
- [ ] 所有必须实现的组件都已完成
- [ ] 产品线参数正确处理，页面根据产品线参数显示正确数据
- [ ] 所有链接和表单保留产品线参数
- [ ] 所有交互功能正常工作
- [ ] 所有API接口正确调用并处理响应
- [ ] 数据正确显示、保存和验证
- [ ] 多语言支持正常工作

### 5.2 视觉一致性标准
- [ ] 页面布局与Mockup设计一致
- [ ] 产品线名称正确显示在页面标题中
- [ ] 组件间距与设计稿一致，误差不超过2px
- [ ] 颜色编码与设计系统完全一致
- [ ] 字体大小、粗细、行高与设计稿一致
- [ ] 响应式布局正确实现，在不同屏幕尺寸下显示正常

### 5.3 代码质量标准
- [ ] 代码结构清晰，使用适当的注释
- [ ] 遵循WordPress编码标准
- [ ] 产品线参数处理逻辑清晰，没有硬编码产品线ID
- [ ] 没有未使用的代码或资源
- [ ] 适当处理错误和异常情况
- [ ] CSS选择器具有适当的特异性，避免过度依赖!important

### 5.4 性能标准
- [ ] 页面加载时间在可接受范围内 (首次内容绘制 < 1.5秒)
- [ ] 资源使用高效，避免不必要的请求
- [ ] 大型数据集实现分页或无限滚动
- [ ] 实现必要的数据缓存机制

## 6. 开发流程

### 6.1 开发前准备
1. 仔细研究Mockup设计，理解页面结构和交互逻辑
2. 确认所有必需的API端点已可用，并支持产品线参数
3. 确认数据库表结构已准备就绪，包含产品线字段
4. 准备所需的资源文件(图标、样式等)

### 6.2 开发步骤
1. 创建页面基本结构，包括主要组件布局
2. 实现产品线参数处理逻辑
3. 实现数据加载和展示功能，根据产品线过滤数据
4. 实现用户交互功能，确保所有链接和表单保留产品线参数
5. 优化样式和响应式布局
6. 添加错误处理和表单验证
7. 实现多语言支持

### 6.3 开发过程检查点
- [ ] 初始HTML结构与Mockup一致
- [ ] 产品线参数正确获取和处理
- [ ] 数据加载和展示根据产品线正确过滤
- [ ] 用户交互功能工作正常，链接和表单保留产品线参数
- [ ] 样式和响应式布局完善
- [ ] 错误处理和表单验证有效
- [ ] 多语言支持正常工作

## 7. 常见问题与最佳实践

### 7.1 避免常见问题
- 避免直接在现有WordPress样式上添加样式，应使用专用的容器隔离样式
- 避免混合使用不同的CSS方法(如Flexbox和浮动)
- 避免硬编码产品线ID，应使用变量或常量
- 避免忽略产品线参数，所有数据库查询和链接生成都需考虑产品线
- 避免使用过于复杂的选择器
- 避免重复实现已有功能，尽量使用现有组件和函数

### 7.2 最佳实践建议
- 使用语义化的HTML结构
- 页面划分为明确的组件，每个组件有单独的责任
- 所有字符串应支持国际化
- 使用预处理语句进行数据库操作，保证参数安全
- 所有数据库查询必须加入产品线条件
- 所有链接和表单提交都要保留产品线参数
- 实现适当的用户反馈机制(加载状态、成功/错误提示)
- 遵循一致的命名惯例 
 