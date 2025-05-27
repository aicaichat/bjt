<?php
/**
 * 产品线列表页面模板
 * 
 * @package BJT_Product_Admin
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前语言
$current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'en';

// 获取产品线列表（固定4条）
$product_lines = BJT_Product_Line_Management::get_instance()->get_product_lines(array(
    'page' => 1,
    'page_size' => 4,
    'status' => 'publish',
    'lang' => $current_lang
));

$message = isset($_GET['message']) ? $_GET['message'] : '';
?>

<div class="bjt-product-lines">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">产品线管理</h1>
  </div>
  
  <!-- 产品线表格区域 -->
  <div class="bjt-card bjt-product-lines-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">产品线列表</h2>
      <div class="bjt-card-filter">
        <div class="bjt-filter-field">
          <label for="filter-status">状态</label>
          <select id="filter-status" class="bjt-select">
            <option value="">全部</option>
            <option value="publish">已上架</option>
            <option value="draft">未上架</option>
          </select>
        </div>
        <button class="bjt-btn bjt-btn-secondary" id="reset-filters">
          重置
        </button>
      </div>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-import-btn" id="import-product-lines">
          <i class="bjt-icon bjt-icon-import"></i> 导入
        </button>
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-product-lines">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-lines&action=add')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增产品线
        </a>
        </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-product-lines-table">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-product-lines"></th>
            <th>ID</th>
            <th>标题</th>
            <th>图片</th>
            <th>状态</th>
            <th>排序</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- 表格内容将通过JavaScript动态生成 -->
        </tbody>
      </table>
    </div>
    <div class="bjt-card-footer">
      <div class="bjt-bulk-actions">
        <select id="bulk-action" class="bjt-select">
          <option value="">批量操作</option>
          <option value="delete">删除</option>
          <option value="publish">上架</option>
          <option value="draft">下架</option>
        </select>
        <button id="apply-bulk-action" class="bjt-btn bjt-btn-secondary">应用</button>
      </div>
      <div class="bjt-pagination" id="product-lines-pagination">
        <!-- 分页控件将通过JavaScript动态生成 -->
      </div>
    </div>
  </div>
  
  <!-- 确认删除模态框 -->
  <div class="bjt-modal" id="delete-confirm-modal">
    <div class="bjt-modal-dialog">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">确认删除</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
          <p>您确定要删除选中的产品线吗？此操作无法撤销。</p>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-danger" id="confirm-delete">删除</button>
                    </div>
                        </div>
                    </div>
                </div>
  
  <!-- 导入/导出对话框 -->
  <div class="bjt-modal" id="import-dialog">
    <div class="bjt-modal-dialog">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">导入产品线</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
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
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-primary" id="import-submit">导入</button>
        </div>
        </div>
    </div>
</div>

  <!-- Toast通知 -->
  <div class="bjt-toast" id="bjt-toast">
    <div class="bjt-toast-header">
      <i class="bjt-toast-icon"></i>
      <strong class="bjt-toast-title">通知</strong>
      <button type="button" class="bjt-toast-close">&times;</button>
    </div>
    <div class="bjt-toast-body"></div>
  </div>
</div>

<script type="text/javascript">
// 全局变量
let productLinesTable;
let deleteItemId = null;

// 初始化页面
jQuery(document).ready(function($) {
  initProductLinesPage();
});

// 初始化产品线管理页面
function initProductLinesPage() {
  const $ = jQuery;
  
  // 初始化产品线表格
  loadProductLines(1);
  
  // 绑定分页事件
  $('#product-lines-pagination').on('click', '.bjt-pagination-item', function(e) {
    e.preventDefault();
    const page = $(this).data('page');
    loadProductLines(page);
  });
  
  // 初始化筛选功能
  initFilters();
  
  // 初始化批量操作
  initBulkActions();
  
  // 初始化模态框
  initModals();
  
  // 导入按钮
  $('#import-product-lines').on('click', function() {
    $('#import-dialog').addClass('bjt-modal-show');
  });
  
  // 导出按钮
  $('#export-product-lines').on('click', function() {
    exportProductLines();
  });
  
  // 全选/取消全选
  $('#select-all-product-lines').on('change', function() {
    $('.bjt-product-line-checkbox').prop('checked', $(this).prop('checked'));
  });
}

// 加载产品线数据
function loadProductLines(page) {
  const $ = jQuery;
  const status = $('#filter-status').val();
  
  // 构建查询参数
  let params = {
    page: page,
    per_page: 10
  };
  
  // 添加筛选参数
  if (status) {
    params.status = status;
  }
  
  $.ajax({
    url: bjt_admin.api_url + 'product-lines',
    method: 'GET',
    data: params,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 显示加载中状态
      $('.bjt-product-lines-table').addClass('bjt-loading');
    },
    success: function(response, status, xhr) {
      // 更新表格内容
      updateProductLinesTable(response.data);
      
      // 更新分页
      const totalPages = xhr.getResponseHeader('X-WP-TotalPages') || 1;
      updatePagination('#product-lines-pagination', page, totalPages);
    },
    error: function(error) {
      console.error('加载产品线数据失败', error);
      showToast('error', '加载产品线数据失败', error.responseJSON?.message || '请检查网络连接');
    },
    complete: function() {
      // 移除加载中状态
      $('.bjt-product-lines-table').removeClass('bjt-loading');
    }
  });
}

// 更新产品线表格
function updateProductLinesTable(data) {
  const $ = jQuery;
  const tbody = $('.bjt-product-lines-table tbody');
  tbody.empty();
  
  // 没有数据时显示空状态
  if (!data || data.length === 0) {
    tbody.html('<tr><td colspan="8" class="bjt-empty-state">暂无数据</td></tr>');
    return;
  }
  
  // 遍历数据并创建表格行
  data.forEach(function(item) {
    const status = item.status === 'publish' ? 
      '<span class="bjt-badge bjt-badge-success">已上架</span>' : 
      '<span class="bjt-badge bjt-badge-secondary">未上架</span>';
    
    const statusAction = item.status === 'publish' ? '下架' : '上架';
    const statusIcon = item.status === 'publish' ? 'down' : 'up';
    
    const row = `
      <tr data-id="${item.id}">
        <td><input type="checkbox" class="bjt-product-line-checkbox" value="${item.id}"></td>
        <td>${item.id}</td>
        <td>${item.title_zh || ''}</td>
        <td>
          ${item.image ? `<img src="${item.image}" alt="${item.title_zh}" class="bjt-thumbnail">` : '无图片'}
        </td>
        <td>${status}</td>
        <td>${item.sort_order || 0}</td>
        <td>${formatDate(item.created_at)}</td>
        <td class="bjt-actions">
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-product-lines&action=edit&id=${item.id}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline js-toggle-status" data-id="${item.id}" data-status="${item.status}" title="${statusAction}">
            <i class="bjt-icon bjt-icon-${statusIcon}"></i>
          </button>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline bjt-btn-danger js-delete-product-line" data-id="${item.id}" title="删除">
            <i class="bjt-icon bjt-icon-delete"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // 绑定操作按钮事件
  bindProductLineActions();
}

// 绑定产品线表格操作按钮事件
function bindProductLineActions() {
  const $ = jQuery;
  
  // 删除按钮
  $('.js-delete-product-line').off('click').on('click', function() {
    deleteItemId = $(this).data('id');
    $('#delete-confirm-modal').addClass('bjt-modal-show');
  });
  
  // 状态切换按钮
  $('.js-toggle-status').off('click').on('click', function() {
    const id = $(this).data('id');
    const currentStatus = $(this).data('status');
    const newStatus = currentStatus === 'publish' ? 'draft' : 'publish';
    
    toggleProductLineStatus(id, newStatus);
  });
}

// 切换产品线状态
function toggleProductLineStatus(id, newStatus) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'product-lines/' + id,
    method: 'PUT',
    data: JSON.stringify({
      status: newStatus
    }),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      const statusText = newStatus === 'publish' ? '已上架' : '已下架';
      showToast('success', '状态更新成功', `产品线 ${response.data.title_zh} ${statusText}`);
      // 重新加载当前页数据
      loadProductLines($('#product-lines-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('更新状态失败', error);
      showToast('error', '更新状态失败', error.responseJSON?.message || '请稍后重试');
    }
  });
}

// 删除产品线
function deleteProductLine(id) {
  const $ = jQuery;
  const isArray = Array.isArray(id);
  const url = isArray ? 
    bjt_admin.api_url + 'product-lines/bulk-delete' : 
    bjt_admin.api_url + 'product-lines/' + id;
  
  $.ajax({
    url: url,
    method: 'DELETE',
    data: isArray ? JSON.stringify({ ids: id }) : null,
    contentType: isArray ? 'application/json' : 'application/x-www-form-urlencoded',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showToast('success', '删除成功', isArray ? `已删除 ${id.length} 个产品线` : '产品线已删除');
      loadProductLines($('#product-lines-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('删除失败', error);
      showToast('error', '删除失败', error.responseJSON?.message || '请稍后重试');
    },
    complete: function() {
      // 关闭模态框
      $('#delete-confirm-modal').removeClass('bjt-modal-show');
    }
  });
}

// 初始化筛选功能
function initFilters() {
  const $ = jQuery;
  
  // 筛选变化时重新加载
  $('#filter-status').on('change', function() {
    loadProductLines(1);
  });
  
  // 重置筛选按钮
  $('#reset-filters').on('click', function() {
    $('#filter-status').val('');
    loadProductLines(1);
  });
}

// 初始化批量操作
function initBulkActions() {
  const $ = jQuery;
  
  // 应用批量操作按钮
  $('#apply-bulk-action').on('click', function() {
    const action = $('#bulk-action').val();
    if (!action) {
      showToast('warning', '请选择一个操作', '');
      return;
    }
    
    const selected = [];
    $('.bjt-product-line-checkbox:checked').each(function() {
      selected.push($(this).val());
    });
    
    if (selected.length === 0) {
      showToast('warning', '请选择至少一个产品线', '');
      return;
    }
    
    // 根据操作类型执行不同的操作
    switch (action) {
      case 'delete':
        if (confirm('确定要删除选中的产品线吗？此操作无法撤销。')) {
          deleteProductLine(selected);
        }
        break;
      case 'publish':
      case 'draft':
        updateProductLinesStatus(selected, action);
        break;
    }
  });
}

// 更新产品线状态（批量）
function updateProductLinesStatus(ids, status) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'product-lines/bulk-update',
    method: 'POST',
    data: JSON.stringify({
      ids: ids,
      status: status
    }),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      const statusText = status === 'publish' ? '上架' : '下架';
      showToast('success', '更新成功', `已将 ${ids.length} 个产品线${statusText}`);
      loadProductLines($('#product-lines-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('更新失败', error);
      showToast('error', '更新失败', error.responseJSON?.message || '请稍后重试');
    }
  });
}

// 初始化模态框
function initModals() {
  const $ = jQuery;
  
  // 模态框关闭按钮
  $('.bjt-modal-close, [data-dismiss="modal"]').on('click', function() {
    $(this).closest('.bjt-modal').removeClass('bjt-modal-show');
  });
  
  // 确认删除按钮
  $('#confirm-delete').on('click', function() {
    deleteProductLine(deleteItemId);
  });
  
  // 点击模态框背景关闭
  $('.bjt-modal').on('click', function(e) {
    if ($(e.target).hasClass('bjt-modal')) {
      $(this).removeClass('bjt-modal-show');
    }
  });
  
  // 导入提交按钮
  $('#import-submit').on('click', function() {
    importProductLines();
  });
  
  // Toast关闭按钮
  $('.bjt-toast-close').on('click', function() {
    $(this).closest('.bjt-toast').removeClass('bjt-toast-show');
  });
}

// 导入产品线
function importProductLines() {
  const $ = jQuery;
  const formData = new FormData($('#import-form')[0]);
  
  // 检查是否选择了文件
  if (!$('#import-file')[0].files.length) {
    showToast('error', '请选择文件', '');
    return;
  }
  
  $.ajax({
    url: bjt_admin.api_url + 'product-lines/import',
    method: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 禁用提交按钮
      $('#import-submit').prop('disabled', true).text('导入中...');
    },
    success: function(response) {
      showToast('success', '导入成功', `已成功导入 ${response.data.imported} 个产品线`);
      // 关闭模态框
      $('#import-dialog').removeClass('bjt-modal-show');
      // 重新加载数据
      loadProductLines(1);
    },
    error: function(error) {
      console.error('导入失败', error);
      showToast('error', '导入失败', error.responseJSON?.message || '请稍后重试');
    },
    complete: function() {
      // 恢复提交按钮
      $('#import-submit').prop('disabled', false).text('导入');
    }
  });
}

// 导出产品线
function exportProductLines() {
  const $ = jQuery;
  const status = $('#filter-status').val();
  
  // 构建导出URL
  let exportUrl = bjt_admin.api_url + 'product-lines/export?_wpnonce=' + bjt_admin.nonce;
  
  // 添加筛选参数
  if (status) {
    exportUrl += '&status=' + status;
  }
  
  // 触发下载
  window.location.href = exportUrl;
}

// 更新分页控件
function updatePagination(selector, currentPage, totalPages) {
  const $ = jQuery;
  const pagination = $(selector);
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

// 显示Toast通知
function showToast(type, title, message) {
  const $ = jQuery;
  const toast = $('#bjt-toast');
  const toastTitle = $('.bjt-toast-title');
  const toastBody = $('.bjt-toast-body');
  const toastIcon = $('.bjt-toast-icon');
  
  // 设置图标
  toastIcon.removeClass().addClass('bjt-toast-icon');
  switch (type) {
    case 'success':
      toastIcon.addClass('bjt-icon-success');
      break;
    case 'error':
      toastIcon.addClass('bjt-icon-error');
      break;
    case 'warning':
      toastIcon.addClass('bjt-icon-warning');
      break;
    case 'info':
      toastIcon.addClass('bjt-icon-info');
      break;
  }
  
  // 设置内容
  toastTitle.text(title);
  toastBody.text(message);
  
  // 添加类型类
  toast.removeClass('bjt-toast-success bjt-toast-error bjt-toast-warning bjt-toast-info')
       .addClass('bjt-toast-' + type + ' bjt-toast-show');
  
  // 自动关闭
  setTimeout(function() {
    toast.removeClass('bjt-toast-show');
  }, 3000);
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0') + ' ' + 
         String(date.getHours()).padStart(2, '0') + ':' + 
         String(date.getMinutes()).padStart(2, '0');
}
</script> 