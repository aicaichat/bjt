<?php
/**
 * 主机型号编辑页面
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染主机型号编辑页面
 */
function bjt_render_host_model_edit_page() {
    // 检查是否为编辑模式
    $is_edit_mode = (isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['id']));
    $model_id = $is_edit_mode ? intval($_GET['id']) : 0;
    
    // 检查是否为编辑料号模式
    $is_part_edit_mode = (isset($_GET['action']) && $_GET['action'] === 'edit-part' && isset($_GET['id']));
    $part_id = $is_part_edit_mode ? intval($_GET['id']) : 0;
    
    // 检查是否为添加料号模式
    $is_part_add_mode = (isset($_GET['action']) && $_GET['action'] === 'add-part');
    
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    $api_handler = $bjt_product_admin->get_api_handler();
    
    // 加载表单组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
    
    // 如果是主机型号编辑或添加
    if (!$is_part_edit_mode && !$is_part_add_mode) {
        // 默认主机型号数据
        $model_data = array(
            'id' => '',
            'model' => '',
            'model_en' => '',
            'product_line_id' => '',
            'description_zh' => '',
            'description_en' => '',
            'features_zh' => '',
            'features_en' => '',
            'specifications_zh' => '',
            'specifications_en' => '',
            'image' => '',
            'status' => 'active',
            'sort_order' => 0
        );
        
        // 如果是编辑模式，获取现有数据
        if ($is_edit_mode) {
            $response = $api_handler->get('host-models/' . $model_id);
            
            if (is_wp_error($response)) {
                echo '<div class="notice notice-error"><p>' . esc_html($response->get_error_message()) . '</p></div>';
                return;
            }
            
            if (isset($response['data'])) {
                $model_data = wp_parse_args($response['data'], $model_data);
            } else {
                echo '<div class="notice notice-error"><p>' . __('无法获取主机型号数据', 'bjt-product-admin') . '</p></div>';
                return;
            }
        }
        
        // 获取产品线列表
        $product_lines_response = $api_handler->get('product-lines', array('per_page' => -1));
        $product_line_options = array();
        
        if (!is_wp_error($product_lines_response) && isset($product_lines_response['data'])) {
            foreach ($product_lines_response['data'] as $line) {
                $product_line_options[$line['id']] = $line['title'];
            }
        }
        
        // 创建表单
        $form_args = array(
            'title' => $is_edit_mode ? __('编辑主机型号', 'bjt-product-admin') : __('添加主机型号', 'bjt-product-admin'),
            'description' => __('填写主机型号信息，支持中英文内容', 'bjt-product-admin'),
            'method' => 'post',
            'ajax' => true,
            'data_source' => 'host-models',
            'submit_text' => __('保存', 'bjt-product-admin'),
            'cancel_text' => __('取消', 'bjt-product-admin'),
            'cancel_url' => admin_url('admin.php?page=bjt-host-models')
        );
        
        $form = new BJT_Form_Component('host-model-form', $form_args);
        
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
                'value' => $model_data['id']
            ));
        }
        
        // 添加产品线选择
        $form->add_field(array(
            'id' => 'product_line_id',
            'group' => 'basic-info',
            'type' => 'select',
            'label' => __('产品线', 'bjt-product-admin'),
            'description' => __('选择此主机型号所属的产品线', 'bjt-product-admin'),
            'options' => $product_line_options,
            'value' => $model_data['product_line_id'],
            'required' => true
        ));
        
        // 添加型号字段
        $form->add_field(array(
            'id' => 'model',
            'group' => 'basic-info',
            'type' => 'text',
            'label' => __('型号（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号中文名称', 'bjt-product-admin'),
            'value' => $model_data['model'],
            'required' => true,
            'validation' => array(
                'max_length' => 100
            )
        ));
        
        $form->add_field(array(
            'id' => 'model_en',
            'group' => 'basic-info',
            'type' => 'text',
            'label' => __('型号（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号英文名称', 'bjt-product-admin'),
            'value' => $model_data['model_en'],
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
            'placeholder' => __('输入主机型号中文描述', 'bjt-product-admin'),
            'value' => $model_data['description_zh'],
            'required' => true,
            'validation' => array(
                'max_length' => 1000
            )
        ));
        
        $form->add_field(array(
            'id' => 'description_en',
            'group' => 'content-info',
            'type' => 'textarea',
            'label' => __('描述（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号英文描述', 'bjt-product-admin'),
            'value' => $model_data['description_en'],
            'required' => true,
            'validation' => array(
                'max_length' => 1000
            )
        ));
        
        // 添加功能特性字段
        $form->add_field(array(
            'id' => 'features_zh',
            'group' => 'content-info',
            'type' => 'textarea',
            'label' => __('功能特性（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号中文功能特性', 'bjt-product-admin'),
            'description' => __('每行一个功能点', 'bjt-product-admin'),
            'value' => $model_data['features_zh'],
            'required' => false,
            'validation' => array(
                'max_length' => 1000
            )
        ));
        
        $form->add_field(array(
            'id' => 'features_en',
            'group' => 'content-info',
            'type' => 'textarea',
            'label' => __('功能特性（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号英文功能特性', 'bjt-product-admin'),
            'description' => __('每行一个功能点', 'bjt-product-admin'),
            'value' => $model_data['features_en'],
            'required' => false,
            'validation' => array(
                'max_length' => 1000
            )
        ));
        
        // 添加技术规格字段
        $form->add_field(array(
            'id' => 'specifications_zh',
            'group' => 'content-info',
            'type' => 'textarea',
            'label' => __('技术规格（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号中文技术规格', 'bjt-product-admin'),
            'description' => __('可使用HTML格式化内容', 'bjt-product-admin'),
            'value' => $model_data['specifications_zh'],
            'required' => false,
            'validation' => array(
                'max_length' => 2000
            )
        ));
        
        $form->add_field(array(
            'id' => 'specifications_en',
            'group' => 'content-info',
            'type' => 'textarea',
            'label' => __('技术规格（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入主机型号英文技术规格', 'bjt-product-admin'),
            'description' => __('可使用HTML格式化内容', 'bjt-product-admin'),
            'value' => $model_data['specifications_en'],
            'required' => false,
            'validation' => array(
                'max_length' => 2000
            )
        ));
        
        // 添加图片字段
        $form->add_field(array(
            'id' => 'image',
            'group' => 'media-info',
            'type' => 'upload',
            'label' => __('主机图片', 'bjt-product-admin'),
            'description' => __('上传主机型号图片，建议尺寸800x600px', 'bjt-product-admin'),
            'value' => $model_data['image'],
            'accept' => 'image/*',
            'required' => false
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
            'value' => $model_data['status'],
            'required' => true
        ));
        
        $form->add_field(array(
            'id' => 'sort_order',
            'group' => 'advanced-settings',
            'type' => 'number',
            'label' => __('排序顺序', 'bjt-product-admin'),
            'description' => __('数值越小排序越靠前', 'bjt-product-admin'),
            'value' => $model_data['sort_order'],
            'min' => 0,
            'max' => 999,
            'step' => 1,
            'required' => true
        ));
        
        // 渲染表单
        ?>
        <div class="wrap bjt-product-admin-wrap">
            <h1 class="wp-heading-inline">
                <?php echo $is_edit_mode ? esc_html__('编辑主机型号', 'bjt-product-admin') : esc_html__('添加主机型号', 'bjt-product-admin'); ?>
            </h1>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>" class="page-title-action"><?php esc_html_e('返回列表', 'bjt-product-admin'); ?></a>
            <hr class="wp-header-end">
            
            <div class="bjt-admin-notices"></div>
            
            <div class="bjt-admin-content">
                <?php echo $form->render(); ?>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // 表单处理
            if (typeof BJT !== 'undefined' && typeof BJT.Components !== 'undefined') {
                // 表单已由组件系统初始化
                
                // 语言标签切换
                $('.bjt-language-tabs a').on('click', function(e) {
                    e.preventDefault();
                    var lang = $(this).data('lang');
                    
                    // 激活当前标签
                    $('.bjt-language-tabs a').removeClass('active');
                    $(this).addClass('active');
                    
                    // 显示对应语言的字段
                    $('.bjt-field-language').hide();
                    $('.bjt-field-language-' + lang).show();
                });
                
                // 初始显示中文
                $('.bjt-language-tabs a[data-lang="zh"]').trigger('click');
            }
        });
        </script>
        
        <style>
        .bjt-language-tabs {
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
        }
        
        .bjt-language-tabs a {
            display: inline-block;
            padding: 8px 15px;
            margin-right: 5px;
            border: 1px solid #ccc;
            border-bottom: none;
            text-decoration: none;
            color: #555;
            background: #f7f7f7;
        }
        
        .bjt-language-tabs a.active {
            background: #fff;
            border-bottom: 1px solid #fff;
            margin-bottom: -1px;
            color: #000;
        }
        </style>
        <?php
    }
    // 如果是料号编辑或添加
    else {
        // 默认料号数据
        $part_data = array(
            'id' => '',
            'part_number' => '',
            'host_model_id' => '',
            'name_zh' => '',
            'name_en' => '',
            'description_zh' => '',
            'description_en' => '',
            'voltage' => '',
            'frequency' => '',
            'power' => '',
            'weight' => '',
            'dimensions' => '',
            'image' => '',
            'status' => 'active',
            'sort_order' => 0
        );
        
        // 如果是编辑模式，获取现有数据
        if ($is_part_edit_mode) {
            $response = $api_handler->get('parts/' . $part_id);
            
            if (is_wp_error($response)) {
                echo '<div class="notice notice-error"><p>' . esc_html($response->get_error_message()) . '</p></div>';
                return;
            }
            
            if (isset($response['data'])) {
                $part_data = wp_parse_args($response['data'], $part_data);
            } else {
                echo '<div class="notice notice-error"><p>' . __('无法获取料号数据', 'bjt-product-admin') . '</p></div>';
                return;
            }
        }
        
        // 获取主机型号列表
        $host_models_response = $api_handler->get('host-models', array('per_page' => -1));
        $host_model_options = array();
        
        if (!is_wp_error($host_models_response) && isset($host_models_response['data'])) {
            foreach ($host_models_response['data'] as $model) {
                $host_model_options[$model['id']] = $model['model'];
            }
        }
        
        // 创建表单
        $form_args = array(
            'title' => $is_part_edit_mode ? __('编辑料号', 'bjt-product-admin') : __('添加料号', 'bjt-product-admin'),
            'description' => __('填写料号信息，支持中英文内容', 'bjt-product-admin'),
            'method' => 'post',
            'ajax' => true,
            'data_source' => 'parts',
            'submit_text' => __('保存', 'bjt-product-admin'),
            'cancel_text' => __('取消', 'bjt-product-admin'),
            'cancel_url' => admin_url('admin.php?page=bjt-host-models')
        );
        
        $form = new BJT_Form_Component('part-form', $form_args);
        
        // 添加表单字段组
        $form->add_group(array(
            'id' => 'basic-info',
            'title' => __('基本信息', 'bjt-product-admin')
        ));
        
        $form->add_group(array(
            'id' => 'technical-info',
            'title' => __('技术参数', 'bjt-product-admin')
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
        if ($is_part_edit_mode) {
            $form->add_field(array(
                'id' => 'id',
                'type' => 'hidden',
                'value' => $part_data['id']
            ));
        }
        
        // 添加主机型号选择
        $form->add_field(array(
            'id' => 'host_model_id',
            'group' => 'basic-info',
            'type' => 'select',
            'label' => __('主机型号', 'bjt-product-admin'),
            'description' => __('选择此料号所属的主机型号', 'bjt-product-admin'),
            'options' => $host_model_options,
            'value' => $part_data['host_model_id'],
            'required' => true
        ));
        
        // 添加料号字段
        $form->add_field(array(
            'id' => 'part_number',
            'group' => 'basic-info',
            'type' => 'text',
            'label' => __('料号', 'bjt-product-admin'),
            'placeholder' => __('输入料号', 'bjt-product-admin'),
            'value' => $part_data['part_number'],
            'required' => true,
            'validation' => array(
                'max_length' => 50
            )
        ));
        
        $form->add_field(array(
            'id' => 'name_zh',
            'group' => 'basic-info',
            'type' => 'text',
            'label' => __('名称（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入料号中文名称', 'bjt-product-admin'),
            'value' => $part_data['name_zh'],
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
            'placeholder' => __('输入料号英文名称', 'bjt-product-admin'),
            'value' => $part_data['name_en'],
            'required' => true,
            'validation' => array(
                'max_length' => 100
            )
        ));
        
        // 添加描述字段
        $form->add_field(array(
            'id' => 'description_zh',
            'group' => 'basic-info',
            'type' => 'textarea',
            'label' => __('描述（中文）', 'bjt-product-admin'),
            'placeholder' => __('输入料号中文描述', 'bjt-product-admin'),
            'value' => $part_data['description_zh'],
            'required' => false,
            'validation' => array(
                'max_length' => 500
            )
        ));
        
        $form->add_field(array(
            'id' => 'description_en',
            'group' => 'basic-info',
            'type' => 'textarea',
            'label' => __('描述（英文）', 'bjt-product-admin'),
            'placeholder' => __('输入料号英文描述', 'bjt-product-admin'),
            'value' => $part_data['description_en'],
            'required' => false,
            'validation' => array(
                'max_length' => 500
            )
        ));
        
        // 添加技术参数字段
        $form->add_field(array(
            'id' => 'voltage',
            'group' => 'technical-info',
            'type' => 'text',
            'label' => __('电压', 'bjt-product-admin'),
            'placeholder' => __('例如：220V', 'bjt-product-admin'),
            'value' => $part_data['voltage'],
            'required' => false
        ));
        
        $form->add_field(array(
            'id' => 'frequency',
            'group' => 'technical-info',
            'type' => 'text',
            'label' => __('频率', 'bjt-product-admin'),
            'placeholder' => __('例如：50Hz', 'bjt-product-admin'),
            'value' => $part_data['frequency'],
            'required' => false
        ));
        
        $form->add_field(array(
            'id' => 'power',
            'group' => 'technical-info',
            'type' => 'text',
            'label' => __('功率', 'bjt-product-admin'),
            'placeholder' => __('例如：2000W', 'bjt-product-admin'),
            'value' => $part_data['power'],
            'required' => false
        ));
        
        $form->add_field(array(
            'id' => 'weight',
            'group' => 'technical-info',
            'type' => 'text',
            'label' => __('重量', 'bjt-product-admin'),
            'placeholder' => __('例如：5kg', 'bjt-product-admin'),
            'value' => $part_data['weight'],
            'required' => false
        ));
        
        $form->add_field(array(
            'id' => 'dimensions',
            'group' => 'technical-info',
            'type' => 'text',
            'label' => __('尺寸', 'bjt-product-admin'),
            'placeholder' => __('例如：300x200x100mm', 'bjt-product-admin'),
            'value' => $part_data['dimensions'],
            'required' => false
        ));
        
        // 添加图片字段
        $form->add_field(array(
            'id' => 'image',
            'group' => 'media-info',
            'type' => 'upload',
            'label' => __('料号图片', 'bjt-product-admin'),
            'description' => __('上传料号图片，建议尺寸800x600px', 'bjt-product-admin'),
            'value' => $part_data['image'],
            'accept' => 'image/*',
            'required' => false
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
            'value' => $part_data['status'],
            'required' => true
        ));
        
        $form->add_field(array(
            'id' => 'sort_order',
            'group' => 'advanced-settings',
            'type' => 'number',
            'label' => __('排序顺序', 'bjt-product-admin'),
            'description' => __('数值越小排序越靠前', 'bjt-product-admin'),
            'value' => $part_data['sort_order'],
            'min' => 0,
            'max' => 999,
            'step' => 1,
            'required' => true
        ));
        
        // 渲染表单
        ?>
        <div class="wrap bjt-product-admin-wrap">
            <h1 class="wp-heading-inline">
                <?php echo $is_part_edit_mode ? esc_html__('编辑料号', 'bjt-product-admin') : esc_html__('添加料号', 'bjt-product-admin'); ?>
            </h1>
            <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-host-models')); ?>" class="page-title-action"><?php esc_html_e('返回列表', 'bjt-product-admin'); ?></a>
            <hr class="wp-header-end">
            
            <div class="bjt-admin-notices"></div>
            
            <div class="bjt-admin-content">
                <?php echo $form->render(); ?>
            </div>
        </div>
        <?php
    }
} 