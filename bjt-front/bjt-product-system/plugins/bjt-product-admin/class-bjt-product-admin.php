        // 添加AJAX URL和nonce到JavaScript
        wp_localize_script('bjt-admin-script', 'bjt_admin_data', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bjt_ajax_nonce')
        ));
        
        wp_enqueue_script('bjt-admin-script'); 