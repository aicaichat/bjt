<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取所有主机料号
$hosts = BJT_Host_Part_Number_Management::get_instance()->get_all_hosts();

$part_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$part = $part_id ? BJT_Host_Part_Number_Management::get_instance()->get_part($part_id) : null;
?>

<div class="bjt-admin-content-header">
    <h2>主机料号管理</h2>
    <div class="bjt-admin-actions">
        <button class="btn btn-primary" id="addHostBtn">
            <span class="dashicons dashicons-plus"></span> 新增料号
        </button>
    </div>
</div>

<div class="bjt-admin-filters">
    <div class="filter-group">
        <label class="filter-label">搜索：</label>
        <input type="text" class="filter-input" id="hostSearch" placeholder="请输入型号、料号或名称">
    </div>
    <div class="filter-group">
        <label class="filter-label">状态：</label>
        <select class="filter-input" id="statusFilter">
            <option value="">全部</option>
            <option value="publish">已发布</option>
            <option value="draft">草稿</option>
        </select>
    </div>
    <button class="btn btn-primary" id="filterBtn">筛选</button>
    <button class="btn" style="background-color: #6c757d;" id="resetFilterBtn">重置</button>
</div>

<div class="table-container">
    <table>
        <thead>
            <tr>
                <th style="width: 80px;">No</th>
                <th>型号</th>
                <th>料号</th>
                <th>中文名称</th>
                <th>英文名称</th>
                <th>电压</th>
                <th>规格说明</th>
                <th style="width: 180px;">状态</th>
                <th style="width: 200px;">创建时间</th>
                <th style="width: 200px;">操作</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($hosts as $index => $host): ?>
            <tr>
                <td><?php echo $index + 1; ?></td>
                <td><?php echo esc_html($host->model); ?></td>
                <td><?php echo esc_html($host->part_number); ?></td>
                <td><?php echo esc_html($host->name_cn); ?></td>
                <td><?php echo esc_html($host->name_en); ?></td>
                <td><?php echo esc_html($host->voltage); ?></td>
                <td>
                    <?php if (!empty($host->specification_pdf)): ?>
                        <a href="<?php echo esc_url($host->specification_pdf); ?>" target="_blank" class="btn btn-sm btn-info">
                            <span class="dashicons dashicons-media-document"></span> 查看
                        </a>
                    <?php else: ?>
                        <span class="bjt-no-pdf">未上传</span>
                    <?php endif; ?>
                </td>
                <td>
                    <span class="status-icon <?php echo $host->status === 'publish' ? 'status-active' : 'status-inactive'; ?>"></span>
                    <?php echo $host->status === 'publish' ? '已发布' : '草稿'; ?>
                </td>
                <td><?php echo date('Y-m-d H:i', strtotime($host->created_at)); ?></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-host" data-id="<?php echo $host->id; ?>">
                        <span class="dashicons dashicons-edit"></span> 编辑
                    </button>
                    <button class="btn btn-sm btn-info upload-pdf" data-id="<?php echo $host->id; ?>">
                        <span class="dashicons dashicons-upload"></span> 规格说明
                    </button>
                    <button class="btn btn-sm btn-danger delete-host" data-id="<?php echo $host->id; ?>">
                        <span class="dashicons dashicons-trash"></span> 删除
                    </button>
                    <button class="btn btn-sm <?php echo $host->status === 'publish' ? 'btn-warning' : 'btn-success'; ?> toggle-status" 
                            data-id="<?php echo $host->id; ?>" 
                            data-status="<?php echo $host->status; ?>">
                        <span class="dashicons <?php echo $host->status === 'publish' ? 'dashicons-hidden' : 'dashicons-visibility'; ?>"></span>
                        <?php echo $host->status === 'publish' ? '下架' : '上架'; ?>
                    </button>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- 主机料号编辑模态框 -->
<div class="modal" id="hostModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title" id="hostModalTitle">新增料号</h4>
            <button class="modal-close" id="closeHostModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="wrap">
                <h2>新增料号</h2>
                <div class="language-switcher" style="margin-bottom: 20px;">
                    <button class="language-tab active" data-lang="cn">中文</button>
                    <button class="language-tab" data-lang="en">English</button>
                </div>
                
                <div class="form-container">
                    <form id="partForm" method="post" action="">
                        <?php wp_nonce_field('save_part', 'part_nonce'); ?>
                        <input type="hidden" name="action" value="save_part">
                        <input type="hidden" name="part_id" value="<?php echo $part_id; ?>">
                        
                        <!-- Basic Information -->
                        <h3 style="margin-bottom: 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">基本信息</h3>
                        
                        <div class="form-group">
                            <label class="form-label">料号：</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="text" class="form-control" id="partNumber" name="part_number" value="<?php echo $part ? esc_attr($part->part_number) : ''; ?>" required>
                                <button type="button" class="btn btn-primary" id="fetchFromCRM">从CRM获取</button>
                            </div>
                            <span class="hint">*唯一，不能重复</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label">型号：</label>
                            <input type="text" class="form-control" id="model" name="model" value="<?php echo $part ? esc_attr($part->model) : ''; ?>" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">电压：</label>
                            <input type="text" class="form-control" id="voltage" name="voltage" value="<?php echo $part ? esc_attr($part->voltage) : ''; ?>">
                        </div>

                        <div class="form-group">
                            <label class="form-label">产品名称：</label>
                            <input type="text" class="form-control" id="name" name="name" value="<?php echo $part ? esc_attr($part->name) : ''; ?>" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">品牌：</label>
                            <input type="text" class="form-control" id="brand" name="brand" value="<?php echo $part ? esc_attr($part->brand) : ''; ?>">
                        </div>

                        <!-- Package Information -->
                        <h3 style="margin: 30px 0 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">包装信息</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">包装长度 (mm)：</label>
                                <input type="number" class="form-control" id="packageLength" name="package_length" value="<?php echo $part ? esc_attr($part->package_length) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">包装宽度 (mm)：</label>
                                <input type="number" class="form-control" id="packageWidth" name="package_width" value="<?php echo $part ? esc_attr($part->package_width) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">包装高度 (mm)：</label>
                                <input type="number" class="form-control" id="packageHeight" name="package_height" value="<?php echo $part ? esc_attr($part->package_height) : ''; ?>">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">包装毛重 (kg)：</label>
                                <input type="number" class="form-control" id="packageWeight" name="package_weight" step="0.01" value="<?php echo $part ? esc_attr($part->package_weight) : ''; ?>">
                            </div>
                        </div>

                        <!-- Pallet Information -->
                        <h3 style="margin: 30px 0 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">托盘信息</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">托盘长度 (mm)：</label>
                                <input type="number" class="form-control" id="palletLength" name="pallet_length" value="<?php echo $part ? esc_attr($part->pallet_length) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">托盘宽度 (mm)：</label>
                                <input type="number" class="form-control" id="palletWidth" name="pallet_width" value="<?php echo $part ? esc_attr($part->pallet_width) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">托盘高度 (mm)：</label>
                                <input type="number" class="form-control" id="palletHeight" name="pallet_height" value="<?php echo $part ? esc_attr($part->pallet_height) : ''; ?>">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">一托数量：</label>
                                <input type="number" class="form-control" id="quantityPerPallet" name="quantity_per_pallet" value="<?php echo $part ? esc_attr($part->quantity_per_pallet) : ''; ?>">
                            </div>
                            <div class="form-group">
                                <label class="form-label">打托后总高度 (mm)：</label>
                                <input type="number" class="form-control" id="totalHeight" name="total_height" value="<?php echo $part ? esc_attr($part->total_height) : ''; ?>">
                            </div>
                        </div>

                        <!-- Product Image -->
                        <h3 style="margin: 30px 0 20px; color: #495057; border-bottom: 1px solid #e1e5eb; padding-bottom: 10px;">产品图片</h3>
                        
                        <div class="form-group">
                            <div class="image-upload">
                                <div class="image-preview">
                                    <?php if ($part && $part->image_url): ?>
                                    <img src="<?php echo esc_url($part->image_url); ?>" alt="产品图片预览">
                                    <button type="button" class="remove-image">×</button>
                                    <?php endif; ?>
                                </div>
                                <label class="btn btn-primary">
                                    上传图片
                                    <input type="file" id="productImage" name="product_image" accept="image/*" style="display: none;">
                                </label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelBtn">取消</button>
                            <button type="submit" class="btn btn-primary" id="submitBtn">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelHostBtn">取消</button>
            <button class="btn btn-primary" id="saveHostBtn">保存</button>
        </div>
    </div>
</div>

<!-- PDF上传模态框 -->
<div class="modal" id="pdfModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title">上传规格说明PDF</h4>
            <button class="modal-close" id="closePdfModal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="pdfForm" enctype="multipart/form-data">
                <input type="hidden" id="pdfHostId" name="host_id">
                <div class="bjt-upload-area" id="pdfDropArea">
                    <p>将PDF文件拖放至此处，或</p>
                    <input type="file" id="pdfFile" name="pdf_file" accept=".pdf" style="display: none;">
                    <button type="button" class="btn" id="selectPdfBtn">选择文件</button>
                </div>
                <div class="bjt-upload-progress" style="display: none;">
                    <div class="bjt-progress-bar"></div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelPdfBtn">取消</button>
            <button class="btn btn-primary" id="uploadPdfBtn">上传</button>
        </div>
    </div>
</div>

<!-- 确认模态框 -->
<div class="modal" id="confirmModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title" id="confirmModalTitle">确认操作</h4>
            <button class="modal-close" id="closeConfirmModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-warning">
                <p id="confirmMessage">您确定要执行此操作吗？此操作无法撤销。</p>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelConfirmBtn">取消</button>
            <button class="btn btn-danger" id="confirmActionBtn">确认</button>
        </div>
    </div>
</div>

<!-- Toast通知 -->
<div class="toast" id="toast">
    <span id="toastMessage">操作成功</span>
</div>

<style>
/* 复用4.html中的样式 */
<?php include(plugin_dir_path(__FILE__) . '../../../assets/css/admin.css'); ?>

.form-container {
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    padding: 30px;
    max-width: 900px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 25px;
    position: relative;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.form-row .form-group {
    flex: 1;
    margin-bottom: 0;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
    font-size: 14px;
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

.hint {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #6c757d;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #1a3c70;
    color: white;
}

.btn-primary:hover {
    background-color: #15305b;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.form-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
}

.language-switcher {
    display: flex;
    align-items: center;
    gap: 5px;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    overflow: hidden;
}

.language-tab {
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    color: #495057;
    background-color: transparent;
    border: none;
    transition: all 0.2s;
}

.language-tab.active {
    background-color: #1a3c70;
    color: white;
}

.language-tab:hover:not(.active) {
    background-color: #e9ecef;
}

.image-upload {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.image-preview {
    width: 200px;
    height: 200px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-image {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: #dc3545;
}

.remove-image:hover {
    background-color: rgba(255, 255, 255, 0.9);
}

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
    // 复用4.html中的JavaScript代码
    <?php include(plugin_dir_path(__FILE__) . '../../../assets/js/host-part-number.js'); ?>

    // Language switching functionality
    const languageTabs = $('.language-tab');
    
    // Handle language tab clicks
    languageTabs.on('click', function() {
        const lang = $(this).data('lang');
        
        // Update active state
        languageTabs.removeClass('active');
        $(this).addClass('active');
    });

    // Image upload functionality
    const productImage = $('#productImage');
    const imagePreview = $('.image-preview');
    
    productImage.on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.html(`
                    <img src="${e.target.result}" alt="产品图片预览">
                    <button type="button" class="remove-image">×</button>
                `);
            };
            reader.readAsDataURL(file);
        }
    });
    
    imagePreview.on('click', '.remove-image', function() {
        imagePreview.empty();
        productImage.val('');
    });

    // CRM integration
    $('#fetchFromCRM').on('click', function() {
        const partNumber = $('#partNumber').val().trim();
        
        if (!partNumber) {
            showToast('请输入料号', 'error');
            return;
        }

        // Show loading state
        $(this).prop('disabled', true);
        $(this).text('获取中...');
        
        // Simulate API call to CRM
        setTimeout(() => {
            // Simulate data returned from CRM
            const mockData = {
                model: 'Z4BLD-' + partNumber.slice(-2),
                voltage: '220V',
                name: '标准备件-' + partNumber,
                brand: 'BJT',
                packageInfo: {
                    length: 300,
                    width: 200,
                    height: 150,
                    weight: 2.5
                },
                palletInfo: {
                    length: 1200,
                    width: 800,
                    height: 150,
                    quantity: 20,
                    totalHeight: 1200
                }
            };

            // Fill form fields with CRM data
            $('#model').val(mockData.model);
            $('#voltage').val(mockData.voltage);
            $('#name').val(mockData.name);
            $('#brand').val(mockData.brand);

            // Set package information
            $('#packageLength').val(mockData.packageInfo.length);
            $('#packageWidth').val(mockData.packageInfo.width);
            $('#packageHeight').val(mockData.packageInfo.height);
            $('#packageWeight').val(mockData.packageInfo.weight);

            // Set pallet information
            $('#palletLength').val(mockData.palletInfo.length);
            $('#palletWidth').val(mockData.palletInfo.width);
            $('#palletHeight').val(mockData.palletInfo.height);
            $('#quantityPerPallet').val(mockData.palletInfo.quantity);
            $('#totalHeight').val(mockData.palletInfo.totalHeight);

            // Reset button state
            $(this).prop('disabled', false);
            $(this).text('从CRM获取');

            showToast('数据获取成功', 'success');
        }, 1500);
    });

    // Form validation and submission
    $('#partForm').on('submit', function(e) {
        e.preventDefault();
        
        // Validate required fields
        const partNumber = $('#partNumber').val().trim();
        const model = $('#model').val().trim();
        const name = $('#name').val().trim();
        
        if (!partNumber || !model || !name) {
            showToast('请填写所有必填字段', 'error');
            return;
        }
        
        // Gather form data
        const formData = new FormData(this);
        
        // Submit form
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showToast('保存成功', 'success');
                    setTimeout(() => {
                        window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-admin&action=list-parts'); ?>';
                    }, 1500);
                } else {
                    showToast(response.data || '保存失败', 'error');
                }
            },
            error: function() {
                showToast('保存失败，请重试', 'error');
            }
        });
    });

    // Cancel button
    $('#cancelBtn').on('click', function() {
        if (confirm('确定要取消编辑吗？所有未保存的更改将丢失。')) {
            window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-admin&action=list-parts'); ?>';
        }
    });

    // Toast notification functionality
    function showToast(message, type) {
        const toast = $('#toast');
        const toastMessage = $('#toastMessage');
        
        toastMessage.text(message);
        toast.removeClass().addClass('toast ' + (type || '')).addClass('show');
        
        setTimeout(function() {
            toast.removeClass('show');
        }, 3000);
    }
});
</script> 