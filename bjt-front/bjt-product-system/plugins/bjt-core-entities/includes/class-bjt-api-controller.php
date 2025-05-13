<?php
/**
 * Base REST Controller for BJT entities.
 */
class BJT_API_Controller {
    protected $namespace = 'bjt/v1';
    protected $db;
    protected $table_name; // To be defined in child classes
    protected $resource_name; // To be defined in child classes, used for messages and potentially routes
    protected $rest_base; // Will be set by child controllers or from resource_name

    public function __construct() {
        global $wpdb;
        $this->db = $wpdb;
        // parent::__construct(); // Removed call to WP_REST_Controller constructor

        // Ensure rest_base is set if resource_name is available from child
        if (empty($this->rest_base) && !empty($this->resource_name)) {
            $this->rest_base = $this->resource_name;
        }
    }

    /**
     * Checks if the current user has permission to read (GET) items.
     */
    public function check_read_permission($request) {
        return true; // Simplified for diagnostics
    }

    /**
     * Checks if the current user has permission to write (POST, PUT, DELETE) items.
     */
    public function check_write_permission($request) {
        return true; // Simplified for diagnostics
    }

    /**
     * Helper to return a WP_Error for API responses.
     */
    protected function error_response($message, $error_code, $status_code) {
        return new WP_Error($error_code, $message, array('status' => $status_code));
    }

    /**
     * Provides common pagination arguments for get_items endpoints.
     */
    protected function get_pagination_arg_definitions() {
        return [
            'page' => [
                'description' => 'Current page of the collection.',
                'type' => 'integer',
                'default' => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && (int) $param > 0;
                },
            ],
            'per_page' => [
                'description' => 'Maximum number of items to be returned in result set.',
                'type' => 'integer',
                'default' => 10,
                'sanitize_callback' => 'absint',
                'validate_callback' => function ($param, $request, $key) {
                    return is_numeric($param) && (int) $param > 0;
                },
            ],
            'search' => [
                'description' => 'Limit results to those matching a string.',
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'status' => [
                 'description' => 'Limit results to those matching a specific status (e.g., publish, draft).',
                 'type' => 'string',
                 'sanitize_callback' => 'sanitize_text_field',
            ]
        ];
    }

    /**
     * Base item schema. Child classes should override and extend this.
     */
    public function get_item_schema() {
        return [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => !empty($this->resource_name) ? $this->resource_name : 'item',
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => esc_html__( 'Unique identifier for the item.', 'bjt-core-entities' ),
                    'type'        => 'integer',
                    'context'     => [ 'view', 'edit', 'embed' ],
                    'readonly'    => true,
                ],
            ],
        ];
    }
    
    // Child classes will implement map_request_to_db, format_item_for_response
    // and the main CRUD methods: get_items, get_item, create_item, update_item, delete_item.
}