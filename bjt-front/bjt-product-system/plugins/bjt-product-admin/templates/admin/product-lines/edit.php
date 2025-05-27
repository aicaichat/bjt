<?php
/**
 * BJT Product Admin - Product Line Edit Page
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前语言
$current_lang = get_locale();
$is_zh = strpos($current_lang, 'zh') !== false;

// 获取产品线ID
$line_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// 获取产品线数据
global $wpdb;
$product_line = null;
if ($line_id > 0) {
    $product_line = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}bjt_product_lines WHERE id = %d",
        $line_id
    ));
}

// 生成nonce
$nonce = wp_create_nonce('bjt_edit_product_line');
?>

<div class="bjt-product-line-edit">
  <div class="bjt-page-header">
    <h1 class="bjt-page-title"><?php echo esc_html($line_id > 0 ? '编辑产品线' : '新增产品线'); ?></h1>
    <div class="bjt-page-actions">
      <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-lines')); ?>" class="bjt-btn bjt-btn-secondary">
        <i class="bjt-icon bjt-icon-back"></i> 返回列表
      </a>
    </div>
  </div>
  
  <!-- 产品线编辑表单 -->
  <form id="bjt-product-line-form" class="bjt-form">
    <!-- 隐藏字段 -->
    <input type="hidden" id="product_line_id" name="id" value="<?php echo esc_attr($line_id); ?>">
    <input type="hidden" id="action_type" name="action_type" value="<?php echo esc_attr($line_id > 0 ? 'edit' : 'add'); ?>">
    
    <!-- 语言切换标签 -->
    <div class="bjt-tabs bjt-language-tabs">
      <button type="button" class="bjt-tab-item active" data-lang="zh">中文</button>
      <button type="button" class="bjt-tab-item" data-lang="en">English</button>
    </div>
    
    <!-- 表单内容容器 -->
    <div class="bjt-form-container">
      <!-- 基本信息卡片 -->
      <div class="bjt-card">
        <div class="bjt-card-header">
          <h2 class="bjt-card-title">基本信息</h2>
        </div>
        <div class="bjt-card-body">
          <!-- 中文标题 -->
          <div class="bjt-form-group" data-lang="zh">
            <label for="title_zh" class="bjt-form-label">产品线名称 <span class="bjt-required">*</span></label>
            <input type="text" id="title_zh" name="title_zh" class="bjt-form-control" required maxlength="100" placeholder="请输入产品线中文名称" value="<?php echo esc_attr($product_line ? $product_line->title_zh : ''); ?>">
            <div class="bjt-form-help">产品线的中文名称，如：医疗器械产品线</div>
          </div>
          
          <!-- 英文标题 -->
          <div class="bjt-form-group" data-lang="en" style="display: none;">
            <label for="title_en" class="bjt-form-label">Product Line Name <span class="bjt-required">*</span></label>
            <input type="text" id="title_en" name="title_en" class="bjt-form-control" required maxlength="100" placeholder="Enter product line name in English" value="<?php echo esc_attr($product_line ? $product_line->title_en : ''); ?>">
            <div class="bjt-form-help">English name for this product line, e.g.: Medical Device Product Line</div>
          </div>
          
          <!-- 排序 -->
          <div class="bjt-form-group">
            <label for="sort_order" class="bjt-form-label">排序</label>
            <input type="number" id="sort_order" name="sort_order" class="bjt-form-control" min="0" value="<?php echo esc_attr($product_line ? $product_line->sort_order : '0'); ?>">
            <div class="bjt-form-help">数字越小排序越靠前</div>
          </div>
          
          <!-- 状态 -->
          <div class="bjt-form-group">
            <label for="status" class="bjt-form-label">状态</label>
            <div class="bjt-switch-container">
              <label class="bjt-switch">
                <input type="checkbox" id="status" name="status" value="publish" <?php checked($product_line ? $product_line->status === 'publish' : false, true); ?>>
                <span class="bjt-switch-slider"></span>
              </label>
              <span class="bjt-switch-label" id="status-text">已上架</span>
            </div>
            <div class="bjt-form-help">控制此产品线是否显示在前台</div>
          </div>
        </div>
      </div>
      
      <!-- 详细信息卡片 -->
      <div class="bjt-card">
        <div class="bjt-card-header">
          <h2 class="bjt-card-title">详细信息</h2>
        </div>
        <div class="bjt-card-body">
          <!-- 中文描述 -->
          <div class="bjt-form-group" data-lang="zh">
            <label for="description_zh" class="bjt-form-label">产品线描述</label>
            <textarea id="description_zh" name="description_zh" class="bjt-form-control bjt-textarea" rows="5" maxlength="1000" placeholder="请输入产品线中文描述"><?php echo esc_textarea($product_line ? $product_line->description_zh : ''); ?></textarea>
            <div class="bjt-form-help">对产品线的中文详细描述</div>
          </div>
          
          <!-- 英文描述 -->
          <div class="bjt-form-group" data-lang="en" style="display: none;">
            <label for="description_en" class="bjt-form-label">Product Line Description</label>
            <textarea id="description_en" name="description_en" class="bjt-form-control bjt-textarea" rows="5" maxlength="1000" placeholder="Enter product line description in English"><?php echo esc_textarea($product_line ? $product_line->description_en : ''); ?></textarea>
            <div class="bjt-form-help">Detailed description of this product line in English</div>
          </div>
          
          <!-- 中文耗材信息 -->
          <div class="bjt-form-group" data-lang="zh">
            <label for="consumables_zh" class="bjt-form-label">耗材信息</label>
            <textarea id="consumables_zh" name="consumables_zh" class="bjt-form-control bjt-textarea" rows="4" maxlength="500" placeholder="请输入此产品线相关的耗材信息"><?php echo esc_textarea($product_line ? $product_line->consumables_zh : ''); ?></textarea>
            <div class="bjt-form-help">与产品线相关的耗材信息，中文描述</div>
          </div>
          
          <!-- 英文耗材信息 -->
          <div class="bjt-form-group" data-lang="en" style="display: none;">
            <label for="consumables_en" class="bjt-form-label">Consumables Information</label>
            <textarea id="consumables_en" name="consumables_en" class="bjt-form-control bjt-textarea" rows="4" maxlength="500" placeholder="Enter consumables information in English"><?php echo esc_textarea($product_line ? $product_line->consumables_en : ''); ?></textarea>
            <div class="bjt-form-help">Information about consumables related to this product line in English</div>
          </div>
          
          <!-- 中文配件信息 -->
          <div class="bjt-form-group" data-lang="zh">
            <label for="parts_zh" class="bjt-form-label">配件信息</label>
            <textarea id="parts_zh" name="parts_zh" class="bjt-form-control bjt-textarea" rows="4" maxlength="500" placeholder="请输入此产品线相关的配件信息"><?php echo esc_textarea($product_line ? $product_line->parts_zh : ''); ?></textarea>
            <div class="bjt-form-help">与产品线相关的配件信息，中文描述</div>
          </div>
          
          <!-- 英文配件信息 -->
          <div class="bjt-form-group" data-lang="en" style="display: none;">
            <label for="parts_en" class="bjt-form-label">Parts Information</label>
            <textarea id="parts_en" name="parts_en" class="bjt-form-control bjt-textarea" rows="4" maxlength="500" placeholder="Enter parts information in English"><?php echo esc_textarea($product_line ? $product_line->parts_en : ''); ?></textarea>
            <div class="bjt-form-help">Information about parts related to this product line in English</div>
          </div>
        </div>
      </div>
      
      <!-- 媒体信息卡片 -->
      <div class="bjt-card">
        <div class="bjt-card-header">
          <h2 class="bjt-card-title">媒体信息</h2>
        </div>
        <div class="bjt-card-body">
          <!-- 产品线图片 -->
          <div class="bjt-form-group">
            <label for="image" class="bjt-form-label">产品线图片</label>
            <div class="bjt-image-uploader">
              <div class="bjt-image-preview" id="image-preview">
                <?php if ($product_line && $product_line->image_url): ?>
                  <img src="<?php echo esc_url($product_line->image_url); ?>" alt="Product Line Image">
                <?php endif; ?>
              </div>
              <div class="bjt-image-actions">
                <button type="button" class="bjt-btn bjt-btn-secondary" id="select-image">选择图片</button>
                <button type="button" class="bjt-btn bjt-btn-danger" id="remove-image" style="display: none;">移除</button>
                <input type="hidden" id="image" name="image_url" value="<?php echo esc_attr($product_line ? $product_line->image_url : ''); ?>">
              </div>
            </div>
            <div class="bjt-form-help">建议尺寸：800×600像素，格式：JPG、PNG</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 表单操作按钮 -->
    <div class="bjt-form-actions">
      <button type="button" class="bjt-btn bjt-btn-secondary" id="cancel-btn">取消</button>
      <button type="submit" class="bjt-btn bjt-btn-primary" id="submit-btn">保存</button>
    </div>
  </form>
  
  <!-- 确认对话框 -->
  <div class="bjt-modal" id="confirm-modal">
    <div class="bjt-modal-dialog">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">确认离开</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
          <p>您有未保存的更改，确定要离开吗？</p>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-danger" id="confirm-leave">离开</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 媒体库对话框 -->
  <div class="bjt-modal" id="media-library-modal">
    <div class="bjt-modal-dialog bjt-modal-lg">
      <div class="bjt-modal-content">
        <div class="bjt-modal-header">
          <h3 class="bjt-modal-title">媒体库</h3>
          <button type="button" class="bjt-modal-close" data-dismiss="modal">&times;</button>
        </div>
        <div class="bjt-modal-body">
          <div class="bjt-media-filter">
            <input type="text" class="bjt-form-control" id="media-search" placeholder="搜索媒体...">
            <select class="bjt-select" id="media-filter">
              <option value="">所有媒体</option>
              <option value="image">图片</option>
              <option value="document">文档</option>
            </select>
          </div>
          <div class="bjt-media-grid" id="media-grid">
            <!-- 媒体库内容将通过JavaScript动态生成 -->
          </div>
          <div class="bjt-media-upload">
            <label for="upload-file" class="bjt-btn bjt-btn-secondary">
              <i class="bjt-icon bjt-icon-upload"></i> 上传新文件
            </label>
            <input type="file" id="upload-file" style="display: none;" accept="image/*">
          </div>
        </div>
        <div class="bjt-modal-footer">
          <button type="button" class="bjt-btn bjt-btn-secondary" data-dismiss="modal">取消</button>
          <button type="button" class="bjt-btn bjt-btn-primary" id="select-media">选择</button>
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
let formChanged = false;
let formSubmitting = false;
let selectedMedia = null;
let originalData = null;

// 初始化页面
jQuery(document).ready(function($) {
  // 初始化表单
  initForm();
  
  // 加载产品线数据（编辑模式）
  if ($('#action_type').val() === 'edit') {
    loadProductLineData($('#product_line_id').val());
  }
  
  // 表单提交事件
  $('#bjt-product-line-form').on('submit', function(e) {
    e.preventDefault();
    submitForm();
  });
  
  // 语言切换事件
  $('.bjt-language-tabs .bjt-tab-item').on('click', function() {
    const lang = $(this).data('lang');
    switchLanguage(lang);
  });
  
  // 表单变化监听
  $('#bjt-product-line-form input, #bjt-product-line-form textarea, #bjt-product-line-form select').on('change input', function() {
    formChanged = true;
  });
  
  // 状态切换事件
  $('#status').on('change', function() {
    updateStatusText();
    formChanged = true;
  });
  
  // 取消按钮事件
  $('#cancel-btn').on('click', function() {
    if (formChanged) {
      $('#confirm-modal').addClass('bjt-modal-show');
    } else {
      navigateToList();
    }
  });
  
  // 确认离开事件
  $('#confirm-leave').on('click', function() {
    navigateToList();
  });
  
  // 选择图片事件
  $('#select-image').on('click', function() {
    $('#media-library-modal').addClass('bjt-modal-show');
    loadMediaLibrary();
  });
  
  // 移除图片事件
  $('#remove-image').on('click', function() {
    removeImage();
  });
  
  // 选择媒体事件
  $('#select-media').on('click', function() {
    if (selectedMedia) {
      $('#image').val(selectedMedia.url);
      $('#image-preview img').attr('src', selectedMedia.url).show();
      $('.bjt-no-image').hide();
      $('#remove-image').show();
      $('#media-library-modal').removeClass('bjt-modal-show');
      formChanged = true;
    } else {
      showToast('warning', '请选择图片', '');
    }
  });
  
  // 媒体网格选择事件
  $(document).on('click', '.bjt-media-item', function() {
    $('.bjt-media-item').removeClass('selected');
    $(this).addClass('selected');
    selectedMedia = {
      id: $(this).data('id'),
      url: $(this).data('url')
    };
  });
  
  // 媒体文件上传事件
  $('#upload-file').on('change', function() {
    if (this.files.length > 0) {
      uploadMediaFile(this.files[0]);
    }
  });
  
  // 模态框关闭事件
  $('.bjt-modal-close, [data-dismiss="modal"]').on('click', function() {
    $(this).closest('.bjt-modal').removeClass('bjt-modal-show');
  });
  
  // 点击模态框背景关闭
  $('.bjt-modal').on('click', function(e) {
    if ($(e.target).hasClass('bjt-modal')) {
      $(this).removeClass('bjt-modal-show');
    }
  });
  
  // 离开页面前确认
  $(window).on('beforeunload', function() {
    if (formChanged && !formSubmitting) {
      return '您有未保存的更改，确定要离开吗？';
    }
  });
  
  // Toast关闭按钮
  $('.bjt-toast-close').on('click', function() {
    $(this).closest('.bjt-toast').removeClass('bjt-toast-show');
  });
});

// 初始化表单
function initForm() {
  updateStatusText();
}

// 加载产品线数据
function loadProductLineData(id) {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'product-lines/' + id,
    method: 'GET',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      // 禁用表单
      disableForm(true);
    },
    success: function(response) {
      // 填充表单数据
      fillFormData(response.data);
      
      // 保存原始数据用于比较变化
      originalData = {...response.data};
      formChanged = false;
    },
    error: function(error) {
      console.error('加载产品线数据失败', error);
      showToast('error', '加载数据失败', error.responseJSON?.message || '请检查网络连接');
      setTimeout(function() {
        navigateToList();
      }, 2000);
    },
    complete: function() {
      // 启用表单
      disableForm(false);
    }
  });
}

// 填充表单数据
function fillFormData(data) {
  const $ = jQuery;
  
  // 填充隐藏字段
  $('#product_line_id').val(data.id || 0);
  
  // 填充基本信息
  $('#title_zh').val(data.title_zh || '');
  $('#title_en').val(data.title_en || '');
  $('#sort_order').val(data.sort_order || 0);
  $('#status').prop('checked', data.status === 'publish');
  updateStatusText();
  
  // 填充详细信息
  $('#description_zh').val(data.description_zh || '');
  $('#description_en').val(data.description_en || '');
  $('#consumables_zh').val(data.consumables_zh || '');
  $('#consumables_en').val(data.consumables_en || '');
  $('#parts_zh').val(data.parts_zh || '');
  $('#parts_en').val(data.parts_en || '');
  
  // 填充图片
  if (data.image) {
    $('#image').val(data.image);
    $('#image-preview img').attr('src', data.image).show();
    $('.bjt-no-image').hide();
    $('#remove-image').show();
  } else {
    removeImage();
  }
}

// 切换语言
function switchLanguage(lang) {
  const $ = jQuery;
  
  // 更新标签激活状态
  $('.bjt-language-tabs .bjt-tab-item').removeClass('active');
  $(`.bjt-language-tabs .bjt-tab-item[data-lang="${lang}"]`).addClass('active');
  
  // 切换表单字段显示
  $('[data-lang]').hide();
  $(`[data-lang="${lang}"]`).show();
}

// 更新状态文本
function updateStatusText() {
  const $ = jQuery;
  const status = $('#status').prop('checked');
  $('#status-text').text(status ? '已上架' : '未上架');
}

// 移除图片
function removeImage() {
  const $ = jQuery;
  
  $('#image').val('');
  $('#image-preview img').hide().attr('src', '');
  $('.bjt-no-image').show();
  $('#remove-image').hide();
  formChanged = true;
}

// 获取表单数据
function getFormData() {
  const $ = jQuery;
  
  // 构建基本数据对象
  const formData = {
    id: $('#product_line_id').val() || 0,
    title_zh: $('#title_zh').val(),
    title_en: $('#title_en').val(),
    description_zh: $('#description_zh').val(),
    description_en: $('#description_en').val(),
    consumables_zh: $('#consumables_zh').val(),
    consumables_en: $('#consumables_en').val(),
    parts_zh: $('#parts_zh').val(),
    parts_en: $('#parts_en').val(),
    image: $('#image').val(),
    sort_order: $('#sort_order').val(),
    status: $('#status').prop('checked') ? 'publish' : 'draft'
  };
  
  return formData;
}

// 表单提交
function submitForm() {
  const $ = jQuery;
  const formData = getFormData();
  const isEdit = $('#action_type').val() === 'edit';
  
  // 验证表单
  if (!validateForm(formData)) {
    return;
  }
  
  // 设置表单提交标志
  formSubmitting = true;
  
  // 提交表单
  $.ajax({
    url: bjt_admin.api_url + 'product-lines' + (isEdit ? '/' + formData.id : ''),
    method: isEdit ? 'PUT' : 'POST',
    data: JSON.stringify(formData),
    contentType: 'application/json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      
      // 禁用提交按钮和表单
      $('#submit-btn').prop('disabled', true).text('保存中...');
      disableForm(true);
    },
    success: function(response) {
      // 显示成功消息
      showToast('success', '保存成功', '产品线信息已保存');
      
      // 更新表单状态
      formChanged = false;
      
      // 如果是新增操作，重定向到编辑页面
      if (!isEdit) {
        setTimeout(function() {
          window.location.href = `${bjt_admin.admin_url}admin.php?page=bjt-product-lines&action=edit&id=${response.data.id}`;
        }, 1000);
      } else {
        // 更新原始数据
        originalData = {...formData};
        
        // 启用表单
        disableForm(false);
        $('#submit-btn').prop('disabled', false).text('保存');
      }
    },
    error: function(error) {
      console.error('保存产品线数据失败', error);
      showToast('error', '保存失败', error.responseJSON?.message || '请稍后重试');
      
      // 启用表单
      disableForm(false);
      $('#submit-btn').prop('disabled', false).text('保存');
    },
    complete: function() {
      // 重置表单提交标志
      formSubmitting = false;
    }
  });
}

// 验证表单
function validateForm(formData) {
  const $ = jQuery;
  
  // 验证中文标题
  if (!formData.title_zh || formData.title_zh.trim() === '') {
    showToast('error', '验证失败', '请输入产品线中文名称');
    $('#title_zh').focus();
    switchLanguage('zh');
    return false;
  }
  
  // 验证英文标题
  if (!formData.title_en || formData.title_en.trim() === '') {
    showToast('error', '验证失败', '请输入产品线英文名称');
    $('#title_en').focus();
    switchLanguage('en');
    return false;
  }
  
  return true;
}

// 禁用/启用表单
function disableForm(disabled) {
  const $ = jQuery;
  
  // 禁用/启用所有输入元素
  $('#bjt-product-line-form :input:not([type=hidden])').prop('disabled', disabled);
  
  // 如果禁用，添加加载中类
  if (disabled) {
    $('#bjt-product-line-form').addClass('bjt-form-loading');
  } else {
    $('#bjt-product-line-form').removeClass('bjt-form-loading');
  }
}

// 导航到列表页
function navigateToList() {
  window.location.href = bjt_admin.admin_url + 'admin.php?page=bjt-product-lines';
}

// 加载媒体库
function loadMediaLibrary() {
  const $ = jQuery;
  
  $.ajax({
    url: bjt_admin.api_url + 'media',
    method: 'GET',
    data: {
      per_page: 50,
      media_type: 'image'
    },
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      $('#media-grid').html('<div class="bjt-loading-spinner"></div>');
    },
    success: function(response) {
      updateMediaGrid(response);
    },
    error: function(error) {
      console.error('加载媒体库失败', error);
      $('#media-grid').html('<div class="bjt-empty-state">加载媒体库失败</div>');
    }
  });
}

// 更新媒体网格
function updateMediaGrid(data) {
  const $ = jQuery;
  const grid = $('#media-grid');
  grid.empty();
  
  // 检查是否有数据
  if (!data || data.length === 0) {
    grid.html('<div class="bjt-empty-state">暂无媒体文件</div>');
    return;
  }
  
  // 添加媒体项目
  data.forEach(function(item) {
    const isSelected = selectedMedia && selectedMedia.id === item.id;
    const mediaItem = `
      <div class="bjt-media-item ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-url="${item.source_url}">
        <div class="bjt-media-thumbnail">
          <img src="${item.source_url}" alt="${item.title?.rendered || ''}">
        </div>
        <div class="bjt-media-info">
          <div class="bjt-media-title">${item.title?.rendered || 'Untitled'}</div>
          <div class="bjt-media-date">${formatDate(item.date)}</div>
        </div>
      </div>
    `;
    grid.append(mediaItem);
  });
}

// 上传媒体文件
function uploadMediaFile(file) {
  const $ = jQuery;
  const formData = new FormData();
  formData.append('file', file);
  
  $.ajax({
    url: bjt_admin.api_url + 'media',
    method: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
      $('#media-grid').html('<div class="bjt-loading-spinner"></div>');
    },
    success: function(response) {
      // 上传成功后重新加载媒体库
      loadMediaLibrary();
      
      // 自动选择上传的文件
      selectedMedia = {
        id: response.id,
        url: response.source_url
      };
    },
    error: function(error) {
      console.error('上传文件失败', error);
      showToast('error', '上传失败', error.responseJSON?.message || '请稍后重试');
      loadMediaLibrary();
    }
  });
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