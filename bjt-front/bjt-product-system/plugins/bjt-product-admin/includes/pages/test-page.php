<?php
/**
 * 测试页面
 * 
 * 用于测试组件功能
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 渲染测试页面
 */
function bjt_product_admin_render_test_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('组件测试页面', 'bjt-product-admin'); ?></h1>
        
        <div class="bjt-tabs">
            <ul class="bjt-tab-nav">
                <li class="active"><a href="#table-test"><?php _e('表格测试', 'bjt-product-admin'); ?></a></li>
                <li><a href="#form-test"><?php _e('表单测试', 'bjt-product-admin'); ?></a></li>
                <li><a href="#upload-test"><?php _e('上传测试', 'bjt-product-admin'); ?></a></li>
            </ul>
            
            <div class="bjt-tab-content">
                <div id="table-test" class="bjt-tab-pane active">
                    <h2><?php _e('表格组件测试', 'bjt-product-admin'); ?></h2>
                    <?php bjt_product_admin_render_test_table(); ?>
                </div>
                
                <div id="form-test" class="bjt-tab-pane">
                    <h2><?php _e('表单组件测试', 'bjt-product-admin'); ?></h2>
                    <?php bjt_product_admin_render_test_form(); ?>
                </div>
                
                <div id="upload-test" class="bjt-tab-pane">
                    <h2><?php _e('上传组件测试', 'bjt-product-admin'); ?></h2>
                    <?php bjt_product_admin_render_test_upload(); ?>
                </div>
            </div>
        </div>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        // 简单的选项卡实现
        $('.bjt-tab-nav a').on('click', function(e) {
            e.preventDefault();
            
            // 激活导航标签
            $(this).parent().addClass('active').siblings().removeClass('active');
            
            // 显示对应内容
            var target = $(this).attr('href');
            $(target).addClass('active').siblings().removeClass('active');
        });
    });
    </script>
    
    <style>
    .bjt-tabs {
        margin-top: 20px;
    }
    
    .bjt-tab-nav {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
        border-bottom: 1px solid #ccc;
    }
    
    .bjt-tab-nav li {
        margin: 0;
        margin-bottom: -1px;
    }
    
    .bjt-tab-nav li a {
        display: block;
        padding: 10px 15px;
        text-decoration: none;
        background: #f1f1f1;
        border: 1px solid #ccc;
        border-bottom: none;
        margin-right: 5px;
        color: #555;
    }
    
    .bjt-tab-nav li.active a {
        background: #fff;
        border-bottom: 1px solid #fff;
        color: #000;
    }
    
    .bjt-tab-content {
        padding: 20px;
        border: 1px solid #ccc;
        border-top: none;
    }
    
    .bjt-tab-pane {
        display: none;
    }
    
    .bjt-tab-pane.active {
        display: block;
    }
    </style>
    <?php
}

/**
 * 渲染测试表格
 */
function bjt_product_admin_render_test_table() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    
    // 创建测试表格
    $table_args = array(
        'title' => __('测试表格', 'bjt-product-admin'),
        'description' => __('这是一个用于测试的表格组件', 'bjt-product-admin'),
        'data_source' => 'product-lines', // 假设的API端点
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
                    'active' => __('激活', 'bjt-product-admin'),
                    'inactive' => __('未激活', 'bjt-product-admin')
                )
            )
        )
    );
    
    // 测试数据
    $test_data = array(
        array(
            'id' => 1,
            'title' => '产品线A',
            'description' => '这是产品线A的描述',
            'image' => 'https://via.placeholder.com/50',
            'status' => 'active',
            'created_at' => '2023-05-01 10:00:00'
        ),
        array(
            'id' => 2,
            'title' => '产品线B',
            'description' => '这是产品线B的描述',
            'image' => 'https://via.placeholder.com/50',
            'status' => 'inactive',
            'created_at' => '2023-05-02 11:00:00'
        ),
        array(
            'id' => 3,
            'title' => '产品线C',
            'description' => '这是产品线C的描述',
            'image' => 'https://via.placeholder.com/50',
            'status' => 'active',
            'created_at' => '2023-05-03 12:00:00'
        )
    );
    
    // 渲染表格
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-table-component.php';
    $table = new BJT_Table_Component('test-table', $table_args);
    
    // 添加列
    $table->add_columns(array(
        'id' => array(
            'label' => 'ID',
            'sortable' => true,
            'width' => '50px'
        ),
        'title' => array(
            'label' => __('标题', 'bjt-product-admin'),
            'sortable' => true
        ),
        'description' => array(
            'label' => __('描述', 'bjt-product-admin'),
            'sortable' => false
        ),
        'image' => array(
            'label' => __('图片', 'bjt-product-admin'),
            'sortable' => false,
            'type' => 'image'
        ),
        'status' => array(
            'label' => __('状态', 'bjt-product-admin'),
            'sortable' => true,
            'type' => 'status'
        ),
        'created_at' => array(
            'label' => __('创建时间', 'bjt-product-admin'),
            'sortable' => true,
            'type' => 'date'
        )
    ));
    
    // 添加操作
    $table->add_action('edit', __('编辑', 'bjt-product-admin'), '#edit/{id}', array('icon' => 'edit', 'class' => 'button-primary'));
    $table->add_action('delete', __('删除', 'bjt-product-admin'), '#delete/{id}', array('icon' => 'trash', 'confirm' => true));
    
    // 添加批量操作
    $table->add_bulk_action('delete', __('删除', 'bjt-product-admin'));
    $table->add_bulk_action('activate', __('激活', 'bjt-product-admin'));
    $table->add_bulk_action('deactivate', __('停用', 'bjt-product-admin'));
    
    // 设置数据
    $table->set_data($test_data);
    
    // 输出表格
    echo $table->render();
}

/**
 * 渲染测试表单
 */
function bjt_product_admin_render_test_form() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    
    // 创建测试表单
    $form_args = array(
        'title' => __('测试表单', 'bjt-product-admin'),
        'description' => __('这是一个用于测试的表单组件', 'bjt-product-admin'),
        'method' => 'post',
        'action' => '',
        'ajax' => true,
        'multipart' => true,
        'data_source' => 'product-lines', // 假设的API端点
        'layout' => 'grid',
        'columns' => 2
    );
    
    // 测试数据
    $test_data = array(
        'id' => 1,
        'title' => '产品线A',
        'description' => '这是产品线A的描述',
        'image' => 'https://via.placeholder.com/200',
        'status' => 'active',
        'created_at' => '2023-05-01 10:00:00',
        'options' => array('option1', 'option3')
    );
    
    // 渲染表单
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
    $form = new BJT_Form_Component('test-form', $form_args);
    
    // 添加分组
    $form->add_group('basic', __('基本信息', 'bjt-product-admin'), array(
        'description' => __('基本产品线信息', 'bjt-product-admin'),
        'collapsible' => true
    ));
    
    $form->add_group('additional', __('附加信息', 'bjt-product-admin'), array(
        'description' => __('附加产品线信息', 'bjt-product-admin'),
        'collapsible' => true,
        'collapsed' => true
    ));
    
    // 添加字段
    $form->add_fields(array(
        'id' => array(
            'type' => 'hidden',
            'default' => ''
        ),
        'title' => array(
            'type' => 'text',
            'label' => __('标题', 'bjt-product-admin'),
            'required' => true,
            'placeholder' => __('输入产品线标题', 'bjt-product-admin'),
            'group' => 'basic',
            'validation' => array(
                'required' => true,
                'min' => 2,
                'max' => 100
            )
        ),
        'description' => array(
            'type' => 'textarea',
            'label' => __('描述', 'bjt-product-admin'),
            'placeholder' => __('输入产品线描述', 'bjt-product-admin'),
            'group' => 'basic',
            'validation' => array(
                'max' => 500
            )
        ),
        'image' => array(
            'type' => 'file',
            'label' => __('图片', 'bjt-product-admin'),
            'group' => 'basic'
        ),
        'status' => array(
            'type' => 'select',
            'label' => __('状态', 'bjt-product-admin'),
            'options' => array(
                'active' => __('激活', 'bjt-product-admin'),
                'inactive' => __('未激活', 'bjt-product-admin')
            ),
            'default' => 'active',
            'group' => 'basic'
        ),
        'options' => array(
            'type' => 'checkbox',
            'label' => __('选项', 'bjt-product-admin'),
            'options' => array(
                'option1' => __('选项1', 'bjt-product-admin'),
                'option2' => __('选项2', 'bjt-product-admin'),
                'option3' => __('选项3', 'bjt-product-admin')
            ),
            'group' => 'additional'
        ),
        'category' => array(
            'type' => 'radio',
            'label' => __('类别', 'bjt-product-admin'),
            'options' => array(
                'category1' => __('类别1', 'bjt-product-admin'),
                'category2' => __('类别2', 'bjt-product-admin'),
                'category3' => __('类别3', 'bjt-product-admin')
            ),
            'default' => 'category1',
            'group' => 'additional'
        ),
        'notes' => array(
            'type' => 'editor',
            'label' => __('备注', 'bjt-product-admin'),
            'group' => 'additional'
        ),
        'featured' => array(
            'type' => 'checkbox',
            'label' => __('特色产品线', 'bjt-product-admin'),
            'group' => 'additional'
        )
    ));
    
    // 设置数据
    $form->set_data($test_data);
    
    // 输出表单
    echo $form->render();
}

/**
 * 渲染测试上传
 */
function bjt_product_admin_render_test_upload() {
    // 获取组件加载器
    $bjt_product_admin = BJT_Product_Admin::get_instance();
    $component_loader = $bjt_product_admin->get_component_loader();
    
    // 创建单个文件上传组件
    require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-upload-component.php';
    
    $single_upload_args = array(
        'title' => __('单文件上传', 'bjt-product-admin'),
        'description' => __('这是一个用于测试的单文件上传组件', 'bjt-product-admin'),
        'field_name' => 'single_file',
        'multiple' => false,
        'image_only' => true,
        'allowed_extensions' => array('jpg', 'jpeg', 'png', 'gif'),
        'max_file_size' => 5 * 1024 * 1024, // 5MB
        'show_preview' => true,
        'current_value' => 'https://via.placeholder.com/200'
    );
    
    $single_upload = new BJT_Upload_Component('single-upload', $single_upload_args);
    
    // 创建多文件上传组件
    $multi_upload_args = array(
        'title' => __('多文件上传', 'bjt-product-admin'),
        'description' => __('这是一个用于测试的多文件上传组件', 'bjt-product-admin'),
        'field_name' => 'multi_files',
        'multiple' => true,
        'max_files' => 5,
        'allowed_extensions' => array('jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'),
        'max_file_size' => 10 * 1024 * 1024, // 10MB
        'current_value' => array(
            'https://via.placeholder.com/100',
            'https://via.placeholder.com/100'
        )
    );
    
    $multi_upload = new BJT_Upload_Component('multi-upload', $multi_upload_args);
    
    // 输出上传组件
    echo '<div class="bjt-upload-test-container">';
    echo '<div class="bjt-upload-test-single">';
    echo $single_upload->render();
    echo '</div>';
    
    echo '<div class="bjt-upload-test-multi" style="margin-top: 30px;">';
    echo $multi_upload->render();
    echo '</div>';
    echo '</div>';
} 