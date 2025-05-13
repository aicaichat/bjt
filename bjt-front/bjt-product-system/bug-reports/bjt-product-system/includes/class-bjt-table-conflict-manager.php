<?php
/**
 * 数据库表冲突管理类
 *
 * @link       https://bjt.com
 * @since      1.0.0
 *
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/includes
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * 数据库表冲突管理类
 *
 * 此类负责检测和处理与其他插件的数据库表冲突。
 *
 * @since      1.0.0
 * @package    BJT_Product_System
 * @subpackage BJT_Product_System/includes
 * @author     BJT Team
 */
class BJT_Table_Conflict_Manager {
    
    /**
     * 可能冲突的插件列表
     *
     * @since    1.0.0
     * @access   private
     * @var      array    $conflict_plugins    可能冲突的插件列表
     */
    private static $conflict_plugins = array(
        'bjt-product-admin/bjt-product-admin.php',
    );
    
    /**
     * 插件使用的表列表
     *
     * @since    1.0.0
     * @access   private
     * @var      array    $tables    插件使用的表列表
     */
    private static $tables = array(
        'wp_bjt_product_lines',
        'wp_bjt_host_models',
        'wp_bjt_accessory_models',
        'wp_bjt_parts',
        'wp_bjt_accessories',
        'wp_bjt_consumables',
        'wp_bjt_spare_parts',
        'wp_bjt_relations',
        'wp_bjt_prices',
        'wp_bjt_inventory',
        'wp_bjt_shapes',
        'wp_bjt_materials',
        'wp_bjt_specifications',
        'wp_bjt_consumable_compatibility'
    );
    
    /**
     * 初始化冲突管理器
     *
     * @since    1.0.0
     */
    public static function init() {
        // 注册激活钩子
        add_action('admin_init', array(__CLASS__, 'check_and_handle_conflicts'));
        
        // 添加管理通知
        add_action('admin_notices', array(__CLASS__, 'display_conflict_notice'));
    }
    
    /**
     * 检查冲突并处理
     *
     * @since    1.0.0
     */
    public static function check_and_handle_conflicts() {
        $conflicts = self::check_conflicts();
        if (!empty($conflicts)) {
            self::handle_conflicts($conflicts);
        }
    }
    
    /**
     * 检查数据库表冲突
     *
     * @since    1.0.0
     * @return   array    冲突的表列表
     */
    public static function check_conflicts() {
        global $wpdb;
        $conflict_tables = array();
        
        // 检查每个表是否已被其他插件创建
        foreach (self::$tables as $table) {
            if (self::table_exists($table) && !get_option('bjt_ps_created_' . $table, false)) {
                $conflict_tables[] = $table;
            }
        }
        
        return $conflict_tables;
    }
    
    /**
     * 检查表是否存在
     *
     * @since    1.0.0
     * @param    string    $table    表名
     * @return   bool      表是否存在
     */
    private static function table_exists($table) {
        global $wpdb;
        $result = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        return $result === $table;
    }
    
    /**
     * 处理冲突
     *
     * @since    1.0.0
     * @param    array    $conflicts    冲突的表列表
     */
    public static function handle_conflicts($conflicts) {
        // 记录冲突
        update_option('bjt_ps_table_conflicts', $conflicts);
        
        // 检查并处理冲突插件
        self::check_conflict_plugins();
    }
    
    /**
     * 检查并处理冲突插件
     *
     * @since    1.0.0
     */
    private static function check_conflict_plugins() {
        // 检查是否有冲突插件被激活
        foreach (self::$conflict_plugins as $plugin) {
            if (is_plugin_active($plugin)) {
                // 记录冲突插件
                update_option('bjt_ps_conflict_plugin', $plugin);
                return;
            }
        }
        
        // 没有找到冲突插件，清除记录
        delete_option('bjt_ps_conflict_plugin');
    }
    
    /**
     * 显示冲突通知
     *
     * @since    1.0.0
     */
    public static function display_conflict_notice() {
        $conflicts = get_option('bjt_ps_table_conflicts', array());
        $conflict_plugin = get_option('bjt_ps_conflict_plugin', '');
        
        if (!empty($conflicts)) {
            ?>
            <div class="error">
                <p>
                    <strong><?php _e('警告: BJT Product System 检测到数据库表冲突', 'bjt-product-system'); ?></strong><br>
                    <?php _e('以下表已经存在于数据库中，可能由另一个插件创建:', 'bjt-product-system'); ?><br>
                    <code><?php echo implode('</code>, <code>', $conflicts); ?></code>
                </p>
                
                <?php if (!empty($conflict_plugin)) : ?>
                <p>
                    <?php printf(__('可能冲突的插件: <strong>%s</strong>', 'bjt-product-system'), esc_html($conflict_plugin)); ?><br>
                    <?php _e('建议: 停用冲突插件以避免数据冲突，或联系管理员合并这两个插件的数据。', 'bjt-product-system'); ?>
                </p>
                <p>
                    <a href="<?php echo wp_nonce_url(admin_url('plugins.php?action=deactivate&plugin=' . urlencode($conflict_plugin)), 'deactivate-plugin_' . $conflict_plugin); ?>" class="button button-primary"><?php _e('停用冲突插件', 'bjt-product-system'); ?></a>
                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bjt-product-system&action=mark_tables'), 'bjt_mark_tables'); ?>" class="button"><?php _e('将表标记为本插件所有', 'bjt-product-system'); ?></a>
                </p>
                <?php else : ?>
                <p>
                    <?php _e('未找到明确的冲突插件。', 'bjt-product-system'); ?><br>
                    <?php _e('建议: 标记这些表为本插件所有，或联系管理员检查数据库。', 'bjt-product-system'); ?>
                </p>
                <p>
                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bjt-product-system&action=mark_tables'), 'bjt_mark_tables'); ?>" class="button button-primary"><?php _e('将表标记为本插件所有', 'bjt-product-system'); ?></a>
                </p>
                <?php endif; ?>
            </div>
            <?php
        }
    }
    
    /**
     * 标记表格为本插件所有
     *
     * @since    1.0.0
     */
    public static function mark_tables_as_ours() {
        foreach (self::$tables as $table) {
            update_option('bjt_ps_created_' . $table, true);
        }
        
        // 清除冲突记录
        delete_option('bjt_ps_table_conflicts');
        
        return true;
    }
    
    /**
     * 处理管理操作
     *
     * @since    1.0.0
     */
    public static function handle_admin_actions() {
        if (isset($_GET['page']) && $_GET['page'] === 'bjt-product-system' && 
            isset($_GET['action']) && $_GET['action'] === 'mark_tables') {
            
            // 验证nonce
            if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'bjt_mark_tables')) {
                wp_die(__('安全检查失败，请重试。', 'bjt-product-system'));
            }
            
            // 标记表格
            if (self::mark_tables_as_ours()) {
                // 设置成功消息
                add_settings_error(
                    'bjt_product_system',
                    'tables_marked',
                    __('数据库表已成功标记为本插件所有。', 'bjt-product-system'),
                    'updated'
                );
            }
            
            // 重定向回插件页面
            wp_redirect(admin_url('admin.php?page=bjt-product-system'));
            exit;
        }
    }
}

// 初始化冲突管理器
add_action('init', array('BJT_Table_Conflict_Manager', 'init'));

// 处理管理操作
add_action('admin_init', array('BJT_Table_Conflict_Manager', 'handle_admin_actions')); 