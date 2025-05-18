<?php
/**
 * 关系管理列表页面模板
 * 
 * @package BJT_Product_Admin
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取URL参数
$part_id = isset($_GET['part_id']) ? intval($_GET['part_id']) : 0;
$accessory_id = isset($_GET['accessory_id']) ? intval($_GET['accessory_id']) : 0;
?>
<div class="bjt-relationships">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title">关系管理</h1>
  </div>
  
  <?php if ($part_id || $accessory_id): ?>
  <!-- 当前选择的项目信息 -->
  <div class="bjt-card bjt-current-item-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title"><?php echo $part_id ? '当前主机料号' : '当前配件'; ?></h2>
      <div class="bjt-card-actions">
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships')); ?>" class="bjt-btn bjt-btn-secondary">
          <i class="bjt-icon bjt-icon-reset"></i> 重置选择
        </a>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships&action=add' . 
            ($part_id ? '&part_id=' . $part_id : '') . 
            ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 添加关联
        </a>
      </div>
    </div>
    <div class="bjt-card-body" id="current-item-details">
      <!-- 当前选择的项目详情将通过AJAX加载 -->
      <div class="bjt-loading-spinner">加载中...</div>
    </div>
  </div>
  <?php endif; ?>
  
  <!-- 关系表格区域 -->
  <div class="bjt-card bjt-relationships-table-container">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title">关系列表</h2>
      <div class="bjt-card-filter">
        <div class="bjt-filter-field">
          <label for="filter-parent-type">父项类型</label>
          <select id="filter-parent-type" class="bjt-select">
            <option value="">全部</option>
            <option value="part">主机料号</option>
            <option value="accessory">配件</option>
          </select>
        </div>
        <div class="bjt-filter-field">
          <label for="filter-is-required">必要性</label>
          <select id="filter-is-required" class="bjt-select">
            <option value="">全部</option>
            <option value="1">必需</option>
            <option value="0">可选</option>
          </select>
        </div>
        <button class="bjt-btn bjt-btn-secondary" id="reset-filters">
          重置
        </button>
      </div>
      <div class="bjt-card-actions">
        <button class="bjt-btn bjt-btn-secondary bjt-export-btn" id="export-relationships">
          <i class="bjt-icon bjt-icon-export"></i> 导出
        </button>
        <?php if (!$part_id && !$accessory_id): ?>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships&action=add')); ?>" class="bjt-btn bjt-btn-primary">
          <i class="bjt-icon bjt-icon-plus"></i> 新增关联
        </a>
        <?php endif; ?>
      </div>
    </div>
    <div class="bjt-card-body">
      <table class="bjt-table bjt-relationships-table">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-relationships"></th>
            <th>ID</th>
            <th>父项类型</th>
            <th>父项名称</th>
            <th>子项类型</th>
            <th>子项名称</th>
            <th>数量</th>
            <th>必要性</th>
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
          <option value="set_required">设为必需</option>
          <option value="set_optional">设为可选</option>
        </select>
        <button id="apply-bulk-action" class="bjt-btn bjt-btn-secondary">应用</button>
      </div>
      <div class="bjt-pagination" id="relationships-pagination">
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
          <p>您确定要删除选中的关联关系吗？此操作无法撤销。</p>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-danger" id="confirm-delete">删除</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 显示子项模态框 -->
  <div class="bjt-modal" id="show-children-modal">
    <div class="bjt-modal-dialog bjt-modal-lg">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">下一级关联项</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
          <div class="bjt-current-path">
            <ol class="bjt-breadcrumb" id="relationship-path">
              <li>主路径</li>
            </ol>
          </div>
          <table class="bjt-table bjt-children-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>类型</th>
                <th>名称</th>
                <th>数量</th>
                <th>必要性</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 子项表格内容将通过JavaScript动态生成 -->
            </tbody>
          </table>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">关闭</button>
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
let relationshipsTable;
let selectedRelationshipId = null;
let deleteItemId = null;

// 初始化页面
jQuery(document).ready(function($) {
  initRelationshipsPage();
  
  // 如果URL中有part_id或accessory_id参数，加载当前项目详情
  <?php if ($part_id || $accessory_id): ?>
  loadCurrentItemDetails(<?php echo $part_id ? "'part', $part_id" : "'accessory', $accessory_id"; ?>);
  <?php endif; ?>
});

// 初始化关系管理页面
function initRelationshipsPage() {
  const $ = jQuery;
  
  // 初始化关系表格
  loadRelationships(1);
  
  // 绑定分页事件
  $('#relationships-pagination').on('click', '.bjt-pagination-item', function(e) {
    e.preventDefault();
    const page = $(this).data('page');
    loadRelationships(page);
  });
  
  // 初始化筛选功能
  initFilters();
  
  // 初始化批量操作
  initBulkActions();
  
  // 初始化模态框
  initModals();
  
  // 导出按钮
  $('#export-relationships').on('click', function() {
    exportRelationships();
  });
  
  // 全选/取消全选
  $('#select-all-relationships').on('change', function() {
    $('.bjt-relationship-checkbox').prop('checked', $(this).prop('checked'));
  });
}

// 加载关系数据
function loadRelationships(page) {
  const $ = jQuery;
  const parentType = $('#filter-parent-type').val();
  const isRequired = $('#filter-is-required').val();
  
  // 构建查询参数
  let params = {
    page: page,
    per_page: 10
  };
  
  // 添加筛选参数
  if (parentType) {
    params.parent_type = parentType;
  }
  
  if (isRequired !== '') {
    params.is_required = isRequired;
  }
  
  <?php if ($part_id): ?>
  params.part_id = <?php echo $part_id; ?>;
  <?php endif; ?>
  
  <?php if ($accessory_id): ?>
  params.accessory_id = <?php echo $accessory_id; ?>;
  <?php endif; ?>
  
  $.ajax({
    url: bjt_admin.api_url + 'relationships',
    method: 'GET',
    data: params,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 显示加载中状态
      $('.bjt-relationships-table').addClass('bjt-loading');
    },
    success: function(response, status, xhr) {
      // 更新表格内容
      updateRelationshipsTable(response.data);
      
      // 更新分页
      const totalPages = xhr.getResponseHeader('X-WP-TotalPages') || 1;
      updatePagination('#relationships-pagination', page, totalPages);
    },
    error: function(error) {
      console.error('加载关系数据失败', error);
      showToast('error', '加载关系数据失败', error.responseJSON?.message || '请检查网络连接');
    },
    complete: function() {
      // 移除加载中状态
      $('.bjt-relationships-table').removeClass('bjt-loading');
    }
  });
}

// 更新关系表格
function updateRelationshipsTable(data) {
  const $ = jQuery;
  const tbody = $('.bjt-relationships-table tbody');
  tbody.empty();
  
  // 没有数据时显示空状态
  if (!data || data.length === 0) {
    tbody.html('<tr><td colspan="10" class="bjt-empty-state">暂无数据</td></tr>');
    return;
  }
  
  // 遍历数据并创建表格行
  data.forEach(function(item) {
    const isRequired = item.is_required ? 
      '<span class="bjt-badge bjt-badge-success">必需</span>' : 
      '<span class="bjt-badge bjt-badge-secondary">可选</span>';
    
    const parentType = item.parent_type === 'part' ? '主机料号' : '配件';
    const childType = item.child_type === 'accessory' ? '配件' : item.child_type;
    
    const row = `
      <tr data-id="${item.id}">
        <td><input type="checkbox" class="bjt-relationship-checkbox" value="${item.id}"></td>
        <td>${item.id}</td>
        <td>${parentType}</td>
        <td>${item.parent_name}</td>
        <td>${childType}</td>
        <td>${item.child_name}</td>
        <td>${item.quantity}</td>
        <td>${isRequired}</td>
        <td>${formatDate(item.created_at)}</td>
        <td class="bjt-actions">
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-relationships&action=edit&id=${item.id}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline js-show-children" data-id="${item.id}" title="查看下一级">
            <i class="bjt-icon bjt-icon-tree"></i>
          </button>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline bjt-btn-danger js-delete-relationship" data-id="${item.id}" title="删除">
            <i class="bjt-icon bjt-icon-delete"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // 绑定操作按钮事件
  bindRelationshipActions();
}

// 绑定关系表格操作按钮事件
function bindRelationshipActions() {
  const $ = jQuery;
  
  // 删除按钮
  $('.js-delete-relationship').off('click').on('click', function() {
    deleteItemId = $(this).data('id');
    $('#delete-confirm-modal').addClass('bjt-modal-show');
  });
  
  // 查看下一级按钮
  $('.js-show-children').off('click').on('click', function() {
    const relationshipId = $(this).data('id');
    loadChildRelationships(relationshipId);
  });
}

// 加载子关系
function loadChildRelationships(parentRelationshipId) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'relationships/children/' + parentRelationshipId,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 清空并显示加载中
      $('.bjt-children-table tbody').html('<tr><td colspan="6" class="bjt-loading-text">加载中...</td></tr>');
      $('#show-children-modal').addClass('bjt-modal-show');
    },
    success: function(response) {
      updateChildrenTable(response.data, parentRelationshipId);
      
      // 更新路径导航
      updateRelationshipPath(response.path || []);
    },
    error: function(error) {
      console.error('加载子关系失败', error);
      $('.bjt-children-table tbody').html('<tr><td colspan="6" class="bjt-error-text">加载失败</td></tr>');
    }
  });
}

// 更新子关系表格
function updateChildrenTable(data, parentId) {
  const $ = jQuery;
  const tbody = $('.bjt-children-table tbody');
  tbody.empty();
  
  // 没有数据时显示空状态
  if (!data || data.length === 0) {
    tbody.html('<tr><td colspan="6" class="bjt-empty-state">没有下一级关联</td></tr>');
    return;
  }
  
  // 遍历数据并创建表格行
  data.forEach(function(item) {
    const isRequired = item.is_required ? 
      '<span class="bjt-badge bjt-badge-success">必需</span>' : 
      '<span class="bjt-badge bjt-badge-secondary">可选</span>';
    
    const type = item.type === 'accessory' ? '配件' : item.type;
    
    const row = `
      <tr data-id="${item.id}">
        <td>${item.id}</td>
        <td>${type}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${isRequired}</td>
        <td class="bjt-actions">
          <a href="${bjt_admin.admin_url}admin.php?page=bjt-relationships&action=edit&id=${item.id}" class="bjt-btn bjt-btn-sm bjt-btn-outline" title="编辑">
            <i class="bjt-icon bjt-icon-edit"></i>
          </a>
          <button class="bjt-btn bjt-btn-sm bjt-btn-outline js-show-grandchildren" data-id="${item.id}" data-parent="${parentId}" title="查看下一级">
            <i class="bjt-icon bjt-icon-tree"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
  
  // 绑定下一级按钮事件
  $('.js-show-grandchildren').off('click').on('click', function() {
    const relationshipId = $(this).data('id');
    loadChildRelationships(relationshipId);
  });
}

// 更新关系路径导航
function updateRelationshipPath(pathData) {
  const $ = jQuery;
  const breadcrumb = $('#relationship-path');
  
  // 保留第一个元素（"主路径"）
  breadcrumb.find('li:not(:first)').remove();
  
  // 添加路径元素
  pathData.forEach(function(item) {
    breadcrumb.append(`<li>${item.name}</li>`);
  });
}

// 加载当前项目详情
function loadCurrentItemDetails(type, id) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + (type === 'part' ? 'parts/' : 'accessories/') + id,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      if (response.data) {
        updateCurrentItemDetails(type, response.data);
      }
    },
    error: function(error) {
      console.error('加载项目详情失败', error);
      $('#current-item-details').html('<div class="bjt-error-message">加载项目详情失败</div>');
    }
  });
}

// 更新当前项目详情
function updateCurrentItemDetails(type, data) {
  const $ = jQuery;
  let detailsHtml = '';
  
  if (type === 'part') {
    detailsHtml = `
      <div class="bjt-item-details">
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">料号：</span>
          <span class="bjt-detail-value">${data.part_number}</span>
        </div>
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">主机型号：</span>
          <span class="bjt-detail-value">${data.host_model || ''}</span>
        </div>
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">名称：</span>
          <span class="bjt-detail-value">${data.name_zh}</span>
        </div>
        ${data.image ? `
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">图片：</span>
          <span class="bjt-detail-value">
            <img src="${data.image}" alt="${data.name_zh}" class="bjt-thumbnail">
          </span>
        </div>
        ` : ''}
      </div>
    `;
  } else {
    const categories = {
      'consumables': '耗材',
      'spareparts': '备件',
      'options': '选配件'
    };
    
    detailsHtml = `
      <div class="bjt-item-details">
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">料号：</span>
          <span class="bjt-detail-value">${data.part_number}</span>
        </div>
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">名称：</span>
          <span class="bjt-detail-value">${data.name_zh}</span>
        </div>
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">分类：</span>
          <span class="bjt-detail-value">${categories[data.category] || data.category}</span>
        </div>
        ${data.image ? `
        <div class="bjt-detail-row">
          <span class="bjt-detail-label">图片：</span>
          <span class="bjt-detail-value">
            <img src="${data.image}" alt="${data.name_zh}" class="bjt-thumbnail">
          </span>
        </div>
        ` : ''}
      </div>
    `;
  }
  
  $('#current-item-details').html(detailsHtml);
}

// 初始化筛选功能
function initFilters() {
  const $ = jQuery;
  
  // 筛选变化时重新加载
  $('#filter-parent-type, #filter-is-required').on('change', function() {
    loadRelationships(1);
  });
  
  // 重置筛选按钮
  $('#reset-filters').on('click', function() {
    $('#filter-parent-type, #filter-is-required').val('');
    loadRelationships(1);
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
    $('.bjt-relationship-checkbox:checked').each(function() {
      selected.push($(this).val());
    });
    
    if (selected.length === 0) {
      showToast('warning', '请选择至少一个项目', '');
      return;
    }
    
    // 根据操作类型执行不同的操作
    switch (action) {
      case 'delete':
        confirmBulkDelete(selected);
        break;
      case 'set_required':
        updateRelationshipsRequired(selected, true);
        break;
      case 'set_optional':
        updateRelationshipsRequired(selected, false);
        break;
    }
  });
}

// 确认批量删除
function confirmBulkDelete(ids) {
  const $ = jQuery;
  
  deleteItemId = ids;
  $('#delete-confirm-modal').addClass('bjt-modal-show');
}

// 更新关系必要性
function updateRelationshipsRequired(ids, isRequired) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'relationships/bulk-update',
    method: 'POST',
    data: JSON.stringify({
      ids: ids,
      is_required: isRequired
    }),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showToast('success', '更新成功', `已将 ${ids.length} 个关系设置为${isRequired ? '必需' : '可选'}`);
      loadRelationships($('#relationships-pagination .bjt-pagination-current').data('page') || 1);
    },
    error: function(error) {
      console.error('更新失败', error);
      showToast('error', '更新失败', error.responseJSON?.message || '请稍后重试');
    }
  });
}

// 删除关系
function deleteRelationship(id) {
  const $ = jQuery;
  const isArray = Array.isArray(id);
  const url = isArray ? 
    bjt_admin.api_url + 'relationships/bulk-delete' : 
    bjt_admin.api_url + 'relationships/' + id;
  
  $.ajax({
    url: url,
    method: 'DELETE',
    data: isArray ? JSON.stringify({ ids: id }) : null,
    contentType: isArray ? 'application/json' : 'application/x-www-form-urlencoded',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      showToast('success', '删除成功', isArray ? `已删除 ${id.length} 个关系` : '关系已删除');
      loadRelationships($('#relationships-pagination .bjt-pagination-current').data('page') || 1);
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

// 初始化模态框
function initModals() {
  const $ = jQuery;
  
  // 模态框关闭按钮
  $('.bjt-modal-close, [data-dismiss="modal"]').on('click', function() {
    $(this).closest('.bjt-modal').removeClass('bjt-modal-show');
  });
  
  // 确认删除按钮
  $('#confirm-delete').on('click', function() {
    deleteRelationship(deleteItemId);
  });
  
  // 点击模态框背景关闭
  $('.bjt-modal').on('click', function(e) {
    if ($(e.target).hasClass('bjt-modal')) {
      $(this).removeClass('bjt-modal-show');
    }
  });
  
  // Toast关闭按钮
  $('.bjt-toast-close').on('click', function() {
    $(this).closest('.bjt-toast').removeClass('bjt-toast-show');
  });
}

// 导出关系数据
function exportRelationships() {
  const $ = jQuery;
  const parentType = $('#filter-parent-type').val();
  const isRequired = $('#filter-is-required').val();
  
  // 构建导出URL
  let exportUrl = bjt_admin.api_url + 'relationships/export?_wpnonce=' + bjt_admin.nonce;
  
  // 添加筛选参数
  if (parentType) {
    exportUrl += '&parent_type=' + parentType;
  }
  
  if (isRequired !== '') {
    exportUrl += '&is_required=' + isRequired;
  }
  
  <?php if ($part_id): ?>
  exportUrl += '&part_id=<?php echo $part_id; ?>';
  <?php endif; ?>
  
  <?php if ($accessory_id): ?>
  exportUrl += '&accessory_id=<?php echo $accessory_id; ?>';
  <?php endif; ?>
  
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