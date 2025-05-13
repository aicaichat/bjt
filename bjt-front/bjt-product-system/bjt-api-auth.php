<?php
/**
 * Plugin Name: BJT API Authentication
 * Description: JWT Authentication for BJT API
 * Version: 1.0.0
 * Author: BJT Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class BJT_API_Auth {
    private static $instance = null;
    private $secret_key;
    
    // Singleton pattern
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Set the secret key - in a real implementation, you would store this securely
        $this->secret_key = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : 'bjt-product-api-secret-key';
        
        // Register REST API endpoints for authentication
        add_action('rest_api_init', [$this, 'register_routes']);
        
        // Add filter for JWT authentication
        add_filter('determine_current_user', [$this, 'determine_current_user'], 10);
    }
    
    /**
     * Register authentication endpoints
     */
    public function register_routes() {
        register_rest_route('bjt/v1', '/auth/login', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'login'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('bjt/v1', '/auth/validate', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'validate_token'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    /**
     * Login and generate JWT token
     */
    public function login($request) {
        $params = $request->get_params();
        
        // Check if username and password are provided
        if (empty($params['username']) || empty($params['password'])) {
            return new WP_Error('login_error', 'Username and password are required', ['status' => 400]);
        }
        
        // Authenticate user
        $user = wp_authenticate($params['username'], $params['password']);
        
        if (is_wp_error($user)) {
            return new WP_Error('login_error', 'Invalid credentials', ['status' => 401]);
        }
        
        // Generate token
        $token = $this->generate_token($user);
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'token' => $token,
                'user_id' => $user->ID,
                'user_email' => $user->user_email,
                'user_nicename' => $user->user_nicename,
                'user_display_name' => $user->display_name,
            ],
        ]);
    }
    
    /**
     * Validate JWT token
     */
    public function validate_token($request) {
        $params = $request->get_params();
        
        if (empty($params['token'])) {
            return new WP_Error('token_error', 'Token is required', ['status' => 400]);
        }
        
        $token = $params['token'];
        $user_id = $this->validate_jwt($token);
        
        if (!$user_id) {
            return new WP_Error('token_error', 'Invalid or expired token', ['status' => 401]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'data' => [
                'status' => 'valid',
                'user_id' => $user_id,
            ],
        ]);
    }
    
    /**
     * Generate JWT token
     */
    private function generate_token($user) {
        $issued_at = time();
        $expiration = $issued_at + (HOUR_IN_SECONDS * 12); // Token valid for 12 hours
        
        $payload = [
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expiration,
            'data' => [
                'user' => [
                    'id' => $user->ID,
                ],
            ],
        ];
        
        // Use a JWT library in a real implementation
        // This is a simplified implementation for demonstration
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode($payload));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", $this->secret_key, true));
        
        return "$header.$payload.$signature";
    }
    
    /**
     * Validate JWT token
     */
    private function validate_jwt($token) {
        // Split the token
        $token_parts = explode('.', $token);
        
        if (count($token_parts) !== 3) {
            return false;
        }
        
        [$header, $payload, $signature] = $token_parts;
        
        // Verify signature
        $expected_signature = base64_encode(hash_hmac('sha256', "$header.$payload", $this->secret_key, true));
        
        if ($signature !== $expected_signature) {
            return false;
        }
        
        // Decode payload
        $payload = json_decode(base64_decode($payload), true);
        
        // Check if token has expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        // Return user ID
        return isset($payload['data']['user']['id']) ? $payload['data']['user']['id'] : false;
    }
    
    /**
     * Authentication filter hook
     */
    public function determine_current_user($user_id) {
        // Skip if already authenticated
        if ($user_id) {
            return $user_id;
        }
        
        // Check if it's a REST request
        if (!defined('REST_REQUEST') || !REST_REQUEST) {
            return $user_id;
        }
        
        // Get token from authorization header
        $token = $this->get_token_from_request();
        
        if (!$token) {
            return $user_id;
        }
        
        // Validate token and get user ID
        $user_id = $this->validate_jwt($token);
        
        return $user_id ? $user_id : null;
    }
    
    /**
     * Get token from request headers
     */
    private function get_token_from_request() {
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        
        if (!$auth_header) {
            return false;
        }
        
        $auth_header_parts = explode(' ', $auth_header);
        
        if (count($auth_header_parts) !== 2 || $auth_header_parts[0] !== 'Bearer') {
            return false;
        }
        
        return $auth_header_parts[1];
    }
}

// Initialize the authentication
BJT_API_Auth::get_instance(); 