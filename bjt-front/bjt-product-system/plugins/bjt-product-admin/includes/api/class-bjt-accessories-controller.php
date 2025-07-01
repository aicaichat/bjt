<?php
/**
 * BJT Product Accessories API Controller
 */

if (!defined('ABSPATH')) {
    exit;
}

class BJT_Product_Accessories_Controller extends BJT_Product_API_Controller {
    public function __construct() {
        parent::__construct();
        $this->rest_base = 'accessories';
    }

    /**
     * Get a collection of accessories
     */
    public function get_items($request) {
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 10;
        $offset = ($page - 1) * $per_page;
        $search = $request->get_param('search');
        $product_line_id = $request->get_param('product_line_id');
        $model_id = $request->get_param('model_id');
        $status = $request->get_param('status');

        // 简化查询，避免复杂的JOIN
        $sql = "SELECT * FROM {$this->wpdb->prefix}bjt_accessories WHERE 1=1";
        $params = array();

        // 添加过滤条件
        if (!empty($search) && trim($search) !== '') {
            $sql .= " AND (part_number LIKE %s OR name_zh LIKE %s OR name_en LIKE %s OR model LIKE %s)";
            $search_param = '%' . $this->wpdb->esc_like($search) . '%';
            $params = array_merge($params, array($search_param, $search_param, $search_param, $search_param));
        }

        if (!empty($product_line_id)) {
            $sql .= " AND product_line_id = %d";
            $params[] = (int) $product_line_id;
        }

        if (!empty($model_id)) {
            $sql .= " AND model = %s";
            $params[] = $model_id;
        }

        if (!empty($status)) {
            $sql .= " AND status = %s";
            $params[] = $status;
        }

        $sql .= " ORDER BY id DESC LIMIT %d OFFSET %d";
        $params[] = (int) $per_page;
        $params[] = (int) $offset;

        // 执行查询
        if (!empty($params)) {
            $items = $this->wpdb->get_results(
                $this->wpdb->prepare($sql, ...$params),
                ARRAY_A
            );
        } else {
            // 没有条件，直接查询
            $base_sql = "SELECT * FROM {$this->wpdb->prefix}bjt_accessories ORDER BY id DESC LIMIT %d OFFSET %d";
            $items = $this->wpdb->get_results(
                $this->wpdb->prepare($base_sql, (int) $per_page, (int) $offset),
                ARRAY_A
            );
        }

        // 获取总数
        $count_sql = "SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_accessories WHERE 1=1";
        $count_params = array();

        if (!empty($search) && trim($search) !== '') {
            $count_sql .= " AND (part_number LIKE %s OR name_zh LIKE %s OR name_en LIKE %s OR model LIKE %s)";
            $search_param = '%' . $this->wpdb->esc_like($search) . '%';
            $count_params = array_merge($count_params, array($search_param, $search_param, $search_param, $search_param));
        }

        if (!empty($product_line_id)) {
            $count_sql .= " AND product_line_id = %d";
            $count_params[] = (int) $product_line_id;
        }

        if (!empty($model_id)) {
            $count_sql .= " AND model = %s";
            $count_params[] = $model_id;
        }

        if (!empty($status)) {
            $count_sql .= " AND status = %s";
            $count_params[] = $status;
        }

        if (!empty($count_params)) {
            $total = $this->wpdb->get_var($this->wpdb->prepare($count_sql, ...$count_params));
        } else {
            $total = $this->wpdb->get_var("SELECT COUNT(*) FROM {$this->wpdb->prefix}bjt_accessories");
        }

        $data = array();
        if (!empty($items)) {
            foreach ($items as $item) {
                $data[] = $this->prepare_item_for_response($item, $request);
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'items' => $data,
                'total' => (int) $total,
                'page' => (int) $page,
                'per_page' => (int) $per_page
            )
        ), 200);
    }

    /**
     * Get one accessory item
     */
    public function get_item($request) {
        $id = (int) $request->get_param('id');

        $sql = "SELECT a.*, 
                pl.title_zh as product_line_name, pl.title_en as product_line_name_en,
                am.model as model_name
                FROM {$this->wpdb->prefix}bjt_accessories a
                LEFT JOIN {$this->wpdb->prefix}bjt_product_lines pl ON a.product_line_id = pl.id
                LEFT JOIN {$this->wpdb->prefix}bjt_accessory_models am ON a.model = am.model
                WHERE a.id = %d";

        $item = $this->wpdb->get_row(
            $this->wpdb->prepare($sql, $id),
            ARRAY_A
        );

        if (empty($item)) {
            return $this->format_error(__('Accessory not found.', 'bjt-product-admin'), 404);
        }

        $data = $this->prepare_item_for_response($item, $request);
        return $this->format_response($data);
    }

    /**
     * Create one accessory item
     */
    public function create_item($request) {
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->insert(
            $this->wpdb->prefix . 'bjt_accessories',
            $item,
            array_fill(0, count($item), '%s')
        );

        if (!$result) {
            return $this->format_error(__('Failed to create accessory.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $this->wpdb->insert_id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 201, __('Accessory created successfully.', 'bjt-product-admin'));
    }

    /**
     * Update one accessory item
     */
    public function update_item($request) {
        $id = (int) $request->get_param('id');
        $item = $this->prepare_item_for_database($request);

        $result = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_accessories',
            $item,
            array('id' => $id),
            array_fill(0, count($item), '%s'),
            array('%d')
        );

        if ($result === false) {
            return $this->format_error(__('Failed to update accessory.', 'bjt-product-admin'), 500);
        }

        $item['id'] = $id;
        $response = $this->prepare_item_for_response($item, $request);

        return $this->format_response($response, true, 200, __('Accessory updated successfully.', 'bjt-product-admin'));
    }

    /**
     * Delete one accessory item
     */
    public function delete_item($request) {
        $id    = (int) $request->get_param('id');
        $force = filter_var($request->get_param('force'), FILTER_VALIDATE_BOOLEAN);

        // 检查是否仍被主机型号关联
        $references = $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT hm.id as host_id, hm.model, hm.name_cn, hm.name_en
                 FROM {$this->wpdb->prefix}bjt_host_accessories ha
                 JOIN {$this->wpdb->prefix}bjt_host_models hm ON hm.id = ha.host_id
                 WHERE ha.accessory_id = %d",
                $id
            ),
            ARRAY_A
        );

        if (!empty($references) && !$force) {
            return $this->format_error(
                __('Cannot delete accessory because it is still linked to hosts. Please remove these relations first.', 'bjt-product-admin'),
                400,
                array('children' => $references)
            );
        }

        // 如果强制删除，则先移除关联记录
        if (!empty($references) && $force) {
            $this->wpdb->delete(
                $this->wpdb->prefix . 'bjt_host_accessories',
                array('accessory_id' => $id),
                array('%d')
            );
        }

        // 软删除：将 status 设为 trash，而不是物理删除
        $updated = $this->wpdb->update(
            $this->wpdb->prefix . 'bjt_accessories',
            array('status' => 'trash'),
            array('id' => $id),
            array('%s'),
            array('%d')
        );

        if ($updated === false) {
            return $this->format_error(__('Failed to delete accessory.', 'bjt-product-admin'), 500);
        }

        return $this->format_response(null, true, 200, __('Accessory deleted successfully.', 'bjt-product-admin'));
    }

    /**
     * Prepare item for database
     */
    protected function prepare_item_for_database($request) {
        $item = array();
        
        // Map request fields to database fields
        $fields = array(
            'product_line_id' => 'product_line_id',
            'model' => 'model',
            'brand' => 'brand',
            'part_number' => 'part_number',
            'name_zh' => 'name_zh',
            'name_en' => 'name_en',
            'spec' => 'spec',
            'spec_imperial' => 'spec_imperial',
            'voltage' => 'voltage',
            'frequency' => 'frequency',
            'package_size_cm' => 'package_size_cm',
            'package_size_inch' => 'package_size_inch',
            'net_weight_kg' => 'net_weight_kg',
            'net_weight_lbs' => 'net_weight_lbs',
            'gross_weight_kg' => 'gross_weight_kg',
            'gross_weight_lbs' => 'gross_weight_lbs',
            'pcs_per_box' => 'pcs_per_box',
            'pallet_size_cm' => 'pallet_size_cm',
            'pallet_size_inch' => 'pallet_size_inch',
            'pcs_per_pallet' => 'pcs_per_pallet',
            'pallet_height_cm' => 'pallet_height_cm',
            'pallet_height_inch' => 'pallet_height_inch',
            'pallet_gross_weight_kg' => 'pallet_gross_weight_kg',
            'pallet_gross_weight_lbs' => 'pallet_gross_weight_lbs',
            'image_url' => 'image_url',
            'status' => 'status',
            'unit' => 'unit'
        );

        foreach ($fields as $request_field => $db_field) {
            $value = $request->get_param($request_field);
            if ($value !== null) {
                $item[$db_field] = $value;
            }
        }

        // Set defaults
        if (!isset($item['status'])) {
            $item['status'] = 'publish';
        }
        if (!isset($item['unit'])) {
            $item['unit'] = 'pcs';
        }

        // Set timestamps
        $now = current_time('mysql');
        if (!$request->get_param('id')) {
            $item['created_at'] = $now;
        }
        $item['updated_at'] = $now;

        return $item;
    }

    /**
     * Prepare item for response
     */
    protected function prepare_item_for_response($item, $request) {
        $data = array(
            'id' => (int) $item['id'],
            'product_line_id' => (int) $item['product_line_id'],
            'model' => $item['model'] ?? '',
            'brand' => $item['brand'] ?? '',
            'part_number' => $item['part_number'] ?? '',
            'name_zh' => $item['name_zh'] ?? '',
            'name_en' => $item['name_en'] ?? '',
            'spec' => $item['spec'] ?? '',
            'spec_imperial' => $item['spec_imperial'] ?? '',
            'voltage' => $item['voltage'] ?? '',
            'frequency' => $item['frequency'] ?? '',
            'package_size_cm' => $item['package_size_cm'] ?? '',
            'package_size_inch' => $item['package_size_inch'] ?? '',
            'net_weight_kg' => $item['net_weight_kg'] ? (float) $item['net_weight_kg'] : null,
            'net_weight_lbs' => $item['net_weight_lbs'] ? (float) $item['net_weight_lbs'] : null,
            'gross_weight_kg' => $item['gross_weight_kg'] ? (float) $item['gross_weight_kg'] : null,
            'gross_weight_lbs' => $item['gross_weight_lbs'] ? (float) $item['gross_weight_lbs'] : null,
            'pcs_per_box' => $item['pcs_per_box'] ? (int) $item['pcs_per_box'] : null,
            'pallet_size_cm' => $item['pallet_size_cm'] ?? '',
            'pallet_size_inch' => $item['pallet_size_inch'] ?? '',
            'pcs_per_pallet' => $item['pcs_per_pallet'] ? (int) $item['pcs_per_pallet'] : null,
            'pallet_height_cm' => $item['pallet_height_cm'] ? (float) $item['pallet_height_cm'] : null,
            'pallet_height_inch' => $item['pallet_height_inch'] ? (float) $item['pallet_height_inch'] : null,
            'pallet_gross_weight_kg' => $item['pallet_gross_weight_kg'] ? (float) $item['pallet_gross_weight_kg'] : null,
            'pallet_gross_weight_lbs' => $item['pallet_gross_weight_lbs'] ? (float) $item['pallet_gross_weight_lbs'] : null,
            'image_url' => $item['image_url'] ?? '',
            'status' => $item['status'] ?? 'publish',
            'unit' => $item['unit'] ?? 'pcs',
            'created_at' => $item['created_at'] ?? '',
            'updated_at' => $item['updated_at'] ?? ''
        );

        return $data;
    }
} 