<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get current language
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
<div class="header">
    <img src="<?php echo esc_url(plugins_url('assets/images/logo-1.webp', dirname(dirname(__FILE__)))); ?>" alt="BJT Logo" class="logo">
    <div style="margin-left: auto; display: flex; gap: 20px; align-items: center;">
        <a href="#" style="color: #1a3c70; text-decoration: none; font-size: 14px; font-weight: 500;"><?php esc_html_e('Documentation', 'bjt-product-admin'); ?></a>
        <a href="#" style="color: #1a3c70; text-decoration: none; font-size: 14px; font-weight: 500;"><?php esc_html_e('Support', 'bjt-product-admin'); ?></a>
        <div style="display: flex; align-items: center; border: 1px solid #e1e5eb; border-radius: 4px; padding: 5px 10px;">
            <span style="font-size: 13px; margin-right: 5px;"><?php echo esc_html($lang_options[$current_lang] ?? 'English'); ?></span>
            <span style="font-size: 10px;">▼</span>
        </div>
    </div>
</div>

<div class="container">
    <div class="sidebar">
        <a href="#" class="menu-item">
            <span class="menu-icon">🏠</span>
            <span><?php esc_html_e('Home', 'bjt-product-admin'); ?></span>
        </a>
        <a href="#" class="menu-item expandable active">
            <span class="menu-icon">📄</span>
            <span><?php esc_html_e('Page Editing', 'bjt-product-admin'); ?></span>
        </a>
        <div class="submenu active">
            <?php
            $product_lines = get_posts(array(
                'post_type' => 'product_line',
                'posts_per_page' => -1,
                'orderby' => 'menu_order',
                'order' => 'ASC'
            ));

            foreach ($product_lines as $index => $line) {
                $active = ($index === 0) ? 'active' : '';
                echo '<a href="#" class="menu-item ' . esc_attr($active) . '" data-product-line="' . esc_attr($line->ID) . '">' . 
                     esc_html(get_post_meta($line->ID, 'title_' . $current_lang, true)) . '</a>';
            }
            ?>
        </div>
        <a href="#" class="menu-item expandable">
            <span class="menu-icon">🛋️</span>
            <span><?php esc_html_e('Air Cushion', 'bjt-product-admin'); ?></span>
        </a>
        <div class="submenu">
            <a href="#" class="menu-item"><?php esc_html_e('Host', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Accessories', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Consumables', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Spare Parts', 'bjt-product-admin'); ?></a>
        </div>
        <a href="#" class="menu-item expandable">
            <span class="menu-icon">📃</span>
            <span><?php esc_html_e('Paper Machine', 'bjt-product-admin'); ?></span>
        </a>
        <div class="submenu">
            <a href="#" class="menu-item"><?php esc_html_e('Host', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Accessories', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Consumables', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Spare Parts', 'bjt-product-admin'); ?></a>
        </div>
        <a href="#" class="menu-item expandable">
            <span class="menu-icon">🧵</span>
            <span><?php esc_html_e('Tape Machine', 'bjt-product-admin'); ?></span>
        </a>
        <div class="submenu">
            <a href="#" class="menu-item"><?php esc_html_e('Host', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Accessories', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Consumables', 'bjt-product-admin'); ?></a>
            <a href="#" class="menu-item"><?php esc_html_e('Spare Parts', 'bjt-product-admin'); ?></a>
        </div>
        <a href="#" class="menu-item expandable">
            <span class="menu-icon">💼</span>
            <span><?php esc_html_e('Air Column Bag', 'bjt-product-admin'); ?></span>
        </a>
        <div class="submenu">
            <a href="#" class="menu-item"><?php esc_html_e('Consumables', 'bjt-product-admin'); ?></a>
        </div>
        <a href="#" class="menu-item">
            <span class="menu-icon">👤</span>
            <span><?php esc_html_e('User Management', 'bjt-product-admin'); ?></span>
        </a>
        <a href="#" class="menu-item">
            <span class="menu-icon">⚙️</span>
            <span><?php esc_html_e('System Settings', 'bjt-product-admin'); ?></span>
        </a>
    </div>

    <div class="main-content">
        <h2><?php esc_html_e('Product Line', 'bjt-product-admin'); ?></h2>
        <div class="notice">
            <i style="margin-right: 8px; color: #ff6b6b;">ℹ️</i> <?php esc_html_e('Except for images, multilingual parts are similar and will not be repeated.', 'bjt-product-admin'); ?>
        </div>
        <form id="productForm">
            <div class="form-group">
                <label><?php esc_html_e('Title:', 'bjt-product-admin'); ?></label>
                <div class="language-tabs">
                    <div class="language-tab active" data-lang="cn"><?php esc_html_e('Chinese', 'bjt-product-admin'); ?></div>
                    <div class="language-tab" data-lang="en"><?php esc_html_e('English', 'bjt-product-admin'); ?></div>
                </div>
                <div class="language-content active" data-lang="cn">
                    <input type="text" class="form-control" name="title_cn" value="">
                </div>
                <div class="language-content" data-lang="en">
                    <input type="text" class="form-control" name="title_en" value="">
                </div>
            </div>

            <div class="form-group">
                <label><?php esc_html_e('Description:', 'bjt-product-admin'); ?></label>
                <div class="language-tabs">
                    <div class="language-tab active" data-lang="cn"><?php esc_html_e('Chinese', 'bjt-product-admin'); ?></div>
                    <div class="language-tab" data-lang="en"><?php esc_html_e('English', 'bjt-product-admin'); ?></div>
                </div>
                <div class="language-content active" data-lang="cn">
                    <div style="border: 1px solid #ced4da; border-radius: 4px; overflow: hidden;">
                        <div style="padding: 8px 12px; background-color: #f8f9fa; border-bottom: 1px solid #ced4da; display: flex; gap: 10px;">
                            <button type="button" style="background: none; border: none; font-weight: bold; cursor: pointer;">B</button>
                            <button type="button" style="background: none; border: none; font-style: italic; cursor: pointer;">I</button>
                            <button type="button" style="background: none; border: none; text-decoration: underline; cursor: pointer;">U</button>
                            <span style="border-right: 1px solid #ced4da; margin: 0 5px;"></span>
                            <button type="button" style="background: none; border: none; cursor: pointer;">⌨️</button>
                        </div>
                        <textarea class="form-control" style="border: none; border-radius: 0;" name="description_cn"></textarea>
                    </div>
                </div>
                <div class="language-content" data-lang="en">
                    <div style="border: 1px solid #ced4da; border-radius: 4px; overflow: hidden;">
                        <div style="padding: 8px 12px; background-color: #f8f9fa; border-bottom: 1px solid #ced4da; display: flex; gap: 10px;">
                            <button type="button" style="background: none; border: none; font-weight: bold; cursor: pointer;">B</button>
                            <button type="button" style="background: none; border: none; font-style: italic; cursor: pointer;">I</button>
                            <button type="button" style="background: none; border: none; text-decoration: underline; cursor: pointer;">U</button>
                            <span style="border-right: 1px solid #ced4da; margin: 0 5px;"></span>
                            <button type="button" style="background: none; border: none; cursor: pointer;">⌨️</button>
                        </div>
                        <textarea class="form-control" style="border: none; border-radius: 0;" name="description_en"></textarea>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label><?php esc_html_e('Subitem 1:', 'bjt-product-admin'); ?></label>
                <div class="language-tabs">
                    <div class="language-tab active" data-lang="cn"><?php esc_html_e('Chinese', 'bjt-product-admin'); ?></div>
                    <div class="language-tab" data-lang="en"><?php esc_html_e('English', 'bjt-product-admin'); ?></div>
                </div>
                <div class="language-content active" data-lang="cn">
                    <input type="text" class="form-control" name="subitem1_cn" value="">
                </div>
                <div class="language-content" data-lang="en">
                    <input type="text" class="form-control" name="subitem1_en" value="">
                </div>
            </div>

            <div class="form-group">
                <label><?php esc_html_e('Subitem 2:', 'bjt-product-admin'); ?></label>
                <div class="language-tabs">
                    <div class="language-tab active" data-lang="cn"><?php esc_html_e('Chinese', 'bjt-product-admin'); ?></div>
                    <div class="language-tab" data-lang="en"><?php esc_html_e('English', 'bjt-product-admin'); ?></div>
                </div>
                <div class="language-content active" data-lang="cn">
                    <input type="text" class="form-control" name="subitem2_cn" value="">
                </div>
                <div class="language-content" data-lang="en">
                    <input type="text" class="form-control" name="subitem2_en" value="">
                </div>
            </div>

            <div class="form-group">
                <label><?php esc_html_e('Subitem 3:', 'bjt-product-admin'); ?></label>
                <div class="language-tabs">
                    <div class="language-tab active" data-lang="cn"><?php esc_html_e('Chinese', 'bjt-product-admin'); ?></div>
                    <div class="language-tab" data-lang="en"><?php esc_html_e('English', 'bjt-product-admin'); ?></div>
                </div>
                <div class="language-content active" data-lang="cn">
                    <input type="text" class="form-control" name="subitem3_cn" value="">
                </div>
                <div class="language-content" data-lang="en">
                    <input type="text" class="form-control" name="subitem3_en" value="">
                </div>
            </div>

            <div class="form-group">
                <label><?php esc_html_e('Image:', 'bjt-product-admin'); ?></label>
                <div class="image-upload-area" id="dropArea">
                    <img id="previewImage" src="<?php echo esc_url(plugins_url('assets/images/placeholder.png', dirname(dirname(__FILE__)))); ?>" alt="placeholder" />
                    <div style="margin-top: 15px; color: #6c757d; font-size: 14px;">
                        <?php esc_html_e('Supports .jpg, .png, .gif format, maximum 5MB', 'bjt-product-admin'); ?>
                    </div>
                    <input type="file" id="fileInput" style="display: none;" accept=".jpg, .jpeg, .png, .gif">
                    <div class="progress-container" id="progressContainer">
                        <div class="progress-bar" id="progressBar"></div>
                    </div>
                </div>
                <div class="form-row">
                    <button type="button" class="btn" style="background-color: #6c757d;" id="selectFileBtn"><?php esc_html_e('Select', 'bjt-product-admin'); ?></button>
                    <button type="button" class="btn" id="uploadBtn"><?php esc_html_e('Upload', 'bjt-product-admin'); ?></button>
                </div>
            </div>

            <div style="margin-top: 30px; border-top: 1px solid #e1e5eb; padding-top: 20px; display: flex; justify-content: flex-end; gap: 15px;">
                <button type="button" class="btn" style="background-color: #6c757d;" id="cancelBtn"><?php esc_html_e('Cancel', 'bjt-product-admin'); ?></button>
                <button type="button" class="btn" id="saveBtn"><?php esc_html_e('Save', 'bjt-product-admin'); ?></button>
            </div>
        </form>
    </div>
</div>

<!-- Toast notification -->
<div class="toast" id="toast">
    <span id="toastMessage"></span>
</div>

<?php
// Enqueue necessary scripts and styles
wp_enqueue_style('bjt-product-admin-style');
wp_enqueue_script('bjt-product-admin-script');

// Localize script with necessary data
wp_localize_script('bjt-product-admin-script', 'bjtProductAdmin', array(
    'ajaxurl' => admin_url('admin-ajax.php'),
    'nonce' => wp_create_nonce('bjt_product_admin_nonce'),
    'currentLang' => $current_lang,
    'langOptions' => $lang_options
));
?> 