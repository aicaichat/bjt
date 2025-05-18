<?php
/**
 * Accessory Model Controller
 */
class BJT_Accessory_Model_Controller extends BJT_API_Controller {

    public $resource_name = 'accessory-models';
    protected $table_name;

    // Columns in wp_bjt_accessory_models that can be filled via API
    protected $fillable_fields = [
        'product_line_id', 
        'model', // Accessory model code
        'title_zh', 
        'title_en',
        'description_zh', 
        'description_en', 
        'type', // Accessory type
        'image1_url', 
        'image2_url', 
        'explosion_diagram_pdf',
        'status', 
        'sort_order',
        'level' // Accessory level
    ];

    // API request fields required for creating an accessory model
    protected $required_api_fields_for_create = [
        'product_line_id', 
        'code', // API field for 'model'
        'title_zh', 
        'title_en'
    ];

    public function __construct() {
        parent::__construct();
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_accessory_models';
        // error_log("BJT_Accessory_Model_Controller initialized. Table: " . $this->table_name);
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_pagination_arg_definitions(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema(),
            ]
        ]);
        
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'required' => true, 
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_item_schema()
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => [
                    'id' => [
                        'required' => true, 
                        'validate_callback' => function($value, $request, $param) {
                            return is_numeric($value) && (int)$value > 0;
                        },
                        'sanitize_callback' => 'absint'
                    ]
                ]
            ]
        ]);
    }

    public function get_item_schema() {
        // API fields definition
        // For updates, most fields should be optional. 
        // For creates, specific fields are checked in create_item method.
        return [
            'product_line_id' => ['required' => false, 'type' => 'integer', 'description' => 'ID of the product line.'],
            'code' => ['required' => false, 'type' => 'string', 'description' => 'Accessory model code (maps to DB model).'],
            'title_zh' => ['required' => false, 'type' => 'string', 'description' => 'Chinese title.'],
            'title_en' => ['required' => false, 'type' => 'string', 'description' => 'English title.'],
            'description_zh' => ['type' => 'string', 'description' => 'Optional. Chinese description.'],
            'description_en' => ['type' => 'string', 'description' => 'Optional. English description.'],
            'type' => ['type' => 'string', 'description' => 'Optional. Type of the accessory.'],
            'image_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Primary image URL (maps to image1_url).'],
            'image2_url' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Secondary image URL.'],
            'explosion_diagram_pdf' => ['type' => 'string', 'format' => 'uri', 'description' => 'Optional. Explosion diagram PDF URL.'],
            'status' => ['type' => 'string', 'default' => 'publish', 'description' => 'Optional. Status (e.g., publish, draft).'],
            'sort_order' => ['type' => 'integer', 'default' => 0, 'description' => 'Optional. Sort order.'],
            'level' => ['type' => 'integer', 'default' => 1, 'description' => 'Optional. Accessory level.']
        ];
    }

    protected function map_request_to_db(WP_REST_Request $request) {
        $params = $request->get_json_params();
         if (null === $params) {
             $params = $request->get_body_params();
        }
        $data = [];
        
        $field_map = [
            // API Field => DB Column
            'product_line_id' => 'product_line_id',
            'code' => 'model', // API 'code' maps to DB 'model'
            'title_zh' => 'title_zh',
            'title_en' => 'title_en',
            'description_zh' => 'description_zh',
            'description_en' => 'description_en',
            'type' => 'type',
            'image_url' => 'image1_url', // API 'image_url' maps to DB 'image1_url'
            'image2_url' => 'image2_url',
            'explosion_diagram_pdf' => 'explosion_diagram_pdf',
            'status' => 'status',
            'sort_order' => 'sort_order',
            'level' => 'level'
        ];

        foreach ($field_map as $api_param_name => $db_column_name) {
            if (isset($params[$api_param_name])) {
                if (in_array($db_column_name, ['product_line_id', 'sort_order', 'level'])) {
                    $data[$db_column_name] = absint($params[$api_param_name]);
                } elseif (in_array($db_column_name, ['image1_url', 'image2_url', 'explosion_diagram_pdf'])) {
                    $data[$db_column_name] = esc_url_raw($params[$api_param_name]);
                } elseif (in_array($db_column_name, ['description_zh', 'description_en'])) {
                    $data[$db_column_name] = sanitize_textarea_field($params[$api_param_name]);
                } else {
                    $data[$db_column_name] = sanitize_text_field($params[$api_param_name]);
                }
            }
        }
        return $data;
    }

    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }
        return [
            'id' => (int) $item_db_object->id,
            'product_line_id' => (int) $item_db_object->product_line_id,
            'code' => $item_db_object->model, // DB 'model' maps back to API 'code'
            'title_zh' => $item_db_object->title_zh,
            'title_en' => $item_db_object->title_en,
            'description_zh' => $item_db_object->description_zh,
            'description_en' => $item_db_object->description_en,
            'type' => $item_db_object->type,
            'image_url' => $item_db_object->image1_url, // DB 'image1_url' maps back to API 'image_url'
            'image2_url' => $item_db_object->image2_url,
            'explosion_diagram_pdf' => $item_db_object->explosion_diagram_pdf,
            'status' => $item_db_object->status,
            'sort_order' => isset($item_db_object->sort_order) ? (int) $item_db_object->sort_order : 0,
            'level' => isset($item_db_object->level) ? (int) $item_db_object->level : 1,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at,
        ];
    }

    // CRUD methods (create_item, get_items, get_item, update_item, delete_item)
    // will be implemented next, largely copying from BJT_Machine_Controller and adapting.

    public function create_item($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        if (null === $params) {
             $params = $request->get_body_params();
        }

        foreach ($this->required_api_fields_for_create as $field) {
            if (empty($params[$field])) {
                return $this->error_response("Missing required API field for accessory model: {$field}", 'missing_api_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Ensure DB-level required fields are present after mapping
        if (empty($data_to_insert['product_line_id'])) {
             return $this->error_response("Missing mapped field: product_line_id", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['model'])) { // 'model' is the DB column for 'code'
             return $this->error_response("Missing mapped field: model (from API code)", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['title_zh'])) {
             return $this->error_response("Missing mapped field: title_zh", 'missing_mapped_field', 400);
        }
        if (empty($data_to_insert['title_en'])) {
             return $this->error_response("Missing mapped field: title_en", 'missing_mapped_field', 400);
        }
        
        // Default status if not provided
        if (empty($data_to_insert['status'])) {
            $data_to_insert['status'] = 'publish';
        }
        // Default level if not provided
        if (empty($data_to_insert['level']) && in_array('level', $this->fillable_fields)) {
            $data_to_insert['level'] = 1; 
        }


        // Check for duplicate: UNIQUE KEY `uk_model` (`product_line_id`, `model`)
        $existing_item = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE product_line_id = %d AND model = %s",
            $data_to_insert['product_line_id'],
            $data_to_insert['model']
        ));
        if ($existing_item) {
            return $this->error_response('Accessory model with this code already exists in this product line.', 'duplicate_accessory_model', 409); 
        }

        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log($this->resource_name . ' DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create accessory model. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));
        
        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created accessory model.', 'retrieve_error', 500);
        }
        
        $formatted_item = $this->format_item_for_response($created_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Accessory model created successfully.', 'data' => $formatted_item], 201);
    }

    public function get_items($request) {
        global $wpdb;
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;

        $items_query = $wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE status = %s ORDER BY id ASC LIMIT %d OFFSET %d",
            'publish', $per_page, $offset
        );
        $items = $wpdb->get_results($items_query);

        $total_items_query = $wpdb->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE status = %s", 'publish');
        $total_items = (int) $wpdb->get_var($total_items_query);
        $total_pages = ceil($total_items / $per_page);

        $formatted_items = [];
        if ($items) {
            foreach ($items as $item) {
                $formatted_items[] = $this->format_item_for_response($item);
            }
        }
        
        return new WP_REST_Response([
            'success' => true, 
            'data' => ['items' => $formatted_items, 'total' => $total_items, 'page' => $page, 'per_page' => $per_page, 'total_pages' => $total_pages]
        ], 200);
    }

    public function get_item($request) {
        global $wpdb;
        $item_id = absint($request['id']);

        if ($item_id <= 0) {
            return $this->error_response('Invalid accessory model ID.', 'invalid_id', 400);
        }

        $item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d AND status = %s", $item_id, 'publish'));

        if (!$item_db) {
            return $this->error_response('Accessory model not found.', 'not_found', 404);
        }
        
        $formatted_item = $this->format_item_for_response($item_db);
        return new WP_REST_Response(['success' => true, 'data' => $formatted_item], 200);
    }

    public function update_item($request) {
        global $wpdb;
        $item_id = absint($request['id']);

        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $item_id));
        if (!$existing_item_db) {
            return $this->error_response('Accessory model not found.', 'not_found_on_update', 404);
        }

        $data_to_update = $this->map_request_to_db($request);

        if (empty($data_to_update)) {
            return new WP_REST_Response(['success' => true, 'message' => 'No fields to update or no valid data provided.', 'data' => $this->format_item_for_response($existing_item_db)], 200);
        }

        // Handle potential unique constraint violation for 'model' and 'product_line_id'
        $check_model = isset($data_to_update['model']) ? $data_to_update['model'] : $existing_item_db->model;
        $check_product_line_id = isset($data_to_update['product_line_id']) ? $data_to_update['product_line_id'] : $existing_item_db->product_line_id;

        if ( (isset($data_to_update['model']) || isset($data_to_update['product_line_id'])) ) {
            $duplicate_query = $wpdb->prepare(
                "SELECT id FROM {$this->table_name} WHERE product_line_id = %d AND model = %s AND id != %d",
                $check_product_line_id, $check_model, $item_id
            );
            if ($wpdb->get_var($duplicate_query)) {
                return $this->error_response('Another accessory model with the same code already exists in this product line.', 'duplicate_model_on_update', 409);
            }
        }
        
        $result = $wpdb->update($this->table_name, $data_to_update, ['id' => $item_id]);

        if ($result === false) {
            error_log($this->resource_name . ' DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update accessory model. DB Error: ' . $wpdb->last_error, 'db_error_update', 500);
        }
        
        if ($result === 0) {
            return new WP_REST_Response(['success' => true, 'message' => 'No changes detected.', 'data' => $this->format_item_for_response($existing_item_db)], 200);
        }

        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $item_id));
        $formatted_item = $this->format_item_for_response($updated_item_db);
        return new WP_REST_Response(['success' => true, 'message' => 'Accessory model updated successfully.', 'data' => $formatted_item], 200);
    }

    public function delete_item($request) {
        global $wpdb;
        $item_id = absint($request['id']);

        if (!$wpdb->get_row($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE id = %d", $item_id))) {
            return $this->error_response('Accessory model not found.', 'not_found_on_delete', 404);
        }

        $result = $wpdb->delete($this->table_name, ['id' => $item_id], ['%d']);

        if ($result === false) {
            error_log($this->resource_name . ' DB Delete Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to delete accessory model. DB Error: ' . $wpdb->last_error, 'db_error_delete', 500);
        }
        
        if ($result === 0) { // Should be caught by pre-check, but as a safeguard
            return $this->error_response('Accessory model not found or already deleted.', 'not_found_or_no_change', 404);
        }

        return new WP_REST_Response(['success' => true, 'message' => 'Accessory model deleted successfully.', 'data' => ['id' => $item_id]], 200);
    }
} 