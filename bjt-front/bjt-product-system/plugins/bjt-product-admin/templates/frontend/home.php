<?php
/**
 * Template Name: BJT Product Home
 * Description: BJT Product Management System Home Page
 */

get_header();
?>

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
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }
    
    /* Header Styles */
    header {
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 0;
    }
    
    .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .logo img {
        height: 42px;
        display: block;
    }
    
    .navigation {
        display: flex;
        align-items: center;
        margin-left: 40px;
        flex-grow: 1;
    }
    
    .nav-menu {
        list-style: none;
        display: flex;
        gap: 28px;
    }
    
    .nav-link {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        font-size: 15px;
        padding: 6px 0;
        position: relative;
        transition: color 0.2s;
    }
    
    .nav-link:hover {
        color: #1A365D;
    }
    
    .nav-link::after {
        content: '';
        position: absolute;
        width: 0;
        height: 2px;
        bottom: 0;
        left: 0;
        background-color: #1A365D;
        transition: width 0.2s;
    }
    
    .nav-link:hover::after {
        width: 100%;
    }
    
    .header-right {
        display: flex;
        align-items: center;
    }
    
    .language-select {
        margin-right: 18px;
        padding: 7px 12px;
        border: 1px solid #eaeaea;
        border-radius: 4px;
        background-color: white;
        cursor: pointer;
        font-size: 14px;
        color: #555;
    }
    
    .language-select:focus {
        outline: none;
        border-color: #1A365D;
    }
    
    .language-select option {
        padding: 8px;
        font-size: 14px;
    }
    
    .login-btn {
        background-color: #1A365D;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 9px 16px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        letter-spacing: 0.3px;
        transition: background-color 0.2s;
    }
    
    .login-btn:hover {
        background-color: #274785;
    }
    
    /* Main Content Styles */
    main {
        padding: 30px 0;
    }
    
    .product-section {
        background-color: white;
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        margin-bottom: 30px;
        overflow: hidden;
    }
    
    .section-header {
        background-color: #1A365D;
        color: white;
        padding: 15px 20px;
        font-size: 24px;
        font-weight: 500;
    }
    
    .section-content {
        padding: 20px;
        display: flex;
        flex-wrap: wrap;
    }
    
    .section-text {
        flex: 1;
        min-width: 300px;
        color: #555;
        line-height: 1.6;
        padding-right: 20px;
    }
    
    .section-image {
        flex: 0 0 auto;
        max-width: 300px;
    }
    
    .section-image img {
        max-width: 100%;
        height: auto;
    }
    
    .product-links {
        margin-top: 20px;
    }
    
    .product-link {
        display: block;
        color: #0066cc;
        text-decoration: none;
        margin-bottom: 10px;
        font-weight: 500;
    }
    
    .product-link::after {
        content: "⚡";
        margin-left: 8px;
        font-size: 0.8em;
    }
    
    .product-link:hover {
        text-decoration: underline;
    }
    
    /* Divider */
    .divider {
        height: 1px;
        background-color: #eee;
        margin: 15px 0;
    }
    
    /* Responsive Styles */
    @media (max-width: 768px) {
        .section-content {
            flex-direction: column;
        }
        
        .section-text {
            padding-right: 0;
            margin-bottom: 20px;
        }
        
        .section-image {
            max-width: 100%;
        }
    }
</style>

<header>
    <div class="header-container">
        <div class="logo">
            <?php if (has_custom_logo()): ?>
                <?php the_custom_logo(); ?>
            <?php else: ?>
                <img src="<?php echo plugins_url('assets/images/logo.png', dirname(__FILE__)); ?>" alt="BJT Logo">
            <?php endif; ?>
        </div>
        <div class="navigation">
            <nav>
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'container' => false,
                    'menu_class' => 'nav-menu',
                    'fallback_cb' => false,
                    'items_wrap' => '<ul class="nav-menu">%3$s</ul>'
                ));
                ?>
            </nav>
        </div>
        <div class="header-right">
            <?php echo do_shortcode('[language-switcher]'); ?>
            <?php if (!is_user_logged_in()): ?>
                <a href="<?php echo wp_login_url(); ?>" class="login-btn"><?php _e('Login', 'bjt-product-admin'); ?></a>
            <?php else: ?>
                <a href="<?php echo wp_logout_url(); ?>" class="login-btn"><?php _e('Logout', 'bjt-product-admin'); ?></a>
            <?php endif; ?>
        </div>
    </div>
</header>

<main class="container">
    <!-- Air Cushioning System -->
    <div class="product-section">
        <div class="section-header">
            <?php _e('Air Cushioning System', 'bjt-product-admin'); ?>
        </div>
        <div class="section-content">
            <div class="section-text">
                <p class="introduction"><?php _e('Introduction', 'bjt-product-admin'); ?></p>
                <div class="divider"></div>
                <p><?php _e('Our Air Cushioning System provides superior protection for your products during shipping. Designed for efficiency and versatility, this system creates customized air cushions that perfectly protect your items.', 'bjt-product-admin'); ?></p>
                
                <div class="product-links">
                    <?php
                    $air_cushion_products = get_posts(array(
                        'post_type' => 'product',
                        'tax_query' => array(
                            array(
                                'taxonomy' => 'product_category',
                                'field' => 'slug',
                                'terms' => 'air-cushioning'
                            )
                        )
                    ));
                    
                    foreach ($air_cushion_products as $product) {
                        echo '<a href="' . get_permalink($product->ID) . '" class="product-link">' . $product->post_title . '</a>';
                    }
                    ?>
                </div>
            </div>
            <div class="section-image">
                <?php
                $air_cushion_image = get_option('bjt_air_cushion_image');
                if ($air_cushion_image) {
                    echo wp_get_attachment_image($air_cushion_image, 'medium');
                } else {
                    echo '<img src="' . plugins_url('assets/images/placeholder.jpg', dirname(__FILE__)) . '" alt="Air Cushioning System">';
                }
                ?>
            </div>
        </div>
    </div>
    
    <!-- Paper Cushioning System -->
    <div class="product-section">
        <div class="section-header">
            <?php _e('Paper Cushioning System', 'bjt-product-admin'); ?>
        </div>
        <div class="section-content">
            <div class="section-text">
                <p class="introduction"><?php _e('Introduction', 'bjt-product-admin'); ?></p>
                <div class="divider"></div>
                <p><?php _e('Our Paper Cushioning System offers an eco-friendly packaging solution that provides excellent protection. The system converts paper into a strong, flexible cushioning material ideal for various packaging needs.', 'bjt-product-admin'); ?></p>
                
                <div class="product-links">
                    <?php
                    $paper_cushion_products = get_posts(array(
                        'post_type' => 'product',
                        'tax_query' => array(
                            array(
                                'taxonomy' => 'product_category',
                                'field' => 'slug',
                                'terms' => 'paper-cushioning'
                            )
                        )
                    ));
                    
                    foreach ($paper_cushion_products as $product) {
                        echo '<a href="' . get_permalink($product->ID) . '" class="product-link">' . $product->post_title . '</a>';
                    }
                    ?>
                </div>
            </div>
            <div class="section-image">
                <?php
                $paper_cushion_image = get_option('bjt_paper_cushion_image');
                if ($paper_cushion_image) {
                    echo wp_get_attachment_image($paper_cushion_image, 'medium');
                } else {
                    echo '<img src="' . plugins_url('assets/images/placeholder.jpg', dirname(__FILE__)) . '" alt="Paper Cushioning System">';
                }
                ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?> 