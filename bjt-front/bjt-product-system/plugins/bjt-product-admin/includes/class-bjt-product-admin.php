<?php
/**
 * BJT产品管理系统主类
 * 
 * 用于初始化产品管理系统
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Admin {
    /**
     * 单例实例
     *
     * @var BJT_Product_Admin
     */
    private static $instance = null;

    /**
     * 组件加载器实例
     * 
     * @var BJT_Component_Loader
     */
    private $component_loader;
    
    /**
     * API处理器实例
     * 
     * @var BJT_API_Handler
     */
    private $api_handler;
    
    /**
     * 构造函数
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * 获取单例实例
     *
     * @return BJT_Product_Admin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 初始化
     */
    private function init() {
        // 加载组件加载器
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-component-loader.php';
        $this->component_loader = BJT_Component_Loader::get_instance();
        
        // 加载API处理器
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/class-bjt-api-handler.php';
        $this->api_handler = BJT_API_Handler::get_instance();
        
        // 注册AJAX操作
        $this->register_ajax_actions();
        
        // 注册管理界面资源
        add_action('admin_enqueue_scripts', array($this, 'register_admin_assets'));
    }
    
    /**
     * 注册AJAX操作
     */
    private function register_ajax_actions() {
        // 表格操作
        add_action('wp_ajax_bjt_load_table', array($this, 'ajax_load_table'));
        add_action('wp_ajax_bjt_delete_item', array($this, 'ajax_delete_item'));
        add_action('wp_ajax_bjt_toggle_status', array($this, 'ajax_toggle_status'));
        
        // 上传操作
        add_action('wp_ajax_bjt_upload_file', array($this, 'ajax_upload_file'));
        
        // 表单操作
        add_action('wp_ajax_bjt_submit_form', array($this, 'ajax_submit_form'));
        
        // 导入导出操作
        add_action('wp_ajax_bjt_import_table', array($this, 'ajax_import_table'));
        add_action('wp_ajax_bjt_export_table', array($this, 'ajax_export_table'));
    }
    
    /**
     * 注册管理界面资源
     *
     * @param string $hook_suffix 当前页面的钩子后缀
     */
    public function register_admin_assets($hook_suffix) {
        // 检查是否在产品管理页面
        if (strpos($hook_suffix, 'bjt-product') === false) {
            return;
        }

        // 注册样式
        wp_register_style(
            'bjt-product-admin',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            BJT_PRODUCT_ADMIN_VERSION
        );
        
        // 注册脚本
        wp_register_script(
            'bjt-product-admin',
            BJT_PRODUCT_ADMIN_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'jquery-ui-sortable', 'jquery-ui-datepicker'),
            BJT_PRODUCT_ADMIN_VERSION,
            true
        );

        // 本地化脚本
        wp_localize_script('bjt-product-admin', 'bjtProductAdmin', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('bjt-product-admin-nonce'),
            'strings' => array(
                'confirmDelete' => __('确定要删除此项吗？', 'bjt-product-admin'),
                'confirmBulkDelete' => __('确定要删除所选项吗？', 'bjt-product-admin'),
                'deleted' => __('已删除', 'bjt-product-admin'),
                'error' => __('出错了', 'bjt-product-admin'),
                'noItemsSelected' => __('请先选择项目', 'bjt-product-admin'),
                'saving' => __('保存中...', 'bjt-product-admin'),
                'saved' => __('已保存', 'bjt-product-admin'),
                'uploadError' => __('上传失败', 'bjt-product-admin'),
                'uploadSuccess' => __('上传成功', 'bjt-product-admin'),
                'confirmCancel' => __('确定要取消吗？未保存的更改将丢失。', 'bjt-product-admin')
            )
        ));
        
        // 加载样式和脚本
        wp_enqueue_style('bjt-product-admin');
        wp_enqueue_script('bjt-product-admin');
    }
    
    /**
     * AJAX处理：加载表格数据
     */
    public function ajax_load_table() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $table_id = isset($_REQUEST['table_id']) ? sanitize_text_field($_REQUEST['table_id']) : '';
        $page = isset($_REQUEST['page']) ? intval($_REQUEST['page']) : 1;
        $per_page = isset($_REQUEST['per_page']) ? intval($_REQUEST['per_page']) : 20;
        $search = isset($_REQUEST['search']) ? sanitize_text_field($_REQUEST['search']) : '';
        $sort_by = isset($_REQUEST['sort_by']) ? sanitize_text_field($_REQUEST['sort_by']) : 'id';
        $sort_order = isset($_REQUEST['sort_order']) ? sanitize_text_field($_REQUEST['sort_order']) : 'desc';
        $filters = isset($_REQUEST['filters']) ? $_REQUEST['filters'] : array();
        
        if (empty($table_id)) {
            wp_send_json_error(array('message' => __('表格ID不能为空', 'bjt-product-admin')));
        }
        
        // 获取表格数据源
        $data_source = isset($_REQUEST['data_source']) ? sanitize_text_field($_REQUEST['data_source']) : '';
        
        if (empty($data_source)) {
            wp_send_json_error(array('message' => __('数据源不能为空', 'bjt-product-admin')));
        }
        
        // 使用API处理器获取数据
        $params = array(
            'page' => $page,
            'per_page' => $per_page,
            'search' => $search,
            'sort_by' => $sort_by,
            'sort_order' => $sort_order
        );
        
        // 添加过滤参数
        if (!empty($filters) && is_array($filters)) {
            foreach ($filters as $key => $value) {
                $params[$key] = sanitize_text_field($value);
            }
        }
        
        // 使用API处理器获取数据
        $response = $this->api_handler->get($data_source, $params);
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        // 检查响应格式
        if (!isset($response['items']) || !isset($response['total']) || !isset($response['total_pages'])) {
            wp_send_json_error(array('message' => __('无效的响应数据格式', 'bjt-product-admin')));
        }
        
        wp_send_json_success($response);
    }
    
    /**
     * AJAX处理：删除表格项
     */
    public function ajax_delete_item() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $endpoint = isset($_REQUEST['endpoint']) ? sanitize_text_field($_REQUEST['endpoint']) : '';
        $item_id = isset($_REQUEST['item_id']) ? intval($_REQUEST['item_id']) : 0;
        
        if (empty($endpoint) || empty($item_id)) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 构建删除端点
        $delete_endpoint = rtrim($endpoint, '/') . '/' . $item_id;
        
        // 使用API处理器删除数据
        $response = $this->api_handler->delete($delete_endpoint);
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        wp_send_json_success(array('message' => __('项目已删除', 'bjt-product-admin')));
    }
    
    /**
     * AJAX处理：切换状态
     */
    public function ajax_toggle_status() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $endpoint = isset($_REQUEST['endpoint']) ? sanitize_text_field($_REQUEST['endpoint']) : '';
        $item_id = isset($_REQUEST['item_id']) ? intval($_REQUEST['item_id']) : 0;
        $current_status = isset($_REQUEST['current_status']) ? sanitize_text_field($_REQUEST['current_status']) : '';
        $status_field = isset($_REQUEST['status_field']) ? sanitize_text_field($_REQUEST['status_field']) : 'status';
        
        if (empty($endpoint) || empty($item_id)) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 构建更新端点
        $update_endpoint = rtrim($endpoint, '/') . '/' . $item_id;
        
        // 确定新状态
        $new_status = ($current_status === 'active') ? 'inactive' : 'active';
        
        // 准备数据
        $data = array(
            $status_field => $new_status
        );
        
        // 使用API处理器更新数据
        $response = $this->api_handler->put($update_endpoint, $data);
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        wp_send_json_success(array(
            'message' => __('状态已更新', 'bjt-product-admin'),
            'new_status' => $new_status
        ));
    }
    
    /**
     * AJAX处理：上传文件
     */
    public function ajax_upload_file() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $upload_id = isset($_REQUEST['upload_id']) ? sanitize_text_field($_REQUEST['upload_id']) : '';
        
        if (empty($upload_id) || empty($_FILES['file'])) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 获取上传组件实例
        require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-upload-component.php';
        
        // 创建默认实例
        $upload = new BJT_Upload_Component($upload_id);
        
        // 处理上传
        $result = $upload->handle_upload($_FILES['file']);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array('message' => $result->get_error_message()));
        }
        
        wp_send_json_success(array(
            'message' => __('文件上传成功', 'bjt-product-admin'),
            'file' => $result
        ));
    }

    /**
     * AJAX处理：提交表单
     */
    public function ajax_submit_form() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $form_id = isset($_REQUEST['form_id']) ? sanitize_text_field($_REQUEST['form_id']) : '';
        $endpoint = isset($_REQUEST['endpoint']) ? sanitize_text_field($_REQUEST['endpoint']) : '';
        $method = isset($_REQUEST['method']) ? strtolower(sanitize_text_field($_REQUEST['method'])) : 'post';
        $item_id = isset($_REQUEST['item_id']) ? intval($_REQUEST['item_id']) : 0;
        
        if (empty($form_id) || empty($endpoint)) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 获取提交的数据
        $data = array();
        parse_str($_REQUEST['form_data'], $data);
        
        // 准备数据
        $sanitized_data = array();
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized_data[$key] = array_map('sanitize_text_field', $value);
            } else {
                $sanitized_data[$key] = sanitize_text_field($value);
            }
        }
        
        // 验证数据
        if (isset($_REQUEST['validation_rules']) && !empty($_REQUEST['validation_rules'])) {
            $validation_rules = json_decode(stripslashes($_REQUEST['validation_rules']), true);
            
            require_once BJT_PRODUCT_ADMIN_PLUGIN_DIR . 'includes/components/class-bjt-form-component.php';
            $errors = BJT_Form_Component::validate($sanitized_data, $validation_rules);
            
            if (!empty($errors)) {
                wp_send_json_error(array(
                    'message' => __('表单验证失败', 'bjt-product-admin'),
                    'errors' => $errors
                ));
            }
        }
        
        // 根据方法处理API请求
        $api_endpoint = $endpoint;
        if ($method === 'put' && $item_id > 0) {
            $api_endpoint = rtrim($endpoint, '/') . '/' . $item_id;
        }
        
        // 使用API处理器提交数据
        if ($method === 'post') {
            $response = $this->api_handler->post($api_endpoint, $sanitized_data);
        } elseif ($method === 'put') {
            $response = $this->api_handler->put($api_endpoint, $sanitized_data);
        } else {
            wp_send_json_error(array('message' => __('不支持的请求方法', 'bjt-product-admin')));
        }
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        wp_send_json_success(array(
            'message' => __('表单提交成功', 'bjt-product-admin'),
            'data' => $response
        ));
    }
    
    /**
     * AJAX处理：导入表格数据
     */
    public function ajax_import_table() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $endpoint = isset($_REQUEST['endpoint']) ? sanitize_text_field($_REQUEST['endpoint']) : '';
        
        if (empty($endpoint) || empty($_FILES['import_file'])) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 检查文件类型
        $file = $_FILES['import_file'];
        $file_ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        
        if (!in_array($file_ext, array('csv', 'xls', 'xlsx'))) {
            wp_send_json_error(array('message' => __('只支持CSV和Excel文件', 'bjt-product-admin')));
        }
        
        // 处理文件上传
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        $upload = wp_handle_upload($file, array('test_form' => false));
        
        if (isset($upload['error'])) {
            wp_send_json_error(array('message' => $upload['error']));
        }
        
        // 解析文件
        $items = array();
        
        if ($file_ext === 'csv') {
            // 解析CSV文件
            $handle = fopen($upload['file'], 'r');
            
            if ($handle !== false) {
                // 读取表头
                $headers = fgetcsv($handle);
                
                // 读取数据行
                while (($data = fgetcsv($handle)) !== false) {
                    $item = array();
                    
                    foreach ($headers as $index => $header) {
                        if (isset($data[$index])) {
                            $item[trim($header)] = trim($data[$index]);
                        }
                    }
                    
                    $items[] = $item;
                }
                
                fclose($handle);
            }
        } else {
            // 解析Excel文件
            // 这里需要使用PHPExcel或PhpSpreadsheet库
            // 由于复杂性，这里只返回一个示例错误
            wp_send_json_error(array('message' => __('Excel导入功能暂未实现', 'bjt-product-admin')));
        }
        
        // 检查解析结果
        if (empty($items)) {
            wp_send_json_error(array('message' => __('没有找到有效数据', 'bjt-product-admin')));
        }
        
        // 使用API处理器批量导入数据
        $response = $this->api_handler->post($endpoint . '/batch', array('items' => $items));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        // 删除临时文件
        @unlink($upload['file']);
        
        wp_send_json_success(array(
            'message' => sprintf(__('成功导入 %d 条记录', 'bjt-product-admin'), count($items)),
            'imported' => count($items)
        ));
    }

    /**
     * AJAX处理：导出表格数据
     */
    public function ajax_export_table() {
        check_ajax_referer('bjt-product-admin-nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('权限不足', 'bjt-product-admin')));
        }
        
        $endpoint = isset($_REQUEST['endpoint']) ? sanitize_text_field($_REQUEST['endpoint']) : '';
        $format = isset($_REQUEST['format']) ? sanitize_text_field($_REQUEST['format']) : 'csv';
        $filename = isset($_REQUEST['filename']) ? sanitize_text_field($_REQUEST['filename']) : 'export-' . date('Y-m-d');
        
        if (empty($endpoint)) {
            wp_send_json_error(array('message' => __('缺少必要参数', 'bjt-product-admin')));
        }
        
        // 使用API处理器获取所有数据
        $params = array(
            'per_page' => 1000,
            'page' => 1
        );
        
        // 获取过滤参数
        if (isset($_REQUEST['filters']) && !empty($_REQUEST['filters'])) {
            $filters = json_decode(stripslashes($_REQUEST['filters']), true);
            
            if (is_array($filters)) {
                foreach ($filters as $key => $value) {
                    $params[$key] = sanitize_text_field($value);
                }
            }
        }
        
        // 导出所有数据
        $export_endpoint = $endpoint . '/export';
        $response = $this->api_handler->get($export_endpoint, $params);
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        // 检查响应格式
        if (!isset($response['items']) || !is_array($response['items']) || empty($response['items'])) {
            wp_send_json_error(array('message' => __('没有数据可导出', 'bjt-product-admin')));
        }
        
        // 准备导出数据
        $items = $response['items'];
        $headers = array();
        
        // 从第一项获取表头
        if (!empty($items[0])) {
            $headers = array_keys($items[0]);
        }
        
        // 创建临时文件
        $temp_file = wp_tempnam($filename);
        
        if ($format === 'csv') {
            // 导出为CSV
            $handle = fopen($temp_file, 'w');
            
            // 写入表头
            fputcsv($handle, $headers);
            
            // 写入数据行
            foreach ($items as $item) {
                $row = array();
                
                foreach ($headers as $header) {
                    $row[] = isset($item[$header]) ? $item[$header] : '';
                }
                
                fputcsv($handle, $row);
            }
            
            fclose($handle);
            
            // 设置头信息
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
            header('Content-Length: ' . filesize($temp_file));
            
            // 输出文件内容
            readfile($temp_file);
            
            // 删除临时文件
            @unlink($temp_file);
            
            exit;
        } else {
            // 其他格式暂不支持
            wp_send_json_error(array('message' => __('不支持的导出格式', 'bjt-product-admin')));
        }
    }
    
    /**
     * 获取组件加载器
     *
     * @return BJT_Component_Loader
     */
    public function get_component_loader() {
        return $this->component_loader;
    }
    
    /**
     * 获取API处理器
     *
     * @return BJT_API_Handler
     */
    public function get_api_handler() {
        return $this->api_handler;
    }
}
