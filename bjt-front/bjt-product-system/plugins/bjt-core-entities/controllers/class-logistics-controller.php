<?php
/**
 * BJT Logistics Tracking Controller
 * 
 * Handles logistics tracking operations including:
 * - Tracking number management
 * - Logistics provider management
 * - Shipment tracking and updates
 * - Delivery status management
 */

class BJT_Logistics_Controller extends BJT_API_Controller {
    public $resource_name = 'logistics';
    protected $tracking_table;
    protected $providers_table;
    protected $events_table;
    protected $items_table;
    protected $settings_table;
    protected $orders_table;
    
    public function __construct() {
        global $wpdb;
        $this->tracking_table = $wpdb->prefix . 'bjt_logistics_tracking';
        $this->providers_table = $wpdb->prefix . 'bjt_logistics_providers';
        $this->events_table = $wpdb->prefix . 'bjt_tracking_events';
        $this->items_table = $wpdb->prefix . 'bjt_shipment_items';
        $this->settings_table = $wpdb->prefix . 'bjt_logistics_settings';
        $this->orders_table = $wpdb->prefix . 'bjt_orders';
        $this->namespace = 'bjt/v1';
        parent::__construct();
    }
    
    /**
     * Register API routes
     */
    public function register_routes() {
        // Tracking management routes
        register_rest_route($this->namespace, '/logistics/tracking', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_tracking_list'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args' => array(
                    'page' => array(
                        'default' => 1,
                        'sanitize_callback' => 'absint',
                    ),
                    'per_page' => array(
                        'default' => 20,
                        'sanitize_callback' => 'absint',
                    ),
                    'search' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'status' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'provider' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'date_from' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'date_to' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_tracking'),
                'permission_callback' => array($this, 'check_write_permission'),
                'args' => array(
                    'order_id' => array(
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ),
                    'tracking_number' => array(
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'provider_code' => array(
                        'required' => true,
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'shipping_method' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'estimated_delivery_date' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                ),
            ),
        ));
        
        // Single tracking item routes
        register_rest_route($this->namespace, '/logistics/tracking/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_tracking_item'),
                'permission_callback' => array($this, 'check_read_permission'),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_tracking'),
                'permission_callback' => array($this, 'check_write_permission'),
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_tracking'),
                'permission_callback' => array($this, 'check_delete_permission'),
            ),
        ));
        
        // Track by number route
        register_rest_route($this->namespace, '/logistics/track/(?P<tracking_number>[a-zA-Z0-9-_]+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'track_by_number'),
            'permission_callback' => '__return_true', // Public endpoint
        ));
        
        // Update tracking status
        register_rest_route($this->namespace, '/logistics/tracking/(?P<id>\d+)/update', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'update_tracking_status'),
            'permission_callback' => array($this, 'check_write_permission'),
            'args' => array(
                'status' => array(
                    'required' => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'event_description' => array(
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'location' => array(
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));
        
        // Bulk tracking update
        register_rest_route($this->namespace, '/logistics/tracking/bulk-update', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'bulk_update_tracking'),
            'permission_callback' => array($this, 'check_admin_permission'),
            'args' => array(
                'tracking_numbers' => array(
                    'required' => true,
                    'type' => 'array',
                ),
            ),
        ));
        
        // Providers management
        register_rest_route($this->namespace, '/logistics/providers', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_providers'),
                'permission_callback' => array($this, 'check_read_permission'),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_provider'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));
        
        // Single provider routes
        register_rest_route($this->namespace, '/logistics/providers/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_provider'),
                'permission_callback' => array($this, 'check_read_permission'),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_provider'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_provider'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));
        
        // Tracking events
        register_rest_route($this->namespace, '/logistics/tracking/(?P<id>\d+)/events', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_tracking_events'),
            'permission_callback' => array($this, 'check_read_permission'),
        ));
        
        // Statistics and reports
        register_rest_route($this->namespace, '/logistics/stats', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_logistics_stats'),
            'permission_callback' => array($this, 'check_read_permission'),
        ));
        
        // Settings management
        register_rest_route($this->namespace, '/logistics/settings', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_settings'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_settings'),
                'permission_callback' => array($this, 'check_admin_permission'),
            ),
        ));
    }
    
    /**
     * Get tracking list with filters and pagination
     */
    public function get_tracking_list($request) {
        global $wpdb;
        
        $page = $request->get_param('page') ?: 1;
        $per_page = min($request->get_param('per_page') ?: 20, 100);
        $offset = ($page - 1) * $per_page;
        
        $search = $request->get_param('search');
        $status = $request->get_param('status');
        $provider = $request->get_param('provider');
        $date_from = $request->get_param('date_from');
        $date_to = $request->get_param('date_to');
        
        // Build WHERE clause
        $where_conditions = array('1=1');
        $where_params = array();
        
        if ($search) {
            $where_conditions[] = "(t.tracking_number LIKE %s OR t.order_number LIKE %s OR t.recipient_name LIKE %s)";
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $where_params[] = $search_term;
            $where_params[] = $search_term;
            $where_params[] = $search_term;
        }
        
        if ($status) {
            $where_conditions[] = "t.status = %s";
            $where_params[] = $status;
        }
        
        if ($provider) {
            $where_conditions[] = "t.provider_code = %s";
            $where_params[] = $provider;
        }
        
        if ($date_from) {
            $where_conditions[] = "t.created_at >= %s";
            $where_params[] = $date_from . ' 00:00:00';
        }
        
        if ($date_to) {
            $where_conditions[] = "t.created_at <= %s";
            $where_params[] = $date_to . ' 23:59:59';
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // Get total count
        $count_query = "SELECT COUNT(*) FROM {$this->tracking_table} t WHERE {$where_clause}";
        if (!empty($where_params)) {
            $total_items = $wpdb->get_var($wpdb->prepare($count_query, $where_params));
        } else {
            $total_items = $wpdb->get_var($count_query);
        }
        
        // Get tracking items with provider info
        $query = "
            SELECT t.*, p.provider_name, p.provider_name_cn, p.tracking_url_template,
                   o.user_id, o.total_amount, o.currency
            FROM {$this->tracking_table} t
            LEFT JOIN {$this->providers_table} p ON t.provider_id = p.id
            LEFT JOIN {$this->orders_table} o ON t.order_id = o.id
            WHERE {$where_clause}
            ORDER BY t.created_at DESC
            LIMIT %d OFFSET %d
        ";
        
        $query_params = array_merge($where_params, array($per_page, $offset));
        $tracking_items = $wpdb->get_results($wpdb->prepare($query, $query_params), ARRAY_A);
        
        // Format tracking URLs
        foreach ($tracking_items as &$item) {
            if ($item['tracking_url_template']) {
                $item['tracking_url'] = str_replace(
                    '{tracking_number}',
                    $item['tracking_number'],
                    $item['tracking_url_template']
                );
            }
        }
        
        return $this->format_response(array(
            'items' => $tracking_items,
            'total' => (int)$total_items,
            'page' => (int)$page,
            'per_page' => (int)$per_page,
            'total_pages' => ceil($total_items / $per_page),
        ));
    }
    
    /**
     * Get single tracking item with events
     */
    public function get_tracking_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        
        // Get tracking item with provider info
        $query = "
            SELECT t.*, p.provider_name, p.provider_name_cn, p.tracking_url_template,
                   o.user_id, o.total_amount, o.currency, o.shipping_address
            FROM {$this->tracking_table} t
            LEFT JOIN {$this->providers_table} p ON t.provider_id = p.id
            LEFT JOIN {$this->orders_table} o ON t.order_id = o.id
            WHERE t.id = %d
        ";
        
        $tracking = $wpdb->get_row($wpdb->prepare($query, $id), ARRAY_A);
        
        if (!$tracking) {
            return $this->format_error_response('Tracking item not found', 'tracking_not_found', 404);
        }
        
        // Get tracking events
        $events_query = "
            SELECT * FROM {$this->events_table}
            WHERE tracking_id = %d
            ORDER BY event_time DESC
        ";
        $tracking['events'] = $wpdb->get_results($wpdb->prepare($events_query, $id), ARRAY_A);
        
        // Get shipment items
        $items_query = "
            SELECT si.*, oi.item_name, oi.price
            FROM {$this->items_table} si
            LEFT JOIN {$wpdb->prefix}bjt_order_items oi ON si.order_item_id = oi.id
            WHERE si.tracking_id = %d
        ";
        $tracking['items'] = $wpdb->get_results($wpdb->prepare($items_query, $id), ARRAY_A);
        
        // Format tracking URL
        if ($tracking['tracking_url_template']) {
            $tracking['tracking_url'] = str_replace(
                '{tracking_number}',
                $tracking['tracking_number'],
                $tracking['tracking_url_template']
            );
        }
        
        return $this->format_response($tracking);
    }
    
    /**
     * Create new tracking record
     */
    public function create_tracking($request) {
        global $wpdb;
        
        try {
            $wpdb->query('START TRANSACTION');
            
            $order_id = $request['order_id'];
            $tracking_number = $request['tracking_number'];
            $provider_code = $request['provider_code'];
            
            // Validate order exists
            $order = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->orders_table} WHERE id = %d",
                $order_id
            ));
            
            if (!$order) {
                throw new Exception('Order not found');
            }
            
            // Get provider info
            $provider = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->providers_table} WHERE provider_code = %s",
                $provider_code
            ));
            
            if (!$provider) {
                throw new Exception('Logistics provider not found');
            }
            
            // Parse shipping address
            $shipping_address = json_decode($order->shipping_address, true);
            
            // Create tracking record
            $tracking_data = array(
                'tracking_number' => $tracking_number,
                'order_id' => $order_id,
                'order_number' => $order->order_number,
                'provider_id' => $provider->id,
                'provider_code' => $provider_code,
                'shipping_method' => $request['shipping_method'] ?: 'standard',
                'status' => 'pending',
                'destination_country' => $shipping_address['country'] ?? '',
                'destination_city' => $shipping_address['city'] ?? '',
                'destination_address' => $shipping_address['address'] ?? '',
                'recipient_name' => $shipping_address['name'] ?? '',
                'recipient_phone' => $shipping_address['phone'] ?? '',
                'estimated_delivery_date' => $request['estimated_delivery_date'] ?: null,
                'tracking_url' => str_replace('{tracking_number}', $tracking_number, $provider->tracking_url_template),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            );
            
            $result = $wpdb->insert($this->tracking_table, $tracking_data);
            
            if ($result === false) {
                throw new Exception('Failed to create tracking record');
            }
            
            $tracking_id = $wpdb->insert_id;
            
            // Update order with tracking info
            $wpdb->update(
                $this->orders_table,
                array(
                    'tracking_number' => $tracking_number,
                    'logistics_provider_id' => $provider->id,
                    'shipping_method' => $tracking_data['shipping_method'],
                    'estimated_delivery_date' => $tracking_data['estimated_delivery_date'],
                    'logistics_status' => 'pending',
                    'status' => 'shipped',
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $order_id)
            );
            
            // Create initial tracking event
            $this->create_tracking_event($tracking_id, $tracking_number, array(
                'event_type' => 'pickup',
                'event_status' => 'pending',
                'event_description' => 'Shipment created',
                'event_description_cn' => '已创建物流单',
                'is_milestone' => true,
            ));
            
            $wpdb->query('COMMIT');
            
            // Get the created tracking record
            $created_tracking = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$this->tracking_table} WHERE id = %d",
                $tracking_id
            ), ARRAY_A);
            
            return $this->format_response($created_tracking, 'Tracking created successfully', true, 201);
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->format_error_response($e->getMessage(), 'create_tracking_failed', 500);
        }
    }
    
    /**
     * Update tracking status
     */
    public function update_tracking_status($request) {
        global $wpdb;
        
        $id = $request['id'];
        $status = $request['status'];
        $event_description = $request['event_description'];
        $location = $request['location'];
        
        // Get tracking record
        $tracking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->tracking_table} WHERE id = %d",
            $id
        ));
        
        if (!$tracking) {
            return $this->format_error_response('Tracking not found', 'tracking_not_found', 404);
        }
        
        try {
            $wpdb->query('START TRANSACTION');
            
            // Update tracking status
            $update_data = array(
                'status' => $status,
                'last_update_time' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            );
            
            if ($status === 'delivered') {
                $update_data['actual_delivery_date'] = current_time('mysql');
            }
            
            $wpdb->update($this->tracking_table, $update_data, array('id' => $id));
            
            // Update order status
            $order_status = $this->map_tracking_status_to_order_status($status);
            $wpdb->update(
                $this->orders_table,
                array(
                    'logistics_status' => $status,
                    'status' => $order_status,
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $tracking->order_id)
            );
            
            // Create tracking event
            $this->create_tracking_event($id, $tracking->tracking_number, array(
                'event_type' => $this->map_status_to_event_type($status),
                'event_status' => $status,
                'event_description' => $event_description ?: $this->get_status_description($status),
                'event_description_cn' => $this->get_status_description_cn($status),
                'location_city' => $location,
                'is_milestone' => in_array($status, ['picked_up', 'in_transit', 'delivered']),
            ));
            
            $wpdb->query('COMMIT');
            
            return $this->format_response(array(
                'tracking_id' => $id,
                'status' => $status,
                'updated_at' => current_time('mysql'),
            ), 'Tracking status updated successfully');
            
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            return $this->format_error_response($e->getMessage(), 'update_tracking_failed', 500);
        }
    }
    
    /**
     * Track by tracking number (public endpoint)
     */
    public function track_by_number($request) {
        global $wpdb;
        
        $tracking_number = $request['tracking_number'];
        
        // Get tracking info with events
        $query = "
            SELECT t.*, p.provider_name, p.provider_name_cn, p.tracking_url_template
            FROM {$this->tracking_table} t
            LEFT JOIN {$this->providers_table} p ON t.provider_id = p.id
            WHERE t.tracking_number = %s
        ";
        
        $tracking = $wpdb->get_row($wpdb->prepare($query, $tracking_number), ARRAY_A);
        
        if (!$tracking) {
            return $this->format_error_response('Tracking number not found', 'tracking_not_found', 404);
        }
        
        // Get tracking events
        $events_query = "
            SELECT event_time, event_status, event_description, event_description_cn,
                   location_city, location_address, event_type, is_milestone
            FROM {$this->events_table}
            WHERE tracking_number = %s
            ORDER BY event_time DESC
        ";
        $tracking['events'] = $wpdb->get_results($wpdb->prepare($events_query, $tracking_number), ARRAY_A);
        
        // Format tracking URL
        if ($tracking['tracking_url_template']) {
            $tracking['tracking_url'] = str_replace(
                '{tracking_number}',
                $tracking_number,
                $tracking['tracking_url_template']
            );
        }
        
        // Remove sensitive information for public endpoint
        unset($tracking['cost_amount']);
        unset($tracking['notes']);
        unset($tracking['metadata']);
        
        return $this->format_response($tracking);
    }
    
    /**
     * Get logistics providers
     */
    public function get_providers($request) {
        global $wpdb;
        
        $country = $request->get_param('country');
        $status = $request->get_param('status') ?: 'active';
        
        $where_conditions = array('status = %s');
        $where_params = array($status);
        
        if ($country) {
            $where_conditions[] = 'country = %s';
            $where_params[] = $country;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        $query = "SELECT * FROM {$this->providers_table} WHERE {$where_clause} ORDER BY provider_name";
        $providers = $wpdb->get_results($wpdb->prepare($query, $where_params), ARRAY_A);
        
        return $this->format_response($providers);
    }
    
    /**
     * Get logistics statistics
     */
    public function get_logistics_stats($request) {
        global $wpdb;
        
        $date_from = $request->get_param('date_from') ?: date('Y-m-01');
        $date_to = $request->get_param('date_to') ?: date('Y-m-d');
        
        // Status distribution
        $status_stats = $wpdb->get_results($wpdb->prepare("
            SELECT status, COUNT(*) as count
            FROM {$this->tracking_table}
            WHERE created_at BETWEEN %s AND %s
            GROUP BY status
        ", $date_from, $date_to), ARRAY_A);
        
        // Provider distribution
        $provider_stats = $wpdb->get_results($wpdb->prepare("
            SELECT p.provider_name, COUNT(*) as count
            FROM {$this->tracking_table} t
            LEFT JOIN {$this->providers_table} p ON t.provider_id = p.id
            WHERE t.created_at BETWEEN %s AND %s
            GROUP BY t.provider_id
            ORDER BY count DESC
        ", $date_from, $date_to), ARRAY_A);
        
        // Delivery performance
        $delivery_stats = $wpdb->get_row($wpdb->prepare("
            SELECT 
                COUNT(*) as total_shipments,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
                AVG(CASE WHEN actual_delivery_date IS NOT NULL 
                    THEN DATEDIFF(actual_delivery_date, created_at) ELSE NULL END) as avg_delivery_days
            FROM {$this->tracking_table}
            WHERE created_at BETWEEN %s AND %s
        ", $date_from, $date_to), ARRAY_A);
        
        return $this->format_response(array(
            'status_distribution' => $status_stats,
            'provider_distribution' => $provider_stats,
            'delivery_performance' => $delivery_stats,
            'date_range' => array(
                'from' => $date_from,
                'to' => $date_to,
            ),
        ));
    }
    
    /**
     * Helper: Create tracking event
     */
    private function create_tracking_event($tracking_id, $tracking_number, $event_data) {
        global $wpdb;
        
        $event_data = array_merge(array(
            'tracking_id' => $tracking_id,
            'tracking_number' => $tracking_number,
            'event_time' => current_time('mysql'),
            'created_at' => current_time('mysql'),
        ), $event_data);
        
        return $wpdb->insert($this->events_table, $event_data);
    }
    
    /**
     * Helper: Map tracking status to order status
     */
    private function map_tracking_status_to_order_status($tracking_status) {
        $status_map = array(
            'pending' => 'processing',
            'picked_up' => 'shipped',
            'in_transit' => 'shipped',
            'out_for_delivery' => 'shipped',
            'delivered' => 'completed',
            'exception' => 'processing',
            'returned' => 'processing',
            'cancelled' => 'cancelled',
        );
        
        return $status_map[$tracking_status] ?? 'processing';
    }
    
    /**
     * Helper: Map status to event type
     */
    private function map_status_to_event_type($status) {
        $type_map = array(
            'pending' => 'pickup',
            'picked_up' => 'pickup',
            'in_transit' => 'transit',
            'out_for_delivery' => 'delivery',
            'delivered' => 'delivery',
            'exception' => 'exception',
            'returned' => 'return',
            'cancelled' => 'info',
        );
        
        return $type_map[$status] ?? 'info';
    }
    
    /**
     * Helper: Get status description
     */
    private function get_status_description($status) {
        $descriptions = array(
            'pending' => 'Shipment pending pickup',
            'picked_up' => 'Package picked up',
            'in_transit' => 'Package in transit',
            'out_for_delivery' => 'Out for delivery',
            'delivered' => 'Package delivered',
            'exception' => 'Delivery exception',
            'returned' => 'Package returned',
            'cancelled' => 'Shipment cancelled',
        );
        
        return $descriptions[$status] ?? 'Status update';
    }
    
    /**
     * Helper: Get Chinese status description
     */
    private function get_status_description_cn($status) {
        $descriptions = array(
            'pending' => '等待揽收',
            'picked_up' => '已揽收',
            'in_transit' => '运输中',
            'out_for_delivery' => '派送中',
            'delivered' => '已签收',
            'exception' => '异常',
            'returned' => '已退回',
            'cancelled' => '已取消',
        );
        
        return $descriptions[$status] ?? '状态更新';
    }
    
    /**
     * Format response helper
     */
    protected function format_response($data, $message = '', $success = true, $status_code = 200) {
        $response_data = array(
            'success' => $success,
            'data' => $data,
        );
        
        if (!empty($message)) {
            $response_data['message'] = $message;
        }
        
        return new WP_REST_Response($response_data, $status_code);
    }
    
    /**
     * Format error response helper
     */
    protected function format_error_response($message, $error_code = 'logistics_error', $status_code = 400) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => $message,
            'code' => $error_code,
        ), $status_code);
    }
    
    /**
     * Permission check helpers
     */
    public function check_read_permission($request) {
        return true; // TODO: Implement proper permission checking
    }
    
    public function check_write_permission($request) {
        return true; // TODO: Implement proper permission checking
    }
    
    public function check_delete_permission($request) {
        return true; // TODO: Implement proper permission checking
    }
    
    public function check_admin_permission($request) {
        return true; // TODO: Implement proper permission checking
    }
} 