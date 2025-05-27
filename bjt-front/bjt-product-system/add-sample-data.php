<?php
/**
 * Add sample data for spare parts pricing and inventory
 * 
 * This script adds pricing and inventory data for spare part ID 1
 */

// Tier 1 (Qty 1-5)
$prices_tier1 = [
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'CN', 
        'currency' => 'CNY', 
        'base_price' => 50.00, 
        'min_quantity' => 1, 
        'max_quantity' => 5, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'EU', 
        'currency' => 'EUR', 
        'base_price' => 7.00, 
        'min_quantity' => 1, 
        'max_quantity' => 5, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'US', 
        'currency' => 'USD', 
        'base_price' => 8.00, 
        'min_quantity' => 1, 
        'max_quantity' => 5, 
        'status' => 'active'
    ]
];

// Tier 2 (Qty 6+)
$prices_tier2 = [
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'CN', 
        'currency' => 'CNY', 
        'base_price' => 45.00, 
        'min_quantity' => 6, 
        'max_quantity' => NULL, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'EU', 
        'currency' => 'EUR', 
        'base_price' => 6.30, 
        'min_quantity' => 6, 
        'max_quantity' => NULL, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'US', 
        'currency' => 'USD', 
        'base_price' => 7.20, 
        'min_quantity' => 6, 
        'max_quantity' => NULL, 
        'status' => 'active'
    ]
];

// Inventory data
$inventory_data = [
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'CN', 
        'warehouse' => 'WH-SH-01', 
        'quantity' => 150, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'CN', 
        'warehouse' => 'WH-BJ-01', 
        'quantity' => 100, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'EU', 
        'warehouse' => 'WH-DE-01', 
        'quantity' => 80, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'US', 
        'warehouse' => 'WH-US-CA', 
        'quantity' => 60, 
        'status' => 'active'
    ],
    [
        'product_line_id' => 1, 
        'target_type' => 'spare_part', 
        'target_id' => 1, 
        'region' => 'US', 
        'warehouse' => 'WH-US-NY', 
        'quantity' => 40, 
        'status' => 'active'
    ]
];

global $wpdb;

// Insert pricing data
foreach (array_merge($prices_tier1, $prices_tier2) as $price) {
    $wpdb->insert(
        $wpdb->prefix . 'bjt_prices', 
        $price,
        array(
            '%d', '%s', '%d', '%s', '%s', '%f', '%d', '%d', '%s'
        )
    );
    
    if ($wpdb->last_error) {
        error_log('Error inserting price: ' . $wpdb->last_error);
    } else {
        echo "Added price for spare part ID {$price['target_id']} in {$price['region']} ({$price['currency']} {$price['base_price']})\n";
    }
}

// Insert inventory data
foreach ($inventory_data as $inventory) {
    $wpdb->insert(
        $wpdb->prefix . 'bjt_inventory', 
        $inventory,
        array(
            '%d', '%s', '%d', '%s', '%s', '%d', '%s'
        )
    );
    
    if ($wpdb->last_error) {
        error_log('Error inserting inventory: ' . $wpdb->last_error);
    } else {
        echo "Added inventory for spare part ID {$inventory['target_id']} in {$inventory['region']} ({$inventory['warehouse']}: {$inventory['quantity']} units)\n";
    }
}

echo "Sample data added successfully!\n"; 