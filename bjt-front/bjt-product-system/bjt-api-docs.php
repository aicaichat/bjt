<?php
/**
 * Plugin Name: BJT API Documentation
 * Description: Generates OpenAPI documentation for BJT API
 * Version: 1.0.0
 * Author: BJT Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class BJT_API_Docs {
    private static $instance = null;
    
    // Singleton pattern
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Register REST API endpoint for documentation
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    /**
     * Register documentation endpoint
     */
    public function register_routes() {
        register_rest_route('bjt/v1', '/docs/swagger', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_swagger_json'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('bjt/v1', '/docs/ui', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_swagger_ui'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    /**
     * Generate Swagger/OpenAPI specification
     */
    public function get_swagger_json($request) {
        $swagger = [
            'openapi' => '3.0.0',
            'info' => [
                'title' => 'BJT Product Management API',
                'description' => 'API for managing BJT product data',
                'version' => '1.0.0',
            ],
            'servers' => [
                [
                    'url' => rest_url(),
                    'description' => 'WordPress REST API',
                ],
            ],
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type' => 'http',
                        'scheme' => 'bearer',
                        'bearerFormat' => 'JWT',
                    ],
                ],
                'schemas' => $this->get_schemas(),
            ],
            'paths' => $this->get_paths(),
        ];
        
        return rest_ensure_response($swagger);
    }
    
    /**
     * Get OpenAPI schemas
     */
    private function get_schemas() {
        return [
            'ProductLine' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'title_zh' => ['type' => 'string'],
                    'title_en' => ['type' => 'string'],
                    'description_zh' => ['type' => 'string'],
                    'description_en' => ['type' => 'string'],
                    'subitem1_zh' => ['type' => 'string'],
                    'subitem1_en' => ['type' => 'string'],
                    'subitem2_zh' => ['type' => 'string'],
                    'subitem2_en' => ['type' => 'string'],
                    'subitem3_zh' => ['type' => 'string'],
                    'subitem3_en' => ['type' => 'string'],
                    'image_url' => ['type' => 'string'],
                    'code' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'sort_order' => ['type' => 'integer'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'HostModel' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'product_line_id' => ['type' => 'integer'],
                    'model' => ['type' => 'string'],
                    'model_name' => ['type' => 'string'],
                    'name_en' => ['type' => 'string'],
                    'description_zh' => ['type' => 'string'],
                    'description_en' => ['type' => 'string'],
                    'type' => ['type' => 'string'],
                    'image1_url' => ['type' => 'string'],
                    'image2_url' => ['type' => 'string'],
                    'explosion_diagram_pdf' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'sort_order' => ['type' => 'integer'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'AccessoryModel' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'product_line_id' => ['type' => 'integer'],
                    'model' => ['type' => 'string'],
                    'title_zh' => ['type' => 'string'],
                    'title_en' => ['type' => 'string'],
                    'description_zh' => ['type' => 'string'],
                    'description_en' => ['type' => 'string'],
                    'type' => ['type' => 'string'],
                    'image1_url' => ['type' => 'string'],
                    'image2_url' => ['type' => 'string'],
                    'explosion_diagram_pdf' => ['type' => 'string'],
                    'status' => ['type' => 'string'],
                    'sort_order' => ['type' => 'integer'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Part' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'integer'],
                    'product_line_id' => ['type' => 'integer'],
                    'model' => ['type' => 'string'],
                    'voltage' => ['type' => 'string'],
                    'image_url' => ['type' => 'string'],
                    'part_number' => ['type' => 'string'],
                    'name_zh' => ['type' => 'string'],
                    'name_en' => ['type' => 'string'],
                    'brand' => ['type' => 'string'],
                    'spec' => ['type' => 'string'],
                    'spec_imperial' => ['type' => 'string'],
                    'package_size_cm' => ['type' => 'string'],
                    'package_size_inch' => ['type' => 'string'],
                    'net_weight_kg' => ['type' => 'number'],
                    'net_weight_lbs' => ['type' => 'number'],
                    'status' => ['type' => 'string'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'LoginRequest' => [
                'type' => 'object',
                'required' => ['username', 'password'],
                'properties' => [
                    'username' => ['type' => 'string'],
                    'password' => ['type' => 'string', 'format' => 'password'],
                ],
            ],
            'LoginResponse' => [
                'type' => 'object',
                'properties' => [
                    'success' => ['type' => 'boolean'],
                    'data' => [
                        'type' => 'object',
                        'properties' => [
                            'token' => ['type' => 'string'],
                            'user_id' => ['type' => 'integer'],
                            'user_email' => ['type' => 'string'],
                            'user_nicename' => ['type' => 'string'],
                            'user_display_name' => ['type' => 'string'],
                        ],
                    ],
                ],
            ],
            'ErrorResponse' => [
                'type' => 'object',
                'properties' => [
                    'code' => ['type' => 'string'],
                    'message' => ['type' => 'string'],
                    'data' => ['type' => 'object'],
                ],
            ],
        ];
    }
    
    /**
     * Get OpenAPI paths
     */
    private function get_paths() {
        return [
            '/bjt/v1/auth/login' => [
                'post' => [
                    'summary' => 'Login and get JWT token',
                    'tags' => ['Authentication'],
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/LoginRequest'],
                            ],
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'Successful login',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/LoginResponse'],
                                ],
                            ],
                        ],
                        '401' => [
                            'description' => 'Invalid credentials',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            '/bjt/v1/product-lines' => [
                'get' => [
                    'summary' => 'Get all product lines',
                    'tags' => ['Product Lines'],
                    'responses' => [
                        '200' => [
                            'description' => 'A list of product lines',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'array',
                                        'items' => ['$ref' => '#/components/schemas/ProductLine'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'post' => [
                    'summary' => 'Create a new product line',
                    'tags' => ['Product Lines'],
                    'security' => [['bearerAuth' => []]],
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/ProductLine'],
                            ],
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'Created product line',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ProductLine'],
                                ],
                            ],
                        ],
                        '400' => [
                            'description' => 'Invalid input',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            '/bjt/v1/product-lines/{id}' => [
                'get' => [
                    'summary' => 'Get a product line by ID',
                    'tags' => ['Product Lines'],
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'integer'],
                            'description' => 'The product line ID',
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'The product line',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ProductLine'],
                                ],
                            ],
                        ],
                        '404' => [
                            'description' => 'Product line not found',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                    ],
                ],
                'put' => [
                    'summary' => 'Update a product line',
                    'tags' => ['Product Lines'],
                    'security' => [['bearerAuth' => []]],
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'integer'],
                            'description' => 'The product line ID',
                        ],
                    ],
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/ProductLine'],
                            ],
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'Updated product line',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ProductLine'],
                                ],
                            ],
                        ],
                        '400' => [
                            'description' => 'Invalid input',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                        '404' => [
                            'description' => 'Product line not found',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                    ],
                ],
                'delete' => [
                    'summary' => 'Delete a product line',
                    'tags' => ['Product Lines'],
                    'security' => [['bearerAuth' => []]],
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'integer'],
                            'description' => 'The product line ID',
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'Deletion successful',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'success' => ['type' => 'boolean'],
                                            'message' => ['type' => 'string'],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                        '404' => [
                            'description' => 'Product line not found',
                            'content' => [
                                'application/json' => [
                                    'schema' => ['$ref' => '#/components/schemas/ErrorResponse'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            '/bjt/v1/host-models' => [
                'get' => [
                    'summary' => 'Get all host models',
                    'tags' => ['Host Models'],
                    'responses' => [
                        '200' => [
                            'description' => 'A list of host models',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'array',
                                        'items' => ['$ref' => '#/components/schemas/HostModel'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            '/bjt/v1/product-lines/{id}/host-models' => [
                'get' => [
                    'summary' => 'Get host models for a specific product line',
                    'tags' => ['Host Models', 'Product Lines'],
                    'parameters' => [
                        [
                            'name' => 'id',
                            'in' => 'path',
                            'required' => true,
                            'schema' => ['type' => 'integer'],
                            'description' => 'The product line ID',
                        ],
                    ],
                    'responses' => [
                        '200' => [
                            'description' => 'A list of host models for the product line',
                            'content' => [
                                'application/json' => [
                                    'schema' => [
                                        'type' => 'array',
                                        'items' => ['$ref' => '#/components/schemas/HostModel'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            // Add more paths as needed...
        ];
    }
    
    /**
     * Return Swagger UI HTML
     */
    public function get_swagger_ui($request) {
        $swagger_url = rest_url('bjt/v1/docs/swagger');
        
        $html = '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>BJT API Documentation</title>
            <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
            <style>
                body {
                    margin: 0;
                    padding: 0;
                }
                .swagger-ui .topbar {
                    background-color: #2c3e50;
                }
            </style>
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" charset="UTF-8"></script>
            <script>
                window.onload = function() {
                    window.ui = SwaggerUIBundle({
                        url: "' . $swagger_url . '",
                        dom_id: "#swagger-ui",
                        deepLinking: true,
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIBundle.SwaggerUIStandalonePreset
                        ],
                        layout: "BaseLayout",
                        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"]
                    });
                };
            </script>
        </body>
        </html>
        ';
        
        header('Content-Type: text/html');
        echo $html;
        exit;
    }
}

// Initialize the documentation
BJT_API_Docs::get_instance(); 