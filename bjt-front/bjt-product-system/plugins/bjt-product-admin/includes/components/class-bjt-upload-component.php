<?php
/**
 * BJT上传组件
 * 
 * 用于处理文件上传
 * 
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 如果直接访问此文件，则中止访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Upload_Component {
    /**
     * 上传组件ID
     *
     * @var string
     */
    private $id;
    
    /**
     * 上传组件参数
     *
     * @var array
     */
    private $args;
    
    /**
     * 构造函数
     *
     * @param string $id 上传组件ID
     * @param array $args 上传组件参数
     */
    public function __construct($id, $args = array()) {
        $this->id = $id;
        
        // 默认参数
        $defaults = array(
            'title' => '',
            'description' => '',
            'field_name' => '',
            'multiple' => false,
            'max_files' => 1,
            'max_file_size' => 10485760, // 10MB
            'allowed_types' => array('image/jpeg', 'image/png', 'image/gif', 'application/pdf'),
            'allowed_extensions' => array('jpg', 'jpeg', 'png', 'gif', 'pdf'),
            'image_only' => false,
            'min_width' => 0,
            'min_height' => 0,
            'max_width' => 0,
            'max_height' => 0,
            'show_preview' => true,
            'show_filename' => true,
            'show_filesize' => true,
            'classes' => array('bjt-upload-component'),
            'button_text' => __('选择文件', 'bjt-product-admin'),
            'button_class' => 'button',
            'drop_text' => __('拖拽文件到此处，或点击选择文件', 'bjt-product-admin'),
            'current_value' => '',
            'upload_dir' => 'bjt-uploads',
            'handle_upload' => true, // 是否由组件处理上传
            'ajax_action' => 'bjt_upload_file'
        );
        
        $this->args = wp_parse_args($args, $defaults);
        
        // 确保字段名称已设置
        if (empty($this->args['field_name'])) {
            $this->args['field_name'] = $this->id;
        }
    }
    
    /**
     * 渲染上传组件
     *
     * @return string 上传组件HTML
     */
    public function render() {
        // 开始输出缓冲
        ob_start();
        
        // 上传组件容器
        echo '<div id="' . esc_attr($this->id) . '-container" class="' . esc_attr(implode(' ', $this->args['classes'])) . '">';
        
        if (!empty($this->args['title'])) {
            echo '<h4 class="bjt-upload-title">' . esc_html($this->args['title']) . '</h4>';
        }
        
        if (!empty($this->args['description'])) {
            echo '<p class="bjt-upload-description">' . esc_html($this->args['description']) . '</p>';
        }
        
        // 上传区域
        echo '<div class="bjt-upload-area" data-multiple="' . ($this->args['multiple'] ? 'true' : 'false') . '">';
        
        // 拖放区域
        echo '<div class="bjt-upload-dropzone">';
        echo '<p>' . esc_html($this->args['drop_text']) . '</p>';
        echo '</div>';
        
        // 隐藏的文件输入
        echo '<input type="file" id="' . esc_attr($this->id) . '-input" class="bjt-upload-input" style="display:none;"';
        
        if ($this->args['multiple']) {
            echo ' multiple';
        }
        
        if ($this->args['image_only']) {
            echo ' accept="image/*"';
        } elseif (!empty($this->args['allowed_extensions'])) {
            echo ' accept=".' . esc_attr(implode(',.', $this->args['allowed_extensions'])) . '"';
        }
        
        echo '>';
        
        // 上传按钮
        echo '<div class="bjt-upload-buttons">';
        echo '<button type="button" class="bjt-upload-button ' . esc_attr($this->args['button_class']) . '">' . esc_html($this->args['button_text']) . '</button>';
        echo '</div>';
        
        // 文件预览区域
        echo '<div class="bjt-upload-preview-area">';
        
        if ($this->args['multiple']) {
            echo '<ul class="bjt-upload-files-list">';
            
            // 如果已有值，显示已有文件
            if (!empty($this->args['current_value'])) {
                $files = is_array($this->args['current_value']) ? $this->args['current_value'] : explode(',', $this->args['current_value']);
                
                foreach ($files as $file) {
                    $this->render_file_item($file);
                }
            }
            
            echo '</ul>';
            
            // 用于存储多个文件的隐藏输入
            echo '<input type="hidden" name="' . esc_attr($this->args['field_name']) . '" id="' . esc_attr($this->id) . '" value="' . esc_attr(is_array($this->args['current_value']) ? implode(',', $this->args['current_value']) : $this->args['current_value']) . '" class="bjt-upload-value">';
        } else {
            echo '<div class="bjt-upload-preview">';
            
            // 如果已有值，显示预览
            if (!empty($this->args['current_value'])) {
                $this->render_file_preview($this->args['current_value']);
            }
            
            echo '</div>';
            
            // 用于存储单个文件的隐藏输入
            echo '<input type="hidden" name="' . esc_attr($this->args['field_name']) . '" id="' . esc_attr($this->id) . '" value="' . esc_attr($this->args['current_value']) . '" class="bjt-upload-value">';
        }
        
        echo '</div>'; // .bjt-upload-preview-area
        
        // 上传状态和进度条
        echo '<div class="bjt-upload-status" style="display:none;">';
        echo '<div class="bjt-upload-progress"><div class="bjt-upload-progress-bar" style="width:0%"></div></div>';
        echo '<p class="bjt-upload-status-text"></p>';
        echo '</div>';
        
        echo '</div>'; // .bjt-upload-area
        
        // 错误消息容器
        echo '<div class="bjt-upload-errors"></div>';
        
        // 关闭上传组件容器
        echo '</div>';
        
        // 添加上传组件数据属性
        $this->add_upload_data_attributes();
        
        // 结束输出缓冲并返回
        return ob_get_clean();
    }
    
    /**
     * 渲染文件项目（用于多文件上传）
     *
     * @param string $file 文件URL
     */
    private function render_file_item($file) {
        // 获取文件扩展名
        $file_ext = pathinfo($file, PATHINFO_EXTENSION);
        $is_image = in_array(strtolower($file_ext), array('jpg', 'jpeg', 'png', 'gif', 'webp'));
        
        echo '<li class="bjt-upload-file-item" data-file="' . esc_attr($file) . '">';
        
        // 文件预览
        if ($this->args['show_preview'] && $is_image) {
            echo '<div class="bjt-upload-file-preview">';
            echo '<img src="' . esc_url($file) . '" alt="">';
            echo '</div>';
        } else {
            echo '<div class="bjt-upload-file-icon">';
            echo '<span class="dashicons dashicons-media-default"></span>';
            echo '</div>';
        }
        
        // 文件信息
        echo '<div class="bjt-upload-file-info">';
        
        if ($this->args['show_filename']) {
            echo '<span class="bjt-upload-filename">' . esc_html(basename($file)) . '</span>';
        }
        
        echo '</div>';
        
        // 移除按钮
        echo '<div class="bjt-upload-file-actions">';
        echo '<button type="button" class="bjt-upload-remove dashicons dashicons-dismiss" title="' . esc_attr__('移除', 'bjt-product-admin') . '"></button>';
        echo '</div>';
        
        echo '</li>';
    }
    
    /**
     * 渲染单个文件预览
     *
     * @param string $file 文件URL
     */
    private function render_file_preview($file) {
        // 获取文件扩展名
        $file_ext = pathinfo($file, PATHINFO_EXTENSION);
        $is_image = in_array(strtolower($file_ext), array('jpg', 'jpeg', 'png', 'gif', 'webp'));
        
        echo '<div class="bjt-upload-file" data-file="' . esc_attr($file) . '">';
        
        // 文件预览
        if ($this->args['show_preview'] && $is_image) {
            echo '<div class="bjt-upload-file-preview">';
            echo '<img src="' . esc_url($file) . '" alt="">';
            echo '</div>';
        } else {
            echo '<div class="bjt-upload-file-icon">';
            echo '<span class="dashicons dashicons-media-default"></span>';
            echo '</div>';
        }
        
        // 文件信息
        if ($this->args['show_filename']) {
            echo '<div class="bjt-upload-file-info">';
            echo '<span class="bjt-upload-filename">' . esc_html(basename($file)) . '</span>';
            echo '</div>';
        }
        
        // 移除按钮
        echo '<div class="bjt-upload-file-actions">';
        echo '<button type="button" class="bjt-upload-remove dashicons dashicons-dismiss" title="' . esc_attr__('移除', 'bjt-product-admin') . '"></button>';
        echo '</div>';
        
        echo '</div>';
    }
    
    /**
     * 添加上传组件数据属性
     */
    private function add_upload_data_attributes() {
        $data = array(
            'id' => $this->id,
            'field_name' => $this->args['field_name'],
            'multiple' => $this->args['multiple'],
            'max_files' => $this->args['max_files'],
            'max_file_size' => $this->args['max_file_size'],
            'allowed_types' => $this->args['allowed_types'],
            'allowed_extensions' => $this->args['allowed_extensions'],
            'image_only' => $this->args['image_only'],
            'min_width' => $this->args['min_width'],
            'min_height' => $this->args['min_height'],
            'max_width' => $this->args['max_width'],
            'max_height' => $this->args['max_height'],
            'handle_upload' => $this->args['handle_upload'],
            'ajax_action' => $this->args['ajax_action'],
            'ajaxurl' => admin_url('admin-ajax.php')
        );
        
        // 编码数据属性
        $json_data = wp_json_encode($data);
        
        // 添加数据属性脚本
        echo '<script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                const uploadContainer = document.getElementById("' . esc_js($this->id) . '-container");
                if (uploadContainer) {
                    uploadContainer.dataset.config = \'' . esc_js($json_data) . '\';
                }
            });
        </script>';
    }
    
    /**
     * 获取AJAX上传URL
     *
     * @return string AJAX URL
     */
    public function get_ajax_url() {
        return admin_url('admin-ajax.php?action=' . $this->args['ajax_action'] . '&upload_id=' . urlencode($this->id));
    }
    
    /**
     * 处理文件上传
     *
     * @param array $file 上传的文件数组
     * @return array|WP_Error 上传结果或错误
     */
    public function handle_upload($file) {
        // 确保文件是有效的
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            return new WP_Error('upload_error', __('无效的上传文件', 'bjt-product-admin'));
        }
        
        // 检查文件大小
        if ($file['size'] > $this->args['max_file_size']) {
            return new WP_Error('upload_error', sprintf(__('文件大小超过限制 (%s)', 'bjt-product-admin'), size_format($this->args['max_file_size'])));
        }
        
        // 检查文件类型
        $file_type = wp_check_filetype(basename($file['name']), null);
        if (!$file_type['type']) {
            return new WP_Error('upload_error', __('不支持的文件类型', 'bjt-product-admin'));
        }
        
        if (!empty($this->args['allowed_types']) && !in_array($file_type['type'], $this->args['allowed_types'])) {
            return new WP_Error('upload_error', __('不支持的文件类型', 'bjt-product-admin'));
        }
        
        if (!empty($this->args['allowed_extensions']) && !in_array($file_type['ext'], $this->args['allowed_extensions'])) {
            return new WP_Error('upload_error', __('不支持的文件扩展名', 'bjt-product-admin'));
        }
        
        // 如果只允许图片，验证是否为图片
        if ($this->args['image_only']) {
            $img_types = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
            if (!in_array($file_type['type'], $img_types)) {
                return new WP_Error('upload_error', __('只允许上传图片文件', 'bjt-product-admin'));
            }
            
            // 检查图片尺寸
            $img_data = getimagesize($file['tmp_name']);
            if (!$img_data) {
                return new WP_Error('upload_error', __('无法获取图片尺寸', 'bjt-product-admin'));
            }
            
            if ($this->args['min_width'] > 0 && $img_data[0] < $this->args['min_width']) {
                return new WP_Error('upload_error', sprintf(__('图片宽度不能小于 %d 像素', 'bjt-product-admin'), $this->args['min_width']));
            }
            
            if ($this->args['min_height'] > 0 && $img_data[1] < $this->args['min_height']) {
                return new WP_Error('upload_error', sprintf(__('图片高度不能小于 %d 像素', 'bjt-product-admin'), $this->args['min_height']));
            }
            
            if ($this->args['max_width'] > 0 && $img_data[0] > $this->args['max_width']) {
                return new WP_Error('upload_error', sprintf(__('图片宽度不能大于 %d 像素', 'bjt-product-admin'), $this->args['max_width']));
            }
            
            if ($this->args['max_height'] > 0 && $img_data[1] > $this->args['max_height']) {
                return new WP_Error('upload_error', sprintf(__('图片高度不能大于 %d 像素', 'bjt-product-admin'), $this->args['max_height']));
            }
        }
        
        // 使用WordPress媒体库上传文件
        if (function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            
            $upload_overrides = array(
                'test_form' => false
            );
            
            // 处理上传
            $uploaded_file = wp_handle_upload($file, $upload_overrides);
            
            if (isset($uploaded_file['error'])) {
                return new WP_Error('upload_error', $uploaded_file['error']);
            }
            
            // 如果是图片，生成缩略图
            if (strpos($uploaded_file['type'], 'image/') === 0) {
                // 将文件添加到媒体库
                $attachment = array(
                    'post_mime_type' => $uploaded_file['type'],
                    'post_title' => preg_replace('/\.[^.]+$/', '', basename($uploaded_file['file'])),
                    'post_content' => '',
                    'post_status' => 'inherit'
                );
                
                $attach_id = wp_insert_attachment($attachment, $uploaded_file['file']);
                
                if (!is_wp_error($attach_id)) {
                    // 生成附件的元数据
                    $attach_data = wp_generate_attachment_metadata($attach_id, $uploaded_file['file']);
                    wp_update_attachment_metadata($attach_id, $attach_data);
                    
                    return array(
                        'file' => $uploaded_file['url'],
                        'path' => $uploaded_file['file'],
                        'type' => $uploaded_file['type'],
                        'attachment_id' => $attach_id,
                        'width' => isset($img_data[0]) ? $img_data[0] : 0,
                        'height' => isset($img_data[1]) ? $img_data[1] : 0
                    );
                }
            }
            
            return array(
                'file' => $uploaded_file['url'],
                'path' => $uploaded_file['file'],
                'type' => $uploaded_file['type']
            );
        }
        
        return new WP_Error('upload_error', __('无法处理文件上传', 'bjt-product-admin'));
    }
    
    /**
     * 验证文件
     *
     * @param array $file 文件数组
     * @return true|WP_Error 验证结果或错误
     */
    public function validate_file($file) {
        // 确保文件是有效的
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            return new WP_Error('validation_error', __('无效的上传文件', 'bjt-product-admin'));
        }
        
        // 检查文件大小
        if ($file['size'] > $this->args['max_file_size']) {
            return new WP_Error('validation_error', sprintf(__('文件大小超过限制 (%s)', 'bjt-product-admin'), size_format($this->args['max_file_size'])));
        }
        
        // 检查文件类型
        $file_type = wp_check_filetype(basename($file['name']), null);
        if (!$file_type['type']) {
            return new WP_Error('validation_error', __('不支持的文件类型', 'bjt-product-admin'));
        }
        
        if (!empty($this->args['allowed_types']) && !in_array($file_type['type'], $this->args['allowed_types'])) {
            return new WP_Error('validation_error', __('不支持的文件类型', 'bjt-product-admin'));
        }
        
        if (!empty($this->args['allowed_extensions']) && !in_array($file_type['ext'], $this->args['allowed_extensions'])) {
            return new WP_Error('validation_error', __('不支持的文件扩展名', 'bjt-product-admin'));
        }
        
        // 如果只允许图片，验证是否为图片
        if ($this->args['image_only']) {
            $img_types = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
            if (!in_array($file_type['type'], $img_types)) {
                return new WP_Error('validation_error', __('只允许上传图片文件', 'bjt-product-admin'));
            }
            
            // 检查图片尺寸
            $img_data = getimagesize($file['tmp_name']);
            if (!$img_data) {
                return new WP_Error('validation_error', __('无法获取图片尺寸', 'bjt-product-admin'));
            }
            
            if ($this->args['min_width'] > 0 && $img_data[0] < $this->args['min_width']) {
                return new WP_Error('validation_error', sprintf(__('图片宽度不能小于 %d 像素', 'bjt-product-admin'), $this->args['min_width']));
            }
            
            if ($this->args['min_height'] > 0 && $img_data[1] < $this->args['min_height']) {
                return new WP_Error('validation_error', sprintf(__('图片高度不能小于 %d 像素', 'bjt-product-admin'), $this->args['min_height']));
            }
            
            if ($this->args['max_width'] > 0 && $img_data[0] > $this->args['max_width']) {
                return new WP_Error('validation_error', sprintf(__('图片宽度不能大于 %d 像素', 'bjt-product-admin'), $this->args['max_width']));
            }
            
            if ($this->args['max_height'] > 0 && $img_data[1] > $this->args['max_height']) {
                return new WP_Error('validation_error', sprintf(__('图片高度不能大于 %d 像素', 'bjt-product-admin'), $this->args['max_height']));
            }
        }
        
        return true;
    }
} 