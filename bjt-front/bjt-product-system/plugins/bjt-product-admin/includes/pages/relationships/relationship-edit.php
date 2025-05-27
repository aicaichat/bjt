<?php
/**
 * 关系编辑页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染关系编辑页面
 */
function bjt_render_relationship_edit_page() {
    // 检查是否为编辑模式
    $is_edit_mode = (isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['id']));
    $relationship_id = $is_edit_mode ? intval($_GET['id']) : 0;
    
    // 检查是否指定了父项ID
    $part_id = isset($_GET['part_id']) ? intval($_GET['part_id']) : 0;
    $accessory_id = isset($_GET['accessory_id']) ? intval($_GET['accessory_id']) : 0;
    
    // 获取组件加载器和API处理器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    $api_handler = $bjt_product_admin->get_api_handler();
    
    // 加载表单组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
    
    // 初始化变量
    $current_part = array();
    $current_accessory = array();
    $parent_item_type = '';
    
    // 默认关系数据
    $relationship_data = array(
        'id' => '',
        'parent_id' => '',
        'parent_type' => '',
        'child_id' => '',
        'child_type' => 'accessory', // 默认子项为配件
        'quantity' => 1,
        'is_required' => true,
        'notes' => ''
    );
    
    // 如果是编辑模式，获取现有数据
    if ($is_edit_mode) {
        $response = $api_handler->get('relationships/' . $relationship_id);
        
        if (is_wp_error($response)) {
            echo '<div class="notice notice-error"><p>' . esc_html($response->get_error_message()) . '</p></div>';
            return;
        }
        
        if (isset($response['data'])) {
            $relationship_data = wp_parse_args($response['data'], $relationship_data);
            
            // 设置父项ID
            if ($relationship_data['parent_type'] === 'part') {
                $part_id = $relationship_data['parent_id'];
            } elseif ($relationship_data['parent_type'] === 'accessory') {
                $accessory_id = $relationship_data['parent_id'];
            }
        } else {
            echo '<div class="notice notice-error"><p>' . __('无法获取关系数据', 'bjt-product-admin') . '</p></div>';
            return;
        }
    } else {
        // 对于新建关系，设置父项类型和ID
        if ($part_id) {
            $relationship_data['parent_type'] = 'part';
            $relationship_data['parent_id'] = $part_id;
        } elseif ($accessory_id) {
            $relationship_data['parent_type'] = 'accessory';
            $relationship_data['parent_id'] = $accessory_id;
        }
    }
    
    // 获取父项信息
    if ($part_id) {
        $part_response = $api_handler->get('parts/' . $part_id);
        if (!is_wp_error($part_response) && isset($part_response['data'])) {
            $current_part = $part_response['data'];
            $parent_item_type = 'part';
        }
    } elseif ($accessory_id) {
        $accessory_response = $api_handler->get('accessories/' . $accessory_id);
        if (!is_wp_error($accessory_response) && isset($accessory_response['data'])) {
            $current_accessory = $accessory_response['data'];
            $parent_item_type = 'accessory';
        }
    }
    
    // 获取配件列表（用于子项选择）
    $accessories_response = $api_handler->get('accessories', array('per_page' => -1));
    $accessory_options = array();
    
    if (!is_wp_error($accessories_response) && isset($accessories_response['data'])) {
        foreach ($accessories_response['data'] as $accessory) {
            $accessory_options[$accessory['id']] = $accessory['name_zh'] . ' (' . $accessory['part_number'] . ')';
        }
    }
    
    // 创建表单
    $form_args = array(
        'title' => $is_edit_mode ? __('编辑关联关系', 'bjt-product-admin') : __('添加关联关系', 'bjt-product-admin'),
        'description' => __('设置产品之间的关联关系', 'bjt-product-admin'),
        'method' => 'post',
        'ajax' => true,
        'data_source' => 'relationships',
        'submit_text' => __('保存', 'bjt-product-admin'),
        'cancel_text' => __('取消', 'bjt-product-admin'),
        'cancel_url' => admin_url('admin.php?page=bjt-relationships' . 
            ($part_id ? '&part_id=' . $part_id : '') . 
            ($accessory_id ? '&accessory_id=' . $accessory_id : ''))
    );
    
    $form = new BJT_Form_Component('relationship-form', $form_args);
    
    // 添加表单字段组
    $form->add_group(array(
        'id' => 'parent-info',
        'title' => __('父项信息', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'child-info',
        'title' => __('子项信息', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'relationship-info',
        'title' => __('关系设置', 'bjt-product-admin')
    ));
    
    // 添加隐藏ID字段
    if ($is_edit_mode) {
        $form->add_field(array(
            'id' => 'id',
            'type' => 'hidden',
            'value' => $relationship_data['id']
        ));
    }
    
    // 添加父项类型和ID隐藏字段
    $form->add_field(array(
        'id' => 'parent_type',
        'type' => 'hidden',
        'value' => $relationship_data['parent_type']
    ));
    
    $form->add_field(array(
        'id' => 'parent_id',
        'type' => 'hidden',
        'value' => $relationship_data['parent_id']
    ));
    
    // 添加父项信息显示字段
    if ($parent_item_type === 'part' && !empty($current_part)) {
        $form->add_field(array(
            'id' => 'parent_info',
            'group' => 'parent-info',
            'type' => 'html',
            'label' => __('主机料号信息', 'bjt-product-admin'),
            'value' => '<div class="bjt-item-info">
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('料号', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($current_part['part_number']) . '</span>
                </div>
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('名称', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($current_part['name_zh']) . '</span>
                </div>
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('主机型号', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($current_part['host_model'] ?? '') . '</span>
                </div>
            </div>'
        ));
    } elseif ($parent_item_type === 'accessory' && !empty($current_accessory)) {
        $categories = array(
            'consumables' => __('耗材', 'bjt-product-admin'),
            'spareparts' => __('备件', 'bjt-product-admin'),
            'options' => __('选配件', 'bjt-product-admin')
        );
        
        $form->add_field(array(
            'id' => 'parent_info',
            'group' => 'parent-info',
            'type' => 'html',
            'label' => __('配件信息', 'bjt-product-admin'),
            'value' => '<div class="bjt-item-info">
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('料号', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($current_accessory['part_number']) . '</span>
                </div>
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('名称', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($current_accessory['name_zh']) . '</span>
                </div>
                <div class="bjt-item-field">
                    <span class="bjt-item-label">' . __('分类', 'bjt-product-admin') . ':</span>
                    <span class="bjt-item-value">' . esc_html($categories[$current_accessory['category']] ?? $current_accessory['category']) . '</span>
                </div>
            </div>'
        ));
    } else {
        // 如果没有父项信息，显示提示信息
        $form->add_field(array(
            'id' => 'parent_warning',
            'group' => 'parent-info',
            'type' => 'html',
            'value' => '<div class="notice notice-warning inline"><p>' . 
                __('未指定父项，请返回选择一个主机料号或配件作为父项。', 'bjt-product-admin') . 
                '</p></div>'
        ));
    }
    
    // 添加子项类型字段（目前只支持配件作为子项）
    $form->add_field(array(
        'id' => 'child_type',
        'type' => 'hidden',
        'value' => 'accessory'
    ));
    
    // 添加子项选择字段
    $form->add_field(array(
        'id' => 'child_id',
        'group' => 'child-info',
        'type' => 'select',
        'label' => __('选择配件', 'bjt-product-admin'),
        'description' => __('选择要关联的配件', 'bjt-product-admin'),
        'options' => $accessory_options,
        'value' => $relationship_data['child_id'],
        'required' => true,
        'searchable' => true
    ));
    
    // 添加数量字段
    $form->add_field(array(
        'id' => 'quantity',
        'group' => 'relationship-info',
        'type' => 'number',
        'label' => __('数量', 'bjt-product-admin'),
        'description' => __('配件的数量', 'bjt-product-admin'),
        'value' => $relationship_data['quantity'],
        'min' => 1,
        'max' => 999,
        'step' => 1,
        'required' => true
    ));
    
    // 添加是否必需字段
    $form->add_field(array(
        'id' => 'is_required',
        'group' => 'relationship-info',
        'type' => 'checkbox',
        'label' => __('必需', 'bjt-product-admin'),
        'description' => __('标记此配件是否必需', 'bjt-product-admin'),
        'value' => $relationship_data['is_required']
    ));
    
    // 添加备注字段
    $form->add_field(array(
        'id' => 'notes',
        'group' => 'relationship-info',
        'type' => 'textarea',
        'label' => __('备注', 'bjt-product-admin'),
        'placeholder' => __('输入关于此关联关系的备注信息', 'bjt-product-admin'),
        'value' => $relationship_data['notes'],
        'required' => false
    ));
    
    // 渲染表单
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline">
            <?php echo $is_edit_mode ? esc_html__('编辑关联关系', 'bjt-product-admin') : esc_html__('添加关联关系', 'bjt-product-admin'); ?>
        </h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-relationships' . 
            ($part_id ? '&part_id=' . $part_id : '') . 
            ($accessory_id ? '&accessory_id=' . $accessory_id : ''))); ?>" 
            class="page-title-action"><?php esc_html_e('返回列表', 'bjt-product-admin'); ?></a>
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <div class="bjt-admin-content">
            <?php 
            // 如果没有父项信息，显示警告
            if (empty($parent_item_type)) {
                echo '<div class="notice notice-error"><p>' . 
                    __('未指定父项，无法创建关联关系。请返回选择一个主机料号或配件作为父项。', 'bjt-product-admin') . 
                    '</p></div>';
            }
            
            // 渲染表单
            echo $form->render(); 
            ?>
        </div>
    </div>
    
    <style>
    .bjt-admin-wrap {
        margin: 20px 0;
    }
    
    .bjt-admin-content {
        margin-top: 20px;
        max-width: 800px;
    }
    
    .bjt-item-info {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #e5e5e5;
        border-radius: 3px;
    }
    
    .bjt-item-field {
        margin-bottom: 5px;
    }
    
    .bjt-item-label {
        font-weight: bold;
        margin-right: 5px;
    }
    
    @media screen and (min-width: 768px) {
        .bjt-item-info {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 20px;
        }
    }
    </style>
    
    <script>
    jQuery(document).ready(function($) {
        // 表单处理
        if (typeof BJT !== 'undefined' && typeof BJT.Components !== 'undefined') {
            // 表单已由组件系统初始化
            
            // 选择子项时获取详细信息
            $('#child_id').on('change', function() {
                var childId = $(this).val();
                
                if (childId) {
                    // 显示加载提示
                    $('.bjt-admin-notices').html(
                        '<div class="notice notice-info is-dismissible"><p>' + 
                        '正在加载配件信息...' + '</p></div>'
                    );
                    
                    // 获取配件详细信息
                    $.ajax({
                        url: bjtAdmin.ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'bjt_get_item_details',
                            nonce: bjtAdmin.nonce,
                            item_type: 'accessory',
                            item_id: childId
                        },
                        success: function(response) {
                            // 清除通知
                            $('.bjt-admin-notices').empty();
                            
                            if (response.success && response.data) {
                                // 显示配件详细信息
                                var categories = {
                                    'consumables': '耗材',
                                    'spareparts': '备件',
                                    'options': '选配件'
                                };
                                
                                var categoryText = categories[response.data.category] || response.data.category;
                                
                                var infoHtml = '<div class="notice notice-info inline"><p>' + 
                                    '<strong>已选配件：</strong> ' + response.data.name_zh + ' (' + response.data.part_number + '), ' + 
                                    '<strong>分类：</strong> ' + categoryText +
                                    '</p></div>';
                                
                                // 在子项信息组添加详细信息
                                $('#child_id').closest('.bjt-form-field').after(infoHtml);
                            }
                        }
                    });
                }
            });
            
            // 初始触发子项选择事件
            if ($('#child_id').val()) {
                $('#child_id').trigger('change');
            }
        }
    });
    </script>
    <?php
} 