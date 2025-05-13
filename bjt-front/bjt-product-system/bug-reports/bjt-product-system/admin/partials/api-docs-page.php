<?php
/**
 * API documentation page.
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/admin/partials
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Get API documentation content
$docs_path = BJT_PRODUCT_SYSTEM_PATH . 'docs/API-DOCUMENTATION.md';
$docs_content = '';

if (file_exists($docs_path)) {
    $docs_content = file_get_contents($docs_path);
} else {
    $docs_content = "# API 文档未找到\n\n请确保 `docs/API-DOCUMENTATION.md` 文件存在。";
}

// Include Parsedown library if it doesn't exist
if (!class_exists('Parsedown')) {
    require_once BJT_PRODUCT_SYSTEM_PATH . 'lib/Parsedown.php';
}

// Parse markdown to HTML
$parsedown = new Parsedown();
$docs_html = $parsedown->text($docs_content);
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="api-docs-container">
        <div class="api-docs-header">
            <p><?php _e('这是 BJT 产品管理系统的 API 文档，详细介绍了如何使用 API 接口获取和管理产品数据。', 'bjt-product-system'); ?></p>
            
            <div class="api-docs-actions">
                <a href="<?php echo esc_url(home_url('/wp-json/bjt/v1')); ?>" class="button" target="_blank"><?php _e('访问 API 基础路径', 'bjt-product-system'); ?></a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=bjt-api-docs&action=regenerate&_wpnonce=' . wp_create_nonce('regenerate_api_docs'))); ?>" class="button"><?php _e('重新生成文档', 'bjt-product-system'); ?></a>
            </div>
        </div>
        
        <div class="api-docs-content">

        </div>
    </div>
</div>

<style>
.api-docs-container {
    margin-top: 20px;
    background: #fff;
    border: 1px solid #ccd0d4;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}

.api-docs-header {
    padding: 15px 20px;
    border-bottom: 1px solid #ccd0d4;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.api-docs-header p {
    margin: 0;
    font-size: 14px;
}

.api-docs-actions {
    margin-left: 20px;
}

.api-docs-content {
    padding: 20px;
}

.api-docs-content h1 {
    margin-top: 0;
    font-size: 24px;
}

.api-docs-content h2 {
    margin-top: 30px;
    font-size: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.api-docs-content h3 {
    margin-top: 25px;
    font-size: 16px;
}

.api-docs-content pre {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 3px;
    overflow: auto;
}

.api-docs-content code {
    background-color: #f5f5f5;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: Consolas, Monaco, monospace;
}

.api-docs-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.api-docs-content table th,
.api-docs-content table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

.api-docs-content table th {
    background-color: #f5f5f5;
}
</style>

<?php
// Process regenerate action
if (isset($_GET['action']) && $_GET['action'] === 'regenerate' && isset($_GET['_wpnonce']) && wp_verify_nonce($_GET['_wpnonce'], 'regenerate_api_docs')) {
    // Generate API documentation
    $bjt_product_system = BJT_Product_System::get_instance();
    $bjt_product_system->generate_api_docs();
    
    // Redirect to remove the action from the URL
    wp_redirect(admin_url('admin.php?page=bjt-api-docs&regenerated=1'));
    exit;
}

// Show regeneration success message
if (isset($_GET['regenerated']) && $_GET['regenerated'] === '1') {
    ?>
    <script>
    jQuery(document).ready(function($) {
        var notice = $('<div class="notice notice-success is-dismissible"><p><?php _e('API 文档已重新生成。', 'bjt-product-system'); ?></p></div>');
        $('.wrap h1').after(notice);
        
        // Auto dismiss after 3 seconds
        setTimeout(function() {
            notice.fadeOut();
        }, 3000);
    });
    </script>
    <?php
}
?> 