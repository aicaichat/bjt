<?php
/**
 * REST controller for Relations management.
 * 
 * Handles CRUD operations for relations and provides tree hierarchy support.
 * Implements proper request parameter handling and pagination.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-bjt-api-controller.php';

class BJT_Relation_Controller extends BJT_API_Controller {
    /**
     * 资源名称
     *
     * @var string
     */
    public $resource_name = 'relations';
    protected $table_name;

    protected $fillable_fields = [
        'product_line_id',
        'part_number',
        'parent_part_number',
        'child_part_number',
        'child_type',
        'level',
        'quantity',
        'required_parts',
        'required_quantity',
        'sort_order',
        'status'
    ];

    // API fields needed for creation
    protected $required_api_fields_for_create = [
        'product_line_id',
        'part_number',
        'level',
        'quantity'
    ];

    /**
     * 构造函数
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'bjt_relations';
        $this->resource_name = 'relations'; // Route name
        $this->rest_base = $this->resource_name;
        parent::__construct();
        error_log("BJT_Relation_Controller initialized.");
    }

    /**
     * 注册路由
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->resource_name, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the relation.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'context' => $this->get_context_param(['default' => 'view']),
                ],
            ],
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_item'],
                'permission_callback' => [$this, 'check_delete_permission'],
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the relation.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'cascade' => [
                        'type'        => 'boolean',
                        'default'     => true,
                        'description' => __('Whether to cascade delete all related relations.'),
                    ],
                ],
            ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

        // GET /relations/{part_number}/accessories - Get multi-level accessories for a part
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<part_number>[a-zA-Z0-9-]+)/accessories', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_multi_level_accessories'],
                'permission_callback' => [$this, 'check_read_permission'],
                'args'                => [
                    'part_number' => [
                        'description' => 'Part number to get accessories for.',
                        'type'        => 'string',
                        'required'    => true,
                    ],
                    'max_levels' => [
                        'description' => 'Maximum number of levels to retrieve (1-5).',
                        'type'        => 'integer',
                        'default'     => 5,
                        'minimum'     => 1,
                        'maximum'     => 5,
                    ],
                    'lang' => [
                        'description' => 'Language code (zh/en).',
                        'type'        => 'string',
                        'enum'        => ['zh', 'en'],
                        'default'     => 'zh'
                    ],
                    'region' => [
                        'description' => 'Region code for pricing and inventory.',
                        'type'        => 'string',
                        'enum'        => ['CN', 'EU', 'NA', 'AU'],
                    ],
                ],
            ],
            'schema' => [$this, 'get_item_schema'],
        ]);
    }

    /**
     * 准备查询参数
     */
    protected function prepare_items_query($request) {
        $prepared_args = [];

        // 分页参数
        $per_page = isset($request['per_page']) ? (int) $request['per_page'] : 10;
        $page = isset($request['page']) ? (int) $request['page'] : 1;
        
        $prepared_args['posts_per_page'] = $per_page;
        $prepared_args['offset'] = ($page - 1) * $per_page;

        // 排序参数
        $prepared_args['orderby'] = isset($request['orderby']) ? sanitize_key($request['orderby']) : 'id';
        $prepared_args['order'] = isset($request['order']) ? strtoupper(sanitize_key($request['order'])) : 'DESC';
        
        // 验证排序字段
        $allowed_orderby = ['id', 'parent_part_number', 'child_part_number', 'level', 'sort_order'];
        if (!in_array($prepared_args['orderby'], $allowed_orderby)) {
            $prepared_args['orderby'] = 'id';
        }
        
        // 验证排序方向
        if (!in_array($prepared_args['order'], ['ASC', 'DESC'])) {
            $prepared_args['order'] = 'DESC';
        }

        // 搜索参数
        if (isset($request['search'])) {
            $prepared_args['search'] = sanitize_text_field($request['search']);
        }

        // 自定义筛选参数
        if (isset($request['parent_part_number'])) {
            $prepared_args['parent_part_number'] = sanitize_text_field($request['parent_part_number']);
        }
        if (isset($request['child_part_number'])) {
            $prepared_args['child_part_number'] = sanitize_text_field($request['child_part_number']);
        }
        if (isset($request['level'])) {
            $prepared_args['level'] = absint($request['level']);
        }
        if (isset($request['child_type'])) {
            $prepared_args['child_type'] = sanitize_text_field($request['child_type']);
        }
        if (isset($request['product_line_id'])) {
            $prepared_args['product_line_id'] = absint($request['product_line_id']);
        }
        if (isset($request['parent_is_null'])) {
            $prepared_args['parent_is_null'] = (bool) $request['parent_is_null'];
        }

        return $prepared_args;
    }

    /**
     * 获取响应字段
     */
    protected function get_fields_for_response($request) {
        // 简化实现，返回所有字段
        return [];
    }

    /**
     * 添加分页头信息
     */
    protected function add_pagination_headers($response, $request, $total_items, $per_page) {
        $max_pages = ceil($total_items / $per_page);
        
        $response->header('X-WP-Total', (int) $total_items);
        $response->header('X-WP-TotalPages', (int) $max_pages);
        
        return $response;
    }

    /**
     * Retrieves the query params for collections.
     */
    public function get_collection_params() {
        $params = parent::get_collection_params();

        $params['parent_part_number'] = [
            'description'       => __('Filter relations by parent part number.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['child_part_number'] = [
            'description'       => __('Filter relations by child part number.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['level'] = [
            'description'       => __('Filter relations by hierarchy level.'),
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['child_type'] = [
            'description'       => __('Filter relations by child type (accessory/spare_part).'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['product_line_id'] = [
            'description'       => __('Filter relations by product line ID.'),
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['parent_is_null'] = [
            'description'       => __('Filter relations where parent_part_number is NULL.'),
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'validate_callback' => 'rest_validate_request_arg',
        ];

        // 更新排序字段选项
        if (isset($params['orderby']['enum'])) {
            $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['parent_part_number', 'child_part_number', 'level', 'sort_order']);
        }

        return $params;
    }

    /**
     * 获取关系列表
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_items($request) {
        global $wpdb;

        try {
            // 1. Prepare Query Args (包含分页参数)
            $prepared_args = $this->prepare_items_query($request);
            
            // 2. 从prepared_args中获取分页参数
            $page = isset($request['page']) ? (int) $request['page'] : 1;
            $per_page = isset($request['per_page']) ? (int) $request['per_page'] : 10;
            
            // 确保per_page有合理的限制
            if ($per_page > 1000) {
                $per_page = 1000; // 设置最大限制
            }
            
            // 3. Build WHERE Clauses
            $where_clauses = ["1=1"];
            $where_values = [];

            // 产品线ID筛选
            if (!empty($prepared_args['product_line_id'])) {
                $where_clauses[] = "product_line_id = %d";
                $where_values[] = $prepared_args['product_line_id'];
            }

            // 父料号筛选
            if (!empty($prepared_args['parent_part_number'])) {
                $where_clauses[] = "parent_part_number = %s";
                $where_values[] = $prepared_args['parent_part_number'];
            }
            
            // 父料号为空筛选
            if (isset($prepared_args['parent_is_null']) && $prepared_args['parent_is_null']) {
                $where_clauses[] = "parent_part_number IS NULL";
            }
            
            // 子料号筛选
            if (!empty($prepared_args['child_part_number'])) {
                $where_clauses[] = "child_part_number = %s";
                $where_values[] = $prepared_args['child_part_number'];
            }
            
            // 层级筛选
            if (isset($prepared_args['level']) && is_numeric($prepared_args['level'])) {
                $where_clauses[] = "level = %d";
                $where_values[] = $prepared_args['level'];
            }
            
            // 子项类型筛选
            if (!empty($prepared_args['child_type'])) {
                $where_clauses[] = "child_type = %s";
                $where_values[] = $prepared_args['child_type'];
            }

            // 搜索筛选
            if (!empty($prepared_args['search'])) {
                $search_term = '%' . $wpdb->esc_like($prepared_args['search']) . '%';
                $where_clauses[] = "(part_number LIKE %s OR parent_part_number LIKE %s OR child_part_number LIKE %s)";
                $where_values[] = $search_term;
                $where_values[] = $search_term;
                $where_values[] = $search_term;
            }

            $where_sql = implode(" AND ", $where_clauses);
            
            // 4. Get Total Count
            $count_query = "SELECT COUNT(id) FROM {$this->table_name} WHERE {$where_sql}";
            if (!empty($where_values)) {
                $count_query = $wpdb->prepare($count_query, $where_values);
            }
            $total_items = (int) $wpdb->get_var($count_query);

            // 5. Get Paginated Items
            $offset = ($page - 1) * $per_page;
            $items_query = "SELECT * FROM {$this->table_name} WHERE {$where_sql} ORDER BY {$prepared_args['orderby']} {$prepared_args['order']} LIMIT %d OFFSET %d";
            $query_values = array_merge($where_values, [$per_page, $offset]);
            $items_query = $wpdb->prepare($items_query, $query_values);
            
            $items_db = $wpdb->get_results($items_query);

            // 6. Format Items
            $formatted_items = [];
            if ($items_db) {
                foreach ($items_db as $item_db) {
                    $formatted_items[] = $this->format_item_for_response($item_db);
                }
            }

            // 7. Prepare Response
            $response_data = [
                'items' => $formatted_items,
                'page' => $page,
                'page_size' => $per_page,
                'total' => (int) $total_items,
                'total_pages' => ceil($total_items / $per_page)
            ];
            
            $response = new WP_REST_Response($response_data, 200);
            
            // 8. Add Pagination Headers
            $this->add_pagination_headers($response, $request, $total_items, $per_page);
            
            return $response;
            
        } catch (Exception $e) {
            error_log('BJT Relations get_items error: ' . $e->getMessage());
            return $this->error_response('Internal server error', 'server_error', 500);
        }
    }

    /**
     * 获取单个关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        $item_db_object = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));

        if (!$item_db_object) {
            return $this->error_response("Relation with ID {$id} not found.", 'not_found', 404);
        }

        $formatted_item = $this->format_item_for_response($item_db_object);
        // Add checks for permissions based on context if needed
        // ... 

        // Prepare response
        $response = new WP_REST_Response($formatted_item, 200);
        // Add any relevant headers like ETag if implementing caching
        // $response->header( 'ETag', wp_hash( serialize( $formatted_item ) ) );
        
        return $response;
    }

    /**
     * 创建关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function create_item($request) {
        global $wpdb;

        $params = $request->get_json_params();
        if (null === $params) {
            $params = $request->get_body_params(); // Fallback for form-data
        }

        // Validate required API fields
        foreach ($this->required_api_fields_for_create as $field) {
            if (!isset($params[$field]) || ($params[$field] === '' && $field !== 'description')) { // Allow empty description
                return $this->error_response("Missing required API field for relation: {$field}", 'missing_api_field', 400);
            }
        }

        $data_to_insert = $this->map_request_to_db($request);

        // Additional DB-level validation if needed (e.g. if part numbers must exist in other tables)
        // For now, we'll assume part numbers are validated elsewhere or are just strings.

        // Check for duplicate relation (完整的关系上下文检查)
        // 修正：检查完整的关系上下文，而不仅仅是parent和child的组合
        // 因为同一个child可能被不同的part引用，这在层级关系中是合理的
        $existing_relation = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM {$this->table_name} WHERE host_part_number = %s AND parent_part_number = %s AND part_number = %s AND child_part_number = %s",
            $data_to_insert['host_part_number'],
            $data_to_insert['parent_part_number'],
            $data_to_insert['part_number'],
            $data_to_insert['child_part_number']
        ));

        if ($existing_relation) {
            return $this->error_response(
                'This exact relation (host_part_number, parent_part_number, part_number, and child_part_number combination) already exists.',
                'duplicate_relation',
                409 // Conflict
            );
        }
        
        // Add created_at and updated_at timestamps
        $current_time = current_time('mysql', 1); // GMT
        $data_to_insert['created_at'] = $current_time;
        $data_to_insert['updated_at'] = $current_time;


        $result = $wpdb->insert($this->table_name, $data_to_insert);

        if ($result === false) {
            error_log('BJT_Relation_Controller DB Insert Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to create relation. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        $new_item_id = $wpdb->insert_id;
        $created_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $new_item_id));

        if (!$created_item_db) {
            return $this->error_response('Failed to retrieve created relation.', 'retrieve_error', 500);
        }

        $formatted_item = $this->format_item_for_response($created_item_db);
        // Standard WP REST API practice is to return the full object and a 201 status
        $response = new WP_REST_Response($formatted_item, 201);
        // Add location header
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $new_item_id)));
        return $response;
    }

    /**
     * 更新关系 (To be implemented)
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function update_item($request) {
        global $wpdb;
        $id = absint($request['id']);

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        // Check if the relation exists
        $existing_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$existing_item_db) {
            return $this->error_response("Relation with ID {$id} not found to update.", 'not_found', 404);
        }

        $data_to_update = $this->map_request_to_db($request, true /* is_update */);

        // Prevent changing parent/child part numbers via update for simplicity
        // If this needs to be allowed, more complex validation (checking for resulting duplicates) is needed.
        if (isset($data_to_update['parent_part_number']) || isset($data_to_update['child_part_number'])) {
            // Unset them to prevent update, or return an error
             unset($data_to_update['parent_part_number']);
             unset($data_to_update['child_part_number']);
             // Alternatively: return $this->error_response('Updating parent/child part numbers is not allowed. Delete and recreate the relation instead.', 'update_not_allowed', 400);
        }

        if (empty($data_to_update)) {
            // No valid fields provided for update that are allowed to be changed
            $formatted_existing = $this->format_item_for_response($existing_item_db);
             return new WP_REST_Response($formatted_existing, 200); // Return existing data
            // Or: return $this->error_response('No valid fields provided for update.', 'no_fields_to_update', 400);
        }
        
        // Add current timestamp for updated_at
        $data_to_update['updated_at'] = current_time('mysql', 1); // GMT

        $result = $wpdb->update($this->table_name, $data_to_update, array('id' => $id));

        if ($result === false) {
            error_log('BJT_Relation_Controller DB Update Error: ' . $wpdb->last_error);
            return $this->error_response('Failed to update relation. DB Error: ' . $wpdb->last_error, 'db_error', 500);
        }

        // Fetch the updated item to return it
        $updated_item_db = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$updated_item_db) {
            return $this->error_response('Failed to retrieve relation after update.', 'retrieve_after_update_error', 500);
        }

        $formatted_item = $this->format_item_for_response($updated_item_db);
        return new WP_REST_Response($formatted_item, 200);
    }

    /**
     * 删除关系 - 支持级联删除
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function delete_item($request) {
        global $wpdb;
        $id = absint($request['id']);
        $cascade = $request->get_param('cascade') !== false; // 默认启用级联删除

        if ($id <= 0) {
            return $this->error_response('Invalid relation ID.', 'invalid_id', 400);
        }

        // Check if the item exists before trying to delete
        $item_to_delete = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id));
        if (!$item_to_delete) {
            return $this->error_response("Relation with ID {$id} not found to delete.", 'not_found', 404);
        }

        // Format the item for response *before* deleting it
        $previous = $this->format_item_for_response($item_to_delete);

        // 开始事务
        $wpdb->query('START TRANSACTION');

        try {
            $deleted_count = 0;
            $deleted_relations = [];

            if ($cascade) {
                // 级联删除：找到所有需要删除的子级关系
                $relations_to_delete = $this->find_cascade_delete_relations($item_to_delete);
                
                error_log("BJT Relations: Cascade delete found " . count($relations_to_delete) . " relations to delete");
                
                // 按照层级从深到浅排序，确保先删除子级
                usort($relations_to_delete, function($a, $b) {
                    return ($b->level ?? 0) - ($a->level ?? 0);
                });

                // 删除所有关系
                foreach ($relations_to_delete as $relation) {
                    $delete_result = $wpdb->delete($this->table_name, array('id' => $relation->id), array('%d'));
                    
                    if ($delete_result === false) {
                        throw new Exception("Failed to delete relation ID {$relation->id}: " . $wpdb->last_error);
                    }
                    
                    if ($delete_result > 0) {
                        $deleted_count++;
                        $deleted_relations[] = $this->format_item_for_response($relation);
                        error_log("BJT Relations: Deleted cascade relation ID {$relation->id} (part: {$relation->part_number} -> child: {$relation->child_part_number})");
                    }
                }
            } else {
                // 非级联删除：只删除指定的关系
                $result = $wpdb->delete($this->table_name, array('id' => $id), array('%d'));

                if ($result === false) {
                    throw new Exception('Failed to delete relation. DB Error: ' . $wpdb->last_error);
                }
                
                if ($result === 0) {
                    throw new Exception("Relation with ID {$id} could not be deleted (it may have been deleted by another process).");
                }
                
                $deleted_count = $result;
                $deleted_relations = [$previous];
            }

            // 提交事务
            $wpdb->query('COMMIT');

            // Prepare response data
            $response_data = [
                'deleted' => true,
                'cascade' => $cascade,
                'deleted_count' => $deleted_count,
                'previous' => $previous,
                'deleted_relations' => $deleted_relations,
            ];

            error_log("BJT Relations: Successfully deleted {$deleted_count} relations (cascade: " . ($cascade ? 'true' : 'false') . ")");

            return new WP_REST_Response($response_data, 200);

        } catch (Exception $e) {
            // 回滚事务
            $wpdb->query('ROLLBACK');
            error_log('BJT_Relation_Controller Cascade Delete Error: ' . $e->getMessage());
            return $this->error_response('Failed to delete relation(s): ' . $e->getMessage(), 'delete_error', 500);
        }
    }

    /**
     * 查找需要级联删除的所有关系
     * 
     * @param object $root_relation 根关系记录
     * @return array 需要删除的关系记录数组
     */
    private function find_cascade_delete_relations($root_relation) {
        global $wpdb;
        
        $relations_to_delete = [$root_relation]; // 包含根关系本身
        $processed_parts = []; // 防止重复处理
        
        // 递归查找所有子级关系
        $this->find_child_relations_recursive($root_relation->child_part_number, $root_relation->product_line_id, $relations_to_delete, $processed_parts);
        
        return $relations_to_delete;
    }

    /**
     * 递归查找子级关系
     * 
     * @param string $part_number 当前料号
     * @param int $product_line_id 产品线ID
     * @param array &$relations_to_delete 需要删除的关系数组（引用传递）
     * @param array &$processed_parts 已处理的料号数组（引用传递，防止循环）
     */
    private function find_child_relations_recursive($part_number, $product_line_id, &$relations_to_delete, &$processed_parts) {
        global $wpdb;
        
        // 防止循环引用
        if (in_array($part_number, $processed_parts)) {
            error_log("BJT Relations: Circular reference detected during cascade delete for part_number: {$part_number}");
            return;
        }
        $processed_parts[] = $part_number;
        
        // 查找以当前料号为part_number的所有子级关系
        $child_relations = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table_name} 
             WHERE part_number = %s AND product_line_id = %d 
             ORDER BY level DESC, id ASC",
            $part_number,
            $product_line_id
        ));
        
        if (!empty($child_relations)) {
            foreach ($child_relations as $child_relation) {
                // 添加到删除列表
                $relations_to_delete[] = $child_relation;
                
                // 递归查找更深层的子级
                if (!empty($child_relation->child_part_number)) {
                    $this->find_child_relations_recursive(
                        $child_relation->child_part_number, 
                        $product_line_id, 
                        $relations_to_delete, 
                        $processed_parts
                    );
                }
            }
        }
    }

    /**
     * 获取项目的 Schema (结构定义)
     * Defines the structure and types for a relation item.
     *
     * @return array
     */
    public function get_item_schema() {
         if ($this->schema) {
            return $this->add_additional_fields_schema($this->schema);
        }

        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => $this->resource_name,
            'type'       => 'object',
            'properties' => [
                'id' => [
                    'description' => __('Unique identifier for the relation.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'product_line_id' => [
                    'description' => __('Product line ID.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'host_part_number' => [
                    'description' => __('Host machine part number (level 0).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'part_number' => [
                    'description' => __('Current item part number.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'parent_part_number' => [
                    'description' => __('Parent item part number.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'child_part_number' => [
                    'description' => __('Child item part number.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'child_type' => [
                    'description' => __('Child item type (accessory/spare_part).'),
                    'type'        => 'string',
                    'enum'        => ['accessory', 'spare_part'],
                    'default'     => 'accessory',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'level' => [
                    'description' => __('Hierarchy level (1-5), spare parts fixed at 1.'),
                    'type'        => 'integer',
                    'default'     => 1,
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'quantity' => [
                    'description' => __('Quantity of child item in parent.'),
                    'type'        => 'integer',
                    'default'     => 1,
                    'context'     => ['view', 'edit', 'embed'],
                    'required'    => true,
                ],
                'required_parts' => [
                    'description' => __('Required dependency part numbers (comma separated).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'required_quantity' => [
                    'description' => __('Required dependency quantities (comma separated, corresponds to required_parts).'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'sort_order' => [
                    'description' => __('Sort order within same level.'),
                    'type'        => 'integer',
                    'default'     => 0,
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'status' => [
                    'description' => __('Relation status.'),
                    'type'        => 'string',
                    'default'     => 'publish',
                    'enum'        => ['publish', 'draft', 'trash'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'created_at' => [
                    'description' => __('The date the relation was created, in the site\'s timezone.'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'updated_at' => [
                    'description' => __('The date the relation was last updated, in the site\'s timezone.'),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
            ],
        ];
        
        $this->schema = $schema;

        return $this->add_additional_fields_schema($this->schema);
    }

    // Placeholder for mapping/formatting functions if needed
    protected function map_request_to_db(WP_REST_Request $request, $is_update = false) {
        global $wpdb;
        $params = $request->get_params();
        $data = [];

        foreach ($this->fillable_fields as $db_column) {
            if (isset($params[$db_column])) {
                $value = $params[$db_column];
                switch ($db_column) {
                    case 'product_line_id':
                    case 'level':
                    case 'quantity':
                    case 'sort_order':
                        $data[$db_column] = absint($value);
                        break;
                    case 'part_number':
                    case 'parent_part_number':
                    case 'child_part_number':
                        // 料号字段处理，转换为大写并去除空格
                        $data[$db_column] = !empty($value) ? sanitize_text_field(strtoupper(trim($value))) : null;
                        break;
                    case 'child_type':
                        // 验证子项类型枚举值
                        $allowed_types = ['accessory', 'spare_part'];
                        $cleaned_value = sanitize_text_field($value);
                        $data[$db_column] = in_array($cleaned_value, $allowed_types) ? $cleaned_value : 'accessory';
                        break;
                    case 'required_parts':
                        // 处理必选备件料号，支持多个（逗号分隔）
                        if (is_array($value)) {
                            // 如果传入的是数组，转换为逗号分隔的字符串
                            $cleaned_parts = array_map(function($part) {
                                return sanitize_text_field(strtoupper(trim($part)));
                            }, $value);
                            $data[$db_column] = implode(',', array_filter($cleaned_parts));
                        } else {
                            // 如果传入的是字符串，直接清理
                            $data[$db_column] = !empty($value) ? sanitize_text_field($value) : null;
                        }
                        break;
                    case 'required_quantity':
                        // 处理必选备件数量，支持多个（逗号分隔）
                        if (is_array($value)) {
                            // 如果传入的是数组，转换为逗号分隔的字符串
                            $cleaned_quantities = array_map(function($qty) {
                                return absint($qty);
                            }, $value);
                            $data[$db_column] = implode(',', array_filter($cleaned_quantities, function($qty) {
                                return $qty > 0;
                            }));
                        } else {
                            // 如果传入的是字符串，直接清理
                            $data[$db_column] = !empty($value) ? sanitize_text_field($value) : null;
                        }
                        break;
                    case 'status':
                        // 验证状态枚举值
                        $allowed_statuses = ['publish', 'draft', 'trash'];
                        $cleaned_value = sanitize_text_field($value);
                        $data[$db_column] = in_array($cleaned_value, $allowed_statuses) ? $cleaned_value : 'publish';
                        break;
                    default:
                        $data[$db_column] = sanitize_text_field($value);
                        break;
                }
            }
        }

        // 自动计算 host_part_number - 优化逻辑
        if (isset($data['part_number'])) {
            // 优先使用前端传递的 host_part_number
            if (isset($params['host_part_number']) && !empty($params['host_part_number'])) {
                $data['host_part_number'] = sanitize_text_field(strtoupper(trim($params['host_part_number'])));
            } else {
                // 如果前端没有传递，则根据层级结构自动计算
                if (empty($data['parent_part_number'])) {
                    // 如果没有父料号，这是主机，host_part_number = part_number
                    $data['host_part_number'] = $data['part_number'];
                } else {
                    // 如果有父料号，尝试查找主机料号
                    $found_host = $this->find_root_host_part_number($data['parent_part_number'], $data['product_line_id']);
                    $data['host_part_number'] = $found_host ?: $data['part_number']; // 如果找不到，使用当前料号作为fallback
                }
            }
        }

        return $data;
    }

    /**
     * 递归查找根级主机料号
     * 
     * @param string $part_number 当前料号
     * @param int $product_line_id 产品线ID
     * @param array $visited 已访问的料号，防止循环引用
     * @return string 根级主机料号
     */
    private function find_root_host_part_number($part_number, $product_line_id, $visited = []) {
        global $wpdb;
        
        // 防止循环引用
        if (in_array($part_number, $visited)) {
            error_log("BJT Relations: Circular reference detected for part_number: {$part_number}");
            return $part_number;
        }
        $visited[] = $part_number;
        
        // 查找以当前料号为child_part_number的关系，找到它的父级
        $parent_relation = $wpdb->get_row($wpdb->prepare(
            "SELECT part_number, parent_part_number FROM {$this->table_name} 
             WHERE child_part_number = %s AND product_line_id = %d 
             ORDER BY id DESC LIMIT 1",
            $part_number,
            $product_line_id
        ));
        
        if (!$parent_relation) {
            // 如果找不到父级关系，当前料号可能就是主机料号
            // 但我们需要验证它是否真的是主机（即作为part_number且parent_part_number为null的记录）
            $is_host = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table_name} 
                 WHERE part_number = %s AND parent_part_number IS NULL AND product_line_id = %d",
                $part_number,
                $product_line_id
            ));
            
            if ($is_host > 0) {
                return $part_number;
            } else {
                // 如果不是主机，可能是数据不完整，记录错误并返回当前料号
                error_log("BJT Relations: Could not find root host for part_number: {$part_number}, product_line_id: {$product_line_id}");
                return $part_number;
            }
        }
        
        if (empty($parent_relation->parent_part_number)) {
            // 如果parent_part_number为null，说明父级是主机
            // 返回父级的part_number作为主机料号
            return $parent_relation->part_number;
        } else {
            // 如果父级还有父级，继续向上递归查找
            // 注意：这里应该查找parent_relation->parent_part_number，而不是part_number
            return $this->find_root_host_part_number($parent_relation->parent_part_number, $product_line_id, $visited);
        }
    }

    protected function format_item_for_response($item_db_object) {
        if (!$item_db_object) {
            return null;
        }

        // 直接基于数据库表结构构建响应
        $response_data = [
            'id' => (int) $item_db_object->id,
            'product_line_id' => (int) $item_db_object->product_line_id,
            'host_part_number' => $item_db_object->host_part_number,
            'part_number' => $item_db_object->part_number,
            'parent_part_number' => $item_db_object->parent_part_number,
            'child_part_number' => $item_db_object->child_part_number,
            'child_type' => $item_db_object->child_type,
            'level' => (int) $item_db_object->level,
            'quantity' => (int) $item_db_object->quantity,
            'required_parts' => $item_db_object->required_parts,
            'required_quantity' => $item_db_object->required_quantity,
            'sort_order' => (int) $item_db_object->sort_order,
            'status' => $item_db_object->status,
            'created_at' => $item_db_object->created_at,
            'updated_at' => $item_db_object->updated_at,
        ];

        return $response_data;
    }

    /**
     * 获取多级配件关系
     * 
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function get_multi_level_accessories($request) {
        global $wpdb;
        
        $part_number = $request->get_param('part_number');
        $max_levels = $request->get_param('max_levels') ?: 5;
        $lang = $request->get_param('lang') ?: 'zh';
        $region = $request->get_param('region');
        
        try {
            // 🔧 设置当前主机料号上下文
            $this->current_host_part_number = $part_number;
            
            $accessories_table = $wpdb->prefix . 'bjt_accessories';
            $name_column = ($lang === 'en') ? 'name_en' : 'name_zh';
            
            error_log("BJT Relations: get_multi_level_accessories - Starting for host: {$part_number}, max_levels: {$max_levels}");
            
            // 🔧 修复：递归获取多级配件，主机节点的父级上下文为null
            $result = $this->get_accessories_recursive($part_number, 1, $max_levels, $lang, $region, [], null);
            
            error_log("BJT Relations: get_multi_level_accessories - Completed for host: {$part_number}, returned " . count($result) . " top-level accessories");
            
            return new WP_REST_Response([
                'success' => true,
                'data' => [
                    'part_number' => $part_number,
                    'max_levels' => $max_levels,
                    'accessories' => $result
                ]
            ], 200);
            
        } catch (Exception $e) {
            error_log('BJT Relations get_multi_level_accessories error: ' . $e->getMessage());
            return $this->error_response('Failed to retrieve multi-level accessories', 'server_error', 500);
        }
    }
    
    /**
     * 递归获取配件关系 - 按照admin RelationsPage的buildTreeNodes逻辑实现
     * 
     * @param string $part_number 当前处理的部件号
     * @param int $current_level 当前层级
     * @param int $max_levels 最大层级
     * @param string $lang 语言
     * @param string $region 区域
     * @param array $visited_nodes 已访问节点，防止循环引用
     * @param string $current_parent_part_number 当前节点的父级料号，用于确定上下文路径
     * @return array
     */
    private function get_accessories_recursive($part_number, $current_level, $max_levels, $lang, $region, $visited_nodes = [], $current_parent_part_number = null) {
        global $wpdb;
        
        if ($current_level > $max_levels) {
            error_log("BJT Relations: get_accessories_recursive - Max levels ({$max_levels}) reached for part_number: {$part_number}");
            return [];
        }
        
        // 🔧 循环检测：如果当前节点已经在访问路径中，则停止递归
        if (in_array($part_number, $visited_nodes)) {
            error_log("BJT Relations: get_accessories_recursive - Detected cycle at node {$part_number}, stopping recursion");
            return [];
        }
        
        // 添加当前节点到访问集合
        $new_visited_nodes = array_merge($visited_nodes, [$part_number]);
        
        error_log("BJT Relations: get_accessories_recursive - Processing part_number: {$part_number}, current_level: {$current_level}, parent: {$current_parent_part_number}");
        
        // 🔧 修正查询逻辑：根据具体的树路径上下文查找子级关系
        if ($part_number === $this->get_current_host_part_number() && $current_parent_part_number === null) {
            // 对于主机根节点：查找 parent_part_number = null 且 part_number = 主机料号
            $relations_query = "SELECT r.child_part_number, r.level, r.quantity, r.sort_order, r.id, r.parent_part_number, r.child_type
                               FROM {$this->table_name} r 
                               WHERE r.part_number = %s 
                               AND r.parent_part_number IS NULL 
                               AND r.host_part_number = %s
                               AND r.status = 'publish'
                               ORDER BY r.sort_order ASC, r.id ASC";
            
            $relations = $wpdb->get_results(
                $wpdb->prepare($relations_query, $part_number, $this->get_current_host_part_number())
            );
        } else {
            // 🔧 关键修复：对于非主机节点，需要根据当前节点的具体路径上下文查找子级
            // 查找 part_number = 当前节点 AND parent_part_number = 当前父级 的记录
            $relations_query = "SELECT r.child_part_number, r.level, r.quantity, r.sort_order, r.id, r.parent_part_number, r.child_type
                               FROM {$this->table_name} r 
                               WHERE r.part_number = %s 
                               AND r.parent_part_number = %s
                               AND r.host_part_number = %s
                               AND r.status = 'publish'
                               ORDER BY r.sort_order ASC, r.id ASC";
            
            $relations = $wpdb->get_results(
                $wpdb->prepare($relations_query, $part_number, $current_parent_part_number, $this->get_current_host_part_number())
            );
        }
        
        // 🎯 特殊调试：针对14A01246
        if ($part_number === '14A01246') {
            error_log("🎯 BJT Relations: [14A01246 DEBUG] Query context: part={$part_number}, parent={$current_parent_part_number}");
            error_log("🎯 BJT Relations: [14A01246 DEBUG] Query executed: " . $wpdb->prepare($relations_query, $part_number, $current_parent_part_number));
            error_log("🎯 BJT Relations: [14A01246 DEBUG] Found " . count($relations) . " child relations:");
            foreach ($relations as $i => $rel) {
                error_log("🎯 BJT Relations: [14A01246 DEBUG]   Child {$i}: {$rel->child_part_number} (level: {$rel->level}, quantity: {$rel->quantity}, relation_id: {$rel->id}, parent: {$rel->parent_part_number})");
            }
        } else {
            error_log("BJT Relations: get_accessories_recursive - Found " . count($relations) . " child relations for part_number: {$part_number}, parent: {$current_parent_part_number}");
        }
        
        if (empty($relations)) {
            error_log("BJT Relations: get_accessories_recursive - No child relations found for part_number: {$part_number}, parent: {$current_parent_part_number}");
            return [];
        }
        
        $accessories = [];
        $accessories_table = $wpdb->prefix . 'bjt_accessories';
        $name_column = ($lang === 'en') ? 'name_en' : 'name_zh';
        
        // 🔧 为每个子关系创建节点
        foreach ($relations as $relation) {
            $child_part_number = $relation->child_part_number;
            if (!$child_part_number) continue;
            
            // 🎯 特殊调试：针对14A01246的子配件
            if ($part_number === '14A01246') {
                error_log("🎯 BJT Relations: [14A01246 DEBUG] Processing child: {$child_part_number} (relation ID: {$relation->id})");
            }
            
            // 🔧 查询配件基础信息
            $accessory_query = "SELECT id, model, part_number, {$name_column} as name, spec, spec_imperial, 
                                       voltage, frequency, image_url, status, unit, product_line_id,
                                       package_size_cm, package_size_inch, net_weight_kg, net_weight_lbs,
                                       gross_weight_kg, gross_weight_lbs, pcs_per_box,
                                       pallet_size_cm, pallet_size_inch, pcs_per_pallet,
                                       pallet_height_cm, pallet_height_inch, pallet_gross_weight_kg, pallet_gross_weight_lbs
                                FROM {$accessories_table} 
                                WHERE part_number = %s AND status = 'publish'";
            
            $accessory = $wpdb->get_row(
                $wpdb->prepare($accessory_query, $child_part_number)
            );
            
            // 创建配件数据结构
            if ($accessory) {
                // 🎯 特殊调试：针对14A01246的子配件
                if ($part_number === '14A01246') {
                    error_log("🎯 BJT Relations: [14A01246 DEBUG] Found accessory data for child {$child_part_number}: {$accessory->name}");
                }
                
                $accessory_data = [
                    'id' => $accessory->id,
                    'part_number' => $accessory->part_number,
                    'model' => $accessory->model,
                    'name' => $accessory->name,
                    'spec' => $accessory->spec,
                    'spec_imperial' => $accessory->spec_imperial,
                    'voltage' => $accessory->voltage,
                    'frequency' => $accessory->frequency,
                    'image_url' => $accessory->image_url,
                    'unit' => $accessory->unit,
                    'product_line_id' => $accessory->product_line_id,
                    'level' => $current_level,
                    // 包装信息
                    'package_size_cm' => $accessory->package_size_cm,
                    'package_size_inch' => $accessory->package_size_inch,
                    'net_weight_kg' => $accessory->net_weight_kg,
                    'net_weight_lbs' => $accessory->net_weight_lbs,
                    'gross_weight_kg' => $accessory->gross_weight_kg,
                    'gross_weight_lbs' => $accessory->gross_weight_lbs,
                    'pcs_per_box' => $accessory->pcs_per_box,
                    // 托盘信息
                    'pallet_size_cm' => $accessory->pallet_size_cm,
                    'pallet_size_inch' => $accessory->pallet_size_inch,
                    'pcs_per_pallet' => $accessory->pcs_per_pallet,
                    'pallet_height_cm' => $accessory->pallet_height_cm,
                    'pallet_height_inch' => $accessory->pallet_height_inch,
                    'pallet_gross_weight_kg' => $accessory->pallet_gross_weight_kg,
                    'pallet_gross_weight_lbs' => $accessory->pallet_gross_weight_lbs,
                    // 关系信息
                    'relation_id' => $relation->id,
                    'quantity' => (int) $relation->quantity,
                    'sort_order' => (int) $relation->sort_order,
                    'child_type' => $relation->child_type,
                    'children' => []
                ];
            } else {
                // 🔧 配件基础数据不存在，创建占位符
                error_log("BJT Relations: get_accessories_recursive - Accessory not found for child_part_number: {$child_part_number}, creating placeholder");
                // 🎯 特殊调试：针对14A01246的子配件
                if ($part_number === '14A01246') {
                    error_log("🎯 BJT Relations: [14A01246 DEBUG] ⚠️ Accessory data not found for child: {$child_part_number}, creating placeholder");
                }
                
                $accessory_data = [
                    'id' => "missing_" . $child_part_number,
                    'part_number' => $child_part_number,
                    'model' => null,
                    'name' => "⚠️ 配件数据缺失: {$child_part_number}",
                    'spec' => "数据缺失 - 需要在配件表中添加此料号",
                    'spec_imperial' => "Data Missing - Need to add this part number to accessories table",
                    'voltage' => null,
                    'frequency' => null,
                    'image_url' => '/images/placeholder-missing.jpg',
                    'unit' => 'pcs',
                    'product_line_id' => 1,
                    'level' => $current_level,
                    // 所有物理属性设为null
                    'package_size_cm' => null, 'package_size_inch' => null,
                    'net_weight_kg' => null, 'net_weight_lbs' => null,
                    'gross_weight_kg' => null, 'gross_weight_lbs' => null,
                    'pcs_per_box' => null, 'pallet_size_cm' => null,
                    'pallet_size_inch' => null, 'pcs_per_pallet' => null,
                    'pallet_height_cm' => null, 'pallet_height_inch' => null,
                    'pallet_gross_weight_kg' => null, 'pallet_gross_weight_lbs' => null,
                    // 关系信息
                    'relation_id' => $relation->id,
                    'quantity' => (int) $relation->quantity,
                    'sort_order' => (int) $relation->sort_order,
                    'child_type' => $relation->child_type,
                    'children' => [],
                    // 数据状态标记
                    'data_status' => 'missing_from_accessories_table',
                    'error_message' => "配件基础数据缺失，仅显示关系结构"
                ];
            }
            
            // 添加价格和库存信息（如果需要）
            if ($region && $accessory) {
                $this->add_pricing_and_inventory($accessory_data, $accessory->id, $region);
            }
            
            // 🔧 递归获取子配件 - 传递正确的父级上下文
            if ($current_level < $max_levels) {
                // 🎯 特殊调试：针对14A01246的子配件
                if ($part_number === '14A01246') {
                    error_log("🎯 BJT Relations: [14A01246 DEBUG] Recursively getting children for {$child_part_number} at level " . ($current_level + 1) . " with parent context: {$part_number}");
                }
                
                $child_accessories = $this->get_accessories_recursive(
                    $child_part_number, 
                    $current_level + 1, 
                    $max_levels, 
                    $lang, 
                    $region,
                    $new_visited_nodes,
                    $part_number // 🔧 关键修复：传递当前节点作为子级的父级上下文
                );
                
                $accessory_data['children'] = $child_accessories;
                
                // 🎯 特殊调试：针对14A01246的子配件
                if ($part_number === '14A01246') {
                    error_log("🎯 BJT Relations: [14A01246 DEBUG] Found " . count($child_accessories) . " grandchildren for {$child_part_number}");
                }
            }
            
            $accessories[] = $accessory_data;
            
            // 🎯 特殊调试：针对14A01246
            if ($part_number === '14A01246') {
                error_log("🎯 BJT Relations: [14A01246 DEBUG] Added accessory {$child_part_number} to result");
            }
        }
        
        error_log("BJT Relations: get_accessories_recursive - Returning " . count($accessories) . " accessories for part_number: {$part_number}, parent: {$current_parent_part_number}");
        
        // 🎯 特殊调试：针对14A01246
        if ($part_number === '14A01246') {
            error_log("🎯 BJT Relations: [14A01246 DEBUG] Final result - returning " . count($accessories) . " accessories");
            foreach ($accessories as $i => $acc) {
                error_log("🎯 BJT Relations: [14A01246 DEBUG]   Result {$i}: {$acc['part_number']} (children: " . count($acc['children']) . ")");
            }
        }
        
        return $accessories;
    }
    
    /**
     * 获取当前处理的主机料号
     */
    private function get_current_host_part_number() {
        // 从当前请求上下文获取主机料号
        // 这个方法需要在调用时设置当前主机料号
        return $this->current_host_part_number ?? '';
    }
    
    /**
     * 添加价格和库存信息
     */
    private function add_pricing_and_inventory(&$accessory_data, $accessory_id, $region) {
        global $wpdb;
        
        // 添加价格信息
        $prices_table = $wpdb->prefix . 'bjt_prices';
        $price_data = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT base_price, currency, discount_rate 
                 FROM {$prices_table} 
                 WHERE target_type = 'accessory' AND target_id = %d AND region = %s 
                 AND status = 'active' ORDER BY min_quantity ASC LIMIT 1",
                $accessory_id,
                $region
            )
        );
        
        if ($price_data) {
            $accessory_data['pricing'] = [
                'base_price' => (float) $price_data->base_price,
                'currency' => $price_data->currency,
                'discount_rate' => (float) $price_data->discount_rate
            ];
        }
        
        // 添加库存信息
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
        $inventory_data = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT warehouse, quantity, reserved 
                 FROM {$inventory_table} 
                 WHERE target_type = 'accessory' AND target_id = %d AND region = %s 
                 AND status = 'active'",
                $accessory_id,
                $region
            )
        );
        
        if ($inventory_data) {
            $accessory_data['inventory'] = array_map(function($inv) {
                return [
                    'warehouse' => $inv->warehouse,
                    'quantity' => (int) $inv->quantity,
                    'reserved' => (int) $inv->reserved,
                    'available' => (int) $inv->quantity - (int) $inv->reserved
                ];
            }, $inventory_data);
        }
    }

    /**
     * Checks if the current user has permission to write (create/update) relations.
     * Requires authentication and proper BJT permissions.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has write access, WP_Error object otherwise.
     */
    public function check_write_permission($request) {
        error_log('[BJT_Relation_Controller] Checking write permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Relation_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Relation_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Relation_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Relation_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Relation_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Relation_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - admin和manager可以创建/更新relations
        $has_write_permission = false;
        if (isset($user->role)) {
            $allowed_write_roles = ['admin', 'manager'];
            $has_write_permission = in_array($user->role, $allowed_write_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_write_permission = $has_write_permission || 
                                    in_array('edit_products', $user->permissions) || 
                                    in_array('manage_products', $user->permissions);
        }

        if (!$has_write_permission) {
            error_log('[BJT_Relation_Controller] User does not have write permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to create or update relations.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Relation_Controller] Write permission granted for user: ' . $user->username);
        return true;
    }

    /**
     * Checks if the current user has permission to delete relations.
     *
     * @param WP_REST_Request $request Full data about the request.
     * @return true|WP_Error True if the request has delete access, WP_Error object otherwise.
     */
    public function check_delete_permission($request) {
        error_log('[BJT_Relation_Controller] Checking delete permission');
        
        // Using BJT Auth Controller instead of WordPress capabilities
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            } else {
                error_log('[BJT_Relation_Controller] BJT_Auth_Controller class file not found at: ' . $auth_controller_path);
                return new WP_Error('rest_controller_not_found', 'Authentication controller not found.', ['status' => 500]);
            }
        }
        
        if (!class_exists('BJT_Auth_Controller')) {
            error_log('[BJT_Relation_Controller] BJT_Auth_Controller class still not found after include attempt');
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller class not loadable.', ['status' => 500]);
        }

        $auth_controller = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);

        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            error_log('[BJT_Relation_Controller] Authentication failed: ' . $is_authenticated->get_error_message());
            return $is_authenticated;
        }
        
        if (!$is_authenticated) {
            error_log('[BJT_Relation_Controller] User not authenticated');
            return new WP_Error('rest_not_logged_in', __('User not authenticated.'), ['status' => 401]);
        }

        // 使用BJT用户角色系统检查权限
        $user = $GLOBALS['bjt_current_user'];
        if (!$user) {
            error_log('[BJT_Relation_Controller] No current user found in globals');
            return new WP_Error('rest_forbidden', __('User information not available.', 'bjt'), ['status' => 403]);
        }

        // 检查用户状态
        if ($user->status !== 'active') {
            error_log('[BJT_Relation_Controller] User is not active: ' . $user->username);
            return new WP_Error('rest_forbidden', __('Your account is not active.', 'bjt'), ['status' => 403]);
        }

        // 检查用户角色 - 只有admin可以删除relations
        $has_delete_permission = false;
        if (isset($user->role)) {
            $allowed_delete_roles = ['admin'];
            $has_delete_permission = in_array($user->role, $allowed_delete_roles);
        }

        // 检查用户权限
        if (isset($user->permissions) && is_array($user->permissions)) {
            $has_delete_permission = $has_delete_permission || 
                                     in_array('delete_products', $user->permissions) || 
                                     in_array('manage_products', $user->permissions);
        }

        if (!$has_delete_permission) {
            error_log('[BJT_Relation_Controller] User does not have delete permission: ' . $user->username . ', role: ' . $user->role);
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to delete relations.', 'bjt'),
                ['status' => 403, 'success' => false]
            );
        }

        error_log('[BJT_Relation_Controller] Delete permission granted for user: ' . $user->username);
        return true;
    }

} 