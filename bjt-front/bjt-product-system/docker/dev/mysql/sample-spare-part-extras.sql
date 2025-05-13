-- Test Data for Spare Part Pricing and Inventory
-- Assumes a Spare Part with target_id = 1 (and product_line_id = 1) exists.
-- This would typically be the first spare part inserted from the main init.sql, e.g., part_number '16P00001'.
-- Please ensure the target_id correctly matches an existing spare part ID in your wp_bjt_spare_parts table.

-- Test Prices for Spare Part ID 1 (e.g., part_number '16P00001')
-- Tier 1 (Qty 1-5)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'CNY', 50.00, 1, 5, 'active'),
(1, 'spare_part', 1, 'EU', 'EUR', 7.00, 1, 5, 'active'),
(1, 'spare_part', 1, 'US', 'USD', 8.00, 1, 5, 'active');

-- Tier 2 (Qty 6+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'CNY', 45.00, 6, NULL, 'active'), -- max_quantity NULL for "and above"
(1, 'spare_part', 1, 'EU', 'EUR', 6.30, 6, NULL, 'active'),
(1, 'spare_part', 1, 'US', 'USD', 7.20, 6, NULL, 'active');

-- Test Inventory for Spare Part ID 1 (e.g., part_number '16P00001')
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'WH-SH-01', 150, 'active'), -- Shanghai Warehouse
(1, 'spare_part', 1, 'CN', 'WH-BJ-01', 100, 'active'), -- Beijing Warehouse (Total CN = 250)
(1, 'spare_part', 1, 'EU', 'WH-DE-01', 80, 'active'),  -- Germany Warehouse (Total EU = 80)
(1, 'spare_part', 1, 'US', 'WH-US-CA', 60, 'active'),  -- US California Warehouse
(1, 'spare_part', 1, 'US', 'WH-US-NY', 40, 'active');   -- US New York Warehouse (Total US = 100) 