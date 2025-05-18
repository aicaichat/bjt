<?php
/**
 * BJT设置页面类
 * 
 * 用于创建和管理系统设置
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Settings_Page {
    /**
     * 设置选项名称
     *
     * @var string
     */
    private $option_name = 'bjt_product_admin_settings';
    
    /**
     * 设置选项组
     *
     * @var string
     */
    private $option_group = 'bjt_product_admin_options';
    
    /**
     * 设置页面ID
     *
     * @var string
     */
    private $page_id = 'bjt-product-settings';
    
    /**
     * 构造函数
     */
    public function __construct() {
        // 注册设置
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * 注册设置
     */
    public function register_settings() {
        // 注册设置
        register_setting(
            $this->option_group,
            $this->option_name,
            array($this, 'sanitize_settings')
        );
        
        // 常规设置部分
        add_settings_section(
            'general_settings',
            __('常规设置', 'bjt-product-admin'),
            array($this, 'render_general_section'),
            $this->page_id
        );
        
        // API设置部分
        add_settings_section(
            'api_settings',
            __('API设置', 'bjt-product-admin'),
            array($this, 'render_api_section'),
            $this->page_id
        );
        
        // 高级设置部分
        add_settings_section(
            'advanced_settings',
            __('高级设置', 'bjt-product-admin'),
            array($this, 'render_advanced_section'),
            $this->page_id
        );
        
        // 添加常规设置字段
        add_settings_field(
            'enable_frontend',
            __('启用前台显示', 'bjt-product-admin'),
            array($this, 'render_checkbox_field'),
            $this->page_id,
            'general_settings',
            array(
                'label_for' => 'enable_frontend',
                'name' => 'enable_frontend',
                'description' => __('在前台显示产品信息', 'bjt-product-admin'),
                'default' => true
            )
        );
        
        add_settings_field(
            'items_per_page',
            __('每页项目数', 'bjt-product-admin'),
            array($this, 'render_number_field'),
            $this->page_id,
            'general_settings',
            array(
                'label_for' => 'items_per_page',
                'name' => 'items_per_page',
                'description' => __('后台管理中每页显示的项目数', 'bjt-product-admin'),
                'default' => 20,
                'min' => 5,
                'max' => 100
            )
        );
        
        // 添加API设置字段
        add_settings_field(
            'api_base_url',
            __('API基础URL', 'bjt-product-admin'),
            array($this, 'render_text_field'),
            $this->page_id,
            'api_settings',
            array(
                'label_for' => 'api_base_url',
                'name' => 'api_base_url',
                'description' => __('API基础URL，留空使用本地WordPress REST API', 'bjt-product-admin'),
                'default' => '',
                'placeholder' => 'https://api.example.com/'
            )
        );
        
        add_settings_field(
            'api_token',
            __('API令牌', 'bjt-product-admin'),
            array($this, 'render_password_field'),
            $this->page_id,
            'api_settings',
            array(
                'label_for' => 'api_token',
                'name' => 'api_token',
                'description' => __('API访问令牌（如需要）', 'bjt-product-admin'),
                'default' => ''
            )
        );
        
        // 添加高级设置字段
        add_settings_field(
            'enable_cache',
            __('启用缓存', 'bjt-product-admin'),
            array($this, 'render_checkbox_field'),
            $this->page_id,
            'advanced_settings',
            array(
                'label_for' => 'enable_cache',
                'name' => 'enable_cache',
                'description' => __('缓存API请求结果以提高性能', 'bjt-product-admin'),
                'default' => true
            )
        );
        
        add_settings_field(
            'cache_expiration',
            __('缓存过期时间', 'bjt-product-admin'),
            array($this, 'render_number_field'),
            $this->page_id,
            'advanced_settings',
            array(
                'label_for' => 'cache_expiration',
                'name' => 'cache_expiration',
                'description' => __('缓存过期时间（分钟）', 'bjt-product-admin'),
                'default' => 60,
                'min' => 1,
                'max' => 1440
            )
        );
        
        add_settings_field(
            'debug_mode',
            __('调试模式', 'bjt-product-admin'),
            array($this, 'render_checkbox_field'),
            $this->page_id,
            'advanced_settings',
            array(
                'label_for' => 'debug_mode',
                'name' => 'debug_mode',
                'description' => __('启用调试模式（仅在开发环境使用）', 'bjt-product-admin'),
                'default' => false
            )
        );
    }
    
    /**
     * 渲染设置页面
     */
    public function render() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // 检查是否有设置保存消息
        $show_message = isset($_GET['settings-updated']) && $_GET['settings-updated'];
        
        // 获取当前设置
        $options = get_option($this->option_name, array());
        
        ?>
        <div class="wrap">
            <?php if ($show_message): ?>
            <div class="notice notice-success is-dismissible">
                <p><?php _e('设置已保存。', 'bjt-product-admin'); ?></p>
            </div>
            <?php endif; ?>
            
            <form method="post" action="options.php">
                <?php
                // 输出隐藏字段和安全性检查
                settings_fields($this->option_group);
                
                // 输出设置部分和字段
                do_settings_sections($this->page_id);
                
                // 提交按钮
                submit_button(__('保存设置', 'bjt-product-admin'));
                ?>
            </form>
            
            <div class="bjt-settings-tools">
                <h2><?php _e('工具', 'bjt-product-admin'); ?></h2>
                
                <div class="bjt-tool-box">
                    <h3><?php _e('清除缓存', 'bjt-product-admin'); ?></h3>
                    <p><?php _e('清除所有API请求缓存数据。', 'bjt-product-admin'); ?></p>
                    <form method="post" action="">
                        <?php wp_nonce_field('bjt_flush_cache', 'bjt_flush_cache_nonce'); ?>
                        <input type="hidden" name="action" value="bjt_flush_cache">
                        <button type="submit" class="button"><?php _e('清除缓存', 'bjt-product-admin'); ?></button>
                    </form>
                </div>
                
                <div class="bjt-tool-box">
                    <h3><?php _e('重置设置', 'bjt-product-admin'); ?></h3>
                    <p><?php _e('将所有设置重置为默认值。', 'bjt-product-admin'); ?></p>
                    <form method="post" action="" onsubmit="return confirm('<?php esc_attr_e('确定要重置所有设置吗？此操作无法撤销。', 'bjt-product-admin'); ?>');">
                        <?php wp_nonce_field('bjt_reset_settings', 'bjt_reset_settings_nonce'); ?>
                        <input type="hidden" name="action" value="bjt_reset_settings">
                        <button type="submit" class="button"><?php _e('重置设置', 'bjt-product-admin'); ?></button>
                    </form>
                </div>
            </div>
        </div>
        
        <style>
        .bjt-settings-tools {
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        
        .bjt-tool-box {
            background: #fff;
            border: 1px solid #ccc;
            padding: 15px;
            margin-bottom: 20px;
            max-width: 500px;
        }
        
        .bjt-tool-box h3 {
            margin-top: 0;
        }
        </style>
        <?php
    }
    
    /**
     * 渲染常规设置部分
     */
    public function render_general_section() {
        echo '<p>' . __('基本配置设置。', 'bjt-product-admin') . '</p>';
    }
    
    /**
     * 渲染API设置部分
     */
    public function render_api_section() {
        echo '<p>' . __('API连接设置。', 'bjt-product-admin') . '</p>';
    }
    
    /**
     * 渲染高级设置部分
     */
    public function render_advanced_section() {
        echo '<p>' . __('高级设置选项。', 'bjt-product-admin') . '</p>';
    }
    
    /**
     * 渲染文本字段
     *
     * @param array $args 字段参数
     */
    public function render_text_field($args) {
        $options = get_option($this->option_name, array());
        $name = $args['name'];
        $value = isset($options[$name]) ? $options[$name] : $args['default'];
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';
        
        echo '<input type="text" id="' . esc_attr($args['label_for']) . '" name="' . esc_attr($this->option_name . '[' . $name . ']') . '" value="' . esc_attr($value) . '" placeholder="' . esc_attr($placeholder) . '" class="regular-text">';
        
        if (isset($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * 渲染密码字段
     *
     * @param array $args 字段参数
     */
    public function render_password_field($args) {
        $options = get_option($this->option_name, array());
        $name = $args['name'];
        $value = isset($options[$name]) ? $options[$name] : $args['default'];
        
        echo '<input type="password" id="' . esc_attr($args['label_for']) . '" name="' . esc_attr($this->option_name . '[' . $name . ']') . '" value="' . esc_attr($value) . '" class="regular-text">';
        
        if (isset($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * 渲染数字字段
     *
     * @param array $args 字段参数
     */
    public function render_number_field($args) {
        $options = get_option($this->option_name, array());
        $name = $args['name'];
        $value = isset($options[$name]) ? $options[$name] : $args['default'];
        $min = isset($args['min']) ? $args['min'] : '';
        $max = isset($args['max']) ? $args['max'] : '';
        
        echo '<input type="number" id="' . esc_attr($args['label_for']) . '" name="' . esc_attr($this->option_name . '[' . $name . ']') . '" value="' . esc_attr($value) . '"';
        
        if ($min !== '') {
            echo ' min="' . esc_attr($min) . '"';
        }
        
        if ($max !== '') {
            echo ' max="' . esc_attr($max) . '"';
        }
        
        echo ' class="small-text">';
        
        if (isset($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * 渲染复选框字段
     *
     * @param array $args 字段参数
     */
    public function render_checkbox_field($args) {
        $options = get_option($this->option_name, array());
        $name = $args['name'];
        $checked = isset($options[$name]) ? $options[$name] : $args['default'];
        
        echo '<input type="checkbox" id="' . esc_attr($args['label_for']) . '" name="' . esc_attr($this->option_name . '[' . $name . ']') . '" value="1"' . checked(1, $checked, false) . '>';
        
        if (isset($args['description'])) {
            echo '<span class="description">' . esc_html($args['description']) . '</span>';
        }
    }
    
    /**
     * 渲染选择字段
     *
     * @param array $args 字段参数
     */
    public function render_select_field($args) {
        $options = get_option($this->option_name, array());
        $name = $args['name'];
        $value = isset($options[$name]) ? $options[$name] : $args['default'];
        
        echo '<select id="' . esc_attr($args['label_for']) . '" name="' . esc_attr($this->option_name . '[' . $name . ']') . '">';
        
        foreach ($args['options'] as $option_value => $option_label) {
            echo '<option value="' . esc_attr($option_value) . '"' . selected($option_value, $value, false) . '>' . esc_html($option_label) . '</option>';
        }
        
        echo '</select>';
        
        if (isset($args['description'])) {
            echo '<p class="description">' . esc_html($args['description']) . '</p>';
        }
    }
    
    /**
     * 设置验证和过滤
     *
     * @param array $input 表单提交的输入
     * @return array 验证和过滤后的输入
     */
    public function sanitize_settings($input) {
        $output = array();
        
        // 常规设置
        $output['enable_frontend'] = isset($input['enable_frontend']) ? 1 : 0;
        $output['items_per_page'] = isset($input['items_per_page']) ? intval($input['items_per_page']) : 20;
        
        // API设置
        $output['api_base_url'] = isset($input['api_base_url']) ? esc_url_raw($input['api_base_url']) : '';
        $output['api_token'] = isset($input['api_token']) ? sanitize_text_field($input['api_token']) : '';
        
        // 高级设置
        $output['enable_cache'] = isset($input['enable_cache']) ? 1 : 0;
        $output['cache_expiration'] = isset($input['cache_expiration']) ? intval($input['cache_expiration']) : 60;
        $output['debug_mode'] = isset($input['debug_mode']) ? 1 : 0;
        
        return $output;
    }
} 