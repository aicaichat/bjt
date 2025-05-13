<?php
/**
 * BJT安装类
 *
 * 处理插件的安装、升级和卸载过程
 *
 * @package BJT_Product_Admin
 * @since 1.0.0
 */

// 防止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * BJT安装类
 */
class BJT_Install {
    
    /**
     * BJT_Install单例实例
     *
     * @var BJT_Install
     */
    private static $instance = null;
    
    /**
     * 获取单例实例
     *
     * @return BJT_Install
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 构造函数
     */
    private function __construct() {
        // 私有构造函数，防止直接实例化
    }
    
    /**
     * 安装插件
     */
    public function install() {
        // 创建数据库表
        $this->create_tables();
        
        // 创建必要的选项
        $this->create_options();
        
        // 设置插件已安装标志
        update_option('bjt_product_admin_installed', true);
        update_option('bjt_product_admin_version', BJT_PRODUCT_ADMIN_VERSION);
        
        // 记录安装完成
        error_log('BJT Product Admin 安装完成');
    }
    
    /**
     * 创建数据库表
     */
    private function create_tables() {
        global $wpdb;
        
        // 检查数据库权限
        try {
            // 尝试检查当前用户是否有CREATE权限
            $has_create_permission = false;
            
            // 简单的权限检查
            $test_table_name = $wpdb->prefix . 'bjt_test_table';
            $wpdb->query("CREATE TABLE IF NOT EXISTS {$test_table_name} (id INT PRIMARY KEY)");
            $wpdb->query("DROP TABLE IF EXISTS {$test_table_name}");
            
            $has_create_permission = true;
        } catch (Exception $e) {
            error_log('BJT Product Admin 创建表失败: ' . $e->getMessage());
            $has_create_permission = false;
        }
        
        if (!$has_create_permission) {
            error_log('BJT Product Admin 安装失败: 数据库用户没有足够的权限 (需要CREATE TABLE权限)');
            throw new Exception('Database user does not have sufficient privileges (CREATE TABLE permission required).');
        }
        
        // 继续创建所需的表
        // 这里是简化的示例，实际应用需要创建完整的表结构
        
        // 定义所需的表
        $tables = array(
            'bjt_product_lines' => "
                CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_product_lines (
                    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                    code VARCHAR(50) NOT NULL,
                    name_cn VARCHAR(255) NOT NULL,
                    name_en VARCHAR(255) NOT NULL,
                    description_cn TEXT,
                    description_en TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    PRIMARY KEY (id),
                    UNIQUE KEY code (code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ",
            
            'bjt_machines' => "
                CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bjt_machines (
                    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                    product_line_id BIGINT(20) UNSIGNED NOT NULL,
                    model VARCHAR(50) NOT NULL,
                    name_cn VARCHAR(255) NOT NULL,
                    name_en VARCHAR(255) NOT NULL,
                    description_cn TEXT,
                    description_en TEXT,
                    specs LONGTEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    PRIMARY KEY (id),
                    KEY product_line_id (product_line_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            "
        );
        
        // 当前数据库字符集
        $charset_collate = $wpdb->get_charset_collate();
        
        // 确保dbDelta函数可用
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // 创建每个表
        foreach ($tables as $table_name => $sql) {
            // 替换字符集
            $sql = str_replace('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci', $charset_collate, $sql);
            dbDelta($sql);
        }
    }
    
    /**
     * 创建必要的选项
     */
    private function create_options() {
        // 创建JWT密钥（如果不存在）
        if (!get_option('bjt_jwt_secret')) {
            // 生成随机密钥
            $secret = bin2hex(random_bytes(32));
            update_option('bjt_jwt_secret', $secret);
        }
        
        // 创建其他必要的选项
        update_option('bjt_api_auth_required', true);
        
        // 测试模式
        if (!defined('BJT_API_TEST_MODE')) {
            define('BJT_API_TEST_MODE', false);
        }
    }
    
    /**
     * 升级插件
     */
    public function upgrade($old_version, $new_version) {
        // 这里可以处理版本之间的升级逻辑
        update_option('bjt_product_admin_version', $new_version);
    }
    
    /**
     * 卸载插件
     */
    public function uninstall() {
        // 清理数据库表和选项
    }
} 