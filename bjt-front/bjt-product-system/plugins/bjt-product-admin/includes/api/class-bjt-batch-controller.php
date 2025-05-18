<?php
/**
 * BJT Batch Operations API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Batch_Controller extends BJT_Product_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = '';
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // Batch price endpoint
        register_rest_route($this->namespace, '/prices/batch', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'get_batch_prices'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_price_endpoint_args()
            )
        ));

        // Batch inventory endpoint
        register_rest_route($this->namespace, '/inventory/batch', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array($this, 'get_batch_inventory'),
                'permission_callback' => array($this, 'check_permission'),
                'args' => $this->get_inventory_endpoint_args()
            )
        ));
    }

    /**
     * Get batch prices
     */
    public function get_batch_prices($request) {
        $items = $request->get_param('items');
        $region = $request->get_param('region') ?: 'CN';
        
        $results = array();
        foreach ($items as $item) {
            $type = sanitize_text_field($item['type']);
            $id = (int) $item['id'];
            $quantity = (int) $item['quantity'];

            $sql = $this->wpdb->prepare(
                "SELECT p.*, d.discount_rate 
                FROM {$this->wpdb->prefix}bjt_prices p
                LEFT JOIN {$this->wpdb->prefix}bjt_price_discounts d 
                    ON d.price_id = p.id 
                    AND d.min_quantity <= %d 
                    AND (d.max_quantity >= %d OR d.max_quantity IS NULL)
                WHERE p.target_type = %s 
                AND p.target_id = %d 
                AND p.region = %s",
                $quantity,
                $quantity,
                $type,
                $id,
                $region
            );

            $price_data = $this->wpdb->get_row($sql, ARRAY_A);
            
            if ($price_data) {
                $base_price = (float) $price_data['base_price'];
                $final_price = $base_price;
                
                // Apply discount if available
                if (!empty($price_data['discount_rate'])) {
                    $final_price = $base_price * (1 - (float) $price_data['discount_rate']);
                }

                $results['items'][] = array(
                    'type' => $type,
                    'id' => $id,
                    'base_price' => $base_price,
                    'final_price' => $final_price,
                    'currency' => $this->get_currency_for_region($region),
                    'quantity' => $quantity
                );
            }
        }

        // Calculate total
        if (!empty($results['items'])) {
            $total = array_reduce($results['items'], function($carry, $item) {
                return $carry + ($item['final_price'] * $item['quantity']);
            }, 0);

            $results['total'] = array(
                'amount' => $total,
                'currency' => $this->get_currency_for_region($region)
            );
        }

        return $this->format_response($results);
    }

    /**
     * Get batch inventory
     */
    public function get_batch_inventory($request) {
        $items = $request->get_param('items');
        $region = $request->get_param('region') ?: 'CN';
        $warehouse = $request->get_param('warehouse');

        $results = array();
        foreach ($items as $item) {
            $type = sanitize_text_field($item['type']);
            $id = (int) $item['id'];

            $sql = $this->wpdb->prepare(
                "SELECT i.*, 
                    COALESCE(r.quantity, 0) as reserved_quantity,
                    n.expected_date as next_arrival
                FROM {$this->wpdb->prefix}bjt_inventory i
                LEFT JOIN (
                    SELECT target_id, SUM(quantity) as quantity 
                    FROM {$this->wpdb->prefix}bjt_inventory_reservations 
                    WHERE status = 'active' 
                    GROUP BY target_id
                ) r ON r.target_id = i.target_id
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory_next_arrival n 
                    ON n.target_type = i.target_type 
                    AND n.target_id = i.target_id
                    AND n.region = i.region
                WHERE i.target_type = %s 
                AND i.target_id = %d 
                AND i.region = %s",
                $type,
                $id,
                $region
            );

            if ($warehouse) {
                $sql .= $this->wpdb->prepare(" AND i.warehouse = %s", $warehouse);
            }

            $inventory_data = $this->wpdb->get_row($sql, ARRAY_A);
            
            if ($inventory_data) {
                $results['items'][] = array(
                    'type' => $type,
                    'id' => $id,
                    'available' => (int) $inventory_data['quantity'],
                    'reserved' => (int) $inventory_data['reserved_quantity'],
                    'next_arrival' => $inventory_data['next_arrival']
                );
            }
        }

        return $this->format_response($results);
    }

    /**
     * Get currency code for region
     */
    private function get_currency_for_region($region) {
        $currencies = array(
            'CN' => 'CNY',
            'EU' => 'EUR',
            'NA' => 'USD',
            'AU' => 'AUD'
        );
        return isset($currencies[$region]) ? $currencies[$region] : 'CNY';
    }

    /**
     * Get price endpoint arguments
     */
    private function get_price_endpoint_args() {
        return array(
            'items' => array(
                'required' => true,
                'type' => 'array',
                'items' => array(
                    'type' => 'object',
                    'required' => array('type', 'id', 'quantity'),
                    'properties' => array(
                        'type' => array(
                            'type' => 'string',
                            'enum' => array('machine', 'accessory', 'consumable', 'spare_part')
                        ),
                        'id' => array(
                            'type' => 'integer'
                        ),
                        'quantity' => array(
                            'type' => 'integer',
                            'minimum' => 1
                        )
                    )
                )
            ),
            'region' => array(
                'type' => 'string',
                'enum' => array('CN', 'EU', 'NA', 'AU')
            )
        );
    }

    /**
     * Get inventory endpoint arguments
     */
    private function get_inventory_endpoint_args() {
        return array(
            'items' => array(
                'required' => true,
                'type' => 'array',
                'items' => array(
                    'type' => 'object',
                    'required' => array('type', 'id'),
                    'properties' => array(
                        'type' => array(
                            'type' => 'string',
                            'enum' => array('machine', 'accessory', 'consumable', 'spare_part')
                        ),
                        'id' => array(
                            'type' => 'integer'
                        )
                    )
                )
            ),
            'region' => array(
                'type' => 'string',
                'enum' => array('CN', 'EU', 'NA', 'AU')
            ),
            'warehouse' => array(
                'type' => 'string'
            )
        );
    }
} 