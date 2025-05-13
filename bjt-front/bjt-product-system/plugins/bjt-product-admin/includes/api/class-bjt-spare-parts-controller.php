<?php
/**
 * BJT Spare Parts API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Spare_Parts_Controller extends BJT_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'spare-parts';
    }

    /**
     * Get a collection of items
     */
    public function get_items($request) {
        $args = array();
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;
        $search = $request->get_param('search');

        $where_clauses = array("status = 'publish'");
        $where_values = array();

        if ($search) {
            $where_clauses[] = "(part_number LIKE %s OR name_cn LIKE %s OR name_en LIKE %s)";
            $search_term = '%' . $this->wpdb->esc_like($search) . '%';
            $where_values = array_merge($where_values, array($search_term, $search_term, $search_term));
        }

        $where_sql = implode(' AND ', $where_clauses);
        $sql = "SELECT s.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_spare_parts s
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'spare_part' AND p.target_id = s.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'spare_part' AND i.target_id = s.id AND i.region = %s
                WHERE {$where_sql}
                ORDER BY s.part_number ASC 
                LIMIT %d OFFSET %d";

        $region = $request->get_param('region') ?: 'CN';
        $query_args = array_merge(array($region, $region), $where_values, array($per_page, $offset));
        
        $items = $this->wpdb->get_results(
            $this->wpdb->prepare($sql, ...$query_args),
            ARRAY_A
        );

        if (empty($items)) {
            return $this->format_response(array(
                'items' => array(),
                'total' => 0,
                'page' => $page,
                'per_page' => $per_page
            ));
        }

        // Get total count
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_spare_parts WHERE {$where_sql}";
        $total = $this->wpdb->get_var($this->wpdb->prepare($count_sql, ...$where_values));

        $data = array();
        foreach ($items as $item) {
            $data[] = $this->prepare_item_for_response($item, $request);
        }

        return $this->format_response(array(
            'items' => $data,
            'total' => (int) $total,
            'page' => (int) $page,
            'per_page' => (int) $per_page
        ));
    }

    /**
     * Get one item from the collection
     */
    public function get_item($request) {
        $id = (int) $request->get_param('id');
        $region = $request->get_param('region') ?: 'CN';

        $sql = "SELECT s.*, 
                p.base_price, p.min_quantity, p.max_quantity, p.discount_rate,
                i.quantity as inventory_quantity, i.reserved as inventory_reserved
                FROM {$this->wpdb->prefix}bjt_spare_parts s
                LEFT JOIN {$this->wpdb->prefix}bjt_prices p ON p.target_type = 'spare_part' AND p.target_id = s.id AND p.region = %s
                LEFT JOIN {$this->wpdb->prefix}bjt_inventory i ON i.target_type = 'spare_part' AND i.target_id = s.id AND i.region = %s
                WHERE s.id = %d AND s.status = 'publish'";

        $item = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $region, $region, $id),
            ARRAY_A
        );

        if (empty($item)) {
            return $this->format_error(__('Spare part not found.', 'bjt-product-admin'), 404);
        }

        $data = $this->prepare_item_for_response($item, $request);

        // Get compatible host models
        $models_sql = "SELECT h.id, h.model, h.name_cn, h.name_en 
                      FROM {$this->wpdb->prefix}bjt_host_spare_parts hs
                      JOIN {$this->wpdb->prefix}bjt_host_models h ON h.id = hs.host_id
                      WHERE hs.spare_part_id = %d AND h.status = 'publish'
                      ORDER BY h.model ASC";

        $models = $this->wpdb->get_results(
            $this->wpdb->prepare($models_sql, $id),
            ARRAY_A
        );

        if (!empty($models)) {
            $data['compatible_models'] = array_map(function($model) use ($request) {
                return array(
                    'id' => (int) $model['id'],
                    'model' => $model['model'],
                    'name' => $model['name_' . ($request->get_param('lang') ?: 'zh')]
                );
            }, $models);
        }

        return $this->format_response($data);
    }

    /**
     * Create one item from the collection
     */
    public function create_item($request) {
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->insert(
            $this->wpdb->prefix . 'bjt_spare_parts',
            $item,
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );

        if (!$result) {
            return $this->format_error(__('Failed to create spare part.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $this->wpdb->insert_id;

        // Update compatible host models
        $compatible_models = $request->get_param('compatible_models');
        if (!empty($compatible_models)) {
            foreach ($compatible_models as $host_id) {
                $this->wpdb->insert(
                    $this->wpdb->prefix . 'bjt_host_spare_parts',
                    array(
                        'host_id' => $host_id,
                        'spare_part_id' => $item['id'],
                        'created_at' => current_time('mysql')
                    ),
                    array('%d', '%d', '%s')
                );
            }
        }

        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 201, __('Spare part created successfully.', 'bjt-product-admin'));
    }

    /**
     * Update one item from the collection
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_spare_parts',
            $item,
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to update spare part.', 'bjt-product-admin'), 500);
        }

        // Update compatible host models
        $compatible_models = $request->get_param('compatible_models');
        if ($compatible_models !== null) {
            // Delete existing relations
            $this->wpdb->delete(
                $this->wpdb->prefix . 'bjt_host_spare_parts',
                array('spare_part_id' => $id),
                array('%d')
            );

            // Add new relations
            if (!empty($compatible_models)) {
                foreach ($compatible_models as $host_id) {
                    $this->wpdb->insert(
                        $this->wpdb->prefix . 'bjt_host_spare_parts',
                        array(
                            'host_id' => $host_id,
                            'spare_part_id' => $id,
                            'created_at' => current_time('mysql')
                        ),
                        array('%d', '%d', '%s')
                    );
                }
            }
        }

        $item['id'] = $id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 200, __('Spare part updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one item from the collection
     */
    public function delete_item($request) {
        $id = (int) $request->get_param('id');

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_spare_parts',
            array('status' => 'trash'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to delete spare part.', 'bjt-product-admin'), 500);
        }

        // Delete host model relations
        $this->wpdb->delete(
            $this->wpdb->prefix . 'bjt_host_spare_parts',
            array('spare_part_id' => $id),
            array('%d')
        );

        return $this->format_response(
            array('id' => $id),
            true,
            200,
            __('Spare part deleted successfully.', 'bjt-product-admin')
        );
    }

    /**
     * Prepare item for database operation
     */
    protected function prepare_item_for_database($request) {
        $item = array(
            'part_number' => sanitize_text_field($request->get_param('part_number')),
            'name_cn' => sanitize_text_field($request->get_param('name_cn')),
            'name_en' => sanitize_text_field($request->get_param('name_en')),
            'description_cn' => sanitize_textarea_field($request->get_param('description_cn')),
            'description_en' => sanitize_textarea_field($request->get_param('description_en')),
            'package_size' => sanitize_text_field($request->get_param('package_size')),
            'package_weight' => (float) $request->get_param('package_weight'),
            'image_url' => esc_url_raw($request->get_param('image_url')),
            'status' => $request->get_param('status') ?: 'publish',
            'updated_at' => current_time('mysql')
        );

        if ($request->get_method() === 'POST') {
            $item['created_at'] = current_time('mysql');
        }

        return $item;
    }

    /**
     * Override prepare_item_for_response to add spare part specific fields
     */
    protected function prepare_item_for_response($item, $request) {
        $lang = $request->get_param('lang') ?: 'zh';
        $data = array(
            'id' => (int) $item['id'],
            'part_number' => $item['part_number'],
            'name' => $item['name_' . $lang],
            'description' => $item['description_' . $lang],
            'package_size' => $item['package_size'],
            'package_weight' => (float) $item['package_weight'],
            'image_url' => $item['image_url'],
            'status' => $item['status'],
            'created_at' => $item['created_at'],
            'updated_at' => $item['updated_at']
        );

        // Add price and inventory information if available
        if (isset($item['base_price'])) {
            $data['price'] = array(
                'base_price' => (float) $item['base_price'],
                'min_quantity' => (int) $item['min_quantity'],
                'max_quantity' => $item['max_quantity'] ? (int) $item['max_quantity'] : null,
                'discount_rate' => $item['discount_rate'] ? (float) $item['discount_rate'] : null
            );
        }

        if (isset($item['inventory_quantity'])) {
            $data['inventory'] = array(
                'quantity' => (int) $item['inventory_quantity'],
                'reserved' => (int) $item['inventory_reserved'],
                'available' => (int) $item['inventory_quantity'] - (int) $item['inventory_reserved']
            );
        }

        // Add all language versions if requested
        if ($request->get_param('include_all_languages')) {
            $data['translations'] = array(
                'cn' => array(
                    'name' => $item['name_cn'],
                    'description' => $item['description_cn'],
                ),
                'en' => array(
                    'name' => $item['name_en'],
                    'description' => $item['description_en'],
                ),
            );
        }

        return $data;
    }

    /**
     * Get the endpoint args for item schema
     */
    protected function get_endpoint_args_for_item_schema($method = WP_REST_Server::CREATABLE) {
        $params = parent::get_endpoint_args_for_item_schema($method);

        if ($method === WP_REST_Server::CREATABLE || $method === WP_REST_Server::EDITABLE) {
            $params['part_number'] = array(
                'description' => __('Part number.', 'bjt-product-admin'),
                'type' => 'string',
                'required' => true,
                'pattern' => '^[A-Za-z0-9-]+$',
            );
            $params['package_size'] = array(
                'description' => __('Package size specification.', 'bjt-product-admin'),
                'type' => 'string',
            );
            $params['package_weight'] = array(
                'description' => __('Package weight in kilograms.', 'bjt-product-admin'),
                'type' => 'number',
            );
            $params['compatible_models'] = array(
                'description' => __('Compatible host model IDs.', 'bjt-product-admin'),
                'type' => 'array',
                'items' => array(
                    'type' => 'integer',
                ),
            );
            $params['image_url'] = array(
                'description' => __('URL for the spare part image.', 'bjt-product-admin'),
                'type' => 'string',
                'format' => 'uri',
            );
        }

        return $params;
    }
} 