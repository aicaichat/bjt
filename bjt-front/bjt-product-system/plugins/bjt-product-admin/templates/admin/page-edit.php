<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前产品线编号
$line_number = isset($_GET['line']) ? intval($_GET['line']) : 1;
if ($line_number < 1 || $line_number > 4) {
    $line_number = 1;
}

// 产品线和类型映射
$product_line_map = array(
    1 => array('slug' => 'air-cushion', 'title' => '气垫机产品线'),
    2 => array('slug' => 'paper-machine', 'title' => '纸机产品线'),
    3 => array('slug' => 'tape-machine', 'title' => '胶带机产品线'),
    4 => array('slug' => 'air-column', 'title' => '气柱袋产品线')
);

// 获取产品线数据
$product_line_manager = BJT_Product_Line_Management::get_instance();
$product_line = $product_line_manager->get_product_line($line_number);

// 如果产品线不存在，使用默认数据
if (!$product_line || empty($product_line['title_cn'])) {
    $default_titles = array(
        1 => '缓冲气垫机系统',
        2 => '包装纸机系统',
        3 => '胶带封箱机系统',
        4 => '气柱袋包装系统'
    );
    
    $default_titles_en = array(
        1 => 'Air Cushioning System',
        2 => 'Paper Packaging System',
        3 => 'Tape Sealing System',
        4 => 'Air Column Bag System'
    );
    
    $product_line = array(
        'id' => $line_number,
        'title_cn' => $default_titles[$line_number],
        'title_en' => $default_titles_en[$line_number],
        'description_cn' => '',
        'description_en' => '',
        'subitem1_cn' => $line_number == 1 ? '气垫机与配件' : ($line_number == 2 ? '纸机主机' : ($line_number == 3 ? '胶带机设备' : '气柱袋生产设备')),
        'subitem1_en' => $line_number == 1 ? 'Air Cushion Machine & Accessories' : ($line_number == 2 ? 'Paper Machine & Components' : ($line_number == 3 ? 'Tape Machine Equipment' : 'Air Column Production Equipment')),
        'subitem2_cn' => $line_number == 1 ? '膜材选项' : ($line_number == 2 ? '纸张选项' : ($line_number == 3 ? '胶带材料' : '气柱袋规格')),
        'subitem2_en' => $line_number == 1 ? 'Film Option' : ($line_number == 2 ? 'Paper Options' : ($line_number == 3 ? 'Tape Materials' : 'Air Column Specifications')),
        'subitem3_cn' => $line_number == 1 ? '技术规格' : ($line_number == 2 ? '技术参数' : ($line_number == 3 ? '技术规格' : '性能参数')),
        'subitem3_en' => $line_number == 1 ? 'Technical Specifications' : ($line_number == 2 ? 'Technical Parameters' : ($line_number == 3 ? 'Technical Specifications' : 'Performance Parameters')),
        'image_url' => plugins_url('assets/images/placeholder.png', dirname(dirname(__FILE__)))
    );
}

// 获取当前语言
$current_lang = get_locale();
?>

<div class="wrap bjt-admin-page">
    <h1 class="wp-heading-inline">
        <?php echo sprintf(__('编辑%s', 'bjt-product-admin'), $product_line_map[$line_number]['title']); ?>
    </h1>

    <div class="notice notice-info">
        <p><i style="margin-right: 8px; color: #ff6b6b;">ℹ️</i> <?php _e('除图片外，多语言部分类同，不再重复罗列', 'bjt-product-admin'); ?></p>
    </div>

    <div class="nav-tab-wrapper">
        <?php for ($i = 1; $i <= 4; $i++): ?>
            <a href="<?php echo admin_url('admin.php?page=bjt-page-edit&line=' . $i); ?>" 
               class="nav-tab <?php echo $i === $line_number ? 'nav-tab-active' : ''; ?>">
                <?php echo $product_line_map[$i]['title']; ?>
            </a>
        <?php endfor; ?>
    </div>

    <form id="product-line-form" method="post" class="bjt-product-edit-form">
        <?php wp_nonce_field('bjt_product_admin_nonce', 'security'); ?>
        <input type="hidden" name="product_line_id" value="<?php echo $line_number; ?>">

        <!-- 标题 -->
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

        <!-- 说明 -->
        <div class="form-group">
            <label><?php _e('说明：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <div style="border: 1px solid #ced4da; border-radius: 4px; overflow: hidden;">
                    <div style="padding: 8px 12px; background-color: #f8f9fa; border-bottom: 1px solid #ced4da; display: flex; gap: 10px;">
                        <button type="button" style="background: none; border: none; font-weight: bold; cursor: pointer;">B</button>
                        <button type="button" style="background: none; border: none; font-style: italic; cursor: pointer;">I</button>
                        <button type="button" style="background: none; border: none; text-decoration: underline; cursor: pointer;">U</button>
                        <span style="border-right: 1px solid #ced4da; margin: 0 5px;"></span>
                        <button type="button" style="background: none; border: none; cursor: pointer;">⌨️</button>
                    </div>
                    <textarea class="form-control" style="border: none; border-radius: 0; height: 120px;" name="description_cn"><?php echo esc_textarea($product_line['description_cn']); ?></textarea>
                </div>
            </div>
            <div class="language-content" data-lang="en">
                <div style="border: 1px solid #ced4da; border-radius: 4px; overflow: hidden;">
                    <div style="padding: 8px 12px; background-color: #f8f9fa; border-bottom: 1px solid #ced4da; display: flex; gap: 10px;">
                        <button type="button" style="background: none; border: none; font-weight: bold; cursor: pointer;">B</button>
                        <button type="button" style="background: none; border: none; font-style: italic; cursor: pointer;">I</button>
                        <button type="button" style="background: none; border: none; text-decoration: underline; cursor: pointer;">U</button>
                        <span style="border-right: 1px solid #ced4da; margin: 0 5px;"></span>
                        <button type="button" style="background: none; border: none; cursor: pointer;">⌨️</button>
                    </div>
                    <textarea class="form-control" style="border: none; border-radius: 0; height: 120px;" name="description_en"><?php echo esc_textarea($product_line['description_en']); ?></textarea>
                </div>
            </div>
        </div>

        <!-- 子项1 -->
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

        <!-- 子项2 -->
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

        <!-- 子项3 -->
        <div class="form-group">
            <label><?php _e('子项3：', 'bjt-product-admin'); ?></label>
            <div class="language-tabs">
                <div class="language-tab active" data-lang="cn"><?php _e('中文', 'bjt-product-admin'); ?></div>
                <div class="language-tab" data-lang="en">English</div>
            </div>
            <div class="language-content active" data-lang="cn">
                <input type="text" class="form-control" name="subitem3_cn" 
                       value="<?php echo esc_attr($product_line['subitem3_cn']); ?>">
            </div>
            <div class="language-content" data-lang="en">
                <input type="text" class="form-control" name="subitem3_en" 
                       value="<?php echo esc_attr($product_line['subitem3_en']); ?>">
            </div>
        </div>

        <!-- 图片上传 -->
        <div class="form-group">
            <label><?php _e('图片：', 'bjt-product-admin'); ?></label>
            <div class="image-upload-area" id="dropArea">
                <img id="previewImage" src="<?php echo esc_url($product_line['image_url']); ?>" alt="placeholder">
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

<!-- Toast notification -->
<div class="toast" id="toast">
    <span id="toastMessage"><?php _e('操作成功', 'bjt-product-admin'); ?></span>
</div>

<style>
* {
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.bjt-admin-page {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    padding: 30px;
    margin: 20px 0;
}
.form-group {
    margin-bottom: 24px;
}
.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #495057;
}
.language-tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 15px;
}
.language-tab {
    padding: 8px 20px;
    cursor: pointer;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-bottom: none;
    border-radius: 4px 4px 0 0;
    margin-right: 5px;
    font-size: 14px;
    font-weight: 500;
    color: #6c757d;
    position: relative;
    bottom: -1px;
}
.language-tab.active {
    background-color: #fff;
    color: #1a3c70;
    border-bottom: 1px solid #fff;
    font-weight: 600;
}
.language-content {
    display: none;
    padding: 15px 0;
}
.language-content.active {
    display: block;
}
.form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s;
}
.form-control:focus {
    outline: none;
    border-color: #4dabf7;
    box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}
textarea.form-control {
    height: 120px;
    resize: vertical;
}
.btn {
    padding: 10px 18px;
    background-color: #1a3c70;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}
.btn:hover {
    background-color: #15305b;
}
.image-upload-area {
    border: 2px dashed #ced4da;
    padding: 30px;
    text-align: center;
    background-color: #f8f9fa;
    margin-bottom: 20px;
    border-radius: 6px;
    transition: border-color 0.2s;
    position: relative;
}
.image-upload-area:hover {
    border-color: #4dabf7;
}
.image-upload-area.drag-over {
    border-color: #4dabf7;
    background-color: rgba(77, 171, 247, 0.05);
}
.progress-container {
    margin-top: 15px;
    width: 100%;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 4px;
    display: none;
}
.progress-bar {
    height: 100%;
    background-color: #4dabf7;
    border-radius: 4px;
    width: 0%;
    transition: width 0.3s ease;
}
.form-row {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}
.form-row .btn {
    flex: 0 0 auto;
}
#previewImage {
    max-width: 100%;
    max-height: 300px;
}
.nav-tab-wrapper {
    margin-bottom: 20px;
}
/* Toast notification */
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: none;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.toast.success {
    background-color: #28a745;
}
.toast.error {
    background-color: #dc3545;
}
.toast.show {
    display: block;
    opacity: 1;
}
</style>

<script>
jQuery(document).ready(function($) {
    // 语言标签切换
    $('.language-tab').on('click', function() {
        const lang = $(this).data('lang');
        const group = $(this).closest('.form-group');
        
        // 更新标签状态
        group.find('.language-tab').removeClass('active');
        $(this).addClass('active');
        
        // 更新内容显示
        group.find('.language-content').removeClass('active');
        group.find(`.language-content[data-lang="${lang}"]`).addClass('active');
    });

    // 文件上传功能
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewImage = document.getElementById('previewImage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    // Toast notification functionality
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    function showToast(message, type) {
        toastMessage.textContent = message;
        toast.className = 'toast ' + (type || '');
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }

    // 处理文件选择按钮点击
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 处理文件选择更改
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // 防止拖放事件的默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 处理拖拽进入/悬停事件
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    // 处理拖拽离开/放下事件
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    // 处理放下的文件
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });
    
    // Process files for preview
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file type
        const fileType = file.type;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (!validTypes.includes(fileType)) {
            showToast('错误: 请上传 JPG, PNG 或 GIF 格式的图片', 'error');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('错误: 图片大小不能超过 5MB', 'error');
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 处理上传按钮点击
    uploadBtn.addEventListener('click', function() {
        if (!fileInput.files.length) {
            showToast('请先选择一个图片文件', 'error');
            return;
        }
        
        uploadFile(fileInput.files[0]);
    });
    
    // 上传文件并显示进度
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('action', 'bjt_upload_product_line_image');
        formData.append('file', file);
        formData.append('product_line_id', <?php echo $line_number; ?>);
        formData.append('nonce', '<?php echo wp_create_nonce("bjt_product_admin_nonce"); ?>');
        
        // 显示进度条
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
                // 隐藏进度条
                setTimeout(function() {
                    progressContainer.style.display = 'none';
                    if (response.success) {
                        showToast('图片上传成功！', 'success');
                    } else {
                        showToast(response.data.message || '上传失败', 'error');
                    }
                }, 500);
            },
            error: function() {
                progressContainer.style.display = 'none';
                showToast('上传失败，请重试', 'error');
            }
        });
    }
    
    // 保存按钮功能
    $('#saveBtn').on('click', function() {
        const formData = new FormData(document.getElementById('product-line-form'));
        formData.append('action', 'bjt_save_product_line_page');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showToast('产品线信息保存成功！', 'success');
                } else {
                    showToast(response.data.message || '保存失败', 'error');
                }
            },
            error: function() {
                showToast('保存失败，请重试', 'error');
            }
        });
    });
    
    // 取消按钮功能
    $('#cancelBtn').on('click', function() {
        if (confirm('确定要取消吗？未保存的更改将会丢失。')) {
            window.location.reload();
            showToast('已取消编辑，恢复原始数据', 'error');
        }
    });
});
</script> 