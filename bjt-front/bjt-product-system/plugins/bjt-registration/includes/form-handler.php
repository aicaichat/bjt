<?php
namespace BJT\Reg;

class Form_Handler {
    public static function render_shortcode() {
        ob_start();
        wp_enqueue_script('bjt-reg-form', plugin_dir_url(__DIR__) . 'assets/form.js', ['jquery'], '1.0', true);
        wp_nonce_field('bjt_reg_nonce', 'bjt_reg_nonce_field');
        ?>
        <form id="bjt-register-form">
            <p><input type="text" name="first_name" placeholder="First Name" required></p>
            <p><input type="text" name="last_name" placeholder="Last Name" required></p>
            <p><input type="email" name="email" placeholder="Email" required></p>
            <p><input type="password" name="password" placeholder="Password" required></p>
            <p>
                <select name="country" required>
                    <option value="">Country</option>
                    <?php foreach (['CN','US','DE','JP','KR','FR','CA','AU','UK'] as $c): ?>
                        <option value="<?php echo esc_attr($c); ?>"><?php echo esc_html($c); ?></option>
                    <?php endforeach; ?>
                </select>
            </p>
            <p>
                <label><input type="radio" name="unit" value="metric" checked> Metric</label>
                <label><input type="radio" name="unit" value="imperial"> Imperial</label>
            </p>
            <p><button type="submit"><?php _e('Register', 'bjt-registration'); ?></button></p>
        </form>
        <div id="bjt-reg-message"></div>
        <?php
        return ob_get_clean();
    }
} 