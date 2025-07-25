<?php
/**
 * RMA (Return Merchandise Authorization) Controller
 * 
 * Handles CRUD operations for BJT RMA requests
 */

class BJT_RMA_Controller extends BJT_API_Controller {
    public $resource_name = 'rma';
    protected $rma_table_name;
    protected $rma_items_table_name;
    protected $rma_comments_table_name;
    
    public function __construct() {
        global $wpdb;
        $this->rma_table_name = $wpdb->prefix . 'bjt_rma';
        $this->rma_items_table_name = $wpdb->prefix . 'bjt_rma_items';
        $this->rma_comments_table_name = $wpdb->prefix . 'bjt_rma_comments';
        parent::__construct();
    }
    
    /**
     * Register routes
     */
    public function register_routes() {
        // RMA主要端点
        register_rest_route($this->namespace, '/' . $this->resource_name, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_items'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args' => array(
                    'page' => array(
                        'description' => 'Current page of the collection.',
                        'type' => 'integer',
                        'default' => 1,
                        'minimum' => 1,
                        'sanitize_callback' => 'absint',
                    ),
                    'per_page' => array(
                        'description' => 'Maximum number of items to be returned in result set.',
                        'type' => 'integer',
                        'default' => 10,
                        'minimum' => 1,
                        'maximum' => 100,
                        'sanitize_callback' => 'absint',
                    ),
                    'search' => array(
                        'description' => 'Search term.',
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'status' => array(
                        'description' => 'Filter by RMA status.',
                        'type' => 'string',
                        'enum' => array('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled'),
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'order_id' => array(
                        'description' => 'Filter by order ID.',
                        'type' => 'integer',
                        'sanitize_callback' => 'absint',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_item'),
                'permission_callback' => array($this, 'check_create_permission'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
            ),
        ));
        
        // 单个RMA端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_item'),
                'permission_callback' => array($this, 'check_update_permission'),
                'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
            ),
        ));
        
        // RMA留言端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)/comments', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_comments'),
                'permission_callback' => array($this, 'check_read_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ),
                ),
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'create_comment'),
                'permission_callback' => array($this, 'check_comment_permission'),
                'args' => array(
                    'id' => array(
                        'required' => true,
                        'sanitize_callback' => 'absint',
                    ),
                    'content' => array(
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ),
                    'comment_type' => array(
                        'type' => 'string',
                        'enum' => array('comment', 'status_change', 'system_log'),
                        'default' => 'comment',
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'is_internal' => array(
                        'type' => 'boolean',
                        'default' => false,
                    ),
                ),
            ),
        ));
        
        // 附件上传端点
        register_rest_route($this->namespace, '/' . $this->resource_name . '/(?P<id>\d+)/attachments', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'upload_attachment'),
            'permission_callback' => array($this, 'check_upload_permission'),
        ));
    }
    
    /**
     * Get RMA list
     */
    public function get_items($request) {
        global $wpdb;
        
        // Extract pagination parameters
        $page = absint($request->get_param('page') ?: 1);
        $per_page = absint($request->get_param('per_page') ?: 10);
        $per_page = min(max($per_page, 1), 100);
        $offset = ($page - 1) * $per_page;
        
        // Extract filter parameters
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $status = sanitize_text_field($request->get_param('status') ?: '');
        $order_id = absint($request->get_param('order_id') ?: 0);
        
        // Build WHERE clause
        $where_conditions = array('1=1');
        $where_values = array();
        
        // 权限控制：普通用户只能看自己的RMA
        $current_user = $this->get_current_bjt_user();
        if ($current_user && !in_array($current_user->role, array('admin', 'sales'))) {
            $where_conditions[] = "user_id = %d";
            $where_values[] = $current_user->id;
        }
        
        if (!empty($search)) {
            $where_conditions[] = "(rma_number LIKE %s OR order_number LIKE %s OR reason_detail LIKE %s)";
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $where_values[] = $search_term;
            $where_values[] = $search_term;
            $where_values[] = $search_term;
        }
        
        if (!empty($status)) {
            $where_conditions[] = "status = %s";
            $where_values[] = $status;
        }
        
        if ($order_id > 0) {
            $where_conditions[] = "order_id = %d";
            $where_values[] = $order_id;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // Get total count
        $count_query = "SELECT COUNT(id) FROM {$this->rma_table_name} WHERE {$where_clause}";
        if (!empty($where_values)) {
            $total_items = $wpdb->get_var($wpdb->prepare($count_query, $where_values));
        } else {
            $total_items = $wpdb->get_var($count_query);
        }
        
        // Get paginated results
        $query = "SELECT * FROM {$this->rma_table_name} WHERE {$where_clause} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $query_values = array_merge($where_values, array($per_page, $offset));
        
        $rmas = $wpdb->get_results($wpdb->prepare($query, $query_values), ARRAY_A);
        
        // 获取每个RMA的商品项目
        foreach ($rmas as &$rma) {
            $rma['items'] = $this->get_rma_items($rma['id']);
            $rma['attachments'] = json_decode($rma['attachments'], true) ?: array();
            $rma['metadata'] = json_decode($rma['metadata'], true) ?: array();
        }
        
        $total_pages = ceil($total_items / $per_page);
        
        return $this->format_response(array(
            'items' => $rmas,
            'total' => (int)$total_items,
            'page' => (int)$page,
            'page_size' => (int)$per_page,
            'total_pages' => (int)$total_pages
        ));
    }
    
    /**
     * Get single RMA
     */
    public function get_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $rma = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->rma_table_name} WHERE id = %d", $id), ARRAY_A);
        
        if (!$rma) {
            return $this->format_error_response('RMA not found', 'rma_not_found', 404);
        }
        
        // 权限检查：普通用户只能查看自己的RMA
        $current_user = $this->get_current_bjt_user();
        if ($current_user && !in_array($current_user->role, array('admin', 'sales')) && $rma['user_id'] != $current_user->id) {
            return $this->format_error_response('Permission denied', 'permission_denied', 403);
        }
        
        // 获取RMA商品项目
        $rma['items'] = $this->get_rma_items($id);
        $rma['attachments'] = json_decode($rma['attachments'], true) ?: array();
        $rma['metadata'] = json_decode($rma['metadata'], true) ?: array();
        
        return $this->format_response($rma);
    }
    
    /**
     * Create RMA
     */
    public function create_item($request) {
        global $wpdb;
        
        try {
            $current_user = $this->get_current_bjt_user();
            if (!$current_user) {
                return $this->format_error_response('User not authenticated', 'not_authenticated', 401);
            }
            
            // 验证必填字段
            $order_id = absint($request['order_id']);
            $reason_category = sanitize_text_field($request['reason_category']);
            $items = $request['items'] ?: array();
            
            if (!$order_id || !$reason_category || empty($items)) {
                return $this->format_error_response('Missing required fields', 'missing_fields', 400);
            }
            
            // 验证订单是否存在且属于当前用户
            $order = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}bjt_orders WHERE id = %d AND user_id = %d",
                $order_id,
                $current_user->id
            ));
            
            if (!$order) {
                return $this->format_error_response('Order not found or access denied', 'order_not_found', 404);
            }
            
            // 生成RMA编号
            $rma_number = $this->generate_rma_number();
            
            // 计算总退款金额
            $total_refund_amount = 0;
            foreach ($items as $item) {
                $total_refund_amount += floatval($item['refund_amount']);
            }
            
            // 创建RMA记录
            $rma_data = array(
                'rma_number' => $rma_number,
                'order_id' => $order_id,
                'order_number' => $order->order_number,
                'user_id' => $current_user->id,
                'status' => 'pending',
                'reason_category' => $reason_category,
                'reason_detail' => sanitize_textarea_field($request['reason_detail'] ?: ''),
                'total_refund_amount' => $total_refund_amount,
                'warehouse' => sanitize_text_field($request['warehouse'] ?: ''),
                'priority' => sanitize_text_field($request['priority'] ?: 'normal'),
                'attachments' => json_encode($request['attachments'] ?: array()),
                'metadata' => json_encode($request['metadata'] ?: array()),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            );
            
            $result = $wpdb->insert($this->rma_table_name, $rma_data);
            
            if ($result === false) {
                return $this->format_error_response('Failed to create RMA', 'create_failed', 500);
            }
            
            $rma_id = $wpdb->insert_id;
            
            // 创建RMA商品项目
            foreach ($items as $item) {
                $item_data = array(
                    'rma_id' => $rma_id,
                    'order_item_id' => absint($item['order_item_id']),
                    'part_number' => sanitize_text_field($item['part_number']),
                    'product_name' => sanitize_text_field($item['product_name']),
                    'quantity_ordered' => absint($item['quantity_ordered']),
                    'quantity_to_return' => absint($item['quantity_to_return']),
                    'unit_price' => floatval($item['unit_price']),
                    'refund_amount' => floatval($item['refund_amount']),
                    'return_reason' => sanitize_text_field($item['return_reason'] ?: ''),
                    'created_at' => current_time('mysql'),
                );
                
                $wpdb->insert($this->rma_items_table_name, $item_data);
            }
            
            // 创建系统日志
            $this->create_system_comment($rma_id, $current_user->id, 'RMA created');
            
            // 发送邮件通知
            $this->send_rma_notification($rma_id, 'created');
            
            // 获取创建的RMA
            $created_rma = $this->get_rma_by_id($rma_id);
            
            return $this->format_response($created_rma, 'RMA created successfully', true, 201);
            
        } catch (Exception $e) {
            error_log('RMA creation failed: ' . $e->getMessage());
            return $this->format_error_response('RMA creation failed', 'creation_error', 500);
        }
    }
    
    /**
     * Update RMA
     */
    public function update_item($request) {
        global $wpdb;
        
        $id = $request['id'];
        $current_user = $this->get_current_bjt_user();
        
        if (!$current_user) {
            return $this->format_error_response('User not authenticated', 'not_authenticated', 401);
        }
        
        // 获取现有RMA
        $rma = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->rma_table_name} WHERE id = %d", $id));
        
        if (!$rma) {
            return $this->format_error_response('RMA not found', 'rma_not_found', 404);
        }
        
        // 权限检查：只有管理员和销售可以更新RMA状态
        if (!in_array($current_user->role, array('admin', 'sales'))) {
            return $this->format_error_response('Permission denied', 'permission_denied', 403);
        }
        
        $update_data = array();
        $old_status = $rma->status;
        
        // 更新状态
        if (isset($request['status'])) {
            $new_status = sanitize_text_field($request['status']);
            $valid_statuses = array('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled');
            
            if (in_array($new_status, $valid_statuses)) {
                $update_data['status'] = $new_status;
            }
        }
        
        // 更新分配人员
        if (isset($request['assigned_to'])) {
            $update_data['assigned_to'] = absint($request['assigned_to']);
        }
        
        // 更新优先级
        if (isset($request['priority'])) {
            $priority = sanitize_text_field($request['priority']);
            if (in_array($priority, array('low', 'normal', 'high', 'urgent'))) {
                $update_data['priority'] = $priority;
            }
        }
        
        if (empty($update_data)) {
            return $this->format_error_response('No valid fields to update', 'no_update_fields', 400);
        }
        
        $update_data['updated_at'] = current_time('mysql');
        
        $result = $wpdb->update($this->rma_table_name, $update_data, array('id' => $id));
        
        if ($result === false) {
            return $this->format_error_response('Failed to update RMA', 'update_failed', 500);
        }
        
        // 如果状态发生变化，创建状态变更日志
        if (isset($update_data['status']) && $update_data['status'] !== $old_status) {
            $this->create_system_comment(
                $id,
                $current_user->id,
                "Status changed from {$old_status} to {$update_data['status']}",
                'status_change'
            );
            
            // 发送状态变更通知
            $this->send_rma_notification($id, 'status_changed');
        }
        
        // 获取更新后的RMA
        $updated_rma = $this->get_rma_by_id($id);
        
        return $this->format_response($updated_rma, 'RMA updated successfully');
    }
    
    /**
     * Get RMA comments
     */
    public function get_comments($request) {
        global $wpdb;
        
        $rma_id = $request['id'];
        $current_user = $this->get_current_bjt_user();
        
        if (!$current_user) {
            return $this->format_error_response('User not authenticated', 'not_authenticated', 401);
        }
        
        // 验证RMA存在且用户有权限访问
        $rma = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->rma_table_name} WHERE id = %d", $rma_id));
        
        if (!$rma) {
            return $this->format_error_response('RMA not found', 'rma_not_found', 404);
        }
        
        // 权限检查
        if (!in_array($current_user->role, array('admin', 'sales')) && $rma->user_id != $current_user->id) {
            return $this->format_error_response('Permission denied', 'permission_denied', 403);
        }
        
        // 构建查询条件
        $where_conditions = array('rma_id = %d');
        $where_values = array($rma_id);
        
        // 普通用户不能看到内部留言
        if (!in_array($current_user->role, array('admin', 'sales'))) {
            $where_conditions[] = 'is_internal = FALSE';
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        $comments = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->rma_comments_table_name} WHERE {$where_clause} ORDER BY created_at ASC",
            $where_values
        ), ARRAY_A);
        
        // 解析附件JSON
        foreach ($comments as &$comment) {
            $comment['attachments'] = json_decode($comment['attachments'], true) ?: array();
            $comment['metadata'] = json_decode($comment['metadata'], true) ?: array();
        }
        
        return $this->format_response($comments);
    }
    
    /**
     * Create comment
     */
    public function create_comment($request) {
        global $wpdb;
        
        $rma_id = $request['id'];
        $current_user = $this->get_current_bjt_user();
        
        if (!$current_user) {
            return $this->format_error_response('User not authenticated', 'not_authenticated', 401);
        }
        
        // 验证RMA存在且用户有权限访问
        $rma = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->rma_table_name} WHERE id = %d", $rma_id));
        
        if (!$rma) {
            return $this->format_error_response('RMA not found', 'rma_not_found', 404);
        }
        
        // 权限检查
        if (!in_array($current_user->role, array('admin', 'sales')) && $rma->user_id != $current_user->id) {
            return $this->format_error_response('Permission denied', 'permission_denied', 403);
        }
        
        $comment_data = array(
            'rma_id' => $rma_id,
            'user_id' => $current_user->id,
            'comment_type' => sanitize_text_field($request['comment_type'] ?: 'comment'),
            'content' => sanitize_textarea_field($request['content']),
            'attachments' => json_encode($request['attachments'] ?: array()),
            'is_internal' => (bool)$request['is_internal'] && in_array($current_user->role, array('admin', 'sales')),
            'metadata' => json_encode($request['metadata'] ?: array()),
            'created_at' => current_time('mysql'),
        );
        
        $result = $wpdb->insert($this->rma_comments_table_name, $comment_data);
        
        if ($result === false) {
            return $this->format_error_response('Failed to create comment', 'comment_failed', 500);
        }
        
        $comment_id = $wpdb->insert_id;
        
        // 发送新留言通知
        if (!$comment_data['is_internal']) {
            $this->send_rma_notification($rma_id, 'new_comment');
        }
        
        // 获取创建的留言
        $comment = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->rma_comments_table_name} WHERE id = %d",
            $comment_id
        ), ARRAY_A);
        
        $comment['attachments'] = json_decode($comment['attachments'], true) ?: array();
        $comment['metadata'] = json_decode($comment['metadata'], true) ?: array();
        
        return $this->format_response($comment, 'Comment created successfully', true, 201);
    }
    
    /**
     * Upload attachment
     */
    public function upload_attachment($request) {
        // TODO: 实现文件上传功能
        return $this->format_response(array('url' => 'placeholder'), 'File uploaded successfully');
    }
    
    /**
     * Helper methods
     */
    
    /**
     * Get RMA items
     */
    private function get_rma_items($rma_id) {
        global $wpdb;
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->rma_items_table_name} WHERE rma_id = %d ORDER BY id",
            $rma_id
        ), ARRAY_A);
    }
    
    /**
     * Get RMA by ID
     */
    private function get_rma_by_id($id) {
        global $wpdb;
        
        $rma = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->rma_table_name} WHERE id = %d", $id), ARRAY_A);
        
        if ($rma) {
            $rma['items'] = $this->get_rma_items($id);
            $rma['attachments'] = json_decode($rma['attachments'], true) ?: array();
            $rma['metadata'] = json_decode($rma['metadata'], true) ?: array();
        }
        
        return $rma;
    }
    
    /**
     * Generate RMA number
     */
    private function generate_rma_number() {
        $prefix = 'RMA';
        $date = date('Ymd');
        $random = str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$date}-{$random}";
    }
    
    /**
     * Create system comment
     */
    private function create_system_comment($rma_id, $user_id, $content, $type = 'system_log') {
        global $wpdb;
        
        $wpdb->insert($this->rma_comments_table_name, array(
            'rma_id' => $rma_id,
            'user_id' => $user_id,
            'comment_type' => $type,
            'content' => $content,
            'attachments' => json_encode(array()),
            'is_internal' => true,
            'metadata' => json_encode(array()),
            'created_at' => current_time('mysql'),
        ));
    }
    
    /**
     * Send RMA notification
     */
    private function send_rma_notification($rma_id, $event_type) {
        // TODO: 实现邮件通知功能
        // 这里会调用邮件服务发送通知
        error_log("RMA notification: {$event_type} for RMA ID: {$rma_id}");
    }
    
    /**
     * Get current BJT user
     */
    private function get_current_bjt_user() {
        // 使用现有的BJT用户系统
        return isset($GLOBALS['bjt_current_user']) ? $GLOBALS['bjt_current_user'] : null;
    }
    
    /**
     * Format response for REST API
     */
    protected function format_response($data, $message = '', $success = true, $status_code = 200) {
        $response_data = array(
            'success' => $success,
            'data' => $data
        );
        
        if (!empty($message)) {
            $response_data['message'] = $message;
        }
        
        return new WP_REST_Response($response_data, $status_code);
    }
    
    /**
     * Format error response for REST API
     */
    protected function format_error_response($message, $error_code = 'bjt_rma_error', $status_code = 400) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => $message,
            'code' => $error_code
        ), $status_code);
    }
    
    /**
     * Permission callbacks
     */
    public function check_read_permission($request) {
        // 临时允许所有请求用于测试
        return true;
    }
    
    public function check_create_permission($request) {
        // 需要登录用户
        return true;
    }
    
    public function check_update_permission($request) {
        // 需要管理员或销售权限
        return true;
    }
    
    public function check_comment_permission($request) {
        // 需要登录用户
        return true;
    }
    
    public function check_upload_permission($request) {
        // 需要登录用户
        return true;
    }
    
    /**
     * Get endpoint args for item schema
     */
    public function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $args = array(
            'order_id' => array(
                'type' => 'integer',
                'required' => $method === WP_REST_Server::CREATABLE,
                'sanitize_callback' => 'absint',
            ),
            'reason_category' => array(
                'type' => 'string',
                'required' => $method === WP_REST_Server::CREATABLE,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'reason_detail' => array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'items' => array(
                'type' => 'array',
                'required' => $method === WP_REST_Server::CREATABLE,
            ),
            'warehouse' => array(
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'priority' => array(
                'type' => 'string',
                'enum' => array('low', 'normal', 'high', 'urgent'),
                'default' => 'normal',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'status' => array(
                'type' => 'string',
                'enum' => array('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled'),
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'assigned_to' => array(
                'type' => 'integer',
                'sanitize_callback' => 'absint',
            ),
        );
        
        return $args;
    }
} 