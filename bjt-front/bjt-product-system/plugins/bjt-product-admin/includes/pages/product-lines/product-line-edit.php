<?php
/**
 * 产品线编辑页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染产品线编辑页面
 */
function bjt_render_product_line_edit_page() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    $api_handler = $bjt_product_admin->get_api_handler();
    
    // 检查是否是编辑模式
    $is_edit = isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['id']);
    $product_line_id = $is_edit ? intval($_GET['id']) : 0;
    
    // 获取产品线数据
    $product_line_data = array(
        'id' => '',
        'title_zh' => '',
        'title_en' => '',
        'description_zh' => '',
        'description_en' => '',
        'consumables_zh' => '',
        'consumables_en' => '',
        'parts_zh' => '',
        'parts_en' => '',
        'image' => '',
        'status' => 'active',
        'sort_order' => 0
    );
    
    if ($is_edit) {
        // 从API获取产品线数据
        $response = $api_handler->get('product-lines/' . $product_line_id);
        
        if (!is_wp_error($response) && isset($response['id'])) {
            $product_line_data = $response;
        } else {
            // 显示错误消息
            echo '<div class="notice notice-error"><p>' . 
                __('无法加载产品线数据。', 'bjt-product-admin') . 
                '</p></div>';
        }
    }
    
    // 创建表单组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
    
    $form_args = array(
        'title' => $is_edit ? __('编辑产品线', 'bjt-product-admin') : __('添加产品线', 'bjt-product-admin'),
        'description' => __('填写产品线信息，支持中英文内容', 'bjt-product-admin'),
        'method' => 'post',
        'action' => '',
        'ajax' => true,
        'multipart' => true,
        'data_source' => 'product-lines',
        'layout' => 'vertical',
        'submit_text' => __('保存产品线', 'bjt-product-admin'),
        'cancel_text' => __('取消', 'bjt-product-admin'),
        'cancel_url' => admin_url('admin.php?page=bjt-product-lines')
    );
    
    $form = new BJT_Form_Component('product-line-form', $form_args);
    
    // 添加分组
    $form->add_group('basic', __('基本信息', 'bjt-product-admin'), array(
        'description' => __('产品线的基本信息', 'bjt-product-admin')
    ));
    
    $form->add_group('content', __('内容信息', 'bjt-product-admin'), array(
        'description' => __('产品线的详细内容', 'bjt-product-admin')
    ));
    
    $form->add_group('media', __('媒体信息', 'bjt-product-admin'), array(
        'description' => __('产品线的图片', 'bjt-product-admin')
    ));
    
    $form->add_group('advanced', __('高级设置', 'bjt-product-admin'), array(
        'description' => __('产品线的高级设置', 'bjt-product-admin'),
        'collapsible' => true,
        'collapsed' => true
    ));
    
    // 添加字段
    $form->add_fields(array(
        'id' => array(
            'type' => 'hidden',
            'default' => $product_line_data['id']
        ),
        'title_zh' => array(
            'type' => 'text',
            'label' => __('标题（中文）', 'bjt-product-admin'),
            'required' => true,
            'placeholder' => __('输入中文标题', 'bjt-product-admin'),
            'default' => $product_line_data['title_zh'],
            'group' => 'basic',
            'validation' => array(
                'required' => true,
                'min' => 2,
                'max' => 100
            )
        ),
        'title_en' => array(
            'type' => 'text',
            'label' => __('标题（英文）', 'bjt-product-admin'),
            'required' => true,
            'placeholder' => __('输入英文标题', 'bjt-product-admin'),
            'default' => $product_line_data['title_en'],
            'group' => 'basic',
            'validation' => array(
                'required' => true,
                'min' => 2,
                'max' => 100
            )
        ),
        'description_zh' => array(
            'type' => 'textarea',
            'label' => __('描述（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入中文描述', 'bjt-product-admin'),
            'default' => $product_line_data['description_zh'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'description_en' => array(
            'type' => 'textarea',
            'label' => __('描述（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入英文描述', 'bjt-product-admin'),
            'default' => $product_line_data['description_en'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'consumables_zh' => array(
            'type' => 'textarea',
            'label' => __('耗材（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入中文耗材描述', 'bjt-product-admin'),
            'default' => $product_line_data['consumables_zh'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'consumables_en' => array(
            'type' => 'textarea',
            'label' => __('耗材（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入英文耗材描述', 'bjt-product-admin'),
            'default' => $product_line_data['consumables_en'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'parts_zh' => array(
            'type' => 'textarea',
            'label' => __('备件（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入中文备件描述', 'bjt-product-admin'),
            'default' => $product_line_data['parts_zh'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'parts_en' => array(
            'type' => 'textarea',
            'label' => __('备件（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入英文备件描述', 'bjt-product-admin'),
            'default' => $product_line_data['parts_en'],
            'group' => 'content',
            'validation' => array(
                'max' => 500
            )
        ),
        'image' => array(
            'type' => 'file',
            'label' => __('产品线图片', 'bjt-product-admin'),
            'default' => $product_line_data['image'],
            'group' => 'media'
        ),
        'status' => array(
            'type' => 'select',
            'label' => __('状态', 'bjt-product-admin'),
            'options' => array(
                'active' => __('上线', 'bjt-product-admin'),
                'inactive' => __('下线', 'bjt-product-admin')
            ),
            'default' => $product_line_data['status'],
            'group' => 'advanced'
        ),
        'sort_order' => array(
            'type' => 'number',
            'label' => __('排序', 'bjt-product-admin'),
            'default' => $product_line_data['sort_order'],
            'group' => 'advanced',
            'validation' => array(
                'min_value' => 0,
                'max_value' => 999
            )
        )
    ));
    
    // 页面开始
    ?>
    <div class="wrap bjt-product-admin-wrap">
        <h1 class="wp-heading-inline">
            <?php echo $is_edit ? __('编辑产品线', 'bjt-product-admin') : __('添加产品线', 'bjt-product-admin'); ?>
        </h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-product-lines')); ?>" class="page-title-action"><?php _e('返回列表', 'bjt-product-admin'); ?></a>
        <hr class="wp-header-end">
        
        <div class="bjt-admin-notices"></div>
        
        <div class="bjt-admin-content">
            <div class="bjt-language-tabs">
                <div class="bjt-language-tab-nav">
                    <a href="#" class="bjt-language-tab active" data-language="zh"><?php _e('中文', 'bjt-product-admin'); ?></a>
                    <a href="#" class="bjt-language-tab" data-language="en"><?php _e('英文', 'bjt-product-admin'); ?></a>
                </div>
            </div>
            
            <?php 
            // 渲染表单
            echo $form->render(); 
            ?>
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
        
        // 表单提交处理
        $('#product-line-form form').on('submit', function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var formData = new FormData($form[0]);
            var isEdit = formData.get('id') ? true : false;
            
            // 禁用提交按钮
            var $submitBtn = $form.find('button[type="submit"]');
            var originalText = $submitBtn.text();
            $submitBtn.prop('disabled', true).text('保存中...');
            
            // 添加AJAX参数
            formData.append('action', 'bjt_submit_form');
            formData.append('nonce', bjtAdmin.nonce);
            formData.append('endpoint', 'product-lines' + (isEdit ? '/' + formData.get('id') : ''));
            formData.append('method', isEdit ? 'put' : 'post');
            
            // 发送AJAX请求
            $.ajax({
                url: bjtAdmin.ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    // 恢复提交按钮
                    $submitBtn.prop('disabled', false).text(originalText);
                    
                    if (response.success) {
                        // 显示成功消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-success is-dismissible"><p>' + 
                            (isEdit ? '产品线更新成功！' : '产品线添加成功！') + '</p></div>'
                        );
                        
                        // 编辑模式下更新ID
                        if (!isEdit && response.data.id) {
                            // 添加成功后更新为编辑模式
                            setTimeout(function() {
                                window.location.href = '<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id='); ?>' + response.data.id;
                            }, 1000);
                        }
                    } else {
                        // 显示错误消息
                        $('.bjt-admin-notices').html(
                            '<div class="notice notice-error is-dismissible"><p>' + 
                            (response.data.message || '保存失败，请稍后重试。') + '</p></div>'
                        );
                        
                        // 显示字段错误
                        if (response.data.errors) {
                            $.each(response.data.errors, function(field, message) {
                                var $field = $form.find('[name="' + field + '"]').closest('.bjt-form-field');
                                $field.addClass('has-error');
                                $field.append('<div class="bjt-field-error">' + message + '</div>');
                            });
                        }
                    }
                },
                error: function() {
                    // 恢复提交按钮
                    $submitBtn.prop('disabled', false).text(originalText);
                    
                    // 显示错误消息
                    $('.bjt-admin-notices').html(
                        '<div class="notice notice-error is-dismissible"><p>' + 
                        '保存失败，请稍后重试。' + '</p></div>'
                    );
                }
            });
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
    
    .bjt-form-group {
        margin-bottom: 20px;
        padding: 20px;
        background: #fff;
        border: 1px solid #ddd;
        box-shadow: 0 1px 1px rgba(0,0,0,0.04);
    }
    
    .bjt-form-group-title {
        margin-top: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .bjt-form-group-description {
        margin-bottom: 15px;
        color: #666;
    }
    
    .bjt-form-field {
        margin-bottom: 15px;
    }
    
    .bjt-form-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
    }
    
    .bjt-form-input {
        width: 100%;
        padding: 8px;
    }
    
    .bjt-form-actions {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
    }
    
    .bjt-field-error {
        color: #dc3232;
        margin-top: 5px;
    }
    
    .bjt-form-field.has-error input,
    .bjt-form-field.has-error textarea,
    .bjt-form-field.has-error select {
        border-color: #dc3232;
    }
    </style>
    <?php
} 