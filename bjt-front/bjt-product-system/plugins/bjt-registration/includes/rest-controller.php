<?php
namespace BJT\Reg;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;

class Rest_Controller extends WP_REST_Controller {
    public function register_routes() {
        register_rest_route('bjt/v1', '/phase2/auth/register', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_register'],
            'permission_callback' => '__return_true',
        ]);

        // Admin list pending
        register_rest_route('bjt/v1', '/phase2/admin/registrations', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_registrations'],
            'permission_callback' => function () {
                return current_user_can('list_users');
            },
        ]);

        // Approve
        register_rest_route('bjt/v1', '/phase2/admin/registrations/(?P<id>\\d+)/approve', [
            'methods'  => 'POST',
            'callback' => [$this, 'approve_registration'],
            'permission_callback' => function () {
                return current_user_can('create_users');
            },
        ]);

        // Reject
        register_rest_route('bjt/v1', '/phase2/admin/registrations/(?P<id>\\d+)/reject', [
            'methods'  => 'POST',
            'callback' => [$this, 'reject_registration'],
            'permission_callback' => function () {
                return current_user_can('create_users');
            },
        ]);
    }

    public function handle_register(WP_REST_Request $request): WP_REST_Response {
        try {
            // Minimal: store json_data row
            global $wpdb;
            $table = $wpdb->prefix . 'bjt_user_registration';
            $data = $request->get_json_params();
            
            // Validate required fields
            if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
                return new WP_REST_Response(['error' => 'Missing required fields'], 400);
            }
            
            $result = $wpdb->insert($table, [
                'json_data' => wp_json_encode($data),
                'status' => 'pending',
                'created_at' => current_time('mysql')
            ]);
            
            if ($result === false) {
                return new WP_REST_Response(['error' => 'Database error'], 500);
            }
            
            return new WP_REST_Response(['status' => 'pending', 'message' => 'Registration submitted successfully'], 202);
        } catch (Exception $e) {
            return new WP_REST_Response(['error' => 'Internal error: ' . $e->getMessage()], 500);
        }
    }

    public function list_registrations(WP_REST_Request $request): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'bjt_user_registration';
        $status = $request->get_param('status') ?: 'pending';
        $results = $wpdb->get_results($wpdb->prepare("SELECT id, json_data, status, created_at FROM {$table} WHERE status=%s", $status));
        return new WP_REST_Response($results, 200);
    }

    public function approve_registration(WP_REST_Request $request): WP_REST_Response {
        $id = (int)$request->get_param('id');
        $data = $request->get_json_params();
        $ok = Review_Service::approve($id, $data ?: []);
        if ($ok) {
            return new WP_REST_Response(['status' => 'approved'], 200);
        }
        return new WP_REST_Response(['error' => 'unable'], 400);
    }

    public function reject_registration(WP_REST_Request $request): WP_REST_Response {
        $id = (int)$request->get_param('id');
        $data = $request->get_json_params();
        $reason = $data['reason'] ?? '';
        $ok = Review_Service::reject($id, $reason);
        if ($ok) {
            return new WP_REST_Response(['status' => 'rejected'], 200);
        }
        return new WP_REST_Response(['error' => 'unable'], 400);
    }
} 