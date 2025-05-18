<?php
/**
 * BJT表单组件
 * 
 * 用于创建和管理表单
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Form_Component {
    /**
     * 表单ID
     *
     * @var string
     */
    private $id;
    
    /**
     * 表单参数
     *
     * @var array
     */
    private $args;
    
    /**
     * 表单字段
     *
     * @var array
     */
    private $fields = array();
    
    /**
     * 表单分组
     *
     * @var array
     */
    private $groups = array();
    
    /**
     * 表单验证规则
     *
     * @var array
     */
    private $validation_rules = array();
    
    /**
     * 表单数据
     *
     * @var array
     */
    private $data = array();
    
    /**
     * 构造函数
     *
     * @param string $id 表单ID
     * @param array $args 表单参数
     */
    public function __construct($id, $args = array()) {
        $this->id = $id;
        
        // 默认参数
        $defaults = array(
            'title' => '',
            'description' => '',
            'method' => 'post',
            'action' => '',
            'ajax' => true,
            'multipart' => false,
            'submit_text' => __('提交', 'bjt-product-admin'),
            'cancel_text' => __('取消', 'bjt-product-admin'),
            'cancel_url' => '',
            'classes' => array('bjt-form'),
            'data_source' => '', // API端点或回调函数
            'success_message' => __('表单提交成功！', 'bjt-product-admin'),
            'error_message' => __('表单提交失败，请检查输入。', 'bjt-product-admin'),
            'layout' => 'vertical', // vertical, horizontal, grid
            'columns' => 1, // 用于grid布局
            'show_required_hint' => true
        );
        
        $this->args = wp_parse_args($args, $defaults);
    }
    
    /**
     * 添加字段
     *
     * @param string $name 字段名
     * @param string $type 字段类型
     * @param array $args 字段参数
     * @return BJT_Form_Component 当前实例
     */
    public function add_field($name, $type, $args = array()) {
        // 默认参数
        $defaults = array(
            'label' => '',
            'description' => '',
            'placeholder' => '',
            'default' => '',
            'required' => false,
            'disabled' => false,
            'readonly' => false,
            'class' => '',
            'wrapper_class' => '',
            'options' => array(),
            'group' => '',
            'conditions' => array(),
            'attributes' => array(),
            'validation' => array()
        );
        
        $args = wp_parse_args($args, $defaults);
        $args['type'] = $type;
        
        // 如果没有设置标签，使用字段名作为标签
        if (empty($args['label'])) {
            $args['label'] = ucfirst(str_replace('_', ' ', $name));
        }
        
        $this->fields[$name] = $args;
        
        // 添加验证规则
        if (!empty($args['validation'])) {
            $this->validation_rules[$name] = $args['validation'];
        }
        
        // 添加到分组
        if (!empty($args['group'])) {
            if (!isset($this->groups[$args['group']])) {
                $this->groups[$args['group']] = array();
            }
            $this->groups[$args['group']][] = $name;
        }
        
        return $this;
    }
    
    /**
     * 批量添加字段
     *
     * @param array $fields 字段数组
     * @return BJT_Form_Component 当前实例
     */
    public function add_fields($fields) {
        foreach ($fields as $name => $field) {
            $type = isset($field['type']) ? $field['type'] : 'text';
            unset($field['type']);
            $this->add_field($name, $type, $field);
        }
        
        return $this;
    }
    
    /**
     * 添加分组
     *
     * @param string $id 分组ID
     * @param string $title 分组标题
     * @param array $args 分组参数
     * @return BJT_Form_Component 当前实例
     */
    public function add_group($id, $title, $args = array()) {
        // 默认参数
        $defaults = array(
            'description' => '',
            'collapsible' => false,
            'collapsed' => false,
            'class' => ''
        );
        
        $args = wp_parse_args($args, $defaults);
        $args['title'] = $title;
        
        $this->groups[$id] = $args;
        
        return $this;
    }
    
    /**
     * 设置表单数据
     *
     * @param array $data 表单数据
     * @return BJT_Form_Component 当前实例
     */
    public function set_data($data) {
        $this->data = $data;
        return $this;
    }
    
    /**
     * 获取表单数据
     *
     * @return array 表单数据
     */
    public function get_data() {
        return $this->data;
    }
    
    /**
     * 渲染表单
     *
     * @return string 表单HTML
     */
    public function render() {
        // 确保有字段定义
        if (empty($this->fields)) {
            return '<div class="notice notice-error"><p>' . __('表单组件错误：没有定义字段', 'bjt-product-admin') . '</p></div>';
        }
        
        // 开始输出缓冲
        ob_start();
        
        // 表单容器
        echo '<div class="bjt-form-container" id="' . esc_attr($this->id) . '-container">';
        
        // 表单标题和描述
        if (!empty($this->args['title'])) {
            echo '<h2>' . esc_html($this->args['title']) . '</h2>';
        }
        
        if (!empty($this->args['description'])) {
            echo '<p class="description">' . esc_html($this->args['description']) . '</p>';
        }
        
        // 表单开始标签
        echo '<form id="' . esc_attr($this->id) . '" class="' . esc_attr(implode(' ', $this->args['classes'])) . '" method="' . esc_attr($this->args['method']) . '"';
        
        if (!empty($this->args['action'])) {
            echo ' action="' . esc_url($this->args['action']) . '"';
        }
        
        if ($this->args['multipart']) {
            echo ' enctype="multipart/form-data"';
        }
        
        echo ' data-layout="' . esc_attr($this->args['layout']) . '"';
        
        echo '>';
        
        // 添加必填字段提示
        if ($this->args['show_required_hint']) {
            echo '<p class="required-hint"><span class="required">*</span> ' . __('表示必填字段', 'bjt-product-admin') . '</p>';
        }
        
        // 渲染表单字段
        $this->render_fields();
        
        // 表单提交按钮
        echo '<div class="bjt-form-actions">';
        echo '<button type="submit" class="button button-primary">' . esc_html($this->args['submit_text']) . '</button>';
        
        if (!empty($this->args['cancel_text'])) {
            if (!empty($this->args['cancel_url'])) {
                echo ' <a href="' . esc_url($this->args['cancel_url']) . '" class="button">' . esc_html($this->args['cancel_text']) . '</a>';
            } else {
                echo ' <button type="button" class="button bjt-form-cancel">' . esc_html($this->args['cancel_text']) . '</button>';
            }
        }
        
        echo '</div>';
        
        // 表单结束标签
        echo '</form>';
        
        // 表单消息容器
        echo '<div id="' . esc_attr($this->id) . '-messages" class="bjt-form-messages"></div>';
        
        // 关闭表单容器
        echo '</div>';
        
        // 添加表单数据属性
        $this->add_form_data_attributes();
        
        // 结束输出缓冲并返回
        return ob_get_clean();
    }
    
    /**
     * 渲染表单字段
     */
    private function render_fields() {
        // 检查是否有分组
        if (!empty($this->groups)) {
            // 渲染分组字段
            foreach ($this->groups as $group_id => $group) {
                // 跳过字段列表
                if (is_array($group) && !isset($group['title'])) {
                    continue;
                }
                
                $this->render_group($group_id, $group);
            }
            
            // 渲染未分组的字段
            $ungrouped_fields = array();
            foreach ($this->fields as $name => $field) {
                $is_grouped = false;
                foreach ($this->groups as $group_id => $group) {
                    if (is_array($group) && !isset($group['title']) && in_array($name, $group)) {
                        $is_grouped = true;
                        break;
                    }
                }
                
                if (!$is_grouped && empty($field['group'])) {
                    $ungrouped_fields[$name] = $field;
                }
            }
            
            if (!empty($ungrouped_fields)) {
                foreach ($ungrouped_fields as $name => $field) {
                    $this->render_field($name, $field);
                }
            }
        } else {
            // 渲染所有字段
            foreach ($this->fields as $name => $field) {
                $this->render_field($name, $field);
            }
        }
    }
    
    /**
     * 渲染表单分组
     *
     * @param string $group_id 分组ID
     * @param array $group 分组参数
     */
    private function render_group($group_id, $group) {
        $classes = array('bjt-form-group');
        if (!empty($group['class'])) {
            $classes[] = $group['class'];
        }
        
        if (!empty($group['collapsible'])) {
            $classes[] = 'bjt-form-group-collapsible';
            if (!empty($group['collapsed'])) {
                $classes[] = 'bjt-form-group-collapsed';
            }
        }
        
        echo '<div id="' . esc_attr($this->id . '-group-' . $group_id) . '" class="' . esc_attr(implode(' ', $classes)) . '">';
        
        // 分组标题
        if (!empty($group['title'])) {
            echo '<h3 class="bjt-form-group-title">';
            
            if (!empty($group['collapsible'])) {
                echo '<span class="bjt-form-group-toggle dashicons"></span>';
            }
            
            echo esc_html($group['title']) . '</h3>';
        }
        
        // 分组描述
        if (!empty($group['description'])) {
            echo '<p class="bjt-form-group-description">' . esc_html($group['description']) . '</p>';
        }
        
        echo '<div class="bjt-form-group-fields">';
        
        // 渲染分组中的字段
        foreach ($this->fields as $name => $field) {
            if (
                // 字段直接指定了分组
                (!empty($field['group']) && $field['group'] === $group_id) ||
                // 字段在分组列表中
                (isset($this->groups[$group_id]) && is_array($this->groups[$group_id]) && !isset($this->groups[$group_id]['title']) && in_array($name, $this->groups[$group_id]))
            ) {
                $this->render_field($name, $field);
            }
        }
        
        echo '</div>'; // .bjt-form-group-fields
        echo '</div>'; // .bjt-form-group
    }
    
    /**
     * 渲染表单字段
     *
     * @param string $name 字段名
     * @param array $field 字段参数
     */
    private function render_field($name, $field) {
        // 字段值
        $value = isset($this->data[$name]) ? $this->data[$name] : $field['default'];
        
        // 字段包装器类
        $wrapper_classes = array('bjt-form-field');
        $wrapper_classes[] = 'bjt-form-field-' . $field['type'];
        
        if (!empty($field['wrapper_class'])) {
            $wrapper_classes[] = $field['wrapper_class'];
        }
        
        if ($field['required']) {
            $wrapper_classes[] = 'required';
        }
        
        if ($field['disabled']) {
            $wrapper_classes[] = 'disabled';
        }
        
        // 条件显示
        $conditions = '';
        if (!empty($field['conditions'])) {
            $wrapper_classes[] = 'bjt-conditional-field';
            $conditions = ' data-conditions="' . esc_attr(wp_json_encode($field['conditions'])) . '"';
        }
        
        echo '<div class="' . esc_attr(implode(' ', $wrapper_classes)) . '"' . $conditions . '>';
        
        // 字段标签
        if (!empty($field['label'])) {
            echo '<label for="' . esc_attr($this->id . '-' . $name) . '">';
            echo esc_html($field['label']);
            
            if ($field['required']) {
                echo ' <span class="required">*</span>';
            }
            
            echo '</label>';
        }
        
        // 字段输入
        $this->render_field_input($name, $field, $value);
        
        // 字段描述
        if (!empty($field['description'])) {
            echo '<p class="description">' . esc_html($field['description']) . '</p>';
        }
        
        echo '</div>';
    }
    
    /**
     * 渲染字段输入
     *
     * @param string $name 字段名
     * @param array $field 字段参数
     * @param mixed $value 字段值
     */
    private function render_field_input($name, $field, $value) {
        $field_id = $this->id . '-' . $name;
        $field_name = $name;
        
        // 字段类
        $field_classes = array('bjt-form-input');
        if (!empty($field['class'])) {
            $field_classes[] = $field['class'];
        }
        
        // 字段属性
        $attributes = array();
        if ($field['required']) {
            $attributes[] = 'required';
        }
        
        if ($field['disabled']) {
            $attributes[] = 'disabled';
        }
        
        if ($field['readonly']) {
            $attributes[] = 'readonly';
        }
        
        if (!empty($field['placeholder'])) {
            $attributes[] = 'placeholder="' . esc_attr($field['placeholder']) . '"';
        }
        
        // 添加自定义属性
        if (!empty($field['attributes']) && is_array($field['attributes'])) {
            foreach ($field['attributes'] as $attr_name => $attr_value) {
                $attributes[] = esc_attr($attr_name) . '="' . esc_attr($attr_value) . '"';
            }
        }
        
        // 根据字段类型渲染
        switch ($field['type']) {
            case 'text':
            case 'email':
            case 'url':
            case 'tel':
            case 'password':
            case 'number':
            case 'date':
            case 'time':
            case 'datetime-local':
            case 'month':
            case 'week':
            case 'color':
                echo '<input type="' . esc_attr($field['type']) . '" id="' . esc_attr($field_id) . '" name="' . esc_attr($field_name) . '" value="' . esc_attr($value) . '" class="' . esc_attr(implode(' ', $field_classes)) . '" ' . implode(' ', $attributes) . '>';
                break;
                
            case 'textarea':
                echo '<textarea id="' . esc_attr($field_id) . '" name="' . esc_attr($field_name) . '" class="' . esc_attr(implode(' ', $field_classes)) . '" ' . implode(' ', $attributes) . '>' . esc_textarea($value) . '</textarea>';
                break;
                
            case 'select':
                echo '<select id="' . esc_attr($field_id) . '" name="' . esc_attr($field_name) . '" class="' . esc_attr(implode(' ', $field_classes)) . '" ' . implode(' ', $attributes) . '>';
                
                foreach ($field['options'] as $option_value => $option_label) {
                    echo '<option value="' . esc_attr($option_value) . '"' . selected($value, $option_value, false) . '>' . esc_html($option_label) . '</option>';
                }
                
                echo '</select>';
                break;
                
            case 'radio':
                echo '<div class="bjt-radio-group">';
                
                foreach ($field['options'] as $option_value => $option_label) {
                    echo '<label class="bjt-radio-label">';
                    echo '<input type="radio" name="' . esc_attr($field_name) . '" value="' . esc_attr($option_value) . '"' . checked($value, $option_value, false) . ' ' . implode(' ', $attributes) . '>';
                    echo esc_html($option_label) . '</label>';
                }
                
                echo '</div>';
                break;
                
            case 'checkbox':
                if (!empty($field['options'])) {
                    // 多选框组
                    echo '<div class="bjt-checkbox-group">';
                    
                    foreach ($field['options'] as $option_value => $option_label) {
                        $is_checked = is_array($value) && in_array($option_value, $value);
                        
                        echo '<label class="bjt-checkbox-label">';
                        echo '<input type="checkbox" name="' . esc_attr($field_name) . '[]" value="' . esc_attr($option_value) . '"' . checked($is_checked, true, false) . ' ' . implode(' ', $attributes) . '>';
                        echo esc_html($option_label) . '</label>';
                    }
                    
                    echo '</div>';
                } else {
                    // 单选框
                    echo '<label class="bjt-checkbox-label">';
                    echo '<input type="checkbox" name="' . esc_attr($field_name) . '" value="1"' . checked($value, 1, false) . ' ' . implode(' ', $attributes) . '>';
                    echo esc_html($field['label']) . '</label>';
                }
                break;
                
            case 'file':
                // 使用上传组件
                echo '<div class="bjt-upload-field" data-field="' . esc_attr($field_name) . '">';
                echo '<input type="hidden" id="' . esc_attr($field_id) . '" name="' . esc_attr($field_name) . '" value="' . esc_attr($value) . '" class="bjt-upload-value">';
                echo '<div class="bjt-upload-preview">';
                
                if (!empty($value)) {
                    // 检查是否为图片
                    $is_image = preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $value);
                    
                    if ($is_image) {
                        echo '<img src="' . esc_url($value) . '" alt="">';
                    } else {
                        echo '<span class="dashicons dashicons-media-default"></span>';
                        echo '<span class="bjt-upload-filename">' . esc_html(basename($value)) . '</span>';
                    }
                    
                    echo '<button type="button" class="bjt-upload-remove button">' . __('移除', 'bjt-product-admin') . '</button>';
                }
                
                echo '</div>';
                echo '<button type="button" class="bjt-upload-button button">' . __('选择文件', 'bjt-product-admin') . '</button>';
                echo '</div>';
                break;
                
            case 'editor':
                $editor_id = $field_id;
                $editor_settings = array(
                    'textarea_name' => $field_name,
                    'textarea_rows' => 10,
                    'media_buttons' => true,
                    'teeny' => false,
                    'tinymce' => true
                );
                
                // 如果有自定义编辑器设置
                if (isset($field['editor_settings']) && is_array($field['editor_settings'])) {
                    $editor_settings = array_merge($editor_settings, $field['editor_settings']);
                }
                
                wp_editor($value, $editor_id, $editor_settings);
                break;
                
            case 'hidden':
                echo '<input type="hidden" id="' . esc_attr($field_id) . '" name="' . esc_attr($field_name) . '" value="' . esc_attr($value) . '">';
                break;
                
            default:
                do_action('bjt_form_render_field_' . $field['type'], $name, $field, $value, $this);
                break;
        }
    }
    
    /**
     * 添加表单数据属性
     */
    private function add_form_data_attributes() {
        $data = array(
            'id' => $this->id,
            'ajax' => $this->args['ajax'],
            'method' => $this->args['method'],
            'action' => $this->args['action'],
            'data_source' => $this->args['data_source'],
            'success_message' => $this->args['success_message'],
            'error_message' => $this->args['error_message'],
            'validation_rules' => $this->validation_rules
        );
        
        // 编码数据属性
        $json_data = wp_json_encode($data);
        
        // 添加数据属性脚本
        echo '<script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                const formContainer = document.getElementById("' . esc_js($this->id) . '-container");
                if (formContainer) {
                    formContainer.dataset.config = \'' . esc_js($json_data) . '\';
                }
            });
        </script>';
    }
    
    /**
     * 获取AJAX数据处理URL
     *
     * @return string AJAX URL
     */
    public function get_ajax_url() {
        return admin_url('admin-ajax.php?action=bjt_submit_form&form_id=' . urlencode($this->id));
    }
    
    /**
     * 静态方法：验证表单数据
     *
     * @param array $data 表单数据
     * @param array $rules 验证规则
     * @return array 错误消息数组，如果没有错误则为空数组
     */
    public static function validate($data, $rules) {
        $errors = array();
        
        foreach ($rules as $field => $field_rules) {
            $value = isset($data[$field]) ? $data[$field] : '';
            
            foreach ($field_rules as $rule => $rule_value) {
                switch ($rule) {
                    case 'required':
                        if ($rule_value && empty($value)) {
                            $errors[$field] = __('此字段是必填的', 'bjt-product-admin');
                        }
                        break;
                        
                    case 'email':
                        if ($rule_value && !empty($value) && !is_email($value)) {
                            $errors[$field] = __('请输入有效的电子邮件地址', 'bjt-product-admin');
                        }
                        break;
                        
                    case 'url':
                        if ($rule_value && !empty($value) && !filter_var($value, FILTER_VALIDATE_URL)) {
                            $errors[$field] = __('请输入有效的URL', 'bjt-product-admin');
                        }
                        break;
                        
                    case 'min':
                        if (!empty($value) && strlen($value) < $rule_value) {
                            $errors[$field] = sprintf(__('此字段至少需要 %d 个字符', 'bjt-product-admin'), $rule_value);
                        }
                        break;
                        
                    case 'max':
                        if (!empty($value) && strlen($value) > $rule_value) {
                            $errors[$field] = sprintf(__('此字段不能超过 %d 个字符', 'bjt-product-admin'), $rule_value);
                        }
                        break;
                        
                    case 'min_value':
                        if (!empty($value) && floatval($value) < $rule_value) {
                            $errors[$field] = sprintf(__('此字段的值不能小于 %s', 'bjt-product-admin'), $rule_value);
                        }
                        break;
                        
                    case 'max_value':
                        if (!empty($value) && floatval($value) > $rule_value) {
                            $errors[$field] = sprintf(__('此字段的值不能大于 %s', 'bjt-product-admin'), $rule_value);
                        }
                        break;
                        
                    case 'pattern':
                        if (!empty($value) && !preg_match($rule_value, $value)) {
                            $errors[$field] = __('此字段格式不正确', 'bjt-product-admin');
                        }
                        break;
                        
                    case 'custom':
                        if (is_callable($rule_value)) {
                            $result = call_user_func($rule_value, $value, $data);
                            if ($result !== true) {
                                $errors[$field] = $result;
                            }
                        }
                        break;
                }
                
                // 如果已经有错误，不再继续验证此字段
                if (isset($errors[$field])) {
                    break;
                }
            }
        }
        
        return $errors;
    }
} 