<?php
/**
 * Template Name: BJT Admin Login
 * Description: Custom login page for BJT Product Management System
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Check if user is already logged in
if (is_user_logged_in()) {
    wp_redirect(admin_url('admin.php?page=bjt-product-admin'));
    exit;
}

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['bjt_login_nonce'])) {
    if (wp_verify_nonce($_POST['bjt_login_nonce'], 'bjt_login_action')) {
        $credentials = array(
            'user_login'    => sanitize_text_field($_POST['username']),
            'user_password' => $_POST['password'],
            'remember'      => true
        );

        $user = wp_signon($credentials, false);

        if (!is_wp_error($user)) {
            wp_redirect(admin_url('admin.php?page=bjt-product-admin'));
            exit;
        } else {
            $error_message = $user->get_error_message();
        }
    }
}

// Get the current language
$current_lang = get_locale();
$lang_options = array(
    'zh_CN' => '中文',
    'en_US' => '🇬🇧 English',
    'ja'    => '🇯🇵 日本語',
    'ko_KR' => '🇰🇷 한국어',
    'fr_FR' => '🇫🇷 français',
    'de_DE' => '🇩🇪 Deutsch',
    'es_ES' => '🇪🇸 Español',
    'it_IT' => '🇮🇹 italiano',
    'ru_RU' => '🇷🇺 русский',
    'pt_PT' => '🇵🇹 português',
    'th'    => '🇹🇭 ไทย',
    'vi'    => '🇻🇳 tiếng việt'
);
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr($current_lang); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html__('BJT Admin Login', 'bjt-product-admin'); ?></title>
    <style>
        /* General Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #f7f9fb;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        /* Login Container */
        .login-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            padding: 30px;
            position: relative;
        }
        
        /* Language Selector */
        .language-select {
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            font-size: 14px;
        }
        
        /* Logo Area */
        .logo-area {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .logo-area img {
            width: 40px;
            height: 40px;
            margin-bottom: 10px;
        }
        
        /* Login Form */
        .login-form h1 {
            color: #1A365D;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        .input-group label {
            display: block;
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .input-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .input-group input:focus {
            border-color: #1A365D;
            outline: none;
        }
        
        /* Login Button */
        .login-btn {
            width: 100%;
            padding: 12px;
            background-color: #1A365D;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
            margin-top: 10px;
        }
        
        .login-btn:hover {
            background-color: #274785;
        }
        
        /* Error Message */
        .error-message {
            color: #dc3545;
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        /* Note */
        .note {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <select class="language-select" id="language-selector">
            <?php foreach ($lang_options as $code => $name): ?>
                <option value="<?php echo esc_attr($code); ?>" <?php selected($current_lang, $code); ?>>
                    <?php echo esc_html($name); ?>
                </option>
            <?php endforeach; ?>
        </select>
        
        <div class="logo-area">
            <img src="<?php echo esc_url(plugins_url('assets/images/logo-1.webp', dirname(__FILE__))); ?>" alt="BJT Logo">
        </div>
        
        <form class="login-form" method="post">
            <h1><?php echo esc_html__('Admin Login', 'bjt-product-admin'); ?></h1>
            
            <?php if (isset($error_message)): ?>
                <div class="error-message"><?php echo esc_html($error_message); ?></div>
            <?php endif; ?>
            
            <div class="input-group">
                <label for="username"><?php echo esc_html__('Username', 'bjt-product-admin'); ?></label>
                <input type="text" id="username" name="username" placeholder="<?php echo esc_attr__('Enter your username', 'bjt-product-admin'); ?>" required>
            </div>
            
            <div class="input-group">
                <label for="password"><?php echo esc_html__('Password', 'bjt-product-admin'); ?></label>
                <input type="password" id="password" name="password" placeholder="<?php echo esc_attr__('Enter your password', 'bjt-product-admin'); ?>" required>
            </div>
            
            <?php wp_nonce_field('bjt_login_action', 'bjt_login_nonce'); ?>
            <button type="submit" class="login-btn"><?php echo esc_html__('Log In', 'bjt-product-admin'); ?></button>
        </form>
        
        <div class="note">
            <?php echo esc_html__('This login is for administrative users only.', 'bjt-product-admin'); ?>
        </div>
    </div>
  
    <script>
        // Language selector functionality
        document.getElementById('language-selector').addEventListener('change', function() {
            const selectedLang = this.value;
            // In a real application, this would change the site language
            // For now, we'll just show an alert
            alert('Language changed to: ' + this.options[this.selectedIndex].text);
        });
    </script>
</body>
</html> 