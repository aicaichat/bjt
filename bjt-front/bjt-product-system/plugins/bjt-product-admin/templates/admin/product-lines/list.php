<?php
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前语言
$current_lang = isset($_GET['lang']) ? sanitize_text_field($_GET['lang']) : 'en';

// 获取产品线列表（固定4条）
$product_lines = BJT_Product_Line_Management::get_instance()->get_product_lines(array(
    'page' => 1,
    'page_size' => 4,
    'status' => 'publish',
    'lang' => $current_lang
));

$message = isset($_GET['message']) ? $_GET['message'] : '';
?>

<div class="wrap bjt-product-lines">
    <div class="bjt-header">
        <div class="bjt-logo">
            <img src="<?php echo esc_url(BJT_PLUGIN_URL . 'assets/images/logo.png'); ?>" alt="BJT Logo">
        </div>
        <div class="bjt-language-switcher">
            <a href="<?php echo add_query_arg('lang', 'en'); ?>" class="<?php echo $current_lang === 'en' ? 'active' : ''; ?>">English</a>
            <span class="separator">|</span>
            <a href="<?php echo add_query_arg('lang', 'zh'); ?>" class="<?php echo $current_lang === 'zh' ? 'active' : ''; ?>">中文</a>
        </div>
    </div>

    <?php if ($message === 'saved'): ?>
    <div class="notice notice-success is-dismissible">
        <p><?php echo $current_lang === 'en' ? 'Product line has been saved.' : '产品线已保存。'; ?></p>
    </div>
    <?php endif; ?>

    <!-- 产品线列表 -->
    <div class="bjt-product-grid">
        <?php if (!empty($product_lines['data']['items'])): ?>
            <?php foreach ($product_lines['data']['items'] as $product_line): ?>
                <div class="bjt-product-card" data-id="<?php echo $product_line->id; ?>">
                    <div class="bjt-product-image">
                        <?php if ($product_line->image_url): ?>
                            <img src="<?php echo esc_url($product_line->image_url); ?>" alt="<?php echo esc_attr($product_line->name); ?>">
                        <?php else: ?>
                            <div class="bjt-no-image">N/A</div>
                        <?php endif; ?>
                    </div>
                    <div class="bjt-product-info">
                        <h3 class="bjt-product-title">
                            <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id=' . $product_line->id); ?>">
                                <?php echo esc_html($product_line->name); ?>
                            </a>
                        </h3>
                        <p class="bjt-product-description">
                            <?php echo esc_html($product_line->description); ?>
                        </p>
                        <div class="bjt-product-actions">
                            <a href="<?php echo admin_url('admin.php?page=bjt-products&product_line=' . $product_line->id); ?>" class="button">
                                <?php echo $current_lang === 'en' ? 'View Products' : '查看产品'; ?>
                            </a>
                            <a href="<?php echo admin_url('admin.php?page=bjt-product-lines&action=edit&id=' . $product_line->id); ?>" class="button">
                                <?php echo $current_lang === 'en' ? 'Edit' : '编辑'; ?>
                            </a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="notice notice-warning">
                <p><?php echo $current_lang === 'en' ? 'No product lines found.' : '未找到产品线。'; ?></p>
            </div>
        <?php endif; ?>
    </div>

    <!-- 快速链接 -->
    <div class="bjt-quick-links">
        <div class="bjt-quick-link">
            <h4><?php echo $current_lang === 'en' ? 'Documentation' : '文档下载'; ?></h4>
            <ul>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'User Manual' : '用户手册'; ?></a></li>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'Technical Guide' : '技术指南'; ?></a></li>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'Product Catalog' : '产品目录'; ?></a></li>
            </ul>
        </div>
        <div class="bjt-quick-link">
            <h4><?php echo $current_lang === 'en' ? 'After-sales Service' : '售后服务'; ?></h4>
            <ul>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'Contact Support' : '联系支持'; ?></a></li>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'Service Request' : '服务请求'; ?></a></li>
                <li><a href="#"><?php echo $current_lang === 'en' ? 'FAQ' : '常见问题'; ?></a></li>
            </ul>
        </div>
    </div>
</div>

<style>
.bjt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px 0;
    border-bottom: 1px solid #ddd;
}

.bjt-logo img {
    max-height: 50px;
}

.bjt-language-switcher {
    display: flex;
    align-items: center;
    gap: 10px;
}

.bjt-language-switcher a {
    text-decoration: none;
    color: #666;
    padding: 5px 10px;
    border-radius: 4px;
}

.bjt-language-switcher a.active {
    color: #2271b1;
    font-weight: bold;
}

.bjt-product-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-bottom: 40px;
}

.bjt-product-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.bjt-product-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.bjt-product-image {
    height: 200px;
    overflow: hidden;
    background: #f0f0f1;
}

.bjt-product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.bjt-product-info {
    padding: 20px;
}

.bjt-product-title {
    margin: 0 0 10px;
    font-size: 18px;
}

.bjt-product-title a {
    text-decoration: none;
    color: #1d2327;
}

.bjt-product-description {
    color: #666;
    margin: 0 0 20px;
    line-height: 1.5;
}

.bjt-product-actions {
    display: flex;
    gap: 10px;
}

.bjt-quick-links {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid #ddd;
}

.bjt-quick-link h4 {
    margin: 0 0 15px;
    font-size: 16px;
    color: #1d2327;
}

.bjt-quick-link ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

.bjt-quick-link li {
    margin-bottom: 10px;
}

.bjt-quick-link a {
    text-decoration: none;
    color: #2271b1;
}

.bjt-quick-link a:hover {
    text-decoration: underline;
}

@media screen and (max-width: 782px) {
    .bjt-product-grid {
        grid-template-columns: 1fr;
    }

    .bjt-quick-links {
        grid-template-columns: 1fr;
    }
}
</style> 