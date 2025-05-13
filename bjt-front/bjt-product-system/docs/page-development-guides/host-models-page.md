# 主机型号列表页面开发指南

## ⚠️ 路径规范警告

**严格遵循路径规范是确保项目顺利进行的关键**。请注意：

- 此页面必须实现在 `templates/admin/host-models/list.php` 路径
- 不要使用旧的 `templates/admin/hosts/list.php` 路径
- 所有子页面也必须遵循 `host-models/` 目录结构
- 参考 [路径映射规范](../rules/PATH-MAPPING.md) 获取更多详情

## 1. 页面基本信息

- **页面名称**: 主机型号列表
- **📁 页面路径**: `templates/admin/host-models/list.php` (**必须严格遵循此路径**)
- **对应 Mockup**: 主机管理页面 (2.html)
- **优先级**: P0 (核心功能，必须实现)
- **相关子页面**:
  - **新增型号页面**: `templates/admin/host-models/add.php` (对应 Mockup: 3.html)
    - 功能: 创建新的主机型号，包含基础信息、多语言说明和图片上传
  - **编辑型号页面**: `templates/admin/host-models/edit.php` (对应 Mockup: 3.html)
    - 功能: 编辑已有主机型号的信息，与新增页面结构相同但预填数据
  - **新增料号页面**: `templates/admin/host-models/part-add.php` (对应 Mockup: 4.html)
    - 功能: 为选定型号创建新料号，包含基础信息、规格和物流参数
  - **编辑料号页面**: `templates/admin/host-models/part-edit.php` (对应 Mockup: 4.html)
    - 功能: 编辑已有料号的详细信息，与新增页面结构相同但预填数据

## 2. 数据关系

### 2.1 数据表关联
- **主表**: `wp_bjt_host_models` (主机型号表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识(air_cushion/paper_machine/tape_machine/air_column)
    - `model`: varchar(100) - 主机型号编码
    - `title_cn`: varchar(255) - 中文名称
    - `title_en`: varchar(255) - 英文名称
    - `description_cn`: text - 中文描述
    - `description_en`: text - 英文描述
    - `type`: text - 主机类型
    - `image1_url`: varchar(255) - 主图URL
    - `image2_url`: varchar(255) - 副图URL
    - `explosion_diagram_pdf`: varchar(255) - 爆炸图PDF文件URL
    - `status`: varchar(20) - 状态，默认值'publish'
    - `menu_order`: int(11) - 排序顺序
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **关联表**: `wp_bjt_parts` (主机料号表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `model`: varchar(100) - 型号
    - `voltage`: varchar(50) - 电压
    - `image_url`: varchar(255) - 图片URL
    - `part_number`: varchar(100) - 料号
    - `name_cn`: varchar(255) - 中文名称
    - `name_en`: varchar(255) - 英文名称
    - `brand`: varchar(100) - 品牌
    - `spec`: varchar(255) - 规格参数(公制)
    - `spec_imperial`: varchar(255) - 规格参数(英制)
    - `package_size_cm`: varchar(100) - 包装尺寸(cm)
    - `package_size_inch`: varchar(100) - 包装尺寸(inch)
    - `net_weight_kg`: decimal(10,2) - 单件净重(kg)
    - `net_weight_lbs`: decimal(10,2) - 单件净重(lbs)
    - `gross_weight_kg`: decimal(10,2) - 包装毛重(kg)
    - `gross_weight_lbs`: decimal(10,2) - 包装毛重(lbs)
    - `pcs_per_box`: int(11) - 单箱数量
    - `pallet_size_cm`: varchar(100) - 托盘尺寸(cm)
    - `pallet_size_inch`: varchar(100) - 托盘尺寸(inch)
    - `pcs_per_pallet`: int(11) - 一托数量
    - `pallet_height_cm`: decimal(10,2) - 打托高度(cm)
    - `pallet_height_inch`: decimal(10,2) - 打托高度(inch)
    - `pallet_gross_weight_kg`: decimal(10,2) - 整托毛重(kg)
    - `pallet_gross_weight_lbs`: decimal(10,2) - 整托毛重(lbs)
    - `status`: varchar(20) - 状态，默认值'publish'
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **关联关系**: 
  - 料号表中的`model`字段关联到主机型号表的`model`字段
  - 两者按`product_line`和`model`关联
  - 唯一索引：`wp_bjt_host_models`表中(`product_line`, `model`)
  - 唯一索引：`wp_bjt_parts`表中(`product_line`, `part_number`)
  - 普通索引：`wp_bjt_parts`表中(`product_line`, `model`)

### 2.2 API 接口
- `GET /wp-json/bjt/v1/host-models`: 获取主机型号列表
- `DELETE /wp-json/bjt/v1/host-models/{id}`: 删除主机型号
- `GET /wp-json/bjt/v1/parts`: 获取料号列表（支持按主机型号筛选）
- `DELETE /wp-json/bjt/v1/parts/{id}`: 删除料号
- `POST /wp-json/bjt/v1/host-models/import`: 导入主机型号数据
- `GET /wp-json/bjt/v1/host-models/export`: 导出主机型号数据
- `POST /wp-json/bjt/v1/parts/import`: 导入料号数据
- `GET /wp-json/bjt/v1/parts/export`: 导出料号数据

## 3. 页面结构

### 3.1 必须实现的组件
以下组件必须完整实现，与 Mockup 设计保持一致:

- [ ] **页面标题区域**: 显示"主机管理"标题
- [ ] **主机型号表格区域**: 
  - [ ] 表头区域
    - [ ] 表格标题 ("主机型号")
    - [ ] 导入按钮
    - [ ] 导出按钮
    - [ ] 新增型号按钮
  - [ ] 表格内容
    - [ ] 编号列
    - [ ] 型号列
    - [ ] 型号名称列
    - [ ] 产品线列
    - [ ] 状态列
    - [ ] 操作列（编辑、删除、上架/下架）
  - [ ] 分页控件
- [ ] **料号表格区域**: 
  - [ ] 表头区域
    - [ ] 表格标题 ("料号列表")
    - [ ] 筛选区域（主机、料号筛选）
    - [ ] 导入按钮
    - [ ] 导出按钮
    - [ ] 新增料号按钮
  - [ ] 表格内容
    - [ ] 编号列
    - [ ] 型号列
    - [ ] 料号列
    - [ ] 产品线列
    - [ ] 操作列（编辑、关联、删除）
  - [ ] 分页控件

### 3.2 页面布局要求
```
+------------------------------------------+
|                页头区域                   |
+--------+-------------------------------+
|        |                              |
|        |      主机型号表格区域          |
|        |                              |
|侧边栏   +------------------------------+
|        |                              |
|        |      料号表格区域              |
|        |                              |
+--------+-------------------------------+
```

## 4. 实现标准

### 4.1 HTML结构规范
```html
<!-- 主机管理页面整体结构 -->
<div class="bjt-host-models">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">主机管理</h1>
  </div>
  
  <!-- 主机型号表格区域 -->
  <div class="bjt-card bjt-host-models-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">主机型号</h2>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-import-btn" id="import-host-models">
          <i class="bjt-icon bjt-icon-import"></i> 导入
        </button>
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-host-models">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增型号
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-host-models-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>型号</th>
            <th>型号名称</th>
            <th>产品线</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
    <div class="bjt-card-footer">
      <div class="bjt-pagination" id="host-models-pagination">
        <!-- 分页控件将通过JavaScript动态生成 -->
      </div>
    </div>
  </div>
  
  <!-- 料号表格区域 -->
  <div class="bjt-card bjt-parts-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">料号列表</h2>
      <div class="bjt-card-filter">
        <div class="bjt-filter-field">
          <label for="filter-model">主机型号</label>
          <select id="filter-model" class="bjt-select">
            <option value="">全部</option>
            <!-- 型号选项将通过JavaScript动态生成 -->
          </select>
        </div>
        <div class="bjt-filter-field">
          <label for="filter-part-number">料号</label>
          <input type="text" id="filter-part-number" class="bjt-input" placeholder="输入料号">
        </div>
        <button class="bjt-btn bjt-btn-secondary" id="reset-filters">
          重置
        </button>
      </div>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-import-btn" id="import-parts">
          <i class="bjt-icon bjt-icon-import"></i> 导入
        </button>
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-parts">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add-part')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增料号
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-parts-table">
        <thead>
          <tr>
            <th>编号</th>
            <th>型号</th>
            <th>料号</th>
            <th>产品线</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
    <div class="bjt-card-footer">
      <div class="bjt-pagination" id="parts-pagination">
        <!-- 分页控件将通过JavaScript动态生成 -->
      </div>
    </div>
  </div>
  
  <!-- 导入/导出对话框模板 -->
  <div class="bjt-dialog" id="import-dialog" style="display: none;">
    <!-- 对话框内容 -->
  </div>
</div>
```

### 4.2 CSS样式规范
- 使用BEM命名约定，如`.bjt-host-models__table--active`
- 页面特有样式应当在现有的全局样式基础上进行扩展
- 关键样式变量:
  ```css
  /* 主机管理页面关键样式变量 */
  :root {
    --table-header-bg: #f5f7fa;
    --table-border-color: #e1e5eb;
    --table-row-hover: #f9fafc;
    --card-spacing: 24px;
    --filter-spacing: 16px;
    --action-spacing: 8px;
  }
  
  /* 主机管理页面特定样式 */
  .bjt-host-models-table-container {
    margin-bottom: var(--card-spacing);
  }
  
  .bjt-card-filter {
    display: flex;
    align-items: center;
    gap: var(--filter-spacing);
    margin-bottom: var(--filter-spacing);
  }
  
  .bjt-card-actions {
    display: flex;
    align-items: center;
    gap: var(--action-spacing);
  }
  
  /* 确保两个表格互相独立，避免样式冲突 */
  .bjt-host-models-table-container,
  .bjt-parts-table-container {
    width: 100%;
    overflow-x: auto;
  }
  ```

### 4.3 JavaScript交互规范
```javascript
// 全局变量
let hostModelsTable;
let partsTable;
let selectedHostModel = null;

// 初始化页面
function initHostModelsPage() {
  // 初始化主机型号表格
  initHostModelsTable();
  
  // 初始化料号表格
  initPartsTable();
  
  // 初始化表头按钮事件
  initTableActions();
  
  // 初始化筛选功能
  initFilters();
}

// 初始化主机型号表格
function initHostModelsTable() {
  // 加载主机型号数据
  loadHostModels(1); // 默认加载第一页
  
  // 绑定分页事件
  jQuery('#host-models-pagination').on('click', '.bjt-pagination-item', function(e) {
    e.preventDefault();
    const page = jQuery(this).data('page');
    loadHostModels(page);
  });
}

// 加载主机型号数据
function loadHostModels(page) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models',
    method: 'GET',
    data: {
      page: page,
      per_page: 10
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 显示加载中状态
      jQuery('.bjt-host-models-table').addClass('bjt-loading');
    },
    success: function(response, status, xhr) {
      // 更新表格内容
      updateHostModelsTable(response);
      
      // 更新分页
      const totalPages = xhr.getResponseHeader('X-WP-TotalPages');
      updatePagination('#host-models-pagination', page, totalPages);
      
      // 更新料号筛选器的型号选项
      updateModelOptions(response);
    },
    error: function(error) {
      console.error('加载主机型号数据失败', error);
      showNotification('error', '加载主机型号数据失败');
    },
    complete: function() {
      // 移除加载中状态
      jQuery('.bjt-host-models-table').removeClass('bjt-loading');
    }
  });
}

// 初始化料号表格
function initPartsTable() {
  // 加载料号数据
  loadParts(1); // 默认加载第一页
  
  // 绑定分页事件
  jQuery('#parts-pagination').on('click', '.bjt-pagination-item', function(e) {
    e.preventDefault();
    const page = jQuery(this).data('page');
    loadParts(page);
  });
}

// 加载料号数据
function loadParts(page) {
  const filterModel = jQuery('#filter-model').val();
  const filterPartNumber = jQuery('#filter-part-number').val();
  
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/parts',
    method: 'GET',
    data: {
      page: page,
      per_page: 10,
      model: filterModel,
      part_number: filterPartNumber
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 显示加载中状态
      jQuery('.bjt-parts-table').addClass('bjt-loading');
    },
    success: function(response, status, xhr) {
      // 更新表格内容
      updatePartsTable(response);
      
      // 更新分页
      const totalPages = xhr.getResponseHeader('X-WP-TotalPages');
      updatePagination('#parts-pagination', page, totalPages);
    },
    error: function(error) {
      console.error('加载料号数据失败', error);
      showNotification('error', '加载料号数据失败');
    },
    complete: function() {
      // 移除加载中状态
      jQuery('.bjt-parts-table').removeClass('bjt-loading');
    }
  });
}

// 初始化筛选器
function initFilters() {
  // 型号筛选变化时重新加载料号表
  jQuery('#filter-model').on('change', function() {
    loadParts(1);
  });
  
  // 料号筛选输入框回车时重新加载料号表
  jQuery('#filter-part-number').on('keypress', function(e) {
    if (e.which === 13) {
      loadParts(1);
    }
  });
  
  // 重置筛选按钮
  jQuery('#reset-filters').on('click', function() {
    jQuery('#filter-model').val('');
    jQuery('#filter-part-number').val('');
    loadParts(1);
  });
}

// 初始化表头按钮事件
function initTableActions() {
  // 主机型号导入按钮
  jQuery('#import-host-models').on('click', function() {
    showImportDialog('host-models');
  });
  
  // 主机型号导出按钮
  jQuery('#export-host-models').on('click', function() {
    exportHostModels();
  });
  
  // 料号导入按钮
  jQuery('#import-parts').on('click', function() {
    showImportDialog('parts');
  });
  
  // 料号导出按钮
  jQuery('#export-parts').on('click', function() {
    exportParts();
  });
}

// 在页面加载完成后初始化
jQuery(document).ready(function() {
  initHostModelsPage();
});
```

### 4.4 PHP处理规范
```php
/**
 * 渲染主机型号列表页面
 */
function render_host_models_list() {
    // 确保用户有权限访问此页面
    if (!current_user_can('manage_options')) {
        wp_die(__('您没有足够的权限访问此页面。', 'bjt-product-admin'));
    }
    
    // 设置页面标题
    $page_title = __('主机管理', 'bjt-product-admin');
    
    // 开始输出缓冲
    ob_start();
    
    // 获取当前语言
    $current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'cn';
    
    // 获取当前操作
    $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
    
    // 根据操作类型包含不同的模板
    if ($action === 'add') {
        // 包含添加主机型号模板
        include_once BJT_PLUGIN_DIR . 'templates/admin/host-models/add.php';
    } elseif ($action === 'edit' && isset($_GET['id'])) {
        // 包含编辑主机型号模板
        include_once BJT_PLUGIN_DIR . 'templates/admin/host-models/edit.php';
    } elseif ($action === 'add-part') {
        // 包含添加料号模板
        include_once BJT_PLUGIN_DIR . 'templates/admin/host-models/part-add.php';
    } elseif ($action === 'edit-part' && isset($_GET['id'])) {
        // 包含编辑料号模板
        include_once BJT_PLUGIN_DIR . 'templates/admin/host-models/part-edit.php';
    } else {
        // 默认显示列表页
        ?>
        <div class="bjt-host-models">
            <!-- 页面内容，按照HTML结构规范实现 -->
        </div>
        <?php
    }
    
    // 获取输出缓冲内容并清空缓冲
    $output = ob_get_clean();
    
    // 使用主布局模板包装输出
    include_once BJT_PLUGIN_DIR . 'templates/admin/layout/mockup-page-wrapper.php';
}
```

## 5. 验收标准

### 5.1 功能验收标准
- [ ] 主机型号表能够正确显示数据，包括分页功能
- [ ] 料号表能够正确显示数据，包括分页功能
- [ ] 筛选功能能够正确过滤料号数据
- [ ] 导入/导出功能正常工作，支持CSV/Excel格式
- [ ] 新增、编辑、删除、状态切换等操作正常工作
- [ ] 主机型号与料号之间的关联关系正确维护
- [ ] 批量操作功能（如批量删除）正常工作

### 5.2 视觉一致性标准
- [ ] 页面布局与Mockup设计完全一致，包括两个表格的存在和布局
- [ ] 表头按钮样式、位置与设计稿一致
- [ ] 表格样式（边框、行高、颜色等）与设计稿一致
- [ ] 筛选区域的布局和样式与设计稿一致
- [ ] 分页控件的样式与设计稿一致
- [ ] 响应式布局正确实现，在不同屏幕尺寸下显示正常

### 5.3 代码质量标准
- [ ] 代码结构清晰，功能模块化
- [ ] PHP代码遵循WordPress编码标准
- [ ] JavaScript代码组织良好，避免全局变量污染
- [ ] 使用适当的安全措施（如数据转义、nonce验证等）
- [ ] 代码包含适当的注释，解释复杂逻辑
- [ ] 两个表格的代码实现独立且无冗余

### 5.4 性能标准
- [ ] 页面加载时间在可接受范围内（首次内容绘制 < 1.5秒）
- [ ] 表格数据异步加载，避免页面阻塞
- [ ] 分页功能有效减少一次性加载的数据量
- [ ] 筛选功能能够高效执行，不造成性能瓶颈
- [ ] 导入/导出功能能够处理大量数据，并提供进度指示

## 6. 开发流程

### 6.1 开发前准备
1. 仔细研究Mockup设计，理解主机型号和料号两个表格的布局和交互关系
2. 确认所有API端点已实现，包括导入/导出功能
3. 确认数据库表结构已准备就绪，特别是主机型号和料号之间的关联关系
4. 准备测试数据，以便验证功能

### 6.2 开发步骤
1. **创建基本页面结构**
   - 实现页面标题区域
   - 实现主机型号表格区域的布局
   - 实现料号表格区域的布局
   - 确保两个表格区域的布局符合设计稿
   
2. **主机型号表格实现**
   - 实现表头区域，包括标题和按钮
   - 实现表格主体，准备数据加载
   - 实现分页控件
   - 实现数据加载和展示功能
   
3. **料号表格实现**
   - 实现表头区域，包括标题、筛选区域和按钮
   - 实现表格主体，准备数据加载
   - 实现分页控件
   - 实现数据加载和展示功能
   
4. **交互功能实现**
   - 实现筛选功能，当选择不同主机型号时筛选料号
   - 实现导入/导出功能
   - 实现新增、编辑、删除等操作
   - 实现状态切换功能
   
5. **完善和优化**
   - 优化样式，确保与设计稿视觉一致
   - 实现响应式布局
   - 添加加载状态和错误处理
   - 优化性能，特别是表格数据加载和筛选性能

### 6.3 开发过程检查点
- [ ] 页面基本结构包含两个独立的表格区域
- [ ] 主机型号表格能够正确加载和显示数据
- [ ] 料号表格能够正确加载和显示数据
- [ ] 筛选功能正常工作，能够按主机型号和料号筛选
- [ ] 导入/导出功能实现并测试通过
- [ ] 所有交互功能正常工作，包括新增、编辑、删除等
- [ ] 样式与设计稿视觉一致
- [ ] 响应式布局在不同屏幕尺寸下正常工作

## 7. 常见问题与最佳实践

### 7.1 避免常见问题
- **结构问题**:
  - 避免合并两个表格或省略料号表格，这是之前实现的主要问题
  - 避免在单个表格中尝试展示两种不同的数据类型
  - 避免表格之间的样式相互干扰
  
- **数据加载问题**:
  - 避免在页面加载时一次性请求所有数据，应使用分页加载
  - 避免在用户筛选时重新加载整个页面，应使用AJAX更新表格内容
  - 避免硬编码表格列和筛选条件，应根据API返回的数据动态生成
  
- **交互问题**:
  - 避免导入/导出功能不考虑大数据量情况
  - 避免在删除操作时缺少确认步骤
  - 避免在用户操作后缺少反馈，如成功/失败提示

### 7.2 最佳实践建议
- **结构最佳实践**:
  - 使用独立的容器和ID为两个表格分离结构和样式
  - 使用语义化的HTML结构，明确区分表头、表体和表尾
  - 为每个操作按钮添加合适的图标和提示文本
  
- **数据处理最佳实践**:
  - 实现缓存机制，避免频繁重复请求相同数据
  - 对用户输入进行防抖处理，避免频繁触发筛选请求
  - 使用批量操作替代多次单独操作，提高效率
  
- **用户体验最佳实践**:
  - 提供清晰的加载状态指示，如骨架屏或加载动画
  - 为所有操作提供即时反馈，如成功/失败提示
  - 实现表格行高亮功能，帮助用户追踪当前选择的记录
  - 确保表格在无数据时显示友好的空状态提示
  - 确保所有按钮和控件有合适的悬停和点击效果

- **导入/导出最佳实践**:
  - 提供样板文件下载，帮助用户了解正确的数据格式
  - 实现导入数据的预览和验证功能，避免错误数据进入系统
  - 对导入/导出大文件提供进度指示和分批处理机制
  - 在导出文件中包含元数据，如导出时间、用户等 