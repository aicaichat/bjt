<?php
/**
 * 关系编辑页面模板
 * 
 * @package BJT_Product_Admin
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取URL参数
$relationship_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$part_id = isset($_GET['part_id']) ? intval($_GET['part_id']) : 0;
$accessory_id = isset($_GET['accessory_id']) ? intval($_GET['accessory_id']) : 0;
$is_edit_mode = $relationship_id > 0;
?>

<div class="bjt-relationship-edit">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title"><?php echo $is_edit_mode ? '编辑关联关系' : '添加关联关系'; ?></h1>
    <div class="bjt-page-actions">
      <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships' . 
          ($part_id ? '&part_id=' . $part_id : '') . 
          ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>" class="bjt-btn bjt-btn-secondary">
        <i class="bjt-icon bjt-icon-arrow-left"></i> 返回列表
      </a>
    </div>
  </div>
  
  <!-- 关系编辑表单 -->
  <div class="bjt-card">
    <div class="bjt-card-header">
      <h2 class="bjt-card-title"><?php echo $is_edit_mode ? '编辑关联关系' : '添加关联关系'; ?></h2>
      <div class="bjt-card-subtitle">
        <?php echo $is_edit_mode ? '修改现有关联关系' : '创建新的产品关联关系'; ?>
      </div>
    </div>
    <div class="bjt-card-body">
      <div class="bjt-loading" id="relationship-form-loader">加载中...</div>
      <form id="relationship-form" class="bjt-form" style="display: none;">
        <!-- 隐藏字段 -->
        <?php if ($is_edit_mode): ?>
        <input type="hidden" id="relationship_id" name="id" value="<?php echo $relationship_id; ?>">
        <?php endif; ?>
        
        <!-- 父项信息 -->
        <div class="bjt-form-section">
          <h3 class="bjt-section-title">父项信息</h3>
          <div class="bjt-section-content" id="parent-info-section">
            <!-- 父项信息将通过JavaScript动态生成 -->
            <div class="bjt-loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <!-- 子项信息 -->
        <div class="bjt-form-section">
          <h3 class="bjt-section-title">子项信息</h3>
          <div class="bjt-form-row">
            <div class="bjt-form-group bjt-form-group-large">
              <label for="child_id" class="bjt-form-label">选择配件</label>
              <select id="child_id" name="child_id" class="bjt-select" required>
                <option value="">-- 请选择配件 --</option>
                <!-- 配件选项将通过JavaScript动态生成 -->
              </select>
              <div class="bjt-form-help">选择要关联的配件</div>
            </div>
            <input type="hidden" id="child_type" name="child_type" value="accessory">
          </div>
          
          <div id="selected-accessory-info" class="bjt-info-panel" style="display: none;">
            <!-- 所选配件的详细信息将在此显示 -->
          </div>
        </div>
        
        <!-- 关系设置 -->
        <div class="bjt-form-section">
          <h3 class="bjt-section-title">关系设置</h3>
          <div class="bjt-form-row">
            <div class="bjt-form-group">
              <label for="quantity" class="bjt-form-label">数量</label>
              <input type="number" id="quantity" name="quantity" class="bjt-input" min="1" max="999" value="1" required>
              <div class="bjt-form-help">配件的数量</div>
            </div>
            
            <div class="bjt-form-group">
              <div class="bjt-checkbox-wrapper">
                <input type="checkbox" id="is_required" name="is_required" class="bjt-checkbox" checked>
                <label for="is_required" class="bjt-checkbox-label">必需</label>
              </div>
              <div class="bjt-form-help">标记此配件是否为必需</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-group bjt-form-group-large">
              <label for="notes" class="bjt-form-label">备注</label>
              <textarea id="notes" name="notes" class="bjt-textarea" rows="3" placeholder="输入关于此关联关系的备注信息"></textarea>
            </div>
          </div>
        </div>
        
        <!-- 表单操作 -->
        <div class="bjt-form-actions">
          <button type="button" class="bjt-btn bjt-btn-secondary" id="cancel-btn">取消</button>
          <button type="submit" class="bjt-btn bjt-btn-primary" id="save-btn">保存</button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- 确认离开模态框 -->
  <div class="bjt-modal" id="leave-confirm-modal">
    <div class="bjt-modal-dialog">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">确认离开</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
          <p>表单有未保存的更改，确定要离开吗？</p>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-primary" id="confirm-leave">确定离开</button>
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
let originalFormData = {};
let hasFormChanged = false;
let leaveUrl = '';

// 初始化页面
jQuery(document).ready(function($) {
  // 初始化表单
  initRelationshipForm();
  
  // 加载关系数据（如果是编辑模式）
  <?php if ($is_edit_mode): ?>
  loadRelationshipData(<?php echo $relationship_id; ?>);
  <?php else: ?>
  // 如果有父项ID参数，初始化父项信息
  <?php if ($part_id || $accessory_id): ?>
  loadParentItemInfo(<?php echo $part_id ? "'part', $part_id" : "'accessory', $accessory_id"; ?>);
  <?php else: ?>
  // 如果没有父项，显示父项选择器
  showParentSelector();
  <?php endif; ?>
  
  // 加载配件列表
  loadAccessories();
  
  // 显示表单
  $('#relationship-form-loader').hide();
  $('#relationship-form').show();
  <?php endif; ?>
});

// 初始化关系编辑表单
function initRelationshipForm() {
  const $ = jQuery;
  
  // 表单提交处理
  $('#relationship-form').on('submit', function(e) {
    e.preventDefault();
    saveRelationship();
  });
  
  // 取消按钮
  $('#cancel-btn').on('click', function() {
    if (hasFormChanged) {
      $('#leave-confirm-modal').addClass('bjt-modal-show');
      leaveUrl = '<?php echo esc_url(admin_url('admin.php?page=bjt-relationships' . 
          ($part_id ? '&part_id=' . $part_id : '') . 
          ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>';
    } else {
      window.location.href = '<?php echo esc_url(admin_url('admin.php?page=bjt-relationships' . 
          ($part_id ? '&part_id=' . $part_id : '') . 
          ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>';
    }
  });
  
  // 配件选择变化时
  $('#child_id').on('change', function() {
    const childId = $(this).val();
    if (childId) {
      loadAccessoryDetails(childId);
    } else {
      $('#selected-accessory-info').hide();
    }
    checkFormChanged();
  });
  
  // 数量和必需性变化时
  $('#quantity, #is_required, #notes').on('change input', function() {
    checkFormChanged();
  });
  
  // 确认离开按钮
  $('#confirm-leave').on('click', function() {
    window.location.href = leaveUrl;
  });
  
  // 模态框关闭按钮
  $('.bjt-modal-close, [data-dismiss="modal"]').on('click', function() {
    $(this).closest('.bjt-modal').removeClass('bjt-modal-show');
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
  
  // 保存原始表单数据
  setTimeout(function() {
    originalFormData = getFormData();
  }, 500);
}

// 加载关系数据
function loadRelationshipData(relationshipId) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'relationships/' + relationshipId,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      if (response.data) {
        const data = response.data;
        
        // 加载父项信息
        loadParentItemInfo(data.parent_type, data.parent_id);
        
        // 加载配件列表
        loadAccessories().then(function() {
          // 设置表单值
          $('#child_id').val(data.child_id);
          $('#child_type').val(data.child_type || 'accessory');
          $('#quantity').val(data.quantity || 1);
          $('#is_required').prop('checked', data.is_required);
          $('#notes').val(data.notes || '');
          
          // 加载子项详情
          if (data.child_id) {
            loadAccessoryDetails(data.child_id);
          }
          
          // 保存原始表单数据
          originalFormData = getFormData();
          
          // 显示表单
          $('#relationship-form-loader').hide();
          $('#relationship-form').show();
        });
      } else {
        showToast('error', '加载失败', '无法获取关系数据');
      }
    },
    error: function(error) {
      console.error('加载关系数据失败', error);
      showToast('error', '加载失败', error.responseJSON?.message || '请检查网络连接');
    }
  });
}

// 加载父项信息
function loadParentItemInfo(type, id) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + (type === 'part' ? 'parts/' : 'accessories/') + id,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      if (response.data) {
        updateParentInfoSection(type, response.data);
        
        // 添加隐藏字段
        if (!$('#parent_type').length) {
          $('#relationship-form').prepend(`
            <input type="hidden" id="parent_type" name="parent_type" value="${type}">
            <input type="hidden" id="parent_id" name="parent_id" value="${id}">
          `);
        } else {
          $('#parent_type').val(type);
          $('#parent_id').val(id);
        }
      } else {
        showToast('warning', '注意', '未找到父项信息');
      }
    },
    error: function(error) {
      console.error('加载父项信息失败', error);
      showToast('error', '加载失败', '无法获取父项信息');
    }
  });
}

// 更新父项信息区域
function updateParentInfoSection(type, data) {
  const $ = jQuery;
  const section = $('#parent-info-section');
  
  if (type === 'part') {
    section.html(`
      <div class="bjt-info-panel bjt-info-panel-primary">
        <div class="bjt-info-panel-header">
          <h4 class="bjt-info-panel-title">主机料号信息</h4>
        </div>
        <div class="bjt-info-panel-body">
          <div class="bjt-info-grid">
            <div class="bjt-info-item">
              <span class="bjt-info-label">料号：</span>
              <span class="bjt-info-value">${data.part_number}</span>
            </div>
            <div class="bjt-info-item">
              <span class="bjt-info-label">主机型号：</span>
              <span class="bjt-info-value">${data.host_model || '-'}</span>
            </div>
            <div class="bjt-info-item">
              <span class="bjt-info-label">名称：</span>
              <span class="bjt-info-value">${data.name_zh}</span>
            </div>
            ${data.image ? `
            <div class="bjt-info-item bjt-info-item-full">
              <span class="bjt-info-label">图片：</span>
              <span class="bjt-info-value">
                <img src="${data.image}" alt="${data.name_zh}" class="bjt-thumbnail">
              </span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  } else {
    const categories = {
      'consumables': '耗材',
      'spareparts': '备件',
      'options': '选配件'
    };
    
    section.html(`
      <div class="bjt-info-panel bjt-info-panel-secondary">
        <div class="bjt-info-panel-header">
          <h4 class="bjt-info-panel-title">配件信息</h4>
        </div>
        <div class="bjt-info-panel-body">
          <div class="bjt-info-grid">
            <div class="bjt-info-item">
              <span class="bjt-info-label">料号：</span>
              <span class="bjt-info-value">${data.part_number}</span>
            </div>
            <div class="bjt-info-item">
              <span class="bjt-info-label">名称：</span>
              <span class="bjt-info-value">${data.name_zh}</span>
            </div>
            <div class="bjt-info-item">
              <span class="bjt-info-label">分类：</span>
              <span class="bjt-info-value">${categories[data.category] || data.category}</span>
            </div>
            ${data.image ? `
            <div class="bjt-info-item bjt-info-item-full">
              <span class="bjt-info-label">图片：</span>
              <span class="bjt-info-value">
                <img src="${data.image}" alt="${data.name_zh}" class="bjt-thumbnail">
              </span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  }
}

// 显示父项选择器
function showParentSelector() {
  const $ = jQuery;
  const section = $('#parent-info-section');
  
  section.html(`
    <div class="bjt-warning-message">
      <i class="bjt-icon bjt-icon-warning"></i>
      <span>未指定父项，请选择一个主机料号或配件作为父项</span>
    </div>
    
    <div class="bjt-form-row">
      <div class="bjt-form-group">
        <label class="bjt-form-label">父项类型</label>
        <select id="parent_type_selector" class="bjt-select">
          <option value="">-- 请选择 --</option>
          <option value="part">主机料号</option>
          <option value="accessory">配件</option>
        </select>
      </div>
      
      <div class="bjt-form-group bjt-form-group-large">
        <label class="bjt-form-label">选择父项</label>
        <select id="parent_id_selector" class="bjt-select" disabled>
          <option value="">-- 请先选择父项类型 --</option>
        </select>
      </div>
    </div>
  `);
  
  // 父项类型选择事件
  $('#parent_type_selector').on('change', function() {
    const type = $(this).val();
    if (type) {
      loadParentOptions(type);
    } else {
      $('#parent_id_selector').html('<option value="">-- 请先选择父项类型 --</option>').prop('disabled', true);
    }
  });
  
  // 父项选择事件
  $('#parent_id_selector').on('change', function() {
    const type = $('#parent_type_selector').val();
    const id = $(this).val();
    
    if (type && id) {
      loadParentItemInfo(type, id);
    }
  });
}

// 加载父项选项
function loadParentOptions(type) {
  const $ = jQuery;
  const selector = $('#parent_id_selector');
  
  selector.html('<option value="">加载中...</option>').prop('disabled', true);
  
  $.ajax({
    url: bjt_admin.api_url + (type === 'part' ? 'parts' : 'accessories'),
    method: 'GET',
    data: {
      per_page: -1 // 获取所有项目
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      selector.empty().append('<option value="">-- 请选择 --</option>');
      
      if (response.data && response.data.length > 0) {
        response.data.forEach(function(item) {
          selector.append(`<option value="${item.id}">${item.name_zh} (${item.part_number})</option>`);
        });
        selector.prop('disabled', false);
      } else {
        selector.html('<option value="">-- 无可用选项 --</option>');
      }
    },
    error: function(error) {
      console.error('加载选项失败', error);
      selector.html('<option value="">-- 加载失败 --</option>');
    }
  });
}

// 加载配件列表
function loadAccessories() {
  const $ = jQuery;
  
  return $.ajax({
    url: bjt_admin.api_url + 'accessories',
    method: 'GET',
    data: {
      per_page: -1 // 获取所有配件
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      const select = $('#child_id');
      select.find('option:not(:first)').remove();
      
      if (response.data && response.data.length > 0) {
        response.data.forEach(function(item) {
          select.append(`<option value="${item.id}">${item.name_zh} (${item.part_number})</option>`);
        });
      }
    },
    error: function(error) {
      console.error('加载配件失败', error);
      showToast('error', '加载失败', '无法获取配件列表');
    }
  });
}

// 加载配件详情
function loadAccessoryDetails(accessoryId) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'accessories/' + accessoryId,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
    },
    success: function(response) {
      if (response.data) {
        updateSelectedAccessoryInfo(response.data);
      }
    },
    error: function(error) {
      console.error('加载配件详情失败', error);
      $('#selected-accessory-info').hide();
    }
  });
}

// 更新所选配件信息
function updateSelectedAccessoryInfo(data) {
  const $ = jQuery;
  const infoPanel = $('#selected-accessory-info');
  
  const categories = {
    'consumables': '耗材',
    'spareparts': '备件',
    'options': '选配件'
  };
  
  infoPanel.html(`
    <div class="bjt-info-panel-header">
      <h4 class="bjt-info-panel-title">所选配件信息</h4>
    </div>
    <div class="bjt-info-panel-body">
      <div class="bjt-info-grid">
        <div class="bjt-info-item">
          <span class="bjt-info-label">料号：</span>
          <span class="bjt-info-value">${data.part_number}</span>
        </div>
        <div class="bjt-info-item">
          <span class="bjt-info-label">名称：</span>
          <span class="bjt-info-value">${data.name_zh}</span>
        </div>
        <div class="bjt-info-item">
          <span class="bjt-info-label">分类：</span>
          <span class="bjt-info-value">${categories[data.category] || data.category}</span>
        </div>
        ${data.price ? `
        <div class="bjt-info-item">
          <span class="bjt-info-label">价格：</span>
          <span class="bjt-info-value">${data.price}</span>
        </div>
        ` : ''}
        ${data.image ? `
        <div class="bjt-info-item bjt-info-item-full">
          <span class="bjt-info-label">图片：</span>
          <span class="bjt-info-value">
            <img src="${data.image}" alt="${data.name_zh}" class="bjt-thumbnail">
          </span>
        </div>
        ` : ''}
      </div>
    </div>
  `).show();
}

// 保存关系数据
function saveRelationship() {
  const $ = jQuery;
  const form = $('#relationship-form');
  
  // 表单验证
  if (!validateForm()) {
    return;
  }
  
  // 获取表单数据
  const formData = getFormData();
  
  // API请求
  const isEdit = <?php echo $is_edit_mode ? 'true' : 'false'; ?>;
  const method = isEdit ? 'PUT' : 'POST';
  const url = bjt_admin.api_url + 'relationships' + (isEdit ? '/' + formData.id : '');
  
  $.ajax({
    url: url,
    method: method,
    data: JSON.stringify(formData),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 禁用提交按钮
      $('#save-btn').prop('disabled', true).text('保存中...');
    },
    success: function(response) {
      showToast('success', '保存成功', '关系数据已保存');
      
      // 保存成功后，重置表单状态
      hasFormChanged = false;
      
      // 延迟返回列表页面
      setTimeout(function() {
        window.location.href = '<?php echo esc_url(admin_url('admin.php?page=bjt-relationships' . 
            ($part_id ? '&part_id=' . $part_id : '') . 
            ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>';
      }, 1500);
    },
    error: function(error) {
      console.error('保存失败', error);
      showToast('error', '保存失败', error.responseJSON?.message || '请稍后重试');
      
      // 恢复提交按钮
      $('#save-btn').prop('disabled', false).text('保存');
    }
  });
}

// 表单验证
function validateForm() {
  const $ = jQuery;
  let isValid = true;
  
  // 检查父项
  if (!$('#parent_type').val() || !$('#parent_id').val()) {
    showToast('error', '验证失败', '请选择父项');
    isValid = false;
  }
  
  // 检查子项
  if (!$('#child_id').val()) {
    showToast('error', '验证失败', '请选择配件');
    $('#child_id').focus();
    isValid = false;
  }
  
  // 检查数量
  const quantity = parseInt($('#quantity').val());
  if (isNaN(quantity) || quantity < 1) {
    showToast('error', '验证失败', '数量必须大于0');
    $('#quantity').focus();
    isValid = false;
  }
  
  return isValid;
}

// 获取表单数据
function getFormData() {
  const $ = jQuery;
  
  return {
    id: $('#relationship_id').val(),
    parent_type: $('#parent_type').val(),
    parent_id: $('#parent_id').val(),
    child_type: $('#child_type').val(),
    child_id: $('#child_id').val(),
    quantity: parseInt($('#quantity').val()),
    is_required: $('#is_required').prop('checked'),
    notes: $('#notes').val()
  };
}

// 检查表单是否有变化
function checkFormChanged() {
  const $ = jQuery;
  
  const currentData = getFormData();
  
  // 比较当前数据和原始数据
  hasFormChanged = JSON.stringify(currentData) !== JSON.stringify(originalFormData);
  
  // 更新保存按钮状态
  $('#save-btn').prop('disabled', !hasFormChanged);
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
</script> 