<?php
/**
 * 新增主机型号页面
 * 
 * @package BJT_Product_Admin
 */

// 如果直接访问此文件，则退出
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="bjt-host-model-form">
  <div class="bjt-page-header">
    <div class="bjt-page-title-container">
      <h1 class="bjt-page-title">新增主机型号</h1>
      <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>" class="bjt-btn bjt-btn-secondary">
        <i class="bjt-icon bjt-icon-back"></i> 返回列表
      </a>
    </div>
  </div>
  
  <form id="host-model-form" class="bjt-form bjt-card">
    <div class="bjt-card-body">
      <div class="bjt-form-tabs">
        <div class="bjt-tab-nav">
          <button type="button" class="bjt-tab-btn active" data-tab="basic-info">基本信息</button>
          <button type="button" class="bjt-tab-btn" data-tab="description">型号说明</button>
          <button type="button" class="bjt-tab-btn" data-tab="images">型号图片</button>
        </div>
        
        <!-- 基本信息选项卡 -->
        <div class="bjt-tab-content active" id="basic-info">
          <h3 class="bjt-form-section-title">基本信息</h3>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field">
              <label for="product_line">产品线 <span class="required">*</span></label>
              <select id="product_line" name="product_line" class="bjt-select" required>
                <option value="">请选择产品线</option>
                <option value="air_cushion">气垫机</option>
                <option value="paper_machine">纸机</option>
                <option value="tape_machine">胶带机</option>
                <option value="air_column">气柱机</option>
              </select>
              <div class="bjt-field-hint">选择此主机型号所属的产品线</div>
            </div>
            
            <div class="bjt-form-field">
              <label for="model">型号编码 <span class="required">*</span></label>
              <input type="text" id="model" name="model" class="bjt-input" required>
              <div class="bjt-field-hint">输入唯一的型号编码，如 AM320</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field">
              <label for="title_cn">中文名称 <span class="required">*</span></label>
              <input type="text" id="title_cn" name="title_cn" class="bjt-input" required>
              <div class="bjt-field-hint">输入型号的中文名称</div>
            </div>
            
            <div class="bjt-form-field">
              <label for="title_en">英文名称 <span class="required">*</span></label>
              <input type="text" id="title_en" name="title_en" class="bjt-input" required>
              <div class="bjt-field-hint">输入型号的英文名称</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field">
              <label for="type">主机类型</label>
              <input type="text" id="type" name="type" class="bjt-input">
              <div class="bjt-field-hint">输入主机的类型分类</div>
            </div>
            
            <div class="bjt-form-field">
              <label for="menu_order">排序顺序</label>
              <input type="number" id="menu_order" name="menu_order" class="bjt-input" value="0" min="0">
              <div class="bjt-field-hint">数字越小排序越靠前，默认为0</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field bjt-form-field-full">
              <label for="status">状态</label>
              <div class="bjt-radio-group">
                <label class="bjt-radio">
                  <input type="radio" name="status" value="publish" checked>
                  <span class="bjt-radio-label">上架</span>
                </label>
                <label class="bjt-radio">
                  <input type="radio" name="status" value="draft">
                  <span class="bjt-radio-label">下架</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 型号说明选项卡 -->
        <div class="bjt-tab-content" id="description">
          <h3 class="bjt-form-section-title">型号说明</h3>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field bjt-form-field-full">
              <label for="description_cn">中文描述</label>
              <textarea id="description_cn" name="description_cn" class="bjt-textarea" rows="6"></textarea>
              <div class="bjt-field-hint">输入型号的详细中文描述，支持基本格式</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field bjt-form-field-full">
              <label for="description_en">英文描述</label>
              <textarea id="description_en" name="description_en" class="bjt-textarea" rows="6"></textarea>
              <div class="bjt-field-hint">输入型号的详细英文描述，支持基本格式</div>
            </div>
          </div>
        </div>
        
        <!-- 型号图片选项卡 -->
        <div class="bjt-tab-content" id="images">
          <h3 class="bjt-form-section-title">型号图片</h3>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field">
              <label for="image1_url">主图</label>
              <div class="bjt-image-upload">
                <div class="bjt-image-preview" id="image1-preview"></div>
                <input type="hidden" id="image1_url" name="image1_url">
                <button type="button" class="bjt-btn bjt-btn-secondary bjt-upload-btn" data-target="image1_url" data-preview="image1-preview">
                  选择图片
                </button>
              </div>
              <div class="bjt-field-hint">上传主机型号的主图片</div>
            </div>
            
            <div class="bjt-form-field">
              <label for="image2_url">副图</label>
              <div class="bjt-image-upload">
                <div class="bjt-image-preview" id="image2-preview"></div>
                <input type="hidden" id="image2_url" name="image2_url">
                <button type="button" class="bjt-btn bjt-btn-secondary bjt-upload-btn" data-target="image2_url" data-preview="image2-preview">
                  选择图片
                </button>
              </div>
              <div class="bjt-field-hint">上传主机型号的副图片</div>
            </div>
          </div>
          
          <div class="bjt-form-row">
            <div class="bjt-form-field bjt-form-field-full">
              <label for="explosion_diagram_pdf">爆炸图PDF</label>
              <div class="bjt-file-upload">
                <span class="bjt-file-name" id="pdf-file-name">未选择文件</span>
                <input type="hidden" id="explosion_diagram_pdf" name="explosion_diagram_pdf">
                <button type="button" class="bjt-btn bjt-btn-secondary bjt-upload-btn" data-target="explosion_diagram_pdf" data-preview="pdf-file-name" data-type="application/pdf">
                  选择PDF文件
                </button>
              </div>
              <div class="bjt-field-hint">上传主机型号的爆炸图PDF文件</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bjt-card-footer">
      <div class="bjt-form-actions">
        <button type="button" class="bjt-btn bjt-btn-secondary" id="cancel-form">
          取消
        </button>
        <button type="submit" class="bjt-btn bjt-btn-primary">
          保存
        </button>
      </div>
    </div>
  </form>
</div>

<script>
jQuery(document).ready(function($) {
  // 初始化表单
  initHostModelForm();
  
  // 初始化表单选项卡
  $('.bjt-tab-btn').on('click', function() {
    const tabId = $(this).data('tab');
    
    // 激活选项卡按钮
    $('.bjt-tab-btn').removeClass('active');
    $(this).addClass('active');
    
    // 显示对应内容
    $('.bjt-tab-content').removeClass('active');
    $('#' + tabId).addClass('active');
  });
  
  // 初始化图片上传
  $('.bjt-upload-btn').on('click', function() {
    const targetField = $(this).data('target');
    const previewField = $(this).data('preview');
    const fileType = $(this).data('type') || 'image';
    
    // 打开媒体上传器
    const mediaUploader = wp.media({
      title: '选择文件',
      button: {
        text: '使用此文件'
      },
      multiple: false,
      library: {
        type: fileType
      }
    });
    
    // 选择后的回调
    mediaUploader.on('select', function() {
      const attachment = mediaUploader.state().get('selection').first().toJSON();
      
      // 设置字段值
      $('#' + targetField).val(attachment.url);
      
      // 更新预览
      if (fileType === 'image') {
        $('#' + previewField).html(`<img src="${attachment.url}" alt="预览图">`);
      } else {
        $('#' + previewField).text(attachment.filename);
      }
    });
    
    // 打开上传窗口
    mediaUploader.open();
  });
  
  // 取消按钮
  $('#cancel-form').on('click', function() {
    if (confirm('确定要取消吗？未保存的更改将丢失。')) {
      window.location.href = '<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>';
    }
  });
  
  // 表单提交
  $('#host-model-form').on('submit', function(e) {
    e.preventDefault();
    submitHostModelForm();
  });
  
  // 初始化表单
  function initHostModelForm() {
    // 这里可以添加表单初始化逻辑，如果需要的话
  }
  
  // 提交表单
  function submitHostModelForm() {
    // 收集表单数据
    const formData = {
      product_line: $('#product_line').val(),
      model: $('#model').val(),
      title_cn: $('#title_cn').val(),
      title_en: $('#title_en').val(),
      type: $('#type').val(),
      description_cn: $('#description_cn').val(),
      description_en: $('#description_en').val(),
      image1_url: $('#image1_url').val(),
      image2_url: $('#image2_url').val(),
      explosion_diagram_pdf: $('#explosion_diagram_pdf').val(),
      status: $('input[name="status"]:checked').val(),
      menu_order: $('#menu_order').val()
    };
    
    // 发送 AJAX 请求
    $.ajax({
      url: bjt_admin.api_url + '/wp-json/bjt/v1/host-models',
      method: 'POST',
      data: JSON.stringify(formData),
      contentType: 'application/json',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-WP-Nonce', bjt_admin.nonce);
        // 显示加载状态
        $('#host-model-form').addClass('bjt-loading');
      },
      success: function(response) {
        showNotification('success', '主机型号添加成功');
        
        // 跳转到列表页
        setTimeout(function() {
          window.location.href = '<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>';
        }, 1000);
      },
      error: function(error) {
        console.error('添加主机型号失败', error);
        showNotification('error', '添加失败: ' + (error.responseJSON?.message || '未知错误'));
      },
      complete: function() {
        $('#host-model-form').removeClass('bjt-loading');
      }
    });
  }
  
  // 显示通知
  function showNotification(type, message) {
    // 检查是否存在通知容器，如果不存在则创建
    let notificationContainer = $('.bjt-notifications');
    if (notificationContainer.length === 0) {
      $('body').append('<div class="bjt-notifications"></div>');
      notificationContainer = $('.bjt-notifications');
    }
    
    // 创建通知元素
    const notification = $(`
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
});
</script> 
 