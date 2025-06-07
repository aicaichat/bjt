-- =============================
-- BATCH 1: 基础字典表初始化
-- =============================

-- 1. 产品线（wp_bjt_product_lines）
INSERT INTO `wp_bjt_product_lines` (
  `id`, `title_zh`, `title_en`, `description_zh`, `description_en`,
  `subitem1_zh`, `subitem1_en`, `subitem2_zh`, `subitem2_en`,
  `subitem3_zh`, `subitem3_en`, `image_url`, `code`, `status`,
  `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, '气垫机', 'Air Cushion Machine', '高效防震气垫包装解决方案', 'Efficient air cushion packaging solution',
   NULL, NULL, NULL, NULL, NULL, NULL, '/images/shop/LA-E4S.jpg', 'air_cushion', 'publish', 10, NOW(), NOW()),
  (2, '纸机', 'Paper Machine', '高质量纸包装系统', 'High-quality paper packaging system',
   NULL, NULL, NULL, NULL, NULL, NULL, '/images/shop/ET2002.jpg', 'paper_machine', 'publish', 20, NOW(), NOW()),
  (3, '胶带机', 'Tape Machine', '专业封箱设备', 'Professional tape sealing equipment',
   NULL, NULL, NULL, NULL, NULL, NULL, '/images/shop/FR8003.jpg', 'tape_machine', 'publish', 30, NOW(), NOW()),
  (4, '气柱袋', 'Air Column Bag', '优质气柱袋产品', 'Premium air column bag products',
   NULL, NULL, NULL, NULL, NULL, NULL, '/images/shop/MPV.jpg', 'air_column', 'publish', 40, NOW(), NOW());

-- 2. 形状/袋型（wp_bjt_shapes）
INSERT INTO `wp_bjt_shapes` (
  `id`, `product_line_id`, `code`, `name_zh`, `name_en`, `image_url`, `status`, `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, 1, 'pillow', '平袋', 'pillow', '/images/shop/MFB25.jpg', 'publish', 10, NOW(), NOW()),
  (2, 1, 'bubble', '气泡袋', 'bubble', '/images/shop/MEX.JPG', 'publish', 20, NOW(), NOW()),
  (3, 1, 'tube', '筒状袋', 'tube', '/images/shop/MFC.jpg', 'publish', 30, NOW(), NOW()),
  (4, 2, 'square', '方袋', 'square', '/images/shop/ET2002.jpg', 'publish', 40, NOW(), NOW()),
  (5, 3, 'tape', '胶带型', 'tape', '/images/shop/FR8003.jpg', 'publish', 50, NOW(), NOW());

-- 3. 材料（wp_bjt_materials）
INSERT INTO `wp_bjt_materials` (
  `id`, `product_line_id`, `code`, `name_zh`, `name_en`, `base_material`, `status`, `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, 1, 'HDPE', '高密度聚乙烯', 'High-Density Polyethylene', NULL, 'publish', 10, NOW(), NOW()),
  (2, 1, 'LDPE', '低密度聚乙烯', 'Low-Density Polyethylene', NULL, 'publish', 20, NOW(), NOW()),
  (3, 1, 'Nylon', '尼龙', 'Nylon', NULL, 'publish', 30, NOW(), NOW()),
  (4, 1, 'PAPER+PE', '纸+聚乙烯', 'Paper+Polyethylene', NULL, 'publish', 40, NOW(), NOW());

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
INSERT INTO `wp_bjt_spare_part_models` (
  `id`, `product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, 1, 'SPR-100', '气泵皮膜', 'Pump Membrane', '气垫机专用气泵皮膜', 'Pump membrane for air cushion machine', NULL, '/images/shop/MPV.jpg', NULL, NULL, 'publish', 10, NOW(), NOW()),
  (2, 1, 'SPR-200', '加热丝', 'Heating Wire', '气垫机专用加热丝', 'Heating wire for air cushion machine', NULL, '/images/shop/LA-F2.jpg', NULL, NULL, 'publish', 20, NOW(), NOW()),
  (3, 2, 'SPR-300', '切纸刀片', 'Cutting Blade', '纸机专用切纸刀片', 'Cutting blade for paper machine', NULL, '/images/shop/ET2002.jpg', NULL, NULL, 'publish', 30, NOW(), NOW()),
  (4, 3, 'SPR-400', '胶带机刀片', 'Tape Cutter', '胶带机专用刀片', 'Cutter for tape machine', NULL, '/images/shop/FR8003.jpg', NULL, NULL, 'publish', 40, NOW(), NOW()),
  (5, 2, 'SPR-500', '新备件', 'New Spare', '新备件描述', 'New spare part description', NULL, '/images/shop/new.jpg', NULL, NULL, 'publish', 50, NOW(), NOW()); 