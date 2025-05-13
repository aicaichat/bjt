/**
 * BJT Product System Admin JavaScript
 */
(function($) {
    'use strict';

    $(document).ready(function() {
        // 媒体上传器
        function initMediaUploader() {
            $('#upload_image_button').on('click', function(e) {
                e.preventDefault();
                
                var custom_uploader = wp.media({
                    title: '选择图片',
                    button: {
                        text: '使用这张图片'
                    },
                    multiple: false
                });
                
                custom_uploader.on('select', function() {
                    var attachment = custom_uploader.state().get('selection').first().toJSON();
                    $('#image_url').val(attachment.url);
                    $('#image_preview').html('<img src="' + attachment.url + '" alt="图片预览" style="max-width: 200px; margin-top: 10px;">');
                });
                
                custom_uploader.open();
            });
        }

        // 冲突处理按钮
        function initConflictActions() {
            $('.resolve-conflict').on('click', function(e) {
                if (!confirm('确定要解决此冲突吗?')) {
                    e.preventDefault();
                }
            });
        }

        // 初始化
        function init() {
            initMediaUploader();
            initConflictActions();
        }

        // 运行初始化
        init();
    });

})(jQuery); 