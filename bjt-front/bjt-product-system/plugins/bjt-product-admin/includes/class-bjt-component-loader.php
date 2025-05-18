<?php
/**
 * BJT组件加载器类
 * 
 * 用于注册和加载表格、表单和上传组件
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Component_Loader {
    /**
     * 单例实例
     *
     * @var BJT_Component_Loader
     */
    private static $instance = null;
    
    /**
     * 注册的组件
     *
     * @var array
     */
    private $components = array();
    
    /**
     * 构造函数
     */
    private function __construct() {
        // 注册并加载组件
        $this->register_components();
    }
    
    /**
     * 获取单例实例
     *
     * @return BJT_Component_Loader
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 注册组件
     */
    private function register_components() {
        // 加载必要的文件
        $this->load_component_files();
        
        // 注册表格组件
        $this->register_component('table', 'BJT_Table_Component');
        
        // 注册表单组件
        $this->register_component('form', 'BJT_Form_Component');
        
        // 注册上传组件
        $this->register_component('upload', 'BJT_Upload_Component');
    }
    
    /**
     * 加载组件文件
     */
    private function load_component_files() {
        $component_dir = BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/';
        
        // 加载表格组件
        if (file_exists($component_dir . 'class-bjt-table-component.php')) {
            require_once $component_dir . 'class-bjt-table-component.php';
        }
        
        // 加载表单组件
        if (file_exists($component_dir . 'class-bjt-form-component.php')) {
            require_once $component_dir . 'class-bjt-form-component.php';
        }
        
        // 加载上传组件
        if (file_exists($component_dir . 'class-bjt-upload-component.php')) {
            require_once $component_dir . 'class-bjt-upload-component.php';
        }
    }
    
    /**
     * 注册组件
     *
     * @param string $type 组件类型
     * @param string $class_name 组件类名
     */
    public function register_component($type, $class_name) {
        if (class_exists($class_name)) {
            $this->components[$type] = $class_name;
        } else {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('BJT Component Loader: 无法找到组件类 ' . $class_name);
            }
        }
    }
    
    /**
     * 获取组件类
     *
     * @param string $type 组件类型
     * @return string|null 组件类名或null
     */
    public function get_component_class($type) {
        return isset($this->components[$type]) ? $this->components[$type] : null;
    }
    
    /**
     * 渲染表格
     *
     * @param string $id 表格ID
     * @param array $args 表格参数
     * @return string 表格HTML
     */
    public function render_table($id, $args = array()) {
        $class_name = $this->get_component_class('table');
        if ($class_name && class_exists($class_name)) {
            $table = new $class_name($id, $args);
            return $table->render();
        }
        return '<div class="notice notice-error"><p>' . __('表格组件未找到', 'bjt-product-admin') . '</p></div>';
    }
    
    /**
     * 渲染表单
     *
     * @param string $id 表单ID
     * @param array $args 表单参数
     * @return string 表单HTML
     */
    public function render_form($id, $args = array()) {
        $class_name = $this->get_component_class('form');
        if ($class_name && class_exists($class_name)) {
            $form = new $class_name($id, $args);
            return $form->render();
        }
        return '<div class="notice notice-error"><p>' . __('表单组件未找到', 'bjt-product-admin') . '</p></div>';
    }
    
    /**
     * 渲染上传组件
     *
     * @param string $id 上传组件ID
     * @param array $args 上传组件参数
     * @return string 上传组件HTML
     */
    public function render_upload($id, $args = array()) {
        $class_name = $this->get_component_class('upload');
        if ($class_name && class_exists($class_name)) {
            $upload = new $class_name($id, $args);
            return $upload->render();
        }
        return '<div class="notice notice-error"><p>' . __('上传组件未找到', 'bjt-product-admin') . '</p></div>';
    }
} 