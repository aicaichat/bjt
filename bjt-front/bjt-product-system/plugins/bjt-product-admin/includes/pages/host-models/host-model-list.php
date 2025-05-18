<?php
/**
 * 主机型号列表页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染主机型号列表页面
 */
function bjt_render_host_model_list_page() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    
    // 创建主机型号表格
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-table-component.php';
    
    // 主机型号表格参数
    $host_table_args = array(
        'title' => __('主机型号管理', 'bjt-product-admin'),
        'description' => __('管理系统中的主机型号信息', 'bjt-product-admin'),
        'data_source' => 'host-models', // API端点
        'per_page' => 10,
        'sortable' => true,
        'searchable' => true,
        'filterable' => true,
        'exportable' => true,
        'importable' => true,
        'filters' => array(
            array(
                'key' => 'status',
                'label' => __('状态', 'bjt-product-admin'),
                'options' => array(
                    'active' => __('上线', 'bjt-product-admin'),
                    'inactive' => __('下线', 'bjt-product-admin')
                )
            )
        )
    );
    
    $host_table = new BJT_Table_Component('host-models-table', $host_table_args);
    
    // 添加主机型号表格列
    $host_table->add_columns(array(
        'id' => array(
            'label' => 'ID',
            'sortable' => true,
            'width' => '50px'
        ),
        'model' => array(
            'label' => __('型号', 'bjt-product-admin'),
            'sortable' => true
        ),
        'product_line' => array(
            'label' => __('产品线', 'bjt-product-admin'),
            'sortable' => true
        ),
        'description' => array(
            'label' => __('描述', 'bjt-product-admin'),
            'sortable' => false,
            'render_callback' => function($value, $item, $key) {
                // 截取部分描述
                return wp_trim_words($value, 10, '...');
            }
        ),
        'image' => array(
            'label' => __('图片', 'bjt-product-admin'),
            'sortable' => false,
            'type' => 'image'
        ),
        'status' => array(
            'label' => __('状态', 'bjt-product-admin'),
            'sortable' => true,
            'type' => 'status',
            'render_callback' => function($value, $item, $key) {
                if ($value === 'active') {
                    return '<span class="status-badge status-active">' . __('上线', 'bjt-product-admin') . '</span>';
                } else {
                    return '<span class="status-badge status-inactive">' . __('下线', 'bjt-product-admin') . '</span>';
                }
            }
        )
    ));
    
    // 添加主机型号表格操作
    $host_table->add_action('edit', __('编辑', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-host-models&action=edit&id={id}'), 
        array('icon' => 'edit', 'class' => 'button-primary'));
    
    $host_table->add_action('toggle', __('状态切换', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'yes',
            'class' => 'button-secondary bjt-toggle-status',
            'ajax' => true,
            'visible_callback' => function($item) {
                return true;
            }
        ));
    
    $host_table->add_action('delete', __('删除', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'trash',
            'class' => 'button-secondary bjt-delete-item',
            'confirm' => true,
            'ajax' => true
        ));
    
    // 添加主机型号表格批量操作
    $host_table->add_bulk_action('delete', __('删除', 'bjt-product-admin'));
    $host_table->add_bulk_action('activate', __('激活', 'bjt-product-admin'));
    $host_table->add_bulk_action('deactivate', __('停用', 'bjt-product-admin'));
    
    // 料号表格参数
    $part_table_args = array(
        'title' => __('料号管理', 'bjt-product-admin'),
        'description' => __('管理系统中的料号信息', 'bjt-product-admin'),
        'data_source' => 'parts', // API端点
        'per_page' => 10,
        'sortable' => true,
        'searchable' => true,
        'filterable' => true,
        'exportable' => true,
        'importable' => true,
        'filters' => array(
            array(
                'key' => 'host_model',
                'label' => __('主机型号', 'bjt-product-admin'),
                'options' => array() // 将由AJAX填充
            ),
            array(
                'key' => 'status',
                'label' => __('状态', 'bjt-product-admin'),
                'options' => array(
                    'active' => __('上线', 'bjt-product-admin'),
                    'inactive' => __('下线', 'bjt-product-admin')
                )
            )
        )
    );
    
    $part_table = new BJT_Table_Component('parts-table', $part_table_args);
    
    // 添加料号表格列
    $part_table->add_columns(array(
        'id' => array(
            'label' => 'ID',
            'sortable' => true,
            'width' => '50px'
        ),
        'part_number' => array(
            'label' => __('料号', 'bjt-product-admin'),
            'sortable' => true
        ),
        'host_model' => array(
            'label' => __('主机型号', 'bjt-product-admin'),
            'sortable' => true
        ),
        'name_zh' => array(
            'label' => __('名称（中文）', 'bjt-product-admin'),
            'sortable' => true
        ),
        'voltage' => array(
            'label' => __('电压', 'bjt-product-admin'),
            'sortable' => true
        ),
        'status' => array(
            'label' => __('状态', 'bjt-product-admin'),
            'sortable' => true,
            'type' => 'status',
            'render_callback' => function($value, $item, $key) {
                if ($value === 'active') {
                    return '<span class="status-badge status-active">' . __('上线', 'bjt-product-admin') . '</span>';
                } else {
                    return '<span class="status-badge status-inactive">' . __('下线', 'bjt-product-admin') . '</span>';
                }
            }
        )
    ));
    
    // 添加料号表格操作
    $part_table->add_action('edit', __('编辑', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-host-models&action=edit-part&id={id}'), 
        array('icon' => 'edit', 'class' => 'button-primary'));
    
    $part_table->add_action('relations', __('关联', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-relationships&part_id={id}'), 
        array('icon' => 'networking', 'class' => 'button-secondary'));
    
    $part_table->add_action('delete', __('删除', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'trash',
            'class' => 'button-secondary bjt-delete-part',
            'confirm' => true,
            'ajax' => true
        ));
    
    // 添加料号表格批量操作
    $part_table->add_bulk_action('delete', __('删除', 'bjt-product-admin'));
    $part_table->add_bulk_action('activate', __('激活', 'bjt-product-admin'));
    $part_table->add_bulk_action('deactivate', __('停用', 'bjt-product-admin'));
    
    // 页面开始
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline"><?php _e('主机管理', 'bjt-product-admin'); ?></h1>
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <!-- 主机型号表格 -->
        <div class="bjt-admin-content bjt-host-models-section">
            <div class="bjt-section-header">
                <h2><?php _e('主机型号', 'bjt-product-admin'); ?></h2>
                <div class="bjt-section-actions">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add')); ?>" class="button button-primary"><?php _e('添加型号', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            <?php 
            // 渲染主机型号表格
            echo $host_table->render(); 
            ?>
        </div>
        
        <!-- 料号表格 -->
        <div class="bjt-admin-content bjt-parts-section">
            <div class="bjt-section-header">
                <h2><?php _e('料号管理', 'bjt-product-admin'); ?></h2>
                <div class="bjt-section-actions">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=add-part')); ?>" class="button button-primary"><?php _e('添加料号', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            <?php 
            // 渲染料号表格
            echo $part_table->render(); 
            ?>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // 主机型号表格初始化
        if (typeof BJT !== 'undefined' && typeof BJT.Components !== 'undefined') {
            // 表格已由组件系统初始化
            
            // 主机型号状态切换
            $(document).on('click', '.bjt-host-models-section .bjt-toggle-status', function(e) {
                e.preventDefault();
                
                var $row = $(this).closest('tr');
                var id = $row.data('id');
                var currentStatus = $row.find('.status-badge').hasClass('status-active') ? 'active' : 'inactive';
                
                $.ajax({
                    url: bjtAdmin.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_toggle_status',
                        nonce: bjtAdmin.nonce,
                        endpoint: 'host-models',
                        item_id: id,
                        current_status: currentStatus,
                        status_field: 'status'
                    },
                    success: function(response) {
                        if (response.success) {
                            // 更新状态显示
                            var newStatus = currentStatus === 'active' ? 'inactive' : 'active';
                            var newLabel = newStatus === 'active' ? '上线' : '下线';
                            
                            $row.find('.status-badge')
                                .removeClass('status-active status-inactive')
                                .addClass('status-' + newStatus)
                                .text(newLabel);
                                
                            // 显示成功消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-success is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        } else {
                            // 显示错误消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-error is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        }
                    },
                    error: function() {
                        // 显示错误消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-error is-dismissible"><p>' + 
                            '操作失败，请稍后重试。' + '</p></div>'
                        );
                    }
                });
            });
            
            // 删除主机型号
            $(document).on('click', '.bjt-host-models-section .bjt-delete-item', function(e) {
                e.preventDefault();
                
                if (!confirm('确定要删除此主机型号吗？此操作无法撤销。')) {
                    return;
                }
                
                var $row = $(this).closest('tr');
                var id = $row.data('id');
                
                $.ajax({
                    url: bjtAdmin.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_delete_item',
                        nonce: bjtAdmin.nonce,
                        endpoint: 'host-models',
                        item_id: id
                    },
                    success: function(response) {
                        if (response.success) {
                            // 从表格中移除行
                            $row.fadeOut(300, function() {
                                $(this).remove();
                            });
                            
                            // 显示成功消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-success is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        } else {
                            // 显示错误消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-error is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        }
                    },
                    error: function() {
                        // 显示错误消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-error is-dismissible"><p>' + 
                            '操作失败，请稍后重试。' + '</p></div>'
                        );
                    }
                });
            });
            
            // 删除料号
            $(document).on('click', '.bjt-parts-section .bjt-delete-part', function(e) {
                e.preventDefault();
                
                if (!confirm('确定要删除此料号吗？此操作无法撤销。')) {
                    return;
                }
                
                var $row = $(this).closest('tr');
                var id = $row.data('id');
                
                $.ajax({
                    url: bjtAdmin.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_delete_item',
                        nonce: bjtAdmin.nonce,
                        endpoint: 'parts',
                        item_id: id
                    },
                    success: function(response) {
                        if (response.success) {
                            // 从表格中移除行
                            $row.fadeOut(300, function() {
                                $(this).remove();
                            });
                            
                            // 显示成功消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-success is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        } else {
                            // 显示错误消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-error is-dismissible"><p>' + 
                                response.data.message + '</p></div>'
                            );
                        }
                    },
                    error: function() {
                        // 显示错误消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-error is-dismissible"><p>' + 
                            '操作失败，请稍后重试。' + '</p></div>'
                        );
                    }
                });
            });
            
            // 当主机型号筛选器改变时更新料号表格
            $(document).on('change', '.bjt-filter-host_model', function() {
                var hostModelId = $(this).val();
                
                // 重新加载料号表格
                if (typeof BJT.Components.reloadTable === 'function') {
                    BJT.Components.reloadTable('parts-table', {
                        host_model: hostModelId
                    });
                }
            });
        }
    });
    </script>
    
    <style>
    .bjt-admin-wrap {
        margin: 20px 0;
    }
    
    .bjt-admin-content {
        margin-top: 20px;
        margin-bottom: 40px;
    }
    
    .bjt-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .bjt-section-header h2 {
        margin: 0;
    }
    
    .bjt-section-actions {
        display: flex;
        gap: 10px;
    }
    
    .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .status-active {
        background-color: #dff0d8;
        color: #3c763d;
    }
    
    .status-inactive {
        background-color: #f2dede;
        color: #a94442;
    }
    
    /* 响应式样式 */
    @media screen and (max-width: 782px) {
        .bjt-section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }
    }
    </style>
    <?php
} 