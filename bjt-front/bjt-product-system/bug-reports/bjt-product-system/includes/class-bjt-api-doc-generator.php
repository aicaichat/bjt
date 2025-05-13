<?php
/**
 * API Documentation Generator
 *
 * @package     BJT_Product_System
 * @subpackage  Includes
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * API Documentation Generator Class
 *
 * Generates API documentation in Markdown format
 */
class BJT_API_Doc_Generator {
    /**
     * The plugin base URL
     *
     * @var string
     */
    private $base_url;

    /**
     * The API namespace
     *
     * @var string
     */
    private $namespace;

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
        $this->namespace = 'bjt/v1';
        $this->base_url = rest_url($this->namespace);
        $this->db = new BJT_Product_System_DB();
    }

    /**
     * Generate documentation
     *
     * @return string The generated markdown documentation
     */
    public function generate() {
        $output = "# BJT Product System API Documentation\n\n";
        $output .= "Base URL: " . $this->base_url . "\n\n";
        $output .= "## Authentication\n\n";
        $output .= "All API requests require authentication using WordPress REST API authentication methods. The recommended method is to use the Application Password feature.\n\n";
        
        // Add sections for each endpoint group
        $output .= $this->generate_product_lines_docs();
        $output .= $this->generate_host_models_docs();
        $output .= $this->generate_accessories_docs();
        $output .= $this->generate_consumables_docs();
        $output .= $this->generate_spare_parts_docs();
        
        return $output;
    }

    /**
     * Save documentation to a file
     *
     * @param string $content The documentation content
     * @param string $file_path The path to save the file to
     * @return bool True on success, false on failure
     */
    public function save_documentation($content, $file_path) {
        $dir = dirname($file_path);
        
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        
        return file_put_contents($file_path, $content);
    }

    /**
     * Generate documentation for Product Lines endpoints
     *
     * @return string The markdown documentation
     */
    private function generate_product_lines_docs() {
        $output = "## Product Lines\n\n";

        // Get All Product Lines
        $output .= "### Get All Product Lines\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/product-lines\n";
        $output .= "```\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| page | integer | Page number |\n";
        $output .= "| per_page | integer | Items per page |\n";
        $output .= "| order | string | Order direction (asc, desc) |\n";
        $output .= "| orderby | string | Order by field (id, title_zh, title_en, code, sort_order) |\n";
        $output .= "| status | string | Filter by status (publish, draft, trash) |\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";
        $output .= "Example Response:\n\n";
        $output .= "```json\n";
        $output .= "[\n";
        $output .= "  {\n";
        $output .= "    \"id\": 1,\n";
        $output .= "    \"title\": \"Bubble Wrap\",\n";
        $output .= "    \"description\": \"Bubble wrap products line\",\n";
        $output .= "    \"subitems\": [\n";
        $output .= "      \"Standard Bubble\",\n";
        $output .= "      \"Anti-static Bubble\",\n";
        $output .= "      \"Kraft Bubble\"\n";
        $output .= "    ],\n";
        $output .= "    \"image_url\": \"https://example.com/images/bubble-wrap.jpg\",\n";
        $output .= "    \"code\": \"BW\",\n";
        $output .= "    \"status\": \"publish\",\n";
        $output .= "    \"sort_order\": 1,\n";
        $output .= "    \"created_at\": \"2023-01-01 00:00:00\",\n";
        $output .= "    \"updated_at\": \"2023-01-01 00:00:00\"\n";
        $output .= "  }\n";
        $output .= "]\n";
        $output .= "```\n\n";

        // Get Product Line
        $output .= "### Get Product Line\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/product-lines/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Product Line ID |\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Create Product Line
        $output .= "### Create Product Line\n\n";
        $output .= "```\n";
        $output .= "POST " . $this->base_url . "/product-lines\n";
        $output .= "```\n\n";
        $output .= "Request Body:\n\n";
        $output .= "| Parameter | Type | Required | Description |\n";
        $output .= "|-----------|------|----------|-------------|\n";
        $output .= "| title_zh | string | Yes | Chinese title |\n";
        $output .= "| title_en | string | Yes | English title |\n";
        $output .= "| description_zh | string | No | Chinese description |\n";
        $output .= "| description_en | string | No | English description |\n";
        $output .= "| subitem1_zh | string | No | Chinese subitem 1 |\n";
        $output .= "| subitem1_en | string | No | English subitem 1 |\n";
        $output .= "| subitem2_zh | string | No | Chinese subitem 2 |\n";
        $output .= "| subitem2_en | string | No | English subitem 2 |\n";
        $output .= "| subitem3_zh | string | No | Chinese subitem 3 |\n";
        $output .= "| subitem3_en | string | No | English subitem 3 |\n";
        $output .= "| image_url | string | No | Image URL |\n";
        $output .= "| code | string | Yes | Product line code |\n";
        $output .= "| status | string | No | Status (publish, draft, trash) |\n";
        $output .= "| sort_order | integer | No | Sort order |\n\n";

        // Update Product Line
        $output .= "### Update Product Line\n\n";
        $output .= "```\n";
        $output .= "PUT " . $this->base_url . "/product-lines/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Product Line ID |\n\n";
        $output .= "Request Body: Same as Create Product Line\n\n";

        // Delete Product Line
        $output .= "### Delete Product Line\n\n";
        $output .= "```\n";
        $output .= "DELETE " . $this->base_url . "/product-lines/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Product Line ID |\n\n";

        // Get Host Models for Product Line
        $output .= "### Get Host Models for Product Line\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/product-lines/{id}/host-models\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Product Line ID |\n\n";
        $output .= "Query Parameters: Same as Get All Host Models\n\n";

        return $output;
    }

    /**
     * Generate documentation for Host Models endpoints
     *
     * @return string The markdown documentation
     */
    private function generate_host_models_docs() {
        $output = "## Host Models\n\n";

        // Get All Host Models
        $output .= "### Get All Host Models\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/host-models\n";
        $output .= "```\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| page | integer | Page number |\n";
        $output .= "| per_page | integer | Items per page |\n";
        $output .= "| order | string | Order direction (asc, desc) |\n";
        $output .= "| orderby | string | Order by field (id, model_number, model_name, name_en, sort_order) |\n";
        $output .= "| status | string | Filter by status (publish, draft, trash) |\n";
        $output .= "| product_line_id | integer | Filter by product line ID |\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Get Host Model
        $output .= "### Get Host Model\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/host-models/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Host Model ID |\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Create Host Model
        $output .= "### Create Host Model\n\n";
        $output .= "```\n";
        $output .= "POST " . $this->base_url . "/host-models\n";
        $output .= "```\n\n";
        $output .= "Request Body:\n\n";
        $output .= "| Parameter | Type | Required | Description |\n";
        $output .= "|-----------|------|----------|-------------|\n";
        $output .= "| product_line_id | integer | Yes | Product Line ID |\n";
        $output .= "| model_number | string | Yes | Model number |\n";
        $output .= "| model_name | string | Yes | Chinese name |\n";
        $output .= "| name_en | string | Yes | English name |\n";
        $output .= "| description_zh | string | No | Chinese description |\n";
        $output .= "| description_en | string | No | English description |\n";
        $output .= "| type | string | No | Host model type |\n";
        $output .= "| image1_url | string | No | Main image URL |\n";
        $output .= "| image2_url | string | No | Secondary image URL |\n";
        $output .= "| explosion_diagram_pdf | string | No | Explosion diagram PDF URL |\n";
        $output .= "| status | string | No | Status (publish, draft, trash) |\n";
        $output .= "| sort_order | integer | No | Sort order |\n\n";

        // Update Host Model
        $output .= "### Update Host Model\n\n";
        $output .= "```\n";
        $output .= "PUT " . $this->base_url . "/host-models/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Host Model ID |\n\n";
        $output .= "Request Body: Same as Create Host Model\n\n";

        // Delete Host Model
        $output .= "### Delete Host Model\n\n";
        $output .= "```\n";
        $output .= "DELETE " . $this->base_url . "/host-models/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Host Model ID |\n\n";

        return $output;
    }

    /**
     * Generate documentation for Accessories endpoints
     *
     * @return string The markdown documentation
     */
    private function generate_accessories_docs() {
        $output = "## Accessories\n\n";

        // Get All Accessories
        $output .= "### Get All Accessories\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/accessories\n";
        $output .= "```\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| page | integer | Page number |\n";
        $output .= "| per_page | integer | Items per page |\n";
        $output .= "| order | string | Order direction (asc, desc) |\n";
        $output .= "| orderby | string | Order by field (id, model, part_number) |\n";
        $output .= "| status | string | Filter by status (publish, draft, trash) |\n";
        $output .= "| product_line_id | integer | Filter by product line ID |\n";
        $output .= "| model | string | Filter by model |\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Get Accessory
        $output .= "### Get Accessory\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/accessories/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Accessory ID |\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Create Accessory
        $output .= "### Create Accessory\n\n";
        $output .= "```\n";
        $output .= "POST " . $this->base_url . "/accessories\n";
        $output .= "```\n\n";
        $output .= "Request Body: Contains all fields corresponding to the accessory database table\n\n";

        // Update Accessory
        $output .= "### Update Accessory\n\n";
        $output .= "```\n";
        $output .= "PUT " . $this->base_url . "/accessories/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Accessory ID |\n\n";
        $output .= "Request Body: Same as Create Accessory\n\n";

        // Delete Accessory
        $output .= "### Delete Accessory\n\n";
        $output .= "```\n";
        $output .= "DELETE " . $this->base_url . "/accessories/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Accessory ID |\n\n";

        return $output;
    }

    /**
     * Generate documentation for Consumables endpoints
     *
     * @return string The markdown documentation
     */
    private function generate_consumables_docs() {
        $output = "## Consumables\n\n";

        // Get All Consumables
        $output .= "### Get All Consumables\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/consumables\n";
        $output .= "```\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| page | integer | Page number |\n";
        $output .= "| per_page | integer | Items per page |\n";
        $output .= "| order | string | Order direction (asc, desc) |\n";
        $output .= "| orderby | string | Order by field (id, model, part_number) |\n";
        $output .= "| status | string | Filter by status (publish, draft, trash) |\n";
        $output .= "| product_line_id | integer | Filter by product line ID |\n";
        $output .= "| model | string | Filter by model |\n";
        $output .= "| material | string | Filter by material |\n";
        $output .= "| bag_type | string | Filter by bag type |\n\n";

        // Get Consumable
        $output .= "### Get Consumable\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/consumables/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Consumable ID |\n\n";

        // Create Consumable
        $output .= "### Create Consumable\n\n";
        $output .= "```\n";
        $output .= "POST " . $this->base_url . "/consumables\n";
        $output .= "```\n\n";
        $output .= "Request Body: Contains all fields corresponding to the consumable database table\n\n";

        // Update Consumable
        $output .= "### Update Consumable\n\n";
        $output .= "```\n";
        $output .= "PUT " . $this->base_url . "/consumables/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Consumable ID |\n\n";
        $output .= "Request Body: Same as Create Consumable\n\n";

        // Delete Consumable
        $output .= "### Delete Consumable\n\n";
        $output .= "```\n";
        $output .= "DELETE " . $this->base_url . "/consumables/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Consumable ID |\n\n";

        return $output;
    }

    /**
     * Generate documentation for Spare Parts endpoints
     *
     * @return string The markdown documentation
     */
    private function generate_spare_parts_docs() {
        $output = "## Spare Parts\n\n";

        // Get All Spare Parts
        $output .= "### Get All Spare Parts\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/spare-parts\n";
        $output .= "```\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| page | integer | Page number |\n";
        $output .= "| per_page | integer | Items per page |\n";
        $output .= "| order | string | Order direction (asc, desc) |\n";
        $output .= "| orderby | string | Order by field (id, part_number, name_zh, name_en) |\n";
        $output .= "| status | string | Filter by status (publish, draft, trash) |\n";
        $output .= "| product_line_id | integer | Filter by product line ID |\n";
        $output .= "| app_model | string | Filter by applicable model |\n";
        $output .= "| is_consumable | boolean | Filter by consumable status |\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Get Spare Part
        $output .= "### Get Spare Part\n\n";
        $output .= "```\n";
        $output .= "GET " . $this->base_url . "/spare-parts/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Spare Part ID |\n\n";
        $output .= "Query Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| lang | string | Language for titles and descriptions (zh, en) |\n\n";

        // Create Spare Part
        $output .= "### Create Spare Part\n\n";
        $output .= "```\n";
        $output .= "POST " . $this->base_url . "/spare-parts\n";
        $output .= "```\n\n";
        $output .= "Request Body: Contains all fields corresponding to the spare parts database table\n\n";

        // Update Spare Part
        $output .= "### Update Spare Part\n\n";
        $output .= "```\n";
        $output .= "PUT " . $this->base_url . "/spare-parts/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Spare Part ID |\n\n";
        $output .= "Request Body: Same as Create Spare Part\n\n";

        // Delete Spare Part
        $output .= "### Delete Spare Part\n\n";
        $output .= "```\n";
        $output .= "DELETE " . $this->base_url . "/spare-parts/{id}\n";
        $output .= "```\n\n";
        $output .= "Path Parameters:\n\n";
        $output .= "| Parameter | Type | Description |\n";
        $output .= "|-----------|------|-------------|\n";
        $output .= "| id | integer | Spare Part ID |\n\n";

        return $output;
    }
} 