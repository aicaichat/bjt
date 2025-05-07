<?php
/**
 * BJT Product Admin - Welcome Page Template
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

// 获取当前语言
$current_lang = get_locale();
$is_zh = strpos($current_lang, 'zh') !== false;
?>

<div class="bjt-welcome-page">
    <h1><?php echo esc_html($is_zh ? '欢迎使用BJT产品管理系统' : 'Welcome to BJT Product Management System'); ?></h1>
    
    <div class="bjt-welcome-content">
        <div class="bjt-welcome-section">
            <h2><?php echo esc_html($is_zh ? '快速开始' : 'Quick Start'); ?></h2>
            <div class="bjt-card-grid">
                <div class="bjt-card">
                    <span class="dashicons dashicons-edit"></span>
                    <h3><?php echo esc_html($is_zh ? '编辑产品线' : 'Edit Product Lines'); ?></h3>
                    <p><?php echo esc_html($is_zh ? '管理和更新产品线信息' : 'Manage and update product line information'); ?></p>
                    <a href="?page=bjt-product-lines" class="button button-primary"><?php echo esc_html($is_zh ? '开始编辑' : 'Start Editing'); ?></a>
                </div>
                
                <div class="bjt-card">
                    <span class="dashicons dashicons-admin-generic"></span>
                    <h3><?php echo esc_html($is_zh ? '管理主机' : 'Manage Machines'); ?></h3>
                    <p><?php echo esc_html($is_zh ? '添加和更新主机型号' : 'Add and update machine models'); ?></p>
                    <a href="?page=bjt-machines" class="button button-primary"><?php echo esc_html($is_zh ? '管理主机' : 'Manage Machines'); ?></a>
                </div>
                
                <div class="bjt-card">
                    <span class="dashicons dashicons-admin-tools"></span>
                    <h3><?php echo esc_html($is_zh ? '管理配件' : 'Manage Accessories'); ?></h3>
                    <p><?php echo esc_html($is_zh ? '管理配件和耗材' : 'Manage accessories and consumables'); ?></p>
                    <a href="?page=bjt-accessories" class="button button-primary"><?php echo esc_html($is_zh ? '管理配件' : 'Manage Accessories'); ?></a>
                </div>
            </div>
        </div>
        
        <div class="bjt-welcome-section">
            <h2><?php echo esc_html($is_zh ? '系统状态' : 'System Status'); ?></h2>
            <div class="bjt-status-grid">
                <?php
                global $wpdb;
                
                // 获取各表的数据统计
                $product_lines_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_product_lines");
                $machines_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_host_models");
                $accessories_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_accessory_models");
                $consumables_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bjt_consumables");
                ?>
                
                <div class="bjt-status-item">
                    <h4><?php echo esc_html($is_zh ? '产品线' : 'Product Lines'); ?></h4>
                    <span class="bjt-status-count"><?php echo esc_html($product_lines_count); ?></span>
                </div>
                
                <div class="bjt-status-item">
                    <h4><?php echo esc_html($is_zh ? '主机型号' : 'Machine Models'); ?></h4>
                    <span class="bjt-status-count"><?php echo esc_html($machines_count); ?></span>
                </div>
                
                <div class="bjt-status-item">
                    <h4><?php echo esc_html($is_zh ? '配件' : 'Accessories'); ?></h4>
                    <span class="bjt-status-count"><?php echo esc_html($accessories_count); ?></span>
                </div>
                
                <div class="bjt-status-item">
                    <h4><?php echo esc_html($is_zh ? '耗材' : 'Consumables'); ?></h4>
                    <span class="bjt-status-count"><?php echo esc_html($consumables_count); ?></span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.bjt-welcome-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.bjt-welcome-page h1 {
    font-size: 2.4em;
    margin-bottom: 1em;
    color: #1d2327;
}

.bjt-welcome-section {
    margin-bottom: 40px;
}

.bjt-welcome-section h2 {
    font-size: 1.8em;
    margin-bottom: 1em;
    color: #1d2327;
}

.bjt-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.bjt-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
}

.bjt-card .dashicons {
    font-size: 48px;
    width: 48px;
    height: 48px;
    margin-bottom: 15px;
    color: #2271b1;
}

.bjt-card h3 {
    font-size: 1.4em;
    margin-bottom: 10px;
    color: #1d2327;
}

.bjt-card p {
    margin-bottom: 20px;
    color: #50575e;
}

.bjt-status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.bjt-status-item {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.bjt-status-item h4 {
    font-size: 1.2em;
    margin-bottom: 10px;
    color: #1d2327;
}

.bjt-status-count {
    font-size: 2.4em;
    font-weight: bold;
    color: #2271b1;
}

@media screen and (max-width: 782px) {
    .bjt-card-grid {
        grid-template-columns: 1fr;
    }
    
    .bjt-status-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style> 