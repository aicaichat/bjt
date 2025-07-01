<?php
/**
 * PDF文件上传处理器
 * 处理前端上传的PDF文件
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Upload_Handler {
    
    public function __construct() {
        add_action('wp_ajax_upload_pdf', array($this, 'handle_pdf_upload'));
        add_action('wp_ajax_nopriv_upload_pdf', array($this, 'handle_pdf_upload'));
    }
    
    /**
     * 处理PDF文件上传
     */
    public function handle_pdf_upload() {
        // 验证nonce
        if (!wp_verify_nonce($_POST['nonce'], 'wp_rest')) {
            wp_die(json_encode(array(
                'success' => false,
                'data' => '安全验证失败'
            )));
        }
        
        // 检查用户权限
        if (!current_user_can('upload_files')) {
            wp_die(json_encode(array(
                'success' => false,
                'data' => '没有上传权限'
            )));
        }
        
        // 检查是否有文件上传
        if (!isset($_FILES['file'])) {
            wp_die(json_encode(array(
                'success' => false,
                'data' => '没有找到上传的文件'
            )));
        }
        
        $uploaded_file = $_FILES['file'];
        
        // 验证文件类型
        $allowed_types = array('application/pdf');
        $file_type = $uploaded_file['type'];
        $file_extension = strtolower(pathinfo($uploaded_file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file_type, $allowed_types) && $file_extension !== 'pdf') {
            wp_die(json_encode(array(
                'success' => false,
                'data' => '只允许上传PDF文件'
            )));
        }
        
        // 验证文件大小 (10MB)
        $max_size = 10 * 1024 * 1024; // 10MB in bytes
        if ($uploaded_file['size'] > $max_size) {
            wp_die(json_encode(array(
                'success' => false,
                'data' => '文件大小不能超过10MB'
            )));
        }
        
        // 使用WordPress的上传处理函数
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        // 设置上传覆盖
        $upload_overrides = array(
            'test_form' => false,
            'mimes' => array(
                'pdf' => 'application/pdf'
            )
        );
        
        // 执行上传
        $movefile = wp_handle_upload($uploaded_file, $upload_overrides);
        
        if ($movefile && !isset($movefile['error'])) {
            // 上传成功，创建媒体库记录
            $attachment = array(
                'guid' => $movefile['url'],
                'post_mime_type' => $movefile['type'],
                'post_title' => preg_replace('/\.[^.]+$/', '', basename($uploaded_file['name'])),
                'post_content' => '',
                'post_status' => 'inherit'
            );
            
            // 插入到媒体库
            $attach_id = wp_insert_attachment($attachment, $movefile['file']);
            
            if ($attach_id) {
                // 生成缩略图元数据
                $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);
                
                // 返回成功响应
                wp_die(json_encode(array(
                    'success' => true,
                    'data' => array(
                        'url' => $movefile['url'],
                        'file_url' => $movefile['url'],
                        'attachment_id' => $attach_id,
                        'file_name' => basename($movefile['file']),
                        'file_size' => $uploaded_file['size'],
                        'message' => 'PDF文件上传成功'
                    )
                )));
            } else {
                wp_die(json_encode(array(
                    'success' => false,
                    'data' => '保存到媒体库失败'
                )));
            }
        } else {
            // 上传失败
            $error_message = isset($movefile['error']) ? $movefile['error'] : '上传失败';
            wp_die(json_encode(array(
                'success' => false,
                'data' => $error_message
            )));
        }
    }
}

// 初始化上传处理器
new BJT_Upload_Handler(); 