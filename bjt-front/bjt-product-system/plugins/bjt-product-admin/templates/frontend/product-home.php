<?php
/**
 * Template Name: BJT Product Home
 * Description: Frontend product display page for BJT Product Management System
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get current language
$current_lang = get_locale();
$is_english = bjt_safe_strpos($current_lang, 'en') === 0;

// Get product lines from the database using BJT_Product_Line_Management
$product_line_manager = BJT_Product_Line_Management::get_instance();
$product_lines = $product_line_manager->get_all_product_lines();

// 获取当前语言对应的字段后缀
$lang_suffix = $is_english ? 'en' : 'cn';
?>
<!DOCTYPE html>
<html lang="<?php echo esc_attr($current_lang); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html__('BJT Product Management System', 'bjt-product-admin'); ?></title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
        }
        .header {
            background-color: #1a3c70;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .nav {
            display: flex;
        }
        .nav a {
            color: white;
            text-decoration: none;
            margin-left: 1.5rem;
            transition: opacity 0.3s;
        }
        .nav a:hover {
            opacity: 0.8;
        }
        .language-switcher {
            margin-left: 1.5rem;
        }
        .language-switcher select {
            padding: 5px;
            border: none;
            border-radius: 3px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .hero {
            text-align: center;
            padding: 3rem 0;
        }
        .hero h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .hero p {
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
        }
        .product-section {
            margin-bottom: 3rem;
        }
        .section-header {
            font-size: 1.8rem;
            color: #1a3c70;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #1a3c70;
            padding-bottom: 0.5rem;
        }
        .section-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .section-text {
            flex: 1;
            padding-right: 2rem;
        }
        .section-image {
            flex: 1;
        }
        .section-image img {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .introduction {
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
        }
        .divider {
            width: 50px;
            height: 3px;
            background-color: #1a3c70;
            margin-bottom: 1rem;
        }
        .product-links {
            margin-top: 1.5rem;
        }
        .product-link {
            display: inline-block;
            margin-right: 1rem;
            margin-bottom: 0.5rem;
            padding: 8px 15px;
            background-color: #f5f5f5;
            color: #333;
            text-decoration: none;
            border-radius: 3px;
            transition: all 0.3s;
        }
        .product-link:hover {
            background-color: #1a3c70;
            color: white;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 2rem;
            text-align: center;
            margin-top: 3rem;
        }
        .footer-nav {
            margin-bottom: 1rem;
        }
        .footer-nav a {
            margin: 0 1rem;
            color: #1a3c70;
            text-decoration: none;
        }
        .copyright {
            color: #666;
            font-size: 0.9rem;
        }
        
        @media screen and (max-width: 768px) {
            .section-content {
                flex-direction: column;
            }
            .section-text {
                padding-right: 0;
                margin-bottom: 1.5rem;
            }
            .nav {
                display: none;
            }
            .hero h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">BJT</div>
        <nav class="nav">
            <a href="#"><?php echo esc_html__('Home', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('Products', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('Support', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('About Us', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('Contact', 'bjt-product-admin'); ?></a>
            <div class="language-switcher">
                <select id="language-select">
                    <option value="cn" <?php echo !$is_english ? 'selected' : ''; ?>>中文</option>
                    <option value="en" <?php echo $is_english ? 'selected' : ''; ?>>English</option>
                </select>
            </div>
        </nav>
    </header>
    
    <div class="hero">
        <h1><?php echo esc_html__('BJT Product Management System', 'bjt-product-admin'); ?></h1>
        <p><?php echo esc_html__('Professional packaging equipment and solutions for your business', 'bjt-product-admin'); ?></p>
    </div>
    
    <main class="container">
        <?php if (!empty($product_lines)): ?>
            <?php foreach ($product_lines as $product_line): ?>
                <div class="product-section">
                    <div class="section-header">
                        <?php echo esc_html($product_line['title_'.$lang_suffix]); ?>
                    </div>
                    <div class="section-content">
                        <div class="section-text">
                            <p class="introduction"><?php echo esc_html__('Introduction', 'bjt-product-admin'); ?></p>
                            <div class="divider"></div>
                            <p><?php echo esc_html($product_line['description_'.$lang_suffix]); ?></p>
                            
                            <div class="product-links">
                                <?php if (!empty($product_line['subitem1_'.$lang_suffix])): ?>
                                    <a href="#" class="product-link"><?php echo esc_html($product_line['subitem1_'.$lang_suffix]); ?></a>
                                <?php endif; ?>
                                <?php if (!empty($product_line['subitem2_'.$lang_suffix])): ?>
                                    <a href="#" class="product-link"><?php echo esc_html($product_line['subitem2_'.$lang_suffix]); ?></a>
                                <?php endif; ?>
                                <?php if (!empty($product_line['subitem3_'.$lang_suffix])): ?>
                                    <a href="#" class="product-link"><?php echo esc_html($product_line['subitem3_'.$lang_suffix]); ?></a>
                                <?php endif; ?>
                            </div>
                        </div>
                        <div class="section-image">
                            <?php
                            $image_url = !empty($product_line['image_url']) 
                                ? $product_line['image_url'] 
                                : plugins_url('assets/images/placeholder.png', dirname(dirname(__FILE__)));
                            ?>
                            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($product_line['title_'.$lang_suffix]); ?>">
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="product-section">
                <div class="section-header">
                    <?php echo esc_html__('No product lines available', 'bjt-product-admin'); ?>
                </div>
                <div class="section-content">
                    <p><?php echo esc_html__('No product lines have been added yet.', 'bjt-product-admin'); ?></p>
                </div>
            </div>
        <?php endif; ?>
    </main>
    
    <footer class="footer">
        <div class="footer-nav">
            <a href="#"><?php echo esc_html__('Terms of Service', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('Privacy Policy', 'bjt-product-admin'); ?></a>
            <a href="#"><?php echo esc_html__('Sitemap', 'bjt-product-admin'); ?></a>
        </div>
        <div class="copyright">
            &copy; <?php echo date('Y'); ?> BJT. <?php echo esc_html__('All rights reserved.', 'bjt-product-admin'); ?>
        </div>
    </footer>
    
    <script>
    document.getElementById('language-select').addEventListener('change', function() {
        var lang = this.value;
        // Handle language change - in a real implementation, this would update the UI
        console.log("Language changed to: " + lang);
        // In a real implementation you might redirect to a different version of the page or update via AJAX
    });
    </script>
</body>
</html> 