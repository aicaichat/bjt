/**
 * Product Detail Page Scripts
 * @package BJT_Product_Admin
 */

(function($) {
    'use strict';

    // Main initialization function
    function initProductDetail() {
        initProductGallery();
        initProductTabs();
        initInquiryForm();
        initRelatedProducts();
    }

    /**
     * Initialize product image gallery with thumbnails
     */
    function initProductGallery() {
        const $mainImage = $('.bjt-product-main-image img');
        const $thumbnails = $('.bjt-product-thumbnail');

        // Set first thumbnail as active
        $thumbnails.first().addClass('active');

        // Handle thumbnail click
        $thumbnails.on('click', function() {
            const imgSrc = $(this).find('img').attr('src').replace('-thumbnail', '');
            
            // Update main image
            $mainImage.attr('src', imgSrc);
            
            // Update active state
            $thumbnails.removeClass('active');
            $(this).addClass('active');
        });
    }

    /**
     * Initialize product tabs for specifications, features, and contact form
     */
    function initProductTabs() {
        const $tabHeaders = $('.bjt-tab-header');
        const $tabPanels = $('.bjt-tab-panel');
        
        // Check URL hash for direct tab linking
        const checkUrlHash = function() {
            const hash = window.location.hash.substring(1);
            
            if (hash && $('#' + hash).length) {
                // Activate the tab matching the hash
                $tabHeaders.removeClass('active');
                $tabPanels.removeClass('active');
                
                $tabHeaders.filter('[data-tab="' + hash + '"]').addClass('active');
                $('#' + hash).addClass('active');
                
                // Scroll to the tab
                $('html, body').animate({
                    scrollTop: $('.bjt-product-tabs').offset().top - 50
                }, 500);
            }
        };
        
        // Check hash on page load
        checkUrlHash();
        
        // Handle tab click
        $tabHeaders.on('click', function() {
            const tabId = $(this).data('tab');
            
            // Update active state
            $tabHeaders.removeClass('active');
            $tabPanels.removeClass('active');
            
            $(this).addClass('active');
            $('#' + tabId).addClass('active');
            
            // Update URL hash without scrolling
            history.pushState(null, null, '#' + tabId);
        });
        
        // Handle browser back/forward
        $(window).on('hashchange', checkUrlHash);
    }

    /**
     * Initialize inquiry form with validation and AJAX submission
     */
    function initInquiryForm() {
        const $form = $('#product-inquiry-form');
        const $successMessage = $('.bjt-form-message.success');
        const $errorMessage = $('.bjt-form-message.error');
        
        if (!$form.length) return;
        
        $form.on('submit', function(e) {
            e.preventDefault();
            
            // Reset messages
            $successMessage.hide();
            $errorMessage.hide();
            
            // Basic form validation
            let isValid = true;
            const $requiredFields = $form.find('[required]');
            
            $requiredFields.each(function() {
                const $field = $(this);
                
                if (!$field.val().trim()) {
                    isValid = false;
                    $field.addClass('error');
                } else {
                    $field.removeClass('error');
                    
                    // Additional email validation
                    if ($field.attr('type') === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test($field.val().trim())) {
                            isValid = false;
                            $field.addClass('error');
                        }
                    }
                }
            });
            
            if (!isValid) {
                $errorMessage.text(bjt_product_vars.messages.form_validation_error).show();
                return;
            }
            
            // Prepare form data for AJAX
            const formData = new FormData($form[0]);
            formData.append('action', 'bjt_submit_product_inquiry');
            formData.append('nonce', bjt_product_vars.nonce);
            
            // Disable submit button
            const $submitBtn = $form.find('button[type="submit"]');
            const originalBtnText = $submitBtn.text();
            $submitBtn.prop('disabled', true).text(bjt_product_vars.messages.submitting);
            
            // Send AJAX request
            $.ajax({
                url: bjt_product_vars.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Show success message
                        $successMessage.text(response.message).show();
                        
                        // Reset form
                        $form[0].reset();
                        
                        // Auto-hide success message after delay
                        setTimeout(function() {
                            $successMessage.fadeOut();
                        }, 5000);
                        
                        // Scroll to message if not in viewport
                        if (!isElementInViewport($successMessage[0])) {
                            $('html, body').animate({
                                scrollTop: $successMessage.offset().top - 100
                            }, 500);
                        }
                    } else {
                        // Show error message
                        $errorMessage.text(response.message).show();
                    }
                },
                error: function() {
                    // Show generic error message
                    $errorMessage.text(bjt_product_vars.messages.ajax_error).show();
                },
                complete: function() {
                    // Re-enable submit button
                    $submitBtn.prop('disabled', false).text(originalBtnText);
                }
            });
        });
    }

    /**
     * Initialize related products slider
     */
    function initRelatedProducts() {
        const $productGrid = $('.bjt-product-grid');
        
        // Check if slick slider is available and there are enough products
        if ($.fn.slick && $productGrid.length && $productGrid.children().length > 2) {
            $productGrid.slick({
                dots: true,
                arrows: true,
                infinite: true,
                speed: 500,
                slidesToShow: 4,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 5000,
                responsive: [
                    {
                        breakpoint: 1200,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 480,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                        }
                    }
                ]
            });
        }
    }

    /**
     * Utility function to check if element is in viewport
     * @param {HTMLElement} el Element to check
     * @return {boolean} Whether element is in viewport
     */
    function isElementInViewport(el) {
        if (!el) return false;
        
        const rect = el.getBoundingClientRect();
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Initialize on document ready
    $(document).ready(initProductDetail);
    
})(jQuery); 