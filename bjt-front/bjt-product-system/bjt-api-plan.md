# BJT Product Management System API Implementation

## Overview

We can implement the BJT product management system API by leveraging WordPress's REST API framework. This approach requires minimal custom development while providing a robust API with authentication, error handling, and documentation features.

## Implementation Strategy

### 1. Create a WordPress Plugin

Create a plugin (`bjt-product-api`) that will:
1. Register custom REST API endpoints
2. Handle authentication
3. Interact with the database tables

### 2. API Structure

Following WordPress REST API conventions:
- Base URL: `/wp-json/bjt/v1/`
- Authentication: JWT or WordPress cookie authentication
- Response format: JSON

### 3. Endpoint Implementation

For each entity in the database, we'll create corresponding endpoints:

#### 3.1 Product Lines API
```
GET    /product-lines       # List all product lines
GET    /product-lines/{id}  # Get a specific product line
POST   /product-lines       # Create a product line
PUT    /product-lines/{id}  # Update a product line
DELETE /product-lines/{id}  # Delete a product line
```

#### 3.2 Host Models API
```
GET    /host-models                     # List all host models
GET    /host-models/{id}                # Get a specific host model
GET    /product-lines/{id}/host-models  # Get host models for a product line
POST   /host-models                     # Create a host model
PUT    /host-models/{id}                # Update a host model
DELETE /host-models/{id}                # Delete a host model
```

Similar endpoints will be created for:
- Accessory Models
- Parts
- Accessories
- Consumables
- Spare Parts
- Relations
- Prices
- Inventory
- Shapes
- Materials
- Specifications
- Consumable Compatibility

### 4. Authentication

Implement JWT authentication using a plugin like "JWT Authentication for WP REST API" or develop a custom authentication system.

### 5. Core Plugin Structure

```php
<?php
/**
 * Plugin Name: BJT Product API
 * Description: REST API for BJT Product Management System
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_API {
    private static $instance = null;
    
    // Singleton pattern
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    public function register_routes() {
        // Register all API routes
        $this->register_product_lines_routes();
        $this->register_host_models_routes();
        // Register other routes...
    }
    
    private function register_product_lines_routes() {
        register_rest_route('bjt/v1', '/product-lines', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_product_lines'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_product_line'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
        ]);
        
        register_rest_route('bjt/v1', '/product-lines/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_product_line'],
                'permission_callback' => [$this, 'check_read_permission'],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_product_line'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_product_line'],
                'permission_callback' => [$this, 'check_delete_permission'],
            ],
        ]);
    }
    
    // Example callback methods
    public function get_product_lines($request) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        $products = $wpdb->get_results("SELECT * FROM $table_name WHERE status = 'publish' ORDER BY sort_order ASC");
        
        return rest_ensure_response($products);
    }
    
    public function get_product_line($request) {
        global $wpdb;
        
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'bjt_product_lines';
        $product = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id));
        
        if (!$product) {
            return new WP_Error('not_found', 'Product line not found', ['status' => 404]);
        }
        
        return rest_ensure_response($product);
    }
    
    // Other callback methods...
    
    // Permission callbacks
    public function check_read_permission() {
        return true; // Public read access
    }
    
    public function check_write_permission() {
        return current_user_can('edit_posts'); // Require edit capability
    }
    
    public function check_delete_permission() {
        return current_user_can('delete_posts'); // Require delete capability
    }
}

// Initialize the plugin
BJT_Product_API::get_instance();
```

## 6. Implementation Steps

1. Create the plugin structure
2. Define all endpoint routes
3. Implement CRUD operations for each entity
4. Add authentication
5. Add validation and error handling
6. Test the API endpoints
7. Generate API documentation

## 7. Documentation Generation

We can use Swagger/OpenAPI to generate API documentation:

1. Create a endpoint that generates OpenAPI specification
2. Use a tool like Swagger UI to display interactive documentation
3. Create a `/wp-json/bjt/v1/docs` endpoint that serves the documentation

## 8. Advantages of This Approach

1. Leverages WordPress's built-in REST API framework
2. Inherits WordPress's security features
3. Minimal custom code required
4. Easy to extend with additional functionality
5. Compatible with standard API tools and practices

## 9. Sample Implementation Files

We would need to create these files:
- bjt-product-api.php (main plugin file)
- includes/class-bjt-api-product-lines.php
- includes/class-bjt-api-host-models.php
- (and similar class files for other entities)
- includes/class-bjt-api-auth.php
- includes/class-bjt-api-utils.php 