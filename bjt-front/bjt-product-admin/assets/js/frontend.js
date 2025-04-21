jQuery(document).ready(function($) {
    // 语言切换功能
    $('.language-select').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const language = selectedOption.val();
        
        // 发送AJAX请求切换语言
        $.ajax({
            url: bjt_product_admin.ajax_url,
            type: 'POST',
            data: {
                action: 'bjt_switch_language',
                language: language,
                nonce: bjt_product_admin.nonce
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert('Failed to switch language');
                }
            }
        });
    });

    // 产品链接点击事件
    $('.product-link').on('click', function(e) {
        if (!bjt_product_admin.is_logged_in) {
            e.preventDefault();
            alert(bjt_product_admin.login_required);
        }
    });

    // 响应式导航菜单
    const $navMenu = $('.nav-menu');
    const $navToggle = $('<button class="nav-toggle">Menu</button>');
    
    if ($(window).width() <= 768) {
        $navToggle.insertBefore($navMenu);
        $navMenu.hide();
        
        $navToggle.on('click', function() {
            $navMenu.slideToggle();
        });
    }

    // 图片懒加载
    $('.section-image img').each(function() {
        const $img = $(this);
        const src = $img.attr('data-src');
        
        if (src) {
            $img.attr('src', src);
        }
    });
}); 