/**
 * 主机型号管理页面脚本
 */

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
  const tableBody = jQuery('.bjt-host-models-table tbody');
  tableBody.empty();
  
  if (data.length === 0) {
    // 显示无数据提示
    tableBody.html('<tr><td colspan="6" class="bjt-table-no-data">暂无数据</td></tr>');
    return;
  }
  
  // 生成表格行
  data.forEach(function(model) {
    const productLine = getProductLineName(model.product_line);
    const statusBadge = model.status === 'publish' 
      ? '<span class="bjt-status-badge bjt-status-badge--active">已上架</span>' 
      : '<span class="bjt-status-badge bjt-status-badge--inactive">已下架</span>';
      
    const toggleStatusAction = model.status === 'publish'
      ? `<button class="bjt-btn bjt-btn-icon bjt-btn-toggle-status" data-id="${model.id}" data-status="draft" title="下架"><i class="bjt-icon bjt-icon-eye-off"></i></button>`
      : `<button class="bjt-btn bjt-btn-icon bjt-btn-toggle-status" data-id="${model.id}" data-status="publish" title="上架"><i class="bjt-icon bjt-icon-eye"></i></button>`;
      
    const row = `
      <tr data-id="${model.id}" data-model="${model.model}">
        <td>${model.id}</td>
        <td>${model.model}</td>
        <td>${model.title_cn}</td>
        <td>${productLine}</td>
        <td>${statusBadge}</td>
        <td class="bjt-table-actions">
          <a href="<?php echo admin_url('admin.php?page=bjt-host-models&action=edit&id='); ?>${model.id}" class="bjt-btn bjt-btn-icon" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          ${toggleStatusAction}
          <button class="bjt-btn bjt-btn-icon bjt-btn-delete" data-id="${model.id}" title="删除">
            <i class="bjt-icon bjt-icon-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.append(row);
  });
  
  // 绑定行操作事件
  bindHostModelRowActions();
}

// 获取产品线名称
function getProductLineName(code) {
  const productLines = {
    'air_cushion': '气垫机',
    'paper_machine': '纸机',
    'tape_machine': '胶带机',
    'air_column': '气柱机'
  };
  
  return productLines[code] || code;
}

// 绑定主机型号行操作事件
function bindHostModelRowActions() {
  // 切换状态按钮点击事件
  jQuery('.bjt-host-models-table .bjt-btn-toggle-status').on('click', function() {
    const id = jQuery(this).data('id');
    const status = jQuery(this).data('status');
    toggleHostModelStatus(id, status);
  });
  
  // 删除按钮点击事件
  jQuery('.bjt-host-models-table .bjt-btn-delete').on('click', function() {
    const id = jQuery(this).data('id');
    confirmDeleteHostModel(id);
  });
  
  // 行点击事件 - 选择主机型号
  jQuery('.bjt-host-models-table tbody tr').on('click', function(e) {
    // 如果点击的是按钮，则不触发行选择
    if (jQuery(e.target).is('button') || jQuery(e.target).closest('button').length > 0) {
      return;
    }
    
    // 获取所选型号
    const model = jQuery(this).data('model');
    
    // 设置筛选器值
    jQuery('#filter-model').val(model).trigger('change');
  });
}

// 切换主机型号状态
function toggleHostModelStatus(id, status) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models/' + id,
    method: 'PUT',
    data: JSON.stringify({
      status: status
    }),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function() {
      showNotification('success', '状态已更新');
      // 刷新当前页数据
      const currentPage = jQuery('#host-models-pagination .bjt-pagination-item.active').data('page') || 1;
      loadHostModels(currentPage);
    },
    error: function(error) {
      console.error('更新状态失败', error);
      showNotification('error', '更新状态失败');
    }
  });
}

// 确认删除主机型号对话框
function confirmDeleteHostModel(id) {
  if (confirm('确定要删除此主机型号吗？此操作不可撤销，且会影响关联的料号。')) {
    deleteHostModel(id);
  }
}

// 删除主机型号
function deleteHostModel(id) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models/' + id,
    method: 'DELETE',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function() {
      showNotification('success', '主机型号已删除');
      // 刷新当前页数据
      const currentPage = jQuery('#host-models-pagination .bjt-pagination-item.active').data('page') || 1;
      loadHostModels(currentPage);
      // 刷新料号表格
      loadParts(1);
    },
    error: function(error) {
      console.error('删除主机型号失败', error);
      showNotification('error', '删除主机型号失败');
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
  const tableBody = jQuery('.bjt-parts-table tbody');
  tableBody.empty();
  
  if (data.length === 0) {
    // 显示无数据提示
    tableBody.html('<tr><td colspan="5" class="bjt-table-no-data">暂无数据</td></tr>');
    return;
  }
  
  // 生成表格行
  data.forEach(function(part) {
    const productLine = getProductLineName(part.product_line);
    
    const row = `
      <tr data-id="${part.id}">
        <td>${part.id}</td>
        <td>${part.model}</td>
        <td>${part.part_number}</td>
        <td>${productLine}</td>
        <td class="bjt-table-actions">
          <a href="<?php echo admin_url('admin.php?page=bjt-host-models&action=edit-part&id='); ?>${part.id}" class="bjt-btn bjt-btn-icon" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <button class="bjt-btn bjt-btn-icon bjt-btn-delete-part" data-id="${part.id}" title="删除">
            <i class="bjt-icon bjt-icon-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.append(row);
  });
  
  // 绑定行操作事件
  bindPartRowActions();
}

// 绑定料号行操作事件
function bindPartRowActions() {
  // 删除按钮点击事件
  jQuery('.bjt-parts-table .bjt-btn-delete-part').on('click', function() {
    const id = jQuery(this).data('id');
    confirmDeletePart(id);
  });
}

// 确认删除料号对话框
function confirmDeletePart(id) {
  if (confirm('确定要删除此料号吗？此操作不可撤销。')) {
    deletePart(id);
  }
}

// 删除料号
function deletePart(id) {
  jQuery.ajax({
    url: bjt_admin.api_url + '/wp-json/bjt/v1/parts/' + id,
    method: 'DELETE',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function() {
      showNotification('success', '料号已删除');
      // 刷新当前页数据
      const currentPage = jQuery('#parts-pagination .bjt-pagination-item.active').data('page') || 1;
      loadParts(currentPage);
    },
    error: function(error) {
      console.error('删除料号失败', error);
      showNotification('error', '删除料号失败');
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

// 更新料号筛选器的型号选项
function updateModelOptions(data) {
  const selectElement = jQuery('#filter-model');
  const currentValue = selectElement.val();
  
  // 保留第一个"全部"选项
  selectElement.find('option:not(:first)').remove();
  
  // 添加型号选项
  data.forEach(function(model) {
    selectElement.append(`<option value="${model.model}">${model.model} - ${model.title_cn}</option>`);
  });
  
  // 如果之前有选择值，则尝试恢复
  if (currentValue) {
    selectElement.val(currentValue);
  }
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

// 显示导入对话框
function showImportDialog(type) {
  const dialogTitle = type === 'host-models' ? '导入主机型号' : '导入料号';
  const dialogContent = `
    <h3>${dialogTitle}</h3>
    <form id="${type}-import-form" class="bjt-import-form">
      <div class="bjt-form-field">
        <label for="${type}-file">选择文件 (仅支持 .xlsx, .csv)</label>
        <input type="file" id="${type}-file" name="import_file" accept=".xlsx,.csv" required>
      </div>
      <div class="bjt-form-actions">
        <button type="button" class="bjt-btn bjt-btn-secondary bjt-cancel-import">取消</button>
        <button type="submit" class="bjt-btn bjt-btn-primary">导入</button>
      </div>
    </form>
  `;
  
  // 显示对话框
  showDialog('#import-dialog', dialogContent);
  
  // 绑定表单提交事件
  jQuery(`#${type}-import-form`).on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    importData(type, formData);
  });
  
  // 绑定取消按钮事件
  jQuery('.bjt-cancel-import').on('click', function() {
    closeDialog('#import-dialog');
  });
}

// 导入数据
function importData(type, formData) {
  const url = type === 'host-models' 
    ? '/wp-json/bjt/v1/host-models/import' 
    : '/wp-json/bjt/v1/parts/import';
  
  jQuery.ajax({
    url: bjt_admin.api_url + url,
    method: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 显示加载状态
      jQuery(`#${type}-import-form`).addClass('bjt-loading');
    },
    success: function(response) {
      closeDialog('#import-dialog');
      showNotification('success', '导入成功');
      
      // 刷新数据
      if (type === 'host-models') {
        loadHostModels(1);
      } else {
        loadParts(1);
      }
    },
    error: function(error) {
      console.error('导入失败', error);
      showNotification('error', '导入失败: ' + (error.responseJSON?.message || '未知错误'));
    },
    complete: function() {
      jQuery(`#${type}-import-form`).removeClass('bjt-loading');
    }
  });
}

// 导出主机型号数据
function exportHostModels() {
  window.location.href = bjt_admin.api_url + '/wp-json/bjt/v1/host-models/export?_wpnonce=' + bjt_admin.nonce;
}

// 导出料号数据
function exportParts() {
  const filterModel = jQuery('#filter-model').val();
  const filterPartNumber = jQuery('#filter-part-number').val();
  
  let url = bjt_admin.api_url + '/wp-json/bjt/v1/parts/export?_wpnonce=' + bjt_admin.nonce;
  
  if (filterModel) {
    url += '&model=' + encodeURIComponent(filterModel);
  }
  
  if (filterPartNumber) {
    url += '&part_number=' + encodeURIComponent(filterPartNumber);
  }
  
  window.location.href = url;
}

// 显示对话框
function showDialog(selector, content) {
  const dialog = jQuery(selector);
  dialog.html(content).show();
}

// 关闭对话框
function closeDialog(selector) {
  jQuery(selector).hide();
}

// 更新分页
function updatePagination(selector, currentPage, totalPages) {
  const pagination = jQuery(selector);
  pagination.empty();
  
  if (!totalPages || totalPages <= 1) {
    return;
  }
  
  // 计算显示的页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // 调整起始页，确保显示5个页码
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 添加第一页按钮
  if (startPage > 1) {
    pagination.append(`<a href="#" class="bjt-pagination-item" data-page="1">1</a>`);
    if (startPage > 2) {
      pagination.append(`<span class="bjt-pagination-ellipsis">...</span>`);
    }
  }
  
  // 添加页码按钮
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    pagination.append(`<a href="#" class="bjt-pagination-item ${activeClass}" data-page="${i}">${i}</a>`);
  }
  
  // 添加最后页按钮
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pagination.append(`<span class="bjt-pagination-ellipsis">...</span>`);
    }
    pagination.append(`<a href="#" class="bjt-pagination-item" data-page="${totalPages}">${totalPages}</a>`);
  }
}

// 显示通知
function showNotification(type, message) {
  // 检查是否存在通知容器，如果不存在则创建
  let notificationContainer = jQuery('.bjt-notifications');
  if (notificationContainer.length === 0) {
    jQuery('body').append('<div class="bjt-notifications"></div>');
    notificationContainer = jQuery('.bjt-notifications');
  }
  
  // 创建通知元素
  const notification = jQuery(`
    <div class="bjt-notification bjt-notification-${type}">
      <div class="bjt-notification-content">${message}</div>
      <button class="bjt-notification-close">&times;</button>
    </div>
  `);
  
  // 添加到容器
  notificationContainer.append(notification);
  
  // 设置自动消失
  setTimeout(function() {
    notification.addClass('bjt-notification-hiding');
    setTimeout(function() {
      notification.remove();
    }, 300); // 过渡效果持续时间
  }, 3000);
  
  // 绑定关闭按钮事件
  notification.find('.bjt-notification-close').on('click', function() {
    notification.addClass('bjt-notification-hiding');
    setTimeout(function() {
      notification.remove();
    }, 300);
  });
}

// 在页面加载完成后初始化
jQuery(document).ready(function() {
  initHostModelsPage();
}); 
 