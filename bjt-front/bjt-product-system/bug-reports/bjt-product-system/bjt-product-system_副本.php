<?php
/**
 * Plugin Name: BJT Product System
 * Plugin URI: https://bjt.com/plugins/bjt-product-system
 * Description: A comprehensive product management system for BJT products, with database setup and API integration
 * Version: 1.0.0
 * Author: BJT Team
 * Author URI: https://bjt.com
 * Text Domain: bjt-product-system
 * Domain Path: /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

define('BJT_PRODUCT_SYSTEM_VERSION', '1.0.0');
define('BJT_PRODUCT_SYSTEM_PATH', plugin_dir_path(__FILE__));
define('BJT_PRODUCT_SYSTEM_URL', plugin_dir_url(__FILE__));
define('BJT_PRODUCT_SYSTEM_BASENAME', plugin_basename(__FILE__));

// Main plugin class
class BJT_Product_System {
    
    // Singleton instance
    private static $instance = null;
    
    // Get singleton instance
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // Constructor
    private function __construct() {
        // Plugin activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Load plugin components
        $this->load_dependencies();
        
        // Initialize the plugin
        add_action('plugins_loaded', array($this, 'init'));
        
        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    // Load dependencies
    private function load_dependencies() {
        // Include admin pages
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/class-bjt-product-system-admin.php';
        
        // Include API classes
        require_once BJT_PRODUCT_SYSTEM_PATH . 'api/class-bjt-product-system-api.php';
        
        // Include database functions
        require_once BJT_PRODUCT_SYSTEM_PATH . 'includes/class-bjt-product-system-db.php';
        
        // Include API documentation generator
        require_once BJT_PRODUCT_SYSTEM_PATH . 'includes/class-bjt-api-doc-generator.php';
        
        // Include INI configuration generator
        require_once BJT_PRODUCT_SYSTEM_PATH . 'includes/class-bjt-ini-generator.php';
        
        // Include table conflict manager
        require_once BJT_PRODUCT_SYSTEM_PATH . 'includes/class-bjt-table-conflict-manager.php';
    }
    
    // Initialize the plugin
    public function init() {
        // Initialize text domain for internationalization
        load_plugin_textdomain(
            'bjt-product-system',
            false,
            dirname(dirname(plugin_basename(__FILE__))) . '/languages/'
        );
        
        // Initialize REST API
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        
        // Initialize admin
        if (is_admin()) {
            $admin = new BJT_Product_System_Admin();
        }
    }
    
    // Plugin activation
    public function activate() {
        // Setup database tables using SQL from init.sql
        $this->setup_database();
        
        // Import sample data
        $this->import_sample_data();
        
        // Generate API documentation
        $this->generate_api_docs();
        
        // Set up capabilities
        $this->setup_capabilities();
        
        // Check for table conflicts
        if (class_exists('BJT_Table_Conflict_Manager')) {
            $conflicts = BJT_Table_Conflict_Manager::check_conflicts();
            if (!empty($conflicts)) {
                BJT_Table_Conflict_Manager::handle_conflicts($conflicts);
            } else {
                // If no conflicts, mark tables as ours
                BJT_Table_Conflict_Manager::mark_tables_as_ours();
            }
        }
        
        // Flush rewrite rules for custom post types and endpoints
        flush_rewrite_rules();
    }
    
    // Plugin deactivation
    public function deactivate() {
        // Remove capabilities
        $this->remove_capabilities();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    // Setup database tables
    private function setup_database() {
        global $wpdb;
        
        // Load dbDelta function
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Get the SQL from the init.sql file
        $sql_file_path = BJT_PRODUCT_SYSTEM_PATH . 'sql/init.sql';
        
        if (file_exists($sql_file_path)) {
            $sql = file_get_contents($sql_file_path);
            
            // Split the SQL file into individual statements
            $sql_statements = explode(';', $sql);
            
            foreach ($sql_statements as $statement) {
                $statement = trim($statement);
                
                if (!empty($statement)) {
                    // Execute each statement
                    $wpdb->query($statement);
                }
            }
        } else {
            error_log('BJT Product System: SQL file not found at ' . $sql_file_path);
        }
    }
    
    // Import sample data
    private function import_sample_data() {
        global $wpdb;
        
        // Check if sample data has already been imported
        $sample_data_imported = get_option('bjt_sample_data_imported', false);
        
        if ($sample_data_imported) {
            return; // Sample data already imported
        }
        
        // Get the SQL from the sample-data.sql file
        $sql_file_path = BJT_PRODUCT_SYSTEM_PATH . 'sql/sample-data.sql';
        
        if (file_exists($sql_file_path)) {
            $sql = file_get_contents($sql_file_path);
            
            // Split the SQL file into individual statements
            $sql_statements = explode(';', $sql);
            
            foreach ($sql_statements as $statement) {
                $statement = trim($statement);
                
                if (!empty($statement)) {
                    // Execute each statement
                    $wpdb->query($statement);
                }
            }
            
            // Mark sample data as imported
            update_option('bjt_sample_data_imported', true);
        } else {
            error_log('BJT Product System: Sample data SQL file not found at ' . $sql_file_path);
        }
    }
    
    // Generate API documentation
    private function generate_api_docs() {
        // Create directories if they don't exist
        $docs_dir = BJT_PRODUCT_SYSTEM_PATH . 'docs';
        if (!file_exists($docs_dir)) {
            wp_mkdir_p($docs_dir);
        }
        
        // Generate Markdown documentation
        $doc_generator = new BJT_API_Doc_Generator();
        $md_content = $doc_generator->generate();
        $doc_generator->save_documentation($md_content, $docs_dir . '/API-DOCUMENTATION.md');
        
        // Generate INI configuration
        $ini_generator = new BJT_INI_Generator();
        $ini_content = $ini_generator->generate();
        $ini_generator->save_configuration($ini_content, $docs_dir . '/api-config.ini');
        
        return true;
    }
    
    // Setup capabilities
    private function setup_capabilities() {
        // Get the administrator role
        $role = get_role('administrator');
        
        // Add custom capabilities
        $role->add_cap('manage_bjt_products');
        $role->add_cap('edit_bjt_product_lines');
        $role->add_cap('edit_bjt_host_models');
        $role->add_cap('edit_bjt_accessories');
        $role->add_cap('edit_bjt_consumables');
        $role->add_cap('edit_bjt_spare_parts');
    }
    
    // Remove capabilities
    private function remove_capabilities() {
        // Remove custom capabilities from administrator role
        $admin = get_role('administrator');
        
        if ($admin) {
            $admin->remove_cap('manage_bjt_products');
            $admin->remove_cap('edit_bjt_product_lines');
            $admin->remove_cap('edit_bjt_host_models');
            $admin->remove_cap('edit_bjt_accessories');
            $admin->remove_cap('edit_bjt_consumables');
            $admin->remove_cap('edit_bjt_spare_parts');
        }
    }
    
    // Add admin menu
    public function add_admin_menu() {
        // Add main menu
        add_menu_page(
            __('BJT 产品系统', 'bjt-product-system'),
            __('BJT 产品系统', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-product-system',
            array($this, 'display_main_page'),
            'dashicons-cart',
            30
        );
        
        // Add submenu pages
        add_submenu_page(
            'bjt-product-system',
            __('产品线管理', 'bjt-product-system'),
            __('产品线', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-product-lines',
            array($this, 'display_product_lines_page')
        );
        
        add_submenu_page(
            'bjt-product-system',
            __('主机型号管理', 'bjt-product-system'),
            __('主机型号', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-host-models',
            array($this, 'display_host_models_page')
        );
        
        add_submenu_page(
            'bjt-product-system',
            __('配件管理', 'bjt-product-system'),
            __('配件', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-accessories',
            array($this, 'display_accessories_page')
        );
        
        add_submenu_page(
            'bjt-product-system',
            __('耗材管理', 'bjt-product-system'),
            __('耗材', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-consumables',
            array($this, 'display_consumables_page')
        );
        
        add_submenu_page(
            'bjt-product-system',
            __('备件管理', 'bjt-product-system'),
            __('备件', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-spare-parts',
            array($this, 'display_spare_parts_page')
        );
        
        add_submenu_page(
            'bjt-product-system',
            __('API 文档', 'bjt-product-system'),
            __('API 文档', 'bjt-product-system'),
            'manage_bjt_products',
            'bjt-api-docs',
            array($this, 'display_api_docs_page')
        );
    }
    
    // Display main admin page
    public function display_main_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/main-page.php';
    }
    
    // Display product lines page
    public function display_product_lines_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/product-lines-page.php';
    }
    
    // Display host models page
    public function display_host_models_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/host-models-page.php';
    }
    
    // Display accessories page
    public function display_accessories_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/accessories-page.php';
    }
    
    // Display consumables page
    public function display_consumables_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/consumables-page.php';
    }
    
    // Display spare parts page
    public function display_spare_parts_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/spare-parts-page.php';
    }
    
    // Display API docs page
    public function display_api_docs_page() {
        require_once BJT_PRODUCT_SYSTEM_PATH . 'admin/partials/api-docs-page.php';
    }
    
    // Register REST API endpoints
    public function register_api_endpoints() {
        error_log('BJT Product System: Registering API endpoints');
        $api = new BJT_Product_System_API();
        $api->register_routes();
        error_log('BJT Product System: API endpoints registered');
    }
}

// Initialize the plugin
function bjt_product_system() {
    return BJT_Product_System::get_instance();
}

// Start the plugin
bjt_product_system(); 