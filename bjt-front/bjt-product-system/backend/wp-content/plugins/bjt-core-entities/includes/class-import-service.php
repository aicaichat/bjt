<?php
/**
 * Import Service - generic schema-driven batch import / export
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class BJT_Import_Service {

    /**
     * Central schema definition for every importable entity.
     * Each key maps to a REST `entity` string used by front-end.
     */
    private $schema = [
        'machine-model'    => [
            'table'        => 'wp_bjt_host_models',
            'headers'      => [ 'product_line_id', 'model', 'title_zh', 'title_en', 'description_zh', 'description_en', 'type', 'image1_url', 'image2_url', 'explosion_diagram_pdf', 'spec_pdf', 'status', 'sort_order' ],
            'must'         => [ 'model', 'title_zh' ],
            'unique_where' => [ 'model' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'part'             => [
            'table'        => 'wp_bjt_parts',
            'headers'      => [ 'product_line_id', 'model', 'voltage', 'image_url', 'part_number', 'name_zh', 'name_en', 'brand', 'spec', 'spec_imperial', 'package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs', 'pcs_per_box', 'pallet_size_cm', 'pallet_size_inch', 'pcs_per_pallet', 'pallet_height_cm', 'pallet_height_inch', 'pallet_gross_weight_kg', 'pallet_gross_weight_lbs', 'status', 'unit' ],
            'must'         => [ 'product_line_id', 'part_number', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'part_number' ],
            'defaults'     => [ 'status' => 'publish', 'unit' => 'pcs' ],
        ],
        'accessory-model'  => [
            'table'        => 'wp_bjt_accessory_models',
            'headers'      => [ 'product_line_id', 'model', 'title_zh', 'title_en', 'description_zh', 'description_en', 'type', 'image1_url', 'image2_url', 'explosion_diagram_pdf', 'spec_pdf', 'status', 'sort_order' ],
            'must'         => [ 'product_line_id', 'model', 'title_zh' ],
            'unique_where' => [ 'product_line_id', 'model' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'spare-part-model' => [
            'table'        => 'wp_bjt_spare_part_models',
            'headers'      => [ 'product_line_id', 'model', 'title_zh', 'title_en', 'description_zh', 'description_en', 'type', 'image1_url', 'image2_url', 'explosion_diagram_pdf', 'spec_pdf', 'status', 'sort_order' ],
            'must'         => [ 'product_line_id', 'model', 'title_zh' ],
            'unique_where' => [ 'product_line_id', 'model' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'consumable'       => [
            'table'        => 'wp_bjt_consumables',
            'headers'      => [ 'product_line_id', 'model', 'model_imperial', 'part_number', 'name_zh', 'name_en', 'spec', 'spec_imperial', 'brand', 'app_model', 'bag_type', 'material', 'thickness_met', 'thickness_imp', 'width_met', 'width_imp', 'length_met', 'length_imp', 'status', 'unit' ],
            'must'         => [ 'product_line_id', 'part_number', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'part_number' ],
            'defaults'     => [ 'status' => 'publish', 'unit' => 'roll' ],
        ],
        'shape'           => [
            'table'        => 'wp_bjt_shapes',
            'headers'      => [ 'product_line_id', 'code', 'name_zh', 'name_en', 'image_url', 'image_url2', 'status', 'sort_order' ],
            'must'         => [ 'product_line_id', 'code', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'code' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'material'        => [
            'table'        => 'wp_bjt_materials',
            'headers'      => [ 'product_line_id', 'code', 'name_zh', 'name_en', 'base_material', 'status', 'sort_order' ],
            'must'         => [ 'product_line_id', 'code', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'code' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'specification'   => [
            'table'        => 'wp_bjt_specifications',
            'headers'      => [ 'product_line_id', 'spec_type', 'metric_value', 'metric_unit', 'imperial_value', 'imperial_unit', 'status', 'sort_order' ],
            'must'         => [ 'product_line_id', 'spec_type', 'metric_value', 'metric_unit' ],
            'unique_where' => [ 'product_line_id', 'spec_type', 'metric_value', 'metric_unit' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'product-line'    => [
            'table'        => 'wp_bjt_product_lines',
            'headers'      => [ 'code', 'title_zh', 'title_en', 'description_zh', 'description_en', 'subitem1_zh', 'subitem1_en', 'subitem2_zh', 'subitem2_en', 'subitem3_zh', 'subitem3_en', 'image_url', 'status', 'sort_order' ],
            'must'         => [ 'code', 'title_zh' ],
            'unique_where' => [ 'code' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'relation'        => [
            'table'        => 'wp_bjt_relations',
            'headers'      => [ 'product_line_id', 'host_part_number', 'part_number', 'parent_part_number', 'child_part_number', 'child_type', 'level', 'quantity', 'required_parts', 'required_quantity', 'sort_order', 'status' ],
            'must'         => [ 'product_line_id', 'host_part_number', 'part_number', 'level', 'quantity' ],
            'unique_where' => [ 'product_line_id', 'host_part_number', 'part_number', 'parent_part_number', 'child_part_number' ],
            'defaults'     => [ 'status' => 'publish' ],
        ],
        'price'           => [
            'table'        => 'wp_bjt_prices',
            'headers'      => [ 'product_line_id', 'target_type', 'target_id', 'region', 'currency', 'base_price', 'min_quantity', 'max_quantity', 'discount_rate', 'status' ],
            'must'         => [ 'product_line_id', 'target_type', 'target_id', 'region', 'currency', 'base_price', 'min_quantity' ],
            'unique_where' => [ 'product_line_id', 'target_type', 'target_id', 'region', 'min_quantity' ],
            'defaults'     => [ 'status' => 'active' ],
        ],
        'inventory'       => [
            'table'        => 'wp_bjt_inventory',
            'headers'      => [ 'product_line_id', 'target_type', 'target_id', 'region', 'warehouse', 'quantity', 'reserved', 'status' ],
            'must'         => [ 'product_line_id', 'target_type', 'target_id', 'region', 'warehouse' ],
            'unique_where' => [ 'product_line_id', 'target_type', 'target_id', 'region', 'warehouse' ],
            'defaults'     => [ 'status' => 'active' ],
        ],
        'spare-part'      => [
            'table'        => 'wp_bjt_spare_parts',
            'headers'      => [ 'product_line_id', 'app_model', 'model', 'is_consumable', 'image_url', 'part_number', 'name_zh', 'name_en', 'spec', 'spec_imperial', 'app_sn', 'package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs', 'pcs_per_box', 'required_parts', 'required_quantity', 'status', 'unit' ],
            'must'         => [ 'product_line_id', 'part_number', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'part_number' ],
            'defaults'     => [ 'status' => 'publish', 'unit' => 'pcs' ],
        ],
        'accessory'       => [
            'table'        => 'wp_bjt_accessories',
            'headers'      => [ 'product_line_id', 'model', 'brand', 'part_number', 'name_zh', 'name_en', 'spec', 'spec_imperial', 'voltage', 'frequency', 'package_size_cm', 'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg', 'gross_weight_lbs', 'pcs_per_box', 'pallet_size_cm', 'pallet_size_inch', 'pcs_per_pallet', 'pallet_height_cm', 'pallet_height_inch', 'pallet_gross_weight_kg', 'pallet_gross_weight_lbs', 'image_url', 'status', 'unit', 'title_zh', 'title_en', 'description_zh', 'description_en', 'code', 'machine_id', 'parent_id', 'level', 'is_required', 'price_cny', 'price_usd', 'price_eur' ],
            'must'         => [ 'product_line_id', 'part_number', 'name_zh' ],
            'unique_where' => [ 'product_line_id', 'part_number' ],
            'defaults'     => [ 'status' => 'publish', 'unit' => 'pcs' ],
        ],
    ];

    private function get_schema( $entity ) {
        return $this->schema[ $entity ] ?? null;
    }

    /**
     * Preview rows: validate & cache.
     */
    public function preview( $payload ) {
        global $wpdb;

        $entity = sanitize_text_field( $payload['entity'] ?? '' );
        $mode   = sanitize_text_field( $payload['mode'] ?? 'upsert' );
        $rows   = $payload['rows'] ?? [];

        $schema = $this->get_schema( $entity );
        if ( ! $schema || ! is_array( $rows ) ) {
            return [ 'valid' => false, 'errors' => [ [ 'row' => 0, 'field' => 'entity', 'message' => 'unsupported entity' ] ] ];
        }

        $must     = $schema['must'];
        $headers  = $schema['headers'];
        $defaults = $schema['defaults'];
        $table    = $schema['table'];

        // Header validation (first row is enough)
        if ( isset( $rows[0] ) ) {
            $missingHead = array_diff( $must, array_keys( $rows[0] ) );
            if ( $missingHead ) {
                return [ 'valid' => false, 'errors' => [ [ 'row' => 0, 'field' => 'headers', 'message' => 'Missing: ' . implode( ',', $missingHead ) ] ] ];
            }
        }

        // Preload existing unique keys for quick duplicate check
        $uniqueKeys = $schema['unique_where'];
        $existingKeySet = [];
        if ( $uniqueKeys ) {
            $cols = implode( ',', $uniqueKeys );
            $existing = $wpdb->get_results( "SELECT {$cols} FROM {$table}", ARRAY_A );
            foreach ( $existing as $e ) {
                $existingKeySet[] = implode( '|', $e );
            }
        }

        $errors = [];
        $insert = 0; $update = 0;

        foreach ( $rows as $idx => &$row ) {
            // Ensure all headers present
            foreach ( $headers as $h ) {
                if ( ! isset( $row[ $h ] ) ) {
                    $row[ $h ] = $defaults[ $h ] ?? '';
                }
            }
            // Must fields non-empty
            foreach ( $must as $m ) {
                if ( empty( $row[ $m ] ) ) {
                    $errors[] = [ 'row' => $idx + 1, 'field' => $m, 'message' => "$m required" ];
                }
            }
            // Duplicate check
            $ukVal = [];
            foreach ( $uniqueKeys as $k ) { $ukVal[] = $row[ $k ]; }
            $sig = implode( '|', $ukVal );
            if ( in_array( $sig, $existingKeySet, true ) ) { $update++; } else { $insert++; }
        }

        $valid = count( $errors ) === 0;
        $token = $valid ? wp_generate_uuid4() : null;
        if ( $valid ) {
            set_transient( 'bjt_import_' . $token, [ 'entity' => $entity, 'mode' => $mode, 'rows' => $rows ], HOUR_IN_SECONDS );
        }
        return [ 'valid' => $valid, 'token' => $token, 'stats' => [ 'insert' => $insert, 'update' => $update ], 'errors' => $errors ];
    }

    /** Commit */
    public function commit( $token ) {
        global $wpdb;
        $data = get_transient( 'bjt_import_' . $token );
        if ( ! $data ) return [ 'success' => false, 'message' => 'invalid token' ];

        $schema = $this->get_schema( $data['entity'] );
        if ( ! $schema ) return [ 'success' => false, 'message' => 'schema not found' ];

        $table   = $schema['table'];
        $headers = $schema['headers'];
        $defaults= $schema['defaults'];
        $unique  = $schema['unique_where'];

        $ins=0; $upd=0;
        $wpdb->query( 'START TRANSACTION' );
        try {
            foreach ( $data['rows'] as $row ) {
                foreach ( $headers as $h ) {
                    if ( ! isset( $row[ $h ] ) || $row[ $h ] === '' ) {
                        if ( isset( $defaults[ $h ] ) ) $row[ $h ] = $defaults[ $h ];
                    }
                }
                // Build where clause
                $whereParts = [];$whereVals=[];
                foreach ( $unique as $uk ) { $whereParts[] = "$uk = %s"; $whereVals[] = $row[ $uk ]; }
                $existsId = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$table} WHERE " . implode( ' AND ', $whereParts ), $whereVals ) );

                if ( $existsId ) {
                    $wpdb->update( $table, $row, [ 'id' => $existsId ] );
                    $upd++;
                } else {
                    $wpdb->insert( $table, $row );
                    $ins++;
                }
            }
            $wpdb->query( 'COMMIT' );
            delete_transient( 'bjt_import_' . $token );
            return [ 'success' => true, 'inserted' => $ins, 'updated' => $upd ];
        } catch ( Exception $e ) {
            $wpdb->query( 'ROLLBACK' );
            return [ 'success' => false, 'message' => $e->getMessage() ];
        }
    }

    /** Export */
    public function export( $entity, $mode = 'template' ) {
        global $wpdb;

        $schema = $this->get_schema( $entity );
        if ( ! $schema ) {
            wp_die( 'Unsupported entity', 400 );
        }
        $headers = $schema['headers'];
        $table   = $schema['table'];
        $filename = $entity . '-' . $mode . '-' . date( 'Ymd_His' ) . '.csv';

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename=' . $filename );
        $out = fopen( 'php://output', 'w' );
        fprintf( $out, chr(0xEF) . chr(0xBB) . chr(0xBF) ); // BOM
        fputcsv( $out, $headers );

        if ( 'data' === $mode ) {
            $cols = implode( ',', $headers );
            $rows = $wpdb->get_results( "SELECT {$cols} FROM {$table}", ARRAY_A );
            foreach ( $rows as $r ) {
                $line = [];
                foreach ( $headers as $h ) { $line[] = $r[ $h ] ?? ''; }
                fputcsv( $out, $line );
            }
        }
        fclose( $out );
        exit;
    }
} 