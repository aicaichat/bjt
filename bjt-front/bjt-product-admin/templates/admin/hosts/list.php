<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取所有主机
$host_manager = BJT_Host_Management::get_instance();
$hosts = $host_manager->get_all_hosts();
?>

<div class="section">
    <div class="section-header">
        <h3 class="section-title">主机型号表</h3>
        <div style="display: flex; gap: 10px;">
            <div class="btn-group">
                <button class="btn btn-info dropdown-toggle" id="exportModelBtn" style="display: flex; align-items: center;">
                    <span style="margin-right: 5px;">导出</span>
                    <span style="font-size: 10px;">▼</span>
                </button>
                <div class="dropdown-menu" id="exportModelDropdown">
                    <a href="#" class="dropdown-item" data-format="excel">Excel</a>
                    <a href="#" class="dropdown-item" data-format="csv">CSV</a>
                    <a href="#" class="dropdown-item" data-format="json">JSON</a>
                </div>
            </div>
            <label for="importModelFile" class="btn btn-success" style="display: flex; align-items: center; margin: 0;">
                <span>导入</span>
                <input type="file" id="importModelFile" accept=".xlsx,.xls,.csv,.json" style="display: none;">
            </label>
            <button class="btn btn-primary" id="addModelBtn">新增</button>
        </div>
    </div>
    <div class="table-container">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col" style="width: 60px;">No</th>
                    <th scope="col">型号名称</th>
                    <th scope="col" style="width: 120px;">爆炸图</th>
                    <th scope="col" style="width: 100px;">状态</th>
                    <th scope="col" style="width: 200px;">操作</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $counter = 1;
                foreach ($hosts as $host): 
                    $status_class = $host->status === 'publish' ? 'status-active' : 'status-inactive';
                    $status_text = $host->status === 'publish' ? '已上架' : '已下架';
                    $status_btn_class = $host->status === 'publish' ? 'btn-warning' : 'btn-success';
                    $status_btn_text = $host->status === 'publish' ? '下架' : '上架';
                ?>
                <tr>
                    <td><?php echo $counter++; ?></td>
                    <td><?php echo esc_html($host->model); ?></td>
                    <td>
                        <?php if (!empty($host->explosion_diagram_pdf)): ?>
                            <a href="<?php echo esc_url($host->explosion_diagram_pdf); ?>" target="_blank" class="btn btn-sm btn-info">
                                <span class="file-upload-icon">📄</span> 查看
                            </a>
                        <?php else: ?>
                            <span class="text-muted">无</span>
                        <?php endif; ?>
                    </td>
                    <td><span class="status-icon <?php echo $status_class; ?>"></span><?php echo $status_text; ?></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-model" data-id="<?php echo $host->id; ?>">编辑</button>
                        <button class="btn btn-sm <?php echo $status_btn_class; ?> toggle-status" data-id="<?php echo $host->id; ?>" data-status="<?php echo $host->status; ?>"><?php echo $status_btn_text; ?></button>
                        <button class="btn btn-sm btn-danger delete-model" data-id="<?php echo $host->id; ?>">删除</button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <div class="tablenav bottom">
        <div class="tablenav-pages">
            <span class="pagination-links">
                <span class="tablenav-pages-navspan button disabled" aria-hidden="true">«</span>
                <span class="tablenav-pages-navspan button current">1</span>
                <a class="page-numbers button" href="#">2</a>
                <a class="page-numbers button" href="#">3</a>
                <a class="next-page button" href="#">»</a>
            </span>
        </div>
    </div>
</div>

<div class="divider"></div>

<div class="section">
    <div class="section-header">
        <h3 class="section-title">料号表</h3>
        <div style="display: flex; gap: 10px;">
            <div class="btn-group">
                <button class="btn btn-info dropdown-toggle" id="exportPartBtn" style="display: flex; align-items: center;">
                    <span style="margin-right: 5px;">导出</span>
                    <span style="font-size: 10px;">▼</span>
                </button>
                <div class="dropdown-menu" id="exportPartDropdown">
                    <a href="#" class="dropdown-item" data-format="excel">Excel</a>
                    <a href="#" class="dropdown-item" data-format="csv">CSV</a>
                    <a href="#" class="dropdown-item" data-format="json">JSON</a>
                </div>
            </div>
            <label for="importPartFile" class="btn btn-success" style="display: flex; align-items: center; margin: 0;">
                <span>导入</span>
                <input type="file" id="importPartFile" accept=".xlsx,.xls,.csv,.json" style="display: none;">
            </label>
            <button class="btn btn-primary" id="addPartBtn">新增</button>
        </div>
    </div>
    <div class="filters">
        <div class="filter-group">
            <label class="filter-label">型号：</label>
            <select class="filter-input" id="modelFilter">
                <option value="">全部</option>
                <?php foreach ($hosts as $host): ?>
                <option value="<?php echo esc_attr($host->model); ?>"><?php echo esc_html($host->model); ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="filter-group">
            <label class="filter-label">料号：</label>
            <input type="text" class="filter-input" placeholder="请输入料号">
        </div>
        <button class="btn btn-primary" id="filterBtn">筛选</button>
        <button class="btn" style="background-color: #6c757d;" id="resetFilterBtn">重置</button>
    </div>
    <div class="table-container">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col" style="width: 60px;">No</th>
                    <th scope="col">型号</th>
                    <th scope="col">料号</th>
                    <th scope="col" style="width: 100px;">状态</th>
                    <th scope="col" style="width: 200px;">操作</th>
                </tr>
            </thead>
            <tbody id="partTableBody">
                <!-- 部件数据将通过AJAX加载 -->
            </tbody>
        </table>
    </div>
    <div class="tablenav bottom">
        <div class="tablenav-pages" id="partPagination">
            <span class="pagination-links">
                <span class="tablenav-pages-navspan button disabled" aria-hidden="true">«</span>
                <span class="tablenav-pages-navspan button current">1</span>
                <a class="next-page button" href="#">»</a>
            </span>
        </div>
    </div>
</div>

<!-- Modal for adding/editing model -->
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
                    <option value="publish">上架</option>
                    <option value="draft">下架</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">爆炸图PDF：</label>
                <div class="file-upload-wrapper">
                    <input type="file" class="form-control" id="explosionDiagramPdf" accept=".pdf">
                    <div id="pdfPreviewContainer" style="display: none; margin-top: 10px;">
                        <div class="file-upload-info">
                            <span class="file-upload-icon">📄</span>
                            <div class="file-upload-info-text">
                                <span id="pdfFileName">文件名称.pdf</span>
                                <a href="#" id="pdfViewLink" target="_blank">查看</a>
                                <button type="button" class="btn btn-sm btn-danger" id="removePdfBtn" style="margin-left: 10px;">删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelModelBtn">取消</button>
            <button class="btn btn-primary" id="saveModelBtn">保存</button>
        </div>
    </div>
</div>

<!-- Modal for adding/editing part -->
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
                    <option value="">-- 请选择型号 --</option>
                    <?php foreach ($hosts as $host): ?>
                    <option value="<?php echo esc_attr($host->model); ?>"><?php echo esc_html($host->model); ?></option>
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
                    <option value="publish">上架</option>
                    <option value="draft">下架</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelPartBtn">取消</button>
            <button class="btn btn-primary" id="savePartBtn">保存</button>
        </div>
    </div>
</div>

<!-- Confirmation Modal -->
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

<!-- Link Part Modal -->
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
                    <option value="product1">产品A</option>
                    <option value="product2">产品B</option>
                    <option value="product3">产品C</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelLinkBtn">取消</button>
            <button class="btn btn-primary" id="saveLinkBtn">保存</button>
        </div>
    </div>
</div>

<!-- Toast notification -->
<div class="toast" id="toast">
    <span id="toastMessage">操作成功</span>
</div>

<!-- Import Modal -->
<div class="modal" id="importModal">
    <div class="modal-dialog import-modal">
        <div class="modal-header">
            <h4 class="modal-title" id="importModalTitle">导入数据</h4>
            <button class="modal-close" id="closeImportModal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-warning">
                <p>请确保您的导入文件格式正确。系统支持以下格式：</p>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Excel文件（.xlsx, .xls）</li>
                    <li>CSV文件（.csv）</li>
                    <li>JSON文件（.json）</li>
                </ul>
            </div>
            
            <div id="fileUploadInfoContainer" style="display: none;">
                <div class="file-upload-info">
                    <span class="file-upload-icon">📄</span>
                    <div class="file-upload-info-text">
                        <span id="uploadFileName">file.xlsx</span>
                        <div style="font-size: 12px; color: #6c757d;" id="uploadFileSize">1.2 MB</div>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">验证模式：</label>
                <select class="form-control" id="importValidationMode">
                    <option value="strict">严格模式（遇到错误停止导入）</option>
                    <option value="loose" selected>宽松模式（跳过错误继续导入）</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">冲突处理：</label>
                <select class="form-control" id="importConflictMode">
                    <option value="skip">跳过已存在的记录</option>
                    <option value="update" selected>更新已存在的记录</option>
                    <option value="replace">删除并重新创建记录</option>
                </select>
            </div>
            
            <div class="import-progress" id="importProgress">
                <div class="import-progress-bar">
                    <div class="import-progress-value" id="importProgressValue"></div>
                </div>
                <div class="import-status">
                    <span id="importProgressText">处理中...</span>
                    <span id="importProgressPercentage">0%</span>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn" style="background-color: #6c757d;" id="cancelImportBtn">取消</button>
            <button class="btn btn-primary" id="startImportBtn">开始导入</button>
        </div>
    </div>
</div>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.section {
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    padding: 20px;
    margin-bottom: 30px;
}

.section-header {
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

.btn {
    padding: 8px 16px;
    background-color: #1a3c70;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: background-color 0.2s;
}

.btn:hover {
    background-color: #15305b;
}

.btn:active {
    transform: translateY(1px);
}

.btn-primary {
    background-color: #1a3c70;
}

.btn-danger {
    background-color: #dc3545;
}

.btn-warning {
    background-color: #ffc107;
    color: #212529;
}

.btn-success {
    background-color: #28a745;
}

.btn-info {
    background-color: #17a2b8;
}

.btn-sm {
    padding: 5px 10px;
    font-size: 12px;
}

.btn-link {
    background: none;
    color: #1a3c70;
    text-decoration: underline;
    padding: 0;
}

.divider {
    height: 1px;
    background-color: #e1e5eb;
    margin: 30px 0;
}

.table-container {
    width: 100%;
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th {
    text-align: left;
    padding: 12px 15px;
    background-color: #f8f9fa;
    border-bottom: 2px solid #e1e5eb;
    font-weight: 600;
    color: #495057;
}

td {
    padding: 12px 15px;
    border-bottom: 1px solid #e1e5eb;
    color: #212529;
}

tr:hover {
    background-color: #f8f9fa;
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

.filter-input:focus {
    outline: none;
    border-color: #4dabf7;
    box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
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

/* Modal styles */
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

.import-modal {
    max-width: 600px;
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

.alert {
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 4px;
    border-left: 4px solid;
}

.alert-warning {
    background-color: #fff3cd;
    border-color: #ffc107;
    color: #856404;
}

.alert-danger {
    background-color: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
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

.toast.warning {
    background-color: #ffc107;
    color: #212529;
}

.toast.info {
    background-color: #17a2b8;
    color: white;
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

/* Dropdown menu styles */
.btn-group {
    position: relative;
    display: inline-flex;
}

.dropdown-toggle {
    position: relative;
    cursor: pointer;
}

.dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    min-width: 10rem;
    padding: 0.5rem 0;
    margin: 0.125rem 0 0;
    font-size: 14px;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0,0,0,0.15);
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.175);
}

.dropdown-menu.show {
    display: block;
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 0.5rem 1.5rem;
    clear: both;
    font-weight: 400;
    color: #212529;
    text-align: inherit;
    white-space: nowrap;
    background-color: transparent;
    border: 0;
    text-decoration: none;
}

.dropdown-item:hover, .dropdown-item:focus {
    color: #16181b;
    text-decoration: none;
    background-color: #f8f9fa;
}

.import-progress {
    margin-top: 20px;
    display: none;
}

.import-progress-bar {
    height: 5px;
    background-color: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 5px;
}

.import-progress-value {
    height: 100%;
    background-color: #1a3c70;
    width: 0;
    transition: width 0.3s;
}

.import-status {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6c757d;
}

.file-upload-info {
    display: flex;
    align-items: center;
    padding: 10px;
    background-color: #f8f9fa;
    border: 1px solid #e1e5eb;
    border-radius: 4px;
    margin-bottom: 10px;
}

.file-upload-info-text {
    flex: 1;
    margin-left: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-upload-icon {
    font-size: 20px;
    color: #6c757d;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Menu toggle functionality for expandable menus
    document.querySelectorAll('.expandable').forEach(item => {
        item.addEventListener('click', event => {
            const submenu = item.nextElementSibling;
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('active');
                item.classList.toggle('active');
            }
            event.preventDefault();
        });
    });

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

    // Modal functionality
    const modelModal = document.getElementById('modelModal');
    const partModal = document.getElementById('partModal');
    const confirmModal = document.getElementById('confirmModal');
    const linkModal = document.getElementById('linkModal');
    const importModal = document.getElementById('importModal');

    // Show/hide modals
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Model modal
    document.getElementById('addModelBtn').addEventListener('click', () => {
        // 重定向到编辑页面
        window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-admin-hosts&action=edit'); ?>';
    });

    document.getElementById('closeModelModal').addEventListener('click', () => {
        hideModal(modelModal);
    });

    document.getElementById('cancelModelBtn').addEventListener('click', () => {
        hideModal(modelModal);
    });

    document.getElementById('saveModelBtn').addEventListener('click', () => {
        const modelName = document.getElementById('modelName').value;
        const modelStatus = document.getElementById('modelStatus').value;
        
        if (!modelName.trim()) {
            showToast('请输入型号名称', 'error');
            return;
        }
        
        // 准备保存数据
        const saveData = {
            action: 'bjt_save_host',
            nonce: '<?php echo wp_create_nonce('bjt_save_host'); ?>',
            model: modelName,
            status: modelStatus
        };
        
        // 如果有上传PDF文件，添加PDF URL
        if (pdfUploadUrl) {
            saveData.explosion_diagram_pdf = pdfUploadUrl;
        }
        
        // AJAX请求保存型号
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: saveData,
            success: function(response) {
                if (response.success) {
                    hideModal(modelModal);
                    showToast('型号保存成功', 'success');
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    showToast('保存失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('保存请求失败，请重试', 'error');
            }
        });
    });

    // Part modal
    document.getElementById('addPartBtn').addEventListener('click', () => {
        document.getElementById('partModalTitle').textContent = '新增料号';
        document.getElementById('partModel').value = '';
        document.getElementById('partNumber').value = '';
        document.getElementById('partStatus').value = 'publish';
        showModal(partModal);
    });

    document.getElementById('closePartModal').addEventListener('click', () => {
        hideModal(partModal);
    });

    document.getElementById('cancelPartBtn').addEventListener('click', () => {
        hideModal(partModal);
    });

    document.getElementById('savePartBtn').addEventListener('click', () => {
        const partModel = document.getElementById('partModel').value;
        const partNumber = document.getElementById('partNumber').value;
        const partStatus = document.getElementById('partStatus').value;
        
        if (!partModel) {
            showToast('请选择型号', 'error');
            return;
        }
        
        if (!partNumber.trim()) {
            showToast('请输入料号', 'error');
            return;
        }
        
        // AJAX请求保存料号
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_save_part',
                nonce: '<?php echo wp_create_nonce('bjt_save_part'); ?>',
                model: partModel,
                part_number: partNumber,
                status: partStatus
            },
            success: function(response) {
                if (response.success) {
                    hideModal(partModal);
                    showToast('料号保存成功', 'success');
                    loadPartsByModel(partModel);
                } else {
                    showToast('保存失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('保存请求失败，请重试', 'error');
            }
        });
    });

    // Confirm modal
    document.getElementById('closeConfirmModal').addEventListener('click', () => {
        hideModal(confirmModal);
    });

    document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
        hideModal(confirmModal);
    });

    // Link modal
    document.getElementById('closeLinkModal').addEventListener('click', () => {
        hideModal(linkModal);
    });

    document.getElementById('cancelLinkBtn').addEventListener('click', () => {
        hideModal(linkModal);
    });

    document.getElementById('saveLinkBtn').addEventListener('click', () => {
        const linkedProduct = document.getElementById('linkProduct').value;
        const modelName = document.getElementById('linkModelName').value;
        const partNumber = document.getElementById('linkPartNumber').value;
        
        if (!linkedProduct) {
            showToast('请选择关联产品', 'error');
            return;
        }
        
        // AJAX请求保存关联
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_link_part_product',
                nonce: '<?php echo wp_create_nonce('bjt_link_part_product'); ?>',
                model: modelName,
                part_number: partNumber,
                product: linkedProduct
            },
            success: function(response) {
                if (response.success) {
                    hideModal(linkModal);
                    showToast('关联保存成功', 'success');
                } else {
                    showToast('保存失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('保存请求失败，请重试', 'error');
            }
        });
    });

    // Handle model table actions
    document.querySelectorAll('.edit-model').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            
            // AJAX请求获取型号详情
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'bjt_get_host',
                    nonce: '<?php echo wp_create_nonce('bjt_get_host'); ?>',
                    id: id
                },
                success: function(response) {
                    if (response.success) {
                        const host = response.data;
                        document.getElementById('modelModalTitle').textContent = '编辑型号';
                        document.getElementById('modelName').value = host.model;
                        document.getElementById('modelStatus').value = host.status;
                        
                        // 显示PDF文件（如果有）
                        if (host.explosion_diagram_pdf) {
                            pdfUploadUrl = host.explosion_diagram_pdf;
                            document.getElementById('pdfFileName').textContent = host.explosion_diagram_pdf.split('/').pop();
                            document.getElementById('pdfViewLink').href = host.explosion_diagram_pdf;
                            document.getElementById('pdfPreviewContainer').style.display = 'block';
                        } else {
                            document.getElementById('pdfPreviewContainer').style.display = 'none';
                            pdfUploadUrl = null;
                        }
                        
                        showModal(modelModal);
                    } else {
                        showToast('获取型号详情失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                    }
                },
                error: function() {
                    showToast('请求失败，请重试', 'error');
                }
            });
        });
    });

    document.querySelectorAll('.delete-model').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const row = this.closest('tr');
            const model = row.cells[1].textContent;
            
            document.getElementById('confirmModalTitle').textContent = '删除型号';
            document.getElementById('confirmMessage').textContent = `您确定要删除型号 "${model}" 吗？此操作无法撤销。`;
            
            document.getElementById('confirmActionBtn').onclick = function() {
                // AJAX请求删除型号
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_delete_host',
                        nonce: '<?php echo wp_create_nonce('bjt_delete_host'); ?>',
                        id: id
                    },
                    success: function(response) {
                        if (response.success) {
                            hideModal(confirmModal);
                            showToast(`型号 "${model}" 已删除`, 'success');
                            row.remove();
                        } else {
                            hideModal(confirmModal);
                            showToast('删除失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                        }
                    },
                    error: function() {
                        hideModal(confirmModal);
                        showToast('删除请求失败，请重试', 'error');
                    }
                });
            };
            
            showModal(confirmModal);
        });
    });

    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const currentStatus = this.getAttribute('data-status');
            const row = this.closest('tr');
            const model = row.cells[1].textContent;
            
            const newStatus = currentStatus === 'publish' ? 'draft' : 'publish';
            const statusAction = newStatus === 'publish' ? '上架' : '下架';
            
            document.getElementById('confirmModalTitle').textContent = `${statusAction}型号`;
            document.getElementById('confirmMessage').textContent = `您确定要${statusAction}型号 "${model}" 吗？`;
            
            document.getElementById('confirmActionBtn').onclick = function() {
                // AJAX请求更新状态
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_update_host_status',
                        nonce: '<?php echo wp_create_nonce('bjt_update_host_status'); ?>',
                        id: id,
                        status: newStatus
                    },
                    success: function(response) {
                        if (response.success) {
                            hideModal(confirmModal);
                            showToast(`型号 "${model}" 已${statusAction}`, 'success');
                            
                            // Update UI
                            const statusCell = row.cells[2];
                            const statusIcon = statusCell.querySelector('.status-icon');
                            
                            if (newStatus === 'publish') {
                                statusIcon.classList.remove('status-inactive');
                                statusIcon.classList.add('status-active');
                                statusCell.childNodes[1].textContent = '已上架';
                                btn.textContent = '下架';
                                btn.classList.remove('btn-success');
                                btn.classList.add('btn-warning');
                            } else {
                                statusIcon.classList.remove('status-active');
                                statusIcon.classList.add('status-inactive');
                                statusCell.childNodes[1].textContent = '已下架';
                                btn.textContent = '上架';
                                btn.classList.remove('btn-warning');
                                btn.classList.add('btn-success');
                            }
                            
                            btn.setAttribute('data-status', newStatus);
                        } else {
                            hideModal(confirmModal);
                            showToast('状态更新失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                        }
                    },
                    error: function() {
                        hideModal(confirmModal);
                        showToast('请求失败，请重试', 'error');
                    }
                });
            };
            
            showModal(confirmModal);
        });
    });

    // Load parts function
    function loadPartsByModel(model) {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_get_parts_by_model',
                nonce: '<?php echo wp_create_nonce('bjt_get_parts_by_model'); ?>',
                model: model
            },
            success: function(response) {
                if (response.success) {
                    displayParts(response.data);
                } else {
                    showToast('获取料号失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('请求失败，请重试', 'error');
            }
        });
    }

    // Display parts in table
    function displayParts(parts) {
        const tbody = document.getElementById('partTableBody');
        tbody.innerHTML = '';
        
        if (parts.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" style="text-align: center;">没有找到料号</td>';
            tbody.appendChild(tr);
            return;
        }
        
        parts.forEach((part, index) => {
            const tr = document.createElement('tr');
            
            const statusClass = part.status === 'publish' ? 'status-active' : 'status-inactive';
            const statusText = part.status === 'publish' ? '已上架' : '已下架';
            const statusBtnClass = part.status === 'publish' ? 'btn-warning' : 'btn-success';
            const statusBtnText = part.status === 'publish' ? '下架' : '上架';
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${part.model}</td>
                <td>${part.part_number}</td>
                <td><span class="status-icon ${statusClass}"></span>${statusText}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-part" data-id="${part.id}">编辑</button>
                    <button class="btn btn-sm ${statusBtnClass} toggle-part-status" data-id="${part.id}" data-status="${part.status}">${statusBtnText}</button>
                    <button class="btn btn-sm btn-info link-part" data-id="${part.id}" data-model="${part.model}" data-part="${part.part_number}">关联</button>
                    <button class="btn btn-sm btn-danger delete-part" data-id="${part.id}">删除</button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Attach event handlers to new buttons
        attachPartButtonHandlers();
    }

    // Attach event handlers to part buttons
    function attachPartButtonHandlers() {
        // Edit part
        document.querySelectorAll('.edit-part').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_get_part',
                        nonce: '<?php echo wp_create_nonce('bjt_get_part'); ?>',
                        id: id
                    },
                    success: function(response) {
                        if (response.success) {
                            const part = response.data;
                            document.getElementById('partModalTitle').textContent = '编辑料号';
                            document.getElementById('partModel').value = part.model;
                            document.getElementById('partNumber').value = part.part_number;
                            document.getElementById('partStatus').value = part.status;
                            showModal(partModal);
                        } else {
                            showToast('获取料号详情失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                        }
                    },
                    error: function() {
                        showToast('请求失败，请重试', 'error');
                    }
                });
            });
        });

        // Delete part
        document.querySelectorAll('.delete-part').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const row = this.closest('tr');
                const partNumber = row.cells[2].textContent;
                
                document.getElementById('confirmModalTitle').textContent = '删除料号';
                document.getElementById('confirmMessage').textContent = `您确定要删除料号 "${partNumber}" 吗？此操作无法撤销。`;
                
                document.getElementById('confirmActionBtn').onclick = function() {
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'bjt_delete_part',
                            nonce: '<?php echo wp_create_nonce('bjt_delete_part'); ?>',
                            id: id
                        },
                        success: function(response) {
                            if (response.success) {
                                hideModal(confirmModal);
                                showToast(`料号 "${partNumber}" 已删除`, 'success');
                                row.remove();
                            } else {
                                hideModal(confirmModal);
                                showToast('删除失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                            }
                        },
                        error: function() {
                            hideModal(confirmModal);
                            showToast('请求失败，请重试', 'error');
                        }
                    });
                };
                
                showModal(confirmModal);
            });
        });

        // Toggle part status
        document.querySelectorAll('.toggle-part-status').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status');
                const row = this.closest('tr');
                const partNumber = row.cells[2].textContent;
                
                const newStatus = currentStatus === 'publish' ? 'draft' : 'publish';
                const statusAction = newStatus === 'publish' ? '上架' : '下架';
                
                document.getElementById('confirmModalTitle').textContent = `${statusAction}料号`;
                document.getElementById('confirmMessage').textContent = `您确定要${statusAction}料号 "${partNumber}" 吗？`;
                
                document.getElementById('confirmActionBtn').onclick = function() {
                    $.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'bjt_update_part_status',
                            nonce: '<?php echo wp_create_nonce('bjt_update_part_status'); ?>',
                            id: id,
                            status: newStatus
                        },
                        success: function(response) {
                            if (response.success) {
                                hideModal(confirmModal);
                                showToast(`料号 "${partNumber}" 已${statusAction}`, 'success');
                                
                                // Update UI
                                const statusCell = row.cells[3];
                                const statusIcon = statusCell.querySelector('.status-icon');
                                
                                if (newStatus === 'publish') {
                                    statusIcon.classList.remove('status-inactive');
                                    statusIcon.classList.add('status-active');
                                    statusCell.childNodes[1].textContent = '已上架';
                                    btn.textContent = '下架';
                                    btn.classList.remove('btn-success');
                                    btn.classList.add('btn-warning');
                                } else {
                                    statusIcon.classList.remove('status-active');
                                    statusIcon.classList.add('status-inactive');
                                    statusCell.childNodes[1].textContent = '已下架';
                                    btn.textContent = '上架';
                                    btn.classList.remove('btn-warning');
                                    btn.classList.add('btn-success');
                                }
                                
                                btn.setAttribute('data-status', newStatus);
                            } else {
                                hideModal(confirmModal);
                                showToast('状态更新失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                            }
                        },
                        error: function() {
                            hideModal(confirmModal);
                            showToast('请求失败，请重试', 'error');
                        }
                    });
                };
                
                showModal(confirmModal);
            });
        });

        // Link part to product
        document.querySelectorAll('.link-part').forEach(btn => {
            btn.addEventListener('click', function() {
                const modelName = this.getAttribute('data-model');
                const partNumber = this.getAttribute('data-part');
                
                document.getElementById('linkModelName').value = modelName;
                document.getElementById('linkPartNumber').value = partNumber;
                document.getElementById('linkProduct').value = '';
                
                showModal(linkModal);
            });
        });
    }

    // Filter functionality
    document.getElementById('filterBtn').addEventListener('click', function() {
        const modelFilter = document.getElementById('modelFilter').value;
        const partNumberFilter = document.querySelector('.filter-input[placeholder="请输入料号"]').value;
        
        loadFilteredParts(modelFilter, partNumberFilter);
    });

    function loadFilteredParts(model, partNumber) {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_filter_parts',
                nonce: '<?php echo wp_create_nonce('bjt_filter_parts'); ?>',
                model: model,
                part_number: partNumber
            },
            success: function(response) {
                if (response.success) {
                    displayParts(response.data);
                    showToast('筛选条件已应用', 'success');
                } else {
                    showToast('筛选失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('请求失败，请重试', 'error');
            }
        });
    }

    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        document.getElementById('modelFilter').value = '';
        document.querySelector('.filter-input[placeholder="请输入料号"]').value = '';
        
        loadFilteredParts('', '');
        showToast('筛选条件已重置', 'success');
    });

    // Pagination functionality
    document.querySelectorAll('.pagination .page-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            const currentPage = this.closest('.pagination').querySelector('.active');
            if (currentPage) currentPage.classList.remove('active');
            
            if (this.textContent !== '«' && this.textContent !== '»') {
                this.classList.add('active');
            }
            
            // Page change logic would go here
        });
    });
    
    // -------------------------------
    // Import/Export Functionality
    // -------------------------------
    
    // Export Dropdowns
    const exportModelBtn = document.getElementById('exportModelBtn');
    const exportModelDropdown = document.getElementById('exportModelDropdown');
    const exportPartBtn = document.getElementById('exportPartBtn');
    const exportPartDropdown = document.getElementById('exportPartDropdown');
    
    // Toggle export model dropdown
    exportModelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportModelDropdown.classList.toggle('show');
        // Close other dropdowns
        exportPartDropdown.classList.remove('show');
    });
    
    // Toggle export part dropdown
    exportPartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportPartDropdown.classList.toggle('show');
        // Close other dropdowns
        exportModelDropdown.classList.remove('show');
    });
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!exportModelBtn.contains(e.target) && !exportModelDropdown.contains(e.target)) {
            exportModelDropdown.classList.remove('show');
        }
        
        if (!exportPartBtn.contains(e.target) && !exportPartDropdown.contains(e.target)) {
            exportPartDropdown.classList.remove('show');
        }
    });
    
    // Export Model Options
    exportModelDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const format = this.getAttribute('data-format');
            exportData('models', format);
            exportModelDropdown.classList.remove('show');
        });
    });
    
    // Export Part Options
    exportPartDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const format = this.getAttribute('data-format');
            exportData('parts', format);
            exportPartDropdown.classList.remove('show');
        });
    });
    
    // Function to handle exporting data
    function exportData(type, format) {
        showToast(`准备导出${type === 'models' ? '型号' : '料号'}数据为${format.toUpperCase()}格式`, 'info');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'bjt_export_data',
                nonce: '<?php echo wp_create_nonce('bjt_export_data'); ?>',
                type: type,
                format: format
            },
            success: function(response) {
                if (response.success) {
                    // Create a temporary link to download the file
                    const link = document.createElement('a');
                    link.href = response.data.url;
                    link.download = response.data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast(`${type === 'models' ? '型号' : '料号'}数据已成功导出为${format.toUpperCase()}格式`, 'success');
                } else {
                    showToast('导出失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('导出请求失败，请重试', 'error');
            }
        });
    }
    
    // Import file handling
    const importModelFile = document.getElementById('importModelFile');
    const importPartFile = document.getElementById('importPartFile');
    const closeImportModal = document.getElementById('closeImportModal');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const startImportBtn = document.getElementById('startImportBtn');
    const importProgress = document.getElementById('importProgress');
    const importProgressValue = document.getElementById('importProgressValue');
    const importProgressText = document.getElementById('importProgressText');
    const importProgressPercentage = document.getElementById('importProgressPercentage');
    const fileUploadInfoContainer = document.getElementById('fileUploadInfoContainer');
    const uploadFileName = document.getElementById('uploadFileName');
    const uploadFileSize = document.getElementById('uploadFileSize');
    
    let currentImportType = null;
    let currentImportFile = null;
    
    // Import model file
    importModelFile.addEventListener('change', function() {
        if (this.files.length > 0) {
            currentImportType = 'models';
            currentImportFile = this.files[0];
            prepareImport(currentImportFile, '型号数据');
        }
    });
    
    // Import part file
    importPartFile.addEventListener('change', function() {
        if (this.files.length > 0) {
            currentImportType = 'parts';
            currentImportFile = this.files[0];
            prepareImport(currentImportFile, '料号数据');
        }
    });
    
    // Close import modal
    closeImportModal.addEventListener('click', () => {
        hideModal(importModal);
        resetImportState();
    });
    
    // Cancel import
    cancelImportBtn.addEventListener('click', () => {
        hideModal(importModal);
        resetImportState();
    });
    
    // Start import
    startImportBtn.addEventListener('click', () => {
        if (!currentImportFile) {
            showToast('请选择要导入的文件', 'error');
            return;
        }
        
        const validationMode = document.getElementById('importValidationMode').value;
        const conflictMode = document.getElementById('importConflictMode').value;
        
        startImport(currentImportType, currentImportFile, validationMode, conflictMode);
    });
    
    // Function to prepare import
    function prepareImport(file, typeText) {
        // Display file info
        uploadFileName.textContent = file.name;
        uploadFileSize.textContent = formatFileSize(file.size);
        fileUploadInfoContainer.style.display = 'block';
        
        // Reset progress
        resetImportProgress();
        
        // Update modal title
        document.getElementById('importModalTitle').textContent = `导入${typeText}`;
        
        // Show modal
        showModal(importModal);
    }
    
    // Function to start import
    function startImport(type, file, validationMode, conflictMode) {
        // Show progress
        importProgress.style.display = 'block';
        startImportBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('action', 'bjt_import_data');
        formData.append('nonce', '<?php echo wp_create_nonce('bjt_import_data'); ?>');
        formData.append('type', type);
        formData.append('file', file);
        formData.append('validation_mode', validationMode);
        formData.append('conflict_mode', conflictMode);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(evt) {
                    if (evt.lengthComputable) {
                        const percentComplete = Math.round((evt.loaded / evt.total) * 100);
                        updateImportProgress(percentComplete, '上传文件中...');
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    // Simulate processing progress
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 5;
                        
                        if (progress < 30) {
                            updateImportProgress(progress, '解析文件中...');
                        } else if (progress < 60) {
                            updateImportProgress(progress, '验证数据中...');
                        } else if (progress < 90) {
                            updateImportProgress(progress, '导入数据中...');
                        } else {
                            updateImportProgress(progress, '完成导入');
                        }
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                                hideModal(importModal);
                                resetImportState();
                                showToast(`${type === 'models' ? '型号' : '料号'}数据导入成功`, 'success');
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            }, 500);
                        }
                    }, 200);
                } else {
                    updateImportProgress(100, '导入失败');
                    showToast('导入失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                    setTimeout(() => {
                        resetImportProgress();
                    }, 2000);
                }
            },
            error: function() {
                updateImportProgress(100, '导入失败');
                showToast('导入请求失败，请重试', 'error');
                setTimeout(() => {
                    resetImportProgress();
                }, 2000);
            }
        });
    }
    
    // Update import progress
    function updateImportProgress(percent, text) {
        importProgressValue.style.width = percent + '%';
        importProgressText.textContent = text;
        importProgressPercentage.textContent = percent + '%';
    }
    
    // Reset import progress
    function resetImportProgress() {
        importProgress.style.display = 'none';
        importProgressValue.style.width = '0%';
        importProgressText.textContent = '处理中...';
        importProgressPercentage.textContent = '0%';
        startImportBtn.disabled = false;
    }
    
    // Reset import state
    function resetImportState() {
        resetImportProgress();
        fileUploadInfoContainer.style.display = 'none';
        importModelFile.value = '';
        importPartFile.value = '';
        currentImportType = null;
        currentImportFile = null;
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Initialize: load parts for the first model if available
    if (document.getElementById('modelFilter').options.length > 1) {
        const firstModel = document.getElementById('modelFilter').options[1].value;
        document.getElementById('modelFilter').value = firstModel;
        loadPartsByModel(firstModel);
    } else {
        loadFilteredParts('', '');
    }

    // PDF 文件上传相关变量
    let pdfFile = null;
    let pdfUploadUrl = null;
    
    // 监听PDF文件上传
    document.getElementById('explosionDiagramPdf').addEventListener('change', function(e) {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.type !== 'application/pdf') {
                showToast('请上传PDF格式的文件', 'error');
                this.value = '';
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB
                showToast('文件大小不能超过10MB', 'error');
                this.value = '';
                return;
            }
            
            pdfFile = file;
            document.getElementById('pdfFileName').textContent = file.name;
            document.getElementById('pdfPreviewContainer').style.display = 'block';
            
            // 先上传PDF获取URL
            uploadPdfFile(file);
        }
    });
    
    // 删除PDF文件
    document.getElementById('removePdfBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('explosionDiagramPdf').value = '';
        document.getElementById('pdfPreviewContainer').style.display = 'none';
        pdfFile = null;
        pdfUploadUrl = null;
    });
    
    // 上传PDF文件
    function uploadPdfFile(file) {
        const formData = new FormData();
        formData.append('action', 'bjt_upload_explosion_diagram');
        formData.append('nonce', '<?php echo wp_create_nonce('bjt_upload_explosion_diagram'); ?>');
        formData.append('pdf_file', file);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    pdfUploadUrl = response.data.url;
                    document.getElementById('pdfViewLink').href = pdfUploadUrl;
                    showToast('PDF文件上传成功', 'success');
                } else {
                    showToast('PDF上传失败: ' + (response.data ? response.data.message : '未知错误'), 'error');
                }
            },
            error: function() {
                showToast('PDF上传请求失败，请重试', 'error');
            }
        });
    }
});
</script> 