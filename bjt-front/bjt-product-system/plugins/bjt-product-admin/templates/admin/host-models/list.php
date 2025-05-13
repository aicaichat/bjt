。<?php
/**
 * 主机型号列表页面
 * 
 * @package BJT_Product_Admin
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}
?>
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
    <div class="bjt-dialog-header">
      <h3 class="bjt-dialog-title">导入数据</h3>
      <button class="bjt-dialog-close">&times;</button>
    </div>
    <div class="bjt-dialog-body">
      <form id="import-form" enctype="multipart/form-data">
        <div class="bjt-form-group">
          <label for="import-file">选择文件 (CSV 或 Excel)</label>
          <input type="file" id="import-file" name="import_file" accept=".csv,.xlsx,.xls">
        </div>
        <div class="bjt-form-group">
          <label>
            <input type="checkbox" id="include-header" name="include_header" checked>
            包含表头
          </label>
        </div>
      </form>
    </div>
    <div class="bjt-dialog-footer">
      <button class="bjt-btn bjt-btn-secondary bjt-dialog-cancel">取消</button>
      <button class="bjt-btn bjt-btn-primary" id="import-submit">导入</button>
    </div>
  </div>
</div>

<script type="text/javascript">
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

// 更新主机型号表格
function updateHostModelsTable(data) {
  const tbody = jQuery('.bjt-host-models-table tbody');
  tbody.empty();
  
  // 没有数据时显示空状态
  if (!data || !data.data || data.data.length === 0) {
    tbody.html('<tr><td colspan="6" class="bjt-empty-state">暂无数据</td></tr>');
    return;
  }
  
  // 遍历数据并创建表格行
  data.data.forEach(function(item, index) {
    const statusText = item.status === 'publish' ? '已上架' : '未上架';
    const statusClass = item.status === 'publish' ? 'bjt-status-active' : 'bjt-status-inactive';
    const statusAction = item.status === 'publish' ? '下架' : '上架';
    const statusIcon = item.status === 'publish' ? 'down' : 'up';
    
    let productLineName = '';
    if (item.product_line_id) {
      // 这里可能需要一个产品线ID到名称的映射
      // 简单起见，我们直接使用ID
      productLineName = '产品线 ' + item.product_line_id;
    }
    
    const row = `
      <tr data-id="${item.id}">
        <td>${item.id}</td>
        <td>${item.model}</td>
        <td>${item.model_name}</td>
        <td>${productLineName}</td>
        <td><span class="bjt-status ${statusClass}">${statusText}</span></td>
        <td class="bjt-actions">
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-host-models&action=edit&id=${item.id}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline js-toggle-status" data-id="${item.id}" data-status="${item.status}" title="${statusAction}">
            <i class="bjt-icon bjt-icon-${statusIcon}"></i>
          </button>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline bjt-btn-danger js-delete-host-model" data-id="${item.id}" title="删除">
            <i class="bjt-icon bjt-icon-delete"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // 绑定操作按钮事件
  bindHostModelActions();
}

// 绑定主机型号表格操作按钮事件
function bindHostModelActions() {
  // 切换状态按钮
  jQuery('.js-toggle-status').off('click').on('click', function() {
    const id = jQuery(this).data('id');
    const currentStatus = jQuery(this).data('status');
    const newStatus = currentStatus === 'publish' ? 'draft' : 'publish';
    
    toggleHostModelStatus(id, newStatus);
  });
  
  // 删除按钮
  jQuery('.js-delete-host-model').off('click').on('click', function() {
    const id = jQuery(this).data('id');
    if (confirm('确定要删除此主机型号吗？此操作无法撤销。')) {
      deleteHostModel(id);
    }
  });
}

// 切换主机型号状态
function toggleHostModelStatus(id, newStatus) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models/' + id,
    method: 'PUT',
    data: JSON.stringify({
      status: newStatus
    }),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showNotification('success', '状态已更新');
      // 重新加载当前页数据
      loadHostModels(jQuery('#host-models-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('更新状态失败', error);
      showNotification('error', '更新状态失败');
    }
  });
}

// 删除主机型号
function deleteHostModel(id) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models/' + id,
    method: 'DELETE',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showNotification('success', '主机型号已删除');
      // 重新加载当前页数据
      loadHostModels(jQuery('#host-models-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('删除失败', error);
      showNotification('error', '删除失败');
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

// 更新料号表格
function updatePartsTable(data) {
  const tbody = jQuery('.bjt-parts-table tbody');
  tbody.empty();
  
  // 没有数据时显示空状态
  if (!data || !data.data || data.data.length === 0) {
    tbody.html('<tr><td colspan="5" class="bjt-empty-state">暂无数据</td></tr>');
    return;
  }
  
  // 遍历数据并创建表格行
  data.data.forEach(function(item, index) {
    let productLineName = '';
    if (item.product_line_id) {
      // 这里可能需要一个产品线ID到名称的映射
      productLineName = '产品线 ' + item.product_line_id;
    }
    
    const row = `
      <tr data-id="${item.id}">
        <td>${item.id}</td>
        <td>${item.model}</td>
        <td>${item.part_number}</td>
        <td>${productLineName}</td>
        <td class="bjt-actions">
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-host-models&action=edit-part&id=${item.id}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-relations&part=${item.part_number}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="关联">
            <i class="bjt-icon bjt-icon-link"></i>
          </a>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline bjt-btn-danger js-delete-part" data-id="${item.id}" title="删除">
            <i class="bjt-icon bjt-icon-delete"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // 绑定操作按钮事件
  bindPartActions();
}

// 绑定料号表格操作按钮事件
function bindPartActions() {
  // 删除按钮
  jQuery('.js-delete-part').off('click').on('click', function() {
    const id = jQuery(this).data('id');
    if (confirm('确定要删除此料号吗？此操作无法撤销。')) {
      deletePart(id);
    }
  });
}

// 删除料号
function deletePart(id) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/parts/' + id,
    method: 'DELETE',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showNotification('success', '料号已删除');
      // 重新加载当前页数据
      loadParts(jQuery('#parts-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('删除失败', error);
      showNotification('error', '删除失败');
    }
  });
}

// 更新分页控件
function updatePagination(selector, currentPage, totalPages) {
  const pagination = jQuery(selector);
  pagination.empty();
  
  if (!totalPages || totalPages <= 1) {
    return;
  }
  
  // 计算分页范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 添加首页按钮
  if (startPage > 1) {
    pagination.append(`
      <a href="#" class="bjt-pagination-item" data-page="1">首页</a>
    `);
  }
  
  // 添加上一页按钮
  if (currentPage > 1) {
    pagination.append(`
      <a href="#" class="bjt-pagination-item" data-page="${currentPage - 1}">上一页</a>
    `);
  }
  
  // 添加页码按钮
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage ? 'bjt-pagination-current' : '';
    pagination.append(`
      <a href="#" class="bjt-pagination-item ${isActive}" data-page="${i}">${i}</a>
    `);
  }
  
  // 添加下一页按钮
  if (currentPage < totalPages) {
    pagination.append(`
      <a href="#" class="bjt-pagination-item" data-page="${currentPage + 1}">下一页</a>
    `);
  }
  
  // 添加末页按钮
  if (endPage < totalPages) {
    pagination.append(`
      <a href="#" class="bjt-pagination-item" data-page="${totalPages}">末页</a>
    `);
  }
}

// 更新料号筛选器的型号选项
function updateModelOptions(hostModelsData) {
  const select = jQuery('#filter-model');
  
  // 保存当前选中的值
  const currentValue = select.val();
  
  // 清空选项（保留"全部"选项）
  select.find('option:not(:first)').remove();
  
  // 没有数据时不添加选项
  if (!hostModelsData || !hostModelsData.data || hostModelsData.data.length === 0) {
    return;
  }
  
  // 添加选项
  hostModelsData.data.forEach(function(item) {
    select.append(`<option value="${item.model}">${item.model} - ${item.model_name}</option>`);
  });
  
  // 恢复原来选中的值
  if (currentValue) {
    select.val(currentValue);
  }
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
  
  // 导入对话框
  initImportDialog();
}

// 初始化导入对话框
function initImportDialog() {
  let importType = ''; // 'host-models' 或 'parts'
  
  // 显示导入对话框
  function showImportDialog(type) {
    importType = type;
    
    // 设置对话框标题
    const title = type === 'host-models' ? '导入主机型号' : '导入料号';
    jQuery('#import-dialog .bjt-dialog-title').text(title);
    
    // 重置表单
    jQuery('#import-form')[0].reset();
    
    // 显示对话框
    jQuery('#import-dialog').show();
  }
  
  // 关闭按钮
  jQuery('.bjt-dialog-close, .bjt-dialog-cancel').on('click', function() {
    jQuery('#import-dialog').hide();
  });
  
  // 提交按钮
  jQuery('#import-submit').on('click', function() {
    const formData = new FormData(jQuery('#import-form')[0]);
    formData.append('type', importType);
    
    // 检查是否选择了文件
    const fileInput = document.getElementById('import-file');
    if (!fileInput.files.length) {
      showNotification('error', '请选择要导入的文件');
      return;
    }
    
    jQuery.ajax({
      url: bjt_admin.api_url + '/wp-json/bjt/v1/' + importType + '/import',
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
        // 显示加载状态
        jQuery('#import-submit').prop('disabled', true).text('导入中...');
      },
      success: function(response) {
        showNotification('success', '导入成功');
        jQuery('#import-dialog').hide();
        
        // 重新加载数据
        if (importType === 'host-models') {
          loadHostModels(1);
        } else {
          loadParts(1);
        }
      },
      error: function(error) {
        console.error('导入失败', error);
        showNotification('error', '导入失败: ' + (error.responseJSON ? error.responseJSON.message : '未知错误'));
      },
      complete: function() {
        jQuery('#import-submit').prop('disabled', false).text('导入');
      }
    });
  });
}

// 导出主机型号
function exportHostModels() {
  window.location.href = bjt_admin.api_url + '/wp-json/bjt/v1/host-models/export?_wpnonce=' + bjt_admin.nonce;
}

// 导出料号
function exportParts() {
  window.location.href = bjt_admin.api_url + '/wp-json/bjt/v1/parts/export?_wpnonce=' + bjt_admin.nonce;
}

// 显示通知
function showNotification(type, message) {
  // 如果页面有通知系统，使用它
  if (typeof bjt_admin !== 'undefined' && typeof bjt_admin.showNotification === 'function') {
    bjt_admin.showNotification(type, message);
    return;
  }
  
  // 否则简单地使用alert
  alert(message);
}

// 在页面加载完成后初始化
jQuery(document).ready(function() {
  initHostModelsPage();
});
</script>
