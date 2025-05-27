-- =============================
-- BATCH 3: 关联关系、价格、库存
-- =============================

-- 1. 关联关系（wp_bjt_relations）
INSERT INTO `wp_bjt_relations` (`product_line_id`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`, `status`, `sort_order`, `required_parts`, `required_quantity`)
VALUES
  (1, '13A00001', 'A10001', 'accessory', 1, 1, 'publish', 10, NULL, NULL),
  (1, 'A10001', 'A40001', 'accessory', 2, 1, 'publish', 20, NULL, NULL),
  (1, 'A40001', 'A40002', 'accessory', 3, 1, 'publish', 30, NULL, NULL),
  (1, 'A40002', 'A40003', 'accessory', 4, 1, 'publish', 40, NULL, NULL),
  (1, 'A40003', '16P00001', 'spare_part', 5, 1, 'publish', 50, '16P00002', '1'),
  (1, '13A00001', '16P00002', 'spare_part', 1, 1, 'publish', 60, NULL, NULL),
  (2, '23P00001', 'B10001', 'accessory', 1, 1, 'publish', 10, NULL, NULL),
  (2, 'B10001', 'B10002', 'accessory', 2, 1, 'publish', 20, NULL, NULL),
  (2, 'B10002', 'B10003', 'accessory', 3, 1, 'publish', 30, NULL, NULL),
  (2, 'B10003', 'B10004', 'accessory', 4, 1, 'publish', 40, NULL, NULL),
  (2, 'B10004', '26P00001', 'spare_part', 5, 1, 'publish', 50, NULL, NULL),
  (2, '23P00001', '26P00002', 'spare_part', 1, 1, 'publish', 60, NULL, NULL),
  (3, '33T00001', 'C10001', 'accessory', 1, 1, 'publish', 10, NULL, NULL),
  (3, 'C10001', 'C10002', 'accessory', 2, 1, 'publish', 20, NULL, NULL),
  (3, 'C10002', 'C10003', 'accessory', 3, 1, 'publish', 30, NULL, NULL),
  (3, 'C10003', 'C10004', 'accessory', 4, 1, 'publish', 40, NULL, NULL),
  (3, 'C10004', '36P00001', 'spare_part', 5, 1, 'publish', 50, NULL, NULL),
  (3, '33T00001', '36P00002', 'spare_part', 1, 1, 'publish', 60, NULL, NULL),
  (4, '43B00001', 'D10001', 'accessory', 1, 1, 'publish', 10, NULL, NULL),
  (4, 'D10001', 'D10002', 'accessory', 2, 1, 'publish', 20, NULL, NULL),
  (4, 'D10002', 'D10003', 'accessory', 3, 1, 'publish', 30, NULL, NULL),
  (4, 'D10003', 'D10004', 'accessory', 4, 1, 'publish', 40, NULL, NULL),
  (4, 'D10004', '46B00001', 'spare_part', 5, 1, 'publish', 50, NULL, NULL),
  (4, '43B00001', '46B00002', 'spare_part', 1, 1, 'publish', 60, NULL, NULL);

-- 2. 耗材兼容性（wp_bjt_consumable_compatibility）
INSERT INTO `wp_bjt_consumable_compatibility` (`product_line_id`, `consumable_part_number`, `host_model`, `status`)
VALUES
  (1, '15F00001', 'LA-E4S', 'publish'),
  (1, '15F00001', 'LA-E5P', 'publish'),
  (1, '15F00002', 'LA-E5P', 'publish'),
  (1, '15F00002', 'LA-E6L', 'publish'),
  (1, '15F00003', 'LA-E6L', 'publish'),
  (1, '15F00003', 'LA-E7X', 'publish'),
  (2, '25P00001', 'PM-100', 'publish'),
  (2, '25P00002', 'PM-200', 'publish'),
  (2, '25P00003', 'PM-300', 'publish'),
  (3, '35T00001', 'TM-200', 'publish'),
  (3, '35T00002', 'TM-300', 'publish'),
  (3, '35T00003', 'TM-400', 'publish'),
  (4, '45B00001', 'ACB-100', 'publish'),
  (4, '45B00002', 'ACB-200', 'publish'),
  (4, '45B00003', 'ACB-300', 'publish');

-- 3. 价格（wp_bjt_prices）
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `discount_rate`, `status`)
VALUES
  (1, 'host', 1, 'CN', 'CNY', 5000.00, 1, 5, 0.05, 'active'),
  (1, 'host', 1, 'US', 'USD', 800.00, 1, 5, 0.05, 'active'),
  (1, 'host', 1, 'EU', 'EUR', 750.00, 1, 5, 0.05, 'active'),
  (1, 'host', 1, 'AU', 'AUD', 1200.00, 1, 5, 0.05, 'active'),
  (1, 'host', 1, 'CN', 'CNY', 4800.00, 6, NULL, 0.10, 'active'),
  (1, 'host', 1, 'US', 'USD', 760.00, 6, NULL, 0.10, 'active'),
  (1, 'host', 1, 'EU', 'EUR', 710.00, 6, NULL, 0.10, 'active'),
  (1, 'host', 1, 'AU', 'AUD', 1100.00, 6, NULL, 0.10, 'active'),
  (1, 'accessory', 1, 'CN', 'CNY', 200.00, 1, 10, 0.05, 'active'),
  (1, 'accessory', 1, 'US', 'USD', 32.00, 1, 10, 0.05, 'active'),
  (1, 'accessory', 1, 'EU', 'EUR', 30.00, 1, 10, 0.05, 'active'),
  (1, 'accessory', 1, 'AU', 'AUD', 50.00, 1, 10, 0.05, 'active'),
  (1, 'consumable', 1, 'CN', 'CNY', 25.00, 1, 10, 0.05, 'active'),
  (1, 'consumable', 1, 'US', 'USD', 4.00, 1, 10, 0.05, 'active'),
  (1, 'consumable', 1, 'EU', 'EUR', 3.50, 1, 10, 0.05, 'active'),
  (1, 'consumable', 1, 'AU', 'AUD', 5.50, 1, 10, 0.05, 'active'),
  (1, 'spare_part', 1, 'CN', 'CNY', 30.00, 1, 10, 0.05, 'active'),
  (1, 'spare_part', 1, 'US', 'USD', 5.00, 1, 10, 0.05, 'active'),
  (1, 'spare_part', 1, 'EU', 'EUR', 4.50, 1, 10, 0.05, 'active'),
  (1, 'spare_part', 1, 'AU', 'AUD', 8.00, 1, 10, 0.05, 'active');

-- 4. 库存（wp_bjt_inventory）
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `reserved`, `status`)
VALUES
  (1, 'host', 1, 'CN', 'WH-SH-01', 100, 10, 'active'),
  (1, 'host', 1, 'US', 'WH-US-01', 50, 5, 'active'),
  (1, 'accessory', 1, 'CN', 'WH-SH-01', 200, 20, 'active'),
  (1, 'consumable', 1, 'CN', 'WH-SH-01', 500, 50, 'active'),
  (1, 'spare_part', 1, 'CN', 'WH-SH-01', 300, 30, 'active'); 