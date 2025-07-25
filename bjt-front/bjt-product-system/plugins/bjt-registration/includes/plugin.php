<?php
namespace BJT\Reg;

class Plugin {
    public function init() {
        // Register shortcode
        add_shortcode('bjt_register_form', [Form_Handler::class, 'render_shortcode']);

        // REST routes
        add_action('rest_api_init', function() {
            $controller = new Rest_Controller();
            $controller->register_routes();
        });

        // Admin UI handled by separate React app; no WP admin menu needed.
    }
} 