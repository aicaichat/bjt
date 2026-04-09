<?php
/**
 * 主机型号顶部对比区示意图（单张 SVG/图）— 按产品线配置，REST 读写。
 */
class BJT_Machine_Model_Compare_Controller extends BJT_API_Controller {

    public $resource_name = 'machine-model-compare';
    protected $rest_base = 'machine-model-compare';

    const OPTION_KEY = 'bjt_machine_model_compare_urls';

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_item'],
                'permission_callback' => '__return_true',
                'args'                => [
                    'product_line_id' => [
                        'description'       => __('Product line ID (e.g. 1 = air cushion).', 'bjt'),
                        'type'              => 'integer',
                        'required'          => true,
                        'validate_callback' => function ($param) {
                            return is_numeric($param) && (int) $param > 0;
                        },
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [$this, 'update_item'],
                'permission_callback' => [$this, 'check_write_permission'],
            ],
        ]);
    }

    /**
     * @return array<string, string>
     */
    protected function get_url_map() {
        $raw = get_option(self::OPTION_KEY, []);
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : [];
        }
        return is_array($raw) ? $raw : [];
    }

    /**
     * @param array<string, string> $map
     */
    protected function save_url_map(array $map) {
        update_option(self::OPTION_KEY, $map, false);
    }

    /**
     * GET /bjt/v1/machine-model-compare?product_line_id=1
     */
    public function get_item($request) {
        $pid = absint($request->get_param('product_line_id'));
        if ($pid <= 0) {
            return new WP_Error(
                'invalid_product_line_id',
                __('Invalid product_line_id.', 'bjt'),
                ['status' => 400, 'success' => false]
            );
        }

        $map  = $this->get_url_map();
        $keys = [(string) $pid, (string) (int) $pid];
        $url  = null;
        foreach ($keys as $k) {
            if (isset($map[$k]) && $map[$k] !== '') {
                $url = $map[$k];
                break;
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => [
                'product_line_id' => $pid,
                'diagram_url'     => $url,
            ],
        ], 200);
    }

    /**
     * PUT/PATCH body: { "product_line_id": 1, "diagram_url": "/uploads/foo.svg" }
     * diagram_url 空字符串表示清除该产品线配置。
     */
    public function update_item($request) {
        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = $request->get_body_params();
        }
        if (!is_array($params)) {
            $params = [];
        }

        $pid = isset($params['product_line_id']) ? absint($params['product_line_id']) : 0;
        if ($pid <= 0) {
            return new WP_Error(
                'invalid_product_line_id',
                __('Missing or invalid product_line_id.', 'bjt'),
                ['status' => 400, 'success' => false]
            );
        }

        if (!array_key_exists('diagram_url', $params)) {
            return new WP_Error(
                'missing_diagram_url',
                __('Missing diagram_url.', 'bjt'),
                ['status' => 400, 'success' => false]
            );
        }

        $raw = $params['diagram_url'];
        if ($raw === null) {
            $raw = '';
        }
        if (!is_string($raw)) {
            return new WP_Error(
                'invalid_diagram_url',
                __('diagram_url must be a string.', 'bjt'),
                ['status' => 400, 'success' => false]
            );
        }

        $raw = trim($raw);
        if ($raw !== '' && !preg_match('#^(/|[a-z][-a-z0-9+.]*://)#i', $raw)) {
            return new WP_Error(
                'invalid_diagram_url',
                __('diagram_url must be an absolute URL or a path starting with /.', 'bjt'),
                ['status' => 400, 'success' => false]
            );
        }

        $map = $this->get_url_map();
        if ($raw === '') {
            unset($map[(string) $pid]);
        } else {
            $map[(string) $pid] = $raw;
        }
        $this->save_url_map($map);

        return new WP_REST_Response([
            'success' => true,
            'data'    => [
                'product_line_id' => $pid,
                'diagram_url'     => $raw === '' ? null : $raw,
            ],
        ], 200);
    }

    public function check_write_permission($request) {
        if (!class_exists('BJT_Auth_Controller')) {
            $auth_controller_path = dirname(__FILE__) . '/class-auth-controller.php';
            if (file_exists($auth_controller_path)) {
                require_once $auth_controller_path;
            }
        }
        if (!class_exists('BJT_Auth_Controller')) {
            return new WP_Error('rest_controller_not_loadable', 'Authentication controller not loadable.', ['status' => 500]);
        }
        $auth_controller  = new BJT_Auth_Controller();
        $is_authenticated = $auth_controller->check_auth($request);
        if (true !== $is_authenticated && is_wp_error($is_authenticated)) {
            return $is_authenticated;
        }
        if (true !== $is_authenticated) {
            return new WP_Error('rest_forbidden', __('Authentication required.', 'bjt'), ['status' => 401]);
        }
        return true;
    }
}
