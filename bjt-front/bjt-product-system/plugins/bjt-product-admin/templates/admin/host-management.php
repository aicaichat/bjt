<?php
if (!defined('ABSPATH')) {
    exit;
}

$host_management = BJT_Host_Management::get_instance();
$hosts = $host_management->get_hosts();
$part_numbers = $host_management->get_part_numbers();
?>

<div class="wrap">
    <h2>气垫机 - 主机管理</h2>
    
    <!-- 型号表 -->
    <div class="section">
        <div class="section-header">
            <h3 class="section-title">型号表</h3>
            <div style="display: flex; gap: 10px;">
                <div class="btn-group">
                    <button class="button button-info dropdown-toggle" id="exportModelBtn">
                        <span>导出</span>
                        <span style="font-size: 10px;">▼</span>
                    </button>
                    <div class="dropdown-menu" id="exportModelDropdown">
                        <a href="#" class="dropdown-item" data-format="excel">Excel</a>
                        <a href="#" class="dropdown-item" data-format="csv">CSV</a>
                        <a href="#" class="dropdown-item" data-format="json">JSON</a>
                    </div>
                </div>
                <label for="importModelFile" class="button button-success">
                    <span>导入</span>
                    <input type="file" id="importModelFile" accept=".xlsx,.xls,.csv,.json" style="display: none;">
                </label>
                <button class="button button-primary" id="addModelBtn">新增</button>
            </div>
        </div>
        <div class="table-container">
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 80px;">No</th>
                        <th>型号名称</th>
                        <th style="width: 180px;">状态</th>
                        <th style="width: 200px;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($hosts as $index => $host): ?>
                    <tr>
                        <td><?php echo esc_html($index + 1); ?></td>
                        <td><?php echo esc_html($host->model_name); ?></td>
                        <td>
                            <span class="status-badge">
                                <span class="status-icon status-<?php echo esc_attr($host->status); ?>"></span>
                                <?php echo $host->status === 'active' ? '已上架' : '已下架'; ?>
                            </span>
                        </td>
                        <td class="action-buttons">
                            <button class="button button-small edit-model" data-id="<?php echo esc_attr($host->id); ?>">编辑</button>
                            <button class="button button-small <?php echo $host->status === 'active' ? 'button-warning' : 'button-success'; ?> toggle-status" data-id="<?php echo esc_attr($host->id); ?>" data-status="<?php echo esc_attr($host->status); ?>">
                                <?php echo $host->status === 'active' ? '下架' : '上架'; ?>
                            </button>
                            <button class="button button-small button-danger delete-model" data-id="<?php echo esc_attr($host->id); ?>">删除</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <div class="pagination">
            <span class="page-item">«</span>
            <span class="page-item active">1</span>
            <span class="page-item">2</span>
            <span class="page-item">3</span>
            <span class="page-item">»</span>
        </div>
    </div>
    
    <div class="divider"></div>
    
    <!-- 料号表 -->
    <div class="section">
        <div class="section-header">
            <h3 class="section-title">料号表</h3>
            <div style="display: flex; gap: 10px;">
                <div class="btn-group">
                    <button class="button button-info dropdown-toggle" id="exportPartBtn">
                        <span>导出</span>
                        <span style="font-size: 10px;">▼</span>
                    </button>
                    <div class="dropdown-menu" id="exportPartDropdown">
                        <a href="#" class="dropdown-item" data-format="excel">Excel</a>
                        <a href="#" class="dropdown-item" data-format="csv">CSV</a>
                        <a href="#" class="dropdown-item" data-format="json">JSON</a>
                    </div>
                </div>
                <label for="importPartFile" class="button button-success">
                    <span>导入</span>
                    <input type="file" id="importPartFile" accept=".xlsx,.xls,.csv,.json" style="display: none;">
                </label>
                <button class="button button-primary" id="addPartBtn">新增</button>
            </div>
        </div>
        <div class="filters">
            <div class="filter-group">
                <label class="filter-label">型号：</label>
                <select class="filter-input" id="modelFilter">
                    <option value="">全部</option>
                    <?php foreach ($hosts as $host): ?>
                    <option value="<?php echo esc_attr($host->id); ?>"><?php echo esc_html($host->model_name); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">料号：</label>
                <input type="text" class="filter-input" id="partNumberFilter" placeholder="请输入料号">
            </div>
            <button class="button button-primary" id="filterBtn">筛选</button>
            <button class="button" id="resetFilterBtn">重置</button>
        </div>
        <div class="table-container">
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width: 80px;">No</th>
                        <th>型号</th>
                        <th>料号</th>
                        <th style="width: 180px;">状态</th>
                        <th style="width: 200px;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($part_numbers as $index => $part): ?>
                    <tr>
                        <td><?php echo esc_html($index + 1); ?></td>
                        <td><?php echo esc_html($part->model_name); ?></td>
                        <td><?php echo esc_html($part->part_number); ?></td>
                        <td>
                            <span class="status-badge">
                                <span class="status-icon status-<?php echo esc_attr($part->status); ?>"></span>
                                <?php echo $part->status === 'active' ? '已上架' : '已下架'; ?>
                            </span>
                        </td>
                        <td class="action-buttons">
                            <button class="button button-small edit-part" data-id="<?php echo esc_attr($part->id); ?>">编辑</button>
                            <button class="button button-small <?php echo $part->status === 'active' ? 'button-warning' : 'button-success'; ?> toggle-part-status" data-id="<?php echo esc_attr($part->id); ?>" data-status="<?php echo esc_attr($part->status); ?>">
                                <?php echo $part->status === 'active' ? '下架' : '上架'; ?>
                            </button>
                            <button class="button button-small button-info link-part" data-id="<?php echo esc_attr($part->id); ?>">关联</button>
                            <button class="button button-small button-danger delete-part" data-id="<?php echo esc_attr($part->id); ?>">删除</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <div class="pagination">
            <span class="page-item">«</span>
            <span class="page-item active">1</span>
            <span class="page-item">2</span>
            <span class="page-item">3</span>
            <span class="page-item">»</span>
        </div>
    </div>
</div>

<!-- 型号模态框 -->
<div class="modal" id="modelModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title" id="modelModalTitle">新增型号</h4>
            <button class="modal-close" id="closeModelModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">型号名称：</label>
                <input type="text" class="form-control" id="modelName">
            </div>
            <div class="form-group">
                <label class="form-label">状态：</label>
                <select class="form-control" id="modelStatus">
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="button" id="cancelModelBtn">取消</button>
            <button class="button button-primary" id="saveModelBtn">保存</button>
        </div>
    </div>
</div>

<!-- 料号模态框 -->
<div class="modal" id="partModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title" id="partModalTitle">新增料号</h4>
            <button class="modal-close" id="closePartModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">型号：</label>
                <select class="form-control" id="partModel">
                    <?php foreach ($hosts as $host): ?>
                    <option value="<?php echo esc_attr($host->id); ?>"><?php echo esc_html($host->model_name); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">料号：</label>
                <input type="text" class="form-control" id="partNumber">
            </div>
            <div class="form-group">
                <label class="form-label">状态：</label>
                <select class="form-control" id="partStatus">
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="button" id="cancelPartBtn">取消</button>
            <button class="button button-primary" id="savePartBtn">保存</button>
        </div>
    </div>
</div>

<!-- 关联模态框 -->
<div class="modal" id="linkModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title">关联产品</h4>
            <button class="modal-close" id="closeLinkModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">型号：</label>
                <input type="text" class="form-control" id="linkModelName" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">料号：</label>
                <input type="text" class="form-control" id="linkPartNumber" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">关联产品：</label>
                <select class="form-control" id="linkProduct">
                    <option value="">-- 请选择产品 --</option>
                    <?php foreach ($part_numbers as $part): ?>
                    <option value="<?php echo esc_attr($part->id); ?>"><?php echo esc_html($part->model_name . ' - ' . $part->part_number); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="button" id="cancelLinkBtn">取消</button>
            <button class="button button-primary" id="saveLinkBtn">保存</button>
        </div>
    </div>
</div>

<!-- Toast notification -->
<div class="toast" id="toast">
    <span id="toastMessage">操作成功</span>
</div>

<style>
.card {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    margin: 20px 0;
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a3c70;
    margin: 0;
}

.btn-group {
    display: flex;
    gap: 10px;
}

.filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-label {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.filter-input {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
}

.status-icon {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-active {
    background-color: #28a745;
}

.status-inactive {
    background-color: #dc3545;
}

.action-buttons {
    display: flex;
    gap: 6px;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    gap: 5px;
}

.page-item {
    display: inline-block;
    min-width: 32px;
    height: 32px;
    text-align: center;
    line-height: 32px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
}

.page-item:hover {
    background-color: #e9ecef;
    border-color: #dee2e6;
}

.page-item.active {
    background-color: #1a3c70;
    border-color: #1a3c70;
    color: white;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal-dialog {
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 400px;
    max-width: 90%;
    animation: modalFadeIn 0.3s ease;
}

.modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e1e5eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-title {
    font-weight: 600;
    font-size: 18px;
    color: #1a3c70;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6c757d;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #e1e5eb;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.form-group {
    margin-bottom: 15px;
}

.form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #495057;
    font-size: 14px;
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

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script>
jQuery(document).ready(function($) {
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

    // Export dropdowns
    const exportModelBtn = $('#exportModelBtn');
    const exportModelDropdown = $('#exportModelDropdown');
    const exportPartBtn = $('#exportPartBtn');
    const exportPartDropdown = $('#exportPartDropdown');
    
    // Toggle export model dropdown
    exportModelBtn.on('click', function(e) {
        e.preventDefault();
        exportModelDropdown.toggleClass('show');
        exportPartDropdown.removeClass('show');
    });
    
    // Toggle export part dropdown
    exportPartBtn.on('click', function(e) {
        e.preventDefault();
        exportPartDropdown.toggleClass('show');
        exportModelDropdown.removeClass('show');
    });
    
    // Close dropdowns when clicking elsewhere
    $(document).on('click', function(e) {
        if (!exportModelBtn.is(e.target) && !exportModelDropdown.is(e.target) && exportModelDropdown.has(e.target).length === 0) {
            exportModelDropdown.removeClass('show');
        }
        
        if (!exportPartBtn.is(e.target) && !exportPartDropdown.is(e.target) && exportPartDropdown.has(e.target).length === 0) {
            exportPartDropdown.removeClass('show');
        }
    });
    
    // Export functionality
    $('.dropdown-item').on('click', function(e) {
        e.preventDefault();
        const format = $(this).data('format');
        const type = $(this).closest('.dropdown-menu').attr('id').includes('Model') ? 'models' : 'parts';
        exportData(type, format);
        $(this).closest('.dropdown-menu').removeClass('show');
    });
    
    function exportData(type, format) {
        showToast(`准备导出${type === 'models' ? '型号' : '料号'}数据为${format.toUpperCase()}格式`, 'info');
        
        // 这里应该调用后端API进行实际的导出操作
        setTimeout(() => {
            showToast(`${type === 'models' ? '型号' : '料号'}数据已成功导出为${format.toUpperCase()}格式`, 'success');
        }, 1500);
    }

    // Import functionality
    $('#importModelFile, #importPartFile').on('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            const type = this.id.includes('Model') ? 'models' : 'parts';
            importData(type, file);
        }
    });
    
    function importData(type, file) {
        showToast(`准备导入${type === 'models' ? '型号' : '料号'}数据`, 'info');
        
        // 这里应该调用后端API进行实际的导入操作
        setTimeout(() => {
            showToast(`${type === 'models' ? '型号' : '料号'}数据导入成功`, 'success');
        }, 1500);
    }

    // Model modal functionality
    $('#addModelBtn').on('click', function() {
        $('#modelModalTitle').text('新增型号');
        $('#modelName').val('');
        $('#modelStatus').val('active');
        $('#modelModal').show();
    });
    
    $('.edit-model').on('click', function() {
        const id = $(this).data('id');
        const row = $(this).closest('tr');
        const modelName = row.find('td:eq(1)').text();
        const status = row.find('.status-icon').hasClass('status-active') ? 'active' : 'inactive';
        
        $('#modelModalTitle').text('编辑型号');
        $('#modelName').val(modelName);
        $('#modelStatus').val(status);
        $('#modelModal').show();
    });
    
    $('#closeModelModal, #cancelModelBtn').on('click', function() {
        $('#modelModal').hide();
    });
    
    $('#saveModelBtn').on('click', function() {
        const modelName = $('#modelName').val().trim();
        const modelStatus = $('#modelStatus').val();
        
        if (!modelName) {
            showToast('请输入型号名称', 'error');
            return;
        }
        
        // 这里应该调用后端API保存数据
        showToast('型号保存成功', 'success');
        $('#modelModal').hide();
    });

    // Part modal functionality
    $('#addPartBtn').on('click', function() {
        $('#partModalTitle').text('新增料号');
        $('#partModel').val($('#modelFilter').val());
        $('#partNumber').val('');
        $('#partStatus').val('active');
        $('#partModal').show();
    });
    
    $('.edit-part').on('click', function() {
        const id = $(this).data('id');
        const row = $(this).closest('tr');
        const model = row.find('td:eq(1)').text();
        const partNumber = row.find('td:eq(2)').text();
        const status = row.find('.status-icon').hasClass('status-active') ? 'active' : 'inactive';
        
        $('#partModalTitle').text('编辑料号');
        $('#partModel option').each(function() {
            if ($(this).text() === model) {
                $(this).prop('selected', true);
            }
        });
        $('#partNumber').val(partNumber);
        $('#partStatus').val(status);
        $('#partModal').show();
    });
    
    $('#closePartModal, #cancelPartBtn').on('click', function() {
        $('#partModal').hide();
    });
    
    $('#savePartBtn').on('click', function() {
        const model = $('#partModel').val();
        const partNumber = $('#partNumber').val().trim();
        const status = $('#partStatus').val();
        
        if (!partNumber) {
            showToast('请输入料号', 'error');
            return;
        }
        
        // 这里应该调用后端API保存数据
        showToast('料号保存成功', 'success');
        $('#partModal').hide();
    });

    // Link modal functionality
    $('.link-part').on('click', function() {
        const id = $(this).data('id');
        const row = $(this).closest('tr');
        const model = row.find('td:eq(1)').text();
        const partNumber = row.find('td:eq(2)').text();
        
        $('#linkModelName').val(model);
        $('#linkPartNumber').val(partNumber);
        $('#linkProduct').val('');
        $('#linkModal').show();
    });
    
    $('#closeLinkModal, #cancelLinkBtn').on('click', function() {
        $('#linkModal').hide();
    });
    
    $('#saveLinkBtn').on('click', function() {
        const linkedProduct = $('#linkProduct').val();
        
        if (!linkedProduct) {
            showToast('请选择关联产品', 'error');
            return;
        }
        
        // 这里应该调用后端API保存关联关系
        showToast('关联保存成功', 'success');
        $('#linkModal').hide();
    });

    // Status toggle functionality
    $('.toggle-status, .toggle-part-status').on('click', function() {
        const id = $(this).data('id');
        const isActive = $(this).data('status') === 'active';
        const type = $(this).hasClass('toggle-status') ? '型号' : '料号';
        const newStatus = isActive ? '下架' : '上架';
        
        if (confirm(`确定要${newStatus}该${type}吗？`)) {
            const row = $(this).closest('tr');
            const statusCell = row.find('td:eq(2)');
            const statusIcon = statusCell.find('.status-icon');
            const statusText = statusCell.find('.status-badge');
            
            if (isActive) {
                statusIcon.removeClass('status-active').addClass('status-inactive');
                $(this).removeClass('button-warning').addClass('button-success');
                $(this).text('上架');
                $(this).data('status', 'inactive');
            } else {
                statusIcon.removeClass('status-inactive').addClass('status-active');
                $(this).removeClass('button-success').addClass('button-warning');
                $(this).text('下架');
                $(this).data('status', 'active');
            }
            
            showToast(`${type}已${newStatus}`, 'success');
        }
    });

    // Delete functionality
    $('.delete-model, .delete-part').on('click', function() {
        const id = $(this).data('id');
        const type = $(this).hasClass('delete-model') ? '型号' : '料号';
        const row = $(this).closest('tr');
        const name = row.find('td:eq(1)').text();
        
        if (confirm(`确定要删除${type} "${name}" 吗？此操作无法撤销。`)) {
            // 这里应该调用后端API删除数据
            row.fadeOut(300, function() {
                $(this).remove();
                showToast(`${type} "${name}" 已删除`, 'success');
            });
        }
    });

    // Filter functionality
    $('#filterBtn').on('click', function() {
        const modelFilter = $('#modelFilter').val();
        const partNumberFilter = $('#partNumberFilter').val();
        
        // 这里应该调用后端API进行筛选
        showToast('筛选条件已应用', 'success');
    });
    
    $('#resetFilterBtn').on('click', function() {
        $('#modelFilter').val('');
        $('#partNumberFilter').val('');
        
        // 这里应该调用后端API重置筛选
        showToast('筛选条件已重置', 'success');
    });

    // Pagination functionality
    $('.pagination .page-item').on('click', function() {
        if ($(this).hasClass('active')) return;
        
        const currentPage = $(this).closest('.pagination').find('.active');
        if (currentPage) {
            currentPage.removeClass('active');
        }
        
        if ($(this).text() !== '«' && $(this).text() !== '»') {
            $(this).addClass('active');
        }
        
        // 这里应该调用后端API获取分页数据
    });
});
</script> 