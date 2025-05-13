-- Sample data for initial setup

-- Product Lines
INSERT INTO `wp_bjt_product_lines` 
(`title_zh`, `title_en`, `description_zh`, `description_en`, `subitem1_zh`, `subitem1_en`, `subitem2_zh`, `subitem2_en`, `subitem3_zh`, `subitem3_en`, `image_url`, `code`, `status`, `sort_order`) 
VALUES 
('气泡膜系列', 'Bubble Wrap', '适用于各种包装场景的气泡膜产品', 'Bubble wrap products for various packaging scenarios', '标准气泡膜', 'Standard Bubble Wrap', '防静电气泡膜', 'Anti-static Bubble Wrap', '牛皮纸气泡膜', 'Kraft Bubble Wrap', '/wp-content/uploads/2023/01/bubble-wrap.jpg', 'BW', 'publish', 1),

('气柱袋系列', 'Air Column Bags', '优质缓冲的气柱袋产品', 'Air column bags with excellent cushioning', 'PE气柱袋', 'PE Air Column Bags', '尼龙气柱袋', 'Nylon Air Column Bags', '特殊材质气柱袋', 'Special Material Air Column Bags', '/wp-content/uploads/2023/01/air-column.jpg', 'AC', 'publish', 2),

('封箱机系列', 'Carton Sealers', '高效自动封箱设备', 'Efficient automatic carton sealing equipment', '半自动封箱机', 'Semi-auto Carton Sealers', '全自动封箱机', 'Fully-auto Carton Sealers', '调高型封箱机', 'Adjustable Carton Sealers', '/wp-content/uploads/2023/01/carton-sealer.jpg', 'CS', 'publish', 3);

-- Host Models
INSERT INTO `wp_bjt_host_models` 
(`product_line_id`, `model_number`, `model_name`, `name_en`, `description_zh`, `description_en`, `type`, `image1_url`, `status`, `sort_order`) 
VALUES 
(1, 'BW-M100', '标准气泡膜机', 'Standard Bubble Wrap Machine', '标准型气泡膜生产设备', 'Standard bubble wrap production equipment', '生产设备', '/wp-content/uploads/2023/01/bw-m100.jpg', 'publish', 1),

(1, 'BW-M200', '高速气泡膜机', 'High-speed Bubble Wrap Machine', '高速气泡膜生产设备', 'High-speed bubble wrap production equipment', '生产设备', '/wp-content/uploads/2023/01/bw-m200.jpg', 'publish', 2),

(2, 'AC-M300', '气柱袋制袋机', 'Air Column Bag Machine', '气柱袋生产设备', 'Air column bag production equipment', '生产设备', '/wp-content/uploads/2023/01/ac-m300.jpg', 'publish', 1),

(3, 'CS-A100', '标准封箱机', 'Standard Carton Sealer', '标准型自动封箱机', 'Standard automatic carton sealer', '封箱设备', '/wp-content/uploads/2023/01/cs-a100.jpg', 'publish', 1);

-- Accessory Models
INSERT INTO `wp_bjt_accessory_models` 
(`product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `status`, `sort_order`) 
VALUES 
(1, 'BW-A001', '气泡膜收卷装置', 'Bubble Wrap Rewinder', '适配BW-M100的收卷装置', 'Rewinder device for BW-M100', '辅助装置', '/wp-content/uploads/2023/01/bw-a001.jpg', 'publish', 1),

(1, 'BW-A002', '气泡膜切割模块', 'Bubble Wrap Cutter', '适配BW-M100的切割模块', 'Cutting module for BW-M100', '辅助装置', '/wp-content/uploads/2023/01/bw-a002.jpg', 'publish', 2),

(3, 'CS-A001', '封箱机胶带架', 'Tape Holder', '适配CS-A100的胶带架', 'Tape holder for CS-A100', '辅助装置', '/wp-content/uploads/2023/01/cs-a001.jpg', 'publish', 1);

-- Consumables 
INSERT INTO `wp_bjt_consumables` 
(`product_line_id`, `model`, `part_number`, `spec`, `brand`, `app_model`, `material`, `status`) 
VALUES 
(1, 'BW-C001', 'BW-C001-100', '10mm厚度 100cm宽度', 'BJT', 'BW-M100', 'PE', 'publish'),

(1, 'BW-C002', 'BW-C002-100', '15mm厚度 100cm宽度', 'BJT', 'BW-M100,BW-M200', 'PE', 'publish'),

(3, 'CS-C001', 'CS-C001-48', '48mm宽度 封箱胶带', 'BJT', 'CS-A100', 'BOPP', 'publish');

-- Spare Parts
INSERT INTO `wp_bjt_spare_parts` 
(`product_line_id`, `app_model`, `is_consumable`, `image_url`, `part_number`, `name_zh`, `name_en`, `status`) 
VALUES 
(1, 'BW-M100', 1, '/wp-content/uploads/2023/01/bw-sp001.jpg', 'BW-SP001', '气泡成型辊', 'Bubble Forming Roller', 'publish'),

(1, 'BW-M100,BW-M200', 0, '/wp-content/uploads/2023/01/bw-sp002.jpg', 'BW-SP002', '气泡膜加热板', 'Bubble Heating Plate', 'publish'),

(3, 'CS-A100', 1, '/wp-content/uploads/2023/01/cs-sp001.jpg', 'CS-SP001', '封箱机压辊', 'Carton Sealer Pressure Roller', 'publish'); 