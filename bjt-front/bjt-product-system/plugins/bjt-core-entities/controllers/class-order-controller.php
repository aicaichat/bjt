<?php
/**
 * 订单控制器
 */
class BJT_Order_Controller extends BJT_API_Controller {
    protected $resource_name = 'orders';
    protected $order_table_name;
    protected $order_item_table_name;
    protected $rest_base = 'orders';

    public function __construct() {
        global $wpdb;
        $this->order_table_name = $wpdb->prefix . 'bjt_orders';
        $this->order_item_table_name = $wpdb->prefix . 'bjt_order_items';
        $this->namespace = 'bjt/v1';
        parent::__construct();
        error_log("BJT_Order_Controller initialized.");
    }

    public function register_routes() {
        // Get list of orders (for current user or all for admin)
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_read_permission'], // Needs to check if user can read their own or all orders
                'args' => $this->get_collection_params(),
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_item'],
                'permission_callback' => [$this, 'check_user_logged_in_permission'], // User must be logged in to create order
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ],
             'schema' => [$this, 'get_public_item_schema'], // Schema for a single order
        ]);

        // Get a specific order
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'get_item'],
                'permission_callback' => [$this, 'check_read_item_permission'], // User can read their own, admin can read any
                'args' => [
                    'id' => [
                        'description' => __('Unique identifier for the order.'),
                        'type' => 'integer',
                        'required' => true,
                        'validate_callback' => 'rest_validate_request_arg',
                    ],
                    'context' => $this->get_context_param(['default' => 'view']),
                     'lang' => [
                        'description'       => __('Language for product names in order items.'),
                        'type'              => 'string',
                         'default'           => 'zh',
                        'sanitize_callback' => 'sanitize_key',
                        'validate_callback' => 'rest_validate_request_arg',
                         'enum'              => ['zh', 'en'],
                    ],
                ],
            ],
            // Potentially add UPDATE for admins to change status
            // [
            //     'methods' => WP_REST_Server::EDITABLE,
            //     'callback' => [$this, 'update_item'],
            //     'permission_callback' => [$this, 'check_admin_permission'], 
            //     'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            // ],
            'schema' => [$this, 'get_public_item_schema'],
        ]);

        // Add UPDATE route for admins to change status etc.
        [
            'methods' => WP_REST_Server::EDITABLE, // Handles PUT/PATCH
            'callback' => [$this, 'update_item'],
            'permission_callback' => [$this, 'check_admin_permission'], 
            'args' => [
                 'id' => [
                   'description' => __('Unique identifier for the order.'),
                   'type' => 'integer',
                   'required' => true,
                   'validate_callback' => 'rest_validate_request_arg',
                ],
                'status' => [
                   'description' => __('New status for the order.'),
                   'type'        => 'string',
                   'required'    => true, // Require status for update
                   'enum'        => ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'failed'],
                   'validate_callback' => 'rest_validate_request_arg',
                   'sanitize_callback' => 'sanitize_key',
                ],
                // Add other editable fields here later if needed (e.g., tracking_number)
                // 'tracking_number' => [ ... ],
            ],
        ],
        'schema' => [$this, 'get_public_item_schema'],
    ]);
    }
    
    /**
     * Schema for a single order item (part of an order).
     */
    public function get_order_item_schema() {
        // This schema describes an item *within* an order, not a cart item.
        // It will store historical price, name etc. at the time of order.
        $schema = [
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'order_item',
            'type'       => 'object',
            'properties' => [
                'order_item_id' => [ // ID from wp_bjt_order_items
                    'description' => __('Unique identifier for the order item.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'product_type' => [
                    'description' => __('Type of the product.'),
                    'type'        => 'string',
                    'enum'        => ['host', 'accessory', 'consumable', 'spare_part'],
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'product_id' => [
                    'description' => __('Original ID of the product.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'part_number' => [
                    'description' => __('Part number of the product at the time of order.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'name' => [ // Name at the time of order, language specific
                    'description' => __('Product name at the time of order.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'quantity' => [
                    'description' => __('Quantity ordered.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'unit_price' => [
                    'description' => __('Price per unit at the time of order.'),
                    'type'        => 'number',
                    'format'      => 'float',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 'line_total' => [
                    'description' => __('Total price for this line item at the time of order.'),
                    'type'        => 'number',
                    'format'      => 'float',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                // No currency per line item, assume order level currency
            ],
        ];
        return $schema;
    }

    /**
     * Schema for the main order object.
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
                    'description' => __('Unique identifier for the order.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'order_number' => [
                    'description' => __('Unique order number/identifier.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true, 
                ],
                'user_id' => [
                    'description' => __('User ID who placed the order.'),
                    'type'        => 'integer',
                    'context'     => ['view', 'edit', 'embed'], // 'edit' only for admins maybe
                    'readonly'    => true,
                ],
                'status' => [
                    'description' => __('Status of the order.'),
                    'type'        => 'string',
                    'enum'        => ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'failed'],
                    'context'     => ['view', 'edit', 'embed'], 
                     // 'default'     => 'pending_payment', // Set on creation
                ],
                'total_amount' => [
                    'description' => __('Total amount for the order.'),
                    'type'        => 'number',
                    'format'      => 'float',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true, 
                ],
                'currency' => [
                    'description' => __('Currency code for the order total.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'items' => [
                    'description' => __('Array of items included in the order.'),
                    'type'        => 'array',
                    'items'       => $this->get_order_item_schema(),
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'shipping_address' => [ // Example: could be a JSON object or string
                    'description' => __('Shipping address for the order.'),
                    'type'        => ['object', 'string'], // Flexible for now
                    'context'     => ['view', 'edit', 'embed'],
                    // Properties for object type could be defined here
                ],
                'billing_address' => [
                    'description' => __('Billing address for the order.'),
                    'type'        => ['object', 'string'],
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'payment_method' => [
                    'description' => __('Payment method used.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'transaction_id' => [
                    'description' => __('Payment transaction ID.'),
                    'type'        => 'string',
                    'context'     => ['view', 'edit', 'embed'],
                ],
                'created_at' => [
                    'description' => __( 'The date the order was created.' ),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                'updated_at' => [
                    'description' => __( 'The date the order was last updated.' ),
                    'type'        => 'string',
                    'format'      => 'date-time',
                    'context'     => ['view', 'edit', 'embed'],
                    'readonly'    => true,
                ],
                 // Input specific fields for CREATABLE (not part of response schema typically)
                'cart_region' => [ // Input only for create_item
                     'description' => __('Region context from the cart for price calculation during order creation.'),
                     'type' => 'string',
                     'required' => false, // If not provided, might use user default or cart stored region
                     'arg_options' => [
                        'sanitize_callback' => 'sanitize_key',
                     ]
                ],
                 'cart_lang' => [ // Input only for create_item
                     'description' => __('Language context from the cart for item name recording.'),
                     'type' => 'string',
                     'default' => 'zh',
                     'arg_options' => [
                        'sanitize_callback' => 'sanitize_key',
                     ]
                ]
            ],
             // Define required fields for creation if they differ from general schema requirements
            // 'required' => ['user_id', 'status', 'total_amount', 'currency', 'items'] // Example for internal creation
        ];
        $this->schema = $schema;
        return $this->add_additional_fields_schema($this->schema);
    }

    public function get_collection_params() {
        $params = parent::get_collection_params();
        $params['user_id'] = [
            'description'       => __('Filter orders by user ID (admin only).'),
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'validate_callback' => 'rest_validate_request_arg',
        ];
        $params['status'] = [
            'description'       => __('Filter orders by status.'),
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_key',
            'validate_callback' => 'rest_validate_request_arg',
            'enum'              => ['pending_payment', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'failed'],
        ];
        $params['orderby']['enum'] = array_merge($params['orderby']['enum'], ['order_number', 'status', 'total_amount']);
        return $params;
    }
    
    // --- Placeholder CRUD Methods ---
    public function get_items(WP_REST_Request $request) {
        global $wpdb;
        // Permission checks are handled by the 'check_read_permission' callback
        $current_user_id = get_current_user_id();
        $is_admin = current_user_can('manage_options');

        // Prepare args for query
        $args = [];
        $params = $this->get_collection_params();
        foreach ($params as $key => $value) {
            if (isset($request[$key])) {
                $args[$key] = $request[$key];
            }
        }

        // Force user_id filter for non-admins
        if (!$is_admin) {
            $args['user_id'] = $current_user_id;
        } elseif (isset($args['user_id']) && !is_numeric($args['user_id'])) {
            // If admin provided non-numeric user_id, treat as invalid
            unset($args['user_id']);
        }
        
        // Build WHERE clauses
        $where_clauses = ["1=1"];
        $sql_params = [];

        if (!empty($args['user_id'])) {
            $where_clauses[] = "user_id = %d";
            $sql_params[] = absint($args['user_id']);
        }

        if (!empty($args['status'])) {
            $where_clauses[] = "status = %s";
            $sql_params[] = sanitize_key($args['status']);
        }

        if (!empty($args['search'])) {
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            // Search by order_number or maybe user info (if joined)
            $where_clauses[] = "(order_number LIKE %s)"; 
            $sql_params[] = $search_term;
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Prepare pagination
        $page = isset($args['page']) ? absint($args['page']) : 1;
        $per_page = isset($args['per_page']) ? absint($args['per_page']) : $params['per_page']['default'];
        $offset = ($page - 1) * $per_page;

        // Prepare ordering
        $orderby = isset($args['orderby']) ? sanitize_key($args['orderby']) : 'id';
        $order = isset($args['order']) ? strtoupper($args['order']) : 'DESC';
        // Validate orderby against allowed columns
        $allowed_orderby = ['id', 'order_number', 'status', 'total_amount', 'created_at', 'updated_at'];
        if (!in_array($orderby, $allowed_orderby)) {
            $orderby = 'id'; // Default to id if invalid
        }
        if ($order !== 'ASC' && $order !== 'DESC') {
            $order = 'DESC'; // Default to DESC if invalid
        }
        
        $prepared_where_sql = $wpdb->prepare($where_sql, $sql_params);

        // Get total items count
        $total_items_sql = "SELECT COUNT(id) FROM {$this->order_table_name} WHERE {$prepared_where_sql}";
        $total_items = (int) $wpdb->get_var($total_items_sql);

        // Get order IDs for the current page
        $orders_sql = "SELECT * FROM {$this->order_table_name} WHERE {$prepared_where_sql} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d";
        $orders_db = $wpdb->get_results($wpdb->prepare($orders_sql, $per_page, $offset));

        $order_ids = wp_list_pluck($orders_db, 'id');
        $all_order_items = [];

        // Fetch all items for the retrieved orders in one go
        if (!empty($order_ids)) {
            $order_ids_placeholder = implode(',', array_fill(0, count($order_ids), '%d'));
            $items_sql = "SELECT * FROM {$this->order_item_table_name} WHERE order_id IN ({$order_ids_placeholder})";
            $all_order_items_db = $wpdb->get_results($wpdb->prepare($items_sql, $order_ids));
            
            // Map items to their order ID
            foreach($all_order_items_db as $item) {
                if (!isset($all_order_items[$item->order_id])) {
                    $all_order_items[$item->order_id] = [];
                }
                $all_order_items[$item->order_id][] = $item;
            }
        }

        // Prepare response data
        $response_data = [];
        foreach ($orders_db as $order) {
            // Assign the fetched items to the order object
            $order->items = isset($all_order_items[$order->id]) ? $all_order_items[$order->id] : [];
            
            $prepared_order = $this->prepare_item_for_response($order, $request);
            $response_data[] = $this->prepare_response_for_collection($prepared_order);
        }

        // Create response object
        $response = rest_ensure_response($response_data);

        // Calculate pagination headers
        $max_pages = ceil($total_items / $per_page);
        $response->header('X-WP-Total', $total_items);
        $response->header('X-WP-TotalPages', $max_pages);

        // Add Link headers
        $base = add_query_arg($request->get_query_params(), rest_url(sprintf('%s/%s', $this->namespace, $this->rest_base)));
        if ($page > 1) {
            $prev_page = $page - 1;
            $response->link_header('prev', add_query_arg('page', $prev_page, $base));
        }
        if ($max_pages > $page) {
            $next_page = $page + 1;
            $response->link_header('next', add_query_arg('page', $next_page, $base));
        }

        return $response;
    }

    public function get_item(WP_REST_Request $request) {
        // Permission check is handled by 'check_read_item_permission' callback in register_routes
        $order_id = absint($request['id']);
        if ($order_id <= 0) {
            return new WP_Error('rest_invalid_id', __('Invalid order ID.'), ['status' => 400]);
        }

        // Use the helper to get the raw order object with items
        $order = $this->get_order_object($order_id);
        if (is_wp_error($order)) {
            // Error occurred (e.g., not found)
            return $order;
        }

        // Prepare the response using the standard formatter
        $response = $this->prepare_item_for_response($order, $request);
        return rest_ensure_response($response);
    }

    public function create_item(WP_REST_Request $request) {
        global $wpdb;
        $user_id = get_current_user_id();
        if (!$user_id) {
            return $this->error_response('User not logged in.', 'rest_not_logged_in', 401);
        }

        // Get optional parameters from request (e.g., addresses, notes)
        $params = $request->get_json_params();
        if (null === $params) $params = $request->get_body_params();
        
        $shipping_address = isset($params['shipping_address']) ? wp_json_encode($params['shipping_address']) : null;
        $billing_address = isset($params['billing_address']) ? wp_json_encode($params['billing_address']) : null;
        $payment_method = isset($params['payment_method']) ? sanitize_text_field($params['payment_method']) : null;
        $region = isset($params['cart_region']) ? sanitize_key($params['cart_region']) : null;
        $lang = isset($params['cart_lang']) ? sanitize_key($params['cart_lang']) : 'zh';
        
        // If region is not provided, try getting user's default region (placeholder)
        if (!$region) {
            // TODO: Implement logic to get user's default region
            $region = 'CN'; // Default to CN for now
        }

        // 1. Get cart items for the user
        $cart_table = $wpdb->prefix . 'bjt_cart_items';
        $cart_items_db = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$cart_table} WHERE user_id = %d",
            $user_id
        ));

        if (empty($cart_items_db)) {
            return $this->error_response('Cart is empty. Cannot create order.', 'cart_empty', 400);
        }

        $order_items_data = [];
        $order_total_amount = 0.0;
        $order_currency = '';
        $validation_errors = [];

        // 2. Validate cart items and calculate totals
        foreach ($cart_items_db as $cart_item) {
            $part_number = $cart_item->part_number;
            $product_type = $cart_item->product_type;
            $quantity = (int) $cart_item->quantity;
            $product_id = (int) $cart_item->product_id; // Get product_id from cart item

            // Fetch current details (price, name, stock)
            $price_info = $this->get_product_price($part_number, $product_type, $region, $quantity); 
            $inventory_info = $this->get_product_inventory($product_id, $product_type, $region);
            
            // Name/image lookup still uses part_number based on product tables
            $name_info = $this->get_product_name_image($part_number, $product_type, $lang); 

            // Validate stock
            if ($inventory_info['status'] === 'out_of_stock' || $inventory_info['quantity'] < $quantity) {
                $validation_errors[] = "Item '{$part_number}' ({$name_info['name']}) is out of stock or insufficient quantity (needs {$quantity}, available {$inventory_info['quantity']}).";
                continue; // Skip this item for order creation if invalid
            }

            // Validate price
            if ($price_info['price'] === null || $price_info['currency'] === null) {
                 $validation_errors[] = "Could not determine price for item '{$part_number}'.";
                 continue;
            }

            // Set order currency based on first valid item
            if (empty($order_currency)) {
                $order_currency = $price_info['currency'];
            } elseif ($order_currency !== $price_info['currency']) {
                // Handle currency mismatch if necessary (e.g., error or convert)
                $validation_errors[] = "Currency mismatch detected between items.";
                continue;
            }
            
            $unit_price = (float) $price_info['price'];
            $line_total = $unit_price * $quantity;
            $order_total_amount += $line_total;

            $order_items_data[] = [
                'product_id' => $product_id,
                'product_type' => $product_type,
                'part_number' => $part_number,
                'name' => $name_info['name'] ?? 'N/A', // Store name at time of order
                'quantity' => $quantity,
                'unit_price' => $unit_price,
                'line_total' => $line_total,
                'product_line_id' => $this->get_product_line_id_from_part($part_number, $product_type) // Helper needed
            ];
        }

        // If validation errors occurred
        if (!empty($validation_errors)) {
             return $this->error_response('Order validation failed: ' . implode('; ', $validation_errors), 'order_validation_failed', 400);
        }

        // If all items were invalid (e.g., out of stock)
        if (empty($order_items_data)) {
            return $this->error_response('No valid items found to create an order.', 'no_valid_items', 400);
        }

        // 3. Generate Order Number
        $order_number = $this->generate_order_number();

        // 4. Start Transaction
        $wpdb->query('START TRANSACTION');

        try {
            // 5. Insert into wp_bjt_orders
            $current_time = current_time('mysql', 1);
            $order_data = [
                'user_id' => $user_id,
                'order_number' => $order_number,
                'total_amount' => round($order_total_amount, 2),
                'currency' => $order_currency,
                'status' => 'pending_payment', // Default status
                'shipping_address' => $shipping_address,
                'billing_address' => $billing_address,
                'payment_method' => $payment_method,
                'created_at' => $current_time,
                'updated_at' => $current_time,
            ];
            $order_result = $wpdb->insert($this->order_table_name, $order_data);

            if (!$order_result) {
                throw new Exception('Failed to insert order header: ' . $wpdb->last_error);
            }
            $order_id = $wpdb->insert_id;

            // 6. Insert into wp_bjt_order_items
            foreach ($order_items_data as $item_data) {
                $item_insert_data = [
                    'order_id' => $order_id,
                    'product_line_id' => $item_data['product_line_id'] ?? 0, // Need to get this correctly
                    'product_id' => $item_data['product_id'],
                    'product_type' => $item_data['product_type'],
                    'part_number' => $item_data['part_number'],
                    'name' => $item_data['name'],
                    'quantity' => $item_data['quantity'],
                    'unit_price' => $item_data['unit_price'],
                    'line_total' => $item_data['line_total'],
                    'created_at' => $current_time, // Use order creation time
                    'updated_at' => $current_time,
                ];
                $item_result = $wpdb->insert($this->order_item_table_name, $item_insert_data);
                if (!$item_result) {
                     throw new Exception('Failed to insert order item (' . $item_data['part_number'] . '): ' . $wpdb->last_error);
                }
            }

            // 7. Clear Cart (Optional - maybe make configurable)
            $clear_result = $wpdb->delete($cart_table, ['user_id' => $user_id], ['%d']);
            if ($clear_result === false) {
                 // Log warning, but don't fail the order creation
                 error_log("Warning: Failed to clear cart for user {$user_id} after order {$order_id} creation.");
            }
            
            // 8. Commit Transaction
            $wpdb->query('COMMIT');

        } catch (Exception $e) {
            // 9. Rollback on error
            $wpdb->query('ROLLBACK');
            error_log("Order creation failed: " . $e->getMessage());
            return $this->error_response('Order creation failed due to a database error: ' . $e->getMessage(), 'order_creation_db_error', 500);
        }

        // 10. Fetch and return the created order
        $request->set_param('context', 'edit'); // Use edit context to get all fields back
        $new_order = $this->get_order_object($order_id); // Fetch the complete order object
        if (is_wp_error($new_order)) {
            return $this->error_response('Order created, but failed to retrieve details.', 'retrieve_error_after_create', 500);
        }

        $response = $this->prepare_item_for_response($new_order, $request);
        $response = rest_ensure_response($response);
        $response->set_status(201); // 201 Created
        $response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $order_id)));
        
        return $response;
    }

    // --- Helper methods needed for create_item ---

    /**
     * Get product price based on part number, region, and quantity.
     * (Simplified - needs proper implementation considering user roles/tiers)
     */
    protected function get_product_price($part_number, $region, $quantity = 1) {
        global $wpdb;
        $price_table = $wpdb->prefix . 'bjt_prices';
        
        // Simple lookup - assumes price table stores part_number directly
        // Needs adjustment based on actual price table structure (might use target_id + target_type)
        $price_row = $wpdb->get_row($wpdb->prepare(
            "SELECT base_price, currency FROM {$price_table} WHERE part_number = %s AND region = %s ORDER BY min_quantity DESC LIMIT 1", // Simplistic lookup
            $part_number, $region
        ));

        if ($price_row) {
            return ['price' => (float) $price_row->base_price, 'currency' => $price_row->currency];
        }
        return ['price' => null, 'currency' => null]; 
    }
    
     /**
     * Get product inventory status and quantity.
     * (Simplified - needs proper implementation)
     */
    protected function get_product_inventory($part_number, $region) {
        global $wpdb;
        $inventory_table = $wpdb->prefix . 'bjt_inventory';
         
         // Simple lookup - needs adjustment based on actual inventory table structure
         $inv_row = $wpdb->get_row($wpdb->prepare(
            "SELECT quantity, status FROM {$inventory_table} WHERE part_number = %s AND region = %s LIMIT 1",
            $part_number, $region
         ));

        if ($inv_row) {
             $status = 'in_stock';
             $available_qty = (int) $inv_row->quantity;
             
             if ($inv_row->status !== 'active' && $inv_row->status !== 'in_stock') { // Assuming 'active' means available
                 $status = $inv_row->status; // e.g., out_of_stock, discontinued
             } elseif ($available_qty <= 0) {
                 $status = 'out_of_stock';
             } elseif ($available_qty < 10) { // Example threshold for low stock
                 $status = 'low_stock';
             }
             return ['quantity' => $available_qty, 'status' => $status];
        }
        return ['quantity' => 0, 'status' => 'unknown'];
    }

    /**
     * Get product name and image URL.
     * (Simplified - needs proper implementation matching cart controller logic)
     */
     protected function get_product_name_image($part_number, $product_type, $lang = 'zh') {
        global $wpdb;
        $name_col = ($lang === 'en') ? 'name_en' : 'name_zh';
        $table_name = '';
        $image_col = 'image_url';
        
         switch ($product_type) {
            case 'host': $table_name = $wpdb->prefix . 'bjt_parts'; break;
            case 'accessory': $table_name = $wpdb->prefix . 'bjt_accessories'; break;
            case 'consumable': $table_name = $wpdb->prefix . 'bjt_consumables'; break;
            case 'spare_part': $table_name = $wpdb->prefix . 'bjt_spare_parts'; break;
            default: return ['name' => 'Invalid Type', 'image_url' => null];
        }

        $product = $wpdb->get_row($wpdb->prepare(
            "SELECT {$name_col}, {$image_col} FROM {$table_name} WHERE part_number = %s", 
            $part_number
        ));
        
        if ($product) {
             return [
                 'name' => $product->$name_col ?? 'Name N/A', 
                 'image_url' => $product->$image_col ?? null
             ];
        } 
        return ['name' => 'Not Found', 'image_url' => null];
    }
    
    /**
     * Get product line ID from part number and type.
     * (Needs implementation based on DB structure)
     */
    protected function get_product_line_id_from_part($part_number, $product_type) {
        global $wpdb;
         $table_name = '';
         switch ($product_type) {
            case 'host': $table_name = $wpdb->prefix . 'bjt_parts'; break;
            case 'accessory': $table_name = $wpdb->prefix . 'bjt_accessories'; break;
            case 'consumable': $table_name = $wpdb->prefix . 'bjt_consumables'; break;
            case 'spare_part': $table_name = $wpdb->prefix . 'bjt_spare_parts'; break;
            default: return 0;
        }
        $product_line_id = $wpdb->get_var($wpdb->prepare(
            "SELECT product_line_id FROM {$table_name} WHERE part_number = %s LIMIT 1", 
            $part_number
        ));
        return $product_line_id ? (int)$product_line_id : 0;
    }

    /**
     * Generates a unique order number.
     */
    protected function generate_order_number() {
        // Example: ORD-YYYYMMDD-RandomString
        $date_part = date('Ymd');
        $random_part = strtoupper(substr(md5(uniqid(rand(), true)), 0, 6)); 
        return 'ORD-' . $date_part . '-' . $random_part;
        // TODO: Add check to ensure uniqueness in wp_bjt_orders table, regenerate if collision occurs
    }
    
    /**
     * Retrieves a single order object from the database.
     * This helper will be used by get_item and create_item.
     */
    protected function get_order_object($id) {
        global $wpdb;
        $order = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->order_table_name} WHERE id = %d",
            $id
        ));
        if (!$order) {
            return new WP_Error('rest_not_found', __('Order not found.'), ['status' => 404]);
        }
        
        // Fetch associated items
        $order->items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->order_item_table_name} WHERE order_id = %d",
            $id
        ));
        return $order; // Return the raw DB object(s)
    }
    
    /**
     * Prepares a single order output for response.
     *
     * @param object $item DB object.
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response Response object.
     */
     public function prepare_item_for_response($item, $request) {
        $order_data = (array)$item; // Cast DB row to array
        $schema = $this->get_item_schema();
        $context = !empty($request['context']) ? $request['context'] : 'view';
        
        // Format order items
        $formatted_items = [];
        if (!empty($order_data['items']) && is_array($order_data['items'])) {
            $item_schema_props = $this->get_order_item_schema()['properties'];
            foreach ($order_data['items'] as $order_item_db) {
                 $order_item_data = (array)$order_item_db;
                 // Rename DB id to order_item_id for API response
                 if(isset($order_item_data['id'])) {
                    $order_item_data['order_item_id'] = (int) $order_item_data['id'];
                    unset($order_item_data['id']);
                 }
                 // Remove fields not needed in response or based on context
                 unset($order_item_data['order_id']); 
                 unset($order_item_data['product_line_id']); // Usually internal
                 unset($order_item_data['created_at']); 
                 unset($order_item_data['updated_at']);
                 
                 // Apply context filtering to order item
                 $filtered_item_data = $this->filter_response_by_context($order_item_data, $item_schema_props, $context);
                 $formatted_items[] = $filtered_item_data;
            }
        }
        $order_data['items'] = $formatted_items;

        // Handle addresses (decode JSON if stored as JSON)
        if (!empty($order_data['shipping_address']) && is_string($order_data['shipping_address'])) {
            $decoded = json_decode($order_data['shipping_address'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                 $order_data['shipping_address'] = $decoded;
            }
        }
        if (!empty($order_data['billing_address']) && is_string($order_data['billing_address'])) {
            $decoded = json_decode($order_data['billing_address'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                 $order_data['billing_address'] = $decoded;
            }
        }
        
        // Apply context filtering to the main order data
        $data = $this->filter_response_by_context($order_data, $schema['properties'], $context);

        $response = rest_ensure_response($data);
        $response->add_links($this->prepare_links($item));
        
        return $response;
    }
    
    /**
     * Prepare links for the request.
     *
     * @param object $item DB object.
     * @return array Links for the response.
     */
    protected function prepare_links($item) {
        $base = sprintf('%s/%s', $this->namespace, $this->rest_base);
        $links = [
            'self' => [
                'href' => rest_url(trailingslashit($base) . $item->id),
            ],
            'collection' => [
                'href' => rest_url($base),
            ],
            // Add link to user if needed
            // 'customer' => [
            //     'href' => rest_url('wp/v2/users/' . $item->user_id),
            //     'embeddable' => true,
            // ],
        ];
        return $links;
    }

    public function update_item(WP_REST_Request $request) {
        global $wpdb;
        // Permission is handled by check_admin_permission
        $order_id = absint($request['id']);
        if ($order_id <= 0) {
            return new WP_Error('rest_invalid_id', __('Invalid order ID.'), ['status' => 400]);
        }
        
        // Fetch the existing order to ensure it exists
        $order = $this->get_order_object($order_id);
        if (is_wp_error($order)) {
            return $order; // Return 404 if not found
        }

        $params = $request->get_json_params();
        if (null === $params) $params = $request->get_body_params();
        
        $data_to_update = [];
        $schema = $this->get_item_schema();
        
        // Update status if provided and valid
        if (isset($params['status'])) {
            $new_status = sanitize_key($params['status']);
            if (!in_array($new_status, $schema['properties']['status']['enum'])) {
                 return new WP_Error('rest_invalid_param', __('Invalid order status provided.'), ['status' => 400, 'param' => 'status']);
            }
            if ($order->status !== $new_status) {
                $data_to_update['status'] = $new_status;
            }
        }
        
        // Add other updatable fields here (e.g., tracking_number)
        // if (isset($params['tracking_number'])) {
        //     $data_to_update['tracking_number'] = sanitize_text_field($params['tracking_number']);
        // }

        // If no data needs updating, return the current item
        if (empty($data_to_update)) {
            $response = $this->prepare_item_for_response($order, $request);
            return rest_ensure_response($response);
        }

        // Add updated_at timestamp
        $data_to_update['updated_at'] = current_time('mysql', 1);

        // Perform the update
        $result = $wpdb->update(
            $this->order_table_name,
            $data_to_update, 
            ['id' => $order_id], // WHERE clause
            $this->get_wpdb_data_formats($data_to_update), // Data formats
            ['%d'] // WHERE format
        );
        
        if (false === $result) {
            error_log('BJT_Order_Controller DB Update Error: ' . $wpdb->last_error);
            return new WP_Error('rest_db_error', __('Failed to update order.'), ['status' => 500]);
        }
        
        // Fetch the updated order object
        $updated_order = $this->get_order_object($order_id);
         if (is_wp_error($updated_order)) {
            // Should not happen if update succeeded, but handle anyway
            return $this->error_response('Order updated, but failed to retrieve details.', 'retrieve_error_after_update', 500);
        }

        // Prepare and return response
        $response = $this->prepare_item_for_response($updated_order, $request);
        return rest_ensure_response($response);
    }

    // public function delete_item(WP_REST_Request $request) { ... } // Orders usually not deleted, but cancelled/status changed

    // --- Permission Checks ---
    public function check_user_logged_in_permission(WP_REST_Request $request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_not_logged_in', __('You are not currently logged in.'), ['status' => 401]);
        }
        return true;
    }

    public function check_read_permission(WP_REST_Request $request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_not_logged_in', __('You are not currently logged in.'), ['status' => 401]);
        }
        // Allow users to see their own orders. Admins can see all if user_id param is used.
        if (current_user_can('manage_options') || empty($request['user_id']) || get_current_user_id() == $request['user_id']) {
            return true;
        }
        return new WP_Error('rest_forbidden', __('You cannot view these orders.'), ['status' => 403]);
    }

    public function check_read_item_permission(WP_REST_Request $request) {
        global $wpdb;
        if (!is_user_logged_in()) {
            return new WP_Error('rest_not_logged_in', __('You are not currently logged in.'), ['status' => 401]);
        }
        $order_id = absint($request['id']);
        $order = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM {$this->order_table_name} WHERE id = %d", $order_id));
        if (!$order) {
            return new WP_Error('rest_not_found', __('Order not found.'), ['status' => 404]);
        }
        if (current_user_can('manage_options') || get_current_user_id() == $order->user_id) {
            return true;
        }
        return new WP_Error('rest_forbidden', __('You cannot view this order.'), ['status' => 403]);
    }

    /**
     * Check if the current user has admin privileges.
     */
    public function check_admin_permission(WP_REST_Request $request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_not_logged_in', __('You are not currently logged in.'), ['status' => 401]);
        }
        if (!current_user_can('manage_options')) { // 'manage_options' is a standard capability for admins
            return new WP_Error('rest_forbidden', __('You do not have permission to modify orders.'), ['status' => 403]);
        }
        return true;
    }

    // --- Helper methods ---
    // Helper to determine wpdb data formats for update/insert
    protected function get_wpdb_data_formats($data) {
        $formats = [];
        foreach ($data as $key => $value) {
            $formats[$key] = $this->get_wpdb_format_for_type($value);
        }
        return $formats;
    }

    protected function get_wpdb_format_for_type($value) {
        switch (gettype($value)) {
            case 'integer':
                return '%d';
            case 'string':
                return '%s';
            case 'float':
                return '%f';
            case 'boolean':
                return '%d';
            default:
                return '%s'; // Default to string format
        }
    }

    // protected function map_request_to_db_order($request, $is_update = false) { ... }
    // protected function map_cart_item_to_order_item($cart_item_data, $order_id, $lang) { ... }
    // protected function prepare_order_for_response($order_db, $order_items_db, $request) { ... }

}
?> 