<?php
/**
 * Base REST Controller for BJT entities.
 */
class BJT_API_Controller {
    protected $namespace = 'bjt/v1';
    protected $db;
    protected $table_name; // To be defined in child classes
    public $resource_name; // To be defined in child classes, used for messages and potentially routes
    protected $rest_base; // Will be set by child controllers or from resource_name
    protected $schema = null; // Initialize schema property for all controllers

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
    
    /**
     * Get the endpoint arguments for the item schema.
     *
     * @param string $method HTTP method of the request.
     * @return array Endpoint arguments.
     */
    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $schema = $this->get_item_schema();
        $schema_properties = !empty($schema['properties']) ? $schema['properties'] : array();
        $endpoint_args = array();

        foreach ($schema_properties as $field_id => $params) {
            // Arguments specified as required in the schema are required by default.
            if (!isset($params['required'])) {
                $params['required'] = false;
            }

            // Special handling for CREATABLE/EDITABLE methods
            if (WP_REST_Server::CREATABLE === $method || WP_REST_Server::EDITABLE === $method) {
                // Don't make readonly fields required or available for these methods.
                if (isset($params['readonly']) && $params['readonly'] === true) {
                    continue;
                }
            }

            $endpoint_args[$field_id] = array(
                'validate_callback' => 'rest_validate_request_arg',
                'sanitize_callback' => 'rest_sanitize_request_arg',
            );

            // Add any explicitly defined properties
            foreach ($params as $key => $value) {
                if ('description' === $key && empty($value)) {
                    continue;
                }
                $endpoint_args[$field_id][$key] = $value;
            }
        }

        return $endpoint_args;
    }
    
    /**
     * Retrieves the query params for collections.
     * 
     * @return array Collection parameters.
     */
    public function get_collection_params() {
        return array(
            'context' => array(
                'description' => __('Scope under which the request is made; determines fields present in response.'),
                'type' => 'string',
                'default' => 'view',
                'enum' => array('view', 'embed', 'edit'),
                'sanitize_callback' => 'sanitize_key',
                'validate_callback' => 'rest_validate_request_arg',
            ),
            'page' => array(
                'description' => __('Current page of the collection.'),
                'type' => 'integer',
                'default' => 1,
                'minimum' => 1,
                'sanitize_callback' => 'absint',
                'validate_callback' => 'rest_validate_request_arg',
            ),
            'per_page' => array(
                'description' => __('Maximum number of items to be returned in result set.'),
                'type' => 'integer',
                'default' => 10,
                'minimum' => 1,
                'maximum' => 100,
                'sanitize_callback' => 'absint',
                'validate_callback' => 'rest_validate_request_arg',
            ),
            'search' => array(
                'description' => __('Limit results to those matching a string.'),
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => 'rest_validate_request_arg',
            ),
            'orderby' => array(
                'description' => __('Sort collection by parameter.'),
                'type' => 'string',
                'default' => 'id',
                'enum' => array('id', 'created_at', 'updated_at'),
            ),
            'order' => array(
                'description' => __('Order sort attribute ascending or descending.'),
                'type' => 'string',
                'default' => 'desc',
                'enum' => array('asc', 'desc'),
            ),
        );
    }
    
    // Child classes will implement map_request_to_db, format_item_for_response
    // and the main CRUD methods: get_items, get_item, create_item, update_item, delete_item.

    /**
     * Adds the schema from additional fields to a schema array.
     *
     * @param array $schema Schema array.
     * @return array Modified Schema array.
     */
    protected function add_additional_fields_schema($schema) {
        // This is a simplified version of the WP_REST_Controller method
        // If we had additional fields, we would add them to the schema here
        return $schema;
    }

    /**
     * Retrieves the context parameter details.
     *
     * @param array $args Optional. Additional arguments for context parameter. Default empty array.
     * @return array Context parameter details.
     */
    public function get_context_param($args = array()) {
        return array_merge(
            array(
                'description' => __('Scope under which the request is made; determines fields present in response.'),
                'type' => 'string',
                'default' => 'view',
                'enum' => array('view', 'embed', 'edit'),
                'sanitize_callback' => 'sanitize_key',
                'validate_callback' => 'rest_validate_request_arg',
            ),
            $args
        );
    }
}