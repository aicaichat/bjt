<?php
/**
 * BJT Cart API Controller
 *
 * Handles cart related API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

// 防止类被重复加载
if (!class_exists('BJT_Cart_Controller')) {

class BJT_Cart_Controller extends WP_REST_Controller {
    protected $namespace = 'bjt/v1';
    protected $rest_base = 'cart';

    /**
     * Constructor
     */
    public function __construct() {
        $this->namespace = 'bjt/v1';
        $this->rest_base = 'cart';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // 获取购物车
        register_rest_route($this->namespace, '/' . $this->rest_base, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_cart'),
                'permission_callback' => '__return_true',
            )
        ));

        // 添加商品到购物车
        register_rest_route($this->namespace, '/' . $this->rest_base . '/items', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'add_item'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'product_type' => array(
                        'description' => __('Type of product (machine, consumable, spare_part, etc).', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true,
                        'enum' => array('machine', 'consumable', 'spare_part', 'accessory')
                    ),
                    'part_number' => array(
                        'description' => __('Part number or ID of the product.', 'bjt-product-admin'),
                        'type' => 'string',
                        'required' => true
                    ),
                    'quantity' => array(
                        'description' => __('Quantity to add to cart.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true,
                        'minimum' => 1
                    )
                )
            )
        ));

        // 更新购物车商品
        register_rest_route($this->namespace, '/' . $this->rest_base . '/items/(?P<id>[\d]+)', array(
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_item'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the cart item.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true
                    ),
                    'quantity' => array(
                        'description' => __('New quantity for the cart item.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true,
                        'minimum' => 1
                    )
                )
            )
        ));

        // 删除购物车商品
        register_rest_route($this->namespace, '/' . $this->rest_base . '/items/(?P<id>[\d]+)', array(
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => array($this, 'delete_item'),
                'permission_callback' => '__return_true',
                'args' => array(
                    'id' => array(
                        'description' => __('Unique identifier for the cart item.', 'bjt-product-admin'),
                        'type' => 'integer',
                        'required' => true
                    )
                )
            )
        ));
    }

    /**
     * Get cart content
     */
    public function get_cart($request) {
        // 模拟购物车数据，实际应从数据库或session获取
        $cart = array(
            'items' => array(),
            'item_count' => 0,
            'total_quantity' => 0,
            'cart_total' => 0,
            'currency' => ''
        );

        // 设置内容类型头
        header('Content-Type: application/json; charset=UTF-8');
        
        // 直接返回JSON响应
        echo json_encode(array(
            'success' => true,
            'data' => $cart
        ));
        
        // 阻止WordPress继续处理
        exit;
    }

    /**
     * Add item to cart
     */
    public function add_item($request) {
        $product_type = $request->get_param('product_type');
        $part_number = $request->get_param('part_number');
        $quantity = (int) $request->get_param('quantity');

        // 模拟添加商品到购物车，实际应向数据库添加记录
        $item = array(
            'id' => 1, // 模拟ID
            'product_type' => $product_type,
            'part_number' => $part_number,
            'quantity' => $quantity,
            'price' => 99.99,
            'name' => $product_type . ' ' . $part_number,
            'image_url' => '/images/products/' . $product_type . '.jpg'
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('item' => $item),
            'message' => __('Item added to cart successfully.', 'bjt-product-admin')
        ));
    }

    /**
     * Update cart item
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $quantity = (int) $request->get_param('quantity');

        // 模拟更新购物车商品，实际应更新数据库记录
        $item = array(
            'id' => $id,
            'product_type' => 'machine',
            'part_number' => 'LA-E4S',
            'quantity' => $quantity,
            'price' => 99.99,
            'name' => 'Machine LA-E4S',
            'image_url' => '/images/products/machine.jpg'
        );

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('item' => $item),
            'message' => __('Cart item updated successfully.', 'bjt-product-admin')
        ));
    }

    /**
     * Delete cart item
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');

        // 模拟删除购物车商品，实际应从数据库删除记录
        // 如果找不到对应的商品，返回错误
        if ($id > 10) {
            return new WP_Error(
                'cart_item_not_found',
                __('Cart item not found or does not belong to the current user.', 'bjt-product-admin'),
                array('status' => 404)
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array('id' => $id),
            'message' => __('Cart item removed successfully.', 'bjt-product-admin')
        ));
    }
}

} // end if class_exists check 