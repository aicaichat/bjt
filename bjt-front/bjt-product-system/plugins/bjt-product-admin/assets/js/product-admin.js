jQuery(document).ready(function($) {
    // 初始化拖拽排序
    if ($.fn.sortable) {
        $('.feature-items, .spec-items').sortable({
            handle: '.drag-handle',
            placeholder: 'sortable-placeholder',
            update: function(event, ui) {
                updateSortOrder($(this));
            }
        });
    }

    // 添加特性
    $('#addFeatureBtn').on('click', function() {
        var template = $('#featureTemplate').html();
        $('.feature-items').append(template);
    });

    // 添加规格
    $('#addSpecBtn').on('click', function() {
        var template = $('#specTemplate').html();
        $('.spec-items').append(template);
    });

    // 删除特性或规格
    $(document).on('click', '.remove-item', function() {
        $(this).closest('.feature-item, .spec-item').remove();
    });

    // 更新排序
    function updateSortOrder(container) {
        container.find('.feature-item, .spec-item').each(function(index) {
            $(this).find('.sort-order').val(index);
        });
    }

    // 图片上传
    $(document).on('click', '.upload-image', function(e) {
        e.preventDefault();
        var button = $(this);
        var imageId = button.next('input[type="hidden"]');
        var imagePreview = button.siblings('.preview-image');

        var frame = wp.media({
            title: 'Select or Upload Image',
            button: {
                text: 'Use this image'
            },
            multiple: false
        });

        frame.on('select', function() {
            var attachment = frame.state().get('selection').first().toJSON();
            imageId.val(attachment.id);
            imagePreview.attr('src', attachment.url).show();
        });

        frame.open();
    });

    // 表单验证
    $('.admin-form').on('submit', function(e) {
        var isValid = true;
        $(this).find('input[required], textarea[required]').each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }
        });

        if (!isValid) {
            e.preventDefault();
            alert(bjtAdmin.i18n.validationError);
        }
    });
}); 