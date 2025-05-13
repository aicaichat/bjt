# 关联关系管理页面开发指南

## 1. 页面基本信息

- **页面名称**: 关联关系管理
- **页面路径**: templates/admin/relations/list.php
- **对应 Mockup**: 关联关系管理页面 (5.html)
- **优先级**: P1 (重要功能，应当实现)
- **相关子页面**:
  - **新增关联关系页面**: `relations/add.php` (对应 Mockup: 6.html)
    - 功能: 创建新的配件关联关系，允许为主机或配件添加下级配件

## 2. 数据关系

### 2.1.数据表关联
- **主表**: `wp_bjt_relations` (关联关系表)
  - **所有字段**:
    - `id`: bigint(20) - 自增主键
    - `product_line`: varchar(50) - 产品线标识
    - `parent_part_number`: varchar(100) - 父项料号
    - `child_part_number`: varchar(100) - 子项料号
    - `child_type`: ENUM('accessory', 'spare_part') - 子项类型：配件/备件
    - `level`: int(11) - 层级(1-5)，备件固定为1
    - `quantity`: int(11) - 数量，默认值1
    - `required_part_number`: varchar(100) - 必选备件料号
    - `required_quantity`: int(11) - 必选备件数量，默认值1
    - `menu_order`: int(11) - 同级排序，默认值0
    - `status`: varchar(20) - 状态，默认值'publish'
    - `created_at`: datetime - 创建时间
    - `updated_at`: datetime - 更新时间

- **关联表**: 
  - `wp_bjt_parts`: 主机料号表（获取主机信息）
    - 关键字段: `product_line`, `part_number`, `name_cn`, `name_en`
  - `wp_bjt_accessories`: 配件料号表（获取配件信息）
    - 关键字段: `product_line`, `part_number`, `name_cn`, `name_en`
  - `wp_bjt_spare_parts`: 备件料号表（获取备件信息）
    - 关键字段: `product_line`, `part_number`, `name_cn`, `name_en`

- **关联关系**:
  - 关联关系表的`parent_part_number`字段可以关联到主机料号表或配件料号表的`part_number`字段
  - 关联关系表的`child_part_number`字段可以关联到配件料号表或备件料号表的`part_number`字段
  - 通过`level`字段区分配件的层级关系，支持最多5级关联
  - 唯一索引：`wp_bjt_relations`表中(`product_line`, `parent_part_number`, `child_part_number`)

### 2.2 API 接口
- `GET /wp-json/bjt/v1/relations`: 获取关联关系列表
- `DELETE /wp-json/bjt/v1/relations/{id}`: 删除关联关系
- `GET /wp-json/bjt/v1/relations/hierarchy`: 获取多级配件层次结构
- `GET /wp-json/bjt/v1/parts/{part_number}`: 获取主机料号详情
- `GET /wp-json/bjt/v1/accessories`: 获取配件列表（用于选择）
- `POST /wp-json/bjt/v1/relations`: 创建新关联关系

### 2.3 字段验证规则
- `product_line`: 必填，有效的产品线标识
- `parent_part_number`: 必填，存在的料号
- `child_part_number`: 必填，存在的料号
- `child_type`: 必填，枚举值：'accessory', 'spare_part'
- `level`: 必填，整数（1-5）
- `quantity`: 必填，整数，默认1

## 3. 页面结构

### 3.1 必须实现的组件
以下组件必须完整实现，与 Mockup 设计保持一致:

- [ ] **页面标题区域**: 显示"关联关系管理"标题
- [ ] **当前机型和料号显示区域**:
  - [ ] 显示当前选中的主机型号和料号
  - [ ] 重置按钮
- [ ] **一级配件区域**:
  - [ ] 表头区域
    - [ ] 表格标题 ("一级配件")
    - [ ] 新增一级配件按钮
  - [ ] 表格内容
    - [ ] 单选按钮列
    - [ ] 编号列
    - [ ] 型号列
    - [ ] 料号列
    - [ ] 操作列（删除）
    - [ ] "显示下一级配件"功能
- [ ] **二至五级配件区域**:
  - [ ] 标题显示归属关系
  - [ ] 表格与一级配件结构相同
  - [ ] 递进式层级展示

### 3.2 页面布局要求
```
+------------------------------------------+
|                页头区域                   |
+--------+--------------------------------+
|        |                               |
|        |     当前机型和料号显示区域        |
|        |                               |
|侧边栏   +-------------------------------+
|        |                               |
|        |     一级配件表格区域            |
|        |                               |
|        +-------------------------------+
|        |                               |
|        |     二级配件表格区域            |
|        |     (选中一级配件时显示)        |
|        |                               |
+--------+--------------------------------+
```

## 4. 实现标准

### 4.1 HTML结构规范
```html
<!-- 关联关系管理页面整体结构 -->
<div class="bjt-relations">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">关联关系管理</h1>
  </div>
  
  <!-- 当前机型和料号显示区域 -->
  <div class="bjt-card bjt-current-host">
    <div class="bjt-card-body">
      <div class="bjt-current-host__content">
        <div class="bjt-current-host__info">
          <div class="bjt-current-host__label">当前机型:</div>
          <div class="bjt-current-host__value" id="current-host-model">
            <?php echo isset($_GET['model']) ? esc_html($_GET['model']) : '未选择'; ?>
          </div>
        </div>
        <div class="bjt-current-host__info">
          <div class="bjt-current-host__label">料号:</div>
          <div class="bjt-current-host__value" id="current-host-part-number">
            <?php echo isset($_GET['part_number']) ? esc_html($_GET['part_number']) : '未选择'; ?>
          </div>
        </div>
      </div>
      <div class="bjt-current-host__actions">
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relations')); ?>" class="bjt-btn bjt-btn-secondary">
          重置
        </a>
      </div>
    </div>
  </div>
  
  <!-- 一级配件区域 -->
  <div class="bjt-card bjt-level-accessories" id="level-1-accessories">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">一级配件</h2>
      <div class="bjt-card-actions">
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relations&action=add&level=1' . (isset($_GET['part_number']) ? '&parent=' . esc_attr($_GET['part_number']) : ''))); ?>" class="bjt-btn bjt-btn-primary" <?php echo !isset($_GET['part_number']) ? 'disabled' : ''; ?>>
          <i class="bjt-icon bjt-icon-plus"></i> 新增一级配件
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-accessories-table">
        <thead>
          <tr>
            <th class="bjt-radio-column"></th>
            <th>编号</th>
            <th>型号</th>
            <th>料号</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="level-1-accessories-list">
          <!-- 表格内容将通过JavaScript动态生成 -->
          <tr class="bjt-table-loading-row">
            <td colspan="5" class="bjt-table-loading">
              <div class="bjt-loading-spinner"></div> 加载中...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- 二级配件区域（初始隐藏） -->
  <div class="bjt-card bjt-level-accessories" id="level-2-accessories" style="display: none;">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">二级配件 (属于 <span id="parent-accessory-name">-</span>)</h2>
      <div class="bjt-card-actions">
        <a href="#" class="bjt-btn bjt-btn-primary" id="add-level-2-accessory">
          <i class="bjt-icon bjt-icon-plus"></i> 新增二级配件
        </a>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-accessories-table">
        <thead>
          <tr>
            <th class="bjt-radio-column"></th>
            <th>编号</th>
            <th>型号</th>
            <th>料号</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="level-2-accessories-list">
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- 更高级别的配件区域将动态生成 -->
</div>
```

### 4.2 CSS样式规范
- 使用BEM命名约定，如`.bjt-relations__level--active`
- 页面特有样式应当在现有的全局样式基础上进行扩展
- 关键样式变量:
  ```css
  /* 关联关系管理页面关键样式变量 */
  :root {
    --card-spacing: 24px;
    --level-indent: 20px;
    --selected-row-bg: #f0f7ff;
    --parent-link-color: #0066cc;
  }
  
  /* 关联关系管理页面特定样式 */
  .bjt-current-host {
    margin-bottom: var(--card-spacing);
  }
  
  .bjt-current-host__content {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    flex: 1;
  }
  
  .bjt-current-host__info {
    display: flex;
    align-items: center;
  }
  
  .bjt-current-host__label {
    font-weight: 500;
    margin-right: 8px;
  }
  
  .bjt-current-host__value {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .bjt-current-host__actions {
    margin-left: auto;
  }
  
  .bjt-level-accessories {
    margin-bottom: var(--card-spacing);
  }
  
  .bjt-level-accessories + .bjt-level-accessories {
    margin-left: var(--level-indent);
  }
  
  .bjt-radio-column {
    width: 40px;
    text-align: center;
  }
  
  .bjt-table tr.bjt-selected-row {
    background-color: var(--selected-row-bg);
  }
  
  .bjt-parent-accessory {
    color: var(--parent-link-color);
    font-weight: 500;
  }
  ```

### 4.3 JavaScript交互规范
```javascript
// 全局变量
let currentHostPartNumber = null;
let selectedAccessories = {};

// 初始化页面
function initRelationsPage() {
  // 获取当前主机料号（如果在URL中存在）
  currentHostPartNumber = getUrlParam('part_number');
  
  if (currentHostPartNumber) {
    // 加载一级配件
    loadLevelAccessories(1, currentHostPartNumber);
  } else {
    // 显示空状态
    showEmptyState(1);
  }
  
  // 绑定一级配件选择事件委托
  jQuery('#level-1-accessories-list').on('change', 'input[type="radio"]', function() {
    const accessoryId = jQuery(this).val();
    const accessoryPn = jQuery(this).data('part-number');
    const accessoryName = jQuery(this).data('name');
    
    // 高亮选中行
    highlightSelectedRow(1, accessoryId);
    
    // 更新选中的配件
    selectedAccessories[1] = {
      id: accessoryId,
      partNumber: accessoryPn,
      name: accessoryName
    };
    
    // 加载二级配件
    loadLevelAccessories(2, accessoryPn);
    
    // 更新二级配件标题
    updateAccessoryLevelTitle(2, accessoryName);
    
    // 显示二级配件区域
    jQuery('#level-2-accessories').show();
    
    // 更新添加二级配件按钮的链接
    updateAddAccessoryLink(2, accessoryPn);
    
    // 隐藏更高级别的配件区域
    hideHigherLevelAccessories(2);
  });
  
  // 为更高级别的配件设置类似的事件委托
  setupHigherLevelEventHandlers();
}

// 加载指定级别的配件
function loadLevelAccessories(level, parentPartNumber) {
  const tableBodyId = `level-${level}-accessories-list`;
  
  jQuery(`#${tableBodyId}`).html(
    '<tr class="bjt-table-loading-row"><td colspan="5" class="bjt-table-loading"><div class="bjt-loading-spinner"></div> 加载中...</td></tr>'
  );
  
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/relations',
    method: 'GET',
    data: {
      parent_part_number: parentPartNumber,
      level: level
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(data) {
      updateAccessoriesTable(level, data);
    },
    error: function(error) {
      console.error(`加载${level}级配件失败`, error);
      jQuery(`#${tableBodyId}`).html(
        `<tr><td colspan="5" class="bjt-table-error">加载${level}级配件失败</td></tr>`
      );
    }
  });
}

// 更新配件表格
function updateAccessoriesTable(level, accessories) {
  const tableBodyId = `level-${level}-accessories-list`;
  const tableBody = jQuery(`#${tableBodyId}`);
  tableBody.empty();
  
  if (accessories.length === 0) {
    tableBody.html(
      `<tr><td colspan="5" class="bjt-table-no-data">暂无${level}级配件</td></tr>`
    );
    return;
  }
  
  accessories.forEach(function(accessory) {
    const row = `
      <tr data-id="${accessory.id}">
        <td class="bjt-radio-column">
          <input type="radio" name="level-${level}-accessory" value="${accessory.id}" 
            data-part-number="${accessory.part_number}" 
            data-name="${accessory.name || accessory.part_number}">
        </td>
        <td>${accessory.id}</td>
        <td>${accessory.model || '-'}</td>
        <td>${accessory.part_number}</td>
        <td class="bjt-table-actions">
          <button class="bjt-btn bjt-btn-icon bjt-btn-delete" data-id="${accessory.id}" title="删除">
            <i class="bjt-icon bjt-icon-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.append(row);
  });
  
  // 绑定删除按钮事件
  bindDeleteButtons(level);
}

// 绑定删除按钮事件
function bindDeleteButtons(level) {
  jQuery(`#level-${level}-accessories-list .bjt-btn-delete`).on('click', function() {
    const id = jQuery(this).data('id');
    confirmDeleteRelation(id, level);
  });
}

// 确认删除关联关系
function confirmDeleteRelation(id, level) {
  if (confirm(`确定要删除这个${level}级配件关联吗？此操作不可撤销。`)) {
    deleteRelation(id, level);
  }
}

// 删除关联关系
function deleteRelation(id, level) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/relations/' + id,
    method: 'DELETE',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function() {
      showNotification('success', '关联关系已删除');
      
      // 如果删除的是当前选中的配件，需要隐藏更高级别的配件区域
      if (selectedAccessories[level] && selectedAccessories[level].id === id) {
        hideHigherLevelAccessories(level);
        delete selectedAccessories[level];
      }
      
      // 重新加载当前级别的配件
      const parentPartNumber = level === 1 ? currentHostPartNumber : selectedAccessories[level-1].partNumber;
      loadLevelAccessories(level, parentPartNumber);
    },
    error: function(error) {
      console.error('删除关联关系失败', error);
      showNotification('error', '删除关联关系失败');
    }
  });
}

// 获取URL参数
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 显示空状态
function showEmptyState(level) {
  jQuery(`#level-${level}-accessories-list`).html(
    '<tr><td colspan="5" class="bjt-table-no-data">请先选择一个主机料号</td></tr>'
  );
}

// 高亮选中行
function highlightSelectedRow(level, accessoryId) {
  jQuery(`#level-${level}-accessories-list tr`).removeClass('bjt-selected-row');
  jQuery(`#level-${level}-accessories-list tr[data-id="${accessoryId}"]`).addClass('bjt-selected-row');
}

// 更新配件级别标题
function updateAccessoryLevelTitle(level, parentName) {
  jQuery(`#parent-accessory-name`).text(parentName);
}

// 更新添加配件链接
function updateAddAccessoryLink(level, parentPartNumber) {
  const addButton = jQuery(`#add-level-${level}-accessory`);
  const href = `${bjt_admin.admin_url}admin.php?page=bjt-relations&action=add&level=${level}&parent=${parentPartNumber}`;
  addButton.attr('href', href);
}

// 隐藏更高级别的配件区域
function hideHigherLevelAccessories(baseLevel) {
  for (let i = baseLevel + 1; i <= 5; i++) {
    jQuery(`#level-${i}-accessories`).hide();
    delete selectedAccessories[i];
  }
}

// 设置更高级别配件的事件处理
function setupHigherLevelEventHandlers() {
  // 类似于一级配件的事件处理，为2-4级配件设置事件委托
  for (let level = 2; level <= 4; level++) {
    const nextLevel = level + 1;
    
    jQuery(`#level-${level}-accessories-list`).on('change', 'input[type="radio"]', function() {
      const accessoryId = jQuery(this).val();
      const accessoryPn = jQuery(this).data('part-number');
      const accessoryName = jQuery(this).data('name');
      
      // 高亮选中行
      highlightSelectedRow(level, accessoryId);
      
      // 更新选中的配件
      selectedAccessories[level] = {
        id: accessoryId,
        partNumber: accessoryPn,
        name: accessoryName
      };
      
      // 创建下一级配件区域（如果不存在）
      createNextLevelIfNotExists(nextLevel);
      
      // 加载下一级配件
      loadLevelAccessories(nextLevel, accessoryPn);
      
      // 更新下一级配件标题
      jQuery(`#level-${nextLevel}-accessories .bjt-card-title`).html(
        `${nextLevel}级配件 (属于 <span class="bjt-parent-accessory">${accessoryName}</span>)`
      );
      
      // 显示下一级配件区域
      jQuery(`#level-${nextLevel}-accessories`).show();
      
      // 更新添加下一级配件按钮的链接
      updateAddAccessoryLink(nextLevel, accessoryPn);
      
      // 隐藏更高级别的配件区域
      hideHigherLevelAccessories(nextLevel);
    });
  }
}

// 创建下一级配件区域（如果不存在）
function createNextLevelIfNotExists(level) {
  if (jQuery(`#level-${level}-accessories`).length === 0) {
    const levelContainer = `
      <div class="bjt-card bjt-level-accessories" id="level-${level}-accessories" style="display: none;">
        <div class="bjt-card-header">
          <h2 class="bjt-card-title">${level}级配件</h2>
          <div class="bjt-card-actions">
            <a href="#" class="bjt-btn bjt-btn-primary" id="add-level-${level}-accessory">
              <i class="bjt-icon bjt-icon-plus"></i> 新增${level}级配件
            </a>
          </div>
        </div>
        <div class="bjt-card-body">
          <table class="bjt-table bjt-accessories-table">
            <thead>
              <tr>
                <th class="bjt-radio-column"></th>
                <th>编号</th>
                <th>型号</th>
                <th>料号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="level-${level}-accessories-list">
              <!-- 表格内容将通过JavaScript动态生成 -->
            </tbody>
          </table>
        </div>
      </div>
    `;
    jQuery(`#level-${level-1}-accessories`).after(levelContainer);
  }
}

// 在页面加载完成后初始化
jQuery(document).ready(function() {
  initRelationsPage();
});
```

### 4.4 PHP处理规范
```php
/**
 * 渲染关联关系列表页面
 */
function render_relations_list() {
    // 确保用户有权限访问此页面
    if (!current_user_can('manage_options')) {
        wp_die(__('您没有足够的权限访问此页面。', 'bjt-product-admin'));
    }
    
    // 设置页面标题
    $page_title = __('关联关系管理', 'bjt-product-admin');
    
    // 开始输出缓冲
    ob_start();
    
    // 获取当前语言
    $current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'cn';
    
    // 获取当前操作
    $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
    
    // 根据操作类型包含不同的模板
    if ($action === 'add' && isset($_GET['level']) && isset($_GET['parent'])) {
        // 包含添加配件关联模板
        include_once BJT_PLUGIN_DIR . 'templates/admin/relations/add.php';
    } else {
        // 默认显示列表页
        ?>
        <div class="bjt-relations">
            <!-- 页面内容，按照HTML结构规范实现 -->
        </div>
        <?php
    }
    
    // 获取输出缓冲内容并清空缓冲
    $output = ob_get_clean();
    
    // 使用主布局模板包装输出
    include_once BJT_PLUGIN_DIR . 'templates/admin/layout/mockup-page-wrapper.php';
}

/**
 * 获取关联关系的API回调
 */
function bjt_api_get_relations($request) {
    // 检查权限
    if (!current_user_can('manage_options')) {
        return new WP_Error('forbidden', '您没有访问此数据的权限', array('status' => 403));
    }
    
    // 获取参数
    $parent_part_number = isset($request['parent_part_number']) ? sanitize_text_field($request['parent_part_number']) : '';
    $level = isset($request['level']) ? intval($request['level']) : 1;
    
    if (empty($parent_part_number)) {
        return new WP_Error('invalid_request', '父料号参数是必需的', array('status' => 400));
    }
    
    global $wpdb;
    
    // 获取关联关系
    $relations = $wpdb->get_results($wpdb->prepare(
        "SELECT r.*, a.model, a.name_cn, a.name_en
         FROM {$wpdb->prefix}bjt_relations r
         LEFT JOIN {$wpdb->prefix}bjt_accessories a ON r.child_part_number = a.part_number
         WHERE r.parent_part_number = %s AND r.level = %d
         ORDER BY r.id ASC",
        $parent_part_number,
        $level
    ));
    
    // 处理数据
    $result = array();
    foreach ($relations as $relation) {
        $name = $current_lang === 'en' ? $relation->name_en : $relation->name_cn;
        $result[] = array(
            'id' => $relation->id,
            'model' => $relation->model,
            'part_number' => $relation->child_part_number,
            'quantity' => $relation->quantity,
            'name' => $name
        );
    }
    
    return $result;
}

/**
 * 删除关联关系的API回调
 */
function bjt_api_delete_relation($request) {
    // 检查权限
    if (!current_user_can('manage_options')) {
        return new WP_Error('forbidden', '您没有删除此数据的权限', array('status' => 403));
    }
    
    // 获取ID
    $id = $request['id'];
    
    if (empty($id)) {
        return new WP_Error('invalid_request', 'ID参数是必需的', array('status' => 400));
    }
    
    global $wpdb;
    
    // 检查关联关系是否存在
    $relation = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bjt_relations WHERE id = %d",
        $id
    ));
    
    if (!$relation) {
        return new WP_Error('not_found', '关联关系不存在', array('status' => 404));
    }
    
    // 检查是否有子级关联，如果有则不允许删除
    $has_children = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}bjt_relations WHERE parent_part_number = %s",
        $relation->child_part_number
    ));
    
    if ($has_children > 0) {
        return new WP_Error('has_children', '此配件有下级关联，请先删除下级关联', array('status' => 400));
    }
    
    // 删除关联关系
    $result = $wpdb->delete(
        "{$wpdb->prefix}bjt_relations",
        array('id' => $id),
        array('%d')
    );
    
    if ($result === false) {
        return new WP_Error('delete_failed', '删除关联关系失败', array('status' => 500));
    }
    
    // 记录活动
    bjt_log_activity('delete', 'relation', $id, array(
        'parent_part_number' => $relation->parent_part_number,
        'child_part_number' => $relation->child_part_number
    ));
    
    return array(
        'success' => true,
        'message' => '关联关系已成功删除'
    );
}
```

## 5. 验收标准

### 5.1 功能验收标准
- [ ] 正确显示当前选中的主机型号和料号
- [ ] 一级配件表格能够正确显示关联的配件
- [ ] 选择一级配件后能够显示二级配件
- [ ] 能够通过层级递进查看五级配件关系
- [ ] 能够添加各级配件关联
- [ ] 能够删除配件关联关系
- [ ] 有子级配件的配件不能被删除
- [ ] 重置按钮能够正常工作

### 5.2 视觉一致性标准
- [ ] 页面布局与Mockup设计完全一致
- [ ] 当前机型和料号显示区域的样式与设计稿一致
- [ ] 表格样式与设计稿一致
- [ ] 层级关系的视觉表达清晰
- [ ] 选中状态的样式与设计稿一致
- [ ] 按钮和图标的样式与设计稿一致

### 5.3 代码质量标准
- [ ] 代码结构清晰，功能模块化
- [ ] PHP代码遵循WordPress编码标准
- [ ] JavaScript代码组织良好，避免全局变量污染
- [ ] 使用适当的安全措施（如数据转义、nonce验证等）
- [ ] 代码包含适当的注释，解释复杂逻辑

### 5.4 性能标准
- [ ] 页面加载时间在可接受范围内（首次内容绘制 < 1.5秒）
- [ ] 表格数据异步加载，避免页面阻塞
- [ ] 层级数据按需加载，避免一次性加载过多数据
- [ ] 确保在数据量大的情况下仍能高效运行

## 6. 开发流程

### 6.1 开发前准备
1. 仔细研究Mockup设计，理解关联关系管理页面的布局和交互关系
2. 确认所有API端点已实现，包括获取关联关系和层级结构功能
3. 确认数据库表结构已准备就绪，特别是关联关系表的字段设计
4. 准备测试数据，创建测试用的主机和配件数据

### 6.2 开发步骤
1. **创建基本页面结构**
   - 实现页面标题区域
   - 实现当前机型和料号显示区域
   - 实现一级配件表格区域的布局
   - 实现二级配件表格区域的布局模板
   
2. **一级配件功能实现**
   - 实现通过URL参数获取主机料号
   - 实现一级配件数据加载
   - 实现一级配件表格内容展示
   - 实现一级配件选择功能
   
3. **多级配件功能实现**
   - 实现二至五级配件区域动态创建
   - 实现配件层级关系的显示
   - 实现各级配件表格内容展示
   - 实现各级配件选择功能
   
4. **添加和删除功能实现**
   - 实现添加配件关联的链接生成
   - 实现删除配件关联的确认和执行
   - 实现防止有子级配件的配件被删除
   
5. **完善和优化**
   - 优化样式，确保与设计稿视觉一致
   - 实现加载状态和错误处理
   - 优化性能，特别是多级配件的加载性能

### 6.3 开发过程检查点
- [ ] 页面基本结构与设计稿一致
- [ ] 通过URL参数能够正确获取主机料号
- [ ] 一级配件表格能够正确加载和显示数据
- [ ] 选择一级配件后能够正确显示二级配件
- [ ] 层级结构能够正确表示和理解
- [ ] 添加和删除功能正常工作
- [ ] 样式与设计稿视觉一致

## 7. 常见问题与最佳实践

### 7.1 避免常见问题
- **数据结构问题**:
  - 避免使用扁平结构存储层级数据，应使用专门的关联关系表
  - 避免在前端硬编码层级数量，应支持动态层级展示
  - 避免忽略层级关系的完整性检查，如删除有子级的配件
  
- **界面交互问题**:
  - 避免层级关系不清晰，应通过视觉设计明确表示层级关系
  - 避免在选择配件后没有明确的反馈，应高亮显示选中行
  - 避免缺少加载状态和错误处理，给用户提供清晰的反馈

### 7.2 最佳实践建议
- **数据处理最佳实践**:
  - 使用递归查询获取完整的层级结构
  - 实现按需加载机制，避免一次性加载所有层级数据
  - 使用事务处理确保关联关系的完整性
  
- **用户体验最佳实践**:
  - 提供清晰的视觉指引，帮助用户理解层级关系
  - 为未选择主机的情况提供友好的提示
  - 使用面包屑或路径指示器显示当前浏览的层级路径
  - 提供批量操作功能，方便管理大量关联关系
  
- **前端实现最佳实践**:
  - 使用模板化的方法创建各级配件区域，避免重复代码
  - 实现配件选择的记忆功能，避免页面刷新后丢失选择状态
  - 使用事件委托优化事件处理，提高性能
</rewritten_file> 
 