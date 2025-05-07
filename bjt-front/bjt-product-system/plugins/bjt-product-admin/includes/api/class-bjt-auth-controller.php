<?php
/**
 * BJT Authentication API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Auth_Controller extends BJT_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'auth';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base . '/refresh', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'refresh_token'),
                'permission_callback' => array($this, 'check_expired_token_permission'),
            )
        ));

        register_rest_route($this->namespace, '/' . $this->rest_base . '/logout', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'logout'),
                'permission_callback' => array($this, 'check_permission'),
            )
        ));
    }

    /**
     * Refresh JWT token
     */
    public function refresh_token($request) {
        $old_token = $this->get_token_from_request($request);
        if (is_wp_error($old_token)) {
            return $old_token;
        }

        try {
            // Validate the old token
            $payload = JWT::decode($old_token, $this->get_secret_key(), array('HS256'));
            
            // Check if token is within refresh window
            $now = time();
            if ($payload->exp < $now - (7 * 24 * 60 * 60)) { // 7 days refresh window
                return $this->format_error(__('Token is too old to refresh.', 'bjt-product-admin'), 401);
            }

            // Generate new token
            $user_id = $payload->user_id;
            $user = get_user_by('id', $user_id);
            if (!$user) {
                return $this->format_error(__('User not found.', 'bjt-product-admin'), 401);
            }

            $token = $this->generate_token($user);
            
            return $this->format_response(array(
                'token' => $token,
                'expires_in' => 86400 // 24 hours
            ));

        } catch (Exception $e) {
            return $this->format_error($e->getMessage(), 401);
        }
    }

    /**
     * Logout user
     */
    public function logout($request) {
        $token = $this->get_token_from_request($request);
        if (is_wp_error($token)) {
            return $token;
        }

        // Add token to blacklist
        $this->blacklist_token($token);

        return $this->format_response(
            array(),
            true,
            200,
            __('Successfully logged out.', 'bjt-product-admin')
        );
    }

    /**
     * Check if expired token is valid for refresh
     */
    public function check_expired_token_permission($request) {
        $token = $this->get_token_from_request($request);
        if (is_wp_error($token)) {
            return false;
        }

        try {
            // Allow expired tokens for refresh
            JWT::$leeway = 60 * 60 * 24 * 7; // 7 days
            $payload = JWT::decode($token, $this->get_secret_key(), array('HS256'));
            JWT::$leeway = 0;
            
            return !$this->is_token_blacklisted($token);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Generate JWT token
     */
    private function generate_token($user) {
        $issued_at = time();
        $expiration = $issued_at + (24 * 60 * 60); // 24 hours

        $payload = array(
            'user_id' => $user->ID,
            'iat' => $issued_at,
            'exp' => $expiration
        );

        return JWT::encode($payload, $this->get_secret_key());
    }

    /**
     * Add token to blacklist
     */
    private function blacklist_token($token) {
        $blacklist = get_option('bjt_token_blacklist', array());
        $blacklist[] = array(
            'token' => $token,
            'expires' => time() + (24 * 60 * 60) // Keep in blacklist for 24 hours
        );
        
        // Clean expired tokens from blacklist
        $blacklist = array_filter($blacklist, function($item) {
            return $item['expires'] > time();
        });

        update_option('bjt_token_blacklist', $blacklist);
    }

    /**
     * Check if token is blacklisted
     */
    private function is_token_blacklisted($token) {
        $blacklist = get_option('bjt_token_blacklist', array());
        foreach ($blacklist as $item) {
            if ($item['token'] === $token && $item['expires'] > time()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get secret key for JWT
     */
    private function get_secret_key() {
        return defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : get_option('bjt_jwt_secret_key');
    }

    /**
     * Get token from request
     */
    private function get_token_from_request($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error(
                'invalid_token',
                __('Authorization header not found or invalid.', 'bjt-product-admin'),
                array('status' => 401)
            );
        }

        return trim(substr($auth_header, 7));
    }
} 