-- =============================
-- BATCH 2: 主数据表初始化
-- =============================

-- 1. 主机型号（wp_bjt_host_models）
INSERT INTO `wp_bjt_host_models` (`id`, `product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `sort_order`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'LA-E4S', '气垫机E4S', 'Air Cushion E4S', '高效率小型气垫机，适合小规模包装工作。', 'High-efficiency small air cushion machine suitable for small-scale packaging work.', '小型', '/images/shop/LA-E4S.jpg', '/images/shop/LA-E5P.jpg', '/pdfs/models/LA-E4S.pdf', 'publish', 10, NOW(), NOW()),
  (2, 1, 'LA-E5P', '气垫机E5P', 'Air Cushion E5P', '中等规模气垫机，高速运行。', 'Medium-scale air cushion machine with high-speed operation.', '中型', '/images/shop/LA-E5P.jpg', '/images/shop/LA-E4C.jpg', '/pdfs/models/LA-E5P.pdf', 'publish', 20, NOW(), NOW()),
  (3, 1, 'LA-E6L', '气垫机E6L', 'Air Cushion E6L', '大型工业级气垫机，高产能。', 'Large industrial air cushion machine with high productivity.', '大型', '/images/shop/LA-E4C.jpg', '/images/shop/MPV.jpg', '/pdfs/models/LA-E6L.pdf', 'publish', 30, NOW(), NOW()),
  (4, 2, 'PM-100', '纸机100', 'Paper Machine 100', '基础型纸包装机。', 'Basic paper packaging machine.', '基础型', '/images/shop/ET2002.jpg', '/images/shop/ET1003.jpg', '/pdfs/models/PM-100.pdf', 'publish', 10, NOW(), NOW()),
  (5, 2, 'PM-200', '纸机200', 'Paper Machine 200', '标准型纸包装机。', 'Standard paper packaging machine.', '标准型', '/images/shop/ET1003.jpg', '/images/shop/LA-E5P.jpg', '/pdfs/models/PM-200.pdf', 'publish', 20, NOW(), NOW()),
  (6, 2, 'PM-300', '纸机300', 'Paper Machine 300', '高级型纸包装机。', 'Advanced paper packaging machine.', '高级型', '/images/shop/LA-F2.jpg', '/images/shop/ET2002.jpg', '/pdfs/models/PM-300.pdf', 'publish', 30, NOW(), NOW()),
  (7, 3, 'TM-200', '胶带机200', 'Tape Machine 200', '标准型胶带封箱机。', 'Standard tape sealing machine.', '标准型', '/images/shop/FR8003.jpg', '/images/shop/EC2005.jpg', '/pdfs/models/TM-200.pdf', 'publish', 10, NOW(), NOW()),
  (8, 3, 'TM-300', '胶带机300', 'Tape Machine 300', '高速型胶带封箱机。', 'High-speed tape sealing machine.', '高速型', '/images/shop/EC2005.jpg', '/images/shop/FR8003.jpg', '/pdfs/models/TM-300.pdf', 'publish', 20, NOW(), NOW()),
  (9, 3, 'TM-400', '胶带机400', 'Tape Machine 400', '全自动胶带封箱机。', 'Fully automatic tape sealing machine.', '自动型', '/images/shop/MPV.jpg', '/images/shop/LA-E4S.jpg', '/pdfs/models/TM-400.pdf', 'publish', 30, NOW(), NOW()),
  (10, 4, 'ACB-100', '气柱袋100', 'Air Column Bag 100', '小型气柱袋机。', 'Small air column bag machine.', '小型', '/images/shop/MPV.jpg', '/images/shop/LA-E4S.jpg', '/pdfs/models/ACB-100.pdf', 'publish', 10, NOW(), NOW()),
  (11, 4, 'ACB-200', '气柱袋200', 'Air Column Bag 200', '中型气柱袋机。', 'Medium air column bag machine.', '中型', '/images/shop/LA-E4S.jpg', '/images/shop/MPV.jpg', '/pdfs/models/ACB-200.pdf', 'publish', 20, NOW(), NOW()),
  (12, 4, 'ACB-300', '气柱袋300', 'Air Column Bag 300', '大型气柱袋机。', 'Large air column bag machine.', '大型', '/images/shop/LA-E5P.jpg', '/images/shop/LA-E4C.jpg', '/pdfs/models/ACB-300.pdf', 'publish', 30, NOW(), NOW());

-- 2. 配件型号（wp_bjt_accessory_models）
INSERT INTO `wp_bjt_accessory_models` (
  `id`, `product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, 1, 'E4S-FAN', 'E4S风扇', 'E4S Fan', 'E4S主机专用风扇', 'Fan for E4S host', '风扇', '/images/shop/LA-E4S.jpg', '/images/shop/LA-E5P.jpg', '/pdfs/accessories/E4S-FAN.pdf', 'publish', 10, NOW(), NOW()),
  (2, 1, 'E4S-CTRL', 'E4S控制板', 'E4S Controller', 'E4S主机智能控制板', 'Smart controller for E4S', '控制板', '/images/shop/LA-E5P.jpg', '/images/shop/LA-E4C.jpg', '/pdfs/accessories/E4S-CTRL.pdf', 'publish', 20, NOW(), NOW()),
  (3, 1, 'E4S-HEATER', 'E4S加热器', 'E4S Heater', 'E4S主机加热组件', 'Heater for E4S', '加热器', '/images/shop/LA-E4C.jpg', '/images/shop/MPV.jpg', '/pdfs/accessories/E4S-HEATER.pdf', 'publish', 30, NOW(), NOW()),
  (4, 1, 'E4S-SENSOR', 'E4S传感器', 'E4S Sensor', 'E4S主机温度传感器', 'Temperature sensor for E4S', '传感器', '/images/shop/MPV.jpg', '/images/shop/LA-E4S.jpg', '/pdfs/accessories/E4S-SENSOR.pdf', 'publish', 40, NOW(), NOW()),
  (5, 1, 'E4S-CASE', 'E4S外壳', 'E4S Case', 'E4S主机外壳', 'Case for E4S', '外壳', '/images/shop/LA-E4S.jpg', '/images/shop/LA-E5P.jpg', '/pdfs/accessories/E4S-CASE.pdf', 'publish', 50, NOW(), NOW()),
  (6, 1, 'E4S-FAN-CHILD', 'E4S风扇子件', 'E4S Fan Child', 'E4S风扇下属子配件', 'Child part of E4S fan', '风扇子件', '/images/shop/LA-E5P.jpg', '/images/shop/LA-E4C.jpg', '/pdfs/accessories/E4S-FAN-CHILD.pdf', 'publish', 60, NOW(), NOW()),
  (7, 1, 'E4S-FAN-CHILD2', 'E4S风扇子件2', 'E4S Fan Child 2', 'E4S风扇下属子配件2', 'Second child part of E4S fan', '风扇子件', '/images/shop/LA-E4C.jpg', '/images/shop/MPV.jpg', '/pdfs/accessories/E4S-FAN-CHILD2.pdf', 'publish', 70, NOW(), NOW()),
  (8, 1, 'E4S-FAN-CHILD2-CHILD', 'E4S风扇子件2-子件', 'E4S Fan Child 2-Child', 'E4S风扇子件2下属三级配件', 'Third level part under E4S fan child 2', '风扇三级件', '/images/shop/MPV.jpg', '/images/shop/LA-E4S.jpg', '/pdfs/accessories/E4S-FAN-CHILD2-CHILD.pdf', 'publish', 80, NOW(), NOW()),
  (9, 2, 'PM100-CUTTER', 'PM100切刀', 'PM100 Cutter', 'PM100主机专用切刀', 'Cutter for PM100', '切刀', '/images/shop/ET2002.jpg', '/images/shop/ET1003.jpg', '/pdfs/accessories/PM100-CUTTER.pdf', 'publish', 10, NOW(), NOW()),
  (10, 2, 'PM100-ROLLER', 'PM100滚轮', 'PM100 Roller', 'PM100主机滚轮', 'Roller for PM100', '滚轮', '/images/shop/ET1003.jpg', '/images/shop/LA-E5P.jpg', '/pdfs/accessories/PM100-ROLLER.pdf', 'publish', 20, NOW(), NOW()),
  (11, 2, 'PM100-ROLLER-CHILD', 'PM100滚轮子件', 'PM100 Roller Child', 'PM100滚轮下属子配件', 'Child part of PM100 roller', '滚轮子件', '/images/shop/LA-F2.jpg', '/images/shop/ET2002.jpg', '/pdfs/accessories/PM100-ROLLER-CHILD.pdf', 'publish', 30, NOW(), NOW()),
  (12, 3, 'TM200-BLADE', 'TM200刀片', 'TM200 Blade', 'TM200主机专用刀片', 'Blade for TM200', '刀片', '/images/shop/FR8003.jpg', '/images/shop/EC2005.jpg', '/pdfs/accessories/TM200-BLADE.pdf', 'publish', 10, NOW(), NOW()),
  (13, 3, 'TM200-SPRING', 'TM200弹簧', 'TM200 Spring', 'TM200主机弹簧', 'Spring for TM200', '弹簧', '/images/shop/EC2005.jpg', '/images/shop/FR8003.jpg', '/pdfs/accessories/TM200-SPRING.pdf', 'publish', 20, NOW(), NOW()),
  (14, 4, 'ACB100-VALVE', 'ACB100气阀', 'ACB100 Valve', 'ACB100主机气阀', 'Valve for ACB100', '气阀', '/images/shop/MPV.jpg', '/images/shop/LA-E4S.jpg', '/pdfs/accessories/ACB100-VALVE.pdf', 'publish', 10, NOW(), NOW()),
  (15, 4, 'ACB100-VALVE-CHILD', 'ACB100气阀子件', 'ACB100 Valve Child', 'ACB100气阀下属子配件', 'Child part of ACB100 valve', '气阀子件', '/images/shop/LA-E4S.jpg', '/images/shop/MPV.jpg', '/pdfs/accessories/ACB100-VALVE-CHILD.pdf', 'publish', 20, NOW(), NOW());

-- 3. 主机料号（wp_bjt_parts）
INSERT INTO `wp_bjt_parts` (
  `id`, `product_line_id`, `model`, `voltage`, `image_url`, `part_number`, `name_zh`, `name_en`, `brand`, `spec`, `spec_imperial`, `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, `gross_weight_kg`, `gross_weight_lbs`, `pcs_per_box`, `pallet_size_cm`, `pallet_size_inch`, `pcs_per_pallet`, `pallet_height_cm`, `pallet_height_inch`, `pallet_gross_weight_kg`, `pallet_gross_weight_lbs`, `status`, `created_at`, `updated_at`, `unit`
) VALUES
  (1, 1, 'LA-E4S', '220V', '/images/shop/LA-E4S.jpg', '13A00001', 'E4S主机-标准版', 'E4S Host-Standard', 'BJT', '30x20x15cm', '11.8x7.9x5.9in', '35x25x20cm', '13.8x9.8x7.9in', 5.2, 11.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (2, 1, 'LA-E4S', '110V', '/images/shop/LA-E5P.jpg', '13A00002', 'E4S主机-美标版', 'E4S Host-US Version', 'BJT', '30x20x15cm', '11.8x7.9x5.9in', '35x25x20cm', '13.8x9.8x7.9in', 5.2, 11.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (3, 1, 'LA-E5P', '220V', '/images/shop/LA-E5P.jpg', '13A00003', 'E5P主机-标准版', 'E5P Host-Standard', 'BJT', '40x25x20cm', '15.7x9.8x7.9in', '45x30x25cm', '17.7x11.8x9.8in', 7.5, 16.53, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (4, 1, 'LA-E5P', '110V', '/images/shop/LA-E4C.jpg', '13A00004', 'E5P主机-美标版', 'E5P Host-US Version', 'BJT', '40x25x20cm', '15.7x9.8x7.9in', '45x30x25cm', '17.7x11.8x9.8in', 7.5, 16.53, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (5, 1, 'LA-E6L', '220V', '/images/shop/LA-E4C.jpg', '13A00005', 'E6L主机-标准版', 'E6L Host-Standard', 'BJT', '50x30x25cm', '19.7x11.8x9.8in', '55x35x30cm', '21.7x13.8x11.8in', 12.8, 28.22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (6, 1, 'LA-E6L', '110V', '/images/shop/MPV.jpg', '13A00006', 'E6L主机-美标版', 'E6L Host-US Version', 'BJT', '50x30x25cm', '19.7x11.8x9.8in', '55x35x30cm', '21.7x13.8x11.8in', 12.8, 28.22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (7, 2, 'PM-100', '220V', '/images/shop/ET2002.jpg', '23P00001', 'PM100主机-标准版', 'PM100 Host-Standard', 'BJT', '70x45x50cm', '27.6x17.7x19.7in', '75x50x55cm', '29.5x19.7x21.7in', 35.0, 77.16, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (8, 2, 'PM-100', '110V', '/images/shop/ET1003.jpg', '23P00002', 'PM100主机-美标版', 'PM100 Host-US Version', 'BJT', '70x45x50cm', '27.6x17.7x19.7in', '75x50x55cm', '29.5x19.7x21.7in', 35.0, 77.16, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (9, 2, 'PM-200', '220V', '/images/shop/ET1003.jpg', '23P00003', 'PM200主机-标准版', 'PM200 Host-Standard', 'BJT', '80x50x55cm', '31.5x19.7x21.7in', '85x55x60cm', '33.5x21.7x23.6in', 42.0, 92.59, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (10, 2, 'PM-200', '110V', '/images/shop/LA-E5P.jpg', '23P00004', 'PM200主机-美标版', 'PM200 Host-US Version', 'BJT', '80x50x55cm', '31.5x19.7x21.7in', '85x55x60cm', '33.5x21.7x23.6in', 42.0, 92.59, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (11, 3, 'TM-200', '220V', '/images/shop/FR8003.jpg', '33T00001', 'TM200主机-标准版', 'TM200 Host-Standard', 'BJT', '60x40x30cm', '23.6x15.7x11.8in', '65x45x35cm', '25.6x17.7x13.8in', 18.2, 40.12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (12, 3, 'TM-200', '110V', '/images/shop/EC2005.jpg', '33T00002', 'TM200主机-美标版', 'TM200 Host-US Version', 'BJT', '60x40x30cm', '23.6x15.7x11.8in', '65x45x35cm', '25.6x17.7x13.8in', 18.2, 40.12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (13, 4, 'ACB-100', '220V', '/images/shop/MPV.jpg', '43B00001', 'ACB100主机-标准版', 'ACB100 Host-Standard', 'BJT', '40x20x15cm', '15.7x7.9x5.9in', '45x25x20cm', '17.7x9.8x7.9in', 8.5, 18.74, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (14, 4, 'ACB-100', '110V', '/images/shop/LA-E4S.jpg', '43B00002', 'ACB100主机-美标版', 'ACB100 Host-US Version', 'BJT', '40x20x15cm', '15.7x7.9x5.9in', '45x25x20cm', '17.7x9.8x7.9in', 8.5, 18.74, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs');

-- 4. 配件料号（wp_bjt_accessories）
INSERT INTO `wp_bjt_accessories` (
  `id`, `product_line_id`, `model`, `brand`, `part_number`, `name_zh`, `name_en`, 
  `spec`, `spec_imperial`, `voltage`, `frequency`, 
  `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, 
  `gross_weight_kg`, `gross_weight_lbs`, `pcs_per_box`, 
  `pallet_size_cm`, `pallet_size_inch`, `pcs_per_pallet`, 
  `pallet_height_cm`, `pallet_height_inch`, `pallet_gross_weight_kg`, `pallet_gross_weight_lbs`, 
  `image_url`, `status`, `created_at`, `updated_at`, `unit`
) VALUES 
  (1, 1, 'E4S-FAN', 'BJT', 'A10001', 'E4S风扇组件', 'E4S Fan Assembly', 
   '12x8x6cm', '4.7x3.1x2.4in', '220V', '50Hz', 
   '15x10x8cm', '5.9x3.9x3.1in', 0.35, 0.77, 
   0.45, 0.99, 20, 
   '120x100x110cm', '47.2x39.4x43.3in', 500, 
   110, 43.3, 240, 529.2, 
   '/images/shop/LA-E4S.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (2, 1, 'E4S-FAN', 'BJT', 'A10002', 'E4S风扇组件-美规', 'E4S Fan Assembly-US', 
   '12x8x6cm', '4.7x3.1x2.4in', '110V', '60Hz', 
   '15x10x8cm', '5.9x3.9x3.1in', 0.35, 0.77, 
   0.45, 0.99, 20, 
   '120x100x110cm', '47.2x39.4x43.3in', 500, 
   110, 43.3, 240, 529.2, 
   '/images/shop/LA-E5P.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (3, 1, 'E4S-CTRL', 'BJT', 'A20001', 'E4S控制板组件', 'E4S Controller Assembly', 
   '10x8x3cm', '3.9x3.1x1.2in', '220V', '50Hz', 
   '12x10x5cm', '4.7x3.9x2.0in', 0.25, 0.55, 
   0.30, 0.66, 30, 
   '120x100x110cm', '47.2x39.4x43.3in', 800, 
   110, 43.3, 260, 573.2, 
   '/images/shop/LA-E5P.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (4, 1, 'E4S-HEATER', 'BJT', 'A30001', 'E4S加热器组件', 'E4S Heater Assembly', 
   '15x10x8cm', '5.9x3.9x3.1in', '220V', '50Hz', 
   '18x12x10cm', '7.1x4.7x3.9in', 0.45, 0.99, 
   0.55, 1.21, 15, 
   '120x100x110cm', '47.2x39.4x43.3in', 400, 
   110, 43.3, 235, 518.1, 
   '/images/shop/LA-E4C.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (5, 1, 'E4S-FAN-CHILD', 'BJT', 'A40001', 'E4S风扇子件组件', 'E4S Fan Child Assembly', 
   '8x6x3cm', '3.1x2.4x1.2in', '220V', '50Hz', 
   '10x8x5cm', '3.9x3.1x2.0in', 0.15, 0.33, 
   0.20, 0.44, 50, 
   '120x100x110cm', '47.2x39.4x43.3in', 1000, 
   110, 43.3, 220, 485.0, 
   '/images/shop/MPV.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (6, 2, 'PM100-CUTTER', 'BJT', 'B10001', 'PM100切刀组件', 'PM100 Cutter Assembly', 
   '20x5x2cm', '7.9x2.0x0.8in', '220V', '50Hz', 
   '22x8x4cm', '8.7x3.1x1.6in', 0.55, 1.21, 
   0.65, 1.43, 20, 
   '120x100x110cm', '47.2x39.4x43.3in', 500, 
   110, 43.3, 345, 760.6, 
   '/images/shop/ET2002.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (7, 2, 'PM100-ROLLER', 'BJT', 'B20001', 'PM100滚轮组件', 'PM100 Roller Assembly', 
   '10x4x4cm', '3.9x1.6x1.6in', '220V', '50Hz', 
   '12x6x6cm', '4.7x2.4x2.4in', 0.40, 0.88, 
   0.50, 1.10, 30, 
   '120x100x110cm', '47.2x39.4x43.3in', 700, 
   110, 43.3, 375, 826.7, 
   '/images/shop/ET1003.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (8, 3, 'TM200-BLADE', 'BJT', 'C10001', 'TM200刀片组件', 'TM200 Blade Assembly', 
   '5x2x0.5cm', '2.0x0.8x0.2in', '220V', '50Hz', 
   '8x4x2cm', '3.1x1.6x0.8in', 0.05, 0.11, 
   0.10, 0.22, 100, 
   '120x100x110cm', '47.2x39.4x43.3in', 2000, 
   110, 43.3, 220, 485.0, 
   '/images/shop/FR8003.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (9, 3, 'TM200-SPRING', 'BJT', 'C20001', 'TM200弹簧组件', 'TM200 Spring Assembly', 
   '3x1x1cm', '1.2x0.4x0.4in', '220V', '50Hz', 
   '5x3x3cm', '2.0x1.2x1.2in', 0.03, 0.07, 
   0.06, 0.13, 200, 
   '120x100x110cm', '47.2x39.4x43.3in', 4000, 
   110, 43.3, 270, 595.2, 
   '/images/shop/EC2005.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (10, 4, 'ACB100-VALVE', 'BJT', 'D10001', 'ACB100气阀组件', 'ACB100 Valve Assembly', 
   '6x3x3cm', '2.4x1.2x1.2in', '220V', '50Hz', 
   '8x5x5cm', '3.1x2.0x2.0in', 0.10, 0.22, 
   0.15, 0.33, 60, 
   '120x100x110cm', '47.2x39.4x43.3in', 1200, 
   110, 43.3, 200, 440.9, 
   '/images/shop/MPV.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (11, 1, 'E4S-SENSOR', 'BJT', 'A50001', 'E4S温度传感器', 'E4S Temperature Sensor', 
   '5x3x2cm', '2.0x1.2x0.8in', '220V', '50Hz', 
   '7x5x4cm', '2.8x2.0x1.6in', 0.08, 0.18, 
   0.12, 0.26, 100, 
   '120x100x110cm', '47.2x39.4x43.3in', 2000, 
   110, 43.3, 260, 573.2, 
   '/images/shop/LA-E4S.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (12, 1, 'E4S-CASE', 'BJT', 'A60001', 'E4S外壳组件', 'E4S Case Assembly', 
   '30x20x15cm', '11.8x7.9x5.9in', '220V', '50Hz', 
   '35x25x20cm', '13.8x9.8x7.9in', 1.20, 2.65, 
   1.50, 3.31, 5, 
   '120x100x110cm', '47.2x39.4x43.3in', 100, 
   110, 43.3, 170, 374.8, 
   '/images/shop/LA-E5P.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (13, 2, 'PM100-MOTOR', 'BJT', 'B30001', 'PM100电机组件', 'PM100 Motor Assembly', 
   '15x12x10cm', '5.9x4.7x3.9in', '220V', '50Hz', 
   '18x15x12cm', '7.1x5.9x4.7in', 0.85, 1.87, 
   1.00, 2.20, 10, 
   '120x100x110cm', '47.2x39.4x43.3in', 200, 
   110, 43.3, 220, 485.0, 
   '/images/shop/ET2002.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (14, 3, 'TM200-MOTOR', 'BJT', 'C30001', 'TM200电机组件', 'TM200 Motor Assembly', 
   '12x10x8cm', '4.7x3.9x3.1in', '220V', '50Hz', 
   '15x12x10cm', '5.9x4.7x3.9in', 0.65, 1.43, 
   0.80, 1.76, 12, 
   '120x100x110cm', '47.2x39.4x43.3in', 240, 
   110, 43.3, 208, 458.6, 
   '/images/shop/FR8003.jpg', 'publish', NOW(), NOW(), 'pcs'),
   
  (15, 4, 'ACB100-SEAL', 'BJT', 'D20001', 'ACB100密封件', 'ACB100 Seal Assembly', 
   '4x4x1cm', '1.6x1.6x0.4in', '220V', '50Hz', 
   '6x6x3cm', '2.4x2.4x1.2in', 0.04, 0.09, 
   0.08, 0.18, 150, 
   '120x100x110cm', '47.2x39.4x43.3in', 3000, 
   110, 43.3, 265, 584.2, 
   '/images/shop/MPV.jpg', 'publish', NOW(), NOW(), 'pcs');

-- 5. 耗材（wp_bjt_consumables）
INSERT INTO `wp_bjt_consumables` (
  `id`, `product_line_id`, `model`, `model_imperial`, `part_number`, `spec`, `spec_imperial`, `brand`, `app_model`, `bag_type`, `material`, `thickness_met`, `thickness_imp`, `width_met`, `width_imp`, `length_met`, `length_imp`, `bubble_diameter_met`, `bubble_diameter_imp`, `total_length_met`, `total_length_imp`, `package_type`, `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, `gross_weight_kg`, `gross_weight_lbs`, `pcs_per_box`, `image_url`, `package_image_url`, `status`, `unit`, `created_at`, `updated_at`)
VALUES
  (1, 1, 'ACF-200', 'ACF-200', '15F00001', '20um x 20cm x 200cm', '0.79mil x 7.9in x 78.7in', 'BJT', 'LA-E4S,LA-E5P', 'pillow', 'HDPE', 20.0, 0.79, 20.0, 7.9, 200.0, 78.7, 1.0, 0.4, 200.0, 656.2, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/MFB25.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (2, 1, 'ACF-300', 'ACF-300', '15F00002', '30um x 30cm x 150cm', '1.18mil x 11.8in x 59.1in', 'BJT', 'LA-E5P,LA-E6L', 'bubble', 'LDPE', 30.0, 1.18, 30.0, 11.8, 150.0, 59.1, 2.0, 0.8, 150.0, 492.1, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/MEX.JPG', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (3, 1, 'ACF-400', 'ACF-400', '15F00003', '40um x 40cm x 100cm', '1.57mil x 15.7in x 39.4in', 'BJT', 'LA-E6L,LA-E7X', 'tube', 'Nylon', 40.0, 1.57, 40.0, 15.7, 100.0, 39.4, 3.0, 1.2, 100.0, 328.1, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/MFC.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (4, 2, 'PPR-100', 'PPR-100', '25P00001', '120gsm x 10cm x 500cm', '4.7oz/yd² x 3.9in x 196.9in', 'BJT', 'PM-100', 'pillow', 'PAPER+PE', 120.0, 4.7, 10.0, 3.9, 500.0, 196.9, NULL, NULL, 500.0, 1640.4, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/MFA.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (5, 2, 'PPR-200', 'PPR-200', '25P00002', '150gsm x 20cm x 400cm', '5.9oz/yd² x 7.9in x 157.5in', 'BJT', 'PM-200', 'bubble', 'HDPE', 150.0, 5.9, 20.0, 7.9, 400.0, 157.5, NULL, NULL, 400.0, 1312.3, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/HDPE.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (6, 2, 'PPR-300', 'PPR-300', '25P00003', '180gsm x 30cm x 300cm', '7.1oz/yd² x 11.8in x 118.1in', 'BJT', 'PM-300', 'tube', 'LDPE', 180.0, 7.1, 30.0, 11.8, 300.0, 118.1, NULL, NULL, 300.0, 984.3, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/LDPE.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (7, 3, 'TPE-100', 'TPE-100', '35T00001', '45um x 4.8cm x 60cm', '1.8mil x 1.9in x 23.6in', 'BJT', 'TM-200', 'pillow', 'HDPE', 45.0, 1.8, 4.8, 1.9, 60.0, 23.6, NULL, NULL, 60.0, 196.9, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/HDPE.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (8, 3, 'TPE-200', 'TPE-200', '35T00002', '50um x 6.0cm x 80cm', '2.0mil x 2.4in x 31.5in', 'BJT', 'TM-300', 'bubble', 'LDPE', 50.0, 2.0, 6.0, 2.4, 80.0, 31.5, NULL, NULL, 80.0, 262.5, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/LDPE.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (9, 3, 'TPE-300', 'TPE-300', '35T00003', '55um x 7.2cm x 100cm', '2.2mil x 2.8in x 39.4in', 'BJT', 'TM-400', 'tube', 'Nylon', 55.0, 2.2, 7.2, 2.8, 100.0, 39.4, NULL, NULL, 100.0, 328.1, 'Roll', '40x40x50', '15.7x15.7x19.7', 10.0, 22.05, 10.5, 23.15, 1, '/images/shop/MPR.jpg', '/images/shop/MFA.jpg', 'publish', 'roll', NOW(), NOW()),
  (10, 4, 'ACB-100', 'ACB-100', '45B00001', '60um x 15cm x 20cm', '2.4mil x 5.9in x 7.9in', 'BJT', 'ACB-100', 'pillow', 'HDPE', 60.0, 2.4, 15.0, 5.9, 20.0, 7.9, NULL, NULL, NULL, NULL, 'Piece', '20x15x10', '7.9x5.9x3.9', 2.0, 4.41, 2.2, 4.85, 10, '/images/shop/MPV.jpg', '/images/shop/MFA.jpg', 'publish', 'pcs', NOW(), NOW()),
  (11, 4, 'ACB-200', 'ACB-200', '45B00002', '70um x 25cm x 30cm', '2.8mil x 9.8in x 11.8in', 'BJT', 'ACB-200', 'bubble', 'LDPE', 70.0, 2.8, 25.0, 9.8, 30.0, 11.8, NULL, NULL, NULL, NULL, 'Piece', '25x20x15', '9.8x7.9x5.9', 2.5, 5.51, 2.7, 5.95, 10, '/images/shop/LA-E4S.jpg', '/images/shop/MFA.jpg', 'publish', 'pcs', NOW(), NOW()),
  (12, 4, 'ACB-300', 'ACB-300', '45B00003', '80um x 35cm x 40cm', '3.1mil x 13.8in x 15.7in', 'BJT', 'ACB-300', 'tube', 'Nylon', 80.0, 3.1, 35.0, 13.8, 40.0, 15.7, NULL, NULL, NULL, NULL, 'Piece', '35x30x20', '13.8x11.8x7.9', 3.0, 6.61, 3.3, 7.28, 10, '/images/shop/LA-E5P.jpg', '/images/shop/MFA.jpg', 'publish', 'pcs', NOW(), NOW());

-- 6. 备件（wp_bjt_spare_parts）
INSERT INTO `wp_bjt_spare_parts` (
  `id`, `product_line_id`, `app_model`, `model`, `is_consumable`, `image_url`, `part_number`, `name_zh`, `name_en`, `spec`, `spec_imperial`, `app_sn`, `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, `gross_weight_kg`, `gross_weight_lbs`, `pcs_per_box`, `required_parts`, `required_quantity`, `status`, `created_at`, `updated_at`, `unit`
) VALUES
  (1, 1, 'LA-E4S', 'SPR-100', 0, '/images/shop/MPV.jpg', '16P00001', 'E4S气泵皮膜', 'E4S Pump Membrane', '8x8x0.2cm', '3.1x3.1x0.08in', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (2, 1, 'LA-E4S,LA-E5P', 'SPR-200', 0, '/images/shop/LA-F2.jpg', '16P00002', 'E4S加热丝', 'E4S Heating Wire', '15cm长', '5.9in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (3, 1, 'LA-E5P', 'SPR-100', 0, '/images/shop/MPV.jpg', '16P00003', 'E5P气泵皮膜', 'E5P Pump Membrane', '10x10x0.3cm', '3.9x3.9x0.12in', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (4, 1, 'LA-E5P', 'SPR-200', 0, '/images/shop/LA-F2.jpg', '16P00004', 'E5P加热丝', 'E5P Heating Wire', '20cm长', '7.9in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (5, 2, 'PM-100', 'SPR-300', 0, '/images/shop/ET2002.jpg', '26P00001', 'PM100切纸刀片', 'PM100 Cutting Blade', '30cm长', '11.8in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (6, 2, 'PM-200', 'SPR-300', 0, '/images/shop/ET1003.jpg', '26P00002', 'PM200切纸刀片', 'PM200 Cutting Blade', '35cm长', '13.8in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (7, 3, 'TM-200', 'SPR-400', 0, '/images/shop/FR8003.jpg', '36P00001', 'TM200切刀', 'TM200 Cutter', '8cm长', '3.1in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (8, 3, 'TM-300', 'SPR-400', 0, '/images/shop/EC2005.jpg', '36P00002', 'TM300切刀', 'TM300 Cutter', '10cm长', '3.9in length', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (9, 4, 'ACB-100', 'SPR-100', 0, '/images/shop/MPV.jpg', '46B00001', 'ACB100气阀皮膜', 'ACB100 Valve Membrane', '5x5x0.2cm', '2.0x2.0x0.08in', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs'),
  (10, 4, 'ACB-200', 'SPR-100', 0, '/images/shop/LA-E4S.jpg', '46B00002', 'ACB200气阀皮膜', 'ACB200 Valve Membrane', '6x6x0.2cm', '2.4x2.4x0.08in', 'All', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'publish', NOW(), NOW(), 'pcs');

-- 7. 备件型号（wp_bjt_spare_part_models）
INSERT INTO `wp_bjt_spare_part_models` (
  `id`, `product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `sort_order`, `created_at`, `updated_at`
) VALUES
  (1, 1, 'SPR-300', 'E4S必选备件', 'E4S Required Spare Part', '10x10x0.3cm', '3.9x3.9x0.12in', NULL, NULL, NULL, NULL, 'publish', 10, NOW(), NOW()),
  (2, 2, 'SPR-400', 'PM100必选备件', 'PM100 Required Spare Part', '30cm长', '11.8in length', NULL, NULL, NULL, NULL, 'publish', 20, NOW(), NOW()),
  (3, 3, 'SPR-500', 'TM200必选备件', 'TM200 Required Spare Part', '8cm长', '3.1in length', NULL, NULL, NULL, NULL, 'publish', 30, NOW(), NOW()),
  (4, 4, 'SPR-600', 'ACB100必选备件', 'ACB100 Required Spare Part', '5x5x0.2cm', '2.0x2.0x0.08in', NULL, NULL, NULL, NULL, 'publish', 40, NOW(), NOW()); 