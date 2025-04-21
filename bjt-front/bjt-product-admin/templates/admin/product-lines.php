<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前产品线
$line = isset($_GET['line']) ? intval($_GET['line']) : 1;
$current_page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
$current_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

// 获取产品线数据
$product_line = BJT_Product_Line_Management::get_instance()->get_product_line($line);
?>

<div class="wrap">
    <h1 class="wp-heading-inline">
        <?php echo sprintf(__('产品线 %d', 'bjt-product-admin'), $line); ?>
    </h1>

    <div class="notice notice-info">
        <p><?php _e('除图片外，多语言部分类同，不再重复罗列', 'bjt-product-admin'); ?></p>
    </div>

    <form id="product-line-form" method="post">
        <?php wp_nonce_field('bjt_product_admin_nonce'); ?>
        <input type="hidden" name="product_line_id" value="<?php echo $line; ?>">

        <!-- Title -->
        <div class="form-group">
            <label><?php _e('标题：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="title_cn" 
                       value="<?php echo esc_attr($product_line['title_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="title_en" 
                       value="<?php echo esc_attr($product_line['title_en']); ?>">
            </div>
        </div>

        <!-- Description -->
        <div class="form-group">
            <label><?php _e('说明：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <?php 
                wp_editor(
                    $product_line['description_cn'],
                    'description_cn',
                    array(
                        'media_buttons' => false,
                        'textarea_rows' => 5,
                        'teeny' => true
                    )
                ); 
                ?>
            </div>
            <div class="language-content" data-lang="en">
                <?php 
                wp_editor(
                    $product_line['description_en'],
                    'description_en',
                    array(
                        'media_buttons' => false,
                        'textarea_rows' => 5,
                        'teeny' => true
                    )
                ); 
                ?>
            </div>
        </div>

        <!-- Subitem 1 -->
        <div class="form-group">
            <label><?php _e('子项1：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem1_cn" 
                       value="<?php echo esc_attr($product_line['subitem1_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem1_en" 
                       value="<?php echo esc_attr($product_line['subitem1_en']); ?>">
            </div>
        </div>

        <!-- Subitem 2 -->
        <div class="form-group">
            <label><?php _e('子项2：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem2_cn" 
                       value="<?php echo esc_attr($product_line['subitem2_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem2_en" 
                       value="<?php echo esc_attr($product_line['subitem2_en']); ?>">
            </div>
        </div>

        <!-- Image Upload -->
        <div class="form-group">
            <label><?php _e('图片：', 'bjt-product-admin'); ?></label>
            <div class="image-upload-area" id="dropArea">
                <img id="previewImage" src="<?php echo $product_line['image'] ? 
                    wp_get_attachment_url($product_line['image']) : 
                    plugins_url('assets/images/placeholder.png', BJT_PRODUCT_ADMIN_FILE); ?>" alt="preview">
                <div class="image-upload-text">
                    <?php _e('支持 .jpg, .png, .gif 格式，最大 5MB', 'bjt-product-admin'); ?>
                </div>
                <input type="file" id="fileInput" style="display: none;" accept=".jpg, .jpeg, .png, .gif">
                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
            <div class="form-row">
                <button type="button" class="btn btn-secondary" id="selectFileBtn">
                    <?php _e('选择', 'bjt-product-admin'); ?>
                </button>
                <button type="button" class="btn" id="uploadBtn">
                    <?php _e('提交', 'bjt-product-admin'); ?>
                </button>
            </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancelBtn">
                <?php _e('取消', 'bjt-product-admin'); ?>
            </button>
            <button type="submit" class="btn btn-primary" id="saveBtn">
                <?php _e('保存', 'bjt-product-admin'); ?>
            </button>
        </div>
    </form>
</div>

<style>
.form-group {
    margin-bottom: 24px;
}
.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #1a3c70;
}
.language-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}
.language-tab {
    padding: 8px 16px;
    background: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}
.language-tab:hover {
    background: #e9ecef;
}
.language-tab.active {
    background: #1a3c70;
    color: #fff;
    border-color: #1a3c70;
}
.language-content {
    display: none;
}
.language-content.active {
    display: block;
}
.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}
.form-control:focus {
    outline: none;
    border-color: #4dabf7;
    box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}
.image-upload-area {
    border: 2px dashed #ced4da;
    padding: 30px;
    text-align: center;
    background-color: #f8f9fa;
    margin-bottom: 20px;
    border-radius: 6px;
    transition: all 0.2s;
}
.image-upload-area:hover {
    border-color: #4dabf7;
    background-color: rgba(77, 171, 247, 0.05);
}
.image-upload-area.drag-over {
    border-color: #4dabf7;
    background-color: rgba(77, 171, 247, 0.05);
}
.image-upload-text {
    margin-top: 15px;
    color: #6c757d;
    font-size: 14px;
}
.progress-container {
    margin-top: 15px;
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    display: none;
}
.progress-bar {
    height: 100%;
    background: #4dabf7;
    width: 0%;
    transition: width 0.3s;
}
.form-row {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}
.form-row .btn {
    flex: 0 0 auto;
}
.form-actions {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e1e5eb;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
}
.btn {
    padding: 8px 16px;
    background-color: #1a3c70;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
}
.btn:hover {
    background-color: #15305b;
}
.btn-secondary {
    background-color: #6c757d;
}
.btn-secondary:hover {
    background-color: #5a6268;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Language tab switching
    $('.language-tab').on('click', function() {
        const lang = $(this).data('lang');
        const group = $(this).closest('.form-group');
        
        // Update tabs
        group.find('.language-tab').removeClass('active');
        $(this).addClass('active');
        
        // Update content
        group.find('.language-content').removeClass('active');
        group.find(`.language-content[data-lang="${lang}"]`).addClass('active');
    });

    // Image upload functionality
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewImage = document.getElementById('previewImage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');

    // Handle file selection button click
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });

    // Handle file selection change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Prevent default behavior for drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle drag enter/over events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    // Handle drag leave/drop events
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('drag-over');
    }

    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }

    // Handle dropped files
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];

        // Validate file type
        const fileType = file.type;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

        if (!validTypes.includes(fileType)) {
            alert('<?php _e("请上传 JPG, PNG 或 GIF 格式的图片", "bjt-product-admin"); ?>');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('<?php _e("图片大小不能超过 5MB", "bjt-product-admin"); ?>');
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Handle upload button click
    uploadBtn.addEventListener('click', function() {
        if (!fileInput.files.length) {
            alert('<?php _e("请先选择一个图片文件", "bjt-product-admin"); ?>');
            return;
        }

        uploadFile(fileInput.files[0]);
    });

    // Upload file with progress
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('action', 'bjt_upload_product_line_image');
        formData.append('file', file);
        formData.append('product_line_id', <?php echo $line; ?>);
        formData.append('nonce', '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>');

        // Show progress bar
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        progressBar.style.width = percent + '%';
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    // Hide progress bar after a delay
                    setTimeout(function() {
                        progressContainer.style.display = 'none';
                        alert('<?php _e("图片上传成功！", "bjt-product-admin"); ?>');
                    }, 500);
                } else {
                    alert(response.data.message);
                }
            },
            error: function() {
                alert('<?php _e("上传失败，请重试", "bjt-product-admin"); ?>');
                progressContainer.style.display = 'none';
            }
        });
    }

    // Form submission
    $('#product-line-form').on('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        formData.append('action', 'bjt_save_product_line');

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-lines&message=1'); ?>';
                } else {
                    alert(response.data.message);
                }
            }
        });
    });

    // Cancel button
    $('#cancelBtn').on('click', function() {
        if (confirm('<?php _e("确定要取消吗？未保存的更改将会丢失。", "bjt-product-admin"); ?>')) {
            window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-lines'); ?>';
        }
    });
});
</script> 