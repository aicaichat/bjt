<?php
/**
 * 配件编辑页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染配件编辑页面
 */
function bjt_render_accessory_edit_page() {
    // 检查是否为编辑模式
    $is_edit_mode = (isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['id']));
    $accessory_id = $is_edit_mode ? intval($_GET['id']) : 0;
    
    // 获取组件加载器和API处理器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    $api_handler = $bjt_product_admin->get_api_handler();
    
    // 加载表单组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
    
    // 默认配件数据
    $accessory_data = array(
        'id' => '',
        'part_number' => '',
        'name_zh' => '',
        'name_en' => '',
        'description_zh' => '',
        'description_en' => '',
        'category' => 'options', // 默认选配件
        'specifications_zh' => '',
        'specifications_en' => '',
        'compatibility' => '',
        'price' => '',
        'discount_price' => '',
        'stock' => 0,
        'image' => '',
        'additional_images' => array(),
        'status' => 'active',
        'sort_order' => 0
    );
    
    // 如果是编辑模式，获取现有数据
    if ($is_edit_mode) {
        $response = $api_handler->get('accessories/' . $accessory_id);
        
        if (is_wp_error($response)) {
            echo '<div class="notice notice-error"><p>' . esc_html($response->get_error_message()) . '</p></div>';
            return;
        }
        
        if (isset($response['data'])) {
            $accessory_data = wp_parse_args($response['data'], $accessory_data);
        } else {
            echo '<div class="notice notice-error"><p>' . __('无法获取配件数据', 'bjt-product-admin') . '</p></div>';
            return;
        }
    }
    
    // 获取主机型号列表（用于兼容性选择）
    $host_models_response = $api_handler->get('host-models', array('per_page' => -1));
    $host_model_options = array();
    
    if (!is_wp_error($host_models_response) && isset($host_models_response['data'])) {
        foreach ($host_models_response['data'] as $model) {
            $host_model_options[$model['id']] = $model['model'];
        }
    }
    
    // 创建表单
    $form_args = array(
        'title' => $is_edit_mode ? __('编辑配件', 'bjt-product-admin') : __('添加配件', 'bjt-product-admin'),
        'description' => __('填写配件信息，支持中英文内容', 'bjt-product-admin'),
        'method' => 'post',
        'ajax' => true,
        'data_source' => 'accessories',
        'submit_text' => __('保存', 'bjt-product-admin'),
        'cancel_text' => __('取消', 'bjt-product-admin'),
        'cancel_url' => admin_url('admin.php?page=bjt-accessories')
    );
    
    $form = new BJT_Form_Component('accessory-form', $form_args);
    
    // 添加表单字段组
    $form->add_group(array(
        'id' => 'basic-info',
        'title' => __('基本信息', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'content-info',
        'title' => __('内容信息', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'pricing-info',
        'title' => __('价格与库存', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'compatibility-info',
        'title' => __('兼容性', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'media-info',
        'title' => __('媒体信息', 'bjt-product-admin')
    ));
    
    $form->add_group(array(
        'id' => 'advanced-settings',
        'title' => __('高级设置', 'bjt-product-admin')
    ));
    
    // 添加隐藏ID字段
    if ($is_edit_mode) {
        $form->add_field(array(
            'id' => 'id',
            'type' => 'hidden',
            'value' => $accessory_data['id']
        ));
    }
    
    // 添加料号字段
    $form->add_field(array(
        'id' => 'part_number',
        'group' => 'basic-info',
        'type' => 'text',
        'label' => __('料号', 'bjt-product-admin'),
        'placeholder' => __('输入配件料号', 'bjt-product-admin'),
        'value' => $accessory_data['part_number'],
        'required' => true,
        'validation' => array(
            'max_length' => 50
        )
    ));
    
    // 添加配件分类选择
    $form->add_field(array(
        'id' => 'category',
        'group' => 'basic-info',
        'type' => 'select',
        'label' => __('配件分类', 'bjt-product-admin'),
        'description' => __('选择此配件的分类', 'bjt-product-admin'),
        'options' => array(
            'consumables' => __('耗材', 'bjt-product-admin'),
            'spareparts' => __('备件', 'bjt-product-admin'),
            'options' => __('选配件', 'bjt-product-admin')
        ),
        'value' => $accessory_data['category'],
        'required' => true
    ));
    
    // 添加名称字段
    $form->add_field(array(
        'id' => 'name_zh',
        'group' => 'basic-info',
        'type' => 'text',
        'label' => __('名称（中文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件中文名称', 'bjt-product-admin'),
        'value' => $accessory_data['name_zh'],
        'required' => true,
        'validation' => array(
            'max_length' => 100
        )
    ));
    
    $form->add_field(array(
        'id' => 'name_en',
        'group' => 'basic-info',
        'type' => 'text',
        'label' => __('名称（英文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件英文名称', 'bjt-product-admin'),
        'value' => $accessory_data['name_en'],
        'required' => true,
        'validation' => array(
            'max_length' => 100
        )
    ));
    
    // 添加描述字段
    $form->add_field(array(
        'id' => 'description_zh',
        'group' => 'content-info',
        'type' => 'textarea',
        'label' => __('描述（中文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件中文描述', 'bjt-product-admin'),
        'value' => $accessory_data['description_zh'],
        'required' => false,
        'validation' => array(
            'max_length' => 500
        )
    ));
    
    $form->add_field(array(
        'id' => 'description_en',
        'group' => 'content-info',
        'type' => 'textarea',
        'label' => __('描述（英文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件英文描述', 'bjt-product-admin'),
        'value' => $accessory_data['description_en'],
        'required' => false,
        'validation' => array(
            'max_length' => 500
        )
    ));
    
    // 添加规格参数字段
    $form->add_field(array(
        'id' => 'specifications_zh',
        'group' => 'content-info',
        'type' => 'textarea',
        'label' => __('规格参数（中文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件中文规格参数', 'bjt-product-admin'),
        'description' => __('可使用HTML格式化内容', 'bjt-product-admin'),
        'value' => $accessory_data['specifications_zh'],
        'required' => false,
        'validation' => array(
            'max_length' => 1000
        )
    ));
    
    $form->add_field(array(
        'id' => 'specifications_en',
        'group' => 'content-info',
        'type' => 'textarea',
        'label' => __('规格参数（英文）', 'bjt-product-admin'),
        'placeholder' => __('输入配件英文规格参数', 'bjt-product-admin'),
        'description' => __('可使用HTML格式化内容', 'bjt-product-admin'),
        'value' => $accessory_data['specifications_en'],
        'required' => false,
        'validation' => array(
            'max_length' => 1000
        )
    ));
    
    // 添加价格和库存字段
    $form->add_field(array(
        'id' => 'price',
        'group' => 'pricing-info',
        'type' => 'number',
        'label' => __('价格', 'bjt-product-admin'),
        'placeholder' => __('输入配件价格', 'bjt-product-admin'),
        'value' => $accessory_data['price'],
        'min' => 0,
        'step' => 0.01,
        'required' => false
    ));
    
    $form->add_field(array(
        'id' => 'discount_price',
        'group' => 'pricing-info',
        'type' => 'number',
        'label' => __('优惠价格', 'bjt-product-admin'),
        'placeholder' => __('输入配件优惠价格', 'bjt-product-admin'),
        'value' => $accessory_data['discount_price'],
        'min' => 0,
        'step' => 0.01,
        'required' => false
    ));
    
    $form->add_field(array(
        'id' => 'stock',
        'group' => 'pricing-info',
        'type' => 'number',
        'label' => __('库存数量', 'bjt-product-admin'),
        'placeholder' => __('输入配件库存数量', 'bjt-product-admin'),
        'value' => $accessory_data['stock'],
        'min' => 0,
        'step' => 1,
        'required' => false
    ));
    
    // 添加兼容性字段
    $form->add_field(array(
        'id' => 'compatibility',
        'group' => 'compatibility-info',
        'type' => 'multiselect',
        'label' => __('兼容主机型号', 'bjt-product-admin'),
        'description' => __('选择此配件兼容的主机型号', 'bjt-product-admin'),
        'options' => $host_model_options,
        'value' => $accessory_data['compatibility'] ? explode(',', $accessory_data['compatibility']) : array(),
        'required' => false
    ));
    
    // 添加图片字段
    $form->add_field(array(
        'id' => 'image',
        'group' => 'media-info',
        'type' => 'upload',
        'label' => __('配件主图', 'bjt-product-admin'),
        'description' => __('上传配件主图，建议尺寸800x600px', 'bjt-product-admin'),
        'value' => $accessory_data['image'],
        'accept' => 'image/*',
        'required' => false
    ));
    
    $form->add_field(array(
        'id' => 'additional_images',
        'group' => 'media-info',
        'type' => 'upload_multiple',
        'label' => __('配件附加图片', 'bjt-product-admin'),
        'description' => __('上传配件附加图片，最多5张', 'bjt-product-admin'),
        'value' => $accessory_data['additional_images'],
        'accept' => 'image/*',
        'required' => false,
        'max_files' => 5
    ));
    
    // 添加状态和排序字段
    $form->add_field(array(
        'id' => 'status',
        'group' => 'advanced-settings',
        'type' => 'select',
        'label' => __('状态', 'bjt-product-admin'),
        'options' => array(
            'active' => __('上线', 'bjt-product-admin'),
            'inactive' => __('下线', 'bjt-product-admin')
        ),
        'value' => $accessory_data['status'],
        'required' => true
    ));
    
    $form->add_field(array(
        'id' => 'sort_order',
        'group' => 'advanced-settings',
        'type' => 'number',
        'label' => __('排序顺序', 'bjt-product-admin'),
        'description' => __('数值越小排序越靠前', 'bjt-product-admin'),
        'value' => $accessory_data['sort_order'],
        'min' => 0,
        'max' => 999,
        'step' => 1,
        'required' => true
    ));
    
    // 渲染表单
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline">
            <?php echo $is_edit_mode ? esc_html__('编辑配件', 'bjt-product-admin') : esc_html__('添加配件', 'bjt-product-admin'); ?>
        </h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-accessories')); ?>" class="page-title-action"><?php esc_html_e('返回列表', 'bjt-product-admin'); ?></a>
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <div class="bjt-admin-content">
            <div class="bjt-language-tabs">
                <div class="bjt-language-tab-nav">
                    <a href="#" class="bjt-language-tab active" data-language="zh"><?php _e('中文', 'bjt-product-admin'); ?></a>
                    <a href="#" class="bjt-language-tab" data-language="en"><?php _e('英文', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            
            <?php echo $form->render(); ?>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // 语言切换功能
        $('.bjt-language-tab').on('click', function(e) {
            e.preventDefault();
            
            // 获取语言
            var language = $(this).data('language');
            
            // 激活选项卡
            $('.bjt-language-tab').removeClass('active');
            $(this).addClass('active');
            
            // 切换字段显示
            $('.bjt-form-field').each(function() {
                var $field = $(this);
                var fieldId = $field.find('input, textarea, select').attr('id');
                
                if (fieldId) {
                    // 检查字段是否包含语言后缀
                    if (fieldId.indexOf('_zh') !== -1 || fieldId.indexOf('_en') !== -1) {
                        var fieldLang = fieldId.substr(-2);
                        
                        if (fieldLang === language) {
                            $field.show();
                        } else {
                            $field.hide();
                        }
                    }
                }
            });
        });
        
        // 初始触发语言切换
        $('.bjt-language-tab.active').trigger('click');
        
        // 从CRM获取料号数据
        $('#part_number').on('blur', function() {
            var partNumber = $(this).val();
            
            if (partNumber && partNumber.length > 5) {
                // 显示加载中
                $(this).after('<span class="bjt-loading-spinner">加载中...</span>');
                
                // 调用API获取料号数据
                $.ajax({
                    url: bjtAdmin.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'bjt_get_crm_part_data',
                        nonce: bjtAdmin.nonce,
                        part_number: partNumber
                    },
                    success: function(response) {
                        // 移除加载提示
                        $('.bjt-loading-spinner').remove();
                        
                        if (response.success && response.data) {
                            // 自动填充表单字段
                            if (response.data.name_zh) {
                                $('#name_zh').val(response.data.name_zh);
                            }
                            
                            if (response.data.name_en) {
                                $('#name_en').val(response.data.name_en);
                            }
                            
                            if (response.data.description_zh) {
                                $('#description_zh').val(response.data.description_zh);
                            }
                            
                            if (response.data.description_en) {
                                $('#description_en').val(response.data.description_en);
                            }
                            
                            if (response.data.price) {
                                $('#price').val(response.data.price);
                            }
                            
                            if (response.data.stock) {
                                $('#stock').val(response.data.stock);
                            }
                            
                            // 显示成功消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-success is-dismissible"><p>' + 
                                '从CRM系统获取料号数据成功！' + '</p></div>'
                            );
                        } else {
                            // 显示错误消息
                            $('.bjt-admin-notices').html(
                                '<div class="notice notice-warning is-dismissible"><p>' + 
                                '未找到料号数据，请手动填写。' + '</p></div>'
                            );
                        }
                    },
                    error: function() {
                        // 移除加载提示
                        $('.bjt-loading-spinner').remove();
                        
                        // 显示错误消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-error is-dismissible"><p>' + 
                            '从CRM获取数据失败，请稍后重试或手动填写。' + '</p></div>'
                        );
                    }
                });
            }
        });
    });
    </script>
    
    <style>
    .bjt-admin-wrap {
        margin: 20px 0;
    }
    
    .bjt-admin-content {
        margin-top: 20px;
        max-width: 800px;
    }
    
    .bjt-language-tabs {
        margin-bottom: 20px;
    }
    
    .bjt-language-tab-nav {
        display: flex;
        border-bottom: 1px solid #ccc;
    }
    
    .bjt-language-tab {
        padding: 10px 15px;
        margin-right: 5px;
        border: 1px solid #ccc;
        border-bottom: none;
        background: #f1f1f1;
        text-decoration: none;
        color: #444;
        font-weight: 600;
    }
    
    .bjt-language-tab.active {
        background: #fff;
        border-bottom: 1px solid #fff;
        margin-bottom: -1px;
        color: #0073aa;
    }
    
    .bjt-loading-spinner {
        display: inline-block;
        margin-left: 10px;
        color: #777;
        font-style: italic;
    }
    </style>
    <?php
} 