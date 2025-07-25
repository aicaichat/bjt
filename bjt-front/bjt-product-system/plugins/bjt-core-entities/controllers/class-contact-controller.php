<?php
/**
 * Contact Controller
 * 
 * Handles contact form submissions and contact information management
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Contact_Controller extends WP_REST_Controller {
    
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'contact';
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register the routes for the objects of the controller.
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base . '/submit', array(
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'submit_contact_form'),
                'permission_callback' => array($this, 'submit_permissions_check'),
                'args'                => $this->get_submit_form_args(),
            ),
        ));
        
        register_rest_route($this->namespace, '/' . $this->rest_base . '/info', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_contact_info'),
                'permission_callback' => '__return_true',
            ),
        ));
    }
    
    /**
     * Submit contact form
     */
    public function submit_contact_form($request) {
        try {
            $params = $request->get_params();
            
            // 验证必填字段
            if (empty($params['name']) || empty($params['email']) || empty($params['content'])) {
                return new WP_Error('missing_fields', 'Name, email and content are required', array('status' => 400));
            }
            
            // 验证邮箱格式
            if (!is_email($params['email'])) {
                return new WP_Error('invalid_email', 'Invalid email format', array('status' => 400));
            }
            
            // 准备邮件内容
            $to = get_option('admin_email', 'info@lockedair.com');
            $subject = 'New Contact Form Submission from ' . sanitize_text_field($params['name']);
            
            $message = "New contact form submission:\n\n";
            $message .= "Name: " . sanitize_text_field($params['name']) . "\n";
            $message .= "Email: " . sanitize_email($params['email']) . "\n";
            
            if (!empty($params['phone'])) {
                $message .= "Phone: " . sanitize_text_field($params['phone']) . "\n";
            }
            
            if (!empty($params['company'])) {
                $message .= "Company: " . sanitize_text_field($params['company']) . "\n";
            }
            
            $message .= "\nMessage:\n" . sanitize_textarea_field($params['content']) . "\n";
            $message .= "\nSubmitted at: " . current_time('mysql') . "\n";
            $message .= "IP Address: " . $this->get_client_ip() . "\n";
            
            // 设置邮件头
            $headers = array(
                'Content-Type: text/plain; charset=UTF-8',
                'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
                'Reply-To: ' . sanitize_text_field($params['name']) . ' <' . sanitize_email($params['email']) . '>'
            );
            
            // 发送邮件
            $sent = wp_mail($to, $subject, $message, $headers);
            
            if ($sent) {
                // 记录到数据库（可选）
                $this->log_contact_submission($params);
                
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => 'Your message has been sent successfully!'
                ));
            } else {
                return new WP_Error('email_failed', 'Failed to send email', array('status' => 500));
            }
            
        } catch (Exception $e) {
            return new WP_Error('server_error', 'Internal server error', array('status' => 500));
        }
    }
    
    /**
     * Get contact information
     */
    public function get_contact_info($request) {
        $contact_info = array(
            'email' => 'info@lockedair.com',
            'phone' => '+86(0)571 8616 9196',
            'offices' => array(
                'australia' => array(
                    'company' => 'BJT Pack Pty Ltd',
                    'address' => 'Unit 5, 273 Fowler Road, Illawong NSW 2234 Australia',
                    'phone' => '+61 474 032 663'
                ),
                'usa' => array(
                    'company' => 'BJT Pack, Inc.',
                    'address' => '5275 Naiman Parkway, Suite B, Solon, Ohio 44139',
                    'phone' => '+1 440 318 1777'
                ),
                'germany' => array(
                    'company' => 'BJT Pack GmbH',
                    'address' => 'Hall 9L, Industriestr 2 Rheinbach, 53359',
                    'phone' => '+49 15222378992'
                ),
                'japan' => array(
                    'company' => 'BJT JAPAN 合同会社',
                    'address' => '1-11-17 Dojo, Rou-ku, Saitama',
                    'phone' => '+81-48-711-3789'
                )
            )
        );
        
        return rest_ensure_response($contact_info);
    }
    
    /**
     * Check permissions for submitting contact form
     */
    public function submit_permissions_check($request) {
        // 允许所有人提交联系表单，但可以添加验证码等验证
        return true;
    }
    
    /**
     * Get arguments for contact form submission
     */
    public function get_submit_form_args() {
        return array(
            'name' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Contact person name',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'email' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Contact email address',
                'sanitize_callback' => 'sanitize_email',
            ),
            'phone' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Contact phone number',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'company' => array(
                'required' => false,
                'type' => 'string',
                'description' => 'Company name',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'content' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Message content',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
        );
    }
    
    /**
     * Log contact submission to database
     */
    private function log_contact_submission($params) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_contact_submissions';
        
        // 创建表（如果不存在）
        $this->create_contact_table();
        
        $wpdb->insert(
            $table_name,
            array(
                'name' => sanitize_text_field($params['name']),
                'email' => sanitize_email($params['email']),
                'phone' => sanitize_text_field($params['phone'] ?? ''),
                'company' => sanitize_text_field($params['company'] ?? ''),
                'content' => sanitize_textarea_field($params['content']),
                'ip_address' => $this->get_client_ip(),
                'submitted_at' => current_time('mysql'),
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );
    }
    
    /**
     * Create contact submissions table
     */
    private function create_contact_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'bjt_contact_submissions';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            phone varchar(50),
            company varchar(255),
            content text NOT NULL,
            ip_address varchar(45),
            submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip_keys = array('HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR');
        
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

// 初始化控制器
new BJT_Contact_Controller(); 