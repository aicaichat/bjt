<?php
/**
 * BJT Model Data Class
 * 
 * This class handles database interactions for the BJT Product API.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Model_Data {
    /**
     * Database table names
     */
    protected $machines_table;
    protected $accessories_table;
    protected $consumables_table;
    protected $product_lines_table;
    protected $cart_items_table;
    protected $orders_table;
    protected $order_items_table;
    
    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        
        // Define table names
        $this->machines_table = $wpdb->prefix . 'bjt_machines';
        $this->accessories_table = $wpdb->prefix . 'bjt_accessories';
        $this->consumables_table = $wpdb->prefix . 'bjt_consumables';
        $this->product_lines_table = $wpdb->prefix . 'bjt_product_lines';
        $this->cart_items_table = $wpdb->prefix . 'bjt_cart_items';
        $this->orders_table = $wpdb->prefix . 'bjt_orders';
        $this->order_items_table = $wpdb->prefix . 'bjt_order_items';
    }
    
    /**
     * Get machines with filtering and pagination
     * 
     * @param string $region
     * @param string $lang
     * @param int $page
     * @param int $page_size
     * @param string $category
     * @return array
     */
    public function get_machines($region = 'CN', $lang = 'zh', $page = 1, $page_size = 10, $category = null) {
        global $wpdb;
        
        $offset = ($page - 1) * $page_size;
        
        // Start building query
        $query = "SELECT * FROM {$this->machines_table} WHERE 1=1";
        $count_query = "SELECT COUNT(*) FROM {$this->machines_table} WHERE 1=1";
        
        // Add filters
        if ($category) {
            $query .= $wpdb->prepare(" AND category = %s", $category);
            $count_query .= $wpdb->prepare(" AND category = %s", $category);
        }
        
        // Add pagination
        $query .= " LIMIT %d, %d";
        $query = $wpdb->prepare($query, $offset, $page_size);
        
        // Get total count
        $total = $wpdb->get_var($count_query);
        
        // Get data
        $machines = $wpdb->get_results($query, ARRAY_A);
        
        // Process data
        $items = [];
        foreach ($machines as $machine) {
            // Get inventory for this machine
            $inventory_query = $wpdb->prepare(
                "SELECT region, amount FROM {$wpdb->prefix}bjt_inventory WHERE item_id = %s AND item_type = 'machine'",
                $machine['id']
            );
            $inventory = $wpdb->get_results($inventory_query, ARRAY_A);
            
            // Get pricing for this machine
            $pricing_query = $wpdb->prepare(
                "SELECT tier_name, price FROM {$wpdb->prefix}bjt_pricing WHERE item_id = %s AND item_type = 'machine'",
                $machine['id']
            );
            $pricing_data = $wpdb->get_results($pricing_query, ARRAY_A);
            
            // Format pricing
            $prices = [];
            foreach ($pricing_data as $price) {
                $prices[$price['tier_name']] = (float) $price['price'];
            }
            
            // Get specs as JSON and decode
            $specs = json_decode($machine['specs'], true);
            
            // Build the machine data
            $items[] = [
                'id' => $machine['id'],
                'model' => $machine['model'],
                'name' => $lang == 'en' ? $machine['name_en'] : $machine['name'],
                'subtitle' => $lang == 'en' ? $machine['subtitle_en'] : $machine['subtitle'],
                'description' => $lang == 'en' ? $machine['description_en'] : $machine['description'],
                'image_url' => $machine['image_url'],
                'specs' => $specs,
                'inventory' => $inventory,
                'prices' => $prices,
            ];
        }
        
        return [
            'items' => $items,
            'total' => (int) $total,
            'page' => (int) $page,
            'page_size' => (int) $page_size,
            'total_pages' => ceil($total / $page_size),
        ];
    }
    
    /**
     * Get a single machine by ID
     * 
     * @param string $machine_id
     * @param string $region
     * @param string $lang
     * @return array|null
     */
    public function get_machine($machine_id, $region = 'CN', $lang = 'zh') {
        global $wpdb;
        
        // Get machine data
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->machines_table} WHERE id = %s",
            $machine_id
        );
        
        $machine = $wpdb->get_row($query, ARRAY_A);
        
        if (!$machine) {
            return null;
        }
        
        // Get inventory for this machine
        $inventory_query = $wpdb->prepare(
            "SELECT region, amount FROM {$wpdb->prefix}bjt_inventory WHERE item_id = %s AND item_type = 'machine'",
            $machine_id
        );
        $inventory = $wpdb->get_results($inventory_query, ARRAY_A);
        
        // Get pricing for this machine
        $pricing_query = $wpdb->prepare(
            "SELECT tier_name, price FROM {$wpdb->prefix}bjt_pricing WHERE item_id = %s AND item_type = 'machine'",
            $machine_id
        );
        $pricing_data = $wpdb->get_results($pricing_query, ARRAY_A);
        
        // Format pricing
        $prices = [];
        foreach ($pricing_data as $price) {
            $prices[$price['tier_name']] = (float) $price['price'];
        }
        
        // Get images
        $images_query = $wpdb->prepare(
            "SELECT url FROM {$wpdb->prefix}bjt_images WHERE item_id = %s AND item_type = 'machine'",
            $machine_id
        );
        $images = $wpdb->get_col($images_query);
        
        // Get features
        $features_query = $wpdb->prepare(
            "SELECT feature FROM {$wpdb->prefix}bjt_features WHERE item_id = %s AND item_type = 'machine' AND lang = %s",
            $machine_id,
            $lang
        );
        $features = $wpdb->get_col($features_query);
        
        // Get documents
        $documents_query = $wpdb->prepare(
            "SELECT name, url, type FROM {$wpdb->prefix}bjt_documents WHERE item_id = %s AND item_type = 'machine' AND lang = %s",
            $machine_id,
            $lang
        );
        $documents = $wpdb->get_results($documents_query, ARRAY_A);
        
        // Get videos
        $videos_query = $wpdb->prepare(
            "SELECT title, url, thumbnail FROM {$wpdb->prefix}bjt_videos WHERE item_id = %s AND item_type = 'machine' AND lang = %s",
            $machine_id,
            $lang
        );
        $videos = $wpdb->get_results($videos_query, ARRAY_A);
        
        // Decode specs from JSON
        $specs = json_decode($machine['specs'], true);
        
        // Build the complete machine data
        $machine_data = [
            'id' => $machine['id'],
            'model' => $machine['model'],
            'name' => $lang == 'en' ? $machine['name_en'] : $machine['name'],
            'subtitle' => $lang == 'en' ? $machine['subtitle_en'] : $machine['subtitle'],
            'description' => $lang == 'en' ? $machine['description_en'] : $machine['description'],
            'image_url' => $machine['image_url'],
            'images' => $images,
            'specs' => $specs,
            'inventory' => $inventory,
            'prices' => $prices,
            'features' => $features,
            'documents' => $documents,
            'videos' => $videos,
        ];
        
        return $machine_data;
    }
    
    /**
     * Get machine accessories
     * 
     * @param string $machine_id
     * @param int $level
     * @param string $region
     * @param string $lang
     * @return array
     */
    public function get_machine_accessories($machine_id, $level = 1, $region = 'CN', $lang = 'zh') {
        global $wpdb;
        
        // Get accessories for this machine
        $query = $wpdb->prepare(
            "SELECT a.* FROM {$this->accessories_table} a
            JOIN {$wpdb->prefix}bjt_machine_accessories ma ON a.id = ma.accessory_id
            WHERE ma.machine_id = %s AND a.level = %d",
            $machine_id,
            $level
        );
        
        $accessories = $wpdb->get_results($query, ARRAY_A);
        
        $items = [];
        foreach ($accessories as $accessory) {
            // Get parts for this accessory
            $parts_query = $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bjt_parts WHERE accessory_id = %s",
                $accessory['id']
            );
            $parts = $wpdb->get_results($parts_query, ARRAY_A);
            
            $formatted_parts = [];
            foreach ($parts as $part) {
                // Get inventory for this part
                $inventory_query = $wpdb->prepare(
                    "SELECT region, amount FROM {$wpdb->prefix}bjt_inventory WHERE item_id = %s AND item_type = 'part'",
                    $part['id']
                );
                $inventory = $wpdb->get_results($inventory_query, ARRAY_A);
                
                // Get pricing for this part
                $pricing_query = $wpdb->prepare(
                    "SELECT tier_name, price FROM {$wpdb->prefix}bjt_pricing WHERE item_id = %s AND item_type = 'part'",
                    $part['id']
                );
                $pricing_data = $wpdb->get_results($pricing_query, ARRAY_A);
                
                // Format pricing
                $prices = [];
                foreach ($pricing_data as $price) {
                    $prices[$price['tier_name']] = (float) $price['price'];
                }
                
                // Decode specs from JSON
                $specs = json_decode($part['specs'], true);
                
                $formatted_parts[] = [
                    'id' => $part['id'],
                    'part_number' => $part['part_number'],
                    'title' => $lang == 'en' ? $part['title_en'] : $part['title'],
                    'specs' => $specs,
                    'spec' => $part['spec'],
                    'spec_imperial' => $part['spec_imperial'],
                    'prices' => $prices,
                    'inventory' => $inventory,
                ];
            }
            
            $items[] = [
                'id' => $accessory['id'],
                'model' => $accessory['model'],
                'title' => $lang == 'en' ? $accessory['title_en'] : $accessory['title'],
                'level' => (int) $accessory['level'],
                'image_url' => $accessory['image_url'],
                'parts' => $formatted_parts,
            ];
        }
        
        return [
            'items' => $items,
            'total' => count($items),
        ];
    }
    
    /**
     * Get a single accessory by ID
     * 
     * @param string $accessory_id
     * @param string $region
     * @param string $lang
     * @return array|null
     */
    public function get_accessory($accessory_id, $region = 'CN', $lang = 'zh') {
        global $wpdb;
        
        // Get accessory data
        $query = $wpdb->prepare(
            "SELECT * FROM {$this->accessories_table} WHERE id = %s",
            $accessory_id
        );
        
        $accessory = $wpdb->get_row($query, ARRAY_A);
        
        if (!$accessory) {
            return null;
        }
        
        // Get parts for this accessory
        $parts_query = $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}bjt_parts WHERE accessory_id = %s",
            $accessory_id
        );
        $parts = $wpdb->get_results($parts_query, ARRAY_A);
        
        $formatted_parts = [];
        foreach ($parts as $part) {
            // Get inventory for this part
            $inventory_query = $wpdb->prepare(
                "SELECT region, amount FROM {$wpdb->prefix}bjt_inventory WHERE item_id = %s AND item_type = 'part'",
                $part['id']
            );
            $inventory = $wpdb->get_results($inventory_query, ARRAY_A);
            
            // Get pricing for this part
            $pricing_query = $wpdb->prepare(
                "SELECT tier_name, price FROM {$wpdb->prefix}bjt_pricing WHERE item_id = %s AND item_type = 'part'",
                $part['id']
            );
            $pricing_data = $wpdb->get_results($pricing_query, ARRAY_A);
            
            // Format pricing
            $prices = [];
            foreach ($pricing_data as $price) {
                $prices[$price['tier_name']] = (float) $price['price'];
            }
            
            // Decode specs from JSON
            $specs = json_decode($part['specs'], true);
            
            $formatted_parts[] = [
                'id' => $part['id'],
                'part_number' => $part['part_number'],
                'title' => $lang == 'en' ? $part['title_en'] : $part['title'],
                'specs' => $specs,
                'spec' => $part['spec'],
                'spec_imperial' => $part['spec_imperial'],
                'prices' => $prices,
                'inventory' => $inventory,
            ];
        }
        
        // Get compatible machines
        $machines_query = $wpdb->prepare(
            "SELECT m.id, m.name, m.name_en FROM {$this->machines_table} m
            JOIN {$wpdb->prefix}bjt_machine_accessories ma ON m.id = ma.machine_id
            WHERE ma.accessory_id = %s",
            $accessory_id
        );
        $machines = $wpdb->get_results($machines_query, ARRAY_A);
        
        $compatible_machines = [];
        foreach ($machines as $machine) {
            $compatible_machines[] = [
                'id' => $machine['id'],
                'name' => $lang == 'en' ? $machine['name_en'] : $machine['name'],
            ];
        }
        
        return [
            'id' => $accessory['id'],
            'model' => $accessory['model'],
            'title' => $lang == 'en' ? $accessory['title_en'] : $accessory['title'],
            'level' => (int) $accessory['level'],
            'image_url' => $accessory['image_url'],
            'description' => $lang == 'en' ? $accessory['description_en'] : $accessory['description'],
            'parts' => $formatted_parts,
            'compatible_machines' => $compatible_machines,
        ];
    }
    
    /**
     * Create required tables on plugin activation
     * 
     * @return void
     */
    public static function create_tables() {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Create machine table
        $machines_table = $wpdb->prefix . 'bjt_machines';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $machines_table (
            id VARCHAR(50) NOT NULL,
            model VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            name_en VARCHAR(255) NOT NULL,
            subtitle VARCHAR(255) NOT NULL,
            subtitle_en VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            description_en TEXT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            specs TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create accessories table
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        
        $sql = "CREATE TABLE $accessories_table (
            id VARCHAR(50) NOT NULL,
            model VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_en VARCHAR(255) NOT NULL,
            level INT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            description_en TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create parts table
        $parts_table = $wpdb->prefix . 'bjt_parts';
        
        $sql = "CREATE TABLE $parts_table (
            id VARCHAR(50) NOT NULL,
            accessory_id VARCHAR(50) NOT NULL,
            part_number VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_en VARCHAR(255) NOT NULL,
            specs TEXT NOT NULL,
            spec VARCHAR(255) NOT NULL,
            spec_imperial VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY  (id),
            KEY accessory_id (accessory_id)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create machine_accessories table
        $machine_accessories_table = $wpdb->prefix . 'bjt_machine_accessories';
        
        $sql = "CREATE TABLE $machine_accessories_table (
            id INT NOT NULL AUTO_INCREMENT,
            machine_id VARCHAR(50) NOT NULL,
            accessory_id VARCHAR(50) NOT NULL,
            PRIMARY KEY  (id),
            KEY machine_id (machine_id),
            KEY accessory_id (accessory_id)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create inventory table
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
        
        $sql = "CREATE TABLE $inventory_table (
            id INT NOT NULL AUTO_INCREMENT,
            item_id VARCHAR(50) NOT NULL,
            item_type ENUM('machine', 'accessory', 'part', 'consumable') NOT NULL,
            region VARCHAR(10) NOT NULL,
            amount INT NOT NULL,
            PRIMARY KEY  (id),
            KEY item_id (item_id),
            KEY item_type (item_type),
            KEY region (region)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create pricing table
        $pricing_table = $wpdb->prefix . 'bjt_pricing';
        
        $sql = "CREATE TABLE $pricing_table (
            id INT NOT NULL AUTO_INCREMENT,
            item_id VARCHAR(50) NOT NULL,
            item_type ENUM('machine', 'accessory', 'part', 'consumable') NOT NULL,
            tier_name VARCHAR(50) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            PRIMARY KEY  (id),
            KEY item_id (item_id),
            KEY item_type (item_type)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create additional tables for images, documents, videos, features, etc.
        
        // Create cart_items table
        $cart_items_table = $wpdb->prefix . 'bjt_cart_items';
        
        $sql = "CREATE TABLE $cart_items_table (
            id INT NOT NULL AUTO_INCREMENT,
            user_id BIGINT NOT NULL,
            item_id VARCHAR(50) NOT NULL,
            item_type ENUM('machine', 'accessory', 'part', 'consumable') NOT NULL,
            quantity INT NOT NULL,
            added_at DATETIME NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create orders table
        $orders_table = $wpdb->prefix . 'bjt_orders';
        
        $sql = "CREATE TABLE $orders_table (
            id INT NOT NULL AUTO_INCREMENT,
            user_id BIGINT NOT NULL,
            order_number VARCHAR(50) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) NOT NULL,
            shipping_address TEXT NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY order_number (order_number)
        ) $charset_collate;";
        
        dbDelta($sql);
        
        // Create order_items table
        $order_items_table = $wpdb->prefix . 'bjt_order_items';
        
        $sql = "CREATE TABLE $order_items_table (
            id INT NOT NULL AUTO_INCREMENT,
            order_id INT NOT NULL,
            item_id VARCHAR(50) NOT NULL,
            item_type ENUM('machine', 'accessory', 'part', 'consumable') NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            PRIMARY KEY  (id),
            KEY order_id (order_id)
        ) $charset_collate;";
        
        dbDelta($sql);
    }
} 