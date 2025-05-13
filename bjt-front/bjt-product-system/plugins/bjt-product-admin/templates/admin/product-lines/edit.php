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

<div class="wrap bjt-product-line-edit">
    <h1 class="wp-heading-inline">
        <?php echo $line_id > 0 
            ? esc_html($is_zh ? '编辑产品线' : 'Edit Product Line')
            : esc_html($is_zh ? '新增产品线' : 'Add Product Line'); 
        ?>
    </h1>
    
    <form id="bjt-product-line-form" method="post">
        <input type="hidden" name="action" value="bjt_save_product_line">
        <input type="hidden" name="nonce" value="<?php echo esc_attr($nonce); ?>">
        <?php if ($line_id > 0): ?>
        <input type="hidden" name="id" value="<?php echo esc_attr($line_id); ?>">
        <?php endif; ?>
        
        <div class="bjt-form-section">
            <div class="bjt-language-tabs">
                <button type="button" class="bjt-tab active" data-lang="en">English</button>
                <button type="button" class="bjt-tab" data-lang="zh">中文</button>
            </div>
            
            <!-- 英文内容 -->
            <div class="bjt-language-content active" data-lang="en">
                <div class="bjt-form-row">
                    <label for="title_en">Title (English)</label>
                    <input type="text" id="title_en" name="title_en" class="regular-text" 
                           value="<?php echo esc_attr($product_line ? $product_line->title_en : ''); ?>" required>
                </div>
                
                <div class="bjt-form-row">
                    <label for="description_en">Description (English)</label>
                    <textarea id="description_en" name="description_en" class="large-text" rows="5"><?php 
                        echo esc_textarea($product_line ? $product_line->description_en : ''); 
                    ?></textarea>
                </div>
                
                <div class="bjt-form-row">
                    <label for="consumables_en">Consumables (English)</label>
                    <textarea id="consumables_en" name="consumables_en" class="large-text" rows="3"><?php 
                        echo esc_textarea($product_line ? $product_line->consumables_en : ''); 
                    ?></textarea>
                </div>
                
                <div class="bjt-form-row">
                    <label for="parts_en">Parts (English)</label>
                    <textarea id="parts_en" name="parts_en" class="large-text" rows="3"><?php 
                        echo esc_textarea($product_line ? $product_line->parts_en : ''); 
                    ?></textarea>
                </div>
            </div>
            
            <!-- 中文内容 -->
            <div class="bjt-language-content" data-lang="zh">
                <div class="bjt-form-row">
                    <label for="title_zh">标题（中文）</label>
                    <input type="text" id="title_zh" name="title_zh" class="regular-text" 
                           value="<?php echo esc_attr($product_line ? $product_line->title_zh : ''); ?>" required>
                </div>
                
                <div class="bjt-form-row">
                    <label for="description_zh">描述（中文）</label>
                    <textarea id="description_zh" name="description_zh" class="large-text" rows="5"><?php 
                        echo esc_textarea($product_line ? $product_line->description_zh : ''); 
                    ?></textarea>
                </div>
                
                <div class="bjt-form-row">
                    <label for="consumables_zh">耗材（中文）</label>
                    <textarea id="consumables_zh" name="consumables_zh" class="large-text" rows="3"><?php 
                        echo esc_textarea($product_line ? $product_line->consumables_zh : ''); 
                    ?></textarea>
                </div>
                
                <div class="bjt-form-row">
                    <label for="parts_zh">备件（中文）</label>
                    <textarea id="parts_zh" name="parts_zh" class="large-text" rows="3"><?php 
                        echo esc_textarea($product_line ? $product_line->parts_zh : ''); 
                    ?></textarea>
                </div>
            </div>
        </div>
        
        <div class="bjt-form-section">
            <div class="bjt-form-row">
                <label for="image">
                    <?php echo esc_html($is_zh ? '产品线图片' : 'Product Line Image'); ?>
                </label>
                <div class="bjt-image-upload">
                    <div class="bjt-image-preview">
                        <?php if ($product_line && $product_line->image_url): ?>
                            <img src="<?php echo esc_url($product_line->image_url); ?>" alt="Product Line Image">
                        <?php endif; ?>
                    </div>
                    <input type="hidden" name="image_url" id="image_url" 
                           value="<?php echo esc_attr($product_line ? $product_line->image_url : ''); ?>">
                    <button type="button" class="button bjt-upload-button">
                        <?php echo esc_html($is_zh ? '选择图片' : 'Choose Image'); ?>
                    </button>
                    <button type="button" class="button bjt-remove-button" <?php echo !$product_line || !$product_line->image_url ? 'style="display:none;"' : ''; ?>>
                        <?php echo esc_html($is_zh ? '移除图片' : 'Remove Image'); ?>
                    </button>
                </div>
            </div>
            
            <div class="bjt-form-row">
                <label for="status">
                    <?php echo esc_html($is_zh ? '状态' : 'Status'); ?>
                </label>
                <select id="status" name="status" class="regular-text">
                    <option value="draft" <?php selected($product_line ? $product_line->status : 'draft', 'draft'); ?>>
                        <?php echo esc_html($is_zh ? '草稿' : 'Draft'); ?>
                    </option>
                    <option value="publish" <?php selected($product_line ? $product_line->status : '', 'publish'); ?>>
                        <?php echo esc_html($is_zh ? '已发布' : 'Published'); ?>
                    </option>
                </select>
            </div>
            
            <div class="bjt-form-row">
                <label for="sort_order">
                    <?php echo esc_html($is_zh ? '排序' : 'Sort Order'); ?>
                </label>
                <input type="number" id="sort_order" name="sort_order" class="small-text" 
                       value="<?php echo esc_attr($product_line ? $product_line->sort_order : '0'); ?>">
            </div>
        </div>
        
        <div class="bjt-form-actions">
            <button type="submit" class="button button-primary">
                <?php echo esc_html($is_zh ? '保存' : 'Save'); ?>
            </button>
            <a href="?page=bjt-product-lines" class="button">
                <?php echo esc_html($is_zh ? '取消' : 'Cancel'); ?>
            </a>
        </div>
    </form>
</div>

<style>
.bjt-product-line-edit {
    max-width: 1200px;
    margin: 20px auto;
}

.bjt-form-section {
    background: #fff;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bjt-language-tabs {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
}

.bjt-tab {
    padding: 10px 20px;
    border: none;
    background: none;
    cursor: pointer;
    margin-right: 10px;
    color: #646970;
}

.bjt-tab.active {
    border-bottom: 2px solid #2271b1;
    color: #1d2327;
}

.bjt-language-content {
    display: none;
}

.bjt-language-content.active {
    display: block;
}

.bjt-form-row {
    margin-bottom: 20px;
}

.bjt-form-row label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}

.bjt-image-upload {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.bjt-image-preview {
    width: 150px;
    height: 150px;
    border: 1px dashed #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.bjt-image-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.bjt-form-actions {
    margin-top: 20px;
    padding: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.bjt-form-actions .button {
    margin-right: 10px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // 语言切换
    $('.bjt-tab').on('click', function() {
        const lang = $(this).data('lang');
        $('.bjt-tab').removeClass('active');
        $(this).addClass('active');
        $('.bjt-language-content').removeClass('active');
        $(`.bjt-language-content[data-lang="${lang}"]`).addClass('active');
    });
    
    // 图片上传
    let mediaUploader;
    $('.bjt-upload-button').on('click', function(e) {
        e.preventDefault();
        
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }
        
        mediaUploader = wp.media({
            title: '<?php echo esc_js($is_zh ? '选择产品线图片' : 'Choose Product Line Image'); ?>',
            button: {
                text: '<?php echo esc_js($is_zh ? '选择' : 'Select'); ?>'
            },
            multiple: false
        });
        
        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#image_url').val(attachment.url);
            $('.bjt-image-preview').html(`<img src="${attachment.url}" alt="Product Line Image">`);
            $('.bjt-remove-button').show();
        });
        
        mediaUploader.open();
    });
    
    // 移除图片
    $('.bjt-remove-button').on('click', function() {
        $('#image_url').val('');
        $('.bjt-image-preview').empty();
        $(this).hide();
    });
    
    // 表单提交
    $('#bjt-product-line-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const submitButton = form.find('button[type="submit"]');
        submitButton.prop('disabled', true);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: form.serialize(),
            success: function(response) {
                if (response.success) {
                    window.location.href = '?page=bjt-product-lines&message=saved';
                } else {
                    alert(response.data.message || '<?php echo esc_js($is_zh ? '保存失败' : 'Save failed'); ?>');
                    submitButton.prop('disabled', false);
                }
            },
            error: function() {
                alert('<?php echo esc_js($is_zh ? '保存失败' : 'Save failed'); ?>');
                submitButton.prop('disabled', false);
            }
        });
    });
});
</script> 