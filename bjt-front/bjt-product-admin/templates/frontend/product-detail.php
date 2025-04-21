<?php
/**
 * Product Detail Template
 *
 * This template displays the product detail page for a single product.
 *
 * @package BJT_Product_Admin
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Get product data
$product_id = get_the_ID();
$model = get_post_meta($product_id, 'bjt_product_model', true);
$sku = get_post_meta($product_id, 'bjt_product_sku', true);
$specifications = get_post_meta($product_id, 'bjt_product_specifications', true);
$features = get_post_meta($product_id, 'bjt_product_features', true);
$documents = get_post_meta($product_id, 'bjt_product_documents', true);
$related_products = get_post_meta($product_id, 'bjt_related_products', true);

// Get product images
$featured_image = get_the_post_thumbnail_url($product_id, 'large');
$gallery_images = get_post_meta($product_id, 'bjt_product_gallery', true);
if (empty($gallery_images) && $featured_image) {
    $gallery_images = array($featured_image);
}

// Get current language
$current_language = function_exists('pll_current_language') ? pll_current_language() : 'en';
?>

<div class="bjt-product-detail-container">
    <!-- Breadcrumbs -->
    <div class="bjt-breadcrumbs">
        <a href="<?php echo home_url(); ?>"><?php _e('Home', 'bjt-product-admin'); ?></a>
        <span class="separator">></span>
        <a href="<?php echo get_post_type_archive_link('bjt_product'); ?>"><?php _e('Products', 'bjt-product-admin'); ?></a>
        <span class="separator">></span>
        <span class="current"><?php the_title(); ?></span>
    </div>

    <!-- Product Header -->
    <div class="bjt-product-header">
        <h1 class="bjt-product-title"><?php the_title(); ?></h1>
        <?php if (!empty($model)) : ?>
            <div class="bjt-product-model"><?php _e('Model:', 'bjt-product-admin'); ?> <?php echo esc_html($model); ?></div>
        <?php endif; ?>
    </div>

    <!-- Product Content -->
    <div class="bjt-product-content">
        <!-- Product Images -->
        <div class="bjt-product-images">
            <div class="bjt-product-main-image">
                <img src="<?php echo esc_url($featured_image ? $featured_image : BJT_PLUGIN_URL . 'assets/images/placeholder.png'); ?>" 
                     alt="<?php the_title_attribute(); ?>" 
                     data-zoom-image="<?php echo esc_url($featured_image ? $featured_image : BJT_PLUGIN_URL . 'assets/images/placeholder.png'); ?>">
            </div>
            
            <?php if (!empty($gallery_images) && count($gallery_images) > 1) : ?>
                <div class="bjt-product-thumbnails">
                    <?php foreach ($gallery_images as $index => $image_url) : ?>
                        <div class="bjt-product-thumbnail <?php echo ($index === 0) ? 'active' : ''; ?>">
                            <img src="<?php echo esc_url($image_url); ?>" alt="<?php the_title_attribute(); ?> - <?php echo esc_attr($index + 1); ?>">
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Product Info -->
        <div class="bjt-product-info">
            <?php if (!empty($sku)) : ?>
                <div class="bjt-product-sku">
                    <span class="label"><?php _e('SKU:', 'bjt-product-admin'); ?></span>
                    <span class="value"><?php echo esc_html($sku); ?></span>
                </div>
            <?php endif; ?>

            <div class="bjt-product-description">
                <?php the_content(); ?>
            </div>

            <!-- Call to Action Buttons -->
            <div class="bjt-product-actions">
                <button class="bjt-button bjt-button-inquiry" data-product-id="<?php echo esc_attr($product_id); ?>" data-product-title="<?php the_title_attribute(); ?>">
                    <?php _e('Add to Inquiry', 'bjt-product-admin'); ?>
                </button>
                
                <?php if (!empty($documents) && isset($documents['pdf'][$current_language])) : ?>
                    <button class="bjt-button bjt-button-pdf" data-product-id="<?php echo esc_attr($product_id); ?>" data-language="<?php echo esc_attr($current_language); ?>">
                        <?php _e('Download PDF', 'bjt-product-admin'); ?>
                    </button>
                <?php endif; ?>
            </div>

            <!-- Product Meta -->
            <div class="bjt-product-meta">
                <?php 
                // Display categories
                $terms = get_the_terms($product_id, 'bjt_product_category');
                if (!empty($terms) && !is_wp_error($terms)) : 
                ?>
                    <div class="bjt-product-categories">
                        <span class="label"><?php _e('Categories:', 'bjt-product-admin'); ?></span>
                        <span class="value">
                            <?php 
                            $term_links = array();
                            foreach ($terms as $term) {
                                $term_links[] = '<a href="' . esc_url(get_term_link($term)) . '">' . esc_html($term->name) . '</a>';
                            }
                            echo implode(', ', $term_links);
                            ?>
                        </span>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Product Tabs -->
    <div class="bjt-product-tabs">
        <div class="bjt-tab-headers">
            <div class="bjt-tab-header active" data-tab="description">
                <?php _e('Description', 'bjt-product-admin'); ?>
            </div>
            
            <?php if (!empty($specifications)) : ?>
                <div class="bjt-tab-header" data-tab="specifications">
                    <?php _e('Specifications', 'bjt-product-admin'); ?>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($features)) : ?>
                <div class="bjt-tab-header" data-tab="features">
                    <?php _e('Features', 'bjt-product-admin'); ?>
                </div>
            <?php endif; ?>
            
            <div class="bjt-tab-header" data-tab="inquiry">
                <?php _e('Request Information', 'bjt-product-admin'); ?>
            </div>
        </div>

        <div class="bjt-tab-panels">
            <!-- Description Tab -->
            <div class="bjt-tab-panel active" data-tab="description">
                <div class="bjt-product-description-full">
                    <?php the_content(); ?>
                </div>
            </div>

            <!-- Specifications Tab -->
            <?php if (!empty($specifications)) : ?>
                <div class="bjt-tab-panel" data-tab="specifications">
                    <div class="bjt-product-specifications">
                        <table class="bjt-specs-table">
                            <tbody>
                                <?php 
                                $current_group = '';
                                foreach ($specifications as $spec) :
                                    if (isset($spec['group']) && $spec['group'] !== $current_group) :
                                        $current_group = $spec['group'];
                                ?>
                                    <tr class="bjt-specs-group-header">
                                        <th colspan="2"><?php echo esc_html($current_group); ?></th>
                                    </tr>
                                <?php endif; ?>
                                    <tr>
                                        <th><?php echo esc_html($spec['name']); ?></th>
                                        <td><?php echo wp_kses_post($spec['value']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Features Tab -->
            <?php if (!empty($features)) : ?>
                <div class="bjt-tab-panel" data-tab="features">
                    <div class="bjt-product-features">
                        <ul>
                            <?php foreach ($features as $feature) : ?>
                                <li>
                                    <div class="bjt-feature-item">
                                        <?php if (!empty($feature['icon'])) : ?>
                                            <div class="bjt-feature-icon">
                                                <img src="<?php echo esc_url($feature['icon']); ?>" alt="<?php echo esc_attr($feature['title']); ?>">
                                            </div>
                                        <?php endif; ?>
                                        <div class="bjt-feature-content">
                                            <h3 class="bjt-feature-title"><?php echo esc_html($feature['title']); ?></h3>
                                            <div class="bjt-feature-description"><?php echo wp_kses_post($feature['description']); ?></div>
                                        </div>
                                    </div>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Inquiry Tab -->
            <div class="bjt-tab-panel" data-tab="inquiry">
                <div class="bjt-contact-form">
                    <h3><?php _e('Contact Us About This Product', 'bjt-product-admin'); ?></h3>
                    <form data-product-id="<?php echo esc_attr($product_id); ?>">
                        <div class="bjt-form-row">
                            <div class="bjt-form-group">
                                <label for="inquiry_name"><?php _e('Name', 'bjt-product-admin'); ?> *</label>
                                <input type="text" id="inquiry_name" name="inquiry_name" required>
                            </div>
                            <div class="bjt-form-group">
                                <label for="inquiry_email"><?php _e('Email', 'bjt-product-admin'); ?> *</label>
                                <input type="email" id="inquiry_email" name="inquiry_email" required>
                            </div>
                        </div>
                        
                        <div class="bjt-form-row">
                            <div class="bjt-form-group">
                                <label for="inquiry_company"><?php _e('Company', 'bjt-product-admin'); ?></label>
                                <input type="text" id="inquiry_company" name="inquiry_company">
                            </div>
                            <div class="bjt-form-group">
                                <label for="inquiry_phone"><?php _e('Phone', 'bjt-product-admin'); ?></label>
                                <input type="tel" id="inquiry_phone" name="inquiry_phone">
                            </div>
                        </div>
                        
                        <div class="bjt-form-group full-width">
                            <label for="inquiry_message"><?php _e('Message', 'bjt-product-admin'); ?> *</label>
                            <textarea id="inquiry_message" name="inquiry_message" rows="5" required></textarea>
                        </div>
                        
                        <div class="bjt-form-group full-width">
                            <button type="submit" class="bjt-button bjt-button-primary"><?php _e('Send Inquiry', 'bjt-product-admin'); ?></button>
                        </div>
                        
                        <div class="bjt-form-message success" style="display: none;"></div>
                        <div class="bjt-form-message error" style="display: none;"></div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Related Products -->
    <?php if (!empty($related_products)) : 
        $related_ids = explode(',', $related_products);
        if (!empty($related_ids)) :
            $args = array(
                'post_type' => 'bjt_product',
                'post__in' => $related_ids,
                'posts_per_page' => 4,
                'post_status' => 'publish',
                'orderby' => 'post__in'
            );
            $related_query = new WP_Query($args);
            if ($related_query->have_posts()) :
    ?>
        <div class="bjt-related-products">
            <h2 class="bjt-section-title"><?php _e('Related Products', 'bjt-product-admin'); ?></h2>
            <div class="bjt-product-grid">
                <?php while ($related_query->have_posts()) : $related_query->the_post(); 
                    $rel_product_id = get_the_ID();
                    $rel_model = get_post_meta($rel_product_id, 'bjt_product_model', true);
                    $rel_image = get_the_post_thumbnail_url($rel_product_id, 'medium');
                ?>
                    <div class="bjt-product-card">
                        <a href="<?php the_permalink(); ?>" class="bjt-product-card-link">
                            <div class="bjt-product-card-image">
                                <img src="<?php echo esc_url($rel_image ? $rel_image : BJT_PLUGIN_URL . 'assets/images/placeholder.png'); ?>" 
                                     alt="<?php the_title_attribute(); ?>">
                            </div>
                            <div class="bjt-product-card-content">
                                <h3 class="bjt-product-card-title"><?php the_title(); ?></h3>
                                <?php if (!empty($rel_model)) : ?>
                                    <div class="bjt-product-card-model"><?php echo esc_html($rel_model); ?></div>
                                <?php endif; ?>
                            </div>
                        </a>
                    </div>
                <?php endwhile; ?>
            </div>
        </div>
    <?php 
            endif;
            wp_reset_postdata();
        endif;
    endif; 
    ?>
</div> 