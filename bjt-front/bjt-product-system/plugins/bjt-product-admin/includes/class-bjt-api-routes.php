class BJT_API_Routes {
    private static $instance = null;
    private $namespace = 'bjt/v1';

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register_routes() {
        register_rest_route($this->namespace, '/auth/login', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_login'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route($this->namespace, '/auth/me', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_current_user'),
            'permission_callback' => array($this, 'check_authentication')
        ));

        register_rest_route($this->namespace, '/machines', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_machines'),
            'permission_callback' => array($this, 'check_authentication')
        ));

        register_rest_route($this->namespace, '/machines/(?P<id>[\\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_machine'),
            'permission_callback' => array($this, 'check_authentication')
        ));

        // ... 注册其他路由 ...
    }

    public function check_authentication($request) {
        $auth_header = $request->get_header('Authorization');
        if (!$auth_header || strpos($auth_header, 'Bearer ') !== 0) {
            return new WP_Error('unauthorized', '未授权访问', array('status' => 401));
        }

        $token = substr($auth_header, 7);
        // 验证 JWT token
        try {
            $decoded = JWT::decode($token, get_option('bjt_jwt_secret'), array('HS256'));
            return true;
        } catch (Exception $e) {
            return new WP_Error('unauthorized', '无效的令牌', array('status' => 401));
        }
    }

    public function handle_login($request) {
        $params = $request->get_json_params();
        $username = sanitize_text_field($params['username']);
        $password = sanitize_text_field($params['password']);

        $user = wp_authenticate($username, $password);
        if (is_wp_error($user)) {
            return new WP_Error('login_failed', '用户名或密码错误', array('status' => 401));
        }

        // 生成 JWT token
        $token = $this->generate_jwt_token($user);

        return array(
            'success' => true,
            'data' => array(
                'token' => $token,
                'expires_in' => 86400,
                'user' => $this->get_user_data($user)
            )
        );
    }

    private function generate_jwt_token($user) {
        $issued_at = time();
        $expiration = $issued_at + 86400; // 24小时过期

        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expiration,
            'user' => array(
                'id' => $user->ID,
                'email' => $user->user_email
            )
        );

        return JWT::encode($payload, get_option('bjt_jwt_secret'));
    }

    private function get_user_data($user) {
        return array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'name' => $user->display_name,
            'role' => $user->roles[0],
            'region' => get_user_meta($user->ID, 'region', true) ?: 'CN',
            'vipLevel' => (int)get_user_meta($user->ID, 'vip_level', true) ?: 0,
            'type' => get_user_meta($user->ID, 'user_type', true) ?: 'normal'
        );
    }
} 