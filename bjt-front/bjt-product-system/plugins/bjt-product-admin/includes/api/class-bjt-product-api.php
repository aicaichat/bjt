<?php
if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_API {
    private static $instance = null;
    private $product_line_management;
    private $host_management;
    private $part_management;
    private $air_cushion_manager;

    private function __construct() {
        $this->product_line_management = BJT_Product_Line_Management::get_instance();
        $this->host_management = BJT_Host_Management::get_instance();
        $this->part_management = BJT_Part_Management::get_instance();
        $this->air_cushion_manager = BJT_Air_Cushion_Management::get_instance();
        
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register_routes() {
        // Product Lines API
        register_rest_route('bjt-product/v1', '/product-lines', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_lines'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/product-lines/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_line'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/product-lines', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_product_line'),
            'permission_callback' => array($this, 'check_permission')
        ));

        // Hosts API
        register_rest_route('bjt-product/v1', '/hosts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_hosts'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/hosts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_host'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/hosts', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_host'),
            'permission_callback' => array($this, 'check_permission')
        ));

        // Parts API
        register_rest_route('bjt-product/v1', '/parts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_parts'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/parts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_part'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/parts', array(
            'methods' => 'POST',
            'callback' => array($this, 'save_part'),
            'permission_callback' => array($this, 'check_permission')
        ));

        // Image Upload API
        register_rest_route('bjt-product/v1', '/upload-image', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_image'),
            'permission_callback' => array($this, 'check_permission')
        ));

        register_rest_route('bjt-product/v1', '/required-parts', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_required_parts'),
            'permission_callback' => array($this, 'check_permission'),
            'args' => array(
                'model' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'accessory_part_number' => array(
                    'required' => true,
                    'type' => 'string',
                )
            )
        ));
    }

    public function check_permission($request) {
        return true; // 可以根据需要添加权限检查
    }

    // Product Lines API Methods
    public function get_product_lines($request) {
        $product_lines = $this->product_line_management->get_all_product_lines();
        return rest_ensure_response($product_lines);
    }

    public function get_product_line($request) {
        $id = $request['id'];
        $product_line = $this->product_line_management->get_product_line($id);
        return rest_ensure_response($product_line);
    }

    public function save_product_line($request) {
        $data = $request->get_json_params();
        $result = $this->product_line_management->save_product_line($data);
        return rest_ensure_response($result);
    }

    // Hosts API Methods
    public function get_hosts($request) {
        $product_line_id = $request->get_param('product_line_id');
        $hosts = $this->host_management->get_hosts_by_product_line($product_line_id);
        return rest_ensure_response($hosts);
    }

    public function get_host($request) {
        $id = $request['id'];
        $host = $this->host_management->get_host($id);
        return rest_ensure_response($host);
    }

    public function save_host($request) {
        $data = $request->get_json_params();
        $result = $this->host_management->save_host($data);
        return rest_ensure_response($result);
    }

    // Parts API Methods
    public function get_parts($request) {
        $host_id = $request->get_param('host_id');
        $parts = $this->part_management->get_parts_by_host($host_id);
        return rest_ensure_response($parts);
    }

    public function get_part($request) {
        $id = $request['id'];
        $part = $this->part_management->get_part($id);
        return rest_ensure_response($part);
    }

    public function save_part($request) {
        $data = $request->get_json_params();
        $result = $this->part_management->save_part($data);
        return rest_ensure_response($result);
    }

    // Image Upload Method
    public function upload_image($request) {
        $files = $request->get_file_params();
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'No file uploaded', array('status' => 400));
        }

        $file = $files['file'];
        $result = $this->product_line_management->upload_product_line_image($file);
        return rest_ensure_response($result);
    }

    public function get_required_parts($request) {
        $model = $request->get_param('model');
        $accessory_part_number = $request->get_param('accessory_part_number');

        // 获取所有必选备件
        $required_parts = $this->air_cushion_manager->get_all_required_parts($model, $accessory_part_number);

        // 获取每个备件的价格
        foreach ($required_parts as &$part) {
            $price_info = $this->air_cushion_manager->get_part_price(
                $part->required_part_number,
                $part->quantity,
                'CN' // 默认使用中国区域价格
            );
            $part->price = $price_info ? $price_info->price : 0;
            $part->currency = $price_info ? $price_info->currency : 'CNY';
        }

        return array(
            'success' => true,
            'data' => $required_parts
        );
    }
} 