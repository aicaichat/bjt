<?php
/**
 * BJT Product Class
 *
 * Handles product data retrieval and management.
 *
 * @package BJT_Product_Admin
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * BJT_Product Class
 */
class BJT_Product {

    /**
     * Get a single product by ID
     *
     * @param int $product_id Product ID.
     * @return array|null Product data or null if not found.
     */
    public static function get_product( $product_id ) {
        global $wpdb;

        // Database tables
        $hosts_table = $wpdb->prefix . 'bjt_hosts';
        $host_meta_table = $wpdb->prefix . 'bjt_host_meta';
        $parts_table = $wpdb->prefix . 'bjt_parts';
        $part_meta_table = $wpdb->prefix . 'bjt_part_meta';
        $relationships_table = $wpdb->prefix . 'bjt_relationships';

        // Get host data (product)
        $host = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$hosts_table} WHERE id = %d",
                $product_id
            ),
            ARRAY_A
        );

        if ( ! $host ) {
            return null;
        }

        // Get host metadata (including languages, titles, descriptions)
        $host_meta = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT meta_key, meta_value, language FROM {$host_meta_table} WHERE host_id = %d",
                $product_id
            ),
            ARRAY_A
        );

        // Process host metadata
        $languages = array();
        $titles = array();
        $descriptions = array();
        $features = array();
        $specifications = array();
        $images = array();

        foreach ( $host_meta as $meta ) {
            $language = $meta['language'] ? $meta['language'] : 'en';
            
            if ( ! in_array( $language, $languages ) ) {
                $languages[] = $language;
            }

            switch ( $meta['meta_key'] ) {
                case 'title':
                    $titles[ $language ] = $meta['meta_value'];
                    break;
                
                case 'description':
                    $descriptions[ $language ] = $meta['meta_value'];
                    break;
                
                case 'features':
                    $features[ $language ] = maybe_unserialize( $meta['meta_value'] );
                    break;
                
                case 'specifications':
                    $specifications[ $language ] = maybe_unserialize( $meta['meta_value'] );
                    break;
                
                case 'images':
                    $images = maybe_unserialize( $meta['meta_value'] );
                    break;
            }
        }

        // Get categories
        $categories = self::get_product_categories( $product_id );

        // Get product parts (additional product components/accessories)
        $parts = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT p.* FROM {$parts_table} p
                JOIN {$relationships_table} r ON p.id = r.part_id
                WHERE r.host_id = %d",
                $product_id
            ),
            ARRAY_A
        );

        // Prepare final product data
        $product = array(
            'id'             => $host['id'],
            'model'          => $host['model'],
            'sku'            => $host['sku'],
            'status'         => $host['status'],
            'languages'      => $languages,
            'title'          => $titles,
            'description'    => $descriptions,
            'features'       => $features,
            'specifications' => $specifications,
            'images'         => self::process_images( $images ),
            'categories'     => $categories,
            'parts'          => $parts,
            'pdf_url'        => $host['pdf_url'],
            'date_created'   => $host['date_created'],
            'date_modified'  => $host['date_modified'],
        );

        return $product;
    }

    /**
     * Get product categories
     *
     * @param int $product_id Product ID.
     * @return array Array of categories.
     */
    public static function get_product_categories( $product_id ) {
        global $wpdb;
        
        $categories_table = $wpdb->prefix . 'bjt_categories';
        $category_relationships_table = $wpdb->prefix . 'bjt_category_relationships';
        
        $categories = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT c.* FROM {$categories_table} c
                JOIN {$category_relationships_table} cr ON c.id = cr.category_id
                WHERE cr.host_id = %d",
                $product_id
            ),
            ARRAY_A
        );
        
        return $categories;
    }

    /**
     * Get related products based on categories
     *
     * @param int $product_id Current product ID.
     * @param int $limit Number of related products to retrieve.
     * @return array Related products.
     */
    public static function get_related_products( $product_id, $limit = 4 ) {
        global $wpdb;
        
        $hosts_table = $wpdb->prefix . 'bjt_hosts';
        $category_relationships_table = $wpdb->prefix . 'bjt_category_relationships';
        
        // Get current product's categories
        $categories = self::get_product_categories( $product_id );
        
        if ( empty( $categories ) ) {
            return array();
        }
        
        // Get category IDs
        $category_ids = array_map( function( $category ) {
            return $category['id'];
        }, $categories );
        
        // Format category IDs for SQL
        $category_ids_string = implode( ',', array_map( 'intval', $category_ids ) );
        
        // Get products in the same categories, excluding current product
        $related_product_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT h.id FROM {$hosts_table} h
                JOIN {$category_relationships_table} cr ON h.id = cr.host_id
                WHERE cr.category_id IN ({$category_ids_string})
                AND h.id != %d AND h.status = 'publish'
                ORDER BY RAND()
                LIMIT %d",
                $product_id,
                $limit
            )
        );
        
        // Get full product data for each related product
        $related_products = array();
        
        foreach ( $related_product_ids as $related_id ) {
            $related_product = self::get_product( $related_id );
            
            if ( $related_product ) {
                $related_products[] = $related_product;
            }
        }
        
        return $related_products;
    }

    /**
     * Process product images to ensure correct formats
     *
     * @param array $images Raw image data.
     * @return array Processed image data.
     */
    private static function process_images( $images ) {
        if ( empty( $images ) || ! is_array( $images ) ) {
            return array();
        }
        
        $processed_images = array();
        
        foreach ( $images as $image ) {
            if ( ! isset( $image['url'] ) ) {
                continue;
            }
            
            // Ensure we have thumbnail version
            if ( ! isset( $image['thumbnail'] ) ) {
                $image['thumbnail'] = $image['url'];
            }
            
            $processed_images[] = $image;
        }
        
        return $processed_images;
    }

    /**
     * Get product permalink
     *
     * @param int $product_id Product ID.
     * @return string Product permalink.
     */
    public static function get_permalink( $product_id ) {
        $products_page_id = get_option( 'bjt_products_page_id' );
        $products_page_url = get_permalink( $products_page_id );
        
        if ( ! $products_page_url ) {
            $products_page_url = home_url();
        }
        
        $permalink = add_query_arg( 'product_id', $product_id, $products_page_url );
        
        return $permalink;
    }

    /**
     * Get products list with pagination and filtering
     *
     * @param array $args Query arguments.
     * @return array Products and pagination data.
     */
    public static function get_products( $args = array() ) {
        global $wpdb;
        
        $hosts_table = $wpdb->prefix . 'bjt_hosts';
        $host_meta_table = $wpdb->prefix . 'bjt_host_meta';
        $category_relationships_table = $wpdb->prefix . 'bjt_category_relationships';
        
        // Default arguments
        $defaults = array(
            'page'        => 1,
            'per_page'    => 12,
            'category_id' => 0,
            'search'      => '',
            'orderby'     => 'date_modified',
            'order'       => 'DESC',
            'status'      => 'publish',
            'language'    => 'en',
        );
        
        $args = wp_parse_args( $args, $defaults );
        
        // Calculate offset
        $offset = ( $args['page'] - 1 ) * $args['per_page'];
        
        // Start building query
        $where = "WHERE h.status = '%s'";
        $where_args = array( $args['status'] );
        
        // Add category filter
        if ( ! empty( $args['category_id'] ) ) {
            $where .= " AND h.id IN (SELECT host_id FROM {$category_relationships_table} WHERE category_id = %d)";
            $where_args[] = $args['category_id'];
        }
        
        // Add search filter
        if ( ! empty( $args['search'] ) ) {
            $where .= " AND (h.model LIKE %s OR h.sku LIKE %s OR h.id IN (
                SELECT host_id FROM {$host_meta_table} 
                WHERE (meta_key = 'title' OR meta_key = 'description') 
                AND meta_value LIKE %s
            ))";
            $search_term = '%' . $wpdb->esc_like( $args['search'] ) . '%';
            $where_args[] = $search_term;
            $where_args[] = $search_term;
            $where_args[] = $search_term;
        }
        
        // Prepare order
        $orderby = sanitize_sql_orderby( $args['orderby'] . ' ' . $args['order'] );
        if ( ! $orderby ) {
            $orderby = 'date_modified DESC';
        }
        
        // Count total items
        $count_query = "SELECT COUNT(DISTINCT h.id) FROM {$hosts_table} h {$where}";
        $total = $wpdb->get_var( $wpdb->prepare( $count_query, $where_args ) );
        
        // Get products
        $products_query = "SELECT DISTINCT h.* FROM {$hosts_table} h {$where} ORDER BY {$orderby} LIMIT %d OFFSET %d";
        $query_args = array_merge( $where_args, array( $args['per_page'], $offset ) );
        $products = $wpdb->get_results( $wpdb->prepare( $products_query, $query_args ), ARRAY_A );
        
        // Get full product data
        $product_data = array();
        foreach ( $products as $product ) {
            $product_data[] = self::get_product( $product['id'] );
        }
        
        // Prepare pagination data
        $total_pages = ceil( $total / $args['per_page'] );
        
        return array(
            'products'     => $product_data,
            'total'        => (int) $total,
            'total_pages'  => (int) $total_pages,
            'current_page' => (int) $args['page'],
            'per_page'     => (int) $args['per_page'],
        );
    }
}

/**
 * Helper function to get product permalink
 *
 * @param int $product_id Product ID.
 * @return string Product permalink.
 */
function bjt_get_product_permalink( $product_id ) {
    return BJT_Product::get_permalink( $product_id );
}

/**
 * Helper function to get language name from code
 *
 * @param string $language_code Language code.
 * @return string Language name.
 */
function bjt_get_language_name( $language_code ) {
    $languages = array(
        'en' => 'English',
        'zh' => '中文',
        'fr' => 'Français',
        'de' => 'Deutsch',
        'es' => 'Español',
        'it' => 'Italiano',
        'ja' => '日本語',
        'ko' => '한국어',
        'ru' => 'Русский',
        'ar' => 'العربية',
    );
    
    return isset( $languages[ $language_code ] ) ? $languages[ $language_code ] : $language_code;
} 