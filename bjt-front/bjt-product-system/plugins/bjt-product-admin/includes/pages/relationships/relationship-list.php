<?php
/**
 * 关系列表页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染关系列表页面
 */
function bjt_render_relationship_list_page() {
    // 检查是否指定了主机料号ID
    $part_id = isset($_GET['part_id']) ? intval($_GET['part_id']) : 0;
    $accessory_id = isset($_GET['accessory_id']) ? intval($_GET['accessory_id']) : 0;
    
    // 获取组件加载器和API处理器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    $api_handler = $bjt_product_admin->get_api_handler();
    
    // 初始化变量
    $current_part = array();
    $current_accessory = array();
    $parent_item_type = '';
    
    // 加载表格组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-table-component.php';
    
    // 如果有料号ID，获取料号信息
    if ($part_id) {
        $part_response = $api_handler->get('parts/' . $part_id);
        if (!is_wp_error($part_response) && isset($part_response['data'])) {
            $current_part = $part_response['data'];
            $parent_item_type = 'part';
        }
    }
    
    // 如果有配件ID，获取配件信息
    if ($accessory_id) {
        $accessory_response = $api_handler->get('accessories/' . $accessory_id);
        if (!is_wp_error($accessory_response) && isset($accessory_response['data'])) {
            $current_accessory = $accessory_response['data'];
            $parent_item_type = 'accessory';
        }
    }
    
    // 创建关系表格
    $relationship_table_args = array(
        'title' => __('关系管理', 'bjt-product-admin'),
        'description' => __('管理产品之间的关联关系', 'bjt-product-admin'),
        'data_source' => 'relationships', // API端点
        'data_params' => array(
            'part_id' => $part_id,
            'accessory_id' => $accessory_id
        ),
        'per_page' => 10,
        'sortable' => true,
        'searchable' => true,
        'filterable' => true,
        'exportable' => true
    );
    
    $relationship_table = new BJT_Table_Component('relationships-table', $relationship_table_args);
    
    // 添加关系表格列
    $relationship_table->add_columns(array(
        'id' => array(
            'label' => 'ID',
            'sortable' => true,
            'width' => '50px'
        ),
        'parent_type' => array(
            'label' => __('父项类型', 'bjt-product-admin'),
            'sortable' => true,
            'render_callback' => function($value, $item, $key) {
                $types = array(
                    'part' => __('主机料号', 'bjt-product-admin'),
                    'accessory' => __('配件', 'bjt-product-admin')
                );
                return isset($types[$value]) ? $types[$value] : $value;
            }
        ),
        'parent_name' => array(
            'label' => __('父项名称', 'bjt-product-admin'),
            'sortable' => true
        ),
        'child_type' => array(
            'label' => __('子项类型', 'bjt-product-admin'),
            'sortable' => true,
            'render_callback' => function($value, $item, $key) {
                $types = array(
                    'accessory' => __('配件', 'bjt-product-admin')
                );
                return isset($types[$value]) ? $types[$value] : $value;
            }
        ),
        'child_name' => array(
            'label' => __('子项名称', 'bjt-product-admin'),
            'sortable' => true
        ),
        'quantity' => array(
            'label' => __('数量', 'bjt-product-admin'),
            'sortable' => true
        ),
        'is_required' => array(
            'label' => __('是否必需', 'bjt-product-admin'),
            'sortable' => true,
            'render_callback' => function($value, $item, $key) {
                if ($value) {
                    return '<span class="status-badge status-active">' . __('必需', 'bjt-product-admin') . '</span>';
                } else {
                    return '<span class="status-badge status-inactive">' . __('可选', 'bjt-product-admin') . '</span>';
                }
            }
        ),
        'created_at' => array(
            'label' => __('创建时间', 'bjt-product-admin'),
            'sortable' => true,
            'type' => 'date'
        )
    ));
    
    // 添加关系表格操作
    $relationship_table->add_action('edit', __('编辑', 'bjt-product-admin'), 
        admin_url('admin.php?page=bjt-relationships&action=edit&id={id}'), 
        array('icon' => 'edit', 'class' => 'button-primary'));
    
    $relationship_table->add_action('delete', __('删除', 'bjt-product-admin'), '#', 
        array(
            'icon' => 'trash',
            'class' => 'button-secondary bjt-delete-item',
            'confirm' => true,
            'ajax' => true
        ));
    
    // 添加关系表格批量操作
    $relationship_table->add_bulk_action('delete', __('删除', 'bjt-product-admin'));
    $relationship_table->add_bulk_action('set_required', __('设为必需', 'bjt-product-admin'));
    $relationship_table->add_bulk_action('set_optional', __('设为可选', 'bjt-product-admin'));
    
    // 页面开始
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline"><?php _e('关系管理', 'bjt-product-admin'); ?></h1>
        
        <?php if ($part_id || $accessory_id): ?>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships&action=add' . 
                ($part_id ? '&part_id=' . $part_id : '') . 
                ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>" 
                class="page-title-action"><?php _e('添加关联', 'bjt-product-admin'); ?></a>
        <?php endif; ?>
        
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships')); ?>" class="page-title-action"><?php _e('查看所有关系', 'bjt-product-admin'); ?></a>
        
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <?php if ($part_id && !empty($current_part)): ?>
        <!-- 当前主机料号信息 -->
        <div class="bjt-admin-content bjt-current-item-section">
            <div class="bjt-section-header">
                <h2><?php _e('当前主机料号', 'bjt-product-admin'); ?></h2>
                <div class="bjt-section-actions">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models&action=edit-part&id=' . $part_id)); ?>" class="button button-secondary"><?php _e('编辑料号', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            
            <div class="bjt-item-info">
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('料号', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value"><?php echo esc_html($current_part['part_number']); ?></span>
                </div>
                
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('名称', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value"><?php echo esc_html($current_part['name_zh']); ?></span>
                </div>
                
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('主机型号', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value"><?php echo esc_html($current_part['host_model'] ?? ''); ?></span>
                </div>
                
                <?php if (!empty($current_part['image'])): ?>
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('图片', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value">
                        <img src="<?php echo esc_url($current_part['image']); ?>" alt="<?php echo esc_attr($current_part['name_zh']); ?>" style="max-width: 100px; max-height: 100px;">
                    </span>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <?php if ($accessory_id && !empty($current_accessory)): ?>
        <!-- 当前配件信息 -->
        <div class="bjt-admin-content bjt-current-item-section">
            <div class="bjt-section-header">
                <h2><?php _e('当前配件', 'bjt-product-admin'); ?></h2>
                <div class="bjt-section-actions">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-accessories&action=edit&id=' . $accessory_id)); ?>" class="button button-secondary"><?php _e('编辑配件', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            
            <div class="bjt-item-info">
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('料号', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value"><?php echo esc_html($current_accessory['part_number']); ?></span>
                </div>
                
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('名称', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value"><?php echo esc_html($current_accessory['name_zh']); ?></span>
                </div>
                
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('分类', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value">
                        <?php 
                        $categories = array(
                            'consumables' => __('耗材', 'bjt-product-admin'),
                            'spareparts' => __('备件', 'bjt-product-admin'),
                            'options' => __('选配件', 'bjt-product-admin')
                        );
                        echo esc_html($categories[$current_accessory['category']] ?? $current_accessory['category']); 
                        ?>
                    </span>
                </div>
                
                <?php if (!empty($current_accessory['image'])): ?>
                <div class="bjt-item-field">
                    <span class="bjt-item-label"><?php _e('图片', 'bjt-product-admin'); ?>:</span>
                    <span class="bjt-item-value">
                        <img src="<?php echo esc_url($current_accessory['image']); ?>" alt="<?php echo esc_attr($current_accessory['name_zh']); ?>" style="max-width: 100px; max-height: 100px;">
                    </span>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- 关系表格 -->
        <div class="bjt-admin-content">
            <?php 
            // 渲染关系表格
            echo $relationship_table->render(); 
            ?>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // 表格初始化
        if (typeof BJT !== 'undefined' && typeof BJT.Components !== 'undefined') {
            // 表格已由组件系统初始化
            
            // 删除关系
            $(document).on('click', '.bjt-delete-item', function(e) {
                e.preventDefault();
                
                if (!confirm('确定要删除此关联关系吗？此操作无法撤销。')) {
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
                        endpoint: 'relationships',
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
        margin-bottom: 30px;
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
    
    .bjt-current-item-section {
        padding: 15px;
        background-color: #f9f9f9;
        border: 1px solid #e5e5e5;
        border-radius: 3px;
    }
    
    .bjt-item-info {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
    
    .bjt-item-field {
        margin-bottom: 10px;
    }
    
    .bjt-item-label {
        font-weight: bold;
        margin-right: 5px;
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
        
        .bjt-item-info {
            flex-direction: column;
            gap: 10px;
        }
    }
    </style>
    <?php
} 