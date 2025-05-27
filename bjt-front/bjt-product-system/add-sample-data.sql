-- Add sample data for spare parts pricing and inventory
-- This script adds pricing and inventory data for spare part ID 1

-- Tier 1 (Qty 1-5)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'CNY', 50.00, 1, 5, 'active'),
(1, 'spare_part', 1, 'EU', 'EUR', 7.00, 1, 5, 'active'),
(1, 'spare_part', 1, 'US', 'USD', 8.00, 1, 5, 'active');

-- Tier 2 (Qty 6+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'CNY', 45.00, 6, NULL, 'active'),
(1, 'spare_part', 1, 'EU', 'EUR', 6.30, 6, NULL, 'active'),
(1, 'spare_part', 1, 'US', 'USD', 7.20, 6, NULL, 'active');

-- Inventory data
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(1, 'spare_part', 1, 'CN', 'WH-SH-01', 150, 'active'),
(1, 'spare_part', 1, 'CN', 'WH-BJ-01', 100, 'active'),
(1, 'spare_part', 1, 'EU', 'WH-DE-01', 80, 'active'),
(1, 'spare_part', 1, 'US', 'WH-US-CA', 60, 'active'),
(1, 'spare_part', 1, 'US', 'WH-US-NY', 40, 'active'); 