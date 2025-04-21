<?php
if (!defined('ABSPATH')) {
    exit;
}

$product_line_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$product_line = BJT_Product_Line_Management::get_instance()->get_product_line($product_line_id);
?>
<div class="main-content">
    <h2><?php echo $product_line_id ? __('编辑产品线', 'bjt-product-admin') : __('添加产品线', 'bjt-product-admin'); ?></h2>
    
    <form id="productForm">
        <input type="hidden" name="id" value="<?php echo esc_attr($product_line_id); ?>">
        
        <div class="form-group">
            <label><?php _e('标题：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en"><?php _e('English', 'bjt-product-admin'); ?></div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="title_cn" value="<?php echo esc_attr($product_line['title_cn']); ?>" required>
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="title_en" value="<?php echo esc_attr($product_line['title_en']); ?>" required>
            </div>
        </div>
        
        <div class="form-group">
            <label><?php _e('说明：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en"><?php _e('English', 'bjt-product-admin'); ?></div>
            </div>
            <div class="language-content active" data-lang="cn">
                <textarea class="form-control" name="description_cn"><?php echo esc_textarea($product_line['description_cn']); ?></textarea>
            </div>
            <div class="language-content" data-lang="en">
                <textarea class="form-control" name="description_en"><?php echo esc_textarea($product_line['description_en']); ?></textarea>
            </div>
        </div>
        
        <div class="form-group">
            <label><?php _e('子项1：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en"><?php _e('English', 'bjt-product-admin'); ?></div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem1_cn" value="<?php echo esc_attr($product_line['subitem1_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem1_en" value="<?php echo esc_attr($product_line['subitem1_en']); ?>">
            </div>
        </div>
        
        <div class="form-group">
            <label><?php _e('子项2：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en"><?php _e('English', 'bjt-product-admin'); ?></div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem2_cn" value="<?php echo esc_attr($product_line['subitem2_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem2_en" value="<?php echo esc_attr($product_line['subitem2_en']); ?>">
            </div>
        </div>
        
        <div class="form-group">
            <label><?php _e('子项3：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en"><?php _e('English', 'bjt-product-admin'); ?></div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem3_cn" value="<?php echo esc_attr($product_line['subitem3_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem3_en" value="<?php echo esc_attr($product_line['subitem3_en']); ?>">
            </div>
        </div>
        
        <div class="form-group">
            <label><?php _e('图片：', 'bjt-product-admin'); ?></label>
            <div class="image-upload-area" id="dropArea">
                <img id="previewImage" src="<?php echo esc_url($product_line['image_url']); ?>" alt="preview" />
                <div style="margin-top: 15px; color: #6c757d; font-size: 14px;">
                    <?php _e('支持 .jpg, .png, .gif 格式，最大 5MB', 'bjt-product-admin'); ?>
                </div>
                <input type="file" id="fileInput" style="display: none;" accept=".jpg, .jpeg, .png, .gif">
                <div class="progress-container" id="progressContainer">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>
            <div class="form-row">
                <button type="button" class="btn" style="background-color: #6c757d;" id="selectFileBtn"><?php _e('选择', 'bjt-product-admin'); ?></button>
                <button type="button" class="btn" id="uploadBtn"><?php _e('提交', 'bjt-product-admin'); ?></button>
            </div>
        </div>
        
        <div style="margin-top: 30px; border-top: 1px solid #e1e5eb; padding-top: 20px; display: flex; justify-content: flex-end; gap: 15px;">
            <button type="button" class="btn" style="background-color: #6c757d;" id="cancelBtn"><?php _e('取消', 'bjt-product-admin'); ?></button>
            <button type="button" class="btn" id="saveBtn"><?php _e('保存', 'bjt-product-admin'); ?></button>
        </div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('productForm');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewImage = document.getElementById('previewImage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const dropArea = document.getElementById('dropArea');
    
    let currentImageUrl = '<?php echo esc_js($product_line['image_url']); ?>';
    
    // Handle file selection
    selectFileBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showToast('<?php echo esc_js(__('错误: 请上传 JPG, PNG 或 GIF 格式的图片', 'bjt-product-admin')); ?>', 'error');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('<?php echo esc_js(__('错误: 图片大小不能超过 5MB', 'bjt-product-admin')); ?>', 'error');
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Handle upload
    uploadBtn.addEventListener('click', function() {
        if (!fileInput.files.length) {
            showToast('<?php echo esc_js(__('请先选择一个图片文件', 'bjt-product-admin')); ?>', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        // Show progress bar
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        
        // Upload file
        fetch('/wp-json/bjt-product/v1/upload-image', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentImageUrl = data.url;
                showToast('<?php echo esc_js(__('图片上传成功！', 'bjt-product-admin')); ?>', 'success');
            } else {
                showToast('<?php echo esc_js(__('图片上传失败', 'bjt-product-admin')); ?>', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('<?php echo esc_js(__('图片上传失败', 'bjt-product-admin')); ?>', 'error');
        })
        .finally(() => {
            progressContainer.style.display = 'none';
        });
    });
    
    // Handle save
    saveBtn.addEventListener('click', function() {
        const formData = new FormData(form);
        const data = {
            id: formData.get('id'),
            title_cn: formData.get('title_cn'),
            title_en: formData.get('title_en'),
            description_cn: formData.get('description_cn'),
            description_en: formData.get('description_en'),
            subitem1_cn: formData.get('subitem1_cn'),
            subitem1_en: formData.get('subitem1_en'),
            subitem2_cn: formData.get('subitem2_cn'),
            subitem2_en: formData.get('subitem2_en'),
            subitem3_cn: formData.get('subitem3_cn'),
            subitem3_en: formData.get('subitem3_en'),
            image_url: currentImageUrl
        };
        
        fetch('/wp-json/bjt-product/v1/product-lines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('<?php echo esc_js(__('产品线信息保存成功！', 'bjt-product-admin')); ?>', 'success');
                setTimeout(() => {
                    window.location.href = '<?php echo esc_js(admin_url('admin.php?page=bjt-product-lines')); ?>';
                }, 1500);
            } else {
                showToast('<?php echo esc_js(__('保存失败', 'bjt-product-admin')); ?>', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('<?php echo esc_js(__('保存失败', 'bjt-product-admin')); ?>', 'error');
        });
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', function() {
        window.location.href = '<?php echo esc_js(admin_url('admin.php?page=bjt-product-lines')); ?>';
    });
    
    // Toast notification
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
});
</script> 