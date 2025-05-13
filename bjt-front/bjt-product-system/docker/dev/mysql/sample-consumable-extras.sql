-- Test Data for Consumable Pricing and Inventory
-- Generated based on consumables found in demo.sql

-- Clear existing consumable price/inventory data to avoid duplicates if re-running
DELETE FROM `wp_bjt_prices` WHERE `target_type` = 'consumable';
DELETE FROM `wp_bjt_inventory` WHERE `target_type` = 'consumable';

-- ###################################################################################
-- # Consumable ID 1 (Part Number: 15F00001, Product Line ID: 1, Model: ACF-200)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-10)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 1, 'CN', 'CNY', 25.00, 1, 10, 'active'),
(1, 'consumable', 1, 'EU', 'EUR', 3.50, 1, 10, 'active'),
(1, 'consumable', 1, 'US', 'USD', 4.00, 1, 10, 'active'),
(1, 'consumable', 1, 'AU', 'AUD', 5.50, 1, 10, 'active');
-- Prices - Tier 2 (Qty 11+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 1, 'CN', 'CNY', 22.50, 11, NULL, 'active'),
(1, 'consumable', 1, 'EU', 'EUR', 3.15, 11, NULL, 'active'),
(1, 'consumable', 1, 'US', 'USD', 3.60, 11, NULL, 'active'),
(1, 'consumable', 1, 'AU', 'AUD', 4.95, 11, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(1, 'consumable', 1, 'CN', 'WH-SH-01', 500, 'active'), (1, 'consumable', 1, 'CN', 'WH-BJ-01', 300, 'active'),
(1, 'consumable', 1, 'EU', 'WH-DE-01', 250, 'active'),
(1, 'consumable', 1, 'US', 'WH-US-CA', 150, 'active'), (1, 'consumable', 1, 'US', 'WH-US-NY', 100, 'active'),
(1, 'consumable', 1, 'AU', 'WH-AU-SY', 120, 'active');

-- ###################################################################################
-- # Consumable ID 2 (Part Number: 15F00002, Product Line ID: 1, Model: ACF-300)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-5)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 2, 'CN', 'CNY', 30.00, 1, 5, 'active'),
(1, 'consumable', 2, 'EU', 'EUR', 4.20, 1, 5, 'active'),
(1, 'consumable', 2, 'US', 'USD', 4.80, 1, 5, 'active'),
(1, 'consumable', 2, 'AU', 'AUD', 6.60, 1, 5, 'active');
-- Prices - Tier 2 (Qty 6+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 2, 'CN', 'CNY', 27.00, 6, NULL, 'active'),
(1, 'consumable', 2, 'EU', 'EUR', 3.80, 6, NULL, 'active'),
(1, 'consumable', 2, 'US', 'USD', 4.30, 6, NULL, 'active'),
(1, 'consumable', 2, 'AU', 'AUD', 5.90, 6, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(1, 'consumable', 2, 'CN', 'WH-SH-01', 400, 'active'),
(1, 'consumable', 2, 'EU', 'WH-DE-01', 200, 'active'),
(1, 'consumable', 2, 'US', 'WH-US-CA', 180, 'active'),
(1, 'consumable', 2, 'AU', 'WH-AU-SY', 90, 'active');

-- ###################################################################################
-- # Consumable ID 3 (Part Number: 15F00003, Product Line ID: 1, Model: ACF-400)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-4)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 3, 'CN', 'CNY', 35.00, 1, 4, 'active'),
(1, 'consumable', 3, 'EU', 'EUR', 4.90, 1, 4, 'active'),
(1, 'consumable', 3, 'US', 'USD', 5.60, 1, 4, 'active'),
(1, 'consumable', 3, 'AU', 'AUD', 7.70, 1, 4, 'active');
-- Prices - Tier 2 (Qty 5+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(1, 'consumable', 3, 'CN', 'CNY', 31.50, 5, NULL, 'active'),
(1, 'consumable', 3, 'EU', 'EUR', 4.40, 5, NULL, 'active'),
(1, 'consumable', 3, 'US', 'USD', 5.00, 5, NULL, 'active'),
(1, 'consumable', 3, 'AU', 'AUD', 6.80, 5, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(1, 'consumable', 3, 'CN', 'WH-SH-01', 300, 'active'),
(1, 'consumable', 3, 'EU', 'WH-DE-01', 150, 'active'),
(1, 'consumable', 3, 'US', 'WH-US-CA', 10, 'active'), -- Low stock example
(1, 'consumable', 3, 'AU', 'WH-AU-SY', 0, 'active');  -- Out of stock example

-- ###################################################################################
-- # Consumable ID 4 (Part Number: 25P00001, Product Line ID: 2, Model: PPR-100)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-10)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 4, 'CN', 'CNY', 150.00, 1, 10, 'active'),
(2, 'consumable', 4, 'EU', 'EUR', 20.00, 1, 10, 'active');
-- Prices - Tier 2 (Qty 11+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 4, 'CN', 'CNY', 135.00, 11, NULL, 'active'),
(2, 'consumable', 4, 'EU', 'EUR', 18.00, 11, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(2, 'consumable', 4, 'CN', 'WH-SH-01', 600, 'active'), (2, 'consumable', 4, 'CN', 'WH-GD-01', 400, 'active'),
(2, 'consumable', 4, 'EU', 'WH-FR-01', 300, 'active');

-- ###################################################################################
-- # Consumable ID 5 (Part Number: 25P00002, Product Line ID: 2, Model: PPR-200)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-8)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 5, 'CN', 'CNY', 180.00, 1, 8, 'active'),
(2, 'consumable', 5, 'US', 'USD', 25.00, 1, 8, 'active');
-- Prices - Tier 2 (Qty 9+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 5, 'CN', 'CNY', 160.00, 9, NULL, 'active'),
(2, 'consumable', 5, 'US', 'USD', 22.00, 9, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(2, 'consumable', 5, 'CN', 'WH-SH-01', 500, 'active'),
(2, 'consumable', 5, 'US', 'WH-US-NY', 250, 'active');

-- ###################################################################################
-- # Consumable ID 6 (Part Number: 25P00003, Product Line ID: 2, Model: PPR-300)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-6)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 6, 'AU', 'AUD', 280.00, 1, 6, 'active'),
(2, 'consumable', 6, 'EU', 'EUR', 30.00, 1, 6, 'active');
-- Prices - Tier 2 (Qty 7+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(2, 'consumable', 6, 'AU', 'AUD', 250.00, 7, NULL, 'active'),
(2, 'consumable', 6, 'EU', 'EUR', 27.00, 7, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(2, 'consumable', 6, 'AU', 'WH-AU-MEL', 300, 'active'),
(2, 'consumable', 6, 'EU', 'WH-DE-01', 150, 'active');

-- ###################################################################################
-- # Consumable ID 7 (Part Number: 35T00001, Product Line ID: 3, Model: TPE-100)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-20)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 7, 'CN', 'CNY', 12.00, 1, 20, 'active'),
(3, 'consumable', 7, 'US', 'USD', 1.80, 1, 20, 'active');
-- Prices - Tier 2 (Qty 21+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 7, 'CN', 'CNY', 10.00, 21, NULL, 'active'),
(3, 'consumable', 7, 'US', 'USD', 1.50, 21, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(3, 'consumable', 7, 'CN', 'WH-SH-01', 1000, 'active'), (3, 'consumable', 7, 'CN', 'WH-BJ-01', 800, 'active'),
(3, 'consumable', 7, 'US', 'WH-US-CA', 700, 'active');

-- ###################################################################################
-- # Consumable ID 8 (Part Number: 35T00002, Product Line ID: 3, Model: TPE-200)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-15)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 8, 'EU', 'EUR', 2.20, 1, 15, 'active'),
(3, 'consumable', 8, 'AU', 'AUD', 3.50, 1, 15, 'active');
-- Prices - Tier 2 (Qty 16+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 8, 'EU', 'EUR', 1.90, 16, NULL, 'active'),
(3, 'consumable', 8, 'AU', 'AUD', 3.00, 16, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(3, 'consumable', 8, 'EU', 'WH-DE-01', 800, 'active'),
(3, 'consumable', 8, 'AU', 'WH-AU-SY', 500, 'active');

-- ###################################################################################
-- # Consumable ID 9 (Part Number: 35T00003, Product Line ID: 3, Model: TPE-300)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-12)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 9, 'CN', 'CNY', 18.00, 1, 12, 'active'),
(3, 'consumable', 9, 'US', 'USD', 2.80, 1, 12, 'active');
-- Prices - Tier 2 (Qty 13+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(3, 'consumable', 9, 'CN', 'CNY', 15.00, 13, NULL, 'active'),
(3, 'consumable', 9, 'US', 'USD', 2.40, 13, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(3, 'consumable', 9, 'CN', 'WH-SH-01', 700, 'active'),
(3, 'consumable', 9, 'US', 'WH-US-NY', 400, 'active');

-- ###################################################################################
-- # Consumable ID 10 (Part Number: 45B00001, Product Line ID: 4, Model: ACB-100)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-50)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 10, 'CN', 'CNY', 0.80, 1, 50, 'active'),
(4, 'consumable', 10, 'EU', 'EUR', 0.12, 1, 50, 'active');
-- Prices - Tier 2 (Qty 51+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 10, 'CN', 'CNY', 0.70, 51, NULL, 'active'),
(4, 'consumable', 10, 'EU', 'EUR', 0.10, 51, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(4, 'consumable', 10, 'CN', 'WH-SH-01', 5000, 'active'),
(4, 'consumable', 10, 'EU', 'WH-FR-01', 3000, 'active');

-- ###################################################################################
-- # Consumable ID 11 (Part Number: 45B00002, Product Line ID: 4, Model: ACB-200)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-40)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 11, 'US', 'USD', 0.25, 1, 40, 'active'),
(4, 'consumable', 11, 'AU', 'AUD', 0.35, 1, 40, 'active');
-- Prices - Tier 2 (Qty 41+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 11, 'US', 'USD', 0.20, 41, NULL, 'active'),
(4, 'consumable', 11, 'AU', 'AUD', 0.30, 41, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(4, 'consumable', 11, 'US', 'WH-US-CA', 4000, 'active'),
(4, 'consumable', 11, 'AU', 'WH-AU-SY', 2500, 'active');

-- ###################################################################################
-- # Consumable ID 12 (Part Number: 45B00003, Product Line ID: 4, Model: ACB-300)
-- ###################################################################################

-- Prices - Tier 1 (Qty 1-30)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 12, 'CN', 'CNY', 1.50, 1, 30, 'active'),
(4, 'consumable', 12, 'EU', 'EUR', 0.22, 1, 30, 'active');
-- Prices - Tier 2 (Qty 31+)
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `status`) VALUES
(4, 'consumable', 12, 'CN', 'CNY', 1.30, 31, NULL, 'active'),
(4, 'consumable', 12, 'EU', 'EUR', 0.19, 31, NULL, 'active');
-- Inventory
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `status`) VALUES
(4, 'consumable', 12, 'CN', 'WH-SH-01', 3000, 'active'),
(4, 'consumable', 12, 'EU', 'WH-DE-01', 1500, 'active');
