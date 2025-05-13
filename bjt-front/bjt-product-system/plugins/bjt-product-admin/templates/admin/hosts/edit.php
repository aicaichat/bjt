<?php
if (!defined('ABSPATH')) {
    exit;
}

// 将脚本和媒体加载移到页面头部，确保媒体上传功能可用
wp_enqueue_media();
wp_enqueue_script('jquery');
wp_enqueue_script('wp-util');
wp_enqueue_style('dashicons');

$host_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$host = null;
$title_zh = '';
$title_en = '';
$description_zh = '';
$description_en = '';
$image_id = '';
$image_url = '';

// 仅在编辑模式下获取数据
if ($host_id > 0) {
    $host = get_post($host_id);
    if ($host) {
        $title_zh = get_post_meta($host_id, 'title_zh', true);
        $title_en = get_post_meta($host_id, 'title_en', true);
        $description_zh = get_post_meta($host_id, 'description_zh', true);
        $description_en = get_post_meta($host_id, 'description_en', true);
        $image_id = get_post_meta($host_id, 'image_id', true);
        if (!empty($image_id)) {
            $image_url = wp_get_attachment_url($image_id);
        }
    }
}
$message = isset($_GET['message']) ? $_GET['message'] : '';

// 定义支持的语言列表
$languages = [
    'zh' => ['name' => '中文', 'flag' => '🇨🇳', 'placeholder_prefix' => '请输入'],
    'en' => ['name' => 'English', 'flag' => '🇬🇧', 'placeholder_prefix' => 'Enter']
];

// 获取不同语言的元数据
$titles = [];
$descriptions = [];
foreach ($languages as $lang_code => $lang_info) {
    $titles[$lang_code] = $lang_code === 'zh' ? $title_zh : ($lang_code === 'en' ? $title_en : get_post_meta($host_id, 'title_' . $lang_code, true));
    $descriptions[$lang_code] = $lang_code === 'zh' ? $description_zh : ($lang_code === 'en' ? $description_en : get_post_meta($host_id, 'description_' . $lang_code, true));
}
?>

<div class="wrap bjt-product-admin-wrap">
    <h2><?php echo $host_id ? __('编辑主机', 'bjt-product-admin') : __('新增主机', 'bjt-product-admin'); ?></h2>
    
    <div class="form-container">
        <form id="hostForm" method="post" action="">
            <?php wp_nonce_field('save_host', 'host_nonce'); ?>
            <input type="hidden" name="action" value="bjt_save_host">
            <input type="hidden" name="host_id" value="<?php echo $host_id; ?>">
            <input type="hidden" name="security" value="<?php echo wp_create_nonce('bjt_save_host'); ?>">
            
            <!-- 基本信息 - 型号 (所有语言通用) -->
            <h3 style="margin-bottom: 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">基本信息</h3>
            
            <div class="form-group">
                <label class="form-label">
                    <span class="label-text">型号 / Model</span>
                    <span class="required-mark">*</span>
                </label>
                <input type="text" class="form-control" id="model" name="model" value="<?php echo $host ? esc_attr($host->post_title) : ''; ?>" placeholder="请输入产品型号 / Enter model number">
                <span class="form-error" id="model-error">型号不能为空 / Model cannot be empty</span>
            </div>
            
            <!-- 多语言标签页 -->
            <div class="language-tabs-container">
                <div class="language-tabs">
                    <?php foreach ($languages as $lang_code => $lang_info): ?>
                        <div class="language-tab <?php echo $lang_code === 'zh' ? 'active' : ''; ?>" data-lang="<?php echo $lang_code; ?>">
                            <span class="lang-flag"><?php echo $lang_info['flag']; ?></span>
                            <span class="lang-name"><?php echo $lang_info['name']; ?></span>
                        </div>
                    <?php endforeach; ?>
                    <button type="button" class="language-tab translate-all-btn" id="translateAllBtn" style="margin-left: auto;">
                        <span class="dashicons dashicons-translation"></span>
                        <span class="lang-name">批量翻译</span>
                    </button>
                </div>
                
                <!-- 语言内容部分 -->
                <?php foreach ($languages as $lang_code => $lang_info): ?>
                    <div class="language-content <?php echo $lang_code === 'zh' ? 'active' : ''; ?>" data-lang="<?php echo $lang_code; ?>" id="language-<?php echo $lang_code; ?>">
                        <div class="form-row">
                            <div class="form-field">
                                <label for="name_<?php echo $lang_code; ?>"><?php _e('名称', 'bjt-product-admin'); ?> (<?php echo $lang_info['name']; ?>)</label>
                                <input type="text" id="name_<?php echo $lang_code; ?>" name="name_<?php echo $lang_code; ?>" value="<?php echo isset($titles[$lang_code]) ? esc_attr($titles[$lang_code]) : ''; ?>" placeholder="<?php echo $lang_info['placeholder_prefix']; ?><?php _e('输入名称', 'bjt-product-admin'); ?>">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-field">
                                <label for="description_<?php echo $lang_code; ?>"><?php _e('描述', 'bjt-product-admin'); ?> (<?php echo $lang_info['name']; ?>)</label>
                                <textarea id="description_<?php echo $lang_code; ?>" name="description_<?php echo $lang_code; ?>" rows="4" placeholder="<?php echo $lang_info['placeholder_prefix']; ?><?php _e('输入描述', 'bjt-product-admin'); ?>"><?php echo isset($descriptions[$lang_code]) ? esc_textarea($descriptions[$lang_code]) : ''; ?></textarea>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- 产品图片 -->
            <h3 style="margin: 30px 0 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">产品图片</h3>
            
            <div class="bilingual-row">
                <!-- 图片1 -->
                <div class="form-group bilingual-field">
                    <label class="form-label">
                        <span class="label-text">图片1 / Image 1</span>
                        <span class="required-mark">*</span>
                    </label>
                    <div class="image-upload-container" id="image1DropArea">
                        <p>将图片拖放至此处，或</p>
                        <input type="file" id="image1Input" name="image1" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary image-upload-btn" id="image1SelectBtn">选择</button>
                        <div class="progress-container" id="image1UploadProgress">
                            <div class="progress-bar" id="image1UploadProgressBar"></div>
                        </div>
                    </div>
                    <div class="image-preview-container" id="image1PreviewContainer">
                        <?php if ($image_url): ?>
                        <div class="image-preview-item">
                            <img src="<?php echo esc_url($image_url); ?>" alt="图片1">
                            <div class="image-preview-actions">
                                <button type="button" class="image-action-btn" title="删除">✖</button>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- 图片2 -->
                <div class="form-group bilingual-field">
                    <label class="form-label">
                        <span class="label-text">图片2 / Image 2</span>
                    </label>
                    <div class="image-upload-container" id="image2DropArea">
                        <p>将图片拖放至此处，或</p>
                        <input type="file" id="image2Input" name="image2" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary image-upload-btn" id="image2SelectBtn">选择</button>
                        <div class="progress-container" id="image2UploadProgress">
                            <div class="progress-bar" id="image2UploadProgressBar"></div>
                        </div>
                    </div>
                    <div class="image-preview-container" id="image2PreviewContainer">
                        <?php if ($image_url): ?>
                        <div class="image-preview-item">
                            <img src="<?php echo esc_url($image_url); ?>" alt="图片2">
                            <div class="image-preview-actions">
                                <button type="button" class="image-action-btn" title="删除">✖</button>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <!-- 表单底部区域 -->
            <div class="form-footer">
                <button type="button" class="button button-primary save-host-btn">保存主机</button>
                <div class="save-status"></div>
            </div>
        </form>
    </div>
</div>

<!-- Label Edit Modal -->
<div class="label-edit-modal" id="labelEditModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000;">
    <div class="label-edit-content">
        <div class="label-edit-header">
            <h3>编辑字段名称</h3>
            <button class="label-edit-close">&times;</button>
        </div>
        <form class="label-edit-form">
            <div>
                <label>字段名称</label>
                <input type="text" class="label-edit-input" id="editLabel">
            </div>
            <div class="label-edit-actions">
                <button type="button" class="btn btn-secondary" id="cancelEdit">取消</button>
                <button type="submit" class="btn btn-primary" id="saveEdit">保存</button>
            </div>
        </form>
    </div>
</div>

<!-- Toast notification -->
<div class="toast" id="toast" style="display: none; position: fixed; bottom: 20px; right: 20px; background-color: #333; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000;">
    <span id="toastMessage">操作成功</span>
</div>

<style>
/* 优化的WordPress管理界面样式 */
.bjt-product-admin-wrap {
    margin: 20px 20px 0 180px;
    position: relative;
    max-width: 1200px;
}

/* 重新设计表单容器 */
.form-container {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    padding: 40px;
    box-sizing: border-box;
}

/* 折叠菜单状态适配 */
.folded .bjt-product-admin-wrap {
    margin-left: 60px;
}

@media screen and (max-width: 960px) {
    .auto-fold .bjt-product-admin-wrap {
        margin-left: 60px;
    }
}

@media screen and (max-width: 782px) {
    .bjt-product-admin-wrap, 
    .folded .bjt-product-admin-wrap,
    .auto-fold .bjt-product-admin-wrap {
        margin-left: 0;
        padding: 20px;
    }
    
    .form-container {
        padding: 20px;
    }
}

/* 页面标题样式优化 */
.wrap h2 {
    margin: 0 0 30px 0;
    font-size: 24px;
    color: #23282d;
    font-weight: 600;
}

/* 表单分组样式优化 */
.form-group {
    margin-bottom: 30px;
    position: relative;
}

/* 表单标签样式优化 */
.form-label {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-weight: 600;
    color: #23282d;
    font-size: 14px;
}

.required-mark {
    color: #dc3545;
    margin-left: 5px;
}

/* 输入框样式优化 */
.form-control {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s ease;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.07);
}

.form-control:focus {
    outline: none;
    border-color: #2271b1;
    box-shadow: 0 0 0 1px #2271b1;
}

.form-error {
    display: none;
    margin-top: 8px;
    font-size: 13px;
    color: #dc3545;
}

/* 优化表单字段样式 */
.form-field {
    margin-bottom: 20px;
}

.form-field label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #23282d;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field select,
.form-field textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 4px;
    border: 1px solid #ddd;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.07);
    transition: all 0.2s ease;
}

.form-field input[type="text"]:focus,
.form-field input[type="number"]:focus,
.form-field select:focus,
.form-field textarea:focus {
    border-color: #2271b1;
    box-shadow: 0 0 0 1px #2271b1;
    outline: none;
}

/* 优化多语言标签页样式 */
.language-tabs-container {
    border: 1px solid #e5e5e5;
    border-radius: 5px;
    margin-bottom: 30px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.language-tabs {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 0;
    border-bottom: 1px solid #e5e5e5;
    background-color: #f9f9f9;
}

.language-tab {
    padding: 12px 18px;
    cursor: pointer;
    background: #f5f5f5;
    margin-right: 5px;
    border: 1px solid #e5e5e5;
    border-bottom: none;
    border-radius: 5px 5px 0 0;
    margin-bottom: -1px;
    transition: all 0.2s ease;
}

.language-tab:hover {
    background-color: #fff;
}

.language-tab.active {
    background: #fff;
    border-bottom: 1px solid #fff;
    font-weight: 600;
}

.lang-flag {
    margin-right: 8px;
    font-size: 16px;
}

.lang-name {
    font-size: 14px;
}

.language-content {
    display: none;
    padding: 25px;
    border: 1px solid #e5e5e5;
    border-top: none;
    margin-bottom: 0;
    background-color: #fff;
}

.language-content.active {
    display: block;
}

/* 优化图片上传样式 */
.bilingual-row {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
}

.bilingual-field {
    flex: 1;
    margin-bottom: 0;
    position: relative;
}

.image-upload-container {
    text-align: center;
    border: 2px dashed #c3c4c7;
    border-radius: 6px;
    padding: 30px 20px;
    margin-bottom: 15px;
    transition: all 0.2s ease;
    background-color: #f9f9f9;
}

.image-upload-container:hover {
    border-color: #2271b1;
    background-color: rgba(0, 115, 170, 0.03);
}

.image-upload-container.drag-over {
    border-color: #2271b1;
    background-color: rgba(0, 115, 170, 0.05);
}

.image-upload-btn {
    padding: 8px 14px;
    background-color: #f6f7f7;
    border: 1px solid #c3c4c7;
    border-radius: 3px;
    font-size: 14px;
    color: #2c3338;
    cursor: pointer;
    transition: all 0.2s ease;
}

.image-upload-btn:hover {
    background-color: #f0f0f1;
    border-color: #8c8f94;
}

.image-preview-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 15px;
}

.image-preview-item {
    position: relative;
    width: 120px;
    height: 120px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-preview-actions {
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    gap: 5px;
}

.image-action-btn {
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.image-action-btn:hover {
    background-color: rgba(0, 0, 0, 0.8);
}

/* 优化表单底部样式 */
.form-footer {
    margin-top: 40px;
    padding-top: 25px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    gap: 15px;
}

.save-host-btn {
    background-color: #2271b1 !important;
    border-color: #2271b1 !important;
    color: #fff !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
}

.save-host-btn:hover {
    background-color: #135e96 !important;
    border-color: #135e96 !important;
}

.translate-all-btn {
    background-color: #f6f7f7 !important;
    border-color: #c3c4c7 !important;
    color: #2c3338 !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
}

.translate-all-btn:hover {
    background-color: #f0f0f1 !important;
    border-color: #8c8f94 !important;
}

.save-status {
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
    margin-left: auto;
    font-weight: 500;
}

.save-status.success {
    background-color: #f0f6e5;
    color: #2a823a;
    border: 1px solid #c6e1c6;
}

.save-status.error {
    background-color: #fcf0f1;
    color: #b32d2e;
    border: 1px solid #f1c9c7;
}

/* 优化响应式样式 */
@media (max-width: 768px) {
    .bilingual-row {
        flex-direction: column;
        gap: 25px;
    }
    
    .bilingual-field {
        width: 100%;
    }
    
    .form-footer {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .save-status {
        margin-left: 0;
        margin-top: 15px;
        width: 100%;
    }
}

/* 自定义模态框样式 */
.label-edit-modal {
    background-color: rgba(0, 0, 0, 0.6);
}

.label-edit-content {
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}

.label-edit-header {
    border-bottom: 1px solid #e5e5e5;
    padding: 15px 20px;
}

.label-edit-header h3 {
    font-size: 18px;
    margin: 0;
}

/* 批量翻译按钮样式 */
.language-tabs .translate-all-btn {
    background-color: #f0f6fb;
    border-color: #d1e4f4;
    display: flex;
    align-items: center;
    padding: 10px 15px;
}

.language-tabs .translate-all-btn:hover {
    background-color: #e0f0ff;
    border-color: #c0ddff;
}

.language-tabs .translate-all-btn .dashicons {
    font-size: 16px;
    margin-right: 5px;
}

/* 其他必要的原始样式保留 */
</style>

<script type="text/javascript">
jQuery(document).ready(function($) {
    // 保存当前选中的语言
    let currentLanguage = 'zh';
    
    // 调试显示所有语言内容区域
    console.log('页面加载时，语言内容区域数量:', $('.language-content').length);
    $('.language-content').each(function() {
        console.log('语言内容区域:', $(this).attr('id'), '可见性:', $(this).is(':visible'), '激活状态:', $(this).hasClass('active'));
    });
    
    // 强制显示初始语言内容 - 确保初始加载时内容可见
    $('.language-content[data-lang="zh"]').css('display', 'block').addClass('active');
    
    // 语言标签页切换
    $('.language-tab').on('click', function() {
        const language = $(this).data('lang');
        console.log('点击切换语言到:', language);
        
        // 更新标签页状态
        $('.language-tab').removeClass('active');
        $(this).addClass('active');
        
        // 隐藏所有内容区域 - 使用CSS直接控制
        $('.language-content').css('display', 'none').removeClass('active');
        
        // 显示选中语言的内容区域 - 使用CSS直接控制
        $('.language-content[data-lang="' + language + '"]').css('display', 'block').addClass('active');
        
        // 更新当前语言
        currentLanguage = language;
        
        // 调试信息
        console.log('切换后，语言内容区域数量:', $('.language-content').length);
        $('.language-content').each(function() {
            console.log('语言内容区域:', $(this).attr('id'), '可见性:', $(this).is(':visible'), '激活状态:', $(this).hasClass('active'));
        });
    });
    
    // 图片上传功能 - 选择按钮点击事件
    $('#image1SelectBtn, #image2SelectBtn').on('click', function() {
        const imageId = $(this).attr('id').replace('SelectBtn', '');
        
        // 创建媒体上传框架
        var frame = wp.media({
            title: '选择或上传图片',
            button: {
                text: '使用此图片'
            },
            multiple: false
        });
        
        // 当选择媒体时触发
        frame.on('select', function() {
            // 获取选择的附件
            var attachment = frame.state().get('selection').first().toJSON();
            
            // 更新预览
            const previewHtml = `
                <div class="image-preview-item">
                    <img src="${attachment.url}" alt="${attachment.title}">
                    <div class="image-preview-actions">
                        <button type="button" class="image-action-btn" title="删除">✖</button>
                    </div>
                </div>
            `;
            
            // 清空现有预览并添加新预览
            $('#' + imageId + 'PreviewContainer').html(previewHtml);
            
            // 添加隐藏字段存储图片URL
            if ($('#' + imageId + '_url').length) {
                $('#' + imageId + '_url').val(attachment.url);
            } else {
                $('<input>').attr({
                    type: 'hidden',
                    id: imageId + '_url',
                    name: imageId + '_url',
                    value: attachment.url
                }).appendTo('#hostForm');
            }
            
            updateSaveStatus('图片选择成功', 'success');
            setTimeout(function() {
                updateSaveStatus('', '');
            }, 3000);
        });
        
        // 打开媒体上传框架
        frame.open();
    });
    
    // 删除图片预览
    $(document).on('click', '.image-preview-container .image-action-btn', function() {
        const previewContainer = $(this).closest('.image-preview-container');
        const imageId = previewContainer.attr('id').replace('PreviewContainer', '');
        
        // 清空对应的URL
        if ($('#' + imageId + '_url').length) {
            $('#' + imageId + '_url').val('');
        }
        
        // 移除预览图
        $(this).closest('.image-preview-item').remove();
    });
    
    // 处理表单提交
    $('#hostForm').on('submit', function(e) {
        e.preventDefault();
        saveHost();
    });
    
    // 保存按钮点击事件
    $('.save-host-btn').on('click', function(e) {
        e.preventDefault();
        saveHost();
    });
    
    // 保存主机数据函数
    function saveHost() {
        // 显示保存中状态
        updateSaveStatus('保存中...', '');
        
        // 基本验证
        const model = $('#model').val().trim();
        if (!model) {
            $('#model').addClass('error');
            $('#model-error').show();
            updateSaveStatus('保存失败: 型号不能为空', 'error');
            return;
        }
        
        // 收集表单数据
        const formData = new FormData($('#hostForm')[0]);
        
        // 调试信息
        console.log('正在提交以下数据:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        // 发送Ajax请求
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('服务器响应:', response);
                if (response.success) {
                    updateSaveStatus('保存成功!', 'success');
                    
                    // 如果是新建主机，重定向到编辑页面
                    if (!$('input[name="host_id"]').val() && response.data && response.data.host_id) {
                        setTimeout(function() {
                            window.location.href = '<?php echo admin_url('admin.php?page=bjt-host-management&action=edit&id='); ?>' + response.data.host_id;
                        }, 1000);
                    }
                } else {
                    const errorMessage = response.data && response.data.message ? response.data.message : '未知错误';
                    console.error('保存失败:', errorMessage);
                    updateSaveStatus('保存失败: ' + errorMessage, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX错误:', status, error);
                console.error('响应文本:', xhr.responseText);
                updateSaveStatus('保存失败: ' + error, 'error');
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.data && response.data.message) {
                        updateSaveStatus('保存失败: ' + response.data.message, 'error');
                    }
                } catch (e) {
                    console.error('解析响应失败:', e);
                }
            }
        });
    }
    
    // 表单输入事件 - 清除错误
    $('#model').on('input', function() {
        $(this).removeClass('error');
        $('#model-error').hide();
    });
    
    // 批量翻译按钮点击事件
    $('#translateAllBtn').on('click', function(e) {
        e.preventDefault();
        
        // 获取源语言数据
        const sourceLanguage = 'zh'; // 假设中文为源语言
        const sourceName = $('input[id="name_' + sourceLanguage + '"]').val();
        const sourceDesc = $('textarea[id="description_' + sourceLanguage + '"]').val();
        
        if (!sourceName && !sourceDesc) {
            alert('请先填写中文名称或描述作为翻译源');
            return;
        }
        
        // 显示翻译中状态
        updateSaveStatus('翻译中...', '');
        
        // 准备翻译数据
        const translationData = {
            action: 'bjt_translate_host',
            source_language: sourceLanguage,
            target_languages: [], // 将在循环中填充
            source_name: sourceName,
            source_description: sourceDesc
        };
        
        // 添加目标语言
        <?php foreach ($languages as $lang_code => $lang_info): ?>
            <?php if ($lang_code !== 'zh'): ?>
            translationData.target_languages.push('<?php echo $lang_code; ?>');
            <?php endif; ?>
        <?php endforeach; ?>
        
        // 发送Ajax请求
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: translationData,
            success: function(response) {
                if (response.success) {
                    // 更新表单中的翻译结果
                    const translations = response.data.translations;
                    
                    for (const langCode in translations) {
                        if (translations[langCode].name) {
                            $('input[id="name_' + langCode + '"]').val(translations[langCode].name);
                        }
                        
                        if (translations[langCode].description) {
                            $('textarea[id="description_' + langCode + '"]').val(translations[langCode].description);
                        }
                    }
                    
                    updateSaveStatus('翻译完成!', 'success');
                } else {
                    updateSaveStatus('翻译失败: ' + (response.data && response.data.message ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function(xhr, status, error) {
                updateSaveStatus('翻译失败: ' + error, 'error');
            }
        });
    });
    
    // 更新保存状态函数
    function updateSaveStatus(message, status) {
        const $statusElement = $('.save-status');
        
        // 更新消息
        $statusElement.text(message);
        
        // 更新类
        $statusElement.removeClass('success error');
        if (status) {
            $statusElement.addClass(status);
        }
    }
    
    // 删除多余的旧翻译按钮点击处理
    $('.translate-all-btn').not('#translateAllBtn').remove();
});
</script>