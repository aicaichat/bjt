<?php
/**
 * INI Configuration Generator
 *
 * @package     BJT_Product_System
 * @subpackage  Includes
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * INI Configuration Generator Class
 *
 * Generates INI configuration file format based on the database structure
 */
class BJT_INI_Generator {
    /**
     * The database instance
     *
     * @var BJT_Product_System_DB
     */
    private $db;

    /**
     * Constructor
     */
    public function __construct() {
        $this->db = new BJT_Product_System_DB();
    }

    /**
     * Generate INI configuration
     *
     * @return string The generated INI configuration
     */
    public function generate() {
        $output = "; BJT Product System API Configuration\n";
        $output .= "; Generated: " . date('Y-m-d H:i:s') . "\n\n";
        
        $output .= "[general]\n";
        $output .= "api_version = 1.0\n";
        $output .= "api_namespace = bjt/v1\n";
        $output .= "api_base_url = " . rest_url('bjt/v1') . "\n\n";
        
        // Add database structure sections
        $output .= $this->generate_table_section('product_lines', 'Product Lines Table', 'wp_bjt_product_lines');
        $output .= $this->generate_table_section('host_models', 'Host Models Table', 'wp_bjt_host_models');
        $output .= $this->generate_table_section('accessory_models', 'Accessory Models Table', 'wp_bjt_accessory_models');
        $output .= $this->generate_table_section('parts', 'Parts Table', 'wp_bjt_parts');
        $output .= $this->generate_table_section('accessories', 'Accessories Table', 'wp_bjt_accessories');
        $output .= $this->generate_table_section('consumables', 'Consumables Table', 'wp_bjt_consumables');
        $output .= $this->generate_table_section('spare_parts', 'Spare Parts Table', 'wp_bjt_spare_parts');
        $output .= $this->generate_table_section('relations', 'Relations Table', 'wp_bjt_relations');
        $output .= $this->generate_table_section('prices', 'Prices Table', 'wp_bjt_prices');
        $output .= $this->generate_table_section('inventory', 'Inventory Table', 'wp_bjt_inventory');
        
        // Add API endpoint sections
        $output .= $this->generate_api_endpoints_section();
        
        return $output;
    }

    /**
     * Save configuration to a file
     *
     * @param string $content The configuration content
     * @param string $file_path The path to save the file to
     * @return bool True on success, false on failure
     */
    public function save_configuration($content, $file_path) {
        $dir = dirname($file_path);
        
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        
        return file_put_contents($file_path, $content);
    }

    /**
     * Generate table section for INI file
     *
     * @param string $section_name The section name
     * @param string $description The description
     * @param string $table_name The table name
     * @return string The generated section
     */
    private function generate_table_section($section_name, $description, $table_name) {
        global $wpdb;
        
        $output = "[$section_name]\n";
        $output .= "; $description\n";
        $output .= "table_name = $table_name\n";
        
        // Get table structure
        $columns = $wpdb->get_results("SHOW COLUMNS FROM $table_name");
        
        if (!empty($columns)) {
            $primary_key = '';
            $unique_keys = array();
            $indexes = array();
            
            // Fields section
            $output .= "\n[$section_name.fields]\n";
            
            foreach ($columns as $column) {
                $field_name = $column->Field;
                $field_type = $column->Type;
                $is_null = $column->Null === 'YES' ? 'true' : 'false';
                $default = $column->Default ? $column->Default : 'NULL';
                $key = $column->Key;
                
                if ($key === 'PRI') {
                    $primary_key = $field_name;
                }
                
                $output .= "$field_name = \"$field_type|$is_null|$default\"\n";
            }
            
            // Get index information
            $indexes_results = $wpdb->get_results("SHOW INDEX FROM $table_name");
            
            if (!empty($indexes_results)) {
                foreach ($indexes_results as $index) {
                    $key_name = $index->Key_name;
                    $column_name = $index->Column_name;
                    $non_unique = $index->Non_unique;
                    
                    if ($key_name === 'PRIMARY') {
                        continue; // Already handled above
                    }
                    
                    if ($non_unique == 0) {
                        // Unique key
                        if (!isset($unique_keys[$key_name])) {
                            $unique_keys[$key_name] = array();
                        }
                        $unique_keys[$key_name][] = $column_name;
                    } else {
                        // Regular index
                        if (!isset($indexes[$key_name])) {
                            $indexes[$key_name] = array();
                        }
                        $indexes[$key_name][] = $column_name;
                    }
                }
            }
            
            // Keys and indexes section
            $output .= "\n[$section_name.keys]\n";
            $output .= "primary_key = \"$primary_key\"\n";
            
            if (!empty($unique_keys)) {
                $output .= "\n[$section_name.unique_keys]\n";
                foreach ($unique_keys as $key_name => $columns) {
                    $output .= "$key_name = \"" . implode(',', $columns) . "\"\n";
                }
            }
            
            if (!empty($indexes)) {
                $output .= "\n[$section_name.indexes]\n";
                foreach ($indexes as $key_name => $columns) {
                    $output .= "$key_name = \"" . implode(',', $columns) . "\"\n";
                }
            }
        }
        
        return $output . "\n";
    }

    /**
     * Generate API endpoints section
     *
     * @return string The generated section
     */
    private function generate_api_endpoints_section() {
        $output = "[api.endpoints]\n";
        $output .= "; API Endpoints Configuration\n\n";
        
        // Product Lines Endpoints
        $output .= "[api.endpoints.product_lines]\n";
        $output .= "get_all = \"/product-lines\"\n";
        $output .= "get_single = \"/product-lines/{id}\"\n";
        $output .= "create = \"/product-lines\"\n";
        $output .= "update = \"/product-lines/{id}\"\n";
        $output .= "delete = \"/product-lines/{id}\"\n";
        $output .= "get_host_models = \"/product-lines/{id}/host-models\"\n\n";
        
        // Host Models Endpoints
        $output .= "[api.endpoints.host_models]\n";
        $output .= "get_all = \"/host-models\"\n";
        $output .= "get_single = \"/host-models/{id}\"\n";
        $output .= "create = \"/host-models\"\n";
        $output .= "update = \"/host-models/{id}\"\n";
        $output .= "delete = \"/host-models/{id}\"\n\n";
        
        // Accessories Endpoints
        $output .= "[api.endpoints.accessories]\n";
        $output .= "get_all = \"/accessories\"\n";
        $output .= "get_single = \"/accessories/{id}\"\n";
        $output .= "create = \"/accessories\"\n";
        $output .= "update = \"/accessories/{id}\"\n";
        $output .= "delete = \"/accessories/{id}\"\n\n";
        
        // Consumables Endpoints
        $output .= "[api.endpoints.consumables]\n";
        $output .= "get_all = \"/consumables\"\n";
        $output .= "get_single = \"/consumables/{id}\"\n";
        $output .= "create = \"/consumables\"\n";
        $output .= "update = \"/consumables/{id}\"\n";
        $output .= "delete = \"/consumables/{id}\"\n\n";
        
        // Spare Parts Endpoints
        $output .= "[api.endpoints.spare_parts]\n";
        $output .= "get_all = \"/spare-parts\"\n";
        $output .= "get_single = \"/spare-parts/{id}\"\n";
        $output .= "create = \"/spare-parts\"\n";
        $output .= "update = \"/spare-parts/{id}\"\n";
        $output .= "delete = \"/spare-parts/{id}\"\n\n";
        
        // Authorization
        $output .= "[api.auth]\n";
        $output .= "auth_method = \"application_passwords\"\n";
        $output .= "auth_capability = \"manage_bjt_products\"\n";
        
        return $output;
    }
} 