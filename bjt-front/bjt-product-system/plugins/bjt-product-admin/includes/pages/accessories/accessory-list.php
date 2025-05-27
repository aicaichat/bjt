<?php
/**
 * 配件列表页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染配件列表页面
 */
function bjt_render_accessory_list_page() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    
    // 创建配件表格
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-table-component.php';
    
    // 配件表格参数
    $accessory_table_args = array(
        'title' => __('配件管理', 'bjt-product-admin'),
        'description' => __('管理系统中的配件信息', 'bjt-product-admin'),
        'data_source' => 'accessories', // API端点
        'per_page' => 10,
        'sortable' => true,
        'searchable' => true,
        'filterable' => true,
        'exportable' => true,
        'importable' => true,
        'filters' => array(
            array(
                'key' => 'category',
                'label' => __('分类', 'bjt-product-admin'),
                'options' => array(
                    'consumables' => __('耗材', 'bjt-product-admin'),
                    'spareparts' => __('备件', 'bjt-product-admin'),
                    'options' => __('选配件', 'bjt-product-admin')
                )
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
    
    $accessory_table = new BJT_Table_Component('accessories-table', $accessory_table_args);
    
    // 添加配件表格列
    $accessory_table->add_columns(array(
        'id' => array(
            'label' => 'ID',
            'sortable' => true,
            'width' => '50px'
        ),
        'part_number' => array(
            'label' => __('料号', 'bjt-product-admin'),
            'sortable' => true
        ),
        'name_zh' => array(
            'label' => __('名称（中文）', 'bjt-product-admin'),
            'sortable' => true
        ),
        'category' => array(
            'label' => __('分类', 'bjt-product-admin'),
            'sortable' => true,
            'render_callback' => function($value, $item, $key) {
                $categories = array(
                    'consumables' => __('耗材', 'bjt-product-admin'),
                    'spareparts' => __('备件', 'bjt-product-admin'),
                    'options' => __('选配件', 'bjt-product-admin')
                );
                return isset($categories[$value]) ? $categories[$value] : $value;
            }
        ),
        'image' => array(
            'label' => __('图片', 'bjt-product-admin'),
            'sortable' => false,
            'type' => 'image'
        ),
        'price' => array(
            'label' => __('价格', 'bjt-product-admin'),
            'sortable' => true,
            'render_callback' => function($value, $item, $key) {
                return !empty($value) ? '¥' . number_format($value, 2) : '-';
            }
        ),
        'stock' => array(
            'label' => __('库存', 'bjt-product-admin'),
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
    
    // 添加配件表格操作
    $accessory_table->add_action('edit', __('编辑', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-accessories&action=edit&id={id}'), 
        array('icon' => 'edit', 'class' => 'button-primary'));
    
    $accessory_table->add_action('relations', __('关联', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-relationships&accessory_id={id}'), 
        array('icon' => 'networking', 'class' => 'button-secondary'));
    
    $accessory_table->add_action('toggle', __('状态切换', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'yes',
            'class' => 'button-secondary bjt-toggle-status',
            'ajax' => true,
            'visible_callback' => function($item) {
                return true;
            }
        ));
    
    $accessory_table->add_action('delete', __('删除', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'trash',
            'class' => 'button-secondary bjt-delete-item',
            'confirm' => true,
            'ajax' => true
        ));
    
    // 添加配件表格批量操作
    $accessory_table->add_bulk_action('delete', __('删除', 'bjt-product-admin'));
    $accessory_table->add_bulk_action('activate', __('激活', 'bjt-product-admin'));
    $accessory_table->add_bulk_action('deactivate', __('停用', 'bjt-product-admin'));
    
    // 页面开始
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline"><?php _e('配件管理', 'bjt-product-admin'); ?></h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-accessories&action=add')); ?>" class="page-title-action"><?php _e('添加配件', 'bjt-product-admin'); ?></a>
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <!-- 配件表格 -->
        <div class="bjt-admin-content">
            <?php 
            // 渲染配件表格
            echo $accessory_table->render(); 
            ?>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // 配件表格初始化
        if (typeof BJT !== 'undefined' && typeof BJT.Components !== 'undefined') {
            // 表格已由组件系统初始化
            
            // 配件状态切换
            $(document).on('click', '.bjt-toggle-status', function(e) {
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
                        endpoint: 'accessories',
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
            
            // 删除配件
            $(document).on('click', '.bjt-delete-item', function(e) {
                e.preventDefault();
                
                if (!confirm('确定要删除此配件吗？此操作无法撤销。')) {
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
                        endpoint: 'accessories',
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
        }
    });
    </script>
    
    <style>
    .bjt-admin-wrap {
        margin: 20px 0;
    }
    
    .bjt-admin-content {
        margin-top: 20px;
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
    </style>
    <?php
} 