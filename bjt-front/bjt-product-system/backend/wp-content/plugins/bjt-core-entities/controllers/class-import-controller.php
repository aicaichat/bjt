<?php
/**
 * Import Controller - handles preview & commit endpoints for batch import.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Ensure service class is loaded
require_once BJT_CORE_ENTITIES_PLUGIN_DIR . 'includes/class-import-service.php';

class BJT_Import_Controller {

    public function register_routes() {
        register_rest_route( 'bjt/v1', '/admin/import/preview', [
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => [ $this, 'handle_preview' ],
            'permission_callback' => [ $this, 'can_manage' ],
        ] );

        register_rest_route( 'bjt/v1', '/admin/import/commit', [
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => [ $this, 'handle_commit' ],
            'permission_callback' => [ $this, 'can_manage' ],
        ] );

        // New: export template or data
        register_rest_route( 'bjt/v1', '/admin/import/export', [
            'methods'  => WP_REST_Server::READABLE,
            'callback' => [ $this, 'handle_export' ],
            'permission_callback' => [ $this, 'can_manage' ],
            'args' => [
                'entity' => [
                    'required' => true,
                    'type' => 'string',
                ],
                'mode' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'template',
                    'enum' => [ 'template', 'data' ],
                ],
            ],
        ] );
    }

    /**
     * Permission callback – requires valid BJT token and admin / manager role (or specific permission).
     * Mirrors the logic used by other controllers (e.g. Machine, Upload) so the same JWT-based
     * authentication works from the SPA.
     *
     * @param WP_REST_Request|null $request
     * @return true|WP_Error
     */
    public function can_manage( $request = null ) {
        // 1. First try the custom BJT auth flow so front-end JWT works.
        if ( ! class_exists( 'BJT_Auth_Controller' ) ) {
            $auth_path = dirname( __FILE__ ) . '/class-auth-controller.php';
            if ( file_exists( $auth_path ) ) {
                require_once $auth_path;
            }
        }

        if ( class_exists( 'BJT_Auth_Controller' ) ) {
            $auth_controller   = new BJT_Auth_Controller();
            $is_authenticated = $auth_controller->check_auth( $request );

            if ( true !== $is_authenticated ) {
                // Could be WP_Error or boolean false – just return it to REST API.
                return $is_authenticated ? $is_authenticated : new WP_Error( 'rest_not_logged_in', __( 'User not authenticated.' ), [ 'status' => 401 ] );
            }

            // Now we have a valid BJT user stored globally.
            $user = $GLOBALS['bjt_current_user'] ?? null;
            if ( ! $user ) {
                return new WP_Error( 'rest_forbidden', __( 'User information not available.', 'bjt' ), [ 'status' => 403 ] );
            }

            // Only allow active admin / manager, or users granted explicit import permission.
            if ( $user->status !== 'active' ) {
                return new WP_Error( 'rest_forbidden', __( 'Your account is not active.', 'bjt' ), [ 'status' => 403 ] );
            }

            $allowed_roles = [ 'admin', 'manager' ];
            $has_permission = in_array( $user->role, $allowed_roles, true );
            if ( ! $has_permission && isset( $user->permissions ) && is_array( $user->permissions ) ) {
                $has_permission = in_array( 'import_data', $user->permissions, true ) || in_array( 'manage_products', $user->permissions, true );
            }

            if ( ! $has_permission ) {
                return new WP_Error( 'rest_forbidden', __( 'You do not have permission to import data.', 'bjt' ), [ 'status' => 403 ] );
            }

            // All good 👍
            return true;
        }

        // 2. Fallback to WordPress capability (for classic WP admin users)
        return current_user_can( 'manage_options' );
    }

    public function handle_preview( WP_REST_Request $request ) {
        $params  = $request->get_json_params();
        $service = new BJT_Import_Service();
        $result  = $service->preview( $params );
        return rest_ensure_response( $result );
    }

    public function handle_commit( WP_REST_Request $request ) {
        $token   = sanitize_text_field( $request->get_param( 'token' ) );
        $service = new BJT_Import_Service();
        $result  = $service->commit( $token );
        return rest_ensure_response( $result );
    }

    public function handle_export( WP_REST_Request $request ) {
        $entity = sanitize_text_field( $request->get_param( 'entity' ) );
        $mode   = sanitize_text_field( $request->get_param( 'mode' ) );
        $service = new BJT_Import_Service();
        $result  = $service->export( $entity, $mode );
        return rest_ensure_response( $result );
    }
} 