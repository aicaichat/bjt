-- =============================
-- BATCH 1: 基础字典表初始化
-- =============================

-- 1. 产品线（wp_bjt_product_lines）
INSERT INTO `wp_bjt_product_lines` (`id`, `title_zh`, `title_en`, `description_zh`, `description_en`, `image_url`, `code`, `status`, `sort_order`)
VALUES
  (1, '气垫机', 'Air Cushion Machine', '高效防震气垫包装解决方案', 'Efficient air cushion packaging solution', '/images/shop/LA-E4S.jpg', 'air_cushion', 'publish', 10),
  (2, '纸机', 'Paper Machine', '高质量纸包装系统', 'High-quality paper packaging system', '/images/shop/ET2002.jpg', 'paper_machine', 'publish', 20),
  (3, '胶带机', 'Tape Machine', '专业封箱设备', 'Professional tape sealing equipment', '/images/shop/FR8003.jpg', 'tape_machine', 'publish', 30),
  (4, '气柱袋', 'Air Column Bag', '优质气柱袋产品', 'Premium air column bag products', '/images/shop/MPV.jpg', 'air_column', 'publish', 40);

-- 2. 形状/袋型（wp_bjt_shapes）
INSERT INTO `wp_bjt_shapes` (`id`, `product_line_id`, `code`, `name_en`, `name_zh`, `image_url`, `status`, `sort_order`)
VALUES
  (1, 1, 'pillow', 'pillow', '平袋', '/images/shop/MFB25.jpg', 'publish', 10),
  (2, 1, 'bubble', 'bubble', '气泡袋', '/images/shop/MEX.JPG', 'publish', 20),
  (3, 1, 'tube', 'tube', '筒状袋', '/images/shop/MFC.jpg', 'publish', 30);

-- 3. 材料（wp_bjt_materials）
INSERT INTO `wp_bjt_materials` (`id`, `product_line_id`, `code`, `name_en`, `name_zh`, `status`, `sort_order`)
VALUES
  (1, 1, 'HDPE', 'High-Density Polyethylene', '高密度聚乙烯', 'publish', 10),
  (2, 1, 'LDPE', 'Low-Density Polyethylene', '低密度聚乙烯', 'publish', 20),
  (3, 1, 'Nylon', 'Nylon', '尼龙', 'publish', 30),
  (4, 1, 'PAPER+PE', 'Paper+Polyethylene', '纸+聚乙烯', 'publish', 40);

-- 4. 规格（wp_bjt_specifications）
INSERT INTO `wp_bjt_specifications` (`id`, `product_line_id`, `spec_type`, `metric_value`, `metric_unit`, `imperial_value`, `imperial_unit`, `status`, `sort_order`)
VALUES
  (1, 1, 'thickness', 25.0, 'um', 1.0, 'mil', 'publish', 10),
  (2, 1, 'thickness', 50.0, 'um', 2.0, 'mil', 'publish', 20),
  (3, 1, 'width', 20.0, 'cm', 7.9, 'in', 'publish', 30),
  (4, 1, 'width', 40.0, 'cm', 15.7, 'in', 'publish', 40),
  (5, 1, 'length', 100.0, 'm', 328.1, 'ft', 'publish', 50),
  (6, 1, 'length', 200.0, 'm', 656.2, 'ft', 'publish', 60),
  (7, 2, 'weight', 120.0, 'gsm', 3.5, 'oz/yd²', 'publish', 70),
  (8, 2, 'weight', 180.0, 'gsm', 5.3, 'oz/yd²', 'publish', 80);

-- 5. 备件型号（wp_bjt_spare_part_models）
INSERT INTO `wp_bjt_spare_part_models` (`id`, `product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `image1_url`, `status`, `sort_order`)
VALUES
  (1, 1, 'SPR-100', '气泵皮膜', 'Pump Membrane', '气垫机专用气泵皮膜', 'Pump membrane for air cushion machine', '/images/shop/MPV.jpg', 'publish', 10),
  (2, 1, 'SPR-200', '加热丝', 'Heating Wire', '气垫机专用加热丝', 'Heating wire for air cushion machine', '/images/shop/LA-F2.jpg', 'publish', 20),
  (3, 2, 'SPR-300', '切纸刀片', 'Cutting Blade', '纸机专用切纸刀片', 'Cutting blade for paper machine', '/images/shop/ET2002.jpg', 'publish', 30),
  (4, 3, 'SPR-400', '胶带机刀片', 'Tape Cutter', '胶带机专用刀片', 'Cutter for tape machine', '/images/shop/FR8003.jpg', 'publish', 40); 