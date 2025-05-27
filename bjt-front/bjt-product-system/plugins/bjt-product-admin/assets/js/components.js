/**
 * BJT组件功能
 * 
 * 包含表格、表单和上传组件的JavaScript功能
 */

(function($) {
    'use strict';

    // 确保全局命名空间存在
    window.BJT = window.BJT || {};
    
    /**
     * 组件管理器
     */
    BJT.Components = {
        /**
         * 初始化所有组件
         */
        init: function() {
            this.initTables();
            this.initForms();
            this.initUploads();
            
            // 添加调试日志（在开发环境下）
            if (typeof bjtAdmin !== 'undefined' && bjtAdmin.debug) {
                console.log('BJT组件已初始化');
            }
        },
        
        /**
         * 初始化表格组件
         */
        initTables: function() {
            $('.bjt-table-component').each(function() {
                const $table = $(this);
                const tableId = $table.attr('id').replace('-container', '');
                
                // 已经在各个表格内部初始化了，这里可以添加全局行为
                $table.on('bjt:table:sort bjt:table:page bjt:table:filter', function(e, data) {
                    // 如果页面上有定义表格处理函数，则调用它
                    if (window[tableId + 'Handler'] && typeof window[tableId + 'Handler'][e.type.split(':')[2]] === 'function') {
                        window[tableId + 'Handler'][e.type.split(':')[2]](data);
                    } else {
                        // 默认行为 - 触发AJAX请求重新加载表格
                        BJT.Components.reloadTable(tableId, data);
                    }
                });
                
                // 导出功能处理
                $table.on('bjt:table:export', function(e, data) {
                    if (window[tableId + 'Handler'] && typeof window[tableId + 'Handler'].export === 'function') {
                        window[tableId + 'Handler'].export(data);
                    } else {
                        BJT.Components.exportTable(tableId, data.format);
                    }
                });
                
                // 导入功能处理
                $table.on('bjt:table:import', function(e, data) {
                    if (window[tableId + 'Handler'] && typeof window[tableId + 'Handler'].import === 'function') {
                        window[tableId + 'Handler'].import(data);
                    } else {
                        BJT.Components.importTable(tableId, data.file, data.content);
                    }
                });
                
                // 操作按钮处理
                $table.on('bjt:table:action', function(e, data) {
                    if (window[tableId + 'Handler'] && typeof window[tableId + 'Handler'][data.action] === 'function') {
                        window[tableId + 'Handler'][data.action](data.id);
                    } else {
                        BJT.Components.handleTableAction(tableId, data.action, data.id);
                    }
                });
                
                // 添加按钮处理
                $table.on('bjt:table:add', function() {
                    if (window[tableId + 'Handler'] && typeof window[tableId + 'Handler'].add === 'function') {
                        window[tableId + 'Handler'].add();
                    }
                });
            });
        },
        
        /**
         * 初始化表单组件
         */
        initForms: function() {
            $('.bjt-form-component').each(function() {
                const $form = $(this);
                const formId = $form.attr('id').replace('-container', '');
                
                // 语言切换功能已在各表单内部实现
                
                // 表单验证和提交处理
                $form.on('bjt:form:validate', function(e, data) {
                    if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].validate === 'function') {
                        return window[formId + 'Handler'].validate(data);
                    }
                });
                
                // 表单语言切换
                $form.on('bjt:form:langChange', function(e, data) {
                    if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].langChange === 'function') {
                        window[formId + 'Handler'].langChange(data.lang);
                    }
                });
                
                // 文件删除
                $form.on('bjt:form:fileRemove', function(e, data) {
                    if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].fileRemove === 'function') {
                        window[formId + 'Handler'].fileRemove(data.field);
                    }
                });
                
                // AJAX表单提交
                if ($form.hasClass('ajax-form')) {
                    $form.find('form').on('submit', function(e) {
                        e.preventDefault();
                        
                        const $submitForm = $(this);
                        const formData = new FormData($submitForm[0]);
                        
                        // 禁用提交按钮
                        const $submitBtn = $submitForm.find('[type="submit"]');
                        const originalText = $submitBtn.text();
                        $submitBtn.prop('disabled', true).text('提交中...');
                        
                        // 添加操作和安全检查
                        formData.append('action', 'bjt_submit_form');
                        formData.append('form_id', formId);
                        formData.append('security', bjtAdmin.security);
                        
                        // 发送AJAX请求
                        $.ajax({
                            url: bjtAdmin.ajax_url,
                            type: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false,
                            success: function(response) {
                                // 恢复提交按钮
                                $submitBtn.prop('disabled', false).text(originalText);
                                
                                if (response.success) {
                                    // 调用成功处理程序
                                    if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].submitSuccess === 'function') {
                                        window[formId + 'Handler'].submitSuccess(response.data);
                                    } else {
                                        BJT.Components.handleFormSuccess(formId, response.data);
                                    }
                                } else {
                                    // 调用失败处理程序
                                    if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].submitError === 'function') {
                                        window[formId + 'Handler'].submitError(response.data);
                                    } else {
                                        BJT.Components.handleFormError(formId, response.data);
                                    }
                                }
                            },
                            error: function(xhr, status, error) {
                                // 恢复提交按钮
                                $submitBtn.prop('disabled', false).text(originalText);
                                
                                // 处理AJAX错误
                                if (window[formId + 'Handler'] && typeof window[formId + 'Handler'].submitError === 'function') {
                                    window[formId + 'Handler'].submitError({ message: '提交请求失败: ' + error });
                                } else {
                                    BJT.Components.handleFormError(formId, { message: '提交请求失败: ' + error });
                                }
                            }
                        });
                    });
                }
            });
        },
        
        /**
         * 初始化上传组件
         */
        initUploads: function() {
            $('.bjt-upload-component').each(function() {
                // 上传组件在其内部JS中已完全初始化
                // 这里只需处理全局回调
                const $upload = $(this);
                const uploadId = $upload.attr('id').replace('-container', '');
                
                if (window[uploadId + 'Handler']) {
                    const handler = window[uploadId + 'Handler'];
                    
                    // 添加成功回调
                    if (typeof handler.success === 'function') {
                        $upload.data('onSuccess', handler.success);
                    }
                    
                    // 添加错误回调
                    if (typeof handler.error === 'function') {
                        $upload.data('onError', handler.error);
                    }
                    
                    // 添加删除回调
                    if (typeof handler.remove === 'function') {
                        $upload.data('onRemove', handler.remove);
                    }
                }
            });
        },
        
        /**
         * 重新加载表格
         * 
         * @param {string} tableId 表格ID
         * @param {object} params 请求参数
         */
        reloadTable: function(tableId, params) {
            const $table = $('#' + tableId + '-container');
            
            // 如果没有AJAX URL，则无法重新加载
            if (!$table.data('ajax-url')) {
                console.warn('表格 ' + tableId + ' 未设置AJAX URL，无法重新加载');
                return;
            }
            
            // 显示加载状态
            $table.addClass('loading');
            $table.find('tbody').append('<tr class="loading-row"><td colspan="' + $table.find('thead th').length + '" class="loading-cell">加载中...</td></tr>');
            
            // 添加安全检查
            params = params || {};
            params.action = 'bjt_load_table';
            params.table_id = tableId;
            params.security = bjtAdmin.security;
            
            // 发送AJAX请求
            $.ajax({
                url: bjtAdmin.ajax_url,
                type: 'POST',
                data: params,
                success: function(response) {
                    // 移除加载状态
                    $table.removeClass('loading');
                    $table.find('.loading-row').remove();
                    
                    if (response.success) {
                        // 更新表格内容
                        $table.find('tbody').html(response.data.rows);
                        
                        // 更新分页
                        if (response.data.pagination) {
                            $table.find('.pagination').replaceWith(response.data.pagination);
                        }
                        
                        // 触发表格加载完成事件
                        $table.trigger('bjt:table:loaded', response.data);
                    } else {
                        console.error('加载表格数据失败:', response.data.message);
                        $table.find('tbody').html('<tr><td colspan="' + $table.find('thead th').length + '" class="error-cell">加载失败: ' + response.data.message + '</td></tr>');
                    }
                },
                error: function(xhr, status, error) {
                    // 移除加载状态
                    $table.removeClass('loading');
                    $table.find('.loading-row').remove();
                    
                    console.error('AJAX请求失败:', error);
                    $table.find('tbody').html('<tr><td colspan="' + $table.find('thead th').length + '" class="error-cell">加载失败: ' + error + '</td></tr>');
                }
            });
        },
        
        /**
         * 导出表格数据
         * 
         * @param {string} tableId 表格ID
         * @param {string} format 导出格式 (excel|csv|json)
         */
        exportTable: function(tableId, format) {
            const $table = $('#' + tableId + '-container');
            
            // 如果没有导出URL，则无法导出
            if (!$table.data('export-url')) {
                console.warn('表格 ' + tableId + ' 未设置导出URL，无法导出');
                return;
            }
            
            // 获取筛选参数
            const filterParams = {};
            $table.find('.filter-input').each(function() {
                const $input = $(this);
                if ($input.val()) {
                    filterParams[$input.attr('name')] = $input.val();
                }
            });
            
            // 创建临时表单提交下载请求
            const $form = $('<form>', {
                action: $table.data('export-url'),
                method: 'post',
                target: '_blank'
            }).appendTo('body');
            
            // 添加参数
            $form.append($('<input>', {
                type: 'hidden',
                name: 'action',
                value: 'bjt_export_table'
            }));
            
            $form.append($('<input>', {
                type: 'hidden',
                name: 'table_id',
                value: tableId
            }));
            
            $form.append($('<input>', {
                type: 'hidden',
                name: 'format',
                value: format
            }));
            
            $form.append($('<input>', {
                type: 'hidden',
                name: 'security',
                value: bjtAdmin.security
            }));
            
            // 添加筛选参数
            for (const key in filterParams) {
                $form.append($('<input>', {
                    type: 'hidden',
                    name: 'filters[' + key + ']',
                    value: filterParams[key]
                }));
            }
            
            // 提交表单
            $form.submit();
            
            // 删除临时表单
            $form.remove();
        },
        
        /**
         * 导入表格数据
         * 
         * @param {string} tableId 表格ID
         * @param {File} file 文件对象
         * @param {string} content 文件内容
         */
        importTable: function(tableId, file, content) {
            const $table = $('#' + tableId + '-container');
            
            // 创建FormData对象
            const formData = new FormData();
            formData.append('action', 'bjt_import_table');
            formData.append('table_id', tableId);
            formData.append('security', bjtAdmin.security);
            formData.append('file', file);
            
            // 显示导入中状态
            $table.addClass('importing');
            const $importMsg = $('<div class="import-message">正在导入数据，请稍候...</div>');
            $table.prepend($importMsg);
            
            // 发送AJAX请求
            $.ajax({
                url: bjtAdmin.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    // 移除导入中状态
                    $table.removeClass('importing');
                    $importMsg.remove();
                    
                    if (response.success) {
                        alert(response.data.message || '数据导入成功');
                        
                        // 重新加载表格
                        BJT.Components.reloadTable(tableId, {});
                        
                        // 触发导入完成事件
                        $table.trigger('bjt:table:imported', response.data);
                    } else {
                        alert('导入失败: ' + (response.data.message || '未知错误'));
                    }
                },
                error: function(xhr, status, error) {
                    // 移除导入中状态
                    $table.removeClass('importing');
                    $importMsg.remove();
                    
                    alert('导入请求失败: ' + error);
                }
            });
        },
        
        /**
         * 处理表格操作
         * 
         * @param {string} tableId 表格ID
         * @param {string} action 操作类型
         * @param {string|number} id 记录ID
         */
        handleTableAction: function(tableId, action, id) {
            // 默认处理常见操作类型
            switch (action) {
                case 'edit':
                    // 默认编辑操作 - 跳转到编辑页面
                    if (bjtAdmin.admin_url) {
                        window.location.href = bjtAdmin.admin_url + 'admin.php?page=bjt-edit-' + tableId.replace(/-table$/, '') + '&id=' + id;
                    }
                    break;
                    
                case 'delete':
                    // 默认删除操作
                    if (confirm('确定要删除此项吗？此操作无法撤销。')) {
                        BJT.Components.deleteTableItem(tableId, id);
                    }
                    break;
                    
                case 'toggle_status':
                    // 默认状态切换操作
                    BJT.Components.toggleItemStatus(tableId, id);
                    break;
                    
                default:
                    console.warn('未定义的表格操作:', action, '表格ID:', tableId, '记录ID:', id);
                    break;
            }
        },
        
        /**
         * 删除表格项
         * 
         * @param {string} tableId 表格ID
         * @param {string|number} id 记录ID
         */
        deleteTableItem: function(tableId, id) {
            // 发送AJAX请求
            $.ajax({
                url: bjtAdmin.ajax_url,
                type: 'POST',
                data: {
                    action: 'bjt_delete_item',
                    table_id: tableId,
                    id: id,
                    security: bjtAdmin.security
                },
                success: function(response) {
                    if (response.success) {
                        // 删除成功，从DOM中移除行
                        $('#' + tableId + '-container').find('tr[data-id="' + id + '"]').fadeOut(300, function() {
                            $(this).remove();
                        });
                        
                        // 触发删除完成事件
                        $('#' + tableId + '-container').trigger('bjt:table:deleted', {
                            id: id,
                            response: response.data
                        });
                    } else {
                        alert('删除失败: ' + (response.data.message || '未知错误'));
                    }
                },
                error: function(xhr, status, error) {
                    alert('删除请求失败: ' + error);
                }
            });
        },
        
        /**
         * 切换项目状态
         * 
         * @param {string} tableId 表格ID
         * @param {string|number} id 记录ID
         */
        toggleItemStatus: function(tableId, id) {
            // 获取当前状态
            const $row = $('#' + tableId + '-container').find('tr[data-id="' + id + '"]');
            const currentStatus = $row.find('.status-badge .status-icon').attr('class').includes('status-active') ? 'active' : 'inactive';
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            // 发送AJAX请求
            $.ajax({
                url: bjtAdmin.ajax_url,
                type: 'POST',
                data: {
                    action: 'bjt_toggle_status',
                    table_id: tableId,
                    id: id,
                    status: newStatus,
                    security: bjtAdmin.security
                },
                success: function(response) {
                    if (response.success) {
                        // 更新状态显示
                        $row.find('.status-badge .status-icon').removeClass('status-active status-inactive').addClass('status-' + newStatus);
                        $row.find('.status-badge').text(newStatus === 'active' ? '已上架' : '已下架');
                        
                        // 更新状态切换按钮
                        const $toggleBtn = $row.find('button[data-action="toggle_status"]');
                        $toggleBtn.text(newStatus === 'active' ? '下架' : '上架');
                        $toggleBtn.removeClass('button-success button-warning').addClass(newStatus === 'active' ? 'button-warning' : 'button-success');
                        
                        // 触发状态切换完成事件
                        $('#' + tableId + '-container').trigger('bjt:table:statusToggled', {
                            id: id,
                            status: newStatus,
                            response: response.data
                        });
                    } else {
                        alert('状态切换失败: ' + (response.data.message || '未知错误'));
                    }
                },
                error: function(xhr, status, error) {
                    alert('状态切换请求失败: ' + error);
                }
            });
        },
        
        /**
         * 处理表单提交成功
         * 
         * @param {string} formId 表单ID
         * @param {object} data 响应数据
         */
        handleFormSuccess: function(formId, data) {
            const $form = $('#' + formId + '-container');
            
            // 显示成功消息
            const $successMsg = $('<div class="form-success-message">' + (data.message || '提交成功') + '</div>');
            $form.prepend($successMsg);
            
            // 几秒后自动隐藏消息
            setTimeout(function() {
                $successMsg.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
            
            // 如果有重定向URL，则跳转
            if (data.redirect_url) {
                setTimeout(function() {
                    window.location.href = data.redirect_url;
                }, 1000);
            }
            
            // 如果需要重置表单
            if (data.reset_form) {
                $form.find('form')[0].reset();
            }
        },
        
        /**
         * 处理表单提交错误
         * 
         * @param {string} formId 表单ID
         * @param {object} data 错误数据
         */
        handleFormError: function(formId, data) {
            const $form = $('#' + formId + '-container');
            
            // 移除现有错误消息
            $form.find('.form-error-message').remove();
            $form.find('.field-error').remove();
            $form.find('.has-error').removeClass('has-error');
            
            // 显示一般错误消息
            if (data.message) {
                const $errorMsg = $('<div class="form-error-message">' + data.message + '</div>');
                $form.prepend($errorMsg);
            }
            
            // 显示字段错误
            if (data.errors && typeof data.errors === 'object') {
                for (const fieldId in data.errors) {
                    const $field = $form.find('#field-' + fieldId);
                    const errorMsg = data.errors[fieldId];
                    
                    if ($field.length) {
                        $field.addClass('has-error');
                        $field.append('<div class="field-error">' + errorMsg + '</div>');
                    }
                }
                
                // 滚动到第一个错误字段
                const $firstError = $form.find('.has-error').first();
                if ($firstError.length) {
                    $('html, body').animate({
                        scrollTop: $firstError.offset().top - 100
                    }, 300);
                }
            }
        }
    };
    
    // 在DOM就绪时初始化
    $(document).ready(function() {
        BJT.Components.init();
    });
    
})(jQuery); 