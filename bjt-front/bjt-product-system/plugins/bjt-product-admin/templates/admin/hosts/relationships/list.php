<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前产品ID和类型
$product_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$product_type = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : '';

// 获取产品信息
$product = BJT_Product_Management::get_instance()->get_product($product_id, $product_type);
?>

<div class="wrap">
    <h2>关联关系管理</h2>
    
    <div class="notice notice-warning">
        <p><i class="dashicons dashicons-info"></i> 修改关联关系将直接影响产品显示和查询结果，请谨慎操作</p>
    </div>
    
    <!-- Level 1 Accessories -->
    <div class="relationship-level">
        <div class="level-header">
            <div class="level-title">
                <span class="level-indicator">一级</span>
                <h3>一级配件</h3>
            </div>
            <button class="btn btn-primary add-accessory" data-level="1">新增一级配件</button>
        </div>
        
        <div class="level-path">
            <strong>路径：</strong> <?php echo esc_html($product->model); ?> <?php echo esc_html($product->name); ?>
        </div>
        
        <div class="table-container">
            <table class="relationship-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="width: 60px;">编号</th>
                        <th>型号</th>
                        <th>料号</th>
                        <th style="width: 150px;">操作</th>
                    </tr>
                </thead>
                <tbody id="level1-accessories">
                    <!-- 一级配件列表将通过AJAX加载 -->
                </tbody>
            </table>
        </div>
        
        <div class="actions-container">
            <button class="btn btn-primary show-next-level" data-level="1">显示下一级配件</button>
        </div>
    </div>
    
    <!-- Level 2 Accessories -->
    <div class="relationship-level" id="level2-container" style="display: none;">
        <div class="level-header">
            <div class="level-title">
                <span class="level-indicator level-2">二级</span>
                <h3>二级配件</h3>
            </div>
            <button class="btn btn-primary add-accessory" data-level="2">新增二级配件</button>
        </div>
        
        <div class="level-path" id="level2-path">
            <!-- 路径将根据选择的一级配件动态更新 -->
        </div>
        
        <div class="table-container">
            <table class="relationship-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="width: 60px;">编号</th>
                        <th>型号</th>
                        <th>料号</th>
                        <th style="width: 150px;">操作</th>
                    </tr>
                </thead>
                <tbody id="level2-accessories">
                    <!-- 二级配件列表将通过AJAX加载 -->
                </tbody>
            </table>
        </div>
        
        <div class="actions-container">
            <button class="btn btn-primary show-next-level" data-level="2">显示下一级配件</button>
        </div>
    </div>
    
    <!-- Level 3 Accessories -->
    <div class="relationship-level" id="level3-container" style="display: none;">
        <div class="level-header">
            <div class="level-title">
                <span class="level-indicator level-3">三级</span>
                <h3>三级配件</h3>
            </div>
            <button class="btn btn-primary add-accessory" data-level="3">新增三级配件</button>
        </div>
        
        <div class="level-path" id="level3-path">
            <!-- 路径将根据选择的二级配件动态更新 -->
        </div>
        
        <div class="table-container">
            <table class="relationship-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="width: 60px;">编号</th>
                        <th>型号</th>
                        <th>料号</th>
                        <th style="width: 150px;">操作</th>
                    </tr>
                </thead>
                <tbody id="level3-accessories">
                    <!-- 三级配件列表将通过AJAX加载 -->
                </tbody>
            </table>
        </div>
        
        <div class="actions-container">
            <button class="btn btn-secondary" disabled>无更多下级配件</button>
        </div>
    </div>
</div>

<!-- Add/Edit Accessory Modal -->
<div class="modal" id="accessoryModal">
    <div class="modal-dialog">
        <div class="modal-header">
            <h4 class="modal-title" id="accessoryModalTitle">新增配件</h4>
            <button class="modal-close" id="closeAccessoryModal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="accessoryForm">
                <input type="hidden" id="accessoryLevel" name="level">
                <input type="hidden" id="parentId" name="parent_id">
                
                <div class="form-group">
                    <label class="form-label">配件类型：</label>
                    <select class="form-control" id="accessoryType" name="type" required>
                        <option value="">请选择配件类型</option>
                        <option value="accessory">配件</option>
                        <option value="consumable">耗材</option>
                        <option value="spare">备件</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">选择配件：</label>
                    <select class="form-control" id="accessorySelect" name="accessory_id" required>
                        <option value="">请先选择配件类型</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">关联说明：</label>
                    <textarea class="form-control" id="relationNote" name="relation_note" rows="3"></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" id="cancelAccessoryBtn">取消</button>
            <button class="btn btn-primary" id="saveAccessoryBtn">保存</button>
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
            <button class="btn btn-secondary" id="cancelConfirmBtn">取消</button>
            <button class="btn btn-danger" id="confirmActionBtn">确认</button>
        </div>
    </div>
</div>

<!-- Toast notification -->
<div class="toast" id="toast">
    <span id="toastMessage">操作成功</span>
</div>

<style>
/* 复用5.html中的样式 */
.relationship-level {
    margin-bottom: 30px;
    border: 1px solid #e1e5eb;
    border-radius: 4px;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.1s;
}

.relationship-level:hover {
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}

.level-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f8f9fa;
    padding: 12px 15px;
    border-bottom: 1px solid #e1e5eb;
}

.level-title {
    display: flex;
    align-items: center;
}

.level-indicator {
    display: inline-block;
    background-color: #1a3c70;
    color: #fff;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 10px;
}

.level-2 {
    background-color: #357ac1;
}

.level-3 {
    background-color: #5896d2;
}

.level-path {
    color: #6c757d;
    font-size: 13px;
    padding: 8px 15px;
    border-bottom: 1px solid #e1e5eb;
    background-color: #fff;
}

.path-separator {
    color: #adb5bd;
    margin: 0 8px;
}

.relationship-table {
    width: 100%;
    border-collapse: collapse;
}

.relationship-table th {
    background-color: #f8f9fa;
    padding: 10px 15px;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border-bottom: 1px solid #e1e5eb;
}

.relationship-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #e1e5eb;
    vertical-align: middle;
}

.relationship-table tr:hover td {
    background-color: #f1f8ff;
}

.relationship-table tr.selected {
    background-color: #e3f2fd;
}

.actions-container {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 15px;
    background-color: #f8f9fa;
    border-top: 1px solid #e1e5eb;
}

.notice {
    background-color: #fff8f8;
    padding: 15px;
    margin-bottom: 25px;
    border-left: 4px solid #ff6b6b;
    border-radius: 0 4px 4px 0;
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
}

.modal-dialog {
    position: relative;
    width: 500px;
    margin: 100px auto;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e1e5eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
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
</style>

<script>
jQuery(document).ready(function($) {
    let currentLevel1Id = null;
    let currentLevel2Id = null;
    
    // 加载一级配件列表
    function loadLevel1Accessories() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_accessories',
                product_id: <?php echo $product_id; ?>,
                product_type: '<?php echo $product_type; ?>',
                level: 1
            },
            success: function(response) {
                if (response.success) {
                    renderAccessories(response.data, '#level1-accessories', 1);
                } else {
                    showToast(response.data || '加载失败', 'error');
                }
            },
            error: function() {
                showToast('加载失败，请重试', 'error');
            }
        });
    }
    
    // 加载二级配件列表
    function loadLevel2Accessories(parentId) {
        if (!parentId) return;
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_accessories',
                parent_id: parentId,
                level: 2
            },
            success: function(response) {
                if (response.success) {
                    renderAccessories(response.data, '#level2-accessories', 2);
                    $('#level2-container').show();
                    updateLevel2Path();
                } else {
                    showToast(response.data || '加载失败', 'error');
                }
            },
            error: function() {
                showToast('加载失败，请重试', 'error');
            }
        });
    }
    
    // 加载三级配件列表
    function loadLevel3Accessories(parentId) {
        if (!parentId) return;
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_accessories',
                parent_id: parentId,
                level: 3
            },
            success: function(response) {
                if (response.success) {
                    renderAccessories(response.data, '#level3-accessories', 3);
                    $('#level3-container').show();
                    updateLevel3Path();
                } else {
                    showToast(response.data || '加载失败', 'error');
                }
            },
            error: function() {
                showToast('加载失败，请重试', 'error');
            }
        });
    }
    
    // 渲染配件列表
    function renderAccessories(accessories, target, level) {
        const tbody = $(target);
        tbody.empty();
        
        if (accessories.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="5" class="text-center">暂无配件</td>
                </tr>
            `);
            return;
        }
        
        accessories.forEach(function(item) {
            tbody.append(`
                <tr>
                    <td>
                        <input type="radio" name="level${level}-accessory" value="${item.id}"
                               ${item.id === (level === 1 ? currentLevel1Id : (level === 2 ? currentLevel2Id : null)) ? 'checked' : ''}>
                    </td>
                    <td>${item.number}</td>
                    <td>${item.model}</td>
                    <td>${item.part_number}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-accessory" data-id="${item.id}" data-level="${level}">
                            编辑
                        </button>
                        <button class="btn btn-sm btn-danger delete-accessory" data-id="${item.id}" data-level="${level}">
                            删除
                        </button>
                    </td>
                </tr>
            `);
        });
    }
    
    // 更新二级配件路径
    function updateLevel2Path() {
        if (!currentLevel1Id) return;
        
        const level1Row = $(`#level1-accessories input[value="${currentLevel1Id}"]`).closest('tr');
        const model = level1Row.find('td:nth-child(3)').text();
        
        $('#level2-path').html(`
            <strong>路径：</strong> 
            <?php echo esc_html($product->model); ?> <?php echo esc_html($product->name); ?>
            <span class="path-separator">&gt;</span>
            ${model}
        `);
    }
    
    // 更新三级配件路径
    function updateLevel3Path() {
        if (!currentLevel1Id || !currentLevel2Id) return;
        
        const level1Row = $(`#level1-accessories input[value="${currentLevel1Id}"]`).closest('tr');
        const level2Row = $(`#level2-accessories input[value="${currentLevel2Id}"]`).closest('tr');
        const level1Model = level1Row.find('td:nth-child(3)').text();
        const level2Model = level2Row.find('td:nth-child(3)').text();
        
        $('#level3-path').html(`
            <strong>路径：</strong> 
            <?php echo esc_html($product->model); ?> <?php echo esc_html($product->name); ?>
            <span class="path-separator">&gt;</span>
            ${level1Model}
            <span class="path-separator">&gt;</span>
            ${level2Model}
        `);
    }
    
    // 显示下一级配件
    $('.show-next-level').on('click', function() {
        const level = $(this).data('level');
        
        if (level === 1) {
            const selectedAccessory = $('input[name="level1-accessory"]:checked');
            if (!selectedAccessory.length) {
                showToast('请先选择一个一级配件', 'error');
                return;
            }
            currentLevel1Id = selectedAccessory.val();
            loadLevel2Accessories(currentLevel1Id);
        } else if (level === 2) {
            const selectedAccessory = $('input[name="level2-accessory"]:checked');
            if (!selectedAccessory.length) {
                showToast('请先选择一个二级配件', 'error');
                return;
            }
            currentLevel2Id = selectedAccessory.val();
            loadLevel3Accessories(currentLevel2Id);
        }
    });
    
    // 新增配件
    $('.add-accessory').on('click', function() {
        const level = $(this).data('level');
        
        if (level === 2 && !currentLevel1Id) {
            showToast('请先选择一个一级配件', 'error');
            return;
        }
        
        if (level === 3 && !currentLevel2Id) {
            showToast('请先选择一个二级配件', 'error');
            return;
        }
        
        $('#accessoryModalTitle').text('新增配件');
        $('#accessoryLevel').val(level);
        $('#parentId').val(level === 2 ? currentLevel1Id : (level === 3 ? currentLevel2Id : ''));
        $('#accessoryForm')[0].reset();
        showModal('#accessoryModal');
    });
    
    // 编辑配件
    $(document).on('click', '.edit-accessory', function() {
        const id = $(this).data('id');
        const level = $(this).data('level');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_accessory_detail',
                accessory_id: id
            },
            success: function(response) {
                if (response.success) {
                    $('#accessoryModalTitle').text('编辑配件');
                    $('#accessoryLevel').val(level);
                    $('#parentId').val(level === 2 ? currentLevel1Id : (level === 3 ? currentLevel2Id : ''));
                    
                    // 填充表单数据
                    $('#accessoryType').val(response.data.type);
                    loadAccessoryOptions(response.data.type, response.data.id);
                    $('#relationNote').val(response.data.relation_note);
                    
                    showModal('#accessoryModal');
                } else {
                    showToast(response.data || '加载失败', 'error');
                }
            },
            error: function() {
                showToast('加载失败，请重试', 'error');
            }
        });
    });
    
    // 删除配件
    $(document).on('click', '.delete-accessory', function() {
        const id = $(this).data('id');
        const level = $(this).data('level');
        
        $('#confirmModalTitle').text('删除配件');
        $('#confirmMessage').text('确定要删除这个配件吗？此操作将同时删除其下级配件，且无法撤销。');
        
        $('#confirmActionBtn').off('click').on('click', function() {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'delete_accessory',
                    accessory_id: id,
                    level: level
                },
                success: function(response) {
                    if (response.success) {
                        showToast('删除成功');
                        hideModal('#confirmModal');
                        
                        // 重新加载对应级别的配件列表
                        if (level === 1) {
                            loadLevel1Accessories();
                            $('#level2-container, #level3-container').hide();
                            currentLevel1Id = null;
                            currentLevel2Id = null;
                        } else if (level === 2) {
                            loadLevel2Accessories(currentLevel1Id);
                            $('#level3-container').hide();
                            currentLevel2Id = null;
                        } else if (level === 3) {
                            loadLevel3Accessories(currentLevel2Id);
                        }
                    } else {
                        showToast(response.data || '删除失败', 'error');
                    }
                },
                error: function() {
                    showToast('删除失败，请重试', 'error');
                }
            });
        });
        
        showModal('#confirmModal');
    });
    
    // 配件类型变更时加载对应的配件选项
    $('#accessoryType').on('change', function() {
        const type = $(this).val();
        if (type) {
            loadAccessoryOptions(type);
        } else {
            $('#accessorySelect').html('<option value="">请先选择配件类型</option>');
        }
    });
    
    // 加载配件选项
    function loadAccessoryOptions(type, selectedId = null) {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_accessory_options',
                type: type
            },
            success: function(response) {
                if (response.success) {
                    const select = $('#accessorySelect');
                    select.empty().append('<option value="">请选择配件</option>');
                    
                    response.data.forEach(function(item) {
                        select.append(`
                            <option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>
                                ${item.model} - ${item.part_number}
                            </option>
                        `);
                    });
                } else {
                    showToast(response.data || '加载失败', 'error');
                }
            },
            error: function() {
                showToast('加载失败，请重试', 'error');
            }
        });
    }
    
    // 保存配件
    $('#saveAccessoryBtn').on('click', function() {
        const form = $('#accessoryForm');
        
        if (!form[0].checkValidity()) {
            showToast('请填写必填项', 'error');
            return;
        }
        
        const formData = new FormData(form[0]);
        formData.append('action', 'save_accessory_relation');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showToast('保存成功');
                    hideModal('#accessoryModal');
                    
                    // 重新加载对应级别的配件列表
                    const level = $('#accessoryLevel').val();
                    if (level === '1') {
                        loadLevel1Accessories();
                    } else if (level === '2') {
                        loadLevel2Accessories(currentLevel1Id);
                    } else if (level === '3') {
                        loadLevel3Accessories(currentLevel2Id);
                    }
                } else {
                    showToast(response.data || '保存失败', 'error');
                }
            },
            error: function() {
                showToast('保存失败，请重试', 'error');
            }
        });
    });
    
    // 监听配件选择变化
    $(document).on('change', 'input[name="level1-accessory"]', function() {
        currentLevel1Id = $(this).val();
        $('#level2-container, #level3-container').hide();
        currentLevel2Id = null;
    });
    
    $(document).on('change', 'input[name="level2-accessory"]', function() {
        currentLevel2Id = $(this).val();
        $('#level3-container').hide();
    });
    
    // Modal 相关函数
    function showModal(selector) {
        $(selector).css('display', 'flex');
    }
    
    function hideModal(selector) {
        $(selector).hide();
    }
    
    // 关闭按钮事件
    $('.modal-close, #cancelAccessoryBtn, #cancelConfirmBtn').on('click', function() {
        hideModal($(this).closest('.modal'));
    });
    
    // Toast 通知
    function showToast(message, type = 'success') {
        const toast = $('#toast');
        const toastMessage = $('#toastMessage');
        
        toastMessage.text(message);
        toast.removeClass().addClass('toast ' + type).addClass('show');
        
        setTimeout(function() {
            toast.removeClass('show');
        }, 3000);
    }
    
    // 初始加载一级配件
    loadLevel1Accessories();
});
</script> 