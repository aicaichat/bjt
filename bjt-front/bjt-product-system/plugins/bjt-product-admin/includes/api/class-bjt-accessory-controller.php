<?php
/**
 * BJT Accessory API Controller
 *
 * Handles accessory related API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复加载
if (!class_exists('BJT_Accessory_Controller')) {

class BJT_Accessory_Controller extends WP_REST_Controller {
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'accessories';

    /**
     * Constructor
     */
    public function __construct() {
        $this->namespace = 'bjt/v1';
        $this->rest_base = 'accessories';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // 获取配件详情
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w\-]+)', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_item'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the accessory.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    ),
                    'region' => array(
                        'description' => __('Region code for prices and inventory.', 'bjt-product-admin'),
                        'type' => 'string',
                        'default' => 'CN',
                    ),
                    'lang' => array(
                        'description' => __('Language code for the response.', 'bjt-product-admin'),
                        'type' => 'string',
                        'default' => 'zh',
                        'enum' => array('zh', 'en'),
                    )
                )
            )
        ));

        // 获取配件子配件
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w\-]+)/children', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_children'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the accessory.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    )
                )
            )
        ));

        // 获取配件必选备件
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\w\-]+)/required', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_required'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the accessory.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    )
                )
            )
        ));
    }

    /**
     * Get accessory item
     */
    public function get_item($request) {
        $id = $request->get_param('id');
        $region = $request->get_param('region') ?: 'CN';
        $lang = $request->get_param('lang') ?: 'zh';

        // 模拟数据，实际应从数据库获取
        $accessory = array(
            'id' => $id,
            'code' => $id,
            'name' => 'Accessory ' . $id,
            'description' => 'This is accessory ' . $id,
            'specs' => array(
                'material' => 'Plastic',
                'color' => 'Black',
                'weight' => '1.5kg'
            ),
            'price' => array(
                'CN' => 199.99,
                'US' => 29.99,
                'EU' => 25.99
            ),
            'inventory' => array(
                'CN' => 100,
                'US' => 50,
                'EU' => 30
            )
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $accessory
        ));
    }

    /**
     * Get accessory children
     */
    public function get_children($request) {
        $id = $request->get_param('id');

        // 模拟数据，实际应从数据库获取
        $children = array(
            array(
                'id' => $id . '-C1',
                'code' => $id . '-C1',
                'name' => 'Child 1 of ' . $id,
                'description' => 'This is child 1 of accessory ' . $id
            ),
            array(
                'id' => $id . '-C2',
                'code' => $id . '-C2',
                'name' => 'Child 2 of ' . $id,
                'description' => 'This is child 2 of accessory ' . $id
            )
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $children
        ));
    }

    /**
     * Get required parts for accessory
     */
    public function get_required($request) {
        $id = $request->get_param('id');

        // 模拟数据，实际应从数据库获取
        $required = array(
            array(
                'id' => 'SP-' . $id . '-1',
                'code' => 'SP-' . $id . '-1',
                'name' => 'Required Part 1 for ' . $id,
                'description' => 'This is required part 1 for accessory ' . $id,
                'quantity' => 2
            ),
            array(
                'id' => 'SP-' . $id . '-2',
                'code' => 'SP-' . $id . '-2',
                'name' => 'Required Part 2 for ' . $id,
                'description' => 'This is required part 2 for accessory ' . $id,
                'quantity' => 1
            )
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $required
        ));
    }
}

} // end if class_exists check 